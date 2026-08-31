import { NextResponse } from "next/server";
import { z } from "zod";
import { formatZodError } from "./schemas";

/**
 * Strictly parse and validate a request body against a Zod schema.
 * Returns either `{ data }` or `{ errorResponse }` ready to `return` directly
 * from a route handler — callers never touch raw, unvalidated JSON.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { errorResponse: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      errorResponse: NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const { message, fields } = formatZodError(result.error);
    return {
      errorResponse: NextResponse.json({ error: message, fields }, { status: 400 }),
    };
  }

  return { data: result.data };
}
