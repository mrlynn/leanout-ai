"use client";

import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/nativeBridge";

/** False on SSR and first client paint so markup matches server HTML; updates after mount. */
export function useNativeApp(): boolean {
  const [native, setNative] = useState(false);
  useEffect(() => {
    setNative(isNativeApp());
  }, []);
  return native;
}
