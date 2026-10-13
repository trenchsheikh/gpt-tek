import { models } from "@/lib/models";
import { fail } from "@/lib/http";
export async function GET() {
  try {
    return Response.json(await models(), {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    return fail(e);
  }
}
