import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DashboardStats } from '@/components/DashboardStats';
import { DashboardCharts } from '@/components/DashboardCharts';
import { AnalystChart } from '@/components/AnalystChart';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, ChevronDown, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface EstatisticasCompletas {
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

const Dashboard = () => {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloadando, setDownloadando] = useState(false);
  const { user } = useAuth();

  // Verificar permissões
  const isUsuarioComum = user?.perfil?.nivel_acesso === 1;

  // Função para buscar estatísticas completas
  const fetchEstatisticasCompletas = async (): Promise<EstatisticasCompletas> => {
    const response = await fetch('http://localhost:3001/api/estatisticas/relatorio-completo', {
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas');
    }

    const result = await response.json();
    return result.data || result;
  };

  // Funções auxiliares
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  const getPrioridadeTexto = (prioridade: number) => {
    const textos: Record<number, string> = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
    return textos[prioridade] || 'Não definida';
  };

  const downloadPDF = async () => {
    try {
      setDownloadando(true);
      const data = await fetchEstatisticasCompletas();

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246);
      pdf.text('RELATORIO DASHBOARD', pageWidth / 2, 25, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 35, { align: 'center' });
      pdf.text(`Por: ${(user as any)?.name || (user as any)?.nome_usuario || user?.email || 'Sistema'}`, pageWidth / 2, 45, { align: 'center' });

      let yPosition = 65;

      pdf.setFontSize(16);
      pdf.setTextColor(51, 51, 51);
      pdf.text('RESUMO EXECUTIVO', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(12);
      
      const ativos = data.estatisticas.por_status?.filter(s => s.status !== 'Resolvido' && s.status !== 'Fechado').reduce((sum, s) => sum + s.quantidade, 0) || 0;
      const resolvidos = data.estatisticas.por_status?.find(s => s.status === 'Resolvido')?.quantidade || 0;
      const taxaResolucao = data.estatisticas.total > 0 ? Math.round((resolvidos / data.estatisticas.total) * 100) : 0;
      
      pdf.text(`Total de Chamados: ${data.estatisticas.total}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`Chamados Ativos: ${ativos}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`Taxa de Resolução: ${resolvidos}/${data.estatisticas.total} (${taxaResolucao}%)`, 25, yPosition);
      yPosition += 20;

      //TABELA POR STATUS
      if (data.estatisticas.por_status?.length > 0) {
        pdf.setFontSize(14);
        pdf.text('DISTRIBUICAO POR STATUS', 20, yPosition);
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
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 10, 
            cellPadding: 5,
            font: 'helvetica'
          },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 20;
      }

      // Nova página se necessário
      if (yPosition > 220) {
        pdf.addPage();
        yPosition = 20;
      }

      //TABELA POR CATEGORIA
      if (data.estatisticas.por_categoria?.length > 0) {
        pdf.setFontSize(14);
        pdf.text('DISTRIBUIÃO POR CATEGORIA', 20, yPosition);
        yPosition += 10;

        const categoriaData = data.estatisticas.por_categoria.slice(0, 10).map(item => [
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
            fillColor: [16, 185, 129],
            textColor: 255,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 10, 
            cellPadding: 5,
            font: 'helvetica'
          },
          alternateRowStyles: { fillColor: [240, 253, 244] }
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 20;
      }

      //ANALISTAS
      if (data.estatisticas.analistas_produtivos?.length > 0) {
        pdf.addPage();
        yPosition = 20;

        pdf.setFontSize(14);
        pdf.text('DESEMPENHO DOS ANALISTAS', 20, yPosition);
        yPosition += 10;

        const totalAnalistas = data.estatisticas.analistas_produtivos.reduce((sum, a) => sum + a.resolvidos, 0);
        const analistasData = data.estatisticas.analistas_produtivos.map((item, index) => [
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
            fillColor: [139, 92, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          styles: { 
            fontSize: 10, 
            cellPadding: 5,
            font: 'helvetica'
          },
          alternateRowStyles: { fillColor: [248, 246, 255] }
        });
      }

      try {
        const totalPages = (pdf as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(128, 128, 128);
          pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 40, pdf.internal.pageSize.height - 10, { align: 'right' });
          pdf.text('Sistema de Chamados - Relatorio Confidencial', 20, pdf.internal.pageSize.height - 10);
        }
      } catch (footerError) {
        console.warn('Erro ao adicionar footer:', footerError);
      }

      // Salvar PDF
      pdf.save(`dashboard-relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error: any) {
      console.error(' Erro ao gerar PDF:', error);
      alert(`Erro ao gerar relatório PDF: ${error.message}`);
    } finally {
      setDownloadando(false);
      setShowDownloadMenu(false);
    }
  };

  const downloadExcel = async () => {
    try {
      setDownloadando(true);
      const data = await fetchEstatisticasCompletas();

      const workbook = XLSX.utils.book_new();

      // Aba 1: Resumo
      const resumoData = [
        ['Métrica', 'Valor'],
        ['Total de Chamados', data.estatisticas.total],
        ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
        ['Gerado por', (user as any)?.name || (user as any)?.nome_usuario || user?.email || 'Sistema'],
        ['', ''],
        ['DISTRIBUIÇÃO POR STATUS', ''],
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
          'Usuário': chamado.usuario_abertura || 'N/A',
          'Email': chamado.email_usuario || 'N/A',
          'Data Abertura': formatDate(chamado.data_abertura),
          'Data Resolução': chamado.data_resolucao ? formatDate(chamado.data_resolucao) : 'Não resolvido'
        }));

        const wsChamados = XLSX.utils.json_to_sheet(chamadosFormatados);
        XLSX.utils.book_append_sheet(workbook, wsChamados, 'Chamados');
      }

      //Estatísticas por Categoria
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

      // Desempenho Analistas
      if (data.estatisticas.analistas_produtivos?.length > 0) {
        const wsAnalistas = XLSX.utils.json_to_sheet(
          data.estatisticas.analistas_produtivos.map((item, index) => ({
            'Posição': `${index + 1}º`,
            'Analista': item.analista,
            'Chamados Resolvidos': item.resolvidos,
            'Participação %': `${Math.round((item.resolvidos / data.estatisticas.analistas_produtivos.reduce((sum, a) => sum + a.resolvidos, 0)) * 100)}%`
          }))
        );
        XLSX.utils.book_append_sheet(workbook, wsAnalistas, 'Analistas');
      }

      // Salvar Excel
      XLSX.writeFile(workbook, `dashboard-relatorio-${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error: any) {
      console.error(' Erro ao gerar Excel:', error);
      alert(`Erro ao gerar relatório Excel: ${error.message}`);
    } finally {
      setDownloadando(false);
      setShowDownloadMenu(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header />
        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Visão geral do sistema de chamados</p>
            </div>
            {!isUsuarioComum && (
              <div className="relative">
                <Button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={downloadando}
                  style={{
                    background: downloadando 
                      ? '#ff9966' 
                      : 'linear-gradient(to right, #ff9966, #ff8855)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!downloadando) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #ff8855, #ff7744)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!downloadando) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #ff9966, #ff8855)';
                    }
                  }}
                  className="text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                >
                  {downloadando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Relatório
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </Button>
                {showDownloadMenu && !downloadando && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                        Exportar como
                      </div>
                      
                      <button
                        onClick={downloadPDF}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">PDF</div>
                          <div className="text-xs text-gray-500">Relatório completo</div>
                        </div>
                      </button>

                      <button
                        onClick={downloadExcel}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Excel</div>
                          <div className="text-xs text-gray-500">Dados para análise</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isUsuarioComum && (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                <span className="inline-flex items-center gap-1">
                  <span>📊</span>
                  Visualização limitada
                </span>
              </div>
            )}
          </div>
          <DashboardStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <DashboardCharts />
            <AnalystChart />
          </div>
        </main>
      </div>

      {showDownloadMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDownloadMenu(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
