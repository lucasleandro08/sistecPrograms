import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ CORRIGIR: Declarar ambos os modelos
const TRIAGEM_MODEL = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const RESOLUCAO_MODEL = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
// Serviço de triagem de chamados
export const triagemChamado = async (chamadoData) => {
  try {
    console.log('🤖 Iniciando triagem IA para chamado:', chamadoData.id_chamado);
    
    const prompt = `
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
    `;

    const result = await TRIAGEM_MODEL.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🤖 Resposta bruta da triagem IA:', text);
    
    // Limpar o texto para extrair apenas o JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém JSON válido');
    }
    
    // Parse da resposta JSON
    const analise = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      analise,
      raw_response: text
    };
    
  } catch (error) {
    console.error('❌ Erro na triagem IA:', error);
    return {
      success: false,
      error: error.message,
      // Fallback para analista humano
      analise: {
        complexidade: 'MEDIA',
        indice_impacto_alcance: 'MEDIO',
        recomendacao: 'ANALISTA',
        justificativa: 'Erro na análise automática - encaminhando para analista humano',
        solucao_conhecida: false,
        tempo_estimado_minutos: 60,
        tags: ['erro_ia']
      }
    };
  }
};

// Serviço de resolução automática - MELHORADO
export const resolverChamado = async (chamadoData, analiseTriagem) => {
  try {
    console.log('🤖 Gerando solução IA para chamado:', chamadoData.id_chamado);
    
    const prompt = `
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
    `;

    // ✅ USAR O MODELO CORRETO
    const result = await RESOLUCAO_MODEL.generateContent(prompt);
    const response = await result.response;
    let solucao = response.text();
    
    // ✅ LIMITAR RESPOSTA SE MUITO LONGA
    if (solucao.length > 1200) {
      console.log('⚠️ Resposta muito longa, truncando...');
      solucao = solucao.substring(0, 1197) + '...';
    }
    
    console.log('🤖 Solução gerada (comprimento:', solucao.length, 'caracteres)');
    
    return {
      success: true,
      solucao,
      data_resposta: new Date().toISOString(),
      tipo_resposta: 'IA_RESOLUCAO'
    };
    
  } catch (error) {
    console.error('❌ Erro na resolução IA:', error);
    return {
      success: false,
      error: error.message,
      solucao: 'Não foi possível gerar uma solução automática. Este chamado será encaminhado para um analista humano.'
    };
  }
};

// Função para testar se a IA está funcionando
export const testarConexaoGemini = async () => {
  try {
    const prompt = "Responda apenas 'OK' se você está funcionando corretamente.";
    const result = await TRIAGEM_MODEL.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    return {
      success: text.includes('OK'),
      response: text
    };
  } catch (error) {
    console.error('❌ Erro ao testar conexão Gemini:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
