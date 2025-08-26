
import React, { useState } from 'react';
import { UserPlus, Edit, UserX, KeyRound } from 'lucide-react';
import { CadastrarUsuarioForm } from './CadastrarUsuarioForm';
import { RecuperarSenhaForm } from './RecuperarSenhaForm';

export const UserManagementCards = () => {
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [motivoDesativacao, setMotivoDesativacao] = useState('');

  const cards = [
    {
      title: 'Cadastrar Usuário',
      icon: UserPlus,
      action: () => setActiveForm('cadastrar')
    },
    {
      title: 'Editar Usuário',
      icon: Edit,
      action: () => setActiveForm('editar')
    },
    {
      title: 'Desativar Usuário',
      icon: UserX,
      action: () => setActiveForm('desativar')
    },
    {
      title: 'Recuperar Senha',
      icon: KeyRound,
      action: () => setActiveForm('recuperar')
    }
  ];

  const closeForm = () => {
    setActiveForm(null);
    setMotivoDesativacao('');
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={card.action}
            className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-lg font-medium text-gray-900 group-hover:text-orange-600 transition-colors duration-300 break-words">{card.title}</h3>
              </div>
              <div className="bg-orange-100 p-2 md:p-3 rounded-lg group-hover:bg-orange-200 transition-colors duration-300 flex-shrink-0 ml-2">
                <card.icon className="w-4 h-4 md:w-6 md:h-6 text-orange-500 group-hover:text-orange-600 transition-colors duration-300" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Formulários */}
      {(activeForm === 'cadastrar' || activeForm === 'editar' || activeForm === 'desativar') && (
        <CadastrarUsuarioForm
          onClose={closeForm}
          mode={activeForm as 'cadastrar' | 'editar' | 'desativar'}
          motivo={motivoDesativacao}
          onMotivoChange={setMotivoDesativacao}
        />
      )}

      {activeForm === 'recuperar' && (
        <RecuperarSenhaForm onClose={closeForm} />
      )}
    </>
  );
};
