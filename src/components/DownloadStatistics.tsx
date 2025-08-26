import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { CSVLink } from 'react-csv';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';

interface DownloadStatisticsProps {
  chartRefs: {
    barChart: React.RefObject<HTMLDivElement>;
    pieChart: React.RefObject<HTMLDivElement>;
    lineChart: React.RefObject<HTMLDivElement>;
    analystChart: React.RefObject<HTMLDivElement>;
  };
}

export const DownloadStatistics: React.FC<DownloadStatisticsProps> = ({ chartRefs }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadData, setDownloadData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const csvLinkRef = useRef<any>(null);
  const { user } = useAuth();

  const fetchDetailedStatistics = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('http://localhost:3001/api/estatisticas/download-completo', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const prepareCSVData = (data: any[]) => {
    const headers = [
      'ID Chamado',
      'Título',
      'Categoria', 
      'Problema',
      'Status',
      'Prioridade',
      'Usuário Abertura',
      'Data Abertura',
      'Analista Responsável',
      'Data Resolução',
      'Tempo Resolução (dias)',
      'Motivo Abertura'
    ];

    const rows = data.map(item => [
      item.id_chamado,
      item.titulo_chamado || 'Sem título',
      item.descricao_categoria_chamado || 'N/A',
      item.descricao_problema_chamado || 'N/A',
      item.descricao_status_chamado || 'N/A',
      item.prioridade_texto || 'N/A',
      item.usuario_abertura || 'N/A',
      new Date(item.data_abertura).toLocaleDateString('pt-BR'),
      item.analista_responsavel || 'N/A',
      item.data_resolucao ? new Date(item.data_resolucao).toLocaleDateString('pt-BR') : 'Não resolvido',
      item.tempo_resolucao_dias || 0,
      item.motivo_abertura || 'Não informado'
    ]);

    return [headers, ...rows];
  };

  const handleDownloadCSV = async () => {
    const data = await fetchDetailedStatistics();
    const csvData = prepareCSVData(data);
    setDownloadData(csvData);
    
    setTimeout(() => {
      if (csvLinkRef.current) {
        csvLinkRef.current.link.click();
      }
    }, 100);
  };

  const downloadChartImage = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!chartRef.current) return;

    try {
      setIsLoading(true);
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      alert(`Gráfico ${filename} baixado com sucesso!`);
    } catch (error) {
      console.error('Erro ao baixar gráfico:', error);
      alert('Erro ao baixar gráfico');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllChartsAsPDF = async () => {
    try {
      setIsLoading(true);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.setFontSize(20);
      pdf.text('Relatório de Estatísticas - Chamados', pageWidth / 2, 20, { align: 'center' });
      
      pdf.text(`Por: ${user?.name || 'Sistema'}`, pageWidth / 2, 40, { align: 'center' });
      let yPosition = 60;

      const charts = [
        { ref: chartRefs.barChart, title: 'Chamados por Mês' },
        { ref: chartRefs.pieChart, title: 'Chamados por Categoria' },
        { ref: chartRefs.lineChart, title: 'Tendência Anual' },
        { ref: chartRefs.analystChart, title: 'Chamados por Analista' }
      ];

      for (const chart of charts) {
        if (chart.ref.current) {
          const canvas = await html2canvas(chart.ref.current, {
            backgroundColor: '#ffffff',
            scale: 1.5
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(14);
          pdf.text(chart.title, 20, yPosition);
          yPosition += 10;

          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 20;
        }
      }

      pdf.save('relatorio-estatisticas-chamados.pdf');
      alert('Relatório PDF baixado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar relatório PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={isLoading}
      >
        <Download className="w-4 h-4 mr-2" />
        Downloads
      </Button>

      <CSVLink
        data={downloadData}
        filename={`estatisticas-chamados-${new Date().toISOString().split('T')[0]}.csv`}
        className="hidden"
        ref={csvLinkRef}
        separator=";"
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="bg-green-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Downloads e Relatórios
                </h3>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-green-700"
                  disabled={isLoading}
                >
                  ×
                </Button>
              </div>
              <p className="text-green-100 text-sm mt-1">
                Baixe dados e gráficos das estatísticas de chamados
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Dados Detalhados
                </h4>
                <div className="grid gap-3">
                  <Button
                    onClick={handleDownloadCSV}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isLoading ? 'Preparando...' : 'Baixar Planilha CSV (Dados Completos)'}
                  </Button>
                  <p className="text-xs text-gray-500 ml-6">
                    Inclui: ID, título, categoria, status, responsável, datas, tempo de resolução
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Image className="w-5 h-5 text-purple-600" />
                  Gráficos Individuais (PNG)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => downloadChartImage(chartRefs.barChart, 'chamados-por-mes')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="justify-start text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Chamados/Mês
                  </Button>
                  
                  <Button
                    onClick={() => downloadChartImage(chartRefs.pieChart, 'chamados-por-categoria')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="justify-start text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                  >
                    <PieChart className="w-4 h-4 mr-2" />
                    Por Categoria
                  </Button>
                  
                  <Button
                    onClick={() => downloadChartImage(chartRefs.lineChart, 'tendencia-anual')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="justify-start text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Tendência Anual
                  </Button>
                  
                  <Button
                    onClick={() => downloadChartImage(chartRefs.analystChart, 'chamados-por-analista')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="justify-start text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Por Analista
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Relatório Completo
                </h4>
                <Button
                  onClick={downloadAllChartsAsPDF}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isLoading ? 'Gerando PDF...' : 'Baixar Relatório PDF (Todos os Gráficos)'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Relatório completo com todos os gráficos em formato PDF
                </p>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Processando...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
