/**
 * @fileoverview Sidebar Component - Menu lateral de navegação
 * 
 * Componente responsável pela navegação lateral do sistema, incluindo:
 * - Menu principal com controle de permissões
 * - Submenu de gestão de usuários
 * - Logo fixo no topo
 * - Navigation scroll
 * 
 * @component
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 * 
 * Responsividade:
 * - Mobile (<768px): Hidden (usa MobileMenu)
 * - Tablet/Desktop (>=768px): Sidebar fixa 256px
 * 
 * Nielsen Heuristics:
 * #1 - Visibility of system status: Item ativo destacado
 * #2 - Match between system and real world: Ícones intuitivos
 * #4 - Consistency and standards: Padrão de menu lateral
 * #6 - Recognition rather than recall: Ícones + texto
 * #7 - Flexibility and efficiency: Submenu expansível
 * #8 - Aesthetic and minimalist design: Menu limpo e organizado
 */

import React, { useState } from 'react';
import { Home, User, HelpCircle, LayoutGrid, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Níveis de acesso do sistema
 */
const ACCESS_LEVELS = Object.freeze({
  USUARIO: 1,
  ANALISTA: 2,
  GESTOR: 3,
  GERENTE: 4,
  ADMIN: 5
});

/**
 * Configuração dos itens do menu principal
 */
interface MenuItem {
  title: string;
  path: string;
  icon: any;
  niveisPermitidos: number[];
}

/**
 * Configuração do submenu de usuários
 */
interface SubMenuItem {
  title: string;
  path: string;
  icon: any;
}

// ============================================================================
// HELPER FUNCTIONS (PRIVADAS)
// ============================================================================

/**
 * Verifica se o item do menu pode ser exibido para o usuário atual
 * @private
 * @param {number[]} niveisPermitidos - Níveis que podem ver este item
 * @param {number | undefined} nivelUsuario - Nível de acesso do usuário
 * @returns {boolean} True se pode exibir
 */
const canViewMenuItem = (niveisPermitidos: number[], nivelUsuario?: number): boolean => {
  if (!nivelUsuario) return false;
  return niveisPermitidos.includes(nivelUsuario);
};

/**
 * Verifica se um path está ativo (atual ou filho)
 * @private
 * @param {string} currentPath - Path atual da navegação
 * @param {string[]} paths - Paths a verificar
 * @returns {boolean} True se algum path está ativo
 */
const isPathActive = (currentPath: string, ...paths: string[]): boolean => {
  return paths.includes(currentPath);
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Sidebar - Menu lateral de navegação principal
 * 
 * Gerencia a navegação lateral com controle de permissões e submenu expansível.
 * Oculto em mobile, fixo em tablet/desktop.
 */
export const Sidebar = () => {
  // ========== HOOKS ==========
  const location = useLocation();
  const { user } = useAuth();
  
  // ========== STATES ==========
  /**
   * Controla expansão do submenu de usuários
   * Inicia aberto se estiver em uma página relacionada
   */
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(
    isPathActive(location.pathname, '/usuarios', '/usuarios-deletados')
  );

  // ========== MENU CONFIGURATION ==========
  
  /**
   * Itens do menu principal
   * Nielsen Heuristic #2: Match between system and real world
   */
  const menuItems: MenuItem[] = [
    {
      title: 'Home',
      path: '/',
      icon: Home,
      niveisPermitidos: [
        ACCESS_LEVELS.USUARIO,
        ACCESS_LEVELS.ANALISTA,
        ACCESS_LEVELS.GESTOR,
        ACCESS_LEVELS.GERENTE,
        ACCESS_LEVELS.ADMIN
      ] // Todos podem ver
    },
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutGrid,
      niveisPermitidos: [
        ACCESS_LEVELS.ANALISTA,
        ACCESS_LEVELS.GERENTE,
        ACCESS_LEVELS.ADMIN
      ] // Analista, Gerente e Admin (SEM Gestor nível 3)
    },
    {
      title: 'Chamados',
      path: '/chamados',
      icon: HelpCircle,
      niveisPermitidos: [
        ACCESS_LEVELS.USUARIO,
        ACCESS_LEVELS.ANALISTA,
        ACCESS_LEVELS.GESTOR,
        ACCESS_LEVELS.GERENTE,
        ACCESS_LEVELS.ADMIN
      ] // Todos podem ver
    }
  ];

  /**
   * Item de gestão de usuários com submenu
   * Nielsen Heuristic #7: Flexibility and efficiency of use
   */
  const userMenuItem = {
    title: 'Gerenciar Usuários',
    path: '/usuarios',
    icon: User,
    niveisPermitidos: [
      ACCESS_LEVELS.GESTOR,
      ACCESS_LEVELS.GERENTE,
      ACCESS_LEVELS.ADMIN
    ], // Gestor, Gerente e Admin
    subItems: [
      {
        title: 'Restaurar Usuários',
        path: '/usuarios-deletados',
        icon: RotateCcw
      }
    ]
  };

  // ========== HANDLERS ==========
  
  /**
   * Toggle do submenu de usuários
   */
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // ========== DERIVED STATE ==========
  
  const userSectionActive = isPathActive(
    location.pathname,
    '/usuarios',
    '/usuarios-deletados'
  );
  
  const canViewUserMenu = canViewMenuItem(
    userMenuItem.niveisPermitidos,
    user?.perfil?.nivel_acesso
  );

  return (
    <div className="hidden md:flex w-64 bg-gray-900 text-white flex-col fixed left-0 top-0 h-screen z-40 border-r border-gray-700">
      {/* Logo fixa no topo - alinhada com header */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-center px-4 md:px-6 py-4">
          <img
            src="/lovable-uploads/d3655855-204d-4a0f-a98d-2d80537273b9.png"
            alt="Sistec"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>

      {/* Navigation - preenche o espaço restante e rola se necessário */}
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            // Verifica se o usuário pode ver este item
            // Nielsen Heuristic #6: Recognition rather than recall
            if (!canViewMenuItem(item.niveisPermitidos, user?.perfil?.nivel_acesso)) {
              return null;
            }

            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            
            return (
              <li key={item.path}>
                {/* Nielsen Heuristic #1: Visibility of system status */}
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}

          {/* Menu de Gerenciar Usuários - só aparece se tiver permissão */}
          {canViewUserMenu && (
            <li>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  userSectionActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={toggleUserMenu}
              >
                <User className="w-5 h-5" />
                <span className="flex-1">{userMenuItem.title}</span>
                {isUserMenuOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>

              {isUserMenuOpen && (
                <ul className="mt-2 ml-8 space-y-1">
                  <li>
                    <Link
                      to={userMenuItem.path}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        location.pathname === userMenuItem.path
                          ? 'bg-orange-400 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                      <span>Lista de Usuários</span>
                    </Link>
                  </li>

                  {userMenuItem.subItems.map((subItem) => {
                    const isSubActive = location.pathname === subItem.path;
                    return (
                      <li key={subItem.path}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                            isSubActive
                              ? 'bg-orange-400 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
};
