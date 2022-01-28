# StaticSitePlugin

![npm](https://img.shields.io/npm/v/static-site-webpack-plugin)
![NPM](https://img.shields.io/npm/l/static-site-webpack-plugin)
![npm type definitions](https://img.shields.io/npm/types/static-site-webpack-plugin)
![npm](https://img.shields.io/npm/dt/static-site-webpack-plugin)
![GitHub Repo stars](https://img.shields.io/github/stars/Nax/static-site-webpack-plugin)

A generic, modern webpack plugin to generate static websites, inspired by [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin).

This plugin exposes a very basic API to declare routes and render them into HTML. It integrates with your webpack rules, so things like babel, typescript and JSX can be used seamlessly.

Because this plugin is extremely generic, it's possible with little boilerplate to integrate [React](https://fr.reactjs.org/), [Vue](https://vuejs.org/), [Handlebars](https://handlebarsjs.com/) or any other framework/templating engine of your choice.

## Install

npm:
```sh
npm install --save-dev static-site-webpack-plugin
```

yarn:
```sh
yarn add -D static-site-webpack-plugin
```

pnpm:
```sh
pnpm add -D static-site-webpack-plugin
```

## Usage

StaticSitePlugin will load two functions, `render` and `routes`, through webpack, and use these to output the static website.

### webpack.config.js

```js
'use strict';

const path = require('path');
const StaticSitePlugin = require('static-site-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    app: './app.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new StaticSitePlugin({
      entry: './static.js'
    })
  ]
};
```

Unlike `static-site-generator-webpack-plugin`, you're not forced to export CommonJS/UMD and/or to target node.

### static.js

```js
'use strict';

const routes = () => ["/", "/about"];
const render = (path) => `<html><body>Hello from ${path}</body><html>`;

module.exports = { routes, render };
```

Note that render can also return a promise.

### Options

---

**entry**  
*string, required*  

The static entrypoint.

---
**prettyFilenames**  
*boolean | "auto"*  

When false, `/foo` will generate `foo/index.html`.  
When true, `/foo` will generate `foo.html`.  
When `"auto"`, it will be determined based on the rpesence of a trailing slash.

Defaults to `false`.

---

**ext**  
*string*  

The extenstion of the generated files.  

Defaults to `"html"`.

---

## Similar Projects

 * [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin), the obvious inspiration.
 * [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)

## License

StaticSitePlugin is available under the [MIT License](LICENSE).

## Author

This plugin was made by [Maxime Bacoux "Nax"](https://github.com/Nax).
