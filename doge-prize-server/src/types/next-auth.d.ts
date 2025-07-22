import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    password?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

declare module "next-auth/providers/credentials" {
  interface RequestInternal {
    ip?: string;
    body?: any;
    query?: any;
    headers?: any;
    method?: string;
  }
} 