import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  date,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const flowerTypeEnum = pgEnum("flower_type", ["flower", "greenery"]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "proposal_sent",
  "confirmed",
  "completed",
  "archived",
]);

export const mediaCategory = pgEnum("media_category", [
  "mood_board",
  "concept_sketch",
  "inspiration",
  "past_work_reference",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const masterFlowers = pgTable("master_flowers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"),
  name: text("name").notNull(),
  type: flowerTypeEnum("type").notNull(),
  stem_price: numeric("stem_price", { precision: 10, scale: 2 }).notNull(),
  stems_per_bunch: integer("stems_per_bunch").notNull(),
  sources: text("sources")
    .array()
    .default(sql`'{}'`),
  notes: text("notes"),
  is_archived: boolean("is_archived").default(false),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const masterHardGoods = pgTable("master_hard_goods", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"),
  name: text("name").notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  sources: text("sources")
    .array()
    .default(sql`'{}'`),
  link: text("link"),
  notes: text("notes"),
  is_archived: boolean("is_archived").default(false),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const masterLeis = pgTable("master_leis", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"),
  name: text("name").notNull(),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  sources: text("sources")
    .array()
    .default(sql`'{}'`),
  is_archived: boolean("is_archived").default(false),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const markupSettings = pgTable("markup_settings", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").unique(),
  flower_markup: numeric("flower_markup", { precision: 10, scale: 4 })
    .notNull()
    .default("4.00"),
  hard_good_markup: numeric("hard_good_markup", { precision: 10, scale: 4 })
    .notNull()
    .default("2.00"),
  lei_markup: numeric("lei_markup", { precision: 10, scale: 4 })
    .notNull()
    .default("1.25"),
  labor_markup: numeric("labor_markup", { precision: 10, scale: 4 })
    .notNull()
    .default("0.30"),
  delivery_markup: numeric("delivery_markup", { precision: 10, scale: 4 })
    .notNull()
    .default("0.10"),
  default_cleanup_fee: numeric("default_cleanup_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("200.00"),
  default_tax_rate: numeric("default_tax_rate", { precision: 10, scale: 5 })
    .notNull()
    .default("0.04712"),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const events = pgTable("events", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"),
  name: text("name").notNull(),
  client_name: text("client_name"),
  event_date: date("event_date"),
  tax_rate: numeric("tax_rate", { precision: 10, scale: 5 })
    .notNull()
    .default("0.04712"),
  cleanup_fee: numeric("cleanup_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("200.00"),
  labor_fee_override: numeric("labor_fee_override", { precision: 10, scale: 2 }),
  status: eventStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  inspiration_notes: text("inspiration_notes"),
  public_slug: text("public_slug").unique(),
  is_public: boolean("is_public").default(false),
  public_pin: text("public_pin"),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const eventSections = pgTable("event_sections", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  event_id: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  is_hidden: boolean("is_hidden").notNull().default(false),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const arrangements = pgTable("arrangements", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  event_id: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  section_id: uuid("section_id").references(() => eventSections.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  target_retail_price_per_unit: numeric("target_retail_price_per_unit", {
    precision: 10,
    scale: 2,
  }),
  notes: text("notes"),
  internal_notes: text("internal_notes"),
  sort_order: integer("sort_order").notNull().default(0),
  is_no_recipe: boolean("is_no_recipe").notNull().default(false),
  is_hidden: boolean("is_hidden").notNull().default(false),
  repurposed_from_arrangement_ids: uuid("repurposed_from_arrangement_ids")
    .array()
    .notNull()
    .default(sql`'{}'`),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const recipeItems = pgTable("recipe_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  arrangement_id: uuid("arrangement_id")
    .notNull()
    .references(() => arrangements.id, { onDelete: "cascade" }),
  master_flower_id: uuid("master_flower_id").references(
    () => masterFlowers.id,
    { onDelete: "set null" }
  ),
  flower_name_override: text("flower_name_override"),
  palette_color_id: uuid("palette_color_id"),
  color_text: text("color_text"),
  qty_per_arrangement: numeric("qty_per_arrangement", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("1"),
  stem_price_override: numeric("stem_price_override", {
    precision: 10,
    scale: 2,
  }),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const eventPaletteColors = pgTable(
  "event_palette_colors",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    event_id: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hex_code: text("hex_code").notNull(),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").default(sql`now()`),
    updated_at: timestamp("updated_at").default(sql`now()`),
  },
  (table) => [unique().on(table.event_id, table.name)]
);

export const eventHardGoods = pgTable(
  "event_hard_goods",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    event_id: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    arrangement_id: uuid("arrangement_id").references(() => arrangements.id, {
      onDelete: "set null",
    }),
    master_hard_good_id: uuid("master_hard_good_id").references(
      () => masterHardGoods.id,
      { onDelete: "set null" }
    ),
    name_override: text("name_override"),
    quantity: integer("quantity").notNull().default(1),
    unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    purchased: boolean("purchased").notNull().default(false),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at").default(sql`now()`),
    updated_at: timestamp("updated_at").default(sql`now()`),
  },
  (table) => [index("event_hard_goods_event_arrangement_idx").on(table.event_id, table.arrangement_id)]
);

export const eventMedia = pgTable("event_media", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  event_id: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  category: mediaCategory("category").notNull(),
  image_url: text("image_url").notNull(),
  caption: text("caption"),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const recipeLibraryEntries = pgTable("recipe_library_entries", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"),
  name: text("name").notNull(),
  default_target_price: numeric("default_target_price", {
    precision: 10,
    scale: 2,
  }),
  notes: text("notes"),
  cover_image_url: text("cover_image_url"),
  tag_style: text("tag_style")
    .array()
    .default(sql`'{}'`),
  tag_palette: text("tag_palette")
    .array()
    .default(sql`'{}'`),
  tag_size: text("tag_size"),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const libraryRecipeItems = pgTable("library_recipe_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  library_entry_id: uuid("library_entry_id")
    .notNull()
    .references(() => recipeLibraryEntries.id, { onDelete: "cascade" }),
  master_flower_id: uuid("master_flower_id").references(
    () => masterFlowers.id,
    { onDelete: "set null" }
  ),
  flower_name_override: text("flower_name_override"),
  color_text: text("color_text"),
  qty_per_arrangement: numeric("qty_per_arrangement", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("1"),
  stem_price_override: numeric("stem_price_override", {
    precision: 10,
    scale: 2,
  }),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

export const libraryHardGoods = pgTable("library_hard_goods", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  library_entry_id: uuid("library_entry_id")
    .notNull()
    .references(() => recipeLibraryEntries.id, { onDelete: "cascade" }),
  master_hard_good_id: uuid("master_hard_good_id").references(
    () => masterHardGoods.id,
    { onDelete: "set null" }
  ),
  name_override: text("name_override"),
  quantity: integer("quantity").notNull().default(1),
  unit_price: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at").default(sql`now()`),
  updated_at: timestamp("updated_at").default(sql`now()`),
});

// ---------------------------------------------------------------------------
// Namespace export
// ---------------------------------------------------------------------------

export const schema = {
  flowerTypeEnum,
  eventStatusEnum,
  mediaCategory,
  masterFlowers,
  masterHardGoods,
  masterLeis,
  markupSettings,
  events,
  eventSections,
  arrangements,
  recipeItems,
  eventPaletteColors,
  eventHardGoods,
  eventMedia,
  recipeLibraryEntries,
  libraryRecipeItems,
  libraryHardGoods,
};
