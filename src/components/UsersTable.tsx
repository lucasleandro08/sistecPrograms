/**
 * @fileoverview Tabela de Usuários do Sistema
 * 
 * Componente que exibe lista de usuários cadastrados com informações de matrícula,
 * setor, email, status e nível de acesso. Responsivo com view de cards para mobile
 * e tabela para desktop.
 * 
 * @module components/UsersTable
 * 
 * @example
 * ```tsx
 * <UsersTable />
 * ```
 * 
 * Features:
 * - Pesquisa em tempo real (matrícula, setor, email)
 * - View responsivo (cards mobile / tabela desktop)
 * - Badges coloridos por status e acesso
 * - Paginação básica
 * - Hover states
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Apenas exibição de lista de usuários
 * - Open/Closed: Extensível via props de configuração
 * - Interface Segregation: Interfaces específicas e tipadas
 * 
 * Nielsen Heuristics:
 * - #1: Visibilidade (pesquisa em tempo real)
 * - #4: Consistência (badges padronizados)
 * - #6: Reconhecimento (labels e cores descritivas)
 * - #8: Design minimalista (informações essenciais)
 * - #10: Flexibilidade (responsivo mobile/desktop)
 * 
 * TODO:
 * - Integrar com API real
 * - Implementar paginação funcional
 * - Adicionar ordenação por colunas
 * - Adicionar filtros avançados
 */

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Mapeamento de status para estilos
 * @constant
 */
const STATUS_STYLES: Record<string, string> = Object.freeze({
  Aberto: 'bg-blue-100 text-blue-800',
  Desativado: 'bg-gray-100 text-gray-800',
  Ativo: 'bg-green-100 text-green-800'
});

/**
 * Mapeamento de níveis de acesso para estilos
 * @constant
 */
const ACCESS_LEVEL_STYLES: Record<string, string> = Object.freeze({
  Admin: 'bg-gray-800 text-white',
  Analista: 'bg-orange-200 text-orange-800',
  Usuário: 'bg-gray-200 text-gray-800',
  Gestor: 'bg-purple-200 text-purple-800',
  Gerente: 'bg-blue-200 text-blue-800'
});

/**
 * Textos da interface
 * @constant
 */
const UI_TEXT = Object.freeze({
  SEARCH_PLACEHOLDER: 'Pesquisar por matrícula, setor ou e-mail...',
  FILTER_BUTTON: 'Filtrar',
  TABLE_HEADERS: {
    MATRICULA: 'Matrícula',
    SETOR: 'Setor',
    EMAIL: 'E-mail',
    STATUS: 'Status',
    ACESSO: 'Acesso'
  },
  MOBILE_LABELS: {
    MATRICULA: 'Matrícula:'
  },
  PAGINATION: {
    PREVIOUS: 'Página anterior',
    NEXT: 'Próxima página',
    CURRENT_PAGE: 'Página atual'
  }
});

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Interface de um usuário do sistema
 */
interface User {
  /** Matrícula única do usuário */
  matricula: string;
  /** Setor/departamento */
  setor: string;
  /** Email corporativo */
  email: string;
  /** Status da conta (Aberto, Desativado, Ativo) */
  status: string;
  /** Nível de acesso (Admin, Analista, Usuário, etc) */
  acesso: string;
}

// ==========================================
// DADOS MOCK (TODO: Substituir por API real)
// ==========================================

/**
 * Dados mock de usuários
 * TODO: Integrar com API
 */
const MOCK_USERS: User[] = [
  {
    matricula: '1801902',
    setor: 'Cyber Security',
    email: 'sauro1901@sistec.com.br',
    status: 'Aberto',
    acesso: 'Admin'
  },
  {
    matricula: '1801903',
    setor: 'Suporte de TI',
    email: 'paiva1903@sistec.com.br',
    status: 'Aberto',
    acesso: 'Analista'
  },
  {
    matricula: '1801903',
    setor: 'Marketing',
    email: 'machado1903@sistec.com.br',
    status: 'Aberto',
    acesso: 'Usuário'
  },
  {
    matricula: '1801904',
    setor: 'Design',
    email: 'soares1904@sistec.com.br',
    status: 'Desativado',
    acesso: 'Usuário'
  }
];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * Tabela responsiva de usuários do sistema
 * 
 * @returns {JSX.Element} Tabela de usuários
 * 
 * @description
 * Nielsen Heuristic #1: Visibilidade do status do sistema
 * - Pesquisa em tempo real com feedback imediato
 * - Badges coloridos para status e acesso
 * 
 * Nielsen Heuristic #4: Consistência e padrões
 * - Cores consistentes para cada tipo de badge
 * - Layout padronizado mobile/desktop
 * 
 * Nielsen Heuristic #6: Reconhecimento em vez de memorização
 * - Labels descritivos
 * - Cores intuitivas (admin=preto, usuário=cinza)
 * 
 * Nielsen Heuristic #8: Design estético e minimalista
 * - Apenas informações essenciais na tabela
 * - Espaçamento adequado
 * 
 * Nielsen Heuristic #10: Ajuda e documentação
 * - Placeholder descritivo no campo de pesquisa
 */
export const UsersTable = (): JSX.Element => {
  // ==========================================
  // STATE
  // ==========================================

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage] = useState<number>(1); // TODO: Implementar paginação

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  /**
   * Lista de usuários filtrada pela pesquisa
   * 
   * @description
   * Nielsen Heuristic #1: Visibilidade do status do sistema
   * - Filtragem em tempo real para feedback imediato
   */
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return MOCK_USERS;

    const lowerSearch = searchTerm.toLowerCase();
    return MOCK_USERS.filter(user =>
      user.matricula.includes(searchTerm) ||
      user.setor.toLowerCase().includes(lowerSearch) ||
      user.email.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Retorna classes CSS para badge de status
   * @param {string} status - Status do usuário
   * @returns {string} Classes CSS
   */
  const getStatusBadgeClass = (status: string): string => {
    return STATUS_STYLES[status] || STATUS_STYLES.Aberto;
  };

  /**
   * Retorna classes CSS para badge de acesso
   * @param {string} acesso - Nível de acesso
   * @returns {string} Classes CSS
   */
  const getAccessBadgeClass = (acesso: string): string => {
    return ACCESS_LEVEL_STYLES[acesso] || ACCESS_LEVEL_STYLES.Usuário;
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search and Filter Bar */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm md:text-base transition-shadow"
              aria-label={UI_TEXT.SEARCH_PLACEHOLDER}
            />
          </div>

          {/* Filter Button */}
          <button 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm md:text-base whitespace-nowrap focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            type="button"
            onClick={() => {
              // TODO: Implementar filtros avançados
              console.log('Abrir filtros');
            }}
          >
            {UI_TEXT.FILTER_BUTTON}
          </button>
        </div>

        {/* Results Count */}
        {searchTerm && (
          <p className="mt-3 text-sm text-gray-600">
            {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          filteredUsers.map((user, index) => (
            <div 
              key={`${user.matricula}-${index}`} 
              className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {UI_TEXT.MOBILE_LABELS.MATRICULA} {user.matricula}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{user.setor}</p>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(user.status)}`}>
                      {user.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getAccessBadgeClass(user.acesso)}`}>
                      {user.acesso}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 break-all">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                {UI_TEXT.TABLE_HEADERS.MATRICULA}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                {UI_TEXT.TABLE_HEADERS.SETOR}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                {UI_TEXT.TABLE_HEADERS.EMAIL}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                {UI_TEXT.TABLE_HEADERS.STATUS}
              </th>
              <th scope="col" className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                {UI_TEXT.TABLE_HEADERS.ACESSO}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr 
                  key={`${user.matricula}-${index}`} 
                  className="hover:bg-gray-50 transition-colors"
                >
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
                    <span className={`inline-flex px-4 py-2 rounded-full text-xs font-medium ${getStatusBadgeClass(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`inline-flex px-4 py-2 rounded-full text-xs font-medium ${getAccessBadgeClass(user.acesso)}`}>
                      {user.acesso}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded"
            disabled={currentPage === 1}
            aria-label={UI_TEXT.PAGINATION.PREVIOUS}
            type="button"
            onClick={() => {
              // TODO: Implementar navegação de página
              console.log('Página anterior');
            }}
          >
            ‹
          </button>
          <div 
            className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium"
            aria-label={`${UI_TEXT.PAGINATION.CURRENT_PAGE} ${currentPage}`}
            aria-current="page"
          >
            {currentPage}
          </div>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 rounded"
            disabled={false} // TODO: Verificar se tem próxima página
            aria-label={UI_TEXT.PAGINATION.NEXT}
            type="button"
            onClick={() => {
              // TODO: Implementar navegação de página
              console.log('Próxima página');
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};
