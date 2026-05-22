"use client";

import * as React from "react";
import { toast } from "sonner";

import { importFlowersCSV } from "@/actions/flowers";
import { importHardGoodsCSV } from "@/actions/hard-goods";
import { importLeisCSV } from "@/actions/leis";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FORMAT_HINTS: Record<string, string> = {
  flowers: "name,type,stem_price,stems_per_bunch,sources",
  "hard-goods": "name,unit_price,sources",
  leis: "name,unit_price,sources",
};

interface CsvImportDialogProps {
  trigger: React.ReactNode;
  type: "flowers" | "hard-goods" | "leis";
}

export function CsvImportDialog({ trigger, type }: CsvImportDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [csvText, setCsvText] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{
    inserted: number;
    updated: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) ?? "");
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!csvText.trim()) {
      toast.error("Please paste or upload CSV data.");
      return;
    }

    startTransition(async () => {
      let res: { inserted: number; updated: number; errors: string[]; error?: string };
      if (type === "flowers") {
        res = await importFlowersCSV(csvText);
      } else if (type === "hard-goods") {
        res = await importHardGoodsCSV(csvText);
      } else {
        res = await importLeisCSV(csvText);
      }

      if ("error" in res && res.error && res.inserted === 0 && res.updated === 0) {
        toast.error(res.error);
        return;
      }

      setResult({ inserted: res.inserted, updated: res.updated, errors: res.errors });
      if (res.errors.length === 0) {
        toast.success(`Imported: ${res.inserted} added, ${res.updated} updated.`);
      } else {
        toast.warning(
          `Done with errors: ${res.inserted} added, ${res.updated} updated, ${res.errors.length} skipped.`
        );
      }
    });
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setCsvText("");
      setResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement}>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expected column format:</p>
            <code className="block rounded-md bg-muted px-3 py-2 text-xs font-mono text-foreground">
              {FORMAT_HINTS[type]}
            </code>
            <p className="mt-1 text-xs text-muted-foreground">
              First row is treated as a header and skipped. Sources should be pipe-separated (e.g.{" "}
              <code className="font-mono">Watanabe|Mayesh</code>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload .csv file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-xs text-muted-foreground">or paste below</span>
          </div>

          <textarea
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring min-h-36 resize-y"
            placeholder={`${FORMAT_HINTS[type]}\n...`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />

          {result && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm space-y-1">
              <p>
                <span className="text-green-600 font-medium">{result.inserted} added</span>,{" "}
                <span className="text-blue-600 font-medium">{result.updated} updated</span>
                {result.errors.length > 0 && (
                  <>,{" "}
                    <span className="text-destructive font-medium">
                      {result.errors.length} skipped
                    </span>
                  </>
                )}
              </p>
              {result.errors.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleImport} disabled={isPending || !csvText.trim()}>
            {isPending ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
