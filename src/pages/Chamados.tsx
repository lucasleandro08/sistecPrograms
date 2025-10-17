import React from 'react';
import { TicketsTable } from '@/components/TicketsTable';

const Chamados = () => {
  return (
    <>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Todos os chamados</h1>
      </div>
      <TicketsTable />
    </>
  );
};

export default Chamados;
