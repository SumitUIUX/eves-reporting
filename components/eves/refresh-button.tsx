"use client";

import type { ComponentProps } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type RefreshButtonProps = Pick<ComponentProps<typeof Button>, "onClick" | "disabled"> & {
  label?: string;
  refreshing?: boolean;
};

export function RefreshButton({ label = "Refresh", refreshing = false, disabled, onClick }: RefreshButtonProps) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} title={label}
      aria-busy={refreshing} disabled={disabled || refreshing} onClick={onClick}>
      <RefreshCw className={`size-4${refreshing ? " animate-spin" : ""}`} aria-hidden="true" />
    </Button>
  );
}
