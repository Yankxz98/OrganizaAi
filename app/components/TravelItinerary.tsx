import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ScrollView, Modal, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MapPin, Clock, Calendar, Edit2, Trash2, Check } from 'lucide-react-native';
import { Travel, TravelActivity, StorageService } from '../utils/storage';
import { useEvent } from '../utils/EventContext';

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
    if (!selectedDay) return;
    
    if (!newActivity.title || !newActivity.location) {
      Alert.alert('Erro', 'Por favor, preencha o título e o local');
      return;
    }

    // Extrair as horas e minutos
    const [hours, minutes] = (newActivity.startTime || '08:00').split(':');
    
    // Criar a string ISO diretamente
    // Formato: YYYY-MM-DDTHH:MM:00.000Z
    const startDateTime = `${selectedDay}T${hours}:${minutes}:00.000Z`;

    // Fazer o mesmo para a hora de término, se existir
    let endDateTime;
    if (newActivity.endTime) {
      const [endHours, endMinutes] = newActivity.endTime.split(':');
      endDateTime = `${selectedDay}T${endHours}:${endMinutes}:00.000Z`;
    }

    const activity: TravelActivity = {
      id: editingActivity?.id || Date.now(),
      title: newActivity.title || '',
      category: newActivity.category || 'passeio',
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      location: newActivity.location || '',
      notes: newActivity.notes,
      estimatedCost: Number(newActivity.estimatedCost) || 0,
      completed: editingActivity?.completed || false
    };

    // Garantir que o itinerário seja inicializado mesmo quando não existe
    let updatedItinerary = [...(travel.itinerary || [])];
    
    // Calcular a diferença de custo para atualizar o valor disponível
    let costDifference = Number(newActivity.estimatedCost) || 0;
    
    if (editingActivity) {
      // Se estiver editando, calcular a diferença entre o novo custo e o antigo
      const oldCost = editingActivity.estimatedCost || 0;
      costDifference = costDifference - oldCost;
      
      // Atualizar atividade existente
      updatedItinerary = updatedItinerary.map(a => 
        a.id === editingActivity.id ? activity : a
      );
    } else {
      // Adicionar nova atividade
      updatedItinerary.push(activity);
    }

    const updatedTravel = {
      ...travel,
      itinerary: updatedItinerary
    };

    saveTravel(updatedTravel);
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
    // Extrair as horas e minutos da string ISO diretamente
    const startTimeString = activity.startDateTime.split('T')[1]; // Pega a parte após o T
    const startHours = startTimeString.substring(0, 2);
    const startMinutes = startTimeString.substring(3, 5);
    const startTime = `${startHours}:${startMinutes}`;
    
    let endTime = '';
    if (activity.endDateTime) {
      const endTimeString = activity.endDateTime.split('T')[1];
      const endHours = endTimeString.substring(0, 2);
      const endMinutes = endTimeString.substring(3, 5);
      endTime = `${endHours}:${endMinutes}`;
    }
    
    setEditingActivity(activity);
    setNewActivity({
      title: activity.title,
      category: activity.category,
      startTime,
      endTime,
      location: activity.location,
      notes: activity.notes,
      estimatedCost: activity.estimatedCost || 0
    });
    
    // Extrair a data da string ISO (YYYY-MM-DD)
    const datePart = activity.startDateTime.split('T')[0];
    setSelectedDay(datePart);
    
    setShowAddModal(true);
  };

  const saveTravel = async (updatedTravel: Travel) => {
    try {
      // Recalcular o valor disponível
      const totalExpenses = updatedTravel.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      // Atualizar o valor disponível
      const updatedTravelWithDiscretionary = {
        ...updatedTravel,
        budget: {
          ...updatedTravel.budget,
          discretionary: updatedTravel.budget.total - totalExpenses
        }
      };
      
      const travels = await StorageService.loadTravels();
      
      const updatedTravels = travels.map(t => 
        t.id === updatedTravelWithDiscretionary.id ? updatedTravelWithDiscretionary : t
      );
      
      await StorageService.saveTravels(updatedTravels);
      onUpdate(updatedTravelWithDiscretionary);
      
      // Disparar evento imediatamente sem setTimeout
      triggerEvent('TRAVEL_UPDATED');
      console.log('Itinerário atualizado e evento TRAVEL_UPDATED disparado');
    } catch (error) {
      console.error('Erro ao salvar itinerário:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o itinerário');
    }
  };

  const resetForm = () => {
    setNewActivity({
      title: '',
      category: 'passeio',
      startTime: '08:00',
      endTime: '',
      location: '',
      notes: '',
      estimatedCost: 0
    });
    setEditingActivity(null);
    setShowAddModal(false);
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
                >
                  <Pressable 
                    style={styles.completeButton}
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
                          onPress={() => handleEditActivity(activity)}
                        >
                          <Edit2 size={16} color={colors.text.secondary} />
                        </Pressable>
                        <Pressable 
                          style={styles.actionButton}
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
                  <Text style={[styles.label, { color: colors.text.secondary }]}>Hora Início</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text.primary, backgroundColor: colors.card }]}
                    value={newActivity.startTime}
                    onChangeText={startTime => setNewActivity(prev => ({ ...prev, startTime }))}
                    placeholder="08:00"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
                
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text.secondary }]}>Hora Fim</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text.primary, backgroundColor: colors.card }]}
                    value={newActivity.endTime}
                    onChangeText={endTime => setNewActivity(prev => ({ ...prev, endTime }))}
                    placeholder="10:00"
                    placeholderTextColor={colors.text.secondary}
                  />
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
                onPress={resetForm}
              >
                <Text style={{ color: colors.text.primary }}>Cancelar</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAddActivity}
              >
                <Text style={styles.saveButtonText}>
                  {editingActivity ? 'Atualizar' : 'Adicionar'}
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
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    marginRight: 6,
    borderWidth: 1,
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
}); 