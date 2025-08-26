import {
  createChamadoService,
  getChamadosComDetalhesService,
  getChamadoByIdService,
  aprovarChamadoService,
  rejeitarChamadoService,
  getChamadosParaAprovacaoService,
  updateStatusChamadoService,
  resolverChamadoService,
  escalarChamadoService,
  getChamadosParaAnalistasService
} from '../models/chamado.js';
import { checkGestorChamadosOrAdmin, checkAnalistaOrAdmin } from '../middleware/authMiddleware.js';
import { testarConexaoGemini } from '../services/geminiService.js';
import pool from '../config/db.js';

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

const convertPrioridadeToNumber = (prioridadeString) => {
  const prioridadeMap = {
    'baixa': 1,
    'media': 2,
    'alta': 3,
    'urgente': 4
  };
  
  const prioridade = prioridadeString?.toLowerCase() || 'media';
  return prioridadeMap[prioridade] || 2;
};

export const createChamado = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    console.log('Criando chamado para usuário:', userLogado?.nome_usuario);
    console.log('Dados recebidos:', req.body);
    
    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }
    
    const dadosChamado = {
      ...req.body,
      id_usuario_abertura: userLogado.id_usuario,
      prioridade_chamado: convertPrioridadeToNumber(req.body.prioridade_chamado)
    };
    
    console.log('Dados após conversão:', dadosChamado);
    
    const chamado = await createChamadoService(dadosChamado);
    handleResponse(res, 201, 'Chamado criado com sucesso.', chamado);
    
  } catch (err) {
    console.error('Erro ao criar chamado:', err);
    next(err);
  }
};

export const getChamados = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }
    
    let chamados;
    
    if (userLogado.perfil.nivel_acesso === 1) {
      chamados = await getChamadosComDetalhesService({ 
        id_usuario: userLogado.id_usuario 
      });
    } else {
      chamados = await getChamadosComDetalhesService();
    }
    
    handleResponse(res, 200, 'Chamados obtidos com sucesso.', chamados);
    
  } catch (err) {
    console.error('Erro ao buscar chamados:', err);
    next(err);
  }
};

export const getChamadoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userLogado = req.user;
    
    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }
    
    const chamado = await getChamadoByIdService(id);
    
    if (!chamado) {
      return handleResponse(res, 404, 'Chamado não encontrado.');
    }
    
    if (userLogado.perfil.nivel_acesso === 1 && 
        chamado.id_usuario_abertura !== userLogado.id_usuario) {
      return handleResponse(res, 403, 'Você não tem permissão para ver este chamado.');
    }
    
    handleResponse(res, 200, 'Chamado obtido com sucesso.', chamado);
    
  } catch (err) {
    console.error('Erro ao buscar chamado:', err);
    next(err);
  }
};

export const getChamadosParaAprovacao = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    if (!checkGestorChamadosOrAdmin(userLogado)) {
      return handleResponse(res, 403, 'Apenas gestores podem aprovar chamados.');
    }
    
    const chamados = await getChamadosParaAprovacaoService();
    handleResponse(res, 200, 'Chamados para aprovação obtidos com sucesso.', chamados);
    
  } catch (err) {
    console.error('Erro ao buscar chamados para aprovação:', err);
    next(err);
  }
};

export const aprovarChamado = async (req, res, next) => {
  try {
    const userLogado = req.user;
    const { id_chamado } = req.params;
    
    console.log('Aprovando chamado:', id_chamado, 'por:', userLogado?.nome_usuario);
    
    if (!checkGestorChamadosOrAdmin(userLogado)) {
      return handleResponse(res, 403, 'Apenas gestores podem aprovar chamados.');
    }
    
    await aprovarChamadoService(id_chamado, userLogado.id_usuario);
    handleResponse(res, 200, 'Chamado aprovado e encaminhado para triagem IA.');
    
  } catch (err) {
    console.error('Erro ao aprovar chamado:', err);
    next(err);
  }
};

export const rejeitarChamado = async (req, res, next) => {
  try {
    const userLogado = req.user;
    const { id_chamado } = req.params;
    const { motivo } = req.body;
    
    console.log('Rejeitando chamado:', id_chamado, 'motivo:', motivo);
    
    if (!checkGestorChamadosOrAdmin(userLogado)) {
      return handleResponse(res, 403, 'Apenas gestores podem rejeitar chamados.');
    }
    
    if (!motivo || motivo.trim().length < 10) {
      return handleResponse(res, 400, 'Motivo da rejeição é obrigatório (mínimo 10 caracteres).');
    }
    
    await rejeitarChamadoService(id_chamado, motivo, userLogado.id_usuario);
    handleResponse(res, 200, 'Chamado rejeitado com sucesso.');
    
  } catch (err) {
    console.error('Erro ao rejeitar chamado:', err);
    next(err);
  }
};

export const getSolucaoIA = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const userLogado = req.user;

    console.log('Buscando solução IA para chamado:', id_chamado, 'usuário:', userLogado?.nome_usuario);

    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    const chamado = await getChamadoByIdService(id_chamado);
    if (!chamado) {
      console.log('Chamado não encontrado:', id_chamado);
      return handleResponse(res, 404, 'Chamado não encontrado.');
    }

    if (userLogado.perfil.nivel_acesso < 2 && chamado.id_usuario_abertura !== userLogado.id_usuario) {
      console.log('Sem permissão para ver chamado:', id_chamado);
      return handleResponse(res, 403, 'Sem permissão para ver este chamado.');
    }

    const result = await pool.query(`
      SELECT * FROM respostas_ia 
      WHERE fk_chamados_id_chamado = $1 AND tipo_resposta = 'SOLUCAO'
      ORDER BY data_resposta DESC 
      LIMIT 1
    `, [id_chamado]);

    console.log('Resultado da query respostas_ia:', {
      encontrados: result.rows.length,
      chamado: id_chamado
    });

    if (result.rows.length === 0) {
      console.log('Solução IA não encontrada para chamado:', id_chamado);
      return handleResponse(res, 404, 'Solução da IA não encontrada para este chamado.');
    }

    const solucao = result.rows[0];
    console.log('Solução encontrada:', {
      id: solucao.id_resposta_ia,
      tamanho: solucao.solucao_ia?.length || 0,
      data: solucao.data_resposta
    });

    handleResponse(res, 200, 'Solução da IA obtida com sucesso.', solucao);

  } catch (err) {
    console.error('Erro ao buscar solução IA:', err);
    next(err);
  }
};

export const feedbackSolucaoIA = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const { feedback } = req.body;
    const userLogado = req.user;

    console.log('Feedback da IA recebido:', { id_chamado, feedback, usuario: userLogado?.nome_usuario });

    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    if (!['DEU_CERTO', 'DEU_ERRADO'].includes(feedback)) {
      return handleResponse(res, 400, 'Feedback deve ser DEU_CERTO ou DEU_ERRADO.');
    }

    const chamado = await getChamadoByIdService(id_chamado);
    if (!chamado || chamado.id_usuario_abertura !== userLogado.id_usuario) {
      return handleResponse(res, 403, 'Você só pode dar feedback nos seus próprios chamados.');
    }

    await pool.query(`
      UPDATE respostas_ia 
      SET feedback_usuario = $1, data_feedback = NOW()
      WHERE fk_chamados_id_chamado = $2 AND tipo_resposta = 'SOLUCAO'
    `, [feedback, id_chamado]);

    if (feedback === 'DEU_CERTO') {
      await updateStatusChamadoService(id_chamado, 'Resolvido', userLogado.id_usuario);
      handleResponse(res, 200, 'Ótimo! Chamado marcado como resolvido.');
    } else {
      await updateStatusChamadoService(id_chamado, 'Com Analista');
      handleResponse(res, 200, 'Chamado encaminhado para analista humano.');
    }

  } catch (err) {
    console.error('Erro ao processar feedback:', err);
    next(err);
  }
};

export const resolverChamado = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const userLogado = req.user;

    console.log('Resolvendo chamado:', id_chamado, 'por analista:', userLogado?.nome_usuario);

    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    if (!checkAnalistaOrAdmin(userLogado)) {
      return handleResponse(res, 403, 'Apenas analistas podem resolver chamados.');
    }

    const chamado = await getChamadoByIdService(id_chamado);
    if (!chamado) {
      return handleResponse(res, 404, 'Chamado não encontrado.');
    }

    if (chamado.descricao_status_chamado !== 'Com Analista') {
      return handleResponse(res, 400, 'Apenas chamados "Com Analista" podem ser resolvidos.');
    }

    await resolverChamadoService(id_chamado, userLogado.id_usuario);
    handleResponse(res, 200, 'Chamado marcado como resolvido com sucesso.');

  } catch (err) {
    console.error('Erro ao resolver chamado:', err);
    next(err);
  }
};

export const escalarChamado = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const { motivo } = req.body;
    const userLogado = req.user;

    console.log('Escalando chamado:', id_chamado, 'por analista:', userLogado?.nome_usuario);

    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    if (!checkAnalistaOrAdmin(userLogado)) {
      return handleResponse(res, 403, 'Apenas analistas podem escalar chamados.');
    }

    if (!motivo || motivo.trim().length < 10) {
      return handleResponse(res, 400, 'Motivo do escalonamento deve ter pelo menos 10 caracteres.');
    }

    const chamado = await getChamadoByIdService(id_chamado);
    if (!chamado) {
      return handleResponse(res, 404, 'Chamado não encontrado.');
    }

    if (chamado.descricao_status_chamado !== 'Com Analista') {
      return handleResponse(res, 400, 'Apenas chamados "Com Analista" podem ser escalados.');
    }

    await escalarChamadoService(id_chamado, userLogado.id_usuario, motivo.trim());
    handleResponse(res, 200, 'Chamado escalado para gerente com sucesso.');

  } catch (err) {
    console.error('Erro ao escalar chamado:', err);
    next(err);
  }
};

export const getChamadosComAnalista = async (req, res, next) => {
  try {
    const userLogado = req.user;

    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    if (!checkAnalistaOrAdmin(userLogado)) {
      return handleResponse(res, 403, 'Apenas analistas podem ver esta lista.');
    }

    const chamados = await getChamadosParaAnalistasService();
    handleResponse(res, 200, 'Chamados com analista obtidos com sucesso.', chamados);

  } catch (err) {
    console.error('Erro ao buscar chamados com analista:', err);
    next(err);
  }
};

export const getChamadosEscalados = async (req, res, next) => {
  try {
    const userLogado = req.user;

    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    if (userLogado.perfil.nivel_acesso < 4) {
      return handleResponse(res, 403, 'Apenas gerentes podem ver chamados escalados.');
    }

    const chamados = await getChamadosComDetalhesService({ status: 'Escalado' });
    handleResponse(res, 200, 'Chamados escalados obtidos com sucesso.', chamados);

  } catch (err) {
    console.error('Erro ao buscar chamados escalados:', err);
    next(err);
  }
};

export const testarGemini = async (req, res, next) => {
  try {
    const userLogado = req.user;
    
    if (!userLogado || userLogado.perfil.nivel_acesso < 4) {
      return handleResponse(res, 403, 'Apenas administradores podem testar a IA.');
    }
    
    console.log('Testando conexão Gemini...');
    const resultado = await testarConexaoGemini();
    
    if (resultado.success) {
      handleResponse(res, 200, 'Conexão com Gemini funcionando!', resultado);
    } else {
      handleResponse(res, 500, 'Erro na conexão com Gemini.', resultado);
    }
    
  } catch (err) {
    console.error('Erro ao testar Gemini:', err);
    next(err);
  }
};

export const resolverChamadoEscalado = async (req, res, next) => {
  try {
    const { id_chamado } = req.params;
    const userLogado = req.user;

    console.log('Resolvendo chamado escalado:', id_chamado, 'por gerente:', userLogado?.nome_usuario);

    if (!userLogado) {
      return handleResponse(res, 401, 'Usuário não autenticado.');
    }

    if (userLogado.perfil.nivel_acesso < 3) {
      return handleResponse(res, 403, 'Apenas gerentes podem resolver chamados escalados.');
    }

    const chamado = await getChamadoByIdService(id_chamado);
    if (!chamado) {
      return handleResponse(res, 404, 'Chamado não encontrado.');
    }

    if (chamado.descricao_status_chamado !== 'Escalado') {
      return handleResponse(res, 400, 'Apenas chamados "Escalado" podem ser resolvidos por gerentes.');
    }

    await resolverChamadoService(id_chamado, userLogado.id_usuario);
    handleResponse(res, 200, 'Chamado escalado resolvido com sucesso.');

  } catch (err) {
    console.error('Erro ao resolver chamado escalado:', err);
    next(err);
  }
};
