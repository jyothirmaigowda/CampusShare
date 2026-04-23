import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { AdminAnalytics } from '@/components/feature/AdminAnalytics';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { TrustScoreBar } from '@/components/ui/TrustScoreBar';
import { NeonButton } from '@/components/ui/NeonButton';
import { PostNoticeModal } from '@/components/feature/PostNoticeModal';
import { useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { Admin, getBadgeLevel, formatTimeAgo, Dispute } from '@/services/backend';

const ADMIN_TABS = ['Dashboard', 'Users', 'Notices', 'Disputes', 'Analytics'] as const;
type AdminTab = typeof ADMIN_TABS[number];

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: Colors.danger,
  under_review: Colors.warning,
  resolved: Colors.neonGreen,
  dismissed: Colors.textMuted,
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { students, borrows, notices, items, disputes, isLoading, loadAll, createNotice, unflagUser, resolveDispute } = useAppData();
  const { showAlert } = useAlert();
  const router = useRouter();
  const admin = user as Admin;

  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [showNotice, setShowNotice] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const flaggedUsers = students.filter(s => s.isFlagged);
  const overdueCount = borrows.filter(b => b.status === 'approved' && new Date() > new Date(b.dueDate)).length;
  const activeLoans = borrows.filter(b => b.status === 'approved').length;
  const openDisputes = disputes.filter(d => d.status === 'open').length;

  const filteredStudents = students.filter(s =>
    !userSearch.trim() ||
    s.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (s.usn || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  async function handlePostNotice(data: { title: string; content: string; isUrgent: boolean }) {
    try {
      await createNotice({ ...data, postedBy: admin.name });
      showAlert('Notice Posted', 'The notice has been published to all students.');
    } catch (err: any) {
      showAlert('Error', err.message);
    }
  }

  async function handleUnflag(userId: string) {
    showAlert('Confirm Unflag', 'Are you sure you want to clear this flag?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unflag', style: 'destructive', onPress: async () => {
        try { await unflagUser(userId); showAlert('Flag Cleared', 'The user account has been unflagged.'); }
        catch (err: any) { showAlert('Error', err.message); }
      }},
    ]);
  }

  async function handleResolveDispute(status: Dispute['status']) {
    if (!selectedDispute) return;
    setResolving(true);
    try {
      await resolveDispute(selectedDispute.id, status, adminNotes.trim() || undefined);
      setSelectedDispute(null);
      setAdminNotes('');
      showAlert('Dispute Updated', `Dispute has been marked as ${status}.`);
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setResolving(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  const stats = [
    { label: 'Total Students', value: students.length, icon: 'people' as const, color: Colors.accent },
    { label: 'Flagged Users', value: flaggedUsers.length, icon: 'flag' as const, color: Colors.danger },
    { label: 'Active Loans', value: activeLoans, icon: 'swap-horiz' as const, color: Colors.primary },
    { label: 'Overdue Items', value: overdueCount, icon: 'warning' as const, color: Colors.warning },
    { label: 'Open Disputes', value: openDisputes, icon: 'gavel' as const, color: Colors.danger },
    { label: 'Notices Posted', value: notices.length, icon: 'campaign' as const, color: Colors.primaryLight },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Admin Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <MaterialIcons name="admin-panel-settings" size={22} color={Colors.warning} />
          </View>
          <View>
            <Text style={styles.adminTitle}>ADMIN PANEL</Text>
            <Text style={styles.adminName}>{admin?.name}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <MaterialIcons name="logout" size={20} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {ADMIN_TABS.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {tab === 'Users' && flaggedUsers.length > 0 ? (
                <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{flaggedUsers.length}</Text></View>
              ) : null}
              {tab === 'Disputes' && openDisputes > 0 ? (
                <View style={[styles.tabBadge, { backgroundColor: Colors.danger }]}><Text style={styles.tabBadgeText}>{openDisputes}</Text></View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAll} tintColor={Colors.primary} />}
      >
        {/* ── DASHBOARD ── */}
        {activeTab === 'Dashboard' ? (
          <>
            <Text style={styles.sectionTitle}>Platform Overview</Text>
            <View style={styles.statsGrid}>
              {stats.map(stat => (
                <GlassCard key={stat.label} style={styles.statCard} glowColor={stat.color}>
                  <MaterialIcons name={stat.icon} size={22} color={stat.color} />
                  <Text style={[styles.statVal, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </GlassCard>
              ))}
            </View>

            {flaggedUsers.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Flagged Users Alert</Text>
                {flaggedUsers.map(s => (
                  <GlassCard key={s.id} style={styles.alertCard} glowColor={Colors.danger}>
                    <View style={styles.alertHeader}>
                      <MaterialIcons name="flag" size={18} color={Colors.danger} />
                      <Text style={styles.alertName}>{s.name}</Text>
                      <Text style={styles.alertUsn}>{s.usn}</Text>
                    </View>
                    <Text style={styles.alertReason}>{s.flagReason}</Text>
                    <NeonButton label="Clear Flag" onPress={() => handleUnflag(s.id)} variant="outline" size="sm" style={{ marginTop: Spacing.sm }} />
                  </GlassCard>
                ))}
              </>
            ) : null}

            {openDisputes > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Open Disputes ({openDisputes})</Text>
                {disputes.filter(d => d.status === 'open').slice(0, 3).map(d => (
                  <GlassCard key={d.id} style={styles.alertCard} glowColor={Colors.danger} onPress={() => setSelectedDispute(d)}>
                    <View style={styles.alertHeader}>
                      <MaterialIcons name="gavel" size={18} color={Colors.danger} />
                      <Text style={styles.alertName} numberOfLines={1}>{d.itemTitle}</Text>
                    </View>
                    <Text style={styles.alertReason}>By {d.raisedByName} against {d.againstUserName}</Text>
                    <Text style={styles.alertReason}>{d.reason.replace(/_/g, ' ')}</Text>
                  </GlassCard>
                ))}
              </>
            ) : null}

            <NeonButton label="Post New Notice" onPress={() => setShowNotice(true)} variant="accent" fullWidth style={{ marginBottom: Spacing.xl }} />
          </>
        ) : null}

        {/* ── USERS ── */}
        {activeTab === 'Users' ? (
          <>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, USN, email..."
                placeholderTextColor={Colors.textMuted}
                value={userSearch}
                onChangeText={setUserSearch}
              />
              {userSearch ? <TouchableOpacity onPress={() => setUserSearch('')}><MaterialIcons name="close" size={16} color={Colors.textMuted} /></TouchableOpacity> : null}
            </View>
            <Text style={styles.sectionTitle}>All Students ({filteredStudents.length})</Text>
            {filteredStudents.map(s => {
              const badge = getBadgeLevel(s.rewardPoints);
              return (
                <GlassCard key={s.id} style={styles.userCard} glowColor={s.isFlagged ? Colors.danger : Colors.primary}>
                  <View style={styles.userHeader}>
                    <View>
                      <Text style={styles.userName}>{s.name}</Text>
                      <Text style={styles.userUsn}>{s.usn} · {s.email}</Text>
                    </View>
                    <Badge label={badge.label} color={badge.color} size="sm" />
                  </View>
                  <TrustScoreBar score={s.trustScore} compact />
                  <View style={styles.userStats}>
                    <Text style={styles.userStat}><Text style={{ color: Colors.primary }}>{s.rewardPoints} pts</Text> reward</Text>
                    {s.isFlagged ? (
                      <View style={styles.flaggedBadge}>
                        <MaterialIcons name="flag" size={12} color={Colors.danger} />
                        <Text style={styles.flaggedText}>FLAGGED</Text>
                      </View>
                    ) : (
                      <View style={styles.okBadge}>
                        <MaterialIcons name="check" size={12} color={Colors.neonGreen} />
                        <Text style={styles.okText}>OK</Text>
                      </View>
                    )}
                  </View>
                  {s.isFlagged ? <NeonButton label="Clear Flag" onPress={() => handleUnflag(s.id)} variant="outline" size="sm" style={{ marginTop: Spacing.sm }} /> : null}
                </GlassCard>
              );
            })}
          </>
        ) : null}

        {/* ── NOTICES ── */}
        {activeTab === 'Notices' ? (
          <>
            <NeonButton label="+ Post New Notice" onPress={() => setShowNotice(true)} variant="primary" fullWidth style={{ marginBottom: Spacing.md }} />
            <Text style={styles.sectionTitle}>All Notices ({notices.length})</Text>
            {notices.map(n => (
              <GlassCard key={n.id} style={[styles.noticeCard, n.isUrgent && styles.urgentNotice]} glowColor={n.isUrgent ? Colors.warning : Colors.primary}>
                <View style={styles.noticeTop}>
                  <Text style={[styles.noticeTitle, n.isUrgent && { color: Colors.warning }]} numberOfLines={1}>{n.title}</Text>
                  {n.isUrgent ? <Badge label="URGENT" color={Colors.warning} size="sm" /> : null}
                </View>
                <Text style={styles.noticeContent} numberOfLines={2}>{n.content}</Text>
                <Text style={styles.noticeTime}>{formatTimeAgo(n.createdAt)}</Text>
              </GlassCard>
            ))}
          </>
        ) : null}

        {/* ── DISPUTES ── */}
        {activeTab === 'Disputes' ? (
          <>
            <Text style={styles.sectionTitle}>All Disputes ({disputes.length})</Text>
            {disputes.length === 0 ? <Text style={styles.emptyText}>No disputes filed yet</Text> : null}
            {disputes.map(d => (
              <GlassCard key={d.id} style={styles.disputeCard} glowColor={DISPUTE_STATUS_COLORS[d.status]} onPress={() => setSelectedDispute(d)}>
                <View style={styles.disputeTop}>
                  <Text style={styles.disputeItem} numberOfLines={1}>{d.itemTitle}</Text>
                  <View style={[styles.statusPill, { backgroundColor: DISPUTE_STATUS_COLORS[d.status] + '22' }]}>
                    <Text style={[styles.statusText, { color: DISPUTE_STATUS_COLORS[d.status] }]}>{d.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.disputeMeta}>By <Text style={{ color: Colors.textPrimary }}>{d.raisedByName}</Text> against <Text style={{ color: Colors.textPrimary }}>{d.againstUserName}</Text></Text>
                <Text style={styles.disputeReason}>{d.reason.replace(/_/g, ' ')}</Text>
                <Text style={styles.disputeTime}>{formatTimeAgo(d.createdAt)}</Text>
              </GlassCard>
            ))}
          </>
        ) : null}

        {/* ── ANALYTICS ── */}
        {activeTab === 'Analytics' ? (
          <AdminAnalytics students={students} items={items} borrows={borrows} />
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      <PostNoticeModal visible={showNotice} onClose={() => setShowNotice(false)} onSubmit={handlePostNotice} />

      {/* Dispute Detail Modal */}
      <Modal visible={!!selectedDispute} animationType="slide" onRequestClose={() => setSelectedDispute(null)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedDispute(null)} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Dispute Detail</Text>
          </View>
          {selectedDispute ? (
            <ScrollView style={styles.modalScroll}>
              <GlassCard style={{ marginBottom: Spacing.md }} glowColor={Colors.danger}>
                <Text style={styles.disputeDetailItem}>{selectedDispute.itemTitle}</Text>
                <View style={styles.disputeParties}>
                  <View style={styles.partyRow}>
                    <MaterialIcons name="person" size={16} color={Colors.danger} />
                    <Text style={styles.partyLabel}>Filed by:</Text>
                    <Text style={styles.partyName}>{selectedDispute.raisedByName}</Text>
                  </View>
                  <View style={styles.partyRow}>
                    <MaterialIcons name="person-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.partyLabel}>Against:</Text>
                    <Text style={styles.partyName}>{selectedDispute.againstUserName}</Text>
                  </View>
                </View>
                <View style={styles.reasonRow}>
                  <Text style={styles.reasonLabel}>Reason:</Text>
                  <Text style={styles.reasonValue}>{selectedDispute.reason.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.disputeDesc}>{selectedDispute.description}</Text>
                <View style={[styles.statusPill, { backgroundColor: DISPUTE_STATUS_COLORS[selectedDispute.status] + '22', alignSelf: 'flex-start', marginTop: 8 }]}>
                  <Text style={[styles.statusText, { color: DISPUTE_STATUS_COLORS[selectedDispute.status] }]}>{selectedDispute.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </GlassCard>

              {selectedDispute.status === 'open' || selectedDispute.status === 'under_review' ? (
                <GlassCard>
                  <Text style={styles.adminNotesLabel}>Admin Notes (optional)</Text>
                  <TextInput
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    placeholder="Add notes for both parties..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                    style={styles.adminNotesInput}
                    textAlignVertical="top"
                  />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: Spacing.md }}>
                    <TouchableOpacity
                      onPress={() => handleResolveDispute('under_review')}
                      style={[styles.reviewBtn, { flex: 1 }]}
                      disabled={resolving}
                    >
                      <Text style={styles.reviewBtnText}>Under Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleResolveDispute('dismissed')}
                      style={[styles.dismissBtn, { flex: 1 }]}
                      disabled={resolving}
                    >
                      <Text style={styles.dismissBtnText}>Dismiss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleResolveDispute('resolved')}
                      style={[styles.resolveBtn, { flex: 1 }]}
                      disabled={resolving}
                    >
                      <Text style={styles.resolveBtnText}>Resolve</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ) : (
                selectedDispute.adminNotes ? (
                  <GlassCard>
                    <Text style={styles.adminNotesLabel}>Admin Notes</Text>
                    <Text style={styles.disputeDesc}>{selectedDispute.adminNotes}</Text>
                  </GlassCard>
                ) : null
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  adminBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.warningGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.warning + '50' },
  adminTitle: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '700', letterSpacing: 1 },
  adminName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  logoutBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.dangerGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger + '40' },
  tabScroll: { borderBottomWidth: 1, borderColor: Colors.border, maxHeight: 52 },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingVertical: Spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  tabActive: { borderColor: Colors.warning, backgroundColor: Colors.warningGlow },
  tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.warning, fontWeight: '600' },
  tabBadge: { backgroundColor: Colors.warning, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  scroll: { flex: 1, paddingHorizontal: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  statCard: { width: '47.5%', alignItems: 'center', gap: 4, paddingVertical: Spacing.md },
  statVal: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  alertCard: { marginBottom: Spacing.sm },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  alertName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  alertUsn: { fontSize: FontSize.xs, color: Colors.textMuted },
  alertReason: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, height: 42, marginTop: Spacing.sm, marginBottom: 4,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  userCard: { marginBottom: Spacing.sm },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  userName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary },
  userUsn: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  userStats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  userStat: { fontSize: FontSize.sm, color: Colors.textMuted },
  flaggedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.dangerGlow, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  flaggedText: { fontSize: FontSize.xs, color: Colors.danger, fontWeight: '700' },
  okBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.neonGreenGlow, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  okText: { fontSize: FontSize.xs, color: Colors.neonGreen, fontWeight: '700' },
  noticeCard: { marginBottom: Spacing.sm },
  urgentNotice: { borderColor: Colors.warning + '50' },
  noticeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  noticeTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  noticeContent: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4, lineHeight: 20 },
  noticeTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  disputeCard: { marginBottom: Spacing.sm },
  disputeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  disputeItem: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  disputeMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 2 },
  disputeReason: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize', marginBottom: 4 },
  disputeTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyText: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border },
  modalTitle: { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalScroll: { flex: 1, padding: Spacing.md },
  disputeDetailItem: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  disputeParties: { gap: 6, marginBottom: Spacing.sm },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partyLabel: { fontSize: FontSize.sm, color: Colors.textMuted, width: 60 },
  partyName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  reasonLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  reasonValue: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'capitalize', flex: 1 },
  disputeDesc: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
  adminNotesLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  adminNotesInput: { backgroundColor: Colors.inputBg, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.inputBorder, color: Colors.textPrimary, fontSize: FontSize.base, padding: Spacing.md, minHeight: 100 },
  reviewBtn: { padding: 10, borderRadius: Radius.md, backgroundColor: Colors.warning + '22', borderWidth: 1, borderColor: Colors.warning + '50', alignItems: 'center' },
  reviewBtnText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '700' },
  dismissBtn: { padding: 10, borderRadius: Radius.md, backgroundColor: Colors.textMuted + '22', borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  dismissBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '700' },
  resolveBtn: { padding: 10, borderRadius: Radius.md, backgroundColor: Colors.neonGreen + '22', borderWidth: 1, borderColor: Colors.neonGreen + '50', alignItems: 'center' },
  resolveBtnText: { fontSize: FontSize.xs, color: Colors.neonGreen, fontWeight: '700' },
});
