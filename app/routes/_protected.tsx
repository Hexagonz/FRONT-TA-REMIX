import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { parse } from "cookie";

import {
  getSession,
  commitSession,
  destroySession,
} from "~/services/session.services";
import { axios } from "~/services/axios.services";

async function logoutAndRedirect(request: Request) {
  const session = await getSession(request.headers.get("cookie"));
  const headers = new Headers();
  headers.append("Set-Cookie", await destroySession(session));
  headers.append(
    "Set-Cookie",
    "refreshToken=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax"
  );
  throw redirect("/login", { headers });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("cookie"));
  let accessToken = session.get("access_token");
  const role = session.get("role");
  const cookies = parse(request.headers.get("cookie") || "");
  const refreshToken = cookies.refreshToken;

  if (!accessToken && refreshToken) {
    try {
      const { data } = await axios.post("/refresh", null, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });
      accessToken = data.data.access_token;
      session.set("access_token", accessToken);
    } catch (err) {
      return await logoutAndRedirect(request);
    }
  }

  if (!accessToken && !refreshToken) {
    return await logoutAndRedirect(request);
  }

  try {
    await axios.post("/verify", null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    return await logoutAndRedirect(request);
  }

  const allowedRoles = ["admin", "super_admin"];
  if (!role || !allowedRoles.includes(role)) {
    throw new Response("Forbidden", {
      statusText: "Akses Ditolak",
      status: 403,
    });
  }

  // Set-Cookie baru jika session diperbarui
  const headers = new Headers();
  headers.append("Set-Cookie", await commitSession(session));

  return json({ role }, { headers });
}

export default function ProtectedLayout() {
  return (
    <div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
