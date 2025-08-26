import pool from '../config/db.js';

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

export const getChamadosMensais = async (req, res, next) => {
  try {
    const query = `
      WITH meses AS (
        SELECT 
          TO_CHAR(date_trunc('month', generate_series(
            NOW() - INTERVAL '5 months',
            NOW(),
            '1 month'::interval
          )), 'Mon') as month,
          date_trunc('month', generate_series(
            NOW() - INTERVAL '5 months',
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

    const result = await pool.query(query);
    handleResponse(res, 200, 'Estatísticas mensais obtidas com sucesso.', result.rows);

  } catch (err) {
    console.error('Erro ao buscar estatísticas mensais:', err);
    next(err);
  }
};

export const getChamadosCategoria = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        COALESCE(cat.descricao_categoria_chamado, 'Sem Categoria') as name,
        COUNT(DISTINCT cat.fk_chamados_id_chamado)::integer as value
      FROM categoria_chamado cat
      GROUP BY cat.descricao_categoria_chamado
      HAVING COUNT(DISTINCT cat.fk_chamados_id_chamado) > 0
      ORDER BY value DESC;
    `;

    const result = await pool.query(query);
    handleResponse(res, 200, 'Estatísticas por categoria obtidas com sucesso.', result.rows);

  } catch (err) {
    console.error('Erro ao buscar estatísticas por categoria:', err);
    next(err);
  }
};

export const getChamadosAnuais = async (req, res, next) => {
  try {
    const query = `
      WITH meses AS (
        SELECT 
          TO_CHAR(date_trunc('month', generate_series(
            NOW() - INTERVAL '11 months',
            NOW(),
            '1 month'::interval
          )), 'Mon') as month,
          date_trunc('month', generate_series(
            NOW() - INTERVAL '11 months',
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

    const result = await pool.query(query);
    handleResponse(res, 200, 'Estatísticas anuais obtidas com sucesso.', result.rows);

  } catch (err) {
    console.error('Erro ao buscar estatísticas anuais:', err);
    next(err);
  }
};

export const getChamadosAnalistas = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.nome_usuario AS name,
        COUNT(DISTINCT c.id_chamado)::int AS value
      FROM usuarios u
      INNER JOIN chamados c ON c.id_usuario_resolucao = u.id_usuario
      WHERE u.id_perfil_usuario = 2
        AND c.data_resolucao IS NOT NULL
      GROUP BY u.id_usuario, u.nome_usuario
      HAVING COUNT(DISTINCT c.id_chamado) > 0
      ORDER BY value DESC
      LIMIT 10;
    `;

    const result = await pool.query(query);
    handleResponse(res, 200, 'Estatísticas de analistas obtidas com sucesso.', result.rows);

  } catch (err) {
    console.error('Erro ao buscar estatísticas de analistas:', err);
    next(err);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const query = `
      WITH status_atual AS (
        SELECT DISTINCT ON (fk_chamados_id_chamado)
          fk_chamados_id_chamado as id_chamado,
          descricao_status_chamado
        FROM status_chamado
        ORDER BY fk_chamados_id_chamado, id_status_chamado DESC
      )
      SELECT 
        COALESCE(sa.descricao_status_chamado, 'Sem Status') as status,
        COUNT(DISTINCT c.id_chamado) as total
      FROM chamados c
      LEFT JOIN status_atual sa ON c.id_chamado = sa.id_chamado
      GROUP BY sa.descricao_status_chamado
      ORDER BY total DESC;
    `;

    const result = await pool.query(query);
    
    const statsObj = {
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
    };

    result.rows.forEach(row => {
      const status = row.status?.toLowerCase() || '';
      const count = parseInt(row.total) || 0;
      
      switch (status) {
        case 'aberto':
          statsObj.abertos = count;
          break;
        case 'aprovado':
          statsObj.aprovados = count;
          break;
        case 'rejeitado':
          statsObj.rejeitados = count;
          break;
        case 'triagem ia':
          statsObj.triagem_ia = count;
          break;
        case 'aguardando resposta':
          statsObj.aguardando_resposta = count;
          break;
        case 'com analista':
          statsObj.com_analista = count;
          break;
        case 'resolvido':
          statsObj.resolvidos = count;
          break;
        case 'fechado':
          statsObj.fechados = count;
          break;
        case 'escalado':
          statsObj.escalados = count;
          break;
      }
      
      statsObj.total += count;
    });

    console.log('Estatísticas do dashboard:', statsObj);
    
    handleResponse(res, 200, 'Estatísticas do dashboard obtidas com sucesso.', statsObj);

  } catch (err) {
    console.error('Erro ao buscar estatísticas do dashboard:', err);
    next(err);
  }
};

export const getChamadosAnalistasCompleto = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.nome_usuario as name,
        COALESCE(COUNT(DISTINCT c.id_chamado), 0)::int as value
      FROM usuarios u
      LEFT JOIN chamados c ON u.id_usuario = c.id_usuario_resolucao 
        AND c.data_resolucao IS NOT NULL
      WHERE u.id_perfil_usuario = 2
      GROUP BY u.id_usuario, u.nome_usuario
      ORDER BY value DESC;
    `;

    const result = await pool.query(query);
    handleResponse(res, 200, 'Estatísticas completas de analistas obtidas com sucesso.', result.rows);

  } catch (err) {
    console.error('Erro ao buscar estatísticas completas de analistas:', err);
    next(err);
  }
};

export const getDashboardStatsDetalhadas = async (req, res, next) => {
  try {
    const queries = await Promise.all([
      pool.query(`
        WITH status_atual AS (
          SELECT DISTINCT ON (fk_chamados_id_chamado)
            fk_chamados_id_chamado as id_chamado,
            descricao_status_chamado
          FROM status_chamado
          ORDER BY fk_chamados_id_chamado, id_status_chamado DESC
        )
        SELECT 
          COALESCE(sa.descricao_status_chamado, 'Sem Status') as status,
          COUNT(DISTINCT c.id_chamado) as total
        FROM chamados c
        LEFT JOIN status_atual sa ON c.id_chamado = sa.id_chamado
        GROUP BY sa.descricao_status_chamado
      `),
      
      pool.query(`
        SELECT COUNT(DISTINCT id_chamado) as hoje
        FROM chamados 
        WHERE DATE(data_abertura) = CURRENT_DATE
      `),
      
      pool.query(`
        SELECT COUNT(DISTINCT id_chamado) as semana
        FROM chamados 
        WHERE data_abertura >= date_trunc('week', CURRENT_DATE)
      `),
      
      pool.query(`
        SELECT COUNT(DISTINCT id_chamado) as mes
        FROM chamados 
        WHERE data_abertura >= date_trunc('month', CURRENT_DATE)
      `)
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

    handleResponse(res, 200, 'Estatísticas detalhadas obtidas com sucesso.', resultado);

  } catch (err) {
    console.error('Erro ao buscar estatísticas detalhadas:', err);
    next(err);
  }
};

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
    handleResponse(res, 200, 'Dados completos para download obtidos com sucesso.', result.rows);

  } catch (err) {
    console.error('Erro ao buscar dados completos:', err);
    next(err);
  }
};

export const getRelatorioCompleto = async (req, res, next) => {
  try {
    console.log('Gerando relatório completo...');

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

    const statusQuery = `
      WITH status_atual AS (
        SELECT DISTINCT ON (fk_chamados_id_chamado)
          fk_chamados_id_chamado as id_chamado,
          descricao_status_chamado
        FROM status_chamado
        ORDER BY fk_chamados_id_chamado, id_status_chamado DESC
      )
      SELECT 
        COALESCE(sa.descricao_status_chamado, 'Sem Status') as status,
        COUNT(DISTINCT c.id_chamado) as quantidade
      FROM chamados c
      LEFT JOIN status_atual sa ON c.id_chamado = sa.id_chamado
      GROUP BY sa.descricao_status_chamado
      ORDER BY quantidade DESC;
    `;

    const statusResult = await pool.query(statusQuery);

    const categoriaQuery = `
      SELECT 
        COALESCE(cat.descricao_categoria_chamado, 'Sem Categoria') as categoria,
        COUNT(DISTINCT cat.fk_chamados_id_chamado) as quantidade
      FROM categoria_chamado cat
      GROUP BY cat.descricao_categoria_chamado
      ORDER BY quantidade DESC;
    `;

    const categoriaResult = await pool.query(categoriaQuery);

    const analistasQuery = `
      SELECT 
        u.nome_usuario as analista,
        COUNT(DISTINCT c.id_chamado) as resolvidos
      FROM usuarios u
      INNER JOIN chamados c ON c.id_usuario_resolucao = u.id_usuario
      WHERE u.id_perfil_usuario = 2
        AND c.data_resolucao IS NOT NULL
      GROUP BY u.id_usuario, u.nome_usuario
      HAVING COUNT(DISTINCT c.id_chamado) > 0
      ORDER BY resolvidos DESC
      LIMIT 10;
    `;

    const analistasResult = await pool.query(analistasQuery);

    const relatorio = {
      chamados: chamadosResult.rows,
      estatisticas: {
        total: chamadosResult.rows.length,
        por_status: statusResult.rows,
        por_categoria: categoriaResult.rows,
        analistas_produtivos: analistasResult.rows
      }
    };

    console.log('Relatório gerado com sucesso:', {
      chamados: relatorio.chamados.length,
      status: relatorio.estatisticas.por_status.length,
      categorias: relatorio.estatisticas.por_categoria.length,
      analistas: relatorio.estatisticas.analistas_produtivos.length
    });

    handleResponse(res, 200, 'Relatório completo gerado com sucesso.', relatorio);

  } catch (err) {
    console.error('Erro ao gerar relatório completo:', err);
    next(err);
  }
};
