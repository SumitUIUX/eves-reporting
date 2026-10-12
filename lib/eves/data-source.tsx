"use client";

import { createContext, useContext } from "react";

import { useStoredSelection } from "./use-stored-selection";

export type DataSource = "workspace" | "sample";

type DataSourceContextValue = {
  source: DataSource;
  selectSource: (source: DataSource) => void;
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource, ready] = useStoredSelection<DataSource>("eves-data-source-v1", "sample", (value): value is DataSource => value === "sample" || value === "workspace");
  if (!ready) return null;
  return (
    <DataSourceContext.Provider value={{ source, selectSource: setSource }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const value = useContext(DataSourceContext);
  if (!value) throw new Error("DataSourceProvider is required");
  return value;
}
