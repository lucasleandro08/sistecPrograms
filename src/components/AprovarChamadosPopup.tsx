import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Clock, CheckCircle, XCircle, Eye, Check, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';



interface ChamadoParaAprovacao {
  id_chamado: number;
  descricao_categoria_chamado: string;
  descricao_problema_chamado: string;
  descricao_status_chamado: string;
  prioridade_chamado: number;
  data_abertura: string;
  usuario_abertura: string;
  email_usuario: string;
}



interface AprovarChamadosPopupProps {
  onClose: () => void;
}



export const AprovarChamadosPopup = ({ onClose }: AprovarChamadosPopupProps) => {
  const [chamados, setChamados] = useState<ChamadoParaAprovacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedChamado, setSelectedChamado] = useState<ChamadoParaAprovacao | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [chamadoToApprove, setChamadoToApprove] = useState<number | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [processando, setProcessando] = useState(false);
  const { user } = useAuth();



  const canApprovaChams = user?.perfil?.nivel_acesso >= 3;


  // MutationObserver para forçar z-index do alertbox
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'alertbox-force-zindex';
    style.innerHTML = `
      .alertBoxBody,
      .alertBoxBody *,
      div[class*="alert"],
      div[id*="alert"] {
        z-index: 2147483647 !important;
      }
    `;
    document.head.appendChild(style);

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
      document.getElementById('alertbox-force-zindex')?.remove();
    };
  }, []);



  const showAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    if (typeof window !== 'undefined' && (window as any).alertbox) {
      const config = {
        success: { alertIcon: 'success' as const, title: 'Sucesso!', themeColor: '#16a34a', btnColor: '#22c55e' },
        error: { alertIcon: 'error' as const, title: 'Erro!', themeColor: '#dc2626', btnColor: '#ef4444' },
        warning: { alertIcon: 'warning' as const, title: 'Atenção!', themeColor: '#ea580c', btnColor: '#f97316' }
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



  const fetchChamadosParaAprovacao = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('http://localhost:3001/api/chamados/aprovacao', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChamados(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao carregar chamados para aprovação');
      }
    } catch (error) {
      console.error('Erro ao buscar chamados para aprovação:', error);
      setError('Erro de conexão ao carregar chamados');
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    if (user?.email && canApprovaChams) {
      fetchChamadosParaAprovacao();
    }
  }, [user, canApprovaChams]);



  const handleAprovarClick = (idChamado: number) => {
    setChamadoToApprove(idChamado);
    setShowConfirmModal(true);
  };



  const handleConfirmAprovar = async () => {
    if (!chamadoToApprove) return;

    try {
      setProcessando(true);

      const response = await fetch(`http://localhost:3001/api/chamados/${chamadoToApprove}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      setShowConfirmModal(false);
      setSelectedChamado(null);
      setChamadoToApprove(null);
      setProcessando(false);

      setTimeout(() => {
        if (response.ok) {
          showAlert('success', 'Chamado aprovado com sucesso!');
          fetchChamadosParaAprovacao();
        } else {
          response.json().then(errorData => {
            showAlert('error', errorData.message || 'Erro ao aprovar chamado');
          }).catch(() => {
            showAlert('error', 'Erro ao aprovar chamado');
          });
        }
      }, 100);

    } catch (error) {
      console.error('Erro ao aprovar chamado:', error);
      
      setShowConfirmModal(false);
      setSelectedChamado(null);
      setChamadoToApprove(null);
      setProcessando(false);

      setTimeout(() => {
        showAlert('error', 'Erro de conexão ao aprovar chamado');
      }, 100);
    }
  };



  const handleRejeitar = async () => {
    if (!selectedChamado || !motivoRejeicao.trim() || motivoRejeicao.trim().length < 10) {
      showAlert('warning', 'Motivo da rejeição deve ter pelo menos 10 caracteres');
      return;
    }

    try {
      setProcessando(true);

      const response = await fetch(`http://localhost:3001/api/chamados/${selectedChamado.id_chamado}/rejeitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({ motivo: motivoRejeicao.trim() }),
      });

      setShowRejectModal(false);
      setSelectedChamado(null);
      setMotivoRejeicao('');
      setProcessando(false);

      setTimeout(() => {
        if (response.ok) {
          showAlert('success', 'Chamado rejeitado com sucesso!');
          fetchChamadosParaAprovacao();
        } else {
          response.json().then(errorData => {
            showAlert('error', errorData.message || 'Erro ao rejeitar chamado');
          }).catch(() => {
            showAlert('error', 'Erro ao rejeitar chamado');
          });
        }
      }, 100);

    } catch (error) {
      console.error('Erro ao rejeitar chamado:', error);
      
      setShowRejectModal(false);
      setSelectedChamado(null);
      setMotivoRejeicao('');
      setProcessando(false);

      setTimeout(() => {
        showAlert('error', 'Erro de conexão ao rejeitar chamado');
      }, 100);
    }
  };



  if (!canApprovaChams) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h3>
            <p className="text-gray-600 mb-4">
              Apenas gestores e administradores podem aprovar chamados.
            </p>
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    );
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };



  const getPrioridadeColor = (prioridade: number) => {
    switch (prioridade) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const getPrioridadeTexto = (prioridade: number) => {
    const textos = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
    return textos[prioridade] || 'Não definida';
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-900 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Aprovar Chamados</h2>
              <span className="text-orange-400">| Painel de Aprovação</span>
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

        <div className="p-6">
          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-semibold">Erro:</p>
              <p>{error}</p>
              <Button 
                onClick={fetchChamadosParaAprovacao} 
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
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum chamado pendente
                  </h3>
                  <p className="text-gray-500">
                    Todos os chamados foram processados
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3" />
                            {chamado.descricao_status_chamado}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(chamado.prioridade_chamado)}`}>
                            {getPrioridadeTexto(chamado.prioridade_chamado)}
                          </span>
                          <Button
                            onClick={() => setSelectedChamado(chamado)}
                            variant="outline"
                            size="sm"
                            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">
                            <strong>Solicitante:</strong> {chamado.usuario_abertura}
                          </p>
                          <p className="text-gray-600">
                            <strong>Email:</strong> {chamado.email_usuario}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            <strong>Categoria:</strong> {chamado.descricao_categoria_chamado}
                          </p>
                          <p className="text-gray-600">
                            <strong>Problema:</strong> {chamado.descricao_problema_chamado}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-gray-600 text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <strong>Aberto em:</strong> {formatDate(chamado.data_abertura)}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAprovarClick(chamado.id_chamado)}
                            disabled={processando}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedChamado(chamado);
                              setShowRejectModal(true);
                            }}
                            disabled={processando}
                            variant="outline"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 text-sm px-3 py-1"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showConfirmModal && chamadoToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-orange-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Confirmar Aprovação</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Tem certeza que quer aprovar o chamado?
                </h4>
                <p className="text-gray-600">
                  Esta ação aprovará o <strong>Chamado #{chamadoToApprove}</strong> e não poderá ser desfeita.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setChamadoToApprove(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={processando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmAprovar}
                  disabled={processando}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  {processando ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Aprovando...
                    </div>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Sim, Aprovar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedChamado && !showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gray-800 text-white p-4 rounded-t-lg">
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
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Clock className="w-4 h-4" />
                    {selectedChamado.descricao_status_chamado}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPrioridadeColor(selectedChamado.prioridade_chamado)}`}>
                    {getPrioridadeTexto(selectedChamado.prioridade_chamado)}
                  </span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                  <p className="text-gray-600">{selectedChamado.usuario_abertura}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-600">{selectedChamado.email_usuario}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <p className="text-gray-600">{selectedChamado.descricao_categoria_chamado}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problema</label>
                <p className="text-gray-600">{selectedChamado.descricao_problema_chamado}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Abertura</label>
                <p className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(selectedChamado.data_abertura)}
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  onClick={() => handleAprovarClick(selectedChamado.id_chamado)}
                  disabled={processando}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar Chamado
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processando}
                  variant="outline"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-1"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Rejeitar Chamado
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedChamado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-red-600 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-bold">Rejeitar Chamado #{selectedChamado.id_chamado}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="motivo" className="text-red-600">
                  Motivo da Rejeição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivo"
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  rows={4}
                  className="mt-1 resize-vertical"
                  placeholder="Descreva o motivo da rejeição (mínimo 10 caracteres)"
                  disabled={processando}
                />
                <p className="text-gray-500 text-xs mt-1">
                  {motivoRejeicao.length}/10 caracteres mínimos
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowRejectModal(false);
                    setMotivoRejeicao('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={processando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRejeitar}
                  disabled={processando || motivoRejeicao.trim().length < 10}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  {processando ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
