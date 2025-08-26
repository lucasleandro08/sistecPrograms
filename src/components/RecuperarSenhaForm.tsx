
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

const formSchema = z.object({
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

interface RecuperarSenhaFormProps {
  onClose: () => void;
}

export const RecuperarSenhaForm = ({ onClose }: RecuperarSenhaFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    console.log('Dados do formulário de recuperação de senha:', data);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gray-900 text-white p-4 md:p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-2xl font-bold">Recuperar Senha</h2>
              <span className="text-orange-400 text-sm md:text-base">| Formulário</span>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-700 flex-shrink-0"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div>
            <Label htmlFor="matricula" className="text-purple-600 text-sm md:text-base">Matrícula</Label>
            <Input
              id="matricula"
              {...register('matricula')}
              className="mt-1 text-sm md:text-base"
              placeholder="Digite a matrícula do usuário"
            />
            {errors.matricula && (
              <p className="text-red-500 text-sm mt-1">{errors.matricula.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="motivo" className="text-purple-600 text-sm md:text-base">Motivo da troca de senha</Label>
            <Input
              id="motivo"
              {...register('motivo')}
              className="mt-1 text-sm md:text-base"
              placeholder="Digite o motivo da troca de senha"
            />
            {errors.motivo && (
              <p className="text-red-500 text-sm mt-1">{errors.motivo.message}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-4 md:pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 md:px-8 py-2 border-purple-500 text-purple-500 hover:bg-purple-50 text-sm md:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 md:px-8 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base"
            >
              {isSubmitting ? 'Processando...' : 'Gerar Nova Senha'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
