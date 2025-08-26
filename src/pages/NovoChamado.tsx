
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';

const NovoChamado = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="mb-4 md:mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Novo Chamado</h1>
              <p className="text-gray-600 mt-2 text-sm md:text-base">Utilize os cards abaixo para abrir um novo chamado ou gerenciar chamados existentes.</p>
            </div>
            <StatsCards />
          </div>
        </main>
      </div>
    </div>
  );
};

export default NovoChamado;
