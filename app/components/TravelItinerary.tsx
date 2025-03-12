import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ScrollView, Modal } from 'react-native';
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
    
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      days.push(new Date(dt));
    }
    return days;
  };

  const days = getDaysArray();

  // Filtrar atividades por dia
  const getActivitiesForDay = (day: Date) => {
    if (!travel.itinerary) return [];
    
    const dayStr = day.toISOString().split('T')[0];
    return travel.itinerary.filter(activity => {
      const activityDate = new Date(activity.startDateTime).toISOString().split('T')[0];
      return activityDate === dayStr;
    }).sort((a, b) => {
      return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
    });
  };

  const handleAddActivity = () => {
    if (!selectedDay) return;
    
    if (!newActivity.title || !newActivity.location) {
      Alert.alert('Erro', 'Por favor, preencha o título e o local');
      return;
    }

    // Criar data e hora completa
    const [hours, minutes] = (newActivity.startTime || '08:00').split(':');
    const startDate = new Date(selectedDay);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    let endDate = null;
    if (newActivity.endTime) {
      const [endHours, endMinutes] = newActivity.endTime.split(':');
      endDate = new Date(selectedDay);
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    }

    const activity: TravelActivity = {
      id: editingActivity?.id || Date.now(),
      title: newActivity.title || '',
      category: newActivity.category || 'passeio',
      startDateTime: startDate.toISOString(),
      endDateTime: endDate ? endDate.toISOString() : undefined,
      location: newActivity.location || '',
      notes: newActivity.notes,
      estimatedCost: Number(newActivity.estimatedCost) || 0,
      completed: editingActivity?.completed || false
    };

    let updatedItinerary = [...(travel.itinerary || [])];
    
    if (editingActivity) {
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
    const startDate = new Date(activity.startDateTime);
    const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
    
    let endTime = '';
    if (activity.endDateTime) {
      const endDate = new Date(activity.endDateTime);
      endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
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
    
    // Selecionar o dia da atividade
    const activityDate = new Date(activity.startDateTime);
    setSelectedDay(activityDate.toISOString().split('T')[0]);
    
    setShowAddModal(true);
  };

  const saveTravel = async (updatedTravel: Travel) => {
    try {
      const travels = await StorageService.loadTravels();
      const updatedTravels = travels.map(t => 
        t.id === updatedTravel.id ? updatedTravel : t
      );
      
      await StorageService.saveTravels(updatedTravels);
      onUpdate(updatedTravel);
      
      // Disparar evento para notificar que uma viagem foi atualizada
      setTimeout(() => {
        triggerEvent('TRAVEL_UPDATED');
      }, 300);
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
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Itinerário da Viagem</Text>
        <Pressable 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setSelectedDay(days[0].toISOString().split('T')[0]);
            setShowAddModal(true);
          }}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView style={styles.daysContainer}>
        {days.map((day, index) => (
          <View key={index} style={styles.daySection}>
            <Text style={[styles.dayTitle, { color: colors.text.primary }]}>
              {formatDate(day)}
            </Text>
            
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
                <Pressable 
                  style={[styles.addDayButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setSelectedDay(day.toISOString().split('T')[0]);
                    setShowAddModal(true);
                  }}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addDayButtonText}>Adicionar</Text>
                </Pressable>
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
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>Dia</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
                <Calendar size={16} color={colors.text.secondary} style={styles.pickerIcon} />
                <Pressable style={styles.picker}>
                  <Text style={[styles.pickerText, { color: colors.text.primary }]}>
                    {selectedDay ? new Date(selectedDay).toLocaleDateString('pt-BR') : 'Selecione um dia'}
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysContainer: {
    flex: 1,
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  activityCard: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  completeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    padding: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  activityActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  activityDetails: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
  },
  costText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  notesText: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyDay: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 8,
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  addDayButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  timeContainer: {
    flexDirection: 'row',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  pickerIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
  },
  pickerText: {
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    padding: 8,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  categoryText: {
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 