"use client";

import * as React from "react";
import { Trash2, Copy, Eye, EyeOff } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { calcArrangementPricing, fmtCurrency } from "@/lib/pricing";
import { deleteArrangement, duplicateArrangement, updateArrangement } from "@/actions/arrangements";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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

interface ArrangementRowProps {
  arrangement: Arrangement;
  recipeItems: RecipeItem[];
  flowers: Flower[];
  markupSettings: { flower_markup: string; hard_good_markup: string };
  onEdit: () => void;
  eventId: string;
}


export function ArrangementRow({
  arrangement,
  recipeItems,
  flowers,
  markupSettings,
  onEdit,
  eventId,
}: ArrangementRowProps) {
  const [isPending, startTransition] = useTransition();
  const itemsForArrangement = recipeItems.filter(
    (r) => r.arrangement_id === arrangement.id
  );

  const recipeLines = itemsForArrangement.map((item) => {
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
    quantity: arrangement.quantity,
    target_retail_price_per_unit: arrangement.target_retail_price_per_unit,
    recipe_lines: recipeLines,
    flower_markup: markupSettings.flower_markup,
    hard_good_markup: markupSettings.hard_good_markup,
    is_repurposed: arrangement.repurposed_from_arrangement_ids.length > 0,
  });

  const isRepurposed = arrangement.repurposed_from_arrangement_ids.length > 0;

  return (
    <tr
      className={`group hover:bg-muted/30 transition-colors border-b last:border-0 cursor-pointer ${arrangement.is_hidden ? "opacity-40" : ""}`}
      onClick={onEdit}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm leading-snug">{arrangement.name}</span>
          {isRepurposed && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-medium">
              repurposed
            </span>
          )}
        </div>
        {arrangement.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 break-words">
            {arrangement.notes}
          </p>
        )}
      </td>

      {/* Qty */}
      <td className="px-4 py-3 tabular-nums text-center text-sm text-muted-foreground w-14">
        {arrangement.quantity}
      </td>

      {/* Target / Suggested stacked */}
      <td className="px-4 py-3 tabular-nums text-right w-36">
        <div className="text-sm font-medium">
          {arrangement.target_retail_price_per_unit
            ? fmtCurrency(pricing.billed_retail_per_unit)
            : <span className="text-muted-foreground">—</span>}
        </div>
      </td>

      {/* Total billed */}
      <td className="px-4 py-3 tabular-nums text-right text-sm font-semibold w-28">
        {pricing.total_billed_retail.isZero()
          ? <span className="font-normal text-muted-foreground">—</span>
          : fmtCurrency(pricing.total_billed_retail)}
      </td>

      {/* Actions */}
      <td className="pl-6 pr-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await updateArrangement(arrangement.id, { is_hidden: !arrangement.is_hidden });
            })}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded disabled:opacity-50"
            title={arrangement.is_hidden ? "Show item" : "Hide item"}
          >
            {arrangement.is_hidden
              ? <Eye className="h-3.5 w-3.5" />
              : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              const result = await duplicateArrangement(arrangement.id, eventId);
              if (result && "error" in result) toast.error(result.error);
            })}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded disabled:opacity-50"
            title="Duplicate item"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isPending}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="left" align="center">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => startTransition(async () => {
                  const result = await deleteArrangement(arrangement.id, eventId);
                  if (result && "error" in result) toast.error(result.error);
                })}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
