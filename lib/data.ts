/**
 * Data access layer.
 *
 * When DATABASE_URL is set, delegates to real Drizzle queries.
 * When it is absent, returns placeholder data from lib/mock-data.ts so the
 * UI can be developed and previewed without a database connection.
 */

import * as mock from "@/lib/mock-data";
import { readStore } from "@/lib/local-store";

export const useMock = !process.env.DATABASE_URL;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function getEvents() {
  if (useMock) return mock.mockEvents;

  const { db } = await import("@/lib/db");
  const { events } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(events).orderBy(desc(events.event_date));
}

export async function getEvent(id: string) {
  if (useMock) {
    const event = mock.mockEvents.find((e) => e.id === id) ?? null;
    if (!event) return null;
    const { readStore } = await import("@/lib/local-store");
    const overrides = (readStore().eventFeeOverrides ?? {})[id] ?? {};
    return { ...event, ...overrides };
  }

  const { db } = await import("@/lib/db");
  const { events } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Markup settings
// ---------------------------------------------------------------------------

export async function getMarkupSettings() {
  if (useMock) return mock.mockMarkupSettings;

  const { db } = await import("@/lib/db");
  const { markupSettings } = await import("@/db/schema");
  const rows = await db.select().from(markupSettings).limit(1);
  return rows[0] ?? mock.mockMarkupSettings;
}

// ---------------------------------------------------------------------------
// Master flowers
// ---------------------------------------------------------------------------

export async function getFlowers(includeArchived = false) {
  if (useMock) {
    return includeArchived
      ? mock.mockFlowers
      : mock.mockFlowers.filter((f) => !f.is_archived);
  }

  const { db } = await import("@/lib/db");
  const { masterFlowers } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  const query = db.select().from(masterFlowers).orderBy(asc(masterFlowers.name));
  if (!includeArchived) {
    return query.where(eq(masterFlowers.is_archived, false));
  }
  return query;
}

export async function getFlower(id: string) {
  if (useMock) return mock.mockFlowers.find((f) => f.id === id) ?? null;

  const { db } = await import("@/lib/db");
  const { masterFlowers } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(masterFlowers).where(eq(masterFlowers.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Master hard goods
// ---------------------------------------------------------------------------

export async function getHardGoods(includeArchived = false) {
  if (useMock) {
    return includeArchived
      ? mock.mockHardGoods
      : mock.mockHardGoods.filter((h) => !h.is_archived);
  }

  const { db } = await import("@/lib/db");
  const { masterHardGoods } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  const query = db.select().from(masterHardGoods).orderBy(asc(masterHardGoods.name));
  if (!includeArchived) {
    return query.where(eq(masterHardGoods.is_archived, false));
  }
  return query;
}

export async function getHardGood(id: string) {
  if (useMock) return mock.mockHardGoods.find((h) => h.id === id) ?? null;

  const { db } = await import("@/lib/db");
  const { masterHardGoods } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(masterHardGoods).where(eq(masterHardGoods.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Master leis
// ---------------------------------------------------------------------------

export async function getLeis(includeArchived = false) {
  if (useMock) {
    return includeArchived
      ? mock.mockLeis
      : mock.mockLeis.filter((l) => !l.is_archived);
  }

  const { db } = await import("@/lib/db");
  const { masterLeis } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  const query = db.select().from(masterLeis).orderBy(asc(masterLeis.name));
  if (!includeArchived) {
    return query.where(eq(masterLeis.is_archived, false));
  }
  return query;
}

// ---------------------------------------------------------------------------
// Event sections
// ---------------------------------------------------------------------------

export async function getEventSections(eventId: string) {
  if (useMock) {
    return readStore().eventSections.filter((s) => s.event_id === eventId);
  }

  const { db } = await import("@/lib/db");
  const { eventSections } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  return db
    .select()
    .from(eventSections)
    .where(eq(eventSections.event_id, eventId))
    .orderBy(asc(eventSections.sort_order));
}

// ---------------------------------------------------------------------------
// Palette colors
// ---------------------------------------------------------------------------

export async function getPaletteColors(eventId: string) {
  if (useMock) {
    return mock.mockPaletteColors.filter((p) => p.event_id === eventId);
  }

  const { db } = await import("@/lib/db");
  const { eventPaletteColors } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  return db
    .select()
    .from(eventPaletteColors)
    .where(eq(eventPaletteColors.event_id, eventId))
    .orderBy(asc(eventPaletteColors.sort_order));
}

// ---------------------------------------------------------------------------
// Arrangements
// ---------------------------------------------------------------------------

export async function getArrangements(eventId: string) {
  if (useMock) {
    return readStore().arrangements.filter((a) => a.event_id === eventId);
  }

  const { db } = await import("@/lib/db");
  const { arrangements } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  return db
    .select()
    .from(arrangements)
    .where(eq(arrangements.event_id, eventId))
    .orderBy(asc(arrangements.sort_order));
}

// ---------------------------------------------------------------------------
// Recipe items
// ---------------------------------------------------------------------------

export async function getRecipeItems(arrangementId: string) {
  if (useMock) {
    return readStore().recipeItems.filter((r) => r.arrangement_id === arrangementId);
  }

  const { db } = await import("@/lib/db");
  const { recipeItems } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  return db
    .select()
    .from(recipeItems)
    .where(eq(recipeItems.arrangement_id, arrangementId))
    .orderBy(asc(recipeItems.sort_order));
}

// ---------------------------------------------------------------------------
// Event hard goods
// ---------------------------------------------------------------------------

export async function getEventHardGoods(eventId: string) {
  if (useMock) {
    return mock.mockEventHardGoods.filter((h) => h.event_id === eventId);
  }

  const { db } = await import("@/lib/db");
  const { eventHardGoods } = await import("@/db/schema");
  const { eq, asc } = await import("drizzle-orm");
  return db
    .select()
    .from(eventHardGoods)
    .where(eq(eventHardGoods.event_id, eventId))
    .orderBy(asc(eventHardGoods.sort_order));
}

// ---------------------------------------------------------------------------
// Service items
// ---------------------------------------------------------------------------

export async function getServiceItems(eventId: string) {
  if (useMock) {
    const store = readStore();
    return (store.serviceItems ?? [])
      .filter((i) => i.event_id === eventId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Recipe items for an entire event
// ---------------------------------------------------------------------------

export async function getRecipeItemsForEvent(eventId: string) {
  if (useMock) {
    const store = readStore();
    const arrangementIds = store.arrangements
      .filter((a) => a.event_id === eventId)
      .map((a) => a.id);
    return store.recipeItems.filter((r) =>
      arrangementIds.includes(r.arrangement_id)
    );
  }
  const { db } = await import("@/lib/db");
  const { recipeItems, arrangements } = await import("@/db/schema");
  const { eq, inArray } = await import("drizzle-orm");
  const arrs = await db
    .select({ id: arrangements.id })
    .from(arrangements)
    .where(eq(arrangements.event_id, eventId));
  if (!arrs.length) return [];
  return db
    .select()
    .from(recipeItems)
    .where(inArray(recipeItems.arrangement_id, arrs.map((a) => a.id)));
}
