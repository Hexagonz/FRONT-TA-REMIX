import { FormStrategy } from "remix-auth-form";
import { Authenticator } from "remix-auth";
import { User } from "~/@types/user";
import { axios } from "~/axios.services";

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
      role: data.data.role,
    };
  }),
  "user-pass"
);

// export async function requireAuth({
//   request,
//   context,
//   next,
// }: MiddlewareFunctionArgs) {
//   const session = await getSession(request.headers.get("cookie"));
//   const accessToken = session.get("access_token");

//   const cookies = parse(request.headers.get("cookie") || "");
//   const refreshToken = cookies.refreshToken;

//   if (!accessToken && !refreshToken) {
//     return redirect("/login");
//   }

//   try {
//     await axios.post("/verify", null, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });
//     return next();
//   } catch {
//     try {
//       const { data } = await axios.post("/refresh", null, {
//         headers: { Authorization: `Bearer ${refreshToken}` },
//       });
//       session.set("access_token", data.data.access_token);
//       const originalResponse = await next();
//       const updatedResponse = new Response(originalResponse.body, {
//         status: originalResponse.status,
//         headers: new Headers(originalResponse.headers),
//       });

//       updatedResponse.headers.set("Set-Cookie", await commitSession(session));
//       return updatedResponse;
//     } catch {
//       const headers = new Headers();
//       headers.append("Set-Cookie", await destroySession(session));
//       headers.append(
//         "Set-Cookie",
//         "refreshToken=; HttpOnly; Secure; Path=/; Max-Age=0; SameSite=Lax"
//       );
//       return redirect("/login", { headers });
//     }
//   }
// }
