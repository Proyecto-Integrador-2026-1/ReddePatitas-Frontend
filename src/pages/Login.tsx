import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, Label, Badge } from "../components/ui";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";

const assets = {
  hero: "/assets/registro-hero.png",
  avatar1: "/assets/avatar1.png",
  avatar2: "/assets/avatar2.png",
  avatar3: "/assets/avatar3.png",
  iconCheck: "/assets/icon-check.svg",
  iconPhone: "/assets/icon-phone.svg",
  iconLock: "/assets/icon-lock.svg",
  iconEye: "/assets/icon-eye.svg",
};

const featureHighlights = [
  { icon: assets.iconCheck, title: "Mapa en tiempo real", description: "Localiza mascotas cerca de ti" },
  { icon: assets.iconCheck, title: "Comunidad activa", description: "Miles de usuarios ayudando" },
  { icon: assets.iconCheck, title: "Alertas instantáneas", description: "Notificaciones en tiempo real" },
];

const schema = z.object({
  phone: z.preprocess(
    (val) => {
      if (typeof val !== "string") return "";
      return val.replace(/\D/g, "");
    },
    z.string().min(10, "El teléfono es requerido").regex(/^\d{10}$/, "El teléfono debe contener exactamente 10 dígitos")
  ),
  password: z.preprocess(
    (val) => (typeof val === "string" ? val : ""),
    z
      .string()
      .min(6, "Mínimo 6 caracteres")
      .regex(/(?=.*[A-Z])(?=.*\d)/, "Al menos una mayúscula y un número")
  ),
  remember: z.boolean().optional(),
});

type LoginData = z.infer<typeof schema>;

export function Login() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(schema) as Resolver<LoginData>,
    defaultValues: { phone: "", password: "", remember: false },
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(data: LoginData) {
    // Normalize inputs
    const phone = String(data.phone ?? "").replace(/\D/g, "").trim();
    const password = String(data.password ?? "").trim();

    // Try authenticating against local json-server first
    try {
      // Fetch all users and search client-side to avoid json-server query edge-cases
      const res = await fetch(`${API_BASE}/usuarios`);
      if (res.ok) {
        const users = await res.json();
        console.debug("json-server returned users count", Array.isArray(users) ? users.length : 0);
        const list = Array.isArray(users) ? users : [users];
        // Normalize stored phone/password and compare strictly
        const user = list.find((u: any) => {
          const storedPhone = String(u.phone ?? "").replace(/\D/g, "").trim();
          const storedPass = String(u.password ?? "").trim();
          return storedPhone === phone && storedPass === password;
        });
        if (user) {
          localStorage.setItem("rdp_last_login", JSON.stringify({ phone, at: new Date().toISOString() }));
          alert("Login exitoso: " + phone);
          navigate("/");
          return;
        }
        // If users found but none matched, log list for debugging
        if (list.length > 0 && !user) {
          console.debug("No matching user/password found. Sample stored entries:", list.map((u: any) => ({ phone: u.phone, password: u.password })));
        }
      }
    } catch (e) {
      console.debug("json-server auth error", e);
    }

    // Fallback: check localStorage keys used by other helpers
    try {
      const registrations = JSON.parse(localStorage.getItem("rdp_registrations") || "[]");
      const stored = JSON.parse(localStorage.getItem("rdp_usuarios") || "[]");
      const all = Array.isArray(registrations) ? registrations.concat(stored || []) : stored || [];
      const found = all.find((u: any) => String(u.phone) === String(data.phone) && String(u.password) === String(data.password));
      if (found) {
        localStorage.setItem("rdp_last_login", JSON.stringify({ phone: data.phone, at: new Date().toISOString() }));
        alert("Login exitoso (local): " + data.phone);
        navigate("/");
        return;
      }
    } catch (err) {
      console.debug("localStorage fallback error", err);
    }

    alert("Credenciales inválidas (intenta registrar primero)");
  }

  return (
    <div className="min-h-screen bg-[#f9f4ef] text-[#020826]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-stretch lg:gap-10 lg:py-10">
        <Card className="w-full max-w-[520px] lg:mx-auto border-[#e5e7eb] shadow-[0px_25px_50px_rgba(0,0,0,0.25)] p-6 sm:p-8 lg:p-10 lg:px-12 flex flex-col justify-between min-h-[420px] sm:min-h-[420px] lg:min-h-[520px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#020826] text-lg font-semibold text-white">🐾</span>
              <p className="text-lg font-semibold">Red de Patitas</p>
            </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#020826]">Bienvenido de nuevo</h2>
                <p className="text-[18px] text-[#716040]">Ingresa tus datos para acceder a tu cuenta y ayudar a mascotas perdidas.</p>
              </div>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="phone">Número telefónico</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="3004567890"
                    icon={<img src={assets.iconPhone} alt="teléfono" className="h-4 w-4" />}
                    inputMode="numeric"
                    pattern="\d*"
                    {...(field as any)}
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(String((e.target as HTMLInputElement).value).replace(/\D/g, ""))}
                  />
                )}
              />
              <div className="min-h-[20px]">
                {errors.phone && <p className="text-xs text-[#f25042]">{String(errors.phone.message)}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      icon={<img src={assets.iconLock} alt="candado" className="h-4 w-4" />}
                      rightIcon={
                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                          <img src={assets.iconEye} alt="mostrar" className="h-4 w-4" />
                        </button>
                      }
                      {...(field as any)}
                      value={String(field.value ?? "")}
                    />
                  )}
                />
                <button type="button" className="absolute right-2 -top-5 text-sm text-[#716040]">¿Olvidaste tu contraseña?</button>
              </div>
              <div className="min-h-[20px]">
                {errors.password && <p className="text-xs text-[#f25042]">{String(errors.password.message)}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  name="remember"
                  control={control}
                  render={({ field: { value, onChange, ...field } }) => (
                    <>
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => onChange(e.target.checked)}
                        {...field}
                        className="h-4 w-4 rounded border-[#e5e7eb] text-[#020826]"
                        id="remember"
                      />
                      <Label htmlFor="remember">Recuérdame</Label>
                    </>
                  )}
                />
              </div>

            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Enviando..." : "Iniciar sesión"}</Button>
          </form>

          <div className="mt-6">
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
              <div className="flex items-center gap-2 justify-center">
                <Button variant="ghost" onClick={() => navigate("/")}>Volver a Principal</Button>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Button variant="link" onClick={() => navigate("/registro")}>¿No tienes cuenta? Regístrate</Button>
              </div>
            </div>

            
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 text-xs text-[#5c4e34] justify-center">
              <p>Ayuda</p>
              <span>•</span>
              <p>Privacidad</p>
              <span>•</span>
              <p>Términos</p>
            </div>
          </div>
        </Card>

        <div className="hidden lg:block flex-1 space-y-10">
                  <Card className="relative overflow-hidden rounded-[32px] border-[#f0e7d9] shadow-[0px_25px_50px_rgba(0,0,0,0.25)]">
                    <div className="relative min-h-[320px] sm:min-h-[420px] lg:min-h-[520px]">
                      <img src={assets.hero} alt="peludos" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f9f4ef]/60 to-[#f9f4ef]" />
                      <div className="absolute bottom-6 right-10 flex flex-col items-start gap-2 rounded-[20px] border border-[#e5e7eb] bg-white/90 px-4 py-3 shadow-[0px_10px_30px_rgba(0,0,0,0.25)]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#dcfce7] p-2">
                            <img src={assets.iconCheck} alt="check" className="h-full w-full object-contain" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#716040]">Mascotas encontradas</p>
                            <p className="text-xl font-bold text-[#020826]">+1,240</p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-0 top-6 flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white/90 px-4 py-1 text-xs font-semibold text-[#716040]">
                        <div className="flex -space-x-3">
                          {[assets.avatar1, assets.avatar2, assets.avatar3].map((src, idx) => (
                            <img key={src} src={src} alt="reporter" className="h-8 w-8 rounded-full border-2 border-white" style={{ zIndex: 10 - idx }} />
                          ))}
                        </div>
                        <span>+2.5k usuarios</span>
                      </div>
                      <div className="absolute bottom-16 sm:bottom-20 lg:bottom-28 left-10 flex flex-col gap-1 text-[#020826]">
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">Ayudamos a que vuelvan a casa</p>
                        <p className="text-xs sm:text-sm text-[#716040]">
                          Únete a la comunidad más grande de amantes de los animales y ayuda a reunir mascotas perdidas con sus familias. Juntos hacemos la diferencia.
                        </p>
                      </div>
                    </div>
                  </Card>
        
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {featureHighlights.map((feature) => (
                      <Card key={feature.title} className="flex flex-col items-center gap-4 rounded-[20px] border-transparent bg-white/90 py-8 text-center shadow-[0px_4px_6px_rgba(0,0,0,0.1)]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f9f4ef]">
                          <img src={feature.icon} alt={feature.title} className="h-8 w-8" />
                        </div>
                        <p className="text-lg font-semibold text-[#020826]">{feature.title}</p>
                        <p className="text-sm text-[#716040]">{feature.description}</p>
                      </Card>
                    ))}
                  </div>
        
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 rounded-[24px] border border-[#e5e7eb] bg-white/60 p-6 shadow-[0px_10px_25px_rgba(0,0,0,0.15)]">
                    <img src={assets.iconCheck} alt="check" className="h-12 w-12 rounded-2xl bg-[#dcfce7] p-3" />
                    <div>
                      <p className="text-base font-semibold text-[#020826]">+1,240 mascotas reunidas</p>
                      <p className="text-sm text-[#716040]">Gracias a la comunidad, cada reporte cuenta.</p>
                    </div>
                    <Badge tone="success" className="ml-auto">Comunidad Shadcn</Badge>
                  </div>
                </div>
              </div>
            </div>
  );
}

export default Login;
