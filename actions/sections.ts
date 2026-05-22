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
      is_hidden: false,
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

export async function toggleSectionVisibility(id: string, eventId: string, isHidden: boolean) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    const idx = store.eventSections.findIndex((s) => s.id === id);
    if (idx === -1) return { error: "Section not found." };
    store.eventSections[idx] = { ...store.eventSections[idx], is_hidden: isHidden, updated_at: new Date().toISOString() };
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { eventSections } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(eventSections).set({ is_hidden: isHidden, updated_at: new Date() }).where(eq(eventSections.id, id));
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update section." };
  }
}

export async function duplicateSection(id: string, eventId: string) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    const source = store.eventSections.find((s) => s.id === id);
    if (!source) return { error: "Section not found." };
    const newSectionId = crypto.randomUUID();
    store.eventSections.push({
      ...source,
      id: newSectionId,
      name: `${source.name} (copy)`,
      sort_order: store.eventSections.filter((s) => s.event_id === eventId).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const sectionArrangements = store.arrangements.filter((a) => a.section_id === id);
    for (const arr of sectionArrangements) {
      const newArrId = crypto.randomUUID();
      store.arrangements.push({
        ...arr,
        id: newArrId,
        section_id: newSectionId,
        sort_order: store.arrangements.filter((a) => a.event_id === eventId).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      for (const item of store.recipeItems.filter((r) => r.arrangement_id === arr.id)) {
        store.recipeItems.push({
          ...item,
          id: crypto.randomUUID(),
          arrangement_id: newArrId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { eventSections, arrangements, recipeItems } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const [source] = await db.select().from(eventSections).where(eq(eventSections.id, id)).limit(1);
    if (!source) return { error: "Section not found." };

    const [newSection] = await db.insert(eventSections).values({
      event_id: source.event_id,
      name: `${source.name} (copy)`,
      sort_order: source.sort_order + 1,
    }).returning({ id: eventSections.id });

    const srcArrangements = await db.select().from(arrangements).where(eq(arrangements.section_id, id));
    for (const arr of srcArrangements) {
      const [newArr] = await db.insert(arrangements).values({
        event_id: arr.event_id,
        section_id: newSection.id,
        name: arr.name,
        quantity: arr.quantity,
        target_retail_price_per_unit: arr.target_retail_price_per_unit,
        notes: arr.notes,
        internal_notes: arr.internal_notes,
        is_no_recipe: arr.is_no_recipe,
        is_hidden: arr.is_hidden,
        repurposed_from_arrangement_ids: arr.repurposed_from_arrangement_ids,
        sort_order: arr.sort_order,
      }).returning({ id: arrangements.id });

      const srcItems = await db.select().from(recipeItems).where(eq(recipeItems.arrangement_id, arr.id));
      if (srcItems.length > 0) {
        await db.insert(recipeItems).values(srcItems.map((item) => ({
          arrangement_id: newArr.id,
          master_flower_id: item.master_flower_id,
          flower_name_override: item.flower_name_override,
          palette_color_id: item.palette_color_id,
          color_text: item.color_text,
          qty_per_arrangement: item.qty_per_arrangement,
          stem_price_override: item.stem_price_override,
          sort_order: item.sort_order,
        })));
      }
    }

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to duplicate section." };
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
