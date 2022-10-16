#!/bin/bash

# cf. https://github.com/hi-ogawa/ytsub-v3/blob/ba7412079344d66ceb2ce2b8ebb3bc2895f27bce/scripts/copy-assets.sh

set -eux -o pipefail

dest_dir="build/remix/${NODE_ENV:-"development"}/public"

rm -rf "$dest_dir/_copy"
mkdir -p "$dest_dir/_copy"
cp app/assets/{icon-32.png,icon-192.png,icon-512.png,manifest.json} "$dest_dir/_copy"
cp -f app/assets/service-worker.js "$dest_dir"
cp -rf node_modules/@ffmpeg/core/dist/* "$dest_dir/_copy/"
