import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import { Student, Item, BorrowRecord } from '@/services/backend';

interface AdminAnalyticsProps {
  students: Student[];
  items: Item[];
  borrows: BorrowRecord[];
}

// Reusable horizontal bar chart row
function BarRow({ label, value, maxValue, color }: { label: string; value: number; maxValue: number; color: string }) {
  const pct = maxValue > 0 ? Math.max(4, (value / maxValue) * 100) : 4;
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label} numberOfLines={1}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.val, { color }]}>{value}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { width: 110, fontSize: FontSize.xs, color: Colors.textSecondary },
  track: { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  val: { width: 28, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'right' },
});

// Mini donut ring (simulated with arc view)
function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  return (
    <View style={ringStyles.wrap}>
      <View style={[ringStyles.outer, { borderColor: color + '30' }]}>
        <View style={[ringStyles.inner, { borderColor: color, borderTopColor: 'transparent', transform: [{ rotate: `${(score / 100) * 360}deg` }] }]} />
        <View style={ringStyles.center}>
          <Text style={[ringStyles.num, { color }]}>{score}</Text>
        </View>
      </View>
      <Text style={ringStyles.label}>{label}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  outer: { width: 68, height: 68, borderRadius: 34, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  inner: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 5, borderColor: Colors.primary },
  center: { alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
});

export const AdminAnalytics = memo(function AdminAnalytics({ students, items, borrows }: AdminAnalyticsProps) {
  const analytics = useMemo(() => {
    // Trust score distribution
    const trustBuckets = { '81-100': 0, '61-80': 0, '41-60': 0, '21-40': 0, '0-20': 0 };
    students.forEach(s => {
      if (s.trustScore >= 81) trustBuckets['81-100']++;
      else if (s.trustScore >= 61) trustBuckets['61-80']++;
      else if (s.trustScore >= 41) trustBuckets['41-60']++;
      else if (s.trustScore >= 21) trustBuckets['21-40']++;
      else trustBuckets['0-20']++;
    });

    // Category popularity
    const catMap: Record<string, number> = {};
    borrows.forEach(b => {
      const item = items.find(i => i.id === b.itemId);
      if (item) catMap[item.category] = (catMap[item.category] || 0) + 1;
    });

    // Borrow status breakdown
    const statusCounts = { pending: 0, approved: 0, returned: 0, rejected: 0, overdue: 0 };
    borrows.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });

    // Top borrowers
    const borrowerMap: Record<string, { name: string; count: number }> = {};
    borrows.forEach(b => {
      const s = students.find(st => st.id === b.borrowerId);
      if (s) {
        if (!borrowerMap[b.borrowerId]) borrowerMap[b.borrowerId] = { name: s.name, count: 0 };
        borrowerMap[b.borrowerId].count++;
      }
    });
    const topBorrowers = Object.values(borrowerMap).sort((a, b) => b.count - a.count).slice(0, 5);

    // Badge distribution
    const beginner = students.filter(s => s.rewardPoints < 40).length;
    const trusted = students.filter(s => s.rewardPoints >= 40 && s.rewardPoints < 100).length;
    const elite = students.filter(s => s.rewardPoints >= 100).length;

    // Average trust score
    const avgTrust = students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.trustScore, 0) / students.length)
      : 100;

    // Return rate
    const totalApproved = borrows.filter(b => ['approved', 'returned', 'overdue'].includes(b.status)).length;
    const returnRate = totalApproved > 0 ? Math.round((statusCounts.returned / totalApproved) * 100) : 0;

    // Flagged rate
    const flaggedRate = students.length > 0 ? Math.round((students.filter(s => s.isFlagged).length / students.length) * 100) : 0;

    return { trustBuckets, catMap, statusCounts, topBorrowers, beginner, trusted, elite, avgTrust, returnRate, flaggedRate };
  }, [students, items, borrows]);

  const maxTrust = Math.max(...Object.values(analytics.trustBuckets), 1);
  const maxCat = Math.max(...Object.values(analytics.catMap), 1);
  const maxTopBorrow = Math.max(...analytics.topBorrowers.map(b => b.count), 1);

  const statusColors: Record<string, string> = {
    pending: Colors.warning,
    approved: Colors.accent,
    returned: Colors.neonGreen,
    rejected: Colors.danger,
    overdue: Colors.danger,
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Key Metrics */}
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <View style={styles.metricsRow}>
        <GlassCard style={styles.metricCard} glowColor={Colors.primary}>
          <MaterialIcons name="people" size={22} color={Colors.primary} />
          <Text style={[styles.metricNum, { color: Colors.primary }]}>{students.length}</Text>
          <Text style={styles.metricLabel}>Students</Text>
        </GlassCard>
        <GlassCard style={styles.metricCard} glowColor={Colors.accent}>
          <MaterialIcons name="inventory-2" size={22} color={Colors.accent} />
          <Text style={[styles.metricNum, { color: Colors.accent }]}>{items.length}</Text>
          <Text style={styles.metricLabel}>Items Listed</Text>
        </GlassCard>
        <GlassCard style={styles.metricCard} glowColor={Colors.neonGreen}>
          <MaterialIcons name="swap-horiz" size={22} color={Colors.neonGreen} />
          <Text style={[styles.metricNum, { color: Colors.neonGreen }]}>{borrows.length}</Text>
          <Text style={styles.metricLabel}>Total Borrows</Text>
        </GlassCard>
      </View>

      {/* Platform Health */}
      <Text style={styles.sectionTitle}>Platform Health</Text>
      <GlassCard style={styles.healthCard}>
        <View style={styles.ringsRow}>
          <ScoreRing score={analytics.avgTrust} color={analytics.avgTrust >= 70 ? Colors.neonGreen : Colors.warning} label="Avg Trust" />
          <ScoreRing score={analytics.returnRate} color={Colors.accent} label="Return Rate %" />
          <ScoreRing score={100 - analytics.flaggedRate} color={Colors.primary} label="Healthy Users %" />
        </View>
      </GlassCard>

      {/* Badge Distribution */}
      <Text style={styles.sectionTitle}>Badge Distribution</Text>
      <GlassCard style={styles.card}>
        <BarRow label="Beginner" value={analytics.beginner} maxValue={Math.max(analytics.beginner, analytics.trusted, analytics.elite, 1)} color={Colors.accent} />
        <BarRow label="Trusted" value={analytics.trusted} maxValue={Math.max(analytics.beginner, analytics.trusted, analytics.elite, 1)} color={Colors.primary} />
        <BarRow label="Elite" value={analytics.elite} maxValue={Math.max(analytics.beginner, analytics.trusted, analytics.elite, 1)} color={Colors.warning} />
      </GlassCard>

      {/* Trust Score Distribution */}
      <Text style={styles.sectionTitle}>Trust Score Distribution</Text>
      <GlassCard style={styles.card}>
        {Object.entries(analytics.trustBuckets).map(([range, count]) => (
          <BarRow
            key={range}
            label={`Score ${range}`}
            value={count}
            maxValue={maxTrust}
            color={range === '81-100' ? Colors.neonGreen : range === '61-80' ? Colors.accent : range === '41-60' ? Colors.warning : Colors.danger}
          />
        ))}
      </GlassCard>

      {/* Borrow Status */}
      <Text style={styles.sectionTitle}>Borrow Status Breakdown</Text>
      <GlassCard style={styles.card}>
        {Object.entries(analytics.statusCounts)
          .filter(([, v]) => v > 0)
          .map(([status, count]) => (
            <BarRow key={status} label={status.charAt(0).toUpperCase() + status.slice(1)} value={count} maxValue={Math.max(...Object.values(analytics.statusCounts), 1)} color={statusColors[status] || Colors.textMuted} />
          ))}
      </GlassCard>

      {/* Category Popularity */}
      {Object.keys(analytics.catMap).length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Most Borrowed Categories</Text>
          <GlassCard style={styles.card}>
            {Object.entries(analytics.catMap)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([cat, count]) => (
                <BarRow key={cat} label={cat} value={count} maxValue={maxCat} color={Colors.primary} />
              ))}
          </GlassCard>
        </>
      ) : null}

      {/* Top Borrowers Leaderboard */}
      {analytics.topBorrowers.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Top Borrowers</Text>
          <GlassCard style={styles.card}>
            {analytics.topBorrowers.map((b, i) => (
              <View key={b.name} style={styles.leaderRow}>
                <View style={[styles.rankBadge, { backgroundColor: i === 0 ? Colors.warning + '22' : i === 1 ? Colors.textMuted + '22' : Colors.accent + '11' }]}>
                  <Text style={[styles.rankNum, { color: i === 0 ? Colors.warning : i === 1 ? Colors.textMuted : Colors.accent }]}>#{i + 1}</Text>
                </View>
                <Text style={styles.leaderName} numberOfLines={1}>{b.name}</Text>
                <View style={styles.leaderBar}>
                  <View style={[styles.leaderFill, { width: `${Math.max(10, (b.count / maxTopBorrow) * 100)}%`, backgroundColor: i === 0 ? Colors.warning : Colors.primary }]} />
                </View>
                <Text style={[styles.leaderCount, { color: i === 0 ? Colors.warning : Colors.primary }]}>{b.count}</Text>
              </View>
            ))}
          </GlassCard>
        </>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  metricCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: Spacing.md },
  metricNum: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  healthCard: { marginBottom: Spacing.sm },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  card: { marginBottom: Spacing.sm, paddingVertical: Spacing.md },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: FontSize.xs, fontWeight: '700' },
  leaderName: { width: 90, fontSize: FontSize.sm, color: Colors.textSecondary },
  leaderBar: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  leaderFill: { height: '100%', borderRadius: 4 },
  leaderCount: { width: 24, fontSize: FontSize.xs, fontWeight: '700', textAlign: 'right' },
});
