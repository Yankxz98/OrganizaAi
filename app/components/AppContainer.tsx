import React from 'react';
import { 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet,
  ViewStyle,
  ScrollViewProps 
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

interface AppContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  safeAreaEdges?: Edge[];
  withKeyboardAvoidingView?: boolean;
  keyboardVerticalOffset?: number;
  containerStyle?: ViewStyle;
  scrollViewStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  withScroll?: boolean;
}

export default function AppContainer({
  children,
  safeAreaEdges = ['top', 'right', 'left'],
  withKeyboardAvoidingView = true,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 0,
  containerStyle,
  scrollViewStyle,
  contentContainerStyle,
  withScroll = true,
  ...scrollViewProps
}: AppContainerProps) {
  const { colors } = useTheme();

  const defaultContentContainerStyle: ViewStyle = {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Espaço extra para evitar corte
  };

  const renderContent = () => {
    if (withScroll) {
      return (
        <ScrollView
          style={[styles.scrollView, scrollViewStyle]}
          contentContainerStyle={[
            defaultContentContainerStyle,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      );
    }

    return (
      <View style={[styles.container, containerStyle]}>
        {children}
      </View>
    );
  };

  const content = withKeyboardAvoidingView ? (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {renderContent()}
    </KeyboardAvoidingView>
  ) : (
    renderContent()
  );

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: colors.background }, containerStyle]}
      edges={safeAreaEdges}
    >
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
}); 