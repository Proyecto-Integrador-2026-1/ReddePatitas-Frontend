import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Registro from "./components/Registro";
import MapaPrincipal from "./components/MapaPrincipal";
import Login from "./components/Login";
import Reportar from "./components/Reportar";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapaPrincipal />} />
        <Route path="/mapa" element={<Navigate to="/" replace />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reportar" element={<Reportar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
