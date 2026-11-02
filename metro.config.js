const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web: expo-sqlite runs SQLite as WebAssembly in a worker, which needs the .wasm asset
// type and a cross-origin-isolated page. In production the same two headers come from
// public/_headers; this sends them from the dev server too. `require-corp` (not
// `credentialless`) because Safari only supports the former.
// Native iOS/Android builds are unaffected.
config.resolver.assetExts.push('wasm');

// Keep package assets out of a folder literally named `node_modules`, which upload tools skip.
// Appended after Expo's own plugins so it sees their final output.
config.transformer.assetPlugins = [
  ...(config.transformer.assetPlugins ?? []),
  require.resolve('./scripts/asset-plugin.js'),
];
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
