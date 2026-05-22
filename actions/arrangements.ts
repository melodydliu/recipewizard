"use server";

import { revalidatePath } from "next/cache";

export async function createArrangement(eventId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Arrangement name is required." };

  const section_id = (formData.get("section_id") as string) || null;
  const quantityRaw = formData.get("quantity") as string;
  const quantity = quantityRaw ? parseInt(quantityRaw, 10) : 1;

  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    const eventArrangements = store.arrangements.filter((a) => a.event_id === eventId);
    const newArrangement = {
      id: crypto.randomUUID(),
      event_id: eventId,
      section_id,
      name,
      quantity: isNaN(quantity) ? 1 : quantity,
      target_retail_price_per_unit: null,
      notes: null,
      internal_notes: null,
      is_no_recipe: false,
      repurposed_from_arrangement_ids: [],
      sort_order: eventArrangements.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.arrangements.push(newArrangement);
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { id: newArrangement.id };
  }

  try {
    const { db } = await import("@/lib/db");
    const { arrangements } = await import("@/db/schema");
    const { eq, count } = await import("drizzle-orm");

    const countResult = await db
      .select({ value: count() })
      .from(arrangements)
      .where(eq(arrangements.event_id, eventId));
    const sort_order = Number(countResult[0]?.value ?? 0);

    const rows = await db
      .insert(arrangements)
      .values({
        event_id: eventId,
        section_id: section_id,
        name,
        quantity: isNaN(quantity) ? 1 : quantity,
        sort_order,
      })
      .returning({ id: arrangements.id });

    revalidatePath(`/events/${eventId}`);
    return { id: rows[0]?.id };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create arrangement." };
  }
}

export async function updateArrangement(id: string, data: Record<string, unknown>) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    const idx = store.arrangements.findIndex((a) => a.id === id);
    if (idx === -1) return { error: "Arrangement not found." };
    store.arrangements[idx] = {
      ...store.arrangements[idx],
      ...data,
      updated_at: new Date().toISOString(),
    } as typeof store.arrangements[number];
    const eventId = store.arrangements[idx].event_id;
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { arrangements } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .update(arrangements)
      .set({ ...data, updated_at: new Date() })
      .where(eq(arrangements.id, id))
      .returning({ event_id: arrangements.event_id });

    if (rows[0]) revalidatePath(`/events/${rows[0].event_id}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update arrangement." };
  }
}

export async function deleteArrangement(id: string, eventId: string) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.arrangements = store.arrangements.filter((a) => a.id !== id);
    store.recipeItems = store.recipeItems.filter((r) => r.arrangement_id !== id);
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { arrangements } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(arrangements).where(eq(arrangements.id, id));
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete arrangement." };
  }
}
