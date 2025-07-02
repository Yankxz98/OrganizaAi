import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface MonthYearPickerProps {
  value: { month: number; year: number };
  onChange: (month: number, year: number) => void;
  label: string;
  placeholder?: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthYearPicker({ value, onChange, label, placeholder }: MonthYearPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(value.month);
  const [selectedYear, setSelectedYear] = useState(value.year);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i - 2); // 2 anos atrás até 7 anos no futuro

  const handleConfirm = () => {
    onChange(selectedMonth, selectedYear);
    setModalVisible(false);
  };

  const formatValue = () => {
    return `${MONTHS[value.month]} ${value.year}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.selector} onPress={() => setModalVisible(true)}>
        <Text style={styles.selectorText}>
          {formatValue()}
        </Text>
        <ChevronDown size={20} color="#64748b" />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar {label}</Text>
            
            <View style={styles.pickersContainer}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Mês</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((month, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === index && styles.pickerItemTextSelected
                      ]}>
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Ano</Text>
                <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  selectorText: {
    fontSize: 16,
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickersContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemSelected: {
    backgroundColor: '#3b82f6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  pickerItemTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
}); 