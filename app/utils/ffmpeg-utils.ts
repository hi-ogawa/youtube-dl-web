import { FFmpeg, createFFmpeg } from "@ffmpeg/ffmpeg";
import { useQuery } from "@tanstack/react-query";

// https://github.com/ffmpegwasm/ffmpeg.wasm

export class FFmpegWrapper {
  constructor(private ffmpeg: FFmpeg) {}

  static async create(): Promise<FFmpegWrapper> {
    const ffmpeg = createFFmpeg({
      // cf. scripts/copy-assets.sh
      //     app/entry.server.tsx (coop/coep headers)
      corePath: "/_copy/ffmpeg-core.js",
    });
    await ffmpeg.load();
    return new FFmpegWrapper(ffmpeg);
  }

  // https://github.com/hi-ogawa/youtube-dl-web/issues/14#issue-1410399566
  async createMp3(
    data: ArrayBuffer,
    ext: string,
    metadata: Metadata,
    onProgress?: (progress: ProgressHandler) => void
  ): Promise<ArrayBuffer> {
    const inFilePath = `in.${ext}`;
    const coverPath = "cover.jpg";
    const outFilePath = "out.mp3";
    this.ffmpeg.FS("writeFile", inFilePath, new Uint8Array(data));
    let args: string[];
    if (metadata.cover) {
      // ffmpeg -i in.mp4 -i cover.jpg -map 0:0 -map 1:0 -c:v copy -id3v2_version 3 -metadata artist=xxx -metadata title=yyy -metadata:s:v title='Album cover' -metadata:s:v comment='Cover (front)' out.mp3
      this.ffmpeg.FS("writeFile", coverPath, new Uint8Array(metadata.cover));
      args = [
        "-y",
        "-i",
        inFilePath,
        "-i",
        coverPath,
        ..."-map 0:0 -map 1:0 -c:v copy -id3v2_version 3".split(" "),
        "-metadata",
        `artist=${metadata.artist}`, // TODO: escape quote?
        "-metadata",
        `title=${metadata.title}`,
        "-metadata:s:v",
        "title=Album cover",
        "-metadata:s:v",
        "comment=Cover (front)",
        outFilePath,
      ];
    } else {
      // ffmpeg -i in.mp4 -id3v2_version 3 -metadata artist=xxx -metadata title=yyy out.mp3
      args = [
        "-y",
        "-i",
        inFilePath,
        "-metadata",
        `artist=${metadata.artist}`, // TODO: escape quote?
        "-metadata",
        `title=${metadata.title}`,
        outFilePath,
      ];
    }
    const progress = new ProgressHandler();
    this.ffmpeg.setProgress((p) => {
      progress.handle(p);
      onProgress?.(progress);
    });
    await this.ffmpeg.run(...args);
    const dataMp3 = this.ffmpeg.FS("readFile", outFilePath);
    return dataMp3;
  }
}

//
// :: example log ::
//
// {duration: 213.3, ratio: 0}
// {duration: 0.04, ratio: 0}
// {ratio: 426.99999999999994, time: 17.08}
// {ratio: 853.9999999999999, time: 34.16}
// {ratio: 1282.5, time: 51.3}
// {ratio: 1709.4999999999998, time: 68.38}
// {ratio: 2119.7499999999995, time: 84.78999999999999}
// {ratio: 2531.25, time: 101.25}
// {ratio: 2934.75, time: 117.39}
// {ratio: 3325.2499999999995, time: 133.01}
// {ratio: 3700.75, time: 148.03}
// {ratio: 4071.75, time: 162.87}
// {ratio: 4455.75, time: 178.23}
// {ratio: 4830, time: 193.2}
// {ratio: 5211.25, time: 208.45}
// {ratio: 5332.75, time: 213.31}
// {ratio: 1}
//

interface ProgressRawData {
  ratio: number;
  duration?: number;
  time?: number;
}

class ProgressHandler {
  current: number = 0;
  total: number = 0;

  handle(data: ProgressRawData): void {
    if (!this.total && data.duration) {
      this.total = data.duration;
    } else if (data.ratio && data.time) {
      this.current = data.time;
    } else if (data.ratio === 1 && !data.time) {
      this.current = this.total;
    }
  }
}

// duration ===
// ratio === 1
// typeof time === "undefined"

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
    onError: (e: any) => {
      window.alert("[ERROR:useFFmpeg] " + e.toString());
    },
  });
}
