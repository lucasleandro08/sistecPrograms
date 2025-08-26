import React, { useState } from 'react';
import { User, Settings, LogOut, Shield, X, AlertTriangle } from 'lucide-react';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="bg-orange-600 text-white flex items-center justify-between p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">Confirmar saída</span>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-800 text-lg font-semibold mb-2">
                Tem certeza que deseja sair do sistema?
              </p>
              <p className="text-gray-500 text-sm mb-6">Você precisará fazer login novamente para acessar.</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
