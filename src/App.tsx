import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Chamados from "./pages/Chamados";
import Usuarios from "./pages/Usuarios";
import NovoChamado from "./pages/NovoChamado";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { GerenciarUsuarios } from './components/GerenciarUsuarios';
import { UsuariosDeletados } from './components/UsuariosDeletados';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/chamados" element={
              <ProtectedRoute>
                <Chamados />
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute>
                <GerenciarUsuarios />
              </ProtectedRoute>
            } />
            <Route path="/usuarios-deletados" element={
              <ProtectedRoute>
                <UsuariosDeletados />
              </ProtectedRoute>
            } />
            <Route path="/novo-chamado" element={
              <ProtectedRoute>
                <NovoChamado />
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
