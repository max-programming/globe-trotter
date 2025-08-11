import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertCircleIcon,
  Check,
  ChevronsUpDown,
  Camera,
  User,
  Settings,
  Save,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import {
  profileUpdateSchema,
  type ProfileUpdateFormData,
} from "./profile-schemas";
import { useUpdateProfile } from "~/lib/mutations/profile/use-update-profile";
import { getCurrentUserQuery } from "~/lib/queries/profile";
import {
  getCountriesQuery,
  getCitiesByCountryQuery,
} from "~/lib/queries/countries-and-cities";

export function ProfileForm() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  // Fetch current user data
  const { data: currentUser } = useSuspenseQuery(getCurrentUserQuery);

  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      cityId: currentUser?.cityId || undefined,
      countryId: currentUser?.countryId || undefined,
      additionalInfo: currentUser?.additionalInfo || "",
      image: currentUser?.image || "",
    },
  });

  const updateProfileMutation = useUpdateProfile(form);

  // Fetch countries using TanStack Query
  const { data: countries = [] } = useQuery(getCountriesQuery);

  // Watch the selected country to fetch cities
  const selectedCountryId = form.watch("countryId");
  const { data: cities = [] } = useQuery(
    getCitiesByCountryQuery(selectedCountryId)
  );

  // Update form when user data is loaded
  useEffect(() => {
    if (currentUser) {
      form.reset({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        cityId: currentUser.cityId || undefined,
        countryId: currentUser.countryId || undefined,
        additionalInfo: currentUser.additionalInfo || "",
        image: currentUser.image || "",
      });
      setProfileImage(currentUser.image || null);
    }
  }, [currentUser, form]);

  function handleSubmit(data: ProfileUpdateFormData) {
    const submitData = {
      ...data,
      image: profileImage || data.image || "",
    };
    updateProfileMutation.mutate(submitData);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Update your profile information and preferences
          </p>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardContent>
          {/* Profile Picture Section */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-200"></div>
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                  <AvatarImage
                    src={profileImage || currentUser?.image || ""}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
                    <User className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-image"
                  className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full p-2 cursor-pointer hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {form.formState.errors.root && (
            <Alert
              variant="destructive"
              className="mb-6 border-l-4 border-l-destructive"
            >
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {form.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}

          {updateProfileMutation.isSuccess && (
            <Alert className="mb-6 border-l-4 border-l-green-500">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your profile has been updated successfully!
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Basic Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="John Doe"
                          className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          {...field}
                          disabled={updateProfileMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          {...field}
                          disabled={updateProfileMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Contact Information
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          {...field}
                          disabled={updateProfileMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Location
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Country Combobox */}
                  <FormField
                    control={form.control}
                    name="countryId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Country (Optional)</FormLabel>
                        <Popover
                          open={countryOpen}
                          onOpenChange={setCountryOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "justify-between h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={updateProfileMutation.isPending}
                              >
                                {field.value
                                  ? countries.find(
                                      country => country.id === field.value
                                    )?.name
                                  : "Select country"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search country..." />
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {countries.map(country => (
                                  <CommandItem
                                    value={country.name}
                                    key={country.id}
                                    onSelect={() => {
                                      form.setValue("countryId", country.id);
                                      setCountryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        country.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {country.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* City Combobox */}
                  <FormField
                    control={form.control}
                    name="cityId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>City (Optional)</FormLabel>
                        <Popover open={cityOpen} onOpenChange={setCityOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "justify-between h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={
                                  updateProfileMutation.isPending ||
                                  !selectedCountryId
                                }
                              >
                                {field.value
                                  ? cities.find(city => city.id === field.value)
                                      ?.name
                                  : selectedCountryId
                                    ? "Select city"
                                    : "Select country first"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 popover-content-width-full">
                            <Command>
                              <CommandInput placeholder="Search city..." />
                              <CommandEmpty>
                                {cities.length === 0 && selectedCountryId
                                  ? "No cities available for this country."
                                  : "No city found."}
                              </CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {cities.map(city => (
                                  <CommandItem
                                    value={city.name}
                                    key={city.id}
                                    onSelect={() => {
                                      form.setValue("cityId", city.id);
                                      setCityOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        city.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {city.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    About You
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your travel preferences, interests, or any special requirements..."
                          className="resize-none min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          {...field}
                          disabled={updateProfileMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-border/50">
                <Button
                  type="submit"
                  className="px-8 h-11 text-white font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>Update Profile</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Section Skeleton */}
      <div className="text-center space-y-2">
        <Skeleton className="w-12 h-12 rounded-xl mx-auto" />
        <div>
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Profile Picture Skeleton */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Skeleton className="w-24 h-24 rounded-full" />
              <Skeleton className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Information Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Contact Information Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Location Information Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* Additional Information Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>

            {/* Submit Button Skeleton */}
            <div className="flex justify-end pt-6 border-t border-border/50">
              <Skeleton className="h-11 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
