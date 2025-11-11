/**
 * @fileoverview MobileMenu Component - Menu de navegação para dispositivos móveis
 * 
 * Componente responsável pela navegação em telas pequenas, incluindo:
 * - Menu dropdown abaixo do header
 * - Itens de navegação com ícones
 * - Fechamento automático ao navegar
 * - Destaque do item ativo
 * 
 * @component
 * @example
 * ```tsx
 * <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 * 
 * Responsividade:
 * - Mobile (<768px): Visível quando isOpen=true
 * - Tablet/Desktop (>=768px): Hidden (usa Sidebar)
 * 
 * Nielsen Heuristics:
 * #1 - Visibility of system status: Item ativo destacado em laranja
 * #2 - Match between system and real world: Ícones + labels descritivos
 * #3 - User control and freedom: Fecha ao clicar em item
 * #4 - Consistency and standards: Padrão de menu mobile dropdown
 * #6 - Recognition rather than recall: Ícones + texto facilitam navegação
 * #8 - Aesthetic and minimalist design: Interface limpa, sem elementos desnecessários
 * #7 - Flexibility and efficiency: Acesso rápido aos itens principais
 */

import React from 'react';
import { Home, User, HelpCircle, LayoutGrid, LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props do componente MobileMenu
 */
interface MobileMenuProps {
  /** Controla visibilidade do menu */
  isOpen: boolean;
  /** Callback para fechar o menu */
  onClose: () => void;
}

/**
 * Estrutura de um item do menu
 */
interface MenuItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Configuração dos itens do menu mobile
 * Nielsen Heuristic #6: Recognition rather than recall
 */
const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Home',
    path: '/',
    icon: Home
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: LayoutGrid
  },
  {
    title: 'Chamados',
    path: '/chamados',
    icon: HelpCircle
  },
  {
    title: 'Gerenciar Usuários',
    path: '/usuarios',
    icon: User
  }
];

/**
 * Classes CSS para estado ativo e inativo
 */
const ITEM_CLASSES = Object.freeze({
  ACTIVE: 'bg-orange-500 text-white',
  INACTIVE: 'text-gray-700 hover:bg-gray-100'
});

// ============================================================================
// HELPER FUNCTIONS (PRIVADAS)
// ============================================================================

/**
 * Retorna as classes CSS apropriadas para um item do menu
 * @private
 * @param {boolean} isActive - Se o item está ativo
 * @returns {string} Classes CSS
 */
const getItemClasses = (isActive: boolean): string => {
  const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors';
  const stateClasses = isActive ? ITEM_CLASSES.ACTIVE : ITEM_CLASSES.INACTIVE;
  
  return `${baseClasses} ${stateClasses}`;
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * MobileMenu - Menu de navegação para dispositivos móveis
 * 
 * Renderiza um menu dropdown abaixo do header em dispositivos mobile.
 * Fecha automaticamente ao navegar. Oculto em desktop.
 * 
 * @param {MobileMenuProps} props - Props do componente
 * @returns {JSX.Element | null} Componente ou null se fechado
 */
export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps): JSX.Element | null => {
  // ========== HOOKS ==========
  const location = useLocation();

  // ========== EARLY RETURN ==========
  // Nielsen Heuristic #8: Aesthetic and minimalist design
  if (!isOpen) return null;

  // ========== RENDER ==========
  
  return (
    <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
      <nav className="p-4">
        <ul className="space-y-2">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            
            return (
              <li key={item.path}>
                {/* Nielsen Heuristic #1: Visibility of system status */}
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={getItemClasses(isActive)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Nielsen Heuristic #2: Match between system and real world */}
                  <IconComponent className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
