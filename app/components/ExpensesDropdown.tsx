import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

interface ExpensesDropdownProps {
  totalExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;
}

export default function ExpensesDropdown({ 
  totalExpenses, 
  fixedExpenses, 
  variableExpenses 
}: ExpensesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggleDropdown}>
        <View>
          <Text style={styles.title}>Despesas Totais</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalExpenses)}</Text>
        </View>
        {isOpen ? (
          <ChevronUp color="#64748b" size={24} />
        ) : (
          <ChevronDown color="#64748b" size={24} />
        )}
      </Pressable>

      {isOpen && (
        <View style={styles.content}>
          <View style={styles.expenseRow}>
            <Text style={styles.expenseType}>Despesas Fixas</Text>
            <Text style={styles.expenseValue}>{formatCurrency(fixedExpenses)}</Text>
          </View>
          <View style={[styles.expenseRow, styles.lastRow]}>
            <Text style={styles.expenseType}>Despesas Variáveis</Text>
            <Text style={styles.expenseValue}>{formatCurrency(variableExpenses)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lastRow: {
    marginTop: 8,
  },
  expenseType: {
    fontSize: 14,
    color: '#64748b',
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
}); 