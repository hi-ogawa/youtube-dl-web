import { FFmpeg, createFFmpeg } from "@ffmpeg/ffmpeg";
import { useQuery } from "@tanstack/react-query";

// https://github.com/ffmpegwasm/ffmpeg.wasm

export class FFmpegWrapper {
  constructor(private ffmpeg: FFmpeg) {}

  static async create(): Promise<FFmpegWrapper> {
    // TODO: cors header for emscripten wasm
    // { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
    // { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
    const ffmpeg = createFFmpeg({
      // cf. scripts/copy-assets.sh
      corePath: "/_copy/ffmpeg-core.js",
    });
    await ffmpeg.load();
    return new FFmpegWrapper(ffmpeg);
  }

  // https://github.com/hi-ogawa/youtube-dl-web/issues/14#issue-1410399566
  async createMp3(
    data: ArrayBuffer,
    ext: string,
    metadata: Metadata
  ): Promise<ArrayBuffer> {
    this.ffmpeg.run;
    throw new Error("todo");
  }
}

export interface Metadata {
  artist: string;
  album?: string;
  title: string;
  cover: ArrayBuffer;
}

export function useFFmpeg() {
  return useQuery({
    queryKey: [useFFmpeg.name],
    queryFn: FFmpegWrapper.create,
    staleTime: Infinity,
    cacheTime: Infinity,
  });
}
