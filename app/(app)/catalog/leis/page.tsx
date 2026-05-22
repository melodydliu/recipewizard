import { getLeis, useMock } from "@/lib/data";
import { LeisTable } from "@/components/catalog/leis-table";
import { LeiFormDialog } from "@/components/catalog/lei-form-dialog";
import { CsvImportDialog } from "@/components/catalog/csv-import-dialog";
import { Button } from "@/components/ui/button";

export default async function LeisPage() {
  const leis = await getLeis(true);

  return (
    <div className="p-6 space-y-6">
      {useMock && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2.5 text-sm text-yellow-800">
          Preview mode — changes won&apos;t be saved without a database.
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Leis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master catalog · {leis.length} items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvImportDialog
            type="leis"
            trigger={
              <Button variant="outline" size="sm">
                Import CSV
              </Button>
            }
          />
          <LeiFormDialog
            trigger={
              <Button size="sm">
                Add Lei
              </Button>
            }
          />
        </div>
      </div>

      <LeisTable data={leis} />
    </div>
  );
}
