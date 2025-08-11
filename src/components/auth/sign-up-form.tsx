import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { signUpSchema, type SignUpFormData } from "./auth-schemas";
import { Link } from "@tanstack/react-router";
import { OauthOptions } from "./oauth-options";
import { useSignUp } from "~/lib/mutations/auth/use-sign-up";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  AlertCircleIcon,
  Check,
  ChevronsUpDown,
  Camera,
  User,
} from "lucide-react";
import { countries } from "countries-list";
import { cn } from "~/lib/utils";

// Create country list for combobox
const countryList = Object.entries(countries)
  .map(([code, country]) => ({
    value: code,
    label: country.name,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function SignUpForm() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      additionalInfo: "",
      password: "",
      confirmPassword: "",
    },
  });
  const signUpMutation = useSignUp(form);

  function handleSubmit(data: SignUpFormData) {
    signUpMutation.mutate(data);
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
    <div className="space-y-4">
      {/* Compact Header Section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Join Globe Trotter
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your account and start your next adventure
          </p>
        </div>
      </div>

      <Card className="w-full shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardContent>
          {/* Profile Picture Selector */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-3 border-white shadow-lg">
                <AvatarImage
                  src={profileImage || ""}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-image"
                className="absolute -bottom-1 -right-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full p-1.5 cursor-pointer hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5" />
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

          <div className="mb-6">
            <OauthOptions />
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

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Compact Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      Personal Information
                    </h3>
                  </div>
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
                            disabled={signUpMutation.isPending}
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
                            disabled={signUpMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            {...field}
                            disabled={signUpMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location Information Column */}
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
                  {/* Country Combobox */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Country</FormLabel>
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
                                  "justify-between h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={signUpMutation.isPending}
                              >
                                {field.value
                                  ? countryList.find(
                                      country => country.value === field.value
                                    )?.label
                                  : "Select country"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search country..." />
                              <CommandEmpty>No country found.</CommandEmpty>
                              <ScrollArea className="h-64">
                                <CommandGroup className="max-h-64 overflow-auto">
                                  {countryList.map(country => (
                                    <CommandItem
                                      value={country.label}
                                      key={country.value}
                                      onSelect={() => {
                                        form.setValue("country", country.value);
                                        setCountryOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          country.value === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {country.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </ScrollArea>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter your city"
                            className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            {...field}
                            disabled={signUpMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Security Column */}
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      Security
                    </h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            {...field}
                            disabled={signUpMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            {...field}
                            disabled={signUpMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information - Full Width */}
              <div className="col-span-full mt-6">
                <div className="flex items-center space-x-2 mb-3">
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
                    Tell Us About Yourself
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Additional Information (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about your travel preferences, interests, or any special requirements..."
                          className="resize-none min-h-[70px] transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          {...field}
                          disabled={signUpMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-full mt-6">
                <Button
                  type="submit"
                  className="w-full h-11 text-white font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]"
                  disabled={signUpMutation.isPending}
                >
                  {signUpMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Create Account</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground mt-3 border-t border-border/50">
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center space-x-1 group"
            >
              <span>Sign in here</span>
              <svg
                className="w-3 h-3 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
