---
date: May 20, 2018
---

# You Don't Need REST

Nearly 10 years ago, [Leonard Richardson][] and [Sam Ruby][] published 
[RESTful Web Services][]. I remember eagerly waiting for that book before it 
came out. Today, REST is still regarded as the state-of-the-art API architecture.
It's not hard to see its benefit in comparison to preceding RPC solutions of
that time. RESTful APIs _make sense_, because of the obvious HTTP verb mapping
to CRUD methods, and the ease at which individual resources may be addressed and
cached in HTTP middleware.

[]: https://www.crummy.com/writing/
[]: http://intertwingly.net/blog/
[]: http://shop.oreilly.com/product/9780596529260.do

When you're implementing client software to talk to RESTful APIs though,
naturally the HTTP gets abstracted: `GET /resource/id` becomes `resource.get(id)`
and `POST /resource` becomes `resource.create()`. The vast majority of
applications I touched in the past two years weren't so data intensive to
warrant even thinking about HTTP caching strategies. And if there were one or
two endpoints that did require caching, a localized implementation worked best.

So having RESTfulness as a design constraint, in this case, is just 
**unnecessary complexity**. In order to streamline our client's calls
to our core RESTful API at [STORED e-commerce][], we created a gateway that
maps certain URLs to method calls, and let the code inside those methods peform
the actual RESTful requests to our core API. First we added it directly to our
[Nuxt][] stack as a Koa middleware:

[]: http://stored.com.br
[]: https://nuxtjs.org/

```js
app.use(async (ctx, next) => {
  if (!ctx.path.startsWith('/api') || ctx.request.method !== 'POST') {
    await next()
  } else {
    const apiMethod = ctx.path.split('/api/')[1]
    let [resource, method] = apiMethod.split('/')
    method = translatePath(method)
    const request = { payload: ctx.json.payload }
    const response = await api[resource][ethod](request)
    ...
  }
```

`translatePath()` translates `/resource/method` to `resource.method()` on the
server. Our actual code does quite a bit more, such as checking and refreshing 
auth tokens on-the-fly, but you get the idea.

The takeaway here is that if you're writing a RPC-like proxy to 
perform RESTful API calls that do not require any caching, you might as well 
remove the extra call and place all your code in that RPC method and basically 
have a [JSON-pure API][].

[]: https://mmikowski.github.io/json-pure/

**David Gilbertson**, **Michael S. Mikowski** and **Thomas Jetzinger** [have][]
[written][] [similar][] pieces about REST's unnecessary complexity.

[]: https://hackernoon.com/o-api-an-alternative-to-rest-apis-e9a2ed53b93c
[]: https://www.linkedin.com/pulse/using-json-pure-api-instead-restful-approach-thomas-jetzinger/
[]: https://mmikowski.github.io/the_lie/

## An API gateway in Go

Our Koa-based API proxy gets the job done, but looking forward we wanted to turn
this into a fast and reliable piece of our toolset. At [STORED e-commerce][] we
already do a lot of Python, with our core RESTful API written entirely in it.
But we have had an infatuation with Go that's been growing over the years, 
and decided to give it a try.

[]: http://stored.com.br

For references we looked at many HTTP client implementations in Go but 
eventually settled on [go-github][], written by Google developers. go-github 
offers an excellent starting point with carefully crafted yet minimal `net/http`
package abstractions. 

Each set of methods associated with a resource is kept in
a separate file (such as [activity.go][]), with all key interfaces and methods
defined in the main [github.go][] file.

[]: https://github.com/google/go-github
[]: https://github.com/google/go-github/blob/master/github/activity.go
[]: https://github.com/google/go-github/blob/master/github/github.go

The problem is that we need to infer what resource and method are being called 
from the request URI. Not a trivial task in Go. I started with the main request
handler, using gorilla's [mux][] as my routing library, and parsing the 
necessary parts to make the method call:

[]: https://github.com/gorilla/mux

```go
func APIGateway(w http.ResponseWriter, request *http.Request) {
  body, err := ioutil.ReadAll(request.Body)
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
  }
  apiCall := new(APICall)
  if err := json.Unmarshal(body, &apiCall.Payload); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
  }
  methodParts := strings.Split(mux.Vars(request)["method"], "/")
  resource := strings.Title(methodParts[0])
  method := translatePath(methodParts[1])
  apiClient := NewClient()
  data, _, err := apiClient.CallMethodByName(
    resource,
    method,
    apiCall.Payload
  )
  parsedData, err := json.Marshal(&data) 
  if err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
  }
  w.Header().Set("Content-Type", "application/json")
  log.Println(string(parsedData))
  io.WriteString(w, string(parsedData))
}

func main() {
  router := mux.NewRouter().StrictSlash(true)
  router.HandleFunc("/api/{method:.*}", APIGateway)
  log.Println("Running API gateway at port 4000")
  log.Fatal(http.ListenAndServe(":4000", router))
}
```

Several helper functions and type definitions have been omitted for brevity. 
The most challenging part is of course `CallMethodByName()`. This did take a 
lengthy research but thanks to [this StackOverflow thread][] and subsequent 
reading of [The Laws of Reflection][], I was able to put it together below. 
The cool thing about Go's [reflect package][] is that it can give access to 
nearly everything in the language, making it as malleable as JavaScript if 
you manage to wrap your head around it.

[]: https://stackoverflow.com/questions/14116840/dynamically-call-method-on-interface-regardless-of-receiver-type?rq=1
[]: https://blog.golang.org/laws-of-reflection
[]: https://golang.org/pkg/reflect/

```go
func (c *Client) CallMethodByName(
  resource string,
  method string,
  payload json.RawMessage,
) (
  *json.RawMessage,
  *Response,
  error,
) {
  resourceObj, err := resourceByName(c, resource)
  if err != nil {
    log.Fatal(err)
  }
  methodFunc, err := methodByName(resourceObj, method)
  if err != nil {
    log.Fatal(err)
  }
  in := []reflect.Value{
    reflect.ValueOf(context.Background()),
    reflect.ValueOf(payload),
  }
  results := methodFunc.Call(in)
  data := results[0].Interface().(*json.RawMessage)
  response := results[1].Interface().(*Response)
  return data, response, nil
}
```

As you can see, values are passed to the final method in the form of a 
`reflect.Value` slice. Return values are then cast back to their expected 
types before returning. Our code is still evolving, and there are of course 
several potential errors that need to be addressed, but it now successfully 
translates `resource/get-something` to `Resource.GetSomething()` and all you 
have to do is add the service definitions and methods you'll use.

A working boilerplate is available at [github.com/stored/pathway][]. 

[]: http://github.com/stored/pathway
