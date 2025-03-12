import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StorageService, MonthlyData, Income, Expense } from '../utils/storage';
import MonthSelector from '../components/MonthSelector';
import ExpensesDropdown from '../components/ExpensesDropdown';

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

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    // Carregar rendas do mês
    const incomeData = await StorageService.loadIncome();
    // Carregar despesas do mês
    const expensesData = await StorageService.loadExpenses(currentDate);
    
    // Calcular totais do mês
    const totalIncome = incomeData.reduce((total, income) => 
      total + income.sources.reduce((sum, source) => sum + source.amount, 0), 0);
    
    // Separar despesas fixas e variáveis
    const fixed = expensesData
      .filter(expense => expense.type === 'fixed')
      .reduce((total, expense) => total + expense.amount, 0);
    
    const variable = expensesData
      .filter(expense => expense.type === 'variable')
      .reduce((total, expense) => total + expense.amount, 0);

    const totalExpenses = fixed + variable;
    
    // Calcular poupança (renda - despesas)
    const savings = totalIncome - totalExpenses;

    setFixedExpenses(fixed);
    setVariableExpenses(variable);

    const newMonthlyData: MonthlyData = {
      totalIncome,
      income: totalIncome,
      totalExpenses,
      expenses: totalExpenses,
      savings,
      investments: 0
    };

    setMonthlyData(newMonthlyData);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.monthSelectorContainer}>
        <MonthSelector currentDate={currentDate} onMonthChange={handleMonthChange} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Disponível</Text>
          <Text style={styles.balance}>R$ {monthlyData.totalIncome - monthlyData.totalExpenses}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Renda Total</Text>
            <ArrowUpRight color="#22c55e" size={20} />
          </View>
          <Text style={styles.cardValue}>R$ {monthlyData.totalIncome}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: '100%',
                  backgroundColor: '#22c55e'
                }
              ]} 
            />
          </View>
        </View>

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
          <Text style={styles.cardValue}>R$ {monthlyData.savings}</Text>
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
    backgroundColor: '#f8fafc',
  },
  monthSelectorContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
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