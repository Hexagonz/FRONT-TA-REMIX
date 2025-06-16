declare global {
  type SessionData = {
    access_token?: string;
    refresh_token?: string;
  };

  type SessionFlashData = {
    error: string;
  };
}

export {}