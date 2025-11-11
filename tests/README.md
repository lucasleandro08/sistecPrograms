# 🧪 Testes Unitários - SISTEC Programs

## 📋 Visão Geral

Este projeto implementa testes unitários usando **Vitest** para garantir a qualidade e confiabilidade do código.

## ✅ Status Atual

- **28 testes implementados**
- **100% de cobertura** nas funções utilitárias
- **0 falhas**

## 🎯 Funções Testadas

### `chamadoUtils.js` - Utilitários de Prioridade

#### 1. `convertPrioridadeToNumber(prioridadeString)`
Converte string de prioridade para número.

```javascript
convertPrioridadeToNumber('baixa')   // → 1
convertPrioridadeToNumber('media')   // → 2
convertPrioridadeToNumber('alta')    // → 3
convertPrioridadeToNumber('urgente') // → 4
```

**Casos de teste:**
- ✅ Prioridades válidas
- ✅ Case insensitive
- ✅ Valores inválidos (retorna 2 como padrão)
- ✅ Null/undefined
- ✅ Tipos incorretos

#### 2. `getPrioridadeTexto(prioridade)`
Converte número de prioridade para texto legível.

```javascript
getPrioridadeTexto(1) // → 'Baixa'
getPrioridadeTexto(2) // → 'Média'
getPrioridadeTexto(3) // → 'Alta'
getPrioridadeTexto(4) // → 'Urgente'
```

**Casos de teste:**
- ✅ Números válidos (1-4)
- ✅ Números inválidos
- ✅ Null/undefined
- ✅ Tipos incorretos

#### 3. `isPrioridadeValida(prioridade)`
Valida se uma prioridade é válida.

```javascript
isPrioridadeValida('baixa')  // → true
isPrioridadeValida(3)        // → true
isPrioridadeValida('xyz')    // → false
isPrioridadeValida(99)       // → false
```

#### 4. `getPrioridadesDisponiveis()`
Retorna array com todas as prioridades disponíveis.

```javascript
getPrioridadesDisponiveis()
// → [
//     { valor: 1, texto: 'Baixa', slug: 'baixa' },
//     { valor: 2, texto: 'Média', slug: 'media' },
//     { valor: 3, texto: 'Alta', slug: 'alta' },
//     { valor: 4, texto: 'Urgente', slug: 'urgente' }
//   ]
```

## 🚀 Comandos de Teste

### Executar Testes (modo watch)
```bash
npm test
```

### Executar Testes (single run)
```bash
npm run test:run
```

### Executar Testes em Modo Watch
```bash
npm run test:watch
```

### Gerar Relatório de Cobertura
```bash
npm run test:coverage
```

### Interface Visual (UI)
```bash
npm run test:ui
```

## 📊 Cobertura de Testes

```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------|---------|----------|---------|---------|-------------------
All files        |     100 |      100 |     100 |     100 |                  
 chamadoUtils.js |     100 |      100 |     100 |     100 |                  
-----------------|---------|----------|---------|---------|-------------------
```

## 📁 Estrutura de Arquivos

```
sistecPrograms/
├── src/
│   └── utils/
│       └── chamadoUtils.js      # Funções utilitárias
├── tests/
│   └── chamadoUtils.test.js     # Testes unitários
├── vitest.config.ts              # Configuração do Vitest
└── package.json                  # Scripts de teste
```

## 🔧 Configuração do Vitest

O arquivo `vitest.config.ts` está configurado com:

- **Ambiente:** Node.js
- **Globals:** Habilitado (describe, it, expect disponíveis globalmente)
- **Coverage Provider:** v8
- **Reporters:** text, json, html
- **Timeout:** 10 segundos

## 📝 Padrões de Teste

### Estrutura de Teste
```javascript
describe('Nome da Funcionalidade', () => {
  describe('nomeDaFuncao', () => {
    it('deve fazer algo específico', () => {
      expect(funcao(entrada)).toBe(saida);
    });
  });
});
```

### Tipos de Testes Implementados

1. **Testes de Sucesso:** Validam comportamento correto
2. **Testes de Falha:** Validam tratamento de erros
3. **Testes de Edge Cases:** Validam casos extremos
4. **Testes de Integração:** Validam interação entre funções

## 🎨 Boas Práticas

- ✅ Funções puras são ideais para testes unitários
- ✅ Testar casos de sucesso e falha
- ✅ Testar edge cases (null, undefined, tipos incorretos)
- ✅ Manter testes simples e legíveis
- ✅ Um teste deve testar uma coisa por vez
- ✅ Usar nomes descritivos para os testes

## 🔄 Próximos Passos

### Funções Candidatas para Testes Futuros

1. **utils.ts** - `cn()` (Tailwind merge)
2. **Validações** - Funções de validação de formulário
3. **Formatação** - Funções de formatação de data/texto
4. **Cálculos** - Lógica de negócio sem dependências externas

### Melhorias Futuras

- [ ] Adicionar testes de integração
- [ ] Implementar testes E2E com Playwright
- [ ] Adicionar CI/CD com GitHub Actions
- [ ] Configurar threshold mínimo de cobertura (ex: 80%)

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Jest API](https://jestjs.io/docs/api) (compatível com Vitest)

## 🤝 Contribuindo

Ao adicionar novas funcionalidades:

1. Escreva testes para funções puras
2. Garanta 100% de cobertura em funções críticas
3. Execute `npm run test:coverage` antes de commits
4. Use `npm run test:watch` durante desenvolvimento

---

**Última atualização:** 09/11/2025
**Versão Vitest:** 4.0.8
**Total de Testes:** 28 ✅
