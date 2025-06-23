import { FormStrategy } from "remix-auth-form";
import { Authenticator } from "remix-auth";
import { User } from "~/@types/user";
import axios from "~/axios.services";
import { type MiddlewareFunctionArgs } from "remix-create-express-app/middleware";
import { commitSession, destroySession, getSession } from "~/session.services";
import { json, redirect } from "@remix-run/node";
import { parse } from "cookie";

export const authenticator = new Authenticator<User>();

// Tell the Authenticator to use the form strategy
authenticator.use(
  new FormStrategy(async ({ form }) => {
    const username = form.get("username") as string;
    const password = form.get("password") as string;
    if (!username || !password) {
      throw new Error("Email and password are required");
    }
    const { data } = await axios.post("/login", {
      username,
      password,
    });
    return {
      access_token: data.data.accses_token,
      refresh_token: data.data.refresh_token,
    };
    // the type of this user must match the type you pass to the
    // Authenticator the strategy will automatically inherit the type if
    // you instantiate directly inside the `use` method
  }),
  // each strategy has a name and can be changed to use the same strategy
  // multiple times, especially useful for the OAuth2 strategy.
  "user-pass"
);

export async function requireAuth({
  request,
  context,
  next,
}: MiddlewareFunctionArgs) {
  const cookieHeader = request.headers.get("cookie");
  const session = await getSession(cookieHeader);
  const accessToken = session.get("access_token");
  const cookies = parse(cookieHeader || "");
  const refreshToken = cookies.refreshToken;
  try {
    // Verifikasi token
    await axios.post("/verify", null, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return next();
  } catch {
    try {
      // Refresh token
      const { data } = await axios.post("/refresh", null, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
      session.set("access_token", data.data.access_token);
      session.set("refresh_token", refreshToken);

      const originalResponse = await next();
      const newResponse = new Response(originalResponse.body, {
        status: originalResponse.status,
        headers: new Headers(originalResponse.headers),
      });

      newResponse.headers.append("Set-Cookie", await commitSession(session));
      newResponse.headers.append(
        "Set-Cookie",
        `refreshToken=${refreshToken}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=3600;`
      );

      return newResponse;
    } catch {
      // Refresh gagal → logout
      const headers = new Headers();
      headers.append("Set-Cookie", await destroySession(session));
      headers.append(
        "Set-Cookie",
        "refreshToken=; HttpOnly; Secure; Path=/; SameSite=lax; Max-Age=3600;"
      );

      const isJson = request.headers
        .get("accept")
        ?.includes("application/json");

      if (isJson) {
        return json({ error: "Unauthorized" }, { status: 401, headers });
      }

      return redirect("/login", { headers });
    }
  }
}
