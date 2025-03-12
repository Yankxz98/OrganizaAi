import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Briefcase, Coins, Building2, Plus, Trash2 } from 'lucide-react-native';
import { Income, IncomeSource, StorageService } from '../utils/storage';
import { useEvent } from '../utils/EventContext';

interface IncomeFormProps {
  onSave: (income: Income) => void;
  onCancel: () => void;
  initialData?: Income | null;
  currentDate: Date;
}

export default function IncomeForm({ onSave, onCancel, initialData, currentDate }: IncomeFormProps) {
  const [formData, setFormData] = useState<Partial<Income>>({
    person: 'Você',
    sources: [],
    monthlyExtras: []
  });

  const [newSource, setNewSource] = useState<Partial<IncomeSource>>({
    name: '',
    icon: 'Briefcase',
    amount: 0,
    color: '#0ea5e9'
  });

  const [newExtra, setNewExtra] = useState({
    description: '',
    amount: 0
  });
  
  const { triggerEvent } = useEvent();

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleAddSource = () => {
    if (!newSource.name || !newSource.amount) return;

    const source: IncomeSource = {
      id: Date.now(),
      name: newSource.name,
      icon: newSource.icon || 'Briefcase',
      amount: Number(newSource.amount),
      color: newSource.color || '#0ea5e9'
    };

    setFormData({
      ...formData,
      sources: [...(formData.sources || []), source]
    });

    setNewSource({
      name: '',
      icon: 'Briefcase',
      amount: 0,
      color: '#0ea5e9'
    });
  };

  const handleAddExtra = async () => {
    if (!newExtra.description || !newExtra.amount) {
      Alert.alert('Atenção', 'Por favor, preencha a descrição e o valor do extra.');
      return;
    }

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthlyExtras = formData.monthlyExtras || [];
    
    const currentMonthExtras = monthlyExtras.find(
      m => m.month === currentMonth && m.year === currentYear
    );

    let updatedFormData;
    if (currentMonthExtras) {
      currentMonthExtras.extras.push({
        id: Date.now(),
        description: newExtra.description,
        amount: Number(newExtra.amount)
      });
      updatedFormData = {
        ...formData,
        monthlyExtras: monthlyExtras.map(m => 
          m.month === currentMonth && m.year === currentYear ? currentMonthExtras : m
        )
      };
    } else {
      updatedFormData = {
        ...formData,
        monthlyExtras: [
          ...monthlyExtras,
          {
            month: currentMonth,
            year: currentYear,
            extras: [{
              id: Date.now(),
              description: newExtra.description,
              amount: Number(newExtra.amount)
            }]
          }
        ]
      };
    }
    
    setFormData(updatedFormData);
    
    // Se estamos editando uma renda existente, salvar imediatamente e disparar evento
    if (initialData?.id) {
      const updatedIncome = {
        ...updatedFormData,
        id: initialData.id
      } as Income;
      
      try {
        // Carregar todas as rendas
        const allIncomes = await StorageService.loadIncome();
        // Atualizar a renda específica
        const updatedIncomes = allIncomes.map(income => 
          income.id === updatedIncome.id ? updatedIncome : income
        );
        // Salvar todas as rendas
        await StorageService.saveIncome(updatedIncomes);
        // Disparar evento para atualizar o dashboard
        setTimeout(() => {
          triggerEvent('INCOME_UPDATED');
        }, 0);
      } catch (error) {
        console.error('Erro ao salvar extra:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao salvar o extra');
      }
    }

    setNewExtra({
      description: '',
      amount: 0
    });
  };

  const handleDeleteExtra = async (extraId: number) => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthlyExtras = formData.monthlyExtras || [];
    
    const currentMonthExtras = monthlyExtras.find(
      m => m.month === currentMonth && m.year === currentYear
    );

    if (currentMonthExtras) {
      currentMonthExtras.extras = currentMonthExtras.extras.filter(e => e.id !== extraId);
      const updatedMonthlyExtras = monthlyExtras.map(m => 
        m.month === currentMonth && m.year === currentYear ? currentMonthExtras : m
      ).filter(m => m.extras.length > 0);
      
      const updatedFormData = {
        ...formData,
        monthlyExtras: updatedMonthlyExtras
      };
      
      setFormData(updatedFormData);
      
      // Se estamos editando uma renda existente, salvar imediatamente e disparar evento
      if (initialData?.id) {
        const updatedIncome = {
          ...updatedFormData,
          id: initialData.id
        } as Income;
        
        try {
          // Carregar todas as rendas
          const allIncomes = await StorageService.loadIncome();
          // Atualizar a renda específica
          const updatedIncomes = allIncomes.map(income => 
            income.id === updatedIncome.id ? updatedIncome : income
          );
          // Salvar todas as rendas
          await StorageService.saveIncome(updatedIncomes);
          // Disparar evento para atualizar o dashboard
          setTimeout(() => {
            triggerEvent('INCOME_UPDATED');
          }, 0);
        } catch (error) {
          console.error('Erro ao excluir extra:', error);
          Alert.alert('Erro', 'Ocorreu um erro ao excluir o extra');
        }
      }
    }
  };

  const handleSave = () => {
    if (!formData.person || !formData.sources?.length) return;

    const newIncome: Income = {
      id: initialData?.id || Date.now(),
      person: formData.person,
      sources: formData.sources,
      monthlyExtras: formData.monthlyExtras
    };

    onSave(newIncome);
  };

  const getCurrentMonthExtras = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    return formData.monthlyExtras?.find(
      m => m.month === currentMonth && m.year === currentYear
    )?.extras || [];
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{initialData ? 'Editar Renda' : 'Nova Renda'}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pessoa</Text>
        <TextInput
          style={styles.input}
          value={formData.person}
          onChangeText={(text) => setFormData({ ...formData, person: text })}
          placeholder="Ex: Você, Parceiro(a)"
        />
      </View>

      <View style={styles.sourcesContainer}>
        <Text style={styles.sectionTitle}>Fontes de Renda</Text>
        
        {formData.sources?.map((source) => (
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

        <View style={styles.newSourceContainer}>
          <Text style={styles.label}>Nova Fonte</Text>
          <TextInput
            style={styles.input}
            value={newSource.name}
            onChangeText={(text) => setNewSource({ ...newSource, name: text })}
            placeholder="Nome da fonte"
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={newSource.amount?.toString()}
            onChangeText={(text) => setNewSource({ ...newSource, amount: Number(text) || 0 })}
            placeholder="Valor"
          />
          <Pressable style={styles.addButton} onPress={handleAddSource}>
            <Text style={styles.addButtonText}>Adicionar Fonte</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.extrasContainer}>
        <Text style={styles.sectionTitle}>Extras do Mês</Text>
        
        {getCurrentMonthExtras().map((extra) => (
          <View key={extra.id} style={styles.extraCard}>
            <View style={styles.extraInfo}>
              <Text style={styles.extraDescription}>{extra.description}</Text>
              <Text style={styles.extraAmount}>R$ {extra.amount}</Text>
            </View>
            <Pressable
              style={styles.deleteButton}
              onPress={() => handleDeleteExtra(extra.id)}
            >
              <Trash2 size={16} color="#ffffff" />
            </Pressable>
          </View>
        ))}

        <View style={styles.newExtraContainer}>
          <Text style={styles.label}>Novo Extra</Text>
          <TextInput
            style={styles.input}
            value={newExtra.description}
            onChangeText={(text) => setNewExtra({ ...newExtra, description: text })}
            placeholder="Descrição do extra"
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={newExtra.amount.toString()}
            onChangeText={(text) => setNewExtra({ ...newExtra, amount: Number(text) || 0 })}
            placeholder="Valor"
          />
          <Pressable style={styles.addButton} onPress={handleAddExtra}>
            <Text style={styles.addButtonText}>Adicionar Extra</Text>
          </Pressable>
        </View>
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
    marginBottom: 12,
  },
  sourcesContainer: {
    marginBottom: 20,
  },
  extrasContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
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
  extraCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extraInfo: {
    flex: 1,
  },
  extraDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  extraAmount: {
    fontSize: 16,
    color: '#64748b',
  },
  newSourceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  newExtraContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  deleteButton: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 