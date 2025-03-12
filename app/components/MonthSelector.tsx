import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface MonthSelectorProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
}

export default function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
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
    <View style={styles.container}>
      <Pressable onPress={goToPreviousMonth} style={styles.button}>
        <ChevronLeft size={24} color="#64748b" />
      </Pressable>
      
      <View style={styles.dateContainer}>
        <Text style={styles.month}>{months[currentDate.getMonth()]}</Text>
        <Text style={styles.year}>{currentDate.getFullYear()}</Text>
      </View>

      <Pressable onPress={goToNextMonth} style={styles.button}>
        <ChevronRight size={24} color="#64748b" />
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
    paddingVertical: 8,
  },
  button: {
    padding: 8,
  },
  dateContainer: {
    alignItems: 'center',
  },
  month: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  year: {
    fontSize: 14,
    color: '#64748b',
  },
}); 