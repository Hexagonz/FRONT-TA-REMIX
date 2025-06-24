import { createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // secrets: [
    //   process.env.SESSION_SECRET ||
    //     ("s%3A432.D5egYRj1G7sJyfbyB7jDh7Gf" as string),
    // ],
    secure: false,
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;

export async function getUserFromSession(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("cookie"));
  const access_token = session.get("access_token");
  const role = session.get("role");

  if (!access_token || !role) return null;

  return { role }; 
}

