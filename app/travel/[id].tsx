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
    expenses: [],
    itinerary: []
  });

  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

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
    if (!travel.name || !travel.startDate || !travel.endDate || !travel.budget.total) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Garantir que os campos obrigatórios estejam presentes
      if (!travel.budget.planned) {
        travel.budget.planned = [];
      }
      
      if (!travel.expenses) {
        travel.expenses = [];
      }
      
      if (!travel.itinerary) {
        travel.itinerary = [];
      }
      
      // Não precisamos mais calcular o discretionary, pois agora 
      // isso será calculado dinamicamente quando necessário

      await StorageService.saveTravel(travel);
      triggerEvent('TRAVEL_UPDATED');
      router.back();
    } catch (error) {
      console.error('Error saving travel:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a viagem');
    }
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