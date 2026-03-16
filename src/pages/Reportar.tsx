import React from "react";
import { Button, Card, Input, Label } from "../components/ui";
import { useForm } from "react-hook-form";

type ReportData = { name: string; description: string };

export function Reportar() {
  const { register, handleSubmit } = useForm<ReportData>();

  function onSubmit(data: ReportData) {
    const listRaw = localStorage.getItem("rdp_reports") || "[]";
    const list = JSON.parse(listRaw) as any[];
    list.push({ ...data, at: new Date().toISOString() });
    localStorage.setItem("rdp_reports", JSON.stringify(list));
    alert("Reporte guardado");
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card className="p-8">
          <h2 className="text-2xl font-bold">Reportar mascota</h2>
          <p className="text-sm text-muted-foreground mt-1">Describe la mascota para ayudar a encontrarla.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Label htmlFor="name">Nombre (opcional)</Label>
              <Input id="name" placeholder="Ej: Rocky" {...register("name")} />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" placeholder="Color, tamaño, ubicación" {...register("description")} />
            </div>

            <Button type="submit">Enviar reporte</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default Reportar;
