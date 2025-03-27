import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import TravelItinerary from '../app/components/TravelItinerary';
import { Travel, TravelActivity } from '../app/utils/storage';
import { ThemeProvider } from '../app/theme/ThemeContext';
import { EventProvider } from '../app/utils/EventContext';

// Mock do Alert
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert
}));

// Mock do @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  AntDesign: () => 'AntDesign',
  MaterialIcons: () => 'MaterialIcons',
  MaterialCommunityIcons: () => 'MaterialCommunityIcons',
  Ionicons: () => 'Ionicons',
  FontAwesome: () => 'FontAwesome',
  FontAwesome5: () => 'FontAwesome5',
  Feather: () => 'Feather',
  Entypo: () => 'Entypo',
  SimpleLineIcons: () => 'SimpleLineIcons',
  Octicons: () => 'Octicons',
  Zocial: () => 'Zocial',
  Fontisto: () => 'Fontisto',
  Foundation: () => 'Foundation',
  EvilIcons: () => 'EvilIcons'
}));

// Mock do StorageService
jest.mock('../app/utils/storage', () => ({
  ...jest.requireActual('../app/utils/storage'),
  StorageService: {
    saveTravel: jest.fn().mockResolvedValue(true),
    loadTravels: jest.fn()
  }
}));

// Função auxiliar para renderizar componentes com os providers necessários
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <EventProvider>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </EventProvider>
  );
};

describe('TravelItinerary', () => {
  const mockTravel: Travel = {
    id: 1,
    name: 'Viagem Teste',
    startDate: '2024-03-20',
    endDate: '2024-03-25',
    budget: {
      total: 1000,
      planned: [],
      discretionary: 1000
    },
    expenses: [],
    itinerary: []
  };

  const mockColors = {
    primary: '#3b82f6',
    background: '#ffffff',
    text: '#1e293b'
  };

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar o mock do Alert para retornar uma função que simula o botão de confirmar
    mockAlert.mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress();
      }
    });
  });

  it('deve renderizar o componente corretamente', () => {
    const { getByText, getAllByText } = renderWithProvider(
      <TravelItinerary travel={mockTravel} onUpdate={mockOnUpdate} colors={mockColors} />
    );

    expect(getByText('Itinerário da Viagem')).toBeTruthy();
    expect(getAllByText('Adicionar')).toBeTruthy();
  });

  it('deve mostrar erro ao tentar adicionar atividade sem campos obrigatórios', async () => {
    const { getAllByTestId, getByTestId } = renderWithProvider(
      <TravelItinerary travel={mockTravel} onUpdate={mockOnUpdate} colors={mockColors} />
    );

    // Abrir modal de adição
    fireEvent.press(getAllByTestId('itinerary-add-activity-button')[0]);

    // Tentar salvar sem preencher campos
    fireEvent.press(getByTestId('itinerary-save-button'));

    // Verificar se o alerta foi mostrado
    expect(mockAlert).toHaveBeenCalledWith(
      'Erro',
      'Título, dia e horário de início são obrigatórios'
    );
  });

  it('deve adicionar uma nova atividade corretamente', async () => {
    const { getByText, getAllByTestId, getByTestId, getByPlaceholderText } = renderWithProvider(
      <TravelItinerary travel={mockTravel} onUpdate={mockOnUpdate} colors={mockColors} />
    );

    // Abrir modal de adição
    fireEvent.press(getAllByTestId('itinerary-add-activity-button')[0]);

    // Preencher campos
    fireEvent.changeText(getByPlaceholderText('Título da atividade'), 'Passeio no Parque');
    fireEvent.changeText(getByPlaceholderText('Local da atividade'), 'Parque Central');
    fireEvent.changeText(getByPlaceholderText('0.00'), '50');

    // Selecionar horário
    fireEvent.press(getByTestId('itinerary-start-time-picker'));
    fireEvent.press(getByText('08:00'));

    // Salvar atividade
    fireEvent.press(getByTestId('itinerary-save-button'));

    // Verificar se a atividade foi adicionada
    await waitFor(() => {
      expect(getByText('Passeio no Parque')).toBeTruthy();
      expect(getByText('Parque Central')).toBeTruthy();
      expect(getByText('R$ 50.00')).toBeTruthy();
    });
  });

  it('deve editar uma atividade existente', async () => {
    const travelWithActivity: Travel = {
      ...mockTravel,
      itinerary: [{
        id: 1,
        title: 'Atividade Original',
        category: 'passeio',
        startDateTime: '2024-03-20T08:00:00.000Z',
        location: 'Local Original',
        notes: '',
        estimatedCost: 50,
        completed: false
      }]
    };

    const { getByText, getByTestId, getByPlaceholderText } = renderWithProvider(
      <TravelItinerary travel={travelWithActivity} onUpdate={mockOnUpdate} colors={mockColors} />
    );

    // Abrir modal de edição
    fireEvent.press(getByTestId('itinerary-edit-button'));

    // Modificar campos
    fireEvent.changeText(getByPlaceholderText('Título da atividade'), 'Atividade Editada');
    fireEvent.changeText(getByPlaceholderText('Local da atividade'), 'Local Editado');
    fireEvent.changeText(getByPlaceholderText('0.00'), '100');

    // Salvar alterações
    fireEvent.press(getByTestId('itinerary-save-button'));

    // Verificar se a atividade foi atualizada
    await waitFor(() => {
      expect(getByText('Atividade Editada')).toBeTruthy();
      expect(getByText('Local Editado')).toBeTruthy();
      expect(getByText('R$ 100.00')).toBeTruthy();
    });
  });

  it('deve excluir uma atividade após confirmação', async () => {
    const travelWithActivity: Travel = {
      ...mockTravel,
      itinerary: [{
        id: 1,
        title: 'Atividade para Excluir',
        category: 'passeio',
        startDateTime: '2024-03-20T08:00:00.000Z',
        location: 'Local',
        notes: '',
        estimatedCost: 50,
        completed: false
      }]
    };

    const { getByText, getByTestId } = renderWithProvider(
      <TravelItinerary travel={travelWithActivity} onUpdate={mockOnUpdate} colors={mockColors} />
    );

    // Simular confirmação do Alert
    mockAlert.mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress();
      }
    });

    // Clicar no botão de excluir
    fireEvent.press(getByTestId('itinerary-delete-button'));

    // Verificar se a atividade foi removida
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
        itinerary: []
      }));
    });
  });

  it('deve marcar uma atividade como concluída', async () => {
    const travelWithActivity: Travel = {
      ...mockTravel,
      itinerary: [{
        id: 1,
        title: 'Atividade para Concluir',
        category: 'passeio',
        startDateTime: '2024-03-20T08:00:00.000Z',
        location: 'Local',
        notes: '',
        estimatedCost: 50,
        completed: false
      }]
    };

    const { getByText, getByTestId } = renderWithProvider(
      <TravelItinerary travel={travelWithActivity} onUpdate={mockOnUpdate} colors={mockColors} />
    );

    // Clicar no botão de concluir
    fireEvent.press(getByTestId('itinerary-complete-button'));

    // Verificar se a atividade foi marcada como concluída
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
        itinerary: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            completed: true
          })
        ])
      }));
    });
  });
}); 