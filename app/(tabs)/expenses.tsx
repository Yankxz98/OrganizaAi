import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Plus, Coffee, ShoppingBag, Car, Heart, User, Package, Pencil, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StorageService, Expense } from '../utils/storage';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import MonthSelector from '../components/MonthSelector';
import { useEvent } from '../utils/EventContext';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const { triggerEvent, subscribeToEvent } = useEvent();
  const router = useRouter();

  const loadExpenses = useCallback(async () => {
    try {
      const data = await StorageService.loadExpenses(currentDate);
      setExpenses(data);
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

  const getCategoryInfo = (categoryId: string) => {
    return EXPENSE_CATEGORIES.find(cat => cat.id === categoryId) || EXPENSE_CATEGORIES[5]; // Default to 'others'
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Despesas</Text>
        <Pressable 
          style={styles.addButton}
          onPress={handleAddExpense}
          testID="add-expense-button"
        >
          <Plus size={24} color="#ffffff" />
        </Pressable>
      </View>

      <MonthSelector
        currentDate={currentDate}
        onMonthChange={handleMonthChange}
      />

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
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  {expense.installments && (
                    <Text style={styles.installmentInfo}>
                      Parcela {expense.installments.current} de {expense.installments.total}
                    </Text>
                  )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#0ea5e9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
});