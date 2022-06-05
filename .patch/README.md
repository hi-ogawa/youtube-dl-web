# patch

```sh
# 1. install original dependencies
npm install

# 2. manually edit e.g. node_modules/@remix-run/serve/index.js

# 3. run patch-package to generate e.g. patches/@remix-run+serve+1.4.1.patch
npx patch-package @remix-run/serve
```

## changes

- @remix-run/serve

  - customize `public` path

- @remix-run/dev
  - disable tsconfig overwrite https://github.com/remix-run/remix/pull/2786

## references

- https://github.com/hi-ogawa/ytsub-v3/blob/f55c6bbffddb468e98030f7e28d460bbf9cec6ce/.patch/README.md
