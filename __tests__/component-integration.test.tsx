import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../app/(tabs)/index';
import IncomeScreen from '../app/(tabs)/income';
import { StorageService } from '../app/utils/storage';
import { EventProvider } from '../app/utils/EventContext';

// Mock do StorageService
jest.mock('../app/utils/storage', () => ({
  StorageService: {
    loadIncome: jest.fn().mockResolvedValue([{
      id: '1',
      person: 'Você',
      sources: [{ name: 'Salário', amount: 5000 }],
      monthlyExtras: [{
        month: 2, // Março (0-based)
        year: 2024,
        extras: [{ name: 'Bônus', amount: 1000 }]
      }]
    }]),
    loadExpenses: jest.fn().mockResolvedValue([]),
    saveIncome: jest.fn().mockResolvedValue(true),
    saveExpenses: jest.fn().mockResolvedValue(true)
  }
}));

const Stack = createNativeStackNavigator();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <EventProvider>
      <NavigationContainer>
        {component}
      </NavigationContainer>
    </EventProvider>
  );
};

describe('Component Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('atualiza o dashboard quando uma nova renda é adicionada', async () => {
    const mockIncome = {
      id: '1',
      person: 'Você',
      sources: [{ name: 'Salário', amount: 5000 }],
      monthlyExtras: []
    };

    (StorageService.loadIncome as jest.Mock).mockResolvedValueOnce([mockIncome]);

    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Income" component={IncomeScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('income-total-value')).toBeTruthy();
    });

    const totalValue = getByTestId('income-total-value');
    expect(totalValue.props.children).toBe('R$ 5000.00');
  });

  it('atualiza a lista de rendas quando o mês selecionado muda', async () => {
    const mockIncome = {
      id: '1',
      person: 'Você',
      sources: [{ name: 'Salário', amount: 5000 }],
      monthlyExtras: [{
        month: 2, // Março (0-based)
        year: 2024,
        extras: [{ name: 'Bônus', amount: 1000 }]
      }]
    };

    (StorageService.loadIncome as jest.Mock).mockResolvedValueOnce([mockIncome]);

    const mockDate = new Date(2024, 3, 1); // Abril (0-based)
    jest.useFakeTimers().setSystemTime(mockDate);

    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Income" component={IncomeScreen} initialParams={{ initialDate: mockDate.toISOString() }} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('income-total-value')).toBeTruthy();
    });

    expect(getByTestId('income-total-value').props.children).toBe('R$ 5000.00');

    fireEvent.press(getByTestId('previous-month-button'));

    await waitFor(() => {
      expect(getByTestId('income-total-value').props.children).toBe('R$ 6000.00');
    });
  });

  it('atualiza o dashboard quando uma despesa é adicionada', async () => {
    const mockExpense = {
      id: '1',
      description: 'Teste',
      amount: 100,
      category: 'Coffee',
      type: 'fixed',
      date: new Date()
    };

    (StorageService.loadExpenses as jest.Mock).mockResolvedValueOnce([mockExpense]);

    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('expenses-total-value')).toBeTruthy();
    });

    const totalValue = getByTestId('expenses-total-value');
    expect(totalValue.props.children).toBe('R$ 100.00');
  });
}); 