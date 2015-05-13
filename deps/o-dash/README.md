# o-

###### pronounced "Oh Dash"

> micro-framework for [sass][0]

## Why

Because I love to code, and wanted something simple and namespaced as to not collide with
existing frameworks (bootstrap `@size` vs bourbon `@size` for example).

This project is in its early stage of development - published at this point
to reserve the package name. Names, structure, and implementations will surely change; more details will follow.

## Install

via npm
```bash
npm install o- --save-dev
```
or through bower
```bash
bower install o-dash --save
```

## Usage

```sass
@import path_to_node_modules/o-/o-
```

Refer to the API documentation for placeholder,
function, and mixin specifics located at [lokua.github.io/o-][2]

## Dev

`npm install`

If adding a new file, run `node bin/gen.js` afterwords. This will add
the file to the sass imports list.

Documentation generation is custom and housed internally; regenerate by 
running `grunt doc`.

## License
[MIT][1]

[0]: http://sass-lang.com
[1]: http://lokua.net/license-mit.html
[2]: http://lokua.github.io/o-
