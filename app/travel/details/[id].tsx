import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Travel, TravelExpense, StorageService } from '../../utils/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Edit2, ArrowLeft, Calendar, MapPin } from 'lucide-react-native';
import TravelItinerary from '../../components/TravelItinerary';
import { useEvent } from '../../utils/EventContext';

// Função utilitária para debounce
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

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
  const [newPlannedExpense, setNewPlannedExpense] = useState<Partial<TravelExpense>>({
    category: 'other',
    description: '',
    amount: 0
  });
  const [activeTab, setActiveTab] = useState<'expenses' | 'itinerary'>('expenses');
  const [expenseType, setExpenseType] = useState<'real' | 'planned'>('real');

  // Função para atualizar a viagem com debounce
  const debounceUpdateTravel = useDebounce(async () => {
    if (!travel) return;
    
    try {
      await StorageService.saveTravel(travel);
      
      // Disparar evento para notificar que uma viagem foi atualizada
      triggerEvent('TRAVEL_UPDATED');
      console.log('handleUpdateTravel - evento TRAVEL_UPDATED disparado');
    } catch (error) {
      console.error('Error saving travel:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a viagem');
    }
  }, 300);

  useEffect(() => {
    loadTravel();
  }, [id]);

  const loadTravel = async () => {
    const travels = await StorageService.loadTravels();
    const existingTravel = travels.find(t => t.id === Number(id));
    if (existingTravel) {
      if (!existingTravel.itinerary) {
        existingTravel.itinerary = [];
      }
      setTravel(existingTravel);
    }
  };

  const calculateRemainingBudget = () => {
    if (!travel) return 0;
    
    // Soma das despesas
    const totalSpent = travel.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Usar a função de cálculo do total de custos estimados
    const totalEstimatedCosts = calculateTotalEstimatedCosts();
    
    return travel.budget.total - totalSpent - totalEstimatedCosts;
  };

  const calculateTotalEstimatedCosts = () => {
    if (!travel) return 0;
    
    // Soma dos custos estimados das atividades do itinerário
    const itineraryCosts = (travel.itinerary || []).reduce(
      (sum, activity) => sum + (activity.estimatedCost || 0), 
      0
    );
    
    // Soma das despesas planejadas
    const plannedExpenses = travel.budget.planned.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    
    return itineraryCosts + plannedExpenses;
  };

  const calculateItineraryCosts = () => {
    if (!travel) return 0;
    return (travel.itinerary || []).reduce(
      (sum, activity) => sum + (activity.estimatedCost || 0), 
      0
    );
  };

  const calculatePlannedExpenses = () => {
    if (!travel) return 0;
    const plannedExpenses = travel.budget.planned.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    console.log('Despesas planejadas:', travel.budget.planned, 'Total:', plannedExpenses);
    return plannedExpenses;
  };

  const calculateDiscretionaryRemaining = () => {
    if (!travel) return 0;
    
    // Despesas não planejadas
    const discretionarySpent = travel.expenses
      .filter(e => !travel.budget.planned.some(p => p.id === e.id))
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Usar a função de cálculo do total de custos estimados
    const totalEstimatedCosts = calculateTotalEstimatedCosts();
    
    return travel.budget.discretionary - discretionarySpent - totalEstimatedCosts;
  };

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e o valor');
      return;
    }

    const expense: TravelExpense = {
      id: Date.now(),
      category: newExpense.category || 'other',
      description: newExpense.description || '',
      amount: Number(newExpense.amount),
      date: new Date().toISOString(),
      isPaid: false
    };

    setTravel(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        expenses: [...prev.expenses, expense]
      };
    });

    setNewExpense({
      category: 'other',
      description: '',
      amount: 0
    });

    // Atualizar o armazenamento
    debounceUpdateTravel();
  };

  const handleAddPlannedExpense = () => {
    if (!newPlannedExpense.description || !newPlannedExpense.amount) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e o valor');
      return;
    }

    const plannedExpense: TravelExpense = {
      id: Date.now(),
      category: newPlannedExpense.category || 'other',
      description: newPlannedExpense.description || '',
      amount: Number(newPlannedExpense.amount),
      date: new Date().toISOString(),
      isPaid: false
    };

    setTravel(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        budget: {
          ...prev.budget,
          planned: [...prev.budget.planned, plannedExpense]
        }
      };
    });

    setNewPlannedExpense({
      category: 'other',
      description: '',
      amount: 0
    });

    // Atualizar o armazenamento
    debounceUpdateTravel();
  };

  const handleUpdateTravel = async (updatedTravel: Travel) => {
    // Log para depuração
    console.log('handleUpdateTravel - updatedTravel recebido:', updatedTravel);
    
    setTravel(updatedTravel);
    
    // Salvar as alterações no StorageService
    const success = await StorageService.saveTravel(updatedTravel);
    
    // Log para depuração
    console.log('handleUpdateTravel - resultado do saveTravel:', success);
    
    // Disparar evento para notificar que uma viagem foi atualizada
    setTimeout(() => {
      triggerEvent('TRAVEL_UPDATED');
      console.log('handleUpdateTravel - evento TRAVEL_UPDATED disparado');
    }, 300);
  };

  if (!travel) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]}>
        <StatusBar translucent backgroundColor={colors.card} barStyle="dark-content" />
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.card }]} edges={['top', 'right', 'left']}>
      <StatusBar translucent backgroundColor={colors.card} barStyle="dark-content" />
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 0 }]}>
        <View style={[styles.header, { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0 }]}>
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

        <View style={[styles.contentContainer, { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: -8 }]}>
          <View style={[styles.budgetCard, { backgroundColor: colors.card }]}>
            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Orçamento Total</Text>
              <Text style={[styles.budgetValue, { color: colors.text.primary }]}>
                R$ {travel.budget.total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.budgetDivider} />

            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Custos do Itinerário</Text>
              <Text style={[styles.budgetValue, { color: colors.text.primary }]}>
                R$ {calculateItineraryCosts().toFixed(2)}
              </Text>
            </View>

            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Despesas Planejadas</Text>
              <Text style={[styles.budgetValue, { color: colors.text.primary }]}>
                R$ {calculatePlannedExpenses().toFixed(2)}
              </Text>
            </View>

            <View style={styles.budgetDivider} />

            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Total Planejado</Text>
              <Text style={[styles.budgetValue, { color: colors.text.primary }]}>
                R$ {calculateTotalEstimatedCosts().toFixed(2)}
              </Text>
            </View>

            <View style={styles.budgetDivider} />

            <View style={styles.budgetItem}>
              <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Saldo Restante</Text>
              <Text style={[styles.budgetValue, { 
                color: calculateRemainingBudget() >= 0 ? colors.success : colors.danger 
              }]}>
                R$ {calculateRemainingBudget().toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={[styles.budgetCard, { backgroundColor: colors.card, marginTop: 4, marginBottom: 4 }]}>
            <View style={styles.budgetItemFull}>
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
                
                <View style={styles.expenseTypeContainer}>
                  <Pressable 
                    style={[
                      styles.expenseTypeButton, 
                      expenseType === 'real' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setExpenseType('real')}
                  >
                    <Text style={[
                      styles.expenseTypeText, 
                      { color: expenseType === 'real' ? '#fff' : colors.text.secondary }
                    ]}>
                      Despesas Reais
                    </Text>
                  </Pressable>
                  <Pressable 
                    style={[
                      styles.expenseTypeButton, 
                      expenseType === 'planned' && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setExpenseType('planned')}
                  >
                    <Text style={[
                      styles.expenseTypeText, 
                      { color: expenseType === 'planned' ? '#fff' : colors.text.secondary }
                    ]}>
                      Despesas Planejadas
                    </Text>
                  </Pressable>
                </View>
                
                {expenseType === 'real' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    {travel.budget.planned.map(expense => (
                      <View key={expense.id} style={[styles.expenseItem, { backgroundColor: colors.card }]}>
                        <View style={styles.expenseInfo}>
                          <Text style={[styles.expenseDescription, { color: colors.text.primary }]}>
                            {expense.description}
                          </Text>
                          <Text style={[styles.expenseDate, { color: colors.text.secondary }]}>
                            {expense.category}
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
                        value={newPlannedExpense.description}
                        onChangeText={description => setNewPlannedExpense(prev => ({ ...prev, description }))}
                        placeholder="Descrição"
                        placeholderTextColor={colors.text.secondary}
                      />
                      <TextInput
                        style={[styles.expenseInput, { color: colors.text.primary }]}
                        value={newPlannedExpense.amount?.toString()}
                        onChangeText={amount => setNewPlannedExpense(prev => ({ ...prev, amount: Number(amount) || 0 }))}
                        keyboardType="numeric"
                        placeholder="Valor"
                        placeholderTextColor={colors.text.secondary}
                      />
                      <Pressable
                        onPress={handleAddPlannedExpense}
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                      >
                        <Plus size={20} color="#fff" />
                      </Pressable>
                    </View>
                  </>
                )}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  backButton: {
    padding: 6,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  editButton: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dates: {
    fontSize: 12,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  budgetCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'column',
  },
  budgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    width: '100%',
  },
  budgetItemFull: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    width: '100%',
  },
  budgetLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  budgetDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    width: '100%',
    marginVertical: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  expensesContainer: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 11,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addExpenseForm: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  expenseInput: {
    flex: 1,
    marginRight: 6,
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  expenseTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  expenseTypeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  expenseTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 