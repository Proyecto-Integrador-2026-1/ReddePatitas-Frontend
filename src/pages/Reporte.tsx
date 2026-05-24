import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, Label } from "../components/ui";
import Modal from "../components/ui/Modal";
import reporteService from "../services/reporteService";
import { saveFile } from "../lib/idb";
import { Map, MapControls } from "@/components/ui/map";
import MapLibreGL from "maplibre-gl";
import { useAuth } from "../hooks/useAuth";
import { getUserIdFromToken, getValidToken } from "../utils/jwt";

type FormData = {
  userid: string;
  estado: string;
  tipo: string;
  tipo_otro?: string;
  nombre?: string;
  descripcion: string;
  fecha_desaparicion: string;
  lugar_desaparicion: string;
  latitud: string;
  longitud: string;
  url_imagen: string;
};

const parseFlexibleDate = (value: string): Date | null => {
  if (!value) return null;
  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // dd/mm/yyyy
  const dmy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
    return null;
  }
  // Fallback: try Date.parse
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const isValidDate = (value: string) => parseFlexibleDate(value) !== null;

const toISOWithUTC = (dateStr: string): string => {
  const parsed = parseFlexibleDate(dateStr); // ya tienes esta función
  if (!parsed) return "";
  // Asegurar UTC a medianoche
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())).toISOString();
};


const schema = z
  .object({
    estado: z.string().min(1, "Seleccione el estado"),
    tipo: z.string().min(1, "Seleccione el tipo de animal"),
    tipo_otro: z.string().optional(),
    nombre: z.string().optional(),
    descripcion: z.string().min(60, "La descripción es requerida (mín 60 caracteres)"),
    fecha_desaparicion: z
      .string()
      .min(1, "La fecha es requerida")
      .refine(isValidDate, { message: "Fecha inválida" }),
    lugar_desaparicion: z.string().min(1, "El lugar de desaparicion es requerido"),
    latitud: z.string().min(1, "La latitud es requerida"),
    longitud: z.string().min(1, "La longitud es requerida"),
    url_imagen: z.string().min(1, "La foto es requerida"),
    userid: z.string().min(1, "El ID del usuario es requerido"),
  })
  .superRefine((data, ctx) => {
    const allowedEstados = ["perdido", "encontrado"];
    const allowedTipos = ["perro", "gato", "otros"];
    if (!allowedEstados.includes(data.estado)) {
      ctx.addIssue({ code: "custom", message: "Seleccione un estado válido", path: ["estado"] });
    }
    if (!allowedTipos.includes(data.tipo)) {
      ctx.addIssue({ code: "custom", message: "Seleccione un tipo válido", path: ["tipo"] });
    }
    if (data.tipo === "otros") {
      if (!data.tipo_otro) {
        ctx.addIssue({ code: "custom", message: "Especifica el tipo de animal", path: ["tipo_otro"] });
      } else if (/\d/.test(data.tipo_otro)) {
        ctx.addIssue({ code: "custom", message: "El tipo no puede contener números", path: ["tipo_otro"] });
      }
    }
    if (data.latitud && isNaN(Number(data.latitud))) {
      ctx.addIssue({ code: "custom", message: "Latitud inválida", path: ["latitud"] });
    }
    if (data.longitud && isNaN(Number(data.longitud))) {
      ctx.addIssue({ code: "custom", message: "Longitud inválida", path: ["longitud"] });
    }
    // If the pet is marked as "perdido", nombre becomes required
    if ((data.estado || "").toLowerCase() === "perdido") {
      if (!data.nombre || String(data.nombre).trim().length === 0) {
        ctx.addIssue({ code: "custom", message: "El nombre es requerido cuando la mascota está perdida", path: ["nombre"] });
      }
    }
});

export function Reportar() {
  const { user } = useAuth();

  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const openTerms = () => {
    setTermsOpen(true);
  };
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const openPrivacy = () => setPrivacyOpen(true);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      userid: "",
      estado: "",
      tipo: "",
      tipo_otro: "",
      nombre: "",
      descripcion: "",
      fecha_desaparicion: "",
      lugar_desaparicion: "",
      latitud: "",
      longitud: "",
      url_imagen: "",
    },
  });

  // Prefill userid from authenticated user or token (if available)
  useEffect(() => {
    if (user && (user as any).id) {
      setValue("userid", String((user as any).id));
      return;
    }

    const tok = getValidToken();
    if (tok) {
      const id = getUserIdFromToken(tok);
      console.log("Token extraído, userid:", id);
      if (id !== null && id !== undefined) {
        setValue("userid", id);
        // debug log to confirm extracted id during development
        // eslint-disable-next-line no-console
        console.debug("JWT userId (extracted):", id);
      }
    }
  }, [user, setValue]);

  const estadoValue = watch("estado");
  const useridValue = watch("userid");

  // Map ref and marker for selecting coordinates on map
  const mapRef = useRef<any>(null);
  const markerRef = useRef<MapLibreGL.Marker | null>(null);

  useEffect(() => {
    let attached = false;
    let cleanup: (() => void) | null = null;

    const tryAttach = () => {
      const map = mapRef.current as MapLibreGL.Map | null;
      if (!map || attached) return;

      attached = true;

      const handler = (e: any) => {
        const lng = e.lngLat?.lng;
        const lat = e.lngLat?.lat;
        if (typeof lat !== "number" || typeof lng !== "number") return;
        setValue("latitud", String(lat));
        setValue("longitud", String(lng));

        if (!markerRef.current) {
          markerRef.current = new MapLibreGL.Marker().setLngLat([lng, lat]).addTo(map);
        } else {
          markerRef.current.setLngLat([lng, lat]);
        }
      };

      map.on("click", handler);
      map.on("touchend", handler);

      cleanup = () => {
        map.off("click", handler);
        map.off("touchend", handler);
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
      };
    };

    // try immediately, else poll until mapRef is set (map component sets ref after mount)
    tryAttach();
    const id = setInterval(() => {
      if (!attached) tryAttach();
      if (attached) clearInterval(id);
    }, 200);

    return () => {
      clearInterval(id);
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        userid: data.userid,
        estado: data.estado,
        tipo: data.tipo === "otros" ? "otro" : data.tipo,
        tipo_otro: data.tipo === "otros" ? (data.tipo_otro?.trim() || null) : null,
        nombre: data.nombre?.trim() || "",
        descripcion: data.descripcion,
        fecha_desaparicion: toISOWithUTC(data.fecha_desaparicion),
        lugar_desaparicion: data.lugar_desaparicion,
        latitud: Number(data.latitud),
        longitud: Number(data.longitud),
        creadoEn: new Date().toISOString(),
      };

      await reporteService.createReporte(payload, selectedFile);
      alert("Reporte enviado");
      navigate("/");
      return;
    } catch (apiErr) {
      console.debug("API fallback, guardando en localStorage", apiErr);
      const fechaISO = toISOWithUTC(data.fecha_desaparicion);

      // If we have a selected File, save it to IndexedDB and store a short reference in the JSON
      let imageRef = data.url_imagen || null;
      try {
        if (selectedFile) {
          const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await saveFile(id, selectedFile);
          imageRef = `localfile:${id}`;
        }
      } catch (e) {
        console.warn("Failed to save file to IndexedDB", e);
      }

      const userid = data.userid;
      const existing = JSON.parse(localStorage.getItem("rdp_mascotas") || "[]");
      existing.push({
        userid: userid,
        estado: data.estado,
        tipo: data.tipo === "otros" ? "otro" : data.tipo,
        tipo_otro: data.tipo === "otros" ? (data.tipo_otro?.trim() || null) : null,
        nombre: data.nombre?.trim() || "",
        descripcion: data.descripcion,
        fecha_desaparicion: fechaISO,
        lugar_desaparicion: data.lugar_desaparicion,
        latitud: Number(data.latitud),
        longitud: Number(data.longitud),
        url_imagen: imageRef,
        creadoEn: new Date().toISOString(),
      });
      localStorage.setItem("rdp_mascotas", JSON.stringify(existing));
      alert("Reporte guardado localmente (fallback)");
      navigate("/");
      return;
    }
  }


  return (
    <div className="min-h-screen bg-[#f9f4ef] text-[#020826]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:items-stretch md:gap-10 md:py-10">
        <Card className="order-1 md:order-1 w-full md:w-6/12 lg:w-5/12 border-[#e5e7eb] shadow-[0px_25px_50px_rgba(0,0,0,0.25)] p-4 sm:p-6 lg:p-10 lg:px-12 flex flex-col justify-between h-full min-h-[420px] sm:min-h-[420px] md:min-h-[520px] overflow-y-auto max-h-[calc(100vh-140px)] md:overflow-visible md:max-h-none">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#020826] text-xl font-semibold text-white">🐾</span>
              <p className="text-xl font-semibold">Red de Patitas</p>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#020826]">Reportar mascota</h1>
              <p className="text-[18px] text-[#716040]">
                Ayuda a reunir mascotas con sus familias.
              </p>
            </div>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex flex-wrap gap-4">
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <>
                      <label className="flex items-center gap-2">
                        <input type="radio" value="perdido" checked={field.value === "perdido"} onChange={() => field.onChange("perdido")} />
                        <span>Perdido</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" value="encontrado" checked={field.value === "encontrado"} onChange={() => field.onChange("encontrado")} />
                        <span>Encontrado</span>
                      </label>
                    </>
                  )}
                />
              </div>
              {errors.estado && <p className="text-xs text-[#f25042]">{String(errors.estado?.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de animal</Label>
              <div className="flex gap-4 items-center">
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <>
                      <label className="flex items-center gap-2">
                        <input type="radio" value="perro" checked={field.value === "perro"} onChange={() => field.onChange("perro")} />
                        <span>Perro</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" value="gato" checked={field.value === "gato"} onChange={() => field.onChange("gato")} />
                        <span>Gato</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" value="otros" checked={field.value === "otros"} onChange={() => field.onChange("otros")} />
                        <span>Otros</span>
                      </label>
                    </>
                  )}
                />
              </div>
              {errors.tipo && <p className="text-xs text-[#f25042]">{String(errors.tipo?.message)}</p>}
              {watch("tipo") === "otros" && (
                <div className="mt-2">
                  <Controller
                    name="tipo_otro"
                    control={control}
                    render={({ field }) => <Input placeholder="Especifica el tipo" {...field} />}
                  />
                  {errors.tipo_otro && <p className="text-xs text-[#f25042]">{String(errors.tipo_otro?.message)}</p>}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre de la mascota {estadoValue === "perdido" ? <span className="text-[#020826]">(requerido)</span> : <span className="text-[#716040]">(opcional)</span>}
              </Label>
              <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" placeholder="Firulais" {...field} />} />
              {errors.nombre && <p className="text-xs text-[#f25042]">{String(errors.nombre?.message)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => <textarea rows={4} className="w-full rounded border p-2" {...field} />}
              />
              {errors.descripcion && <p className="text-xs text-[#f25042]">{String(errors.descripcion?.message)}</p>}
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Controller
                  name="fecha_desaparicion"
                  control={control}
                  render={({ field }) => {
                    // store value as dd/mm/aaaa, but input type=date uses yyyy-mm-dd
                    const toISO = (dmy: string) => {
                      if (!dmy) return "";
                      const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                      if (!m) return "";
                      return `${m[3]}-${m[2]}-${m[1]}`;
                    };
                    return (
                      <>
                        <Input
                          type="date"
                          value={toISO(String(field.value || ""))}
                          onChange={(e) => {
                            const iso = e.target.value; // yyyy-mm-dd or empty
                            if (!iso) return field.onChange("");
                            const parts = iso.split("-");
                            if (parts.length === 3) {
                              const [y, m, d] = parts;
                              field.onChange(`${d}/${m}/${y}`);
                            } else {
                              field.onChange("");
                            }
                          }}
                          onKeyDown={(e) => e.preventDefault()}
                          onPaste={(e) => e.preventDefault()}
                        />
                      </>
                    );
                  }}
                />
                <p className="text-xs text-[#716040]">Formato: dd/mm/aaaa (usa el calendario)</p>
                {errors.fecha_desaparicion && <p className="text-xs text-[#f25042]">{String(errors.fecha_desaparicion?.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label>Lugar de desaparición</Label>
                <Controller name="lugar_desaparicion" control={control} render={({ field }) => <Input placeholder="Localidad o referencia" {...field} />} />
                {errors.lugar_desaparicion && <p className="text-xs text-[#f25042]">{String(errors.lugar_desaparicion?.message)}</p>}
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitud</Label>
                <Controller name="latitud" control={control} render={({ field }) => <Input placeholder="0.00000" {...field} />} />
                {errors.latitud && <p className="text-xs text-[#f25042]">{String(errors.latitud?.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label>Longitud</Label>
                <Controller name="longitud" control={control} render={({ field }) => <Input placeholder="0.00000" {...field} />} />
                {errors.longitud && <p className="text-xs text-[#f25042]">{String(errors.longitud?.message)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foto</Label>
              <Controller
                name="url_imagen"
                control={control}
                render={({ field }) => (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) {
                          clearErrors("url_imagen");
                          setShowPreview(null);
                          setSelectedFile(null);
                          return field.onChange("");
                        }

                        const allowed = ["image/jpeg", "image/png", "image/webp"];
                        const maxBytes = 2 * 1024 * 1024; // 2MB

                        if (!allowed.includes(file.type)) {
                          setShowPreview(null);
                          setError("url_imagen", { type: "manual", message: "Formato no válido (jpeg/png/webp)" });
                          return field.onChange("");
                        }

                        if (file.size > maxBytes) {
                          setShowPreview(null);
                          setError("url_imagen", { type: "manual", message: "La imagen supera 2MB" });
                          return field.onChange("");
                        }

                        clearErrors("url_imagen");
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = String(reader.result ?? "");
                          // double-check data url mime
                          if (!/^data:(image\/jpeg|image\/png|image\/webp);base64,/.test(result)) {
                            setShowPreview(null);
                            setError("url_imagen", { type: "manual", message: "Formato de imagen inválido" });
                            setSelectedFile(null);
                            return field.onChange("");
                          }
                          // keep preview as data URL but store the File object separately
                          setShowPreview(result);
                          setSelectedFile(file);
                          field.onChange(file.name);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {showPreview && <img src={showPreview} alt="preview" className="mt-2 h-24 md:h-32 w-auto object-cover rounded" />}
                    {errors.url_imagen && <p className="text-xs text-[#f25042]">{String(errors.url_imagen?.message)}</p>}
                  </>
                )}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm text-[#716040]">Usuario ID (debug): {String(useridValue || "")}</div>
              <Button className="w-full text-base md:text-lg font-bold py-3 md:py-4" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Reportar"}
              </Button>
            </div>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <button type="button" onClick={() => navigate("/")} className="text-sm text-[#716040]">
                Volver a Principal
              </button>
              <button type="button" onClick={() => navigate("/registro")} className="text-sm font-semibold text-[#020826]">
                ¿No tienes cuenta? Regístrate
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#5c4e34] justify-center">
              <p>Ayuda</p>
              <span>•</span>
              <button type="button" onClick={openPrivacy} className="text-xs text-[#5c4e34] underline">
                Privacidad
              </button>
              <span>•</span>
              <button type="button" onClick={openTerms} className="text-xs text-[#5c4e34] underline">
                Términos
              </button>
            </div>
          </div>

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
        </Card>

        <div className="order-2 md:order-2 w-full md:w-6/12 lg:w-7/12 flex-1">
          <div className="relative h-[40vh] sm:h-[50vh] md:h-full md:min-h-[520px] rounded-2xl p-4">
              <div className="h-full w-full rounded-2xl overflow-hidden">
              <Map ref={mapRef} center={[-75.56843, 6.270]} zoom={11}>
                <MapControls position="bottom-right" showZoom showCompass showLocate showFullscreen />
              </Map>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reportar;
