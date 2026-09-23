"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import styles from "./report-filter-control.module.css";

export function FilterPanel({
  title,
  open,
  onOpenChange,
  activeCount,
  presentation = "responsive",
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  presentation?: "responsive" | "drawer";
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    setReady(true);
  }, []);
  const drawer = presentation === "drawer" || (ready && isMobile);
  const trigger = (
    <Button
      variant="outline"
      className={styles.trigger}
      data-active={activeCount > 0}
      aria-label={activeCount ? `Filters (${activeCount} applied)` : "Filters"}
    >
      <SlidersHorizontal size={16} />
      Filters
      {activeCount > 0 && (
        <span className={styles.count} aria-hidden="true">
          {activeCount}
        </span>
      )}
    </Button>
  );
  if (presentation !== "drawer" && !ready) return trigger;
  if (drawer) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className={styles.mobile}>
          <SheetHeader className={styles.header}>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>Choose your scope, then apply.</SheetDescription>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className={styles.popover}
        aria-label={title}
      >
        <div className={styles.heading}>
          <h2>{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            className={styles.close}
            aria-label="Close filters"
            onClick={() => onOpenChange(false)}
          >
            <X size={16} />
          </Button>
        </div>
        {children}
      </PopoverContent>
    </Popover>
  );
}
