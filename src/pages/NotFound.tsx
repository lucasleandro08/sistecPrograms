/**
 * NotFound.tsx - Página 404 (Não Encontrado)
 * 
 * Exibida quando usuário tenta acessar rota inexistente.
 * Oferece navegação clara de volta ao sistema.
 * 
 * HEURÍSTICAS DE NIELSEN APLICADAS:
 * 
 * #1 - Visibilidade do Status do Sistema:
 *    - Código 404 grande e visível
 *    - Mensagem clara sobre o erro
 *    - Log do erro no console para debug
 * 
 * #2 - Correspondência entre Sistema e Mundo Real:
 *    - Linguagem amigável: "Ops! Página não encontrada"
 *    - Evita jargão técnico
 *    - Mensagem humanizada e acolhedora
 * 
 * #3 - Controle e Liberdade do Usuário:
 *    - Botão primário "Voltar ao Início"
 *    - Botão secundário "Ir para Dashboard"
 *    - Navegação clara e múltiplas opções
 * 
 * #4 - Consistência e Padrões:
 *    - Design system mantido (cores, tipografia)
 *    - Botões seguem padrões do sistema
 *    - Layout consistente com outras páginas de erro
 * 
 * #5 - Prevenção de Erros:
 *    - Página informa erro claramente
 *    - Oferece caminhos corretos
 *    - Previne frustração do usuário
 * 
 * #6 - Reconhecimento ao Invés de Memorização:
 *    - Ícone de busca/erro visual
 *    - Números grandes e fáceis de reconhecer
 *    - Botões descritivos
 * 
 * #7 - Flexibilidade e Eficiência de Uso:
 *    - Múltiplas opções de navegação
 *    - Atalhos visuais (botões destacados)
 *    - Sugestões de rotas comuns
 * 
 * #8 - Design Estético e Minimalista:
 *    - Layout limpo e focado
 *    - Ilustração simples (404 estilizado)
 *    - Sem distrações
 * 
 * #9 - Ajudar Usuários a Reconhecer, Diagnosticar e Recuperar Erros:
 *    - Mensagem clara: "Página não existe"
 *    - Explicação do que aconteceu
 *    - Sugestões de ação para recuperar
 * 
 * #10 - Ajuda e Documentação:
 *    - Texto explicativo sobre o erro
 *    - Links para páginas principais
 *    - Sugestão de contato se problema persistir
 * 
 * RESPONSIVIDADE:
 * - Mobile (<768px): Layout vertical, números menores, p-4
 * - Tablet (768-1024px): Layout otimizado, botões lado a lado
 * - Desktop (>1024px): Layout centralizado, espaçamento amplo
 * 
 * ACESSIBILIDADE:
 * - role="alert" para erro
 * - ARIA labels nos botões
 * - Contraste adequado
 * - Navegação por teclado
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LayoutDashboard, SearchX } from 'lucide-react';

// ============================================================================
// CONSTANTES
// ============================================================================

const UI_TEXT = {
  ERROR_CODE: '404',
  TITLE: 'Ops! Página não encontrada',
  MESSAGE: 'A página que você está procurando não existe ou foi movida.',
  HOME_BUTTON: 'Voltar ao Início',
  DASHBOARD_BUTTON: 'Ir para Dashboard',
  HELP_TEXT: 'Se você acredita que isso é um erro, entre em contato com o suporte.',
  ICON_LABEL: 'Ícone de página não encontrada',
} as const;

// ============================================================================
// SUBCOMPONENTE: ErrorIllustration
// ============================================================================

/**
 * Ilustração visual do erro 404
 * 
 * Features:
 * - Ícone SearchX (busca sem resultados)
 * - Design circular com gradiente
 * - Responsivo: ajusta tamanho por breakpoint
 */
const ErrorIllustration: React.FC = () => (
  <div 
    className="relative mb-6 md:mb-8 animate-fade-in"
    aria-hidden="true"
  >
    {/* Círculo de fundo */}
    <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mx-auto bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center shadow-xl">
      <SearchX 
        className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-red-500" 
        strokeWidth={1.5}
        aria-label={UI_TEXT.ICON_LABEL}
      />
    </div>
  </div>
);

// ============================================================================
// SUBCOMPONENTE: ErrorCode
// ============================================================================

/**
 * Código de erro 404 estilizado
 * 
 * Features:
 * - Números grandes e bold
 * - Gradiente de texto
 * - Animação fade-in-up
 */
const ErrorCode: React.FC = () => (
  <h1 
    className="text-8xl md:text-9xl lg:text-[10rem] font-black mb-4 animate-fade-in-up animation-delay-200"
    style={{
      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}
    aria-label={`Erro ${UI_TEXT.ERROR_CODE}`}
  >
    {UI_TEXT.ERROR_CODE}
  </h1>
);

// ============================================================================
// SUBCOMPONENTE: ErrorMessage
// ============================================================================

/**
 * Mensagem de erro com título e descrição
 * 
 * Features:
 * - Título em destaque
 * - Mensagem explicativa
 * - Animação escalonada
 */
const ErrorMessage: React.FC = () => (
  <div className="mb-8 md:mb-10 animate-fade-in-up">
    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
      {UI_TEXT.TITLE}
    </h2>
    <p className="text-base md:text-lg text-gray-600 max-w-md mx-auto">
      {UI_TEXT.MESSAGE}
    </p>
  </div>
);

// ============================================================================
// SUBCOMPONENTE: NavigationButtons
// ============================================================================

interface NavigationButtonsProps {
  onGoHome: () => void;
  onGoDashboard: () => void;
}

/**
 * Botões de navegação
 * 
 * Features:
 * - Botão primário: Voltar ao Início (Home icon)
 * - Botão secundário: Ir para Dashboard (LayoutDashboard icon)
 * - Responsivo: empilha verticalmente em mobile
 * - Animação fade-in-up com delay
 */
const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onGoHome,
  onGoDashboard,
}) => (
  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in-up">
    {/* Botão: Voltar ao Início */}
    <Button
      onClick={onGoHome}
      size="lg"
      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
      aria-label={UI_TEXT.HOME_BUTTON}
    >
      <Home className="w-5 h-5" />
      {UI_TEXT.HOME_BUTTON}
    </Button>

    {/* Botão: Ir para Dashboard */}
    <Button
      onClick={onGoDashboard}
      size="lg"
      variant="outline"
      className="w-full sm:w-auto border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
      aria-label={UI_TEXT.DASHBOARD_BUTTON}
    >
      <LayoutDashboard className="w-5 h-5" />
      {UI_TEXT.DASHBOARD_BUTTON}
    </Button>
  </div>
);

// ============================================================================
// SUBCOMPONENTE: HelpText
// ============================================================================

/**
 * Texto de ajuda no rodapé
 */
const HelpText: React.FC = () => (
  <p className="text-sm text-gray-500 animate-fade-in">
    {UI_TEXT.HELP_TEXT}
  </p>
);

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * NotFound - Página 404 Personalizada
 * 
 * Funcionalidades:
 * - Log do erro no console (debug)
 * - Navegação para home ou dashboard
 * - Design responsivo e acessível
 * - Feedback visual claro
 * 
 * Layout:
 * - Centralizado vertical e horizontalmente
 * - Background gradient sutil
 * - Animações suaves de entrada
 */
const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Log do erro para debug (Heurística #1)
  useEffect(() => {
    console.error(
      '🔴 404 Error: Usuário tentou acessar rota inexistente:',
      location.pathname
    );
  }, [location.pathname]);

  // Handlers de navegação
  const handleGoHome = () => navigate('/');
  const handleGoDashboard = () => navigate('/dashboard');

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center max-w-2xl">
        {/* Ilustração visual */}
        <ErrorIllustration />

        {/* Código 404 */}
        <ErrorCode />

        {/* Mensagem de erro */}
        <ErrorMessage />

        {/* Botões de navegação */}
        <NavigationButtons
          onGoHome={handleGoHome}
          onGoDashboard={handleGoDashboard}
        />

        {/* Texto de ajuda */}
        <HelpText />
      </div>
    </div>
  );
};

export default NotFound;
