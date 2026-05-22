"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  addPaletteColor,
  updatePaletteColor,
  deletePaletteColor,
} from "@/actions/palette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export type PaletteColor = {
  id: string;
  name: string;
  hex_code: string;
  sort_order: number;
};

interface PaletteStripProps {
  eventId: string;
  colors: PaletteColor[];
}

interface ColorFormState {
  name: string;
  hex_code: string;
}

export function PaletteStrip({ eventId, colors: initialColors }: PaletteStripProps) {
  const [colors, setColors] = React.useState<PaletteColor[]>(initialColors);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editColor, setEditColor] = React.useState<PaletteColor | null>(null);
  const [form, setForm] = React.useState<ColorFormState>({ name: "", hex_code: "#F5C9C2" });
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setForm({ name: "", hex_code: "#F5C9C2" });
    setAddOpen(true);
  }

  function openEdit(color: PaletteColor) {
    setEditColor(color);
    setForm({ name: color.name, hex_code: color.hex_code });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const optimistic: PaletteColor = {
      id: `__optimistic__${Date.now()}`,
      name: form.name,
      hex_code: form.hex_code,
      sort_order: colors.length,
    };
    setColors((prev) => [...prev, optimistic]);
    setAddOpen(false);

    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("hex_code", form.hex_code);

    startTransition(async () => {
      const result = await addPaletteColor(eventId, fd);
      if ("error" in result) {
        toast.error(result.error);
        setColors((prev) => prev.filter((c) => c.id !== optimistic.id));
      }
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editColor) return;

    setColors((prev) =>
      prev.map((c) =>
        c.id === editColor.id
          ? { ...c, name: form.name, hex_code: form.hex_code }
          : c
      )
    );
    setEditColor(null);

    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("hex_code", form.hex_code);

    startTransition(async () => {
      const result = await updatePaletteColor(editColor.id, fd);
      if ("error" in result) {
        toast.error(result.error);
        setColors((prev) =>
          prev.map((c) => (c.id === editColor.id ? editColor : c))
        );
      }
    });
  }

  function handleDelete(color: PaletteColor) {
    setColors((prev) => prev.filter((c) => c.id !== color.id));

    startTransition(async () => {
      const result = await deletePaletteColor(color.id, eventId);
      if ("error" in result) {
        toast.error(result.error);
        setColors((prev) => {
          const sorted = [...prev, color].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          return sorted;
        });
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color) => (
          <div
            key={color.id}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-sm"
          >
            <button
              type="button"
              onClick={() => openEdit(color)}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <span
                className="inline-block h-4 w-4 rounded-full border border-border/50 shrink-0"
                style={{ backgroundColor: color.hex_code }}
              />
              <span>{color.name}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(color)}
              className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
              aria-label={`Remove ${color.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openAdd}
          disabled={isPending}
          className="rounded-full"
        >
          <Plus className="h-3 w-3" />
          Add Color
        </Button>
      </div>

      {/* Add Color Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Add Palette Color</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="add-color-name">
                Name
              </label>
              <Input
                id="add-color-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Blush"
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="add-color-hex">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="add-color-hex"
                  type="color"
                  value={form.hex_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hex_code: e.target.value }))
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-input p-0.5"
                />
                <Input
                  value={form.hex_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hex_code: e.target.value }))
                  }
                  placeholder="#F5C9C2"
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !form.name.trim()}>
                Add Color
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Color Dialog */}
      <Dialog open={!!editColor} onOpenChange={(o) => { if (!o) setEditColor(null); }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Edit Color</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-color-name">
                Name
              </label>
              <Input
                id="edit-color-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Blush"
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-color-hex">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="edit-color-hex"
                  type="color"
                  value={form.hex_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hex_code: e.target.value }))
                  }
                  className="h-8 w-10 cursor-pointer rounded border border-input p-0.5"
                />
                <Input
                  value={form.hex_code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hex_code: e.target.value }))
                  }
                  placeholder="#F5C9C2"
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditColor(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !form.name.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
