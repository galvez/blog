---
date: May 5, 2019
featured: true
---
A walk through an experimental tool that implements a SSH-ready shell task runner borrowing some ideas on code organization from Vue.js
---

# Fabula: A Vue.js Inspired Task Runner

When I wrote about [leaving Python for JavaScript][] back in 2017, it evoked a 
lot of [strong reactions in Hacker News][]. Since then, I saw my knowledge of
modern JavaScript and Node APIs completely surpass my Python skillset. I still
remember most of Python 2.7, but I know Python 3 has grown into a complete 
different beast which I never really bothered to fully learn. To this date,
I haven't felt or seen any need to go back to Python. Nor do I miss it. 
JavaScript today is just an absolute joy to work with, in ways I don't 
see Python ever getting close to.

[]: https://hire.jonasgalvez.com.br/2017/aug/25/leaving-python-for-javascript/
[]: https://news.ycombinator.com/item?id=15098018

It's time to drop one of last the pieces of Python code that have been in nearly 
every app I helped deploy: [Fabric][]. For the longest time, I have packaged 
my Node applications together with a **Fabric** installation for running SSH 
tasks. For those who don't know, **Fabric** allows you to write Python scripts
for running commands both locally and remote, by specifying external servers 
and keys for SSH access.

[]: https://www.fabfile.org/

```python
@task
def my_task():
    local('touch foobar')
    put('toobar', '/remote/path/foobar')
```

Even when packaging my Node apps in Docker containers, I'd still use a base
Docker image with [supervisord][] and Fabric. That is, I'd have a script
as `ENTRYPOINT` that would start **supervisord** but run a few Fabric tasks
beforehand, initializing the container.

[]: http://supervisord.org/

Fabric is my reference example, but nearly all other popular solutions in the
same realm ([Puppet][], [Ansible][], [Chef][], [Terraform][] etc) require 
rather sophisticated packages to be able to perform these operations.

[]: https://puppet.com/
[]: https://www.ansible.com/
[]: https://chef.io/
[]: https://www.terraform.io/

In my day job, I think **Terraform** is used extensively by our operations team.
I personally like some of **Ansible**'s ideas, but I absolutely love Fabric, 
because it avoids abstracting too much, it just lets you compose low-level 
commands with easier configuration and a convenience transport layer independent 
from ssh-agent.

For people who like to _understand what's going on_, Fabric is the
way to go. It lets you put a system together with a carefully crafted set of 
flexible and configurable tasks. 

Thing is, I **love JavaScript more**. 

## Fabric for JavaScript?

It's been done. [Flightplan][] is an awesome Node project very similar to 
Fabric, that is, it offers a somewhat low-level abstraction for commands on 
top of SSH2. 

It lets you run `local` and `remote` tasks:

[]: https://github.com/flightplan-tool/flightplan

```js
plan.target('production', {
  host: 'www2.example.com',
  username: 'pstadler',
  agent: process.env.SSH_AUTH_SOCK
})

plan.local((local) => {
})

plan.remote((remote) => {
})
```

But I think it falls short in providing something that's actually **_easier_** 
than Fabric. A lot of what made JavaScript a joy today are the modern tools 
built with it. 

Like, for instance, Vue's [single file components][]. 

One night, I was looking at some old Fabric files I had and it struck me: **it 
would be really nice if I could split and organize commands and configuration 
like that.**

[]: https://vuejs.org/v2/guide/single-file-components.html

In fact, I always felt I could avoid even writing Python or JavaScript for most 
operations if I just made Bash scripts a little smarter. 

⁂

# Introducing Fabula

At its core, [**Fabula**][] (latin for _story_) is a simple Bash script preprocessor 
and runner. You can say it is an intermediate layer between these full-blown 
solutions and pure Bash scripts. 

[]: https://github.com/nuxt/fabula

See the source code here: [https://github.com/nuxt/fabula][]

[]: https://github.com/nuxt/fabula

In a way, Fabula's goal is to provide a way to _tell a story_ about a given 
architecture, in a human-readable format, so it has a fitting name.

```sh
local echo "This runs on the local machine"
echo "This runs on the server"
```

If you place the above snippet in a file named `echo.fab` and configure a remote
server in Fabula's configuration file (`fabula.js`):

```js
export default {
  ssh: {
    server: {
      hostname: '1.2.3.4',
      username: 'user',
      privateKey: '/path/to/key'
    }
  }
}
```

Executing `fabula server echo` will run the script on `server` (as specified 
under `ssh` in `fabula.js`), but every command preceded by `local` will run 
on the local machine.

Conversely, if you omit the `server` argument like below:

```sh
fabula echo
```

It'll run the script strictly in local _mode_, in which case it will **fail** if
it finds any command that is not preceded by `local`. The point is to allow both
context-hybrid scripts and strictly local ones.

To run on all available servers, use `fabula all <task>`.

## Context

If you have a task that is bound to run on multiple servers and parts 
of the commands rely on information specific to each server, you can 
reference the current server settings via `$server`:

In `fabula.js`:

```js
export default {
  ssh: {
    server1: {
      hostname: '1.2.3.4',
      customSetting: 'foo'
    },
    server2: {
      hostname: '1.2.3.4',
      customSetting: 'bar'
    }
  }
}
```

In `task.fab`:

```sh
echo <%= quote($server.customSetting) %>
```

Running `fab all task` will cause the correct command to run for each server.
Note that `quote()` is a special function that quotes strings for Bash, and 
is provided automatically by **Fabula**.

## Preprocessor

Fabula's compiler will respect Bash's semantics for most cases, but allows
you to embed interpolated JavaScript code (`<% %>` and `<%= %>`) using 
[`lodash.template`][] internally. Take for instance a `fabula.js` configuration 
file listing a series of files and contents:

[]: https://lodash.com/docs/4.17.11#template

```js
export default {
  files: {
    file1: 'Contents of file1',
    file2: 'Contents of file2'
  }
}
```

You could write a **Fabula** script as follows:

```sh
<% for (const file in files) { %>
local echo <%= quote(files[file]) %> > <%= file %>
<% } %>
```

**Fabula** will first process all interpolated JavaScript and then run the resulting script.

## Components

Concentrating options in a single file (`fabula.js`) makes sense sometimes, but
might also create a mess if you have a lot of specific options pertaining to 
one specific task. **Fabula** lets you combine settings and commands in a 
**single-file component**, inspired by Vue. Here's what it looks like:

```xml
<fabula>
export default {
  files: {
    file1: 'Contents of file1',
    file2: 'Contents of file2'
  }
}
</fabula>

<commands>
<% for (const file in files) { %>
local echo <%= quote(files[file]) %> > <%= file %>
<% } %>
</commands>
```

## Commands

As stated in the introduction, **every command available to the underlying 
shell** will work in a **Fabula** task. There are however a few convenience 
commands that are specific to **Fabula**.

Every command preceded by `local` will run on the local machine:

```sh
local mkdir -p /tmp/foobar
local touch /tmp/foobar
```

Appends a block text or string to the file in the specified path.

```sh
local append /path/to/file:
  multi-line contents
  to be appended to the file 
```

Text will be automatically dedented to the number of total white
spaces in the **first line**. Perhaps ironically, _just like Python_.

See all commands in the [documentation][].

[]: https://nuxt.github.io/fabula/commands.html


## Failure

By default, a single failing command will cause **Fabula** to exit and prevent
any subsequent commands or tasks from running. You can disable this via **Fabula**'s configuration file:

```js
export default {
  fail: false
}
```

You can also set `fail: false` on a **Fabula** component.

## Command handlers

You can handle results for individual commands as well. A common example is
handling a `yarn install` result. If `fail` is `false`, you may want to handle
 the result of certain commands.

```xml
<fabula>
export default {
  fail: false
}
</fabula>

<commands>
unimportant command 1
unimportant command 2
yarn install
yarn build
</commands>
```

In the above script, you would want to ensure `yarn install` finished 
succesfully before moving on to `yarn build`, even though you don't care about 
the first two unimportant commands. 

**Fabula** lets you tag an individual command line and set a _callback_ matching 
the tag given:

```xml
<fabula>
export default {
  fail: false,
  check({ code, stderr }, fabula) {
    if (code) {
      fabula.abort()
    }
  }
}
</fabula>

<commands>
unimportant command 1
unimportant command 2
yarn install @check
yarn build
</commands>
```

You can tag a command by placing a label prefixed with **`@`** at the end of it.
You can then set a handler method named with the same label. The first parameter 
passed to the handler method is the result object, which contains `code` (exit 
code), `stdout`, `stdin` and also `cmd` -- a reference to the Fabula object 
representing the parsed command. The second parameter is the **Fabula** context, 
which provides access to `settings` and `abort()`.

You can also provide a block of commands to run after the handler. This allows
you to add or change properties in **Fabula**'s settings object prior to the
JavaScript preprocessing. 

Take [this example][] from the test suite fixtures.

[]: https://github.com/nuxt/fabula/blob/master/test/fixtures/handler.fab

```xml
<fabula>
export default {
  fail: false,
  handle: (result) => {
    return {
      touchErrorCode: result.code
    }
  }
}
</fabula>

<commands local>
touch /parent/doesnt/exist @handle:
  local write /tmp/fabula-handler-test:
    <%= touchErrorCode %>
cat /tmp/fabula-handler-test
rm /tmp/fabula-handler-test
</commands>
```

The block after `@handle` is only compiled after the current command has been
executed and you've had a chance to **handle** it. The handling function (which
must match the `@name` you use to tag the command) can return an object which
is then merged back into **Fabula** settings object. The snippet above will
result in `1` being written to the test file (which is then removed so no 
testing files are left behind).

## Custom commands

To make the bash script parser as flexible and fault-tolerant as possible, 
**Fabula** introduces a simple, straight-forward compiler with an API for writing 
command handlers. The special `put` built-in command for instance, is 
defined under [`src/commands/put.js`][]:

[]: https://github.com/nuxt/fabula/blob/master/src/commands/put.js

```js
import { put } from '../ssh'

export default {
  match(line) {
    return line.trim().match(/^put\s+(.+)\s+(.+)/)
  },
  line() {
    this.params.sourcePath = this.match[1]
    this.params.targetPath = this.match[2]
  },
  command(conn) {
    return put(conn, this.params.sourcePath, this.param.targetPath)
  }
}
```

- `match()` is called once for every new line, if no previous command is still 
  being parsed. If `match()` returns `true`, `line()` will run for the current 
  and every subsequent line as long as you keep returning `true`, which means,
  _continue parsing lines for the **current command**_.

- When `line()` returns  `false` or `undefined`, the compiler understands the 
  current command is **done parsing** and moves on.

- with `line()`, we can store data that is retrieved from each line in the 
  command block, make it availble under `this.params` and later access it when 
  actually calling `command()` (done automatically when running scripts).

### Registration

Say you want to register the command `special <arg>`, that can run only on the
local machine. You can add a custom command handler to your `fabula.js`
configuration file under `commands`:

```js
export default {
  commands: [
    {
      match(line) {
        this.local = true
        const match = line.trim().match(/^special\s+(.+)/)
        this.params.arg = match[1]
        return match
      },
      command(conn) {
        return { stdout: `From special command: ${this.params.arg}!` }
      }
    }
  ]
}
```

Note that you could also use an external module:

```js
import specialCommand from './customCommand'

export default {
  commands: [ specialCommand ]
}
```

If you have a `task.fab` file with `special foobar`, its output will be:

```sh
ℹ [local] From special command: foobar!
ℹ [local] [OK] special foobar
```

Note that you have successfuly defined a local command that can be ran without
being preceded by `local`. That is because you **manually** set it to `local`
in `match()`. You can use `match()` to determine if the command is local or not
and still make it work both ways.

See an [advanced example][] in the documentation.

[]: https://nuxt.github.io/fabula/commands.html#advanced-example

## Logging

Logging can be configured in a fashion similar to [environment variables][]: 
**global**, **local**, **remote** and **per server**:

[]: https://nuxt.github.io/fabula/environment.html

```js
export default {
  ssh: {
    // Per SSH server
    server1: {
      hostname: '1.2.3.4',
      username: 'serveruser',
      log: 'logs/ssh-server1.log'
    }
  },
  // Global, local and SSH
  logs: {
    global: 'logs/global.log',
    local: 'logs/local.log',
    ssh: 'logs/ssh.log'
  }
}
```

And **per component**:

```xml
<fabula>
export default {
  log: 'logs/component.log'
}
</fabula>
```

⁂

At this point, despite reasonably functional, Fabula is more of a proof of 
concept than something ready for production.

**If you like the concept**, the best way to help is to [read the docs][] and
try using Fabula to replace any old scripts you may have. If you get confused or
run into problems, don't hesistate to [open an issue][]. My ultimate goal is
to at least replicate all of Fabric's functionality.

[]: https://nuxt.github.io/fabula/
[]: https://github.com/nuxt/fabula/pulls

Fabula wouldn't have been possible without the endless counsel of the Nuxt
core team. In particular, my thanks to [Sébastien][] and [Alex][] Chopin, who 
inspired me in the first place to consider a preprocessor (like the one used
in Nuxt) for this and also the genius [Pooya Parsa][], who I never stop 
learning from.

[]: https://github.com/Atinux/
[]: https://github.com/alexchopin/
[]: https://github.com/pi0
