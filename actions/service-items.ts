"use server";

import { revalidatePath } from "next/cache";

export async function createServiceItem(
  eventId: string,
  data: { name: string; notes: string | null; price: string }
) {
  if (!data.name.trim()) return { error: "Name is required." };

  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.serviceItems = store.serviceItems ?? [];
    const newItem = {
      id: crypto.randomUUID(),
      event_id: eventId,
      name: data.name.trim(),
      notes: data.notes || null,
      price: data.price || "0.00",
      is_hidden: false,
      sort_order: store.serviceItems.filter((i) => i.event_id === eventId).length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.serviceItems.push(newItem);
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { id: newItem.id };
  }

  return { error: "Database mode not yet supported for service items." };
}

export async function updateServiceItem(
  id: string,
  eventId: string,
  data: { name?: string; notes?: string | null; price?: string; is_hidden?: boolean }
) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.serviceItems = store.serviceItems ?? [];
    const idx = store.serviceItems.findIndex((i) => i.id === id);
    if (idx === -1) return { error: "Item not found." };
    store.serviceItems[idx] = {
      ...store.serviceItems[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  return { error: "Database mode not yet supported for service items." };
}

export async function deleteServiceItem(id: string, eventId: string) {
  if (!process.env.DATABASE_URL) {
    const { readStore, writeStore } = await import("@/lib/local-store");
    const store = readStore();
    store.serviceItems = (store.serviceItems ?? []).filter((i) => i.id !== id);
    writeStore(store);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  }

  return { error: "Database mode not yet supported for service items." };
}
