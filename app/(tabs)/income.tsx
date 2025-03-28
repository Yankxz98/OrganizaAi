import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Plus, Briefcase, Building2, Coins, Pencil, Trash2 } from 'lucide-react-native';
import { StorageService, Income } from '../utils/storage';
import IncomeForm from '../components/IncomeForm';
import MonthSelector from '../components/MonthSelector';
import { useEvent } from '../utils/EventContext';
import { useRouter } from 'expo-router';

interface IncomeScreenProps {
  initialDate?: string;
}

export default function IncomeScreen({ initialDate }: IncomeScreenProps) {
  const router = useRouter();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date());
  const { triggerEvent, subscribeToEvent } = useEvent();

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

  const handleSaveIncome = async (income: Income) => {
    try {
      let newIncomes;
      if (editingIncome) {
        // Update existing income
        newIncomes = incomes.map(i => i.id === editingIncome.id ? income : i);
      } else {
        // Add new income
        newIncomes = [...incomes, income];
      }
      await StorageService.saveIncome(newIncomes);
      setIncomes(newIncomes);
      setShowForm(false);
      setEditingIncome(null);
      
      // Disparar evento para atualizar o dashboard
      setTimeout(() => {
        triggerEvent('INCOME_UPDATED');
      }, 0);
    } catch (error) {
      console.error('Erro ao salvar renda:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a renda');
    }
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDeleteIncome = (income: Income) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a renda de "${income.person}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const newIncomes = incomes.filter(i => i.id !== income.id);
              await StorageService.saveIncome(newIncomes);
              setIncomes(newIncomes);
              
              // Disparar evento para atualizar o dashboard
              setTimeout(() => {
                triggerEvent('INCOME_UPDATED');
              }, 0);
            } catch (error) {
              console.error('Erro ao excluir renda:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir a renda');
            }
          },
        },
      ],
    );
  };

  const calculateTotal = () => {
    const baseTotal = incomes.reduce((total, income) => {
      return total + income.sources.reduce((sourceTotal, source) => sourceTotal + source.amount, 0);
    }, 0);

    const extrasTotal = incomes.reduce((total, income) => {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const monthlyExtras = income.monthlyExtras?.find(
        m => m.month === currentMonth && m.year === currentYear
      );
      return total + (monthlyExtras?.extras.reduce((sum, extra) => sum + extra.amount, 0) || 0);
    }, 0);

    return baseTotal + extrasTotal;
  };

  const calculateYourTotal = () => {
    const baseTotal = incomes
      .filter(income => income.person === 'Você')
      .reduce((total, income) => {
        return total + income.sources.reduce((sourceTotal, source) => sourceTotal + source.amount, 0);
      }, 0);

    const extrasTotal = incomes
      .filter(income => income.person === 'Você')
      .reduce((total, income) => {
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const monthlyExtras = income.monthlyExtras?.find(
          m => m.month === currentMonth && m.year === currentYear
        );
        return total + (monthlyExtras?.extras.reduce((sum, extra) => sum + extra.amount, 0) || 0);
      }, 0);

    return baseTotal + extrasTotal;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Renda</Text>
          <Pressable 
            style={styles.addButton} 
            testID="add-income-button"
            onPress={() => {
              setEditingIncome(null);
              setShowForm(true);
            }}
          >
            <Plus size={24} color="#ffffff" />
          </Pressable>
        </View>

        <MonthSelector 
          currentDate={currentDate} 
          onMonthChange={handleMonthChange} 
        />

        <View style={styles.totalContainer}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Renda Total</Text>
            <Text style={styles.totalValue} testID="income-total-value">{formatCurrency(calculateTotal())}</Text>
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Sua Renda</Text>
            <Text style={styles.totalValue} testID="your-income-value">{formatCurrency(calculateYourTotal())}</Text>
          </View>
        </View>

        <View style={styles.incomeList}>
          {incomes.map((income) => {
            const currentMonthExtras = income.monthlyExtras?.find(
              m => m.month === currentDate.getMonth() && m.year === currentDate.getFullYear()
            );
            
            return (
              <View key={income.id} style={styles.incomeCard}>
                <View style={styles.incomeHeader}>
                  <Text style={styles.personName}>{income.person}</Text>
                  <View style={styles.actionButtons}>
                    <Pressable
                      style={styles.actionButton}
                      testID="edit-income-button"
                      onPress={() => handleEditIncome(income)}
                    >
                      <Pencil size={20} color="#64748b" />
                    </Pressable>
                    <Pressable
                      style={[styles.actionButton, { marginLeft: 8 }]}
                      testID="delete-income-button"
                      onPress={() => handleDeleteIncome(income)}
                    >
                      <Trash2 size={20} color="#64748b" />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.sourcesList}>
                  {income.sources.map((source) => (
                    <View key={source.id} style={styles.sourceItem}>
                      <View style={styles.sourceInfo}>
                        <View style={[styles.sourceIcon, { backgroundColor: source.color }]}>
                          {source.icon === 'Briefcase' && <Briefcase size={20} color="#ffffff" />}
                          {source.icon === 'Building2' && <Building2 size={20} color="#ffffff" />}
                          {source.icon === 'Coins' && <Coins size={20} color="#ffffff" />}
                        </View>
                        <Text style={styles.sourceName}>{source.name}</Text>
                      </View>
                      <Text style={styles.sourceAmount}>R$ {source.amount.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                {currentMonthExtras && currentMonthExtras.extras.length > 0 && (
                  <View style={styles.extrasContainer}>
                    <Text style={styles.extrasTitle}>Extras do Mês</Text>
                    {currentMonthExtras.extras.map((extra) => (
                      <View key={extra.id} style={styles.extraItem}>
                        <Text style={styles.extraDescription}>{extra.description}</Text>
                        <Text style={styles.extraAmount}>R$ {extra.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {showForm && (
        <View style={styles.formContainer}>
          <ScrollView>
            <IncomeForm
              onSave={handleSaveIncome}
              onCancel={() => {
                setShowForm(false);
                setEditingIncome(null);
              }}
              initialData={editingIncome}
              currentDate={currentDate}
            />
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  totalBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  incomeList: {
    padding: 20,
    gap: 16,
  },
  incomeCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  sourcesList: {
    marginBottom: 12,
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sourceAmount: {
    fontSize: 16,
    color: '#64748b',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extrasContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  extrasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  extraItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  extraDescription: {
    fontSize: 14,
    color: '#1e293b',
  },
  extraAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  formContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    zIndex: 1000,
    elevation: 5,
  },
});