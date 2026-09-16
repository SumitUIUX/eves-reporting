"use client";
import {
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
export function Metric({
  label,
  value,
  note,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? "accent" : ""}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">
          <Icon size={16} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-bottom">{note}</div>
    </div>
  );
}
export function Choice({
  value,
  onChange,
  options,
  label,
  id,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  label: string;
  id?: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={label}
        className={`h-10 shadow-none bg-white text-sm ${className}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          return (
            <SelectItem value={v} key={v}>
              {typeof o === "string" ? o : o.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-box">
      <Search />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
export function DataEmpty({
  title = "No results found",
  description = "Try adjusting your search or filters.",
  children,
}: {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Empty className="py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  );
}
export function DataLoading() {
  return (
    <div aria-label="Loading data" role="status" className="p-6 space-y-6">
      {[0, 1, 2].map((n) => (
        <Skeleton key={n} className="h-12 w-full" />
      ))}
    </div>
  );
}
export function DataError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div
      className="p-10 flex flex-col gap-4 items-center text-center"
      role="alert"
    >
      <AlertCircle className="text-destructive" />
      <p className="text-sm">{message}</p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
export function TablePagination({
  total,
  page,
  size,
  setPage,
  setSize,
}: {
  total: number;
  page: number;
  size: number;
  setPage: (n: number) => void;
  setSize: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="table-footer">
      <span>
        Showing{" "}
        <strong className="font-medium text-[#676e82]">
          {total ? Math.min((page - 1) * size + 1, total) : 0}–
          {Math.min(page * size, total)}
        </strong>{" "}
        of <strong className="font-medium text-[#676e82]">{total}</strong>{" "}
        results
      </span>
      <div className="pagination-controls">
        <span>Rows per page</span>
        <Choice
          label="Rows per page"
          value={String(size)}
          onChange={(v) => {
            setSize(Number(v));
            setPage(1);
          }}
          options={["10", "25", "50", "100"]}
          className="h-8! min-w-15"
        />
        <Pagination className="w-auto m-0">
          <PaginationContent className="gap-2">
            <PaginationItem>
              <Button
                variant="ghost"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={15} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="page-number" aria-current="page">
                {page}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                aria-label="Next page"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={15} />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
export function Definition({ label, text }: { label: string; text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`${label} definition`}
          className="inline-flex text-muted-foreground"
        >
          <Info size={13} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{text}</TooltipContent>
    </Tooltip>
  );
}
export function Saving({
  label = "Save changes",
  saving,
}: {
  label?: string;
  saving: boolean;
}) {
  return (
    <>
      {saving && <LoaderCircle size={15} className="animate-spin" />}
      {saving ? "Saving…" : label}
    </>
  );
}
