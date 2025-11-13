import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, AlertCircle, UserPlus, Edit, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
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
  senha: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .or(z.literal(''))
    .optional(),
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [processando, setProcessando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();


  useEffect(() => {
    setMotivoInterno(motivo || '');
  }, [motivo]);


  // MutationObserver para forçar z-index do alertbox
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'alertbox-force-zindex-cadastrar-usuario';
    style.innerHTML = `
      .alertBoxBody,
      .alertBoxBody *,
      div[class*="alert"],
      div[id*="alert"] {
        z-index: 2147483647 !important;
      }
    `;
    
    const oldStyle = document.getElementById('alertbox-force-zindex-cadastrar-usuario');
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


  const ALERT_STYLES = {
    success: { alertIcon: 'success', title: 'Sucesso!', themeColor: '#16a34a', btnColor: '#22c55e' },
    error: { alertIcon: 'error', title: 'Erro!', themeColor: '#dc2626', btnColor: '#ef4444' },
    warning: { alertIcon: 'warning', title: 'Atenção!', themeColor: '#ea580c', btnColor: '#f97316' },
    info: { alertIcon: 'info', title: 'Informação', themeColor: '#3b82f6', btnColor: '#60a5fa' },
  } as const;

  const ACTION_ALERT_STYLES: Record<Mode, { alertIcon: string; title: string; themeColor: string; btnColor: string }> = {
    cadastrar: {
      alertIcon: 'success',
      title: 'Usuário cadastrado com sucesso!',
      themeColor: '#7c3aed',
      btnColor: '#8b5cf6',
    },
    editar: {
      alertIcon: 'info',
      title: 'Usuário atualizado!',
      themeColor: '#2563eb',
      btnColor: '#3b82f6',
    },
    desativar: {
      alertIcon: 'warning',
      title: 'Usuário desativado!',
      themeColor: '#dc2626',
      btnColor: '#ef4444',
    },
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

  const showAlert = (type: keyof typeof ALERT_STYLES, message: string) => {
    renderAlertWithConfig(ALERT_STYLES[type], message);
  };

  const showActionAlert = (currentMode: Mode, message: string) => {
    renderAlertWithConfig(ACTION_ALERT_STYLES[currentMode], message);
  };

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


  // Função para gerar email automaticamente
  const gerarEmail = (nome: string, sobrenome: string) => {
    if (!nome || !sobrenome) return '';
    
    // Remove acentos e caracteres especiais
    const removerAcentos = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    
    // Pega o primeiro nome
    const primeiroNome = removerAcentos(nome.trim().split(' ')[0]).toLowerCase();
    
    // Pega o último sobrenome
    const sobrenomes = sobrenome.trim().split(' ').filter(s => s.length > 0);
    const ultimoSobrenome = sobrenomes.length > 0 
      ? removerAcentos(sobrenomes[sobrenomes.length - 1]).toLowerCase() 
      : '';
    
    if (!primeiroNome || !ultimoSobrenome) return '';
    
    return `${primeiroNome}.${ultimoSobrenome}@sistec.com.br`;
  };


  // Função para gerar senha padrão: primeiroNome + ÚLTIMOS 4 números do telefone
  const gerarSenhaPadrao = (nome: string, telefone: string) => {
    if (!nome || !telefone) return '';
    
    // Remove acentos do nome
    const removerAcentos = (str: string) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    
    // Pega o primeiro nome
    const primeiroNome = removerAcentos(nome.trim().split(' ')[0]);
    
    // Extrai apenas números do telefone
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Pega os ÚLTIMOS 4 dígitos do telefone (ou menos se não tiver 4)
    const ultimosNumeros = apenasNumeros.slice(-4);
    
    if (!primeiroNome || !ultimosNumeros) return '';
    
    // Retorna: PrimeiroNome + últimos 4 números
    // Exemplo: João com telefone (11) 98765-4321 = Joao4321
    return `${primeiroNome}${ultimosNumeros}`;
  };


  // Watch para mudanças nos campos nome, sobrenome e telefone
  const nome = watch('nome');
  const sobrenome = watch('sobrenome');
  const telefone = watch('telefone');


  // Atualiza o email automaticamente quando nome ou sobrenome mudam
  useEffect(() => {
    if (mode === 'cadastrar' && nome && sobrenome) {
      const emailGerado = gerarEmail(nome, sobrenome);
      if (emailGerado) {
        setValue('email', emailGerado);
      }
    }
  }, [nome, sobrenome, mode, setValue]);


  // Atualiza a senha automaticamente quando nome ou telefone mudam
  useEffect(() => {
    if (mode === 'cadastrar' && nome && telefone) {
      const senhaGerada = gerarSenhaPadrao(nome, telefone);
      if (senhaGerada) {
        setValue('senha', senhaGerada);
      }
    }
  }, [nome, telefone, mode, setValue]);


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
      senha: data.senha || gerarSenhaPadrao(data.nome, data.telefone),
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
    
    const updateData: Record<string, unknown> = {
      nome_usuario: `${data.nome} ${data.sobrenome}`,
      setor_usuario: data.setor,
      cargo_usuario: data.cargo,
      email: data.email,
      tel_usuarios: data.telefone,
      id_perfil_usuario: parseInt(data.id_perfil_usuario),
    };

    if (data.senha && data.senha.trim().length >= 6) {
      updateData.senha = data.senha.trim();
    }


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


  // Validação antes de abrir o modal de confirmação
  const handleFormSubmit = (data: FormData) => {
    if (mode === 'desativar' && (!motivoInterno || motivoInterno.trim().length < 10)) {
      showAlert('warning', 'Motivo da desativação deve ter pelo menos 10 caracteres');
      return;
    }


    setPendingFormData(data);
    setShowConfirmModal(true);
  };


  // Execução confirmada
  const handleConfirm = async () => {
    if (!pendingFormData) return;


    try {
      setProcessando(true);
      let result;
      let successMessage = '';


      switch (mode) {
        case 'cadastrar':
          result = await cadastrarUsuario(pendingFormData);
          successMessage = `Usuário "${pendingFormData.nome} ${pendingFormData.sobrenome}" cadastrado com sucesso!`;
          break;
        case 'editar':
          result = await editarUsuario(pendingFormData);
          successMessage = `Usuário "${pendingFormData.nome} ${pendingFormData.sobrenome}" editado com sucesso!`;
          break;
        case 'desativar':
          result = await desativarUsuario();
          successMessage = `Usuário "${userData.nome_usuario}" desativado com sucesso!`;
          break;
        default:
          break;
      }


      console.log('Sucesso:', result);
      
      setShowConfirmModal(false);
      setPendingFormData(null);
      setProcessando(false);
      reset();
      onClose();


      setTimeout(() => {
        showActionAlert(mode, successMessage);

        if (onSuccess) {
          onSuccess();
        }
      }, 100);


    } catch (err: any) {
      console.error('Erro:', err);
      const errorMessage = err.message || 'Erro inesperado';
      
      setShowConfirmModal(false);
      setPendingFormData(null);
      setProcessando(false);


      setTimeout(() => {
        showAlert('error', errorMessage);
      }, 100);
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


  const getConfirmationIcon = () => {
    switch (mode) {
      case 'cadastrar':
        return <UserPlus className="w-8 h-8 text-purple-600" />;
      case 'editar':
        return <Edit className="w-8 h-8 text-blue-600" />;
      case 'desativar':
        return <Trash2 className="w-8 h-8 text-red-600" />;
    }
  };


  const getConfirmationColor = () => {
    switch (mode) {
      case 'cadastrar':
        return { bg: 'bg-purple-100', text: 'text-purple-600', btn: 'bg-purple-600 hover:bg-purple-700', header: 'bg-purple-600' };
      case 'editar':
        return { bg: 'bg-blue-100', text: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700', header: 'bg-blue-600' };
      case 'desativar':
        return { bg: 'bg-red-100', text: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700', header: 'bg-red-600' };
    }
  };


  const getConfirmationMessage = () => {
    if (!pendingFormData) return '';
    
    switch (mode) {
      case 'cadastrar':
        return `Tem certeza que deseja cadastrar o usuário "${pendingFormData.nome} ${pendingFormData.sobrenome}"?`;
      case 'editar':
        return `Tem certeza que deseja salvar as alterações do usuário "${pendingFormData.nome} ${pendingFormData.sobrenome}"?`;
      case 'desativar':
        return `Tem certeza que deseja desativar o usuário "${userData.nome_usuario}"? Esta ação não poderá ser desfeita diretamente.`;
    }
  };


  const colors = getConfirmationColor();


  return (
    <>
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


          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
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
                    readOnly={mode === 'cadastrar'}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                  {mode === 'cadastrar' && (
                    <p className="text-gray-500 text-xs mt-1">
                      Email gerado automaticamente
                    </p>
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


                {(mode === 'cadastrar' || mode === 'editar') && (
                  <div>
                    <Label htmlFor="senha" className="text-purple-600">
                      {mode === 'cadastrar' ? 'Senha Inicial' : 'Nova Senha'}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="senha"
                        type={showPassword ? 'text' : 'password'}
                        {...register('senha')}
                        placeholder={
                          mode === 'cadastrar'
                            ? 'Senha gerada automaticamente'
                            : 'Deixe em branco para manter a senha atual'
                        }
                        readOnly={mode === 'cadastrar'}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.senha && (
                      <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {mode === 'cadastrar'
                        ? 'Senha: PrimeiroNome + últimos 4 dígitos do telefone'
                        : 'Informe nova senha (mínimo 6 caracteres) ou deixe em branco para manter a atual'}
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


      {/* Modal de Confirmação */}
      {showConfirmModal && pendingFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className={`${colors.header} text-white p-4 rounded-t-lg`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Confirmar {getTitle()}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {getConfirmationIcon()}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {getConfirmationMessage()}
                </h4>
                {mode === 'desativar' && (
                  <div className="mt-4 bg-gray-50 p-3 rounded text-left">
                    <p className="text-sm text-gray-600 mb-1"><strong>Motivo:</strong></p>
                    <p className="text-sm text-gray-900">{motivoInterno}</p>
                  </div>
                )}
              </div>


              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingFormData(null);
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={processando}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={processando}
                  className={`${colors.btn} text-white flex-1`}
                >
                  {processando ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processando...
                    </div>
                  ) : (
                    `Sim, ${getButtonText()}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};