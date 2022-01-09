---
date: September 25, 2004
---

# A 40-line Feed Aggregator

As you can probably guess, yes, in Python. Writing an aggregator like [MXNA][]
or [Full as a Goog][] isn't [parkwalkian][] at all. Once you're out of the 
nightmare of parsing the multiple RSS variants and Atom, next you have to order 
items by date of publication. This means you'll have to write code to parse the
different date formats used in RSS and Atom, which includes dealing with
timezones, so you can finally convert them to Unix Time and make them sortable.

[]: http://web.archive.org/web/20050205221813/http://www.markme.com:80/mxna/
[]: http://web.archive.org/web/20050213025445/http://www.fullasagoog.com:80/
[]: http://web.archive.org/web/20050213014950/http://inamidst.com/notes/phenomic

Fortunately, someone has spent time to provide us with a fast and stable library
that can parse every known syndication format on earth seamlessly. The 
[Universal Feed Parser][] is an absolute must for any application that deals
heavily with syndication formats.

[]: http://web.archive.org/web/20050213014950/http://feedparser.org/

If you were to build an aggregator, you would probably end up defining a class
to represent entries and whatever additional information is associated with
them. But first, there needs to be some sort of storage mechanism for the feed
URLs. In this example, I'll use a simple text file. The code starts with the
importing of the require modules, the parsing of the feeds' URLs and the
definition of an array to hold the items once we parse them.

```py
import time
import feedparser
 
sourceList = open('feeds.txt').readlines()
postList = []
```

Next, we define the Entry class. It will act as an wrapper for the entry object
the Universal Feed Parser returns. The modified_parsed property contains the
entry date in a tuple of nine elements, where the first six are the year,
month, day, hour, minute and second. This tuple can be converted to Unix Epoch
with the built-in method `time.mktime()`:

```py
class Entry:
    def __init__(self, data, blog):
        self.blog = blog
        self.title = data.title
        self.date = time.mktime(data.modified_parsed)
        self.link = data.link
    def __cmp__(self, other):
        return other.date - self.date
```

The `__cmp__` method defines the standard comparision behavior of the 
class (you could also override specifically `==` behavior by defining a
`__eq__` method, but `__cmp__` works just the same). Once we get an array 
with `Entry` instances and call `sort()`, the `__cmp__` method will be 
used to define the order.

Now comes the part where the UFP saves us 200 lines of code. Since we want to 
show entries ordered by date, it's prudent to at least verify if the entry 
actually includes a date. Further measures would include checking if the date 
is within the current century. Or, you could just check for the `bozo` bit 
and refuse invalid feeds altogether.

```py
for uri in sourceList:
    xml = feedparser.parse(uri.strip())
    blog = xml.feed.title
    for e in xml.entries[:10]:
        if not e.has_key('modified_parsed'):
            continue
        postList.append(Entry(e, blog))

postList.sort()
```

Finally, we output the data:

```py
print('Content-type: text/html\n')
print('<ul style="font-family: monospace;">')

for post in postList[:20]: # last 20 items
    date = time.gmtime(post.date)
    date = time.strftime('%Y-%m-%d %H:%M:%S', date)
    item = '\t<li>[%s] <a href=\"%s\">%s</a> (%s)</li>'
    print(item % (date, post.link, post.title, post.blog))
 
print('</ul>')
```

If you want something as complete as **Full as a Goog**, you might want to 
check [PlanetPlanet][], which also uses the Universal Feed Parser. But the
simplicity of this example should invite you to improve and tweak it yourself.
Let me know if you make something interesting out of it. Enjoy.

[]: http://web.archive.org/web/20050213014950/http://planetplanet.org/
