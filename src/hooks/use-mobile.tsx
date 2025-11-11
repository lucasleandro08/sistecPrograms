/**
 * @fileoverview Hook para detectar dispositivos móveis
 * 
 * Hook customizado que detecta se o dispositivo atual é mobile baseado
 * na largura da tela usando Media Queries.
 * 
 * Features:
 * - Detecção responsiva em tempo real
 * - SSR-safe (retorna undefined no servidor)
 * - Performance otimizada com cleanup de listeners
 * - Breakpoint configurável
 * 
 * @module hooks/use-mobile
 */

import * as React from "react"

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Breakpoint que define quando um dispositivo é considerado mobile
 * Dispositivos com largura < 768px são considerados mobile
 * @constant {number}
 */
const MOBILE_BREAKPOINT = 768 as const;

// ==========================================
// TIPOS
// ==========================================

/**
 * Retorno do hook useIsMobile
 * - undefined: Estado inicial (SSR ou primeiro render)
 * - boolean: true se mobile, false se desktop
 */
type IsMobileState = boolean | undefined;

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Verifica se a largura atual da janela é considerada mobile
 * @private
 * @returns {boolean} True se largura < MOBILE_BREAKPOINT
 */
const checkIsMobile = (): boolean => {
  return window.innerWidth < MOBILE_BREAKPOINT;
};

/**
 * Cria Media Query para o breakpoint mobile
 * @private
 * @returns {MediaQueryList} Media query list
 */
const createMobileMediaQuery = (): MediaQueryList => {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
};

// ==========================================
// HOOK
// ==========================================

/**
 * Hook que detecta se o dispositivo é mobile baseado na largura da tela
 * 
 * Usa Media Queries para detectar mudanças na largura da tela em tempo real.
 * É SSR-safe, retornando undefined no primeiro render do servidor.
 * 
 * @returns {boolean} True se o dispositivo é mobile (largura < 768px)
 * 
 * @example
 * // Uso básico
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <MobileView />
 *       ) : (
 *         <DesktopView />
 *       )}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Com renderização condicional de sidebar
 * function Layout() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <>
 *       {!isMobile && <Sidebar />}
 *       <MobileMenu show={isMobile} />
 *       <MainContent />
 *     </>
 *   );
 * }
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<IsMobileState>(undefined);

  React.useEffect(() => {
    // Cria media query para monitorar mudanças
    const mediaQuery = createMobileMediaQuery();
    
    /**
     * Handler executado quando a media query muda
     */
    const handleMediaQueryChange = (): void => {
      setIsMobile(checkIsMobile());
    };

    // Adiciona listener para mudanças
    mediaQuery.addEventListener("change", handleMediaQueryChange);
    
    // Define valor inicial
    setIsMobile(checkIsMobile());

    // Cleanup: remove listener ao desmontar
    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []); // Array vazio: executa apenas no mount/unmount

  // Converte undefined para false para garantir boolean
  return !!isMobile;
}
