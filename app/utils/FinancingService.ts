import { Alert } from 'react-native';
import { Expense, StorageService } from './storage';

export interface FinancingRenewal {
  expense: Expense;
  monthsUntilEnd: number;
  remainingMonths: number;
}

export class FinancingService {
  // Verificar financiamentos próximos do fim
  static async checkFinancingRenewals(): Promise<FinancingRenewal[]> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Buscar financiamentos que terminam no PRÓXIMO mês
    const renewals: FinancingRenewal[] = [];
    
    // Verificar financiamentos ativos
    const allExpenses = await this.getAllFinancingExpenses();
    
    for (const expense of allExpenses) {
      if (expense.financing && expense.financing.isActive) {
        const { endMonth, endYear } = expense.financing;
        
        // Se o financiamento termina no próximo mês
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        
        if (endMonth === nextMonth && endYear === nextYear && !expense.financing.reminderSent) {
          const remainingMonths = this.calculateRemainingOriginalMonths(expense);
          renewals.push({
            expense,
            monthsUntilEnd: 1,
            remainingMonths
          });
        }
      }
    }
    
    return renewals;
  }
  
  // Buscar todas as despesas de financiamento
  static async getAllFinancingExpenses(): Promise<Expense[]> {
    const financingExpenses: Expense[] = [];
    const currentDate = new Date();
    
    // Buscar nos últimos 12 meses e próximos 12 meses
    for (let offset = -12; offset <= 12; offset++) {
      const searchDate = new Date(currentDate);
      searchDate.setMonth(currentDate.getMonth() + offset);
      
      const monthExpenses = await StorageService.loadExpenses(searchDate);
      const monthFinancingExpenses = monthExpenses.filter(expense => expense.financing);
      financingExpenses.push(...monthFinancingExpenses);
    }
    
    // Remover duplicatas por groupId
    const uniqueFinancingExpenses = financingExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => e.financing?.groupId === expense.financing?.groupId)
    );
    
    return uniqueFinancingExpenses;
  }
  
  // Mostrar alerta de renovação
  static showRenewalAlert(financing: FinancingRenewal): void {
    const { expense } = financing;
    const remainingMonths = this.calculateRemainingOriginalMonths(expense);
    const renewalMonths = Math.min(12, remainingMonths);
    
    Alert.alert(
      'Renovação de Financiamento',
      `Seu financiamento "${expense.description}" termina em 1 mês. ${
        remainingMonths > 0 
          ? `Deseja renová-lo por mais ${renewalMonths} meses?`
          : 'Este financiamento chegou ao fim original.'
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Alterar Valor', onPress: () => this.openRenewalForm(financing) },
        ...(remainingMonths > 0 ? [{ text: 'Renovar', onPress: () => this.renewFinancing(financing) }] : [])
      ]
    );
  }
  
  // Renovar financiamento automaticamente
  static async renewFinancing(financing: FinancingRenewal): Promise<boolean> {
    const { expense } = financing;
    if (!expense.financing) return false;
    
    // Calcular nova data de início (mês seguinte ao término)
    const newStartMonth = expense.financing.endMonth === 11 ? 0 : expense.financing.endMonth + 1;
    const newStartYear = expense.financing.endMonth === 11 ? expense.financing.endYear + 1 : expense.financing.endYear;
    
    // Calcular quantos meses faltam até o fim ORIGINAL do financiamento
    const originalEndDate = new Date(expense.financing.originalEndYear, expense.financing.originalEndMonth);
    const renewalStartDate = new Date(newStartYear, newStartMonth);
    const monthsRemaining = this.calculateMonthsDifference(renewalStartDate, originalEndDate) + 1;
    
    // Verificar se ainda há meses para renovar
    if (monthsRemaining <= 0) {
      // Financiamento já chegou ao fim original
      Alert.alert('Financiamento Finalizado', 'Este financiamento já chegou ao prazo original e não pode ser renovado.');
      return false;
    }
    
    // Determinar quantos meses adicionar (máximo 12, ou o que resta)
    const monthsToAdd = Math.min(12, monthsRemaining);
    
    // Nova data de fim
    const newEndDate = new Date(newStartYear, newStartMonth);
    newEndDate.setMonth(newEndDate.getMonth() + (monthsToAdd - 1));
    
    // Criar novo financiamento
    const renewedFinancing = {
      ...expense.financing,
      startMonth: newStartMonth,
      startYear: newStartYear,
      endMonth: newEndDate.getMonth(),
      endYear: newEndDate.getFullYear(),
      // Manter originalEndMonth e originalEndYear inalterados
      renewalCount: (expense.financing.renewalCount || 0) + 1,
      reminderSent: false
    };
    
    // Criar nova despesa com o número correto de parcelas
    const renewedExpense = {
      ...expense,
      id: Date.now(),
      financing: renewedFinancing
    };
    
    // Criar as parcelas (pode ser menos de 12)
    await this.createFinancingInstallments(renewedExpense);
    
    Alert.alert('Sucesso', `Financiamento renovado por mais ${monthsToAdd} meses.`);
    return true;
  }
  
  // Calcular meses restantes até o fim original
  static calculateRemainingOriginalMonths(expense: Expense): number {
    if (!expense.financing) return 0;
    
    const currentDate = new Date();
    const originalEndDate = new Date(expense.financing.originalEndYear, expense.financing.originalEndMonth);
    
    return this.calculateMonthsDifference(currentDate, originalEndDate);
  }
  
  // Calcular diferença entre duas datas em meses
  static calculateMonthsDifference(startDate: Date, endDate: Date): number {
    const years = endDate.getFullYear() - startDate.getFullYear();
    const months = endDate.getMonth() - startDate.getMonth();
    return years * 12 + months;
  }
  
  // Criar parcelas do financiamento
  static async createFinancingInstallments(expense: Expense): Promise<void> {
    if (!expense.financing) return;
    
    const { startMonth, startYear, endMonth, endYear, monthlyAmount } = expense.financing;
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = new Date(endYear, endMonth, 1);
    
    // Calcular número total de meses do financiamento
    const totalMonths = this.calculateMonthsDifference(startDate, endDate) + 1;
    
    let currentInstallmentDate = new Date(startDate);
    let installmentNumber = 1;
    
    // Criar parcelas APENAS até a data fim do financiamento
    while (currentInstallmentDate <= endDate && installmentNumber <= totalMonths) {
      const installmentExpense = {
        ...expense,
        id: Date.now() + installmentNumber,
        amount: monthlyAmount,
        financing: expense.financing,
        installments: {
          total: totalMonths, // Número real de parcelas do financiamento
          current: installmentNumber,
          groupId: expense.financing.groupId || `financing-${Date.now()}`
        }
      };
      
      await StorageService.saveExpenses([installmentExpense], currentInstallmentDate, true);
      
      // Próximo mês
      currentInstallmentDate.setMonth(currentInstallmentDate.getMonth() + 1);
      installmentNumber++;
    }
  }
  
  // Marcar aviso como enviado
  static async markReminderSent(expense: Expense): Promise<void> {
    if (expense.financing) {
      expense.financing.reminderSent = true;
      // Salvar no storage - atualizar todas as parcelas do mesmo groupId
      await this.updateFinancingExpense(expense);
    }
  }
  
  // Atualizar despesa de financiamento
  static async updateFinancingExpense(expense: Expense): Promise<void> {
    if (!expense.financing?.groupId) return;
    
    const currentDate = new Date();
    
    // Atualizar todas as parcelas do mesmo groupId
    for (let offset = -12; offset <= 12; offset++) {
      const searchDate = new Date(currentDate);
      searchDate.setMonth(currentDate.getMonth() + offset);
      
      const monthExpenses = await StorageService.loadExpenses(searchDate);
      let hasChanges = false;
      
      const updatedExpenses = monthExpenses.map(e => {
        if (e.financing?.groupId === expense.financing?.groupId) {
          hasChanges = true;
          return { ...e, financing: expense.financing };
        }
        return e;
      });
      
      if (hasChanges) {
        await StorageService.saveExpenses(updatedExpenses, searchDate);
      }
    }
  }
  
  // Abrir formulário de renovação (placeholder)
  static openRenewalForm(financing: FinancingRenewal): void {
    // TODO: Implementar navegação para tela de renovação
    Alert.alert('Em Desenvolvimento', 'Funcionalidade de alteração de valor será implementada na próxima versão.');
  }
} 