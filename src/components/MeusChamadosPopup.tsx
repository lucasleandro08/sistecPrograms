import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface Chamado {
  id_chamado: number;
  descricao_categoria_chamado: string;
  descricao_problema_chamado: string;
  descricao_status_chamado: string;
  prioridade_chamado: number;
  prioridade_string?: string;
  data_abertura: string;
  data_aprovacao_recusa?: string;
  data_resolucao?: string;
  usuario_abertura: string;
  email_usuario?: string;
  descricao_detalhada?: string;
  titulo_chamado?: string;
  motivo_reprovacao?: string;
}

interface SolucaoIA {
  id_resposta_ia: number;
  fk_chamados_id_chamado: number;
  tipo_resposta: string;
  analise_triagem: any;
  solucao_ia: string;
  data_resposta: string;
  feedback_usuario?: string;
  data_feedback?: string;
}

interface MeusChamadosPopupProps {
  onClose: () => void;
}

export const MeusChamadosPopup = ({ onClose }: MeusChamadosPopupProps) => {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [solucaoIA, setSolucaoIA] = useState<SolucaoIA | null>(null);
  const [showSolucaoIA, setShowSolucaoIA] = useState(false);
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [loadingSolucao, setLoadingSolucao] = useState(false);
  const { user } = useAuth();

  // MutationObserver para forçar z-index do alertbox
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'alertbox-force-zindex-meus-chamados';
    style.innerHTML = `
      .alertBoxBody,
      .alertBoxBody *,
      div[class*="alert"],
      div[id*="alert"] {
        z-index: 2147483647 !important;
      }
    `;
    
    const oldStyle = document.getElementById('alertbox-force-zindex-meus-chamados');
    if (!oldStyle) {
      document.head.appendChild(style);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const alertElements = [
              node.querySelector('.alertBoxBody'),
              node.querySelector('[class*="alertBox"]'),
              node.querySelector('[id*="alertBox"]'),
              node.classList?.contains('alertBoxBody') ? node : null,
            ].filter(Boolean);

            alertElements.forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.zIndex = '2147483647';
                el.style.position = 'fixed';
                el.style.top = '0';
                el.style.left = '0';
                el.style.width = '100%';
                el.style.height = '100%';
                
                const children = el.querySelectorAll('*');
                children.forEach((child) => {
                  if (child instanceof HTMLElement) {
                    child.style.zIndex = '2147483647';
                  }
                });
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Função auxiliar para exibir alertas
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    if (typeof window !== 'undefined' && (window as any).alertbox) {
      const config = {
        success: { alertIcon: 'success' as const, title: 'Sucesso!', themeColor: '#16a34a', btnColor: '#16a34a' },
        error: { alertIcon: 'error' as const, title: 'Erro!', themeColor: '#dc2626', btnColor: '#dc2626' },
        warning: { alertIcon: 'warning' as const, title: 'Atenção!', themeColor: '#ea580c', btnColor: '#ea580c' },
        info: { alertIcon: 'info' as const, title: 'Informação', themeColor: '#3b82f6', btnColor: '#3b82f6' }
      };
      
      (window as any).alertbox.render({
        ...config[type],
        message: message,
        btnTitle: 'Ok',
        border: true
      });

      setTimeout(() => {
        const alertBox = document.querySelector('.alertBoxBody') || 
                        document.querySelector('[class*="alertBox"]') ||
                        document.querySelector('[id*="alertBox"]');
        
        if (alertBox instanceof HTMLElement) {
          alertBox.style.zIndex = '2147483647';
          alertBox.style.position = 'fixed';
          
          const mainContainer = alertBox.querySelector('[class*="container"]') ||
                               alertBox.querySelector('[class*="content"]') ||
                               alertBox.querySelector('[class*="box"]') ||
                               alertBox.children[0];
          
          if (mainContainer instanceof HTMLElement) {
            mainContainer.style.paddingBottom = '80px';
            mainContainer.style.position = 'relative';
            mainContainer.style.minHeight = '280px';
            mainContainer.style.minWidth = '450px';
            mainContainer.style.maxWidth = '550px';
            mainContainer.style.padding = '32px 40px 80px 40px';
            mainContainer.style.borderRadius = '12px';
          }
          
          const buttonContainer = alertBox.querySelector('[class*="footer"]') ||
                                 alertBox.querySelector('[class*="action"]') ||
                                 alertBox.querySelector('button')?.parentElement;
          
          if (buttonContainer instanceof HTMLElement) {
            buttonContainer.style.position = 'absolute';
            buttonContainer.style.bottom = '28px';
            buttonContainer.style.left = '50%';
            buttonContainer.style.transform = 'translateX(-50%)';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.alignItems = 'center';
            buttonContainer.style.width = 'auto';
            buttonContainer.style.zIndex = '10';
          }
          
          const button = alertBox.querySelector('button') || 
                        alertBox.querySelector('[class*="btn"]');
          
          if (button instanceof HTMLElement) {
            button.style.position = 'relative';
            button.style.backgroundColor = config[type].btnColor;
            button.style.color = '#ffffff';
            button.style.border = 'none';
            button.style.borderRadius = '8px';
            button.style.padding = '12px 40px';
            button.style.fontSize = '15px';
            button.style.fontWeight = '600';
            button.style.cursor = 'pointer';
            button.style.minWidth = '140px';
            button.style.transition = 'all 0.2s ease';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            button.style.margin = '0';
            
            button.addEventListener('mouseenter', () => {
              button.style.opacity = '0.9';
              button.style.transform = 'translateY(-1px)';
              button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
            });
            
            button.addEventListener('mouseleave', () => {
              button.style.opacity = '1';
              button.style.transform = 'translateY(0)';
              button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
          }
          
          const allElements = alertBox.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.zIndex = '2147483647';
            }
          });
        }
      }, 50);
      
    } else {
      alert(message);
    }
  };

  const fetchMeusChamados = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Buscando chamados do usuário:', user?.email);

      if (!user?.email) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('http://localhost:3001/api/chamados', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        },
      });

      console.log('Resposta da API chamados:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      const chamadosData = Array.isArray(data.data) ? data.data : [];
      setChamados(chamadosData);
      
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const buscarSolucaoIA = async (idChamado: number) => {
    try {
      setLoadingSolucao(true);
      console.log('Buscando solução IA para chamado:', idChamado);

      const response = await fetch(`http://localhost:3001/api/chamados/${idChamado}/solucao-ia`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Solução IA recebida:', data.data);
        setSolucaoIA(data.data);
        setShowSolucaoIA(true);
      } else {
        const errorData = await response.json();
        showAlert('error', `Erro ao buscar solução: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao buscar solução IA:', error);
      showAlert('error', 'Erro de conexão ao buscar solução da IA');
    } finally {
      setLoadingSolucao(false);
    }
  };

  const enviarFeedbackIA = async (feedback: 'DEU_CERTO' | 'DEU_ERRADO') => {
    if (!solucaoIA) return;

    try {
      setEnviandoFeedback(true);
      console.log('Enviando feedback:', feedback, 'para chamado:', solucaoIA.fk_chamados_id_chamado);

      const response = await fetch(`http://localhost:3001/api/chamados/${solucaoIA.fk_chamados_id_chamado}/feedback-ia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({ feedback }),
      });

      setShowSolucaoIA(false);
      setSolucaoIA(null);
      setEnviandoFeedback(false);

      setTimeout(() => {
        if (response.ok) {
          if (feedback === 'DEU_CERTO') {
            showAlert('success', 'Ótimo! Seu chamado foi marcado como resolvido.');
          } else {
            showAlert('info', 'Seu chamado foi encaminhado para um analista humano que entrará em contato.');
          }
          fetchMeusChamados();
        } else {
          response.json().then(errorData => {
            showAlert('error', errorData.message || 'Erro ao enviar feedback');
          }).catch(() => {
            showAlert('error', 'Erro ao enviar feedback');
          });
        }
      }, 100);

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      
      setShowSolucaoIA(false);
      setSolucaoIA(null);
      setEnviandoFeedback(false);

      setTimeout(() => {
        showAlert('error', 'Erro de conexão ao enviar feedback');
      }, 100);
    }
  };

  useEffect(() => {
    console.log('Componente montado, usuário:', user);
    if (user?.email) {
      fetchMeusChamados();
    } else {
      setError('Usuário não encontrado');
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Data não disponível';
      return new Date(dateString).toLocaleString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status || status === null || status === undefined) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (status.toLowerCase()) {
      case 'aberto':
        return 'bg-blue-100 text-blue-800';
      case 'aprovado':
        return 'bg-green-100 text-green-800';
      case 'rejeitado':
        return 'bg-red-100 text-red-800';
      case 'triagem ia':
        return 'bg-purple-100 text-purple-800';
      case 'aguardando resposta':
        return 'bg-yellow-100 text-yellow-800';
      case 'com analista':
        return 'bg-orange-100 text-orange-800';
      case 'resolvido':
        return 'bg-emerald-100 text-emerald-800';
      case 'fechado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status || status === null || status === undefined) {
      return <AlertCircle className="w-4 h-4" />;
    }
    
    switch (status.toLowerCase()) {
      case 'aberto':
        return <Clock className="w-4 h-4" />;
      case 'aprovado':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejeitado':
        return <XCircle className="w-4 h-4" />;
      case 'aguardando resposta':
        return <Clock className="w-4 h-4" />;
      case 'resolvido':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPrioridadeColor = (prioridade: number) => {
    switch (prioridade) {
      case 1:
        return 'bg-blue-100 text-blue-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      case 4:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadeTexto = (prioridade: number) => {
    const textos: Record<number, string> = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
    return textos[prioridade] || 'Não definida';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* MODAL PRINCIPAL */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* CABEÇALHO FIXO */}
        <div className="bg-gray-900 text-white p-6 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Meus Chamados</h2>
              <span className="text-orange-400">| Histórico de Solicitações</span>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* CONTEÚDO ROLÁVEL */}
        <div className="p-6 overflow-y-auto flex-1">

          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Carregando seus chamados...</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-semibold">Erro ao carregar chamados:</p>
              <p>{error}</p>
              <Button 
                onClick={fetchMeusChamados} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {chamados.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum chamado encontrado
                  </h3>
                  <p className="text-gray-500">
                    Você ainda não abriu nenhum chamado
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {chamados.map((chamado) => (
                    <div
                      key={chamado.id_chamado}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            Chamado #{chamado.id_chamado}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chamado.descricao_status_chamado || '')}`}>
                            {getStatusIcon(chamado.descricao_status_chamado || '')}
                            {chamado.descricao_status_chamado || 'Status não informado'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(chamado.prioridade_chamado)}`}>
                            {getPrioridadeTexto(chamado.prioridade_chamado)}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">
                            <strong>Categoria:</strong> {chamado.descricao_categoria_chamado || 'Não informado'}
                          </p>
                          <p className="text-gray-600">
                            <strong>Problema:</strong> {chamado.descricao_problema_chamado || 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <strong>Aberto em:</strong> {formatDate(chamado.data_abertura)}
                          </p>
                          {chamado.data_resolucao && (
                            <p className="text-gray-600 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              <strong>Resolvido em:</strong> {formatDate(chamado.data_resolucao)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          {chamado.descricao_status_chamado === 'Aguardando Resposta' && (
                            <Button
                              onClick={() => buscarSolucaoIA(chamado.id_chamado)}
                              disabled={loadingSolucao}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                            >
                              {loadingSolucao ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Buscando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  🤖 Ver Solução IA
                                </>
                              )}
                            </Button>
                          )}
                          
                          {chamado.descricao_status_chamado === 'Aguardando Resposta' && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                              💡 Solução disponível!
                            </span>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => setSelectedChamado(chamado)}
                          variant="outline"
                          size="sm"
                          className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {selectedChamado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* CABEÇALHO FIXO */}
            <div className="bg-gray-800 text-white p-4 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  Detalhes do Chamado #{selectedChamado.id_chamado}
                </h3>
                <Button
                  onClick={() => setSelectedChamado(null)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* CONTEÚDO ROLÁVEL */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedChamado.descricao_status_chamado || '')}`}>
                    {getStatusIcon(selectedChamado.descricao_status_chamado || '')}
                    {selectedChamado.descricao_status_chamado || 'Status não informado'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(selectedChamado.prioridade_chamado)}`}>
                    {getPrioridadeTexto(selectedChamado.prioridade_chamado)}
                  </span>
                </div>
              </div>

              {/* MOTIVO DE REPROVAÇÃO */}
              {selectedChamado.descricao_status_chamado === 'Rejeitado' && selectedChamado.motivo_reprovacao && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Reprovação</label>
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-red-800 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedChamado.motivo_reprovacao}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedChamado.titulo_chamado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <p className="text-gray-600 font-medium">{selectedChamado.titulo_chamado}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <p className="text-gray-600">{selectedChamado.descricao_categoria_chamado || 'Não informado'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problema</label>
                <p className="text-gray-600">{selectedChamado.descricao_problema_chamado || 'Não informado'}</p>
              </div>

              {selectedChamado.descricao_detalhada && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Detalhada</label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedChamado.descricao_detalhada}
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Abertura</label>
                <p className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedChamado.data_abertura)}
                </p>
              </div>
              
              {selectedChamado.data_resolucao && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Resolução</label>
                  <p className="text-gray-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {formatDate(selectedChamado.data_resolucao)}
                  </p>
                </div>
              )}

              {selectedChamado.descricao_status_chamado === 'Aguardando Resposta' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      setSelectedChamado(null);
                      buscarSolucaoIA(selectedChamado.id_chamado);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loadingSolucao}
                  >
                    {loadingSolucao ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Buscando Solução...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        🤖 Ver Solução da IA
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SOLUÇÃO IA */}
      {showSolucaoIA && solucaoIA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            {/* CABEÇALHO FIXO */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">🤖 Solução Sugerida pela IA</h3>
                  <p className="text-blue-100 mt-1">Siga os passos abaixo para resolver seu problema</p>
                </div>
                <Button
                  onClick={() => {
                    setShowSolucaoIA(false);
                    setSolucaoIA(null);
                  }}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>
            
            {/* CONTEÚDO ROLÁVEL */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Sobre este chamado:</h4>
                <p className="text-sm text-gray-600">
                  Chamado #{solucaoIA.fk_chamados_id_chamado} • 
                  Solução gerada em {formatDate(solucaoIA.data_resposta)}
                </p>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  💡 Instruções para resolver o problema:
                </label>
                <div className="bg-white border-2 border-blue-200 rounded-lg p-6 text-gray-800 shadow-inner prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {solucaoIA.solucao_ia}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    🤝 A solução funcionou para você?
                  </h4>
                  <p className="text-gray-600">
                    Sua resposta nos ajuda a melhorar e define o próximo passo do seu chamado.
                  </p>
                </div>
                
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>ℹ️ O que acontece depois:</strong><br />
                    • <strong>"Deu Certo"</strong>: Seu chamado será marcado como resolvido e fechado automaticamente<br />
                    • <strong>"Não Funcionou"</strong>: Seu chamado será encaminhado para um analista humano que entrará em contato
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => enviarFeedbackIA('DEU_CERTO')}
                    disabled={enviandoFeedback}
                    className="bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
                  >
                    {enviandoFeedback ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="w-6 h-6 mr-2" />
                    )}
                    ✔ Deu Certo!
                  </Button>
                  
                  <Button
                    onClick={() => enviarFeedbackIA('DEU_ERRADO')}
                    disabled={enviandoFeedback}
                    variant="outline"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-300 py-4 text-lg font-semibold"
                  >
                    {enviandoFeedback ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-2"></div>
                    ) : (
                      <XCircle className="w-6 h-6 mr-2" />
                    )}
                    ✖ Não Funcionou
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};