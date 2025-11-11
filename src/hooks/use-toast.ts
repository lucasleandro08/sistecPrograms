/**
 * @fileoverview Hook de Toast Notifications
 * 
 * Sistema global de notificações toast baseado em React Context e Reducer.
 * Inspirado em shadcn/ui Toast component.
 * 
 * Features:
 * - Gerenciamento global de toasts com reducer pattern
 * - Limite de toasts simultâneos
 * - Auto-dismiss com timeout configurável
 * - Suporte para atualização e dismissal de toasts específicos
 * - Sistema de listeners para sincronização entre componentes
 * - Tipagem TypeScript forte
 * 
 * @module hooks/use-toast
 */

import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

// ==========================================
// CONSTANTES
// ==========================================

/**
 * Configurações do sistema de toasts
 * @constant {Object}
 */
const TOAST_CONFIG = Object.freeze({
  /** Limite máximo de toasts simultâneos */
  LIMIT: 1,
  /** Delay antes de remover toast da memória (ms) */
  REMOVE_DELAY: 1000000
});

/**
 * Tipos de ações do reducer
 * @constant {Object}
 */
const ACTION_TYPES = Object.freeze({
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const);

// ==========================================
// TIPOS E INTERFACES
// ==========================================

/**
 * Toast com propriedades estendidas
 */
export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

/**
 * Tipos de ação do reducer
 */
type ActionType = typeof ACTION_TYPES

/**
 * Ações possíveis do reducer
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

/**
 * Estado do sistema de toasts
 */
interface State {
  toasts: ToasterToast[]
}

/**
 * Toast sem ID (antes de ser adicionado)
 */
export type Toast = Omit<ToasterToast, "id">

/**
 * Retorno do hook useToast
 */
export interface UseToastReturn extends State {
  /** Função para exibir um toast */
  toast: (props: Toast) => {
    id: string
    dismiss: () => void
    update: (props: ToasterToast) => void
  }
  /** Função para fechar toast(s) */
  dismiss: (toastId?: string) => void
}

// ==========================================
// ESTADO GLOBAL E LISTENERS
// ==========================================

/**
 * Estado global em memória
 * @private
 */
let memoryState: State = { toasts: [] }

/**
 * Lista de componentes ouvindo mudanças
 * @private
 */
const listeners: Array<(state: State) => void> = []

/**
 * Map de timeouts para remoção de toasts
 * @private
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Contador para gerar IDs únicos
 * @private
 */
let idCounter = 0

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Gera ID único para um toast
 * @private
 * @returns {string} ID único
 */
const generateId = (): string => {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER
  return idCounter.toString()
}

/**
 * Adiciona toast à fila de remoção
 * @private
 * @param {string} toastId - ID do toast
 */
const addToRemoveQueue = (toastId: string): void => {
  // Evitar duplicação de timeouts
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: ACTION_TYPES.REMOVE_TOAST,
      toastId: toastId,
    })
  }, TOAST_CONFIG.REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Notifica todos os listeners sobre mudança de estado
 * @private
 * @param {State} state - Novo estado
 */
const notifyListeners = (state: State): void => {
  listeners.forEach((listener) => {
    listener(state)
  })
}

/**
 * Adiciona toast à lista
 * @private
 * @param {State} state - Estado atual
 * @param {ToasterToast} toast - Toast a adicionar
 * @returns {State} Novo estado
 */
const addToast = (state: State, toast: ToasterToast): State => {
  return {
    ...state,
    toasts: [toast, ...state.toasts].slice(0, TOAST_CONFIG.LIMIT),
  }
}

/**
 * Atualiza toast existente
 * @private
 * @param {State} state - Estado atual
 * @param {Partial<ToasterToast>} toast - Dados para atualizar
 * @returns {State} Novo estado
 */
const updateToast = (state: State, toast: Partial<ToasterToast>): State => {
  return {
    ...state,
    toasts: state.toasts.map((t) =>
      t.id === toast.id ? { ...t, ...toast } : t
    ),
  }
}

/**
 * Fecha toast(s)
 * @private
 * @param {State} state - Estado atual
 * @param {string} [toastId] - ID do toast (se undefined, fecha todos)
 * @returns {State} Novo estado
 */
const dismissToast = (state: State, toastId?: string): State => {
  // Adicionar à fila de remoção
  if (toastId) {
    addToRemoveQueue(toastId)
  } else {
    state.toasts.forEach((toast) => {
      addToRemoveQueue(toast.id)
    })
  }

  // Marcar como fechado
  return {
    ...state,
    toasts: state.toasts.map((t) =>
      t.id === toastId || toastId === undefined
        ? { ...t, open: false }
        : t
    ),
  }
}

/**
 * Remove toast da lista
 * @private
 * @param {State} state - Estado atual
 * @param {string} [toastId] - ID do toast (se undefined, remove todos)
 * @returns {State} Novo estado
 */
const removeToast = (state: State, toastId?: string): State => {
  if (toastId === undefined) {
    return {
      ...state,
      toasts: [],
    }
  }
  
  return {
    ...state,
    toasts: state.toasts.filter((t) => t.id !== toastId),
  }
}

// ==========================================
// REDUCER
// ==========================================

/**
 * Reducer que gerencia o estado dos toasts
 * @param {State} state - Estado atual
 * @param {Action} action - Ação a executar
 * @returns {State} Novo estado
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ACTION_TYPES.ADD_TOAST:
      return addToast(state, action.toast)

    case ACTION_TYPES.UPDATE_TOAST:
      return updateToast(state, action.toast)

    case ACTION_TYPES.DISMISS_TOAST:
      return dismissToast(state, action.toastId)

    case ACTION_TYPES.REMOVE_TOAST:
      return removeToast(state, action.toastId)

    default:
      return state
  }
}

// ==========================================
// DISPATCH
// ==========================================

/**
 * Despacha uma ação e atualiza o estado global
 * @private
 * @param {Action} action - Ação a despachar
 */
function dispatch(action: Action): void {
  memoryState = reducer(memoryState, action)
  notifyListeners(memoryState)
}

// ==========================================
// FUNÇÕES PÚBLICAS
// ==========================================

/**
 * Exibe um toast
 * @param {Toast} props - Propriedades do toast
 * @returns {Object} Objeto com id, dismiss e update
 * 
 * @example
 * // Toast básico
 * toast({
 *   title: "Sucesso!",
 *   description: "Operação realizada com sucesso"
 * })
 * 
 * @example
 * // Toast com ação e controle
 * const { id, dismiss, update } = toast({
 *   title: "Processando...",
 *   description: "Aguarde"
 * })
 * 
 * // Atualizar depois
 * setTimeout(() => {
 *   update({
 *     id,
 *     title: "Completo!",
 *     description: "Processo finalizado"
 *   })
 * }, 2000)
 */
export function toast({ ...props }: Toast) {
  const id = generateId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: ACTION_TYPES.UPDATE_TOAST,
      toast: { ...props, id },
    })
    
  const dismiss = () => 
    dispatch({ 
      type: ACTION_TYPES.DISMISS_TOAST, 
      toastId: id 
    })

  dispatch({
    type: ACTION_TYPES.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

/**
 * Hook que gerencia toasts na aplicação
 * 
 * Fornece acesso ao estado global de toasts e funções para manipulá-los.
 * Usa sistema de listeners para sincronizar múltiplos componentes.
 * 
 * @returns {UseToastReturn} Estado e funções de controle
 * 
 * @example
 * // Uso básico em componente
 * function MyComponent() {
 *   const { toasts, toast, dismiss } = useToast()
 *   
 *   const handleClick = () => {
 *     toast({
 *       title: "Atenção",
 *       description: "Esta é uma notificação"
 *     })
 *   }
 *   
 *   return (
 *     <div>
 *       <button onClick={handleClick}>Exibir Toast</button>
 *       {toasts.map(t => (
 *         <ToastComponent key={t.id} {...t} />
 *       ))}
 *     </div>
 *   )
 * }
 */
export function useToast(): UseToastReturn {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    // Adicionar listener
    listeners.push(setState)
    
    // Cleanup: remover listener
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => 
      dispatch({ 
        type: ACTION_TYPES.DISMISS_TOAST, 
        toastId 
      }),
  }
}
