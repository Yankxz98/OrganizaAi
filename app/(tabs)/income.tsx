import { useRouter } from 'expo-router';
import { Plus, ChevronLeft, MoreVertical, CheckCircle, Clock, ChevronDown } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MonthSelector from '../components/MonthSelector';
import { useEvent } from '../utils/EventContext';
import { StorageService, Income } from '../utils/storage';
import { StatusBar } from 'expo-status-bar';

interface IncomeScreenProps {
  initialDate?: string;
}

export default function IncomeScreen({ initialDate }: IncomeScreenProps) {
  const router = useRouter();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const { subscribeToEvent } = useEvent();

  const loadIncomes = useCallback(async () => {
    try {
      const data = await StorageService.loadIncome();
      setIncomes(data);
    } catch (error) {
      console.error('Erro ao carregar rendas:', error);
    }
  }, []);

  useEffect(() => {
    loadIncomes();
    // Inscrever no evento de atualização
    const unsubscribe = subscribeToEvent('INCOME_UPDATED', loadIncomes);
    return () => unsubscribe();
  }, [loadIncomes, subscribeToEvent]);

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };







  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const getDayOfWeek = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  // Função para obter dados reais das rendas do mês atual
  const getIncomeDataForCurrentMonth = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const incomeItems: any[] = [];

    incomes.forEach(income => {
      // Fontes fixas
      income.sources.forEach(source => {
        incomeItems.push({
          id: `${income.id}_source_${source.id}`,
          description: source.name,
          account: 'Conta Corrente', // Simplificado para o exemplo
          category: 'Salário', // Categorização básica
          value: source.amount,
          date: new Date(currentYear, currentMonth, 15), // Data genérica
          status: 'efetivada' as const,
          type: 'fixed'
        });
      });

      // Extras do mês atual
      const monthlyExtras = income.monthlyExtras?.find(
        m => m.month === currentMonth && m.year === currentYear
      );

      if (monthlyExtras) {
        monthlyExtras.extras.forEach(extra => {
          incomeItems.push({
            id: `${income.id}_extra_${extra.id}`,
            description: extra.description,
            account: 'Conta Corrente',
            category: 'Extra',
            value: extra.amount,
            date: new Date(currentYear, currentMonth, 20), // Data genérica
            status: 'efetivada' as const,
            type: 'variable'
          });
        });
      }
    });

    return incomeItems;
  };

  const handleItemMenuPress = (_income: { id: string; description: string }) => {
    Alert.alert(
      'Ações',
      'Escolha uma ação',
      [
        {
          text: 'Editar',
          onPress: () => Alert.alert('Editar', 'Funcionalidade em desenvolvimento'),
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => Alert.alert('Excluir', 'Funcionalidade em desenvolvimento'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
    );
  };

  const incomeItems = getIncomeDataForCurrentMonth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header (AppBar / Toolbar) - Conforme documentação */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#64748b" />
        </Pressable>

        <Text style={styles.headerTitle}>Receitas</Text>

        <Pressable style={styles.headerButton}>
          <MoreVertical size={24} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navegação de Mês */}
        <View style={styles.monthNavigation}>
          <MonthSelector
            currentDate={currentDate}
            onMonthChange={handleMonthChange}
          />
        </View>

        {/* Lista de Receitas - Conforme documentação */}
        <View style={styles.incomeList}>
          {incomeItems.map((income) => (
            <View key={income.id} style={styles.incomeItem}>
              {/* Leading Icon */}
              <View style={styles.leadingIcon}>
                {income.status === 'efetivada' ? (
                  <CheckCircle size={24} color="#22c55e" />
                ) : (
                  <Clock size={24} color="#f59e0b" />
                )}
              </View>

              {/* Central Column */}
              <View style={styles.centralColumn}>
                <Text style={styles.incomeDescription}>{income.description}</Text>
                <Text style={styles.incomeAccount}>{income.account}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{income.category}</Text>
                </View>
              </View>

              {/* Right Column */}
              <View style={styles.rightColumn}>
                <Text style={styles.incomeDate}>
                  {income.date.getDate()} {getDayOfWeek(income.date)}
                </Text>
                <Text style={styles.incomeValue}>{formatCurrency(income.value)}</Text>
                <Pressable
                  style={styles.itemMenuButton}
                  onPress={() => handleItemMenuPress(income)}
                >
                  <ChevronDown size={20} color="#64748b" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button - Conforme documentação */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/income/[new]' as any)}
      >
        <Plus size={24} color="#ffffff" />
      </Pressable>
      <StatusBar style="auto" />
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

  // Month Navigation
  monthNavigation: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Income List Styles
  incomeList: {
    padding: 16,
  },
  incomeItem: {
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

  // Leading Icon
  leadingIcon: {
    width: 40,
    alignItems: 'center',
  },

  // Central Column
  centralColumn: {
    flex: 1,
    marginLeft: 12,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  incomeAccount: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  // Right Column
  rightColumn: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  incomeDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  itemMenuButton: {
    padding: 4,
  },

  // Floating Action Button - Conforme documentação
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});