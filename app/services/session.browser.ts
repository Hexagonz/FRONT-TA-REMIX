
export const sessionStorages = {
  getSession: (key: string): string | null => {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split("; ");
    const found = cookies.find((cookie) => cookie.startsWith(`${key}=`));
    return found ? decodeURIComponent(found.split("=")[1]) : null;
  },

  commitSession: (key: string, value: string, options: { maxAge?: number } = {}) => {
    if (typeof document === "undefined") return;

    const cookie = `${key}=${encodeURIComponent(value)}; Path=/; ${
      options.maxAge ? `Max-Age=${options.maxAge};` : ""
    }`;

    document.cookie = cookie;
  },

  destroySession: (key: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; Max-Age=0; Path=/;`;
  },
};
