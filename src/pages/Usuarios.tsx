
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { UserManagementCards } from '@/components/UserManagementCards';
import { UsersTable } from '@/components/UsersTable';

const Usuarios = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          </div>
          <UserManagementCards />
          <UsersTable />
        </main>
      </div>
    </div>
  );
};

export default Usuarios;
