"use client";

import * as React from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { archiveLei, unarchiveLei } from "@/actions/leis";
import { LeiFormDialog } from "@/components/catalog/lei-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lei {
  id: string;
  name: string;
  unit_price: string;
  sources: string[] | null;
  is_archived: boolean | null;
}

export function LeiActionsCell({ lei }: { lei: Lei }) {
  const [isPending, startTransition] = React.useTransition();

  function handleArchive() {
    startTransition(async () => {
      const result = lei.is_archived
        ? await unarchiveLei(lei.id)
        : await archiveLei(lei.id);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(lei.is_archived ? "Lei unarchived." : "Lei archived.");
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
          <LeiFormDialog
            lei={lei}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem onSelect={handleArchive} disabled={isPending}>
            {lei.is_archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
