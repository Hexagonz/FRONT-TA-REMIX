import { serverOnly$ } from "vite-env-only/macros";
import { requireAuth } from "~/auth.services";

export const middleware = serverOnly$([requireAuth]);
