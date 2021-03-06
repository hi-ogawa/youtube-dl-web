import { RemixServer } from "@remix-run/react";
import { HandleDocumentRequestFunction } from "@remix-run/server-runtime";
import React from "react";
import { renderToString } from "react-dom/server";

const handler: HandleDocumentRequestFunction = (
  request,
  responseStatusCode,
  responseHeaders,
  remixContext
) => {
  const html = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );
  responseHeaders.set("content-type", "text/html");
  return new Response("<!DOCTYPE html>" + html, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
};

export default handler;
