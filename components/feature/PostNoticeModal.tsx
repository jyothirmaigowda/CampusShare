import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Switch, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

interface PostNoticeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; isUrgent: boolean }) => Promise<void>;
}

export const PostNoticeModal = memo(function PostNoticeModal({ visible, onClose, onSubmit }: PostNoticeModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), isUrgent });
      setTitle(''); setContent(''); setIsUrgent(false);
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
              <Text style={styles.title}>Post Notice</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={Colors.textMuted} />
              </Pressable>
            </View>

            <NeonInput label="Notice Title" value={title} onChangeText={setTitle} placeholder="Enter notice title..." />
            <NeonInput label="Content" value={content} onChangeText={setContent} placeholder="Enter notice content..." multiline numberOfLines={5} />

            <View style={styles.urgentRow}>
              <View>
                <Text style={styles.urgentLabel}>Mark as Urgent</Text>
                <Text style={styles.urgentSub}>Urgent notices appear highlighted at the top</Text>
              </View>
              <Switch
                value={isUrgent}
                onValueChange={setIsUrgent}
                trackColor={{ false: Colors.border, true: Colors.warning + '66' }}
                thumbColor={isUrgent ? Colors.warning : Colors.textMuted}
              />
            </View>

            <NeonButton label="Post Notice" onPress={handleSubmit} loading={loading} fullWidth style={{ marginTop: Spacing.md }} />
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
  urgentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.warningGlow, borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.warning + '30', marginBottom: Spacing.sm,
  },
  urgentLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  urgentSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
