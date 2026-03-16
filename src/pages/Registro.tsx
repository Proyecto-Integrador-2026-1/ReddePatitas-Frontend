import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Card, Checkbox, Input, Label } from "../components/ui";

const assets = {
  hero: "/assets/registro-hero.png",
  avatar1: "/assets/avatar1.png",
  avatar2: "/assets/avatar2.png",
  avatar3: "/assets/avatar3.png",
  iconCheck: "/assets/icon-check.png",
  iconMap: "/assets/icon-map.png",
  iconCommunity: "/assets/icon-community.png",
  iconAlerts: "/assets/icon-alerts.png",
  iconUser: "/assets/icon-user.png",
  iconPhone: "/assets/icon-phone.png",
  iconLock: "/assets/icon-lock.png",
  iconEye: "/assets/icon-eye.png",
  iconDot: "/assets/icon-dot.png",
  iconArrow: "/assets/icon-arrow.png",
};

const featureHighlights = [
  {
    icon: assets.iconMap,
    title: "Mapa en tiempo real",
    description: "Localiza mascotas cerca de ti",
  },
  {
    icon: assets.iconCommunity,
    title: "Comunidad activa",
    description: "Miles de usuarios ayudando",
  },
  {
    icon: assets.iconAlerts,
    title: "Alertas instantáneas",
    description: "Notificaciones en tiempo real",
  },
];

const passwordHints = [
  "Mínimo 8 caracteres",
  "Al menos una letra mayúscula y un número",
];

const schema = z
  .object({
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    phone: z.string().min(1, "El teléfono es requerido"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/(?=.*[A-Z])(?=.*\d)/, "Al menos una mayúscula y un número"),
    confirm: z.string().min(1, "Confirmar contraseña"),
    accept: z.boolean().refine((v) => v === true, { message: "Debes aceptar los términos" }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirm) {
      ctx.addIssue({ code: "custom", message: "Las contraseñas no coinciden", path: ["confirm"] });
    }
  });

type FormData = z.infer<typeof schema>;

export function Registro() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const { registerUser } = await import("../lib/api");
      await registerUser(data);
      alert("Registro guardado localmente");
    } catch (err) {
      console.error(err);
      alert("Error al enviar");
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f4ef] text-[#020826]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-stretch">
        <Card className="w-full max-w-[520px] border-[#e5e7eb] shadow-[0px_25px_50px_rgba(0,0,0,0.25)] p-10 lg:h-[calc(100vh-80px)] lg:px-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-xl font-semibold text-white">🐾</span>
              <p className="text-xl font-semibold">Red de Patitas</p>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#020826]">Crea tu cuenta</h1>
              <p className="text-[18px] text-[#716040]">
                Únete a nuestra comunidad y ayuda a reunir mascotas con sus familias.
              </p>
            </div>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="first-name">Nombre</Label>
                  <span className="text-[#f25042]">*</span>
                </div>
                <Input id="first-name" placeholder="Juan" icon={<img src={assets.iconUser} alt="persona" className="h-4 w-4" />} {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-[#f25042]">{String(errors.firstName.message)}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="last-name">Apellido</Label>
                  <span className="text-[#f25042]">*</span>
                </div>
                <Input id="last-name" placeholder="Pérez" icon={<img src={assets.iconUser} alt="persona" className="h-4 w-4" />} {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-[#f25042]">{String(errors.lastName.message)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="phone">Número de teléfono</Label>
                <span className="text-[#f25042]">*</span>
              </div>
              <Input id="phone" placeholder="+52 123 456 7890" icon={<img src={assets.iconPhone} alt="teléfono" className="h-4 w-4" />} {...register("phone")} />
              {errors.phone && <p className="text-xs text-[#f25042]">{String(errors.phone.message)}</p>}
              <p className="text-xs text-[#5c4e34]">Formato: +52 seguido de 10 dígitos</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="password">Contraseña</Label>
                <span className="text-[#f25042]">*</span>
              </div>
              <div className="relative">
                <Input id="password" type="password" placeholder="••••••••" icon={<img src={assets.iconLock} alt="candado" className="h-4 w-4" />} {...register("password")} />
                {errors.password && <p className="text-xs text-[#f25042]">{String(errors.password.message)}</p>}
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#716040]">
                  <img src={assets.iconEye} alt="mostrar" className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {passwordHints.map((hint) => (
                  <div key={hint} className="flex items-center gap-2 text-xs text-[#5c4e34]">
                    <img src={assets.iconDot} alt="punto" className="h-1.5 w-1.5" />
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <span className="text-[#f25042]">*</span>
              </div>
              <div className="relative">
                <Input id="confirm" type="password" placeholder="••••••••" icon={<img src={assets.iconLock} alt="candado" className="h-4 w-4" />} {...register("confirm")} />
                {errors.confirm && <p className="text-xs text-[#f25042]">{String(errors.confirm.message)}</p>}
                <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#716040]">
                  <img src={assets.iconEye} alt="mostrar" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start">
                <div className="mr-3">
                  <input type="checkbox" {...register("accept")} className="h-4 w-4 rounded border-[#e5e7eb] text-[#020826]" />
                </div>
                <div>
                  <Label htmlFor="accept">Acepto los términos y condiciones y políticas de privacidad</Label>
                  {errors.accept && <p className="text-xs text-[#f25042]">{String(errors.accept.message)}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Button className="w-full text-base font-bold" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Crear Cuenta"}
              </Button>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-[#5c4e34]">
                  <p>Ayuda</p>
                  <span>•</span>
                  <p>Privacidad</p>
                  <span>•</span>
                  <p>Términos</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => window.location.assign("/")} className="text-sm text-[#716040]">
                    Volver a Principal
                  </button>
                  <button type="button" onClick={() => window.location.assign("/login")} className="text-sm font-semibold text-[#020826]">
                    ¿Ya tienes cuenta? Acceder
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Card>

        <div className="flex-1 space-y-10">
          <Card className="relative overflow-hidden rounded-[32px] border-[#f0e7d9] shadow-[0px_25px_50px_rgba(0,0,0,0.25)]">
            <div className="relative h-[420px]">
              <img src={assets.hero} alt="peludos" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f9f4ef]/60 to-[#f9f4ef]" />
              <div className="absolute -bottom-6 right-10 flex flex-col items-start gap-2 rounded-[20px] border border-[#e5e7eb] bg-white/90 px-4 py-3 shadow-[0px_10px_30px_rgba(0,0,0,0.25)]">
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
              <div className="absolute bottom-6 left-10 flex flex-col gap-1 text-white">
                <p className="text-3xl font-bold">Ayudamos a que vuelvan a casa</p>
                <p className="text-sm text-white/80">
                  Únete a la comunidad más grande de amantes de los animales y ayuda a reunir mascotas perdidas con sus familias. Juntos hacemos la diferencia.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
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

          <div className="flex flex-wrap items-center gap-6 rounded-[24px] border border-[#e5e7eb] bg-white/60 p-6 shadow-[0px_10px_25px_rgba(0,0,0,0.15)]">
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

export default Registro;
