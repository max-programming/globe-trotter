import { db } from "./connection";
import { and, gte, lte, eq } from "drizzle-orm";
import { cities, tripStopActivities, tripStops, trips, users } from "./schema";
import { nanoid } from "nanoid";

type SeedTripSpec = {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  totalBudget?: number | null;
};

const USER_ID = "o1BouGAWEMNeNcYAoTkO8Zkk8c0LOqK3";
const COUNTRY_ID_MIN = 29;
const COUNTRY_ID_MAX = 69;
const CITY_ID_MIN = 128;
const CITY_ID_MAX = 393;

const COVER_IMAGES: string[] = [
  // Unsplash nature/mountain images
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1500048993953-d23a436266cf",
  "https://images.unsplash.com/photo-1500530855697-0e9a5b9b8ef2",
  "https://images.unsplash.com/photo-1504457049879-87a5f1e7e3d6",
];

const ACTIVITY_PRESETS: Record<string, string[]> = {
  sightseeing: [
    "Old town walking tour",
    "Panoramic hill viewpoint",
    "Iconic landmark visit",
  ],
  food: ["Street food crawl", "Local market tasting", "Traditional dinner"],
  adventure: ["Sunrise hike", "Mountain trail trek", "Lakeside cycling"],
  culture: ["Museum afternoon", "Historic district", "Architecture highlights"],
  relaxation: ["Park picnic", "Spa & wellness", "River promenade"],
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

async function getCandidateCities() {
  const rows = await db
    .select()
    .from(cities)
    .where(
      and(
        gte(cities.id, CITY_ID_MIN),
        lte(cities.id, CITY_ID_MAX),
        gte(cities.countryId, COUNTRY_ID_MIN),
        lte(cities.countryId, COUNTRY_ID_MAX)
      )
    );
  return rows;
}

async function createTripsWithStopsAndActivities() {
  const candidateCities = await getCandidateCities();
  if (candidateCities.length === 0) {
    throw new Error(
      `No cities found in id [${CITY_ID_MIN}-${CITY_ID_MAX}] with countryId in [${COUNTRY_ID_MIN}-${COUNTRY_ID_MAX}]. Ensure countries/cities seed ran.`
    );
  }

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

      // choose 3-4 distinct cities for stops
      const stopCount = 3 + Math.floor(Math.random() * 2); // 3-4
      const selectedCities: typeof candidateCities = [];
      const pickedIds = new Set<number>();
      while (
        selectedCities.length < stopCount &&
        pickedIds.size < candidateCities.length
      ) {
        const city = pick(candidateCities);
        if (!pickedIds.has(city.id)) {
          pickedIds.add(city.id);
          selectedCities.push(city);
        }
      }

      // space stops evenly across trip dates
      const tripDurationDays = Math.max(
        1,
        Math.ceil(
          (spec.endDate.getTime() - spec.startDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const gap = Math.max(
        2,
        Math.floor(tripDurationDays / (selectedCities.length + 1))
      );

      const stopRows = [] as {
        id: string;
        tripId: string;
        countryId: number;
        cityId: number;
        budget: number | null;
        stopOrder: number;
        arrivalDate: string;
        departureDate: string;
        notes: string | null;
        updatedAt: Date;
      }[];

      for (let i = 0; i < selectedCities.length; i++) {
        const city = selectedCities[i];
        const id = nanoid();
        const arrival = new Date(spec.startDate);
        arrival.setUTCDate(arrival.getUTCDate() + i * gap);
        const departure = new Date(arrival);
        departure.setUTCDate(
          departure.getUTCDate() + Math.max(2, Math.floor(gap * 0.8))
        );

        stopRows.push({
          id,
          tripId: trip.id,
          countryId: city.countryId!,
          cityId: city.id,
          budget: Math.round((500 + Math.random() * 700) * 100) / 100,
          stopOrder: (i + 1) * 100,
          arrivalDate: toDateOnly(arrival),
          departureDate: toDateOnly(departure),
          notes: null,
          updatedAt: new Date(),
        });
      }

      const insertedStops = await tx
        .insert(tripStops)
        .values(stopRows)
        .returning();

      // activities for each stop
      for (const s of insertedStops) {
        const activitiesToCreate: {
          tripStopId: string;
          activityCategory:
            | "sightseeing"
            | "food"
            | "entertainment"
            | "adventure"
            | "culture"
            | "shopping"
            | "relaxation"
            | "transportation"
            | "accommodation"
            | "other";
          activityName: string;
          scheduledDate: Date | null;
          actualCost: number | null;
          notes: string | null;
          updatedAt: Date;
        }[] = [];

        const categories = [
          "sightseeing",
          "food",
          "adventure",
          "culture",
          "relaxation",
        ] as const;
        const chosen = new Set<string>();
        while (chosen.size < 3) {
          chosen.add(pick(categories as unknown as string[]));
        }

        let dayOffset = 0;
        for (const cat of chosen) {
          const presets = ACTIVITY_PRESETS[cat] ?? ["Explore local spots"];
          const name = pick(presets);
          const when = new Date(s.arrivalDate!);
          when.setUTCDate(when.getUTCDate() + dayOffset);
          dayOffset += 1;

          activitiesToCreate.push({
            tripStopId: s.id,
            activityCategory: cat as any,
            activityName: name,
            scheduledDate: when,
            actualCost:
              Math.random() < 0.5
                ? null
                : Math.round((15 + Math.random() * 60) * 100) / 100,
            notes: null,
            updatedAt: new Date(),
          });
        }

        await tx.insert(tripStopActivities).values(activitiesToCreate);
      }
    });
  }
}

async function seed() {
  console.log("🌱 Seeding database (trips, stops, activities)...");
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

    await createTripsWithStopsAndActivities();
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
