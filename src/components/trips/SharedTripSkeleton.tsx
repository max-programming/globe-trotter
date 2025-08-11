import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";

export function SharedTripSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Side - Trip Content Skeleton */}
          <div className="xl:col-span-3 flex flex-col space-y-4">
            {/* Trip Header Skeleton */}
            <div className="relative overflow-hidden rounded-xl">
              {/* Cover Image Skeleton */}
              <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700">
                <Skeleton className="absolute inset-0 w-full h-full" />

                {/* Content Overlay Skeleton */}
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-64 bg-white/20" />
                        <div className="flex items-center space-x-2">
                          <Skeleton className="w-4 h-4 bg-white/20" />
                          <Skeleton className="h-4 w-48 bg-white/20" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Skeleton className="w-4 h-4 bg-white/20" />
                          <Skeleton className="h-4 w-40 bg-white/20" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-16 bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Description Skeleton */}
              <div className="p-4 bg-background/95 border-b">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Trip Notes Skeleton */}
              <div className="p-4 bg-background/95">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
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
                <Card key={i} className="bg-card/95 backdrop-blur-sm">
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
                              <Skeleton className="w-4 h-4" />
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
          <div className="xl:col-span-2 bg-card/95 backdrop-blur-sm rounded-lg border overflow-hidden xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] self-start">
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
