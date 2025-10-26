import React, { useState } from 'react';
import { Home, User, HelpCircle, LayoutGrid, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(
    location.pathname === '/usuarios' || location.pathname === '/usuarios-deletados'
  );

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Função para verificar se o item pode ser exibido
  const canViewMenuItem = (niveisPermitidos: number[]) => {
    if (!user?.perfil?.nivel_acesso) return false;
    return niveisPermitidos.includes(user.perfil.nivel_acesso);
  };

  const menuItems = [
    {
      title: 'Home',
      path: '/',
      icon: Home,
      niveisPermitidos: [1, 2, 3, 4, 5] // Todos
    },
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutGrid,
      niveisPermitidos: [2, 4, 5] // Analista, Gerente e Admin (SEM Gestor)
    },
    {
      title: 'Chamados',
      path: '/chamados',
      icon: HelpCircle,
      niveisPermitidos: [1, 2, 3, 4, 5] // Todos
    }
  ];

  const userMenuItem = {
    title: 'Gerenciar Usuários',
    path: '/usuarios',
    icon: User,
    niveisPermitidos: [3, 4, 5], // Gestor, Gerente e Admin
    subItems: [
      {
        title: 'Restaurar Usuários',
        path: '/usuarios-deletados',
        icon: RotateCcw
      }
    ]
  };

  const isUserSectionActive = location.pathname === '/usuarios' || location.pathname === '/usuarios-deletados';
  
  // Verifica se pode ver o menu de usuários
  const canViewUserMenu = canViewMenuItem(userMenuItem.niveisPermitidos);

  return (
    <div className="hidden md:flex w-64 bg-gray-900 text-white flex-col fixed left-0 top-0 h-screen z-40">
      {/* Logo fixa no topo - mesma altura do header */}
      <div className="border-b border-gray-700 flex items-center justify-center h-16 bg-gray-900">
        <img
          src="/lovable-uploads/d3655855-204d-4a0f-a98d-2d80537273b9.png"
          alt="Sistec"
          className="max-h-[36px] w-auto object-contain"
        />
      </div>

      {/* Navigation - preenche o espaço restante e rola se necessário */}
      <nav className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            // Verifica se o usuário pode ver este item
            if (!canViewMenuItem(item.niveisPermitidos)) {
              return null;
            }

            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
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
                  isUserSectionActive
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
