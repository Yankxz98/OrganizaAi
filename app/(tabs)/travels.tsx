import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react-native';
import { Travel, StorageService } from '../utils/storage';
import { useTheme } from '../theme/ThemeContext';
import { useEvent } from '../utils/EventContext';

export default function TravelsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { subscribeToEvent } = useEvent();
  const [travels, setTravels] = useState<Travel[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadTravels();
    
    // Inscrever-se no evento TRAVEL_UPDATED
    const unsubscribe = subscribeToEvent('TRAVEL_UPDATED', () => {
      console.log('Evento TRAVEL_UPDATED recebido, atualizando lista de viagens');
      loadTravels();
    });
    
    // Limpar inscrição quando o componente for desmontado
    return () => {
      unsubscribe();
    };
  }, []);

  const loadTravels = async () => {
    const loadedTravels = await StorageService.loadTravels();
    setTravels(loadedTravels);
  };

  const handleAddTravel = () => {
    router.push('/travel/new');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const calculateRemainingDays = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteTravel = async (travel: Travel) => {
    Alert.alert(
      'Excluir Viagem',
      `Tem certeza que deseja excluir a viagem "${travel.name}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await StorageService.deleteTravel(travel.id);
            if (success) {
              loadTravels();
            } else {
              Alert.alert('Erro', 'Não foi possível excluir a viagem');
            }
          },
        },
      ]
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEditTravel = (id: number) => {
    router.push(`/travel/${id}`);
  };

  const handleViewTravelDetails = (id: number) => {
    router.push(`/travel/details/${id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Minhas Viagens</Text>
        <TouchableOpacity 
          onPress={handleAddTravel} 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={travels}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const remainingDays = calculateRemainingDays(item.startDate);
          const hasStarted = remainingDays <= 0;
          const isExpanded = expandedId === item.id;
          
          return (
            <View style={[
              styles.travelCard, 
              { backgroundColor: colors.card },
              isExpanded && styles.expandedCard
            ]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={styles.cardHeaderContent}>
                  <Text style={[styles.travelName, { color: colors.text.primary }]}>
                    {item.name}
                  </Text>
                  <Text style={[
                    styles.remainingDays,
                    { color: colors.text.secondary },
                    hasStarted ? { color: colors.success } : 
                    remainingDays <= 7 ? { color: colors.danger } : {}
                  ]}>
                    {hasStarted
                      ? 'Viagem em andamento'
                      : `Faltam ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`}
                  </Text>
                </View>
                {isExpanded ? 
                  <ChevronUp size={20} color={colors.text.secondary} /> : 
                  <ChevronDown size={20} color={colors.text.secondary} />
                }
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={[styles.expandedContent, { backgroundColor: colors.card }]}>
                  <View style={styles.travelDates}>
                    <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
                      Período:
                    </Text>
                    <Text style={[styles.dateText, { color: colors.text.primary }]}>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.budgetSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
                      Orçamento:
                    </Text>
                    <View style={styles.budgetInfo}>
                      <Text style={[styles.budgetText, { color: colors.text.primary }]}>
                        Total: R$ {item.budget.total.toFixed(2)}
                      </Text>
                      <Text style={[
                        styles.discretionaryText, 
                        { color: item.budget.discretionary >= 0 ? colors.success : colors.danger }
                      ]}>
                        Disponível: R$ {item.budget.discretionary.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.viewButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleViewTravelDetails(item.id)}
                    >
                      <Text style={styles.actionButtonText}>Ver Detalhes</Text>
                      <ArrowRight size={16} color="#fff" style={styles.actionIcon} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleEditTravel(item.id)}
                    >
                      <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.danger }]}
                      onPress={() => handleDeleteTravel(item)}
                    >
                      <Text style={styles.actionButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.primary }]}>
              Nenhuma viagem cadastrada
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>
              Toque no + para adicionar uma nova viagem
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  expandedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderContent: {
    flex: 1,
  },
  travelName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  remainingDays: {
    fontSize: 14,
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  travelDates: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
  },
  budgetSection: {
    marginBottom: 16,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetText: {
    fontSize: 16,
  },
  discretionaryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    flex: 2,
    marginRight: 8,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  actionIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 