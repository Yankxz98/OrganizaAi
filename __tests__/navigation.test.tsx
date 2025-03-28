import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExpensesScreen from '../app/(tabs)/expenses';
import AddExpenseScreen from '../app/expenses/add';
import { StorageService } from '../app/utils/storage';
import { EventProvider } from '../app/utils/EventContext';

// Mock do StorageService
jest.mock('../app/utils/storage', () => ({
  StorageService: {
    loadExpenses: jest.fn().mockResolvedValue([]),
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

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navega para a tela de adicionar despesa', async () => {
    const { getByTestId } = renderWithProviders(
      <Stack.Navigator>
        <Stack.Screen name="Expenses" component={ExpensesScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('add-expense-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('add-expense-button'));
  });

  it('navega para a tela de editar despesa', async () => {
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
        <Stack.Screen name="Expenses" component={ExpensesScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      </Stack.Navigator>
    );

    await waitFor(() => {
      expect(getByTestId('edit-expense-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('edit-expense-button'));
  });
}); 