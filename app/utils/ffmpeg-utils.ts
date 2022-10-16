import { FFmpeg, createFFmpeg } from "@ffmpeg/ffmpeg";
import { useQuery } from "@tanstack/react-query";

// https://github.com/ffmpegwasm/ffmpeg.wasm

export class FFmpegWrapper {
  constructor(private ffmpeg: FFmpeg) {}

  static async create(): Promise<FFmpegWrapper> {
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
    const inFilePath = `in.${ext}`;
    const outFilePath = "out.mp3";
    this.ffmpeg.FS("writeFile", inFilePath, new Uint8Array(data));
    const args = [
      "-y",
      "-i",
      inFilePath,
      "-metadata",
      `artist=${metadata.artist}`, // TODO: escape quote?
      "-metadata",
      `title=${metadata.title}`,
      outFilePath,
    ];
    await this.ffmpeg.run(...args);
    const dataMp3 = this.ffmpeg.FS("readFile", outFilePath);
    return dataMp3;
  }
}

export interface Metadata {
  artist: string;
  album?: string;
  title: string;
  cover?: ArrayBuffer;
}

export function useFFmpeg() {
  return useQuery({
    queryKey: [useFFmpeg.name],
    queryFn: FFmpegWrapper.create,
    staleTime: Infinity,
    cacheTime: Infinity,
  });
}
