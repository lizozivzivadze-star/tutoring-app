import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: "internal",
      name: "internal",
      credentials: {
        email: { label: "email", type: "text" },
        role: { label: "role", type: "text" },
        internalSecret: { label: "internalSecret", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const role = credentials?.role as string | undefined;
        const internalSecret = credentials?.internalSecret as
          | string
          | undefined;

        // This is the whole security model for this provider: it is
        // never called from a public form. Only our own server code
        // (in /api/auth/verify, right after checking a real one-time
        // token) knows this secret, so a crafted request straight to
        // NextAuth's credentials callback can't forge a session.
        if (
          !email ||
          !role ||
          !internalSecret ||
          internalSecret !== process.env.INTERNAL_AUTH_SECRET
        ) {
          return null;
        }

        if (role === "teacher") {
          const teacher = await prisma.teacher.findUnique({
            where: { email },
          });
          if (!teacher) return null;
          return {
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
            role: "teacher" as const,
          };
        }

        if (role === "student") {
          const student = await prisma.student.findUnique({
            where: { email },
          });
          if (!student) return null;
          return {
            id: student.id,
            email: student.email,
            name: student.name,
            role: "student" as const,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role: "teacher" | "student" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as "teacher" | "student";
      }
      return session;
    },
  },
});
