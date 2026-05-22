"use server";

import { revalidatePath } from "next/cache";

export async function createSection(eventId: string, name: string) {
  if (!name.trim()) return { error: "Section name is required." };

  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    const eventSections = store.eventSections.filter((s) => s.event_id === eventId);
    const newSection = {
      id: crypto.randomUUID(),
      event_id: eventId,
      name: name.trim(),
      sort_order: eventSections.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.eventSections.push(newSection);
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { id: newSection.id };
  }

  try {
    const { db } = await import("@/lib/db");
    const { eventSections } = await import("@/db/schema");
    const { eq, count } = await import("drizzle-orm");

    const countResult = await db
      .select({ value: count() })
      .from(eventSections)
      .where(eq(eventSections.event_id, eventId));
    const sort_order = Number(countResult[0]?.value ?? 0);

    const rows = await db
      .insert(eventSections)
      .values({ event_id: eventId, name: name.trim(), sort_order })
      .returning({ id: eventSections.id });

    revalidatePath(`/events/${eventId}`);
    return { id: rows[0]?.id };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create section." };
  }
}

export async function updateSection(id: string, name: string) {
  if (!name.trim()) return { error: "Section name is required." };

  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    const idx = store.eventSections.findIndex((s) => s.id === id);
    if (idx === -1) return { error: "Section not found." };
    store.eventSections[idx] = {
      ...store.eventSections[idx],
      name: name.trim(),
      updated_at: new Date().toISOString(),
    };
    const eventId = store.eventSections[idx].event_id;
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { eventSections } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .update(eventSections)
      .set({ name: name.trim(), updated_at: new Date() })
      .where(eq(eventSections.id, id))
      .returning({ event_id: eventSections.event_id });

    if (rows[0]) revalidatePath(`/events/${rows[0].event_id}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update section." };
  }
}

export async function deleteSection(id: string, eventId: string) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.eventSections = store.eventSections.filter((s) => s.id !== id);
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { eventSections } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(eventSections).where(eq(eventSections.id, id));
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete section." };
  }
}
