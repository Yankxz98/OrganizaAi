# Funcionalidades do Sistema OrganizaAi

## 💰 Aba Rendas (Income)

A aba **Rendas** é responsável pelo gerenciamento completo das fontes de renda do usuário, oferecendo funcionalidades para visualizar, adicionar, editar e excluir rendas com suporte a múltiplas pessoas, fontes de renda e extras mensais.

### 🎯 **Visão Geral**
- **Localização**: `app/(tabs)/income.tsx`
- **Propósito**: Gerenciamento completo de rendas pessoais
- **Navegação**: Terceira aba do aplicativo

---

### 📅 **Seletor de Mês**
**Componente**: `MonthSelector.tsx` (reutilizado)

**Funcionalidades**:
- **Navegação entre meses**: Mesma funcionalidade das outras abas
- **Filtro temporal**: Visualiza extras de renda de meses específicos
- **Sincronização**: Mudanças de mês atualizam automaticamente os extras

---

### 📊 **Resumo de Rendas**
**Funcionalidades**:
- **Renda Total**: Soma de todas as fontes de renda + extras do mês
- **Sua Renda**: Renda específica da pessoa "Você"
- **Exibição em cards**: Valores destacados em cards separados

**Cálculos automáticos**:
```typescript
const calculateTotal = () => {
  const baseTotal = incomes.reduce((total, income) => {
    return total + income.sources.reduce((sourceTotal, source) => sourceTotal + source.amount, 0);
  }, 0);

  const extrasTotal = incomes.reduce((total, income) => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthlyExtras = income.monthlyExtras?.find(
      m => m.month === currentMonth && m.year === currentYear
    );
    return total + (monthlyExtras?.extras.reduce((sum, extra) => sum + extra.amount, 0) || 0);
  }, 0);

  return baseTotal + extrasTotal;
};

const calculateYourTotal = () => {
  const baseTotal = incomes
    .filter(income => income.person === 'Você')
    .reduce((total, income) => {
      return total + income.sources.reduce((sourceTotal, source) => sourceTotal + source.amount, 0);
    }, 0);

  const extrasTotal = incomes
    .filter(income => income.person === 'Você')
    .reduce((total, income) => {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const monthlyExtras = income.monthlyExtras?.find(
        m => m.month === currentMonth && m.year === currentYear
      );
      return total + (monthlyExtras?.extras.reduce((sum, extra) => sum + extra.amount, 0) || 0);
    }, 0);

  return baseTotal + extrasTotal;
};
```

---

### ➕ **Adicionar Nova Renda**
**Funcionalidades**:
- **Botão de adição**: Botão flutuante (+) no cabeçalho
- **Modal de formulário**: Formulário aparece como overlay
- **Interface intuitiva**: Transição suave entre telas

**Características**:
- Botão circular azul com ícone de plus
- Modal com fundo escuro
- Formulário responsivo

---

### 📝 **Formulário de Renda**
**Componente**: `IncomeForm.tsx`

**Funcionalidades principais**:

#### **1. Identificação da Pessoa**
- **Campo de pessoa**: Nome da pessoa (ex: "Você", "Parceiro(a)")
- **Valor padrão**: "Você"
- **Flexibilidade**: Permite qualquer nome personalizado

#### **2. Fontes de Renda**
**Funcionalidades**:
- **Múltiplas fontes**: Adicionar várias fontes de renda por pessoa
- **Ícones temáticos**: 
  - **💼 Briefcase**: Trabalho/Emprego
  - **🏢 Building2**: Empresa/Corporação
  - **🪙 Coins**: Investimentos/Renda extra
- **Cores personalizáveis**: Cada fonte pode ter cor específica
- **Valores individuais**: Valor específico para cada fonte

**Estrutura de fonte**:
```typescript
interface IncomeSource {
  id: number;
  name: string;
  icon: string;
  amount: number;
  color: string;
}
```

**Adição de fonte**:
```typescript
const handleAddSource = () => {
  if (!newSource.name || !newSource.amount) return;

  const source: IncomeSource = {
    id: Date.now(),
    name: newSource.name,
    icon: newSource.icon || 'Briefcase',
    amount: Number(newSource.amount),
    color: newSource.color || '#0ea5e9'
  };

  setFormData({
    ...formData,
    sources: [...(formData.sources || []), source]
  });
};
```

#### **3. Extras do Mês**
**Funcionalidades avançadas**:
- **Extras mensais**: Rendas adicionais específicas do mês
- **Persistência por mês**: Extras salvos por mês/ano
- **Adição dinâmica**: Adicionar extras durante edição
- **Exclusão individual**: Remover extras específicos
- **Sincronização automática**: Atualização imediata do dashboard

**Estrutura de extras**:
```typescript
monthlyExtras: {
  month: number;
  year: number;
  extras: {
    id: number;
    description: string;
    amount: number;
  }[];
}[]
```

**Adição de extra**:
```typescript
const handleAddExtra = async () => {
  if (!newExtra.description || !newExtra.amount) {
    Alert.alert('Atenção', 'Por favor, preencha a descrição e o valor do extra.');
    return;
  }

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthlyExtras = formData.monthlyExtras || [];
  
  const currentMonthExtras = monthlyExtras.find(
    m => m.month === currentMonth && m.year === currentYear
  );

  if (currentMonthExtras) {
    currentMonthExtras.extras.push({
      id: Date.now(),
      description: newExtra.description,
      amount: Number(newExtra.amount)
    });
  } else {
    // Criar novo mês de extras
    monthlyExtras.push({
      month: currentMonth,
      year: currentYear,
      extras: [{
        id: Date.now(),
        description: newExtra.description,
        amount: Number(newExtra.amount)
      }]
    });
  }
};
```

#### **4. Validações**
- **Campos obrigatórios**: Pessoa e pelo menos uma fonte de renda
- **Valores negativos**: Prevenção de valores negativos
- **Formatação**: Valores numéricos formatados corretamente

---

### 📋 **Lista de Rendas**
**Funcionalidades**:

#### **1. Exibição por Pessoa**
- **Cards individuais**: Cada pessoa em card separado
- **Nome da pessoa**: Título do card
- **Ações por pessoa**: Editar e excluir por pessoa

#### **2. Fontes de Renda**
- **Lista de fontes**: Todas as fontes da pessoa
- **Ícones coloridos**: Ícone específico para cada fonte
- **Valores formatados**: Valores em Real (R$)
- **Layout limpo**: Informações organizadas horizontalmente

#### **3. Extras do Mês**
- **Seção separada**: Extras em container destacado
- **Fundo diferenciado**: Background cinza claro
- **Lista de extras**: Descrição e valor de cada extra
- **Visibilidade condicional**: Só aparece se houver extras

#### **4. Ações por Renda**
- **Botão de editar**: Ícone de lápis
- **Botão de excluir**: Ícone de lixeira
- **Confirmação de exclusão**: Alert antes de excluir

---

### 🔄 **Sistema de Atualizações**
**Funcionalidades**:
- **Eventos em tempo real**: `INCOME_UPDATED`
- **Sincronização automática**: Mudanças refletem imediatamente
- **Atualização do dashboard**: Notifica outras abas sobre mudanças
- **Persistência imediata**: Extras salvos automaticamente

**Implementação**:
```typescript
useEffect(() => {
  loadIncomes();
  // Inscrever no evento de atualização
  const unsubscribe = subscribeToEvent('INCOME_UPDATED', loadIncomes);
  return () => unsubscribe();
}, [loadIncomes, subscribeToEvent]);
```

---

### 🗑️ **Exclusão de Rendas**
**Funcionalidades**:
- **Confirmação**: Alert de confirmação antes de excluir
- **Exclusão completa**: Remove pessoa e todas suas fontes
- **Atualização automática**: Lista atualizada imediatamente
- **Notificação**: Dispara evento para atualizar dashboard

**Lógica de exclusão**:
```typescript
const handleDeleteIncome = (income: Income) => {
  Alert.alert(
    'Confirmar Exclusão',
    `Deseja realmente excluir a renda de "${income.person}"?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const newIncomes = incomes.filter(i => i.id !== income.id);
            await StorageService.saveIncome(newIncomes);
            setIncomes(newIncomes);
            
            setTimeout(() => {
              triggerEvent('INCOME_UPDATED');
            }, 0);
          } catch (error) {
            console.error('Erro ao excluir renda:', error);
            Alert.alert('Erro', 'Ocorreu um erro ao excluir a renda');
          }
        },
      },
    ],
  );
};
```

---

### ✏️ **Edição de Rendas**
**Funcionalidades**:
- **Modal de edição**: Formulário com dados pré-preenchidos
- **Preservação de dados**: Mantém todas as informações originais
- **Edição de extras**: Adicionar/remover extras durante edição
- **Sincronização imediata**: Mudanças refletem instantaneamente

**Características**:
- Formulário reutilizado para adição e edição
- Dados carregados automaticamente
- Validações idênticas à adição

---

### 🎨 **Design e UX**
**Características**:
- **Interface limpa**: Cards com sombras e bordas arredondadas
- **Cores temáticas**: Ícones coloridos para cada fonte
- **Modal responsivo**: Formulário em overlay
- **Feedback visual**: Estados visuais para interações
- **Layout organizado**: Informações bem estruturadas

**Elementos visuais**:
- Cards de rendas com sombras
- Ícones coloridos por fonte de renda
- Botões de ação com hover states
- Container destacado para extras
- Modal com fundo escuro

---

### 🔧 **Funcionalidades Técnicas**
**Características**:
- **TypeScript**: Tipagem forte para melhor manutenibilidade
- **React Native**: Hooks modernos (useState, useEffect, useCallback)
- **AsyncStorage**: Persistência local de dados
- **Modal system**: Sistema de modais para formulários
- **Event System**: Comunicação entre componentes

**Otimizações**:
- Carregamento lazy de dados
- Prevenção de re-renders desnecessários
- Tratamento de erros com try/catch
- Validações de entrada
- Sincronização automática de extras

---

### 📱 **Compatibilidade**
**Plataformas**:
- **iOS**: Suporte completo com SafeAreaView
- **Android**: Compatibilidade total
- **React Native**: Versão mais recente

**Dependências principais**:
- `lucide-react-native`: Ícones
- `@react-native-async-storage/async-storage`: Armazenamento
- `react-native-safe-area-context`: Área segura

---

### 🧪 **Testes**
**Cobertura**:
- TestIDs implementados para elementos interativos
- Testes de componentes preparados
- Testes de integração disponíveis

**Elementos testáveis**:
- `add-income-button`: Botão de adicionar
- `edit-income-button`: Botão de editar
- `delete-income-button`: Botão de excluir
- `income-person-input`: Campo de pessoa
- `income-source-name-input`: Campo de nome da fonte
- `income-source-amount-input`: Campo de valor da fonte
- `income-extra-description-input`: Campo de descrição do extra
- `income-extra-amount-input`: Campo de valor do extra
- `income-add-source-button`: Botão de adicionar fonte
- `income-add-extra-button`: Botão de adicionar extra
- `income-cancel-button`: Botão de cancelar
- `income-save-button`: Botão de salvar

---

### 📋 **Resumo das Funcionalidades**

| Funcionalidade | Descrição | Status |
|----------------|-----------|--------|
| Seletor de Mês | Navegação entre meses | ✅ Implementado |
| Resumo de Rendas | Totais por pessoa | ✅ Implementado |
| Adicionar Renda | Formulário completo | ✅ Implementado |
| Múltiplas Pessoas | Suporte a várias pessoas | ✅ Implementado |
| Fontes de Renda | Múltiplas fontes por pessoa | ✅ Implementado |
| Ícones Temáticos | 3 tipos de ícones | ✅ Implementado |
| Extras Mensais | Rendas adicionais por mês | ✅ Implementado |
| Lista de Rendas | Visualização detalhada | ✅ Implementado |
| Edição de Rendas | Modificação de dados | ✅ Implementado |
| Exclusão de Rendas | Remoção com confirmação | ✅ Implementado |
| Atualizações em Tempo Real | Sincronização automática | ✅ Implementado |
| Modal de Formulário | Interface overlay | ✅ Implementado |
| Design Responsivo | Interface adaptável | ✅ Implementado |

---

### 🔮 **Funcionalidades Futuras**
**Em desenvolvimento**:
- Filtros por pessoa
- Busca de rendas
- Gráficos de renda por período
- Exportação de relatórios
- Categorização avançada de fontes
- Histórico de mudanças

---

### 💡 **Diferenciais da Aba Rendas**

#### **1. Suporte a Múltiplas Pessoas**
- Permite gerenciar rendas de diferentes pessoas
- Cálculos separados por pessoa
- Interface organizada por pessoa

#### **2. Sistema de Extras Mensais**
- Rendas adicionais específicas por mês
- Persistência temporal
- Sincronização automática

#### **3. Fontes de Renda Flexíveis**
- Múltiplas fontes por pessoa
- Ícones temáticos
- Cores personalizáveis

#### **4. Interface Modal**
- Formulário em overlay
- Transições suaves
- Experiência de usuário otimizada

---

*Esta aba oferece um sistema completo de gerenciamento de rendas com suporte a múltiplas pessoas, fontes de renda flexíveis e extras mensais, mantendo sincronização em tempo real com o dashboard principal.* 