---
date: April 13, 2016
---

# A Million Schema Validations

I was tasked with the job of running a schema validation test on roughly a 
million API requests. The API I was testing was already live and actively used 
by thousands of customers which employed nearly all of its capacities. I had
access to 20+ log files ranging between 200MB to 300MB each, compressed.

## Harvesting logs to infer common signatures

My first attempts at parsing them made it clear they needed some serious
sanitization. After experimenting with a variety of URL sanitization
approaches, I set out to find a concise way to describe the endpoints I
needed to test, and use such descriptions to parse valid API call signatures
from the logs. Using an hypothetical API to list foods as an example, this is 
what it came to look like:

```
fruits
  /api/fruits
  apikey! sort items page
  /api/fruits/<search>
  apikey! sort items page

vegetables
  /api/vegetables
  apikey! sort items page
  /api/vegetables/<search>
  apikey! sort items page
```

This is of course only illustrative as the actual API had dozens endpoints and 
potential parameter combinations that needed to be tested. I suggestively named 
this file `ENDPOINTS` and placed it at the root of my test suite. I used 
two-space indentation for structuring each endpoint description. The first line 
specifies the filename where sanitized URLs will be collected. The second line 
specifies the URI and URI parameters and the third line, query string parameters.
If a parameter is required, it's suffixed with an exclamation mark. With this 
simple specification file, I then used [werkzeug's routing module][] to parse
[]: http://werkzeug.pocoo.org/docs/0.11/routing/

```py
import re
from werkzeug.routing import Map, Rule

def endpoints(host):
    map = Map()
    current_endpoint = None
    with open('ENDPOINTS') as endpoints:
        for line in endpoints:
            line = line.rstrip()
            if re.search('^[^\s]+', line):
                endpoint_group = line.strip()
                index = 1
            elif re.search('^\s+/', line):
                current_endpoint = Rule(
                    line.strip(), 
                    endpoint = '%s-%s' % (endpoint_group, index)
                )
                index += 1
            elif re.search('^\s+', line):
                current_endpoint.params = re.split('\s+', line)
                map.add(current_endpoint)
    return map.bind(host)
```

Parsing of URI parameters is already handled by werkzeug, and since they're 
part of the endpoint itself they're implicitly required. I store query string 
parameters for verification later as `params` in each `Rule` object (a custom 
addition). Moving on to the actual log parser, my main goals were: a) discarding
malformed calls and removing junk from otherwise valid requests (sanitization)
and b) avoiding repetitive API calls in the test suite.

The parsing relies heavily on [`MapAdapter`][], which raises HTTP error 
exceptions and returns parsed URI parameters. Using the previously stored 
`params` list from each `Rule` object, I then ensure required parameters are
present and remove all invaliad parameters (missing from each definition in 
`ENDPOINTS`) at the end. Also worth noting [`tqdm`][] provides a progress bar 
while reading the files.

[]: http://werkzeug.pocoo.org/docs/0.11/routing/#werkzeug.routing.MapAdapter
[]: https://github.com/tqdm/tqdm

```py
with open(logfile, 'rb') as logfile_handler:
    size = os.path.getsize(logfile)
    with tqdm(total=size) as pbar:
        newpos = None
        oldpos = logfile_handler.tell()
        for line in gzip.GzipFile(fileobj=logfile_handler):
            newpos = logfile_handler.tell() 
            if newpos != oldpos:
                pbar.update(newpos if oldpos == 0 else newpos-oldpos)
                oldpos = newpos
            request_data = re.findall('"([A-Z]+)\s+(.*?)\s+HTTP/1.1', line)
            if len(request_data):
                uri = request_data[0][1]
                try:
                    parsed_uri = urlparse.urlparse(uri)
                    rule, args = endpoints.match(parsed_uri.path, return_rule=True)
                except NotFound, RequestRedirect:
                    continue
                if random() > 0.0009:
                    continue
                parsed_query = cgi.parse_qs(parsed_uri.query)
                if getattr(rule, 'params', False):
                    required_params = [
                        param[:-1] 
                        for param in rule.params 
                        if param.endswith('!')
                    ]
                    optional_params = [
                      param 
                      for param in rule.params 
                      if not param.endswith('!')
                    ]
                else:
                    required_params, optional_params = [], []
                all_parameters = set(required_params+optional_params)
                for param in set(parsed_query.keys()).difference(all_parameters):
                    del parsed_query[param]
```

Since each file had millions of lines, in order to generate a manageably sized
data set I gradually lowered the exclusion rate until it got to about 200
results from each file. But there were still a lot of duplicates. I figured I
didn't need to test the same API call signature (combination of parameters used)
more than a few times. So I used Python's [native hash function][] to generate
a unique signature built from the `Rule` definition and a hash of all parameters
passed to each call. Picking up from the previous snippet:

[]: https://docs.python.org/2/library/functions.html#hash

```py
                keyset = frozenset(parsed_query.keys())
                signature = '%s%s' % (rule.rule, hash(keyset))
                if signatures.get(signature):
                    if len(keyset) == 0 and signatures[signature] > 0:
                        continue
                    if signatures[signature] > 5:
                        continue
                    signatures[signature] += 1
                else:
                    signatures[signature] = 1
```

If the parser sees an API call and the number of times it's been collected
doesn't exceed the limit, it's then reassembled with the sanitized parameters
and written to disk under a directory named after the log file, and the filename
spcified in the `ENDPOINTS` file.

```py
                cleaned_query = {
                    key: parsed_query[key][0] 
                    for key in parsed_query.keys()
                }
                sample_filename = os.path.join(samplesdir, '%s.sample' % rule.endpoint)
                cleaned_uri = '%s?%s' % (
                    parsed_uri.path, 
                    urllib.urlencode(cleaned_query)
                )
                with open(sample_filename, 'a+') as sample:
                    sample.write('%s\n' % cleaned_uri)
```

To run multiple instances of it in parallel I just used [`screen`][]. Starting
too many instances at once seemed to cause a few processes to crash (this was a
virtualised development server), so I divided it in batches (in `${A[@]:x:y}`,
`x` is the starting index and `y` is the number of items to slice):

[]: https://www.gnu.org/software/screen/

```sh
logfiles=(~/logs/*.gz)
for file in ${logfiles[@]:0:5}; do
    screen -dmS $(basename $file) fab harvest:$file
done
```

Running screen with `-dMS` sets a custom title for each session (in this case,
the log filename) and detaches it from the terminal before running. To monitor
I would attach any of the running sessions (e.g., `screen -r 24124`), which
would show me the progress bar and an exit message if done:

```
100%|█████████████████████████| 309156334/309156334 [48:12<00:00, 106864.79it/s]
Press any key to exit.
```

The next and final step was to _map and reduce_ the results. First, concatenate
results from all directories into `mapped/`, then `sort -u` all of them into 
`reduced/`. Doesn't make this step of the process scalable, but definitely good
enough for harvesting a couple dozen log files.

```sh
mkdir -p mapped reduced
cat */fruits.sample > mapped/fruits.sample
cat */vegetables.sample > mapped/vegetables.sample
sort -u mapped/fruits.sample > reduced/fruits.sample
sort -u mapped/vegetables.sample > reduced/vegetables.sample
```

## Saving responses from Load Test

[Mark Nottingham][] has a [seminal starting point][] on the subject, bringing
attention to the necessity of verifying the test server's bandwidth and making
sure you don't get too close to the limit, among many other sensible
recommendations. Mark's post led me to [autobench][] and many others tools,
such as [siege][], [loads][], [funkload][], [blitz][] (SaaS), [gatling][] 
and [tsung][]. None of them came close to the elegance and simplicity of 
[Locust][] though, which aside from being written in modern Python, has a 
clear, concise API and built-in support for running a [distributed cluster][].

[]: https://www.mnot.net/
[]: https://www.mnot.net/blog/2011/05/18/http_benchmark_rules
[]: http://www.xenoclast.org/autobench/
[]: https://www.joedog.org/siege-home/
[]: https://github.com/loads
[]: http://funkload.nuxeo.org/
[]: http://blitz.io/
[]: http://gatling-tool.org/
[]: http://tsung.erlang-projects.org/user_manual/index.html
[]: http://locust.io/
[]: http://docs.locust.io/en/latest/running-locust-distributed.html

To use it you need to [write a locustfile][], which is just a Python file with
at least one [Locust subclass][]. Each Locust object specifies a list of tasks
to be performed during the test, represented by a [`TaskSet`][] class.

[]: http://docs.locust.io/en/latest/writing-a-locustfile.html
[]: http://docs.locust.io/en/latest/api.html#locust-class
[]: http://docs.locust.io/en/latest/api.html#taskset-class

Although you can use `TaskSet` objects to build a test suite, I believe it falls
short in comparison to the [myriad of benefits of pytest][]. I chose to let 
Locust only do the load test and save responses from the API, for further
consumption by a pytest suite subsequently. The file system would have been
fine but since I intended to run Locust distributedly, I used Redis as
storage for the responses. `TaskSet` methods are dynamically generated from
the reduced list of URIs.

[]: http://pytest.org/latest/

```py
import os
import redis
import glob
import functools
from locust import HttpLocust, TaskSet

BASE = os.path.abspath(os.path.dirname(__file__))

def _save_response(uri, tset):
    response = tset.client.get(uri)
    tset.redis.hset('responses', uri, response.content)

class ResponseSaver(TaskSet):
    def __init__(self, parent):
        super(ResponseSaver, self).__init__(parent)
        self.tasks = list(self.gen_tasks())
        self.redis = redis.Redis()
    def gen_tasks(self):
        samples = glob.glob('%s/samples/reduced/*.sample' % BASE)
        for sample in samples:
            with open(sample) as handler:
                for line in handler:
                    yield functools.partial(_save_response, line.strip())

class APIUser(HttpLocust):
  task_set = ResponseSaver
  host = "http://api.host"
```

Locust is currently based on gevent, but I wouldn't be surprised if they upgrade
it to [aiohttp][] which [makes use][] of [PEP 3156][] and [PEP 492][].

[]: http://aiohttp.readthedocs.org/en/stable/
[]: http://pawelmhm.github.io/asyncio/python/aiohttp/2016/04/22/asyncio-aiohttp.html
[]: https://www.python.org/dev/peps/pep-3156/
[]: https://www.python.org/dev/peps/pep-0492/#await-expression

## Running test suite against responses

Now that we got past load testing and got our [pretty graphs][] from Locust, we
can proceed to writing some actual unit tests. The primary goal was to test data
integrity, i.e., validate schemas of all JSON responses. That's where 
[marshmallow][] comes in. It's a ORM/ODM/framework-agnostic library that allows
you to cleanly define a schema and validate a JSON document against it. It's
better than manually validating each response, but I still found it too verbose
to maintain. I wanted something simple and concise as the `ENDPOINTS` file. So
I came up with another small DSL, a thin layer on top of marshmallow:

[]: https://truveris.github.io/articles/locust/
[]: https://marshmallow.readthedocs.org/en/latest/

```
success:bool data:{name:str link:url vitamins,minerals:str[]}
 /api/fruits
 /api/fruits/<search>
 /api/vegetables
 /api/vegetables/<search>
```

 I called this `SCHEMAS`. By now it's clear I have a knack for DSLs. The syntax 
 is fairly straightforward: `field:type`, where `field` can be a comma-separated
 list, and `type` can be followed by `[]` to indicate an array and `?` to 
 indicate it's optional (since optional parameters were more common in 
 `ENDPOINTS`, it used `!` instead, to indicate which fields were required). To 
 specify a nested schema within each response (for instance, an array of objects
 under `data`), you can enclose its fields with `{}` where a single `type` would
 normally be defined.

 Like in `ENDPOINTS`, single space indentation for listing endpoints to validate
 schemas against. To match URIs, again I used `werkzeug.routing`.

 Following next is `validation.py`, where `schemas()` is responsible for parsing
 the `SCHEMAS` file and returning a validation function that will know what
 schema to use according to the URL it gets. The validation function takes 
 `uri` and `response` as parameters, both strings.
 
```py
def schemas(host='api.host'):
    map = Map()
    with open('%s/SCHEMAS' % BASE) as schemas:
        for line in schemas:
            line = line.rstrip()
            if re.search('^[^\s]+', line):
                schema = _gen_schema(line)
            elif re.search('^\s+', line):
                endpoint = re.sub('\W+', '-', line)
                rule = Rule(line.strip(), endpoint=endpoint)
                rule.schema = schema
                map.add(rule)
    _validate.matcher = map.bind(host)
    return _validate

def _validate(uri, response):
    try:
        rule, args = _validate.matcher.match(uri, return_rule=True)
        data, errors = rule.schema().loads(response)
        return errors
    except NotFound, RequestRedirect:
        return None

def _gen_schema(spec):
    fields = []
    for nested in re.findall('([\w,]+):{(.+)}(\??)', spec.strip()):
        for field in nested[0].split(','):
            fields.append([field, _gen_schema._handle_nested(nested[1]), not len(nested[2])])
        {% raw %}spec = spec.replace('%s:{%s}' % nested[:2], ''){% endraw %}
        spec = spec.replace('  ', ' ')
    fields += _gen_schema._handle_nested(spec)
    for index, value in enumerate(fields):
        if type(value[1]) is list:
            nested = _gen_schema._make_schema(dict(value[1]))
            fields[index] = [value[0], Nested(nested, required=not value[2], many=True)]
    return _gen_schema._make_schema(fields)

def _make_schema(fields):
    if type(fields) is list:
        fields = dict(fields)
    ts = str(time.time()).replace('.', '')
    return type('schema_%s' % ts, (Schema,), fields)

def _handle_nested(spec):
    fields = []
    for group in re.findall('([\w,]+):([\w\[\]]+)(\??)', spec):
        for field in group[0].split(','):
            ftype = None
            if group[1].endswith('[]'):
                value = _gen_schema._handle_list(group[1], not len(group[2]))
                fields.append([field, value])
            else:
                value = _gen_schema._type_hash[group[1]](required=not len(group[2]))
                fields.append([field, value])
    return fields

def _handle_list(ltype, required):
    return List(_gen_schema._type_hash[ltype.split('[]')[0]], required=required)

_gen_schema._type_hash = {
    'str': Str, 
    'bool': Bool, 
    'int': Int, 
    'dt': DateTime,
    'url': URL
}

_gen_schema._make_schema = _make_schema
_gen_schema._handle_nested = _handle_nested
_gen_schema._handle_list = _handle_list
```

Finally we get to **tests.py**, which will import `schemas()` and use it to 
validate schemas of all responses saved in Redis:

```py
import pytest 
import redis
from validation import schemas
from concurrent.futures import ThreadPoolExecutor
from os.path import abspath, dirname

def test_schemas():
  validate = schemas()
  def _validate_schema(uri):
    response = REDIS.hget('responses', uri)
    return validate(uri, response), uri
  with ThreadPoolExecutor(max_workers=64) as executor:
    for result in executor.map(_validate_schema, REDIS.hgetall('responses')):
      if result[0] is not None:
        assert not len(result[0].keys()), result[1]

BASE = abspath(dirname(__file__))
REDIS = redis.Redis()
```

## Deployment and Scaling with Kubernetes

[I first experimented][] with Kubernetes in 2015 while migrating an 
application from AWS to [GCP][]. Back then it was still in its early stages 
and I ran into problems so mysterious to debug that I opted for regular 
[Compute Engine][] instances.

[]: https://github.com/kubernetes/kubernetes/issues/5410
[]: https://cloud.google.com/
[]: https://cloud.google.com/compute/

But time passed and Kubernetes evolved. Interest in the platform [keeps 
trending up][1] as it nears its 1.3 release.

[1]: https://www.google.com/trends/explore#q=Kubernetes

Johan Haleby has [a compelling case in Kubernetes' support][], listing 
shortcomings with other container orchestration offerings: [AWS ECS][] 
(security group hassle, lack of service discovery and port management), 
[Tutum][] (unable to reschedule containers from a failed node), 
[Docker Swarm][] (not a managed service, insufficient API for a cluster),
[Mesosphere DCOS][] (not a managed service, multi-cloud capabilitites only 
available in the paid version).

[]: http://code.haleby.se/2016/02/12/why-we-chose-kubernetes/
[]: https://aws.amazon.com/ecs/getting-started/
[]: https://www.tutum.co/
[]: https://www.docker.com/products/docker-swarm
[]: https://mesosphere.com/

Despite initially considering Docker Swarm for its alignment to the Docker API,
I decided to revisit Kubernetes and stuck with it.

As far as development and operations go, I believe Kubernetes is going to be a 
bigger standard than Docker. There already is [support for Rocket containers][]
and there are [very good reasons][] to try it.

[]: http://www.theregister.co.uk/2015/05/04/kubernetes_rkt_integration/
[]: http://cloudtweaks.com/2015/03/docker-vs-rocket-container-technology/

Kubernetes has a [rather elaborate jargon][], but in short, it lets you specify
groups of containers ([pods][]), replicated groups of containers 
([replication][] controllers) and load balancers ([services][]), much like you
can write a Dockerfile specifying a single container. With replication
controllers, Kubernetes allows you to scale resources without downtime when
needed, while also providing reliable failure resilience by automatically
watching over running pods and ensuring they match the desired count, i.e., new
pods are automatically spawn if any of them go down for any reason. Replication
controllers are generally better than pods because they ensure capacity. Even
when using a single node, it guarantees resilience if it fails for any reason.

[]: https://github.com/hazbo/kubernetes-overview
[]: http://kubernetes.io/docs/user-guide/pods/
[]: http://kubernetes.io/docs/user-guide/replication-controller/
[]: http://kubernetes.io/docs/user-guide/services/

I used three replication controllers, one for Redis and the others for the 
Locust master node and Locust slave nodes respectively, and two services to 
allow Locust to connect to Redis, and Locust slaves to connect to the master.

Kubernetes requires you to upload your container images to [Docker Hub][] or 
in the case of [Container Engine][], its own [private container registry][].

[]: https://hub.docker.com/
[]: https://cloud.google.com/container-engine/
[]: https://cloud.google.com/container-registry/

It's recommended to have behaviour set through environment variables (see 
[The Twelve-Factor App][1] for best practices in deployment) and data made 
available via [volumes][2], also carefully specified in the Kubernetes API.

[1]: http://12factor.net/
[2]: http://kubernetes.io/v1.0/docs/user-guide/volumes.html

The master replication controller is defined as follows:

```
kind: ReplicationController
apiVersion: v1
metadata:
  name: testrunner-master
  labels:
  name: testrunner
  role: master
spec:
  replicas: 1
  selector:
  name: testrunner
  role: master
  template:
  metadata:
    labels:
    name: testrunner
    role: master
  spec:
    containers:
    - name: testrunner
      image: gcr.io/&lt;id&gt;/testrunner:latest
      env:
      - name: TESTRUNNER_ROLE
        key: TESTRUNNER_ROLE
        value: master
      ports:
      - name: tr-port-8089
        containerPort: 8089
        protocol: TCP
      - name: tr-port-5557
        containerPort: 5557
        protocol: TCP
      - name: tr-port-5558
        containerPort: 5558
        protocol: TCP
```

Below is the slave replication controller:

```
kind: ReplicationController
apiVersion: v1
metadata:
  name: testrunner-slaves
  labels:
  name: testrunner
  role: slave
spec:
  <span class="bolder">replicas: 10</span>
  selector:
  name: testrunner
  role: slave
  template:
  metadata:
    labels:
    name: testrunner
    role: slave
  spec:
    containers:
    - name: testrunner
      image: gcr.io/&lt;id&gt;/testrunner:latest
      env:
      - name: TESTRUNNER_ROLE
        key: TESTRUNNER_ROLE
        value: slave
      - name: TESTRUNNER_MASTER
        key: TESTRUNNER_MASTER
        value: testrunner-master
```

And finally, the master service definition:

```
kind: Service
apiVersion: v1
metadata:
  name: testrunner-master</span>
  labels:
  name: testrunner
  role: master
spec:
  ports:
  - port: 8089
    targetPort: tr-port-8089</span>
    protocol: TCP
    name: tr-port-8089
  - port: 5557
    targetPort: tr-port-5557</span>
    protocol: TCP
    name: tr-port-5557
  - port: 5558
    targetPort: tr-port-5558</span>
    protocol: TCP
    name: tr-port-5558
  selector:
  name: locust
  role: master
  type: LoadBalancer
```

Notice how in the slave replication controller, the `TESTRUNNER_MASTER`
environment variable which is passed to the container is set to 
`testrunner-master`, a hostname made available by the service definition above.
Also, all service `targetPort` values match the ones defined in the 
[targeted][1] replication controller. Redis is made available to 
the Python processes the very same way, through a service and replication 
controller in Kubernetes.

[1]: http://kubernetes.io/docs/user-guide/labels/

On the testrunner's Dockerfile, `ENTRYPOINT` is set to run `scripts/main.sh`
which picks up the environment variables and starts the locust process in
the appropriate mode.

```
#!/bin/bash
if [[ "$TESTRUNNER_ROLE" = "master" ]]; then
  locust --master
elif [[ "$TESTRUNNER_ROLE" = "slave" ]]; then
  locust --slave --master-host=$TESTRUNNER_MASTER
fi
```

Once you end a Locust run and have your API responses saved, you can SSH to the
master node and run the py.test suite from the command-line, or, run it locally
or elsewhere by simply enabling remote access to the Redis service.

This article was mostly illustrative, but you can find supporting source code
and more implementation details in [GCP's sample Locust project][1]. It doesn't
include any of the log harvesting and schema validation code from this article,
but it can get you a cluster running in no time.

[1]: https://github.com/GoogleCloudPlatform/distributed-load-testing-using-kubernetes
