import { useState } from "react";

export function useClipboard(timeout = 1200) {
  const [copied, setCopied] = useState(false);

  const copy = async (value) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };

  return { copied, copy };
}
