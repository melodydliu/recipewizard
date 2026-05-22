"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const USER_ID = process.env.SINGLE_USER_ID ?? "00000000-0000-0000-0000-000000000001";

const SettingsSchema = z.object({
  flower_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  hard_good_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  lei_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  labor_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  delivery_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  default_cleanup_fee: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  default_tax_rate: z.string().regex(/^\d+(\.\d{1,5})?$/, "Must be a valid rate"),
});

export async function updateSettings(formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const raw = {
    flower_markup: formData.get("flower_markup") as string,
    hard_good_markup: formData.get("hard_good_markup") as string,
    lei_markup: formData.get("lei_markup") as string,
    labor_markup: formData.get("labor_markup") as string,
    delivery_markup: formData.get("delivery_markup") as string,
    default_cleanup_fee: formData.get("default_cleanup_fee") as string,
    default_tax_rate: formData.get("default_tax_rate") as string,
  };

  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  try {
    const { db } = await import("@/lib/db");
    const { markupSettings } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const existing = await db
      .select({ id: markupSettings.id })
      .from(markupSettings)
      .where(eq(markupSettings.user_id, USER_ID))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(markupSettings)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(eq(markupSettings.id, existing[0].id));
    } else {
      await db.insert(markupSettings).values({
        user_id: USER_ID,
        ...parsed.data,
      });
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to save settings." };
  }
}
