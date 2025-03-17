import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { StorageService } from '../utils/storage';
import { Moon, Sun, Smartphone } from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    Alert.alert(
      'Resetar Dados',
      'Tem certeza que deseja apagar os dados de viagens e outras configurações? Esta ação não pode ser desfeita. (Resumos, gastos e rendas serão preservados)',
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
              Alert.alert('Sucesso', 'Os dados selecionados foram apagados com sucesso.');
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
          style={[styles.resetButton, { backgroundColor: colors.danger }]}
          onPress={handleResetData}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? 'Resetando...' : 'Resetar Dados de Viagens'}
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.warning, { color: colors.text.secondary }]}>
          Atenção: Esta ação irá apagar todos os dados de viagens e outras configurações.
          Os dados de resumos, gastos e rendas serão preservados.
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
          <Text style={[styles.aboutValue, { color: colors.text.primary }]}>OrganizaAi Team</Text>
        </View>
      </View>
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
}); 