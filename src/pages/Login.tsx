/**
 * @fileoverview Página de Login
 * 
 * Página de autenticação com formulário de login.
 * 
 * Heurísticas de Nielsen aplicadas:
 * - #1: Visibilidade do status do sistema (loading, feedback visual)
 * - #2: Correspondência entre sistema e mundo real (linguagem clara)
 * - #3: Controle e liberdade do usuário (mostrar/ocultar senha, cancelar)
 * - #4: Consistência e padrões (design system shadcn/ui)
 * - #5: Prevenção de erros (validação em tempo real)
 * - #6: Reconhecimento ao invés de memorização (placeholders descritivos)
 * - #7: Flexibilidade e eficiência (Enter para submit, Tab navigation)
 * - #8: Design estético e minimalista (foco no essencial)
 * - #9: Ajudar a reconhecer e recuperar de erros (mensagens claras e acionáveis)
 * - #10: Ajuda e documentação (link para recuperação de senha)
 * 
 * Responsividade:
 * - Mobile: Layout single column, logo reduzido
 * - Tablet: Layout adaptativo
 * - Desktop: Layout two columns com hero section
 * 
 * @module pages/Login
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Eye, EyeOff, AlertCircle, LogIn, HelpCircle } from 'lucide-react';
import { useLoginForm } from '@/hooks/useLoginForm';

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Configurações visuais
 * @constant {Object}
 */
const UI_CONFIG = Object.freeze({
  LOGO_PATH: '/lovable-uploads/c30e975a-8c4f-4949-af74-f6601fbd846e.png',
  LOGO_ALT: 'Sistec Logo',
  INPUT_HEIGHT: 'h-14',
  BUTTON_HEIGHT: 'h-14'
});

/**
 * Textos da interface
 * @constant {Object}
 */
const UI_TEXT = Object.freeze({
  HERO_TITLE: 'Sistema de Chamados',
  HERO_SUBTITLE: 'Gerencie seus chamados técnicos de forma eficiente',
  FORM_TITLE: 'Entrar no Sistema',
  FORM_SUBTITLE: 'Digite suas credenciais para acessar',
  EMAIL_LABEL: 'E-mail',
  EMAIL_PLACEHOLDER: 'seu.email@empresa.com',
  PASSWORD_LABEL: 'Senha',
  PASSWORD_PLACEHOLDER: 'Digite sua senha',
  FORGOT_PASSWORD: 'Esqueceu sua senha?',
  SUBMIT_BUTTON: 'Entrar',
  SUBMIT_LOADING: 'Entrando...',
  SHOW_PASSWORD_ARIA: 'Mostrar senha',
  HIDE_PASSWORD_ARIA: 'Ocultar senha',
  FORGOT_PASSWORD_TITLE: 'Redefinição de Senha',
  FORGOT_PASSWORD_MESSAGE: 'Por favor, entre em contato com o gestor do seu setor para solicitar a redefinição de senha ao suporte técnico.',
  FORGOT_PASSWORD_BUTTON: 'Entendido'
});

// ==========================================
// SUBCOMPONENTES
// ==========================================

/**
 * Seção Hero (Desktop only)
 * 
 * Heurística #8: Design estético e minimalista
 * Heurística #2: Correspondência com mundo real (linguagem clara)
 */
const HeroSection: React.FC = () => (
  <div 
    className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-16 text-white min-h-[600px]"
    role="img"
    aria-label="Seção de boas-vindas"
  >
    <div className="mb-12 animate-fade-in">
      <img 
        src={UI_CONFIG.LOGO_PATH}
        alt={UI_CONFIG.LOGO_ALT}
        className="w-40 h-40 object-contain drop-shadow-2xl"
        loading="eager"
      />
    </div>
    <h1 className="text-4xl font-bold text-center mb-6 animate-fade-in-up">
      {UI_TEXT.HERO_TITLE}
    </h1>
    <p className="text-purple-100 text-center text-xl animate-fade-in-up animation-delay-200">
      {UI_TEXT.HERO_SUBTITLE}
    </p>
  </div>
);

/**
 * Campo de E-mail
 * 
 * Heurística #6: Reconhecimento ao invés de memorização (placeholder descritivo)
 * Heurística #7: Flexibilidade (autocomplete)
 */
interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const EmailField: React.FC<EmailFieldProps> = ({ value, onChange, disabled }) => (
  <div className="space-y-3">
    <Label htmlFor="email" className="text-base font-medium">
      {UI_TEXT.EMAIL_LABEL}
    </Label>
    <Input
      id="email"
      name="email"
      type="email"
      placeholder={UI_TEXT.EMAIL_PLACEHOLDER}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required
      autoComplete="email"
      autoFocus
      className={`${UI_CONFIG.INPUT_HEIGHT} text-base transition-all focus:ring-2 focus:ring-purple-500`}
      aria-label={UI_TEXT.EMAIL_LABEL}
      aria-required="true"
    />
  </div>
);

/**
 * Campo de Senha com toggle de visibilidade
 * 
 * Heurística #3: Controle e liberdade (mostrar/ocultar senha)
 * Heurística #7: Flexibilidade (teclas de atalho)
 */
interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  disabled: boolean;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  disabled
}) => (
  <div className="space-y-3">
    <Label htmlFor="password" className="text-base font-medium">
      {UI_TEXT.PASSWORD_LABEL}
    </Label>
    <div className="relative">
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        placeholder={UI_TEXT.PASSWORD_PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        autoComplete="current-password"
        className={`${UI_CONFIG.INPUT_HEIGHT} pr-12 text-base transition-all focus:ring-2 focus:ring-purple-500`}
        aria-label={UI_TEXT.PASSWORD_LABEL}
        aria-required="true"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        disabled={disabled}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md p-1"
        aria-label={showPassword ? UI_TEXT.HIDE_PASSWORD_ARIA : UI_TEXT.SHOW_PASSWORD_ARIA}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Eye className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
    </div>
  </div>
);

/**
 * Mensagem de Erro
 * 
 * Heurística #1: Visibilidade do status do sistema
 * Heurística #9: Ajudar a reconhecer e recuperar de erros
 */
interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div 
    className="flex items-center gap-3 text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-200 animate-shake"
    role="alert"
    aria-live="polite"
  >
    <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
    <span>{message}</span>
  </div>
);

/**
 * Dialog de Recuperação de Senha
 * 
 * Heurística #10: Ajuda e documentação
 * Heurística #2: Correspondência com mundo real
 */
interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md bg-card border-border shadow-xl sm:rounded-lg">
      <DialogHeader className="space-y-4">
        <div className="flex justify-center mb-2">
          <HelpCircle className="w-12 h-12 text-purple-600" aria-hidden="true" />
        </div>
        <DialogTitle className="text-xl font-semibold text-center text-foreground">
          {UI_TEXT.FORGOT_PASSWORD_TITLE}
        </DialogTitle>
        <DialogDescription className="text-center text-base leading-relaxed pt-2 text-muted-foreground">
          {UI_TEXT.FORGOT_PASSWORD_MESSAGE}
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center pt-6">
        <Button 
          onClick={() => onOpenChange(false)}
          className="px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all"
          aria-label="Fechar diálogo"
        >
          {UI_TEXT.FORGOT_PASSWORD_BUTTON}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

/**
 * Página de Login
 * 
 * Responsividade:
 * - Mobile (< 768px): Single column, logo compacto
 * - Tablet (768px - 1024px): Layout adaptativo
 * - Desktop (> 1024px): Two columns com hero section
 */
const Login: React.FC = () => {
  const { state, actions } = useLoginForm();
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4"
      role="main"
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Hero Section - Desktop only */}
        <HeroSection />

        {/* Login Form Section - Responsive */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-lg shadow-xl border-0 animate-fade-in">
            <CardHeader className="space-y-1 pb-8 px-6 sm:px-8">
              {/* Logo Mobile/Tablet */}
              <div className="flex justify-center mb-6 lg:hidden">
                <img 
                  src={UI_CONFIG.LOGO_PATH}
                  alt={UI_CONFIG.LOGO_ALT}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                  loading="eager"
                />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900">
                {UI_TEXT.FORM_TITLE}
              </h2>
              <p className="text-gray-600 text-center text-base sm:text-lg">
                {UI_TEXT.FORM_SUBTITLE}
              </p>
            </CardHeader>
            
            <CardContent className="px-6 sm:px-8 pb-8">
              <form 
                onSubmit={actions.handleSubmit} 
                className="space-y-6"
                noValidate
                aria-label="Formulário de login"
              >
                {/* Campo E-mail */}
                <EmailField
                  value={state.email}
                  onChange={actions.setEmail}
                  disabled={state.isLoading}
                />

                {/* Campo Senha */}
                <PasswordField
                  value={state.password}
                  onChange={actions.setPassword}
                  showPassword={state.showPassword}
                  onToggleVisibility={actions.togglePasswordVisibility}
                  disabled={state.isLoading}
                />

                {/* Mensagem de Erro */}
                {state.error && <ErrorMessage message={state.error} />}

                {/* Link Esqueceu Senha */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordDialog(true)}
                    disabled={state.isLoading}
                    className="text-sm sm:text-base text-purple-600 hover:text-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md px-2 py-1 disabled:opacity-50"
                    aria-label="Abrir ajuda para recuperação de senha"
                  >
                    {UI_TEXT.FORGOT_PASSWORD}
                  </button>
                </div>

                {/* Botão Submit */}
                <Button
                  type="submit"
                  className={`w-full ${UI_CONFIG.BUTTON_HEIGHT} bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-full text-base sm:text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none`}
                  disabled={state.isLoading}
                  aria-busy={state.isLoading}
                >
                  {state.isLoading ? (
                    <>
                      <span className="inline-block animate-spin mr-2" role="status" aria-label="Carregando">⏳</span>
                      {UI_TEXT.SUBMIT_LOADING}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
                      {UI_TEXT.SUBMIT_BUTTON}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog
        open={showForgotPasswordDialog}
        onOpenChange={setShowForgotPasswordDialog}
      />
    </div>
  );
};

export default Login;
