"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const USER_ID = process.env.SINGLE_USER_ID ?? "00000000-0000-0000-0000-000000000001";

const HardGoodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price"),
  sources: z.string().optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z.string().optional(),
});

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name") as string,
    unit_price: formData.get("unit_price") as string,
    sources: (formData.get("sources") as string) ?? "",
    link: (formData.get("link") as string) ?? "",
    notes: (formData.get("notes") as string) ?? "",
  };
}

export async function createHardGood(formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const raw = parseFormData(formData);
  const parsed = HardGoodSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const { name, unit_price, sources, link, notes } = parsed.data;
  const sourcesArray = sources
    ? sources
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  try {
    const { db } = await import("@/lib/db");
    const { masterHardGoods } = await import("@/db/schema");
    await db.insert(masterHardGoods).values({
      user_id: USER_ID,
      name,
      unit_price,
      sources: sourcesArray,
      link: link || null,
      notes: notes || null,
    });
    revalidatePath("/catalog/hard-goods");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create hard good." };
  }
}

export async function updateHardGood(id: string, formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const raw = parseFormData(formData);
  const parsed = HardGoodSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const { name, unit_price, sources, link, notes } = parsed.data;
  const sourcesArray = sources
    ? sources
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  try {
    const { db } = await import("@/lib/db");
    const { masterHardGoods } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(masterHardGoods)
      .set({
        name,
        unit_price,
        sources: sourcesArray,
        link: link || null,
        notes: notes || null,
        updated_at: new Date(),
      })
      .where(eq(masterHardGoods.id, id));
    revalidatePath("/catalog/hard-goods");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update hard good." };
  }
}

export async function archiveHardGood(id: string) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  try {
    const { db } = await import("@/lib/db");
    const { masterHardGoods } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(masterHardGoods)
      .set({ is_archived: true, updated_at: new Date() })
      .where(eq(masterHardGoods.id, id));
    revalidatePath("/catalog/hard-goods");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to archive hard good." };
  }
}

export async function unarchiveHardGood(id: string) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  try {
    const { db } = await import("@/lib/db");
    const { masterHardGoods } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(masterHardGoods)
      .set({ is_archived: false, updated_at: new Date() })
      .where(eq(masterHardGoods.id, id));
    revalidatePath("/catalog/hard-goods");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to unarchive hard good." };
  }
}

// ---------------------------------------------------------------------------
// CSV import
// ---------------------------------------------------------------------------

const CSVRowSchema = z.object({
  name: z.string().min(1),
  unit_price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  sources: z.string().optional(),
});

export async function importHardGoodsCSV(csvText: string) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes.", inserted: 0, updated: 0, errors: [] };
  }

  const lines = csvText.trim().split("\n");
  if (lines.length < 2) {
    return { inserted: 0, updated: 0, errors: ["CSV has no data rows."] };
  }

  const dataLines = lines.slice(1);
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;

  const { db } = await import("@/lib/db");
  const { masterHardGoods } = await import("@/db/schema");
  const { eq, and } = await import("drizzle-orm");

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.trim());
    const [name, unit_price, sources] = cols;

    const parsed = CSVRowSchema.safeParse({ name, unit_price, sources });
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
        .select({ id: masterHardGoods.id })
        .from(masterHardGoods)
        .where(
          and(
            eq(masterHardGoods.name, parsed.data.name),
            eq(masterHardGoods.user_id, USER_ID)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(masterHardGoods)
          .set({
            unit_price: parsed.data.unit_price,
            sources: sourcesArray,
            updated_at: new Date(),
          })
          .where(eq(masterHardGoods.id, existing[0].id));
        updated++;
      } else {
        await db.insert(masterHardGoods).values({
          user_id: USER_ID,
          name: parsed.data.name,
          unit_price: parsed.data.unit_price,
          sources: sourcesArray,
        });
        inserted++;
      }
    } catch (err) {
      errors.push(`Row ${i + 2}: database error`);
    }
  }

  revalidatePath("/catalog/hard-goods");
  return { inserted, updated, errors };
}
