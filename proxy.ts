import { NextResponse, type NextRequest } from "next/server";
import { appUrl, docsUrl } from "./lib/site-urls";
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = url.hostname;
  const path = url.pathname;
  const isDocs = host === "docs.agentrouter.trade";
  const isApp = host === "app.agentrouter.trade";
  const isWebsite = ["agentrouter.trade", "www.agentrouter.trade"].includes(
    host,
  );
  // API routes and static assets stay on their request origin, including auth cookies.
  if (
    path.startsWith("/api/") ||
    path.startsWith("/_next/") ||
    /\.[a-z0-9]+$/i.test(path)
  )
    return NextResponse.next();
  if (isDocs) {
    if (path === "/app")
      return NextResponse.redirect(new URL(appUrl + url.search), 307);
    if (path === "/docs" || path.startsWith("/docs/")) {
      url.pathname = path.slice(5) || "/";
      return NextResponse.redirect(url, 307);
    }
    url.pathname = path === "/" ? "/docs" : "/docs" + path;
    return NextResponse.rewrite(url);
  }
  if (isApp && path === "/") {
    url.pathname = "/app";
    return NextResponse.rewrite(url);
  }
  if (isApp && path === "/app") {
    url.pathname = "/";
    return NextResponse.redirect(url, 307);
  }
  if ((isWebsite || isApp) && (path === "/docs" || path.startsWith("/docs/")))
    return NextResponse.redirect(
      new URL((path.slice(5) || "/") + url.search, docsUrl),
      307,
    );
  if (isWebsite && path === "/app")
    return NextResponse.redirect(new URL(appUrl + url.search), 307);
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
