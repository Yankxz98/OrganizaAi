import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Travel, StorageService } from '../utils/storage';

export default function TravelsScreen() {
  const router = useRouter();
  const [travels, setTravels] = useState<Travel[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadTravels();
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Viagens</Text>
        <TouchableOpacity onPress={handleAddTravel} style={styles.addButton}>
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
            <View style={[styles.travelCard, isExpanded && styles.expandedCard]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={styles.cardHeaderContent}>
                  <Text style={styles.travelName}>{item.name}</Text>
                  <Text style={[
                    styles.remainingDays,
                    hasStarted ? styles.startedText : remainingDays <= 7 ? styles.closeText : {}
                  ]}>
                    {hasStarted
                      ? 'Viagem em andamento'
                      : `Faltam ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`}
                  </Text>
                </View>
                {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.travelDates}>
                    <Text style={styles.sectionTitle}>Período:</Text>
                    <Text style={styles.dateText}>
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.budgetSection}>
                    <Text style={styles.sectionTitle}>Orçamento:</Text>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetText}>
                        Total: R$ {item.budget.total.toFixed(2)}
                      </Text>
                      <Text style={styles.discretionaryText}>
                        Disponível: R$ {item.budget.discretionary.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditTravel(item.id)}
                    >
                      <Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButtonStyle]}
                      onPress={() => handleDeleteTravel(item)}
                    >
                      <Text style={styles.deleteButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma viagem cadastrada</Text>
            <Text style={styles.emptySubtext}>Toque no + para adicionar uma nova viagem</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#0f172a',
  },
  addButton: {
    backgroundColor: '#0ea5e9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    overflow: 'hidden',
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
    color: '#0f172a',
    marginBottom: 4,
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#f8fafc',
  },
  travelDates: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#0f172a',
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
    color: '#0f172a',
  },
  discretionaryText: {
    fontSize: 16,
    color: '#0f172a',
  },
  remainingDays: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  startedText: {
    color: '#10b981',
  },
  closeText: {
    color: '#f59e0b',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#0ea5e9',
  },
  deleteButtonStyle: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
}); 