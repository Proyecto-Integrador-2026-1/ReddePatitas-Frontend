import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

const API_BASE = import.meta.env.VITE_AUTH_API_URL || "http://localhost:8082/api";

interface ProfileData {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

export default function Perfil() {
  const { getToken, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
  });
  const [originalData, setOriginalData] = useState(form);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar perfil al montar
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/v1/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Error al cargar perfil");
        const data: ProfileData = await res.json();
        const profile = {
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          telefono: data.telefono || "",
          email: data.email || "",
        };
        setForm(profile);
        setOriginalData(profile);
      } catch (err) {
        setMessage({ type: "error", text: "No se pudo cargar el perfil" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [getToken]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    // Validación de campos
    if (!form.nombre || form.nombre.trim().length < 2)
      e.nombre = "Nombre inválido (mínimo 2 caracteres)";
    if (!form.apellido || form.apellido.trim().length < 2)
      e.apellido = "Apellido inválido (mínimo 2 caracteres)";
    if (!/^\d{7,15}$/.test(form.telefono.replace(/\D/g, "")))
      e.telefono = "Teléfono inválido (7-15 dígitos)";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Email inválido";

    const hasPersonalChanges =
      form.nombre !== originalData.nombre ||
      form.apellido !== originalData.apellido ||
      form.telefono !== originalData.telefono ||
      form.email !== originalData.email;

    const hasPasswordChange = newPassword !== "" || confirmPassword !== "";

    // Reglas de contraseña actual para cambios personales
    if (hasPersonalChanges && !currentPassword) {
      e.currentPassword = "Debe ingresar su contraseña actual para guardar cambios personales";
    }
    // Reglas para cambio de contraseña
    if (hasPasswordChange) {
      if (!currentPassword) {
        e.currentPassword = "Debe ingresar su contraseña actual para cambiar la contraseña";
      }
      if (newPassword.length < 8) {
        e.newPassword = "La nueva contraseña debe tener al menos 8 caracteres";
      }
      if (newPassword !== confirmPassword) {
        e.confirmPassword = "Las contraseñas no coinciden";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setSaving(true);

    const token = getToken();
    if (!token) {
      setMessage({ type: "error", text: "No autenticado" });
      setSaving(false);
      return;
    }

    const hasPersonalChanges =
      form.nombre !== originalData.nombre ||
      form.apellido !== originalData.apellido ||
      form.telefono !== originalData.telefono ||
      form.email !== originalData.email;

    const hasPasswordChange = newPassword !== "";

    if (!hasPersonalChanges && !hasPasswordChange) {
      setMessage({ type: "success", text: "No hay cambios que guardar" });
      setSaving(false);
      return;
    }

    const payload: any = {};
    if (hasPersonalChanges) {
      payload.nombre = form.nombre;
      payload.apellido = form.apellido;
      payload.telefono = form.telefono;
      payload.email = form.email;
    }
    if (hasPasswordChange) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
      payload.confirmPassword = confirmPassword;
    } else if (hasPersonalChanges) {
      // Solo cambios personales: también necesitamos la contraseña actual
      payload.currentPassword = currentPassword;
    }

    try {
      const res = await fetch(`${API_BASE}/v1/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
      const updated = await res.json();
      const newProfile = {
        nombre: updated.nombre,
        apellido: updated.apellido,
        telefono: updated.telefono,
        email: updated.email,
      };
      setForm(newProfile);
      setOriginalData(newProfile);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Perfil actualizado correctamente" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(originalData);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setMessage(null);
  };

  if (authLoading || loading) {
    return <div className="p-6 text-center">Cargando perfil...</div>;
  }

  return (
    <div className="p-6 relative">
     <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute right-4 top-4 flex items-center gap-2 rounded-md bg-[#020826] px-3 py-1.5 text-sm text-white hover:bg-[#1a2a4a] transition-colors z-20"
        >
          Cerrar
          <span aria-hidden="true">✕</span>
      </button>
      <div className="mx-auto max-w-screen-md">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-white">
            <img src="/assets/huellas.svg" alt="logo" className="h-6 w-6" />
          </div>
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
            <label className="block text-sm font-medium mb-1">Apellido</label>
            <input
              className="w-full rounded-md border p-2"
              value={form.apellido}
              onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            />
            {errors.apellido && <div className="text-sm text-red-600">{errors.apellido}</div>}
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

          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input
              className="w-full rounded-md border p-2"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
          </div>

          <div className="pt-4 border-t">
            <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
            <p className="text-sm text-muted-foreground">
              Complete solo si desea cambiar su contraseña.
            </p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm mb-1">Contraseña actual</label>
                <input
                  type="password"
                  className="w-full rounded-md border p-2"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                {errors.currentPassword && <div className="text-sm text-red-600">{errors.currentPassword}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  className="w-full rounded-md border p-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {errors.newPassword && <div className="text-sm text-red-600">{errors.newPassword}</div>}
              </div>
              <div>
                <label className="block text-sm mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  className="w-full rounded-md border p-2"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && <div className="text-sm text-red-600">{errors.confirmPassword}</div>}
              </div>
            </div>
          </div>

          {message && (
            <div className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="solid" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}