import { useLoaderData } from "@remix-run/react";
import { redirect } from "@remix-run/server-runtime";
import { sortBy } from "lodash";
import React from "react";
import { AlertCircle, Download, X } from "react-feather";
import { z } from "zod";
import { createLoader } from "../utils/loader-utils";
import { fetchByRangesInParallel } from "../utils/range-request";
import {
  FormatInfo,
  VideoInfo,
  fetchVideoInfo,
  getThumbnailUrl,
  parseVideoId,
} from "../utils/youtube";

//
// loader
//

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

//
// page
//

const Page: React.FC = () => {
  const { videoInfo }: LoaderData = useLoaderData();
  const { id, title, uploader, artist, formats } = videoInfo;
  const sortedFormats = React.useMemo(
    () => sortBy(formats, (f) => (f.filesize ? 0 : 1)),
    [formats]
  );

  return (
    <div className="w-full max-w-lg flex flex-col gap-2">
      <VideoComponent id={id} title={title} author={artist ?? uploader} />
      <div className="w-full overflow-x-auto">
        <table className="w-full table table-compact">
          <thead>
            <tr>
              <th></th>
              <th>Extension</th>
              <th>File size</th>
              <th>Resolution</th>
            </tr>
          </thead>
          <tbody>
            {sortedFormats.map((f) => (
              <tr key={f.url + f.format_id}>
                <td>
                  <DownloadButton title={title} formatInfo={f} />
                </td>
                <td>
                  {
                    <span className={f.ext === "m4a" ? "text-gray-400" : ""}>
                      {f.ext}
                    </span>
                  }
                </td>
                <td>
                  {f.filesize ? (
                    formatBytes(f.filesize)
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
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
    </div>
  );
};

export default Page;

//
// utils
//

type DownloadState = "initial" | "loading" | "loaded";

const DownloadButton: React.FC<{ title: string; formatInfo: FormatInfo }> = (
  props
) => {
  const { filesize, url, ext } = props.formatInfo;

  const [state, setState] = React.useState<DownloadState>("initial");
  const [progress, setProgress] = React.useState(0);
  const [blobUrl, setBlobUrl] = React.useState<string>();
  const streamRef = React.useRef<ReadableStream<Uint8Array>>();

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.cancel();
        streamRef.current = undefined;
      }
    };
  }, []);

  async function startDownload() {
    if (!filesize) {
      return;
    }
    setState("loading");
    const proxyUrl = "/proxy?" + new URLSearchParams({ url });
    const stream = fetchByRangesInParallel(proxyUrl, filesize);
    streamRef.current = stream;

    const reader = stream.getReader();
    let acc = 0;
    const chunks: Uint8Array[] = [];
    while (streamRef.current === stream) {
      const result = await reader.read();
      if (result.done) {
        streamRef.current = undefined;
        setBlobUrl(URL.createObjectURL(new Blob(chunks)));
        setState("loaded");
        break;
      }
      acc += result.value.length;
      chunks.push(result.value);
      setProgress(acc);
    }
  }

  function cancelDownload() {
    setState("initial");
    if (streamRef.current) {
      // TODO: obviously `cannot` cancel during reading in `startDownload` above:
      //   TypeError: Failed to execute 'cancel' on 'ReadableStream': Cannot cancel a locked stream
      streamRef.current.cancel();
      streamRef.current = undefined;
    }
  }

  // TODO: m4a fails
  if (!filesize || ext === "m4a") {
    return (
      <button className="relative btn btn-sm btn-ghost btn-disabled" disabled>
        <Download size={20} />
      </button>
    );
  }

  if (state === "initial") {
    return (
      <button className="relative btn btn-sm btn-ghost" onClick={startDownload}>
        <Download size={20} />
      </button>
    );
  }

  if (state === "loading") {
    return (
      <button
        className="relative btn btn-sm btn-ghost flex justify-center items-center"
        onClick={cancelDownload}
      >
        <X size="20" />
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[24px] h-[24px]">
          <RadialProgress
            className="w-[24px] h-[24px]"
            progress={progress / filesize}
          />
        </div>
      </button>
    );
  }

  if (state === "loaded" && blobUrl) {
    return (
      <a
        className="btn btn-sm btn-primary"
        href={blobUrl}
        download={`${props.title}.${props.formatInfo.ext}`}
      >
        <Download size={20} />
      </a>
    );
  }

  // unexpected state
  return (
    <button className="btn btn-sm btn-ghost" onClick={cancelDownload}>
      <AlertCircle size={20} />
    </button>
  );
};

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

// cf. https://github.com/hi-ogawa/ytsub-v3/pull/159
export const RadialProgress: React.FC<{
  progress: number;
  className: string;
}> = (props) => {
  const deg = Math.floor(360 * props.progress);

  if (deg <= 180) {
    // prettier-ignore
    return (
      <div className={`${props.className} relative`} style={{ transform: "rotate(45deg)" }}>
        <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-transparent border-b-primary border-l-primary" style={{ transform: `rotate(${deg}deg)` }} />
        {/* TODO: above color leaks below */}
        <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-transparent border-gray-200 border-gray-200" />
      </div>
    );
  }

  // prettier-ignore
  return (
    <div className={`${props.className} relative`} style={{ transform: "rotate(45deg)" }}>
      <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-transparent border-b-primary border-l-primary" style={{ transform: `rotate(${deg}deg)` }} />
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-transparent border-b-primary border-l-primary" style={{ transform: `rotate(180deg)`    }} />
    </div>
  );
};
