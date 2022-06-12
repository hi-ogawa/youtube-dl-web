#!/bin/bash

# cf. https://github.com/hi-ogawa/ytsub-v3/blob/f55c6bbffddb468e98030f7e28d460bbf9cec6ce/scripts/vercel.sh

set -eux -o pipefail

# cleanup
rm -rf build/remix/production
rm -rf build/tailwind/production

# tailwind
NODE_ENV=production npm run tailwind

# copy assets not managed by remix
NODE_ENV=production bash scripts/copy-assets.sh

# default "node-cjs" build with custom server main
NODE_ENV=production BUILD_VERCEL=1 npx remix build

# run esbuild again manually to bundle server app
npx esbuild build/remix/production/server/index.js --outfile=build/remix/production/deploy/index.js --bundle --platform=node

# setup files for `verce deploy`
mkdir -p .vercel
cp -rf vercel.json .vercel build/remix/production/public build/remix/production/deploy
