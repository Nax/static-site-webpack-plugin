'use strict';

const Module = require('module');

const nodeExternals = require('webpack-node-externals');

const PLUGIN_NAME = 'StaticSiteWebpackPlugin';

let sIndex = 0;

const makeUniqueFilename = () => {
  const filename = `__static-site-webpack-plugin${sIndex}__.js`;
  sIndex++;
  return filename;
};

const def = (value, d) => (value === undefined ? d : value);

/*
 * There is no clean way to change a child compiler's target so far.
 * See: https://github.com/jantimon/html-webpack-plugin/issues/1590
 */
const forceNodeJS = (childCompiler) => {
  childCompiler.options.externalsPresets = {
    web: false,
    node: true,
    nwjs: false,
    electron: false,
    electronMain: false,
    electronPreload: false,
    electronRenderer: false,
  };
  childCompiler.options.loader = {
    target: "node",
  };
  childCompiler.options.target = "node";
  childCompiler.options.node = {
    global: false,
    __filename: "eval-only",
    __dirname: "eval-only",
  };
  childCompiler.options.output = {
    ...childCompiler.options.output,
    chunkFormat: "commonjs",
    chunkLoading: "require",
    enabledChunkLoadingTypes: ["require"],
    enabledWasmLoadingTypes: ["async-node"],
    globalObject: "global",
    wasmLoading: "async-node",
    workerChunkLoading: "require",
    workerWasmLoading: "async-node",
  };
  childCompiler.options.resolve.conditionNames = [
    "webpack",
    "development",
    "node",
  ];
  childCompiler.options.resolve.byDependency = {
    wasm: {
      conditionNames: ["import", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
    },
    esm: {
      conditionNames: ["import", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
    },
    worker: {
      conditionNames: ["import", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
      preferRelative: true,
    },
    commonjs: {
      conditionNames: ["require", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
    },
    amd: {
      conditionNames: ["require", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
    },
    loader: {
      conditionNames: ["require", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
    },
    unknown: {
      conditionNames: ["require", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
    },
    undefined: {
      conditionNames: ["require", "module", "..."],
      aliasFields: [],
      mainFields: ["module", "..."],
    },
    url: {
      preferRelative: true,
    },
  };
};

class StaticSiteWebpackPlugin {
  constructor(options) {
    /* Parse options */
    options = def(options, {});
    this.entry = options.entry;
    this.prettyFilenames = def(options.prettyFilenames, false);
    this.ext = def(options.ext, 'html');

    this.output = makeUniqueFilename();
    this.render = null;

    if (!this.entry)
      throw new Error("Option 'entry' is required");
  }

  _pathToFilename(path) {
    let prettyFilenames = this.prettyFilenames;
    const ext = this.ext;

    const trailingSlash = (path.slice(-1) === "/");
    path = path.replace(/^\/+/, '').replace(/\/+$/, '');

    if (prettyFilenames === 'auto')
      prettyFilenames = !trailingSlash;

    if (path === "") {
      path = `index.${ext}`;
    } else if (prettyFilenames) {
      path = `${path}.${ext}`;
    } else {
      path = `${path}/index.${ext}`;
    }

    return path;
  };

  async _build(compilation, options) {
    const { RawSource } = this.webpack.sources;

    if (!this.api)
      return null;
    const routes = await this.api.routes();
    const pages = routes.map(r => Promise.resolve(this.api.render(r, options)).then((html) => {
      const filename = this._pathToFilename(r);
      compilation.emitAsset(filename, new RawSource(html));
      return null;
    }));
    return Promise.all(pages);
  }

  apply(compiler) {
    const { webpack } = compiler;
    const { EntryPlugin, LoaderTargetPlugin, ExternalsPlugin } = webpack;
    const { NodeTargetPlugin, NodeTemplatePlugin } = webpack.node;
    const { EnableLibraryPlugin } = webpack.library;

    this.webpack = webpack;

    let childCompiler = null;

    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, cb) => {
      /* Create the child compiler */
      const outputOptions = {
        filename: this.output,
        library: {
          type: 'commonjs'
        }
      };

      childCompiler = compilation.createChildCompiler(PLUGIN_NAME, outputOptions);
      childCompiler.context = compilation.compiler.context;
      forceNodeJS(childCompiler);

      new EntryPlugin(childCompiler.context, this.entry).apply(childCompiler);
      new EnableLibraryPlugin('commonjs').apply(childCompiler);
      new NodeTemplatePlugin(outputOptions).apply(childCompiler);
      new NodeTargetPlugin().apply(childCompiler);
      new LoaderTargetPlugin('node').apply(childCompiler);
      new ExternalsPlugin('commonjs', [nodeExternals()]).apply(childCompiler);

      /* Tap into the assets */
      compilation.hooks.processAssets.tapPromise(PLUGIN_NAME, async (assets) => {
        const a = assets[this.output];
        if (a) {
          const src = a.source();
          delete assets[this.output];
          const m = new Module();
          m.paths = module.parent.paths;
          m._compile(src, this.output);
          this.api = m.exports;
        }

        let publicPath = compiler.options.output.publicPath;
        if (publicPath === 'auto')
          publicPath = "/";

        /* TODO: Filter the hot updates better */
        /* TODO: Can we expose a better API than that? */
        const optAssets = Object.keys(assets)
          .filter(x => !x.includes(".hot-update."))
          .map(key => ({ filename: publicPath + key }));

        const buildOpts = {
          assets: optAssets
        };
        return this._build(compilation, buildOpts);
      });

      childCompiler.runAsChild(cb);
    });
  }
};

module.exports = StaticSiteWebpackPlugin;
