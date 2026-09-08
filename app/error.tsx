"use client";
import { DataError } from "@/components/eves/shared";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <DataError
      message="This page could not be loaded. Please try again."
      retry={reset}
    />
  );
}
