import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { signInSchema, signUpSchema } from "~/components/auth";
import { auth } from "~/lib/auth";

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });
    return session;
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
    await auth.api.signUpEmail({
      headers,
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });
  });
