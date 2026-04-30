import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

export default function Perfil() {
  const { user } = useAuth();
  const userId = String(user?.id || "");
  const storageKey = `rdp_profile_${userId}`;

  const initial = {
    nombre: "",
    telefono: "",
  };

  const [form, setForm] = useState(initial);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // load persisted profile for this user if available (visual only)
    try {
      if (!userId) return; // wait for auth
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setForm((f) => ({ ...f, ...(parsed ?? {}) }));
        return;
      }
      // fallback to token username
      setForm((f) => ({ ...f, nombre: user?.username ?? f.nombre }));
    } catch {}
  }, [userId, user?.username]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.nombre || form.nombre.trim().length < 2) e.nombre = "Nombre inválido";
    if (!/^[0-9]{7,15}$/.test(String(form.telefono || "").replace(/\D/g, ""))) e.telefono = "Teléfono inválido (7-15 dígitos)";

    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword.length < 8) e.newPassword = "La nueva contraseña debe tener al menos 8 caracteres";
      if (newPassword !== confirmPassword) e.confirmPassword = "Las contraseñas no coinciden";
      if (!currentPassword) e.currentPassword = "Ingrese la contraseña actual para cambiarla";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);
    if (!validate()) return;

    // Visual only: persist locally per user id and show success
    try {
      if (userId) localStorage.setItem(storageKey, JSON.stringify({ nombre: form.nombre, telefono: form.telefono }));
    } catch {}

    setMessage("Cambios guardados (visual). Conectar al backend más adelante.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }
  const navigate = useNavigate();

  return (
    <div className="p-6 relative">
      <button type="button" aria-label="Cerrar perfil" onClick={() => navigate('/')} className="absolute right-4 top-4 text-sm text-[#716040] z-20">✕</button>
      <div className="mx-auto max-w-screen-md">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white"><img src="/assets/huellas.svg" alt="logo" className="h-6 w-6"/></div>
          <div>
            <p className="text-xl font-semibold">Red de Patitas</p>
            <div className="text-sm text-muted-foreground font-bold">Configuración de perfil</div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              className="w-full rounded-md border p-2"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            {errors.nombre && <div className="text-sm text-red-600">{errors.nombre}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input
              className="w-full rounded-md border p-2"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Solo dígitos"
            />
            {errors.telefono && <div className="text-sm text-red-600">{errors.telefono}</div>}
          </div>

          <div className="pt-4 border-t">
            <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
            <p className="text-sm text-muted-foreground">Dejar en blanco para no cambiarla.</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm mb-1">Contraseña actual</label>
                <input type="password" className="w-full rounded-md border p-2" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                {errors.currentPassword && <div className="text-sm text-red-600">{errors.currentPassword}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Nueva contraseña</label>
                <input type="password" className="w-full rounded-md border p-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                {errors.newPassword && <div className="text-sm text-red-600">{errors.newPassword}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Confirmar nueva contraseña</label>
                <input type="password" className="w-full rounded-md border p-2" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                {errors.confirmPassword && <div className="text-sm text-red-600">{errors.confirmPassword}</div>}
              </div>
            </div>
          </div>

          {message && <div className="text-sm text-green-600">{message}</div>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => window.history.back()}>Cancelar</Button>
            <Button type="submit" variant="solid">Guardar cambios</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
