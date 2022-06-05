import { LoaderFunction } from "@remix-run/server-runtime";
import * as qs from "qs";

class Controller {
  constructor(public request: Request) {}

  getQuery(): any {
    const { search } = new URL(this.request.url);
    return qs.parse(search, { allowDots: true, ignoreQueryPrefix: true });
  }
}

export function createLoader(
  method: (this: Controller) => any
): LoaderFunction {
  return async (loaderArgs) => {
    const { request } = loaderArgs;
    const controller = new Controller(request);
    return await method.apply(controller);
  };
}
