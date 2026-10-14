import { db } from "./db";
import type { Preferences } from "./builder-journey";
import type { z } from "zod";
import type { planSchema } from "./agent-plan";
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type BuilderChat = {
  id: string;
  title: string;
  messages: ChatMessage[];
  plan: z.infer<typeof planSchema> | null;
  reasons: Record<string, string>;
  preferences: Preferences;
  step: number;
  revision: number;
};
export async function getChat(
  id: string,
  owner: string,
): Promise<BuilderChat | null> {
  const r = await db().query(
    "SELECT id,title,messages,plan,reasons,preferences,step,revision FROM builder_chats WHERE id=$1 AND owner=$2",
    [id, owner],
  );
  return r.rows[0] || null;
}
export async function saveChat(chat: BuilderChat, owner: string) {
  const r = await db().query(
    `INSERT INTO builder_chats(id,owner,title,messages,plan,reasons,preferences,step,revision)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,1)
    ON CONFLICT(id) DO UPDATE SET messages=EXCLUDED.messages,plan=EXCLUDED.plan,reasons=EXCLUDED.reasons,preferences=EXCLUDED.preferences,step=EXCLUDED.step,revision=builder_chats.revision+1,updated_at=now()
    WHERE builder_chats.owner=$2 AND builder_chats.revision=$9 RETURNING revision`,
    [
      chat.id,
      owner,
      chat.title,
      JSON.stringify(chat.messages),
      JSON.stringify(chat.plan),
      JSON.stringify(chat.reasons),
      JSON.stringify(chat.preferences),
      chat.step,
      chat.revision,
    ],
  );
  if (!r.rows.length)
    throw new Error(
      "This conversation changed. Reopen it before sending another message.",
    );
  return { ...chat, revision: r.rows[0].revision };
}
