import { auth } from "./firebase";
import {
  RESPONSE_SCHEMA,
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseReflection,
  type Reflection,
  type ReflectionInput,
} from "./reflection";

/**
 * The Worker endpoint. Only the URL is public — the OpenAI key lives as a
 * secret on the Worker, because anything shipped to the browser is readable by
 * everyone who loads the page.
 */
export const ENDPOINT = import.meta.env.VITE_REFLECTION_ENDPOINT ?? "";

export const isConfigured = () => ENDPOINT.length > 0;

export class ReflectionError extends Error {}

export const requestReflection = async (input: ReflectionInput): Promise<Reflection> => {
  if (!isConfigured()) {
    throw new ReflectionError("Reflections are not set up for this build.");
  }

  const user = auth.currentUser;
  if (!user) {
    throw new ReflectionError("Sign in to request a reflection.");
  }

  // The Worker verifies this against Google's public keys before spending the
  // key, so the endpoint cannot be used by anyone who is not signed in here.
  const token = await user.getIdToken();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(input),
      schema: RESPONSE_SCHEMA,
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ReflectionError(
      (detail as { error?: string } | null)?.error ?? "The reflection could not be written."
    );
  }

  const body = (await res.json()) as { reflection?: unknown };
  const reflection = parseReflection(body.reflection);
  if (!reflection) {
    throw new ReflectionError("The reflection came back in a shape we could not read.");
  }
  return reflection;
};
