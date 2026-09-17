"use client";

import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export function ColumnVisibilityControl({
  labels,
  columns,
  onChange,
  compactColumns,
  compactOnMobile = false,
}: {
  labels: readonly string[];
  columns: number[];
  onChange: (columns: number[]) => void;
  compactColumns?: number[];
  compactOnMobile?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Columns (${columns.length} visible)`}
        >
          <Columns3 size={15} />
          <span className={compactOnMobile ? "hidden sm:inline" : ""}>
            Columns
          </span>
          <span
            className={`count-pill ${compactOnMobile ? "hidden sm:inline" : ""}`}
            aria-hidden="true"
          >
            {columns.length}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[60vh] overflow-auto w-64"
      >
        <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => onChange(labels.map((_, index) => index))}
        >
          Show all columns
        </DropdownMenuItem>
        {compactColumns && (
          <DropdownMenuItem onSelect={() => onChange(compactColumns)}>
            Compact view
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {labels.map((label, index) => (
          <DropdownMenuCheckboxItem
            key={index}
            checked={columns.includes(index)}
            disabled={columns.length === 1 && columns[0] === index}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...new Set([...columns, index])].sort((a, b) => a - b)
                  : columns.filter((column) => column !== index),
              )
            }
          >
            {label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
