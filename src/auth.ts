import NextAuth from "next-auth";

// This app never signs users in: it only decodes the session JWT that roger.tw
// issues on the shared .roger.tw cookie, so no providers/adapter are configured.
export const { handlers, auth, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [],
  session: { strategy: "jwt" },
  cookies: process.env.AUTH_COOKIE_DOMAIN
    ? {
        sessionToken: {
          name: process.env.AUTH_COOKIE_NAME ?? "__Secure-authjs.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true,
            domain: process.env.AUTH_COOKIE_DOMAIN,
          },
        },
      }
    : undefined,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        if (token.picture) session.user.image = token.picture;
        session.user.role = typeof token.role === "string" ? token.role : "user";
      }
      return session;
    },
  },
});
