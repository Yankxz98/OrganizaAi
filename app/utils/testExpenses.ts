import { Expense, StorageService } from './storage';

// Gastos mensais para março/2025
const marchExpenses: Expense[] = [
  {
    id: new Date().getTime() + 1,
    description: "Aluguel",
    amount: 2500,
    category: "others",
    type: "fixed"
  },
  {
    id: new Date().getTime() + 2,
    description: "Energia Elétrica",
    amount: 280,
    category: "others",
    type: "variable"
  },
  {
    id: new Date().getTime() + 3,
    description: "Internet",
    amount: 150,
    category: "others",
    type: "fixed"
  },
  {
    id: new Date().getTime() + 4,
    description: "Supermercado",
    amount: 1200,
    category: "grocery",
    type: "variable"
  },
  {
    id: new Date().getTime() + 5,
    description: "Academia",
    amount: 120,
    category: "personal",
    type: "fixed"
  },
  {
    id: new Date().getTime() + 6,
    description: "Streaming",
    amount: 80,
    category: "personal",
    type: "fixed"
  },
  {
    id: new Date().getTime() + 7,
    description: "Combustível",
    amount: 450,
    category: "gas",
    type: "variable"
  },
  {
    id: new Date().getTime() + 8,
    description: "Plano de Saúde",
    amount: 350,
    category: "personal",
    type: "fixed"
  },
  {
    id: new Date().getTime() + 9,
    description: "Cartão de Crédito",
    amount: 1800,
    category: "others",
    type: "variable"
  },
  {
    id: new Date().getTime() + 10,
    description: "Parcela Notebook",
    amount: 500,
    category: "personal",
    type: "fixed",
    installments: {
      total: 10,
      current: 3,
      groupId: "notebook-2025"
    }
  }
];

// Gastos adicionais para março/2025
const additionalExpenses: Expense[] = [
  {
    id: new Date().getTime() + 11,
    description: "Presente Aniversário",
    amount: 200,
    category: "personal",
    type: "variable"
  },
  {
    id: new Date().getTime() + 12,
    description: "Jantar Especial",
    amount: 150,
    category: "snack",
    type: "variable"
  },
  {
    id: new Date().getTime() + 13,
    description: "Ração Pet",
    amount: 180,
    category: "pet",
    type: "fixed"
  }
];

// Função para adicionar gastos ao mês de março/2025
export const addMarchExpenses = async () => {
  try {
    const marchDate = new Date(2025, 2, 1);
    
    // 1. Limpar gastos existentes
    console.log('Limpando gastos existentes...');
    await StorageService.saveExpenses([], marchDate);
    
    // 2. Adicionar gastos iniciais
    console.log('Adicionando gastos iniciais...');
    const initialSaveResult = await StorageService.saveExpenses(marchExpenses, marchDate);
    
    // 3. Adicionar gastos adicionais
    console.log('Adicionando gastos adicionais...');
    const additionalSaveResult = await StorageService.saveExpenses(additionalExpenses, marchDate, true);
    
    // 4. Carregar todos os gastos para verificação
    console.log('Verificando gastos salvos...');
    const savedExpenses = await StorageService.loadExpenses(marchDate);
    
    // 5. Calcular totais
    const totalAmount = savedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryTotals = savedExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // 6. Verificar resultados
    const expectedTotal = marchExpenses.length + additionalExpenses.length;
    const allSaved = savedExpenses.length === expectedTotal;
    
    const expectedResults = {
      totalAmount: 7960,
      categoryTotals: {
        others: 4730,
        grocery: 1200,
        personal: 1250,
        gas: 450,
        snack: 150,
        pet: 180
      }
    };
    
    const totalMatch = totalAmount === expectedResults.totalAmount;
    const categoryMatch = Object.entries(expectedResults.categoryTotals).every(
      ([category, amount]) => categoryTotals[category] === amount
    );
    
    return {
      success: initialSaveResult && additionalSaveResult && allSaved && totalMatch && categoryMatch,
      results: {
        savedExpensesCount: savedExpenses.length,
        expectedCount: expectedTotal,
        actual: {
          totalAmount,
          categoryTotals,
          expenses: savedExpenses
        },
        expected: expectedResults
      }
    };
    
  } catch (error) {
    console.error('Erro ao adicionar gastos de março:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

// Função principal para executar os testes
export const runExpensesTests = async () => {
  console.log('Iniciando adição de gastos para março/2025...');
  const result = await addMarchExpenses();
  
  if (result.success && result.results) {
    console.log('✅ Gastos adicionados com sucesso!');
    console.log(`Total de gastos: R$ ${result.results.actual.totalAmount}`);
    console.log('Categorias:', result.results.actual.categoryTotals);
  } else {
    console.log('❌ Erro ao adicionar gastos:', result.error);
  }
  
  return result;
}; 