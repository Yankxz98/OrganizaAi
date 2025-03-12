import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Travel, TravelExpense, StorageService } from '../utils/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus, Trash2 } from 'lucide-react-native';
import { useEvent } from '../utils/EventContext';

export default function TravelForm() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { triggerEvent } = useEvent();
  const isNew = id === 'new';

  const [travel, setTravel] = useState<Travel>({
    id: isNew ? Date.now() : Number(id),
    name: '',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    budget: {
      total: 0,
      planned: [],
      discretionary: 0
    },
    expenses: []
  });

  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [newPlannedExpense, setNewPlannedExpense] = useState<Partial<TravelExpense>>({
    category: 'transport',
    description: '',
    amount: 0
  });

  useEffect(() => {
    if (!isNew) {
      loadTravel();
    }
  }, [id]);

  const loadTravel = async () => {
    const travels = await StorageService.loadTravels();
    const existingTravel = travels.find(t => t.id === Number(id));
    if (existingTravel) {
      setTravel(existingTravel);
    }
  };

  const handleSave = async () => {
    try {
      if (!travel.name) {
        Alert.alert('Erro', 'Por favor, insira um nome para a viagem');
        return;
      }

      if (travel.budget.total <= 0) {
        Alert.alert('Erro', 'O orçamento total deve ser maior que zero');
        return;
      }

      const plannedTotal = travel.budget.planned.reduce((sum, exp) => sum + exp.amount, 0);
      if (plannedTotal > travel.budget.total) {
        Alert.alert('Erro', 'Os gastos planejados não podem exceder o orçamento total');
        return;
      }

      // Calculate discretionary budget
      const updatedTravel = {
        ...travel,
        budget: {
          ...travel.budget,
          discretionary: travel.budget.total - plannedTotal
        }
      };

      const success = await StorageService.saveTravel(updatedTravel);
      
      if (success) {
        // Disparar evento para notificar que uma viagem foi atualizada
        setTimeout(() => {
          triggerEvent('TRAVEL_UPDATED');
        }, 300);
        
        router.push('/travels');
      } else {
        Alert.alert('Erro', 'Não foi possível salvar a viagem');
      }
    } catch (error) {
      console.error('Error saving travel:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a viagem');
    }
  };

  const handleAddPlannedExpense = () => {
    if (!newPlannedExpense.description || !newPlannedExpense.amount) {
      Alert.alert('Erro', 'Por favor, preencha a descrição e o valor');
      return;
    }

    const plannedExpense: TravelExpense = {
      id: Date.now(),
      category: newPlannedExpense.category || 'transport',
      description: newPlannedExpense.description || '',
      amount: Number(newPlannedExpense.amount),
      date: new Date().toISOString(),
      isPaid: false
    };

    setTravel(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        planned: [...prev.budget.planned, plannedExpense]
      }
    }));

    setNewPlannedExpense({
      category: 'transport',
      description: '',
      amount: 0
    });
  };

  const handleDeletePlannedExpense = (expenseId: number) => {
    setTravel(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        planned: prev.budget.planned.filter(exp => exp.id !== expenseId)
      }
    }));
  };

  const renderDatePicker = (
    show: boolean,
    value: string,
    onChange: (date: Date) => void,
    onClose: () => void
  ) => {
    if (Platform.OS === 'android') {
      if (!show) return null;
    }

    return (
      <DateTimePicker
        value={new Date(value)}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={(event, date) => {
          if (Platform.OS === 'android') {
            onClose();
          }
          if (event.type === 'set' && date) {
            onChange(date);
          }
        }}
      />
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Nome da Viagem</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text.primary }]}
          value={travel.name}
          onChangeText={name => setTravel(prev => ({ ...prev, name }))}
          placeholder="Digite o nome da viagem"
          placeholderTextColor={colors.text.secondary}
        />

        <Text style={[styles.label, { color: colors.text.secondary }]}>Data de Início</Text>
        <Pressable
          style={[styles.input, { backgroundColor: colors.card }]}
          onPress={() => setShowStartDate(true)}
        >
          <Text style={{ color: colors.text.primary }}>
            {new Date(travel.startDate).toLocaleDateString()}
          </Text>
        </Pressable>

        {renderDatePicker(
          showStartDate,
          travel.startDate,
          (date) => setTravel(prev => ({ ...prev, startDate: date.toISOString() })),
          () => setShowStartDate(false)
        )}

        <Text style={[styles.label, { color: colors.text.secondary }]}>Data de Fim</Text>
        <Pressable
          style={[styles.input, { backgroundColor: colors.card }]}
          onPress={() => setShowEndDate(true)}
        >
          <Text style={{ color: colors.text.primary }}>
            {new Date(travel.endDate).toLocaleDateString()}
          </Text>
        </Pressable>

        {renderDatePicker(
          showEndDate,
          travel.endDate,
          (date) => setTravel(prev => ({ ...prev, endDate: date.toISOString() })),
          () => setShowEndDate(false)
        )}

        <Text style={[styles.label, { color: colors.text.secondary }]}>Orçamento Total</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text.primary }]}
          value={travel.budget.total.toString()}
          onChangeText={value => {
            const total = Number(value) || 0;
            setTravel(prev => ({
              ...prev,
              budget: { ...prev.budget, total }
            }));
          }}
          keyboardType="numeric"
          placeholder="Digite o orçamento total"
          placeholderTextColor={colors.text.secondary}
        />

        <View style={styles.plannedExpensesContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Gastos Planejados
          </Text>

          {travel.budget.planned.map(expense => (
            <View key={expense.id} style={[styles.plannedExpense, { backgroundColor: colors.card }]}>
              <View style={styles.plannedExpenseInfo}>
                <Text style={[styles.expenseDescription, { color: colors.text.primary }]}>
                  {expense.description}
                </Text>
                <Text style={[styles.expenseAmount, { color: colors.text.primary }]}>
                  R$ {expense.amount.toFixed(2)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeletePlannedExpense(expense.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}

          <View style={[styles.addExpenseForm, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.expenseInput, { color: colors.text.primary }]}
              value={newPlannedExpense.description}
              onChangeText={description => 
                setNewPlannedExpense(prev => ({ ...prev, description }))
              }
              placeholder="Descrição"
              placeholderTextColor={colors.text.secondary}
            />
            <TextInput
              style={[styles.expenseInput, { color: colors.text.primary }]}
              value={newPlannedExpense.amount?.toString()}
              onChangeText={amount => 
                setNewPlannedExpense(prev => ({ ...prev, amount: Number(amount) || 0 }))
              }
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
        </View>

        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Salvar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  plannedExpensesContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  plannedExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  plannedExpenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
  addExpenseForm: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
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
  saveButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 