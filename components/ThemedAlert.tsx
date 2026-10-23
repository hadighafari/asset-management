// ============================================================
//  ThemedAlert - آلرت تم‌دار با پشتیبانی RTL
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_FAMILY } from '../constants/theme';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react-native';

type AlertType = 'success' | 'warning' | 'danger' | 'info';

interface ThemedAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  dismissable?: boolean;
}

const ALERT_CONFIG: Record<
  AlertType,
  { color: string; bg: string; icon: any }
> = {
  success: { color: COLORS.success, bg: COLORS.successBg, icon: CheckCircle2 },
  warning: { color: COLORS.warning, bg: COLORS.warningBg, icon: AlertTriangle },
  danger: { color: COLORS.danger, bg: COLORS.dangerBg, icon: XCircle },
  info: { color: COLORS.info, bg: COLORS.infoBg, icon: Info },
};

export function ThemedAlert({
  visible,
  type = 'info',
  title,
  message,
  confirmText = 'تأیید',
  cancelText,
  onConfirm,
  onCancel,
  onDismiss,
  dismissable = true,
}: ThemedAlertProps) {
  const config = ALERT_CONFIG[type];
  const Icon = config.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={dismissable ? onDismiss : undefined}
      >
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
              <Icon size={28} color={config.color} />
            </View>
            {dismissable && onDismiss && (
              <TouchableOpacity
                onPress={onDismiss}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            {cancelText && onCancel && (
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onCancel}
              >
                <Text style={styles.btnSecondaryText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: config.color }]}
              onPress={onConfirm}
            >
              <Text style={styles.btnPrimaryText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: FONT_SIZE.title3,
    color: COLORS.textPrimary,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  message: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: FONT_SIZE.body,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row-reverse',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  btn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.gold,
  },
  btnSecondary: {
    backgroundColor: COLORS.backgroundElevated,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  btnPrimaryText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: FONT_SIZE.body,
    color: COLORS.textOnGold,
  },
  btnSecondaryText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: FONT_SIZE.body,
    color: COLORS.textPrimary,
  },
});
