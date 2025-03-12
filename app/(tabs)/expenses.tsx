import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Plus, Coffee, ShoppingBag, Car, Heart, User, Package, Pencil, Trash2 } from 'lucide-react-native';
import { StorageService, Expense } from '../utils/storage';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import ExpenseForm from '../components/ExpenseForm';
import MonthSelector from '../components/MonthSelector';

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
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    loadExpenses();
  }, [currentDate]);

  const loadExpenses = async () => {
    const data = await StorageService.loadExpenses(currentDate);
    setExpenses(data);
  };

  const handleSaveExpense = async (expense: Expense) => {
    let newExpenses;
    if (editingExpense) {
      // If editing an expense with installments, we need to handle future installments
      if (expense.installments && expense.installments.total > 1) {
        // Calculate amount per installment
        const amountPerInstallment = expense.amount / expense.installments.total;
        expense.amount = amountPerInstallment;

        // If this is part of an existing installment group, delete all future installments
        if (editingExpense.installments?.groupId) {
          // Load and update all months that might have installments
          for (let i = editingExpense.installments.current; i <= editingExpense.installments.total; i++) {
            const futureDate = new Date(currentDate);
            futureDate.setMonth(currentDate.getMonth() + (i - editingExpense.installments.current));
            
            // Load expenses for that month
            const monthExpenses = await StorageService.loadExpenses(futureDate);
            // Remove the installment for this group
            const filteredExpenses = monthExpenses.filter(
              e => e.installments?.groupId !== editingExpense.installments?.groupId
            );
            // Save the filtered expenses back
            await StorageService.saveExpenses(filteredExpenses, futureDate);
          }
        }

        // Create new future installments
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
      
      // Update current month expenses
      newExpenses = expenses.map(e => e.id === editingExpense.id ? expense : e);
    } else {
      // Add new expense (existing code for new expenses)
      if (expense.installments && expense.installments.total > 1) {
        // Calculate amount per installment
        const amountPerInstallment = expense.amount / expense.installments.total;
        
        // Update the first installment amount
        expense.amount = amountPerInstallment;
        
        // Create future installments
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
    setExpenses(newExpenses);
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a despesa "${expense.category}"?`,
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
        <Pressable style={styles.addButton} onPress={() => {
          setEditingExpense(null);
          setShowForm(!showForm);
        }}>
          <Plus size={24} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.monthSelectorContainer}>
        <MonthSelector currentDate={currentDate} onMonthChange={handleMonthChange} />
      </View>

      {showForm ? (
        <ExpenseForm
          onSave={handleSaveExpense}
          onCancel={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          initialData={editingExpense}
        />
      ) : (
        <>
          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total de Despesas</Text>
              <Text style={styles.summaryValue}>R$ {calculateTotal()}</Text>
            </View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Despesas Fixas</Text>
              <Text style={styles.summaryValue}>R$ {calculateFixedTotal()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Despesas Variáveis</Text>
              <Text style={styles.summaryValue}>R$ {calculateVariableTotal()}</Text>
            </View>
          </View>

          <View style={styles.expensesList}>
            {expenses.map((expense) => {
              const categoryInfo = getCategoryInfo(expense.category);
              return (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color }]}>
                      <IconComponent name={categoryInfo.icon} color="#ffffff" />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseCategory}>{categoryInfo.label}</Text>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <View style={styles.expenseDetails}>
                        <Text style={styles.expenseAmount}>R$ {expense.amount}</Text>
                        <View style={[
                          styles.expenseType,
                          { backgroundColor: expense.type === 'fixed' ? '#3b82f6' : '#22c55e' }
                        ]}>
                          <Text style={styles.expenseTypeText}>
                            {expense.type === 'fixed' ? 'Fixa' : 'Variável'}
                          </Text>
                        </View>
                        {expense.installments && (
                          <View style={styles.installmentBadge}>
                            <Text style={styles.installmentText}>
                              {expense.installments.current}/{expense.installments.total} Parcelas
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditExpense(expense)}
                      >
                        <Pencil size={16} color="#ffffff" />
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteExpense(expense)}
                      >
                        <Trash2 size={16} color="#ffffff" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
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
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summary: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  expensesList: {
    padding: 20,
    gap: 16,
  },
  expenseCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  expenseDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expenseTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  monthSelectorContainer: {
    marginVertical: 16,
  },
  installmentBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  installmentText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});