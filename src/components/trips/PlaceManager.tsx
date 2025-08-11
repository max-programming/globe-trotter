import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  X, 
  Plus, 
  MapPin, 
  Clock, 
  StickyNote,
  Trash2,
  Edit
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useCreatePlace, useUpdatePlace, useDeletePlace } from "~/lib/mutations/trips/usePlaces";

const createPlaceSchema = z.object({
  name: z.string().min(1, "Place name is required"),
  type: z.string().min(1, "Place type is required"),
  description: z.string().optional(),
  time: z.string().optional(), // HH:MM format
  notes: z.string().optional(),
});

type PlaceFormData = z.infer<typeof createPlaceSchema>;

interface PlaceManagerProps {
  tripItineraryId: number;
  isOpen: boolean;
  onClose: () => void;
  existingPlaces?: any[];
  dayDate?: string;
}

const placeTypes = [
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "attraction", label: "Attraction", icon: "🎯" },
  { value: "hotel", label: "Hotel", icon: "🏨" },
  { value: "museum", label: "Museum", icon: "🏛️" },
  { value: "park", label: "Park", icon: "🌳" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "entertainment", label: "Entertainment", icon: "🎭" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "other", label: "Other", icon: "📍" },
];

export function PlaceManager({ 
  tripItineraryId, 
  isOpen, 
  onClose, 
  existingPlaces = [],
  dayDate
}: PlaceManagerProps) {
  const [editingPlace, setEditingPlace] = useState<any>(null);
  
  const createPlaceMutation = useCreatePlace();
  const updatePlaceMutation = useUpdatePlace();
  const deletePlaceMutation = useDeletePlace();
  
  const form = useForm<PlaceFormData>({
    resolver: zodResolver(createPlaceSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      time: "",
      notes: "",
    },
  });

  const onSubmit = async (data: PlaceFormData) => {
    try {
      const submitData = {
        ...data,
        tripItineraryId,
      };

      if (editingPlace) {
        await updatePlaceMutation.mutateAsync({
          placeId: editingPlace.id,
          ...submitData,
        });
      } else {
        await createPlaceMutation.mutateAsync(submitData);
      }

      form.reset();
      setEditingPlace(null);
    } catch (error: any) {
      console.error("Failed to save place:", error);
      
      form.setError('root', { 
        type: 'manual', 
        message: 'Failed to save place. Please try again.' 
      });
    }
  };

  const handleEdit = (place: any) => {
    setEditingPlace(place);
    form.reset({
      name: place.name,
      type: place.type,
      description: place.description || "",
      time: place.time || "",
      notes: place.notes || "",
    });
  };

  const handleDelete = async (placeId: number) => {
    if (confirm("Are you sure you want to delete this place?")) {
      await deletePlaceMutation.mutateAsync({ placeId });
    }
  };

  const cancelEdit = () => {
    setEditingPlace(null);
    form.reset();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && (createPlaceMutation.isPending || updatePlaceMutation.isPending || deletePlaceMutation.isPending)) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Manage Places</span>
            {dayDate && (
              <span className="text-sm font-normal text-muted-foreground">
                - {new Date(dayDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Place Form */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              {editingPlace ? "Edit Place" : "Add New Place"}
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Eiffel Tower"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select place type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {placeTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the place..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Personal notes or reminders..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {form.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="submit"
                    disabled={createPlaceMutation.isPending || updatePlaceMutation.isPending}
                    className="flex-1"
                  >
                    {editingPlace ? "Update Place" : "Add Place"}
                  </Button>
                  {editingPlace && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Existing Places List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Current Places ({existingPlaces.length})</h3>
            
            {existingPlaces.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {existingPlaces.map((place, index) => {
                  const type = placeTypes.find(t => t.value === place.type);
                  
                  return (
                    <div
                      key={place.id}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{index + 1}</span>
                            <h4 className="font-medium text-sm">{place.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {type?.icon} {type?.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
                            {place.time && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{place.time}</span>
                              </div>
                            )}
                          </div>
                          
                          {place.description && (
                            <p className="text-xs text-muted-foreground mb-1">{place.description}</p>
                          )}
                          
                          {place.notes && (
                            <div className="flex items-start space-x-1">
                              <StickyNote className="w-3 h-3 mt-0.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{place.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEdit(place)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDelete(place.id)}
                            disabled={deletePlaceMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No places added yet</p>
                <p className="text-xs">Use the form to add your first place</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}