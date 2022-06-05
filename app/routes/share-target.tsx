import { redirect } from "@remix-run/server-runtime";
import { z } from "zod";
import { createLoader } from "../utils/loader-utils";
import { parseVideoId } from "../utils/youtube";

const REQUEST_SCHEMA = z.object({
  // see manifest.json
  "share-target-text": z.string(),
});

export const loader = createLoader(async function (this) {
  const parsed = REQUEST_SCHEMA.safeParse(this.getQuery());
  if (parsed.success) {
    const videoId = parseVideoId(parsed.data["share-target-text"]);
    if (videoId) {
      return redirect("/download?video=" + videoId);
    }
  }
  console.error("invalid share data");
  return redirect("/");
});
