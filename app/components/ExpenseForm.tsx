import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Expense } from '../utils/storage';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import { Coffee, ShoppingBag, Car, Heart, User, Package } from 'lucide-react-native';
import MonthYearPicker from './MonthYearPicker';
import { FinancingService } from '../utils/FinancingService';

interface ExpenseFormProps {
  onSave: (expense: Expense) => void;
  onCancel?: () => void;
  initialData?: Expense | null;
}

const IconComponent = ({ name, color }: { name: string; color: string }) => {
  switch (name) {
    case 'Coffee':
      return <Coffee size={24} color={color} />;
    case 'ShoppingBag':
      return <ShoppingBag size={24} color={color} />;
    case 'Car':
      return <Car size={24} color={color} />;
    case 'Heart':
      return <Heart size={24} color={color} />;
    case 'User':
      return <User size={24} color={color} />;
    case 'Package':
      return <Package size={24} color={color} />;
    default:
      return <Package size={24} color={color} />;
  }
};

export default function ExpenseForm({ onSave, onCancel, initialData }: ExpenseFormProps) {
  const [expense, setExpense] = useState<Expense>(() => {
    if (initialData) {
      return {...initialData};
    }
    return {
      id: Date.now(),
      category: 'others',
      description: '',
      amount: 0,
      type: 'variable',
      isPlanned: false,
      isActivated: false
    };
  });

  const [installments, setInstallments] = useState(() => {
    return initialData?.installments ? initialData.installments.total.toString() : '1';
  });
  
  const [isFinancing, setIsFinancing] = useState(() => {
    return initialData?.financing ? true : false;
  });
  
  const [financingData, setFinancingData] = useState(() => {
    const currentDate = new Date();
    return {
      startMonth: initialData?.financing?.startMonth ?? currentDate.getMonth(),
      startYear: initialData?.financing?.startYear ?? currentDate.getFullYear(),
      endMonth: initialData?.financing?.endMonth ?? currentDate.getMonth(),
      endYear: initialData?.financing?.endYear ?? currentDate.getFullYear(),
      monthlyAmount: initialData?.financing?.monthlyAmount ?? 0,
      totalAmount: initialData?.financing?.totalAmount ?? 0
    };
  });
  
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialData && !initialized) {
      setExpense({...initialData});
      if (initialData.installments) {
        setInstallments(initialData.installments.total.toString());
      }
      setInitialized(true);
    }
  }, [initialData, initialized]);

  const handleSave = () => {
    if (!expense.description.trim()) {
      Alert.alert('Atenção', 'Por favor, adicione uma descrição para a despesa.');
      return;
    }

    // Validações específicas para financiamento
    if (isFinancing && expense.type === 'fixed') {
      if (financingData.monthlyAmount <= 0) {
        Alert.alert('Atenção', 'Por favor, informe o valor da parcela mensal.');
        return;
      }

      const startDate = new Date(financingData.startYear, financingData.startMonth);
      const endDate = new Date(financingData.endYear, financingData.endMonth);
      
      if (endDate <= startDate) {
        Alert.alert('Atenção', 'A data de fim deve ser posterior à data de início.');
        return;
      }

      const monthsDiff = FinancingService.calculateMonthsDifference(startDate, endDate);
      
      if (monthsDiff > 60) { // Máximo 5 anos
        Alert.alert('Atenção', 'O período máximo do financiamento é de 5 anos.');
        return;
      }
    }

    const finalExpense = { ...expense };
    
    if (isFinancing && expense.type === 'fixed') {
      // Configurar financiamento
      finalExpense.financing = {
        startMonth: financingData.startMonth,
        startYear: financingData.startYear,
        endMonth: financingData.endMonth,
        endYear: financingData.endYear,
        originalEndMonth: financingData.endMonth,
        originalEndYear: financingData.endYear,
        monthlyAmount: expense.amount,
        totalAmount: financingData.totalAmount,
        isActive: true,
        renewalCount: 0,
        groupId: initialData?.financing?.groupId || `financing-${Date.now()}`
      };
      
      // Para financiamento, o valor será o valor mensal (já está correto)
    } else if (expense.type === 'fixed' && parseInt(installments) > 1) {
      // Lógica existente para parcelas normais
      finalExpense.installments = {
        total: parseInt(installments),
        current: 1,
        groupId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    }

    onSave(finalExpense);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (router) {
      router.back();
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={false}
    >
      <Text style={styles.title}>{initialData ? 'Editar Despesa' : 'Nova Despesa'}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categoryContainer}>
          {EXPENSE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryButton,
                expense.category === cat.id && { backgroundColor: cat.color }
              ]}
              onPress={() => setExpense({ ...expense, category: cat.id })}
              testID={`expense-category-${cat.id}-button`}
            >
              <View style={styles.categoryIcon}>
                <IconComponent
                  name={cat.icon}
                  color={expense.category === cat.id ? '#ffffff' : cat.color}
                />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  expense.category === cat.id && styles.categoryTextActive
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          testID="expense-description-input"
          value={expense.description}
          onChangeText={(text) => setExpense({ ...expense, description: text })}
          placeholder="Ex: Compras do mês, Lanche na padaria, etc."
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {isFinancing && expense.type === 'fixed' ? 'Valor da Parcela Mensal' : 'Valor'}
        </Text>
        <TextInput
          style={styles.input}
          testID="expense-amount-input"
          value={expense.amount.toString()}
          onChangeText={(text) => {
            const amount = Number(text) || 0;
            setExpense({ ...expense, amount });
            
            // Se for financiamento, calcular o valor total automaticamente
            if (isFinancing && expense.type === 'fixed') {
              const startDate = new Date(financingData.startYear, financingData.startMonth);
              const endDate = new Date(financingData.endYear, financingData.endMonth);
              const monthsDiff = FinancingService.calculateMonthsDifference(startDate, endDate);
              const totalAmount = amount * monthsDiff;
              
              setFinancingData(prev => ({ 
                ...prev, 
                monthlyAmount: amount,
                totalAmount 
              }));
            }
          }}
          keyboardType="numeric"
          placeholder="0.00"
        />
        {isFinancing && expense.type === 'fixed' && (
          <Text style={styles.helperText}>
            Este valor será cobrado mensalmente durante o período do financiamento
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>É um gasto planejado?</Text>
          <Switch
            value={expense.isPlanned || false}
            onValueChange={(value) => {
              setExpense({ 
                ...expense, 
                isPlanned: value,
                isActivated: value ? false : undefined // Se não for planejado, remover isActivated
              });
            }}
            testID="expense-planned-switch"
          />
        </View>
        {expense.isPlanned && (
          <Text style={styles.helperText}>
            Gastos planejados não entram nos totais até serem ativados
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de Despesa</Text>
        <View style={styles.typeContainer}>
          <Pressable
            style={[
              styles.typeButton,
              expense.type === 'fixed' && styles.typeButtonActive
            ]}
            testID="expense-type-fixed-button"
            onPress={() => setExpense({ ...expense, type: 'fixed' })}
          >
            <Text style={[
              styles.typeButtonText,
              expense.type === 'fixed' && styles.typeButtonTextActive
            ]}>Fixa</Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeButton,
              expense.type === 'variable' && styles.typeButtonActive
            ]}
            testID="expense-type-variable-button"
            onPress={() => setExpense({ ...expense, type: 'variable' })}
          >
            <Text style={[
              styles.typeButtonText,
              expense.type === 'variable' && styles.typeButtonTextActive
            ]}>Variável</Text>
          </Pressable>
        </View>
      </View>

      {expense.type === 'fixed' && (
        <>
          <View style={styles.inputGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>É Financiamento?</Text>
              <Switch
                value={isFinancing}
                onValueChange={(value) => {
                  setIsFinancing(value);
                  if (value) {
                    // Resetar campos de parcelas quando ativar financiamento
                    setInstallments('1');
                  }
                }}
                testID="expense-financing-switch"
              />
            </View>
          </View>

          {isFinancing ? (
            <>
              <MonthYearPicker
                value={{ month: financingData.startMonth, year: financingData.startYear }}
                onChange={(month, year) => {
                  setFinancingData(prev => ({ ...prev, startMonth: month, startYear: year }));
                  // Recalcular valor total quando mudar as datas
                  const startDate = new Date(year, month);
                  const endDate = new Date(financingData.endYear, financingData.endMonth);
                  const monthsDiff = FinancingService.calculateMonthsDifference(startDate, endDate);
                  const totalAmount = expense.amount * monthsDiff;
                  setFinancingData(prev => ({ ...prev, totalAmount }));
                }}
                label="Data de Início"
              />

              <MonthYearPicker
                value={{ month: financingData.endMonth, year: financingData.endYear }}
                onChange={(month, year) => {
                  setFinancingData(prev => ({ ...prev, endMonth: month, endYear: year }));
                  // Recalcular valor total quando mudar as datas
                  const startDate = new Date(financingData.startYear, financingData.startMonth);
                  const endDate = new Date(year, month);
                  const monthsDiff = FinancingService.calculateMonthsDifference(startDate, endDate);
                  const totalAmount = expense.amount * monthsDiff;
                  setFinancingData(prev => ({ ...prev, totalAmount }));
                }}
                label="Data de Fim"
              />

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Valor Total Calculado</Text>
                <Text style={styles.calculatedValue}>
                  R$ {financingData.totalAmount.toFixed(2)}
                </Text>
                <Text style={styles.financingInfo}>
                  {(() => {
                    const startDate = new Date(financingData.startYear, financingData.startMonth);
                    const endDate = new Date(financingData.endYear, financingData.endMonth);
                    const monthsDiff = FinancingService.calculateMonthsDifference(startDate, endDate);
                    return `${monthsDiff} parcelas de R$ ${expense.amount.toFixed(2)}`;
                  })()}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de Parcelas</Text>
              <TextInput
                style={styles.input}
                testID="expense-installments-input"
                value={installments}
                onChangeText={setInstallments}
                keyboardType="numeric"
                placeholder="1"
              />
              {parseInt(installments) > 1 && (
                <Text style={styles.installmentInfo}>
                  Valor por parcela: R$ {(expense.amount / parseInt(installments)).toFixed(2)} (será dividido automaticamente)
                </Text>
              )}
            </View>
          )}
        </>
      )}

      <View style={styles.buttonContainer}>
        <Pressable style={styles.cancelButton} testID="expense-cancel-button" onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable style={styles.saveButton} testID="expense-save-button" onPress={handleSave}>
          <Text style={styles.saveButtonText}>Salvar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '31%',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  categoryIcon: {
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  installmentInfo: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calculatedValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  financingInfo: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
}); 