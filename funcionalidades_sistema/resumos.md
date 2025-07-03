# Funcionalidades do Sistema OrganizaAi

## 📊 Aba Resumos (Dashboard)

A aba **Resumos** é a tela principal do aplicativo, funcionando como um dashboard financeiro completo que oferece uma visão geral das finanças pessoais do usuário.

### 🎯 **Visão Geral**
- **Localização**: `app/(tabs)/index.tsx`
- **Propósito**: Dashboard principal com resumo financeiro mensal
- **Navegação**: Primeira aba do aplicativo (índice)

---

### 📅 **Seletor de Mês**
**Componente**: `MonthSelector.tsx`

**Funcionalidades**:
- **Navegação entre meses**: Botões de seta para navegar entre meses anteriores e posteriores
- **Exibição atual**: Mostra o mês e ano atual em formato legível (ex: "Janeiro 2024")
- **Navegação intuitiva**: 
  - Seta esquerda: Mês anterior
  - Seta direita: Próximo mês
- **Design responsivo**: Interface limpa com sombras e bordas arredondadas

**Características técnicas**:
- Usa ícones do Lucide React Native
- Suporte a tema claro/escuro
- Testes automatizados implementados (`testID`)

---

### 💰 **Saldo Disponível**
**Funcionalidade principal**:
- **Cálculo automático**: `Renda Total - Despesas Totais`
- **Exibição destacada**: Valor em destaque com fonte grande e negrito
- **Atualização em tempo real**: Reflete mudanças imediatas nas rendas e despesas

---

### 📈 **Dropdown de Rendas**
**Componente**: `IncomeDropdown.tsx`

**Funcionalidades**:
- **Renda Total**: Valor consolidado de todas as fontes de renda
- **Detalhamento expansível**: 
  - **Renda Base**: Fontes fixas de renda (salários, pensões, etc.)
  - **Extras do Mês**: Rendas adicionais específicas do mês selecionado
- **Interface interativa**: 
  - Clique para expandir/recolher detalhes
  - Ícone de seta indica estado (aberto/fechado)
  - Ícone de seta para cima (verde) indica entrada de dinheiro

**Características**:
- Formatação automática em Real (R$)
- Design com cards e sombras
- Responsivo a mudanças de dados

---

### 📉 **Dropdown de Despesas**
**Componente**: `ExpensesDropdown.tsx`

**Funcionalidades**:
- **Despesas Totais**: Soma de todas as despesas do mês
- **Categorização automática**:
  - **Despesas Fixas**: Contas recorrentes (aluguel, contas, etc.)
  - **Despesas Variáveis**: Gastos ocasionais (lazer, compras, etc.)
- **Interface expansível**: Mesmo comportamento do dropdown de rendas
- **Logs de debug**: Console logs para verificação de valores

**Características**:
- Formatação em Real (R$)
- Design consistente com outros componentes
- Filtros automáticos por tipo de despesa

---

### 🏦 **Poupança**
**Funcionalidades**:
- **Cálculo automático**: `Renda Total - Despesas Totais`
- **Barra de progresso**: Visualização da porcentagem da renda que foi poupada
- **Ícone temático**: Carteira (Wallet) em azul
- **Exibição clara**: Valor em destaque com formatação monetária

---

### 🎯 **Meta Mensal de Economia**
**Funcionalidades**:
- **Meta fixa**: R$ 3.000 (configurável)
- **Progresso visual**: Barra de progresso mostrando porcentagem alcançada
- **Cálculo automático**: `(Poupança Atual / Meta) × 100`
- **Exibição de porcentagem**: Texto mostrando "% alcançado"

**Características**:
- Meta hardcoded em R$ 3.000
- Barra de progresso com preenchimento dinâmico
- Design em card com sombras

---

### 🔄 **Sistema de Atualizações**
**Funcionalidades**:
- **Eventos em tempo real**: Sistema de eventos para atualizações automáticas
- **Prevenção de loops**: Controle de atualizações simultâneas
- **Recarregamento inteligente**: Atualiza apenas quando necessário
- **Sincronização**: Mudanças em outras abas refletem imediatamente no dashboard

**Eventos suportados**:
- `EXPENSE_UPDATED`: Atualização de despesas
- `INCOME_UPDATED`: Atualização de rendas

---

### 🔔 **Sistema de Financiamentos**
**Serviço**: `FinancingService.ts`

**Funcionalidades**:
- **Verificação automática**: Checa financiamentos próximos do fim
- **Alertas inteligentes**: Notifica sobre renovações necessárias
- **Renovação automática**: Permite renovar financiamentos por até 12 meses
- **Controle de parcelas**: Gerencia parcelas de financiamentos ativos

**Características**:
- Verifica financiamentos que terminam no próximo mês
- Calcula meses restantes até o fim original
- Permite alteração de valores durante renovação
- Marca avisos como enviados para evitar duplicatas

---

### 💾 **Sistema de Armazenamento**
**Serviço**: `StorageService`

**Funcionalidades**:
- **Armazenamento local**: AsyncStorage para persistência de dados
- **Organização por mês**: Dados separados por mês/ano
- **Estruturas de dados**:
  - `MonthlyData`: Dados consolidados mensais
  - `Income`: Fontes de renda e extras
  - `Expense`: Despesas com categorização
  - `Investment`: Investimentos (preparado para futuras funcionalidades)

**Chaves de armazenamento**:
- `@monthly_data_YYYY_MM`: Dados mensais
- `@income`: Rendas
- `@expenses_YYYY_MM`: Despesas por mês
- `@investments`: Investimentos

---

### 🎨 **Design e UX**
**Características**:
- **Interface limpa**: Design minimalista com cards e sombras
- **Cores consistentes**: Paleta de cores padronizada
- **Tipografia hierárquica**: Diferentes tamanhos para diferentes níveis de informação
- **Responsividade**: Adaptação para diferentes tamanhos de tela
- **Feedback visual**: Estados visuais para interações

**Elementos visuais**:
- Cards com sombras e bordas arredondadas
- Ícones do Lucide React Native
- Cores temáticas (verde para rendas, azul para poupança)
- Barras de progresso visuais

---

### 🔧 **Funcionalidades Técnicas**
**Características**:
- **TypeScript**: Tipagem forte para melhor manutenibilidade
- **Hooks React**: useState, useEffect, useCallback, useRef
- **Context API**: Sistema de eventos para comunicação entre componentes
- **Async/Await**: Operações assíncronas para armazenamento
- **Error handling**: Tratamento de erros com try/catch
- **Performance**: Otimizações para evitar re-renders desnecessários

**Otimizações**:
- Uso de refs para evitar loops de dependência
- Debounce em atualizações
- Carregamento lazy de dados
- Prevenção de múltiplas atualizações simultâneas

---

### 📱 **Compatibilidade**
**Plataformas**:
- **iOS**: Suporte completo com SafeAreaView
- **Android**: Compatibilidade total
- **React Native**: Versão mais recente

**Dependências principais**:
- `@react-native-async-storage/async-storage`: Armazenamento local
- `lucide-react-native`: Ícones
- `react-native-safe-area-context`: Área segura para diferentes dispositivos

---

### 🧪 **Testes**
**Cobertura**:
- Testes de componentes implementados
- TestIDs para elementos interativos
- Testes de integração preparados

**Arquivos de teste**:
- `__tests__/component-integration.test.tsx`
- `__tests__/navigation.test.tsx`
- `test-utils.tsx`: Utilitários para testes

---

### 📋 **Resumo das Funcionalidades**

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| Seletor de Mês | Navegação entre meses | ✅ Implementado |
| Saldo Disponível | Cálculo e exibição do saldo | ✅ Implementado |
| Dropdown Rendas | Detalhamento de rendas | ✅ Implementado |
| Dropdown Despesas | Categorização de despesas | ✅ Implementado |
| Poupança | Cálculo e visualização | ✅ Implementado |
| Meta de Economia | Acompanhamento de metas | ✅ Implementado |
| Financiamentos | Sistema de alertas e renovação | ✅ Implementado |
| Atualizações em Tempo Real | Sincronização automática | ✅ Implementado |
| Armazenamento Local | Persistência de dados | ✅ Implementado |
| Design Responsivo | Interface adaptável | ✅ Implementado |

---

*Este documento será expandido com as funcionalidades das outras abas (Gastos, Rendas, Viagens e Configuração) conforme solicitado.* 