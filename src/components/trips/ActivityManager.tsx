import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  X, 
  Plus, 
  Calendar, 
  DollarSign, 
  StickyNote,
  Check,
  Trash2
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
import { DatePicker } from "~/components/ui/DatePicker";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useCreateActivity, useUpdateActivity, useDeleteActivity } from "~/lib/mutations/trips/useActivities";
import { useUserCurrency } from "~/lib/hooks/use-user-currency";

const createActivitySchema = (stopArrivalDate?: Date | string | null, stopDepartureDate?: Date | string | null) =>
  z.object({
    activityName: z.string().min(1, "Activity name is required"),
    activityCategory: z.enum([
      "sightseeing", 
      "food", 
      "entertainment", 
      "adventure", 
      "culture", 
      "shopping", 
      "relaxation", 
      "transportation", 
      "accommodation", 
      "other"
    ]),
    scheduledDate: z.date().optional(),
    actualCost: z.number().min(0).optional(),
    notes: z.string().optional(),
  }).refine((data) => {
    if (data.scheduledDate && stopArrivalDate) {
      const stopStart = new Date(stopArrivalDate);
      return data.scheduledDate >= stopStart;
    }
    return true;
  }, {
    message: "Activity date must be within the stop dates",
    path: ["scheduledDate"],
  }).refine((data) => {
    if (data.scheduledDate && stopDepartureDate) {
      const stopEnd = new Date(stopDepartureDate);
      return data.scheduledDate <= stopEnd;
    }
    return true;
  }, {
    message: "Activity date must be within the stop dates",
    path: ["scheduledDate"],
  });

type ActivityFormData = z.infer<ReturnType<typeof createActivitySchema>>;

interface ActivityManagerProps {
  tripStopId: string;
  isOpen: boolean;
  onClose: () => void;
  existingActivities?: any[];
  stopArrivalDate?: Date | string | null;
  stopDepartureDate?: Date | string | null;
}

const activityCategories = [
  { value: "sightseeing", label: "Sightseeing", icon: "🗺️" },
  { value: "food", label: "Food & Dining", icon: "🍽️" },
  { value: "entertainment", label: "Entertainment", icon: "🎭" },
  { value: "adventure", label: "Adventure", icon: "⛰️" },
  { value: "culture", label: "Culture", icon: "🏛️" },
  { value: "shopping", label: "Shopping", icon: "🛍️" },
  { value: "relaxation", label: "Relaxation", icon: "🧘" },
  { value: "transportation", label: "Transportation", icon: "🚗" },
  { value: "accommodation", label: "Accommodation", icon: "🏨" },
  { value: "other", label: "Other", icon: "📝" },
];

export function ActivityManager({ 
  tripStopId, 
  isOpen, 
  onClose, 
  existingActivities = [],
  stopArrivalDate,
  stopDepartureDate
}: ActivityManagerProps) {
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const { currencyCode, formatAmount } = useUserCurrency();
  
  const createActivityMutation = useCreateActivity();
  const updateActivityMutation = useUpdateActivity();
  const deleteActivityMutation = useDeleteActivity();

  const activitySchema = createActivitySchema(stopArrivalDate, stopDepartureDate);
  
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityName: "",
      activityCategory: "sightseeing",
      scheduledDate: undefined,
      actualCost: undefined,
      notes: "",
    },
  });

  const onSubmit = async (data: ActivityFormData) => {
    try {
      const submitData = {
        ...data,
        tripStopId,
        scheduledDate: data.scheduledDate?.toISOString(),
      };

      if (editingActivity) {
        await updateActivityMutation.mutateAsync({
          activityId: editingActivity.id,
          ...submitData,
        });
      } else {
        await createActivityMutation.mutateAsync(submitData);
      }

      form.reset();
      setEditingActivity(null);
    } catch (error: any) {
      console.error("Failed to save activity:", error);
      
      // Handle specific error cases
      if (error?.message?.includes('not found')) {
        form.setError('root', { 
          type: 'manual', 
          message: 'Trip stop not found. Please refresh and try again.' 
        });
      } else if (error?.message?.includes('access denied')) {
        form.setError('root', { 
          type: 'manual', 
          message: 'You do not have permission to modify this activity.' 
        });
      } else {
        form.setError('root', { 
          type: 'manual', 
          message: 'Failed to save activity. Please check your dates and try again.' 
        });
      }
    }
  };

  const handleEdit = (activity: any) => {
    setEditingActivity(activity);
    form.reset({
      activityName: activity.activityName,
      activityCategory: activity.activityCategory,
      scheduledDate: activity.scheduledDate ? new Date(activity.scheduledDate) : undefined,
      actualCost: activity.actualCost || undefined,
      notes: activity.notes || "",
    });
  };

  const handleDelete = async (activityId: number) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      await deleteActivityMutation.mutateAsync({ activityId });
    }
  };

  const handleToggleComplete = async (activity: any) => {
    await updateActivityMutation.mutateAsync({
      activityId: activity.id,
      isCompleted: !activity.isCompleted,
    });
  };

  const cancelEdit = () => {
    setEditingActivity(null);
    form.reset();
  };

  // Calculate date constraints for activities
  const minActivityDate = stopArrivalDate ? new Date(stopArrivalDate) : undefined;
  const maxActivityDate = stopDepartureDate ? new Date(stopDepartureDate) : undefined;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Prevent closing during mutations
        if (!open && (createActivityMutation.isPending || updateActivityMutation.isPending || deleteActivityMutation.isPending)) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Manage Activities</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Activity Form */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              {editingActivity ? "Edit Activity" : "Add New Activity"}
            </h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="activityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Visit Eiffel Tower"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activityCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center space-x-2">
                                <span>{category.icon}</span>
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  {(stopArrivalDate || stopDepartureDate) && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
                      <span className="font-medium">Stop dates:</span> {stopArrivalDate ? format(new Date(stopArrivalDate), "MMM d") : "?"} - {stopDepartureDate ? format(new Date(stopDepartureDate), "MMM d") : "?"}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Date</FormLabel>
                          <FormControl>
                            <div className="w-full">
                              <DatePicker
                                date={field.value}
                                setDate={field.onChange}
                                minDate={minActivityDate}
                                maxDate={maxActivityDate}
                                placeholder="Select activity date"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="actualCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost ({currencyCode})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={`e.g., 25 ${currencyCode}`}
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
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details or reminders..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error Display */}
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
                    disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                    className="flex-1 h-11 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                  >
                    {editingActivity ? "Update Activity" : "Add Activity"}
                  </Button>
                  {editingActivity && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Existing Activities List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Current Activities ({existingActivities.length})</h3>
            
            {existingActivities.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {existingActivities.map((activity) => {
                  const category = activityCategories.find(c => c.value === activity.activityCategory);
                  
                  return (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-lg border transition-all ${
                        activity.isCompleted 
                          ? "bg-green-50 border-green-200" 
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={`font-medium text-sm ${
                              activity.isCompleted ? "line-through text-muted-foreground" : ""
                            }`}>
                              {activity.activityName}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {category?.icon} {category?.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
                            {activity.scheduledDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(activity.scheduledDate), "MMM d, h:mm a")}</span>
                              </div>
                            )}
                            {activity.actualCost && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>{formatAmount(activity.actualCost)}</span>
                              </div>
                            )}
                          </div>
                          
                          {activity.notes && (
                            <div className="flex items-start space-x-1">
                              <StickyNote className="w-3 h-3 mt-0.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{activity.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleToggleComplete(activity)}
                            disabled={updateActivityMutation.isPending}
                          >
                            <Check className={`w-3 h-3 ${
                              activity.isCompleted ? "text-green-600" : "text-muted-foreground"
                            }`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEdit(activity)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDelete(activity.id)}
                            disabled={deleteActivityMutation.isPending}
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
                <Plus className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No activities added yet</p>
                <p className="text-xs">Use the form to add your first activity</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}