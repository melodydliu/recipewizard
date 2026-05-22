"use client";

import * as React from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { archiveFlower, unarchiveFlower } from "@/actions/flowers";
import { FlowerFormDialog } from "@/components/catalog/flower-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Flower {
  id: string;
  name: string;
  type: string;
  stem_price: string;
  stems_per_bunch: number;
  sources: string[] | null;
  notes: string | null;
  is_archived: boolean | null;
}

export function FlowerActionsCell({ flower }: { flower: Flower }) {
  const [isPending, startTransition] = React.useTransition();

  function handleArchive() {
    startTransition(async () => {
      const result = flower.is_archived
        ? await unarchiveFlower(flower.id)
        : await archiveFlower(flower.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(flower.is_archived ? "Flower unarchived." : "Flower archived.");
      }
    });
  }

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" disabled={isPending} />
          }
        >
          <MoreHorizontalIcon className="size-4" />
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <FlowerFormDialog
            flower={flower}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem onSelect={handleArchive} disabled={isPending}>
            {flower.is_archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
