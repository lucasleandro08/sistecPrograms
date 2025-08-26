
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { TicketsTable } from '@/components/TicketsTable';

const Chamados = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Todos os chamados</h1>
          </div>
          <TicketsTable />
        </main>
      </div>
    </div>
  );
};

export default Chamados;
