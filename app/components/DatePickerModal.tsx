import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { X } from 'lucide-react-native';

interface DatePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDateChange: (date: Date) => void;
  currentDate: Date;
  title?: string;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePickerModal({
  isVisible,
  onClose,
  onDateChange,
  currentDate,
  title = 'Selecione uma data',
  mode = 'date',
  minimumDate,
  maximumDate
}: DatePickerModalProps) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date) {
        setSelectedDate(date);
        onDateChange(date);
        onClose();
      } else if (event.type === 'dismissed') {
        onClose();
      }
    } else {
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const handleConfirm = () => {
    onDateChange(selectedDate);
    onClose();
  };

  const formatDate = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString('pt-BR');
    } else if (mode === 'time') {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  if (Platform.OS === 'android') {
    if (!isVisible) return null;
    
    return (
      <DateTimePicker
        value={selectedDate}
        mode={mode}
        display="default"
        onChange={handleDateChange}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode={mode}
              display="spinner"
              onChange={(event, date) => date && setSelectedDate(date)}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              textColor={colors.text.primary}
            />
          </View>
          
          <View style={styles.modalFooter}>
            <Text style={[styles.selectedDateText, { color: colors.text.secondary }]}>
              {formatDate(selectedDate)}
            </Text>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  datePickerContainer: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedDateText: {
    fontSize: 16,
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 