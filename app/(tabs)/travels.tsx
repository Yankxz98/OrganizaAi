import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { Travel, StorageService } from '../utils/storage';

export default function TravelsScreen() {
  const router = useRouter();
  const [travels, setTravels] = useState<Travel[]>([]);

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
          
          return (
            <View style={styles.travelCard}>
              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => router.push(`/travel/${item.id}`)}
              >
                <Text style={styles.travelName}>{item.name}</Text>
                <View style={styles.travelDates}>
                  <Text style={styles.dateText}>
                    {formatDate(item.startDate)} - {formatDate(item.endDate)}
                  </Text>
                </View>
                <View style={styles.budgetInfo}>
                  <Text style={styles.budgetText}>
                    Orçamento: R$ {item.budget.total.toFixed(2)}
                  </Text>
                  <Text style={styles.discretionaryText}>
                    Disponível: R$ {item.budget.discretionary.toFixed(2)}
                  </Text>
                </View>
                <Text style={[
                  styles.remainingDays,
                  hasStarted ? styles.startedText : remainingDays <= 7 ? styles.closeText : {}
                ]}>
                  {hasStarted
                    ? 'Viagem em andamento'
                    : `Faltam ${remainingDays} ${remainingDays === 1 ? 'dia' : 'dias'}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTravel(item)}
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
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
    flexDirection: 'row',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  travelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  travelDates: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#64748b',
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetText: {
    fontSize: 14,
    color: '#64748b',
  },
  discretionaryText: {
    fontSize: 14,
    color: '#64748b',
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