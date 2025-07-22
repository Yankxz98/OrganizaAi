import { ChevronDown, ChevronUp, PieChart, Coffee, ShoppingBag, Car, Home, User, TrendingUp, Gamepad2, Package } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { EXPENSE_CATEGORIES } from '../utils/constants';

interface ExpenseCategoriesDropdownProps {
  categoryExpenses: Record<string, number>;
  totalExpenses: number;
}

const IconComponent = ({ name, color }: { name: string; color: string }) => {
  switch (name) {
    case 'Coffee':
      return <Coffee size={16} color={color} />;
    case 'ShoppingBag':
      return <ShoppingBag size={16} color={color} />;
    case 'Car':
      return <Car size={16} color={color} />;
    case 'Home':
      return <Home size={16} color={color} />;
    case 'User':
      return <User size={16} color={color} />;
    case 'TrendingUp':
      return <TrendingUp size={16} color={color} />;
    case 'Gamepad2':
      return <Gamepad2 size={16} color={color} />;
    case 'Package':
      return <Package size={16} color={color} />;
    default:
      return <Package size={16} color={color} />;
  }
};

export default function ExpenseCategoriesDropdown({ 
  categoryExpenses, 
  totalExpenses 
}: ExpenseCategoriesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  // Criar array de categorias com valores, ordenado por valor (maior → menor)
  const categoriesWithValues = EXPENSE_CATEGORIES
    .map(category => ({
      ...category,
      amount: categoryExpenses[category.id] || 0
    }))
    .filter(category => category.amount > 0) // Mostrar apenas categorias com gastos
    .sort((a, b) => b.amount - a.amount); // Ordenar do maior para o menor

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggleDropdown}>
        <View>
          <Text style={styles.title}>Gastos por Categoria</Text>
          <Text style={styles.totalValue} testID="categories-total-value">{formatCurrency(totalExpenses)}</Text>
        </View>
        <View style={styles.headerRight}>
          <PieChart color="#3b82f6" size={20} style={styles.icon} />
          {isOpen ? (
            <ChevronUp color="#64748b" size={24} />
          ) : (
            <ChevronDown color="#64748b" size={24} />
          )}
        </View>
      </Pressable>

      {isOpen && (
        <View style={styles.content}>
          {categoriesWithValues.length > 0 ? (
            categoriesWithValues.map((category, index) => (
              <View 
                key={category.id} 
                style={[
                  styles.categoryRow,
                  index === categoriesWithValues.length - 1 && styles.lastRow
                ]}
              >
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryIconContainer}>
                    <IconComponent name={category.icon} color={category.color} />
                  </View>
                  <Text style={styles.categoryName}>{category.label}</Text>
                </View>
                <Text 
                  style={[
                    styles.categoryValue,
                    index === 0 && styles.highlightValue // Destacar o maior valor
                  ]} 
                  testID={`category-${category.id}-value`}
                >
                  {formatCurrency(category.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum gasto registrado neste mês</Text>
            </View>
          )}
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
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lastRow: {
    marginTop: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  highlightValue: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
}); 