import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { StorageService, MonthlyData, Income, Expense } from '../utils/storage';
import MonthSelector from '../components/MonthSelector';
import ExpensesDropdown from '../components/ExpensesDropdown';
import IncomeDropdown from '../components/IncomeDropdown';
import { useEvent } from '../utils/EventContext';

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
  const [fixedExpenses, setFixedExpenses] = useState(0);
  const [variableExpenses, setVariableExpenses] = useState(0);
  const [baseIncome, setBaseIncome] = useState(0);
  const [extrasIncome, setExtrasIncome] = useState(0);
  const { subscribeToEvent } = useEvent();
  
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
      console.log('Dashboard: Carregando dados...');
      // Usar a ref em vez da dependência direta
      const dateToUse = currentDateRef.current;
      
      // Carregar rendas do mês
      const incomeData = await StorageService.loadIncome();
      // Carregar despesas do mês
      const expensesData = await StorageService.loadExpenses(dateToUse);
      
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
      
      // Logs para verificar os valores calculados
      console.log('Dashboard - Valores calculados:');
      console.log('Total Despesas:', totalExpenses);
      console.log('Despesas Fixas:', fixed);
      console.log('Despesas Variáveis:', variable);

      // Calcular poupança (renda - despesas)
      const savings = totalIncome - totalExpenses;

      setFixedExpenses(fixed);
      setVariableExpenses(variable);
      setBaseIncome(totalBaseIncome);
      setExtrasIncome(totalExtrasIncome);

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
  }, []); // Remover a dependência de currentDate

  // Efeito para carregar dados quando a data mudar
  useEffect(() => {
    loadData();
  }, [currentDate]); // Manter currentDate aqui para recarregar quando a data mudar

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

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.monthSelectorContainer}>
        <MonthSelector currentDate={currentDate} onMonthChange={handleMonthChange} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Disponível</Text>
          <Text style={styles.balance}>R$ {(monthlyData.totalIncome - monthlyData.totalExpenses).toFixed(2)}</Text>
        </View>

        <IncomeDropdown
          totalIncome={monthlyData.totalIncome}
          baseIncome={baseIncome}
          extrasIncome={extrasIncome}
        />

        <ExpensesDropdown
          totalExpenses={monthlyData.totalExpenses}
          fixedExpenses={fixedExpenses}
          variableExpenses={variableExpenses}
        />

        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Poupança</Text>
            <Wallet color="#3b82f6" size={20} />
          </View>
          <Text style={styles.cardValue}>R$ {monthlyData.savings.toFixed(2)}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${calculatePercentage(monthlyData.savings, monthlyData.totalIncome)}%` as any,
                  backgroundColor: '#3b82f6'
                }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meta Mensal de Economia</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>Meta de Economia</Text>
            <Text style={styles.goalTarget}>R$ 3.000</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(monthlyData.savings / 3000) * 100}%` as any }
              ]} 
            />
          </View>
          <Text style={styles.goalProgress}>
            {((monthlyData.savings / 3000) * 100).toFixed(0)}% alcançado
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  monthSelectorContainer: {
    marginVertical: 8,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryContainer: {
    padding: 20,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  goalTarget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  goalProgress: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
  },
});