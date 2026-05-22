/**
 * Placeholder data used when DATABASE_URL is not configured.
 * Shapes match the Drizzle schema exactly so swapping to real queries is trivial.
 */

// ---------------------------------------------------------------------------
// Markup settings
// ---------------------------------------------------------------------------

export const mockMarkupSettings = {
  id: "00000000-0000-0000-0000-000000000010",
  user_id: "00000000-0000-0000-0000-000000000001",
  flower_markup: "4.00",
  hard_good_markup: "2.00",
  lei_markup: "1.25",
  labor_markup: "0.30",
  delivery_markup: "0.10",
  default_cleanup_fee: "200.00",
  default_tax_rate: "0.04712",
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
};

// ---------------------------------------------------------------------------
// Master flowers (subset of your real seed data)
// ---------------------------------------------------------------------------

export const mockFlowers = [
  { id: "f01", user_id: null, name: "Garden Rose", type: "flower" as const, stem_price: "4.17", stems_per_bunch: 12, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f02", user_id: null, name: "Rose", type: "flower" as const, stem_price: "1.40", stems_per_bunch: 25, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f03", user_id: null, name: "Lisianthus", type: "flower" as const, stem_price: "3.10", stems_per_bunch: 5, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f04", user_id: null, name: "Ranunculus", type: "flower" as const, stem_price: "2.50", stems_per_bunch: 10, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f05", user_id: null, name: "Peony", type: "flower" as const, stem_price: "3.00", stems_per_bunch: 5, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f06", user_id: null, name: "Sweet Pea", type: "flower" as const, stem_price: "3.05", stems_per_bunch: 10, sources: ["Mayesh"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f07", user_id: null, name: "Dahlia", type: "flower" as const, stem_price: "4.40", stems_per_bunch: 5, sources: ["Watanabe", "Mayesh"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f08", user_id: null, name: "Baby's Breath", type: "flower" as const, stem_price: "1.05", stems_per_bunch: 10, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f09", user_id: null, name: "Eucalyptus Seeded", type: "greenery" as const, stem_price: "1.10", stems_per_bunch: 10, sources: ["Mayesh"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f10", user_id: null, name: "Italian Ruscus", type: "greenery" as const, stem_price: "2.70", stems_per_bunch: 5, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f11", user_id: null, name: "Hydrangea (White)", type: "flower" as const, stem_price: "4.00", stems_per_bunch: 1, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f12", user_id: null, name: "Spray Rose", type: "flower" as const, stem_price: "1.65", stems_per_bunch: 10, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f13", user_id: null, name: "Astilbe", type: "flower" as const, stem_price: "2.20", stems_per_bunch: 10, sources: ["Mayesh", "Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f14", user_id: null, name: "Scabiosa", type: "flower" as const, stem_price: "1.20", stems_per_bunch: 10, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f15", user_id: null, name: "Jasmine Vine", type: "greenery" as const, stem_price: "1.65", stems_per_bunch: 10, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f16", user_id: null, name: "Delphinium (Hybrid)", type: "flower" as const, stem_price: "1.70", stems_per_bunch: 10, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f17", user_id: null, name: "Tulip", type: "flower" as const, stem_price: "1.15", stems_per_bunch: 10, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "f18", user_id: null, name: "Orchid Lei (Single, White)", type: "flower" as const, stem_price: "2.35", stems_per_bunch: 5, sources: ["Watanabe"], notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
];

// ---------------------------------------------------------------------------
// Master hard goods
// ---------------------------------------------------------------------------

export const mockHardGoods = [
  { id: "hg01", user_id: null, name: "Bouquet Pins & Ribbon (Standard)", unit_price: "0.50", sources: ["Floradec"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg02", user_id: null, name: "Foam Brick", unit_price: "4.50", sources: ["Floradec"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg03", user_id: null, name: "Airline Wire (50ft)", unit_price: "20.00", sources: ["Amazon"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg04", user_id: null, name: "Vase, Bouquet (Standard)", unit_price: "5.00", sources: ["Amazon"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg05", user_id: null, name: "Vase, 4\"-5\" Glass Cylinder", unit_price: "5.00", sources: ["Amazon"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg06", user_id: null, name: "Foam Cage, Standard", unit_price: "6.00", sources: ["Floradec"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg07", user_id: null, name: "Water Tubes", unit_price: "0.20", sources: ["Floradec"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg08", user_id: null, name: "Boutonniere Pins & Ribbon (Standard)", unit_price: "0.25", sources: ["Floradec"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg09", user_id: null, name: "Toss Petal Cones & Ribbon", unit_price: "0.15", sources: ["Floradec"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "hg10", user_id: null, name: "Chicken Wire (1 sq/ft)", unit_price: "1.00", sources: ["Lowes"], link: null, notes: null, is_archived: false, created_at: new Date(), updated_at: new Date() },
];

// ---------------------------------------------------------------------------
// Master leis
// ---------------------------------------------------------------------------

export const mockLeis = [
  { id: "l01", user_id: null, name: "Orchid Lei, Single, White", unit_price: "18.00", sources: ["Watanabe", "Cindys"], is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "l02", user_id: null, name: "Orchid Lei, Single, Purple", unit_price: "10.00", sources: ["Watanabe"], is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "l03", user_id: null, name: "Maile Lei", unit_price: "70.00", sources: ["Watanabe"], is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "l04", user_id: null, name: "Maile Lei, Ti, Single", unit_price: "12.00", sources: ["Watanabe"], is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "l05", user_id: null, name: "Tuberose Lei, Single", unit_price: "18.00", sources: ["Watanabe"], is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "l06", user_id: null, name: "Tuberose Lei, Double", unit_price: "50.00", sources: ["Watanabe"], is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "l07", user_id: null, name: "Crown Flower Lei, Single", unit_price: "12.00", sources: ["Cindys"], is_archived: false, created_at: new Date(), updated_at: new Date() },
  { id: "l08", user_id: null, name: "Kukui Nut Lei", unit_price: "8.00", sources: ["Watanabe"], is_archived: false, created_at: new Date(), updated_at: new Date() },
];

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const mockEvents = [
  {
    id: "e01",
    user_id: "00000000-0000-0000-0000-000000000001",
    name: "Demo Wedding",
    client_name: "Sarah & James Miller",
    event_date: "2026-06-14",
    tax_rate: "0.04712",
    cleanup_fee: "200.00",
    status: "confirmed" as const,
    notes: "Ceremony at 4pm, reception at 6pm. Venue: Halekulani.",
    inspiration_notes: null,
    public_slug: "demo-wedding",
    is_public: false,
    public_pin: null,
    created_at: new Date("2026-04-01"),
    updated_at: new Date("2026-04-15"),
    // derived / joined
    grand_total: "4823.00",
  },
  {
    id: "e02",
    user_id: "00000000-0000-0000-0000-000000000001",
    name: "Johnson Baby Shower",
    client_name: "Emily Johnson",
    event_date: "2026-05-30",
    tax_rate: "0.04712",
    cleanup_fee: "0.00",
    status: "proposal_sent" as const,
    notes: "Garden party theme. Soft pinks and whites.",
    inspiration_notes: null,
    public_slug: "johnson-baby-shower",
    is_public: false,
    public_pin: null,
    created_at: new Date("2026-04-20"),
    updated_at: new Date("2026-04-22"),
    grand_total: "1240.00",
  },
  {
    id: "e03",
    user_id: "00000000-0000-0000-0000-000000000001",
    name: "Chen Corporate Gala",
    client_name: "Aloha Hotels Group",
    event_date: "2026-07-18",
    tax_rate: "0.04712",
    cleanup_fee: "200.00",
    status: "draft" as const,
    notes: null,
    inspiration_notes: null,
    public_slug: "chen-corporate-gala",
    is_public: false,
    public_pin: null,
    created_at: new Date("2026-05-01"),
    updated_at: new Date("2026-05-01"),
    grand_total: "0.00",
  },
];

// ---------------------------------------------------------------------------
// Event sections
// ---------------------------------------------------------------------------

export const mockEventSections = [
  { id: "s01", event_id: "e01", name: "Personals", sort_order: 0, created_at: new Date(), updated_at: new Date() },
  { id: "s02", event_id: "e01", name: "Ceremony", sort_order: 1, created_at: new Date(), updated_at: new Date() },
  { id: "s03", event_id: "e01", name: "Reception", sort_order: 2, created_at: new Date(), updated_at: new Date() },
];

// ---------------------------------------------------------------------------
// Palette colors
// ---------------------------------------------------------------------------

export const mockPaletteColors = [
  { id: "p01", event_id: "e01", name: "Blush", hex_code: "#F5C9C2", sort_order: 0, created_at: new Date(), updated_at: new Date() },
  { id: "p02", event_id: "e01", name: "Cream", hex_code: "#FAF1E4", sort_order: 1, created_at: new Date(), updated_at: new Date() },
  { id: "p03", event_id: "e01", name: "Sage", hex_code: "#B5C2A0", sort_order: 2, created_at: new Date(), updated_at: new Date() },
  { id: "p04", event_id: "e01", name: "Ivory", hex_code: "#FFFFF0", sort_order: 3, created_at: new Date(), updated_at: new Date() },
];

// ---------------------------------------------------------------------------
// Arrangements
// ---------------------------------------------------------------------------

export const mockArrangements = [
  {
    id: "a01", event_id: "e01", section_id: "s01",
    name: "Bridal Bouquet", quantity: 1,
    target_retail_price_per_unit: "350.00",
    notes: "Lush garden-style bouquet with trailing jasmine.",
    internal_notes: "Double-check stem count day before.",
    sort_order: 0, is_no_recipe: false,
    repurposed_from_arrangement_ids: [],
    created_at: new Date(), updated_at: new Date(),
  },
  {
    id: "a02", event_id: "e01", section_id: "s01",
    name: "Bridesmaid Bouquet", quantity: 4,
    target_retail_price_per_unit: "150.00",
    notes: "Smaller version of bridal bouquet.",
    internal_notes: null,
    sort_order: 1, is_no_recipe: false,
    repurposed_from_arrangement_ids: [],
    created_at: new Date(), updated_at: new Date(),
  },
  {
    id: "a03", event_id: "e01", section_id: "s01",
    name: "Groom Boutonniere", quantity: 1,
    target_retail_price_per_unit: "45.00",
    notes: null, internal_notes: null,
    sort_order: 2, is_no_recipe: false,
    repurposed_from_arrangement_ids: [],
    created_at: new Date(), updated_at: new Date(),
  },
  {
    id: "a04", event_id: "e01", section_id: "s02",
    name: "Ceremony Arch", quantity: 1,
    target_retail_price_per_unit: "1200.00",
    notes: "Full floral arch, approximately 8ft wide.",
    internal_notes: "Needs 2-person install team.",
    sort_order: 0, is_no_recipe: false,
    repurposed_from_arrangement_ids: [],
    created_at: new Date(), updated_at: new Date(),
  },
  {
    id: "a05", event_id: "e01", section_id: "s02",
    name: "Aisle Posies", quantity: 10,
    target_retail_price_per_unit: "55.00",
    notes: "Hung on chair backs along aisle.",
    internal_notes: null,
    sort_order: 1, is_no_recipe: false,
    repurposed_from_arrangement_ids: [],
    created_at: new Date(), updated_at: new Date(),
  },
  {
    id: "a06", event_id: "e01", section_id: "s03",
    name: "Guest Table Centerpiece", quantity: 8,
    target_retail_price_per_unit: "125.00",
    notes: "Low arrangement, 12\"-14\" diameter.",
    internal_notes: null,
    sort_order: 0, is_no_recipe: false,
    repurposed_from_arrangement_ids: [],
    created_at: new Date(), updated_at: new Date(),
  },
  {
    id: "a07", event_id: "e01", section_id: "s03",
    name: "Reception Centerpieces (Small)",
    quantity: 6,
    target_retail_price_per_unit: "85.00",
    notes: "Repurposed aisle posies, moved to cocktail tables.",
    internal_notes: null,
    sort_order: 1, is_no_recipe: false,
    repurposed_from_arrangement_ids: ["a05"],
    created_at: new Date(), updated_at: new Date(),
  },
];

// ---------------------------------------------------------------------------
// Recipe items
// ---------------------------------------------------------------------------

export const mockRecipeItems = [
  // Bridal Bouquet
  { id: "r01", arrangement_id: "a01", master_flower_id: "f01", flower_name_override: null, palette_color_id: "p01", color_text: null, qty_per_arrangement: "12", stem_price_override: null, sort_order: 0, created_at: new Date(), updated_at: new Date() },
  { id: "r02", arrangement_id: "a01", master_flower_id: "f04", flower_name_override: null, palette_color_id: "p01", color_text: null, qty_per_arrangement: "8", stem_price_override: null, sort_order: 1, created_at: new Date(), updated_at: new Date() },
  { id: "r03", arrangement_id: "a01", master_flower_id: "f06", flower_name_override: null, palette_color_id: "p02", color_text: null, qty_per_arrangement: "10", stem_price_override: null, sort_order: 2, created_at: new Date(), updated_at: new Date() },
  { id: "r04", arrangement_id: "a01", master_flower_id: "f09", flower_name_override: null, palette_color_id: "p03", color_text: null, qty_per_arrangement: "5", stem_price_override: null, sort_order: 3, created_at: new Date(), updated_at: new Date() },
  { id: "r05", arrangement_id: "a01", master_flower_id: "f15", flower_name_override: null, palette_color_id: null, color_text: "Trailing", qty_per_arrangement: "3", stem_price_override: null, sort_order: 4, created_at: new Date(), updated_at: new Date() },

  // Bridesmaid Bouquet
  { id: "r06", arrangement_id: "a02", master_flower_id: "f01", flower_name_override: null, palette_color_id: "p01", color_text: null, qty_per_arrangement: "6", stem_price_override: null, sort_order: 0, created_at: new Date(), updated_at: new Date() },
  { id: "r07", arrangement_id: "a02", master_flower_id: "f04", flower_name_override: null, palette_color_id: "p01", color_text: null, qty_per_arrangement: "4", stem_price_override: null, sort_order: 1, created_at: new Date(), updated_at: new Date() },
  { id: "r08", arrangement_id: "a02", master_flower_id: "f09", flower_name_override: null, palette_color_id: "p03", color_text: null, qty_per_arrangement: "3", stem_price_override: null, sort_order: 2, created_at: new Date(), updated_at: new Date() },

  // Guest Table Centerpiece
  { id: "r09", arrangement_id: "a06", master_flower_id: "f02", flower_name_override: null, palette_color_id: "p02", color_text: null, qty_per_arrangement: "10", stem_price_override: null, sort_order: 0, created_at: new Date(), updated_at: new Date() },
  { id: "r10", arrangement_id: "a06", master_flower_id: "f08", flower_name_override: null, palette_color_id: null, color_text: "White", qty_per_arrangement: "5", stem_price_override: null, sort_order: 1, created_at: new Date(), updated_at: new Date() },
  { id: "r11", arrangement_id: "a06", master_flower_id: "f10", flower_name_override: null, palette_color_id: "p03", color_text: null, qty_per_arrangement: "3", stem_price_override: null, sort_order: 2, created_at: new Date(), updated_at: new Date() },
];

// ---------------------------------------------------------------------------
// Event hard goods
// ---------------------------------------------------------------------------

export const mockEventHardGoods = [
  // Bridal bouquet
  { id: "ehg01", event_id: "e01", arrangement_id: "a01", master_hard_good_id: "hg01", name_override: null, quantity: 1, unit_price: "0.50", purchased: false, sort_order: 0, created_at: new Date(), updated_at: new Date() },
  { id: "ehg02", event_id: "e01", arrangement_id: "a01", master_hard_good_id: "hg04", name_override: null, quantity: 1, unit_price: "5.00", purchased: false, sort_order: 1, created_at: new Date(), updated_at: new Date() },
  // Centerpiece
  { id: "ehg03", event_id: "e01", arrangement_id: "a06", master_hard_good_id: "hg02", name_override: null, quantity: 1, unit_price: "4.50", purchased: false, sort_order: 0, created_at: new Date(), updated_at: new Date() },
  // General
  { id: "ehg04", event_id: "e01", arrangement_id: null, master_hard_good_id: "hg03", name_override: null, quantity: 1, unit_price: "20.00", purchased: false, sort_order: 0, created_at: new Date(), updated_at: new Date() },
  { id: "ehg05", event_id: "e01", arrangement_id: null, master_hard_good_id: "hg07", name_override: null, quantity: 50, unit_price: "0.20", purchased: false, sort_order: 1, created_at: new Date(), updated_at: new Date() },
];
