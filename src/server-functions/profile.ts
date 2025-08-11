import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { getWebRequest } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";
import { db, users } from "~/lib/db";
import {
  profileUpdateSchema,
  type ProfileUpdateFormData,
} from "~/components/settings/profile-schemas";

export const updateProfile = createServerFn({ method: "POST" })
  .validator(profileUpdateSchema)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { name, email, phone, cityId, countryId, additionalInfo, image } =
      data;

    // Update user profile
    await db
      .update(users)
      .set({
        name,
        email,
        phone,
        cityId,
        countryId,
        additionalInfo,
        image,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return { success: true };
  });

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        country: true,
        city: true,
      },
    });

    return user || null;
  }
);
