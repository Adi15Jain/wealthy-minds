import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    secret: env.AUTH_SECRET,
    providers: [
        Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (
                    typeof credentials?.email !== "string" ||
                    typeof credentials?.password !== "string"
                ) {
                    return null;
                }

                const email = credentials.email.trim().toLowerCase();
                const password = credentials.password;
                if (!email || !password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                // User not found, or Google-only account (no password set).
                if (!user?.passwordHash) {
                    return null;
                }

                const isValid = await verifyPassword(
                    password,
                    user.passwordHash,
                );
                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    pages: {
        signIn: "/auth/login",
        newUser: "/onboarding",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
});
