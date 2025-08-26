
import React, { useState } from 'react';

export const UsersTable = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    {
      matricula: '1801902',
      setor: 'Cyber Security',
      email: 'sauro1901@sistec.com.br',
      status: 'Aberto',
      acesso: 'Admin',
      statusColor: 'bg-blue-100 text-blue-800',
      acessoColor: 'bg-gray-800 text-white'
    },
    {
      matricula: '1801903',
      setor: 'Suporte de TI',
      email: 'paiva1903@sistec.com.br',
      status: 'Aberto',
      acesso: 'Analista',
      statusColor: 'bg-blue-100 text-blue-800',
      acessoColor: 'bg-orange-200 text-orange-800'
    },
    {
      matricula: '1801903',
      setor: 'Marketing',
      email: 'machado1903@sistec.com.br',
      status: 'Aberto',
      acesso: 'Usuário',
      statusColor: 'bg-blue-100 text-blue-800',
      acessoColor: 'bg-gray-200 text-gray-800'
    },
    {
      matricula: '1801904',
      setor: 'Design',
      email: 'soares1904@sistec.com.br',
      status: 'Desativado',
      acesso: 'Usuário',
      statusColor: 'bg-gray-100 text-gray-800',
      acessoColor: 'bg-gray-200 text-gray-800'
    }
  ];

  const filteredUsers = users.filter(user =>
    user.matricula.includes(searchTerm) ||
    user.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search and Filter Bar */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Pesquisa rápida"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm md:text-base"
            />
          </div>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base whitespace-nowrap">
            Filtrar
          </button>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredUsers.map((user, index) => (
          <div key={index} className="p-4 border-b border-gray-200 last:border-b-0">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Matrícula: {user.matricula}</p>
                  <p className="text-sm text-gray-600">{user.setor}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.statusColor}`}>
                    {user.status}
                  </span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${user.acessoColor}`}>
                    {user.acesso}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 break-all">{user.email}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Matrícula</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Setor</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">E-mail</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-6 text-sm font-medium text-gray-900">
                  {user.matricula}
                </td>
                <td className="px-6 py-6 text-sm text-gray-900">
                  {user.setor}
                </td>
                <td className="px-6 py-6 text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-6">
                  <span className={`inline-flex px-4 py-2 rounded-full text-xs font-medium ${user.statusColor}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <span className={`inline-flex px-4 py-2 rounded-full text-xs font-medium ${user.acessoColor}`}>
                    {user.acesso}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            ‹
          </button>
          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            ›
          </button>
        </div>
      </div>
    </div>
  );
};
