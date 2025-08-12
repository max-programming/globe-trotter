import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectDropdownProps {
  options?: SelectOption[];
  placeholder?: string;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function SelectDropdown({
  options,
  placeholder = "Select an option...",
  className,
  value,
  onValueChange,
}: SelectDropdownProps) {
  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn("w-full capitalize", className)}>
          <SelectValue placeholder={placeholder} className="capitalize" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="capitalize">{placeholder}</SelectLabel>
            {options?.map(option => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="capitalize"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export default SelectDropdown;
