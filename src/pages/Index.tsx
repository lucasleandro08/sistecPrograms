
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { StatsCards } from '@/components/StatsCards';
import { TicketsTable } from '@/components/TicketsTable';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <StatsCards />
          <TicketsTable />
        </main>
      </div>
    </div>
  );
};

export default Index;
