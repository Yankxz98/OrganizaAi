import { useRouter } from 'expo-router';
import {
  X,
  MoreVertical,
  Calendar,
  ChevronDown,
  Plus,
  Hash,
  CreditCard,
  Tag,
  Info
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewIncomeScreen() {
  const router = useRouter();

  // Estados do formulário
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [recurrence, setRecurrence] = useState('Não recorrente');
  const [dueDate, setDueDate] = useState(new Date());
  const [isEffective, setIsEffective] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [account, setAccount] = useState('Conta Corrente');
  const [tags, setTags] = useState('');
  const [saveAndContinue, setSaveAndContinue] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  // Dados mock para dropdowns
  const recurrenceOptions = [
    'Não recorrente',
    'Mensal',
    'Bimestral',
    'Trimestral',
    'Semestral',
    'Anual'
  ];

  const categoryOptions = [
    'Salário',
    'Freelance',
    'Investimentos',
    'Aluguel',
    'Outros'
  ];

  const subcategoryOptions = [
    'CLT',
    'PJ',
    'Dividendos',
    'Renda Fixa',
    'Renda Variável'
  ];

  const accountOptions = [
    'Conta Corrente',
    'Conta Poupança',
    'Conta Investimentos'
  ];

  const formatCurrency = (text: string) => {
    // Remove tudo que não é dígito
    const cleanedText = text.replace(/[^\d]/g, '');

    // Converte para número e formata
    if (cleanedText === '') return '';

    const numberValue = parseInt(cleanedText, 10) / 100;
    return `R$ ${numberValue.toFixed(2)}`;
  };

  const handleValueChange = (text: string) => {
    setValue(formatCurrency(text));
  };

  const handleSave = () => {
    // Validação básica
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, informe a descrição da receita');
      return;
    }

    if (!value || value === 'R$ 0,00') {
      Alert.alert('Erro', 'Por favor, informe o valor da receita');
      return;
    }

    // Aqui seria implementada a lógica de salvar
    Alert.alert('Sucesso', 'Receita salva com sucesso!', [
      {
        text: 'OK',
        onPress: () => {
          if (!saveAndContinue) {
            router.back();
          } else {
            // Reset form for continue
            setDescription('');
            setValue('');
            setIsEffective(false);
          }
        },
      },
    ]);
  };

  const handleCancel = () => {
    router.back();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={handleCancel}
        >
          <X size={24} color="#64748b" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nova Receita</Text>
        </View>

        <Pressable style={styles.headerButton}>
          <MoreVertical size={24} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Formulário */}
        <View style={styles.form}>

          {/* Descrição */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Salário, Freelance, etc."
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Valor */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Valor</Text>
            <TextInput
              style={styles.textInput}
              value={value}
              onChangeText={handleValueChange}
              placeholder="R$ 0,00"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>

          {/* Recorrência */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Recorrência</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>{recurrence}</Text>
              <ChevronDown size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Data de vencimento */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Data de vencimento</Text>
            <Pressable style={styles.dateInput}>
              <Calendar size={20} color="#64748b" />
              <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
            </Pressable>
          </View>

          {/* Efetivada */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Efetivada</Text>
              <Switch
                value={isEffective}
                onValueChange={setIsEffective}
                trackColor={{ false: '#e2e8f0', true: '#22c55e' }}
                thumbColor={isEffective ? '#ffffff' : '#f1f5f9'}
              />
            </View>
          </View>

          {/* Categoria */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoria</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {category || 'Selecione uma categoria'}
              </Text>
              <ChevronDown size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Subcategoria */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subcategoria</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {subcategory || 'Selecione uma subcategoria'}
              </Text>
              <ChevronDown size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Conta */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Conta</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>{account}</Text>
              <ChevronDown size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Tags */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagsInput}>
              <Tag size={20} color="#64748b" />
              <TextInput
                style={styles.tagsTextInput}
                value={tags}
                onChangeText={setTags}
                placeholder="Adicionar etiquetas..."
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Salvar e continuar */}
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Salvar e continuar</Text>
              <Switch
                value={saveAndContinue}
                onValueChange={setSaveAndContinue}
                trackColor={{ false: '#e2e8f0', true: '#22c55e' }}
                thumbColor={saveAndContinue ? '#ffffff' : '#f1f5f9'}
              />
            </View>
          </View>

          {/* Mais informações */}
          <View style={styles.formGroup}>
            <Pressable
              style={styles.collapsibleButton}
              onPress={() => setShowMoreInfo(!showMoreInfo)}
            >
              <Info size={20} color="#64748b" />
              <Text style={styles.collapsibleText}>Mais informações</Text>
              <ChevronDown
                size={20}
                color="#64748b"
                style={showMoreInfo ? styles.rotated : {}}
              />
            </Pressable>

            {showMoreInfo && (
              <View style={styles.moreInfo}>
                <Text style={styles.moreInfoText}>
                  Aqui você pode adicionar informações adicionais sobre a receita,
                  como observações, documentos anexados, etc.
                </Text>
              </View>
            )}
          </View>

        </View>

        {/* Botão Salvar */}
        <View style={styles.saveButtonContainer}>
          <Pressable
            style={[styles.saveButton, { backgroundColor: '#22c55e' }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Salvar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Form
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },

  // Inputs
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#0f172a',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dateText: {
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
  },

  // Switch row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Tags input
  tagsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  tagsTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
  },

  // Collapsible
  collapsibleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  collapsibleText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 8,
    marginRight: 8,
  },
  rotated: {
    transform: [{ rotate: '180deg' }],
  },
  moreInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  moreInfoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },

  // Save button
  saveButtonContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});


