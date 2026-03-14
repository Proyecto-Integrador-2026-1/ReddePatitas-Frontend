import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, Label } from "./ui";

type LoginData = { email: string; password: string };

export function Login() {
  const { register, handleSubmit } = useForm<LoginData>();
  const navigate = useNavigate();

  async function onSubmit(data: LoginData) {
    // simple mock: store last login
    localStorage.setItem("rdp_last_login", JSON.stringify({ email: data.email, at: new Date().toISOString() }));
    alert("Login simulado: " + data.email);
    navigate("/registro");
  }

  return (
    <div className="min-h-screen bg-[#f9f4ef] flex items-center justify-center p-6">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="p-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Inicia sesión</h2>
            <p className="text-sm text-[#716040]">Accede a tu cuenta para gestionar reportes y notificaciones.</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="correo@ejemplo.com" {...register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => navigate("/")}>Volver a Principal</Button>
            <Button variant="link" onClick={() => navigate("/registro")}>¿No tienes cuenta? Regístrate</Button>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <img src="/assets/054d749a.png" alt="hero" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f9f4ef]/90" />
          <div className="absolute bottom-6 left-6 text-white">
            <h3 className="text-3xl font-bold">Únete a la comunidad</h3>
            <p className="text-sm">Ayuda a reunir mascotas con sus familias.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Login;
