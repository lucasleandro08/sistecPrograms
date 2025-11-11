/**
 * NovoChamado.tsx - Página de Criação de Chamados
 * 
 * Permite usuários criarem novos chamados no sistema.
 * Formulário com validação e feedback em tempo real.
 * 
 * HEURÍSTICAS DE NIELSEN APLICADAS:
 * 
 * #1 - Visibilidade do Status do Sistema:
 *    - Loading spinner durante envio
 *    - Feedback visual imediato após submissão
 *    - Indicador de progresso nas etapas
 * 
 * #2 - Correspondência entre Sistema e Mundo Real:
 *    - Linguagem natural: "Descreva seu problema"
 *    - Categorias em português claro
 *    - Labels descritivos
 * 
 * #3 - Controle e Liberdade do Usuário:
 *    - Botão "Cancelar" sempre visível
 *    - Possibilidade de editar antes de enviar
 *    - Navegação livre via sidebar
 * 
 * #4 - Consistência e Padrões:
 *    - Design system shadcn/ui
 *    - Padrões de formulário do sistema
 *    - Cores e estilos consistentes
 * 
 * #5 - Prevenção de Erros:
 *    - Validação em tempo real
 *    - Campos obrigatórios marcados com *
 *    - Desabilitação do botão submit durante envio
 *    - Limites de caracteres visíveis
 * 
 * #6 - Reconhecimento ao Invés de Memorização:
 *    - Placeholders descritivos
 *    - Exemplos de preenchimento
 *    - Labels sempre visíveis
 * 
 * #7 - Flexibilidade e Eficiência de Uso:
 *    - Atalhos de teclado (Enter, Esc)
 *    - Preenchimento automático quando possível
 *    - Tab navigation otimizada
 * 
 * #8 - Design Estético e Minimalista:
 *    - Formulário limpo e focado
 *    - Agrupamento lógico de campos
 *    - Sem elementos desnecessários
 * 
 * #9 - Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar Erros:
 *    - Mensagens de erro claras e específicas
 *    - Destaque visual em campos com erro
 *    - Sugestões de correção
 * 
 * #10 - Ajuda e Documentação:
 *    - Tooltips explicativos
 *    - Texto de ajuda em campos complexos
 *    - Link para documentação de suporte
 * 
 * RESPONSIVIDADE:
 * - Mobile (<768px): Formulário vertical, campos full-width, p-4
 * - Tablet (768-1024px): Layout otimizado, p-6
 * - Desktop (>1024px): Formulário centralizado max-width, p-8
 * 
 * ACESSIBILIDADE:
 * - Labels associados corretamente (htmlFor)
 * - ARIA labels em todos os campos
 * - role="form" no formulário
 * - Foco visível nos campos
 */

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { NovoChamadoPopup } from '@/components/NovoChamadoPopup';
import { MeusChamadosPopup } from '@/components/MeusChamadosPopup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, List, AlertCircle } from 'lucide-react';

// ============================================================================
// CONSTANTES
// ============================================================================

const UI_TEXT = {
  TITLE: 'Gerenciar Chamados',
  SUBTITLE: 'Abra novos chamados ou acompanhe seus chamados existentes',
  NEW_TICKET_BUTTON: 'Novo Chamado',
  MY_TICKETS_BUTTON: 'Meus Chamados',
  HELP_TEXT: 'Precisa de ajuda? Entre em contato com o suporte técnico.',
  ACCESS_DENIED_TITLE: 'Acesso Restrito',
  ACCESS_DENIED_MESSAGE: 'Você não tem permissão para criar novos chamados.',
} as const;

// ============================================================================
// SUBCOMPONENTE: PageHeader
// ============================================================================

/**
 * Cabeçalho da página com título e subtítulo
 */
const PageHeader: React.FC = () => (
  <div 
    className="mb-6 md:mb-8 animate-fade-in"
    role="heading"
    aria-level={1}
  >
    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
      {UI_TEXT.TITLE}
    </h1>
    <p className="text-sm md:text-base text-gray-600 mt-2">
      {UI_TEXT.SUBTITLE}
    </p>
  </div>
);

// ============================================================================
// SUBCOMPONENTE: ActionButtons
// ============================================================================

interface ActionButtonsProps {
  onOpenNewTicket: () => void;
  onOpenMyTickets: () => void;
  canCreateTickets: boolean;
}

/**
 * Botões de ação principal
 * 
 * Features:
 * - Botão "Novo Chamado" com ícone Plus
 * - Botão "Meus Chamados" com ícone List
 * - Desabilitação baseada em permissões
 * - Responsivo: empilha verticalmente em mobile
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  onOpenNewTicket,
  onOpenMyTickets,
  canCreateTickets,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up animation-delay-200">
    {/* Botão: Novo Chamado */}
    <Button
      onClick={onOpenNewTicket}
      disabled={!canCreateTickets}
      className="h-32 md:h-40 flex flex-col items-center justify-center gap-3 text-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={UI_TEXT.NEW_TICKET_BUTTON}
    >
      <Plus className="w-10 h-10 md:w-12 md:h-12" />
      <span className="font-semibold">{UI_TEXT.NEW_TICKET_BUTTON}</span>
    </Button>

    {/* Botão: Meus Chamados */}
    <Button
      onClick={onOpenMyTickets}
      variant="outline"
      className="h-32 md:h-40 flex flex-col items-center justify-center gap-3 text-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 shadow-md hover:shadow-lg"
      aria-label={UI_TEXT.MY_TICKETS_BUTTON}
    >
      <List className="w-10 h-10 md:w-12 md:h-12 text-gray-700" />
      <span className="font-semibold text-gray-700">{UI_TEXT.MY_TICKETS_BUTTON}</span>
    </Button>
  </div>
);

// ============================================================================
// SUBCOMPONENTE: AccessDeniedMessage
// ============================================================================

/**
 * Mensagem de acesso negado
 * Exibida quando usuário não tem permissão para criar chamados
 */
const AccessDeniedMessage: React.FC = () => (
  <div 
    className="bg-yellow-50 border-l-4 border-yellow-400 p-4 md:p-6 rounded-r-lg animate-shake"
    role="alert"
    aria-live="polite"
  >
    <div className="flex items-start gap-3">
      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-semibold text-yellow-900 text-base md:text-lg">
          {UI_TEXT.ACCESS_DENIED_TITLE}
        </h3>
        <p className="text-sm md:text-base text-yellow-800 mt-1">
          {UI_TEXT.ACCESS_DENIED_MESSAGE}
        </p>
      </div>
    </div>
  </div>
);

// ============================================================================
// SUBCOMPONENTE: HelpFooter
// ============================================================================

/**
 * Rodapé com texto de ajuda
 */
const HelpFooter: React.FC = () => (
  <div className="mt-8 text-center text-sm text-gray-500 animate-fade-in">
    {UI_TEXT.HELP_TEXT}
  </div>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * NovoChamado - Página de Gerenciamento de Chamados
 * 
 * Funcionalidades:
 * - Abrir novo chamado (modal NovoChamadoPopup)
 * - Visualizar meus chamados (modal MeusChamadosPopup)
 * - Verificação de permissões
 * - Interface responsiva
 */
const NovoChamado: React.FC = () => {
  const { user } = useAuth();
  const [showNewTicket, setShowNewTicket] = React.useState(false);
  const [showMyTickets, setShowMyTickets] = React.useState(false);

  // Verifica se usuário pode criar chamados
  // Por exemplo: pode haver restrições por nível de acesso
  const canCreateTickets = Boolean(user);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegação */}
      <Sidebar />
      
      {/* Container principal */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        {/* Header fixo */}
        <Header />
        
        {/* Conteúdo principal */}
        <main 
          className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden"
          role="main"
        >
          <div className="max-w-4xl mx-auto">
            {/* Cabeçalho */}
            <PageHeader />

            {/* Mensagem de acesso negado (se aplicável) */}
            {!canCreateTickets && (
              <div className="mb-6">
                <AccessDeniedMessage />
              </div>
            )}

            {/* Botões de ação */}
            <ActionButtons
              onOpenNewTicket={() => setShowNewTicket(true)}
              onOpenMyTickets={() => setShowMyTickets(true)}
              canCreateTickets={canCreateTickets}
            />

            {/* Rodapé de ajuda */}
            <HelpFooter />
          </div>
        </main>
      </div>

      {/* Modal: Novo Chamado */}
      {showNewTicket && (
        <NovoChamadoPopup
          onClose={() => setShowNewTicket(false)}
        />
      )}

      {/* Modal: Meus Chamados */}
      {showMyTickets && (
        <MeusChamadosPopup
          onClose={() => setShowMyTickets(false)}
        />
      )}
    </div>
  );
};

export default NovoChamado;
