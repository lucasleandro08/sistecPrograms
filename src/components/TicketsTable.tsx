import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, AlertTriangle, Clock, Calendar, Search, TrendingUp, X, ArrowUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ResolverChamadoPopup } from './ResolverChamadoPopup';

interface Chamado {
  id_chamado: number;
  descricao_categoria_chamado: string;
  descricao_problema_chamado: string;
  descricao_status_chamado: string;
  prioridade_chamado: number;
  prioridade_string?: string;
  data_abertura: string;
  data_resolucao?: string;
  usuario_abertura: string;
  email_usuario: string;
  descricao_detalhada?: string; 
  titulo_chamado?: string; 
}

interface ChamadoEscalado {
  id_chamado: number;
  descricao_categoria_chamado: string;
  descricao_problema_chamado: string;
  descricao_status_chamado: string;
  prioridade_chamado: number;
  data_abertura: string;
  usuario_abertura: string;
  titulo_chamado: string;
}

export const TicketsTable = () => {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [chamadosEscalados, setChamadosEscalados] = useState<ChamadoEscalado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showEscalarModal, setShowEscalarModal] = useState(false);
  const [showEscaladosModal, setShowEscaladosModal] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const [showConfirmResolverModal, setShowConfirmResolverModal] = useState(false);
  const [showConfirmResolverEscaladoModal, setShowConfirmResolverEscaladoModal] = useState(false);
  const [showConfirmEscalarModal, setShowConfirmEscalarModal] = useState(false);
  const [showResolverPopup, setShowResolverPopup] = useState(false);
  const [chamadoToResolve, setChamadoToResolve] = useState<number | null>(null);

  // ============================================================================
  // ALERTBOX PERSONALIZADO - Configuração e Helpers
  // ============================================================================

  // MutationObserver para forçar z-index do alertbox
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'alertbox-force-zindex-tickets';
    style.innerHTML = `
      .alertBoxBody,
      .alertBoxBody *,
      div[class*="alert"],
      div[id*="alert"] {
        z-index: 2147483647 !important;
      }
    `;
    
    const oldStyle = document.getElementById('alertbox-force-zindex-tickets');
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
        success: { alertIcon: 'success' as const, title: 'Sucesso!', themeColor: '#16a34a', btnColor: '#22c55e' },
        error: { alertIcon: 'error' as const, title: 'Erro!', themeColor: '#dc2626', btnColor: '#ef4444' },
        warning: { alertIcon: 'warning' as const, title: 'Atenção!', themeColor: '#ea580c', btnColor: '#f97316' },
        info: { alertIcon: 'info' as const, title: 'Informação', themeColor: '#0ea5e9', btnColor: '#38bdf8' },
      };

      (window as any).alertbox.render({
        ...config[type],
        message,
        btnTitle: 'OK',
        border: true,
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
    }
  };

  // ============================================================================
  // ESTADOS E VARIÁVEIS
  // ============================================================================
  const [chamadoEscaladoToResolve, setChamadoEscaladoToResolve] = useState<number | null>(null);
  const [chamadoParaResolver, setChamadoParaResolver] = useState<Chamado | null>(null);
  
  const [motivoEscalar, setMotivoEscalar] = useState('');
  const [processando, setProcessando] = useState(false);
  const { user } = useAuth();

  const isUsuarioComum = user?.perfil?.nivel_acesso === 1;
  const isAnalista = user?.perfil?.nivel_acesso >= 2;
  const isGestor = user?.perfil?.nivel_acesso >= 3;

  // Detectar scroll para mostrar/ocultar botão "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Função para rolar ao topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const fetchChamados = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('http://localhost:3001/api/chamados', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        let chamadosData = Array.isArray(data.data) ? data.data : [];
        
        if (isUsuarioComum) {
          chamadosData = chamadosData.slice(0, 3);
        }
        
        setChamados(chamadosData);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao carregar chamados');
      }
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      setError('Erro de conexão ao carregar chamados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChamadosEscalados = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chamados/escalados', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChamadosEscalados(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar chamados escalados:', error);
    }
  };

  const handleConfirmarResolverEscalado = (idChamado: number) => {
    // Buscar o chamado escalado completo
    const chamadoEscalado = chamadosEscalados.find(c => c.id_chamado === idChamado);
    if (chamadoEscalado) {
      // Converter para formato Chamado
      const chamadoParaPopup: Chamado = {
        id_chamado: chamadoEscalado.id_chamado,
        descricao_categoria_chamado: chamadoEscalado.descricao_categoria_chamado,
        descricao_problema_chamado: chamadoEscalado.descricao_problema_chamado,
        descricao_status_chamado: chamadoEscalado.descricao_status_chamado,
        prioridade_chamado: chamadoEscalado.prioridade_chamado,
        data_abertura: chamadoEscalado.data_abertura,
        usuario_abertura: chamadoEscalado.usuario_abertura,
        email_usuario: '',
        titulo_chamado: chamadoEscalado.titulo_chamado,
      };
      setChamadoParaResolver(chamadoParaPopup);
      setShowResolverPopup(true);
    }
  };

  const resolverChamadoEscalado = async () => {
    if (!chamadoEscaladoToResolve) return;

    try {
      setProcessando(true);

      const response = await fetch(`http://localhost:3001/api/chamados/${chamadoEscaladoToResolve}/resolver-escalado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        showAlert('success', 'Chamado escalado resolvido com sucesso!');
        await fetchChamadosEscalados();
        await fetchChamados();
      } else {
        const errorData = await response.json();
        showAlert('error', errorData.message || 'Erro ao resolver chamado escalado');
      }
    } catch (error) {
      console.error('Erro ao resolver chamado escalado:', error);
      showAlert('error', 'Erro de conexão ao resolver chamado escalado');
    } finally {
      setProcessando(false);
      setShowConfirmResolverEscaladoModal(false);
      setChamadoEscaladoToResolve(null);
    }
  };

  const handleConfirmarResolver = (idChamado: number) => {
    // Buscar o chamado completo
    const chamado = chamados.find(c => c.id_chamado === idChamado);
    if (chamado) {
      setChamadoParaResolver(chamado);
      setShowResolverPopup(true);
    }
  };

  const marcarComoResolvido = async () => {
    if (!chamadoToResolve) return;

    try {
      setProcessando(true);

      const response = await fetch(`http://localhost:3001/api/chamados/${chamadoToResolve}/resolver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        showAlert('success', 'Chamado marcado como resolvido com sucesso!');
        await fetchChamados();
        setSelectedChamado(null);
        setShowDetalhes(false);
      } else {
        const errorData = await response.json();
        showAlert('error', errorData.message || 'Erro ao resolver chamado');
      }
    } catch (error) {
      console.error('Erro ao resolver chamado:', error);
      showAlert('error', 'Erro de conexão ao resolver chamado');
    } finally {
      setProcessando(false);
      setShowConfirmResolverModal(false);
      setChamadoToResolve(null);
    }
  };

  const handleConfirmarEscalar = () => {
    if (!motivoEscalar.trim() || motivoEscalar.trim().length < 10) {
      showAlert('warning', 'Motivo do escalonamento deve ter pelo menos 10 caracteres');
      return;
    }
    setShowEscalarModal(false);
    setShowConfirmEscalarModal(true);
  };

  const escalarParaGerente = async () => {
    if (!selectedChamado) return;

    try {
      setProcessando(true);

      const response = await fetch(`http://localhost:3001/api/chamados/${selectedChamado.id_chamado}/escalar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify({ motivo: motivoEscalar.trim() }),
      });

      if (response.ok) {
        showAlert('success', 'Chamado escalado para gerente com sucesso!');
        await fetchChamados();
        setShowConfirmEscalarModal(false);
        setSelectedChamado(null);
        setShowDetalhes(false);
        setMotivoEscalar('');
      } else {
        const errorData = await response.json();
        showAlert('error', errorData.message || 'Erro ao escalar chamado');
      }
    } catch (error) {
      console.error('Erro ao escalar chamado:', error);
      showAlert('error', 'Erro de conexão ao escalar chamado');
    } finally {
      setProcessando(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchChamados();
    }
  }, [user]);

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

  const getPrioridadeColor = (prioridade: number) => {
    switch (prioridade) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'aberto': return 'bg-blue-100 text-blue-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'triagem ia': return 'bg-purple-100 text-purple-800';
      case 'aguardando resposta': return 'bg-yellow-100 text-yellow-800';
      case 'com analista': return 'bg-orange-100 text-orange-800';
      case 'escalado': return 'bg-purple-100 text-purple-800';
      case 'resolvido': return 'bg-emerald-100 text-emerald-800';
      case 'fechado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredChamados = chamados.filter(chamado =>
    chamado.id_chamado.toString().includes(searchTerm) ||
    chamado.descricao_categoria_chamado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chamado.descricao_problema_chamado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chamado.usuario_abertura?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isUsuarioComum ? 'Meus Chamados Recentes' : 'Chamados Recentes'}
              </h2>
              {isUsuarioComum && (
                <p className="text-sm text-gray-500 mt-1">Mostrando seus 3 chamados mais recentes</p>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar chamados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {isGestor && (
                <Button
                  onClick={() => {
                    setShowEscaladosModal(true);
                    fetchChamadosEscalados();
                  }}
                  variant="outline"
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 border-purple-200"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Escalados
                </Button>
              )}

              <Button
                onClick={fetchChamados}
                variant="outline"
                className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
              >
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="p-6 bg-red-50 border border-red-200 text-red-700">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Categoria</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Usuário</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Prioridade</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Criado em</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredChamados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Nenhum chamado encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredChamados.map((chamado) => (
                      <tr key={chamado.id_chamado} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          #{chamado.id_chamado}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {chamado.descricao_categoria_chamado || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {chamado.usuario_abertura || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getPrioridadeColor(chamado.prioridade_chamado)}>
                            {getPrioridadeTexto(chamado.prioridade_chamado)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(chamado.descricao_status_chamado)}>
                            {chamado.descricao_status_chamado || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(chamado.data_abertura)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => {
                                setSelectedChamado(chamado);
                                setShowDetalhes(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            {isAnalista && chamado.descricao_status_chamado === 'Com Analista' && (
                              <>
                                <Button
                                  onClick={() => handleConfirmarResolver(chamado.id_chamado)}
                                  disabled={processando}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Resolver
                                </Button>
                                
                                <Button
                                  onClick={() => {
                                    setSelectedChamado(chamado);
                                    setShowEscalarModal(true);
                                  }}
                                  disabled={processando}
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                >
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Escalar
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {isUsuarioComum 
                  ? `Mostrando ${filteredChamados.length} de seus chamados mais recentes`
                  : `${filteredChamados.length} chamados encontrados`
                }
              </div>
              {!isUsuarioComum && (
                <div className="text-xs text-gray-500">
                  👥 Usuários comuns veem apenas 3 chamados mais recentes
                </div>
              )}
            </div>
          </>
        )}

        {/* Todos os modais existentes continuam aqui... */}
        {/* (showConfirmResolverModal, showConfirmResolverEscaladoModal, showConfirmEscalarModal, etc.) */}
        {showConfirmResolverModal && chamadoToResolve && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-green-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Confirmar Fechamento</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Tem certeza que quer fechar o chamado?
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Chamado:</strong> #{chamadoToResolve}
                    </p>
                    <p className="text-sm text-gray-500">
                      Esta ação marcará o chamado como resolvido e não poderá ser desfeita.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowConfirmResolverModal(false);
                      setChamadoToResolve(null);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={processando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={marcarComoResolvido}
                    disabled={processando}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processando ? 'Fechando...' : 'Sim, Fechar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmResolverEscaladoModal && chamadoEscaladoToResolve && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-green-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Confirmar Fechamento</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Tem certeza que quer fechar o chamado?
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Chamado Escalado:</strong> #{chamadoEscaladoToResolve}
                    </p>
                    <p className="text-sm text-gray-500">
                      Esta ação resolverá o chamado escalado e não poderá ser desfeita.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowConfirmResolverEscaladoModal(false);
                      setChamadoEscaladoToResolve(null);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={processando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={resolverChamadoEscalado}
                    disabled={processando}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processando ? 'Fechando...' : 'Sim, Fechar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmEscalarModal && selectedChamado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-orange-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-lg font-bold">Confirmar Escalonamento</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Tem certeza que deseja escalar este chamado?
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Chamado:</strong> #{selectedChamado.id_chamado}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Motivo:</strong> {motivoEscalar}
                    </p>
                    <p className="text-sm text-gray-500">
                      O chamado será enviado para análise do gerente.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowConfirmEscalarModal(false);
                      setShowEscalarModal(true);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={processando}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={escalarParaGerente}
                    disabled={processando}
                    className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {processando ? 'Escalando...' : 'Sim, Escalar'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Chamados Escalados */}
        {showEscaladosModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="bg-purple-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">
                    📈 Chamados Escalados ({chamadosEscalados.length})
                  </h3>
                  <Button
                    onClick={() => setShowEscaladosModal(false)}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-purple-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-purple-100 text-sm mt-1">
                  Chamados escalados pelos analistas que precisam de resolução gerencial
                </p>
              </div>
              
              <div className="p-6">
                {chamadosEscalados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum chamado escalado no momento</p>
                    <p className="text-sm">Todos os chamados escalados foram resolvidos</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Título</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Categoria</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Solicitante</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Prioridade</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {chamadosEscalados.map((chamado) => (
                          <tr key={chamado.id_chamado} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              #{chamado.id_chamado}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {chamado.titulo_chamado || 'Sem título'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {chamado.descricao_categoria_chamado}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {chamado.usuario_abertura}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getPrioridadeColor(chamado.prioridade_chamado)}>
                                {getPrioridadeTexto(chamado.prioridade_chamado)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(chamado.data_abertura)}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                onClick={() => handleConfirmarResolverEscalado(chamado.id_chamado)}
                                disabled={processando}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolver
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showDetalhes && selectedChamado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="bg-gray-800 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">
                    Detalhes do Chamado #{selectedChamado.id_chamado}
                  </h3>
                  <Button
                    onClick={() => {
                      setShowDetalhes(false);
                      setSelectedChamado(null);
                    }}
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
                    <Badge className={getStatusColor(selectedChamado.descricao_status_chamado)}>
                      {selectedChamado.descricao_status_chamado}
                    </Badge>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <Badge className={getPrioridadeColor(selectedChamado.prioridade_chamado)}>
                      {getPrioridadeTexto(selectedChamado.prioridade_chamado)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                    <p className="text-gray-600">{selectedChamado.usuario_abertura}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-600">{selectedChamado.email_usuario}</p>
                  </div>
                </div>

                {selectedChamado.titulo_chamado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <p className="text-gray-600 font-medium">{selectedChamado.titulo_chamado}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <p className="text-gray-600">{selectedChamado.descricao_categoria_chamado}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problema</label>
                  <p className="text-gray-600">{selectedChamado.descricao_problema_chamado}</p>
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

                {isAnalista && selectedChamado.descricao_status_chamado === 'Com Analista' && (
                  <div className="flex gap-4 pt-4 border-t">
                    <Button
                      onClick={() => handleConfirmarResolver(selectedChamado.id_chamado)}
                      disabled={processando}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Resolvido
                    </Button>
                    <Button
                      onClick={() => setShowEscalarModal(true)}
                      disabled={processando}
                      variant="outline"
                      className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 flex-1"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Escalar para Gerente
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showEscalarModal && selectedChamado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="bg-orange-600 text-white p-4 rounded-t-lg">
                <h3 className="text-lg font-bold">Escalar Chamado #{selectedChamado.id_chamado}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo do Escalonamento <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={motivoEscalar}
                    onChange={(e) => setMotivoEscalar(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-vertical"
                    placeholder="Descreva o motivo do escalonamento para o gerente..."
                    disabled={processando}
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    {motivoEscalar.length}/10 caracteres mínimos
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowEscalarModal(false);
                      setMotivoEscalar('');
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={processando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmarEscalar}
                    disabled={processando || motivoEscalar.trim().length < 10}
                    className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                  >
                    Escalar Chamado
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão Voltar ao Topo */}
      {showScrollToTop && (
        <div className="fixed bottom-6 left-20 flex flex-col items-center z-50">
          <button
            onClick={scrollToTop}
            className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 mb-2"
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap">
            Voltar ao topo
          </span>
        </div>
      )}

      {/* Popup: Resolver Chamado com Relatório */}
      {showResolverPopup && chamadoParaResolver && (
        <ResolverChamadoPopup
          chamado={{
            id_chamado: chamadoParaResolver.id_chamado,
            descricao_categoria_chamado: chamadoParaResolver.descricao_categoria_chamado,
            descricao_problema_chamado: chamadoParaResolver.descricao_problema_chamado,
            descricao_status_chamado: chamadoParaResolver.descricao_status_chamado, // ✅ ADICIONADO
            id_categoria_chamado: undefined,
            id_problema_chamado: undefined,
            id_usuario_abertura: undefined,
          }}
          onClose={() => {
            setShowResolverPopup(false);
            setChamadoParaResolver(null);
          }}
          onSuccess={() => {
            setShowResolverPopup(false);
            setChamadoParaResolver(null);
            fetchChamados();
            fetchChamadosEscalados();
            setSelectedChamado(null);
            setShowDetalhes(false);
            showAlert('success', 'Chamado resolvido com sucesso!');
          }}
        />
      )}
    </>
  );
};
