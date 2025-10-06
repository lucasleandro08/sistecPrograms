import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CadastrarUsuarioForm } from './CadastrarUsuarioForm';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Edit, Trash2, Search, Mail, Phone, Briefcase, Building2 } from 'lucide-react';
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
        console.log('✅ Usuários carregados:', data.data);
        setUsuarios(data.data || []);
        setUsuariosFiltrados(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
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
    return user?.perfil?.nivel_acesso >= 4;
  };

  // Verificar se pode editar usuário específico
  const canEditUser = (targetUser: Usuario) => {
    if (!user?.perfil?.nivel_acesso) return false;
    
    if (user.perfil.nivel_acesso >= 5) return true;
    
    if (user.perfil.nivel_acesso >= 4 && targetUser.nivel_acesso < 5) return true;
    
    if (user.id === targetUser.id_usuario.toString()) return true;
    
    return false;
  };

  const getBadgeColor = (nivel: number) => {
    switch(nivel) {
      case 5: return 'bg-purple-100 text-purple-800';
      case 4: return 'bg-red-100 text-red-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6 overflow-x-hidden">
          
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
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0" />
                    <span className="truncate">Gerenciar Usuários</span>
                  </h1>
                  <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
                    {usuariosFiltrados.length} usuário{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {canManageUsers() && (
                  <Button 
                    onClick={handleCadastrar} 
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-sm px-4 py-2 w-full sm:w-auto flex-shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Usuário</span>
                  </Button>
                )}
              </div>

              {/* Barra de pesquisa */}
              <Card>
                <CardContent className="p-3 sm:p-4 lg:pt-6">
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <Input
                      placeholder="Pesquisar usuários..."
                      value={searchTerm}
                      onChange={(e) => filtrarUsuarios(e.target.value)}
                      className="pl-8 sm:pl-10 text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mensagem de erro */}
              {error && (
                <Card>
                  <CardContent className="p-3 sm:p-4 lg:pt-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-sm">
                      <p className="font-semibold">Erro ao carregar usuários:</p>
                      <p className="text-xs sm:text-sm break-words">{error}</p>
                      <Button 
                        onClick={fetchUsuarios} 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-xs"
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de usuários */}
              <Card>
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg lg:text-xl text-gray-900">Lista de Usuários</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  {usuariosFiltrados.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <Users className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600 mb-2">
                        {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                      </h3>
                      <p className="text-gray-500 text-xs sm:text-sm lg:text-base">
                        {searchTerm ? 
                          'Tente ajustar os termos de busca' : 
                          'Comece cadastrando o primeiro usuário'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* VISUALIZAÇÃO MOBILE - Cards */}
                      <div className="block lg:hidden space-y-3 p-3 sm:p-4">
                        {usuariosFiltrados.map((usuario) => (
                          <Card key={usuario.id_usuario} className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                            <CardContent className="p-3 sm:p-4 space-y-3">
                              {/* Cabeçalho do Card */}
                              <div className="flex items-start justify-between gap-2 min-w-0">
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-gray-500 flex-shrink-0">#{usuario.matricula}</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap ${getBadgeColor(usuario.nivel_acesso)}`}>
                                      {usuario.nome_perfil}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                                    {usuario.nome_usuario}
                                  </h3>
                                </div>
                              </div>

                              {/* Informações de Contato */}
                              <div className="space-y-2 text-xs sm:text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-700 break-words min-w-0">{usuario.email}</span>
                                </div>
                                
                                {usuario.tel_usuarios && (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-700">{usuario.tel_usuarios}</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 min-w-0">
                                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-700 break-words min-w-0">{usuario.cargo_usuario}</span>
                                </div>

                                <div className="flex items-center gap-2 min-w-0">
                                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-700 break-words min-w-0">{usuario.setor_usuario}</span>
                                </div>
                              </div>

                              {/* Botões de Ação */}
                              <div className="flex gap-2 pt-2">
                                {canEditUser(usuario) && (
                                  <Button
                                    onClick={() => handleEditar(usuario)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs sm:text-sm"
                                  >
                                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                    Editar
                                  </Button>
                                )}
                                
                                {canManageUsers() && user?.id !== usuario.id_usuario.toString() && (
                                  <Button
                                    onClick={() => handleDesativar(usuario)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-red-600 hover:text-red-800 hover:bg-red-50 text-xs sm:text-sm"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                                    Desativar
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* VISUALIZAÇÃO DESKTOP - Tabela com coluna de ações fixa */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Matrícula
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nome
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cargo
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Setor
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Perfil
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Telefone
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {usuariosFiltrados.map((usuario) => (
                              <tr key={usuario.id_usuario} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                  #{usuario.matricula}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate">
                                    {usuario.nome_usuario}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-600 max-w-[200px] truncate">
                                    {usuario.email}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-600 max-w-[140px] truncate">
                                    {usuario.cargo_usuario}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-600 max-w-[140px] truncate">
                                    {usuario.setor_usuario}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(usuario.nivel_acesso)}`}>
                                    {usuario.nivel_acesso} - {usuario.nome_perfil}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {usuario.tel_usuarios || '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10">
                                  <div className="flex gap-2 bg-gradient-to-l from-white via-white to-transparent pl-4 -ml-4">
                                    {canEditUser(usuario) && (
                                      <Button
                                        onClick={() => handleEditar(usuario)}
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    )}
                                    
                                    {canManageUsers() && user?.id !== usuario.id_usuario.toString() && (
                                      <Button
                                        onClick={() => handleDesativar(usuario)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
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
