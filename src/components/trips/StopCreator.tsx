import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { 
  X, 
  MapPin, 
  Calendar, 
  DollarSign, 
  StickyNote,
  Search,
  Check,
  ChevronsUpDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { DatePicker } from "~/components/ui/DatePicker";
import { cn } from "~/lib/utils";
import { getCountriesQuery, getCitiesByCountryQuery } from "~/lib/queries/countries-and-cities";
import { useCreateTripStop } from "~/lib/mutations/trips/useTripStops";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useUserCurrency } from "~/lib/hooks/use-user-currency";

const createStopSchema = (tripStartDate?: Date | string | null, tripEndDate?: Date | string | null) => 
  z.object({
    countryId: z.number({ required_error: "Please select a country" }),
    cityId: z.number({ required_error: "Please select a city" }),
    arrivalDate: z.date().optional(),
    departureDate: z.date().optional(),
    budget: z.number().min(0).optional(),
    notes: z.string().optional(),
  }).refine((data) => {
    if (data.arrivalDate && data.departureDate) {
      return data.departureDate >= data.arrivalDate;
    }
    return true;
  }, {
    message: "Departure date must be after arrival date",
    path: ["departureDate"],
  }).refine((data) => {
    if (data.arrivalDate && tripStartDate) {
      const tripStart = new Date(tripStartDate);
      return data.arrivalDate >= tripStart;
    }
    return true;
  }, {
    message: "Arrival date must be within the trip dates",
    path: ["arrivalDate"],
  }).refine((data) => {
    if (data.departureDate && tripEndDate) {
      const tripEnd = new Date(tripEndDate);
      return data.departureDate <= tripEnd;
    }
    return true;
  }, {
    message: "Departure date must be within the trip dates", 
    path: ["departureDate"],
  }).refine((data) => {
    if (data.arrivalDate && tripEndDate) {
      const tripEnd = new Date(tripEndDate);
      return data.arrivalDate <= tripEnd;
    }
    return true;
  }, {
    message: "Arrival date must be within the trip dates",
    path: ["arrivalDate"],
  }).refine((data) => {
    if (data.departureDate && tripStartDate) {
      const tripStart = new Date(tripStartDate);
      return data.departureDate >= tripStart;
    }
    return true;
  }, {
    message: "Departure date must be within the trip dates",
    path: ["departureDate"],
  });

type StopFormData = z.infer<ReturnType<typeof createStopSchema>>;

interface StopCreatorProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  tripStartDate?: Date | string | null;
  tripEndDate?: Date | string | null;
}

export function StopCreator({ tripId, isOpen, onClose, tripStartDate, tripEndDate }: StopCreatorProps) {
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const { currencyCode } = useUserCurrency();
  
  const createTripStopMutation = useCreateTripStop();
  
  const { data: countries = [] } = useQuery(getCountriesQuery);
  
  const stopSchema = createStopSchema(tripStartDate, tripEndDate);
  
  const form = useForm<StopFormData>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      countryId: undefined,
      cityId: undefined,
      arrivalDate: undefined,
      departureDate: undefined,
      budget: undefined,
      notes: "",
    },
  });

  const selectedCountryId = form.watch("countryId");
  
  const { data: cities = [] } = useQuery(
    getCitiesByCountryQuery(selectedCountryId)
  );

  // Reset city selection when country changes
  const handleCountryChange = (countryId: number) => {
    form.setValue("countryId", countryId);
    form.setValue("cityId", undefined);
    setCountryOpen(false);
  };

  const onSubmit = async (data: StopFormData) => {
    try {
      await createTripStopMutation.mutateAsync({
        tripId,
        countryId: data.countryId,
        cityId: data.cityId,
        arrivalDate: data.arrivalDate?.toISOString().split('T')[0],
        departureDate: data.departureDate?.toISOString().split('T')[0],
        budget: data.budget,
        notes: data.notes,
      });
      
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Failed to create trip stop:", error);
      
      // Handle specific error cases
      if (error?.message?.includes('Trip not found')) {
        form.setError('root', { 
          type: 'manual', 
          message: 'Trip not found. Please refresh and try again.' 
        });
      } else if (error?.message?.includes('access denied')) {
        form.setError('root', { 
          type: 'manual', 
          message: 'You do not have permission to modify this trip.' 
        });
      } else {
        form.setError('root', { 
          type: 'manual', 
          message: 'Failed to add stop. Please check your dates and try again.' 
        });
      }
    }
  };

  const handleArrivalDateChange = (date?: Date) => {
    form.setValue("arrivalDate", date);
    
    // If departure date is before new arrival date, update it
    const departureDate = form.getValues("departureDate");
    if (date && departureDate && departureDate < date) {
      form.setValue("departureDate", date);
    }
  };

  const handleDepartureDateChange = (date?: Date) => {
    form.setValue("departureDate", date);
  };

  // Calculate date constraints
  const minDate = tripStartDate ? new Date(tripStartDate) : undefined;
  const maxDate = tripEndDate ? new Date(tripEndDate) : undefined;
  const selectedArrivalDate = form.watch("arrivalDate");

  const selectedCountry = countries.find(c => c.id === selectedCountryId);
  const selectedCity = cities.find(c => c.id === form.watch("cityId"));

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Prevent closing during mutation
        if (!open && createTripStopMutation.isPending) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Add Trip Stop</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {createTripStopMutation.isPending && (
              <div className="text-sm text-muted-foreground flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                <span>Adding stop...</span>
              </div>
            )}
            {/* Location Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Destination</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {selectedCountry ? selectedCountry.name : "Select country"}
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
                                  onSelect={() => handleCountryChange(country.id)}
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

                <FormField
                  control={form.control}
                  name="cityId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>City</FormLabel>
                      <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={!selectedCountryId}
                            >
                              {selectedCity ? selectedCity.name : 
                               selectedCountryId ? "Select city" : "Select country first"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search city..." />
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {cities.map((city) => (
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

            {/* Dates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Dates (Optional)</span>
                </h3>
                {(tripStartDate || tripEndDate) && (
                  <div className="text-xs text-muted-foreground">
                    Trip: {tripStartDate ? format(new Date(tripStartDate), "MMM d") : "?"} - {tripEndDate ? format(new Date(tripEndDate), "MMM d, yyyy") : "?"}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="arrivalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Date</FormLabel>
                      <FormControl>
                        <div className="w-full">
                          <DatePicker
                            date={field.value}
                            setDate={handleArrivalDateChange}
                            minDate={minDate}
                            maxDate={maxDate}
                            placeholder="Select arrival date"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date</FormLabel>
                      <FormControl>
                        <div className="w-full">
                          <DatePicker
                            date={field.value}
                            setDate={handleDepartureDateChange}
                            minDate={selectedArrivalDate || minDate}
                            maxDate={maxDate}
                            placeholder="Select departure date"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Budget Section */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Budget (Optional)</span>
              </h3>
              
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget for this stop</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={`e.g., 500 ${currencyCode}`}
                        value={field.value || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center space-x-2">
                <StickyNote className="w-4 h-4" />
                <span>Notes (Optional)</span>
              </h3>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional notes or reminders</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special notes about this destination..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Error Display */}
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createTripStopMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTripStopMutation.isPending}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
              >
                {createTripStopMutation.isPending ? "Adding..." : "Add Stop"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}