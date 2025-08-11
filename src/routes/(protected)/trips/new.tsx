import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DatePicker } from "~/components/ui/DatePicker";
import { Label } from "~/components/ui/label";
import { UploadCloud, ImagePlus, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
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
import { cn } from "~/lib/utils";
import { getCountriesQuery } from "~/lib/queries/countries-and-cities";
import { Calendar, Check, ChevronsUpDown, Globe2, Save } from "lucide-react";
import {
  createTripSchema,
  type CreateTripFormData,
} from "~/components/trips/trip-schema";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle as AlertCircleIcon } from "lucide-react";
import { useCreateTrip } from "~/lib/mutations/trips/useCreateTrip";

export const Route = createFileRoute("/(protected)/trips/new")({
  head: () => ({ meta: [{ title: "Create Trip | Globe Trotter" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(getCountriesQuery);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary-50/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 -left-40 w-80 h-80 bg-primary-200/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-primary-300/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-primary-100/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <CreateTripForm />
        </div>
      </div>
    </div>
  );
}

const CreateTripForm = () => {
  const [countryOpen, setCountryOpen] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: countries = [] } = useQuery(getCountriesQuery);

  const form = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      name: "",
      startDate: undefined as unknown as Date,
      endDate: undefined as unknown as Date,
      countryId: undefined as unknown as number,
      coverImageUrl: undefined,
      totalBudget: undefined,
    },
  });

  const { mutateAsync: createTrip, isPending: isCreatingTrip } =
    useCreateTrip(form);

  const handleSubmit = async (data: CreateTripFormData) => {
    await createTrip(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
          <Globe2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Create New Trip
          </h1>
          <p className="text-muted-foreground">Plan your next adventure</p>
        </div>
      </div>

      <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                    <Globe2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Trip details
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="E.g., Summer in Italy"
                          className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Cover Image (Optional)</Label>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload cover image"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0] ?? null;
                        setCoverFile(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) =>
                            setCoverPreview(String(ev.target?.result || ""));
                          reader.readAsDataURL(file);
                        } else {
                          setCoverPreview(null);
                        }
                      }}
                      className="group relative w-full h-44 rounded-md border border-dashed border-input/70 hover:border-primary/60 transition-colors flex items-center justify-center overflow-hidden"
                    >
                      {coverPreview ? (
                        <>
                          <img
                            src={coverPreview}
                            alt="Cover preview"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10 flex items-center gap-2 bg-background/80 backdrop-blur rounded-md px-3 py-1 text-xs">
                            <ImagePlus className="w-4 h-4" />
                            <span>Click to replace</span>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove image"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCoverFile(null);
                              setCoverPreview(null);
                            }}
                            className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full bg-background/80 hover:bg-background px-2 py-2 shadow border"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <UploadCloud className="w-5 h-5" />
                          <span className="text-sm">
                            Drag & drop or click to upload
                          </span>
                          <span className="text-xs">PNG, JPG up to 5MB</span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setCoverFile(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              setCoverPreview(String(ev.target?.result || ""));
                            reader.readAsDataURL(file);
                          } else {
                            setCoverPreview(null);
                          }
                        }}
                      />
                    </div>
                    {coverFile && (
                      <div className="text-xs text-muted-foreground">
                        Selected: {coverFile.name} (
                        {Math.round(coverFile.size / 1024)} KB)
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="totalBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Budget (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="e.g., 2500"
                            className="h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(
                                val === "" ? undefined : Number(val)
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Dates
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={(d) => field.onChange(d)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={(d) => field.onChange(d)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
                    <Globe2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Destination
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="countryId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Country</FormLabel>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? countries.find((c) => c.id === field.value)
                                    ?.name
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
                              {countries.map((country) => (
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
              </div>

              {form.formState.errors.root && (
                <Alert
                  variant="destructive"
                  className="border-l-4 border-l-destructive"
                >
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {form.formState.errors.root.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end pt-6 border-t border-border/50">
                <Button
                  type="submit"
                  className="px-8 h-11 text-white font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01]"
                  disabled={isCreatingTrip}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isCreatingTrip ? "Saving..." : "Save Trip"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Suggestions section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
            <Globe2 className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Suggestions
          </h3>
        </div>

        <Suggestions countryId={form.watch("countryId")} />
      </div>
    </div>
  );
};

type SuggestionsProps = { countryId?: number };

const activitySeeds: Record<string, string[]> = {
  default: [
    "Top landmarks tour",
    "Local food crawl",
    "Sunset viewpoint",
    "Museum and culture walk",
  ],
};

const Suggestions = ({ countryId }: SuggestionsProps) => {
  const { data: countries = [] } = useQuery(getCountriesQuery);

  const selectedCountryName = countries.find((c) => c.id === countryId)?.name;
  const activities = activitySeeds.default;

  if (!countryId) {
    return (
      <Card className="shadow-xl border-0 bg-card/80">
        <CardContent className="p-6 text-muted-foreground">
          Select a country to see popular places and activity ideas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-xl border-0 bg-card/80">
        <CardContent className="p-6 space-y-3">
          <h4 className="font-semibold">Popular in {selectedCountryName}</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li className="leading-relaxed">
              Explore top cities and scenic spots
            </li>
            <li className="leading-relaxed">
              Find local markets and neighborhoods
            </li>
            <li className="leading-relaxed">
              Discover nature trails and parks
            </li>
          </ul>
        </CardContent>
      </Card>
      <Card className="shadow-xl border-0 bg-card/80">
        <CardContent className="p-6 space-y-3">
          <h4 className="font-semibold">Activities to try</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {activities.map((a) => (
              <li key={a} className="leading-relaxed">
                {a}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateTripForm;
