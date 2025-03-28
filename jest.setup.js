import '@testing-library/jest-native/extend-expect';

// Configuração global do Jest
jest.setTimeout(10000); // Timeout global de 10 segundos

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  clear: jest.fn(),
}));

// Mock do DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => ({
  show: jest.fn(),
  dismiss: jest.fn(),
  getDefaultDisplayValue: jest.fn(),
}));

// Mock do Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    setParams: jest.fn(),
    canGoBack: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  useRootNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(),
  }),
  Link: jest.fn(),
  Stack: {
    Screen: jest.fn(),
  },
  Tabs: {
    Screen: jest.fn(),
  },
}));

// Mock do Expo Constants
jest.mock('expo-constants', () => ({
  projectId: 'test-project-id',
}));

// Mock do Expo Linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  useURL: jest.fn(),
  useInitialURL: jest.fn(),
}));

// Mock do Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      ...RN.Alert,
      alert: jest.fn(),
      prompt: jest.fn(),
    },
  };
});

// Limpeza de mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Mock de console para evitar output durante os testes
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
}); 