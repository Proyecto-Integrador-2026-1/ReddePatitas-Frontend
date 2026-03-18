import React, { ReactNode, useEffect } from "react";

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[90%] max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm text-[#716040]"
        >
          ✕
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
