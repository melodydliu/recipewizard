/**
 * File-based store for local development (no DATABASE_URL).
 * Data is persisted to .local-data/store.json between requests.
 * Delete that file to reset to the seeded mock data.
 */

import fs from "fs";
import path from "path";
import * as mock from "./mock-data";

const STORE_DIR = path.join(process.cwd(), ".local-data");
const STORE_PATH = path.join(STORE_DIR, "store.json");

// ---------------------------------------------------------------------------
// Types (match mock-data shapes, dates become strings after JSON roundtrip)
// ---------------------------------------------------------------------------

export type LocalSection = {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
};

export type LocalArrangement = {
  id: string;
  event_id: string;
  section_id: string | null;
  name: string;
  quantity: number;
  target_retail_price_per_unit: string | null;
  notes: string | null;
  internal_notes: string | null;
  is_no_recipe: boolean;
  repurposed_from_arrangement_ids: string[];
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
};

export type LocalRecipeItem = {
  id: string;
  arrangement_id: string;
  master_flower_id: string | null;
  flower_name_override: string | null;
  palette_color_id: string | null;
  color_text: string | null;
  qty_per_arrangement: string;
  stem_price_override: string | null;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
};

export type EventFeeOverride = {
  cleanup_fee?: string;
  labor_fee_override?: string | null;
};

export type Store = {
  eventSections: LocalSection[];
  arrangements: LocalArrangement[];
  recipeItems: LocalRecipeItem[];
  eventFeeOverrides: Record<string, EventFeeOverride>;
};

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

function defaultStore(): Store {
  return {
    eventSections: mock.mockEventSections.map((s) => ({ ...s })) as LocalSection[],
    arrangements: mock.mockArrangements.map((a) => ({ ...a })) as LocalArrangement[],
    recipeItems: mock.mockRecipeItems.map((r) => ({ ...r })) as LocalRecipeItem[],
    eventFeeOverrides: {},
  };
}

export function readStore(): Store {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    return defaultStore();
  }
}

export function writeStore(store: Store): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}
