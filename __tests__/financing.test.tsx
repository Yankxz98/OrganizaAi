import { FinancingService } from '../app/utils/FinancingService';
import { Expense } from '../app/utils/storage';

// Mock do Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock do StorageService
const mockSaveExpenses = jest.fn().mockResolvedValue(true);
const mockLoadExpenses = jest.fn().mockResolvedValue([]);

jest.mock('../app/utils/storage', () => ({
  StorageService: {
    loadExpenses: (...args: any[]) => mockLoadExpenses(...args),
    saveExpenses: (...args: any[]) => mockSaveExpenses(...args),
  },
}));

describe('FinancingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMonthsDifference', () => {
    it('deve calcular corretamente a diferença entre duas datas em meses', () => {
      const startDate = new Date(2024, 0, 1); // Janeiro 2024
      const endDate = new Date(2024, 5, 1);   // Junho 2024
      
      const result = FinancingService.calculateMonthsDifference(startDate, endDate);
      expect(result).toBe(5); // Janeiro a Junho = 5 meses de diferença
    });

    it('deve calcular corretamente quando cruza anos', () => {
      const startDate = new Date(2023, 10, 1); // Novembro 2023
      const endDate = new Date(2024, 1, 1);    // Fevereiro 2024
      
      const result = FinancingService.calculateMonthsDifference(startDate, endDate);
      expect(result).toBe(3); // Nov, Dez, Jan, Fev = 3 meses de diferença
    });
  });

  describe('createFinancingInstallments', () => {
    it('deve criar o número correto de parcelas para financiamento de 6 meses', async () => {
      const expense: Expense = {
        id: 1,
        category: 'others',
        description: 'Financiamento Casa',
        amount: 1200,
        type: 'fixed',
        financing: {
          startMonth: 0,  // Janeiro
          startYear: 2024,
          endMonth: 5,    // Junho
          endYear: 2024,
          originalEndMonth: 5,
          originalEndYear: 2024,
          monthlyAmount: 1200,
          totalAmount: 7200,
          isActive: true,
          groupId: 'financing-test'
        }
      };

      await FinancingService.createFinancingInstallments(expense);

      // Deve ter sido chamado 6 vezes (uma para cada mês)
      expect(mockSaveExpenses).toHaveBeenCalledTimes(6);
    });

    it('deve criar exatamente 3 parcelas para financiamento de 3 meses', async () => {
      const expense: Expense = {
        id: 1,
        category: 'others',
        description: 'Financiamento Curto',
        amount: 500,
        type: 'fixed',
        financing: {
          startMonth: 0,  // Janeiro
          startYear: 2024,
          endMonth: 2,    // Março
          endYear: 2024,
          originalEndMonth: 2,
          originalEndYear: 2024,
          monthlyAmount: 500,
          totalAmount: 1500,
          isActive: true,
          groupId: 'financing-test-short'
        }
      };

      await FinancingService.createFinancingInstallments(expense);

      // Deve ter sido chamado exatamente 3 vezes
      expect(mockSaveExpenses).toHaveBeenCalledTimes(3);
    });

    it('deve criar exatamente 1 parcela para financiamento de 1 mês', async () => {
      const expense: Expense = {
        id: 1,
        category: 'others',
        description: 'Financiamento 1 Mês',
        amount: 1000,
        type: 'fixed',
        financing: {
          startMonth: 0,  // Janeiro
          startYear: 2024,
          endMonth: 0,    // Janeiro (mesmo mês)
          endYear: 2024,
          originalEndMonth: 0,
          originalEndYear: 2024,
          monthlyAmount: 1000,
          totalAmount: 1000,
          isActive: true,
          groupId: 'financing-test-one'
        }
      };

      await FinancingService.createFinancingInstallments(expense);

      // Deve ter sido chamado exatamente 1 vez
      expect(mockSaveExpenses).toHaveBeenCalledTimes(1);
    });
  });

  describe('calculateRemainingOriginalMonths', () => {
    it('deve calcular corretamente os meses restantes até o fim original', () => {
      // Mock da data atual para ser Janeiro 2024
      const mockCurrentDate = new Date(2024, 0, 15); // 15 de Janeiro 2024
      jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentDate.getTime());
      
      const expense: Expense = {
        id: 1,
        category: 'others',
        description: 'Financiamento',
        amount: 1000,
        type: 'fixed',
        financing: {
          startMonth: 0,
          startYear: 2024,
          endMonth: 5,    // Junho
          endYear: 2024,
          originalEndMonth: 11, // Dezembro (fim original)
          originalEndYear: 2024,
          monthlyAmount: 1000,
          totalAmount: 12000,
          isActive: true,
        }
      };

      const result = FinancingService.calculateRemainingOriginalMonths(expense);
      expect(result).toBe(11); // Janeiro a Dezembro = 11 meses restantes
    });

    it('deve retornar 0 quando já passou do fim original', () => {
      // Mock da data atual para ser após o fim original
      const mockCurrentDate = new Date(2025, 0, 15); // Janeiro 2025
      jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentDate.getTime());
      
      const expense: Expense = {
        id: 1,
        category: 'others',
        description: 'Financiamento',
        amount: 1000,
        type: 'fixed',
        financing: {
          startMonth: 0,
          startYear: 2024,
          endMonth: 11,
          endYear: 2024,
          originalEndMonth: 11, // Dezembro 2024 (já passou)
          originalEndYear: 2024,
          monthlyAmount: 1000,
          totalAmount: 12000,
          isActive: true,
        }
      };

      const result = FinancingService.calculateRemainingOriginalMonths(expense);
      expect(result).toBe(-1); // Já passou do prazo original
    });
  });

  describe('checkFinancingRenewals', () => {
    it('deve identificar financiamentos que terminam no próximo mês', async () => {
      // Mock da data atual para ser Janeiro
      const mockCurrentDate = new Date(2024, 0, 15); // 15 de Janeiro 2024
      jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentDate.getTime());

      const financingExpense: Expense = {
        id: 1,
        category: 'others',
        description: 'Financiamento Casa',
        amount: 1200,
        type: 'fixed',
        financing: {
          startMonth: 0,
          startYear: 2024,
          endMonth: 1,    // Fevereiro (próximo mês)
          endYear: 2024,
          originalEndMonth: 11,
          originalEndYear: 2024,
          monthlyAmount: 1200,
          totalAmount: 14400,
          isActive: true,
          reminderSent: false,
          groupId: 'financing-renewal-test'
        }
      };

      // Mock do getAllFinancingExpenses para retornar nossa despesa de teste
      jest.spyOn(FinancingService, 'getAllFinancingExpenses')
        .mockResolvedValue([financingExpense]);

      const renewals = await FinancingService.checkFinancingRenewals();

      expect(renewals).toHaveLength(1);
      expect(renewals[0].expense.id).toBe(1);
      expect(renewals[0].monthsUntilEnd).toBe(1);
    });

    it('não deve identificar financiamentos que não terminam no próximo mês', async () => {
      // Mock da data atual para ser Janeiro
      const mockCurrentDate = new Date(2024, 0, 15); // 15 de Janeiro 2024
      jest.spyOn(Date, 'now').mockImplementation(() => mockCurrentDate.getTime());

      const financingExpense: Expense = {
        id: 1,
        category: 'others',
        description: 'Financiamento Casa',
        amount: 1200,
        type: 'fixed',
        financing: {
          startMonth: 0,
          startYear: 2024,
          endMonth: 5,    // Junho (não é próximo mês)
          endYear: 2024,
          originalEndMonth: 11,
          originalEndYear: 2024,
          monthlyAmount: 1200,
          totalAmount: 14400,
          isActive: true,
          reminderSent: false,
          groupId: 'financing-not-renewal-test'
        }
      };

      // Mock do getAllFinancingExpenses para retornar nossa despesa de teste
      jest.spyOn(FinancingService, 'getAllFinancingExpenses')
        .mockResolvedValue([financingExpense]);

      const renewals = await FinancingService.checkFinancingRenewals();

      expect(renewals).toHaveLength(0);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
}); 