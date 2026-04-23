import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { NeonButton } from '@/components/ui/NeonButton';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { Item } from '@/services/backend';

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: Colors.accent,
  'Lab Equipment': Colors.neonGreen,
  Stationery: Colors.warning,
  Books: Colors.primary,
  Sports: Colors.danger,
  Other: Colors.textMuted,
};

const ITEM_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Electronics: 'devices',
  'Lab Equipment': 'science',
  Stationery: 'edit',
  Books: 'menu-book',
  Sports: 'sports-basketball',
  Other: 'inventory-2',
};

interface ItemCardProps {
  item: Item;
  onBorrow?: () => void;
  isOwn?: boolean;
  onApprove?: () => void;
  borrowStatus?: string;
  showActions?: boolean;
}

export const ItemCard = memo(function ItemCard({
  item, onBorrow, isOwn = false, onApprove, borrowStatus, showActions = true,
}: ItemCardProps) {
  const catColor = CATEGORY_COLORS[item.category] || Colors.primary;
  const catIcon = ITEM_ICONS[item.category] || 'inventory-2';

  return (
    <GlassCard style={styles.card} glowColor={catColor}>
      <View style={styles.iconRow}>
        <View style={[styles.iconBox, { backgroundColor: catColor + '18', borderColor: catColor + '40' }]}>
          <MaterialIcons name={catIcon} size={28} color={catColor} />
        </View>
        <View style={styles.headerRight}>
          <Badge label={item.category} color={catColor} size="sm" />
          <View style={[styles.dot, { backgroundColor: item.isAvailable ? Colors.neonGreen : Colors.danger }]} />
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

      <View style={styles.footer}>
        <View>
          <Text style={styles.depositLabel}>Deposit</Text>
          <Text style={styles.deposit}>₹{item.deposit}</Text>
        </View>
        <View style={styles.ownerRow}>
          <MaterialIcons name="person" size={14} color={Colors.textMuted} />
          <Text style={styles.ownerName}>{item.ownerName}</Text>
        </View>
      </View>

      {showActions && !isOwn && item.isAvailable && onBorrow ? (
        <NeonButton
          label="Borrow Request"
          onPress={onBorrow}
          variant="primary"
          size="sm"
          fullWidth
          style={styles.borrowBtn}
        />
      ) : null}

      {showActions && !item.isAvailable && borrowStatus ? (
        <View style={styles.statusBadge}>
          <MaterialIcons name="access-time" size={14} color={Colors.warning} />
          <Text style={styles.statusText}>{borrowStatus}</Text>
        </View>
      ) : null}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.sm },
  depositLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  deposit: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ownerName: { fontSize: FontSize.xs, color: Colors.textMuted },
  borrowBtn: { marginTop: Spacing.xs },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs, backgroundColor: Colors.warningGlow, padding: Spacing.xs, borderRadius: 8 },
  statusText: { fontSize: FontSize.xs, color: Colors.warning, fontWeight: '500' },
});
