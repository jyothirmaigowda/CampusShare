import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { NotificationCenter } from '@/components/feature/NotificationCenter';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { formatTimeAgo } from '@/services/backend';

const NOTICE_TABS = ['Notices', 'Notifications'] as const;
type NoticeTab = typeof NOTICE_TABS[number];

export default function NoticesScreen() {
  const { user } = useAuth();
  const { notices, notifications, unreadCount, isLoading, loadNotices, loadNotifications, markRead, markAllRead, removeNotification } = useAppData();
  const [activeTab, setActiveTab] = useState<NoticeTab>('Notices');
  const [showNotifCenter, setShowNotifCenter] = useState(false);

  useEffect(() => {
    loadNotices();
    if (user?.id) loadNotifications(user.id);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notices</Text>
          <Text style={styles.subtitle}>{notices.filter(n => n.isUrgent).length} urgent</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowNotifCenter(true)}
          style={[styles.bellBtn, unreadCount > 0 && styles.bellBtnActive]}
        >
          <MaterialIcons name="notifications" size={24} color={unreadCount > 0 ? Colors.primary : Colors.textMuted} />
          {unreadCount > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {NOTICE_TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab === t && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            {t === 'Notifications' && unreadCount > 0 ? (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{unreadCount}</Text></View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Notices' ? (
        <FlatList
          data={notices}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadNotices} tintColor={Colors.primary} />}
          ListEmptyComponent={<EmptyState icon="campaign" title="No notices yet" subtitle="Campus announcements will appear here" />}
          renderItem={({ item: notice }) => (
            <GlassCard
              style={[styles.noticeCard, notice.isUrgent && styles.urgentCard]}
              glowColor={notice.isUrgent ? Colors.warning : Colors.primary}
            >
              {notice.isUrgent ? (
                <View style={styles.urgentBanner}>
                  <MaterialIcons name="warning" size={14} color={Colors.warning} />
                  <Text style={styles.urgentLabel}>URGENT</Text>
                </View>
              ) : null}
              <Text style={[styles.noticeTitle, notice.isUrgent && styles.urgentTitle]}>{notice.title}</Text>
              <Text style={styles.noticeContent}>{notice.content}</Text>
              <View style={styles.noticeFoot}>
                <View style={styles.postedBy}>
                  <MaterialIcons name="account-balance" size={12} color={Colors.textMuted} />
                  <Text style={styles.postedByText}>{notice.postedBy}</Text>
                </View>
                <Text style={styles.noticeTime}>{formatTimeAgo(notice.createdAt)}</Text>
              </View>
            </GlassCard>
          )}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => user?.id && loadNotifications(user.id)} tintColor={Colors.primary} />}
          ListHeaderComponent={
            unreadCount > 0 ? (
              <TouchableOpacity style={styles.markAllRow} onPress={() => user?.id && markAllRead(user.id)}>
                <MaterialIcons name="done-all" size={16} color={Colors.primary} />
                <Text style={styles.markAllText}>Mark all as read</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={<EmptyState icon="notifications-none" title="No notifications" subtitle="You are all caught up!" />}
          renderItem={({ item: notif }) => {
            const ICONS: Record<string, { icon: string; color: string }> = {
              borrow_approved: { icon: 'check-circle', color: Colors.neonGreen },
              borrow_rejected: { icon: 'cancel', color: Colors.danger },
              overdue_warning: { icon: 'warning', color: Colors.warning },
              trust_score_change: { icon: 'trending-up', color: Colors.primary },
              urgent_notice: { icon: 'campaign', color: Colors.warning },
              dispute_opened: { icon: 'report', color: Colors.danger },
              dispute_resolved: { icon: 'gavel', color: Colors.neonGreen },
              general: { icon: 'notifications', color: Colors.accent },
            };
            const cfg = ICONS[notif.type] || ICONS.general;
            return (
              <TouchableOpacity
                onPress={() => !notif.isRead && markRead(notif.id)}
                style={[styles.notifRow, !notif.isRead && styles.notifUnread]}
                activeOpacity={0.85}
              >
                <View style={[styles.notifIcon, { backgroundColor: cfg.color + '18' }]}>
                  <MaterialIcons name={cfg.icon as any} size={20} color={cfg.color} />
                </View>
                <View style={styles.notifBody}>
                  <View style={styles.notifTitleRow}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                    {!notif.isRead ? <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} /> : null}
                  </View>
                  <Text style={styles.notifMsg} numberOfLines={3}>{notif.body}</Text>
                  <Text style={styles.notifTime}>{formatTimeAgo(notif.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={() => removeNotification(notif.id)} hitSlop={8}>
                  <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <NotificationCenter
        visible={showNotifCenter}
        onClose={() => setShowNotifCenter(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={() => user?.id && markAllRead(user.id)}
        onDelete={removeNotification}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  bellBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  bellBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.danger, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.background,
  },
  bellBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  tabRow: {
    flexDirection: 'row', marginHorizontal: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.sm,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: Colors.primaryGlow, borderWidth: 1, borderColor: Colors.primary + '40' },
  tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.primaryLight, fontWeight: '600' },
  tabBadge: { backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  list: { padding: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  noticeCard: { },
  urgentCard: { borderColor: Colors.warning + '50' },
  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 8,
  },
  urgentLabel: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.warning, letterSpacing: 1.5 },
  noticeTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 8 },
  urgentTitle: { color: Colors.warning },
  noticeContent: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 24, marginBottom: 12 },
  noticeFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postedBy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postedByText: { fontSize: FontSize.xs, color: Colors.textMuted },
  noticeTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  markAllRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  markAllText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  notifUnread: { borderColor: Colors.primary + '50', backgroundColor: Colors.primaryGlow },
  notifIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifBody: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifMsg: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 6 },
  notifTime: { fontSize: FontSize.xs, color: Colors.textMuted },
});
