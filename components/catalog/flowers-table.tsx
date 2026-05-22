"use client";

import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/catalog/data-table";
import { FlowerActionsCell } from "@/components/catalog/flower-actions-cell";
import { Badge } from "@/components/ui/badge";

export interface FlowerRow {
  id: string;
  name: string;
  type: string;
  stem_price: string;
  stems_per_bunch: number;
  sources: string[] | null;
  notes: string | null;
  is_archived: boolean | null;
}

const columns: ColumnDef<FlowerRow>[] = [
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
    accessorKey: "type",
    header: "Type",
    enableSorting: true,
    cell: ({ row }) =>
      row.original.type === "flower" ? (
        <Badge variant="default">Flower</Badge>
      ) : (
        <Badge variant="secondary">Greenery</Badge>
      ),
  },
  {
    accessorKey: "stem_price",
    header: "Stem Price",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums text-right block">
        ${parseFloat(row.original.stem_price).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "stems_per_bunch",
    header: "Stems/Bunch",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums text-right block">{row.original.stems_per_bunch}</span>
    ),
  },
  {
    id: "bunch_price",
    header: "Bunch Price",
    enableSorting: false,
    cell: ({ row }) => {
      const price = parseFloat(row.original.stem_price) * row.original.stems_per_bunch;
      return (
        <span className="tabular-nums text-right block">${price.toFixed(2)}</span>
      );
    },
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
    cell: ({ row }) => <FlowerActionsCell flower={row.original} />,
  },
];

export function FlowersTable({ data }: { data: FlowerRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search flowers..."
    />
  );
}
