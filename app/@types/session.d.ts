declare global {
  type SessionData = {
    role?: "super_admin" | "guru" | "siswa" | "admin";
    access_token?: string;
    refresh_token?: string;
  };

  type SessionFlashData = {
    error: string;
  };
}

export {}