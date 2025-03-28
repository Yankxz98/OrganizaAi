import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import IncomeScreen from '../app/(tabs)/income';
import { StorageService } from '../app/utils/storage';
import { EventProvider } from '../app/utils/EventContext';

// Mock do StorageService
jest.mock('../app/utils/storage', () => ({
  StorageService: {
    loadIncome: jest.fn().mockResolvedValue([]),
    saveIncome: jest.fn().mockResolvedValue(true)
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

describe('Income', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe o total de renda corretamente', async () => {
    const mockIncome = {
      id: '1',
      person: 'Você',
      sources: [{ name: 'Salário', amount: 5000 }],
      monthlyExtras: []
    };

    (StorageService.loadIncome as jest.Mock).mockResolvedValueOnce([mockIncome]);

    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Income" component={IncomeScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('income-total-value')).toBeTruthy();
    });

    const totalValue = getByTestId('income-total-value');
    expect(totalValue.props.children).toBe('R$ 5000.00');
  });

  it('exibe a renda individual corretamente', async () => {
    const mockIncome = {
      id: '1',
      person: 'Você',
      sources: [{ name: 'Salário', amount: 5000 }],
      monthlyExtras: []
    };

    (StorageService.loadIncome as jest.Mock).mockResolvedValueOnce([mockIncome]);

    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Income" component={IncomeScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('your-income-value')).toBeTruthy();
    });

    const totalValue = getByTestId('your-income-value');
    expect(totalValue.props.children).toBe('R$ 5000.00');
  });

  it('permite adicionar uma nova renda', async () => {
    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Income" component={IncomeScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('add-income-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('add-income-button'));
  });

  it('permite editar uma renda existente', async () => {
    const mockIncome = {
      id: '1',
      person: 'Você',
      sources: [{ name: 'Salário', amount: 5000 }],
      monthlyExtras: []
    };

    (StorageService.loadIncome as jest.Mock).mockResolvedValueOnce([mockIncome]);

    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Income" component={IncomeScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('edit-income-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('edit-income-button'));
  });

  it('permite excluir uma renda', async () => {
    const mockIncome = {
      id: '1',
      person: 'Você',
      sources: [{ name: 'Salário', amount: 5000 }],
      monthlyExtras: []
    };

    (StorageService.loadIncome as jest.Mock).mockResolvedValueOnce([mockIncome]);

    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Income" component={IncomeScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('delete-income-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('delete-income-button'));
  });
}); 