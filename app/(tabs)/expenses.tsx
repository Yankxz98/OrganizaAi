import { useRouter } from 'expo-router';
import { Plus, Coffee, ShoppingBag, Car, Heart, User, Package, Pencil, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonthSelector from '../components/MonthSelector';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { useEvent } from '../utils/EventContext';
import { StorageService, Expense } from '../utils/storage';
import { useTheme } from '../theme/ThemeContext';

const IconComponent = ({ name, color }: { name: string; color: string }) => {
  switch (name) {
    case 'Coffee':
      return <Coffee size={24} color={color} />;
    case 'ShoppingBag':
      return <ShoppingBag size={24} color={color} />;
    case 'Car':
      return <Car size={24} color={color} />;
    case 'Heart':
      return <Heart size={24} color={color} />;
    case 'User':
      return <User size={24} color={color} />;
    case 'Package':
      return <Package size={24} color={color} />;
    default:
      return <Package size={24} color={color} />;
  }
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [plannedExpenses, setPlannedExpenses] = useState<Expense[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPlannedExpenses, setShowPlannedExpenses] = useState(false);
  const { triggerEvent, subscribeToEvent } = useEvent();
  const { colors } = useTheme();
  const router = useRouter();

  const loadExpenses = useCallback(async () => {
    try {
      // Carregar gastos ativos (reais + planejados ativados)
      const activeData = await StorageService.loadActiveExpenses(currentDate);
      setExpenses(activeData);

      // Carregar gastos planejados (incluindo não ativados)
      const plannedData = await StorageService.loadPlannedExpenses(currentDate);
      setPlannedExpenses(plannedData);
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

  const handleAddPlannedExpense = () => {
    router.push({
      pathname: '/expenses/add',
      params: {
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        isPlanned: 'true'
      }
    });
  };

  const handleTogglePlannedExpense = async (expense: Expense) => {
    try {
      const success = expense.isActivated 
        ? await StorageService.deactivatePlannedExpense(expense.id, currentDate)
        : await StorageService.activatePlannedExpense(expense.id, currentDate);

      if (success) {
        await loadExpenses();
        triggerEvent('EXPENSE_UPDATED');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o gasto planejado');
      }
    } catch (error) {
      console.error('Erro ao alternar gasto planejado:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o gasto');
    }
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

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a despesa "${expense.description}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const newExpenses = expenses.filter(e => e.id !== expense.id);
            await StorageService.saveExpenses(newExpenses, currentDate);
            setExpenses(newExpenses);
            
            // Disparar evento para atualizar o dashboard
            triggerEvent('EXPENSE_UPDATED');
          },
        },
      ],
    );
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const calculateTotal = () => {
    // Considerar apenas gastos ativos (não planejados ou planejados ativados)
    return expenses
      .filter(expense => !expense.isPlanned || expense.isActivated)
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const calculateFixedTotal = () => {
    return expenses
      .filter(expense => expense.type === 'fixed' && (!expense.isPlanned || expense.isActivated))
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const calculateVariableTotal = () => {
    return expenses
      .filter(expense => expense.type === 'variable' && (!expense.isPlanned || expense.isActivated))
      .reduce((total, expense) => total + expense.amount, 0);
  };

  const getCategoryInfo = (categoryId: string) => {
    return EXPENSE_CATEGORIES.find(cat => cat.id === categoryId) || EXPENSE_CATEGORIES[5]; // Default to 'others'
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['right', 'left']}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Platform.OS === 'ios' ? 80 : 70,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.monthSelectorContainer}>
        <MonthSelector
          currentDate={currentDate}
          onMonthChange={handleMonthChange}
        />
      </View>

      <View style={styles.totalContainer}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total de Despesas</Text>
          <Text style={styles.totalValue}>R$ {calculateTotal().toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Despesas Fixas</Text>
          <Text style={styles.totalValue}>R$ {calculateFixedTotal().toFixed(2)}</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Despesas Variáveis</Text>
          <Text style={styles.totalValue}>R$ {calculateVariableTotal().toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.expensesList}>
        {expenses.map((expense) => {
          const categoryInfo = getCategoryInfo(expense.category);
          return (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
                  <IconComponent name={categoryInfo.icon} color="#ffffff" />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseCategory}>{categoryInfo.label}</Text>
                  <Text style={styles.expenseDescription}>
                    {expense.description}
                    {expense.financing && (
                      <Text style={styles.financingBadge}> 💰 Financiamento</Text>
                    )}
                  </Text>
                  {expense.financing ? (
                    <View>
                      <Text style={styles.financingInfo}>
                        Parcela {expense.installments?.current || 1} de {expense.installments?.total || 1} - Termina em {
                          (() => {
                            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                            return `${months[expense.financing.endMonth]}/${expense.financing.endYear}`;
                          })()
                        }
                      </Text>
                      {expense.financing.renewalCount && expense.financing.renewalCount > 0 && (
                        <Text style={styles.renewalInfo}>
                          Renovado {expense.financing.renewalCount}x
                        </Text>
                      )}
                    </View>
                  ) : expense.installments ? (
                    <Text style={styles.installmentInfo}>
                      Parcela {expense.installments.current} de {expense.installments.total}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.expenseAmount}>R$ {expense.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.actionsContainer}>
                <Pressable 
                  style={styles.actionButton} 
                  onPress={() => handleEditExpense(expense)}
                  testID="edit-expense-button"
                >
                  <Pencil size={20} color="#64748b" />
                </Pressable>
                <Pressable 
                  style={styles.actionButton} 
                  onPress={() => handleDeleteExpense(expense)}
                  testID="delete-expense-button"
                >
                  <Trash2 size={20} color="#64748b" />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      {/* Seção de Gastos Planejados */}
      <View style={styles.plannedSection}>
        <Pressable 
          style={styles.plannedHeader}
          onPress={() => setShowPlannedExpenses(!showPlannedExpenses)}
        >
          <Text style={styles.plannedTitle}>
            Gastos Planejados ({plannedExpenses.length})
          </Text>
          <View style={styles.plannedHeaderRight}>
            <Pressable 
              style={styles.addPlannedButton}
              onPress={handleAddPlannedExpense}
            >
              <Plus size={20} color="#3b82f6" />
            </Pressable>
            {showPlannedExpenses ? (
              <ChevronUp size={24} color="#64748b" />
            ) : (
              <ChevronDown size={24} color="#64748b" />
            )}
          </View>
        </Pressable>

        {showPlannedExpenses && (
          <View style={styles.plannedList}>
            {plannedExpenses.length === 0 ? (
              <View style={styles.emptyPlannedContainer}>
                <Text style={styles.emptyPlannedText}>
                  Nenhum gasto planejado para este mês
                </Text>
                <Text style={styles.emptyPlannedSubtext}>
                  Toque no + acima para adicionar gastos que você está planejando
                </Text>
              </View>
            ) : (
              plannedExpenses.map((expense) => {
                const categoryInfo = getCategoryInfo(expense.category);
                return (
                  <View key={expense.id} style={[
                    styles.plannedExpenseCard,
                    expense.isActivated && styles.plannedExpenseCardActivated
                  ]}>
                    <View style={styles.plannedExpenseHeader}>
                      <Pressable 
                        style={styles.checkboxContainer}
                        onPress={() => handleTogglePlannedExpense(expense)}
                      >
                        {expense.isActivated ? (
                          <CheckSquare size={24} color="#22c55e" />
                        ) : (
                          <Square size={24} color="#94a3b8" />
                        )}
                      </Pressable>
                      
                      <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
                        <IconComponent name={categoryInfo.icon} color="#ffffff" />
                      </View>
                      
                      <View style={styles.plannedExpenseInfo}>
                        <Text style={[
                          styles.expenseCategory,
                          expense.isActivated && styles.activatedText
                        ]}>
                          {categoryInfo.label}
                        </Text>
                        <Text style={[
                          styles.expenseDescription,
                          expense.isActivated && styles.activatedText
                        ]}>
                          {expense.description}
                        </Text>
                        <Text style={[
                          styles.expenseType,
                          expense.isActivated && styles.activatedText
                        ]}>
                          {expense.type === 'fixed' ? 'Fixa' : 'Variável'} • Planejado
                        </Text>
                      </View>
                      
                      <View style={styles.plannedExpenseAmount}>
                        <Text style={[
                          styles.amount,
                          expense.isActivated && styles.activatedAmount
                        ]}>
                          R$ {expense.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.actionsContainer}>
                      <Pressable 
                        style={styles.actionButton} 
                        onPress={() => handleEditExpense(expense)}
                        testID="edit-planned-expense-button"
                      >
                        <Pencil size={20} color="#64748b" />
                      </Pressable>
                      <Pressable 
                        style={styles.actionButton} 
                        onPress={() => handleDeleteExpense(expense)}
                        testID="delete-planned-expense-button"
                      >
                        <Trash2 size={20} color="#64748b" />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>
      </ScrollView>
      
      {/* Botão flutuante */}
      <Pressable 
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleAddExpense}
        testID="add-expense-button"
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
  monthSelectorContainer: {
    paddingTop: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
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
  expensesList: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  activatedText: {
    color: '#166534',
  },
  activatedAmount: {
    color: '#22c55e',
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
});