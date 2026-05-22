import { notFound } from "next/navigation";
import Decimal from "decimal.js";
import {
  getEvent,
  getEventSections,
  getPaletteColors,
  getArrangements,
  getRecipeItemsForEvent,
  getFlowers,
  getMarkupSettings,
  getServiceItems,
} from "@/lib/data";
import { calcArrangementPricing, fmtCurrency } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrangementsTab } from "@/components/events/arrangements-tab";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  proposal_sent: "Proposal Sent",
  confirmed: "Confirmed",
  completed: "Completed",
  archived: "Archived",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  proposal_sent: "secondary",
  confirmed: "default",
  completed: "secondary",
  archived: "outline",
};

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [
    event,
    sections,
    paletteColors,
    arrangements,
    allRecipeItems,
    flowers,
    markupSettings,
    serviceItems,
  ] = await Promise.all([
    getEvent(id),
    getEventSections(id),
    getPaletteColors(id),
    getArrangements(id),
    getRecipeItemsForEvent(id),
    getFlowers(false),
    getMarkupSettings(),
    getServiceItems(id),
  ]);

  if (!event) notFound();

  const dateStr = formatDate(event.event_date);

  const flowerList = flowers.map((f) => ({
    id: f.id, name: f.name, type: f.type,
    stem_price: f.stem_price, stems_per_bunch: f.stems_per_bunch,
  }));

  const paletteList = paletteColors.map((p) => ({
    id: p.id, name: p.name, hex_code: p.hex_code, sort_order: p.sort_order,
  }));

  const sectionList = sections.map((s) => ({
    id: s.id, name: s.name, sort_order: s.sort_order, is_hidden: (s as { is_hidden?: boolean }).is_hidden ?? false,
  }));

  const arrangementList = arrangements.map((a) => ({
    id: a.id, name: a.name, quantity: a.quantity,
    target_retail_price_per_unit: a.target_retail_price_per_unit ?? null,
    section_id: a.section_id ?? null,
    notes: a.notes ?? null,
    internal_notes: a.internal_notes ?? null,
    is_no_recipe: a.is_no_recipe,
    is_hidden: a.is_hidden ?? false,
    repurposed_from_arrangement_ids: a.repurposed_from_arrangement_ids ?? [],
    sort_order: a.sort_order,
  }));

  const recipeItemList = allRecipeItems.map((r) => ({
    id: r.id, arrangement_id: r.arrangement_id,
    master_flower_id: r.master_flower_id ?? null,
    flower_name_override: r.flower_name_override ?? null,
    palette_color_id: r.palette_color_id ?? null,
    color_text: r.color_text ?? null,
    qty_per_arrangement: r.qty_per_arrangement,
    stem_price_override: r.stem_price_override ?? null,
    sort_order: r.sort_order,
  }));

  const markupData = {
    flower_markup: markupSettings.flower_markup,
    hard_good_markup: markupSettings.hard_good_markup,
  };

  // --- Event totals ---
  const hiddenSectionIds = new Set(sectionList.filter((s) => s.is_hidden).map((s) => s.id));
  const arrangementSubtotal = arrangementList.filter((a) => !a.is_hidden && !hiddenSectionIds.has(a.section_id ?? "")).reduce((sum, a) => {
    const lines = recipeItemList
      .filter((r) => r.arrangement_id === a.id)
      .map((r) => ({
        qty_per_arrangement: r.qty_per_arrangement,
        stem_price_override: r.stem_price_override,
        master_stem_price: flowerList.find((f) => f.id === r.master_flower_id)?.stem_price ?? null,
      }));
    return sum.plus(
      calcArrangementPricing({
        quantity: a.quantity,
        target_retail_price_per_unit: a.target_retail_price_per_unit,
        recipe_lines: lines,
        flower_markup: markupData.flower_markup,
        hard_good_markup: markupData.hard_good_markup,
        is_repurposed: a.repurposed_from_arrangement_ids.length > 0,
      }).total_billed_retail
    );
  }, new Decimal(0));

  const isServicesHidden = (event as { services_hidden?: boolean }).services_hidden ?? false;
  const laborFeeOverride = event.labor_fee_override ?? null;
  const laborPctOverride = (event as { labor_pct_override?: string | null }).labor_pct_override ?? null;
  const laborFeeCalculated = arrangementSubtotal.times(new Decimal(markupSettings.labor_markup));
  const laborFee = laborFeeOverride !== null
    ? new Decimal(laborFeeOverride)
    : laborPctOverride !== null
      ? arrangementSubtotal.times(new Decimal(laborPctOverride))
      : laborFeeCalculated;
  const serviceItemList = serviceItems.map((i) => ({
    id: i.id, name: i.name, notes: i.notes ?? null,
    price: i.price, sort_order: i.sort_order,
    is_hidden: (i as { is_hidden?: boolean }).is_hidden ?? false,
  }));
  const customServiceTotal = serviceItemList
    .filter((i) => !i.is_hidden)
    .reduce((sum, item) => sum.plus(new Decimal(item.price || "0")), new Decimal(0));
  const serviceSubtotal = isServicesHidden ? new Decimal(0) : laborFee.plus(customServiceTotal);
  const subtotal = arrangementSubtotal.plus(serviceSubtotal);
  const taxRate = new Decimal(event.tax_rate ?? "0");
  const tax = subtotal.times(taxRate);
  const grandTotal = subtotal.plus(tax);
  const taxPct = taxRate.times(100).toDecimalPlaces(3).toString().replace(/\.?0+$/, "");

  const eventServices = {
    laborFee: fmtCurrency(laborFee),
    laborFeeOverride: laborFeeOverride,
    laborFeeCalculated: fmtCurrency(laborFeeCalculated),
    laborMarkupPct: new Decimal(markupSettings.labor_markup).times(100).toFixed(0),
    laborPctOverride: laborPctOverride,
    arrangementSubtotalRaw: arrangementSubtotal.toFixed(2),
    serviceSubtotal: fmtCurrency(serviceSubtotal),
    isServicesHidden,
    serviceItems: serviceItemList,
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="px-8 pt-7 pb-4 border-b bg-background">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-light tracking-tight truncate">
              {event.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              {event.client_name && (
                <span className="text-sm text-muted-foreground">{event.client_name}</span>
              )}
              {event.client_name && dateStr && (
                <span className="text-muted-foreground/40 text-sm">·</span>
              )}
              {dateStr && (
                <span className="text-sm text-muted-foreground">{dateStr}</span>
              )}
              <Badge
                variant={statusVariant[event.status] ?? "outline"}
                className="capitalize"
              >
                {statusLabel[event.status] ?? event.status}
              </Badge>
            </div>
          </div>

          {/* Event totals summary */}
          <div className="flex items-center gap-6 shrink-0 pt-1">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Subtotal</div>
              <div className="text-sm font-semibold tabular-nums">{fmtCurrency(subtotal)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Tax ({taxPct}%)</div>
              <div className="text-sm font-semibold tabular-nums">{fmtCurrency(tax)}</div>
            </div>
            <div className="text-right border-l pl-6">
              <div className="text-xs text-muted-foreground">Grand Total</div>
              <div className="text-lg font-bold tabular-nums">{fmtCurrency(grandTotal)}</div>
            </div>
          </div>
        </div>


      </header>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="arrangements" className="flex-1 flex flex-col">
        {/* Tab bar — sits flush against the header border */}
        <div className="px-8 border-b bg-background">
          <TabsList variant="line" className="w-auto -mb-px gap-0">
            <TabsTrigger value="arrangements" className="px-4 py-3">Items</TabsTrigger>
            <TabsTrigger value="vision"        className="px-4 py-3">Vision</TabsTrigger>
            <TabsTrigger value="wholesale"     className="px-4 py-3">Wholesale Order</TabsTrigger>
            <TabsTrigger value="hard-goods"    className="px-4 py-3">Hard Goods</TabsTrigger>
            <TabsTrigger value="proposal"      className="px-4 py-3">Proposal Preview</TabsTrigger>
            <TabsTrigger value="pricing"       className="px-4 py-3">Internal Pricing</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        <TabsContent value="arrangements" className="flex-1">
          <ArrangementsTab
            eventId={id}
            sections={sectionList}
            arrangements={arrangementList}
            recipeItems={recipeItemList}
            flowers={flowerList}
            paletteColors={paletteList}
            markupSettings={markupData}
            eventServices={eventServices}
          />
        </TabsContent>

        <TabsContent value="vision" className="flex-1">
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Coming in Phase 9
          </div>
        </TabsContent>

        <TabsContent value="wholesale" className="flex-1">
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Coming in Phase 5
          </div>
        </TabsContent>

        <TabsContent value="hard-goods" className="flex-1">
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Coming in Phase 4
          </div>
        </TabsContent>

        <TabsContent value="proposal" className="flex-1">
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Coming in Phase 7
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="flex-1">
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            Coming in Phase 4
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
