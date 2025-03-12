import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Plus, Briefcase, Building2, Coins, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { StorageService, Income } from '../utils/storage';
import IncomeForm from '../components/IncomeForm';

export default function IncomeScreen() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = async () => {
    const data = await StorageService.loadIncome();
    setIncomes(data);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const formatMonth = (date: Date) => {
    const month = date.toLocaleDateString('pt-BR', { month: 'long' });
    return {
      month: month.charAt(0).toUpperCase() + month.slice(1),
      year: date.getFullYear().toString()
    };
  };

  const handleSaveIncome = async (income: Income) => {
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
            const newIncomes = incomes.filter(i => i.id !== income.id);
            await StorageService.saveIncome(newIncomes);
            setIncomes(newIncomes);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Renda</Text>
        <Pressable style={styles.addButton} onPress={() => {
          setEditingIncome(null);
          setShowForm(!showForm);
        }}>
          <Plus size={24} color="#ffffff" />
        </Pressable>
      </View>

      <View style={styles.monthSelector}>
        <Pressable 
          style={[styles.monthButton, styles.monthButtonLeft]} 
          onPress={handlePreviousMonth}
        >
          <ChevronLeft size={24} color="#64748b" />
        </Pressable>
        <View style={styles.monthTextContainer}>
          <Text style={styles.monthText}>{formatMonth(currentDate).month}</Text>
          <Text style={styles.yearText}>{formatMonth(currentDate).year}</Text>
        </View>
        <Pressable 
          style={[styles.monthButton, styles.monthButtonRight]} 
          onPress={handleNextMonth}
        >
          <ChevronRight size={24} color="#64748b" />
        </Pressable>
      </View>

      {showForm ? (
        <IncomeForm
          onSave={handleSaveIncome}
          onCancel={() => {
            setShowForm(false);
            setEditingIncome(null);
          }}
          initialData={editingIncome}
          currentDate={currentDate}
        />
      ) : (
        <>
          <View style={styles.summary}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Renda Total</Text>
              <Text style={styles.summaryValue}>R$ {calculateTotal()}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Sua Renda</Text>
              <Text style={styles.summaryValue}>R$ {calculateYourTotal()}</Text>
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
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditIncome(income)}
                      >
                        <Pencil size={16} color="#ffffff" />
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteIncome(income)}
                      >
                        <Trash2 size={16} color="#ffffff" />
                      </Pressable>
                    </View>
                  </View>

                  {income.sources.map((source) => (
                    <View key={source.id} style={styles.sourceCard}>
                      <View style={styles.sourceHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: source.color }]}>
                          {source.icon === 'Briefcase' && <Briefcase size={24} color="#ffffff" />}
                          {source.icon === 'Coins' && <Coins size={24} color="#ffffff" />}
                          {source.icon === 'Building2' && <Building2 size={24} color="#ffffff" />}
                        </View>
                        <View style={styles.sourceInfo}>
                          <Text style={styles.sourceName}>{source.name}</Text>
                          <Text style={styles.sourceAmount}>R$ {source.amount}</Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  {currentMonthExtras && currentMonthExtras.extras.length > 0 && (
                    <View style={styles.extrasContainer}>
                      <Text style={styles.extrasTitle}>Extras do Mês</Text>
                      {currentMonthExtras.extras.map((extra) => (
                        <View key={extra.id} style={styles.extraCard}>
                          <Text style={styles.extraDescription}>{extra.description}</Text>
                          <Text style={styles.extraAmount}>R$ {extra.amount}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
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
  summary: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  summaryCard: {
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
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  summaryValue: {
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
  sourceCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
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
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
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
  extraCard: {
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
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    gap: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthTextContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  yearText: {
    fontSize: 12,
    color: '#64748b',
  },
  monthButtonLeft: {
    paddingLeft: 0,
  },
  monthButtonRight: {
    paddingRight: 0,
  },
});