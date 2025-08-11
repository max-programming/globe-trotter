# Database Schema Improvements for New Trip Creation Flow

## Overview

The new trip creation flow uses Google Places Autocomplete, which provides richer location data than the current country-only selection. Here are the recommended schema changes:

## 1. Enhanced Places/Locations Table

Instead of separate `countries` and `cities` tables, create a unified `places` table:

```sql
CREATE TABLE places (
    id SERIAL PRIMARY KEY,
    place_id TEXT UNIQUE NOT NULL, -- Google Place ID
    name TEXT NOT NULL,
    formatted_address TEXT NOT NULL,
    main_text TEXT NOT NULL, -- Primary name (e.g., "Paris")
    secondary_text TEXT, -- Context (e.g., "France")
    place_types TEXT[] NOT NULL, -- Google place types array
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    country_code TEXT, -- ISO 3166-1 alpha-2
    country_name TEXT,
    administrative_levels JSONB, -- For states, regions, etc.
    timezone TEXT,
    photo_reference TEXT, -- Google Photos reference
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_places_place_id ON places(place_id);
CREATE INDEX idx_places_country_code ON places(country_code);
CREATE INDEX idx_places_types ON places USING GIN(place_types);
CREATE INDEX idx_places_name ON places(name);
```

## 2. Update Trips Table

Modify the trips table to work with the new places structure:

```sql
-- Add new columns
ALTER TABLE trips ADD COLUMN place_id TEXT REFERENCES places(place_id);
ALTER TABLE trips ADD COLUMN destination_name TEXT; -- Cached for performance
ALTER TABLE trips ADD COLUMN destination_image_url TEXT; -- From Unsplash API

-- The countryId can be kept for backward compatibility or gradually migrated
-- ALTER TABLE trips DROP COLUMN country_id; -- After migration
```

## 3. Updated Trip Stops Table

Update trip stops to work with the new places system:

```sql
ALTER TABLE trip_stops DROP COLUMN country_id;
ALTER TABLE trip_stops DROP COLUMN city_id;
ALTER TABLE trip_stops ADD COLUMN place_id TEXT NOT NULL REFERENCES places(place_id);
ALTER TABLE trip_stops ADD COLUMN place_name TEXT; -- Cached for performance
```

## 4. Migration Strategy

### Phase 1: Add new columns alongside existing ones

- Add `places` table
- Add `place_id` and related columns to `trips` and `trip_stops`
- Keep existing `countries` and `cities` tables

### Phase 2: Populate places data

```sql
-- Migrate existing countries to places
INSERT INTO places (place_id, name, formatted_address, main_text, place_types, country_code, country_name)
SELECT
    'country_' || code as place_id,
    name,
    name as formatted_address,
    name as main_text,
    ARRAY['country', 'political'] as place_types,
    code as country_code,
    name as country_name
FROM countries;

-- Migrate existing cities to places
INSERT INTO places (place_id, name, formatted_address, main_text, secondary_text, place_types, country_code, country_name, latitude, longitude)
SELECT
    'city_' || c.id as place_id,
    c.name,
    c.name || ', ' || co.name as formatted_address,
    c.name as main_text,
    co.name as secondary_text,
    ARRAY['locality', 'political'] as place_types,
    co.code as country_code,
    co.name as country_name,
    c.latitude,
    c.longitude
FROM cities c
JOIN countries co ON c.country_id = co.id;
```

### Phase 3: Update application code

- Update queries to use `places` table
- Implement Google Places API integration
- Add Unsplash API integration for destination images

### Phase 4: Clean up (after full migration)

```sql
-- Remove old foreign key constraints
ALTER TABLE trips DROP COLUMN country_id;
DROP TABLE countries;
DROP TABLE cities;
```

## 5. New Schema Benefits

1. **Flexibility**: Supports any Google Places result (cities, countries, landmarks, airports, etc.)
2. **Rich Metadata**: Stores place types, coordinates, administrative levels
3. **Performance**: Cached place names for faster queries
4. **Integration Ready**: Designed for Google Places API and Unsplash API
5. **Scalability**: Can handle millions of places without performance issues

## 6. API Integration Points

### Google Places Autocomplete

```typescript
// Store selected place in database
const selectedPlace = {
  place_id: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ", // Google Place ID
  name: "Paris",
  formatted_address: "Paris, France",
  main_text: "Paris",
  secondary_text: "France",
  types: ["locality", "political"],
  // ... other fields
};
```

### Unsplash Integration

```typescript
// Store destination image URL
const trip = {
  // ... other fields
  destination_image_url: "https://images.unsplash.com/photo-...",
  place_id: selectedPlace.place_id,
  destination_name: selectedPlace.formatted_address,
};
```

## 7. Performance Considerations

1. **Indexing**: Proper indexes on `place_id`, `place_types`, and `country_code`
2. **Caching**: Cache frequently accessed places in memory
3. **Denormalization**: Store cached place names to avoid joins
4. **Batch Operations**: Bulk insert places from Google Places API responses

## 8. Data Consistency

1. **Validation**: Ensure `place_id` exists before creating trips/stops
2. **Cleanup**: Remove unused places periodically
3. **Updates**: Refresh place data from Google Places API regularly
4. **Backups**: Regular backups before major migrations
