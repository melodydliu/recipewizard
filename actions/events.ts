"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const USER_ID =
  process.env.SINGLE_USER_ID ?? "00000000-0000-0000-0000-000000000001";

const EventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  client_name: z.string().optional(),
  event_date: z.string().optional(),
  status: z
    .enum(["draft", "proposal_sent", "confirmed", "completed", "archived"])
    .optional()
    .default("draft"),
  notes: z.string().optional(),
});

export async function createEvent(formData: FormData) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  const raw = {
    name: formData.get("name") as string,
    client_name: (formData.get("client_name") as string) || undefined,
    event_date: (formData.get("event_date") as string) || undefined,
    status: (formData.get("status") as string) || undefined,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = EventSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const { name, client_name, event_date, status, notes } = parsed.data;

  try {
    const { db } = await import("@/lib/db");
    const { events, eventSections, markupSettings } = await import(
      "@/db/schema"
    );

    // Pull default tax rate + cleanup fee from markup settings if available
    const settingsRows = await db.select().from(markupSettings).limit(1);
    const settings = settingsRows[0];

    const eventRows = await db
      .insert(events)
      .values({
        user_id: USER_ID,
        name,
        client_name: client_name || null,
        event_date: event_date || null,
        status: status as
          | "draft"
          | "proposal_sent"
          | "confirmed"
          | "completed"
          | "archived",
        notes: notes || null,
        tax_rate: settings?.default_tax_rate ?? "0.04712",
        cleanup_fee: settings?.default_cleanup_fee ?? "200.00",
      })
      .returning({ id: events.id });

    const eventId = eventRows[0]?.id;
    if (!eventId) return { error: "Failed to create event." };

    // Create 3 default sections
    await db.insert(eventSections).values([
      { event_id: eventId, name: "Personals", sort_order: 0 },
      { event_id: eventId, name: "Ceremony", sort_order: 1 },
      { event_id: eventId, name: "Reception", sort_order: 2 },
    ]);

    revalidatePath("/events");
    return { id: eventId };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create event." };
  }
}

type ValidEventStatus =
  | "draft"
  | "proposal_sent"
  | "confirmed"
  | "completed"
  | "archived";

export async function updateEvent(
  id: string,
  data: Partial<{
    name: string;
    client_name: string;
    event_date: string;
    status: ValidEventStatus;
    notes: string;
  }>
) {
  if (!process.env.DATABASE_URL) {
    return { error: "Connect a database to save changes." };
  }

  try {
    const { db } = await import("@/lib/db");
    const { events } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db
      .update(events)
      .set({ ...data, updated_at: new Date() })
      .where(eq(events.id, id));

    revalidatePath(`/events/${id}`);
    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update event." };
  }
}

const VALID_STATUSES = [
  "draft",
  "proposal_sent",
  "confirmed",
  "completed",
  "archived",
] as const;

export async function updateEventStatus(id: string, status: string) {
  const validStatus = VALID_STATUSES.includes(status as ValidEventStatus)
    ? (status as ValidEventStatus)
    : "draft";
  return updateEvent(id, { status: validStatus });
}

export async function toggleServicesVisibility(eventId: string, isHidden: boolean) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.eventFeeOverrides = store.eventFeeOverrides ?? {};
    store.eventFeeOverrides[eventId] = {
      ...store.eventFeeOverrides[eventId],
      services_hidden: isHidden,
    };
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function updateEventServiceFees(
  eventId: string,
  fees: { cleanup_fee?: string; labor_fee_override?: string | null; labor_pct_override?: string | null }
) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.eventFeeOverrides = store.eventFeeOverrides ?? {};
    store.eventFeeOverrides[eventId] = {
      ...store.eventFeeOverrides[eventId],
      ...fees,
    };
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  try {
    const { db } = await import("@/lib/db");
    const { events } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (fees.cleanup_fee !== undefined) updateData.cleanup_fee = fees.cleanup_fee;
    if ("labor_fee_override" in fees) updateData.labor_fee_override = fees.labor_fee_override;

    await db.update(events).set(updateData).where(eq(events.id, eventId));
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update service fees." };
  }
}
