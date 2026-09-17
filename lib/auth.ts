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

        if (role === "admin") {
          // Admins are looked up by identityEmail — the address typed
          // into the shared login form — not by notificationEmail,
          // which is only where the mail physically lands.
          const admin = await prisma.admin.findUnique({
            where: { identityEmail: email },
          });
          if (!admin) return null;
          return {
            id: admin.id,
            email: admin.identityEmail,
            name: admin.name,
            role: "admin" as const,
          };
        }

        if (role === "tester") {
          // Same identityEmail lookup as admin, for the same reason.
          const tester = await prisma.tester.findUnique({
            where: { identityEmail: email },
          });
          if (!tester) return null;
          return {
            id: tester.id,
            email: tester.identityEmail,
            name: tester.name,
            role: "tester" as const,
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
        token.role = (user as { role: "teacher" | "student" | "admin" | "tester" }).role;
        return token;
      }

      // Existing session, not a fresh sign-in: re-check that the
      // student account behind this token still exists. If it was
      // deleted (e.g. via group deletion), invalidate the token so
      // the browser is signed out automatically on the next request,
      // instead of the stale session lingering until it expires.
      if (token.role === "student" && token.uid) {
        const student = await prisma.student.findUnique({
          where: { id: token.uid as string },
        });
        if (!student) return null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as "teacher" | "student" | "admin" | "tester";
      }
      return session;
    },
  },
});
