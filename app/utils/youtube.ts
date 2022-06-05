// https://github.com/ytdl-org/youtube-dl/blob/9aa8e5340f3d5ece372b983f8e399277ca1f1fe4/youtube_dl/extractor/youtube.py#L1819-L1830
export interface FormatInfo {
  url: string;
  filesize: number | null;
  format_id: string;
  format_note: string;
  ext: string;
  acodec: string; // none, opus, mp4a.40.2, ...
  vcodec: string; // none, vp9, av01.0.00M.08, ...
  width: number | null;
  height: number | null;
}

// https://github.com/ytdl-org/youtube-dl/blob/9aa8e5340f3d5ece372b983f8e399277ca1f1fe4/youtube_dl/extractor/youtube.py#L1958-L1986
export interface VideoInfo {
  id: string;
  title: string;
  uploader: string;
  artist?: string;
  album?: string;
  track?: string;
  formats: FormatInfo[];
}

export function parseVideoId(value: string): string | undefined {
  if (value.length === 11) {
    return value;
  }
  if (value.match(/youtube\.com|youtu\.be/)) {
    try {
      const url = new URL(value);
      if (url.hostname === "youtu.be") {
        return url.pathname.substring(1);
      } else {
        const videoId = url.searchParams.get("v");
        if (videoId) {
          return videoId;
        }
      }
    } catch {}
  }
  return;
}

// cf. https://github.com/hi-ogawa/youtube-dl-extract-info
const API_URL = "https://youtube-dl-extract-info-hiro18181.vercel.app";

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const res = await fetch(`${API_URL}/${videoId}`);
  if (res.ok) {
    return res.json();
  }
  throw new Error("fetchVideoInfo failed");
}

export function getThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
