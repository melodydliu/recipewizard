"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Eye, EyeOff, Copy, Trash2 } from "lucide-react";
import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // used by add-section input
import { ArrangementRow } from "./arrangement-row";
import { RecipeEditorSheet } from "./recipe-editor-sheet";
import { createArrangement } from "@/actions/arrangements";
import { createSection, toggleSectionVisibility, duplicateSection, deleteSection } from "@/actions/sections";
import { updateEventServiceFees, toggleServicesVisibility } from "@/actions/events";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { calcArrangementPricing, fmtCurrency } from "@/lib/pricing";
import { ServiceItemModal } from "./service-item-modal";
import { createServiceItem, updateServiceItem, deleteServiceItem } from "@/actions/service-items";

type RecipeItem = {
  id: string;
  arrangement_id: string;
  master_flower_id: string | null;
  flower_name_override: string | null;
  palette_color_id: string | null;
  color_text: string | null;
  qty_per_arrangement: string;
  stem_price_override: string | null;
  sort_order: number;
};

type Flower = {
  id: string;
  name: string;
  type: string;
  stem_price: string;
  stems_per_bunch: number;
};

type PaletteColor = {
  id: string;
  name: string;
  hex_code: string;
  sort_order: number;
};

type Section = {
  id: string;
  name: string;
  sort_order: number;
  is_hidden: boolean;
};

type Arrangement = {
  id: string;
  name: string;
  quantity: number;
  target_retail_price_per_unit: string | null;
  section_id: string | null;
  notes: string | null;
  internal_notes: string | null;
  is_no_recipe: boolean;
  is_hidden: boolean;
  repurposed_from_arrangement_ids: string[];
  sort_order: number;
};

interface ArrangementsTabProps {
  eventId: string;
  sections: Section[];
  arrangements: Arrangement[];
  recipeItems: RecipeItem[];
  flowers: Flower[];
  paletteColors: PaletteColor[];
  markupSettings: { flower_markup: string; hard_good_markup: string };
  eventServices: {
    laborFee: string;
    laborFeeOverride: string | null;
    laborFeeCalculated: string;
    serviceSubtotal: string;
    isServicesHidden: boolean;
    laborMarkupPct: string;
    laborPctOverride: string | null;
    arrangementSubtotalRaw: string;
    serviceItems: { id: string; name: string; notes: string | null; price: string; sort_order: number; is_hidden: boolean }[];
  };
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

function SectionGroup({
  eventId,
  section,
  arrangements,
  allArrangements,
  recipeItems,
  flowers,
  paletteColors,
  sections,
  markupSettings,
}: {
  eventId: string;
  section: Section | null;
  arrangements: Arrangement[];
  allArrangements: Arrangement[];
  recipeItems: RecipeItem[];
  flowers: Flower[];
  paletteColors: PaletteColor[];
  sections: Section[];
  markupSettings: { flower_markup: string; hard_good_markup: string };
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [openArrangementId, setOpenArrangementId] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const subtotal = arrangements.filter((arr) => !arr.is_hidden).reduce((sum, arr) => {
    const items = recipeItems.filter((r) => r.arrangement_id === arr.id);
    const lines = items.map((item) => {
      const flower = item.master_flower_id
        ? flowers.find((f) => f.id === item.master_flower_id)
        : null;
      return {
        qty_per_arrangement: item.qty_per_arrangement,
        stem_price_override: item.stem_price_override,
        master_stem_price: flower?.stem_price ?? null,
      };
    });
    const pricing = calcArrangementPricing({
      quantity: arr.quantity,
      target_retail_price_per_unit: arr.target_retail_price_per_unit,
      recipe_lines: lines,
      flower_markup: markupSettings.flower_markup,
      hard_good_markup: markupSettings.hard_good_markup,
      is_repurposed: arr.repurposed_from_arrangement_ids.length > 0,
    });
    return sum.plus(pricing.total_billed_retail);
  }, new Decimal(0));

  function handleAddItem() {
    const fd = new FormData();
    fd.set("name", "New Item");
    if (section) fd.set("section_id", section.id);
    startTransition(async () => {
      const result = await createArrangement(eventId, fd);
      if (result && "error" in result) {
        toast.error(result.error);
      } else if (result && "id" in result && result.id) {
        setOpenArrangementId(result.id);
      }
    });
  }

  const label = section?.name ?? "Uncategorized";
  const isHidden = section?.is_hidden ?? false;

  function handleToggleVisibility() {
    if (!section) return;
    startTransition(async () => {
      const result = await toggleSectionVisibility(section.id, eventId, !isHidden);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDuplicate() {
    if (!section) return;
    startTransition(async () => {
      const result = await duplicateSection(section.id, eventId);
      if (result && "error" in result) toast.error(result.error);
      else toast.success("Section duplicated.");
    });
  }

  function handleDelete() {
    if (!section) return;
    startTransition(async () => {
      const result = await deleteSection(section.id, eventId);
      if (result && "error" in result) toast.error(result.error);
      else toast.success("Section deleted.");
    });
  }

  return (
    <>
      {/* Dialogs rendered outside the card */}
      {arrangements.map((arr) => (
        <RecipeEditorSheet
          key={arr.id}
          eventId={eventId}
          arrangement={arr}
          recipeItems={recipeItems.filter((r) => r.arrangement_id === arr.id)}
          paletteColors={paletteColors}
          flowers={flowers}
          sections={sections}
          otherArrangements={allArrangements.filter((a) => a.id !== arr.id).map((a) => ({ id: a.id, name: a.name }))}
          markupSettings={markupSettings}
          trigger={<span className="sr-only" />}
          open={openArrangementId === arr.id}
          onOpenChange={(o) => { if (!o) setOpenArrangementId(null); }}
        />
      ))}

      {/* Card */}
      <div className={`rounded-lg border bg-card overflow-hidden shadow-sm${isHidden ? " opacity-50" : ""}`}>

        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors"
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            {label}
          </button>
          <div className="flex items-center gap-2">
            {!subtotal.isZero() && (
              <span className="tabular-nums text-xs font-semibold text-muted-foreground">
                {fmtCurrency(subtotal)}
              </span>
            )}
            {section && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44 w-auto">
                  <DropdownMenuItem onClick={handleToggleVisibility}>
                    {isHidden
                      ? <><Eye className="h-4 w-4 mr-2" />Show section</>
                      : <><EyeOff className="h-4 w-4 mr-2" />Hide section</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="h-4 w-4 mr-2" />Duplicate section
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />Delete section
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Table */}
        {!collapsed && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground w-14">Qty</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground w-36">Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground w-28">Total</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {arrangements.map((arr) => (
                <ArrangementRow
                  key={arr.id}
                  arrangement={arr}
                  recipeItems={recipeItems}
                  flowers={flowers}
                  markupSettings={markupSettings}
                  onEdit={() => setOpenArrangementId(arr.id)}
                  eventId={eventId}
                />
              ))}

              {/* Add item row */}
              <tr>
                <td colSpan={5} className="px-4 py-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isPending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    Add item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Services card
// ---------------------------------------------------------------------------

function ServicesCard({
  eventId,
  eventServices,
}: {
  eventId: string;
  eventServices: ArrangementsTabProps["eventServices"];
}) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<{ id: string; name: string; notes: string | null; price: string } | undefined>(undefined);
  const [laborMode, setLaborMode] = React.useState<"pct" | "custom">(
    eventServices.laborFeeOverride != null ? "custom" : "pct"
  );
  const [laborPctInput, setLaborPctInput] = React.useState(() => {
    if (eventServices.laborPctOverride !== null) {
      return (parseFloat(eventServices.laborPctOverride) * 100).toFixed(1).replace(/\.0$/, "");
    }
    return eventServices.laborMarkupPct;
  });
  const [laborInput, setLaborInput] = React.useState(
    eventServices.laborFeeOverride != null
      ? eventServices.laborFeeOverride
      : eventServices.laborFeeCalculated.replace("$", "")
  );
  const [isPending, startTransition] = useTransition();

  function switchLaborMode(mode: "pct" | "custom") {
    setLaborMode(mode);
    if (mode === "pct") {
      startTransition(async () => {
        await updateEventServiceFees(eventId, { labor_fee_override: null });
      });
    } else {
      const pct = parseFloat(laborPctInput || "0") / 100;
      const subTotal = parseFloat(eventServices.arrangementSubtotalRaw || "0");
      const computed = (pct * subTotal).toFixed(2);
      setLaborInput(computed);
      startTransition(async () => {
        await updateEventServiceFees(eventId, { labor_fee_override: computed, labor_pct_override: null });
      });
    }
  }

  function saveLaborPct() {
    const val = parseFloat(laborPctInput);
    if (isNaN(val) || val < 0) return;
    const pctDecimal = (val / 100).toFixed(4);
    const defaultDecimal = (parseFloat(eventServices.laborMarkupPct) / 100).toFixed(4);
    const isDefault = Math.abs(parseFloat(pctDecimal) - parseFloat(defaultDecimal)) < 0.00005;
    startTransition(async () => {
      await updateEventServiceFees(eventId, {
        labor_pct_override: isDefault ? null : pctDecimal,
        labor_fee_override: null,
      });
    });
  }

  function handleToggleVisibility() {
    startTransition(async () => {
      await toggleServicesVisibility(eventId, !eventServices.isServicesHidden);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await updateEventServiceFees(eventId, { cleanup_fee: "0", labor_fee_override: "0" });
      await toggleServicesVisibility(eventId, true);
    });
  }

  function saveLabor() {
    const val = parseFloat(laborInput);
    const calculated = parseFloat(eventServices.laborFeeCalculated.replace("$", ""));
    const override = isNaN(val) ? null : Math.abs(val).toFixed(2);
    const isDefault = override !== null && Math.abs(parseFloat(override) - calculated) < 0.005;
    startTransition(async () => {
      await updateEventServiceFees(eventId, { labor_fee_override: isDefault ? null : override });
    });
  }

  return (
    <div className={`rounded-lg border bg-card overflow-hidden shadow-sm${eventServices.isServicesHidden ? " opacity-50" : ""}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
        <span className="text-sm font-semibold">Services</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {eventServices.serviceSubtotal}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44 w-auto">
              <DropdownMenuItem onClick={handleToggleVisibility}>
                {eventServices.isServicesHidden
                  ? <><Eye className="h-4 w-4 mr-2" />Show section</>
                  : <><EyeOff className="h-4 w-4 mr-2" />Hide section</>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Service fees cannot be duplicated.")}>
                <Copy className="h-4 w-4 mr-2" />Duplicate section
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />Delete section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ServiceItemModal
        eventId={eventId}
        item={editingItem}
        open={modalOpen}
        onOpenChange={(o) => { setModalOpen(o); if (!o) setEditingItem(undefined); }}
      />
      <table className="w-full text-sm">
        <tbody>
          <tr className={eventServices.serviceItems.length > 0 ? "border-b" : ""}>
            <td className="px-4 py-2 text-muted-foreground">Labor & Design</td>
            <td colSpan={2} className="px-4 py-2 whitespace-nowrap w-px">
              <div className="flex items-center justify-end gap-2">
                <div className="flex rounded-md border border-input overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => switchLaborMode("custom")}
                    disabled={isPending}
                    className={`px-2 py-1 transition-colors border-r border-input ${laborMode === "custom" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >$</button>
                  <button
                    type="button"
                    onClick={() => switchLaborMode("pct")}
                    disabled={isPending}
                    className={`px-2 py-1 transition-colors ${laborMode === "pct" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >%</button>
                </div>
                {laborMode === "pct" ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={laborPctInput}
                      onChange={(e) => setLaborPctInput(e.target.value)}
                      onBlur={saveLaborPct}
                      disabled={isPending}
                      className="w-14 h-7 rounded-md border border-input bg-background px-2 text-sm text-right outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 tabular-nums disabled:opacity-50"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      · ${(parseFloat(laborPctInput || "0") / 100 * parseFloat(eventServices.arrangementSubtotalRaw || "0")).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={laborInput}
                    onChange={(e) => setLaborInput(e.target.value)}
                    onBlur={saveLabor}
                    disabled={isPending}
                    className="w-24 h-7 rounded-md border border-input bg-background px-2 text-sm text-right outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 tabular-nums disabled:opacity-50"
                  />
                )}
              </div>
            </td>
          </tr>
          {eventServices.serviceItems.map((item, idx) => (
            <tr
              key={item.id}
              onClick={() => { setEditingItem(item); setModalOpen(true); }}
              className={`group cursor-pointer hover:bg-muted/30 transition-colors${idx < eventServices.serviceItems.length - 1 ? " border-b" : ""}${item.is_hidden ? " opacity-50" : ""}`}
            >
              <td className="px-4 py-2">
                <div className="text-sm">{item.name}</div>
                {item.notes && (
                  <div className="text-xs text-muted-foreground mt-0.5">{item.notes}</div>
                )}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-sm text-muted-foreground w-28">
                ${parseFloat(item.price || "0").toFixed(2)}
              </td>
              <td className="pl-6 pr-4 py-2 w-px" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startTransition(async () => {
                      const result = await updateServiceItem(item.id, eventId, { is_hidden: !item.is_hidden });
                      if (result && "error" in result) toast.error(result.error);
                    })}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                  >
                    {item.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => startTransition(async () => {
                      const result = await createServiceItem(eventId, { name: `${item.name} (copy)`, notes: item.notes, price: item.price });
                      if (result && "error" in result) toast.error(result.error);
                      else toast.success("Item duplicated.");
                    })}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="left" align="center">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => startTransition(async () => {
                          const result = await deleteServiceItem(item.id, eventId);
                          if (result && "error" in result) toast.error(result.error);
                        })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />Delete item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} className="px-4 py-2">
              <button
                type="button"
                onClick={() => { setEditingItem(undefined); setModalOpen(true); }}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
              >
                <Plus className="h-3 w-3" />
                Add item
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function ArrangementsTab({
  eventId,
  sections,
  arrangements,
  recipeItems,
  flowers,
  paletteColors,
  markupSettings,
  eventServices,
}: ArrangementsTabProps) {
  const [addingSectionName, setAddingSectionName] = React.useState(false);
  const [newSectionName, setNewSectionName] = React.useState("");
  const [isPending, startTransition] = useTransition();

  function handleAddSection() {
    if (!newSectionName.trim()) return;
    startTransition(async () => {
      const result = await createSection(eventId, newSectionName.trim());
      if (result && "error" in result) toast.error(result.error);
      else toast.success("Section added.");
    });
    setNewSectionName("");
    setAddingSectionName(false);
  }

  const sectionsSorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const uncategorized = arrangements.filter((a) => !a.section_id);

  return (
    <div className="px-6 py-5 flex flex-col gap-4">
      {sectionsSorted.map((section) => {
        const sectionArrangements = arrangements
          .filter((a) => a.section_id === section.id)
          .sort((a, b) => a.sort_order - b.sort_order);
        return (
          <SectionGroup
            key={section.id}
            eventId={eventId}
            section={section}
            arrangements={sectionArrangements}
            allArrangements={arrangements}
            recipeItems={recipeItems}
            flowers={flowers}
            paletteColors={paletteColors}
            sections={sections}
            markupSettings={markupSettings}
          />
        );
      })}

      {uncategorized.length > 0 && (
        <SectionGroup
          eventId={eventId}
          section={null}
          arrangements={uncategorized.sort((a, b) => a.sort_order - b.sort_order)}
          allArrangements={arrangements}
          recipeItems={recipeItems}
          flowers={flowers}
          paletteColors={paletteColors}
          sections={sections}
          markupSettings={markupSettings}
        />
      )}

      <ServicesCard eventId={eventId} eventServices={eventServices} />

      {/* Add section */}
      <div>
        {addingSectionName ? (
          <Input
            autoFocus
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="Section name…"
            className="h-8 max-w-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSection();
              if (e.key === "Escape") { setAddingSectionName(false); setNewSectionName(""); }
            }}
            onBlur={() => {
              if (newSectionName.trim()) handleAddSection();
              else setAddingSectionName(false);
            }}
            disabled={isPending}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddingSectionName(true)}
            disabled={isPending}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add section
          </Button>
        )}
      </div>
    </div>
  );
}
