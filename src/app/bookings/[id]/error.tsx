"use client";

import { RouteError } from "@/components/states/RouteError";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return <RouteError retry={retry} />;
}
