import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Edit,
  Globe,
  MessageSquare,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getCurrentUserQuery } from "~/lib/queries/profile";
import {
  getCountriesQuery,
  getCitiesByCountryQuery,
} from "~/lib/queries/countries-and-cities";
import { UserTripsDisplay, UserTripsSkeleton } from "./user-trips-display";
import { Suspense } from "react";
import { Heading } from "../generic/heading";

export function UserProfileDisplay() {
  const { data: currentUser } = useSuspenseQuery(getCurrentUserQuery);

  // Fetch countries and cities for display names
  const { data: countries = [] } = useQuery(getCountriesQuery);
  const { data: cities = [] } = useQuery(
    getCitiesByCountryQuery(currentUser?.countryId ?? undefined)
  );

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const joinDate = new Date(currentUser.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const country = countries.find(c => c.id === currentUser.countryId);
  const city = cities.find(c => c.id === currentUser.cityId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Compact Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <Heading>My Profile</Heading>
          {/* <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            My Profile
          </h1> */}
          <p className="text-sm text-muted-foreground">
            View and manage your Globe Trotter profile
          </p>
        </div>
      </div>

      {/* Profile Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Compact Profile Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm h-fit">
            <CardContent className="p-4">
              {/* Profile Picture and Basic Info */}
              <div className="text-center space-y-3">
                <div className="relative inline-block">
                  <Avatar className="w-20 h-20 border-3 border-white shadow-lg">
                    <AvatarImage
                      src={currentUser.image || ""}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 text-2xl">
                      {currentUser.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full p-1 shadow-lg">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">
                    {currentUser.name}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser.email}
                  </p>
                  {currentUser.emailVerified && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 hover:bg-green-100 text-xs"
                    >
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col space-y-2 pt-2">
                  <Button asChild size="sm" className="w-full">
                    <Link to="/settings/profile">
                      <Edit className="w-3 h-3" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Key Details in Horizontal Layout */}
        <div className="lg:col-span-3">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Contact Info */}
            <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      Contact
                    </p>
                    <p className="text-sm font-medium truncate">
                      {currentUser.email}
                    </p>
                    {currentUser.phone && (
                      <p className="text-xs text-muted-foreground truncate">
                        {currentUser.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Info */}
            {(currentUser.cityId || currentUser.countryId) && (
              <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        Location
                      </p>
                      <p className="text-sm font-medium truncate">
                        {city?.name && country?.name
                          ? `${city.name}, ${country.name}`
                          : country?.name
                            ? country.name
                            : city?.name
                              ? city.name
                              : "Not specified"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Member Since */}
            <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      Member Since
                    </p>
                    <p className="text-sm font-medium">{joinDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Travel Stats - Horizontal */}
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span>Travel Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">Trips</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">Countries</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">Cities</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-2xl font-bold text-primary">0</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section - If exists */}
          {currentUser.additionalInfo && (
            <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <span>About Me</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentUser.additionalInfo}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Trips Section */}
      <div className="space-y-6">
        <Suspense fallback={<UserTripsSkeleton />}>
          <UserTripsDisplay />
        </Suspense>
      </div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Compact Header Section Skeleton */}
      <div className="text-center space-y-3">
        <Skeleton className="w-10 h-10 rounded-lg mx-auto" />
        <div>
          <Skeleton className="h-6 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>

      {/* Profile Overview Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-1">
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm h-fit">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <Skeleton className="w-20 h-20 rounded-full mx-auto" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24 mx-auto" />
                  <Skeleton className="h-3 w-32 mx-auto" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-3">
          {/* Quick Info Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={i}
                className="shadow-lg border-0 bg-card/95 backdrop-blur-sm"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Travel Stats Skeleton */}
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center space-y-1">
                    <Skeleton className="h-8 w-8 mx-auto" />
                    <Skeleton className="h-3 w-12 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Future Content Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}
