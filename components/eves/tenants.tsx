"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Landmark,
  SlidersHorizontal,
  ExternalLink,
  Trash2,
  RefreshCw,
  Plus,
  Minus,
  MapPin,
  ArrowDownUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Choice, DataEmpty, PageActions, SearchInput, TablePagination } from "./shared";
import {
  analyticsOptions,
  componentNames,
  blankTenant,
  reportAccess,
  reportHierarchy,
  reportsFromTenant,
  useTenant,
  type Tenant,
} from "./tenant-context";
import headerStyles from "./report-page.module.css";

const tenantColumns = [
  { key: "name", label: "Name" },
  { key: "subdomain", label: "Subdomain" },
  { key: "email", label: "Email" },
  { key: "createdOn", label: "Created on" },
  { key: "createdBy", label: "Created by" },
  { key: "changedOn", label: "Changed on" },
  { key: "changedBy", label: "Changed by" },
] as const;

type TenantColumn = (typeof tenantColumns)[number]["key"];
type TenantField = "name" | "subdomain" | "email" | "contact";

function TenantInput({
  id,
  label,
  value,
  error,
  required = false,
  type = "text",
  readOnly = false,
  className = "",
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  type?: string;
  readOnly?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Tenants() {
  const {
    tenants,
    source,
    selectTenant,
    setTenantView,
    saveTenant,
    refreshTenants,
    deleteTenant,
    restoreTenant,
  } = useTenant();
  const isSample = source === "sample";
  const router = useRouter();
  const [columns, setColumns] = useState(tenantColumns.map((_, i) => i));
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Tenant | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TenantField, string>>>({});
  const [removing, setRemoving] = useState<Tenant | null>(null);
  const [tab, setTab] = useState("tenant");
  const [type, setType] = useState("Analytics");
  const [expanded, setExpanded] = useState<string[]>(["Reports/Analytics"]);
  const [sort, setSort] = useState<{ key: TenantColumn; asc: boolean }>({
    key: "subdomain",
    asc: true,
  });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const filtered = tenants
    .filter((tenant) =>
      `${tenant.id} ${tenant.name} ${tenant.subdomain} ${tenant.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const result = a[sort.key].localeCompare(b[sort.key], undefined, {
        numeric: true,
      });
      return result * (sort.asc ? 1 : -1);
    });
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * size, current * size);

  useEffect(() => {
    setDraft(null);
    setRemoving(null);
    setQuery("");
    setPage(1);
    setFieldErrors({});
  }, [source]);
  function changeQuery(next: string) {
    setQuery(next);
    setPage(1);
  }
  function edit(tenant: Tenant) {
    const reports = reportsFromTenant(tenant);
    setDraft({ ...structuredClone(tenant), reports, ...reportAccess(reports) });
    setFieldErrors({});
    setTab("tenant");
    setType("Analytics");
    setExpanded(["Reports/Analytics"]);
  }
  function updateDraft(key: keyof Tenant, value: string) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    if (key === "name" || key === "subdomain" || key === "email" || key === "contact") {
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
    }
  }
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const next: Partial<Record<TenantField, string>> = {};
    if (!draft.name.trim()) next.name = "Enter a name.";
    if (!draft.subdomain.trim()) next.subdomain = "Enter a subdomain.";
    else if (
      tenants.some(
        (tenant) =>
          tenant.id !== draft.id &&
          tenant.subdomain.toLowerCase() === draft.subdomain.trim().toLowerCase(),
      )
    )
      next.subdomain = "This subdomain is already in use.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
      next.email = "Enter a valid email.";
    if (!draft.id && !draft.contact.trim()) next.contact = "Enter a contact.";
    setFieldErrors(next);
    if (Object.keys(next).length) {
      setTab("tenant");
      return;
    }
    const now = new Date().toLocaleString("en-US");
    if (
      saveTenant({
        ...draft,
        id: draft.id || crypto.randomUUID(),
        name: draft.name.trim(),
        subdomain: draft.subdomain.trim(),
        createdOn: draft.createdOn || now,
        createdBy: draft.createdBy || "Tenant View",
        changedOn: now,
        changedBy: "Tenant View",
      })
    ) {
      toast.success("Tenant saved");
      setDraft(null);
    }
  }
  const address = draft
    ? [draft.address1, draft.address2, draft.city, draft.region, draft.postalCode, draft.country]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <>
      <div className={headerStyles.header}>
        <PageActions>
          <Button onClick={() => edit(blankTenant())} disabled={!isSample}>
            <Plus size={16} />
            Create
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh tenants"
            onClick={() => {
              refreshTenants();
              if (isSample) toast.success("Tenant records refreshed");
              else toast.error("Workspace tenant API is not connected.");
            }}
          >
            <RefreshCw size={16} />
          </Button>
        </PageActions>
      </div>
      <section className="panel" aria-label="Tenants">
        <div className="table-toolbar">
          <SearchInput
            value={query}
            onChange={changeQuery}
            placeholder="Search tenants…"
          />
        </div>
        {rows.length ? (
          <Table className="eves-table">
            <TableHeader>
              <TableRow>
                <TableHead>Action(s)</TableHead>
                {tenantColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      sort.key === column.key
                        ? sort.asc
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    <button
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() =>
                        setSort((current) => ({
                          key: column.key,
                          asc: current.key === column.key ? !current.asc : true,
                        }))
                      }
                    >
                      {column.label}
                      <ArrowDownUp size={12} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${tenant.name}`}
                        onClick={() => edit(tenant)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Open ${tenant.name}`}
                        onClick={() => {
                          const reportRoutes = [
                            ["executive-overview", "/dashboard"],
                            ["project-tagging", "/reports/project-tags"],
                            ["generate-reports", "/reports/regulatory"],
                            ["charging-sessions", "/reports/charging-sessions"],
                            ["interval-load-profile", "/reports/interval-load-profile"],
                            ["infrastructure-throughput", "/reports/throughput"],
                            ["uptime-reliability", "/"],
                            ["charging-performance", "/reports/charging-performance"],
                            ["site-performance", "/reports/site-performance"],
                            ["charger-connector-performance", "/reports/charger-performance"],
                            ["energy-demand", "/reports/energy-demand"],
                            ["tenant-uptime-reliability", "/reports/tenant-uptime-reliability"],
                            ["revenue-financial", "/reports/revenue-transaction"],
                          ] as const;
                          const href = tenant.components["Reports/Analytics"]
                            ? reportRoutes.find(([id]) => tenant.reports[id])?.[1]
                            : undefined;
                          selectTenant(tenant.id);
                          if (href) {
                            setTenantView(true);
                            router.push(href);
                          }
                          toast.success(`Tenant: ${tenant.name}`);
                        }}
                      >
                        <ExternalLink size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        aria-label={`Delete ${tenant.name}`}
                        onClick={() => setRemoving(tenant)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="project-cell">
                      <span className="project-icon">
                        <Image
                          src="/eves-logo.svg"
                          alt=""
                          width={22}
                          height={24}
                          unoptimized
                        />
                      </span>
                      <div>
                        <button
                          type="button"
                          className="project-name hover:text-primary text-left"
                          onClick={() => edit(tenant)}
                        >
                          {tenant.name}
                        </button>
                        <div className="project-id">{tenant.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{tenant.subdomain}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>
                    <span className="date-cell">{tenant.createdOn}</span>
                  </TableCell>
                  <TableCell>{tenant.createdBy}</TableCell>
                  <TableCell>
                    <span className="date-cell">{tenant.changedOn}</span>
                  </TableCell>
                  <TableCell>{tenant.changedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <DataEmpty>
            {isSample && !query && (
              <Button onClick={() => edit(blankTenant())}>
                <Plus size={15} />
                Create
              </Button>
            )}
          </DataEmpty>
        )}
        <TablePagination
          total={filtered.length}
          page={current}
          size={size}
          setPage={setPage}
          setSize={setSize}
        />
      </section>
      <Dialog
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit tenant" : "Create tenant"}</DialogTitle>
            <DialogDescription>
              Tenant details and component configuration. Changes are saved in this browser.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form onSubmit={save} className="dialog-body" noValidate>
              <Tabs value={tab} onValueChange={setTab}>
                <div className="panel-tabs rounded-lg border">
                  <TabsList>
                    <TabsTrigger value="tenant">
                      <Landmark size={16} />
                      Tenant
                    </TabsTrigger>
                    <TabsTrigger value="components">
                      <SlidersHorizontal size={16} />
                      Components
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="tenant" className="flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <Image
                      src="/eves-logo.svg"
                      alt="EVES tenant logo"
                      width={72}
                      height={80}
                      unoptimized
                    />
                    <p className="text-sm text-muted-foreground">
                      {draft.name || "New tenant"}
                    </p>
                  </div>
                  <div className="form-grid">
                    <TenantInput
                      id="tenant-name"
                      className="full"
                      label="Name"
                      required
                      value={draft.name}
                      error={fieldErrors.name}
                      onChange={(value) => updateDraft("name", value)}
                    />
                    <TenantInput
                      id="tenant-subdomain"
                      label="Subdomain"
                      required
                      readOnly={Boolean(draft.id)}
                      value={draft.subdomain}
                      error={fieldErrors.subdomain}
                      onChange={(value) => updateDraft("subdomain", value)}
                    />
                    <TenantInput
                      id="tenant-email"
                      label="Email"
                      required
                      type="email"
                      value={draft.email}
                      error={fieldErrors.email}
                      onChange={(value) => updateDraft("email", value)}
                    />
                    <TenantInput
                      id="tenant-address1"
                      label="Address 1"
                      value={draft.address1}
                      onChange={(value) => updateDraft("address1", value)}
                    />
                    <TenantInput
                      id="tenant-address2"
                      label="Address 2"
                      value={draft.address2}
                      onChange={(value) => updateDraft("address2", value)}
                    />
                    <TenantInput
                      id="tenant-postal"
                      label="Postal code"
                      value={draft.postalCode}
                      onChange={(value) => updateDraft("postalCode", value)}
                    />
                    <TenantInput
                      id="tenant-city"
                      label="City"
                      value={draft.city}
                      onChange={(value) => updateDraft("city", value)}
                    />
                    <TenantInput
                      id="tenant-department"
                      label="Department"
                      value={draft.department}
                      onChange={(value) => updateDraft("department", value)}
                    />
                    <TenantInput
                      id="tenant-region"
                      label="Region"
                      value={draft.region}
                      onChange={(value) => updateDraft("region", value)}
                    />
                    <TenantInput
                      id="tenant-country"
                      label="Country"
                      value={draft.country}
                      onChange={(value) => updateDraft("country", value)}
                    />
                    <TenantInput
                      id="tenant-latitude"
                      label="Latitude"
                      type="number"
                      value={draft.latitude}
                      onChange={(value) => updateDraft("latitude", value)}
                    />
                    <TenantInput
                      id="tenant-longitude"
                      label="Longitude"
                      type="number"
                      value={draft.longitude}
                      onChange={(value) => updateDraft("longitude", value)}
                    />
                    <TenantInput
                      id="tenant-contact"
                      label="Contact"
                      required={!draft.id}
                      type="tel"
                      value={draft.contact}
                      error={fieldErrors.contact}
                      onChange={(value) => updateDraft("contact", value)}
                    />
                    <div className="form-field">
                      <span className="text-sm font-medium">Place</span>
                      {address ? (
                        <a
                          className="inline-flex h-10 items-center gap-2 text-sm text-primary"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MapPin size={16} />
                          View place
                        </a>
                      ) : (
                        <Button type="button" variant="outline" disabled>
                          <MapPin size={16} />
                          View place
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="components" className="flex flex-col gap-2">
                  {componentNames.map((name) => (
                    <section key={name} className="rounded-md border">
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`${expanded.includes(name) ? "Collapse" : "Expand"} ${name}`}
                          aria-expanded={expanded.includes(name)}
                          onClick={() =>
                            setExpanded((current) =>
                              current.includes(name)
                                ? current.filter((item) => item !== name)
                                : [...current, name],
                            )
                          }
                        >
                          {expanded.includes(name) ? <Minus size={16} /> : <Plus size={16} />}
                        </Button>
                        <Switch
                          checked={draft.components[name]}
                          aria-label={`Enable ${name}`}
                          onCheckedChange={(checked) =>
                            setDraft({
                              ...draft,
                              components: { ...draft.components, [name]: checked },
                            })
                          }
                        />
                        <span className="text-sm font-medium">{name}:1.0</span>
                      </div>
                      {expanded.includes(name) &&
                        (name === "Reports/Analytics" ? (
                          <div className="grid gap-4 px-4 pb-4">
                            <div className="form-field max-w-md">
                              <label htmlFor="tenant-reporting-type">
                                Type <span className="text-primary">*</span>
                              </label>
                              <Choice
                                id="tenant-reporting-type"
                                label="Reporting type"
                                value={type}
                                className="w-full"
                                disabled={!draft.components[name]}
                                options={["Analytics", "Reporting"]}
                                onChange={setType}
                              />
                            </div>
                            <fieldset
                              className="grid gap-3 disabled:opacity-50"
                              disabled={!draft.components[name]}
                            >
                              {type === "Analytics" ? (
                                analyticsOptions.map((option, index) => (
                                  <div key={option} className="flex items-center gap-2">
                                    <Checkbox
                                      id={`tenant-analytics-${index}`}
                                      checked={draft.analytics.includes(option)}
                                      onCheckedChange={(checked) =>
                                        setDraft({
                                          ...draft,
                                          analytics:
                                            checked === true
                                              ? [...draft.analytics, option]
                                              : draft.analytics.filter((item) => item !== option),
                                        })
                                      }
                                    />
                                    <label htmlFor={`tenant-analytics-${index}`} className="text-sm">
                                      {option}
                                    </label>
                                  </div>
                                ))
                              ) : (
                                reportHierarchy.map((group) => {
                                  const ids = group.items.map((item) => item.id);
                                  const selected = ids.filter((id) => draft.reports[id]).length;
                                  const checked =
                                    selected === 0
                                      ? false
                                      : selected === ids.length
                                        ? true
                                        : "indeterminate";
                                  return (
                                    <div key={group.id} className="grid gap-2">
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={`tenant-report-${group.id}`}
                                          checked={checked}
                                          onCheckedChange={(value) => {
                                            const reports = { ...draft.reports };
                                            for (const id of ids) reports[id] = value === true;
                                            setDraft({
                                              ...draft,
                                              reports,
                                              ...reportAccess(reports),
                                            });
                                          }}
                                        />
                                        <label
                                          htmlFor={`tenant-report-${group.id}`}
                                          className="text-sm font-medium"
                                        >
                                          {group.label}
                                        </label>
                                      </div>
                                      <div className="grid gap-2 pl-6">
                                        {group.items.map((item) => (
                                          <div key={item.id} className="flex items-center gap-2">
                                            <Checkbox
                                              id={`tenant-report-${item.id}`}
                                              checked={!!draft.reports[item.id]}
                                              onCheckedChange={(value) => {
                                                const reports = {
                                                  ...draft.reports,
                                                  [item.id]: value === true,
                                                };
                                                setDraft({
                                                  ...draft,
                                                  reports,
                                                  ...reportAccess(reports),
                                                });
                                              }}
                                            />
                                            <label
                                              htmlFor={`tenant-report-${item.id}`}
                                              className="text-sm"
                                            >
                                              {item.label}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </fieldset>
                          </div>
                        ) : (
                          <p className="px-4 pb-4 text-sm text-muted-foreground">
                            {name} is {draft.components[name] ? "enabled" : "disabled"} for this
                            tenant.
                          </p>
                        ))}
                    </section>
                  ))}
                </TabsContent>
              </Tabs>
              <div className="dialog-footer">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit">{draft.id ? "Save changes" : "Create tenant"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the tenant from this browser’s table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing && deleteTenant(removing.id)) {
                  const id = removing.id;
                  toast.success("Tenant deleted", {
                    action: { label: "Undo", onClick: () => restoreTenant(id) },
                  });
                  setRemoving(null);
                }
              }}
            >
              Delete tenant
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
