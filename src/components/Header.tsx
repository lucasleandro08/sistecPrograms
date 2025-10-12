import React, { useState, useEffect } from 'react';
import { Bell, Menu, User, LogOut, AlertTriangle } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { ProfilePanel } from './ProfilePanel';
import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [processando, setProcessando] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'logout-modal-force-zindex-header';
    style.innerHTML = `
      .logout-modal-overlay-header {
        z-index: 9999 !important;
      }
    `;

    const oldStyle = document.getElementById('logout-modal-force-zindex-header');
    if (!oldStyle) {
      document.head.appendChild(style);
    }

    return () => {
      const styleElement = document.getElementById('logout-modal-force-zindex-header');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setProcessando(true);

    setTimeout(() => {
      logout();
      setIsProfilePanelOpen(false);
      setShowLogoutConfirm(false);
      setProcessando(false);
    }, 500);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 md:left-64">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 max-w-full">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-orange-500 transition-colors"
              aria-label="Abrir menu móvel"
            >
              <Menu className="w-6 h-6" />
            </button>
            <img
              src="/lovable-uploads/d3655855-204d-4a0f-a98d-2d80537273b9.png"
              alt="Sistec"
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="hidden md:block"></div>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <div className="relative">
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600 hover:text-orange-500 cursor-pointer transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsProfilePanelOpen(!isProfilePanelOpen)}
                className="flex items-center gap-2 md:gap-3 hover:bg-gray-100 p-1 md:p-2 rounded-lg transition-colors"
                aria-haspopup="true"
                aria-expanded={isProfilePanelOpen}
                aria-label="Abrir painel de perfil"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </button>

              {isProfilePanelOpen && (
                <>
                  <div
                    className="fixed inset-0 bg-black bg-opacity-20 z-40"
                    onClick={() => setIsProfilePanelOpen(false)}
                    aria-hidden="true"
                  />

                  <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="profile-panel">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 id="profile-panel" className="font-semibold text-gray-900">{user?.name}</h3>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                          <p className="text-xs text-orange-600 font-medium">{user?.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair do Sistema</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </header>

      {/* Espaço reservado para header fixo considerando sidebar */}
      <div className="h-[64px] md:ml-64" aria-hidden="true"></div>

      {showLogoutConfirm && (
        <div className="logout-modal-overlay-header fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-orange-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Confirmar Saída</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-orange-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Tem certeza que deseja sair do sistema?
                </h4>
                <p className="text-sm text-gray-600">
                  Você precisará fazer login novamente para acessar o sistema.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    setIsProfilePanelOpen(false);
                  }}
                  disabled={processando}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  disabled={processando}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {processando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saindo...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      Sim, Sair
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
