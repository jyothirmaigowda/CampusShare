import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const CATEGORIES = ['Electronics', 'Lab Equipment', 'Stationery', 'Books', 'Sports', 'Other'];

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; deposit: number; category: string }) => Promise<void>;
}

export const AddItemModal = memo(function AddItemModal({ visible, onClose, onSubmit }: AddItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deposit, setDeposit] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !deposit) return;
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), deposit: parseInt(deposit, 10), category });
      setTitle(''); setDescription(''); setDeposit(''); setCategory('Electronics');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>List an Item</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </Pressable>
            </View>

            <NeonInput label="Item Title" value={title} onChangeText={setTitle} placeholder="e.g. Scientific Calculator" />
            <NeonInput label="Description" value={description} onChangeText={setDescription} placeholder="Describe the item..." multiline numberOfLines={3} />
            <NeonInput label="Deposit Amount (₹)" value={deposit} onChangeText={setDeposit} keyboardType="numeric" placeholder="e.g. 200" />

            <Text style={styles.catLabel}>Category</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <NeonButton label="List Item" onPress={handleSubmit} loading={loading} fullWidth style={{ marginTop: Spacing.md }} />
            <NeonButton label="Cancel" onPress={onClose} variant="ghost" fullWidth style={{ marginTop: Spacing.sm }} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, paddingBottom: 40,
    borderTopWidth: 1, borderColor: Colors.border,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  catLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  catText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  catTextActive: { color: Colors.primaryLight, fontWeight: '600' },
});
