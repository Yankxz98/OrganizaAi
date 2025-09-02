import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, ArrowDownRight, Wallet, Menu, MoreVertical, Plus, DollarSign, TrendingDown, TrendingUp, X, PieChart, Plane, Cog, Home } from 'lucide-react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle } from 'react-native-svg';

import { useEvent } from '../utils/EventContext';
import { StorageService, MonthlyData } from '../utils/storage';

// Simple Line Chart Component
interface ChartDataPoint {
  month: string;
  value: number;
}

interface SimpleLineChartProps {
  data: ChartDataPoint[];
  height?: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, height = 60 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#64748b', fontSize: 12 }}>Sem dados para exibir</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = height - ((point.value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{ height, paddingHorizontal: 10 }}>
      {/* Grid lines */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              top: ratio * height,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: '#f1f5f9',
            }}
          />
        ))}
      </View>

      {/* Chart line */}
      <Svg height={height} width="100%" style={{ position: 'absolute' }}>
        <Polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = height - ((point.value - minValue) / range) * height;
          return (
            <Circle
              key={index}
              cx={`${x}%`}
              cy={y}
              r={3}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={1}
            />
          );
        })}
      </Svg>

      {/* Month labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {data.map((point, index) => (
          <Text key={index} style={{ fontSize: 10, color: '#64748b', textAlign: 'center', flex: 1 }}>
            {point.month}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    totalIncome: 0,
    income: 0,
    totalExpenses: 0,
    expenses: 0,
    savings: 0,
    investments: 0
  });


  // Estados conforme documentação
  const [balanceView, setBalanceView] = useState<'inicial' | 'saldo' | 'previsto'>('saldo');
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;

  const { subscribeToEvent } = useEvent();
  const router = useRouter();
  
  // Usar uma ref para armazenar a data atual para evitar loops de dependência
  const currentDateRef = useRef(currentDate);
  currentDateRef.current = currentDate;
  
  // Usar uma ref para controlar se estamos no meio de uma atualização
  const isUpdatingRef = useRef(false);



  const loadData = useCallback(async () => {
    // Evitar múltiplas atualizações simultâneas
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    
    try {

      // Usar a ref em vez da dependência direta
      const dateToUse = currentDateRef.current;
      
      // Verificar e propagar gastos marcados do mês anterior (se necessário)
      await StorageService.checkAndPropagatePendingExpenses(dateToUse);
      
      // Carregar rendas do mês
      const incomeData = await StorageService.loadIncome();
      // Carregar apenas despesas ativas (exclui gastos planejados não ativados)
      const expensesData = await StorageService.loadActiveExpenses(dateToUse);
      
      // Calcular totais do mês
      let totalBaseIncome = 0;
      let totalExtrasIncome = 0;
      
      incomeData.forEach(income => {
        // Calcular renda base (fontes fixas)
        const baseAmount = income.sources.reduce((sum, source) => sum + source.amount, 0);
        totalBaseIncome += baseAmount;
        
        // Calcular extras do mês atual
        const currentMonth = dateToUse.getMonth();
        const currentYear = dateToUse.getFullYear();
        const monthlyExtras = income.monthlyExtras?.find(
          m => m.month === currentMonth && m.year === currentYear
        );
        
        if (monthlyExtras) {
          const extrasAmount = monthlyExtras.extras.reduce((sum, extra) => sum + extra.amount, 0);
          totalExtrasIncome += extrasAmount;
        }
      });
      
      const totalIncome = totalBaseIncome + totalExtrasIncome;
      
      // Separar despesas fixas e variáveis
      const fixed = Number(expensesData
        .filter(expense => expense.type === 'fixed')
        .reduce((total, expense) => total + expense.amount, 0)
        .toFixed(2));
      
      const variable = Number(expensesData
        .filter(expense => expense.type === 'variable')
        .reduce((total, expense) => total + expense.amount, 0)
        .toFixed(2));

      const totalExpenses = Number((fixed + variable).toFixed(2));

      // Calcular poupança (renda - despesas)
      const savings = totalIncome - totalExpenses;

      const newMonthlyData: MonthlyData = {
        totalIncome,
        income: totalIncome,
        totalExpenses,
        expenses: totalExpenses,
        savings,
        investments: 0
      };

      setMonthlyData(newMonthlyData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, []);



  // Efeito para carregar dados quando a data mudar
  useEffect(() => {
    loadData();
  }, [currentDate, loadData]);

  // Efeito separado para inscrever nos eventos
  useEffect(() => {
    // Inscrever-se para eventos de atualização de despesas e rendas
    const handleUpdate = () => {
      // Usar setTimeout para evitar loops de atualização
      setTimeout(() => {
        if (!isUpdatingRef.current) {
          loadData();
        }
      }, 100);
    };
    
    const unsubscribeExpense = subscribeToEvent('EXPENSE_UPDATED', handleUpdate);
    const unsubscribeIncome = subscribeToEvent('INCOME_UPDATED', handleUpdate);
    
    // Limpar inscrições quando o componente for desmontado
    return () => {
      unsubscribeExpense();
      unsubscribeIncome();
    };
  }, [subscribeToEvent, loadData]);

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };



  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? 0 : 1;
    setIsDrawerOpen(!isDrawerOpen);

    Animated.timing(drawerAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const navigateToScreen = (screenName: string) => {
    setIsDrawerOpen(false);
    router.push(screenName as any);
  };



  const calculateBalanceValue = () => {
    switch (balanceView) {
      case 'inicial':
        // Saldo inicial seria o saldo do mês anterior
        return monthlyData.totalIncome * 0.1; // Placeholder - seria saldo do mês anterior
      case 'saldo':
        // Saldo atual = Receitas - Despesas
        return monthlyData.totalIncome - monthlyData.totalExpenses;
      case 'previsto':
        // Saldo previsto = Saldo atual + projeções
        return (monthlyData.totalIncome - monthlyData.totalExpenses) * 1.05; // Placeholder com 5% de crescimento
      default:
        return monthlyData.totalIncome - monthlyData.totalExpenses;
    }
  };

  const getBalanceLabel = () => {
    switch (balanceView) {
      case 'inicial':
        return 'Saldo Inicial';
      case 'saldo':
        return 'Saldo Disponível';
      case 'previsto':
        return 'Saldo Previsto';
      default:
        return 'Saldo Disponível';
    }
  };

  const translateX = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Drawer Menu */}
      {isDrawerOpen && (
        <Pressable style={styles.overlay} onPress={toggleDrawer}>
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <SafeAreaView style={styles.drawerSafeArea} edges={['top']}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>OrganizaAi</Text>
                <Pressable onPress={toggleDrawer} style={styles.closeButton}>
                  <X size={24} color="#64748b" />
                </Pressable>
              </View>

              <View style={styles.drawerContent}>
              <Pressable
                style={styles.drawerItem}
                onPress={() => {
                  setIsDrawerOpen(false);
                  // Já estamos na tela principal, apenas fechar o drawer
                }}
              >
                <Home size={20} color="#0f172a" />
                <Text style={styles.drawerItemText}>Dashboard</Text>
              </Pressable>

              <Pressable
                style={styles.drawerItem}
                onPress={() => navigateToScreen('/(tabs)/expenses')}
              >
                <PieChart size={20} color="#0f172a" />
                <Text style={styles.drawerItemText}>Gastos</Text>
              </Pressable>

              <Pressable
                style={styles.drawerItem}
                onPress={() => navigateToScreen('/(tabs)/income')}
              >
                <Wallet size={20} color="#0f172a" />
                <Text style={styles.drawerItemText}>Rendas</Text>
              </Pressable>

              <Pressable
                style={styles.drawerItem}
                onPress={() => navigateToScreen('/travels')}
              >
                <Plane size={20} color="#0f172a" />
                <Text style={styles.drawerItemText}>Viagens</Text>
              </Pressable>

              <Pressable
                style={styles.drawerItem}
                onPress={() => navigateToScreen('/settings')}
              >
                <Cog size={20} color="#0f172a" />
                <Text style={styles.drawerItemText}>Configurações</Text>
              </Pressable>
            </View>
            </SafeAreaView>
          </Animated.View>
        </Pressable>
      )}

      {/* Header (AppBar/Toolbar) - Conforme documentação */}
      <View style={styles.header}>
        {/* Botão Menu Hambúrguer - Canto superior esquerdo */}
        <Pressable style={styles.headerButton} onPress={toggleDrawer}>
          <Menu size={24} color="#64748b" />
        </Pressable>

        {/* Navegação de mês - Centralizada */}
        <View style={styles.monthNavigation}>
          <Pressable
            style={styles.monthButton}
            onPress={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(currentDate.getMonth() - 1);
              handleMonthChange(newDate);
            }}
          >
            <ChevronLeft size={20} color="#64748b" />
          </Pressable>

          <Text style={styles.monthText}>
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </Text>

          <Pressable
            style={styles.monthButton}
            onPress={() => {
              const newDate = new Date(currentDate);
              newDate.setMonth(currentDate.getMonth() + 1);
              handleMonthChange(newDate);
            }}
          >
            <ChevronRight size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Botão de Mais Opções - Canto superior direito */}
        <Pressable style={styles.headerButton}>
          <MoreVertical size={24} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Indicadores de Saldo */}
        <View style={styles.balanceSection}>
          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            <Pressable
              style={[styles.segmentButton, balanceView === 'inicial' && styles.segmentButtonActive]}
              onPress={() => setBalanceView('inicial')}
            >
              <Text style={[styles.segmentText, balanceView === 'inicial' && styles.segmentTextActive]}>
                Inicial
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, balanceView === 'saldo' && styles.segmentButtonActive]}
              onPress={() => setBalanceView('saldo')}
            >
              <Text style={[styles.segmentText, balanceView === 'saldo' && styles.segmentTextActive]}>
                Saldo
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, balanceView === 'previsto' && styles.segmentButtonActive]}
              onPress={() => setBalanceView('previsto')}
            >
              <Text style={[styles.segmentText, balanceView === 'previsto' && styles.segmentTextActive]}>
                Previsto
              </Text>
            </Pressable>
          </View>

          {/* KPI em destaque */}
          <View style={styles.kpiContainer}>
            <Text style={styles.kpiLabel}>{getBalanceLabel()}</Text>
            <Text style={styles.kpiValue}>
              R$ {calculateBalanceValue().toFixed(2)}
            </Text>
          </View>

          {/* Mini gráfico de linha */}
          <View style={styles.chartContainer}>
            <SimpleLineChart
              data={[
                { month: 'Jan', value: monthlyData.totalIncome * 0.8 },
                { month: 'Fev', value: monthlyData.totalIncome * 0.9 },
                { month: 'Mar', value: monthlyData.totalIncome * 1.1 },
                { month: 'Abr', value: monthlyData.totalIncome * 0.95 },
                { month: 'Mai', value: monthlyData.totalIncome },
                { month: 'Jun', value: monthlyData.totalIncome * 1.05 },
              ]}
            />
          </View>
        </View>



        {/* Seção Visão Geral - Conforme documentação */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Visão Geral</Text>
          <View style={styles.overviewCard}>
            <Pressable
              style={styles.listItem}
              onPress={() => router.push('/(tabs)/income')}
            >
              <TrendingUp size={20} color="#22c55e" />
              <Text style={styles.listItemText}>Receitas</Text>
              <Text style={styles.listItemValue}>R$ {monthlyData.totalIncome.toFixed(2)}</Text>
            </Pressable>

            <Pressable
              style={styles.listItem}
              onPress={() => router.push('/(tabs)/expenses')}
            >
              <ArrowDownRight size={20} color="#ef4444" />
              <Text style={styles.listItemText}>Despesas</Text>
              <Text style={styles.listItemValue}>R$ {monthlyData.totalExpenses.toFixed(2)}</Text>
            </Pressable>

            <Pressable style={styles.listItem}>
              <Wallet size={20} color="#3b82f6" />
              <Text style={styles.listItemText}>Balanço de Transferências</Text>
              <Text style={styles.listItemValue}>R$ {monthlyData.savings.toFixed(2)}</Text>
            </Pressable>

            <Pressable style={styles.listItem}>
              <Text style={styles.listItemText}>Cartões de Crédito</Text>
              <Text style={styles.listItemValue}>R$ 0,00</Text>
            </Pressable>
          </View>
        </View>

        {/* Seção Contas - Conforme documentação */}
        <View style={styles.accountsSection}>
          <Text style={styles.sectionTitle}>Contas</Text>
          <View style={styles.accountsCard}>
            <Pressable style={styles.listItem}>
              <Wallet size={20} color="#64748b" />
              <Text style={styles.listItemText}>Investimentos</Text>
              <Text style={styles.listItemValue}>R$ 0,00</Text>
            </Pressable>

            <Pressable style={styles.listItem}>
              <Wallet size={20} color="#64748b" />
              <Text style={styles.listItemText}>Carteira</Text>
              <Text style={styles.listItemValue}>R$ {monthlyData.savings.toFixed(2)}</Text>
            </Pressable>

            <Pressable style={styles.listItem}>
              <Wallet size={20} color="#64748b" />
              <Text style={styles.listItemText}>Conta Corrente</Text>
              <Text style={styles.listItemValue}>R$ 0,00</Text>
            </Pressable>

            <View style={[styles.listItem, styles.totalItem]}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalValue}>R$ {monthlyData.savings.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button - Conforme documentação */}
      <View style={styles.fabContainer}>
        {/* Menu Options */}
        {showFabMenu && (
          <View style={styles.fabMenu}>
            <Pressable
              style={[styles.fabMenuItem, styles.fabMenuTop]}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/(tabs)/income');
              }}
            >
              <DollarSign size={20} color="#ffffff" />
              <Text style={styles.fabMenuText}>Renda</Text>
            </Pressable>
            <Pressable
              style={[styles.fabMenuItem, styles.fabMenuBottom]}
              onPress={() => {
                setShowFabMenu(false);
                router.push('/(tabs)/expenses');
              }}
            >
              <TrendingDown size={20} color="#ffffff" />
              <Text style={styles.fabMenuText}>Despesa</Text>
            </Pressable>
          </View>
        )}

        {/* Main FAB */}
        <Pressable
          style={styles.fab}
          onPress={() => setShowFabMenu(!showFabMenu)}
        >
          <Plus size={24} color="#ffffff" style={showFabMenu ? styles.fabIconRotated : {}} />
        </Pressable>
      </View>
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
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginHorizontal: 12,
  },

  // Balance Section Styles
  balanceSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  kpiContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  kpiLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  chartContainer: {
    height: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholder: {
    fontSize: 14,
    color: '#64748b',
  },



  // Overview Section Styles
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
  },
  listItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },

  // Accounts Section Styles
  accountsSection: {
    padding: 20,
    paddingBottom: 100,
  },
  accountsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalItem: {
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    borderBottomWidth: 0,
  },
  totalText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 12,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  // FAB Styles
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
  },
  fabMenu: {
    marginBottom: 12,
  },
  fab: {
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
  fabIconRotated: {
    transform: [{ rotate: '45deg' }],
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 120,
  },
  fabMenuTop: {
    marginBottom: 4,
  },
  fabMenuBottom: {
    marginBottom: 0,
  },
  fabMenuText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },

  // Drawer Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 1001,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16, // Espaço reduzido para Safe Area
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 0,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 16,
    fontWeight: '500',
  },
});