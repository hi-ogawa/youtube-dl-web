import { LoaderFunction, json } from "@remix-run/server-runtime";

export const loader: LoaderFunction = () => {
  return json({ success: true });
};
