import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  matricula: number;
  name: string;
  email: string;
  telefone: string;
  setor: string;
  cargo: string;
  id_aprovador: number;
  perfil: {                  
    id: number;
    nome: string;
    nivel_acesso: number;
    descricao?: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    

    if (response.ok && data.status === 200) {
      const userData: User = {
        id: data.data.user.id.toString(),
        matricula: data.data.user.matricula,
        name: data.data.user.name,
        email: data.data.user.email,
        telefone: data.data.user.telefone,
        setor: data.data.user.setor,
        cargo: data.data.user.cargo,
        id_aprovador: data.data.user.id_aprovador,
        perfil: {
          id: data.data.user.perfil.id,
          nome: data.data.user.perfil.nome,
          nivel_acesso: data.data.user.perfil.nivel_acesso,
          descricao: data.data.user.perfil.descricao
        }
      };
      
      
      setUser(userData);
      localStorage.setItem('sistec_user', JSON.stringify(userData));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sistec_user');
  };

  React.useEffect(() => {
    const savedUser = localStorage.getItem('sistec_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao recuperar usuário do localStorage:', error);
        localStorage.removeItem('sistec_user');
      }
    }
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
