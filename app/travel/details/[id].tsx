import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Travel, TravelExpense, StorageService } from '../../utils/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Edit2, ArrowLeft } from 'lucide-react-native';

export default function TravelDetails() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [travel, setTravel] = useState<Travel | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<TravelExpense>>({
    category: 'other',
    description: '',
    amount: 0
  });

  useEffect(() => {
    loadTravel();
  }, [id]);

  const loadTravel = async () => {
    const travels = await StorageService.loadTravels();
    const existingTravel = travels.find(t => t.id === Number(id));
    if (existingTravel) {
      setTravel(existingTravel);
    }
  };

  const calculateRemainingBudget = () => {
    if (!travel) return 0;
    const totalSpent = travel.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return travel.budget.total - totalSpent;
  };

  const calculateDiscretionaryRemaining = () => {
    if (!travel) return 0;
    const discretionarySpent = travel.expenses
      .filter(e => !travel.budget.planned.some(p => p.id === e.id))
      .reduce((sum, exp) => sum + exp.amount, 0);
    return travel.budget.discretionary - discretionarySpent;
  };

  const handleAddExpense = async () => {
    if (!travel) return;
    if (!newExpense.description || !newExpense.amount) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e o valor');
      return;
    }

    const expense: TravelExpense = {
      id: Date.now(),
      category: newExpense.category || 'other',
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: new Date().toISOString(),
      isPaid: true
    };

    const updatedTravel = {
      ...travel,
      expenses: [...travel.expenses, expense]
    };

    await StorageService.saveTravel(updatedTravel);
    setTravel(updatedTravel);
    setNewExpense({
      category: 'other',
      description: '',
      amount: 0
    });
  };

  if (!travel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text.primary }]}>{travel.name}</Text>
          <Text style={[styles.dates, { color: colors.text.secondary }]}>
            {new Date(travel.startDate).toLocaleDateString()} - {new Date(travel.endDate).toLocaleDateString()}
          </Text>
        </View>
        <Pressable onPress={() => router.push({
          pathname: '/travel/[id]',
          params: { id: travel.id }
        })} style={styles.editButton}>
          <Edit2 size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
          <View style={styles.budgetItem}>
            <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Orçamento Total</Text>
            <Text style={[styles.budgetValue, { color: colors.text.primary }]}>
              R$ {travel.budget.total.toFixed(2)}
            </Text>
          </View>

          <View style={styles.budgetItem}>
            <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Saldo Restante</Text>
            <Text style={[styles.budgetValue, { 
              color: calculateRemainingBudget() >= 0 ? colors.success : colors.danger 
            }]}>
              R$ {calculateRemainingBudget().toFixed(2)}
            </Text>
          </View>

          <View style={styles.budgetItem}>
            <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Livre para Gastar</Text>
            <Text style={[styles.budgetValue, { 
              color: calculateDiscretionaryRemaining() >= 0 ? colors.success : colors.danger 
            }]}>
              R$ {calculateDiscretionaryRemaining().toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.expensesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Gastos da Viagem</Text>
          
          {travel.expenses.map(expense => (
            <View key={expense.id} style={[styles.expenseItem, { backgroundColor: colors.card }]}>
              <View style={styles.expenseInfo}>
                <Text style={[styles.expenseDescription, { color: colors.text.primary }]}>
                  {expense.description}
                </Text>
                <Text style={[styles.expenseDate, { color: colors.text.secondary }]}>
                  {new Date(expense.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.expenseAmount, { color: colors.text.primary }]}>
                R$ {expense.amount.toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={[styles.addExpenseForm, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.expenseInput, { color: colors.text.primary }]}
              value={newExpense.description}
              onChangeText={description => setNewExpense(prev => ({ ...prev, description }))}
              placeholder="Descrição"
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              style={[styles.expenseInput, { color: colors.text.primary }]}
              value={newExpense.amount?.toString()}
              onChangeText={amount => setNewExpense(prev => ({ ...prev, amount: Number(amount) || 0 }))}
              keyboardType="numeric"
              placeholder="Valor"
              placeholderTextColor={colors.text.secondary}
            />
            <Pressable
              onPress={handleAddExpense}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  editButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  dates: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  budgetCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetItem: {
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  expensesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  addExpenseForm: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  expenseInput: {
    flex: 1,
    height: 40,
    marginRight: 8,
    paddingHorizontal: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
}); 