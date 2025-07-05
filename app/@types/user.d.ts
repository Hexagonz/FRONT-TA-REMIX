export type User = {
  role: "super_admin" | "guru" | "siswa" | "admin";
  access_token?: string;
  refresh_token?: string;
  username: string;
  name: string;
}

export {}