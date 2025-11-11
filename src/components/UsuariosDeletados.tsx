import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, RotateCcw, Search, Calendar, User, FileText, UserX } from 'lucide-react';
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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<UsuarioDeletado | null>(null);

  const ALERTBOX_STYLE_ID = 'alertbox-force-zindex-usuarios-deletados';

  const ALERT_STYLES = {
    success: { alertIcon: 'success', title: 'Sucesso!', themeColor: '#16a34a', btnColor: '#22c55e' },
    error: { alertIcon: 'error', title: 'Erro!', themeColor: '#dc2626', btnColor: '#ef4444' },
    warning: { alertIcon: 'warning', title: 'Atenção!', themeColor: '#ea580c', btnColor: '#f97316' },
    info: { alertIcon: 'info', title: 'Informação', themeColor: '#3b82f6', btnColor: '#60a5fa' },
  } as const;

  const ACTION_ALERT_STYLES = {
    restaurar: {
      alertIcon: 'success',
      title: 'Usuário restaurado!',
      themeColor: '#15803d',
      btnColor: '#16a34a',
    },
  } as const;

  const setupAlertBoxZIndex = () => {
    if (typeof document === 'undefined') return () => undefined;

    let styleElement = document.getElementById(ALERTBOX_STYLE_ID) as HTMLStyleElement | null;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = ALERTBOX_STYLE_ID;
      styleElement.innerHTML = `
        .alertBoxBody,
        .alertBoxBody *,
        div[class*="alert"],
        div[id*="alert"] {
          z-index: 2147483647 !important;
        }
      `;
      document.head.appendChild(styleElement);
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const elements = [
              node.querySelector('.alertBoxBody'),
              node.querySelector('[class*="alertBox"]'),
              node.querySelector('[id*="alertBox"]'),
              node.classList.contains('alertBoxBody') ? node : null,
            ].filter(Boolean) as HTMLElement[];

            elements.forEach((element) => {
              element.style.zIndex = '2147483647';
              element.style.position = 'fixed';
              element.querySelectorAll('*').forEach((child) => {
                if (child instanceof HTMLElement) child.style.zIndex = '2147483647';
              });
            });
          }
        });
      });
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      document.getElementById(ALERTBOX_STYLE_ID)?.remove();
    };
  };

  const renderAlertWithConfig = (
    config: { alertIcon: string; title: string; themeColor: string; btnColor: string },
    message: string
  ) => {
    if (typeof window !== 'undefined' && (window as any).alertbox) {
      (window as any).alertbox.render({
        ...config,
        message,
        btnTitle: 'Ok',
        border: true,
      });

      setTimeout(() => {
        const alertBox =
          document.querySelector('.alertBoxBody') ||
          document.querySelector('[class*="alertBox"]') ||
          document.querySelector('[id*="alertBox"]');
        if (alertBox instanceof HTMLElement) {
          alertBox.style.zIndex = '2147483647';
          alertBox.style.position = 'fixed';
          alertBox.querySelectorAll('*').forEach((child) => {
            if (child instanceof HTMLElement) child.style.zIndex = '2147483647';
          });
        }
      }, 50);
    } else {
      alert(message);
    }
  };

  const showAlert = (type: keyof typeof ALERT_STYLES, message: string) => {
    renderAlertWithConfig(ALERT_STYLES[type], message);
  };

  const showActionAlert = (message: string) => {
    renderAlertWithConfig(ACTION_ALERT_STYLES.restaurar, message);
  };

  useEffect(() => {
    const cleanup = setupAlertBoxZIndex();
    return cleanup;
  }, []);

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
        const message = errorData.message || 'Erro ao carregar usuários deletados';
        setError(message);
        showAlert('error', message);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários deletados:', error);
      setError('Erro de conexão ao carregar usuários deletados');
      showAlert('error', 'Erro de conexão ao carregar usuários deletados');
    } finally {
      setIsLoading(false);
    }
  };

  // Restaurar usuário
  const handleConfirmRestore = async () => {
    if (!restoreCandidate) return;

    const { id_backup: idBackup, nome_usuario: nomeUsuario } = restoreCandidate;
    setIsConfirmDialogOpen(false);
    setRestoreCandidate(null);

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
        showActionAlert(`Usuário "${nomeUsuario}" restaurado com sucesso!`);
        fetchUsuariosDeletados();
      } else {
        const errorData = await response.json();
        showAlert('error', `Erro: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao restaurar usuário:', error);
      showAlert('error', 'Erro de conexão ao restaurar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRestoreDialog = (usuario: UsuarioDeletado) => {
    setRestoreCandidate(usuario);
    setIsConfirmDialogOpen(true);
  };

  const handleCancelRestore = () => {
    setIsConfirmDialogOpen(false);
    setRestoreCandidate(null);
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
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBadgeColor = (nivel: number) => {
    switch(nivel) {
      case 4: return 'bg-red-100 text-red-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
          
          {/* Header da página */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600 flex-shrink-0" />
                <span className="truncate">Usuários Deletados</span>
              </h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
                {usuariosFiltrados.length} registro{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <Button 
              onClick={fetchUsuariosDeletados} 
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-sm">Atualizar</span>
            </Button>
          </div>

          {/* Barra de pesquisa */}
          <Card>
            <CardContent className="p-3 sm:p-4 lg:pt-6">
              <div className="relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <Input
                  placeholder="Pesquisar por nome, email ou motivo..."
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
                  <p className="font-semibold">Erro:</p>
                  <p className="text-xs sm:text-sm break-words">{error}</p>
                  <Button 
                    onClick={fetchUsuariosDeletados} 
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

          {/* Lista de usuários deletados */}
          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl text-gray-900">
                Backup de Usuários Deletados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-32 sm:h-40">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-red-600"></div>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-600 mb-2">
                    {searchTerm ? 'Nenhum registro encontrado' : 'Nenhum usuário deletado'}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm lg:text-base">
                    {searchTerm ? 
                      'Tente ajustar os termos de busca' : 
                      'Todos os usuários estão ativos'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* VISUALIZAÇÃO MOBILE - Cards */}
                  <div className="block lg:hidden space-y-3 p-3 sm:p-4">
                    {usuariosFiltrados.map((usuario) => (
                      <Card key={usuario.id_backup} className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <CardContent className="p-3 sm:p-4 space-y-3">
                          {/* Cabeçalho do Card */}
                          <div className="flex items-start gap-2 min-w-0">
                            <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                                {usuario.nome_usuario}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">{usuario.email}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Matrícula: #{usuario.matricula}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 whitespace-nowrap ${
                              usuario.status_backup === 'ATIVO' ? 'bg-green-100 text-green-800' :
                              usuario.status_backup === 'RESTAURADO' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {usuario.status_backup}
                            </span>
                          </div>

                          {/* Perfil */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm min-w-0">
                            <span className="text-gray-500 font-medium flex-shrink-0">Perfil:</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(usuario.nivel_acesso)}`}>
                              Nível {usuario.nivel_acesso} - {usuario.nome_perfil}
                            </span>
                          </div>

                          {/* Motivo da Deleção */}
                          <div className="bg-gray-50 p-2 sm:p-3 rounded-md overflow-hidden">
                            <div className="flex items-start gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <p className="text-xs text-gray-500 font-medium mb-1">Motivo da Deleção:</p>
                                <p className="text-xs sm:text-sm text-gray-700 break-words">{usuario.motivo_delecao}</p>
                              </div>
                            </div>
                          </div>

                          {/* Informações de Deleção */}
                          <div className="space-y-1.5 text-xs sm:text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-500 flex-shrink-0">Deletado por:</span>
                              <span className="text-gray-700 font-medium break-words min-w-0">{usuario.usuario_que_deletou}</span>
                            </div>
                            <div className="flex items-start gap-2 min-w-0">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-500 flex-shrink-0">Data:</span>
                              <span className="text-gray-700 break-words min-w-0">{formatDate(usuario.data_delecao)}</span>
                            </div>
                          </div>

                          {/* Informações de Restauração */}
                          {usuario.status_backup === 'RESTAURADO' && usuario.data_restauracao && (
                            <div className="bg-blue-50 border border-blue-200 p-2 sm:p-3 rounded-md text-xs space-y-1 overflow-hidden">
                              <p className="text-blue-800 font-medium break-words">Restaurado em {formatDate(usuario.data_restauracao)}</p>
                              <p className="text-blue-700 break-words">por {usuario.usuario_que_restaurou}</p>
                            </div>
                          )}

                          {/* Botão de Restaurar */}
                          {usuario.status_backup === 'ATIVO' && (
                            <Button
                              onClick={() => handleOpenRestoreDialog(usuario)}
                              variant="outline"
                              size="sm"
                              className="w-full text-green-600 hover:text-green-800 hover:bg-green-50 text-xs sm:text-sm"
                              disabled={isLoading}
                            >
                              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                              Restaurar Usuário
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* VISUALIZAÇÃO DESKTOP - Tabela */}
                  <div className="hidden lg:block overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuário
                            </th>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Perfil
                            </th>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Motivo da Deleção
                            </th>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Deletado por
                            </th>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data
                            </th>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {usuariosFiltrados.map((usuario) => (
                            <tr key={usuario.id_backup} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 xl:px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                      {usuario.nome_usuario}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                      {usuario.email}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Mat. #{usuario.matricula}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 xl:px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getBadgeColor(usuario.nivel_acesso)}`}>
                                  {usuario.nivel_acesso} - {usuario.nome_perfil}
                                </span>
                              </td>
                              <td className="px-4 xl:px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs break-words">
                                  {usuario.motivo_delecao}
                                </div>
                              </td>
                              <td className="px-4 xl:px-6 py-4 text-sm text-gray-500">
                                <div className="max-w-[150px] truncate">
                                  {usuario.usuario_que_deletou}
                                </div>
                              </td>
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-500 gap-1.5">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-xs">{formatDate(usuario.data_delecao)}</span>
                                </div>
                              </td>
                              <td className="px-4 xl:px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                  usuario.status_backup === 'ATIVO' ? 'bg-green-100 text-green-800' :
                                  usuario.status_backup === 'RESTAURADO' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {usuario.status_backup}
                                </span>
                                {usuario.status_backup === 'RESTAURADO' && usuario.data_restauracao && (
                                  <div className="text-xs text-gray-500 mt-1.5 max-w-[180px]">
                                    <div className="truncate">Restaurado em {formatDate(usuario.data_restauracao)}</div>
                                    <div className="truncate">por {usuario.usuario_que_restaurou}</div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 xl:px-6 py-4 text-sm font-medium">
                                {usuario.status_backup === 'ATIVO' && (
                                  <Button
                                    onClick={() => handleOpenRestoreDialog(usuario)}
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-800 hover:bg-green-50 whitespace-nowrap"
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={(open) => {
          setIsConfirmDialogOpen(open);
          if (!open) {
            setRestoreCandidate(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-green-600">
              <RotateCcw className="w-5 h-5" />
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Restaurar usuário
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-gray-600">
              Tem certeza de que deseja restaurar o usuário{' '}
              <span className="font-semibold text-gray-900">{restoreCandidate?.nome_usuario}</span>? Essa ação reativará o acesso do usuário com todas as permissões anteriores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelRestore} className="border-gray-300 text-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar restauração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
