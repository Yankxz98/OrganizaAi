import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react-native';

interface IncomeDropdownProps {
  totalIncome: number;
  baseIncome: number;
  extrasIncome: number;
}

export default function IncomeDropdown({ 
  totalIncome, 
  baseIncome, 
  extrasIncome 
}: IncomeDropdownProps) {
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
          <Text style={styles.title}>Renda Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={styles.headerRight}>
          <ArrowUpRight color="#22c55e" size={20} style={styles.icon} />
          {isOpen ? (
            <ChevronUp color="#64748b" size={24} />
          ) : (
            <ChevronDown color="#64748b" size={24} />
          )}
        </View>
      </Pressable>

      {isOpen && (
        <View style={styles.content}>
          <View style={styles.incomeRow}>
            <Text style={styles.incomeType}>Renda Base</Text>
            <Text style={styles.incomeValue}>{formatCurrency(baseIncome)}</Text>
          </View>
          <View style={[styles.incomeRow, styles.lastRow]}>
            <Text style={styles.incomeType}>Extras do Mês</Text>
            <Text style={styles.incomeValue}>{formatCurrency(extrasIncome)}</Text>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
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
  incomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lastRow: {
    marginTop: 8,
  },
  incomeType: {
    fontSize: 14,
    color: '#64748b',
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
}); 