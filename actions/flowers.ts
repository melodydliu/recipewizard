"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const USER_ID = process.env.SINGLE_USER_ID ?? "00000000-0000-0000-0000-000000000001";

const FlowerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["flower", "greenery"]),
  stem_price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price"),
  stems_per_bunch: z
    .string()
    .regex(/^\d+$/, "Must be a whole number")
    .transform(Number),
  sources: z.string().optional(),
  notes: z.string().optional(),
});

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    stem_price: formData.get("stem_price") as string,
    stems_per_bunch: formData.get("stems_per_bunch") as string,
    sources: (formData.get("sources") as string) ?? "",
    notes: (formData.get("notes") as string) ?? "",
  };
}

export async function createFlower(formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const raw = parseFormData(formData);
  const parsed = FlowerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const { name, type, stem_price, stems_per_bunch, sources, notes } = parsed.data;
  const sourcesArray = sources
    ? sources
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  try {
    const { db } = await import("@/lib/db");
    const { masterFlowers } = await import("@/db/schema");
    await db.insert(masterFlowers).values({
      user_id: USER_ID,
      name,
      type,
      stem_price,
      stems_per_bunch,
      sources: sourcesArray,
      notes: notes || null,
    });
    revalidatePath("/catalog/flowers");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create flower." };
  }
}

export async function updateFlower(id: string, formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const raw = parseFormData(formData);
  const parsed = FlowerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const { name, type, stem_price, stems_per_bunch, sources, notes } = parsed.data;
  const sourcesArray = sources
    ? sources
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  try {
    const { db } = await import("@/lib/db");
    const { masterFlowers } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(masterFlowers)
      .set({
        name,
        type,
        stem_price,
        stems_per_bunch,
        sources: sourcesArray,
        notes: notes || null,
        updated_at: new Date(),
      })
      .where(eq(masterFlowers.id, id));
    revalidatePath("/catalog/flowers");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update flower." };
  }
}

export async function archiveFlower(id: string) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  try {
    const { db } = await import("@/lib/db");
    const { masterFlowers } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(masterFlowers)
      .set({ is_archived: true, updated_at: new Date() })
      .where(eq(masterFlowers.id, id));
    revalidatePath("/catalog/flowers");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to archive flower." };
  }
}

export async function unarchiveFlower(id: string) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  try {
    const { db } = await import("@/lib/db");
    const { masterFlowers } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(masterFlowers)
      .set({ is_archived: false, updated_at: new Date() })
      .where(eq(masterFlowers.id, id));
    revalidatePath("/catalog/flowers");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to unarchive flower." };
  }
}

// ---------------------------------------------------------------------------
// CSV import
// ---------------------------------------------------------------------------

const CSVRowSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["flower", "greenery"]),
  stem_price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  stems_per_bunch: z.string().regex(/^\d+$/).transform(Number),
  sources: z.string().optional(),
});

export async function importFlowersCSV(csvText: string) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes.", inserted: 0, updated: 0, errors: [] };
  }

  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    return { inserted: 0, updated: 0, errors: ["CSV has no data rows."] };
  }

  // skip header row
  const dataLines = lines.slice(1);
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  const { db } = await import("@/lib/db");
  const { masterFlowers } = await import("@/db/schema");
  const { eq, and } = await import("drizzle-orm");

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim());
    const [name, type, stem_price, stems_per_bunch, sources] = cols;

    const parsed = CSVRowSchema.safeParse({ name, type, stem_price, stems_per_bunch, sources });
    if (!parsed.success) {
      errors.push(`Row ${i + 2}: ${parsed.error.errors[0]?.message ?? "invalid"}`);
      continue;
    }

    const sourcesArray = parsed.data.sources
      ? parsed.data.sources
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      const existing = await db
        .select({ id: masterFlowers.id })
        .from(masterFlowers)
        .where(
          and(
            eq(masterFlowers.name, parsed.data.name),
            eq(masterFlowers.user_id, USER_ID)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(masterFlowers)
          .set({
            type: parsed.data.type,
            stem_price: parsed.data.stem_price,
            stems_per_bunch: parsed.data.stems_per_bunch,
            sources: sourcesArray,
            updated_at: new Date(),
          })
          .where(eq(masterFlowers.id, existing[0].id));
        updated++;
      } else {
        await db.insert(masterFlowers).values({
          user_id: USER_ID,
          name: parsed.data.name,
          type: parsed.data.type,
          stem_price: parsed.data.stem_price,
          stems_per_bunch: parsed.data.stems_per_bunch,
          sources: sourcesArray,
        });
        inserted++;
      }
    } catch (err) {
      errors.push(`Row ${i + 2}: database error`);
    }
  }

  revalidatePath("/catalog/flowers");
  return { inserted, updated, errors };
}
