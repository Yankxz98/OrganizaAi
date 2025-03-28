import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../app/theme/ThemeContext';
import { EventProvider } from '../app/utils/EventContext';
import { View } from 'react-native';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <EventProvider>
        {ui}
      </EventProvider>
    </ThemeProvider>
  );
};

describe('renderWithProviders', () => {
  it('deve renderizar um componente com os providers necessários', () => {
    const { getByTestId } = renderWithProviders(<View testID="test-view" />);
    expect(getByTestId('test-view')).toBeTruthy();
  });
}); 