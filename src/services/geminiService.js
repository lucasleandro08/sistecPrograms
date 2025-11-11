/**
 * @fileoverview Serviço de Integração com Google Gemini AI
 * 
 * Este módulo gerencia todas as interações com a API do Google Gemini
 * para automação inteligente de suporte técnico:
 * - Triagem automática de chamados (classificação e roteamento)
 * - Resolução automática de problemas comuns
 * - Análise de complexidade e impacto
 * - Recomendações de encaminhamento (IA vs Analista)
 * 
 * Funcionalidades principais:
 * - triagemChamado: Analisa e classifica novos chamados
 * - resolverChamado: Gera soluções práticas e objetivas
 * - testarConexaoGemini: Valida conectividade com a API
 * 
 * Princípios aplicados:
 * - Single Responsibility: Cada função tem uma responsabilidade clara
 * - Keep It Simple: Prompts objetivos e respostas estruturadas
 * - Fail-Safe: Fallback para analista humano em caso de erro
 * - Separation of Concerns: Triagem separada de resolução
 * 
 * @module services/geminiService
 * @requires @google/generative-ai
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// CONFIGURAÇÃO DE MODELOS
// ============================================================================

/**
 * Cliente da API Google Generative AI
 * Inicializado com a chave de API do ambiente
 * @constant {GoogleGenerativeAI}
 * @private
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Nome do modelo Gemini utilizado
 * gemini-2.0-flash: Modelo rápido e eficiente para tarefas de classificação
 * @constant {string}
 * @private
 */
const MODEL_NAME = 'gemini-2.0-flash';

/**
 * Instância do modelo para triagem de chamados
 * @constant {Object}
 * @private
 */
const TRIAGEM_MODEL = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Instância do modelo para resolução de chamados
 * @constant {Object}
 * @private
 */
const RESOLUCAO_MODEL = genAI.getGenerativeModel({ model: MODEL_NAME });

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Níveis de complexidade para classificação de chamados
 * @constant {Object}
 * @readonly
 */
const COMPLEXIDADE = Object.freeze({
  BAIXA: 'BAIXA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA'
});

/**
 * Níveis de impacto e alcance do chamado
 * @constant {Object}
 * @readonly
 */
const IMPACTO = Object.freeze({
  BAIXO: 'BAIXO',
  MEDIO: 'MEDIO',
  ALTO: 'ALTO',
  CRITICO: 'CRITICO'
});

/**
 * Tipos de recomendação de encaminhamento
 * @constant {Object}
 * @readonly
 */
const RECOMENDACAO = Object.freeze({
  IA: 'IA',           // Resolução automática pela IA
  ANALISTA: 'ANALISTA' // Encaminhamento para analista humano
});

/**
 * Limite de caracteres para resposta de resolução
 * Garante resposta concisa e objetiva
 * @constant {number}
 * @private
 */
const MAX_SOLUCAO_LENGTH = 1200;

/**
 * Tempo estimado padrão em caso de erro (minutos)
 * @constant {number}
 * @private
 */
const DEFAULT_TEMPO_ESTIMADO = 60;

// ============================================================================
// TEMPLATES DE PROMPTS
// ============================================================================

/**
 * Cria o prompt para triagem de chamados
 * Estrutura consistente para análise e classificação
 * 
 * @param {Object} chamadoData - Dados completos do chamado
 * @returns {string} Prompt formatado para o modelo
 * @private
 */
const createTriagemPrompt = (chamadoData) => {
  return `
Você é um sistema de triagem de chamados de TI. Analise o seguinte chamado e forneça uma classificação:

DADOS DO CHAMADO:
- ID: ${chamadoData.id_chamado}
- Título: ${chamadoData.titulo}
- Categoria: ${chamadoData.categoria}
- Problema: ${chamadoData.problema}
- Descrição: ${chamadoData.descricao}
- Prioridade: ${chamadoData.prioridade}
- Usuário: ${chamadoData.usuario}
- Histórico do usuário: ${chamadoData.historico || 'Primeiro chamado do usuário'}

Por favor, analise e retorne APENAS um JSON válido com a seguinte estrutura:
{
  "complexidade": "BAIXA|MEDIA|ALTA",
  "indice_impacto_alcance": "BAIXO|MEDIO|ALTO|CRITICO",
  "recomendacao": "IA|ANALISTA",
  "justificativa": "Explicação detalhada da decisão",
  "solucao_conhecida": true/false,
  "tempo_estimado_minutos": 30,
  "tags": ["tag1", "tag2", "tag3"]
}

Critérios para recomendação:
- IA: Para problemas comuns, bem documentados, com soluções padronizadas
- ANALISTA: Para problemas complexos, específicos, ou que requerem diagnóstico manual
  `.trim();
};

/**
 * Cria o prompt para resolução automática de chamados
 * Enfoque em soluções práticas e objetivas
 * 
 * @param {Object} chamadoData - Dados do chamado
 * @param {Object} analiseTriagem - Análise prévia da triagem
 * @returns {string} Prompt formatado para o modelo
 * @private
 */
const createResolucaoPrompt = (chamadoData, analiseTriagem) => {
  return `
Você é um especialista em suporte técnico de TI. Forneça uma solução PRÁTICA e DIRETA:

DADOS DO CHAMADO:
- Título: ${chamadoData.titulo}
- Categoria: ${chamadoData.categoria}
- Problema: ${chamadoData.problema}
- Descrição: ${chamadoData.descricao}
- Prioridade: ${chamadoData.prioridade}
- Análise de Triagem: ${JSON.stringify(analiseTriagem)}

INSTRUÇÕES IMPORTANTES:
- Responda em português brasileiro
- Use linguagem simples e clara
- MÁXIMO 800 CARACTERES
- Seja direto e objetivo
- Forneça apenas os passos essenciais
- Use formatação clara com numeração

ESTRUTURA OBRIGATÓRIA:
**Solução:**
1. [Primeiro passo específico]
2. [Segundo passo específico]
3. [Terceiro passo se necessário]

**Como testar:** [Uma frase sobre como confirmar se funcionou]

**Se não funcionar:** Entre em contato com o suporte para assistência especializada.

IMPORTANTE: Seja conciso e prático. Não inclua explicações técnicas desnecessárias.
  `.trim();
};

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Extrai JSON de uma resposta de texto
 * Remove markdown, espaços e outros caracteres não-JSON
 * 
 * @param {string} text - Texto bruto da resposta
 * @returns {Object} Objeto JSON parseado
 * @throws {Error} Se não encontrar JSON válido
 * @private
 */
const extractJSONFromResponse = (text) => {
  // Remove blocos de código markdown se existirem
  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Procura por padrão de objeto JSON
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém JSON válido');
  }
  
  return JSON.parse(jsonMatch[0]);
};

/**
 * Cria análise de fallback para quando a IA falha
 * Garante que o sistema continue funcionando encaminhando para analista
 * 
 * @param {string} errorMessage - Mensagem de erro original
 * @returns {Object} Análise padrão de fallback
 * @private
 */
const createFallbackAnalise = (errorMessage) => {
  return {
    complexidade: COMPLEXIDADE.MEDIA,
    indice_impacto_alcance: IMPACTO.MEDIO,
    recomendacao: RECOMENDACAO.ANALISTA,
    justificativa: `Erro na análise automática: ${errorMessage}. Encaminhando para analista humano.`,
    solucao_conhecida: false,
    tempo_estimado_minutos: DEFAULT_TEMPO_ESTIMADO,
    tags: ['erro_ia', 'requer_analise_manual']
  };
};

/**
 * Trunca solução se exceder o limite de caracteres
 * Mantém a resposta dentro dos limites definidos
 * 
 * @param {string} solucao - Solução gerada pela IA
 * @returns {string} Solução truncada se necessário
 * @private
 */
const truncateSolution = (solucao) => {
  if (solucao.length <= MAX_SOLUCAO_LENGTH) {
    return solucao;
  }
  
  console.log(`⚠️ Resposta muito longa (${solucao.length} caracteres), truncando para ${MAX_SOLUCAO_LENGTH}...`);
  return solucao.substring(0, MAX_SOLUCAO_LENGTH - 3) + '...';
};

/**
 * Cria solução de fallback para quando a IA falha
 * Garante resposta mesmo em caso de erro
 * 
 * @returns {string} Mensagem padrão de encaminhamento
 * @private
 */
const createFallbackSolution = () => {
  return 'Não foi possível gerar uma solução automática. Este chamado será encaminhado para um analista humano que fornecerá assistência personalizada.';
};

// ============================================================================
// FUNÇÕES PÚBLICAS - API DO SERVIÇO
// ============================================================================

/**
 * Realiza triagem inteligente de um chamado
 * 
 * Analisa o chamado e fornece:
 * - Classificação de complexidade (BAIXA/MEDIA/ALTA)
 * - Índice de impacto e alcance (BAIXO/MEDIO/ALTO/CRITICO)
 * - Recomendação de encaminhamento (IA ou ANALISTA)
 * - Justificativa da decisão
 * - Estimativa de tempo
 * - Tags para categorização
 * 
 * Em caso de erro, retorna análise de fallback recomendando analista humano
 * 
 * @param {Object} chamadoData - Dados completos do chamado
 * @param {string} chamadoData.id_chamado - ID único do chamado
 * @param {string} chamadoData.titulo - Título resumido
 * @param {string} chamadoData.categoria - Categoria do problema
 * @param {string} chamadoData.problema - Tipo específico de problema
 * @param {string} chamadoData.descricao - Descrição detalhada
 * @param {string} chamadoData.prioridade - Nível de prioridade
 * @param {string} chamadoData.usuario - Nome/ID do usuário
 * @param {string} [chamadoData.historico] - Histórico de chamados do usuário
 * 
 * @returns {Promise<Object>} Resultado da triagem
 * @returns {boolean} .success - Se a triagem foi bem-sucedida
 * @returns {Object} .analise - Análise estruturada do chamado
 * @returns {string} [.raw_response] - Resposta bruta da IA (apenas sucesso)
 * @returns {string} [.error] - Mensagem de erro (apenas falha)
 * 
 * @public
 * @async
 * 
 * @example
 * const resultado = await triagemChamado({
 *   id_chamado: 123,
 *   titulo: 'Erro no login',
 *   categoria: 'Acesso',
 *   problema: 'Senha incorreta',
 *   descricao: 'Não consigo entrar no sistema',
 *   prioridade: 'MEDIA',
 *   usuario: 'João Silva'
 * });
 * 
 * if (resultado.success) {
 *   if (resultado.analise.recomendacao === 'IA') {
 *     // Tentar resolução automática
 *   } else {
 *     // Encaminhar para analista
 *   }
 * }
 */
export const triagemChamado = async (chamadoData) => {
  try {
    console.log('🤖 Iniciando triagem IA para chamado:', chamadoData.id_chamado);
    
    // Criar prompt estruturado
    const prompt = createTriagemPrompt(chamadoData);
    
    // Enviar para o modelo
    const result = await TRIAGEM_MODEL.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Resposta bruta da triagem IA recebida');
    
    // Extrair e parsear JSON da resposta
    const analise = extractJSONFromResponse(text);
    
    console.log('✅ Triagem IA concluída com sucesso');
    
    return {
      success: true,
      analise,
      raw_response: text
    };
    
  } catch (error) {
    console.error('❌ Erro na triagem IA:', error.message);
    
    return {
      success: false,
      error: error.message,
      // Fallback: encaminhar para analista humano
      analise: createFallbackAnalise(error.message)
    };
  }
};

/**
 * Gera solução automática para um chamado
 * 
 * Cria uma resposta prática e objetiva com:
 * - Passos numerados para resolução
 * - Instruções claras em português
 * - Como testar se funcionou
 * - Orientação em caso de falha
 * 
 * Respostas são limitadas a 1200 caracteres para garantir concisão
 * Em caso de erro, retorna mensagem de encaminhamento para analista
 * 
 * @param {Object} chamadoData - Dados do chamado
 * @param {string} chamadoData.titulo - Título do chamado
 * @param {string} chamadoData.categoria - Categoria
 * @param {string} chamadoData.problema - Tipo de problema
 * @param {string} chamadoData.descricao - Descrição completa
 * @param {string} chamadoData.prioridade - Prioridade
 * @param {Object} analiseTriagem - Resultado da triagem prévia
 * 
 * @returns {Promise<Object>} Resultado da resolução
 * @returns {boolean} .success - Se gerou solução com sucesso
 * @returns {string} .solucao - Solução gerada (texto formatado)
 * @returns {string} [.data_resposta] - Timestamp da resposta (ISO)
 * @returns {string} [.tipo_resposta] - Tipo: 'IA_RESOLUCAO'
 * @returns {string} [.error] - Mensagem de erro (apenas falha)
 * 
 * @public
 * @async
 * 
 * @example
 * const solucao = await resolverChamado(chamadoData, analiseTriagem);
 * 
 * if (solucao.success) {
 *   console.log('Solução gerada:', solucao.solucao);
 *   // Enviar para o usuário
 * } else {
 *   // Encaminhar para analista
 * }
 */
export const resolverChamado = async (chamadoData, analiseTriagem) => {
  try {
    console.log('🤖 Gerando solução IA para chamado:', chamadoData.id_chamado || 'N/A');
    
    // Criar prompt estruturado
    const prompt = createResolucaoPrompt(chamadoData, analiseTriagem);
    
    // Enviar para o modelo
    const result = await RESOLUCAO_MODEL.generateContent(prompt);
    const response = await result.response;
    const solucaoRaw = response.text();
    
    // Garantir que não exceda o limite
    const solucao = truncateSolution(solucaoRaw);
    
    console.log(`✅ Solução gerada com sucesso (${solucao.length} caracteres)`);
    
    return {
      success: true,
      solucao,
      data_resposta: new Date().toISOString(),
      tipo_resposta: 'IA_RESOLUCAO'
    };
    
  } catch (error) {
    console.error('❌ Erro na resolução IA:', error.message);
    
    return {
      success: false,
      error: error.message,
      solucao: createFallbackSolution()
    };
  }
};

/**
 * Testa a conectividade com a API do Google Gemini
 * 
 * Envia um prompt simples para verificar se:
 * - A chave de API é válida
 * - O modelo está acessível
 * - A rede permite conexão
 * 
 * Útil para health checks e diagnóstico de problemas
 * 
 * @returns {Promise<Object>} Resultado do teste
 * @returns {boolean} .success - Se a conexão está funcional
 * @returns {string} .response - Resposta do modelo
 * @returns {string} [.error] - Mensagem de erro se falhou
 * 
 * @public
 * @async
 * 
 * @example
 * const status = await testarConexaoGemini();
 * if (status.success) {
 *   console.log('✅ Gemini AI operacional');
 * } else {
 *   console.error('❌ Erro:', status.error);
 * }
 */
export const testarConexaoGemini = async () => {
  try {
    const prompt = "Responda apenas 'OK' se você está funcionando corretamente.";
    
    const result = await TRIAGEM_MODEL.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    const isWorking = text.toUpperCase().includes('OK');
    
    return {
      success: isWorking,
      response: text
    };
    
  } catch (error) {
    console.error('❌ Erro ao testar conexão Gemini:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
};
