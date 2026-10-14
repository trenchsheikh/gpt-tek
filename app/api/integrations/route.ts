import { z } from "zod";
import { integrationNames, integrationInfo } from "@/lib/integrations";
import { integrationData } from "@/lib/integration-data";
import { user, sameOrigin, fail } from "@/lib/http";
import { limit } from "@/lib/limit";
export async function GET() {
  return Response.json(integrationNames.map(integrationInfo));
}
export async function POST(r: Request) {
  try {
    sameOrigin(r);
    const uid = await user();
    await limit(`integration:${uid}`, 30, 3600);
    const b = z
      .object({
        integration: z.enum(integrationNames),
        market: z.string().max(80).optional(),
        target: z.string().max(80).optional(),
      })
      .parse(await r.json());
    return Response.json(await integrationData(b));
  } catch (e) {
    return fail(e);
  }
}
