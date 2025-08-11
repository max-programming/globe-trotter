import { useState } from "react";
import ImageSelector from "./image-selector";
import { Button } from "~/components/ui/button";

const ImageSelectorExample = () => {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    source: "upload" | "pexels";
    data?: any;
  } | null>(null);

  const handleImageSelect = (image: {
    url: string;
    source: "upload" | "pexels";
    data?: any;
  }) => {
    setSelectedImage(image);
    console.log("Selected image:", image);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Image Selector Demo</h2>

        <ImageSelector
          onImageSelect={handleImageSelect}
          trigger={
            <Button variant="outline" size="lg">
              🖼️ Choose Image
            </Button>
          }
        />

        {selectedImage && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Selected Image:</h3>

            <div className="flex gap-4">
              <img
                src={selectedImage.url}
                alt="Selected"
                className="w-32 h-32 object-cover rounded-lg"
              />

              <div className="space-y-2">
                <p>
                  <strong>Source:</strong> {selectedImage.source}
                </p>
                <p>
                  <strong>URL:</strong> {selectedImage.url}
                </p>

                {selectedImage.source === "pexels" && selectedImage.data && (
                  <>
                    <p>
                      <strong>Photographer:</strong>{" "}
                      {selectedImage.data.photographer}
                    </p>
                    <p>
                      <strong>Pexels ID:</strong> {selectedImage.data.id}
                    </p>
                  </>
                )}
              </div>
            </div>

            <Button variant="outline" onClick={() => setSelectedImage(null)}>
              Clear Selection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSelectorExample;
