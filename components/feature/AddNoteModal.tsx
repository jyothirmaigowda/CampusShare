import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const SEMESTERS = ['1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; subject: string; description: string; semester: string }) => Promise<void>;
}

export const AddNoteModal = memo(function AddNoteModal({ visible, onClose, onSubmit }: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('3rd Sem');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !subject.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), subject: subject.trim(), description: description.trim(), semester });
      setTitle(''); setSubject(''); setDescription(''); setSemester('3rd Sem');
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
              <Text style={styles.title}>Share Notes</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </Pressable>
            </View>

            <NeonInput label="Note Title" value={title} onChangeText={setTitle} placeholder="e.g. Data Structures Module 2" />
            <NeonInput label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Data Structures & Algorithms" />
            <NeonInput label="Description" value={description} onChangeText={setDescription} placeholder="What topics are covered?" multiline numberOfLines={3} />

            <Text style={styles.catLabel}>Semester</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.semRow}>
                {SEMESTERS.map(sem => (
                  <TouchableOpacity
                    key={sem}
                    onPress={() => setSemester(sem)}
                    style={[styles.semChip, semester === sem && styles.semChipActive]}
                  >
                    <Text style={[styles.semText, semester === sem && styles.semTextActive]}>{sem}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <NeonButton label="Share Notes" onPress={handleSubmit} loading={loading} fullWidth style={{ marginTop: Spacing.lg }} />
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
  semRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  semChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  semChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  semText: { fontSize: FontSize.sm, color: Colors.textSecondary, whiteSpace: 'nowrap' },
  semTextActive: { color: Colors.accentLight, fontWeight: '600' },
});
