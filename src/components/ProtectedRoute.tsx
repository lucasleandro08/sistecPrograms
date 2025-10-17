import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import Login from '@/pages/Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <Sidebar />
      <Header />
      
      <main className="pt-20 md:ml-64 min-h-screen bg-gray-50">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  );
};

export default ProtectedRoute;
