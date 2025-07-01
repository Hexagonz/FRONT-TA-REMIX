import { createCookieSessionStorage } from "@remix-run/node";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session", // Anda dapat memilih nama lain
    secure: process.env.NODE_ENV === "production",
    // secrets: ["YOUR_SESSION_SECRET"], // Ganti dengan secret yang kuat
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    httpOnly: true,
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

