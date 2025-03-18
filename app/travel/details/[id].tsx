import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, StatusBar, Animated, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Travel, TravelExpense as BaseTravelExpense, TravelActivity, StorageService } from '../../utils/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Edit2, ArrowLeft, Calendar, MapPin, DollarSign, Wallet, Briefcase, CreditCard, TrendingDown, TrendingUp, X, Check, Trash2 } from 'lucide-react-native';
import TravelItinerary from '../../components/TravelItinerary';
import { useEvent } from '../../utils/EventContext';

// Estender o tipo TravelExpense para incluir a propriedade isActivity
interface TravelExpense extends BaseTravelExpense {
  isActivity?: boolean;
}

export default function TravelDetails() {
  const { colors, theme } = useTheme();
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
  const [isFinancialReportOpen, setIsFinancialReportOpen] = useState(false);
  
  // Animação para o dropdown
  const animatedHeight = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Se o teclado estiver aberto, não abrir o relatório
    if (isFinancialReportOpen) {
      Animated.timing(animatedHeight, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animatedHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isFinancialReportOpen]);

  // Adicionar hook para esconder o relatório quando o teclado aparece
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        console.log('Teclado apareceu, relatório financeiro aberto:', isFinancialReportOpen);
        if (isFinancialReportOpen) {
          console.log('Fechando relatório financeiro devido ao teclado');
          setIsFinancialReportOpen(false);
        }
      }
    );
    
    return () => {
      keyboardWillShowListener.remove();
    };
  }, [isFinancialReportOpen]);

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
    
    // Saldo restante = orçamento total - despesas planejadas
    const totalPlanned = calculateTotalEstimatedCosts();
    
    return travel.budget.total - totalPlanned;
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
    
    // Livre para gastar = orçamento total - despesas planejadas - despesas reais
    const totalPlanned = calculateTotalEstimatedCosts();
    const totalSpent = travel.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return travel.budget.total - totalPlanned - totalSpent;
  };

  const calculatePercentageSpent = () => {
    if (!travel || travel.budget.total <= 0) return 0;
    
    // Soma das despesas reais
    const totalSpent = travel.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calcular com base apenas nas despesas reais sobre o total
    const percentage = Math.round((totalSpent / travel.budget.total) * 100);
    return Math.min(percentage, 100); // Limitar a 100%
  };

  const handleAddExpense = async () => {
    if (!travel || !newExpense.description || !newExpense.amount) {
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

    // Atualizar o estado local
    const updatedTravel: Travel = {
      ...travel,
      expenses: [...travel.expenses, expense]
    };
    
    setTravel(updatedTravel);

    // Limpar o formulário
    setNewExpense({
      category: 'other',
      description: '',
      amount: 0
    });

    // Salvar diretamente sem debounce para garantir atualização imediata
    try {
      const success = await StorageService.saveTravel(updatedTravel);
      if (success) {
        // Disparar evento para notificar que uma viagem foi atualizada
        triggerEvent('TRAVEL_UPDATED');
        console.log('Despesa adicionada e evento TRAVEL_UPDATED disparado');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao salvar a despesa');
      }
    } catch (error) {
      console.error('Error saving travel after adding expense:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a despesa');
    }
  };

  const handleAddPlannedExpense = async () => {
    if (!travel || !newPlannedExpense.description || !newPlannedExpense.amount) {
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

    // Atualizar o estado local
    const updatedTravel: Travel = {
      ...travel,
      budget: {
        ...travel.budget,
        planned: [...travel.budget.planned, plannedExpense]
      }
    };
    
    setTravel(updatedTravel);

    // Limpar o formulário
    setNewPlannedExpense({
      category: 'other',
      description: '',
      amount: 0
    });

    // Salvar diretamente sem debounce para garantir atualização imediata
    try {
      const success = await StorageService.saveTravel(updatedTravel);
      if (success) {
        // Disparar evento para notificar que uma viagem foi atualizada
        triggerEvent('TRAVEL_UPDATED');
        console.log('Despesa planejada adicionada e evento TRAVEL_UPDATED disparado');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao salvar a despesa planejada');
      }
    } catch (error) {
      console.error('Error saving travel after adding planned expense:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a despesa planejada');
    }
  };

  const handleUpdateTravel = async (updatedTravel: Travel) => {
    // Log para depuração
    console.log('handleUpdateTravel - updatedTravel recebido:', updatedTravel);
    
    setTravel(updatedTravel);
    
    // Salvar as alterações no StorageService
    try {
      const success = await StorageService.saveTravel(updatedTravel);
      
      // Log para depuração
      console.log('handleUpdateTravel - resultado do saveTravel:', success);
      
      if (success) {
        // Disparar evento para notificar que uma viagem foi atualizada imediatamente
        triggerEvent('TRAVEL_UPDATED');
        console.log('handleUpdateTravel - evento TRAVEL_UPDATED disparado');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao salvar as alterações');
      }
    } catch (error) {
      console.error('Error in handleUpdateTravel:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar as alterações');
    }
  };

  const handleDeleteExpense = (expenseId: number) => {
    if (!travel) return;
    
    Alert.alert(
      'Excluir Despesa',
      'Tem certeza que deseja excluir esta despesa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            // Remover a despesa
            const updatedTravel: Travel = {
              ...travel,
              expenses: travel.expenses.filter(e => e.id !== expenseId)
            };
            
            setTravel(updatedTravel);
            
            // Salvar as alterações
            try {
              const success = await StorageService.saveTravel(updatedTravel);
              if (success) {
                triggerEvent('TRAVEL_UPDATED');
                console.log('Despesa excluída e evento TRAVEL_UPDATED disparado');
              } else {
                Alert.alert('Erro', 'Ocorreu um erro ao excluir a despesa');
              }
            } catch (error) {
              console.error('Error saving travel after deleting expense:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir a despesa');
            }
          }
        }
      ]
    );
  };
  
  const handleDeletePlannedExpense = (expenseId: number) => {
    if (!travel) return;
    
    Alert.alert(
      'Excluir Despesa Planejada',
      'Tem certeza que deseja excluir esta despesa planejada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            // Remover a despesa planejada
            const updatedTravel: Travel = {
              ...travel,
              budget: {
                ...travel.budget,
                planned: travel.budget.planned.filter(e => e.id !== expenseId)
              }
            };
            
            setTravel(updatedTravel);
            
            // Salvar as alterações
            try {
              const success = await StorageService.saveTravel(updatedTravel);
              if (success) {
                triggerEvent('TRAVEL_UPDATED');
                console.log('Despesa planejada excluída e evento TRAVEL_UPDATED disparado');
              } else {
                Alert.alert('Erro', 'Ocorreu um erro ao excluir a despesa planejada');
              }
            } catch (error) {
              console.error('Error saving travel after deleting planned expense:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir a despesa planejada');
            }
          }
        }
      ]
    );
  };
  
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null);
  const [editingPlannedExpense, setEditingPlannedExpense] = useState<TravelExpense | null>(null);
  
  const handleEditExpense = (expense: TravelExpense) => {
    setEditingExpense(expense);
    setNewExpense({
      category: expense.category,
      description: expense.description,
      amount: expense.amount
    });
  };
  
  const handleEditPlannedExpense = (expense: TravelExpense) => {
    setEditingPlannedExpense(expense);
    setNewPlannedExpense({
      category: expense.category,
      description: expense.description,
      amount: expense.amount
    });
  };
  
  const handleUpdateExpense = async () => {
    if (!travel || !editingExpense || !newExpense.description || !newExpense.amount) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e o valor');
      return;
    }
    
    // Atualizar a despesa
    const updatedExpenses = travel.expenses.map(e => 
      e.id === editingExpense.id 
        ? {
            ...e,
            category: newExpense.category || 'other',
            description: newExpense.description || '',
            amount: Number(newExpense.amount)
          }
        : e
    );
    
    // Atualizar o estado local
    const updatedTravel: Travel = {
      ...travel,
      expenses: updatedExpenses
    };
    
    setTravel(updatedTravel);
    
    // Limpar o formulário
    setNewExpense({
      category: 'other',
      description: '',
      amount: 0
    });
    setEditingExpense(null);
    
    // Salvar as alterações
    try {
      const success = await StorageService.saveTravel(updatedTravel);
      if (success) {
        triggerEvent('TRAVEL_UPDATED');
        console.log('Despesa atualizada e evento TRAVEL_UPDATED disparado');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao atualizar a despesa');
      }
    } catch (error) {
      console.error('Error saving travel after updating expense:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a despesa');
    }
  };
  
  const handleUpdatePlannedExpense = async () => {
    if (!travel || !editingPlannedExpense || !newPlannedExpense.description || !newPlannedExpense.amount) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e o valor');
      return;
    }
    
    // Atualizar a despesa planejada
    const updatedPlannedExpenses = travel.budget.planned.map(e => 
      e.id === editingPlannedExpense.id 
        ? {
            ...e,
            category: newPlannedExpense.category || 'other',
            description: newPlannedExpense.description || '',
            amount: Number(newPlannedExpense.amount)
          }
        : e
    );
    
    // Atualizar o estado local
    const updatedTravel: Travel = {
      ...travel,
      budget: {
        ...travel.budget,
        planned: updatedPlannedExpenses
      }
    };
    
    setTravel(updatedTravel);
    
    // Limpar o formulário
    setNewPlannedExpense({
      category: 'other',
      description: '',
      amount: 0
    });
    setEditingPlannedExpense(null);
    
    // Salvar as alterações
    try {
      const success = await StorageService.saveTravel(updatedTravel);
      if (success) {
        triggerEvent('TRAVEL_UPDATED');
        console.log('Despesa planejada atualizada e evento TRAVEL_UPDATED disparado');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao atualizar a despesa planejada');
      }
    } catch (error) {
      console.error('Error saving travel after updating planned expense:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar a despesa planejada');
    }
  };

  const handleEditActivityCost = (activity: TravelActivity) => {
    const activityExpense: TravelExpense = {
      id: activity.id,
      category: activity.category,
      description: activity.title,
      amount: activity.estimatedCost || 0,
      date: activity.startDateTime,
      isPaid: false,
      isActivity: true // Campo extra para identificar que é uma atividade
    };
    
    setEditingPlannedExpense(activityExpense);
    setNewPlannedExpense({
      category: activity.category,
      description: activity.title,
      amount: activity.estimatedCost || 0
    });
  };
  
  const handleDeleteActivityCost = (activityId: number) => {
    if (!travel) return;
    
    Alert.alert(
      'Remover Custo da Atividade',
      'Deseja remover o custo estimado desta atividade?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            // Encontrar a atividade para editar
            const updatedItinerary = travel.itinerary?.map(a => 
              a.id === activityId 
                ? { ...a, estimatedCost: 0 }
                : a
            ) || [];
            
            // Atualizar o estado local
            const updatedTravel: Travel = {
              ...travel,
              itinerary: updatedItinerary
            };
            
            setTravel(updatedTravel);
            
            // Salvar as alterações
            try {
              const success = await StorageService.saveTravel(updatedTravel);
              if (success) {
                triggerEvent('TRAVEL_UPDATED');
                console.log('Custo da atividade removido e evento TRAVEL_UPDATED disparado');
              } else {
                Alert.alert('Erro', 'Ocorreu um erro ao remover o custo da atividade');
              }
            } catch (error) {
              console.error('Error saving travel after removing activity cost:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao remover o custo da atividade');
            }
          }
        }
      ]
    );
  };
  
  const handleUpdateActivityCost = async () => {
    if (!travel || !editingPlannedExpense || !newPlannedExpense.amount) {
      Alert.alert('Erro', 'Por favor, preencha o valor');
      return;
    }
    
    // Verificar se é uma atividade
    if (editingPlannedExpense.isActivity) {
      // Atualizar custo da atividade
      const activityId = editingPlannedExpense.id;
      
      // Encontrar a atividade para editar
      const updatedItinerary = travel.itinerary?.map(a => 
        a.id === activityId 
          ? { ...a, estimatedCost: Number(newPlannedExpense.amount) }
          : a
      ) || [];
      
      // Atualizar o estado local
      const updatedTravel: Travel = {
        ...travel,
        itinerary: updatedItinerary
      };
      
      setTravel(updatedTravel);
      
      // Limpar o formulário
      setNewPlannedExpense({
        category: 'other',
        description: '',
        amount: 0
      });
      setEditingPlannedExpense(null);
      
      // Salvar as alterações
      try {
        const success = await StorageService.saveTravel(updatedTravel);
        if (success) {
          triggerEvent('TRAVEL_UPDATED');
          console.log('Custo da atividade atualizado e evento TRAVEL_UPDATED disparado');
        } else {
          Alert.alert('Erro', 'Ocorreu um erro ao atualizar o custo da atividade');
        }
      } catch (error) {
        console.error('Error saving travel after updating activity cost:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao atualizar o custo da atividade');
      }
      return;
    }
    
    // Continuar com a atualização de despesa planejada normal
    handleUpdatePlannedExpense();
  };

  // Manipulador para o botão do relatório financeiro
  const toggleFinancialReport = () => {
    console.log('Botão do relatório financeiro pressionado');
    // Sempre fechar o teclado antes de alternar o relatório
    Keyboard.dismiss();
    // Pequeno atraso para garantir que o teclado tenha tempo de ser fechado
    setTimeout(() => {
      setIsFinancialReportOpen(prev => !prev);
    }, 100);
  };

  // Log para depuração
  useEffect(() => {
    if (travel) {
      console.log('Valores do orçamento:');
      console.log('- Total:', travel.budget.total);
      console.log('- Total planejado:', calculateTotalEstimatedCosts());
      console.log('- Total gasto:', travel.expenses.reduce((sum, exp) => sum + exp.amount, 0));
      console.log('- Saldo restante:', calculateRemainingBudget());
      console.log('- Livre para gastar:', calculateDiscretionaryRemaining());
    }
  }, [travel]);

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
      <StatusBar translucent backgroundColor={colors.card} barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
            })} style={styles.headerEditButton}>
              <Edit2 size={24} color={colors.primary} />
            </Pressable>
          </View>

          <View style={[styles.contentContainer, { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, marginTop: -8 }]}>
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

            <Pressable 
              style={[
                styles.financialReportButton, 
                { 
                  backgroundColor: colors.card,
                  borderBottomLeftRadius: isFinancialReportOpen ? 0 : 8,
                  borderBottomRightRadius: isFinancialReportOpen ? 0 : 8,
                  borderBottomWidth: isFinancialReportOpen ? 0 : 1,
                  borderBottomColor: isFinancialReportOpen ? 'transparent' : '#e0e0e0',
                }
              ]} 
              onPress={toggleFinancialReport}
            >
              <View style={styles.financialReportTitleContainer}>
                <DollarSign size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.financialReportButtonText, { color: colors.text.primary }]}>
                  Relatório Financeiro
                </Text>
              </View>
              <Text style={[styles.financialReportButtonText, { color: colors.primary }]}>
                {isFinancialReportOpen ? '▲' : '▼'}
              </Text>
            </Pressable>

            <Animated.View 
              style={[
                styles.financialReportContainer, 
                { 
                  backgroundColor: colors.card,
                  maxHeight: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 300]
                  }),
                  opacity: animatedHeight,
                  overflow: 'hidden',
                  borderWidth: animatedHeight.interpolate({
                    inputRange: [0, 0.01, 1],
                    outputRange: [0, 1, 1]
                  }),
                  borderColor: '#e0e0e0',
                  borderTopWidth: 0,
                }
              ]}
            >
              <ScrollView 
                style={{ maxHeight: 300 }}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {/* Seção de Orçamento */}
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text.secondary }]}>
                    Orçamento
                  </Text>
                  
                  <View style={[styles.budgetItem, { backgroundColor: 'rgba(14, 165, 233, 0.1)', padding: 8, borderRadius: 6 }]}>
                    <View style={styles.budgetLabelContainer}>
                      <Wallet size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.budgetLabel, { color: colors.text.primary }]}>Total</Text>
                    </View>
                    <Text style={[styles.budgetValue, { color: colors.primary, fontWeight: 'bold' }]}>
                      R$ {travel.budget.total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.budgetDivider} />

                {/* Seção de Despesas Planejadas */}
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text.secondary }]}>
                    Despesas Planejadas
                  </Text>
                  
                  <View style={styles.budgetItem}>
                    <View style={styles.budgetLabelContainer}>
                      <Briefcase size={14} color={colors.text.secondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Custos do Itinerário</Text>
                    </View>
                    <Text style={[styles.budgetValue, { color: colors.text.primary }]}>
                      R$ {calculateItineraryCosts().toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.budgetItem}>
                    <View style={styles.budgetLabelContainer}>
                      <CreditCard size={14} color={colors.text.secondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Outras Despesas Planejadas</Text>
                    </View>
                    <Text style={[styles.budgetValue, { color: colors.text.primary }]}>
                      R$ {calculatePlannedExpenses().toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.budgetItem, { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 6, marginTop: 4 }]}>
                    <View style={styles.budgetLabelContainer}>
                      <DollarSign size={14} color={colors.danger} style={{ marginRight: 4 }} />
                      <Text style={[styles.budgetLabel, { color: colors.danger, fontWeight: 'bold' }]}>Total Planejado</Text>
                    </View>
                    <Text style={[styles.budgetValue, { color: colors.danger, fontWeight: 'bold' }]}>
                      R$ {calculateTotalEstimatedCosts().toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.budgetDivider} />

                {/* Seção de Despesas Reais */}
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text.secondary }]}>
                    Despesas Reais
                  </Text>
                  
                  {travel.expenses.length > 0 ? (
                    <>
                      {/* Lista de despesas reais */}
                      <ScrollView style={{ maxHeight: 80 }} nestedScrollEnabled={true}>
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
                            <View style={styles.expenseActions}>
                              <Text style={[styles.expenseAmount, { color: colors.text.primary, marginRight: 10 }]}>
                                R$ {expense.amount.toFixed(2)}
                              </Text>
                              <Pressable
                                onPress={() => handleEditExpense(expense)}
                                style={[styles.actionIconButton, { marginRight: 6 }]}
                              >
                                <Edit2 size={16} color={colors.primary} />
                              </Pressable>
                              <Pressable
                                onPress={() => handleDeleteExpense(expense.id)}
                                style={styles.actionIconButton}
                              >
                                <Trash2 size={16} color={colors.danger} />
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                      
                      {/* Total de despesas reais */}
                      <View style={[styles.budgetItem, { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 6, marginTop: 8 }]}>
                        <View style={styles.budgetLabelContainer}>
                          <CreditCard size={14} color={colors.danger} style={{ marginRight: 4 }} />
                          <Text style={[styles.budgetLabel, { color: colors.text.primary, fontWeight: 'bold' }]}>Total Gasto</Text>
                        </View>
                        <Text style={[styles.budgetValue, { color: colors.danger, fontWeight: 'bold' }]}>
                          R$ {travel.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.budgetItem, { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 6 }]}>
                      <View style={styles.budgetLabelContainer}>
                        <CreditCard size={14} color={colors.danger} style={{ marginRight: 4 }} />
                        <Text style={[styles.budgetLabel, { color: colors.text.primary, fontWeight: 'bold' }]}>Total Gasto</Text>
                      </View>
                      <Text style={[styles.budgetValue, { color: colors.danger, fontWeight: 'bold' }]}>
                        R$ {travel.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.budgetDivider} />

                {/* Seção de Saldo */}
                <View style={styles.reportSection}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text.secondary }]}>
                    Saldo
                  </Text>
                  
                  {/* Porcentagem do orçamento gasta */}
                  <View style={[styles.budgetItem, { marginBottom: 4 }]}>
                    <View style={styles.budgetLabelContainer}>
                      <CreditCard size={14} color={colors.text.secondary} style={{ marginRight: 4 }} />
                      <Text style={[styles.budgetLabel, { color: colors.text.secondary }]}>Porcentagem Gasta</Text>
                    </View>
                    <Text style={[styles.budgetValue, { 
                      color: calculatePercentageSpent() > 80
                        ? colors.danger 
                        : calculatePercentageSpent() > 50
                          ? colors.warning
                          : colors.success
                    }]}>
                      {`${calculatePercentageSpent()}%`}
                    </Text>
                  </View>
                  
                  {/* Barra de progresso */}
                  <View style={{ height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 4, marginBottom: 12 }}>
                    <View 
                      style={{ 
                        height: '100%', 
                        width: `${Math.min(calculatePercentageSpent(), 100)}%`, 
                        backgroundColor: calculatePercentageSpent() > 80
                          ? colors.danger 
                          : calculatePercentageSpent() > 50
                            ? colors.warning
                            : colors.success,
                        borderRadius: 4
                      }} 
                    />
                  </View>

                  <View style={[
                    styles.budgetItem, 
                    { 
                      backgroundColor: calculateRemainingBudget() >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      padding: 8, 
                      borderRadius: 6,
                      marginBottom: 8
                    }
                  ]}>
                    <View style={styles.budgetLabelContainer}>
                      <TrendingDown 
                        size={14} 
                        color={calculateRemainingBudget() >= 0 ? colors.success : colors.danger} 
                        style={{ marginRight: 4 }} 
                      />
                      <Text style={[styles.budgetLabel, { color: colors.text.primary, fontWeight: 'bold' }]}>Saldo Restante</Text>
                    </View>
                    <Text style={[styles.budgetValue, { 
                      color: calculateRemainingBudget() >= 0 ? colors.success : colors.danger,
                      fontWeight: 'bold'
                    }]}>
                      R$ {calculateRemainingBudget().toFixed(2)}
                    </Text>
                  </View>

                  <View style={[
                    styles.budgetItem,
                    { 
                      backgroundColor: calculateDiscretionaryRemaining() >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                      padding: 8, 
                      borderRadius: 6 
                    }
                  ]}>
                    <View style={styles.budgetLabelContainer}>
                      <TrendingUp 
                        size={14} 
                        color={calculateDiscretionaryRemaining() >= 0 ? colors.success : colors.danger} 
                        style={{ marginRight: 4 }} 
                      />
                      <Text style={[styles.budgetLabel, { color: colors.text.primary, fontWeight: 'bold' }]}>Livre para Gastar</Text>
                    </View>
                    <Text style={[styles.budgetValue, { 
                      color: calculateDiscretionaryRemaining() >= 0 ? colors.success : colors.danger,
                      fontWeight: 'bold'
                    }]}>
                      R$ {calculateDiscretionaryRemaining().toFixed(2)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>

            <View style={{ height: 8 }} />

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
                          <View style={styles.expenseActions}>
                            <Text style={[styles.expenseAmount, { color: colors.text.primary, marginRight: 10 }]}>
                              R$ {expense.amount.toFixed(2)}
                            </Text>
                            <Pressable
                              onPress={() => handleEditExpense(expense)}
                              style={[styles.actionIconButton, { marginRight: 6 }]}
                            >
                              <Edit2 size={16} color={colors.primary} />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteExpense(expense.id)}
                              style={styles.actionIconButton}
                            >
                              <Trash2 size={16} color={colors.danger} />
                            </Pressable>
                          </View>
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
                        {editingExpense ? (
                          <View style={styles.editButtonsContainer}>
                            <Pressable
                              onPress={() => {
                                Keyboard.dismiss();
                                setEditingExpense(null);
                                setNewExpense({
                                  category: 'other',
                                  description: '',
                                  amount: 0
                                });
                              }}
                              style={[styles.editButtonStyle, { backgroundColor: colors.danger }]}
                            >
                              <X size={16} color="#fff" />
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Keyboard.dismiss();
                                handleUpdateExpense();
                              }}
                              style={[styles.editButtonStyle, { backgroundColor: colors.success }]}
                            >
                              <Check size={16} color="#fff" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => {
                              Keyboard.dismiss();
                              handleAddExpense();
                            }}
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                          >
                            <Plus size={20} color="#fff" />
                          </Pressable>
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Listar despesas planejadas do orçamento */}
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
                          <View style={styles.expenseActions}>
                            <Text style={[styles.expenseAmount, { color: colors.text.primary, marginRight: 10 }]}>
                              R$ {expense.amount.toFixed(2)}
                            </Text>
                            <Pressable
                              onPress={() => handleEditPlannedExpense(expense)}
                              style={[styles.actionIconButton, { marginRight: 6 }]}
                            >
                              <Edit2 size={16} color={colors.primary} />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeletePlannedExpense(expense.id)}
                              style={styles.actionIconButton}
                            >
                              <Trash2 size={16} color={colors.danger} />
                            </Pressable>
                          </View>
                        </View>
                      ))}

                      {/* Listar custos estimados das atividades do itinerário */}
                      {travel.itinerary && travel.itinerary
                        .filter(activity => activity.estimatedCost !== undefined && activity.estimatedCost > 0)
                        .map(activity => (
                          <View key={`activity-${activity.id}`} style={[styles.expenseItem, { backgroundColor: colors.card }]}>
                            <View style={styles.expenseInfo}>
                              <View style={styles.expenseTitleContainer}>
                                <Calendar size={14} color={colors.primary} style={{ marginRight: 6 }} />
                                <Text style={[styles.expenseDescription, { color: colors.text.primary }]}>
                                  {activity.title}
                                </Text>
                              </View>
                              <Text style={[styles.expenseDate, { color: colors.text.secondary }]}>
                                {activity.category} - {new Date(activity.startDateTime).toLocaleDateString()}
                              </Text>
                            </View>
                            <View style={styles.expenseActions}>
                              <Text style={[styles.expenseAmount, { color: colors.text.primary, marginRight: 10 }]}>
                                R$ {(activity.estimatedCost || 0).toFixed(2)}
                              </Text>
                              <Pressable
                                onPress={() => handleEditActivityCost(activity)}
                                style={[styles.actionIconButton, { marginRight: 6 }]}
                              >
                                <Edit2 size={16} color={colors.primary} />
                              </Pressable>
                              <Pressable
                                onPress={() => handleDeleteActivityCost(activity.id)}
                                style={styles.actionIconButton}
                              >
                                <Trash2 size={16} color={colors.danger} />
                              </Pressable>
                            </View>
                          </View>
                        ))
                      }

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
                        {editingPlannedExpense ? (
                          <View style={styles.editButtonsContainer}>
                            <Pressable
                              onPress={() => {
                                Keyboard.dismiss();
                                setEditingPlannedExpense(null);
                                setNewPlannedExpense({
                                  category: 'other',
                                  description: '',
                                  amount: 0
                                });
                              }}
                              style={[styles.editButtonStyle, { backgroundColor: colors.danger }]}
                            >
                              <X size={16} color="#fff" />
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Keyboard.dismiss();
                                handleUpdateActivityCost();
                              }}
                              style={[styles.editButtonStyle, { backgroundColor: colors.success }]}
                            >
                              <Check size={16} color="#fff" />
                            </Pressable>
                            {editingPlannedExpense.isActivity && (
                              <Text style={[styles.smallText, { color: colors.text.secondary, marginLeft: 8 }]}>
                                Editando custo da atividade
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => {
                              Keyboard.dismiss();
                              handleAddPlannedExpense();
                            }}
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                          >
                            <Plus size={20} color="#fff" />
                          </Pressable>
                        )}
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
      </KeyboardAvoidingView>
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
  headerEditButton: {
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
  financialReportButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  financialReportButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  financialReportContainer: {
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  financialReportTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportSection: {
    marginBottom: 8,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#64748b',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 70,
  },
  expenseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconButton: {
    padding: 4,
  },
  editButtonStyle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  expenseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallText: {
    fontSize: 12,
  },
}); 