import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { GlassCard } from '@/components/ui/GlassCard';
import { TrustScoreBar } from '@/components/ui/TrustScoreBar';
import { Badge } from '@/components/ui/Badge';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { getBadgeLevel, Student, formatDate } from '@/services/backend';

const BADGE_ICONS = { Elite: 'emoji-events', Trusted: 'verified', Beginner: 'school' } as const;

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { borrows, loadBorrows, isLoading } = useAppData();
  const router = useRouter();
  const student = user as Student;
  const badge = getBadgeLevel(student?.rewardPoints || 0);
  const badgeIcon = BADGE_ICONS[badge.label as keyof typeof BADGE_ICONS] || 'school';

  useEffect(() => {
    loadBorrows();
    refreshUser();
  }, []);

  const myBorrows = borrows.filter(b => b.borrowerId === user?.id);
  const successfulReturns = myBorrows.filter(b => b.status === 'returned').length;
  const activeBorrows = myBorrows.filter(b => b.status === 'approved').length;

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { loadBorrows(); refreshUser(); }} tintColor={Colors.primary} />}
      >
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrap}>
            <Image source={require('@/assets/images/avatar_default.png')} style={styles.avatar} contentFit="cover" />
            <View style={[styles.badgeCircle, { backgroundColor: badge.color + '22', borderColor: badge.color }]}>
              <MaterialIcons name={badgeIcon} size={16} color={badge.color} />
            </View>
          </View>
          <Text style={styles.profileName}>{student?.name || 'Student'}</Text>
          <Text style={styles.profileEmail}>{student?.email}</Text>
          <Text style={styles.profileUsn}>USN: {student?.usn}</Text>
          <Badge label={badge.label} color={badge.color} />
        </View>

        <View style={styles.content}>
          {/* Flag Warning */}
          {student?.isFlagged ? (
            <GlassCard style={styles.flagCard} glowColor={Colors.danger}>
              <View style={styles.flagHeader}>
                <MaterialIcons name="flag" size={20} color={Colors.danger} />
                <Text style={styles.flagTitle}>Account Flagged</Text>
              </View>
              <Text style={styles.flagDesc}>{student.flagReason || 'Your account has been flagged.'}</Text>
              <Text style={styles.flagHint}>Return overdue items to clear your flag.</Text>
            </GlassCard>
          ) : null}

          {/* Trust & Rewards */}
          <GlassCard style={styles.section} glowColor={Colors.primary}>
            <Text style={styles.sectionTitle}>Trust & Rewards</Text>
            <TrustScoreBar score={student?.trustScore || 100} />
            <View style={styles.rewardsRow}>
              <View style={styles.rewardStat}>
                <MaterialIcons name="stars" size={20} color={Colors.primary} />
                <Text style={styles.rewardNum}>{student?.rewardPoints || 0}</Text>
                <Text style={styles.rewardLabel}>Reward Points</Text>
              </View>
              <View style={styles.dividerV} />
              <View style={styles.rewardStat}>
                <MaterialIcons name={badgeIcon} size={20} color={badge.color} />
                <Text style={[styles.rewardNum, { color: badge.color }]}>{badge.label}</Text>
                <Text style={styles.rewardLabel}>Badge Level</Text>
              </View>
              <View style={styles.dividerV} />
              <View style={styles.rewardStat}>
                <MaterialIcons name="check-circle" size={20} color={Colors.neonGreen} />
                <Text style={[styles.rewardNum, { color: Colors.neonGreen }]}>{successfulReturns}</Text>
                <Text style={styles.rewardLabel}>Returns</Text>
              </View>
            </View>
          </GlassCard>

          {/* Badge Progress */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Badge Progress</Text>
            <View style={styles.badgeProgress}>
              {[
                { label: 'Beginner', points: 0, color: Colors.accent },
                { label: 'Trusted', points: 40, color: Colors.primary },
                { label: 'Elite', points: 100, color: Colors.warning },
              ].map((b, i) => {
                const reached = (student?.rewardPoints || 0) >= b.points;
                return (
                  <View key={b.label} style={styles.badgeTier}>
                    <View style={[styles.badgeDot, { backgroundColor: reached ? b.color : Colors.border, borderColor: b.color + '60' }]}>
                      <MaterialIcons name={i === 0 ? 'school' : i === 1 ? 'verified' : 'emoji-events'} size={14} color={reached ? '#fff' : Colors.textMuted} />
                    </View>
                    <Text style={[styles.badgeName, { color: reached ? b.color : Colors.textMuted }]}>{b.label}</Text>
                    <Text style={styles.badgePts}>{b.points}+ pts</Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>

          {/* Borrow History */}
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>Borrow History ({myBorrows.length})</Text>
            {myBorrows.length === 0 ? (
              <Text style={styles.emptyText}>No borrow history yet</Text>
            ) : null}
            {myBorrows.slice(0, 5).map(b => (
              <View key={b.id} style={styles.historyRow}>
                <MaterialIcons
                  name={b.status === 'returned' ? 'check-circle' : b.status === 'approved' ? 'access-time' : b.status === 'overdue' ? 'warning' : 'pending'}
                  size={18}
                  color={b.status === 'returned' ? Colors.neonGreen : b.status === 'approved' ? Colors.accent : b.status === 'overdue' ? Colors.danger : Colors.warning}
                />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle} numberOfLines={1}>{b.itemTitle}</Text>
                  <Text style={styles.historyDate}>{formatDate(b.requestedAt)}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: b.status === 'returned' ? Colors.neonGreen : b.status === 'approved' ? Colors.accent : Colors.danger }]} />
              </View>
            ))}
          </GlassCard>

          <NeonButton label="Logout" onPress={handleLogout} variant="danger" fullWidth style={{ marginBottom: Spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: Colors.primary + '60' },
  badgeCircle: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  profileName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  profileUsn: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600', marginBottom: Spacing.sm },
  content: { padding: Spacing.md },
  flagCard: { marginBottom: Spacing.md },
  flagHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  flagTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.danger },
  flagDesc: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: 4 },
  flagHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.md },
  rewardsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderColor: Colors.divider },
  rewardStat: { alignItems: 'center', gap: 4 },
  rewardNum: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  rewardLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  dividerV: { width: 1, backgroundColor: Colors.divider },
  badgeProgress: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  badgeTier: { alignItems: 'center', gap: 6 },
  badgeDot: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeName: { fontSize: FontSize.sm, fontWeight: '600' },
  badgePts: { fontSize: FontSize.xs, color: Colors.textMuted },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderColor: Colors.divider },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: '500' },
  historyDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyText: { fontSize: FontSize.base, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.md },
});
