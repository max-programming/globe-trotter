import { eq } from "drizzle-orm";
import type { SignUpFormData } from "~/components/auth";
import { db, users } from "~/lib/db";

export async function updateUserPostSignUp(
  userId: string,
  signUpData: SignUpFormData
) {
  const { phone, cityId, countryId, additionalInfo, image } = signUpData;

  await db
    .update(users)
    .set({
      phone,
      cityId,
      countryId,
      additionalInfo,
      image,
    })
    .where(eq(users.id, userId));
}
