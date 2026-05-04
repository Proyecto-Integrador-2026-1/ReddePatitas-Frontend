import React, { useState } from "react";
import Modal from "./Modal";
import { Button } from "./Button";
import { useAuth } from "@/hooks/useAuth";
import reportService from "@/services/reportPublicationService";

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "DATOS_INCORRECTOS", label: "Datos incorrectos" },
  { value: "MALTRATO", label: "Maltrato" },
  { value: "OTRO", label: "Otro" },
];

export default function ReportModal({
  open,
  onClose,
  publicationId,
  onReported,
}: {
  open: boolean;
  onClose: () => void;
  publicationId: string;
  onReported?: () => void;
}) {
  const { user } = useAuth();
  const userId = String(user?.id || "");

  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [otherReasonError, setOtherReasonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reportedKey = `rdp_reported_${userId}`;
  const alreadyReported = (() => {
    try {
      const raw = localStorage.getItem(reportedKey) || "[]";
      const list = JSON.parse(raw);
      return Array.isArray(list) && list.includes(publicationId);
    } catch {
      return false;
    }
  })();

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setMessage(null);
    if (!reason) {
      setError("Seleccione un motivo");
      return;
    }
    // si motivo es 'OTRO' validar campo adicional
    if (String(reason).toUpperCase() === "OTRO") {
      if (!otherReason || otherReason.trim().length < 5) {
        setOtherReasonError("El motivo 'Otro' requiere al menos 5 caracteres.");
        setSubmitting(false);
        return;
      }
    }
    if (!userId) {
      setError("Debe iniciar sesión para reportar");
      return;
    }

    setSubmitting(true);
    try {
      const descripcionValue = String(reason).toUpperCase() === "OTRO" ? otherReason.trim() : description || undefined;

      const payload = {
        reportId: publicationId,
        razon: String(reason ?? ""),
        descripcion: descripcionValue,
      };

      const msg = await reportService.submitReportPublication(payload as any, userId);

      // mark locally to avoid double reports in UI
      try {
        const raw = localStorage.getItem(reportedKey) || "[]";
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        if (!list.includes(publicationId)) {
          list.push(publicationId);
          localStorage.setItem(reportedKey, JSON.stringify(list));
        }
      } catch {}

      // notify parent that a report was created so UI can update
      onReported?.();

      setMessage(String(msg));
      setTimeout(() => {
        setSubmitting(false);
        onClose();
      }, 900);
    } catch (err: any) {
      if (err?.code === 409 || String(err?.message || "").toLowerCase().includes("already")) {
        setError("Ya ha reportado esta publicación");
      } else {
        setError(String(err?.message || err || "Error al enviar el reporte"));
      }
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Reportar publicación</h3>
          <p className="text-sm text-[#716040]">Seleccione el motivo del reporte.</p>

          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                <span className="text-sm">{r.label}</span>
              </label>
            ))}
          </div>

          {String(reason).toLowerCase() === "otro" && (
            <div>
              <label className="block text-sm mb-1">Especifique el motivo (mínimo 5 caracteres)</label>
              <input
                className="w-full rounded-md border p-2"
                value={otherReason}
                onChange={(e) => {
                  setOtherReason(e.target.value);
                  if (otherReasonError) setOtherReasonError(null);
                }}
              />
              {otherReasonError && <div className="text-sm text-red-600">{otherReasonError}</div>}
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Descripción (opcional)</label>
            <textarea
              className="w-full rounded-md border p-2"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-600">{message}</div>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="solid" size="md" disabled={submitting || alreadyReported}>
              {submitting ? "Enviando..." : alreadyReported ? "Reportado" : "Enviar reporte"}
            </Button>
            <Button variant="ghost" size="md" type="button" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
