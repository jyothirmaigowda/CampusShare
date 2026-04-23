import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { GlassCard } from '@/components/ui/GlassCard';
import { TrustScoreBar } from '@/components/ui/TrustScoreBar';
import { Badge } from '@/components/ui/Badge';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { getBadgeLevel, formatTimeAgo, Student } from '@/services/backend';

export default function HomeScreen() {
  const { user } = useAuth();
  const { items, borrows, notices, isLoading, loadAll, setCurrentUserId } = useAppData();
  const student = user as Student;

  useEffect(() => {
    loadAll();
    if (user?.id) setCurrentUserId(user.id);
  }, [user?.id]);

  const myActiveBorrows = borrows.filter(b => b.borrowerId === user?.id && b.status === 'approved');
  const pendingRequests = borrows.filter(b => b.ownerId === user?.id && b.status === 'pending');
  const urgentNotice = notices.find(n => n.isUrgent);
  const badge = getBadgeLevel(student?.rewardPoints || 0);

  const stats = [
    { label: 'Active Borrows', value: myActiveBorrows.length, icon: 'swap-horiz' as const, color: Colors.accent },
    { label: 'Pending Requests', value: pendingRequests.length, icon: 'pending' as const, color: Colors.warning },
    { label: 'Reward Points', value: student?.rewardPoints || 0, icon: 'stars' as const, color: Colors.primary },
    { label: 'Items Listed', value: items.filter(i => i.ownerId === user?.id).length, icon: 'inventory-2' as const, color: Colors.neonGreen },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadAll} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{student?.name?.split(' ')[0] || 'Student'} 👋</Text>
          </View>
          <View style={styles.badgeWrap}>
            <Badge label={badge.label} color={badge.color} />
          </View>
        </View>

        {/* Trust Score Card */}
        <GlassCard style={styles.trustCard} glowColor={Colors.primary}>
          <View style={styles.trustHeader}>
            <View>
              <Text style={styles.trustTitle}>Your Trust Score</Text>
              <Text style={styles.trustSub}>USN: {student?.usn || 'N/A'}</Text>
            </View>
            <View style={[styles.scoreCircle, { borderColor: student?.trustScore >= 70 ? Colors.neonGreen : student?.trustScore >= 40 ? Colors.warning : Colors.danger }]}>
              <Text style={[styles.scoreNum, { color: student?.trustScore >= 70 ? Colors.neonGreen : student?.trustScore >= 40 ? Colors.warning : Colors.danger }]}>
                {student?.trustScore || 100}
              </Text>
            </View>
          </View>
          <TrustScoreBar score={student?.trustScore || 100} showLabel={false} />
          {student?.isFlagged ? (
            <View style={styles.flagBanner}>
              <MaterialIcons name="flag" size={16} color={Colors.danger} />
              <Text style={styles.flagText}>Account Flagged: {student.flagReason || 'Overdue item'}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Urgent Notice */}
        {urgentNotice ? (
          <GlassCard style={styles.urgentCard} glowColor={Colors.warning}>
            <View style={styles.urgentHeader}>
              <MaterialIcons name="warning" size={18} color={Colors.warning} />
              <Text style={styles.urgentTag}>URGENT NOTICE</Text>
            </View>
            <Text style={styles.urgentTitle}>{urgentNotice.title}</Text>
            <Text style={styles.urgentContent} numberOfLines={2}>{urgentNotice.content}</Text>
          </GlassCard>
        ) : null}

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <GlassCard key={stat.label} style={styles.statCard} glowColor={stat.color}>
              <MaterialIcons name={stat.icon} size={24} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </GlassCard>
          ))}
        </View>

        {/* Recent Borrows */}
        {myActiveBorrows.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Borrows</Text>
            {myActiveBorrows.slice(0, 3).map(b => (
              <GlassCard key={b.id} style={styles.borrowRow}>
                <View style={styles.borrowInfo}>
                  <MaterialIcons name="swap-horiz" size={20} color={Colors.accent} />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={styles.borrowTitle} numberOfLines={1}>{b.itemTitle}</Text>
                    <Text style={styles.borrowDue}>Due: {new Date(b.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                </View>
                {new Date() > new Date(b.dueDate) ? (
                  <Badge label="Overdue" color={Colors.danger} size="sm" />
                ) : (
                  <Badge label="Active" color={Colors.neonGreen} size="sm" />
                )}
              </GlassCard>
            ))}
          </View>
        ) : null}

        {/* Pending Requests */}
        {pendingRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests for Your Items</Text>
            {pendingRequests.slice(0, 2).map(b => (
              <GlassCard key={b.id} style={styles.borrowRow}>
                <View style={styles.borrowInfo}>
                  <MaterialIcons name="pending" size={20} color={Colors.warning} />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={styles.borrowTitle} numberOfLines={1}>{b.itemTitle}</Text>
                    <Text style={styles.borrowDue}>{formatTimeAgo(b.requestedAt)}</Text>
                  </View>
                </View>
                <Badge label="Pending" color={Colors.warning} size="sm" />
              </GlassCard>
            ))}
          </View>
        ) : null}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: Spacing.md, marginBottom: Spacing.md },
  greeting: { fontSize: FontSize.base, color: Colors.textMuted },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  badgeWrap: { paddingTop: 4 },
  trustCard: { marginBottom: Spacing.md },
  trustHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  trustTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  trustSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  scoreCircle: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  flagBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.dangerGlow, borderRadius: 8,
    padding: Spacing.sm, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.danger + '40',
  },
  flagText: { fontSize: FontSize.xs, color: Colors.danger, flex: 1 },
  urgentCard: { marginBottom: Spacing.md },
  urgentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  urgentTag: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.warning, letterSpacing: 1 },
  urgentTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  urgentContent: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  statCard: { width: '47.5%', alignItems: 'center', gap: 4, paddingVertical: Spacing.md },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  section: { marginBottom: Spacing.md },
  borrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  borrowInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm },
  borrowTitle: { fontSize: FontSize.base, fontWeight: '500', color: Colors.textPrimary },
  borrowDue: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
