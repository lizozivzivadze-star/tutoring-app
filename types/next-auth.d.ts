import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "teacher" | "student" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    role: "teacher" | "student" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "teacher" | "student" | "admin";
  }
}
