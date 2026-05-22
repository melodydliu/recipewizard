"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { updateSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const FormSchema = z.object({
  flower_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  hard_good_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  lei_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  labor_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  delivery_markup: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid number"),
  default_cleanup_fee: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  default_tax_rate: z.string().regex(/^\d+(\.\d{1,5})?$/, "Must be a valid rate"),
});

type FormValues = z.infer<typeof FormSchema>;

interface SettingsFormProps {
  defaultValues: FormValues;
  isMock: boolean;
}

export function SettingsForm({ defaultValues, isMock }: SettingsFormProps) {
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.set(key, value);
      }
      const result = await updateSettings(formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Settings saved.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {isMock && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5 text-sm text-yellow-800">
          Preview mode — changes won&apos;t be saved without a database.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pricing Markups</CardTitle>
          <CardDescription>
            Multipliers applied to wholesale costs when computing retail prices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="flower_markup">Flower Markup (×)</Label>
            <p className="text-xs text-muted-foreground">
              Applied to wholesale stem cost. Default: 4.0×
            </p>
            <Input
              id="flower_markup"
              {...register("flower_markup")}
              placeholder="4.0"
              className="max-w-xs"
            />
            {errors.flower_markup && (
              <p className="text-xs text-destructive">{errors.flower_markup.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hard_good_markup">Hard Good Markup (×)</Label>
            <p className="text-xs text-muted-foreground">
              Applied to hard good unit cost. Default: 2.0×
            </p>
            <Input
              id="hard_good_markup"
              {...register("hard_good_markup")}
              placeholder="2.0"
              className="max-w-xs"
            />
            {errors.hard_good_markup && (
              <p className="text-xs text-destructive">{errors.hard_good_markup.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lei_markup">Lei Markup (×)</Label>
            <p className="text-xs text-muted-foreground">
              Applied to lei unit cost. Default: 1.25×
            </p>
            <Input
              id="lei_markup"
              {...register("lei_markup")}
              placeholder="1.25"
              className="max-w-xs"
            />
            {errors.lei_markup && (
              <p className="text-xs text-destructive">{errors.lei_markup.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Fees</CardTitle>
          <CardDescription>
            Additional charges applied to events. Rates entered as decimals (e.g. 0.30 = 30%).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="labor_markup">Labor (%)</Label>
            <p className="text-xs text-muted-foreground">
              Labor as a fraction of floral cost. Default: 0.30 (30%)
            </p>
            <Input
              id="labor_markup"
              {...register("labor_markup")}
              placeholder="0.30"
              className="max-w-xs"
            />
            {errors.labor_markup && (
              <p className="text-xs text-destructive">{errors.labor_markup.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delivery_markup">Delivery (%)</Label>
            <p className="text-xs text-muted-foreground">
              Delivery as a fraction of floral cost. Default: 0.10 (10%)
            </p>
            <Input
              id="delivery_markup"
              {...register("delivery_markup")}
              placeholder="0.10"
              className="max-w-xs"
            />
            {errors.delivery_markup && (
              <p className="text-xs text-destructive">{errors.delivery_markup.message}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="default_cleanup_fee">Default Cleanup Fee ($)</Label>
            <p className="text-xs text-muted-foreground">
              Flat fee added to each event by default. Default: $200.00
            </p>
            <Input
              id="default_cleanup_fee"
              {...register("default_cleanup_fee")}
              placeholder="200.00"
              className="max-w-xs"
            />
            {errors.default_cleanup_fee && (
              <p className="text-xs text-destructive">{errors.default_cleanup_fee.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
            <p className="text-xs text-muted-foreground">
              Tax rate as a decimal (e.g. 0.04712 = 4.712%). Default: 0.04712
            </p>
            <Input
              id="default_tax_rate"
              {...register("default_tax_rate")}
              placeholder="0.04712"
              className="max-w-xs"
            />
            {errors.default_tax_rate && (
              <p className="text-xs text-destructive">{errors.default_tax_rate.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
