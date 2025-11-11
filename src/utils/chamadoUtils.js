/**
 * @fileoverview Utilitários para manipulação de prioridades de chamados
 * 
 * Este módulo contém funções puras para trabalhar com prioridades de chamados.
 * Todas as funções seguem os princípios SOLID e KISS:
 * - Single Responsibility: Cada função tem uma única responsabilidade
 * - Interface Segregation: Funções pequenas e específicas
 * - Dependency Inversion: Sem dependências de infraestrutura
 * - Keep It Simple: Lógica clara e direta
 * 
 * @module utils/chamadoUtils
 */

// ============================================================================
// CONSTANTES - Single Source of Truth (DRY Principle)
// ============================================================================

/**
 * Mapeamento canônico de prioridades
 * Esta é a fonte única de verdade para todas as prioridades do sistema
 * @constant {Object}
 * @private
 */
const PRIORIDADE_MAP = Object.freeze({
  'baixa': 1,
  'media': 2,
  'alta': 3,
  'urgente': 4
});

/**
 * Textos descritivos para cada nível de prioridade
 * @constant {Object}
 * @private
 */
const PRIORIDADE_TEXTOS = Object.freeze({
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
  4: 'Urgente'
});

/**
 * Prioridade padrão quando o valor é inválido ou não especificado
 * Define como 'média' (2) para casos de erro ou valores indefinidos
 * @constant {number}
 * @private
 */
const PRIORIDADE_PADRAO = 2;

/**
 * Texto exibido quando a prioridade não é reconhecida
 * @constant {string}
 * @private
 */
const TEXTO_PRIORIDADE_INDEFINIDA = 'Não definida';

/**
 * Range válido de valores numéricos de prioridade
 * @constant {Object}
 * @private
 */
const PRIORIDADE_RANGE = Object.freeze({
  MIN: 1,
  MAX: 4
});

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO - Interface Segregation Principle
// ============================================================================

/**
 * Valida se o tipo de dado é uma string válida
 * @param {*} valor - Valor a ser validado
 * @returns {boolean} true se for string válida e não vazia
 * @private
 */
const isStringValida = (valor) => {
  return typeof valor === 'string' && valor.length > 0;
};

/**
 * Valida se o tipo de dado é um número válido
 * @param {*} valor - Valor a ser validado
 * @returns {boolean} true se for número válido
 * @private
 */
const isNumeroValido = (valor) => {
  return typeof valor === 'number' && !isNaN(valor);
};

/**
 * Valida se um número está dentro do range válido de prioridades
 * @param {number} numero - Número a ser validado
 * @returns {boolean} true se estiver entre 1 e 4
 * @private
 */
const isNumeroNoRange = (numero) => {
  return numero >= PRIORIDADE_RANGE.MIN && numero <= PRIORIDADE_RANGE.MAX;
};

// ============================================================================
// FUNÇÕES PÚBLICAS - Single Responsibility Principle
// ============================================================================

/**
 * Converte string de prioridade para seu valor numérico correspondente
 * 
 * Esta função é case-insensitive e retorna um valor padrão seguro
 * quando a entrada é inválida, seguindo o princípio Fail-Safe.
 * 
 * Exemplos:
 * - convertPrioridadeToNumber('baixa')   → 1
 * - convertPrioridadeToNumber('MEDIA')   → 2
 * - convertPrioridadeToNumber('alta')    → 3
 * - convertPrioridadeToNumber('urgente') → 4
 * - convertPrioridadeToNumber('xyz')     → 2 (padrão)
 * - convertPrioridadeToNumber(null)      → 2 (padrão)
 * 
 * @param {string} prioridadeString - Prioridade como string
 * @returns {number} Valor numérico da prioridade (1-4), ou 2 se inválido
 * 
 * @public
 * @pure - Função pura sem efeitos colaterais
 */
export const convertPrioridadeToNumber = (prioridadeString) => {
  // Guard Clause: Valida tipo de entrada
  if (!isStringValida(prioridadeString)) {
    return PRIORIDADE_PADRAO;
  }

  // Normaliza a string para lowercase para comparação case-insensitive
  const prioridadeNormalizada = prioridadeString.toLowerCase();
  
  // Busca o valor no mapa, retorna padrão se não encontrado
  return PRIORIDADE_MAP[prioridadeNormalizada] || PRIORIDADE_PADRAO;
};

/**
 * Converte valor numérico de prioridade para texto descritivo legível
 * 
 * Esta função é o inverso de convertPrioridadeToNumber e sempre
 * retorna um valor seguro, nunca lançando exceções.
 * 
 * Exemplos:
 * - getPrioridadeTexto(1)   → 'Baixa'
 * - getPrioridadeTexto(2)   → 'Média'
 * - getPrioridadeTexto(3)   → 'Alta'
 * - getPrioridadeTexto(4)   → 'Urgente'
 * - getPrioridadeTexto(99)  → 'Não definida'
 * - getPrioridadeTexto(null)→ 'Não definida'
 * 
 * @param {number} prioridade - Valor numérico da prioridade (1-4)
 * @returns {string} Texto descritivo da prioridade
 * 
 * @public
 * @pure - Função pura sem efeitos colaterais
 */
export const getPrioridadeTexto = (prioridade) => {
  // Guard Clause: Valida tipo de entrada
  if (!isNumeroValido(prioridade)) {
    return TEXTO_PRIORIDADE_INDEFINIDA;
  }

  // Busca o texto correspondente, retorna 'Não definida' se não encontrado
  return PRIORIDADE_TEXTOS[prioridade] || TEXTO_PRIORIDADE_INDEFINIDA;
};

/**
 * Valida se uma prioridade (string ou número) é válida no sistema
 * 
 * Esta função aceita tanto strings quanto números, validando ambos
 * os formatos de acordo com as regras de negócio.
 * 
 * Exemplos:
 * - isPrioridadeValida('baixa')  → true
 * - isPrioridadeValida('ALTA')   → true
 * - isPrioridadeValida(3)        → true
 * - isPrioridadeValida('xyz')    → false
 * - isPrioridadeValida(99)       → false
 * - isPrioridadeValida(null)     → false
 * 
 * @param {string|number} prioridade - Prioridade a ser validada
 * @returns {boolean} true se a prioridade é válida, false caso contrário
 * 
 * @public
 * @pure - Função pura sem efeitos colaterais
 */
export const isPrioridadeValida = (prioridade) => {
  // Valida string: deve estar no mapa de prioridades
  if (typeof prioridade === 'string') {
    const prioridadeNormalizada = prioridade.toLowerCase();
    return prioridadeNormalizada in PRIORIDADE_MAP;
  }
  
  // Valida número: deve ser válido e estar no range correto
  if (typeof prioridade === 'number') {
    return isNumeroValido(prioridade) && isNumeroNoRange(prioridade);
  }
  
  // Qualquer outro tipo é inválido
  return false;
};

/**
 * Retorna array com todas as prioridades disponíveis no sistema
 * 
 * Útil para popular dropdowns, selects e documentação de API.
 * O array retornado contém objetos com todas as representações
 * de cada prioridade (valor numérico, texto e slug).
 * 
 * Exemplo de retorno:
 * [
 *   { valor: 1, texto: 'Baixa', slug: 'baixa' },
 *   { valor: 2, texto: 'Média', slug: 'media' },
 *   { valor: 3, texto: 'Alta', slug: 'alta' },
 *   { valor: 4, texto: 'Urgente', slug: 'urgente' }
 * ]
 * 
 * @returns {Array<{valor: number, texto: string, slug: string}>} Array de prioridades
 * 
 * @public
 * @pure - Função pura que sempre retorna o mesmo resultado
 */
export const getPrioridadesDisponiveis = () => {
  // Constrói array dinamicamente a partir das constantes
  // Isso garante consistência (Single Source of Truth)
  return Object.entries(PRIORIDADE_MAP).map(([slug, valor]) => ({
    valor,
    texto: PRIORIDADE_TEXTOS[valor],
    slug
  }));
};
