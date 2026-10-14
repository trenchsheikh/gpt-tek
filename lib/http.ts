import { auth } from "./auth";
import { publicError } from "./public-error";
export async function user() {
  const s = await auth();
  if (!s?.user?.id) throw new Error("Sign in to continue.");
  return s.user.id;
}
export function fail(e: unknown) {
  const message = publicError(e);
  return Response.json(
    { error: message },
    {
      status: message.includes("Sign in") ? 401 : 400,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
export function sameOrigin(r: Request) {
  if (r.headers.get("origin") !== new URL(r.url).origin)
    throw new Error("Invalid request origin");
}
