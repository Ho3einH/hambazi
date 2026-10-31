import { demoUserSchema, signInSchema, signUpSchema } from "@/lib/validation";

const API_ROOT = "https://dummyjson.com";

export interface DemoUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image?: string;
  accessToken?: string;
}

async function readResponse(response: Response): Promise<DemoUser> {
  const body: unknown = await response.json().catch(() => ({}));
  const message =
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message
      : null;
  if (!response.ok) throw new Error(message || "The demo service could not complete this request.");
  const user = demoUserSchema.safeParse(body);
  if (!user.success) throw new Error("The demo service returned an unexpected user profile.");
  return user.data;
}

export async function signIn(username: string, password: string): Promise<DemoUser> {
  const credentials = signInSchema.parse({ username, password });
  const response = await fetch(`${API_ROOT}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...credentials, expiresInMins: 60 }),
  });
  const user = await readResponse(response);
  if (user.accessToken) window.sessionStorage.setItem("hambazi-demo-token", user.accessToken);
  return user;
}

export async function signUp(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<DemoUser> {
  const validated = signUpSchema.parse({
    name: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email,
    password: input.password,
  });
  const username =
    validated.email
      .split("@")[0]
      .replace(/[^a-z0-9._-]/gi, "")
      .slice(0, 20) || `player${Date.now()}`;
  const response = await fetch(`${API_ROOT}/users/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password: input.password,
      firstName: validated.name.split(/\s+/)[0],
      lastName: validated.name.split(/\s+/).slice(1).join(" ") || validated.name.split(/\s+/)[0],
      email: validated.email,
    }),
  });
  return readResponse(response);
}

export const DEMO_CREDENTIALS = { username: "emilys", password: "emilyspass" };
