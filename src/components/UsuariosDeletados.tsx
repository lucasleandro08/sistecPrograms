import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, RotateCcw, Search, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

interface UsuarioDeletado {
  id_backup: number;
  id_usuario_original: number;
  matricula: number;
  nome_usuario: string;
  email: string;
  cargo_usuario: string;
  setor_usuario: string;
  nome_perfil: string;
  nivel_acesso: number;
  motivo_delecao: string;
  usuario_que_deletou: string;
  data_delecao: string;
  status_backup: string;
  data_restauracao?: string;
  usuario_que_restaurou?: string;
}

export const UsuariosDeletados = () => {
  const [usuariosDeletados, setUsuariosDeletados] = useState<UsuarioDeletado[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<UsuarioDeletado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Buscar usuários deletados
  const fetchUsuariosDeletados = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('http://localhost:3001/api/users/deleted', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuariosDeletados(data.data || []);
        setUsuariosFiltrados(data.data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao carregar usuários deletados');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários deletados:', error);
      setError('Erro de conexão ao carregar usuários deletados');
    } finally {
      setIsLoading(false);
    }
  };

  // Restaurar usuário
  const handleRestaurar = async (idBackup: number, nomeUsuario: string) => {
    if (!confirm(`Tem certeza que deseja restaurar o usuário "${nomeUsuario}"?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`http://localhost:3001/api/users/restore/${idBackup}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      if (response.ok) {
        alert(`Usuário "${nomeUsuario}" restaurado com sucesso!`);
        fetchUsuariosDeletados(); // Recarregar lista
      } else {
        const errorData = await response.json();
        alert(`Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao restaurar usuário:', error);
      alert('Erro de conexão ao restaurar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuários
  const filtrarUsuarios = (termo: string) => {
    setSearchTerm(termo);
    if (!termo.trim()) {
      setUsuariosFiltrados(usuariosDeletados);
      return;
    }

    const filtrados = usuariosDeletados.filter(usuario =>
      usuario.nome_usuario.toLowerCase().includes(termo.toLowerCase()) ||
      usuario.email.toLowerCase().includes(termo.toLowerCase()) ||
      usuario.motivo_delecao.toLowerCase().includes(termo.toLowerCase()) ||
      usuario.usuario_que_deletou.toLowerCase().includes(termo.toLowerCase())
    );
    setUsuariosFiltrados(filtrados);
  };

  useEffect(() => {
    if (user?.email) {
      fetchUsuariosDeletados();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header />
        
        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
          
          {/* Header da página */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                Usuários Deletados
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {usuariosFiltrados.length} registro{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <Button 
              onClick={fetchUsuariosDeletados} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>

          {/* Barra de pesquisa */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar por nome, email, motivo ou quem deletou..."
                  value={searchTerm}
                  onChange={(e) => filtrarUsuarios(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mensagem de erro */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p className="font-semibold">Erro:</p>
                  <p>{error}</p>
                  <Button 
                    onClick={fetchUsuariosDeletados} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de usuários deletados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl text-gray-900">
                Backup de Usuários Deletados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
                    {searchTerm ? 'Nenhum registro encontrado' : 'Nenhum usuário deletado'}
                  </h3>
                  <p className="text-gray-500 text-sm md:text-base">
                    {searchTerm ? 
                      'Tente ajustar os termos de busca' : 
                      'Todos os usuários estão ativos'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Perfil
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Motivo da Deleção
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deletado por
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.id_backup} className="hover:bg-gray-50">
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {usuario.nome_usuario}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {usuario.email}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Matrícula: #{usuario.matricula}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usuario.nivel_acesso === 4 ? 'bg-red-100 text-red-800' :
                              usuario.nivel_acesso === 3 ? 'bg-yellow-100 text-yellow-800' :
                              usuario.nivel_acesso === 2 ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {usuario.nivel_acesso} - {usuario.nome_perfil}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              {usuario.motivo_delecao}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {usuario.usuario_que_deletou}
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(usuario.data_delecao)}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usuario.status_backup === 'ATIVO' ? 'bg-green-100 text-green-800' :
                              usuario.status_backup === 'RESTAURADO' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {usuario.status_backup}
                            </span>
                            {usuario.status_backup === 'RESTAURADO' && (
                              <div className="text-xs text-gray-500 mt-1">
                                Restaurado em {formatDate(usuario.data_restauracao!)}
                                <br />
                                por {usuario.usuario_que_restaurou}
                              </div>
                            )}
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {usuario.status_backup === 'ATIVO' && (
                              <Button
                                onClick={() => handleRestaurar(usuario.id_backup, usuario.nome_usuario)}
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                disabled={isLoading}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Restaurar
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
