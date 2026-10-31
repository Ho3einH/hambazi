"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <Icon name="check" size={18} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss message">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
