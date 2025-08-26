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
  const { user } = useAuth();

  // Verificar se é gerente
  const isGerente = user?.perfil?.nivel_acesso >= 3;

  useEffect(() => {
    if (isGerente) {
      fetchChamadosEscalados();
    }
  }, [isGerente]);

  const fetchChamadosEscalados = async () => {
    try {
      setIsLoading(true);
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
      setError('Erro ao carregar chamados escalados');
    } finally {
      setIsLoading(false);
    }
  };

  const resolverChamadoEscalado = async (idChamado: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/chamados/${idChamado}/resolver-escalado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        alert('Chamado resolvido com sucesso!');
        fetchChamadosEscalados();
      }
    } catch (error) {
      alert('Erro ao resolver chamado');
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

      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {!isLoading && chamadosEscalados.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum chamado escalado no momento</p>
        </div>
      )}

      {!isLoading && chamadosEscalados.length > 0 && (
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
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolver
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
