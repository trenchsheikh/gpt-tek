import { z } from "zod";
import { db } from "@/lib/db";
import { getChat } from "@/lib/builder-chats";
import { nextChoices } from "@/lib/builder-journey";
import { user, fail } from "@/lib/http";
export async function GET(r: Request) {
  try {
    const owner = await user();
    const params = new URL(r.url).searchParams;
    if (params.has("id")) {
      const id = z.uuid().parse(params.get("id"));
      const chat = await getChat(id, owner);
      if (!chat)
        return Response.json(
          { error: "Conversation not found." },
          { status: 404 },
        );
      return Response.json(
        { ...chat, choices: nextChoices(chat.step) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const offset = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(params.get("offset") || 0);
    const result = await db().query(
      "SELECT id,title,updated_at FROM builder_chats WHERE owner=$1 ORDER BY updated_at DESC,id LIMIT 51 OFFSET $2",
      [owner, offset],
    );
    return Response.json(
      { chats: result.rows.slice(0, 50), hasMore: result.rows.length > 50 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e);
  }
}
