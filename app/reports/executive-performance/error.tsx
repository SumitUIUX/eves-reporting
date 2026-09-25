"use client";
import { DataError } from '@/components/eves/shared';
export default function Error({ reset }: { reset: () => void }) { return <DataError message="Unable to load data." retry={reset} />; }
