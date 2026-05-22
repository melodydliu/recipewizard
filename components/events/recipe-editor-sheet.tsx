"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import Decimal from "decimal.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { calcArrangementPricing, fmtCurrency } from "@/lib/pricing";
import { updateArrangement } from "@/actions/arrangements";
import {
  upsertRecipeItem,
  deleteRecipeItem,
} from "@/actions/recipe-items";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecipeItem = {
  id: string;
  master_flower_id: string | null;
  flower_name_override: string | null;
  palette_color_id: string | null;
  color_text: string | null;
  qty_per_arrangement: string;
  stem_price_override: string | null;
  sort_order: number;
};

type LocalLine = {
  _key: string;
  id: string | null;
  master_flower_id: string | null;
  flower_name: string;
  palette_color_id: string | null;
  color_text: string | null;
  color_display: string;
  qty: string;
  stem_price_override: string | null;
  effective_stem_price: string;
  line_total: string;
};

interface RecipeEditorSheetProps {
  eventId: string;
  arrangement: {
    id: string;
    name: string;
    quantity: number;
    target_retail_price_per_unit: string | null;
    section_id: string | null;
    notes: string | null;
    internal_notes: string | null;
    is_no_recipe: boolean;
    repurposed_from_arrangement_ids: string[];
  };
  recipeItems: RecipeItem[];
  paletteColors: { id: string; name: string; hex_code: string }[];
  flowers: {
    id: string;
    name: string;
    type: string;
    stem_price: string;
    stems_per_bunch: number;
  }[];
  sections: { id: string; name: string }[];
  markupSettings: { flower_markup: string; hard_good_markup: string };
  trigger: React.ReactNode;
  /** Controlled open state (optional — if omitted, the sheet manages its own open state) */
  open?: boolean;
  /** Called when the sheet wants to change its open state */
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeLineTotal(qty: string, effectivePrice: string): string {
  try {
    return new Decimal(qty).times(new Decimal(effectivePrice)).toFixed(2);
  } catch {
    return "0.00";
  }
}

function itemToLine(
  item: RecipeItem,
  flowers: RecipeEditorSheetProps["flowers"],
  paletteColors: RecipeEditorSheetProps["paletteColors"]
): LocalLine {
  const flower = item.master_flower_id
    ? flowers.find((f) => f.id === item.master_flower_id)
    : null;
  const flowerName =
    item.flower_name_override ??
    flower?.name ??
    "";
  const effectivePrice = item.stem_price_override
    ? item.stem_price_override
    : flower?.stem_price ?? "0";

  const paletteColor = item.palette_color_id
    ? paletteColors.find((p) => p.id === item.palette_color_id)
    : null;
  const colorDisplay =
    paletteColor?.name ?? item.color_text ?? "";

  return {
    _key: item.id,
    id: item.id,
    master_flower_id: item.master_flower_id,
    flower_name: flowerName,
    palette_color_id: item.palette_color_id,
    color_text: item.color_text,
    color_display: colorDisplay,
    qty: item.qty_per_arrangement,
    stem_price_override: item.stem_price_override,
    effective_stem_price: effectivePrice,
    line_total: computeLineTotal(item.qty_per_arrangement, effectivePrice),
  };
}

function newEmptyLine(): LocalLine {
  return {
    _key: crypto.randomUUID(),
    id: null,
    master_flower_id: null,
    flower_name: "",
    palette_color_id: null,
    color_text: null,
    color_display: "",
    qty: "1",
    stem_price_override: null,
    effective_stem_price: "0",
    line_total: "0.00",
  };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecipeEditorSheet({
  eventId,
  arrangement,
  recipeItems,
  paletteColors,
  flowers,
  sections,
  markupSettings,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: RecipeEditorSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  function setOpen(val: boolean) {
    if (controlledOnOpenChange) controlledOnOpenChange(val);
    else setInternalOpen(val);
  }
  const [isPending, startTransition] = useTransition();

  // Header fields
  const [arrName, setArrName] = React.useState(arrangement.name);
  const [qty, setQty] = React.useState(String(arrangement.quantity));
  const [sectionId, setSectionId] = React.useState(
    arrangement.section_id ?? ""
  );
  const [notes, setNotes] = React.useState(arrangement.notes ?? "");
  const [internalNotes, setInternalNotes] = React.useState(
    arrangement.internal_notes ?? ""
  );
  const [targetRetailPrice, setTargetRetailPrice] = React.useState(
    arrangement.target_retail_price_per_unit ?? ""
  );

  // Recipe lines
  const [lines, setLines] = React.useState<LocalLine[]>(() =>
    recipeItems
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => itemToLine(item, flowers, paletteColors))
  );

  // Inline price override editing
  const [overrideEditKey, setOverrideEditKey] = React.useState<string | null>(
    null
  );
  const [overrideValue, setOverrideValue] = React.useState("");

  // Debounce save timer refs
  const saveTimers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  function saveLineDebounced(line: LocalLine, index: number) {
    const key = line._key;
    const existing = saveTimers.current.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      saveTimers.current.delete(key);
      saveLineToDB(line, index);
    }, 800);
    saveTimers.current.set(key, timer);
  }

  function saveLineToDB(line: LocalLine, index: number) {
    if (!line.master_flower_id && !line.flower_name) return;
    startTransition(async () => {
      const result = await upsertRecipeItem({
        id: line.id ?? undefined,
        arrangement_id: arrangement.id,
        master_flower_id: line.master_flower_id,
        flower_name_override: line.master_flower_id ? null : line.flower_name,
        palette_color_id: line.palette_color_id,
        color_text: line.color_text,
        qty_per_arrangement: line.qty,
        stem_price_override: line.stem_price_override,
        sort_order: index,
      });
      if (result && "error" in result) {
        toast.error(result.error);
      } else if (result && "id" in result && result.id && !line.id) {
        // Update line id after insert
        setLines((prev) =>
          prev.map((l) =>
            l._key === line._key ? { ...l, id: result.id as string } : l
          )
        );
      }
    });
  }

  function updateLine(
    _key: string,
    updates: Partial<LocalLine>,
    debounce = true
  ) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l._key === _key);
      if (idx === -1) return prev;
      const newLine = { ...prev[idx], ...updates };
      // Recompute line total
      newLine.line_total = computeLineTotal(
        newLine.qty,
        newLine.effective_stem_price
      );
      const next = [...prev];
      next[idx] = newLine;
      if (debounce) {
        saveLineDebounced(newLine, idx);
      } else {
        saveLineToDB(newLine, idx);
      }
      return next;
    });
  }

  function addNewLine() {
    setLines((prev) => [...prev, newEmptyLine()]);
  }

  function handleDeleteLine(line: LocalLine) {
    setLines((prev) => prev.filter((l) => l._key !== line._key));
    if (line.id) {
      startTransition(async () => {
        const result = await deleteRecipeItem(line.id!, eventId);
        if ("error" in result) toast.error(result.error);
      });
    }
  }

  function saveArrangementField(field: string, value: string | number) {
    startTransition(async () => {
      const result = await updateArrangement(arrangement.id, { [field]: value });
      if (result && "error" in result) toast.error(result.error);
    });
  }

  // Pricing summary
  const pricingInput = {
    quantity: parseInt(qty, 10) || 1,
    target_retail_price_per_unit: targetRetailPrice || null,
    recipe_lines: lines.map((l) => ({
      qty_per_arrangement: l.qty,
      stem_price_override: l.stem_price_override,
      master_stem_price: l.effective_stem_price,
    })),
    flower_markup: markupSettings.flower_markup,
    hard_good_markup: markupSettings.hard_good_markup,
  };
  const pricing = calcArrangementPricing(pricingInput);

  const flowerOptions = flowers.map((f) => ({
    value: f.id,
    label: f.name,
  }));

  const colorOptions = paletteColors.map((p) => ({
    value: p.id,
    label: p.name,
    prefix: (
      <span
        className="inline-block h-3 w-3 rounded-sm border border-border/30 shrink-0"
        style={{ backgroundColor: p.hex_code }}
      />
    ),
  }));

  const isRepurposed = arrangement.repurposed_from_arrangement_ids.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent
        className="min-w-[80vw] max-h-[90vh] flex flex-col gap-0 p-0 sm:max-w-[90vw]"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Item name</label>
              <input
                className="font-display text-xl font-medium w-full rounded-md border border-input bg-background px-3 py-1.5 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                value={arrName}
                onChange={(e) => setArrName(e.target.value)}
                onBlur={() => {
                  if (arrName !== arrangement.name) {
                    saveArrangementField("name", arrName);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
            </div>
          </div>

          {/* Sub-header fields */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Qty</span>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onBlur={() => {
                  const n = parseInt(qty, 10);
                  if (!isNaN(n) && n > 0 && n !== arrangement.quantity) {
                    saveArrangementField("quantity", n);
                  }
                }}
                className="w-14 h-7 rounded-md border border-input bg-transparent px-2 text-sm text-center outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 tabular-nums"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Section</span>
              <Select
                value={sectionId}
                onValueChange={(v) => {
                  const val = v ?? "";
                  setSectionId(val);
                  saveArrangementField("section_id", val || null as unknown as string);
                }}
              >
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue placeholder="Uncategorized" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Uncategorized</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Client notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (notes !== (arrangement.notes ?? "")) {
                    saveArrangementField("notes", notes);
                  }
                }}
                placeholder="Visible to client..."
                className="h-7 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Internal notes — not shown to client
              </label>
              <Input
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                onBlur={() => {
                  if (internalNotes !== (arrangement.internal_notes ?? "")) {
                    saveArrangementField("internal_notes", internalNotes);
                  }
                }}
                placeholder="Internal use only..."
                className="h-7 text-xs"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

        {/* Repurposed banner */}
        {isRepurposed && (
          <div className="mx-6 mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            This arrangement reuses flowers from source arrangements. Recipes
            are managed in the source arrangement.
          </div>
        )}

        {/* Recipe Table */}
        {!isRepurposed && !arrangement.is_no_recipe && (
          <div className="px-6 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium pr-2 w-[200px]">
                      Flower
                    </th>
                    <th className="pb-2 text-left font-medium pr-2 w-[160px]">
                      Color
                    </th>
                    <th className="pb-2 text-left font-medium pr-2 w-16">
                      Qty
                    </th>
                    <th className="pb-2 text-left font-medium pr-2 w-24">
                      Stem Price
                    </th>
                    <th className="pb-2 text-right font-medium pr-2 w-20 tabular-nums">
                      Line Total
                    </th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr
                      key={line._key}
                      className="border-b last:border-0"
                    >
                      {/* Flower */}
                      <td className="py-1.5 pr-2">
                        <Combobox
                          options={flowerOptions}
                          value={line.master_flower_id ?? ""}
                          onValueChange={(v) => {
                            const flower = flowers.find((f) => f.id === v);
                            if (flower) {
                              updateLine(line._key, {
                                master_flower_id: flower.id,
                                flower_name: flower.name,
                                effective_stem_price: line.stem_price_override ?? flower.stem_price,
                              });
                            }
                          }}
                          allowFreeText
                          onFreeTextSelect={(text) => {
                            updateLine(line._key, {
                              master_flower_id: null,
                              flower_name: text,
                              effective_stem_price: line.stem_price_override ?? "0",
                            });
                          }}
                          placeholder="Select flower..."
                          emptyMessage="No flowers found."
                        />
                      </td>

                      {/* Color */}
                      <td className="py-1.5 pr-2">
                        <Combobox
                          options={colorOptions}
                          value={line.palette_color_id ?? ""}
                          onValueChange={(v) => {
                            const color = paletteColors.find((p) => p.id === v);
                            if (color) {
                              updateLine(line._key, {
                                palette_color_id: color.id,
                                color_text: null,
                                color_display: color.name,
                              });
                            }
                          }}
                          allowFreeText
                          onFreeTextSelect={(text) => {
                            updateLine(line._key, {
                              palette_color_id: null,
                              color_text: text,
                              color_display: text,
                            });
                          }}
                          placeholder="Color..."
                          emptyMessage="No colors found."
                        />
                      </td>

                      {/* Qty */}
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          min={1}
                          step="0.5"
                          value={line.qty}
                          onChange={(e) => {
                            updateLine(line._key, { qty: e.target.value });
                          }}
                          className="w-14 h-7 rounded-md border border-input bg-transparent px-2 text-sm text-center outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 tabular-nums"
                          onKeyDown={(e) => {
                            if (
                              e.key === "Tab" &&
                              !e.shiftKey &&
                              idx === lines.length - 1
                            ) {
                              e.preventDefault();
                              addNewLine();
                            }
                          }}
                        />
                      </td>

                      {/* Stem price */}
                      <td className="py-1.5 pr-2">
                        {overrideEditKey === line._key ? (
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={overrideValue}
                            onChange={(e) => setOverrideValue(e.target.value)}
                            onBlur={() => {
                              const val = overrideValue.trim();
                              setOverrideEditKey(null);
                              if (val) {
                                const flower = line.master_flower_id
                                  ? flowers.find(
                                      (f) => f.id === line.master_flower_id
                                    )
                                  : null;
                                const masterPrice = flower?.stem_price ?? "0";
                                const isOverride = val !== masterPrice;
                                updateLine(line._key, {
                                  stem_price_override: isOverride ? val : null,
                                  effective_stem_price: val,
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") {
                                const val = overrideValue.trim();
                                setOverrideEditKey(null);
                                if (val && e.key === "Enter") {
                                  const flower = line.master_flower_id
                                    ? flowers.find(
                                        (f) => f.id === line.master_flower_id
                                      )
                                    : null;
                                  const masterPrice = flower?.stem_price ?? "0";
                                  const isOverride = val !== masterPrice;
                                  updateLine(line._key, {
                                    stem_price_override: isOverride ? val : null,
                                    effective_stem_price: val,
                                  });
                                }
                              }
                            }}
                            className="w-20 h-7 rounded-md border border-ring bg-transparent px-2 text-sm text-right outline-none ring-2 ring-ring/50 tabular-nums"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setOverrideEditKey(line._key);
                              setOverrideValue(line.effective_stem_price);
                            }}
                            className="flex items-center gap-1 text-sm tabular-nums hover:opacity-70 transition-opacity"
                          >
                            <span>
                              ${parseFloat(line.effective_stem_price).toFixed(2)}
                            </span>
                            {line.stem_price_override && (
                              <span className="text-[10px] rounded bg-amber-100 text-amber-700 px-1 py-0.5 leading-none">
                                override
                              </span>
                            )}
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </td>

                      {/* Line total */}
                      <td className="py-1.5 pr-2 text-right tabular-nums font-medium">
                        ${parseFloat(line.line_total).toFixed(2)}
                      </td>

                      {/* Delete */}
                      <td className="py-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteLine(line)}
                          disabled={isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addNewLine}
              className="mt-2"
            >
              + Add line
            </Button>

            {/* Pricing summary */}
            <div className="mt-4 rounded-lg bg-muted/40 border border-border divide-y divide-border text-sm">
              {/* Wholesale cost */}
              <div className="flex items-center justify-end gap-8 px-4 py-2.5">
                <span className="text-muted-foreground">Wholesale cost / unit</span>
                <span className="tabular-nums font-medium w-28 text-left">
                  {fmtCurrency(pricing.flower_wholesale_per_unit)}
                </span>
              </div>

              {/* Suggested retail */}
              <div className="flex items-center justify-end gap-8 px-4 py-2.5">
                <span className="text-muted-foreground">Suggested retail / unit</span>
                <span className="tabular-nums font-medium w-28 text-left">
                  ${pricing.suggested_retail_per_unit.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0)}
                </span>
              </div>

              {/* Actual retail price — editable */}
              <div className="flex items-center justify-end gap-8 px-4 py-2.5">
                <label className="text-muted-foreground">Retail price / unit</label>
                <div className="flex items-center gap-1 w-28">
                  <span className="text-muted-foreground text-xs">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={targetRetailPrice}
                    onChange={(e) => setTargetRetailPrice(e.target.value)}
                    onBlur={() => {
                      const val = targetRetailPrice.trim() || null;
                      if (val !== (arrangement.target_retail_price_per_unit ?? null)) {
                        saveArrangementField("target_retail_price_per_unit", val as string);
                      }
                    }}
                    placeholder={pricing.suggested_retail_per_unit.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0)}
                    className="w-full h-7 rounded-md border border-input bg-background px-2 text-sm text-left outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {arrangement.is_no_recipe && (
          <div className="px-6 py-8 text-sm text-muted-foreground text-center">
            No recipe for this arrangement.
          </div>
        )}

        </div>{/* end scrollable body */}

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-3 border-t bg-background">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (arrName !== arrangement.name) saveArrangementField("name", arrName);
              const n = parseInt(qty, 10);
              if (!isNaN(n) && n > 0 && n !== arrangement.quantity) saveArrangementField("quantity", n);
              if (notes !== (arrangement.notes ?? "")) saveArrangementField("notes", notes);
              if (internalNotes !== (arrangement.internal_notes ?? "")) saveArrangementField("internal_notes", internalNotes);
              const priceVal = targetRetailPrice.trim() || null;
              if (priceVal !== (arrangement.target_retail_price_per_unit ?? null)) {
                saveArrangementField("target_retail_price_per_unit", priceVal as string);
              }
              setOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
