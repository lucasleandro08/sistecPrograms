/**
 * @fileoverview Controller de Estatísticas - Métricas e relatórios do sistema
 * 
 * Este controller fornece endpoints para:
 * - Estatísticas mensais e anuais de chamados
 * - Métricas de performance de analistas
 * - Dashboard com visão geral do sistema
 * - Relatórios completos para download/export
 * - Análise por categorias e status
 * 
 * Todas as queries utilizam PostgreSQL e CTEs para performance otimizada.
 * 
 * Princípios SOLID aplicados:
 * - Single Responsibility: Cada função gera um tipo específico de estatística
 * - DRY: Queries reutilizáveis e helpers de formatação
 * 
 * @module controllers/estatisticasController
 */

import pool from '../config/db.js';

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Códigos de status HTTP padronizados
 * @constant {Object}
 */
const HTTP_STATUS = Object.freeze({
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500
});

/**
 * Mensagens de sucesso padronizadas
 * @constant {Object}
 */
const SUCCESS_MESSAGES = Object.freeze({
  STATS_MONTHLY: 'Estatísticas mensais obtidas com sucesso.',
  STATS_CATEGORY: 'Estatísticas por categoria obtidas com sucesso.',
  STATS_ANNUAL: 'Estatísticas anuais obtidas com sucesso.',
  STATS_ANALYSTS: 'Estatísticas de analistas obtidas com sucesso.',
  STATS_DASHBOARD: 'Estatísticas do dashboard obtidas com sucesso.',
  STATS_ANALYSTS_FULL: 'Estatísticas completas de analistas obtidas com sucesso.',
  STATS_DETAILED: 'Estatísticas detalhadas obtidas com sucesso.',
  DOWNLOAD_DATA: 'Dados completos para download obtidos com sucesso.',
  REPORT_COMPLETE: 'Relatório completo gerado com sucesso.'
});

/**
 * Mapeamento de status de chamados
 * @constant {Object}
 */
const STATUS_MAP = Object.freeze({
  ABERTO: 'aberto',
  APROVADO: 'aprovado',
  REJEITADO: 'rejeitado',
  TRIAGEM_IA: 'triagem ia',
  AGUARDANDO_RESPOSTA: 'aguardando resposta',
  COM_ANALISTA: 'com analista',
  RESOLVIDO: 'resolvido',
  FECHADO: 'fechado',
  ESCALADO: 'escalado'
});

/**
 * Mapeamento de prioridades
 * @constant {Object}
 */
const PRIORIDADE_MAP = Object.freeze({
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
  4: 'Urgente'
});

/**
 * ID do perfil de analista
 * @constant {number}
 */
const PERFIL_ANALISTA = 2;

/**
 * Configurações de queries
 * @constant {Object}
 */
const QUERY_CONFIG = Object.freeze({
  LAST_MONTHS: 5,
  LAST_YEAR_MONTHS: 11,
  TOP_ANALYSTS_LIMIT: 10
});

// ==========================================
// FUNÇÕES AUXILIARES PRIVADAS
// ==========================================

/**
 * Envia resposta JSON padronizada
 * @private
 * @param {Object} res - Objeto response do Express
 * @param {number} status - Código HTTP
 * @param {string} message - Mensagem da resposta
 * @param {*} [data=null] - Dados opcionais
 * @returns {Object} Response JSON
 */
const sendResponse = (res, status, message, data = null) => {
  return res.status(status).json({ status, message, data });
};

/**
 * Loga operações de estatísticas
 * @private
 * @param {string} operation - Nome da operação
 * @param {Object} details - Detalhes da operação
 */
const logOperation = (operation, details) => {
  console.log(`[STATS CONTROLLER] ${operation}:`, details);
};

/**
 * Inicializa objeto de estatísticas do dashboard
 * @private
 * @returns {Object} Objeto com todas as propriedades zeradas
 */
const createEmptyStatsObject = () => ({
  abertos: 0,
  aprovados: 0,
  rejeitados: 0,
  triagem_ia: 0,
  aguardando_resposta: 0,
  com_analista: 0,
  resolvidos: 0,
  fechados: 0,
  escalados: 0,
  total: 0
});

/**
 * Mapeia status para propriedade do objeto stats
 * @private
 * @param {string} status - Status do chamado
 * @returns {string|null} Nome da propriedade ou null
 */
const mapStatusToProperty = (status) => {
  const normalized = status?.toLowerCase() || '';
  
  switch (normalized) {
    case STATUS_MAP.ABERTO: return 'abertos';
    case STATUS_MAP.APROVADO: return 'aprovados';
    case STATUS_MAP.REJEITADO: return 'rejeitados';
    case STATUS_MAP.TRIAGEM_IA: return 'triagem_ia';
    case STATUS_MAP.AGUARDANDO_RESPOSTA: return 'aguardando_resposta';
    case STATUS_MAP.COM_ANALISTA: return 'com_analista';
    case STATUS_MAP.RESOLVIDO: return 'resolvidos';
    case STATUS_MAP.FECHADO: return 'fechados';
    case STATUS_MAP.ESCALADO: return 'escalados';
    default: return null;
  }
};

/**
 * Converte prioridade numérica para texto
 * @private
 * @param {number} prioridade - Número da prioridade (1-4)
 * @returns {string} Texto da prioridade
 */
const getPrioridadeTexto = (prioridade) => {
  return PRIORIDADE_MAP[prioridade] || 'Não definida';
};

/**
 * Processa rows do banco para estatísticas do dashboard
 * @private
 * @param {Array} rows - Rows do resultado da query
 * @returns {Object} Objeto com estatísticas processadas
 */
const processDashboardStats = (rows) => {
  const statsObj = createEmptyStatsObject();

  rows.forEach(row => {
    const property = mapStatusToProperty(row.status);
    const count = parseInt(row.total) || 0;
    
    if (property) {
      statsObj[property] = count;
    }
    
    statsObj.total += count;
  });

  return statsObj;
};

// ==========================================
// QUERIES SQL REUTILIZÁVEIS
// ==========================================

/**
 * Query para estatísticas mensais (últimos 6 meses)
 * @constant {string}
 */
const QUERY_MONTHLY_STATS = `
  WITH meses AS (
    SELECT 
      TO_CHAR(date_trunc('month', generate_series(
        NOW() - INTERVAL '${QUERY_CONFIG.LAST_MONTHS} months',
        NOW(),
        '1 month'::interval
      )), 'Mon') as month,
      date_trunc('month', generate_series(
        NOW() - INTERVAL '${QUERY_CONFIG.LAST_MONTHS} months',
        NOW(),
        '1 month'::interval
      )) as mes_completo
  )
  SELECT 
    m.month,
    COALESCE(COUNT(DISTINCT c.id_chamado), 0) as value
  FROM meses m
  LEFT JOIN chamados c ON date_trunc('month', c.data_abertura) = m.mes_completo
  GROUP BY m.month, m.mes_completo
  ORDER BY m.mes_completo;
`;

/**
 * Query para estatísticas por categoria
 * @constant {string}
 */
const QUERY_CATEGORY_STATS = `
  SELECT 
    COALESCE(cat.descricao_categoria_chamado, 'Sem Categoria') as name,
    COUNT(DISTINCT cat.fk_chamados_id_chamado)::integer as value
  FROM categoria_chamado cat
  GROUP BY cat.descricao_categoria_chamado
  HAVING COUNT(DISTINCT cat.fk_chamados_id_chamado) > 0
  ORDER BY value DESC;
`;

/**
 * Query para estatísticas anuais (12 meses)
 * @constant {string}
 */
const QUERY_ANNUAL_STATS = `
  WITH meses AS (
    SELECT 
      TO_CHAR(date_trunc('month', generate_series(
        NOW() - INTERVAL '${QUERY_CONFIG.LAST_YEAR_MONTHS} months',
        NOW(),
        '1 month'::interval
      )), 'Mon') as month,
      date_trunc('month', generate_series(
        NOW() - INTERVAL '${QUERY_CONFIG.LAST_YEAR_MONTHS} months',
        NOW(),
        '1 month'::interval
      )) as mes_completo
  ),
  chamados_abertos AS (
    SELECT 
      date_trunc('month', data_abertura) as mes,
      COUNT(DISTINCT id_chamado) as total
    FROM chamados
    GROUP BY date_trunc('month', data_abertura)
  ),
  chamados_resolvidos AS (
    SELECT 
      date_trunc('month', data_resolucao) as mes,
      COUNT(DISTINCT id_chamado) as total
    FROM chamados
    WHERE data_resolucao IS NOT NULL
    GROUP BY date_trunc('month', data_resolucao)
  )
  SELECT 
    m.month,
    COALESCE(ca.total, 0) as abertos,
    COALESCE(cr.total, 0) as resolvidos
  FROM meses m
  LEFT JOIN chamados_abertos ca ON ca.mes = m.mes_completo
  LEFT JOIN chamados_resolvidos cr ON cr.mes = m.mes_completo
  ORDER BY m.mes_completo;
`;

/**
 * Query para top analistas (com chamados resolvidos)
 * @constant {string}
 */
const QUERY_TOP_ANALYSTS = `
  SELECT 
    u.nome_usuario AS name,
    COUNT(DISTINCT c.id_chamado)::int AS value
  FROM usuarios u
  INNER JOIN chamados c ON c.id_usuario_resolucao = u.id_usuario
  WHERE u.id_perfil_usuario = ${PERFIL_ANALISTA}
    AND c.data_resolucao IS NOT NULL
  GROUP BY u.id_usuario, u.nome_usuario
  HAVING COUNT(DISTINCT c.id_chamado) > 0
  ORDER BY value DESC
  LIMIT ${QUERY_CONFIG.TOP_ANALYSTS_LIMIT};
`;

/**
 * CTE para status atual dos chamados
 * @constant {string}
 */
const CTE_STATUS_ATUAL = `
  WITH status_atual AS (
    SELECT DISTINCT ON (fk_chamados_id_chamado)
      fk_chamados_id_chamado as id_chamado,
      descricao_status_chamado
    FROM status_chamado
    ORDER BY fk_chamados_id_chamado, id_status_chamado DESC
  )
`;

/**
 * Query para estatísticas do dashboard
 * @constant {string}
 */
const QUERY_DASHBOARD_STATS = `
  ${CTE_STATUS_ATUAL}
  SELECT 
    COALESCE(sa.descricao_status_chamado, 'Sem Status') as status,
    COUNT(DISTINCT c.id_chamado) as total
  FROM chamados c
  LEFT JOIN status_atual sa ON c.id_chamado = sa.id_chamado
  GROUP BY sa.descricao_status_chamado
  ORDER BY total DESC;
`;

/**
 * Query para todos os analistas (incluindo sem chamados)
 * @constant {string}
 */
const QUERY_ALL_ANALYSTS = `
  SELECT 
    u.nome_usuario as name,
    COALESCE(COUNT(DISTINCT c.id_chamado), 0)::int as value
  FROM usuarios u
  LEFT JOIN chamados c ON u.id_usuario = c.id_usuario_resolucao 
    AND c.data_resolucao IS NOT NULL
  WHERE u.id_perfil_usuario = ${PERFIL_ANALISTA}
  GROUP BY u.id_usuario, u.nome_usuario
  ORDER BY value DESC;
`;

// ==========================================
// CONTROLLERS PÚBLICOS
// ==========================================

/**
 * Retorna estatísticas mensais dos últimos 6 meses
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com array de meses e totais
 * 
 * @example
 * GET /api/estatisticas/mensais
 * Response: {
 *   "data": [
 *     {"month": "Jun", "value": 45},
 *     {"month": "Jul", "value": 52}
 *   ]
 * }
 */
export const getChamadosMensais = async (req, res, next) => {
  try {
    const result = await pool.query(QUERY_MONTHLY_STATS);
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATS_MONTHLY, result.rows);
  } catch (err) {
    logOperation('MONTHLY STATS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna estatísticas agrupadas por categoria de chamados
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com array de categorias e totais
 * 
 * @example
 * GET /api/estatisticas/categorias
 * Response: {
 *   "data": [
 *     {"name": "Hardware", "value": 120},
 *     {"name": "Software", "value": 85}
 *   ]
 * }
 */
export const getChamadosCategoria = async (req, res, next) => {
  try {
    const result = await pool.query(QUERY_CATEGORY_STATS);
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATS_CATEGORY, result.rows);
  } catch (err) {
    logOperation('CATEGORY STATS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna estatísticas anuais (últimos 12 meses)
 * Compara chamados abertos vs resolvidos por mês
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com comparativo mensal
 * 
 * @example
 * GET /api/estatisticas/anuais
 * Response: {
 *   "data": [
 *     {"month": "Jan", "abertos": 50, "resolvidos": 45},
 *     {"month": "Fev", "abertos": 48, "resolvidos": 52}
 *   ]
 * }
 */
export const getChamadosAnuais = async (req, res, next) => {
  try {
    const result = await pool.query(QUERY_ANNUAL_STATS);
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATS_ANNUAL, result.rows);
  } catch (err) {
    logOperation('ANNUAL STATS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna top 10 analistas com mais chamados resolvidos
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com ranking de analistas
 * 
 * @example
 * GET /api/estatisticas/analistas
 * Response: {
 *   "data": [
 *     {"name": "João Silva", "value": 120},
 *     {"name": "Maria Santos", "value": 98}
 *   ]
 * }
 */
export const getChamadosAnalistas = async (req, res, next) => {
  try {
    const result = await pool.query(QUERY_TOP_ANALYSTS);
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATS_ANALYSTS, result.rows);
  } catch (err) {
    logOperation('ANALYSTS STATS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna estatísticas agregadas do dashboard
 * Totaliza chamados por status
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com totais por status
 * 
 * @example
 * GET /api/estatisticas/dashboard
 * Response: {
 *   "data": {
 *     "abertos": 10,
 *     "com_analista": 25,
 *     "resolvidos": 150,
 *     "total": 185
 *   }
 * }
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const result = await pool.query(QUERY_DASHBOARD_STATS);
    const statsObj = processDashboardStats(result.rows);
    
    logOperation('DASHBOARD STATS', statsObj);
    
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATS_DASHBOARD, statsObj);
  } catch (err) {
    logOperation('DASHBOARD STATS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna estatísticas de TODOS os analistas
 * Inclui analistas sem chamados resolvidos
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com array completo de analistas
 * 
 * @example
 * GET /api/estatisticas/analistas-completo
 * Response: {
 *   "data": [
 *     {"name": "João Silva", "value": 120},
 *     {"name": "Ana Costa", "value": 0}
 *   ]
 * }
 */
export const getChamadosAnalistasCompleto = async (req, res, next) => {
  try {
    const result = await pool.query(QUERY_ALL_ANALYSTS);
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATS_ANALYSTS_FULL, result.rows);
  } catch (err) {
    logOperation('ALL ANALYSTS STATS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna estatísticas detalhadas com múltiplas dimensões
 * Inclui: status, chamados hoje, última semana, último mês
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com dados detalhados multi-dimensionais
 * 
 * @example
 * GET /api/estatisticas/detalhadas
 * Response: {
 *   "data": {
 *     "por_status": [...],
 *     "periodo": {
 *       "hoje": 5,
 *       "semana": 25,
 *       "mes": 105
 *     }
 *   }
 * }
 */
export const getDashboardStatsDetalhadas = async (req, res, next) => {
  try {
    const queries = await Promise.all([
      // Status atual
      pool.query(`${CTE_STATUS_ATUAL}
        SELECT 
          COALESCE(sa.descricao_status_chamado, 'Sem Status') as status,
          COUNT(DISTINCT c.id_chamado) as total
        FROM chamados c
        LEFT JOIN status_atual sa ON c.id_chamado = sa.id_chamado
        GROUP BY sa.descricao_status_chamado`),
      
      // Chamados hoje
      pool.query(`
        SELECT COUNT(DISTINCT id_chamado) as hoje
        FROM chamados 
        WHERE DATE(data_abertura) = CURRENT_DATE`),
      
      // Chamados última semana
      pool.query(`
        SELECT COUNT(DISTINCT id_chamado) as semana
        FROM chamados 
        WHERE data_abertura >= date_trunc('week', CURRENT_DATE)`),
      
      // Chamados último mês
      pool.query(`
        SELECT COUNT(DISTINCT id_chamado) as mes
        FROM chamados 
        WHERE data_abertura >= date_trunc('month', CURRENT_DATE)`)
    ]);

    const [statusResult, hojeResult, semanaResult, mesResult] = queries;

    const resultado = {
      por_status: statusResult.rows,
      periodo: {
        hoje: parseInt(hojeResult.rows[0].hoje) || 0,
        semana: parseInt(semanaResult.rows[0].semana) || 0,
        mes: parseInt(mesResult.rows[0].mes) || 0
      }
    };

    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.STATS_DETAILED, resultado);
  } catch (err) {
    logOperation('DETAILED STATS ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna dados completos para download/export
 * Inclui todos os campos dos chamados para relatórios
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com dados completos de todos os chamados
 * 
 * @example
 * GET /api/estatisticas/download
 * Response: {
 *   "data": [
 *     {
 *       "id_chamado": 123,
 *       "titulo_chamado": "...",
 *       "prioridade_texto": "Alta",
 *       "tempo_resolucao_dias": 2.5,
 *       ...
 *     }
 *   ]
 * }
 */
export const getDownloadCompleto = async (req, res, next) => {
  try {
    const query = `
      WITH status_atual AS (
        SELECT DISTINCT ON (fk_chamados_id_chamado)
          fk_chamados_id_chamado as id_chamado,
          descricao_status_chamado
        FROM status_chamado
        ORDER BY fk_chamados_id_chamado, id_status_chamado DESC
      ),
      tempo_resolucao AS (
        SELECT 
          id_chamado,
          CASE 
            WHEN data_resolucao IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (data_resolucao - data_abertura))/86400 
            ELSE NULL 
          END as tempo_resolucao_dias
        FROM chamados
      )
      SELECT 
        c.id_chamado,
        det.titulo_chamado,
        cat.descricao_categoria_chamado,
        prob.descricao_problema_chamado,
        sa.descricao_status_chamado,
        CASE c.prioridade_chamado
          WHEN 1 THEN 'Baixa'
          WHEN 2 THEN 'Média' 
          WHEN 3 THEN 'Alta'
          WHEN 4 THEN 'Urgente'
          ELSE 'Não definida'
        END as prioridade_texto,
        u_abertura.nome_usuario as usuario_abertura,
        c.data_abertura,
        u_resolucao.nome_usuario as analista_responsavel,
        c.data_resolucao,
        ROUND(tr.tempo_resolucao_dias::numeric, 2) as tempo_resolucao_dias,
        COALESCE(det.descricao_detalhada, 'Motivo não especificado') as motivo_abertura
      FROM chamados c
      LEFT JOIN detalhes_chamado det ON c.id_chamado = det.fk_chamados_id_chamado
      LEFT JOIN categoria_chamado cat ON c.id_chamado = cat.fk_chamados_id_chamado
      LEFT JOIN problema_chamado prob ON c.id_chamado = prob.fk_chamados_id_chamado
      LEFT JOIN status_atual sa ON c.id_chamado = sa.id_chamado
      LEFT JOIN usuarios u_abertura ON c.id_usuario_abertura = u_abertura.id_usuario
      LEFT JOIN usuarios u_resolucao ON c.id_usuario_resolucao = u_resolucao.id_usuario
      LEFT JOIN tempo_resolucao tr ON c.id_chamado = tr.id_chamado
      ORDER BY c.data_abertura DESC;
    `;

    const result = await pool.query(query);
    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.DOWNLOAD_DATA, result.rows);
  } catch (err) {
    logOperation('DOWNLOAD DATA ERROR', { error: err.message });
    next(err);
  }
};

/**
 * Retorna relatório completo consolidado
 * Inclui: lista de chamados, estatísticas agregadas, top analistas
 * 
 * @async
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Next middleware
 * @returns {Promise<Object>} JSON com relatório completo multi-seção
 * 
 * @example
 * GET /api/estatisticas/relatorio
 * Response: {
 *   "data": {
 *     "chamados": [...],
 *     "estatisticas": {
 *       "total": 500,
 *       "por_status": [...],
 *       "por_categoria": [...],
 *       "analistas_produtivos": [...]
 *     }
 *   }
 * }
 */
export const getRelatorioCompleto = async (req, res, next) => {
  try {
    logOperation('GENERATING COMPLETE REPORT', {});

    // Query para todos os chamados
    const chamadosQuery = `
      SELECT 
        c.id_chamado,
        COALESCE(cat.descricao_categoria_chamado, 'Sem Categoria') as descricao_categoria_chamado,
        COALESCE(prob.descricao_problema_chamado, 'Sem Problema') as descricao_problema_chamado,
        COALESCE(st.descricao_status_chamado, 'Sem Status') as descricao_status_chamado,
        c.prioridade_chamado,
        c.data_abertura,
        c.data_resolucao,
        COALESCE(u.nome_usuario, 'Usuário Desconhecido') as usuario_abertura,
        COALESCE(u.email, 'Sem Email') as email_usuario
      FROM chamados c
      LEFT JOIN categoria_chamado cat ON c.id_chamado = cat.fk_chamados_id_chamado
      LEFT JOIN problema_chamado prob ON c.id_chamado = prob.fk_chamados_id_chamado
      LEFT JOIN status_chamado st ON c.id_chamado = st.fk_chamados_id_chamado
      LEFT JOIN usuarios u ON c.id_usuario_abertura = u.id_usuario
      ORDER BY c.data_abertura DESC;
    `;

    const chamadosResult = await pool.query(chamadosQuery);

    // Query para estatísticas por status
    const statusQuery = `${CTE_STATUS_ATUAL}
      SELECT 
        COALESCE(sa.descricao_status_chamado, 'Sem Status') as status,
        COUNT(DISTINCT c.id_chamado) as quantidade
      FROM chamados c
      LEFT JOIN status_atual sa ON c.id_chamado = sa.id_chamado
      GROUP BY sa.descricao_status_chamado
      ORDER BY quantidade DESC;
    `;

    const statusResult = await pool.query(statusQuery);

    // Query para estatísticas por categoria
    // Nota: Usa aliases diferentes (categoria, quantidade) para relatórios
    const categoriaQuery = `
      SELECT 
        COALESCE(cat.descricao_categoria_chamado, 'Sem Categoria') as categoria,
        COUNT(DISTINCT cat.fk_chamados_id_chamado)::integer as quantidade
      FROM categoria_chamado cat
      GROUP BY cat.descricao_categoria_chamado
      HAVING COUNT(DISTINCT cat.fk_chamados_id_chamado) > 0
      ORDER BY quantidade DESC;
    `;

    const categoriaResult = await pool.query(categoriaQuery);

    // Query para top analistas
    // Nota: Usa aliases diferentes (analista, resolvidos) para relatórios
    const analistasQuery = `
      SELECT 
        u.nome_usuario AS analista,
        COUNT(DISTINCT c.id_chamado)::int AS resolvidos
      FROM usuarios u
      INNER JOIN chamados c ON c.id_usuario_resolucao = u.id_usuario
      WHERE u.id_perfil_usuario = ${PERFIL_ANALISTA}
        AND c.data_resolucao IS NOT NULL
      GROUP BY u.id_usuario, u.nome_usuario
      HAVING COUNT(DISTINCT c.id_chamado) > 0
      ORDER BY resolvidos DESC
      LIMIT ${QUERY_CONFIG.TOP_ANALYSTS_LIMIT};
    `;

    const analistasResult = await pool.query(analistasQuery);

    // Montar relatório
    const relatorio = {
      chamados: chamadosResult.rows,
      estatisticas: {
        total: chamadosResult.rows.length,
        por_status: statusResult.rows,
        por_categoria: categoriaResult.rows,
        analistas_produtivos: analistasResult.rows
      }
    };

    logOperation('REPORT GENERATED', {
      chamados: relatorio.chamados.length,
      status: relatorio.estatisticas.por_status.length,
      categorias: relatorio.estatisticas.por_categoria.length,
      analistas: relatorio.estatisticas.analistas_produtivos.length
    });

    return sendResponse(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.REPORT_COMPLETE, relatorio);
  } catch (err) {
    logOperation('COMPLETE REPORT ERROR', { error: err.message });
    next(err);
  }
};
