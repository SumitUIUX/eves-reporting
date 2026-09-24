"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "./shared";

export function ReportEntitySelector({
  id,
  label,
  options,
  selected,
  onChange,
}: {
  id: string;
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(selected);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? options.filter((option) => option.toLowerCase().includes(term))
      : options;
  }, [options, search]);
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(filtered.length / size)),
  );
  const visible = filtered.slice(
    (currentPage - 1) * size,
    currentPage * size,
  );
  const selectedOnPage = visible.filter((option) =>
    pending.includes(option),
  ).length;
  const allOnPage = visible.length > 0 && selectedOnPage === visible.length;

  function changeOpen(next: boolean) {
    if (next) {
      setPending(selected);
      setSearch("");
      setPage(1);
    }
    setOpen(next);
  }

  function toggle(option: string, checked: boolean) {
    setPending((previous) =>
      checked
        ? [...new Set([...previous, option])]
        : previous.filter((value) => value !== option),
    );
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className="h-10 w-full justify-between overflow-hidden bg-white px-3 font-normal shadow-none"
          aria-label={`Select ${label.toLowerCase()}`}
        >
          <span className="truncate">
            {selected.length
              ? `${selected.length} ${label.toLowerCase()}${selected.length === 1 ? "" : "s"} selected`
              : `All ${label.toLowerCase()}${label.endsWith("s") ? "" : "s"}`}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Select {label.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Search and select one or more {label.toLowerCase()}s.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={`Search ${label.toLowerCase()}s…`}
              aria-label={`Search ${label.toLowerCase()}s`}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-[46vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-12 px-4">
                  <Checkbox
                    aria-label={`Select all ${label.toLowerCase()}s on this page`}
                    checked={
                      allOnPage
                        ? true
                        : selectedOnPage > 0
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={(checked) =>
                      setPending((previous) =>
                        checked === true
                          ? [...new Set([...previous, ...visible])]
                          : previous.filter(
                              (value) => !visible.includes(value),
                            ),
                      )
                    }
                  />
                </TableHead>
                <TableHead>{label}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((option) => (
                <TableRow
                  key={option}
                  data-state={pending.includes(option) ? "selected" : undefined}
                >
                  <TableCell className="px-4">
                    <Checkbox
                      checked={pending.includes(option)}
                      aria-label={option}
                      onCheckedChange={(checked) =>
                        toggle(option, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      className="w-full py-1 text-left"
                      onClick={() => toggle(option, !pending.includes(option))}
                    >
                      {option}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No {label.toLowerCase()}s found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          total={filtered.length}
          page={currentPage}
          size={size}
          setPage={setPage}
          setSize={setSize}
        />
        <div className="flex items-center justify-between gap-3 border-t px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPending([])}
            disabled={!pending.length}
          >
            Clear selection
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onChange(pending);
                setOpen(false);
              }}
            >
              <Check className="size-4" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
