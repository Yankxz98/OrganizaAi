import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

interface MonthSelectorProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
  containerStyle?: object;
}

export default function MonthSelector({ 
  currentDate, 
  onMonthChange,
  containerStyle 
}: MonthSelectorProps) {
  const { colors } = useTheme();
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable 
        onPress={goToPreviousMonth} 
        style={styles.button}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="previous-month-button"
      >
        <ChevronLeft size={24} color={colors.text.secondary} />
      </Pressable>
      
      <View style={styles.dateContainer}>
        <Text style={[styles.month, { color: colors.text.primary }]}>
          {months[currentDate.getMonth()]}
        </Text>
        <Text style={[styles.year, { color: colors.text.secondary }]}>
          {currentDate.getFullYear()}
        </Text>
      </View>

      <Pressable 
        onPress={goToNextMonth} 
        style={styles.button}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID="next-month-button"
      >
        <ChevronRight size={24} color={colors.text.secondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    padding: 8,
  },
  dateContainer: {
    alignItems: 'center',
    flex: 1,
  },
  month: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  year: {
    fontSize: 14,
    marginTop: 2,
  },
}); 