import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface AnalystData {
  name: string;
  value: number;
}

export const AnalystChart = () => {
  const [analystData, setAnalystData] = useState<AnalystData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      fetchAnalystData();
    }
  }, [user]);

  const fetchAnalystData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('http://localhost:3001/api/estatisticas/chamados-analistas', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAnalystData(result.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao carregar dados dos analistas');
      }

    } catch (error) {
      console.error('Erro ao buscar dados dos analistas:', error);
      setError('Erro de conexão ao carregar dados dos analistas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chamados por analistas</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chamados por analistas</h3>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Erro:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Chamados por analistas
        {analystData.length > 0 && (
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({analystData.length} analista{analystData.length !== 1 ? 's' : ''})
          </span>
        )}
      </h3>
      
      {analystData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">📊</p>
            <p>Nenhum dado de analista disponível</p>
            <p className="text-sm">Aguardando resolução de chamados</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analystData} layout="horizontal">
            <XAxis 
              type="number" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Bar 
              dataKey="value" 
              fill="#1E293B" 
              radius={[0, 4, 4, 0]}
              label={{ position: 'right', fontSize: 12, fill: '#6B7280' }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {analystData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total de chamados:</span>
              <span className="font-semibold ml-1">
                {analystData.reduce((sum, analyst) => sum + analyst.value, 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Média por analista:</span>
              <span className="font-semibold ml-1">
                {Math.round(analystData.reduce((sum, analyst) => sum + analyst.value, 0) / analystData.length)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
