import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


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


export const EscalatedTicketsTable = () => {
  const [chamadosEscalados, setChamadosEscalados] = useState<ChamadoEscalado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [processando, setProcessando] = useState(false);
  const { user } = useAuth();


  // Verificar se é gerente
  const isGerente = user?.perfil?.nivel_acesso >= 3;


  // MutationObserver para forçar z-index do alertbox
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'alertbox-force-zindex-escalados';
    style.innerHTML = `
      .alertBoxBody,
      .alertBoxBody *,
      div[class*="alert"],
      div[id*="alert"] {
        z-index: 2147483647 !important;
      }
    `;
    
    const oldStyle = document.getElementById('alertbox-force-zindex-escalados');
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
        info: { alertIcon: 'info' as const, title: 'Informação', themeColor: '#3b82f6', btnColor: '#60a5fa' }
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


  useEffect(() => {
    if (isGerente) {
      fetchChamadosEscalados();
    }
  }, [isGerente]);


  const fetchChamadosEscalados = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('http://localhost:3001/api/chamados/escalados', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChamadosEscalados(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro ao carregar chamados' }));
        setError(errorData.message || 'Erro ao carregar chamados escalados');
        showAlert('error', errorData.message || 'Erro ao carregar chamados escalados');
      }
    } catch (error) {
      console.error('Erro ao carregar chamados escalados:', error);
      const errorMessage = 'Erro de conexão ao carregar chamados escalados';
      setError(errorMessage);
      showAlert('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const resolverChamadoEscalado = async (idChamado: number) => {
    try {
      setProcessando(true);

      const response = await fetch(`http://localhost:3001/api/chamados/${idChamado}/resolver-escalado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      setProcessando(false);

      setTimeout(() => {
        if (response.ok) {
          showAlert('success', `Chamado #${idChamado} resolvido com sucesso!`);
          fetchChamadosEscalados();
        } else {
          response.json().then(errorData => {
            showAlert('error', errorData.message || 'Erro ao resolver chamado');
          }).catch(() => {
            showAlert('error', 'Erro ao resolver chamado');
          });
        }
      }, 100);

    } catch (error) {
      console.error('Erro ao resolver chamado:', error);
      setProcessando(false);

      setTimeout(() => {
        showAlert('error', 'Erro de conexão ao resolver chamado');
      }, 100);
    }
  };


  if (!isGerente) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
        <p>Apenas gerentes podem visualizar chamados escalados.</p>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Chamados Escalados 
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({chamadosEscalados.length})
          </span>
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Chamados que foram escalados pelos analistas para resolução gerencial
        </p>
      </div>

      {error && !isLoading && (
        <div className="m-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Erro:</p>
          <p>{error}</p>
          <Button 
            onClick={fetchChamadosEscalados} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando chamados escalados...</p>
          </div>
        </div>
      )}

      {!isLoading && !error && chamadosEscalados.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum chamado escalado no momento</p>
        </div>
      )}

      {!isLoading && !error && chamadosEscalados.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Título</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Categoria</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Solicitante</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Prioridade</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Data</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chamadosEscalados.map((chamado) => (
                <tr key={chamado.id_chamado} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #{chamado.id_chamado}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {chamado.titulo_chamado || 'Sem título'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {chamado.descricao_categoria_chamado}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {chamado.usuario_abertura}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      chamado.prioridade_chamado === 4 ? 'bg-red-100 text-red-800' :
                      chamado.prioridade_chamado === 3 ? 'bg-orange-100 text-orange-800' :
                      chamado.prioridade_chamado === 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {chamado.prioridade_chamado === 4 ? 'Urgente' :
                       chamado.prioridade_chamado === 3 ? 'Alta' :
                       chamado.prioridade_chamado === 2 ? 'Média' : 'Baixa'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(chamado.data_abertura).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => resolverChamadoEscalado(chamado.id_chamado)}
                        disabled={processando}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processando ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Resolvendo...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolver
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
