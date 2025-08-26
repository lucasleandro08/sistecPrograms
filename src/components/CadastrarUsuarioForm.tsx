import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sobrenome: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  ramal: z.string().optional(),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  setor: z.string().min(1, 'Setor é obrigatório'),
  id_perfil_usuario: z.string().min(1, 'Nível de acesso é obrigatório'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CadastrarUsuarioFormProps {
  onClose: () => void;
  mode: 'cadastrar' | 'editar' | 'desativar';
  motivo?: string;
  onMotivoChange?: (motivo: string) => void;
  userData?: any;
  onSuccess?: () => void;
}

export const CadastrarUsuarioForm = ({ 
  onClose, 
  mode, 
  motivo, 
  onMotivoChange,
  userData,
  onSuccess 
}: CadastrarUsuarioFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [motivoInterno, setMotivoInterno] = useState(motivo || '');
  const { user } = useAuth();

  useEffect(() => {
    setMotivoInterno(motivo || '');
  }, [motivo]);
  //debug né, desativar dpsXD
  useEffect(() => {
    console.log('=== DEBUG USUÁRIO FORMULÁRIO ===');
    console.log('Mode:', mode);
    console.log('Dados do usuário:', user);
    console.log('UserData recebido:', userData);
    console.log('Está autenticado?', user ? 'SIM' : 'NÃO');
    console.log('Email:', user?.email);
    console.log('Perfil:', user?.perfil?.nome);
    console.log('Nível de acesso:', user?.perfil?.nivel_acesso);
    console.log('Motivo atual:', motivoInterno);
    console.log('===============================');
  }, [user, userData, mode, motivoInterno]);

const PERFIS_ACESSO = [
  { id: 1, nome: 'Usuário', nivel: 1 },
  { id: 2, nome: 'Analista de Suporte', nivel: 2 },
  { id: 5, nome: 'Gestor de Chamados', nivel: 3 }, 
  { id: 3, nome: 'Gerente de Suporte', nivel: 4 }, 
  { id: 4, nome: 'Administrador', nivel: 5 } 
];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: userData ? {
      nome: userData.nome_usuario?.split(' ')[0] || '',
      sobrenome: userData.nome_usuario?.split(' ').slice(1).join(' ') || '',
      email: userData.email || '',
      telefone: userData.tel_usuarios || '',
      cargo: userData.cargo_usuario || '',
      setor: userData.setor_usuario || '',
      id_perfil_usuario: userData.id_perfil_usuario?.toString() || '',
    } : {}
  });

  const handleMotivoChange = (value: string) => {
    console.log('Motivo alterado para:', value);
    setMotivoInterno(value);
    if (onMotivoChange) {
      onMotivoChange(value);
    }
  };

  const cadastrarUsuario = async (data: FormData) => {
    const userData = {
      nome_usuario: `${data.nome} ${data.sobrenome}`,
      setor_usuario: data.setor,
      cargo_usuario: data.cargo,
      email: data.email,
      senha: data.senha || 'senha123',
      tel_usuarios: data.telefone,
      id_perfil_usuario: parseInt(data.id_perfil_usuario),
    };

    const response = await fetch('http://localhost:3001/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '', 
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao cadastrar usuário');
    }

    return response.json();
  };

  const editarUsuario = async (data: FormData) => {
    console.log('Iniciando edição do usuário');
    console.log('Email do usuário logado:', user?.email);
    console.log('UserData:', userData);
    
    if (!userData || !userData.id_usuario) {
      throw new Error('Dados do usuário não encontrados para edição');
    }
    
    console.log('ID do usuário sendo editado:', userData.id_usuario);
    
    const updateData = {
      nome_usuario: `${data.nome} ${data.sobrenome}`,
      setor_usuario: data.setor,
      cargo_usuario: data.cargo,
      email: data.email,
      tel_usuarios: data.telefone,
      id_perfil_usuario: parseInt(data.id_perfil_usuario),
    };

    const response = await fetch(`http://localhost:3001/api/users/${userData.id_usuario}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao editar usuário');
    }

    return response.json();
  };

  const desativarUsuario = async () => {
    if (!userData || !userData.id_usuario) {
      throw new Error('Dados do usuário não encontrados para desativação');
    }
    
    const motivoFinal = motivoInterno.trim();
    console.log('Motivo final para desativação:', motivoFinal);
    
    if (!motivoFinal || motivoFinal.length < 10) {
      throw new Error('Motivo da desativação deve ter pelo menos 10 caracteres');
    }

    const response = await fetch(`http://localhost:3001/api/users/${userData.id_usuario}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      },
      body: JSON.stringify({ motivo: motivoFinal }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao desativar usuário');
    }

    return response.json();
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');

    try {
      let result;

      switch (mode) {
        case 'cadastrar':
          result = await cadastrarUsuario(data);
          break;
        case 'editar':
          result = await editarUsuario(data);
          break;
        case 'desativar':
          if (!motivoInterno || motivoInterno.trim().length < 10) {
            setError('Motivo da desativação deve ter pelo menos 10 caracteres');
            setIsLoading(false);
            return;
          }
          result = await desativarUsuario();
          break;
        default:
          break;
      }

      console.log('Sucesso:', result);
      
      if (onSuccess) {
        onSuccess();
      }
      
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

 const canCreateProfile = (perfilNivel: number) => {
  console.log('Verificando perfil:', perfilNivel, 'Usuário nível:', user?.perfil?.nivel_acesso);
  
  if (!user?.perfil?.nivel_acesso) {
    console.log('Usuário sem nível de acesso');
    return false;
  }
  
  if (user.perfil.nivel_acesso >= 5) {
    console.log('Admin pode criar perfil', perfilNivel);
    return true;
  }
  
  if (user.perfil.nivel_acesso >= 4 && perfilNivel < 5) {
    console.log('Gerente pode criar perfil', perfilNivel);
    return true;
  }
  
  console.log('Usuário não pode criar perfil', perfilNivel);
  return false;
};

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTitle = () => {
    switch (mode) {
      case 'editar':
        return 'Editar Usuário';
      case 'desativar':
        return 'Desativar Usuário';
      default:
        return 'Cadastrar Novo Usuário';
    }
  };

  const getButtonText = () => {
    switch (mode) {
      case 'editar':
        return 'Salvar';
      case 'desativar':
        return 'Desativar';
      default:
        return 'Cadastrar';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-900 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{getTitle()}</h2>
              <span className="text-orange-400">| Formulário</span>
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Dados pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-purple-600">Nome</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  className="mt-1"
                  placeholder="Digite o nome"
                  disabled={mode === 'desativar'}
                />
                {errors.nome && (
                  <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="sobrenome" className="text-purple-600">Sobrenome</Label>
                <Input
                  id="sobrenome"
                  {...register('sobrenome')}
                  className="mt-1"
                  placeholder="Digite o sobrenome"
                  disabled={mode === 'desativar'}
                />
                {errors.sobrenome && (
                  <p className="text-red-500 text-sm mt-1">{errors.sobrenome.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Contato:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email" className="text-purple-600">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="mt-1"
                  placeholder="Digite o e-mail"
                  disabled={mode === 'desativar'}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="telefone" className="text-purple-600">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  className="mt-1"
                  placeholder="Digite o telefone"
                  disabled={mode === 'desativar'}
                />
                {errors.telefone && (
                  <p className="text-red-500 text-sm mt-1">{errors.telefone.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="ramal" className="text-purple-600">Ramal (Opcional)</Label>
                <Input
                  id="ramal"
                  {...register('ramal')}
                  className="mt-1"
                  placeholder="Digite o ramal"
                  disabled={mode === 'desativar'}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Informações Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="cargo" className="text-purple-600">Cargo/ Função</Label>
                <Input
                  id="cargo"
                  {...register('cargo')}
                  className="mt-1"
                  placeholder="Digite o cargo"
                  disabled={mode === 'desativar'}
                />
                {errors.cargo && (
                  <p className="text-red-500 text-sm mt-1">{errors.cargo.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="setor" className="text-purple-600">Setor/ Departamento</Label>
                <Input
                  id="setor"
                  {...register('setor')}
                  className="mt-1"
                  placeholder="Digite o setor"
                  disabled={mode === 'desativar'}
                />
                {errors.setor && (
                  <p className="text-red-500 text-sm mt-1">{errors.setor.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="id_perfil_usuario" className="text-purple-600">Nível de Acesso</Label>
                <Select 
                  onValueChange={(value) => setValue('id_perfil_usuario', value)}
                  defaultValue={userData?.id_perfil_usuario?.toString()}
                  disabled={mode === 'desativar'}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o nível de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFIS_ACESSO
                      .filter(perfil => canCreateProfile(perfil.nivel))
                      .map((perfil) => (
                        <SelectItem 
                          key={perfil.id} 
                          value={perfil.id.toString()}
                        >
                          {perfil.nivel} - {perfil.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>  
                </Select>
                {errors.id_perfil_usuario && (
                  <p className="text-red-500 text-sm mt-1">{errors.id_perfil_usuario.message}</p>
                )}
              </div>

              {mode === 'cadastrar' && (
                <div>
                  <Label htmlFor="senha" className="text-purple-600">Senha Inicial</Label>
                  <Input
                    id="senha"
                    type="password"
                    {...register('senha')}
                    className="mt-1"
                    placeholder="Digite a senha inicial (min. 6 caracteres)"
                  />
                  {errors.senha && (
                    <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Se não informada, será usado "senha123" como padrão
                  </p>
                </div>
              )}
            </div>
          </div>

          {mode === 'desativar' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Motivo da Desativação</h3>
              <div>
                <Label htmlFor="motivo" className="text-purple-600">Motivo</Label>
                <Input
                  id="motivo"
                  value={motivoInterno}
                  onChange={(e) => handleMotivoChange(e.target.value)}
                  className="mt-1"
                  placeholder="Digite o motivo da desativação (mínimo 10 caracteres)"
                  required
                  disabled={isLoading}
                />
                <p className="text-gray-500 text-xs mt-1">
                  {motivoInterno.length}/10 caracteres mínimos
                </p>
                {motivoInterno.length > 0 && motivoInterno.length < 10 && (
                  <p className="text-red-500 text-xs mt-1">
                    Motivo deve ter pelo menos 10 caracteres
                  </p>
                )}
                {motivoInterno.length >= 10 && (
                  <p className="text-green-500 text-xs mt-1">
                    ✓ Motivo válido
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-end pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-8 py-2 border-purple-500 text-purple-500 hover:bg-purple-50"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || (mode === 'desativar' && motivoInterno.length < 10)}
              className="px-8 py-2 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={scrollToTop}
            >
              {isLoading ? 'Processando...' : getButtonText()}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
