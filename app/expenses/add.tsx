import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import ExpenseForm from '../components/ExpenseForm';
import { useEvent } from '../utils/EventContext';
import { FinancingService } from '../utils/FinancingService';
import { Expense, StorageService } from '../utils/storage';

export default function AddExpenseScreen() {
  const [initialData, setInitialData] = useState<Expense | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const router = useRouter();
  const { triggerEvent } = useEvent();
  const params = useLocalSearchParams();
  const { expenseId, month, year, isPlanned } = params;
  
  // Converter o mês e ano para Date caso estejam presentes
  const currentDate = month && year 
    ? new Date(Number(year), Number(month))
    : new Date();

  useEffect(() => {
    const loadExpenseData = async () => {
      if (expenseId && !dataLoaded) {
        try {
          const expenses = await StorageService.loadExpenses(currentDate);
          const expense = expenses.find(e => e.id === Number(expenseId));
          if (expense) {
            setInitialData(expense);
            setDataLoaded(true);
          }
        } catch (error) {
          console.error('Erro ao carregar despesa:', error);
        }
      } else if (isPlanned === 'true' && !dataLoaded) {
        // Definir dados iniciais para gasto planejado
        setInitialData({
          id: Date.now(),
          category: 'others',
          description: '',
          amount: 0,
          type: 'variable',
          isPlanned: true,
          isActivated: false
        });
        setDataLoaded(true);
      }
    };

    loadExpenseData();
  }, [expenseId, isPlanned, dataLoaded, currentDate]);

  const handleSave = async (expense: Expense) => {
    if (!expense.description || !expense.amount) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      let newExpenses;
      const expenses = await StorageService.loadExpenses(currentDate);

      if (expenseId) {
        // Edição de despesa existente
        
        // Se o gasto tinha referência ao mês anterior e o valor foi alterado, limpar referência
        if (initialData?.basedOnPreviousMonth && 
            expense.amount !== initialData.basedOnPreviousMonth.previousAmount) {
          delete expense.basedOnPreviousMonth;
        }
        
        if (expense.financing) {
          // Lógica para financiamento (não implementada completamente)
          Alert.alert('Atenção', 'A edição de financiamentos ainda não está implementada.');
          return;
        } else if (expense.installments && expense.installments.total > 1) {
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
            
            const futureExpenses = await StorageService.loadExpenses(futureDate);
            const futureExpense = {
              ...expense,
              id: Date.now() + i,
              amount: amountPerInstallment,
              installments: {
                ...expense.installments,
                current: i
              }
            };
            
            await StorageService.saveExpenses([...futureExpenses, futureExpense], futureDate);
          }
        }
        
        // Atualizar despesa atual
        newExpenses = expenses.map(e => e.id === Number(expenseId) ? expense : e);
      } else {
        // Nova despesa
        if (expense.financing) {
          // Para financiamento, o valor já é o valor mensal
          // Não precisamos dividir por parcelas pois cada parcela terá o mesmo valor
          await FinancingService.createFinancingInstallments(expense);
          // Para financiamento, não adicionamos a despesa manualmente ao mês atual
          // pois as parcelas já foram criadas pelo FinancingService
          newExpenses = expenses;
        } else if (expense.installments && expense.installments.total > 1) {
          // Lógica para despesas parceladas
          const amountPerInstallment = expense.amount / expense.installments.total;
          expense.amount = amountPerInstallment;
          
          // Criar parcelas futuras
          for (let i = 2; i <= expense.installments.total; i++) {
            const futureDate = new Date(currentDate);
            futureDate.setMonth(currentDate.getMonth() + (i - 1));
            
            const futureExpenses = await StorageService.loadExpenses(futureDate);
            const futureExpense = {
              ...expense,
              id: Date.now() + i,
              amount: amountPerInstallment,
              installments: {
                ...expense.installments,
                current: i
              }
            };
            
            await StorageService.saveExpenses([...futureExpenses, futureExpense], futureDate);
          }
          newExpenses = [...expenses, expense];
        } else {
          newExpenses = [...expenses, expense];
        }
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
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a despesa');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
      <ExpenseForm 
        onSave={handleSave} 
        onCancel={handleCancel} 
        initialData={initialData} 
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  }
}); 