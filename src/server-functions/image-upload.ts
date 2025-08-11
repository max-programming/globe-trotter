import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { auth } from "~/lib/auth";

const uploadImageSchema = z.object({
  imageBase64: z.string(),
  fileName: z.string().optional(),
});

// For authenticated users (profile updates)
export const uploadImageToImgBB = createServerFn({ method: "POST" })
  .validator(uploadImageSchema)
  .handler(async ({ data }) => {
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { imageBase64, fileName } = data;

    return await uploadToImgBB(imageBase64, fileName);
  });

// For sign-up (no authentication required)
export const uploadImageForSignUp = createServerFn({ method: "POST" })
  .validator(uploadImageSchema)
  .handler(async ({ data }) => {
    const { imageBase64, fileName } = data;
    return await uploadToImgBB(imageBase64, fileName);
  });

// Shared upload logic
async function uploadToImgBB(imageBase64: string, fileName?: string) {
  // Get ImgBB API key from environment
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("ImgBB API key not configured");
  }

  try {
    // Create form data for ImgBB API
    const formData = new FormData();
    formData.append("image", imageBase64);
    if (fileName) {
      formData.append("name", fileName.replace(/\.[^/.]+$/, "")); // Remove file extension
    }

    // Upload to ImgBB
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`ImgBB API error: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Failed to upload image to ImgBB");
    }

    return {
      imageUrl: result.data.url,
      deleteUrl: result.data.delete_url,
      thumbUrl: result.data.thumb?.url,
      mediumUrl: result.data.medium?.url,
    };
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
}
