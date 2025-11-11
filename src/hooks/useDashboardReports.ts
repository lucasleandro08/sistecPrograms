/**
 * @fileoverview Hook de Relatórios do Dashboard
 * 
 * Hook customizado que gerencia geração de relatórios (PDF e Excel).
 * 
 * Heurísticas de Nielsen aplicadas:
 * - #1: Visibilidade do status (loading, progress feedback)
 * - #5: Prevenção de erros (validação de dados, error handling)
 * - #9: Recuperação de erros (mensagens claras de erro)
 * 
 * @module hooks/useDashboardReports
 */

import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Estrutura de estatísticas completas
 */
export interface EstatisticasCompletas {
  chamados: Array<{
    id_chamado: number;
    descricao_categoria_chamado: string;
    descricao_problema_chamado: string;
    descricao_status_chamado: string;
    prioridade_chamado: number;
    data_abertura: string;
    data_resolucao?: string;
    usuario_abertura: string;
    email_usuario: string;
  }>;
  estatisticas: {
    total: number;
    por_status: Array<{ status: string; quantidade: number }>;
    por_categoria: Array<{ categoria: string; quantidade: number }>;
    por_prioridade: Array<{ prioridade: string; quantidade: number }>;
    analistas_produtivos: Array<{ analista: string; resolvidos: number }>;
  };
}

/**
 * Estado do hook
 */
export interface DashboardReportsState {
  isGenerating: boolean;
  showMenu: boolean;
  error: string | null;
}

/**
 * Ações do hook
 */
export interface DashboardReportsActions {
  toggleMenu: () => void;
  closeMenu: () => void;
  generatePDF: () => Promise<void>;
  generateExcel: () => Promise<void>;
}

/**
 * Retorno do hook
 */
export interface UseDashboardReportsReturn {
  state: DashboardReportsState;
  actions: DashboardReportsActions;
}

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Configurações da API
 * @constant {Object}
 */
const API_CONFIG = Object.freeze({
  BASE_URL: 'http://localhost:3001',
  ENDPOINT: '/api/estatisticas/relatorio-completo'
});

/**
 * Configurações de cores para PDF
 * @constant {Object}
 */
const PDF_COLORS = Object.freeze({
  PRIMARY: [59, 130, 246] as [number, number, number],
  SUCCESS: [16, 185, 129] as [number, number, number],
  PURPLE: [139, 92, 246] as [number, number, number],
  TEXT_DARK: [51, 51, 51] as [number, number, number],
  TEXT_LIGHT: [128, 128, 128] as [number, number, number],
  WHITE: 255
});

/**
 * Textos do PDF
 * @constant {Object}
 */
const PDF_TEXT = Object.freeze({
  TITLE: 'RELATORIO DASHBOARD',
  EXECUTIVE_SUMMARY: 'RESUMO EXECUTIVO',
  BY_STATUS: 'DISTRIBUICAO POR STATUS',
  BY_CATEGORY: 'DISTRIBUICAO POR CATEGORIA',
  ANALYSTS: 'DESEMPENHO DOS ANALISTAS',
  FOOTER_LEFT: 'Sistema de Chamados - Relatorio Confidencial',
  TOTAL_TICKETS: 'Total de Chamados',
  ACTIVE_TICKETS: 'Chamados Ativos',
  RESOLUTION_RATE: 'Taxa de Resolucao'
});

/**
 * Mapeamento de prioridades
 * @constant {Object}
 */
const PRIORITY_MAP: Record<number, string> = Object.freeze({
  1: 'Baixa',
  2: 'Media',
  3: 'Alta',
  4: 'Urgente'
});

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Formata data para exibição
 * @private
 * @param {string} dateString - Data em formato ISO
 * @returns {string} Data formatada
 */
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('pt-BR');
  } catch {
    return 'Data invalida';
  }
};

/**
 * Converte código de prioridade para texto
 * @private
 * @param {number} prioridade - Código da prioridade
 * @returns {string} Texto da prioridade
 */
const getPrioridadeTexto = (prioridade: number): string => {
  return PRIORITY_MAP[prioridade] || 'Nao definida';
};

/**
 * Calcula taxa de resolução
 * @private
 * @param {EstatisticasCompletas['estatisticas']} stats - Estatísticas
 * @returns {Object} Métricas calculadas
 */
const calculateMetrics = (stats: EstatisticasCompletas['estatisticas']) => {
  const ativos = stats.por_status
    ?.filter(s => s.status !== 'Resolvido' && s.status !== 'Fechado')
    .reduce((sum, s) => sum + s.quantidade, 0) || 0;
  
  const resolvidos = stats.por_status
    ?.find(s => s.status === 'Resolvido')?.quantidade || 0;
  
  const taxaResolucao = stats.total > 0 
    ? Math.round((resolvidos / stats.total) * 100) 
    : 0;

  return { ativos, resolvidos, taxaResolucao };
};

/**
 * Gera nome de arquivo com timestamp
 * @private
 * @param {string} extension - Extensão do arquivo
 * @returns {string} Nome do arquivo
 */
const generateFileName = (extension: string): string => {
  const date = new Date().toISOString().split('T')[0];
  return `dashboard-relatorio-${date}.${extension}`;
};

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook que gerencia geração de relatórios do dashboard
 * 
 * Fornece funções para gerar relatórios em PDF e Excel,
 * com feedback de loading e tratamento de erros.
 * 
 * @returns {UseDashboardReportsReturn} Estado e ações do hook
 * 
 * @example
 * function DashboardPage() {
 *   const { state, actions } = useDashboardReports();
 *   
 *   return (
 *     <div>
 *       <Button onClick={actions.toggleMenu}>
 *         Relatório
 *       </Button>
 *       {state.showMenu && (
 *         <Menu>
 *           <MenuItem onClick={actions.generatePDF}>PDF</MenuItem>
 *           <MenuItem onClick={actions.generateExcel}>Excel</MenuItem>
 *         </Menu>
 *       )}
 *       {state.isGenerating && <Loading />}
 *     </div>
 *   );
 * }
 */
export const useDashboardReports = (): UseDashboardReportsReturn => {
  const [state, setState] = useState<DashboardReportsState>({
    isGenerating: false,
    showMenu: false,
    error: null
  });
  
  const { user } = useAuth();

  /**
   * Busca estatísticas completas da API
   */
  const fetchEstatisticasCompletas = useCallback(async (): Promise<EstatisticasCompletas> => {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`Erro ao buscar estatísticas do servidor: ${response.status}`);
    }

    const result = await response.json();
    
    // Validar estrutura de resposta
    if (!result.data && !result.chamados) {
      throw new Error('Resposta da API com formato inválido');
    }
    
    return result.data || result;
  }, [user?.email]);

  /**
   * Alterna visibilidade do menu
   */
  const toggleMenu = useCallback((): void => {
    setState(prev => ({ ...prev, showMenu: !prev.showMenu }));
  }, []);

  /**
   * Fecha o menu
   */
  const closeMenu = useCallback((): void => {
    setState(prev => ({ ...prev, showMenu: false }));
  }, []);

  /**
   * Gera relatório PDF
   */
  const generatePDF = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const data = await fetchEstatisticasCompletas();
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;

      // Título
      pdf.setFontSize(24);
      pdf.setTextColor(...PDF_COLORS.PRIMARY);
      pdf.text(PDF_TEXT.TITLE, pageWidth / 2, 25, { align: 'center' });

      // Metadados
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const now = new Date();
      pdf.text(
        `Gerado em: ${now.toLocaleDateString('pt-BR')} as ${now.toLocaleTimeString('pt-BR')}`,
        pageWidth / 2,
        35,
        { align: 'center' }
      );
      pdf.text(
        `Por: ${user?.name || user?.email || 'Sistema'}`,
        pageWidth / 2,
        45,
        { align: 'center' }
      );

      let yPosition = 65;

      // Resumo Executivo
      pdf.setFontSize(16);
      pdf.setTextColor(...PDF_COLORS.TEXT_DARK);
      pdf.text(PDF_TEXT.EXECUTIVE_SUMMARY, 20, yPosition);
      yPosition += 15;

      const metrics = calculateMetrics(data.estatisticas);
      pdf.setFontSize(12);
      pdf.text(`${PDF_TEXT.TOTAL_TICKETS}: ${data.estatisticas.total}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`${PDF_TEXT.ACTIVE_TICKETS}: ${metrics.ativos}`, 25, yPosition);
      yPosition += 8;
      pdf.text(
        `${PDF_TEXT.RESOLUTION_RATE}: ${metrics.resolvidos}/${data.estatisticas.total} (${metrics.taxaResolucao}%)`,
        25,
        yPosition
      );
      yPosition += 20;

      // Tabela por Status
      if (data.estatisticas.por_status?.length > 0) {
        pdf.setFontSize(14);
        pdf.text(PDF_TEXT.BY_STATUS, 20, yPosition);
        yPosition += 10;

        const statusData = data.estatisticas.por_status.map(item => [
          item.status || 'N/A',
          item.quantidade.toString(),
          `${Math.round((item.quantidade / data.estatisticas.total) * 100)}%`
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Status', 'Quantidade', 'Percentual']],
          body: statusData,
          theme: 'striped',
          headStyles: {
            fillColor: PDF_COLORS.PRIMARY,
            textColor: PDF_COLORS.WHITE,
            fontStyle: 'bold'
          },
          styles: { fontSize: 10, cellPadding: 5 },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 20;
      }

      // Nova página se necessário
      if (yPosition > 220) {
        pdf.addPage();
        yPosition = 20;
      }

      // Tabela por Categoria
      if (data.estatisticas.por_categoria?.length > 0) {
        pdf.setFontSize(14);
        pdf.text(PDF_TEXT.BY_CATEGORY, 20, yPosition);
        yPosition += 10;

        const categoriaData = data.estatisticas.por_categoria
          .slice(0, 10)
          .map(item => [
            item.categoria || 'N/A',
            item.quantidade.toString(),
            `${Math.round((item.quantidade / data.estatisticas.total) * 100)}%`
          ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Categoria', 'Quantidade', 'Percentual']],
          body: categoriaData,
          theme: 'striped',
          headStyles: {
            fillColor: PDF_COLORS.SUCCESS,
            textColor: PDF_COLORS.WHITE,
            fontStyle: 'bold'
          },
          styles: { fontSize: 10, cellPadding: 5 },
          alternateRowStyles: { fillColor: [240, 253, 244] }
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 20;
      }

      // Analistas (nova página)
      if (data.estatisticas.analistas_produtivos?.length > 0) {
        pdf.addPage();
        yPosition = 20;

        pdf.setFontSize(14);
        pdf.text(PDF_TEXT.ANALYSTS, 20, yPosition);
        yPosition += 10;

        const totalAnalistas = data.estatisticas.analistas_produtivos
          .reduce((sum, a) => sum + a.resolvidos, 0);

        const analistasData = data.estatisticas.analistas_produtivos
          .map((item, index) => [
            `${index + 1}`,
            item.analista || 'N/A',
            item.resolvidos.toString(),
            `${Math.round((item.resolvidos / totalAnalistas) * 100)}%`
          ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Posicao', 'Analista', 'Resolvidos', 'Participacao']],
          body: analistasData,
          theme: 'striped',
          headStyles: {
            fillColor: PDF_COLORS.PURPLE,
            textColor: PDF_COLORS.WHITE,
            fontStyle: 'bold'
          },
          styles: { fontSize: 10, cellPadding: 5 },
          alternateRowStyles: { fillColor: [248, 246, 255] }
        });
      }

      // Rodapés
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(...PDF_COLORS.TEXT_LIGHT);
        pdf.text(
          `Pagina ${i} de ${totalPages}`,
          pageWidth - 40,
          pdf.internal.pageSize.height - 10,
          { align: 'right' }
        );
        pdf.text(
          PDF_TEXT.FOOTER_LEFT,
          20,
          pdf.internal.pageSize.height - 10
        );
      }

      // Salvar PDF
      pdf.save(generateFileName('pdf'));

      setState(prev => ({ ...prev, isGenerating: false, showMenu: false }));
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: `Erro ao gerar relatorio PDF: ${error.message}`
      }));
      alert(`Erro ao gerar relatório PDF: ${error.message}`);
    }
  }, [fetchEstatisticasCompletas, user]);

  /**
   * Gera relatório Excel
   */
  const generateExcel = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const data = await fetchEstatisticasCompletas();
      const workbook = XLSX.utils.book_new();

      // Aba 1: Resumo
      const resumoData = [
        ['Metrica', 'Valor'],
        ['Total de Chamados', data.estatisticas.total],
        ['Data do Relatorio', new Date().toLocaleDateString('pt-BR')],
        ['Gerado por', user?.name || user?.email || 'Sistema'],
        ['', ''],
        ['DISTRIBUICAO POR STATUS', ''],
        ...data.estatisticas.por_status.map(item => [item.status, item.quantidade])
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(workbook, wsResumo, 'Resumo');

      // Aba 2: Chamados Detalhados
      if (data.chamados?.length > 0) {
        const chamadosFormatados = data.chamados.map(chamado => ({
          'ID': chamado.id_chamado,
          'Categoria': chamado.descricao_categoria_chamado || 'N/A',
          'Problema': chamado.descricao_problema_chamado || 'N/A',
          'Status': chamado.descricao_status_chamado || 'N/A',
          'Prioridade': getPrioridadeTexto(chamado.prioridade_chamado),
          'Usuario': chamado.usuario_abertura || 'N/A',
          'Email': chamado.email_usuario || 'N/A',
          'Data Abertura': formatDate(chamado.data_abertura),
          'Data Resolucao': chamado.data_resolucao
            ? formatDate(chamado.data_resolucao)
            : 'Nao resolvido'
        }));

        const wsChamados = XLSX.utils.json_to_sheet(chamadosFormatados);
        XLSX.utils.book_append_sheet(workbook, wsChamados, 'Chamados');
      }

      // Aba 3: Estatísticas por Categoria
      if (data.estatisticas.por_categoria?.length > 0) {
        const wsCategoria = XLSX.utils.json_to_sheet(
          data.estatisticas.por_categoria.map(item => ({
            'Categoria': item.categoria,
            'Quantidade': item.quantidade,
            'Percentual': `${Math.round((item.quantidade / data.estatisticas.total) * 100)}%`
          }))
        );
        XLSX.utils.book_append_sheet(workbook, wsCategoria, 'Por Categoria');
      }

      // Aba 4: Desempenho Analistas
      if (data.estatisticas.analistas_produtivos?.length > 0) {
        const totalAnalistas = data.estatisticas.analistas_produtivos
          .reduce((sum, a) => sum + a.resolvidos, 0);

        const wsAnalistas = XLSX.utils.json_to_sheet(
          data.estatisticas.analistas_produtivos.map((item, index) => ({
            'Posicao': `${index + 1}º`,
            'Analista': item.analista,
            'Chamados Resolvidos': item.resolvidos,
            'Participacao %': `${Math.round((item.resolvidos / totalAnalistas) * 100)}%`
          }))
        );
        XLSX.utils.book_append_sheet(workbook, wsAnalistas, 'Analistas');
      }

      // Salvar Excel
      XLSX.writeFile(workbook, generateFileName('xlsx'));

      setState(prev => ({ ...prev, isGenerating: false, showMenu: false }));
    } catch (error: any) {
      console.error('Erro ao gerar Excel:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: `Erro ao gerar relatorio Excel: ${error.message}`
      }));
      alert(`Erro ao gerar relatório Excel: ${error.message}`);
    }
  }, [fetchEstatisticasCompletas, user]);

  return {
    state,
    actions: {
      toggleMenu,
      closeMenu,
      generatePDF,
      generateExcel
    }
  };
};
