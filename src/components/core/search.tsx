import { SearchIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { useDebounceCallback, useDebounceValue } from "usehooks-ts";

// Dummy search data
const dummySearchResults = [
  { id: 1, title: "Paris, France", type: "city", description: "City of Light" },
  {
    id: 2,
    title: "London, UK",
    type: "city",
    description: "Capital of England",
  },
  { id: 3, title: "New York, USA", type: "city", description: "The Big Apple" },
  {
    id: 4,
    title: "Tokyo, Japan",
    type: "city",
    description: "Land of the Rising Sun",
  },
  {
    id: 5,
    title: "Rome, Italy",
    type: "city",
    description: "The Eternal City",
  },
  {
    id: 6,
    title: "Barcelona, Spain",
    type: "city",
    description: "Mediterranean Paradise",
  },
  {
    id: 7,
    title: "Amsterdam, Netherlands",
    type: "city",
    description: "Venice of the North",
  },
  {
    id: 8,
    title: "Sydney, Australia",
    type: "city",
    description: "Harbour City",
  },
];

const Search = ({ className }: { className?: string }) => {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedValue] = useDebounceValue(searchValue, 500);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredResults, setFilteredResults] = useState(dummySearchResults);
  const searchRef = useRef<HTMLDivElement>(null);

  // Filter results based on debounced search value
  useEffect(() => {
    console.log("Debounced search triggered:", debouncedValue); // To verify debounce is working
    if (debouncedValue.trim() === "") {
      setFilteredResults(dummySearchResults);
    } else {
      const filtered = dummySearchResults.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedValue.toLowerCase()) ||
          item.description.toLowerCase().includes(debouncedValue.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  }, [debouncedValue]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setIsOpen(value.trim().length > 0);
  };

  const handleResultClick = (result: (typeof dummySearchResults)[0]) => {
    setSearchValue(result.title);
    setIsOpen(false);
    console.log("Selected:", result);
  };

  return (
    <div className={cn("relative", className)} ref={searchRef}>
      <input
        type="text"
        placeholder="Search destinations..."
        className="w-full rounded-lg border border-input px-4 py-2 pr-12"
        value={searchValue}
        onChange={handleInputChange}
        onFocus={() => searchValue.trim().length > 0 && setIsOpen(true)}
      />
      <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-input size-5" />

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-input rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {filteredResults.length > 0 ? (
            <div className="py-2">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="font-medium text-sm">{result.title}</div>
                  <div className="text-xs text-gray-500">
                    {result.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No results found for "{debouncedValue}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
