# assets

cf. https://github.com/hi-ogawa/ytsub-v3/blob/f55c6bbffddb468e98030f7e28d460bbf9cec6ce/app/assets/README.md

```sh
# download the original svg
curl https://raw.githubusercontent.com/feathericons/feather/master/icons/youtube.svg > app/assets/original.svg

# convert to png with different sizes
for px in 32 192 512; do
  convert -density 1000 -resize "${px}x${px}" -background none app/assets/original.svg "app/assets/icon-${px}.png"
done
```
