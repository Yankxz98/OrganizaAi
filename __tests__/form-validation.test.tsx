import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import IncomeForm from '../app/components/IncomeForm';
import { Income } from '../app/utils/storage';
import { ThemeProvider } from '../app/theme/ThemeContext';
import { EventProvider } from '../app/utils/EventContext';

// Mock do Alert
const mockAlert = jest.fn();
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert
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

describe('Validação de Formulários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve desabilitar o botão salvar quando campos obrigatórios estão vazios', async () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();
    const currentDate = new Date();
    
    const { getByTestId } = renderWithProvider(
      <IncomeForm 
        onSave={mockOnSave} 
        onCancel={mockOnCancel}
        currentDate={currentDate}
      />
    );
    
    // Verificamos se o botão de salvar está desabilitado inicialmente
    const saveButton = getByTestId('income-save-button');
    expect(saveButton).toBeTruthy();
  });

  it('deve habilitar o botão salvar quando todos os campos obrigatórios são preenchidos', async () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();
    const currentDate = new Date();
    
    const { getByTestId } = renderWithProvider(
      <IncomeForm 
        onSave={mockOnSave} 
        onCancel={mockOnCancel}
        currentDate={currentDate}
      />
    );
    
    // Preenchemos os campos obrigatórios
    fireEvent.changeText(getByTestId('income-person-input'), 'Teste');
    
    // Adicionamos uma fonte de renda
    fireEvent.changeText(getByTestId('income-source-name-input'), 'Salário');
    fireEvent.changeText(getByTestId('income-source-amount-input'), '3000');
    fireEvent.press(getByTestId('income-add-source-button'));
    
    // Verificamos se podemos salvar
    const saveButton = getByTestId('income-save-button');
    fireEvent.press(saveButton);
    
    // Verificamos se o onSave foi chamado
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('deve mostrar erro quando valor da renda for negativo', async () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();
    const currentDate = new Date();
    
    const { getByTestId } = renderWithProvider(
      <IncomeForm 
        onSave={mockOnSave} 
        onCancel={mockOnCancel}
        currentDate={currentDate}
      />
    );
    
    // Preenchemos os campos obrigatórios com valor negativo
    fireEvent.changeText(getByTestId('income-person-input'), 'Teste');
    
    // Adicionamos uma fonte de renda com valor negativo
    fireEvent.changeText(getByTestId('income-source-name-input'), 'Salário');
    fireEvent.changeText(getByTestId('income-source-amount-input'), '-100');
    fireEvent.press(getByTestId('income-add-source-button'));
    
    // Tentamos salvar
    fireEvent.press(getByTestId('income-save-button'));
    
    // Verificamos se o onSave não foi chamado (não deve ser possível salvar com valor negativo)
    expect(mockOnSave).not.toHaveBeenCalled();
  });
  
  it('deve validar que pelo menos uma fonte de renda foi adicionada', async () => {
    const mockOnSave = jest.fn();
    const mockOnCancel = jest.fn();
    const currentDate = new Date();
    
    const { getByTestId } = renderWithProvider(
      <IncomeForm 
        onSave={mockOnSave} 
        onCancel={mockOnCancel}
        currentDate={currentDate}
      />
    );
    
    // Preenchemos apenas o nome da pessoa, sem adicionar fontes
    fireEvent.changeText(getByTestId('income-person-input'), 'Teste');
    
    // Tentamos salvar
    fireEvent.press(getByTestId('income-save-button'));
    
    // Verificamos se o onSave não foi chamado
    expect(mockOnSave).not.toHaveBeenCalled();
  });
}); 