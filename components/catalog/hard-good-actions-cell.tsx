"use client";

import * as React from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { archiveHardGood, unarchiveHardGood } from "@/actions/hard-goods";
import { HardGoodFormDialog } from "@/components/catalog/hard-good-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HardGood {
  id: string;
  name: string;
  unit_price: string;
  sources: string[] | null;
  link: string | null;
  notes: string | null;
  is_archived: boolean | null;
}

export function HardGoodActionsCell({ hardGood }: { hardGood: HardGood }) {
  const [isPending, startTransition] = React.useTransition();

  function handleArchive() {
    startTransition(async () => {
      const result = hardGood.is_archived
        ? await unarchiveHardGood(hardGood.id)
        : await archiveHardGood(hardGood.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(hardGood.is_archived ? "Hard good unarchived." : "Hard good archived.");
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
          <HardGoodFormDialog
            hardGood={hardGood}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem onSelect={handleArchive} disabled={isPending}>
            {hardGood.is_archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
