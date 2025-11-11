/**
 * @fileoverview ProtectedRoute Component - Controle de acesso a rotas protegidas
 * 
 * Componente HOC (Higher-Order Component) responsável por:
 * - Verificar autenticação do usuário
 * - Redirecionar não autenticados para login
 * - Renderizar layout completo (Sidebar + Header + Main)
 * - Aplicar espaçamento responsivo
 * 
 * @component
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 * 
 * Responsividade:
 * - Mobile (<768px): Padding 4 (16px), sem margin-left
 * - Tablet/Desktop (>=768px): Padding 6 (24px), margin-left 256px (Sidebar)
 * 
 * Nielsen Heuristics:
 * #1 - Visibility of system status: Redirecionamento claro quando não autenticado
 * #3 - User control and freedom: Usuário não autenticado vai para login
 * #5 - Error prevention: Previne acesso não autorizado
 * #6 - Recognition rather than recall: Layout consistente em todas as páginas
 * #8 - Aesthetic and minimalist design: Layout limpo e organizado
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import Login from '@/pages/Login';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props do componente ProtectedRoute
 */
interface ProtectedRouteProps {
  /** Componentes filhos a serem renderizados se autenticado */
  children: React.ReactNode;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Classes CSS do layout principal
 * Nielsen Heuristic #8: Aesthetic and minimalist design
 */
const LAYOUT_CLASSES = Object.freeze({
  /** Container principal com espaçamento para Header e Sidebar */
  MAIN: 'pt-20 md:ml-64 min-h-screen bg-gray-50',
  /** Container interno com padding responsivo */
  CONTENT: 'p-4 md:p-6'
});

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ProtectedRoute - HOC para proteção de rotas
 * 
 * Verifica autenticação e renderiza layout completo ou tela de login.
 * Mantém consistência visual em todas as páginas protegidas.
 * 
 * @param {ProtectedRouteProps} props - Props do componente
 * @returns {JSX.Element} Layout completo ou tela de login
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // ========== HOOKS ==========
  const { isAuthenticated } = useAuth();

  // ========== GUARD CLAUSE ==========
  // Nielsen Heuristic #5: Error prevention
  // Nielsen Heuristic #3: User control and freedom
  if (!isAuthenticated) {
    return <Login />;
  }

  // ========== RENDER AUTHENTICATED LAYOUT ==========
  // Nielsen Heuristic #6: Recognition rather than recall
  return (
    <>
      {/* Navegação lateral - Desktop only */}
      <Sidebar />
      
      {/* Header fixo - Responsivo */}
      <Header />
      
      {/* Conteúdo principal com espaçamento para Header e Sidebar */}
      {/* Nielsen Heuristic #1: Visibility of system status */}
      <main className={LAYOUT_CLASSES.MAIN}>
        <div className={LAYOUT_CLASSES.CONTENT}>
          {children}
        </div>
      </main>
    </>
  );
};

export default ProtectedRoute;
