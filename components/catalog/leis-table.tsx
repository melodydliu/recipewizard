"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/catalog/data-table";
import { LeiActionsCell } from "@/components/catalog/lei-actions-cell";
import { Badge } from "@/components/ui/badge";

export interface LeiRow {
  id: string;
  name: string;
  unit_price: string;
  sources: string[] | null;
  is_archived: boolean | null;
}

const columns: ColumnDef<LeiRow>[] = [
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
    cell: ({ row }) => <LeiActionsCell lei={row.original} />,
  },
];

export function LeisTable({ data }: { data: LeiRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search leis..."
    />
  );
}
