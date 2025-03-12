import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Investment } from '../utils/storage';

interface InvestmentFormProps {
  onSave: (investment: Investment) => void;
  onCancel: () => void;
}

export default function InvestmentForm({ onSave, onCancel }: InvestmentFormProps) {
  const [formData, setFormData] = useState<Partial<Investment>>({
    category: '',
    icon: 'TrendingUp',
    color: '#0ea5e9',
    amount: 0,
    distribution: {
      you: 0,
      partner: 0
    },
    return: 0
  });

  const handleSave = () => {
    if (!formData.category || !formData.amount || !formData.distribution) return;

    const newInvestment: Investment = {
      id: Date.now(),
      category: formData.category,
      icon: formData.icon || 'TrendingUp',
      color: formData.color || '#0ea5e9',
      amount: Number(formData.amount),
      distribution: {
        you: Number(formData.distribution.you),
        partner: Number(formData.distribution.partner)
      },
      return: Number(formData.return)
    };

    onSave(newInvestment);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Novo Investimento</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoria</Text>
        <TextInput
          style={styles.input}
          value={formData.category}
          onChangeText={(text) => setFormData({ ...formData, category: text })}
          placeholder="Ex: Renda Fixa, Ações, etc."
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Valor Total</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.amount?.toString()}
          onChangeText={(text) => setFormData({ ...formData, amount: Number(text) || 0 })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Seu Valor</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.distribution?.you?.toString()}
          onChangeText={(text) => setFormData({
            ...formData,
            distribution: {
              you: Number(text) || 0,
              partner: formData.distribution?.partner || 0
            }
          })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Valor do Parceiro(a)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.distribution?.partner?.toString()}
          onChangeText={(text) => setFormData({
            ...formData,
            distribution: {
              you: formData.distribution?.you || 0,
              partner: Number(text) || 0
            }
          })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Retorno (%)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.return?.toString()}
          onChangeText={(text) => setFormData({ ...formData, return: Number(text) || 0 })}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave}>
          <Text style={styles.buttonText}>Salvar</Text>
        </Pressable>
      </View>
    </ScrollView>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 