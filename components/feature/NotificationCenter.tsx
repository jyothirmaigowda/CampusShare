import React, { memo } from 'react';
import {
  View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { AppNotification, formatTimeAgo } from '@/services/backend';

const NOTIF_CONFIG: Record<AppNotification['type'], { icon: string; color: string; label: string }> = {
  borrow_approved: { icon: 'check-circle', color: Colors.neonGreen, label: 'Approved' },
  borrow_rejected: { icon: 'cancel', color: Colors.danger, label: 'Rejected' },
  overdue_warning: { icon: 'warning', color: Colors.warning, label: 'Overdue' },
  trust_score_change: { icon: 'trending-down', color: Colors.danger, label: 'Trust Score' },
  urgent_notice: { icon: 'campaign', color: Colors.warning, label: 'Urgent' },
  dispute_opened: { icon: 'report', color: Colors.danger, label: 'Dispute' },
  dispute_resolved: { icon: 'gavel', color: Colors.neonGreen, label: 'Resolved' },
  general: { icon: 'notifications', color: Colors.accent, label: 'Info' },
};

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
}

export const NotificationCenter = memo(function NotificationCenter({
  visible, onClose, notifications, onMarkRead, onMarkAllRead, onDelete,
}: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 ? (
              <Text style={styles.subtitle}>{unreadCount} unread</Text>
            ) : null}
          </View>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={onMarkAllRead} style={styles.markAllBtn}>
              <MaterialIcons name="done-all" size={20} color={Colors.primary} />
              <Text style={styles.markAllText}>All Read</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 80 }} />}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="notifications-none" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>All clear!</Text>
              <Text style={styles.emptySub}>You have no notifications right now.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cfg = NOTIF_CONFIG[item.type] || NOTIF_CONFIG.general;
            return (
              <Pressable
                onPress={() => !item.isRead && onMarkRead(item.id)}
                style={({ pressed }) => [styles.notifCard, !item.isRead && styles.notifUnread, pressed && { opacity: 0.85 }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
                  <MaterialIcons name={cfg.icon as any} size={22} color={cfg.color} />
                </View>
                <View style={styles.notifBody}>
                  <View style={styles.notifTop}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {!item.isRead ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <Text style={styles.notifMsg}>{item.body}</Text>
                  <View style={styles.notifFooter}>
                    <View style={[styles.typePill, { backgroundColor: cfg.color + '18' }]}>
                      <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.notifTime}>{formatTimeAgo(item.createdAt)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteBtn} hitSlop={8}>
                  <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </Pressable>
            );
          }}
        />
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
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.primary + '40', backgroundColor: Colors.primaryGlow },
  markAllText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  notifUnread: {
    borderColor: Colors.primary + '50',
    backgroundColor: Colors.primaryGlow,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1 },
  notifTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMsg: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  typeLabel: { fontSize: FontSize.xs, fontWeight: '700' },
  notifTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  deleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center' },
});
