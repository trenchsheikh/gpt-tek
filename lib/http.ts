import { auth } from "./auth";
export async function user() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Sign in to continue.");
  return s.user.id;
}
export function fail(e: unknown) {
  const message = e instanceof Error ? e.message : "Request failed";
  return Response.json(
    { error: message },
    { status: message.includes("Sign in") ? 401 : 400 },
  );
}
export function sameOrigin(r: Request) {
  if (r.headers.get("origin") !== new URL(r.url).origin)
    throw new Error("Invalid request origin");
}
