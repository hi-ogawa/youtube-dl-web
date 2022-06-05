const env = process.env.NODE_ENV ?? "development";

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildPath: `build/remix/${env}/server/index.js`,
  assetsBuildDirectory: `build/remix/${env}/public/build`, // cf. .patch/patches/@remix-run+serve+1.5.1.patch
  server: process.env.BUILD_VERCEL ? "./app/misc/vercel.ts" : undefined,
  ignoredRouteFiles: ["**/__tests__/**/*"],
};
