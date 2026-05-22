"use server";

import { revalidatePath } from "next/cache";

export async function addPaletteColor(eventId: string, formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const name = (formData.get("name") as string)?.trim();
  const hex_code = (formData.get("hex_code") as string)?.trim();

  if (!name) return { error: "Color name is required." };
  if (!hex_code) return { error: "Hex code is required." };

  try {
    const { db } = await import("@/lib/db");
    const { eventPaletteColors } = await import("@/db/schema");
    const { eq, count } = await import("drizzle-orm");

    const countResult = await db
      .select({ value: count() })
      .from(eventPaletteColors)
      .where(eq(eventPaletteColors.event_id, eventId));
    const sort_order = Number(countResult[0]?.value ?? 0);

    await db.insert(eventPaletteColors).values({
      event_id: eventId,
      name,
      hex_code,
      sort_order,
    });

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to add color." };
  }
}

export async function updatePaletteColor(id: string, formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const name = (formData.get("name") as string)?.trim();
  const hex_code = (formData.get("hex_code") as string)?.trim();

  if (!name) return { error: "Color name is required." };
  if (!hex_code) return { error: "Hex code is required." };

  try {
    const { db } = await import("@/lib/db");
    const { eventPaletteColors } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .update(eventPaletteColors)
      .set({ name, hex_code, updated_at: new Date() })
      .where(eq(eventPaletteColors.id, id))
      .returning({ event_id: eventPaletteColors.event_id });

    if (rows[0]) revalidatePath(`/events/${rows[0].event_id}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update color." };
  }
}

export async function deletePaletteColor(id: string, eventId: string) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  try {
    const { db } = await import("@/lib/db");
    const { eventPaletteColors } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(eventPaletteColors).where(eq(eventPaletteColors.id, id));
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete color." };
  }
}

export async function reorderPaletteColors(
  eventId: string,
  orderedIds: string[]
) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  try {
    const { db } = await import("@/lib/db");
    const { eventPaletteColors } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await Promise.all(
      orderedIds.map((colorId, index) =>
        db
          .update(eventPaletteColors)
          .set({ sort_order: index, updated_at: new Date() })
          .where(eq(eventPaletteColors.id, colorId))
      )
    );

    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to reorder colors." };
  }
}
