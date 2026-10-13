import { market } from "@/lib/market";
import { fail } from "@/lib/http";
export async function GET() {
  try {
    return Response.json(await market(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return fail(e);
  }
}
