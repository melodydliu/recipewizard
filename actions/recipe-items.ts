"use server";

import { revalidatePath } from "next/cache";

type UpsertRecipeItemData = {
  id?: string;
  arrangement_id: string;
  master_flower_id: string | null;
  flower_name_override: string | null;
  palette_color_id: string | null;
  color_text: string | null;
  qty_per_arrangement: string;
  stem_price_override: string | null;
  sort_order: number;
};

export async function upsertRecipeItem(data: UpsertRecipeItemData) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();

    // Find event_id via arrangement
    const arrangement = store.arrangements.find((a) => a.id === data.arrangement_id);
    const eventId = arrangement?.event_id;

    if (data.id) {
      const idx = store.recipeItems.findIndex((r) => r.id === data.id);
      if (idx !== -1) {
        store.recipeItems[idx] = {
          ...store.recipeItems[idx],
          master_flower_id: data.master_flower_id,
          flower_name_override: data.flower_name_override,
          palette_color_id: data.palette_color_id,
          color_text: data.color_text,
          qty_per_arrangement: data.qty_per_arrangement,
          stem_price_override: data.stem_price_override,
          sort_order: data.sort_order,
          updated_at: new Date().toISOString(),
        };
      }
      writeStore(store);
      if (eventId) revalidatePath(`/events/${eventId}`);
      return { success: true };
    } else {
      const newItem = {
        id: crypto.randomUUID(),
        arrangement_id: data.arrangement_id,
        master_flower_id: data.master_flower_id,
        flower_name_override: data.flower_name_override,
        palette_color_id: data.palette_color_id,
        color_text: data.color_text,
        qty_per_arrangement: data.qty_per_arrangement,
        stem_price_override: data.stem_price_override,
        sort_order: data.sort_order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.recipeItems.push(newItem);
      writeStore(store);
      if (eventId) revalidatePath(`/events/${eventId}`);
      return { id: newItem.id };
    }
  }

  try {
    const { db } = await import("@/lib/db");
    const { recipeItems } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    if (data.id) {
      await db
        .update(recipeItems)
        .set({
          master_flower_id: data.master_flower_id,
          flower_name_override: data.flower_name_override,
          palette_color_id: data.palette_color_id,
          color_text: data.color_text,
          qty_per_arrangement: data.qty_per_arrangement,
          stem_price_override: data.stem_price_override,
          sort_order: data.sort_order,
          updated_at: new Date(),
        })
        .where(eq(recipeItems.id, data.id));
    } else {
      const rows = await db
        .insert(recipeItems)
        .values({
          arrangement_id: data.arrangement_id,
          master_flower_id: data.master_flower_id,
          flower_name_override: data.flower_name_override,
          palette_color_id: data.palette_color_id,
          color_text: data.color_text,
          qty_per_arrangement: data.qty_per_arrangement,
          stem_price_override: data.stem_price_override,
          sort_order: data.sort_order,
        })
        .returning({ id: recipeItems.id });
      const eventId = await getEventIdForArrangement(data.arrangement_id);
      if (eventId) revalidatePath(`/events/${eventId}`);
      return { id: rows[0]?.id };
    }

    const eventId = await getEventIdForArrangement(data.arrangement_id);
    if (eventId) revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to save recipe item." };
  }
}

export async function deleteRecipeItem(id: string, eventId: string) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.recipeItems = store.recipeItems.filter((r) => r.id !== id);
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { recipeItems } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(recipeItems).where(eq(recipeItems.id, id));
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete recipe item." };
  }
}

export async function reorderRecipeItems(
  arrangementId: string,
  orderedIds: string[]
) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    orderedIds.forEach((itemId, index) => {
      const idx = store.recipeItems.findIndex((r) => r.id === itemId);
      if (idx !== -1) store.recipeItems[idx].sort_order = index;
    });
    const arrangement = store.arrangements.find((a) => a.id === arrangementId);
    writeStore(store);
    if (arrangement) revalidatePath(`/events/${arrangement.event_id}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { recipeItems } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await Promise.all(
      orderedIds.map((itemId, index) =>
        db
          .update(recipeItems)
          .set({ sort_order: index, updated_at: new Date() })
          .where(eq(recipeItems.id, itemId))
      )
    );

    const eventId = await getEventIdForArrangement(arrangementId);
    if (eventId) revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to reorder recipe items." };
  }
}

async function getEventIdForArrangement(arrangementId: string): Promise<string | null> {
  const { db } = await import("@/lib/db");
  const { arrangements } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const rows = await db
    .select({ event_id: arrangements.event_id })
    .from(arrangements)
    .where(eq(arrangements.id, arrangementId))
    .limit(1);
  return rows[0]?.event_id ?? null;
}
