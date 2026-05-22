"use client";

import * as React from "react";
import { toast } from "sonner";

import { createLei, updateLei } from "@/actions/leis";
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

interface LeiFormDialogProps {
  trigger: React.ReactNode;
  lei?: {
    id: string;
    name: string;
    unit_price: string;
    sources: string[] | null;
  };
  onSuccess?: () => void;
}

export function LeiFormDialog({ trigger, lei, onSuccess }: LeiFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const isEdit = !!lei;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateLei(lei.id, formData)
        : await createLei(formData);

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEdit ? "Lei updated." : "Lei added.");
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
          <DialogTitle>{isEdit ? "Edit Lei" : "Add Lei"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="lei-name">Name</Label>
            <Input
              id="lei-name"
              name="name"
              defaultValue={lei?.name ?? ""}
              placeholder="e.g. Orchid Lei, Single"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lei-unit-price">Unit Price ($)</Label>
            <Input
              id="lei-unit-price"
              name="unit_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={lei?.unit_price ?? ""}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lei-sources">Sources</Label>
            <Input
              id="lei-sources"
              name="sources"
              defaultValue={lei?.sources?.join("|") ?? ""}
              placeholder="Watanabe|Cindys (pipe-separated)"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Lei"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
