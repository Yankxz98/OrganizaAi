import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpenseCategoryId } from './constants';

const STORAGE_KEYS = {
  MONTHLY_DATA: '@monthly_data',
  INVESTMENTS: '@investments',
  EXPENSES: '@expenses',
  INCOME: '@income',
  USER_PROFILE: '@user_profile',
  SETTINGS: '@settings',
  TRAVELS: '@travels'
};

export interface MonthlyData {
  totalIncome: number;
  income: number;
  totalExpenses: number;
  expenses: number;
  savings: number;
  investments: number;
}

export interface Investment {
  id: number;
  category: string;
  icon: string;
  color: string;
  amount: number;
  distribution: {
    you: number;
    partner: number;
  };
  return: number;
}

export interface Expense {
  id: number;
  category: ExpenseCategoryId;
  description: string;
  amount: number;
  type: 'fixed' | 'variable';
  installments?: {
    total: number;
    current: number;
    groupId: string;
  };
}

export interface IncomeSource {
  id: number;
  name: string;
  icon: string;
  amount: number;
  color: string;
}

export interface Income {
  id: number;
  person: string;
  sources: IncomeSource[];
  monthlyExtras?: {
    month: number;
    year: number;
    extras: {
      id: number;
      description: string;
      amount: number;
    }[];
  }[];
}

export interface TravelExpense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  isPaid: boolean;
}

export interface TravelActivity {
  id: number;
  title: string;
  category: 'passeio' | 'refeicao' | 'transporte' | 'hospedagem' | 'outro';
  startDateTime: string;
  endDateTime?: string;
  location: string;
  notes?: string;
  estimatedCost?: number;
  completed: boolean;
}

export interface Travel {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  budget: {
    total: number;
    planned: TravelExpense[];
    discretionary: number;
  };
  expenses: TravelExpense[];
  itinerary?: TravelActivity[];
}

export interface ImportData {
  travels?: Travel[];
}

export const StorageService = {
  // Monthly Data
  async saveMonthlyData(data: MonthlyData, date: Date) {
    try {
      const key = `${STORAGE_KEYS.MONTHLY_DATA}_${date.getFullYear()}_${date.getMonth()}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving monthly data:', error);
      return false;
    }
  },

  async loadMonthlyData(date: Date): Promise<MonthlyData | null> {
    try {
      const key = `${STORAGE_KEYS.MONTHLY_DATA}_${date.getFullYear()}_${date.getMonth()}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading monthly data:', error);
      return null;
    }
  },

  // Investments
  async saveInvestments(investments: Investment[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
      return true;
    } catch (error) {
      console.error('Error saving investments:', error);
      return false;
    }
  },

  async loadInvestments(): Promise<Investment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading investments:', error);
      return [];
    }
  },

  // Expenses
  async saveExpenses(expenses: Expense[], date: Date, append: boolean = false) {
    try {
      const key = `${STORAGE_KEYS.EXPENSES}_${date.getFullYear()}_${date.getMonth()}`;
      let newExpenses = expenses;
      
      if (append) {
        const existingExpenses = await this.loadExpenses(date);
        newExpenses = [...existingExpenses, ...expenses];
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(newExpenses));
      return true;
    } catch (error) {
      console.error('Error saving expenses:', error);
      return false;
    }
  },

  async loadExpenses(date: Date): Promise<Expense[]> {
    try {
      const key = `${STORAGE_KEYS.EXPENSES}_${date.getFullYear()}_${date.getMonth()}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading expenses:', error);
      return [];
    }
  },

  // Income
  async saveIncome(income: Income[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(income));
      return true;
    } catch (error) {
      console.error('Error saving income:', error);
      return false;
    }
  },

  async loadIncome(): Promise<Income[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.INCOME);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading income:', error);
      return [];
    }
  },

  // Travel Methods
  async saveTravels(travels: Travel[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRAVELS, JSON.stringify(travels));
      return true;
    } catch (error) {
      console.error('Error saving travels:', error);
      return false;
    }
  },

  async loadTravels(): Promise<Travel[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRAVELS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading travels:', error);
      return [];
    }
  },

  async saveTravel(travel: Travel) {
    try {
      const travels = await this.loadTravels();
      const existingIndex = travels.findIndex(t => t.id === travel.id);
      
      if (existingIndex >= 0) {
        // Atualizar viagem existente
        travels[existingIndex] = travel;
      } else {
        // Adicionar nova viagem
        travels.push(travel);
      }
      
      await this.saveTravels(travels);
      return true;
    } catch (error) {
      console.error('Error saving travel:', error);
      return false;
    }
  },

  async deleteTravel(travelId: number) {
    try {
      const travels = await this.loadTravels();
      const newTravels = travels.filter(t => t.id !== travelId);
      await this.saveTravels(newTravels);
      return true;
    } catch (error) {
      console.error('Error deleting travel:', error);
      return false;
    }
  },

  // Clear all data
  async clearAllData() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      if (allKeys.length > 0) {
        await AsyncStorage.multiRemove(allKeys);
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  async importData(jsonData: string): Promise<{ success: boolean; message: string }> {
    try {
      const data: ImportData = JSON.parse(jsonData);
      
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Formato de dados inválido' };
      }

      // Importar viagens
      if (data.travels) {
        const currentTravels = await this.loadTravels();
        const newTravels = data.travels.map(travel => ({
          ...travel,
          id: Date.now() + Math.random() // Garantir IDs únicos
        }));
        
        await this.saveTravels([...currentTravels, ...newTravels]);
      }

      return { 
        success: true, 
        message: 'Dados importados com sucesso!' 
      };
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return { 
        success: false, 
        message: 'Erro ao processar o JSON. Verifique o formato dos dados.' 
      };
    }
  },
}; 