
import React, { useState } from 'react';
import { Bell, Menu, User, LogOut } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { ProfilePanel } from './ProfilePanel';
import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsProfilePanelOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 relative">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Mobile menu button and title */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-orange-500 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <img 
            src="/lovable-uploads/d3655855-204d-4a0f-a98d-2d80537273b9.png" 
            alt="Sistec"
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Desktop - empty space on left */}
        <div className="hidden md:block"></div>

        {/* Right side content - positioned to the right */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Notification */}
          <div className="relative">
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600 hover:text-orange-500 cursor-pointer transition-colors" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">3</span>
            </div>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfilePanelOpen(!isProfilePanelOpen)}
              className="flex items-center gap-2 md:gap-3 hover:bg-gray-100 p-1 md:p-2 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </button>

            {/* Profile Panel */}
            {isProfilePanelOpen && (
              <>
                <div 
                  className="fixed inset-0 bg-black bg-opacity-20 z-40"
                  onClick={() => setIsProfilePanelOpen(false)}
                />
                
                <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <p className="text-xs text-orange-600 font-medium">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={handleLogout}
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

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  );
};
