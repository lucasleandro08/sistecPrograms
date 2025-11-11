/**
 * @fileoverview Cliente Supabase configurado
 * 
 * Cliente Supabase com Realtime habilitado para notificações em tempo real.
 * 
 * Features:
 * - Realtime: Postgres Changes tracking
 * - Auth: Sessão persistente e auto-refresh de tokens
 * - Global: Shared client instance
 * 
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Faltam variáveis de ambiente do Supabase! Verifique seu .env.local');
}

/**
 * Cliente Supabase configurado
 * 
 * Configurações:
 * - Realtime com 10 eventos/segundo
 * - Heartbeat a cada 15 segundos
 * - Sessão persistente
 * - Auto-refresh de tokens
 * - Log de debug habilitado
 * 
 * @constant {SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 15000, // 15 segundos
    log_level: 'info' // Log detalhado para debug
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'sistec-webapp'
    }
  }
});

// Log de inicialização
console.log('✅ Supabase client inicializado:', {
  url: supabaseUrl,
  realtime: 'enabled',
  eventsPerSecond: 10,
  heartbeat: '15s'
});
