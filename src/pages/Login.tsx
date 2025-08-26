
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('E-mail ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Logo Section */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-16 text-white min-h-[600px]">
          <div className="mb-12">
            <img 
              src="/lovable-uploads/c30e975a-8c4f-4949-af74-f6601fbd846e.png" 
              alt="Sistec Logo"
              className="w-40 h-40 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-center mb-6">
            Sistema de Chamados
          </h1>
          <p className="text-purple-100 text-center text-xl">
            Gerencie seus chamados técnicos de forma eficiente
          </p>
        </div>

        {/* Login Form Section */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-lg shadow-xl border-0">
            <CardHeader className="space-y-1 pb-8">
              <div className="flex justify-center mb-8 lg:hidden">
                <img 
                  src="/lovable-uploads/c30e975a-8c4f-4949-af74-f6601fbd846e.png" 
                  alt="Sistec Logo"
                  className="w-20 h-20 object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-center text-gray-900">
                Entrar no Sistema
              </h2>
              <p className="text-gray-600 text-center text-lg">
                Digite suas credenciais para acessar
              </p>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite o seu e-mail de login"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-base">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 pr-12 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordDialog(true)}
                    className="text-base text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-full text-base"
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  Para teste, use: admin@sistec.com / admin123
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="max-w-md bg-card border-border shadow-xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-xl font-semibold text-center text-foreground">
              Redefinição de Senha
            </DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed pt-2 text-muted-foreground">
              Por favor, entre em contato com o gestor do seu setor para que ele possa solicitar a redefinição de senha ao suporte técnico.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-6">
            <Button 
              onClick={() => setShowForgotPasswordDialog(false)}
              className="px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
