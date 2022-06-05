import { useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/server-runtime";
import { pick } from "lodash";
import React from "react";
import { z } from "zod";
import { createLoader } from "../utils/loader-utils";
import {
  VideoInfo,
  fetchVideoInfo,
  getThumbnailUrl,
  parseVideoId,
} from "../utils/youtube";

const REQUEST_SCHEMA = z.object({
  video: z.string(),
});

interface LoaderData {
  videoInfo: VideoInfo;
}

export const loader = createLoader(async function (this) {
  const parsed = REQUEST_SCHEMA.safeParse(this.getQuery());
  if (!parsed.success) {
    // TODO: error message
    console.log("invalid request", parsed.error);
    return redirect("/");
  }

  const videoId = parseVideoId(parsed.data.video);
  if (!videoId) {
    // TODO: error message
    console.log("invalid videoId", parsed.data);
    return redirect("/");
  }

  const videoInfo = await fetchVideoInfo(videoId);
  const res: LoaderData = { videoInfo };
  return res;
});

const Page: React.FC = () => {
  const { videoInfo }: LoaderData = useLoaderData();
  const { id, title, uploader, artist } = videoInfo;
  return (
    <div className="w-full max-w-lg flex flex-col gap-2">
      <VideoComponent id={id} title={title} author={artist ?? uploader} />
      <table className="table table-compact w-full">
        <thead>
          <tr>
            <th>Extension</th>
            <th>File size</th>
            <th>Resolution</th>
          </tr>
        </thead>
        <tbody>
          {videoInfo.formats.map((f) => (
            <tr key={f.format_id}>
              <td>
                {/* cross origin resource is proxied so that we can use `download` attributes */}
                {/* TODO: goal is to fetch blob entirely on client and run emscripten-ffmpeg to edit metadata */}
                <a
                  className="btn btn-link"
                  href={"/proxy?" + new URLSearchParams(pick(f, "url"))}
                  download={`${videoInfo.title}.${f.ext}`}
                >
                  {f.ext}
                </a>
              </td>
              <td>{formatBytes(f.filesize)}</td>
              <td>
                {f.width && f.height && `${f.width}x${f.height}`}
                {f.acodec === "none" && " (no audio)"}
                {f.vcodec === "none" && " (no video)"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Page;

const BYTE_UNITS: [number, string][] = [
  [10 ** 9, "GB"],
  [10 ** 6, "MB"],
  [10 ** 3, "KB"],
];

function formatBytes(x: number): string {
  for (const [scale, suffix] of BYTE_UNITS) {
    if (x >= scale) {
      return (x / scale).toPrecision(3) + suffix;
    }
  }
  return String(x) + "B";
}

// cf. https://github.com/hi-ogawa/ytsub-v3/blob/f55c6bbffddb468e98030f7e28d460bbf9cec6ce/app/components/misc.tsx#L19
const VideoComponent: React.FC<{
  id: string;
  title: string;
  author: string;
}> = (props) => {
  const { id, title, author } = props;

  /*
    Layout

    <- 16 -> <--- 20 --->
    ↑        ↑
    9 (cover)|
    ↓        ↓
   */

  return (
    <div
      className="relative w-full flex border"
      style={{ aspectRatio: "36 / 9" }}
    >
      <div className="flex-none w-[44%] relative aspect-video overflow-hidden">
        <div className="w-full h-full">
          <img
            className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            src={getThumbnailUrl(id)}
          />
        </div>
      </div>
      <div className="grow p-2 flex flex-col relative text-sm">
        <div className="line-clamp-2 mb-2">{title}</div>
        <div className="line-clamp-1 text-gray-600 text-xs pr-8">{author}</div>
      </div>
    </div>
  );
};
