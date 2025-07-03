# Funcionalidades do Sistema OrganizaAi

## 💰 Aba Gastos (Despesas)

A aba **Gastos** é responsável pelo gerenciamento completo de despesas do usuário, oferecendo funcionalidades para visualizar, adicionar, editar e excluir despesas com categorização e suporte a financiamentos.

### 🎯 **Visão Geral**
- **Localização**: `app/(tabs)/expenses.tsx`
- **Propósito**: Gerenciamento completo de despesas pessoais
- **Navegação**: Segunda aba do aplicativo

---

### 📅 **Seletor de Mês**
**Componente**: `MonthSelector.tsx` (reutilizado)

**Funcionalidades**:
- **Navegação entre meses**: Mesma funcionalidade da aba Resumos
- **Filtro temporal**: Visualiza despesas de meses específicos
- **Sincronização**: Mudanças de mês atualizam automaticamente a lista

---

### 📊 **Resumo de Despesas**
**Funcionalidades**:
- **Total de Despesas**: Soma de todas as despesas do mês selecionado
- **Despesas Fixas**: Total de despesas recorrentes (tipo 'fixed')
- **Despesas Variáveis**: Total de despesas ocasionais (tipo 'variable')
- **Exibição em cards**: Valores destacados em cards separados

**Cálculos automáticos**:
```typescript
const calculateTotal = () => {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
};

const calculateFixedTotal = () => {
  return expenses
    .filter(expense => expense.type === 'fixed')
    .reduce((total, expense) => total + expense.amount, 0);
};

const calculateVariableTotal = () => {
  return expenses
    .filter(expense => expense.type === 'variable')
    .reduce((total, expense) => total + expense.amount, 0);
};
```

---

### ➕ **Adicionar Nova Despesa**
**Localização**: `app/expenses/add.tsx`

**Funcionalidades**:
- **Botão de adição**: Botão flutuante (+) no cabeçalho
- **Navegação**: Redireciona para formulário de nova despesa
- **Parâmetros**: Passa mês e ano atual para o formulário

**Características**:
- Botão circular azul com ícone de plus
- Sombras e efeitos visuais
- TestID para testes automatizados

---

### 📝 **Formulário de Despesa**
**Componente**: `ExpenseForm.tsx`

**Funcionalidades principais**:

#### **1. Categorização**
**Categorias disponíveis**:
- **🍽️ Lanche** (`snack`): Cor laranja (#f97316)
- **🛒 Mercado** (`grocery`): Cor verde (#22c55e)
- **⛽ Gasolina** (`gas`): Cor azul (#3b82f6)
- **🐾 Pet** (`pet`): Cor rosa (#ec4899)
- **👤 Pessoal** (`personal`): Cor roxa (#8b5cf6)
- **📦 Outros** (`others`): Cor cinza (#64748b)

**Características**:
- Seleção visual com ícones
- Cores temáticas para cada categoria
- Interface de botões interativos

#### **2. Campos Básicos**
- **Descrição**: Campo obrigatório para nome da despesa
- **Valor**: Campo numérico para valor da despesa
- **Tipo**: Seleção entre 'fixed' (fixa) e 'variable' (variável)

#### **3. Sistema de Parcelas**
**Funcionalidades**:
- **Número de parcelas**: Configuração de quantas parcelas
- **Cálculo automático**: Valor total dividido pelo número de parcelas
- **Criação automática**: Parcelas futuras criadas automaticamente
- **GroupId**: Identificador único para agrupar parcelas relacionadas

**Lógica de parcelas**:
```typescript
if (expense.installments && expense.installments.total > 1) {
  const amountPerInstallment = expense.amount / expense.installments.total;
  expense.amount = amountPerInstallment;
  
  // Criar parcelas futuras
  for (let i = 2; i <= expense.installments.total; i++) {
    const futureDate = new Date(currentDate);
    futureDate.setMonth(currentDate.getMonth() + (i - 1));
    
    const futureExpense = {
      ...expense,
      id: Date.now() + i,
      amount: amountPerInstallment,
      installments: {
        ...expense.installments,
        current: i
      }
    };
  }
}
```

#### **4. Sistema de Financiamentos**
**Funcionalidades avançadas**:
- **Toggle de financiamento**: Ativa modo de financiamento
- **Configuração de datas**: Data de início e fim do financiamento
- **Valor mensal**: Valor da parcela mensal
- **Valor total**: Valor total do financiamento
- **Validações**:
  - Máximo 5 anos de duração
  - Data de fim posterior à data de início
  - Valor mensal obrigatório

**Estrutura de financiamento**:
```typescript
financing: {
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number,
  originalEndMonth: number,
  originalEndYear: number,
  monthlyAmount: number,
  totalAmount: number,
  isActive: boolean,
  renewalCount: number,
  groupId: string
}
```

---

### 📋 **Lista de Despesas**
**Funcionalidades**:

#### **1. Exibição de Despesas**
- **Cards individuais**: Cada despesa em card separado
- **Ícone de categoria**: Ícone colorido baseado na categoria
- **Informações principais**:
  - Categoria e descrição
  - Valor formatado em Real
  - Tipo de despesa (fixa/variável)

#### **2. Informações de Parcelas**
- **Parcelas normais**: "Parcela X de Y"
- **Financiamentos**: Informações detalhadas do financiamento
- **Data de término**: Para financiamentos
- **Contador de renovações**: Número de vezes renovado

#### **3. Indicadores Visuais**
- **Badge de financiamento**: 💰 Financiamento
- **Informações de parcela**: Parcela atual e total
- **Data de término**: Mês/ano de término
- **Histórico de renovações**: "Renovado X vezes"

#### **4. Ações por Despesa**
- **Botão de editar**: Ícone de lápis
- **Botão de excluir**: Ícone de lixeira
- **Confirmação de exclusão**: Alert antes de excluir

---

### 🔄 **Sistema de Atualizações**
**Funcionalidades**:
- **Eventos em tempo real**: `EXPENSE_UPDATED`
- **Sincronização automática**: Mudanças refletem imediatamente
- **Atualização do dashboard**: Notifica outras abas sobre mudanças

**Implementação**:
```typescript
useEffect(() => {
  const cleanup = subscribeToEvent('EXPENSE_UPDATED', loadExpenses);
  return cleanup;
}, [subscribeToEvent, loadExpenses]);
```

---

### 🗑️ **Exclusão de Despesas**
**Funcionalidades**:
- **Confirmação**: Alert de confirmação antes de excluir
- **Exclusão de parcelas**: Remove parcelas futuras relacionadas
- **Atualização automática**: Lista atualizada imediatamente
- **Notificação**: Dispara evento para atualizar dashboard

**Lógica de exclusão**:
```typescript
const handleDeleteExpense = (expense: Expense) => {
  Alert.alert(
    'Confirmar Exclusão',
    `Deseja realmente excluir a despesa "${expense.description}"?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const newExpenses = expenses.filter(e => e.id !== expense.id);
          await StorageService.saveExpenses(newExpenses, currentDate);
          setExpenses(newExpenses);
          triggerEvent('EXPENSE_UPDATED');
        },
      },
    ],
  );
};
```

---

### ✏️ **Edição de Despesas**
**Funcionalidades**:
- **Navegação**: Redireciona para formulário com dados pré-preenchidos
- **Carregamento de dados**: Busca despesa específica por ID
- **Preservação de dados**: Mantém informações originais
- **Validações**: Mesmas validações de nova despesa

**Limitações atuais**:
- Edição de financiamentos ainda não implementada completamente
- Alert informativo sobre funcionalidade em desenvolvimento

---

### 🎨 **Design e UX**
**Características**:
- **Interface limpa**: Cards com sombras e bordas arredondadas
- **Cores temáticas**: Cada categoria com cor específica
- **Ícones intuitivos**: Ícones do Lucide React Native
- **Responsividade**: Adaptação para diferentes tamanhos de tela
- **Feedback visual**: Estados visuais para interações

**Elementos visuais**:
- Cards de despesas com sombras
- Ícones coloridos por categoria
- Botões de ação com hover states
- Badges informativos para financiamentos

---

### 🔧 **Funcionalidades Técnicas**
**Características**:
- **TypeScript**: Tipagem forte para melhor manutenibilidade
- **React Native**: Hooks modernos (useState, useEffect, useCallback)
- **AsyncStorage**: Persistência local de dados
- **Expo Router**: Navegação entre telas
- **Event System**: Comunicação entre componentes

**Otimizações**:
- Carregamento lazy de dados
- Prevenção de re-renders desnecessários
- Tratamento de erros com try/catch
- Validações de entrada

---

### 📱 **Compatibilidade**
**Plataformas**:
- **iOS**: Suporte completo com SafeAreaView
- **Android**: Compatibilidade total
- **React Native**: Versão mais recente

**Dependências principais**:
- `expo-router`: Navegação
- `lucide-react-native`: Ícones
- `@react-native-async-storage/async-storage`: Armazenamento

---

### 🧪 **Testes**
**Cobertura**:
- TestIDs implementados para elementos interativos
- Testes de componentes preparados
- Testes de integração disponíveis

**Elementos testáveis**:
- `add-expense-button`: Botão de adicionar
- `edit-expense-button`: Botão de editar
- `delete-expense-button`: Botão de excluir
- `expense-category-{id}-button`: Botões de categoria
- `expense-description-input`: Campo de descrição

---

### 📋 **Resumo das Funcionalidades**

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| Seletor de Mês | Navegação entre meses | ✅ Implementado |
| Resumo de Despesas | Totais por categoria | ✅ Implementado |
| Adicionar Despesa | Formulário completo | ✅ Implementado |
| Categorização | 6 categorias com ícones | ✅ Implementado |
| Sistema de Parcelas | Parcelamento automático | ✅ Implementado |
| Financiamentos | Sistema avançado | ✅ Implementado |
| Lista de Despesas | Visualização detalhada | ✅ Implementado |
| Edição de Despesas | Modificação de dados | ✅ Implementado |
| Exclusão de Despesas | Remoção com confirmação | ✅ Implementado |
| Atualizações em Tempo Real | Sincronização automática | ✅ Implementado |
| Design Responsivo | Interface adaptável | ✅ Implementado |

---

### 🔮 **Funcionalidades Futuras**
**Em desenvolvimento**:
- Edição completa de financiamentos
- Filtros avançados por categoria
- Busca de despesas
- Exportação de relatórios
- Gráficos de gastos por categoria

---

*Esta aba oferece um sistema completo de gerenciamento de despesas com suporte a categorização, parcelamento e financiamentos, mantendo sincronização em tempo real com o dashboard principal.* 