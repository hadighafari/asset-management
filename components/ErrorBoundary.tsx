// ============================================================
//  ErrorBoundary - جلوگیری از crash کامل اپ
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../constants/colors';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('[ErrorBoundary]', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>خطایی رخ داد</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'یک خطای ناشناخته رخ داد'}
          </Text>
          <Text style={styles.hint}>
            اگر مشکل persisted، اپ را ببندید و دوباره باز کنید
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRestart}
          >
            <Text style={styles.buttonText}>تلاش مجدد</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    color: colors.dark.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontSize: 11,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.dark.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.background,
  },
});
