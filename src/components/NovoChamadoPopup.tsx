import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


const formSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  problema: z.string().min(1, 'Tipo de problema é obrigatório'),
  prioridade: z.string().min(1, 'Prioridade é obrigatória'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  anexo: z.any().optional(),
});


type FormData = z.infer<typeof formSchema>;


interface Categoria {
  value: string;
  label: string;
  problemas: { value: string; label: string; }[];
}


interface NovoChamadoPopupProps {
  onClose: () => void;
  onSuccess?: () => void;
}


export const NovoChamadoPopup = ({ onClose, onSuccess }: NovoChamadoPopupProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const { user } = useAuth();


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });


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
    
    // Remove estilo antigo se já existir
    const oldStyle = document.getElementById('alertbox-force-zindex');
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


  // Categorias e problemas baseados na estrutura do sistema
  const categorias: Categoria[] = [
    {
      value: 'hardware',
      label: 'Hardware',
      problemas: [
        { value: 'computador-nao-liga', label: 'Computador não liga' },
        { value: 'tela-preta', label: 'Tela preta' },
        { value: 'travamento-frequente', label: 'Travamento frequente' },
        { value: 'lentidao-equipamento', label: 'Lentidão no equipamento' },
        { value: 'problema-teclado-mouse', label: 'Problema com teclado/mouse' },
        { value: 'outros-hardware', label: 'Outros problemas de hardware' }
      ]
    },
    {
      value: 'software',
      label: 'Software',
      problemas: [
        { value: 'erro-sistema', label: 'Erro no sistema' },
        { value: 'aplicativo-nao-abre', label: 'Aplicativo não abre' },
        { value: 'lentidao-sistema', label: 'Lentidão no sistema' },
        { value: 'perda-dados', label: 'Perda de dados' },
        { value: 'atualizacao-software', label: 'Problema com atualização' },
        { value: 'outros-software', label: 'Outros problemas de software' }
      ]
    },
    {
      value: 'rede',
      label: 'Rede e Conectividade',
      problemas: [
        { value: 'sem-internet', label: 'Sem acesso à internet' },
        { value: 'wifi-nao-conecta', label: 'Wi-Fi não conecta' },
        { value: 'lentidao-rede', label: 'Lentidão na rede' },
        { value: 'acesso-compartilhado', label: 'Problema com acesso compartilhado' },
        { value: 'outros-rede', label: 'Outros problemas de rede' }
      ]
    },
    {
      value: 'acesso',
      label: 'Acesso e Permissões',
      problemas: [
        { value: 'esqueci-senha', label: 'Esqueci minha senha' },
        { value: 'acesso-negado', label: 'Acesso negado ao sistema' },
        { value: 'criar-usuario', label: 'Criar novo usuário' },
        { value: 'alterar-permissoes', label: 'Alterar permissões' },
        { value: 'outros-acesso', label: 'Outros problemas de acesso' }
      ]
    },
    {
      value: 'email',
      label: 'Email',
      problemas: [
        { value: 'nao-recebe-email', label: 'Não está recebendo emails' },
        { value: 'nao-envia-email', label: 'Não consegue enviar emails' },
        { value: 'configurar-email', label: 'Configurar cliente de email' },
        { value: 'problema-anexo', label: 'Problema com anexos' },
        { value: 'outros-email', label: 'Outros problemas de email' }
      ]
    },
    {
      value: 'impressao',
      label: 'Impressão',
      problemas: [
        { value: 'impressora-nao-imprime', label: 'Impressora não imprime' },
        { value: 'qualidade-impressao', label: 'Problema na qualidade da impressão' },
        { value: 'configurar-impressora', label: 'Configurar impressora' },
        { value: 'papel-atolado', label: 'Papel atolado' },
        { value: 'outros-impressao', label: 'Outros problemas de impressão' }
      ]
    },
    {
      value: 'telefonia',
      label: 'Telefonia',
      problemas: [
        { value: 'telefone-nao-funciona', label: 'Telefone não funciona' },
        { value: 'problema-ramal', label: 'Problema com ramal' },
        { value: 'configurar-telefone', label: 'Configurar telefone' },
        { value: 'outros-telefonia', label: 'Outros problemas de telefonia' }
      ]
    },
    {
      value: 'outros',
      label: 'Outros',
      problemas: [
        { value: 'solicitacao-equipamento', label: 'Solicitação de equipamento' },
        { value: 'treinamento', label: 'Solicitação de treinamento' },
        { value: 'sugestao-melhoria', label: 'Sugestão de melhoria' },
        { value: 'outros-geral', label: 'Outros' }
      ]
    }
  ];


  // Watch categoria para atualizar problemas
  const categoriaWatched = watch('categoria');


  // Resetar problema quando categoria mudar
  useEffect(() => {
    if (categoriaWatched && categoriaWatched !== selectedCategoria) {
      setValue('problema', '');
      setSelectedCategoria(categoriaWatched);
    }
  }, [categoriaWatched, selectedCategoria, setValue]);


  // Função para criar chamado
  const criarChamado = async (data: FormData) => {
    try {
      setIsLoading(true);
      setError('');

      console.log('📝 Criando chamado:', data);
      console.log('👤 Usuário:', user?.email);

      // Preparar dados para envio
      const chamadoData = {
        prioridade_chamado: data.prioridade,
        descricao_categoria: data.categoria,
        descricao_problema: data.problema,
        descricao_detalhada: `Título: ${data.titulo}\n\nDescrição: ${data.descricao}`,
      };

      console.log('📤 Dados enviados:', chamadoData);

      const response = await fetch('http://localhost:3001/api/chamados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        },
        body: JSON.stringify(chamadoData),
      });

      console.log('📡 Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro da API:', errorData);
        throw new Error(errorData.message || 'Erro ao criar chamado');
      }

      const result = await response.json();
      console.log('✅ Chamado criado:', result);

      // Fechar modal e resetar formulário
      reset();
      onClose();

      // Aguardar fechar antes de mostrar alerta
      setTimeout(() => {
        showAlert(
          'success',
          `Chamado #${result.data?.id_chamado || 'XXX'} criado com sucesso!\n\nStatus: Aguardando aprovação do gestor.`
        );

        // Callback de sucesso após alerta
        if (onSuccess) {
          onSuccess();
        }
      }, 100);

    } catch (err: any) {
      console.error('❌ Erro ao criar chamado:', err);
      setError(err.message || 'Erro inesperado ao criar chamado');
      
      showAlert('error', err.message || 'Erro inesperado ao criar chamado');
    } finally {
      setIsLoading(false);
    }
  };


  const onSubmit = async (data: FormData) => {
    await criarChamado(data);
  };


  // Obter problemas da categoria selecionada
  const problemasDisponiveis = categorias.find(cat => cat.value === categoriaWatched)?.problemas || [];


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-900 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Abrir Novo Chamado</h2>
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Exibir erro se houver */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Erro:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Título */}
          <div>
            <Label htmlFor="titulo" className="text-purple-600">
              Título do Chamado <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              {...register('titulo')}
              className="mt-1"
              placeholder="Ex: Computador não liga, Problema com impressora, etc."
              disabled={isLoading}
            />
            {errors.titulo && (
              <p className="text-red-500 text-sm mt-1">{errors.titulo.message}</p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <Label htmlFor="categoria" className="text-purple-600">
              Categoria <span className="text-red-500">*</span>
            </Label>
            <select
              id="categoria"
              {...register('categoria')}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.value} value={categoria.value}>
                  {categoria.label}
                </option>
              ))}
            </select>
            {errors.categoria && (
              <p className="text-red-500 text-sm mt-1">{errors.categoria.message}</p>
            )}
          </div>

          {/* Problema - só aparece quando categoria está selecionada */}
          {problemasDisponiveis.length > 0 && (
            <div>
              <Label htmlFor="problema" className="text-purple-600">
                Tipo de Problema <span className="text-red-500">*</span>
              </Label>
              <select
                id="problema"
                {...register('problema')}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Selecione o tipo de problema</option>
                {problemasDisponiveis.map((problema) => (
                  <option key={problema.value} value={problema.value}>
                    {problema.label}
                  </option>
                ))}
              </select>
              {errors.problema && (
                <p className="text-red-500 text-sm mt-1">{errors.problema.message}</p>
              )}
            </div>
          )}

          {/* Prioridade */}
          <div>
            <Label htmlFor="prioridade" className="text-purple-600">
              Prioridade <span className="text-red-500">*</span>
            </Label>
            <select
              id="prioridade"
              {...register('prioridade')}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Selecione a prioridade</option>
              <option value="Baixa">🔵 Baixa - Não impacta o trabalho</option>
              <option value="Media">🟡 Média - Impacta parcialmente</option>
              <option value="Alta">🟠 Alta - Impacta significativamente</option>
              <option value="Urgente">🔴 Urgente - Impede o trabalho</option>
            </select>
            {errors.prioridade && (
              <p className="text-red-500 text-sm mt-1">{errors.prioridade.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao" className="text-purple-600">
              Descrição Detalhada <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              rows={4}
              className="mt-1 resize-vertical"
              placeholder="Descreva detalhadamente o problema ou solicitação. Inclua informações como: quando começou, o que você estava fazendo, mensagens de erro, etc."
              disabled={isLoading}
            />
            {errors.descricao && (
              <p className="text-red-500 text-sm mt-1">{errors.descricao.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Quanto mais detalhes você fornecer, mais rápida será a resolução do seu chamado.
            </p>
          </div>

          {/* Anexo */}
          <div>
            <Label htmlFor="anexo" className="text-purple-600">Anexar Arquivo (Opcional)</Label>
            <input
              type="file"
              id="anexo"
              {...register('anexo')}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF (máx. 10MB)
            </p>
          </div>

          {/* Botões */}
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
              disabled={isSubmitting || isLoading}
              className="px-8 py-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? 'Criando Chamado...' : 'Abrir Chamado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
