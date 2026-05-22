import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import {
  markupSettings,
  masterFlowers,
  masterHardGoods,
  masterLeis,
  events,
  eventSections,
  arrangements,
  recipeItems,
  eventPaletteColors,
  eventHardGoods,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const USER_ID =
  process.env.SINGLE_USER_ID ?? "00000000-0000-0000-0000-000000000001";

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/**
 * Parse a CSV line that may contain quoted fields (fields may include commas
 * or pipes when quoted).  Returns an array of field strings (quotes stripped,
 * inner double-quotes un-escaped).
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) {
      // Trailing empty field after a trailing comma
      break;
    }
    if (line[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      let value = "";
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            // Escaped quote inside quoted field
            value += '"';
            i += 2;
          } else {
            // End of quoted field
            i++;
            break;
          }
        } else {
          value += line[i];
          i++;
        }
      }
      fields.push(value);
      // skip comma separator
      if (line[i] === ",") i++;
    } else {
      // Unquoted field: read until next comma
      const commaIdx = line.indexOf(",", i);
      if (commaIdx === -1) {
        fields.push(line.slice(i));
        break;
      } else {
        fields.push(line.slice(i, commaIdx));
        i = commaIdx + 1;
      }
    }
  }
  return fields;
}

function readCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseSources(raw: string): string[] {
  if (!raw) return [];
  return raw.split("|").map((s) => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedMarkupSettings() {
  console.log("Seeding markup_settings…");
  const existing = await db
    .select()
    .from(markupSettings)
    .where(eq(markupSettings.user_id, USER_ID))
    .limit(1);

  if (existing.length > 0) {
    console.log("  markup_settings already exists — skipping.");
    return;
  }

  await db.insert(markupSettings).values({
    user_id: USER_ID,
    flower_markup: "4.00",
    hard_good_markup: "2.00",
    lei_markup: "1.25",
    labor_markup: "0.30",
    delivery_markup: "0.10",
    default_cleanup_fee: "200.00",
    default_tax_rate: "0.04712",
  });
  console.log("  markup_settings inserted.");
}

async function seedFlowers(seedDir: string) {
  console.log("Seeding master_flowers…");
  const rows = readCSV(path.join(seedDir, "master_flowers.csv"));
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row["name"];
    if (!name) continue;

    const existing = await db
      .select({ id: masterFlowers.id })
      .from(masterFlowers)
      .where(
        and(
          eq(masterFlowers.name, name),
          eq(masterFlowers.user_id, USER_ID)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const type = row["type"] === "greenery" ? "greenery" : "flower";
    const stemPrice = row["stem_price"] || "0";
    const stemsPerBunch = parseInt(row["stems_per_bunch"] || "1", 10);
    const sources = parseSources(row["sources"]);

    await db.insert(masterFlowers).values({
      user_id: USER_ID,
      name,
      type,
      stem_price: stemPrice,
      stems_per_bunch: stemsPerBunch,
      sources,
    });
    inserted++;
  }
  console.log(`  Inserted ${inserted}, skipped ${skipped} flowers.`);
}

async function seedHardGoods(seedDir: string) {
  console.log("Seeding master_hard_goods…");
  const rows = readCSV(path.join(seedDir, "master_hard_goods.csv"));
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row["name"];
    if (!name) continue;

    const existing = await db
      .select({ id: masterHardGoods.id })
      .from(masterHardGoods)
      .where(
        and(
          eq(masterHardGoods.name, name),
          eq(masterHardGoods.user_id, USER_ID)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const unitPrice = row["unit_price"] || "0";
    const sources = parseSources(row["sources"]);
    const link = row["link"] || null;

    await db.insert(masterHardGoods).values({
      user_id: USER_ID,
      name,
      unit_price: unitPrice,
      sources,
      link: link ?? undefined,
    });
    inserted++;
  }
  console.log(`  Inserted ${inserted}, skipped ${skipped} hard goods.`);
}

async function seedLeis(seedDir: string) {
  console.log("Seeding master_leis…");
  const rows = readCSV(path.join(seedDir, "master_leis.csv"));
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row["name"];
    if (!name) continue;

    const existing = await db
      .select({ id: masterLeis.id })
      .from(masterLeis)
      .where(
        and(
          eq(masterLeis.name, name),
          eq(masterLeis.user_id, USER_ID)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const unitPrice = row["unit_price"] || "0";
    const sources = parseSources(row["sources"]);

    await db.insert(masterLeis).values({
      user_id: USER_ID,
      name,
      unit_price: unitPrice,
      sources,
    });
    inserted++;
  }
  console.log(`  Inserted ${inserted}, skipped ${skipped} leis.`);
}

async function seedDemoEvent() {
  console.log("Seeding demo event…");

  // Skip if demo event already exists
  const existing = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(eq(events.name, "Demo Wedding"), eq(events.user_id, USER_ID))
    )
    .limit(1);

  if (existing.length > 0) {
    console.log("  Demo event already exists — skipping.");
    return;
  }

  // ---- Create event ----
  const [event] = await db
    .insert(events)
    .values({
      user_id: USER_ID,
      name: "Demo Wedding",
      status: "draft",
    })
    .returning();
  console.log(`  Created event: ${event.id}`);

  // ---- Sections ----
  const sectionNames = ["Personals", "Ceremony", "Reception"];
  const sectionRows = await db
    .insert(eventSections)
    .values(
      sectionNames.map((name, idx) => ({
        event_id: event.id,
        name,
        sort_order: idx,
      }))
    )
    .returning();

  const sectionMap: Record<string, string> = {};
  for (const s of sectionRows) {
    sectionMap[s.name] = s.id;
  }
  console.log(`  Created ${sectionRows.length} sections.`);

  // ---- Palette colors ----
  const paletteColors = [
    { name: "Blush", hex_code: "#F5C9C2" },
    { name: "Cream", hex_code: "#FAF1E4" },
    { name: "Sage", hex_code: "#B5C2A0" },
    { name: "Ivory", hex_code: "#FFFFF0" },
  ];
  const paletteRows = await db
    .insert(eventPaletteColors)
    .values(
      paletteColors.map((c, idx) => ({
        event_id: event.id,
        name: c.name,
        hex_code: c.hex_code,
        sort_order: idx,
      }))
    )
    .returning();

  const paletteMap: Record<string, string> = {};
  for (const p of paletteRows) {
    paletteMap[p.name] = p.id;
  }
  console.log(`  Created ${paletteRows.length} palette colors.`);

  // ---- Look up master flowers ----
  const lookupFlower = async (name: string) => {
    const rows = await db
      .select({ id: masterFlowers.id })
      .from(masterFlowers)
      .where(
        and(eq(masterFlowers.name, name), eq(masterFlowers.user_id, USER_ID))
      )
      .limit(1);
    return rows[0]?.id ?? null;
  };

  const lookupHardGood = async (name: string) => {
    const rows = await db
      .select({ id: masterHardGoods.id, unit_price: masterHardGoods.unit_price })
      .from(masterHardGoods)
      .where(
        and(
          eq(masterHardGoods.name, name),
          eq(masterHardGoods.user_id, USER_ID)
        )
      )
      .limit(1);
    return rows[0] ?? null;
  };

  // ---- Arrangement 1: Bridal Bouquet ----
  const [bridal] = await db
    .insert(arrangements)
    .values({
      event_id: event.id,
      section_id: sectionMap["Personals"],
      name: "Bridal Bouquet",
      quantity: 1,
      target_retail_price_per_unit: "350.00",
      sort_order: 0,
    })
    .returning();

  const gardenRoseId = await lookupFlower("Garden Rose");
  const eucalyptusId = await lookupFlower("Eucalyptus Seeded");

  await db.insert(recipeItems).values([
    {
      arrangement_id: bridal.id,
      master_flower_id: gardenRoseId ?? undefined,
      flower_name_override: gardenRoseId ? null : "Garden Rose",
      palette_color_id: paletteMap["Blush"],
      qty_per_arrangement: "12",
      sort_order: 0,
    },
    {
      arrangement_id: bridal.id,
      master_flower_id: eucalyptusId ?? undefined,
      flower_name_override: eucalyptusId ? null : "Eucalyptus Seeded",
      color_text: "Sage Green",
      qty_per_arrangement: "8",
      sort_order: 1,
    },
  ]);

  // Bridal bouquet hard good: Bouquet Pins & Ribbon (Standard)
  const bouquetPins = await lookupHardGood("Bouquet Pins & Ribbon (Standard)");
  await db.insert(eventHardGoods).values({
    event_id: event.id,
    arrangement_id: bridal.id,
    master_hard_good_id: bouquetPins?.id ?? undefined,
    name_override: bouquetPins ? null : "Bouquet Pins & Ribbon (Standard)",
    quantity: 1,
    unit_price: bouquetPins?.unit_price ?? "0.50",
    sort_order: 0,
  });

  console.log("  Created Bridal Bouquet arrangement.");

  // ---- Arrangement 2: Guest Table Centerpiece ----
  const [centerpiece] = await db
    .insert(arrangements)
    .values({
      event_id: event.id,
      section_id: sectionMap["Reception"],
      name: "Guest Table Centerpiece",
      quantity: 8,
      target_retail_price_per_unit: "125.00",
      sort_order: 1,
    })
    .returning();

  const roseId = await lookupFlower("Rose");
  const babysBreathId = await lookupFlower("Baby's Breath");

  await db.insert(recipeItems).values([
    {
      arrangement_id: centerpiece.id,
      master_flower_id: roseId ?? undefined,
      flower_name_override: roseId ? null : "Rose",
      palette_color_id: paletteMap["Cream"],
      qty_per_arrangement: "10",
      sort_order: 0,
    },
    {
      arrangement_id: centerpiece.id,
      master_flower_id: babysBreathId ?? undefined,
      flower_name_override: babysBreathId ? null : "Baby's Breath",
      color_text: "White",
      qty_per_arrangement: "5",
      sort_order: 1,
    },
  ]);

  // Centerpiece hard good: Foam Brick
  const foamBrick = await lookupHardGood("Foam Brick");
  await db.insert(eventHardGoods).values({
    event_id: event.id,
    arrangement_id: centerpiece.id,
    master_hard_good_id: foamBrick?.id ?? undefined,
    name_override: foamBrick ? null : "Foam Brick",
    quantity: 1,
    unit_price: foamBrick?.unit_price ?? "4.50",
    sort_order: 0,
  });

  console.log("  Created Guest Table Centerpiece arrangement.");

  // ---- General hard good: Airline Wire (50ft) ----
  const airlineWire = await lookupHardGood("Airline Wire (50ft)");
  await db.insert(eventHardGoods).values({
    event_id: event.id,
    arrangement_id: undefined,
    master_hard_good_id: airlineWire?.id ?? undefined,
    name_override: airlineWire ? null : "Airline Wire (50ft)",
    quantity: 1,
    unit_price: airlineWire?.unit_price ?? "20.00",
    sort_order: 1,
  });

  console.log("  Created general hard good (Airline Wire).");

  // ---- Repurposed arrangement ----
  await db.insert(arrangements).values({
    event_id: event.id,
    section_id: sectionMap["Reception"],
    name: "Reception Centerpieces (Small)",
    quantity: 6,
    target_retail_price_per_unit: "85.00",
    sort_order: 2,
    repurposed_from_arrangement_ids: [centerpiece.id],
  });

  console.log("  Created repurposed arrangement.");
  console.log("Demo event seeded successfully.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const seedDir = path.resolve(process.cwd(), "seed-data");

  await seedMarkupSettings();
  await seedFlowers(seedDir);
  await seedHardGoods(seedDir);
  await seedLeis(seedDir);
  await seedDemoEvent();

  console.log("\nSeed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
