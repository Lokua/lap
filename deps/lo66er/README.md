# Lo66er

> Highly configurable, styled and level-based console logging for Node.js and browsers.

## Install

```bash
<bower|npm> install lo66er
```

## Usage

Lo66er exposes a single `Lo66er` constructor, which takes a required
name as first argument, followed by an optional number to set the Lo66er's level, or a configuration hash. 
The following lines will all accomplish instantiating a Lo66er at the default level 0 (log).


```js
var logger;
logger = Lo66er('name');
logger = Lo66er('name', 0);
logger = Lo66er('name', Lo66er.LOG);
logger = Lo66er('name', { level: 0 });
logger = Lo66er('name', { level: Lo66er.LOG });
```

A Lo66er will only output logs that are greater to or equal to the Lo66er's level. 
For semantic clarity, Lo66er comes with static Lo66er.<LEVEL> properties

```js
Lo66er.LOG   === 0
Lo66er.TRACE === 1
Lo66er.DEBUG === 2
Lo66er.INFO  === 3
Lo66er.WARN  === 4
Lo66er.ERROR === 5
```

## Instance Methods

The Lo66er console methods work like their Node and browser counterparts - including
the ability to use format specifiers in the first argument. In addition, Lo66er
will allow the use of Node's `%j` specifier in the browser context, and will convert browser
`%o`, `%i`, and `%f` to Node's equivalent `%d` specifier when in a Node context. For more basic 
console usage instructions consult the MDN console documentation at 
[https://developer.mozilla.org/en-US/docs/Web/API/Console](https://developer.mozilla.org/en-US/docs/Web/API/Console)

The currently supported console wrappers include

+ `log`
+ `trace`
+ `debug`
+ `info`
+ `warn`
+ `error`
+ `group`
+ `groupEnd`

## Instance Properties

#### `String: name`
The name of this Lo66er.

#### `Object: options`

```js
{
  level: 0,
  outputLevel: true,
  outputTimestamp: false,
  outputSource: true,
  useAbsoluteSource: false,
  textStyle: 'color:black;',
  sourceStyle: false,
  nameStyle: 'color:purple',
  newLine: false
}
```

## Class/Static Members

#### `Array[Lo66er]: lo66er`
Direct access to all Lo66ers that have been created. To retrieve a specific Lo66er, see
`Lo66er::getLo66er()`

#### `Function: getLo66er(String: name)`
Retrieve the Lo66er specified by `name`. This is useful when your loggers take on
a certain role throughout an application.

#### `Function: setDefaults(Object: newDefaults)`
Useful to avoid duplicating similar options hashes when using mutliple Lo66er instances.

#### `Boolean: off`
Turn all Lo66ers off regardless of their level.

#### `Function: createRequestLo66er(name, options)`
Node only. Creates Connect/Express request logging middlware.
  
**Usage:**

```js
var connect = require('connect');
var Lo66er = require('lo66er');

var app = require('connect')();

app.use(Lo66er.createRequestLo66er('APP_REQUEST_LOGGER'));
```

Note: the request Lo66er's default options differs as `outputSource=false`


