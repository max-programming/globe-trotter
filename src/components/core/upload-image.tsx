import { useState, useCallback, useRef, useEffect } from "react";
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

interface UploadImageProps {
  className?: string;
  btnText?: string;
}

const UploadImage = ({
  className,
  btnText = "Upload Image",
}: UploadImageProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounceValue(searchQuery, 500);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  const searchPexels = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/search-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, perPage: 20 }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.photos || []);
      }
    } catch (error) {
      console.error("Error searching images:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery && activeTab === "search") {
      searchPexels(debouncedQuery);
    }
  }, [debouncedQuery, activeTab, searchPexels]);

  const handleImageSelection = (image: {
    url: string;
    source: "upload" | "pexels";
    data?: any;
  }) => {
    setIsOpen(false);
    setUploadedImage(null);
    setSearchQuery("");
    setSearchResults([]);
  };

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
          <TabsList className="grid w-full grid-cols-2">
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
            <div className="relative">
              <Input
                placeholder="Search for images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map((image) => (
                    <div
                      key={image.id}
                      className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                      onClick={() =>
                        handleImageSelection({
                          url: image.src.medium,
                          source: "pexels",
                          data: image,
                        })
                      }
                    >
                      <img
                        src={image.src.medium}
                        alt={`Photo by ${image.photographer}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">
                          by {image.photographer}
                        </p>
                      </div>
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
