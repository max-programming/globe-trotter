import { db } from "./connection";
import { eq } from "drizzle-orm";
import { tripItinerary, tripPlaces, trips, users } from "./schema";
import { nanoid } from "nanoid";

type SeedTripSpec = {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  totalBudget?: number | null;
};

const USER_ID = "o1BouGAWEMNeNcYAoTkO8Zkk8c0LOqK3";

const COVER_IMAGES: string[] = [
  // Unsplash nature/mountain images
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1500048993953-d23a436266cf",
  "https://images.unsplash.com/photo-1500530855697-0e9a5b9b8ef2",
  "https://images.unsplash.com/photo-1504457049879-87a5f1e7e3d6",
];

const PLACE_PRESETS: Record<string, string[]> = {
  restaurant: [
    "Local Tavern",
    "Street Food Market",
    "Traditional Restaurant",
    "Rooftop Bistro",
  ],
  attraction: [
    "Historic Cathedral",
    "Old Town Square",
    "Scenic Viewpoint", 
    "Famous Monument",
  ],
  museum: [
    "National Museum",
    "Art Gallery",
    "History Museum",
    "Cultural Center",
  ],
  park: [
    "City Central Park",
    "Botanical Garden",
    "Riverside Walk",
    "Mountain Trail",
  ],
  shopping: [
    "Local Market",
    "Shopping District",
    "Artisan Quarter",
    "Mall Center",
  ],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

async function createTripsWithItineraryAndPlaces() {
  const specs: SeedTripSpec[] = [
    {
      name: "Alpine Adventure",
      description: "Chasing peaks and panoramas across alpine towns.",
      startDate: new Date(Date.UTC(new Date().getUTCFullYear(), 5, 3)),
      endDate: new Date(Date.UTC(new Date().getUTCFullYear(), 5, 17)),
      totalBudget: 3200,
    },
    {
      name: "Coastal Escape",
      description: "Sea breezes, cliffs, and coastal cuisine.",
      startDate: new Date(Date.UTC(new Date().getUTCFullYear(), 6, 10)),
      endDate: new Date(Date.UTC(new Date().getUTCFullYear(), 6, 22)),
      totalBudget: 2800,
    },
    {
      name: "Cultural Capitals",
      description: "Museums, monuments, and marketplaces.",
      startDate: new Date(Date.UTC(new Date().getUTCFullYear(), 8, 2)),
      endDate: new Date(Date.UTC(new Date().getUTCFullYear(), 8, 16)),
      totalBudget: 3500,
    },
  ];

  for (const spec of specs) {
    await db.transaction(async (tx) => {
      const coverImageUrl = pick(COVER_IMAGES);
      const [trip] = await tx
        .insert(trips)
        .values({
          id: nanoid(),
          name: spec.name,
          description: spec.description ?? null,
          startDate: spec.startDate,
          endDate: spec.endDate,
          coverImageUrl,
          totalBudget: spec.totalBudget ?? null,
          userId: USER_ID,
          updatedAt: new Date(),
        })
        .returning();

      // Generate daily itinerary entries
      const itineraryEntries = [];
      const currentDate = new Date(spec.startDate);
      
      while (currentDate <= spec.endDate) {
        itineraryEntries.push({
          tripId: trip.id,
          date: toDateOnly(currentDate),
          notes: Math.random() < 0.3 ? "Explore and enjoy!" : null,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const insertedItinerary = await tx
        .insert(tripItinerary)
        .values(itineraryEntries)
        .returning();

      // Add sample places to some days
      for (let i = 0; i < insertedItinerary.length; i++) {
        const day = insertedItinerary[i];
        
        // Add 2-4 places per day, but not every day
        if (Math.random() < 0.7) { // 70% chance of having places
          const placeCount = 2 + Math.floor(Math.random() * 3); // 2-4 places
          const placesToCreate = [];
          
          for (let j = 0; j < placeCount; j++) {
            const placeTypes = Object.keys(PLACE_PRESETS);
            const selectedType = pick(placeTypes);
            const possibleNames = PLACE_PRESETS[selectedType];
            const placeName = pick(possibleNames);
            
            // Generate realistic times throughout the day
            const hours = 8 + Math.floor(Math.random() * 12); // 8 AM to 8 PM
            const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
            const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            placesToCreate.push({
              tripItineraryId: day.id,
              name: placeName,
              type: selectedType,
              description: Math.random() < 0.5 ? "A wonderful place to visit" : null,
              time: time,
              notes: Math.random() < 0.3 ? "Don't forget to take photos!" : null,
            });
          }
          
          if (placesToCreate.length > 0) {
            await tx.insert(tripPlaces).values(placesToCreate);
          }
        }
      }
    });
  }
}

async function seed() {
  console.log("🌱 Seeding database (trips, itinerary, places)...");
  try {
    // Ensure the target user exists to satisfy FK constraints
    const existing = await db.select().from(users).where(eq(users.id, USER_ID));
    if (existing.length === 0) {
      await db.insert(users).values({
        id: USER_ID,
        name: "Demo Traveler",
        email: "traveler@example.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await createTripsWithItineraryAndPlaces();
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

if (import.meta.main) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
