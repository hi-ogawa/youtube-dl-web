import BarOfProgress from "@badrap/bar-of-progress";
import {
  Form,
  LiveReload,
  Outlet,
  Scripts,
  useTransition,
} from "@remix-run/react";
import React from "react";
import { usePrevious } from "react-use";

const Page: React.FC = () => {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>youtube-dl-web</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <link
          rel="stylesheet"
          href={require("../build/tailwind/" +
            process.env.NODE_ENV +
            "/index.css")}
        />
        <link rel="icon" href="/_copy/icon-32.png" />
        <link rel="manifest" href="/_copy/manifest.json" />
      </head>
      <body className="h-full">
        <TopProgressBar />
        <div className="h-full flex flex-col gap-2 p-2">
          <div className="w-full flex justify-center">
            <div className="w-full max-w-lg">
              <SearchForm />
            </div>
          </div>
          <div className="w-full flex justify-center">
            <Outlet />
          </div>
        </div>
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
};

const SearchForm: React.FC = () => {
  return (
    <Form method="get" action="/download">
      <div className="form-control">
        <input
          type="text"
          name="video"
          className="input input-bordered input-sm"
          placeholder="Enter Video ID or URL"
        />
      </div>
    </Form>
  );
};

const TopProgressBar: React.FC = () => {
  const [barOfProgress] = React.useState(() => new BarOfProgress());
  const transition = useTransition();
  const loading = transition.state !== "idle";
  const prevLoading = usePrevious(loading);

  React.useEffect(() => {
    if (loading && !prevLoading) {
      barOfProgress.start();
    }
    if (!loading) {
      barOfProgress.finish();
    }
  }, [loading]);

  return null;
};

export default Page;
