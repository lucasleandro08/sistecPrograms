import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface StatData {
  title: string;
  value: number;
  color: string;
  loading: boolean;
}

export const DashboardStats = () => {
  const [stats, setStats] = useState<StatData[]>([
    {
      title: 'Chamados Abertos',
      value: 0,
      color: 'text-blue-500',
      loading: true
    },
    {
      title: 'Chamados em Andamento',
      value: 0,
      color: 'text-orange-500',
      loading: true
    },
    {
      title: 'Chamados Resolvidos',
      value: 0,
      color: 'text-green-500',
      loading: true
    },
    {
      title: 'Chamados Rejeitados',
      value: 0,
      color: 'text-red-500',
      loading: true
    }
  ]);
  
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setError('');

      const response = await fetch('http://localhost:3001/api/estatisticas/dashboard-stats', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const statsData = result.data;

        setStats([
          {
            title: 'Chamados Abertos',
            value: statsData.abertos || 0,
            color: 'text-blue-500',
            loading: false
          },
          {
            title: 'Chamados em Andamento',
            value: (statsData.aguardando_resposta || 0) + (statsData.com_analista || 0) + (statsData.triagem_ia || 0),
            color: 'text-orange-500',
            loading: false
          },
          {
            title: 'Chamados Resolvidos',
            value: statsData.resolvidos || 0,
            color: 'text-green-500',
            loading: false
          },
          {
            title: 'Chamados Rejeitados',
            value: statsData.rejeitados || 0,
            color: 'text-red-500',
            loading: false
          }
        ]);

      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao carregar estatísticas');
        setStats(prevStats => 
          prevStats.map(stat => ({ ...stat, loading: false }))
        );
      }

    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      setError('Erro de conexão ao carregar estatísticas');
      setStats(prevStats => 
        prevStats.map(stat => ({ ...stat, loading: false }))
      );
    }
  };

  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1 md:mb-2">
                {stat.loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 md:h-12 w-16 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <p className={`text-2xl md:text-4xl font-bold ${stat.color}`}>
                    {formatValue(stat.value)}
                  </p>
                )}
                
                {stat.loading && (
                  <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                )}
              </div>

              <p className="text-gray-600 text-xs md:text-sm font-medium break-words">
                {stat.title}
              </p>

              {error && !stat.loading && (
                <p className="text-red-500 text-xs mt-1">
                  Erro ao carregar
                </p>
              )}
            </div>

            <div className="flex-shrink-0 ml-3">
              {stat.loading ? (
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              ) : (
                <div className={`w-2 h-8 rounded-full ${stat.color.replace('text-', 'bg-')}`}></div>
              )}
            </div>
          </div>

          {!stat.loading && !error && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full ${stat.color.replace('text-', 'bg-')}`}
                  style={{ 
                    width: `${Math.min((stat.value / Math.max(...stats.map(s => s.value))) * 100, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 md:p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Total Geral</h3>
            <p className="text-gray-600 text-sm">Todos os chamados do sistema</p>
          </div>
          <div className="text-right">
            {stats.some(s => s.loading) ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {formatValue(stats.reduce((sum, stat) => sum + stat.value, 0))}
                </p>
                <p className="text-sm text-gray-500">
                  {stats.some(s => s.value > 0) ? 'Atualizado agora' : 'Nenhum chamado'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
