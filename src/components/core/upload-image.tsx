import { useState, useCallback, useRef } from "react";
import { SearchIcon, UploadIcon, ImageIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useDebounceValue } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import { getPexelsImagesQuery } from "~/lib/queries/pexels";

interface UploadImageProps {
  className?: string;
  btnText?: string;
  onImageSelect?: (image: ImageSelectionData) => void;
}

interface PexelsPhoto {
  id: number;
  url: string;
  photographer?: string;
}

interface ImageSelectionData {
  url: string;
  source: "upload" | "pexels";
  data?: PexelsPhoto;
}

const UploadImage = ({
  className,
  btnText = "Upload Image",
  onImageSelect,
}: UploadImageProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounceValue(searchQuery, 500);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleImageSelection = useCallback(
    (image: ImageSelectionData) => {
      setIsOpen(false);
      setUploadedImage(null);
      setSearchQuery("");
      onImageSelect?.(image);
    },
    [onImageSelect]
  );

  const { data: imageResult, isLoading: isLoadingImages } = useQuery(
    getPexelsImagesQuery(debouncedQuery, 20)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <ImageIcon className="w-4 h-4 mr-2" />
          {btnText}
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[80vw] w-full h-full flex flex-col max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select an Image</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 m-1">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <UploadIcon className="w-4 h-4" />
              Upload from PC
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <SearchIcon className="w-4 h-4" />
              Search on Web
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-gray-300",
                "hover:border-primary/50 cursor-pointer"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {uploadedImage ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="max-w-sm max-h-64 rounded-lg object-cover text-primary"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedImage(null);
                      }}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageSelection({
                          url: uploadedImage,
                          source: "upload",
                        });
                      }}
                      className="w-full"
                    >
                      Use This Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="w-12 h-12 mx-auto text-primary" />
                  <div>
                    <p className="text-lg font-medium">
                      Drag & drop an image here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse files
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="relative m-1">
              <Input
                placeholder="Search for images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="max-h-[32rem] overflow-y-auto">
              {isLoadingImages ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : imageResult?.success && imageResult?.photos?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                  {imageResult.photos.map((image: PexelsPhoto) => (
                    <div
                      key={image.id}
                      className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                      onClick={() =>
                        handleImageSelection({
                          url: image.url,
                          source: "pexels",
                          data: image,
                        })
                      }
                    >
                      <img
                        src={image.url}
                        alt={`Photo by ${image.photographer || "img"}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : debouncedQuery ? (
                <div className="text-center py-8 text-gray-500">
                  No images found for "{debouncedQuery}"
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Search for images to get started
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UploadImage;
