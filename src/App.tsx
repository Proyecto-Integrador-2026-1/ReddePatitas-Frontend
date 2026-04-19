import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Registro from "./pages/Registro";
import Principal from "./pages/Principal";
import Login from "./pages/Login";
import Reporte from "./pages/Reporte";
import Bandeja from "./pages/Bandeja";
import Perfil from "./pages/Perfil";
import Notificaciones from "./pages/Notificaciones";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Principal />} />
        <Route path="/mapa" element={<Navigate to="/" replace />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reporte" element={<Reporte />} />
        <Route path="/bandeja" element={<Bandeja />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
