import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Expense, StorageService } from '../utils/storage';
import ExpenseForm from '../components/ExpenseForm';
import { useEvent } from '../utils/EventContext';

export default function AddExpenseScreen() {
  const [initialData, setInitialData] = useState<Expense | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const router = useRouter();
  const { triggerEvent } = useEvent();
  const params = useLocalSearchParams();
  const { expenseId, month, year } = params;
  
  // Converter o mês e ano para Date caso estejam presentes
  const currentDate = month && year 
    ? new Date(Number(year), Number(month))
    : new Date();

  useEffect(() => {
    // Se tiver um ID, carrega os dados para edição apenas uma vez
    const loadExpenseData = async () => {
      if (expenseId && !dataLoaded) {
        try {
          const expenses = await StorageService.loadExpenses(currentDate);
          const expense = expenses.find(e => e.id === Number(expenseId));
          if (expense) {
            setInitialData(expense);
          }
          setDataLoaded(true);
        } catch (error) {
          console.error('Erro ao carregar despesa:', error);
          setDataLoaded(true);
        }
      }
    };

    loadExpenseData();
  }, [expenseId, currentDate, dataLoaded]);

  const handleSave = async (expense: Expense) => {
    try {
      let newExpenses;
      const expenses = await StorageService.loadExpenses(currentDate);

      if (expenseId) {
        // Edição de despesa existente
        if (expense.installments && expense.installments.total > 1) {
          // Lógica para despesas com parcelas
          const amountPerInstallment = expense.amount / expense.installments.total;
          expense.amount = amountPerInstallment;

          // Preservar o groupId original se estiver disponível
          if (initialData?.installments?.groupId) {
            expense.installments.groupId = initialData.installments.groupId;
          } else {
            // Criar um novo groupId se não existir
            expense.installments.groupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }

          // Se a despesa já tinha parcelas, lidar com parcelas futuras
          if (initialData?.installments?.groupId) {
            // Remover parcelas futuras
            for (let i = initialData.installments.current; i <= initialData.installments.total; i++) {
              const futureDate = new Date(currentDate);
              futureDate.setMonth(currentDate.getMonth() + (i - initialData.installments.current));
              
              const monthExpenses = await StorageService.loadExpenses(futureDate);
              const filteredExpenses = monthExpenses.filter(
                e => e.installments?.groupId !== initialData.installments?.groupId
              );
              await StorageService.saveExpenses(filteredExpenses, futureDate);
            }
          }

          // Criar novas parcelas futuras
          for (let i = expense.installments.current + 1; i <= expense.installments.total; i++) {
            const futureDate = new Date(currentDate);
            futureDate.setMonth(currentDate.getMonth() + (i - expense.installments.current));
            
            const installment: Expense = {
              ...expense,
              id: Date.now() + i,
              amount: amountPerInstallment,
              installments: {
                ...expense.installments,
                current: i
              }
            };
            
            await StorageService.saveExpenses([installment], futureDate, true);
          }
        }
        
        // Atualizar despesa atual
        newExpenses = expenses.map(e => e.id === Number(expenseId) ? expense : e);
      } else {
        // Nova despesa
        if (expense.installments && expense.installments.total > 1) {
          // Lógica para despesas parceladas
          const amountPerInstallment = expense.amount / expense.installments.total;
          expense.amount = amountPerInstallment;
          
          // Criar parcelas futuras
          for (let i = 2; i <= expense.installments.total; i++) {
            const futureDate = new Date(currentDate);
            futureDate.setMonth(currentDate.getMonth() + (i - 1));
            
            const installment: Expense = {
              ...expense,
              id: Date.now() + i,
              amount: amountPerInstallment,
              installments: {
                ...expense.installments,
                current: i
              }
            };
            
            await StorageService.saveExpenses([installment], futureDate, true);
          }
        }
        newExpenses = [...expenses, expense];
      }
      
      await StorageService.saveExpenses(newExpenses, currentDate);
      
      // Disparar evento para atualizar o dashboard
      setTimeout(() => {
        triggerEvent('EXPENSE_UPDATED');
      }, 0);
      
      // Voltar para a tela anterior
      router.back();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <ExpenseForm 
        onSave={handleSave} 
        onCancel={handleCancel} 
        initialData={initialData} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  }
}); 