import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { StorageService } from '../utils/storage';
import { Moon, Sun, Smartphone, Upload } from 'lucide-react-native';
import { useEvent } from '../utils/EventContext';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { triggerEvent } = useEvent();
  const [isResetting, setIsResetting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleResetData = async () => {
    Alert.alert(
      'Resetar Dados',
      'Tem certeza que deseja apagar TODOS os dados do sistema? Esta ação não pode ser desfeita e irá remover todas as viagens, gastos, rendas e configurações.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              await StorageService.clearAllData();
              triggerEvent('EXPENSE_UPDATED');
              triggerEvent('INCOME_UPDATED');
              triggerEvent('TRAVEL_UPDATED');
              Alert.alert('Sucesso', 'Todos os dados foram apagados com sucesso.');
            } catch (error) {
              Alert.alert('Erro', 'Ocorreu um erro ao tentar apagar os dados.');
              console.error(error);
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleImportData = async () => {
    if (!importText.trim()) {
      Alert.alert('Erro', 'Por favor, insira os dados a serem importados.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await StorageService.importData(importText);
      if (result.success) {
        // Disparar eventos para atualizar todas as telas
        triggerEvent('EXPENSE_UPDATED');
        triggerEvent('INCOME_UPDATED');
        triggerEvent('TRAVEL_UPDATED');
        setShowImportModal(false);
        setImportText('');
      }
      Alert.alert(
        result.success ? 'Sucesso' : 'Erro',
        result.message
      );
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao importar os dados.');
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Configurações</Text>
      
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Aparência</Text>
        
        <View style={styles.themeOptions}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              theme === 'light' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => setTheme('light')}
          >
            <View style={styles.themeOptionContent}>
              <Sun 
                size={20} 
                color={theme === 'light' ? colors.primary : colors.text.secondary} 
                style={styles.themeIcon}
              />
              <View style={styles.themeTextContainer}>
                <Text style={[
                  styles.themeText, 
                  { color: theme === 'light' ? colors.primary : colors.text.primary }
                ]}>
                  Claro
                </Text>
                <Text style={[styles.themeDescription, { color: colors.text.secondary }]}>
                  Ideal para uso diurno
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.themeOption,
              theme === 'dark' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => setTheme('dark')}
          >
            <View style={styles.themeOptionContent}>
              <Moon 
                size={20} 
                color={theme === 'dark' ? colors.primary : colors.text.secondary} 
                style={styles.themeIcon}
              />
              <View style={styles.themeTextContainer}>
                <Text style={[
                  styles.themeText, 
                  { color: theme === 'dark' ? colors.primary : colors.text.primary }
                ]}>
                  Escuro
                </Text>
                <Text style={[styles.themeDescription, { color: colors.text.secondary }]}>
                  Reduz o cansaço visual
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.themeOption,
              theme === 'system' && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => setTheme('system')}
          >
            <View style={styles.themeOptionContent}>
              <Smartphone 
                size={20} 
                color={theme === 'system' ? colors.primary : colors.text.secondary} 
                style={styles.themeIcon}
              />
              <View style={styles.themeTextContainer}>
                <Text style={[
                  styles.themeText, 
                  { color: theme === 'system' ? colors.primary : colors.text.primary }
                ]}>
                  Sistema
                </Text>
                <Text style={[styles.themeDescription, { color: colors.text.secondary }]}>
                  Segue o dispositivo
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Gerenciamento de Dados</Text>
        
        <TouchableOpacity
          style={[styles.importButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowImportModal(true)}
        >
          <View style={styles.buttonContent}>
            <Upload size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.importButtonText}>Importar Dados</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.danger }]}
          onPress={handleResetData}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? 'Resetando...' : 'Resetar Todos os Dados'}
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.warning, { color: colors.text.secondary }]}>
          Atenção: Esta ação irá apagar TODOS os dados do sistema, incluindo viagens, gastos, rendas e configurações.
          Esta ação não pode ser desfeita.
        </Text>
      </View>
      
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Sobre o Aplicativo</Text>
        
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.text.secondary }]}>Versão</Text>
          <Text style={[styles.aboutValue, { color: colors.text.primary }]}>1.0.0</Text>
        </View>
        
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.text.secondary }]}>Desenvolvido por</Text>
          <Text style={[styles.aboutValue, { color: colors.text.primary }]}>Yan Gallo</Text>
        </View>
      </View>

      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Importar Dados
            </Text>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.importLabel, { color: colors.text.secondary }]}>
                Cole o JSON com os dados no formato:{'\n'}
                {'{\n  "travels": [\n    {\n      "name": "Nome da Viagem",\n      "startDate": "2024-03-20",\n      "endDate": "2024-03-25",\n      "budget": {\n        "total": 1000,\n        "planned": [],\n        "discretionary": 1000\n      },\n      "expenses": [],\n      "itinerary": []\n    }\n  ]\n}'}
              </Text>

              <TextInput
                style={[styles.textArea, { color: colors.text.primary, backgroundColor: colors.card }]}
                value={importText}
                onChangeText={setImportText}
                placeholder="Cole o JSON aqui..."
                placeholderTextColor={colors.text.secondary}
                multiline
                numberOfLines={10}
              />
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
              >
                <Text style={{ color: colors.text.primary }}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.importModalButton, 
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleImportData}
                disabled={isImporting}
              >
                <Text style={styles.importModalButtonText}>
                  {isImporting ? 'Importando...' : 'Importar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  warning: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  themeOptions: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  themeOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    marginRight: 8,
  },
  themeTextContainer: {
    flexDirection: 'column',
  },
  themeText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingVertical: 4,
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  aboutValue: {
    fontSize: 13,
  },
  importButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  importButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: 16,
  },
  importLabel: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButton: {
    marginRight: 6,
  },
  importModalButton: {
    marginLeft: 6,
  },
  importModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 