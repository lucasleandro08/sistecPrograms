/**
 * @fileoverview Model de Chamados - Camada de Dados e Lógica de Negócio
 * 
 * Este módulo gerencia o ciclo de vida completo dos chamados de TI:
 * - Criação e categorização
 * - Fluxo de aprovação/rejeição
 * - Triagem automática (IA)
 * - Resolução (manual ou IA)
 * - Escalação para gestores
 * 
 * Implementa princípios SOLID:
 * - Single Responsibility: Funções focadas em uma operação específica
 * - Open/Closed: Extensível via injeção de dependências (serviços)
 * - Interface Segregation: Funções públicas pequenas e específicas
 * - Dependency Inversion: Depende de abstrações (pool, services)
 * 
 * @module models/chamado
 * @requires ../config/db
 * @requires ../services/geminiService
 * @requires ../utils/chamadoUtils
 */

import pool from '../config/db.js';
import { triagemChamado, resolverChamado } from '../services/geminiService.js';
import { convertPrioridadeToNumber, getPrioridadeTexto } from '../utils/chamadoUtils.js';

// ============================================================================
// CONSTANTES DE CONFIGURAÇÃO
// ============================================================================

/**
 * Status padrão de um chamado recém-criado
 * @constant {string}
 * @private
 */
const STATUS_INICIAL = 'Aberto';

/**
 * Título padrão quando não é possível extrair um título da descrição
 * @constant {string}
 * @private
 */
const TITULO_PADRAO = 'Sem título';

/**
 * Limite de caracteres para o título do chamado
 * @constant {number}
 * @private
 */
const TITULO_MAX_LENGTH = 100;

/**
 * Marcadores de título em formato Markdown
 * @constant {Array<string>}
 * @private
 */
const TITULO_MARKERS = ['**Título:**', 'Título:'];

/**
 * Status válidos de chamados (deve corresponder aos valores em status_chamado)
 * @constant {Object}
 * @readonly
 */
const STATUS = Object.freeze({
  ABERTO: 'Aberto',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  TRIAGEM_IA: 'Triagem IA',
  AGUARDANDO_RESPOSTA: 'Aguardando Resposta',
  COM_ANALISTA: 'Com Analista',
  ESCALADO: 'Escalado',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado'
});

// ============================================================================
// QUERY SQL - Single Source of Truth
// ============================================================================

/**
 * Query base para buscar chamados com todos os detalhes relacionados
 * Centraliza a lógica de JOIN para evitar duplicação
 * @constant {string}
 * @private
 */
const SELECT_CHAMADO_COMPLETO_SQL = `
  SELECT 
    c.*,
    cat.descricao_categoria_chamado,
    prob.descricao_problema_chamado,
    s_status.descricao_status_chamado,
    u.nome_usuario as usuario_abertura,
    u.email as email_usuario,
    ur.nome_usuario as usuario_resolucao,
    det.titulo_chamado,
    det.descricao_detalhada,
    c.motivo_recusa as motivo_reprovacao
  FROM chamados c
  LEFT JOIN categoria_chamado cat ON c.id_chamado = cat.fk_chamados_id_chamado
  LEFT JOIN problema_chamado prob ON c.id_chamado = prob.fk_chamados_id_chamado
  LEFT JOIN LATERAL (
    SELECT descricao_status_chamado
    FROM status_chamado
    WHERE fk_chamados_id_chamado = c.id_chamado
    ORDER BY id_status_chamado DESC
    LIMIT 1
  ) s_status ON true
  LEFT JOIN usuarios u ON c.id_usuario_abertura = u.id_usuario
  LEFT JOIN usuarios ur ON c.id_usuario_resolucao = ur.id_usuario
  LEFT JOIN detalhes_chamado det ON det.fk_chamados_id_chamado = c.id_chamado
`;

// ============================================================================
// FUNÇÕES AUXILIARES PRIVADAS - Helper Functions
// ============================================================================

/**
 * Extrai título de forma inteligente da descrição detalhada
 * 
 * Tenta extrair o título em 3 passos (fallback chain):
 * 1. Procura por marcadores Markdown ("**Título:**" ou "Título:")
 * 2. Usa a primeira linha não vazia
 * 3. Gera título formatado a partir da descrição do problema
 * 
 * @param {string} descricao_detalhada - Descrição completa do chamado
 * @param {string} descricao_problema - Descrição curta do problema
 * @returns {string} Título extraído ou gerado
 * @private
 */
const extrairTitulo = (descricao_detalhada, descricao_problema) => {
  // Guard Clause: se não há descrição, retorna padrão
  if (!descricao_detalhada) {
    return TITULO_PADRAO;
  }

  // Divide em linhas e remove vazias
  const linhas = descricao_detalhada
    .split('\n')
    .filter(linha => linha.trim().length > 0);
  
  // Estratégia 1: Procurar por marcador Markdown
  const tituloMarkdown = linhas.find(linha =>
    TITULO_MARKERS.some(marker => linha.includes(marker))
  );
  
  if (tituloMarkdown) {
    // Remove os marcadores de forma segura sem regex complexa
    let titulo = tituloMarkdown.trim();
    
    // Remove marcadores na ordem (do mais específico ao mais genérico)
    for (const marker of TITULO_MARKERS) {
      if (titulo.includes(marker)) {
        // Remove o marcador e qualquer espaço após ele
        titulo = titulo.split(marker)[1]?.trim() || titulo;
        break;
      }
    }
    
    console.log('[Chamado] ✅ Título encontrado (Markdown):', titulo);
    return limitarTamanhoTitulo(titulo);
  }
  
  // Estratégia 2: Usar primeira linha não vazia
  if (linhas.length > 0 && linhas[0].trim().length > 0) {
    const titulo = linhas[0].trim();
    console.log('[Chamado] ✅ Título extraído (primeira linha):', titulo);
    return limitarTamanhoTitulo(titulo);
  }
  
  // Estratégia 3: Gerar título a partir da descrição do problema
  if (descricao_problema) {
    const titulo = formatarDescricaoParaTitulo(descricao_problema);
    console.log('[Chamado] ✅ Título gerado do problema:', titulo);
    return titulo;
  }
  
  return TITULO_PADRAO;
};

/**
 * Limita o tamanho do título ao máximo permitido
 * @param {string} titulo - Título original
 * @returns {string} Título truncado com reticências se necessário
 * @private
 */
const limitarTamanhoTitulo = (titulo) => {
  if (titulo.length <= TITULO_MAX_LENGTH) {
    return titulo;
  }
  return titulo.substring(0, TITULO_MAX_LENGTH - 3) + '...';
};

/**
 * Formata descrição do problema em título legível
 * Exemplo: "problema-de-rede" → "Problema De Rede"
 * @param {string} descricao - Descrição com hífens
 * @returns {string} Título formatado com capitalize
 * @private
 */
const formatarDescricaoParaTitulo = (descricao) => {
  return descricao
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Loga informações de debug de forma consistente
 * @param {string} message - Mensagem a ser logada
 * @param {*} data - Dados adicionais (opcional)
 * @private
 */
const logDebug = (message, data = null) => {
  if (data !== null) {
    console.log(`[ChamadoModel] ${message}:`, data);
  } else {
    console.log(`[ChamadoModel] ${message}`);
  }
};

// ============================================================================
// FUNÇÕES PÚBLICAS DE CRIAÇÃO - Create Operations
// ============================================================================

/**
 * Cria um novo chamado no sistema com todas as informações relacionadas
 * 
 * Esta função implementa uma transação atômica que:
 * 1. Insere o registro principal do chamado
 * 2. Insere categoria, problema, detalhes e status iniciais
 * 3. Extrai/gera título inteligente da descrição
 * 4. Commit ou rollback em caso de erro
 * 
 * Princípios aplicados:
 * - Atomicidade: Tudo ou nada (transação)
 * - Consistency: Garante integridade referencial
 * - Single Responsibility: Cada INSERT é claro e focado
 * 
 * @param {Object} dadosChamado - Dados do chamado
 * @param {number} dadosChamado.id_usuario_abertura - ID do usuário que abriu
 * @param {string|number} dadosChamado.prioridade_chamado - Prioridade (string ou número)
 * @param {string} dadosChamado.descricao_categoria - Categoria do problema
 * @param {string} dadosChamado.descricao_problema - Problema resumido
 * @param {string} dadosChamado.descricao_detalhada - Descrição completa (opcional)
 * 
 * @returns {Promise<Object>} Dados do chamado criado incluindo ID
 * 
 * @public
 * @async
 * @throws {Error} Se ocorrer erro na transação
 * 
 * @example
 * const chamado = await createChamadoService({
 *   id_usuario_abertura: 123,
 *   prioridade_chamado: 'alta',
 *   descricao_categoria: 'Rede',
 *   descricao_problema: 'Internet lenta',
 *   descricao_detalhada: '**Título:** Problema de Conexão\n\nDetalhes...'
 * });
 */
export const createChamadoService = async (dadosChamado) => {
  const client = await pool.connect();
  
  try {
    // Inicia transação para garantir atomicidade
    await client.query('BEGIN');

    // Destructuring dos dados de entrada
    const {
      id_usuario_abertura,
      prioridade_chamado,
      descricao_categoria,
      descricao_problema,
      descricao_detalhada,
    } = dadosChamado;

    // Normaliza prioridade para número (aceita string ou número)
    const prioridadeNumerica =
      typeof prioridade_chamado === 'string'
        ? convertPrioridadeToNumber(prioridade_chamado)
        : prioridade_chamado;

    // 1. Insere registro principal do chamado
    const chamadoResult = await client.query(
      `INSERT INTO chamados (
        id_usuario_abertura, 
        prioridade_chamado, 
        data_abertura
      ) VALUES ($1, $2, NOW())
      RETURNING *`,
      [id_usuario_abertura, prioridadeNumerica]
    );
    
    const idChamado = chamadoResult.rows[0].id_chamado;
    logDebug('Chamado criado com ID', idChamado);

    // 2. Insere categoria do chamado
    await client.query(
      `INSERT INTO categoria_chamado (
        descricao_categoria_chamado, 
        fk_chamados_id_chamado
      ) VALUES ($1, $2)`,
      [descricao_categoria, idChamado]
    );

    // 3. Insere problema do chamado
    await client.query(
      `INSERT INTO problema_chamado (
        descricao_problema_chamado, 
        fk_chamados_id_chamado
      ) VALUES ($1, $2)`,
      [descricao_problema, idChamado]
    );

    // 4. Insere detalhes com título extraído/gerado (se fornecido)
    if (descricao_detalhada) {
      const titulo = extrairTitulo(descricao_detalhada, descricao_problema);
      logDebug('Salvando título final', titulo);
      
      await client.query(
        `INSERT INTO detalhes_chamado (
          fk_chamados_id_chamado, 
          titulo_chamado, 
          descricao_detalhada
        ) VALUES ($1, $2, $3)`,
        [idChamado, titulo, descricao_detalhada]
      );
    }

    // 5. Insere status inicial
    await client.query(
      `INSERT INTO status_chamado (
        descricao_status_chamado, 
        fk_chamados_id_chamado
      ) VALUES ($1, $2)`,
      [STATUS_INICIAL, idChamado]
    );

    // Commit da transação
    await client.query('COMMIT');

    return {
      id_chamado: idChamado,
      ...dadosChamado,
      prioridade_numerica: prioridadeNumerica,
    };
    
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    logDebug('Erro ao criar chamado', error.message);
    throw error;
  } finally {
    // Sempre libera a conexão
    client.release();
  }
};

// ============================================================================
// FUNÇÕES PÚBLICAS DE CONSULTA - Read Operations
// ============================================================================

/**
 * Busca chamados com filtros opcionais
 * 
 * Permite filtrar por usuário e/ou status.
 * Retorna dados completos com JOINs de todas as tabelas relacionadas.
 * 
 * @param {Object} filtros - Filtros opcionais
 * @param {number} filtros.id_usuario - Filtrar por ID do usuário
 * @param {string} filtros.status - Filtrar por status ('Aberto', 'Em andamento', etc)
 * 
 * @returns {Promise<Array<Object>>} Array de chamados
 * 
 * @public
 * @async
 * 
 * @example
 * // Todos os chamados
 * const todos = await getChamadosComDetalhesService();
 * 
 * // Chamados de um usuário
 * const meus = await getChamadosComDetalhesService({ id_usuario: 123 });
 * 
 * // Chamados abertos
 * const abertos = await getChamadosComDetalhesService({ status: 'Aberto' });
 */
export const getChamadosComDetalhesService = async (filtros = {}) => {
  // Monta cláusula WHERE dinamicamente baseada nos filtros
  let whereClause = 'WHERE 1=1'; // Trick para simplificar concatenação de ANDs
  const params = [];
  let paramCount = 0;

  // Filtro por usuário (se fornecido)
  if (filtros.id_usuario) {
    paramCount++;
    whereClause += ` AND c.id_usuario_abertura = $${paramCount}`;
    params.push(filtros.id_usuario);
  }

  // Filtro por status (se fornecido)
  if (filtros.status) {
    paramCount++;
    whereClause += ` AND s_status.descricao_status_chamado = $${paramCount}`;
    params.push(filtros.status);
  }

  // Monta query completa com filtros dinâmicos
  const query = `
    ${SELECT_CHAMADO_COMPLETO_SQL}
    ${whereClause}
    ORDER BY c.data_abertura DESC
  `;
  
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Busca um chamado específico por ID com todos os detalhes
 * 
 * @param {number} idChamado - ID do chamado
 * @returns {Promise<Object|undefined>} Dados completos do chamado ou undefined
 * 
 * @public
 * @async
 * 
 * @example
 * const chamado = await getChamadoByIdService(123);
 * if (chamado) {
 *   console.log(chamado.titulo_chamado);
 * }
 */
export const getChamadoByIdService = async (idChamado) => {
  const query = `
    SELECT 
      c.*,
      cat.descricao_categoria_chamado,
      prob.descricao_problema_chamado,
      s.descricao_status_chamado,
      u.nome_usuario as usuario_abertura,
      u.email as email_usuario,
      ur.nome_usuario as usuario_resolucao,
      det.titulo_chamado,
      det.descricao_detalhada,
      c.motivo_recusa as motivo_reprovacao
    FROM chamados c
    LEFT JOIN categoria_chamado cat ON c.id_chamado = cat.fk_chamados_id_chamado
    LEFT JOIN problema_chamado prob ON c.id_chamado = prob.fk_chamados_id_chamado
    LEFT JOIN status_chamado s ON c.id_chamado = s.fk_chamados_id_chamado
    LEFT JOIN usuarios u ON c.id_usuario_abertura = u.id_usuario
    LEFT JOIN usuarios ur ON c.id_usuario_resolucao = ur.id_usuario
    LEFT JOIN detalhes_chamado det ON det.fk_chamados_id_chamado = c.id_chamado
    WHERE c.id_chamado = $1
  `;
  const result = await pool.query(query, [idChamado]);
  return result.rows[0];
};

export const updateStatusChamadoService = async (idChamado, novoStatus, usuarioId = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      UPDATE status_chamado 
      SET descricao_status_chamado = $1
      WHERE fk_chamados_id_chamado = $2
    `, [novoStatus, idChamado]);
    
    let updateQuery = '';
    switch (novoStatus) {
      case 'Aprovado':
      case 'Rejeitado':
        updateQuery = 'UPDATE chamados SET data_aprovacao_recusa = NOW()';
        break;
      case 'Triagem IA':
      case 'Com Analista':
        updateQuery = 'UPDATE chamados SET data_encaminhamento = NOW()';
        break;
      case 'Resolvido':
        updateQuery = `UPDATE chamados SET data_resolucao = NOW(), id_usuario_resolucao = ${usuarioId || 'NULL'}`;
        break;
      case 'Fechado':
        updateQuery = 'UPDATE chamados SET data_fechamento = NOW()';
        break;
    }
    
    if (updateQuery) {
      await client.query(`${updateQuery} WHERE id_chamado = $1`, [idChamado]);
    }
    
    await client.query('COMMIT');
    console.log('Status atualizado para:', novoStatus);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar status:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Aprova um chamado e inicia processo de triagem IA
 * 
 * Fluxo:
 * 1. Atualiza status para 'Aprovado'
 * 2. Inicia triagem IA assíncrona (após 1 segundo)
 * 
 * @param {number} idChamado - ID do chamado
 * @param {number} gestorId - ID do gestor que aprovou
 * @returns {Promise<boolean>} true se aprovado com sucesso
 * @throws {Error} Se houver erro na atualização
 * @public
 * @async
 */
export const aprovarChamadoService = async (idChamado, gestorId) => {
  try {
    // Atualizar status para aprovado
    await updateStatusChamadoService(idChamado, STATUS.APROVADO, gestorId);
    
    // Iniciar triagem IA de forma assíncrona
    setTimeout(() => {
      encaminharParaTriagemIA(idChamado).catch(err => {
        console.error('Erro ao iniciar triagem IA:', err);
      });
    }, 1000);
    
    return true;
    
  } catch (error) {
    console.error('[aprovarChamadoService] Erro:', error);
    throw error;
  }
};

/**
 * Rejeita um chamado com motivo específico
 * 
 * Operações atômicas:
 * 1. Atualiza status para 'Rejeitado'
 * 2. Salva data de recusa e motivo
 * 3. Registra histórico na tabela respostas_ia
 * 
 * @param {number} idChamado - ID do chamado
 * @param {string} motivo - Motivo da rejeição (mínimo 10 caracteres)
 * @param {number} gestorId - ID do gestor que rejeitou
 * @returns {Promise<boolean>} true se rejeitado com sucesso
 * @throws {Error} Se houver erro na transação
 * @public
 * @async
 */
export const rejeitarChamadoService = async (idChamado, motivo, gestorId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Atualizar status para Rejeitado
    await client.query(`
      UPDATE status_chamado 
      SET descricao_status_chamado = $1
      WHERE fk_chamados_id_chamado = $2
    `, [STATUS.REJEITADO, idChamado]);
    
    // 2. Registrar data e motivo no chamado
    await client.query(`
      UPDATE chamados 
      SET data_aprovacao_recusa = NOW(),
          motivo_recusa = $2
      WHERE id_chamado = $1
    `, [idChamado, motivo]);
    
    // 3. Salvar histórico em respostas_ia
    await client.query(`
      INSERT INTO respostas_ia (
        fk_chamados_id_chamado, 
        tipo_resposta, 
        solucao_ia
      ) VALUES ($1, $2, $3)
    `, [idChamado, 'REPROVACAO', motivo]);
    
    await client.query('COMMIT');
    
    console.log(`✅ Chamado ${idChamado} rejeitado por gestor ${gestorId}`);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[rejeitarChamadoService] Erro:', error);
    throw error;
    
  } finally {
    client.release();
  }
};

/**
 * Busca histórico recente de chamados do usuário
 * 
 * @param {number} idUsuario - ID do usuário
 * @param {number} idChamadoAtual - ID do chamado atual (para excluir)
 * @param {number} [limit=5] - Número máximo de registros
 * @returns {Promise<Array>} Array de chamados anteriores
 * @private
 */
const buscarHistoricoUsuario = async (idUsuario, idChamadoAtual, limit = 5) => {
  const result = await pool.query(`
    SELECT c.id_chamado, s.descricao_status_chamado, c.data_abertura
    FROM chamados c
    LEFT JOIN status_chamado s ON c.id_chamado = s.fk_chamados_id_chamado
    WHERE c.id_usuario_abertura = $1 AND c.id_chamado != $2
    ORDER BY c.data_abertura DESC
    LIMIT $3
  `, [idUsuario, idChamadoAtual, limit]);
  
  return result.rows;
};

/**
 * Busca dados completos do chamado para triagem IA
 * 
 * @param {number} idChamado - ID do chamado
 * @returns {Promise<Object>} Dados completos do chamado
 * @throws {Error} Se chamado não for encontrado
 * @private
 */
const buscarDadosCompletosParaTriagem = async (idChamado) => {
  const query = `
    SELECT 
      c.*,
      cat.descricao_categoria_chamado,
      prob.descricao_problema_chamado,
      s.descricao_status_chamado,
      u.nome_usuario as usuario_abertura,
      u.email as email_usuario,
      det.titulo_chamado,
      det.descricao_detalhada
    FROM chamados c
    LEFT JOIN categoria_chamado cat ON c.id_chamado = cat.fk_chamados_id_chamado
    LEFT JOIN problema_chamado prob ON c.id_chamado = prob.fk_chamados_id_chamado
    LEFT JOIN status_chamado s ON c.id_chamado = s.fk_chamados_id_chamado
    LEFT JOIN usuarios u ON c.id_usuario_abertura = u.id_usuario
    LEFT JOIN detalhes_chamado det ON c.id_chamado = det.fk_chamados_id_chamado
    WHERE c.id_chamado = $1
  `;
  
  const result = await pool.query(query, [idChamado]);
  
  if (!result.rows || result.rows.length === 0) {
    throw new Error(`Chamado ${idChamado} não encontrado`);
  }
  
  return result.rows[0];
};

/**
 * Prepara dados formatados para envio à IA
 * 
 * @param {Object} dadosChamado - Dados brutos do banco
 * @param {Array} historico - Histórico do usuário
 * @returns {Object} Dados formatados para IA
 * @private
 */
const prepararDadosTriagem = (dadosChamado, historico) => {
  return {
    id_chamado: dadosChamado.id_chamado,
    titulo: dadosChamado.titulo_chamado || 'Sem título',
    categoria: dadosChamado.descricao_categoria_chamado || 'Não informada',
    problema: dadosChamado.descricao_problema_chamado || 'Não informado',
    descricao: dadosChamado.descricao_detalhada || 'Descrição não fornecida',
    prioridade: getPrioridadeTexto(dadosChamado.prioridade_chamado),
    usuario: dadosChamado.usuario_abertura,
    historico: JSON.stringify(historico)
  };
};

/**
 * Inicia processo de triagem IA para um chamado aprovado
 * 
 * Fluxo:
 * 1. Busca dados completos do chamado
 * 2. Busca histórico do usuário
 * 3. Envia para triagem IA (geminiService)
 * 4. Se IA recomenda: tenta resolução automática
 * 5. Se IA não recomenda ou falha: encaminha para analista
 * 
 * @param {number} idChamado - ID do chamado
 * @returns {Promise<void>}
 * @private
 * @async
 */
const encaminharParaTriagemIA = async (idChamado) => {
  try {
    console.log(`🤖 [Triagem IA] Iniciando para chamado ${idChamado}`);
    
    // Buscar dados completos
    const dadosChamado = await buscarDadosCompletosParaTriagem(idChamado);
    
    console.log(`📋 [Triagem IA] Dados: ${dadosChamado.titulo_chamado} (${dadosChamado.descricao_categoria_chamado})`);
    
    // Buscar histórico do usuário
    const historico = await buscarHistoricoUsuario(
      dadosChamado.id_usuario_abertura, 
      idChamado
    );
    
    // Preparar dados para IA
    const dadosTriagem = prepararDadosTriagem(dadosChamado, historico);
    
    // Atualizar status para Triagem IA
    await updateStatusChamadoService(idChamado, STATUS.TRIAGEM_IA);
    
    // Enviar para triagem
    const resultadoTriagem = await triagemChamado(dadosTriagem);
    
    console.log(`📊 [Triagem IA] Resultado: ${resultadoTriagem.analise?.recomendacao || 'ERRO'}`);
    
    // Processar resultado
    if (resultadoTriagem.success && resultadoTriagem.analise.recomendacao === 'IA') {
      await encaminharParaIAResolucao(idChamado, dadosTriagem, resultadoTriagem.analise);
    } else {
      await updateStatusChamadoService(idChamado, STATUS.COM_ANALISTA);
      console.log(`👨‍💼 [Triagem IA] Encaminhado para analista humano`);
    }
    
  } catch (error) {
    console.error(`❌ [Triagem IA] Erro:`, error.message);
    
    // Fallback: encaminhar para analista
    await updateStatusChamadoService(idChamado, STATUS.COM_ANALISTA);
  }
};

/**
 * Salva solução IA no banco de dados
 * 
 * @param {number} idChamado - ID do chamado
 * @param {Object} analiseTriagem - Análise da triagem
 * @param {string} solucao - Solução gerada pela IA
 * @returns {Promise<void>}
 * @throws {Error} Se houver erro ao salvar
 * @private
 */
const salvarSolucaoIA = async (idChamado, analiseTriagem, solucao) => {
  // Limitar tamanho da solução para caber no banco
  const solucaoTruncada = solucao.substring(0, 4000);
  
  await pool.query(`
    INSERT INTO respostas_ia (
      fk_chamados_id_chamado, 
      tipo_resposta, 
      analise_triagem, 
      solucao_ia
    ) VALUES ($1, $2, $3, $4)
  `, [
    idChamado, 
    'SOLUCAO', 
    JSON.stringify(analiseTriagem), 
    solucaoTruncada
  ]);
};

/**
 * Encaminha chamado para resolução automática pela IA
 * 
 * Fluxo:
 * 1. Solicita solução ao geminiService
 * 2. Se sucesso: salva solução e aguarda feedback do usuário
 * 3. Se falha: encaminha para analista humano
 * 
 * @param {number} idChamado - ID do chamado
 * @param {Object} dadosTriagem - Dados formatados do chamado
 * @param {Object} analiseTriagem - Resultado da triagem IA
 * @returns {Promise<void>}
 * @private
 * @async
 */
const encaminharParaIAResolucao = async (idChamado, dadosTriagem, analiseTriagem) => {
  try {
    console.log(`🔧 [Resolução IA] Gerando solução para chamado ${idChamado}`);
    
    // Solicitar solução à IA
    const resultadoResolucao = await resolverChamado(dadosTriagem, analiseTriagem);
    
    console.log(`📝 [Resolução IA] Solução gerada: ${resultadoResolucao.solucao?.length || 0} chars`);
    
    // Validar sucesso
    if (!resultadoResolucao.success || !resultadoResolucao.solucao) {
      throw new Error('IA não conseguiu gerar solução');
    }
    
    // Salvar solução no banco
    await salvarSolucaoIA(idChamado, analiseTriagem, resultadoResolucao.solucao);
    
    // Atualizar status para Aguardando Resposta (feedback do usuário)
    await updateStatusChamadoService(idChamado, STATUS.AGUARDANDO_RESPOSTA);
    
    console.log(`✅ [Resolução IA] Solução salva - aguardando feedback do usuário`);
    
  } catch (error) {
    console.error(`❌ [Resolução IA] Erro:`, error.message);
    
    // Fallback: encaminhar para analista
    await updateStatusChamadoService(idChamado, STATUS.COM_ANALISTA);
    console.log(`👨‍💼 [Resolução IA] Erro no processo - encaminhado para analista`);
  }
};

/**
 * Lista chamados pendentes de aprovação
 * Alias para chamados com status 'Aberto'
 * 
 * @returns {Promise<Array>} Array de chamados
 * @public
 * @async
 */
export const getChamadosParaAprovacaoService = async () => {
  return await getChamadosComDetalhesService({ status: STATUS.ABERTO });
};

/**
 * Lista chamados que estão com analistas
 * 
 * @returns {Promise<Array>} Array de chamados
 * @public
 * @async
 */
export const getChamadosParaAnalistasService = async () => {
  return await getChamadosComDetalhesService({ status: STATUS.COM_ANALISTA });
};

/**
 * Marca um chamado como resolvido por analista
 * 
 * Operações atômicas:
 * 1. Atualiza status para 'Resolvido'
 * 2. Registra data de resolução e analista responsável
 * 3. Salva histórico em respostas_ia
 * 
 * @param {number} idChamado - ID do chamado
 * @param {number} analistaId - ID do analista que resolveu
 * @returns {Promise<boolean>} true se resolvido com sucesso
 * @throws {Error} Se houver erro na transação
 * @public
 * @async
 */
export const resolverChamadoService = async (idChamado, analistaId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Atualizar status
    await client.query(`
      UPDATE status_chamado 
      SET descricao_status_chamado = $1
      WHERE fk_chamados_id_chamado = $2
    `, [STATUS.RESOLVIDO, idChamado]);
    
    // 2. Registrar resolução no chamado
    await client.query(`
      UPDATE chamados 
      SET data_resolucao = NOW(), 
          id_usuario_resolucao = $1
      WHERE id_chamado = $2
    `, [analistaId, idChamado]);
    
    // 3. Salvar histórico
    await client.query(`
      INSERT INTO respostas_ia (
        fk_chamados_id_chamado, 
        tipo_resposta, 
        solucao_ia
      ) VALUES ($1, $2, $3)
    `, [idChamado, 'ANALISTA_RESOLUCAO', 'Chamado resolvido pelo analista']);
    
    await client.query('COMMIT');
    
    console.log(`✅ Chamado ${idChamado} resolvido por analista ${analistaId}`);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[resolverChamadoService] Erro:', error);
    throw error;
    
  } finally {
    client.release();
  }
};

/**
 * Escala um chamado para gerente com motivo
 * 
 * Operações atômicas:
 * 1. Atualiza status para 'Escalado'
 * 2. Registra data de escalação
 * 3. Salva motivo em respostas_ia
 * 
 * @param {number} idChamado - ID do chamado
 * @param {number} analistaId - ID do analista que escalou
 * @param {string} motivo - Motivo da escalação
 * @returns {Promise<boolean>} true se escalado com sucesso
 * @throws {Error} Se houver erro na transação
 * @public
 * @async
 */
export const escalarChamadoService = async (idChamado, analistaId, motivo) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Atualizar status
    await client.query(`
      UPDATE status_chamado 
      SET descricao_status_chamado = $1
      WHERE fk_chamados_id_chamado = $2
    `, [STATUS.ESCALADO, idChamado]);
    
    // 2. Registrar data de escalação
    await client.query(`
      UPDATE chamados 
      SET data_escala = NOW()
      WHERE id_chamado = $1
    `, [idChamado]);
    
    // 3. Salvar motivo no histórico
    await client.query(`
      INSERT INTO respostas_ia (
        fk_chamados_id_chamado, 
        tipo_resposta, 
        solucao_ia
      ) VALUES ($1, $2, $3)
    `, [idChamado, 'ESCALONAMENTO', `Chamado escalado para gerente. Motivo: ${motivo}`]);
    
    await client.query('COMMIT');
    
    console.log(`🔝 Chamado ${idChamado} escalado por analista ${analistaId}`);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[escalarChamadoService] Erro:', error);
    throw error;
    
  } finally {
    client.release();
  }
};
