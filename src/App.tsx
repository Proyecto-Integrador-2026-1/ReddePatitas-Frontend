import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import websocketService from "./services/websocketService";
import Registro from "./pages/Registro";
import Principal from "./pages/Principal";
import Login from "./pages/Login";
import Reporte from "./pages/Reporte";
import Perfil from "./pages/Perfil";
import Bandeja from "./pages/Bandeja";
import CasosExitosos from "./pages/CasosExitosos";
import Dashboard from "./pages/Dashboard";

// Componente interno que usa useAuth (ya tiene el provider desde index.tsx)
function AppContent() {
  const { user, isAuthenticated } = useAuth();

  // 1. Solicitar permiso de notificaciones al autenticar (solo una vez)
  useEffect(() => {
    const hasRequested = localStorage.getItem('notifications_requested');
    
    if (isAuthenticated && user && !hasRequested) {
        websocketService.requestPushPermission().then(granted => {
        localStorage.setItem('notifications_requested', 'true');
        localStorage.setItem('notifications_enabled', String(granted));
        console.log('Permiso de notificaciones:', granted ? '✅ Aceptado' : '❌ Denegado');
      });
    }
  }, [isAuthenticated, user]);

  // 2. Conectar WebSocket cuando el usuario está autenticado
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      websocketService.connect(user.id, () => {
        console.log('📡 WebSocket conectado para usuario:', user.id);
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user?.id, isAuthenticated]);

  // 3. Registrar handlers globales de notificaciones
  useEffect(() => {
    // Handler para nuevos mensajes
    const handleNewMessage = (event: CustomEvent) => {
      const notification = event.detail;
      console.log('📨 Nuevo mensaje recibido:', notification);
      // Disparar evento para que otros componentes actualicen badges
      window.dispatchEvent(new CustomEvent('refresh-unread-count'));
    };
    
    // Handler para mensajes leídos
    const handleMessagesRead = (event: CustomEvent) => {
      console.log('✓ Mensajes marcados como leídos:', event.detail);
      window.dispatchEvent(new CustomEvent('refresh-unread-count'));
    };
    
    // Handler para conversación eliminada
    const handleConversationDeleted = (event: CustomEvent) => {
      console.log('🗑️ Conversación eliminada:', event.detail);
      window.dispatchEvent(new CustomEvent('refresh-conversations'));
    };
    
    // Registrar todos los handlers
    window.addEventListener('new-message', handleNewMessage as EventListener);
    window.addEventListener('messages-read', handleMessagesRead as EventListener);
    window.addEventListener('conversation-deleted', handleConversationDeleted as EventListener);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener);
      window.removeEventListener('messages-read', handleMessagesRead as EventListener);
      window.removeEventListener('conversation-deleted', handleConversationDeleted as EventListener);
    };
  }, []);

  // Renderizar rutas (sin cambios)
  return (
    <Routes>
      <Route path="/" element={<Principal />} />
      <Route path="/mapa" element={<Navigate to="/" replace />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reporte" element={<Reporte />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/casos-exitosos" element={<CasosExitosos />} />
      <Route path="/conversations" element={<Bandeja />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

// App principal (BrowserRouter aquí, AuthProvider ya está en index.tsx)
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;