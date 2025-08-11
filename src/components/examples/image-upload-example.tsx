import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useImageUpload } from "~/lib/hooks/use-image-upload";
import { UserAvatar } from "~/components/ui/user-avatar";
import { Camera, X } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Example component demonstrating how to use the image upload functionality
 * This can be used as a reference for implementing image uploads in other parts of the app
 */
export function ImageUploadExample() {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const imageUpload = useImageUpload({
    onSuccess: result => {
      console.log("Upload successful:", result);
      setUploadedImageUrl(result.imageUrl);
    },
    onError: error => {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error}`);
    },
    maxSizeMB: 5,
  });

  const handleRemoveImage = () => {
    setUploadedImageUrl("");
    imageUpload.resetUpload();
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Image Upload Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <UserAvatar
                imageUrl={imageUpload.previewUrl || uploadedImageUrl}
                userName="Example User"
                size="xl"
                className="border-4 border-white shadow-xl"
              />

              {/* Upload Button */}
              <label
                htmlFor="example-image-upload"
                className={cn(
                  "absolute -bottom-2 -right-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full p-2 cursor-pointer hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105",
                  imageUpload.isUploading &&
                    "animate-pulse opacity-70 cursor-not-allowed"
                )}
              >
                <Camera className="w-4 h-4" />
              </label>

              <input
                id="example-image-upload"
                type="file"
                accept="image/*"
                onChange={imageUpload.handleFileSelect}
                className="hidden"
                disabled={imageUpload.isUploading}
              />

              {/* Upload Progress */}
              {imageUpload.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                  <div className="text-xs text-white font-medium bg-black/50 px-2 py-1 rounded">
                    Uploading...
                  </div>
                </div>
              )}

              {/* Remove Button */}
              {(imageUpload.previewUrl || uploadedImageUrl) &&
                !imageUpload.isUploading && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
            </div>

            {/* Status Display */}
            <div className="text-center space-y-2">
              {imageUpload.isUploading && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}

              {uploadedImageUrl && !imageUpload.isUploading && (
                <p className="text-sm text-green-600 font-medium">
                  Image uploaded successfully!
                </p>
              )}

              {uploadedImageUrl && (
                <p className="text-xs text-muted-foreground break-all">
                  URL: {uploadedImageUrl}
                </p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Instructions:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Click the camera icon to select an image</li>
              <li>Supported formats: JPEG, PNG, WebP</li>
              <li>Maximum size: 5MB</li>
              <li>Images are uploaded to ImgBB</li>
              <li>Click X to remove the uploaded image</li>
            </ul>
          </div>

          {/* Debug Info */}
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Preview URL: {imageUpload.previewUrl ? "Set" : "None"}</p>
            <p>Uploaded URL: {uploadedImageUrl || "None"}</p>
            <p>Uploading: {imageUpload.isUploading ? "Yes" : "No"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
