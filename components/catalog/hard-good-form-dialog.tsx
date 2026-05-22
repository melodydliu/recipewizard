"use client";

import * as React from "react";
import { toast } from "sonner";

import { createHardGood, updateHardGood } from "@/actions/hard-goods";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HardGoodFormDialogProps {
  trigger: React.ReactNode;
  hardGood?: {
    id: string;
    name: string;
    unit_price: string;
    sources: string[] | null;
    link: string | null;
    notes: string | null;
  };
  onSuccess?: () => void;
}

export function HardGoodFormDialog({ trigger, hardGood, onSuccess }: HardGoodFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const isEdit = !!hardGood;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateHardGood(hardGood.id, formData)
        : await createHardGood(formData);

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEdit ? "Hard good updated." : "Hard good added.");
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
          <DialogTitle>{isEdit ? "Edit Hard Good" : "Add Hard Good"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="hg-name">Name</Label>
            <Input
              id="hg-name"
              name="name"
              defaultValue={hardGood?.name ?? ""}
              placeholder="e.g. Foam Brick"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hg-unit-price">Unit Price ($)</Label>
            <Input
              id="hg-unit-price"
              name="unit_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={hardGood?.unit_price ?? ""}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hg-sources">Sources</Label>
            <Input
              id="hg-sources"
              name="sources"
              defaultValue={hardGood?.sources?.join("|") ?? ""}
              placeholder="Floradec|Amazon (pipe-separated)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hg-link">Link (optional)</Label>
            <Input
              id="hg-link"
              name="link"
              type="url"
              defaultValue={hardGood?.link ?? ""}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hg-notes">Notes (optional)</Label>
            <Input
              id="hg-notes"
              name="notes"
              defaultValue={hardGood?.notes ?? ""}
              placeholder="Any additional notes"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Hard Good"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
