import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Registro from "./pages/Registro";
import Principal from "./pages/Principal";
import Login from "./pages/Login";
import Reportar from "./pages/Reportar";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Principal />} />
        <Route path="/mapa" element={<Navigate to="/" replace />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reportar" element={<Reportar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
