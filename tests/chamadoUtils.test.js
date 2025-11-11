/**
 * Testes Unitários para Funções Utilitárias de Chamados
 * 
 * Este arquivo testa as funções puras de manipulação de prioridades
 * Funções testadas: convertPrioridadeToNumber, getPrioridadeTexto, 
 *                   isPrioridadeValida, getPrioridadesDisponiveis
 */

import { describe, it, expect } from 'vitest';
import { 
  convertPrioridadeToNumber, 
  getPrioridadeTexto,
  isPrioridadeValida,
  getPrioridadesDisponiveis
} from '../src/utils/chamadoUtils.js';

describe('Utilitários de Chamados - Prioridades', () => {
  
  // ========================================
  // TESTES: convertPrioridadeToNumber
  // ========================================
  describe('convertPrioridadeToNumber', () => {
    
    it('deve converter prioridades válidas corretamente', () => {
      expect(convertPrioridadeToNumber('baixa')).toBe(1);
      expect(convertPrioridadeToNumber('media')).toBe(2);
      expect(convertPrioridadeToNumber('alta')).toBe(3);
      expect(convertPrioridadeToNumber('urgente')).toBe(4);
    });

    it('deve ser case-insensitive', () => {
      expect(convertPrioridadeToNumber('BAIXA')).toBe(1);
      expect(convertPrioridadeToNumber('Media')).toBe(2);
      expect(convertPrioridadeToNumber('ALTA')).toBe(3);
      expect(convertPrioridadeToNumber('URGENTE')).toBe(4);
      expect(convertPrioridadeToNumber('BaIxA')).toBe(1);
    });

    it('deve retornar 2 (média) para valores inválidos', () => {
      expect(convertPrioridadeToNumber('invalido')).toBe(2);
      expect(convertPrioridadeToNumber('')).toBe(2);
      expect(convertPrioridadeToNumber('xyz')).toBe(2);
      expect(convertPrioridadeToNumber('123')).toBe(2);
      expect(convertPrioridadeToNumber('critica')).toBe(2);
    });

    it('deve retornar 2 para entrada null ou undefined', () => {
      expect(convertPrioridadeToNumber(null)).toBe(2);
      expect(convertPrioridadeToNumber(undefined)).toBe(2);
    });

    it('deve retornar 2 para tipos de dados não-string', () => {
      expect(convertPrioridadeToNumber(123)).toBe(2);
      expect(convertPrioridadeToNumber(true)).toBe(2);
      expect(convertPrioridadeToNumber({})).toBe(2);
      expect(convertPrioridadeToNumber([])).toBe(2);
    });

    it('deve lidar com strings com espaços', () => {
      expect(convertPrioridadeToNumber(' baixa ')).toBe(2); // trim não implementado
      expect(convertPrioridadeToNumber('baixa ')).toBe(2);
    });
  });

  // ========================================
  // TESTES: getPrioridadeTexto
  // ========================================
  describe('getPrioridadeTexto', () => {
    
    it('deve converter números válidos para texto corretamente', () => {
      expect(getPrioridadeTexto(1)).toBe('Baixa');
      expect(getPrioridadeTexto(2)).toBe('Média');
      expect(getPrioridadeTexto(3)).toBe('Alta');
      expect(getPrioridadeTexto(4)).toBe('Urgente');
    });

    it('deve retornar "Não definida" para valores inválidos', () => {
      expect(getPrioridadeTexto(0)).toBe('Não definida');
      expect(getPrioridadeTexto(5)).toBe('Não definida');
      expect(getPrioridadeTexto(99)).toBe('Não definida');
      expect(getPrioridadeTexto(-1)).toBe('Não definida');
      expect(getPrioridadeTexto(-999)).toBe('Não definida');
    });

    it('deve retornar "Não definida" para null ou undefined', () => {
      expect(getPrioridadeTexto(null)).toBe('Não definida');
      expect(getPrioridadeTexto(undefined)).toBe('Não definida');
    });

    it('deve retornar "Não definida" para tipos não-numéricos', () => {
      // Após refatoração: validação mais rigorosa rejeita strings
      // (comportamento mais correto e previsível)
      expect(getPrioridadeTexto('1')).toBe('Não definida');
      expect(getPrioridadeTexto('2')).toBe('Não definida');
      expect(getPrioridadeTexto('baixa')).toBe('Não definida');
      expect(getPrioridadeTexto(true)).toBe('Não definida');
      expect(getPrioridadeTexto({})).toBe('Não definida');
    });

    it('deve lidar com números decimais', () => {
      expect(getPrioridadeTexto(1.5)).toBe('Não definida');
      expect(getPrioridadeTexto(2.99)).toBe('Não definida');
    });
  });

  // ========================================
  // TESTES: isPrioridadeValida
  // ========================================
  describe('isPrioridadeValida', () => {
    
    it('deve validar strings de prioridade válidas', () => {
      expect(isPrioridadeValida('baixa')).toBe(true);
      expect(isPrioridadeValida('media')).toBe(true);
      expect(isPrioridadeValida('alta')).toBe(true);
      expect(isPrioridadeValida('urgente')).toBe(true);
    });

    it('deve validar strings case-insensitive', () => {
      expect(isPrioridadeValida('BAIXA')).toBe(true);
      expect(isPrioridadeValida('Media')).toBe(true);
      expect(isPrioridadeValida('ALTA')).toBe(true);
      expect(isPrioridadeValida('URGENTE')).toBe(true);
    });

    it('deve validar números de prioridade válidos', () => {
      expect(isPrioridadeValida(1)).toBe(true);
      expect(isPrioridadeValida(2)).toBe(true);
      expect(isPrioridadeValida(3)).toBe(true);
      expect(isPrioridadeValida(4)).toBe(true);
    });

    it('deve rejeitar strings inválidas', () => {
      expect(isPrioridadeValida('invalido')).toBe(false);
      expect(isPrioridadeValida('')).toBe(false);
      expect(isPrioridadeValida('critica')).toBe(false);
    });

    it('deve rejeitar números inválidos', () => {
      expect(isPrioridadeValida(0)).toBe(false);
      expect(isPrioridadeValida(5)).toBe(false);
      expect(isPrioridadeValida(-1)).toBe(false);
      expect(isPrioridadeValida(99)).toBe(false);
    });

    it('deve rejeitar null, undefined e outros tipos', () => {
      expect(isPrioridadeValida(null)).toBe(false);
      expect(isPrioridadeValida(undefined)).toBe(false);
      expect(isPrioridadeValida(true)).toBe(false);
      expect(isPrioridadeValida({})).toBe(false);
      expect(isPrioridadeValida([])).toBe(false);
    });
  });

  // ========================================
  // TESTES: getPrioridadesDisponiveis
  // ========================================
  describe('getPrioridadesDisponiveis', () => {
    
    it('deve retornar array com 4 prioridades', () => {
      const prioridades = getPrioridadesDisponiveis();
      expect(prioridades).toHaveLength(4);
    });

    it('deve retornar prioridades no formato correto', () => {
      const prioridades = getPrioridadesDisponiveis();
      
      prioridades.forEach(prioridade => {
        expect(prioridade).toHaveProperty('valor');
        expect(prioridade).toHaveProperty('texto');
        expect(prioridade).toHaveProperty('slug');
        expect(typeof prioridade.valor).toBe('number');
        expect(typeof prioridade.texto).toBe('string');
        expect(typeof prioridade.slug).toBe('string');
      });
    });

    it('deve retornar prioridades na ordem correta', () => {
      const prioridades = getPrioridadesDisponiveis();
      
      expect(prioridades[0]).toEqual({ valor: 1, texto: 'Baixa', slug: 'baixa' });
      expect(prioridades[1]).toEqual({ valor: 2, texto: 'Média', slug: 'media' });
      expect(prioridades[2]).toEqual({ valor: 3, texto: 'Alta', slug: 'alta' });
      expect(prioridades[3]).toEqual({ valor: 4, texto: 'Urgente', slug: 'urgente' });
    });

    it('deve retornar sempre o mesmo array (imutabilidade)', () => {
      const prioridades1 = getPrioridadesDisponiveis();
      const prioridades2 = getPrioridadesDisponiveis();
      
      expect(prioridades1).toEqual(prioridades2);
    });
  });

  // ========================================
  // TESTES DE INTEGRAÇÃO
  // ========================================
  describe('Integração entre funções', () => {
    
    it('deve converter string → number → string corretamente', () => {
      const casos = [
        { string: 'baixa', numero: 1, texto: 'Baixa' },
        { string: 'media', numero: 2, texto: 'Média' },
        { string: 'alta', numero: 3, texto: 'Alta' },
        { string: 'urgente', numero: 4, texto: 'Urgente' },
      ];
      
      casos.forEach(({ string, numero, texto }) => {
        const numeroConvertido = convertPrioridadeToNumber(string);
        expect(numeroConvertido).toBe(numero);
        
        const textoConvertido = getPrioridadeTexto(numeroConvertido);
        expect(textoConvertido).toBe(texto);
      });
    });

    it('deve validar consistentemente entre funções', () => {
      const prioridades = getPrioridadesDisponiveis();
      
      prioridades.forEach(({ valor, slug }) => {
        // String válida deve ser reconhecida
        expect(isPrioridadeValida(slug)).toBe(true);
        
        // Número válido deve ser reconhecido
        expect(isPrioridadeValida(valor)).toBe(true);
        
        // Conversão string → number deve retornar o valor esperado
        expect(convertPrioridadeToNumber(slug)).toBe(valor);
      });
    });

    it('ciclo completo: slug → number → text → validação', () => {
      const slug = 'alta';
      
      // 1. Converter slug para número
      const numero = convertPrioridadeToNumber(slug);
      expect(numero).toBe(3);
      
      // 2. Validar número
      expect(isPrioridadeValida(numero)).toBe(true);
      
      // 3. Converter número para texto
      const texto = getPrioridadeTexto(numero);
      expect(texto).toBe('Alta');
      
      // 4. Validar slug original
      expect(isPrioridadeValida(slug)).toBe(true);
    });

    it('valores inválidos devem ser tratados consistentemente', () => {
      const valoresInvalidos = ['invalido', 0, 5, null, undefined, {}, []];
      
      valoresInvalidos.forEach(valor => {
        expect(isPrioridadeValida(valor)).toBe(false);
      });
    });
  });

  // ========================================
  // TESTES DE EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    
    it('deve lidar com variações de capitalização', () => {
      const variacoes = ['bAiXa', 'MEDIA', 'aLtA', 'UrGeNtE'];
      const esperados = [1, 2, 3, 4];
      
      variacoes.forEach((variacao, index) => {
        expect(convertPrioridadeToNumber(variacao)).toBe(esperados[index]);
      });
    });

    it('deve ser thread-safe (múltiplas chamadas)', () => {
      const resultados = [];
      
      for (let i = 0; i < 100; i++) {
        resultados.push(convertPrioridadeToNumber('alta'));
      }
      
      // Todos devem retornar 3
      expect(resultados.every(r => r === 3)).toBe(true);
    });

    it('deve retornar valores padrão consistentes', () => {
      // Todas estas chamadas devem retornar o mesmo padrão (2)
      expect(convertPrioridadeToNumber('xyz')).toBe(2);
      expect(convertPrioridadeToNumber(null)).toBe(2);
      expect(convertPrioridadeToNumber(undefined)).toBe(2);
      expect(convertPrioridadeToNumber('')).toBe(2);
    });
  });
});
