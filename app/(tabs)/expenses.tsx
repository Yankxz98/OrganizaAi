import { useRouter } from 'expo-router';
import { Plus, ChevronLeft, MoreVertical, CheckCircle } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonthSelector from '../components/MonthSelector';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { useEvent } from '../utils/EventContext';
import { StorageService, Expense } from '../utils/storage';



export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { triggerEvent, subscribeToEvent } = useEvent();
  const router = useRouter();

  const loadExpenses = useCallback(async () => {
    try {
      // Carregar gastos ativos do mês atual
      const activeData = await StorageService.loadActiveExpenses(currentDate);
      setExpenses(activeData);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    }
  }, [currentDate]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Adicionar um listener para o evento EXPENSE_UPDATED
  useEffect(() => {
    const cleanup = subscribeToEvent('EXPENSE_UPDATED', loadExpenses);
    return cleanup;
  }, [subscribeToEvent, loadExpenses]);

  const handleAddExpense = () => {
    router.push({
      pathname: '/expenses/add',
      params: {
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      }
    });
  };



  const handleEditExpense = (expense: Expense) => {
    router.push({
      pathname: '/expenses/add',
      params: {
        expenseId: expense.id,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      }
    });
  };



  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };



  const calculateTotal = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getCategoryInfo = (categoryId: string) => {
    return EXPENSE_CATEGORIES.find(cat => cat.id === categoryId) || EXPENSE_CATEGORIES[5]; // Default to 'others'
  };



  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Header conforme documentação */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#64748b" />
        </Pressable>

        <Text style={styles.headerTitle}>Despesas</Text>

        <Pressable style={styles.headerButton}>
          <MoreVertical size={24} color="#64748b" />
        </Pressable>
      </View>

      {/* Valor Total de Despesas */}
      <View style={styles.totalSection}>
        <Text style={styles.totalValue}>R$ {calculateTotal().toFixed(2)}</Text>
        <Text style={styles.totalLabel}>Total de Despesas</Text>
      </View>

      {/* Navegação por Mês */}
      <View style={styles.monthNavigation}>
        <MonthSelector
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />
      </View>

      {/* Listagem de Despesas - Conforme documentação */}
      <View style={styles.expensesList}>
        {expenses.map((expense) => {
          const categoryInfo = getCategoryInfo(expense.category);
          return (
            <Pressable
              key={expense.id}
              style={styles.expenseItem}
              onPress={() => handleEditExpense(expense)}
            >
              {/* Ícone de status */}
              <View style={styles.statusIcon}>
                <CheckCircle size={24} color="#22c55e" />
                </View>

              {/* Conta vinculada */}
              <Text style={styles.accountText}>Conta Corrente</Text>

              {/* Descrição */}
              <Text style={styles.expenseDescription}>{expense.description}</Text>

              {/* Tag de Categoria */}
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{categoryInfo.label}</Text>
                    </View>

              {/* Data */}
              <Text style={styles.expenseDate}>
                {new Date().getDate()} {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date().getDay()]}
                    </Text>

              {/* Valor */}
                <Text style={styles.expenseAmount}>R$ {expense.amount.toFixed(2)}</Text>
                </Pressable>
          );
        })}
      </View>


      </ScrollView>
      
      {/* Floating Action Button - Conforme documentação */}
      <Pressable 
        style={styles.fab}
        onPress={handleAddExpense}
      >
        <Plus size={24} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },

  // Header Styles - Conforme documentação
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },

  // Total Section
  totalSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  // Month Navigation
  monthNavigation: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthSelectorContainer: {
    paddingTop: 8,
  },
  // Floating Action Button - Conforme documentação
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  totalBox: {
    flex: 1,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  // Expenses List - Conforme documentação
  expensesList: {
    padding: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIcon: {
    width: 40,
    alignItems: 'center',
  },
  accountText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#64748b',
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  installmentInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  financingBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  financingInfo: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
    fontWeight: '500',
  },
  renewalInfo: {
    fontSize: 11,
    color: '#7c3aed',
    marginTop: 2,
    fontStyle: 'italic',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#f1f5f9',
  },
  // Estilos para gastos planejados
  plannedSection: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  plannedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  plannedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  plannedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPlannedButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  plannedList: {
    padding: 16,
  },
  emptyPlannedContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyPlannedText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  emptyPlannedSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  plannedExpenseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  plannedExpenseCardActivated: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  plannedExpenseCardSimulated: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  plannedExpenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  plannedExpenseInfo: {
    flex: 1,
    marginLeft: 8,
  },
  plannedExpenseAmount: {
    alignItems: 'flex-end',
  },
  plannedExpenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToOfficialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
  },
  addToOfficialButtonHighlight: {
    backgroundColor: '#fef3c7',
  },
  activatedText: {
    color: '#166534',
  },
  activatedAmount: {
    color: '#22c55e',
  },
  simulatedText: {
    color: '#f59e0b',
  },
  simulatedAmount: {
    color: '#f59e0b',
  },
  expenseType: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  simulationIndicator: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  simulatedValue: {
    color: '#f59e0b',
  },
  propagatedBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  propagationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  propagationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  propagationTextActive: {
    color: '#166534',
    fontWeight: '600',
  },
});