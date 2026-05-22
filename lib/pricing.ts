import Decimal from "decimal.js";

export type RecipeLineInput = {
  qty_per_arrangement: string; // numeric string
  stem_price_override: string | null;
  master_stem_price: string | null; // from master_flowers lookup
};

export type ArrangementPricingInput = {
  quantity: number;
  target_retail_price_per_unit: string | null;
  recipe_lines: RecipeLineInput[];
  hard_goods_per_unit?: string; // sum of hard goods / qty — Phase 4 adds this; default "0"
  flower_markup: string;
  hard_good_markup: string;
};

export type ArrangementPricingResult = {
  flower_wholesale_per_unit: Decimal;
  total_flower_wholesale: Decimal;
  hard_goods_per_unit: Decimal;
  true_wholesale_per_unit: Decimal;
  suggested_retail_per_unit: Decimal;
  suggested_retail_rounded: Decimal; // nearest $5
  billed_retail_per_unit: Decimal; // 0 if null
  total_billed_retail: Decimal;
  drift_pct: Decimal | null; // null if suggested is zero
  drift_level: "green" | "yellow" | "red" | "none"; // none if no billed price or suggested is 0
};

export function calcArrangementPricing(
  input: ArrangementPricingInput
): ArrangementPricingResult {
  const flowerWholesalePerUnit = input.recipe_lines.reduce((sum, line) => {
    const price = line.stem_price_override
      ? new Decimal(line.stem_price_override)
      : new Decimal(line.master_stem_price ?? "0");
    return sum.plus(new Decimal(line.qty_per_arrangement).times(price));
  }, new Decimal(0));

  const hardGoodsPerUnit = new Decimal(input.hard_goods_per_unit ?? "0");
  const trueWholesalePerUnit = flowerWholesalePerUnit.plus(hardGoodsPerUnit);
  const qty = new Decimal(input.quantity);

  const suggestedRetailPerUnit = flowerWholesalePerUnit
    .times(new Decimal(input.flower_markup))
    .plus(hardGoodsPerUnit.times(new Decimal(input.hard_good_markup)));

  // Round to nearest $5
  const suggestedRetailRounded = new Decimal(
    Math.round(suggestedRetailPerUnit.toNumber() / 5) * 5
  );

  const billedRetailPerUnit = input.target_retail_price_per_unit
    ? new Decimal(input.target_retail_price_per_unit)
    : new Decimal(0);

  const totalBilledRetail = billedRetailPerUnit.times(qty);

  let driftPct: Decimal | null = null;
  let driftLevel: "green" | "yellow" | "red" | "none" = "none";

  if (!suggestedRetailPerUnit.isZero() && input.target_retail_price_per_unit) {
    driftPct = billedRetailPerUnit
      .minus(suggestedRetailPerUnit)
      .abs()
      .dividedBy(suggestedRetailPerUnit);

    if (driftPct.lte("0.15")) driftLevel = "green";
    else if (driftPct.lte("0.30")) driftLevel = "yellow";
    else driftLevel = "red";
  }

  return {
    flower_wholesale_per_unit: flowerWholesalePerUnit,
    total_flower_wholesale: flowerWholesalePerUnit.times(qty),
    hard_goods_per_unit: hardGoodsPerUnit,
    true_wholesale_per_unit: trueWholesalePerUnit,
    suggested_retail_per_unit: suggestedRetailPerUnit,
    suggested_retail_rounded: suggestedRetailRounded,
    billed_retail_per_unit: billedRetailPerUnit,
    total_billed_retail: totalBilledRetail,
    drift_pct: driftPct,
    drift_level: driftLevel,
  };
}

// Format helpers
export function fmtCurrency(d: Decimal): string {
  return "$" + d.toFixed(2);
}
export function fmtPct(d: Decimal): string {
  return d.times(100).toFixed(0) + "%";
}

// ---------------------------------------------------------------------------
// Event totals (Phase 10 will have a test suite — shape defined now)
// ---------------------------------------------------------------------------

export type EventTotalsInput = {
  arrangements: Array<ArrangementPricingInput & { is_repurposed: boolean }>;
  labor_markup: string;
  delivery_markup: string;
  cleanup_fee: string;
  tax_rate: string;
};

export type EventTotalsResult = {
  arrangement_subtotal: Decimal;
  labor_fee: Decimal;
  delivery_fee: Decimal;
  cleanup_fee: Decimal;
  service_fees_subtotal: Decimal;
  proposal_subtotal: Decimal;
  tax: Decimal;
  grand_total: Decimal;
};

export function calcEventTotals(input: EventTotalsInput): EventTotalsResult {
  // sum total_billed_retail across all arrangements
  const arrangementSubtotal = input.arrangements.reduce((sum, a) => {
    const pricing = calcArrangementPricing(a);
    return sum.plus(pricing.total_billed_retail);
  }, new Decimal(0));

  const laborFee = arrangementSubtotal.times(new Decimal(input.labor_markup));
  const deliveryFee = arrangementSubtotal.times(
    new Decimal(input.delivery_markup)
  );
  const cleanupFee = new Decimal(input.cleanup_fee);
  const serviceFees = laborFee.plus(deliveryFee).plus(cleanupFee);
  const proposalSubtotal = arrangementSubtotal.plus(serviceFees);
  const tax = proposalSubtotal.times(new Decimal(input.tax_rate));
  const grandTotal = proposalSubtotal.plus(tax);

  return {
    arrangement_subtotal: arrangementSubtotal,
    labor_fee: laborFee,
    delivery_fee: deliveryFee,
    cleanup_fee: cleanupFee,
    service_fees_subtotal: serviceFees,
    proposal_subtotal: proposalSubtotal,
    tax,
    grand_total: grandTotal,
  };
}
