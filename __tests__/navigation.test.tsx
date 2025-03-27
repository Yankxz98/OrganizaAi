import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StorageService } from '../app/utils/storage';
import { ThemeProvider } from '../app/theme/ThemeContext';
import { EventProvider } from '../app/utils/EventContext';
import ExpensesScreen from '../app/(tabs)/expenses';
import AddExpenseScreen from '../app/expenses/add';

// Mock do StorageService
jest.mock('../app/utils/storage', () => ({
  StorageService: {
    loadExpenses: jest.fn(),
    saveExpenses: jest.fn()
  }
}));

const mockLoadExpenses = StorageService.loadExpenses as jest.Mock;

// Mock do expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockParams = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack
  }),
  useLocalSearchParams: () => mockParams,
  Stack: {
    Screen: (props: any) => null
  }
}));

// Função auxiliar para renderizar componentes com os providers necessários
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <EventProvider>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </EventProvider>
  );
};

describe('Navegação entre Telas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadExpenses.mockResolvedValue([]);
  });

  it('deve navegar para a tela de adicionar despesa quando clicar no botão', async () => {
    const { getByTestId } = renderWithProviders(<ExpensesScreen />);
    
    // Aguardamos o carregamento dos dados
    await waitFor(() => {
      expect(mockLoadExpenses).toHaveBeenCalled();
    });
    
    // Clicamos no botão de adicionar despesa
    fireEvent.press(getByTestId('add-expense-button'));
    
    // Verificamos se a navegação foi chamada com o caminho correto
    expect(mockPush).toHaveBeenCalledWith('/expenses/add');
  });

  it('deve navegar de volta à tela de despesas ao cancelar a adição', async () => {
    const { getByTestId } = renderWithProviders(<AddExpenseScreen />);
    
    // Clicamos no botão de cancelar
    fireEvent.press(getByTestId('cancel-expense-button'));
    
    // Verificamos se a navegação para trás foi chamada
    expect(mockBack).toHaveBeenCalled();
  });

  it('deve passar parâmetros corretamente ao editar uma despesa', async () => {
    // Mock data para uma despesa
    const mockExpense = {
      id: '123',
      description: 'Teste',
      amount: 100,
      date: new Date(),
      category: 'Alimentação'
    };
    
    // Configuramos o mock para retornar a despesa
    mockLoadExpenses.mockResolvedValueOnce([mockExpense]);
    
    // Configuramos o mock para simular parâmetros de URL
    Object.assign(mockParams, { id: '123' });
    
    const { getByTestId } = renderWithProviders(<ExpensesScreen />);
    
    // Aguardamos o carregamento dos dados
    await waitFor(() => {
      expect(mockLoadExpenses).toHaveBeenCalled();
    });
    
    // Clicamos no botão de editar uma despesa
    fireEvent.press(getByTestId('edit-expense-button'));
    
    // Verificamos se a navegação foi chamada com os parâmetros corretos
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/expenses/add',
      params: { id: '123' }
    });
  });
}); 