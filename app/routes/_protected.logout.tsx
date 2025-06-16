// routes/logout.tsx
import { redirect, LoaderFunctionArgs } from "@remix-run/node";
import { destroySession, getSession } from "~/services/session.services";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: [
      ["Set-Cookie", await destroySession(session)],
      [
        "Set-Cookie",
        `refreshToken=; HttpOnly; Secure; Path=/; SameSite=Strict; sMax-Age=604800;`,
      ],
    ],
  });
}
