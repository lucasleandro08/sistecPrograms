import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Shield, X, AlertTriangle } from 'lucide-react';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [processando, setProcessando] = useState(false);

  // MutationObserver para forçar z-index do modal de confirmação
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'logout-modal-force-zindex';
    style.innerHTML = `
      .logout-modal-overlay {
        z-index: 9999 !important;
      }
    `;
    
    const oldStyle = document.getElementById('logout-modal-force-zindex');
    if (!oldStyle) {
      document.head.appendChild(style);
    }

    return () => {
      const styleElement = document.getElementById('logout-modal-force-zindex');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const handleLogout = () => {
    setProcessando(true);
    
    // Simula processamento antes de redirecionar
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay do Panel */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute top-16 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sebastião Sauro</h3>
              <p className="text-sm text-gray-500">sebastiao.sauro@sistec.com</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600 font-medium">Administrador</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 group">
              <User className="w-4 h-4 group-hover:text-orange-500 transition-colors" />
              <span className="group-hover:text-gray-900">Meu Perfil</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 group">
              <Settings className="w-4 h-4 group-hover:text-orange-500 transition-colors" />
              <span className="group-hover:text-gray-900">Configurações</span>
            </button>
          </div>

          <div className="border-t border-gray-200 mt-2 pt-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 group"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de saída */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Header do Modal */}
            <div className="bg-orange-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Confirmar Saída</h3>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6">
              <div className="text-center mb-6">
                {/* Ícone Central */}
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-orange-600" />
                </div>

                {/* Mensagem */}
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Tem certeza que deseja sair do sistema?
                </h4>
                <p className="text-sm text-gray-600">
                  Você precisará fazer login novamente para acessar o sistema.
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={processando}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
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
