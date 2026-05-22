"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/catalog/data-table";
import { HardGoodActionsCell } from "@/components/catalog/hard-good-actions-cell";
import { Badge } from "@/components/ui/badge";

export interface HardGoodRow {
  id: string;
  name: string;
  unit_price: string;
  sources: string[] | null;
  link: string | null;
  notes: string | null;
  is_archived: boolean | null;
}

const columns: ColumnDef<HardGoodRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
    cell: ({ row }) => (
      <span className={row.original.is_archived ? "text-muted-foreground" : ""}>
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "unit_price",
    header: "Unit Price",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums text-right block">
        ${parseFloat(row.original.unit_price).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "sources",
    header: "Sources",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {(row.original.sources ?? []).join(", ")}
      </span>
    ),
  },
  {
    accessorKey: "link",
    header: "Link",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.link ? (
        <a
          href={row.original.link}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[200px] truncate block text-primary hover:underline text-sm"
          title={row.original.link}
        >
          {row.original.link.replace(/^https?:\/\//, "").split("/")[0]}
        </a>
      ) : null,
  },
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.is_archived ? (
        <Badge variant="outline">Archived</Badge>
      ) : null,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => <HardGoodActionsCell hardGood={row.original} />,
  },
];

export function HardGoodsTable({ data }: { data: HardGoodRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search hard goods..."
    />
  );
}
