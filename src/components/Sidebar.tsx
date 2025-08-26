import React, { useState } from 'react';
import { Home, User, HelpCircle, LayoutGrid, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(
    location.pathname === '/usuarios' || location.pathname === '/usuarios-deletados'
  );

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const menuItems = [
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
    }
  ];

  // Item especial para Gerenciar Usuários com submenu
  const userMenuItem = {
    title: 'Gerenciar Usuários',
    path: '/usuarios',
    icon: User,
    subItems: [
      {
        title: 'Restaurar Usuários',
        path: '/usuarios-deletados',
        icon: RotateCcw
      }
    ]
  };

  const isUserSectionActive = location.pathname === '/usuarios' || location.pathname === '/usuarios-deletados';

  return (
    <div className="hidden md:flex w-64 bg-gray-900 text-white flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-center">
          <img 
            src="/lovable-uploads/d3655855-204d-4a0f-a98d-2d80537273b9.png" 
            alt="Sistec"
            className="h-12 w-auto max-w-full object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {/* Menu items regulares */}
          {menuItems.map((item) => {
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

          {/* Menu item especial com submenu para Usuários */}
          <li>
            {/* Item principal - Gerenciar Usuários */}
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

            {/* Submenu */}
            {isUserMenuOpen && (
              <ul className="mt-2 ml-8 space-y-1">
                {/* Link para Gerenciar Usuários */}
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

                {/* Subitems */}
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
        </ul>
      </nav>
    </div>
  );
};
