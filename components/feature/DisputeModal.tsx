import React, { useState, memo } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { BorrowRecord } from '@/services/backend';

const DISPUTE_REASONS = [
  { key: 'item_damaged', label: 'Item Damaged', icon: 'broken-image' },
  { key: 'item_not_returned', label: 'Item Not Returned', icon: 'block' },
  { key: 'wrong_item', label: 'Wrong Item Received', icon: 'swap-horiz' },
  { key: 'deposit_issue', label: 'Deposit Issue', icon: 'attach-money' },
  { key: 'harassment', label: 'Harassment', icon: 'report' },
  { key: 'other', label: 'Other', icon: 'more-horiz' },
];

interface DisputeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
  borrow: BorrowRecord | null;
  againstUserName: string;
}

export const DisputeModal = memo(function DisputeModal({
  visible, onClose, onSubmit, borrow, againstUserName,
}: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!reason || !description.trim()) return;
    setLoading(true);
    try {
      await onSubmit(reason, description.trim());
      setReason('');
      setDescription('');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <MaterialIcons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>File Dispute</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <GlassCard style={styles.infoCard} glowColor={Colors.danger}>
              <View style={styles.infoRow}>
                <MaterialIcons name="gavel" size={20} color={Colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Dispute Against</Text>
                  <Text style={styles.infoValue}>{againstUserName}</Text>
                </View>
              </View>
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <MaterialIcons name="inventory-2" size={20} color={Colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Item</Text>
                  <Text style={styles.infoValue}>{borrow?.itemTitle}</Text>
                </View>
              </View>
            </GlassCard>

            <Text style={styles.sectionLabel}>Select Reason</Text>
            <View style={styles.reasonGrid}>
              {DISPUTE_REASONS.map(r => (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setReason(r.key)}
                  style={[styles.reasonChip, reason === r.key && styles.reasonChipActive]}
                >
                  <MaterialIcons name={r.icon as any} size={18} color={reason === r.key ? Colors.danger : Colors.textMuted} />
                  <Text style={[styles.reasonText, reason === r.key && styles.reasonTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <NeonInput
              label="Describe the issue"
              value={description}
              onChangeText={setDescription}
              placeholder="Provide details about the dispute..."
              multiline
              numberOfLines={5}
            />

            <View style={styles.warningBox}>
              <MaterialIcons name="info" size={16} color={Colors.warning} />
              <Text style={styles.warningText}>Disputes are reviewed by campus admin. Filing false disputes may affect your trust score.</Text>
            </View>

            <NeonButton
              label="Submit Dispute"
              onPress={handleSubmit}
              loading={loading}
              variant="danger"
              fullWidth
              disabled={!reason || !description.trim()}
              style={{ marginBottom: Spacing.xl }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  scroll: { flex: 1, padding: Spacing.md },
  infoCard: { marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  infoValue: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary },
  sectionLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  reasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  reasonChipActive: { borderColor: Colors.danger, backgroundColor: Colors.dangerGlow },
  reasonText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  reasonTextActive: { color: Colors.danger, fontWeight: '600' },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.warningGlow, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.warning + '30',
  },
  warningText: { flex: 1, fontSize: FontSize.sm, color: Colors.warning, lineHeight: 20 },
});
