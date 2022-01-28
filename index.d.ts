declare module "static-site-webpack-plugin" {
  export interface SaticSiteWebpackPluginOptions {
    entry: string;
    prettyFilenames?: boolean | 'auto';
    ext?: string;
  }

  export default class SaticSiteWebpackPlugin {
    constructor(options: SaticSiteWebpackPluginOptions);
  }

  export interface Asset {
    filename: string;
  }

  export interface RenderOptions {
    assets: Asset[];
  }

  export type Routes = () => string[] | Promise<string[]>;
  export type Render = (path: string, options: RenderOptions) => string | Promise<string>;
}
