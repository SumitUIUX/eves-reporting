"use client";

import { createContext, useContext, useState } from "react";

export type DataSource = "workspace" | "sample";

type DataSourceContextValue = {
  source: DataSource;
  selectSource: (source: DataSource) => void;
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<DataSource>("sample");
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
