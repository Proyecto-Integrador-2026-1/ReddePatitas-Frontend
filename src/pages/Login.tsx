import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, Label, Badge } from "../components/ui";
import Modal from "../components/ui/Modal";
import usuarioService from "../services/usuarioService";
import { useAuth } from "../hooks/useAuth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";


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
  email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
  password: z.preprocess((val) => (typeof val === "string" ? val : ""), z.string().min(6, "Mínimo 6 caracteres")),
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
    defaultValues: { email: "", password: "", remember: false },
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  function handleCloseModal() {
    setModalOpen(false);
    if (modalSuccess) {
      navigate("/");
    }
  }

  const { login } = useAuth();

  async function onSubmit(data: LoginData) {
    const email = String((data as any).email ?? "").trim();
    const password = String(data.password ?? "").trim();

    const result = await usuarioService.loginUsuario(email, password);
    if (!result.ok) {
      setModalMessage(String(result.error || "Credenciales inválidas"));
      setModalSuccess(false);
      setModalOpen(true);
      return;
    }

    if (result.token) {
      login(result.token);
    }
    localStorage.setItem("rdp_last_login", JSON.stringify({ email, at: new Date().toISOString() }));
    setModalMessage("Login exitoso");
    setModalSuccess(true);
    setModalOpen(true);
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
              <Label htmlFor="email">Correo electrónico</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input id="email" type="email" placeholder="juan.perez@correo.com" {...(field as any)} />
                )}
              />
              <div className="min-h-[20px]">
                {errors.email && <p className="text-xs text-[#f25042]">{String((errors.email as any)?.message)}</p>}
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
              <button type="button" onClick={() => setPrivacyOpen(true)} className="text-xs text-[#5c4e34] underline">
                Privacidad
              </button>
              <span>•</span>
              <button type="button" onClick={() => setTermsOpen(true)} className="text-xs text-[#5c4e34] underline">
                Términos
              </button>
            </div>
          </div>
        </Card>

        <Modal open={modalOpen} onClose={handleCloseModal}>
          <div className={`p-6 ${modalSuccess ? "bg-white" : "bg-white"}` }>
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 flex items-center justify-center rounded-full ${modalSuccess ? "bg-green-100" : "bg-red-100"}`}>
                <span className="text-2xl">{modalSuccess ? '✅' : '❌'}</span>
              </div>
              <div>
                <p className="text-lg font-semibold">{modalSuccess ? 'Login exitoso' : 'Error'}</p>
                <p className="text-sm text-[#5c4e34]">{modalMessage}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleCloseModal}>Cerrar</Button>
            </div>
          </div>
        </Modal>

        <Modal open={termsOpen} onClose={() => setTermsOpen(false)}>
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4 text-sm text-[#020826]">
            <h2 className="text-lg font-bold text-center">Términos y Condiciones de Uso (T&C)</h2>
            <p>
              Bienvenido a Red de Patitas. Al acceder y utilizar nuestra plataforma, usted acepta cumplir con los siguientes Términos y Condiciones. Si no está de acuerdo, por favor absténgase de usar el servicio.
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Naturaleza del Proyecto</strong>
                <div>
                  Red de Patitas es un proyecto de carácter estrictamente académico y sin fines de lucro. El objetivo de la plataforma es facilitar la publicación de mascotas (perdidas, en adopción o comunidad) en Colombia. No gestionamos ventas, compras, ni publicidad de terceros.
                </div>
              </li>
              <li>
                <strong>Registro y Veracidad de la Información</strong>
                <div>
                  Para interactuar en la plataforma, el usuario debe registrarse proporcionando: nombre, apellido, correo electrónico, teléfono y una contraseña. El usuario se compromete a entregar información real y vigente. La cuenta es personal e intransferible.
                </div>
              </li>
              <li>
                <strong>Uso del Chat y Privacidad entre Usuarios</strong>
                <div>
                  <ul className="list-disc pl-5">
                    <li>
                      <strong>Visibilidad:</strong> En el chat interno y en las publicaciones, solo se mostrará el Nombre del usuario para proteger su privacidad.
                    </li>
                    <li>
                      <strong>Datos Protegidos:</strong> El correo electrónico y el número de teléfono no serán visibles para otros usuarios, a menos que el titular decida compartirlos voluntariamente dentro de la conversación del chat.
                    </li>
                    <li>
                      <strong>Conducta:</strong> Queda prohibido el uso de lenguaje ofensivo, discriminatorio o la publicación de contenido que vulnere derechos de terceros o leyes colombianas.
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <strong>Información de las Mascotas</strong>
                <div>
                  Al realizar una publicación, el usuario acepta que el nombre, descripción, foto y dirección de referencia de la mascota sean visibles para todos los usuarios de la plataforma con el fin de lograr el objetivo de la red (ubicación de mascotas).
                </div>
              </li>
              <li>
                <strong>Exclusión de Responsabilidad</strong>
                <div>
                  Red de Patitas funciona como un intermediario de información. No nos hacemos responsables por:
                  <ul className="list-disc pl-5">
                    <li>La veracidad de las publicaciones realizadas por los usuarios.</li>
                    <li>Acuerdos externos entre usuarios (entregas de mascotas, rescates, etc.).</li>
                  </ul>
                </div>
              </li>
              <li>
                <strong>Ley Aplicable</strong>
                <div>
                  Estos términos se rigen por las leyes de la República de Colombia.
                </div>
              </li>
            </ol>
          </div>
        </Modal>

        <Modal open={privacyOpen} onClose={() => setPrivacyOpen(false)}>
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4 text-sm text-[#020826]">
            <h2 className="text-lg font-bold text-center">Política de Privacidad y Tratamiento de Datos</h2>
            <p>
              En cumplimiento de la Ley 1581 de 2012 y demás normas concordantes, informamos a nuestros usuarios sobre el tratamiento de sus datos personales.
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Datos que Recolectamos</strong>
                <div>
                  • Datos de Registro: Nombre, apellido, correo electrónico, teléfono y contraseña (encriptada).<br/>
                  • Datos de Publicación: Fotos, descripciones y ubicaciones relacionadas con mascotas.
                </div>
              </li>
              <li>
                <strong>Finalidad del Tratamiento</strong>
                <div>
                  Los datos recolectados se utilizarán exclusivamente para:
                  <ol className="list-decimal pl-5">
                    <li>Permitir el acceso y autenticación a la plataforma.</li>
                    <li>Gestionar las publicaciones de mascotas dentro del territorio colombiano.</li>
                    <li>Facilitar la comunicación interna entre usuarios a través del chat (mostrando solo el nombre).</li>
                    <li>Fines académicos de mejora de la aplicación.</li>
                  </ol>
                </div>
              </li>
              <li>
                <strong>Derechos de los Usuarios (Titulares)</strong>
                <div>
                  De acuerdo con la ley colombiana, usted tiene derecho a:
                  <ul className="list-disc pl-5">
                    <li>Conocer, actualizar y rectificar sus datos personales.</li>
                    <li>Solicitar la prueba de la autorización otorgada.</li>
                    <li>Ser informado sobre el uso que se le ha dado a sus datos.</li>
                    <li>Solicitar la supresión de sus datos o revocar la autorización cuando lo desee.</li>
                  </ul>
                </div>
              </li>
              <li>
                <strong>Uso de Cookies y Terceros</strong>
                <div>
                  • Cookies: Red de Patitas no utiliza cookies ni herramientas de seguimiento de navegación.<br/>
                  • Publicidad: No compartimos ni vendemos su información a terceros con fines publicitarios o comerciales.
                </div>
              </li>
              <li>
                <strong>Seguridad de la Información</strong>
                <div>
                  Implementamos medidas técnicas razonables para proteger sus datos sensibles contra acceso no autorizado o pérdida. Al ser un proyecto académico, instamos a los usuarios a no utilizar contraseñas que empleen en otros servicios críticos (bancos, correos principales).
                </div>
              </li>
            </ol>
          </div>
        </Modal>

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
                  </div>
                </div>
              </div>
            </div>
  );
}

export default Login;