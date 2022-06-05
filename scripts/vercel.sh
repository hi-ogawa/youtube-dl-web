#!/bin/bash

# cf. https://github.com/hi-ogawa/ytsub-v3/blob/f55c6bbffddb468e98030f7e28d460bbf9cec6ce/scripts/vercel.sh

set -eux -o pipefail

# cleanup
rm -rf build/remix/production
rm -rf build/tailwind/production

# tailwind
NODE_ENV=production npm run tailwind

# default "node-cjs" build with custom server main
NODE_ENV=production BUILD_VERCEL=1 npx remix build

# run esbuild again manually to bundle server app
npx esbuild build/remix/production/server/index.js --outfile=build/remix/production/server/index-bundled.js \
  --bundle --platform=node

#
# setup files for `vercel deploy --prebuilt`
#   https://vercel.com/docs/build-output-api/v3#vercel-primitives/static-files
#   https://vercel.com/docs/build-output-api/v3#vercel-primitives/serverless-functions
#
# vercel.json
# .vercel/
#   project.json
#   output/
#     config.json
#     static/
#       public/
#     functions/
#       server/
#         index.func/
#           .vc-config.json
#           index-bundled.js
#

deploy_dir=build/remix/production/deploy
mkdir -p "$deploy_dir/.vercel/output/static"
mkdir -p "$deploy_dir/.vercel/output/functions/server/index.func"
cp -r build/remix/production/public "$deploy_dir/.vercel/output/static"
cp build/remix/production/server/index-bundled.js "$deploy_dir/.vercel/output/functions/server/index.func"
cat > "$deploy_dir/.vercel/output/config.json" << "EOF"
{
  "version": 3,
  "routes": [
    {
      "src": "^/build/(.*)$",
      "headers": {
        "Cache-Control": "public, max-age=31536000"
      },
      "continue": true
    },
    {
      "src": "^/(.*)$",
      "dest": "/public/$1",
      "check": true
    },
    {
      "src": "^/(.*)$",
      "dest": "/server",
      "check": true
    }
  ]
}
EOF
cat > "$deploy_dir/.vercel/output/functions/server/index.func/.vc-config.json" <<EOF
{
  "runtime": "nodejs16.x",
  "handler": "index-bundled.js",
  "launcherType": "Nodejs",
  "regions": ["hnd1"]
}
EOF
if [ -f .vercel/project.json ]; then
  cp .vercel/project.json "$deploy_dir/.vercel"  # skip on CI
fi
