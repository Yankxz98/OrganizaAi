import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { StorageService, MonthlyData } from '../utils/storage';

interface FinancialFormProps {
  onSave: (data: MonthlyData) => void;
  currentDate: Date;
}

export default function FinancialForm({ onSave, currentDate }: FinancialFormProps) {
  const [formData, setFormData] = useState<MonthlyData>({
    totalIncome: 0,
    income: 0,
    totalExpenses: 0,
    expenses: 0,
    savings: 0,
    investments: 0
  });

  const handleSave = async () => {
    await StorageService.saveMonthlyData(formData, currentDate);
    onSave(formData);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dados Financeiros</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Renda Total</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.totalIncome.toString()}
          onChangeText={(text) => setFormData({ ...formData, totalIncome: Number(text) || 0 })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sua Renda</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.income.toString()}
          onChangeText={(text) => setFormData({ ...formData, income: Number(text) || 0 })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Despesas Totais</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.totalExpenses.toString()}
          onChangeText={(text) => setFormData({ ...formData, totalExpenses: Number(text) || 0 })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Suas Despesas</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.expenses.toString()}
          onChangeText={(text) => setFormData({ ...formData, expenses: Number(text) || 0 })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Poupança</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.savings.toString()}
          onChangeText={(text) => setFormData({ ...formData, savings: Number(text) || 0 })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Investimentos</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.investments.toString()}
          onChangeText={(text) => setFormData({ ...formData, investments: Number(text) || 0 })}
        />
      </View>

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Salvar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
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
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 