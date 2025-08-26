import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip, Legend } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlyData {
  month: string;
  value: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface YearlyData {
  month: string;
  abertos: number;
  resolvidos: number;
}

export const DashboardCharts = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  //as cores do grafico de pizza
  const categoryColors = [
    '#8B5CF6', '#F97316', '#6B7280', '#1E293B', 
    '#10B981', '#EF4444', '#3B82F6', '#F59E0B'
  ];

  useEffect(() => {
    if (user?.email) {
      fetchChartData();
    }
  }, [user]);

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      setError('');
      //puxa os dados anuais, mensais e anuais
      const [monthlyRes, categoryRes, yearlyRes] = await Promise.all([
        fetch('http://localhost:3001/api/estatisticas/chamados-mensais', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': user?.email || '',
          },
        }),
        fetch('http://localhost:3001/api/estatisticas/chamados-categoria', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': user?.email || '',
          },
        }),
        fetch('http://localhost:3001/api/estatisticas/chamados-anuais', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': user?.email || '',
          },
        })
      ]);

      if (monthlyRes.ok) {
        const monthlyResult = await monthlyRes.json();
        setMonthlyData(monthlyResult.data || []);
      }

      if (categoryRes.ok) {
        const categoryResult = await categoryRes.json();
        const categoriesWithColors = (categoryResult.data || []).map((item: any, index: number) => ({
          ...item,
          color: categoryColors[index % categoryColors.length]
        }));
        setCategoryData(categoriesWithColors);
        console.log('CategoryData processado:', categoriesWithColors);
      }

      if (yearlyRes.ok) {
        const yearlyResult = await yearlyRes.json();
        setYearlyData(yearlyResult.data || []);
      }

    } catch (error) {
      console.error('Erro ao buscar dados dos gráficos:', error);
      setError('Erro ao carregar dados dos gráficos');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 xl:col-span-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Chamados por mês</h3>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Gráfico por categoria</h3>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 xl:col-span-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Gráfico anual</h3>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="col-span-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-semibold">Erro:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 xl:col-span-2">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Chamados por mês</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Bar 
              dataKey="value" 
              fill="#1E293B" 
              radius={[4, 4, 0, 0]}
              label={{ position: 'top', fontSize: 10, fill: '#6B7280' }}
            />
          </BarChart>
        </ResponsiveContainer>
        {monthlyData.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            Nenhum dado disponível para este período
          </div>
        )}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
          Gráfico por categoria
          {categoryData.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({categoryData.length} categorias)
            </span>
          )}
        </h3>
        
        <div className="text-xs text-gray-400 mb-2">
          Dados carregados: {categoryData.length} items
        </div>

        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">📊</p>
              <p>Nenhuma categoria encontrada</p>
            </div>
          </div>
        ) : (
          <>
            <div 
              style={{ 
                width: '100%', 
                height: '350px',
                position: 'relative',
                backgroundColor: '#fafafa',
                border: '1px solid #e5e5e5'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart width={400} height={350}>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    innerRadius={0}
                    paddingAngle={0}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${value} chamados`, name]}
                    labelStyle={{ color: '#000' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-gray-700 truncate flex-1">
                    {item.name}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 col-span-1 xl:col-span-2">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Tendência anual (Abertos vs Resolvidos)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={yearlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Line 
              type="monotone" 
              dataKey="abertos" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
              name="Abertos"
            />
            <Line 
              type="monotone" 
              dataKey="resolvidos" 
              stroke="#F97316" 
              strokeWidth={2}
              dot={{ fill: '#F97316', strokeWidth: 2, r: 3 }}
              name="Resolvidos"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-4 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs md:text-sm text-gray-600">Abertos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs md:text-sm text-gray-600">Resolvidos</span>
          </div>
        </div>
        
        {yearlyData.length === 0 && (
          <div className="text-center text-gray-500 mt-4">
            Nenhum dado disponível para este ano
          </div>
        )}
      </div>
    </>
  );
};
