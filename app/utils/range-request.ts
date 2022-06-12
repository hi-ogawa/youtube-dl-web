import { chunk, mapValues, range, sum } from "lodash";
import { tinyassert } from "./tinyassert";

// note that vercel's lambda timeouts in 10 seconds
const CHUNK_SIZE = 2_000_000;
const PARALLEL = 1;

// TODO: let the caller concatenate the results by returning ReadableStream<{ offset: number, data: Uint8Array }>
export function fetchByRanges(
  url: string,
  totalSize: number
): ReadableStream<Uint8Array> {
  const numChunks = Math.ceil(totalSize / CHUNK_SIZE);
  const rangeHeaders = range(numChunks).map((i) => {
    const range_start = CHUNK_SIZE * i;
    const range_end = Math.min(CHUNK_SIZE * (i + 1), totalSize) - 1;
    return { range_start, range_end };
  });

  const rangeHeadersParallels = chunk(rangeHeaders, PARALLEL);
  let i = 0;

  return new ReadableStream({
    async pull(controller) {
      if (i >= rangeHeadersParallels.length) {
        controller.close();
        return;
      }
      const parallels = rangeHeadersParallels[i++];
      const dataPromises = parallels.map(async (rangeHeader) => {
        const rangeUrl =
          url + "&" + new URLSearchParams(mapValues(rangeHeader, String));
        const res = await fetch(rangeUrl);
        tinyassert(res.ok);
        tinyassert(res.body);
        const arrayBuffer = await res.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      });
      const data = await Promise.all(dataPromises);
      controller.enqueue(concatArrays(data));
    },
  });
}

function concatArrays(arrays: Uint8Array[]): Uint8Array {
  const total = sum(arrays.map((a) => a.length));
  const res = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const array of arrays) {
    res.set(array, offset);
    offset += array.length;
  }
  return res;
}
