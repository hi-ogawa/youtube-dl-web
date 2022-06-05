import { chunk, range, sum } from "lodash";
import { tinyassert } from "./tinyassert";

//
// google's media resource is significantly throttled with http.
// http3/quic is expected to be used for fast download (cf. https://github.com/hi-ogawa/misc/blob/master/archlinux-packages/curl-quiche/README.md)
// no support on nodejs yet https://github.com/nodejs/node/pull/38233
// so, we use adhoc range requests in parallel.
//

//
// other factors to tweak chunk/parallel size
// - vercel serverless function timeouts in 10 seconds
// - aws lambda supports up to 6MB payload
//

const CHUNK_SIZE = 50_000;
const PARALLEL = 2;

// TODO: let the caller concatenate the results by returning ReadableStream<{ offset: number, data: Uint8Array }>
export function fetchByRangesInParallel(
  url: string,
  totalSize: number
): ReadableStream<Uint8Array> {
  const numChunks = Math.floor(totalSize / CHUNK_SIZE);
  const rangeHeaders = range(numChunks).map((i) => {
    const b1 = CHUNK_SIZE * i;
    const b2 = Math.min(CHUNK_SIZE * (i + 1), totalSize) - 1;
    return `bytes=${b1}-${b2}`;
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
        const res = await fetch(url, { headers: { range: rangeHeader } });
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

// unused
export async function fetchTotalSize(url: string): Promise<number> {
  const res = await fetch(url, { headers: { range: "bytes=0-0" } });
  tinyassert(res.ok);

  const contentRange = res.headers.get("content-range");
  tinyassert(contentRange);

  const totalMatch = contentRange.match(/bytes 0-0\/(\d*)/);
  tinyassert(totalMatch);

  return Number(totalMatch[1]);
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
