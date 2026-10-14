import { ZodError } from "zod";
export function publicError(e: unknown) {
  if (e instanceof ZodError)
    return "Please check the form values and try again.";
  if (!(e instanceof Error)) return "Request failed. Please try again.";
  const code = (e as Error & { code?: string }).code;
  if (code === "23505")
    return "This request was already recorded. Refresh before retrying.";
  if (
    code ||
    /postgres|DATABASE_URL|connection string|password authentication|database is not configured|ECONN|ENOTFOUND|certificate|SSL|SQL|syntax error|relation .* does not exist/i.test(
      e.message,
    )
  )
    return "The service is temporarily unavailable. Please try again later.";
  if (/Bearer\s|sk-[\w-]+|sb_secret_|postgres(?:ql)?:\/\//i.test(e.message))
    return "Request failed. Please try again.";
  return e.message.slice(0, 300);
}
