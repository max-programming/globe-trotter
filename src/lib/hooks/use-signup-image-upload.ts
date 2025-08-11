import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { uploadImageForSignUp } from "~/server-functions/image-upload";

interface ImageUploadResult {
  imageUrl: string;
  deleteUrl?: string;
  thumbUrl?: string;
  mediumUrl?: string;
}

interface ImageUploadOptions {
  onSuccess?: (result: ImageUploadResult) => void;
  onError?: (error: string) => void;
  maxSizeMB?: number;
}

export function useSignUpImageUpload(options: ImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const uploadImageFn = useServerFn(uploadImageForSignUp);
  const { maxSizeMB = 5 } = options;

  async function uploadImage(file: File): Promise<ImageUploadResult | null> {
    try {
      setIsUploading(true);

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Only JPEG, PNG, and WebP images are allowed");
      }

      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Upload to ImgBB via server function (no auth required)
      const result = await uploadImageFn({
        data: {
          imageBase64: base64,
          fileName: file.name,
        },
      });

      setUploadedImageUrl(result.imageUrl);
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file
      uploadImage(file).catch(error => {
        console.error("Upload failed:", error);
      });
    }
  }

  function resetUpload() {
    setPreviewUrl(null);
    setUploadedImageUrl(null);
  }

  return {
    isUploading,
    previewUrl,
    uploadedImageUrl,
    uploadImage,
    handleFileSelect,
    resetUpload,
    setPreviewUrl,
  };
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}
