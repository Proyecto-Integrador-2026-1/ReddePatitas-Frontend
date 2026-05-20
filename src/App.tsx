import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Registro from "./pages/Registro";
import Principal from "./pages/Principal";
import Login from "./pages/Login";
import Reporte from "./pages/Reporte";
import Perfil from "./pages/Perfil";
import { Navigate } from "react-router-dom";
import Bandeja from "./pages/Bandeja";
import CasosExitosos from "./pages/CasosExitosos";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Principal />} />
        <Route path="/mapa" element={<Navigate to="/" replace />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reporte" element={<Reporte />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/casos-exitosos" element={<CasosExitosos />} />
        <Route path="/conversations" element={<Bandeja />} />
        <Route path="/dashboard" element={<Dashboard/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
