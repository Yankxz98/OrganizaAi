import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Travel, TravelExpense, StorageService } from '../../utils/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Edit2, ArrowLeft, Calendar, MapPin } from 'lucide-react-native';
import TravelItinerary from '../../components/TravelItinerary';
import { useEvent } from '../../utils/EventContext';

export default function TravelDetails() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { triggerEvent } = useEvent();
  const [travel, setTravel] = useState<Travel | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<TravelExpense>>({
    category: 'other',
    description: '',
    amount: 0
  });
  const [activeTab, setActiveTab] = useState<'expenses' | 'itinerary'>('expenses');

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
    
    // Disparar evento para notificar que uma viagem foi atualizada
    setTimeout(() => {
      triggerEvent('TRAVEL_UPDATED');
    }, 300);
    
    setNewExpense({
      category: 'other',
      description: '',
      amount: 0
    });
  };

  const handleUpdateTravel = (updatedTravel: Travel) => {
    setTravel(updatedTravel);
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

      <View style={styles.tabsContainer}>
        <Pressable 
          style={[
            styles.tabButton, 
            activeTab === 'expenses' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'expenses' ? colors.primary : colors.text.secondary }
          ]}>
            Despesas
          </Text>
        </Pressable>
        <Pressable 
          style={[
            styles.tabButton, 
            activeTab === 'itinerary' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => setActiveTab('itinerary')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'itinerary' ? colors.primary : colors.text.secondary }
          ]}>
            Itinerário
          </Text>
        </Pressable>
      </View>

      {activeTab === 'expenses' ? (
        <ScrollView style={styles.content}>
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
      ) : (
        <TravelItinerary 
          travel={travel} 
          onUpdate={handleUpdateTravel} 
          colors={colors} 
        />
      )}
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
    fontWeight: 'bold',
  },
  dates: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  budgetCard: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  expensesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addExpenseForm: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  expenseInput: {
    flex: 1,
    marginRight: 8,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 