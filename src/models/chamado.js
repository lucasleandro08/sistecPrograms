import pool from '../config/db.js';
import { triagemChamado, resolverChamado } from '../services/geminiService.js';


export const createChamadoService = async (dadosChamado) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      id_usuario_abertura,
      prioridade_chamado,
      descricao_categoria,
      descricao_problema,
      descricao_detalhada,
    } = dadosChamado;

    const prioridadeNumerica =
      typeof prioridade_chamado === 'string'
        ? convertPrioridadeToNumber(prioridade_chamado)
        : prioridade_chamado;

    const chamadoResult = await client.query(
      `
      INSERT INTO chamados (
        id_usuario_abertura, 
        prioridade_chamado, 
        data_abertura
      ) VALUES ($1, $2, NOW())
      RETURNING *
    `,
      [id_usuario_abertura, prioridadeNumerica],
    );
    const idChamado = chamadoResult.rows[0].id_chamado;

    await client.query(
      `
      INSERT INTO categoria_chamado (descricao_categoria_chamado, fk_chamados_id_chamado)
      VALUES ($1, $2)
    `,
      [descricao_categoria, idChamado],
    );

    await client.query(
      `
      INSERT INTO problema_chamado (descricao_problema_chamado, fk_chamados_id_chamado)
      VALUES ($1, $2)
    `,
      [descricao_problema, idChamado],
    );

    if (descricao_detalhada) {
      const linhas = descricao_detalhada.split('\n');
      const tituloMatch = linhas.find((linha) =>
        linha.startsWith('**Título:**'),
      );
      const titulo = tituloMatch
        ? tituloMatch.replace('**Título:**', '').trim()
        : 'Sem título';
      await client.query(
        `
        INSERT INTO detalhes_chamado (fk_chamados_id_chamado, titulo_chamado, descricao_detalhada)
        VALUES ($1, $2, $3)
      `,
        [idChamado, titulo, descricao_detalhada],
      );
    }

    await client.query(
      `
      INSERT INTO status_chamado (descricao_status_chamado, fk_chamados_id_chamado)
      VALUES ($1, $2)
    `,
      ['Aberto', idChamado],
    );

    await client.query('COMMIT');

    return {
      id_chamado: idChamado,
      ...dadosChamado,
      prioridade_numerica: prioridadeNumerica,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getChamadosComDetalhesService = async (filtros = {}) => {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 0;

  if (filtros.id_usuario) {
    paramCount++;
    whereClause += ` AND c.id_usuario_abertura = $${paramCount}`;
    params.push(filtros.id_usuario);
  }

  if (filtros.status) {
    paramCount++;
    whereClause += ` AND s.descricao_status_chamado = $${paramCount}`;
    params.push(filtros.status);
  }

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
      det.descricao_detalhada
    FROM chamados c
    LEFT JOIN categoria_chamado cat ON c.id_chamado = cat.fk_chamados_id_chamado
    LEFT JOIN problema_chamado prob ON c.id_chamado = prob.fk_chamados_id_chamado
    LEFT JOIN status_chamado s ON c.id_chamado = s.fk_chamados_id_chamado
    LEFT JOIN usuarios u ON c.id_usuario_abertura = u.id_usuario
    LEFT JOIN usuarios ur ON c.id_usuario_resolucao = ur.id_usuario
    LEFT JOIN detalhes_chamado det ON det.fk_chamados_id_chamado = c.id_chamado
    ${whereClause}
    ORDER BY c.data_abertura DESC
  `;
  const result = await pool.query(query, params);
  return result.rows;
};

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
      det.descricao_detalhada
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

export const aprovarChamadoService = async (idChamado, gestorId) => {
  try {
    await updateStatusChamadoService(idChamado, 'Aprovado', gestorId);
    
    setTimeout(() => {
      encaminharParaTriagemIA(idChamado);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Erro ao aprovar chamado:', error);
    throw error;
  }
};

export const rejeitarChamadoService = async (idChamado, motivo, gestorId) => {
  try {
    await updateStatusChamadoService(idChamado, 'Rejeitado', gestorId);
    
    console.log('Chamado rejeitado. Motivo:', motivo);
    
    return true;
  } catch (error) {
    console.error('Erro ao rejeitar chamado:', error);
    throw error;
  }
};

const convertPrioridadeToNumber = (prioridadeString) => {
  const prioridadeMap = {
    'baixa': 1,
    'media': 2,
    'alta': 3,
    'urgente': 4
  };
  
  return prioridadeMap[prioridadeString.toLowerCase()] || 2;
};

const encaminharParaTriagemIA = async (idChamado) => {
  try {
    console.log('Iniciando processo de triagem IA para chamado:', idChamado);
    
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
      throw new Error('Chamado não encontrado');
    }
    
    const dadosChamado = result.rows[0];
    
    console.log('Dados completos do chamado para IA:', {
      id_chamado: dadosChamado.id_chamado,
      titulo: dadosChamado.titulo_chamado,
      categoria: dadosChamado.descricao_categoria_chamado,
      problema: dadosChamado.descricao_problema_chamado,
      descricao: dadosChamado.descricao_detalhada,
      prioridade: dadosChamado.prioridade_chamado
    });
    
    const historico = await pool.query(`
      SELECT c.id_chamado, s.descricao_status_chamado, c.data_abertura
      FROM chamados c
      LEFT JOIN status_chamado s ON c.id_chamado = s.fk_chamados_id_chamado
      WHERE c.id_usuario_abertura = $1 AND c.id_chamado != $2
      ORDER BY c.data_abertura DESC
      LIMIT 5
    `, [dadosChamado.id_usuario_abertura, idChamado]);
    
    const dadosTriagem = {
      id_chamado: dadosChamado.id_chamado,
      titulo: dadosChamado.titulo_chamado || 'Sem título',
      categoria: dadosChamado.descricao_categoria_chamado || 'Não informada',
      problema: dadosChamado.descricao_problema_chamado || 'Não informado',
      descricao: dadosChamado.descricao_detalhada || 'Descrição não fornecida',
      prioridade: getPrioridadeTexto(dadosChamado.prioridade_chamado),
      usuario: dadosChamado.usuario_abertura,
      historico: JSON.stringify(historico.rows)
    };
    
    console.log('Enviando para IA:', dadosTriagem);
    
    await updateStatusChamadoService(idChamado, 'Triagem IA');
    
    const resultadoTriagem = await triagemChamado(dadosTriagem);
    
    console.log('Resultado da triagem:', resultadoTriagem);
    
    if (resultadoTriagem.success && resultadoTriagem.analise.recomendacao === 'IA') {
      await encaminharParaIAResolucao(idChamado, dadosTriagem, resultadoTriagem.analise);
    } else {
      await updateStatusChamadoService(idChamado, 'Com Analista');
      console.log('Chamado encaminhado para analista humano');
    }
    
  } catch (error) {
    console.error('Erro na triagem IA:', error);
    await updateStatusChamadoService(idChamado, 'Com Analista');
  }
};

const getPrioridadeTexto = (prioridade) => {
  const textos = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
  return textos[prioridade] || 'Não definida';
};

const encaminharParaIAResolucao = async (idChamado, dadosTriagem, analiseTriagem) => {
  try {
    console.log('Gerando solução IA para chamado:', idChamado);
    
    const resultadoResolucao = await resolverChamado(dadosTriagem, analiseTriagem);
    
    console.log('Resultado da resolução IA:', {
      success: resultadoResolucao.success,
      comprimento: resultadoResolucao.solucao?.length || 0,
      erro: resultadoResolucao.error
    });
    
    if (resultadoResolucao.success && resultadoResolucao.solucao) {
      try {
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
          resultadoResolucao.solucao.substring(0, 4000)
        ]);
        
        await updateStatusChamadoService(idChamado, 'Aguardando Resposta');
        
        console.log('Solução IA salva e status atualizado para: Aguardando Resposta');
        console.log('Chamado ID:', idChamado, 'pronto para feedback do usuário');
        
      } catch (dbError) {
        console.error('Erro ao salvar no banco:', dbError);
        throw dbError;
      }
      
    } else {
      await updateStatusChamadoService(idChamado, 'Com Analista');
      console.log('IA falhou na geração, encaminhando para analista');
    }
    
  } catch (error) {
    console.error('Erro na resolução IA:', error);
    await updateStatusChamadoService(idChamado, 'Com Analista');
    console.log('Erro no processo, encaminhando para analista');
  }
};

export const getChamadosParaAprovacaoService = async () => {
  return await getChamadosComDetalhesService({ status: 'Aberto' });
};

export const getChamadosParaAnalistasService = async () => {
  return await getChamadosComDetalhesService({ status: 'Com Analista' });
};

export const resolverChamadoService = async (idChamado, analistaId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      UPDATE status_chamado 
      SET descricao_status_chamado = 'Resolvido'
      WHERE fk_chamados_id_chamado = $1
    `, [idChamado]);
    
    await client.query(`
      UPDATE chamados 
      SET data_resolucao = NOW(), id_usuario_resolucao = $1
      WHERE id_chamado = $2
    `, [analistaId, idChamado]);
    
    await pool.query(`
      INSERT INTO respostas_ia (
        fk_chamados_id_chamado, 
        tipo_resposta, 
        solucao_ia
      ) VALUES ($1, $2, $3)
    `, [
      idChamado, 
      'ANALISTA_RESOLUCAO', 
      'Chamado resolvido pelo analista'
    ]);
    
    await client.query('COMMIT');
    
    console.log('Chamado resolvido por analista:', idChamado, 'Analista:', analistaId);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao resolver chamado:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const escalarChamadoService = async (idChamado, analistaId, motivo) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      UPDATE status_chamado 
      SET descricao_status_chamado = 'Escalado'
      WHERE fk_chamados_id_chamado = $1
    `, [idChamado]);
    
    await client.query(`
      UPDATE chamados 
      SET data_escala = NOW()
      WHERE id_chamado = $1
    `, [idChamado]);
    
    await pool.query(`
      INSERT INTO respostas_ia (
        fk_chamados_id_chamado, 
        tipo_resposta, 
        solucao_ia
      ) VALUES ($1, $2, $3)
    `, [
      idChamado, 
      'ESCALONAMENTO', 
      `Chamado escalado para gerente. Motivo: ${motivo}`
    ]);
    
    await client.query('COMMIT');
    
    console.log('Chamado escalado:', idChamado, 'Analista:', analistaId, 'Motivo:', motivo);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao escalar chamado:', error);
    throw error;
  } finally {
    client.release();
  }
};
