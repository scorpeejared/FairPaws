/**
 * Metro asset plugin: publishes assets that come from packages (the SQLite wasm, the Nunito
 * fonts) under `/assets/vendor/...` instead of `/assets/node_modules/...`.
 *
 * Why: many hosts and upload tools silently skip any folder named `node_modules` (Netlify's
 * drag-and-drop does), which left the deployed site without its database engine and fonts.
 * The URL and the file on disk are both derived from `httpServerLocation`, so they stay in step.
 */
module.exports = function vendorAssetPlugin(assetData) {
  return {
    ...assetData,
    httpServerLocation: assetData.httpServerLocation.replace(/\/node_modules\//g, '/vendor/'),
  };
};
