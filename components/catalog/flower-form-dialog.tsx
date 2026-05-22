"use client";

import * as React from "react";
import { toast } from "sonner";

import { createFlower, updateFlower } from "@/actions/flowers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlowerFormDialogProps {
  trigger: React.ReactNode;
  flower?: {
    id: string;
    name: string;
    type: string;
    stem_price: string;
    stems_per_bunch: number;
    sources: string[] | null;
    notes: string | null;
  };
  onSuccess?: () => void;
}

export function FlowerFormDialog({ trigger, flower, onSuccess }: FlowerFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [flowerType, setFlowerType] = React.useState<string | null>(flower?.type ?? "flower");

  const isEdit = !!flower;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // inject the select value since it's controlled
    formData.set("type", flowerType ?? "flower");

    startTransition(async () => {
      const result = isEdit
        ? await updateFlower(flower.id, formData)
        : await createFlower(formData);

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEdit ? "Flower updated." : "Flower added.");
        setOpen(false);
        onSuccess?.();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement}>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Flower" : "Add Flower"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="flower-name">Name</Label>
            <Input
              id="flower-name"
              name="name"
              defaultValue={flower?.name ?? ""}
              placeholder="e.g. Garden Rose"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="flower-type">Type</Label>
            <Select value={flowerType} onValueChange={setFlowerType}>
              <SelectTrigger id="flower-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flower">Flower</SelectItem>
                <SelectItem value="greenery">Greenery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="flower-stem-price">Stem Price ($)</Label>
              <Input
                id="flower-stem-price"
                name="stem_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={flower?.stem_price ?? ""}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flower-stems-per-bunch">Stems / Bunch</Label>
              <Input
                id="flower-stems-per-bunch"
                name="stems_per_bunch"
                type="number"
                step="1"
                min="1"
                defaultValue={flower?.stems_per_bunch ?? ""}
                placeholder="10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="flower-sources">Sources</Label>
            <Input
              id="flower-sources"
              name="sources"
              defaultValue={flower?.sources?.join("|") ?? ""}
              placeholder="Watanabe|Mayesh (pipe-separated)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="flower-notes">Notes (optional)</Label>
            <Input
              id="flower-notes"
              name="notes"
              defaultValue={flower?.notes ?? ""}
              placeholder="Any additional notes"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Flower"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
