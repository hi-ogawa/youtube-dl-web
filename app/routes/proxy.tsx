import { z } from "zod";
import { createLoader } from "../utils/loader-utils";
import { tinyassert } from "../utils/tinyassert";

const PROXY_REQUEST_SCHEMA = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
});

export const action = createLoader(async function (this) {
  tinyassert(this.request.method === "POST");
  const { url, headers } = PROXY_REQUEST_SCHEMA.parse(
    await this.request.json()
  );
  const res = await fetch(url, { headers });
  return new Response(res.body, { status: res.status });
});
