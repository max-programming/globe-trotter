import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { signInSchema, signUpSchema } from "~/components/auth";
import { auth } from "~/lib/auth";
import { updateUserPostSignUp } from "./db-functions/update-user-post-sign-up";
import { countries, db, users } from "~/lib/db";
import { eq } from "drizzle-orm";

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });
    let currencySign: string | null = null;
    if (session) {
      const currency = await db
        .select({
          currency: countries.currency,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .leftJoin(countries, eq(users.countryId, countries.id));

      currencySign = currency[0].currency;
    }
    return { ...session, currencySign };
  }
);

export const signIn = createServerFn({ method: "POST" })
  .validator(signInSchema)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest();
    await auth.api.signInEmail({
      headers,
      body: {
        email: data.email,
        password: data.password,
      },
    });
  });

export const signUp = createServerFn({ method: "POST" })
  .validator(signUpSchema)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest();
    const { user } = await auth.api.signUpEmail({
      headers,
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    await updateUserPostSignUp(user.id, data);
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { headers } = getWebRequest();
  await auth.api.signOut({ headers });
});
