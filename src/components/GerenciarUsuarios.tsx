import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CadastrarUsuarioForm } from './CadastrarUsuarioForm';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

interface Usuario {
  id_usuario: number;
  nome_usuario: string;
  email: string;
  tel_usuarios: string;
  cargo_usuario: string;
  setor_usuario: string;
  id_perfil_usuario: number;
  matricula: number;
  nome_perfil: string;
  nivel_acesso: number;
}

export const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'cadastrar' | 'editar' | 'desativar'>('cadastrar');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Buscar lista de usuários
  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔍 Buscando usuários...');
      console.log('📧 Email do usuário logado:', user?.email);
      
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
      });

      console.log('Resposta da API:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log(' Usuários carregados:', data.data);
        setUsuarios(data.data || []);
        setUsuariosFiltrados(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        setError(errorData.message || 'Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setError('Erro de conexão ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuários baseado no termo de busca
  const filtrarUsuarios = (termo: string) => {
    setSearchTerm(termo);
    if (!termo.trim()) {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const filtrados = usuarios.filter(usuario =>
      usuario.nome_usuario.toLowerCase().includes(termo.toLowerCase()) ||
      usuario.email.toLowerCase().includes(termo.toLowerCase()) ||
      usuario.cargo_usuario.toLowerCase().includes(termo.toLowerCase()) ||
      usuario.setor_usuario.toLowerCase().includes(termo.toLowerCase())
    );
    setUsuariosFiltrados(filtrados);
  };

  // Carregar usuários quando componente montar
  useEffect(() => {
    if (user?.email) {
      fetchUsuarios();
    }
  }, [user]);

  // Abrir formulário de cadastro
  const handleCadastrar = () => {
    console.log('Abrindo formulário de cadastro');
    setSelectedUser(null);
    setFormMode('cadastrar');
    setShowForm(true);
  };

  // Abrir formulário de edição
  const handleEditar = (usuario: Usuario) => {
    console.log('Editando usuário:', usuario);
    setSelectedUser(usuario);
    setFormMode('editar');
    setShowForm(true);
  };

  // Abrir formulário de desativação
  const handleDesativar = (usuario: Usuario) => {
    console.log('Desativando usuário:', usuario);
    setSelectedUser(usuario);
    setFormMode('desativar');
    setShowForm(true);
  };

  // Callback de sucesso - recarregar lista
  const handleSuccess = () => {
    console.log('Operação realizada com sucesso, recarregando lista');
    fetchUsuarios();
    setShowForm(false);
    setSelectedUser(null);
  };

  // Verificar se pode gerenciar usuários (Admin ou Gerente)
  const canManageUsers = () => {
    return user?.perfil?.nivel_acesso >= 4; // Gerente (4) ou Admin (5)
  };

  // Verificar se pode editar usuário específico
  const canEditUser = (targetUser: Usuario) => {
    if (!user?.perfil?.nivel_acesso) return false;
    
    // Admin pode editar qualquer um
    if (user.perfil.nivel_acesso >= 5) return true;
    
    // Gerente pode editar usuários de nível menor
    if (user.perfil.nivel_acesso >= 4 && targetUser.nivel_acesso < 5) return true;
    
    // Qualquer um pode editar o próprio perfil
    if (user.id === targetUser.id_usuario.toString()) return true;
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex"> 
      <Sidebar /> 
      
      <div className="flex-1 flex flex-col w-full md:w-auto"> 
        <Header /> 
        
        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden"> 
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando usuários...</p>
              </div>
            </div>
          )}

          {/* Conteúdo quando não está carregando */}
          {!isLoading && (
            <>
              {/* Header da página */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                    Gerenciar Usuários
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm md:text-base">
                    {usuariosFiltrados.length} usuário{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {canManageUsers() && (
                  <Button 
                    onClick={handleCadastrar} 
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-sm px-4 py-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar Usuário
                  </Button>
                )}
              </div>

              {/* Barra de pesquisa */}
              <Card>
                <CardContent className="pt-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Pesquisar usuários por nome, email, cargo ou setor..."
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
                      <p className="font-semibold">Erro ao carregar usuários:</p>
                      <p>{error}</p>
                      <Button 
                        onClick={fetchUsuarios} 
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

              {/* Tabela de usuários */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl text-gray-900">Lista de Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  {usuariosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">
                        {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                      </h3>
                      <p className="text-gray-500 text-sm md:text-base">
                        {searchTerm ? 
                          'Tente ajustar os termos de busca' : 
                          'Comece cadastrando o primeiro usuário'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Matrícula
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nome
                            </th>
                            <th className="hidden sm:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cargo
                            </th>
                            <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Setor
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Perfil
                            </th>
                            <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Telefone
                            </th>
                            <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usuariosFiltrados.map((usuario) => (
                            <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-mono text-gray-900">
                                #{usuario.matricula}
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs md:text-sm font-medium text-gray-900">
                                  {usuario.nome_usuario}
                                </div>
                                {/* Mostrar email em telas pequenas */}
                                <div className="sm:hidden text-xs text-gray-500">
                                  {usuario.email}
                                </div>
                              </td>
                              <td className="hidden sm:table-cell px-3 md:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs md:text-sm text-gray-600">
                                  {usuario.email}
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-600">
                                {usuario.cargo_usuario}
                              </td>
                              <td className="hidden md:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-600">
                                {usuario.setor_usuario}
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  usuario.nivel_acesso === 4 ? 'bg-red-100 text-red-800' :
                                  usuario.nivel_acesso === 3 ? 'bg-yellow-100 text-yellow-800' :
                                  usuario.nivel_acesso === 2 ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  <span className="hidden sm:inline">{usuario.nivel_acesso} - </span>
                                  {usuario.nome_perfil}
                                </span>
                              </td>
                              <td className="hidden lg:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-600">
                                {usuario.tel_usuarios || '-'}
                              </td>
                              <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                                <div className="flex space-x-1 md:space-x-2">
                                  {canEditUser(usuario) && (
                                    <Button
                                      onClick={() => handleEditar(usuario)}
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 md:p-2"
                                    >
                                      <Edit className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                  )}
                                  
                                  {canManageUsers() && user?.id !== usuario.id_usuario.toString() && (
                                    <Button
                                      onClick={() => handleDesativar(usuario)}
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 md:p-2"
                                    >
                                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Modal do formulário */}
      {showForm && (
        <CadastrarUsuarioForm
          mode={formMode}
          onClose={() => {
            setShowForm(false);
            setSelectedUser(null);
          }}
          userData={selectedUser}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
