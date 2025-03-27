import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ScrollView, Modal, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MapPin, Clock, Calendar, Edit2, Trash2, Check, ChevronDown } from 'lucide-react-native';
import { Travel, TravelActivity, StorageService } from '../utils/storage';
import { useEvent } from '../utils/EventContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AntDesign } from '@expo/vector-icons';

interface TravelItineraryProps {
  travel: Travel;
  onUpdate: (updatedTravel: Travel) => void;
  colors: any;
}

// Estendendo o tipo para incluir campos temporários usados apenas no formulário
interface ActivityFormData extends Partial<TravelActivity> {
  startTime?: string;
  endTime?: string;
}

export default function TravelItinerary({ travel, onUpdate, colors }: TravelItineraryProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<TravelActivity | null>(null);
  const { triggerEvent } = useEvent();
  const [newActivity, setNewActivity] = useState<ActivityFormData>({
    title: '',
    category: 'passeio',
    location: '',
    notes: '',
    estimatedCost: 0,
    completed: false,
    startTime: '08:00',
    endTime: ''
  });
  
  // Estados para controlar os seletores de horário
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Data de referência para os seletores (usamos a data selecionada ou a data atual)
  const getTimeSelectorDate = () => {
    if (selectedDay) {
      const [year, month, day] = selectedDay.split('-').map(Number);
      const date = new Date();
      date.setFullYear(year, month - 1, day);
      return date;
    }
    return new Date();
  };

  // Gerar array de dias entre as datas de início e fim da viagem
  const getDaysArray = () => {
    const days = [];
    const start = new Date(travel.startDate);
    const end = new Date(travel.endDate);
    
    // Ajustar para o início do dia no fuso horário local e adicionar um dia para compensar o offset
    const startLocal = new Date(start);
    startLocal.setHours(0, 0, 0, 0);
    
    const endLocal = new Date(end);
    endLocal.setHours(23, 59, 59, 999);
    
    for (let dt = new Date(startLocal); dt <= endLocal; dt.setDate(dt.getDate() + 1)) {
      days.push(new Date(dt));
    }
    return days;
  };

  const days = getDaysArray();

  // Filtrar atividades por dia
  const getActivitiesForDay = (day: Date) => {
    if (!travel.itinerary) return [];
    
    // Formatar a data do dia para comparação (YYYY-MM-DD)
    const dayStr = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, '0')}-${day.getDate().toString().padStart(2, '0')}`;
    
    return travel.itinerary.filter(activity => {
      // Extrair a data da string ISO diretamente (YYYY-MM-DD)
      const activityDateStr = activity.startDateTime.split('T')[0];
      
      // Comparar as strings de data
      return activityDateStr === dayStr;
    }).sort((a, b) => {
      // Extrair as horas e minutos para ordenação
      const timeA = a.startDateTime.split('T')[1].substring(0, 5); // HH:MM
      const timeB = b.startDateTime.split('T')[1].substring(0, 5); // HH:MM
      
      // Comparar as strings de hora
      return timeA.localeCompare(timeB);
    });
  };

  const handleAddActivity = () => {
    if (!newActivity.title || !selectedDay || !newActivity.startTime) {
      Alert.alert('Erro', 'Título, dia e horário de início são obrigatórios');
      return;
    }
    
    saveActivity();
  };

  const saveActivity = () => {
    if (!newActivity.title || !selectedDay || !newActivity.startTime) {
      Alert.alert('Erro', 'Título, dia e horário de início são obrigatórios');
      return;
    }

    // Criar data ISO a partir da data selecionada e hora
    const [year, month, day] = selectedDay.split('-').map(Number);
    const [startHours, startMinutes] = newActivity.startTime.split(':').map(Number);
    
    const startDateObj = new Date();
    startDateObj.setFullYear(year, month - 1, day);
    startDateObj.setHours(startHours || 0, startMinutes || 0, 0, 0);
    
    let endDateObj: Date | undefined;
    if (newActivity.endTime) {
      const [endHours, endMinutes] = newActivity.endTime.split(':').map(Number);
      endDateObj = new Date();
      endDateObj.setFullYear(year, month - 1, day);
      endDateObj.setHours(endHours || 0, endMinutes || 0, 0, 0);
    }
    
    const updatedTravelData = { ...travel };
    if (!updatedTravelData.itinerary) {
      updatedTravelData.itinerary = [];
    }
    
    if (editingActivity) {
      // Editar atividade existente
      const activityIndex = updatedTravelData.itinerary.findIndex(a => a.id === editingActivity.id);
      if (activityIndex !== -1) {
        updatedTravelData.itinerary[activityIndex] = {
          ...updatedTravelData.itinerary[activityIndex],
          title: newActivity.title,
          category: newActivity.category || 'outro',
          startDateTime: startDateObj.toISOString(),
          endDateTime: endDateObj ? endDateObj.toISOString() : undefined,
          location: newActivity.location || '',
          notes: newActivity.notes,
          estimatedCost: Number(newActivity.estimatedCost) || 0
        };
      }
    } else {
      // Adicionar nova atividade
      const newActivityId = Date.now();
      updatedTravelData.itinerary.push({
        id: newActivityId,
        title: newActivity.title,
        category: newActivity.category || 'outro',
        startDateTime: startDateObj.toISOString(),
        endDateTime: endDateObj ? endDateObj.toISOString() : undefined,
        location: newActivity.location || '',
        notes: newActivity.notes,
        estimatedCost: Number(newActivity.estimatedCost) || 0,
        completed: false,
      });
    }
    
    // Atualizar a viagem
    saveTravel(updatedTravelData);
    
    // Fechar modal e resetar formulário
    setShowAddModal(false);
    resetForm();
  };

  const handleDeleteActivity = (activityId: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir esta atividade?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            // Encontrar a atividade para obter o custo estimado
            const activityToDelete = (travel.itinerary || []).find(
              activity => activity.id === activityId
            );
            
            const updatedItinerary = (travel.itinerary || []).filter(
              activity => activity.id !== activityId
            );
            
            const updatedTravel = {
              ...travel,
              itinerary: updatedItinerary
            };
            
            saveTravel(updatedTravel);
          }
        }
      ]
    );
  };

  const handleToggleComplete = (activity: TravelActivity) => {
    const updatedActivity = {
      ...activity,
      completed: !activity.completed
    };
    
    const updatedItinerary = (travel.itinerary || []).map(a => 
      a.id === activity.id ? updatedActivity : a
    );
    
    const updatedTravel = {
      ...travel,
      itinerary: updatedItinerary
    };
    
    saveTravel(updatedTravel);
  };

  const handleEditActivity = (activity: TravelActivity) => {
    // Extrair os horários das datas ISO
    const startTime = formatTime(activity.startDateTime);
    const endTime = activity.endDateTime ? formatTime(activity.endDateTime) : '';
    
    // Formatar a data selecionada para o formato YYYY-MM-DD
    const datePart = activity.startDateTime.split('T')[0];
    setSelectedDay(datePart);
    
    setEditingActivity(activity);
    setNewActivity({
      title: activity.title,
      category: activity.category,
      location: activity.location || '',
      notes: activity.notes,
      estimatedCost: activity.estimatedCost || 0,
      startTime,
      endTime
    });
    
    setShowAddModal(true);
  };

  const saveTravel = async (updatedTravel: Travel) => {
    // Atualizar a viagem localmente
    onUpdate(updatedTravel);
    
    try {
      // Salvar no AsyncStorage
      const success = await StorageService.saveTravel(updatedTravel);
      if (success) {
        // Notificar outros componentes sobre a atualização
        triggerEvent('TRAVEL_UPDATED');
        console.log('Itinerário atualizado e evento TRAVEL_UPDATED disparado');
      } else {
        console.error('Erro ao salvar a viagem');
        Alert.alert('Erro', 'Não foi possível salvar as alterações');
      }
    } catch (error) {
      console.error('Erro ao salvar a viagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar as alterações');
    }
  };

  const resetForm = () => {
    setNewActivity({
      title: '',
      category: 'passeio',
      location: '',
      notes: '',
      estimatedCost: 0,
      completed: false,
      startTime: '08:00',
      endTime: ''
    });
    setEditingActivity(null);
    setShowAddModal(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'passeio': return 'Passeio';
      case 'refeicao': return 'Refeição';
      case 'transporte': return 'Transporte';
      case 'hospedagem': return 'Hospedagem';
      default: return 'Outro';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'passeio': return '#3b82f6'; // Azul
      case 'refeicao': return '#22c55e'; // Verde
      case 'transporte': return '#f59e0b'; // Laranja
      case 'hospedagem': return '#8b5cf6'; // Roxo
      default: return '#64748b'; // Cinza
    }
  };

  const formatTime = (dateString: string) => {
    // Converter a string ISO para um objeto Date
    const date = new Date(dateString);
    
    // Extrair as horas e minutos da string ISO diretamente
    // O formato ISO é: YYYY-MM-DDTHH:MM:SS.sssZ
    // Onde T é um separador e Z indica UTC
    const timeString = dateString.split('T')[1]; // Pega a parte após o T
    const hours = timeString.substring(0, 2);
    const minutes = timeString.substring(3, 5);
    
    return `${hours}:${minutes}`;
  };

  // Converte uma string de tempo (HH:MM) para um objeto Date
  const timeStringToDate = (timeString?: string) => {
    const baseDate = getTimeSelectorDate();
    
    if (!timeString) {
      // Se não houver horário, retorna 8:00 como padrão
      baseDate.setHours(8, 0, 0, 0);
      return baseDate;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      baseDate.setHours(8, 0, 0, 0);
      return baseDate;
    }
    
    baseDate.setHours(hours, minutes, 0, 0);
    return baseDate;
  };

  // Função para converter objeto Date para string de hora (HH:MM)
  const dateToTimeString = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Manipuladores para os seletores de horário
  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewActivity(prev => ({
        ...prev,
        startTime: dateToTimeString(selectedDate)
      }));
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewActivity(prev => ({
        ...prev,
        endTime: dateToTimeString(selectedDate)
      }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Itinerário da Viagem</Text>
      </View>

      <ScrollView style={styles.daysContainer}>
        {days.map((day, index) => (
          <View key={index} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayTitle, { color: colors.text.primary }]}>
                {formatDate(day)}
              </Text>
              <Pressable 
                style={[styles.addDayButton, { backgroundColor: colors.primary }]}
                testID="itinerary-add-activity-button"
                onPress={() => {
                  // Formatar a data manualmente para evitar problemas de fuso horário
                  const year = day.getFullYear();
                  const month = (day.getMonth() + 1).toString().padStart(2, '0');
                  const dayOfMonth = day.getDate().toString().padStart(2, '0');
                  setSelectedDay(`${year}-${month}-${dayOfMonth}`);
                  setShowAddModal(true);
                }}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addDayButtonText}>Adicionar</Text>
              </Pressable>
            </View>
            
            {getActivitiesForDay(day).length > 0 ? (
              getActivitiesForDay(day).map(activity => (
                <View 
                  key={activity.id} 
                  style={[
                    styles.activityCard, 
                    { 
                      backgroundColor: colors.card,
                      borderLeftColor: getCategoryColor(activity.category),
                      opacity: activity.completed ? 0.7 : 1
                    }
                  ]}
                  testID={activity.completed ? 'itinerary-activity-completed' : 'itinerary-activity'}
                >
                  <Pressable 
                    style={styles.completeButton}
                    testID="itinerary-complete-button"
                    onPress={() => handleToggleComplete(activity)}
                  >
                    <View style={[
                      styles.checkbox, 
                      activity.completed && { backgroundColor: colors.success }
                    ]}>
                      {activity.completed && <Check size={16} color="#fff" />}
                    </View>
                  </Pressable>
                  
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <Text style={[
                        styles.activityTitle, 
                        { 
                          color: colors.text.primary,
                          textDecorationLine: activity.completed ? 'line-through' : 'none'
                        }
                      ]}>
                        {activity.title}
                      </Text>
                      <View style={styles.activityActions}>
                        <Pressable 
                          style={styles.actionButton}
                          testID="itinerary-edit-button"
                          onPress={() => handleEditActivity(activity)}
                        >
                          <Edit2 size={16} color={colors.text.secondary} />
                        </Pressable>
                        <Pressable 
                          style={styles.actionButton}
                          testID="itinerary-delete-button"
                          onPress={() => handleDeleteActivity(activity.id)}
                        >
                          <Trash2 size={16} color={colors.danger} />
                        </Pressable>
                      </View>
                    </View>
                    
                    <View style={styles.activityDetails}>
                      <View style={styles.detailItem}>
                        <Clock size={14} color={colors.text.secondary} style={styles.detailIcon} />
                        <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                          {formatTime(activity.startDateTime)}
                          {activity.endDateTime && ` - ${formatTime(activity.endDateTime)}`}
                        </Text>
                      </View>
                      
                      <View style={styles.detailItem}>
                        <MapPin size={14} color={colors.text.secondary} style={styles.detailIcon} />
                        <Text style={[styles.detailText, { color: colors.text.secondary }]}>
                          {activity.location}
                        </Text>
                      </View>
                      
                      {activity.estimatedCost !== undefined && activity.estimatedCost > 0 && (
                        <Text style={[styles.costText, { color: colors.text.primary }]}>
                          R$ {activity.estimatedCost.toFixed(2)}
                        </Text>
                      )}
                      
                      {activity.notes && (
                        <Text style={[styles.notesText, { color: colors.text.secondary }]}>
                          {activity.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.emptyDay, { backgroundColor: colors.card }]}>
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  Nenhuma atividade planejada para este dia
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
            </Text>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>Dia</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                  <Calendar size={16} color={colors.text.secondary} style={styles.pickerIcon} />
                  <Pressable style={styles.picker}>
                    <Text style={[styles.pickerText, { color: colors.text.primary }]}>
                      {selectedDay ? (() => {
                        const parts = selectedDay.split('-');
                        const formattedDate = new Date(
                          parseInt(parts[0]),
                          parseInt(parts[1]) - 1,
                          parseInt(parts[2])
                        );
                        return formattedDate.toLocaleDateString('pt-BR');
                      })() : 'Selecione um dia'}
                    </Text>
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>Título</Text>
                <TextInput
                  style={[styles.input, { color: colors.text.primary, backgroundColor: colors.card }]}
                  value={newActivity.title}
                  onChangeText={title => setNewActivity(prev => ({ ...prev, title }))}
                  placeholder="Título da atividade"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>Categoria</Text>
                <View style={[styles.categoryContainer, { backgroundColor: colors.card }]}>
                  {['passeio', 'refeicao', 'transporte', 'hospedagem', 'outro'].map(category => (
                    <Pressable
                      key={category}
                      style={[
                        styles.categoryButton,
                        newActivity.category === category && { 
                          backgroundColor: getCategoryColor(category) 
                        }
                      ]}
                      onPress={() => setNewActivity(prev => ({ ...prev, category: category as any }))}
                    >
                      <Text style={[
                        styles.categoryText,
                        newActivity.category === category && { color: '#fff' }
                      ]}>
                        {getCategoryLabel(category)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              
              <View style={styles.timeContainer}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>Horário Início</Text>
                  <Pressable 
                    style={[styles.timePickerButton, { backgroundColor: colors.card }]}
                    testID="itinerary-start-time-picker"
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={[styles.timeText, { color: colors.text.primary }]}>
                      {newActivity.startTime || '08:00'}
                    </Text>
                    <AntDesign name="clockcircleo" size={16} color={colors.text.secondary} />
                  </Pressable>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={timeStringToDate(newActivity.startTime)}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={handleStartTimeChange}
                    />
                  )}
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>Horário Fim</Text>
                  <Pressable 
                    style={[styles.timePickerButton, { backgroundColor: colors.card }]}
                    testID="itinerary-end-time-picker"
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={[styles.timeText, { color: colors.text.primary }]}>
                      {newActivity.endTime || 'Opcional'}
                    </Text>
                    <AntDesign name="clockcircleo" size={16} color={colors.text.secondary} />
                  </Pressable>
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={timeStringToDate(newActivity.endTime)}
                      mode="time"
                      is24Hour={true}
                      display="default"
                      onChange={handleEndTimeChange}
                    />
                  )}
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>Local</Text>
                <TextInput
                  style={[styles.input, { color: colors.text.primary, backgroundColor: colors.card }]}
                  value={newActivity.location}
                  onChangeText={location => setNewActivity(prev => ({ ...prev, location }))}
                  placeholder="Local da atividade"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>Custo Estimado (R$)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text.primary, backgroundColor: colors.card }]}
                  value={newActivity.estimatedCost?.toString()}
                  onChangeText={cost => setNewActivity(prev => ({ ...prev, estimatedCost: Number(cost) || 0 }))}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text.secondary }]}>Notas</Text>
                <TextInput
                  style={[styles.textArea, { color: colors.text.primary, backgroundColor: colors.card }]}
                  value={newActivity.notes}
                  onChangeText={notes => setNewActivity(prev => ({ ...prev, notes }))}
                  placeholder="Observações adicionais"
                  placeholderTextColor={colors.text.secondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                testID="itinerary-cancel-button"
                onPress={resetForm}
              >
                <Text style={{ color: colors.text.primary }}>Cancelar</Text>
              </Pressable>
              
              <Pressable 
                style={[
                  styles.modalButton, 
                  styles.saveButton, 
                  { backgroundColor: colors.primary }
                ]}
                testID="itinerary-save-button"
                onPress={saveActivity}
              >
                <Text style={styles.saveButtonText}>
                  {editingActivity ? 'Salvar' : 'Adicionar'}
                </Text>
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
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysContainer: {
    flex: 1,
  },
  daySection: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
  },
  activityCard: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  completeButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    padding: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  activityActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 6,
  },
  activityDetails: {
    gap: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
  },
  costText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  notesText: {
    fontSize: 12,
    marginTop: 3,
    fontStyle: 'italic',
  },
  emptyDay: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    marginBottom: 6,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addDayButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  textArea: {
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
  },
  pickerIcon: {
    marginRight: 6,
  },
  picker: {
    flex: 1,
  },
  pickerText: {
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    padding: 6,
    gap: 6,
  },
  categoryButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryText: {
    fontSize: 11,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    marginRight: 6,
  },
  saveButton: {
    marginLeft: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalScroll: {
    flexGrow: 1,
    width: '100%',
    marginBottom: 8,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    height: 44,
  },
  timeText: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dayButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  timeButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  editButton: {
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  completedActivity: {
    opacity: 0.7,
  }
}); 