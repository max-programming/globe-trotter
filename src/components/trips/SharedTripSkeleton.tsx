import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";

export function SharedTripSkeleton() {
  return (
    <div className="min-h-screen ">
      <div className="px-10 ms:pl-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Side - Trip Content Skeleton */}
          <div className="md:col-span-7 flex flex-col space-y-4">
            {/* Trip Header Skeleton */}
            <div className="relative overflow-hidden">
              {/* Cover Image Skeleton */}
              <div className="relative h-64 bg-transparent">
                <div className="rounded-xl overflow-hidden">
                  <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />
                  <div className="absolute inset-0 bg-black/40 rounded-xl overflow-hidden" />
                </div>

                {/* Content Overlay Skeleton */}
                <div className="relative z-20 h-full flex flex-col justify-end rounded-xl overflow-hidden">
                  <div className="space-y-2 bg-white max-w-2/3 w-full py-6 px-8 rounded-lg shadow-lg absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-30">
                    <Skeleton className="h-8 w-64 bg-gray-200" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-4 h-4 bg-gray-200" />
                      <Skeleton className="h-4 w-48 bg-gray-200" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-4 h-4 bg-gray-200" />
                      <Skeleton className="h-4 w-40 bg-gray-200" />
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 z-20">
                    <Skeleton className="h-8 w-16 bg-white/20" />
                  </div>
                </div>
              </div>

              {/* Trip Notes Skeleton */}
              <div className="p-4 bg-background/95 pt-20 mt-8">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="min-h-8">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Itinerary Skeleton */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>

              {/* Day Cards Skeleton */}
              {Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="bg-card/95 backdrop-blur-sm hover:bg-muted/50 transition-colors p-3"
                >
                  <CardContent className="p-0">
                    {/* Day Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="w-6 h-4" />
                        <Skeleton className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Day Content */}
                    <div className="border-t bg-background/50">
                      <div className="p-4 space-y-4">
                        {/* Day Notes */}
                        <div className="flex items-start space-x-2 p-3 bg-muted/30 rounded-lg">
                          <Skeleton className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <Skeleton className="h-4 w-full" />
                        </div>

                        {/* Places */}
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          {Array.from({ length: 2 + i }).map((_, j) => (
                            <div
                              key={j}
                              className="p-3 rounded-lg border bg-background flex items-center gap-3"
                            >
                              <Skeleton className="w-5 h-5 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                              </div>
                              <Skeleton className="w-4 h-4" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Side - Map Skeleton */}
          <div className="md:col-span-5 bg-card/95 backdrop-blur-sm rounded-lg border overflow-hidden xl:sticky xl:top-6  h-96 mb-10 md:h-[calc(100vh-5rem)] self-start">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-32 mt-1" />
              </div>

              {/* Map Skeleton */}
              <div className="flex-1 min-h-0">
                <Skeleton className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
