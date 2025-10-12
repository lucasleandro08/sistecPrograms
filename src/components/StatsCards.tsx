import React, { useState } from 'react';
import { Plus, User, Check } from 'lucide-react';
import { NovoChamadoPopup } from './NovoChamadoPopup';
import { MeusChamadosPopup } from './MeusChamadosPopup';
import { AprovarChamadosPopup } from './AprovarChamadosPopup';
import { useAuth } from '@/contexts/AuthContext';

export const StatsCards = () => {
  const [showNovoChamadoPopup, setShowNovoChamadoPopup] = useState(false);
  const [showMeusChamadosPopup, setShowMeusChamadosPopup] = useState(false);
  const [showAprovarChamadosPopup, setShowAprovarChamadosPopup] = useState(false);
  const { user } = useAuth();

  const canApproveTickets = user?.perfil?.nivel_acesso >= 4;

  const stats = [
    {
      title: 'Abrir Novo Chamado',
      icon: Plus,
      bgColor: 'bg-orange-100', // fundo laranja claro (mesma cor do ícone original)
      iconColor: 'text-orange-500', // cor do ícone laranja
      iconBg: 'bg-white', // fundo branco para o ícone
      onClick: () => setShowNovoChamadoPopup(true),
      show: true
    },
    {
      title: 'Meus Chamados',
      icon: User,
      bgColor: 'bg-white',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-100',
      onClick: () => setShowMeusChamadosPopup(true),
      show: true
    },
    {
      title: 'Aprovar Chamados',
      icon: Check,
      bgColor: 'bg-white',
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-100',
      onClick: () => setShowAprovarChamadosPopup(true),
      show: canApproveTickets
    }
  ];

  const visibleStats = stats.filter(stat => stat.show);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {visibleStats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:scale-105 hover:border-orange-300 transition-all duration-300 cursor-pointer group`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-lg font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-300 break-words">
                  {stat.title}
                </h3>
              </div>
              <div className={`${stat.iconBg} p-2 md:p-3 rounded-lg group-hover:bg-orange-200 group-hover:scale-110 transition-all duration-300 flex-shrink-0 ml-2`}>
                <stat.icon className={`w-4 h-4 md:w-6 md:h-6 ${stat.iconColor} group-hover:text-orange-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Popups */}
      {showNovoChamadoPopup && (
        <NovoChamadoPopup
          onClose={() => setShowNovoChamadoPopup(false)}
          onSuccess={() => {
            setShowNovoChamadoPopup(false);
          }}
        />
      )}

      {showMeusChamadosPopup && (
        <MeusChamadosPopup onClose={() => setShowMeusChamadosPopup(false)} />
      )}

      {showAprovarChamadosPopup && (
        <AprovarChamadosPopup onClose={() => setShowAprovarChamadosPopup(false)} />
      )}
    </>
  );
};