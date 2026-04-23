import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { Item } from '@/services/backend';

interface BorrowRequestModalProps {
  visible: boolean;
  item: Item | null;
  onClose: () => void;
  onSubmit: (days: number) => Promise<void>;
}

export const BorrowRequestModal = memo(function BorrowRequestModal({
  visible, item, onClose, onSubmit,
}: BorrowRequestModalProps) {
  const [days, setDays] = useState('3');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const d = parseInt(days, 10);
    if (!d || d < 1 || d > 30) return;
    setLoading(true);
    try {
      await onSubmit(d);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Borrow Request</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDeposit}>Deposit: ₹{item.deposit}</Text>
          </View>

          <NeonInput
            label="Borrow Duration (days)"
            value={days}
            onChangeText={setDays}
            keyboardType="numeric"
            placeholder="Enter number of days (1-30)"
          />

          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={16} color={Colors.accent} />
            <Text style={styles.infoText}>
              Return on time to earn +10 trust score and +10 reward points. Late return will flag your account.
            </Text>
          </View>

          <NeonButton label="Send Request" onPress={handleSubmit} loading={loading} fullWidth />
          <NeonButton label="Cancel" onPress={onClose} variant="ghost" fullWidth style={{ marginTop: Spacing.sm }} />
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  itemInfo: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  itemTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  itemDeposit: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.accentGlow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.accentLight, lineHeight: 20 },
});
