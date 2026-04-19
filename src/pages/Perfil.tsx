import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, Input, Label, Button } from "../components/ui";
import * as usuarioService from "../services/usuarioService";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const schema = z
  .object({
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().optional(),
    phone: z.preprocess((v) => (typeof v === "string" ? v.replace(/\D/g, "") : v), z.string().min(10, "Teléfono requerido").regex(/^\d{10}$/, "Ingrese 10 dígitos")),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional().refine((val) => !val || passwordRegex.test(val), {
      message: "La nueva contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y símbolo",
    }),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && data.newPassword.length > 0) {
      if (!data.currentPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["currentPassword"], message: "Ingresa tu contraseña actual para cambiar la contraseña" });
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
      }
    }
  });

type FormData = z.infer<typeof schema>;

function getLoggedPhoneLocal() {
  try {
    const raw = localStorage.getItem("rdp_last_login");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return String(obj.phone ?? "").replace(/\D/g, "") || null;
  } catch { return null; }
}

export default function Perfil() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData>, defaultValues: { firstName: "", lastName: "", phone: "" } });

  useEffect(() => {
    (async () => {
      const phone = getLoggedPhoneLocal();
      if (!phone) return;
      const user = await usuarioService.findUsuarioByPhone(phone);
      if (user) {
        setCurrentUser(user);
        setValue("firstName", user.firstName || "");
        setValue("lastName", user.lastName || "");
        setValue("phone", String(user.phone ?? "").replace(/\D/g, ""));
      }
    })();
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    setMessage(null);
    setLoading(true);
    try {
      // validate password confirmation
      if (data.newPassword && data.newPassword.length > 0) {
        if (!data.currentPassword) throw new Error("Ingresa tu contraseña actual para cambiar la contraseña");
        if (data.newPassword !== data.confirmPassword) throw new Error("Las contraseñas no coinciden");
        // attempt change password
        const phone = getLoggedPhoneLocal();
        if (!phone) throw new Error("Usuario no autenticado");
        const pwRes = await usuarioService.changePassword(phone, data.currentPassword, data.newPassword);
        if (!pwRes.ok) {
          const e = pwRes.error;
          if (e === 'invalid_current_password') throw new Error('La contraseña actual es incorrecta');
          if (e === 'user_not_found') throw new Error('Usuario no encontrado');
          throw new Error(String(e || 'No se pudo cambiar la contraseña'));
        }
      }

      // update profile
      const phoneNorm = String(data.phone ?? "").replace(/\D/g, "");
      const user = await usuarioService.findUsuarioByPhone(phoneNorm);
      if (!user) throw new Error("Usuario no encontrado");
      const upd = { id: user.id, firstName: data.firstName, lastName: data.lastName, phone: phoneNorm } as any;
      const res = await usuarioService.updateUsuario(upd);
      if (!res.ok) throw new Error(res.error || "No se pudo guardar");

      setMessage("Perfil actualizado correctamente");
      // Update last login phone if changed
      try {
        const raw = localStorage.getItem("rdp_last_login");
        if (raw) {
          const obj = JSON.parse(raw);
          obj.phone = phoneNorm;
          localStorage.setItem("rdp_last_login", JSON.stringify(obj));
        }
      } catch {}

    } catch (err: any) {
      setMessage(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (field: string) => {
    setEditError(null);
    setEditingField(field);
    const val = String(currentUser?.[field] ?? "");
    setEditValue(field === 'phone' ? val.replace(/\D/g, '') : val);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
    setEditError(null);
  };

  const saveField = async (field: string) => {
    setEditError(null);
    try {
      let newVal = String(editValue ?? "").trim();
      if (field === 'firstName') {
        if (!newVal) throw new Error('El nombre no puede estar vacío');
      }
      if (field === 'phone') {
        newVal = newVal.replace(/\D/g, '');
        if (newVal.length !== 10) throw new Error('Ingrese 10 dígitos');
      }
      const upd: any = { id: currentUser.id };
      upd[field] = newVal;
      const res = await usuarioService.updateUsuario(upd);
      if (!res.ok) throw new Error(res.error || 'No se pudo guardar');
      // refresh current user
      const refreshed = await usuarioService.findUsuarioByPhone(field === 'phone' ? newVal : currentUser.phone);
      if (refreshed) setCurrentUser(refreshed);
      // also update form values
      setValue(field === 'phone' ? 'phone' : field as any, newVal);
      // update last login if phone changed
      if (field === 'phone') {
        try {
          const raw = localStorage.getItem('rdp_last_login');
          if (raw) {
            const obj = JSON.parse(raw);
            obj.phone = newVal;
            localStorage.setItem('rdp_last_login', JSON.stringify(obj));
          }
        } catch {}
      }
      setMessage('Campo actualizado correctamente');
      cancelEdit();
    } catch (e: any) {
      setEditError(String(e?.message ?? e));
    }
  };

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

        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              {!editingField || editingField !== 'firstName' ? (
                <div className="flex items-center justify-between">
                  <div>{currentUser?.firstName || ''}</div>
                  <div>
                    <button onClick={() => startEdit('firstName')} type="button" className="text-sm text-[#020826]">✏️</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input value={editValue} onChange={(e)=> setEditValue(e.target.value)} />
                  <Button onClick={() => saveField('firstName')}>Guardar</Button>
                  <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                </div>
              )}
              {editError && editingField === 'firstName' && <p className="text-xs text-red-600">{editError}</p>}
            </div>

            <div className="space-y-1">
              <Label>Apellido</Label>
              {!editingField || editingField !== 'lastName' ? (
                <div className="flex items-center justify-between">
                  <div>{currentUser?.lastName || ''}</div>
                  <div>
                    <button onClick={() => startEdit('lastName')} type="button" className="text-sm text-[#020826]">✏️</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input value={editValue} onChange={(e)=> setEditValue(e.target.value)} />
                  <Button onClick={() => saveField('lastName')}>Guardar</Button>
                  <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                </div>
              )}
              {editError && editingField === 'lastName' && <p className="text-xs text-red-600">{editError}</p>}
            </div>

            <div className="space-y-1">
              <Label>Teléfono</Label>
              {!editingField || editingField !== 'phone' ? (
                <div className="flex items-center justify-between">
                  <div>{currentUser?.phone || ''}</div>
                  <div>
                    <button onClick={() => startEdit('phone')} type="button" className="text-sm text-[#020826]">✏️</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input value={editValue} onChange={(e)=> setEditValue(String(e.target.value).replace(/\D/g, ''))} />
                  <Button onClick={() => saveField('phone')}>Guardar</Button>
                  <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
                </div>
              )}
              {editError && editingField === 'phone' && <p className="text-xs text-red-600">{editError}</p>}
            </div>

            <div className="pt-4 border-t border-[#e5e7eb]">
              <div className="text-sm font-medium">Cambiar contraseña</div>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-2">
                <div>
                  <Label>Contraseña actual</Label>
                  <Input type="password" {...register("currentPassword")} />
                  {errors.currentPassword && <p className="text-xs text-red-600">{String(errors.currentPassword.message)}</p>}
                </div>
                <div>
                  <Label>Nueva contraseña</Label>
                  <Input type="password" {...register("newPassword")} />
                  {errors.newPassword && <p className="text-xs text-red-600">{String(errors.newPassword.message)}</p>}
                </div>
                <div>
                  <Label>Confirmar nueva contraseña</Label>
                  <Input type="password" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-xs text-red-600">{String(errors.confirmPassword.message)}</p>}
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <Button variant="ghost" onClick={() => navigate('/')}>Cancelar</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
                </div>
              </form>
            </div>
            {message && <p className="text-sm text-[#716040]">{message}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
