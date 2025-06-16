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
