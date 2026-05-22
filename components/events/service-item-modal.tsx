"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createServiceItem, updateServiceItem } from "@/actions/service-items";

type ServiceItem = {
  id: string;
  name: string;
  notes: string | null;
  price: string;
};

interface ServiceItemModalProps {
  eventId: string;
  item?: ServiceItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceItemModal({ eventId, item, open, onOpenChange }: ServiceItemModalProps) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [notes, setNotes] = React.useState(item?.notes ?? "");
  const [price, setPrice] = React.useState(item?.price ?? "");
  const [isPending, startTransition] = useTransition();

  React.useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      setNotes(item?.notes ?? "");
      setPrice(item?.price ?? "");
    }
  }, [open, item]);

  function handleSave() {
    if (!name.trim()) return;
    const priceVal = parseFloat(price);
    const priceStr = isNaN(priceVal) ? "0.00" : Math.abs(priceVal).toFixed(2);

    startTransition(async () => {
      const result = item
        ? await updateServiceItem(item.id, eventId, { name: name.trim(), notes: notes.trim() || null, price: priceStr })
        : await createServiceItem(eventId, { name: name.trim(), notes: notes.trim() || null, price: priceStr });

      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{item ? "Edit service item" : "Add service item"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Item name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Delivery & Setup"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-6 tabular-nums"
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !name.trim()}>
            {item ? "Save" : "Add"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
