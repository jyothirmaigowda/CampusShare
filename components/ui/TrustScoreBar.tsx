import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

interface TrustScoreBarProps {
  score: number;
  showLabel?: boolean;
  compact?: boolean;
}

export const TrustScoreBar = memo(function TrustScoreBar({ score, showLabel = true, compact = false }: TrustScoreBarProps) {
  const color = score >= 70 ? Colors.neonGreen : score >= 40 ? Colors.warning : Colors.danger;
  const label = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Low';

  return (
    <View style={styles.wrapper}>
      {showLabel ? (
        <View style={styles.row}>
          <Text style={[styles.label, compact && styles.labelSm]}>Trust Score</Text>
          <Text style={[styles.score, { color }, compact && styles.scoreSm]}>
            {score}/100 · {label}
          </Text>
        </View>
      ) : null}
      <View style={[styles.track, compact && styles.trackCompact]}>
        <View style={[styles.fill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary },
  labelSm: { fontSize: FontSize.xs },
  score: { fontSize: FontSize.sm, fontWeight: '600' },
  scoreSm: { fontSize: FontSize.xs },
  track: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  trackCompact: { height: 4 },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
