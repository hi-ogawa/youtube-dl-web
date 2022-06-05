import { redirect } from "@remix-run/server-runtime";
import { z } from "zod";
import { createLoader } from "../utils/loader-utils";

//
// proxy for cross origin resouce
//

const REQUEST_SCHEMA = z.object({
  url: z.string().url(),
});

const PASSTHROUGH_HEADERS = ["range"];

export const loader = createLoader(async function (this) {
  const parsed = REQUEST_SCHEMA.safeParse(this.getQuery());
  if (!parsed.success) {
    console.error("invalid request", parsed.error);
    return redirect("/");
  }
  const { url } = parsed.data;
  const headers = new Headers();
  for (const key of PASSTHROUGH_HEADERS) {
    const value = this.request.headers.get(key);
    if (value) {
      headers.append(key, value);
    }
  }
  return fetch(url, { headers });
});
