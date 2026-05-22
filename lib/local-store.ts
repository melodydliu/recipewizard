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

export type LocalSection = Omit<(typeof mock.mockEventSections)[number], "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

export type LocalArrangement = Omit<(typeof mock.mockArrangements)[number], "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

export type LocalRecipeItem = Omit<(typeof mock.mockRecipeItems)[number], "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

export type Store = {
  eventSections: LocalSection[];
  arrangements: LocalArrangement[];
  recipeItems: LocalRecipeItem[];
};

// ---------------------------------------------------------------------------
// Read / write
// ---------------------------------------------------------------------------

function defaultStore(): Store {
  return {
    eventSections: mock.mockEventSections.map((s) => ({ ...s })) as LocalSection[],
    arrangements: mock.mockArrangements.map((a) => ({ ...a })) as LocalArrangement[],
    recipeItems: mock.mockRecipeItems.map((r) => ({ ...r })) as LocalRecipeItem[],
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
