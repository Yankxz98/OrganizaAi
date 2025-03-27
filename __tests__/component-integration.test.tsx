import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StorageService, Income } from '../app/utils/storage';
import { ThemeProvider } from '../app/theme/ThemeContext';
import { EventProvider } from '../app/utils/EventContext';
import AppIndex from '../app/(tabs)/index';
import IncomeScreen from '../app/(tabs)/income';

// Mock do StorageService
jest.mock('../app/utils/storage', () => ({
  StorageService: {
    loadIncome: jest.fn(),
    saveIncome: jest.fn(),
    loadExpenses: jest.fn(),
    saveExpenses: jest.fn()
  },
  Income: jest.requireActual('../app/utils/storage').Income
}));

const mockLoadIncome = StorageService.loadIncome as jest.Mock;
const mockSaveIncome = StorageService.saveIncome as jest.Mock;
const mockLoadExpenses = StorageService.loadExpenses as jest.Mock;
const mockSaveExpenses = StorageService.saveExpenses as jest.Mock;

// Mock dos componentes que dependem de expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  useLocalSearchParams: () => ({}),
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

describe('Integração entre Componentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadIncome.mockResolvedValue([]);
    mockLoadExpenses.mockResolvedValue([]);
  });

  it('deve atualizar o dashboard quando uma nova renda for adicionada', async () => {
    // Mock data
    const mockIncome = {
      id: 1,
      person: 'Você',
      sources: [
        { id: 1, name: 'Salário', amount: 3000, icon: 'Briefcase', color: '#0ea5e9' }
      ],
      monthlyExtras: []
    };

    // Primeiro renderizamos o Income Screen
    const { getByTestId, getByText, unmount } = renderWithProviders(<IncomeScreen />);
    
    // Esperamos pelo carregamento inicial
    await waitFor(() => {
      expect(mockLoadIncome).toHaveBeenCalled();
    });
    
    // Adicionamos uma nova renda
    fireEvent.press(getByTestId('add-income-button'));
    
    // Preenchemos o formulário
    fireEvent.changeText(getByTestId('income-person-input'), 'Você');
    fireEvent.changeText(getByTestId('income-source-name-input'), 'Salário');
    fireEvent.changeText(getByTestId('income-source-amount-input'), '3000');
    fireEvent.press(getByTestId('income-add-source-button'));
    
    // Configuramos o mock para salvar a renda
    mockSaveIncome.mockResolvedValueOnce([mockIncome]);
    
    // Salvamos a renda
    fireEvent.press(getByTestId('income-save-button'));
    
    // Verificamos se o saveIncome foi chamado
    await waitFor(() => {
      expect(mockSaveIncome).toHaveBeenCalled();
    });
    
    // Desmontamos o componente de renda
    unmount();
    
    // Agora renderizamos o Dashboard com dados de renda
    mockLoadIncome.mockResolvedValueOnce([mockIncome]);
    
    const dashboardComp = renderWithProviders(<AppIndex />);
    
    // Esperamos pelo carregamento inicial
    await waitFor(() => {
      expect(mockLoadIncome).toHaveBeenCalled();
      expect(mockLoadExpenses).toHaveBeenCalled();
    });
    
    // Verificamos se o valor da renda aparece no dashboard
    await waitFor(() => {
      expect(dashboardComp.queryByText('R$ 3000')).toBeTruthy();
    });
  });

  it('deve atualizar a lista de rendas quando o mês selecionado mudar', async () => {
    // Mock data para meses diferentes
    const janeiroIncome = {
      id: 1,
      person: 'Você',
      sources: [
        { id: 1, name: 'Salário Janeiro', amount: 3000, icon: 'Briefcase', color: '#0ea5e9' }
      ],
      monthlyExtras: []
    };
    
    const fevereiroIncome = {
      id: 1,
      person: 'Você',
      sources: [
        { id: 1, name: 'Salário Fevereiro', amount: 3500, icon: 'Briefcase', color: '#0ea5e9' }
      ],
      monthlyExtras: []
    };
    
    // Configuramos o mock para retornar rendas de janeiro
    mockLoadIncome.mockResolvedValueOnce([janeiroIncome]);
    
    const { getByTestId, getAllByText, getByText, queryByText } = renderWithProviders(<IncomeScreen />);
    
    // Esperamos pelo carregamento inicial (janeiro)
    await waitFor(() => {
      expect(mockLoadIncome).toHaveBeenCalled();
      expect(queryByText('Salário Janeiro')).toBeTruthy();
    });
    
    // Configuramos o mock para retornar rendas de fevereiro
    mockLoadIncome.mockResolvedValueOnce([fevereiroIncome]);
    
    // Mudamos para fevereiro usando o MonthSelector
    const nextMonthButton = getByTestId('next-month-button');
    fireEvent.press(nextMonthButton);
    
    // Verificamos se os dados de fevereiro são exibidos
    await waitFor(() => {
      expect(mockLoadIncome).toHaveBeenCalledTimes(2);
      expect(queryByText('Salário Fevereiro')).toBeTruthy();
    });
  });
}); 