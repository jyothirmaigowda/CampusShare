import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { ItemCard } from '@/components/feature/ItemCard';
import { BorrowRequestModal } from '@/components/feature/BorrowRequestModal';
import { AddItemModal } from '@/components/feature/AddItemModal';
import { DisputeModal } from '@/components/feature/DisputeModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAlert } from '@/template';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Item, Student, BorrowRecord, formatDate } from '@/services/backend';

const CATEGORIES = ['All', 'Electronics', 'Lab Equipment', 'Stationery', 'Books', 'Sports', 'Other'];
const SORT_OPTIONS = ['Newest', 'Lowest Deposit', 'Highest Trust'] as const;
type SortOption = typeof SORT_OPTIONS[number];

export default function MarketScreen() {
  const { user, refreshUser } = useAuth();
  const {
    items, borrows, students, isLoading,
    loadItems, loadBorrows, loadStudents,
    createItem, createBorrowRequest, approveRequest, rejectRequest, returnBorrowedItem,
    fileDispute,
  } = useAppData();
  const { showAlert } = useAlert();

  const [selectedCat, setSelectedCat] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('Newest');
  const [search, setSearch] = useState('');
  const [showBorrow, setShowBorrow] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [tab, setTab] = useState<'browse' | 'my_items' | 'requests'>('browse');
  const [showFilters, setShowFilters] = useState(false);
  const [depositMax, setDepositMax] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [disputeBorrow, setDisputeBorrow] = useState<BorrowRecord | null>(null);

  useEffect(() => {
    loadItems();
    loadBorrows();
    loadStudents();
  }, []);

  const student = user as Student;
  const myBorrows = borrows.filter(b => b.borrowerId === user?.id && (b.status === 'approved' || b.status === 'pending'));
  const incomingRequests = borrows.filter(b => b.ownerId === user?.id && b.status === 'pending');

  const filteredItems = useCallback(() => {
    let list = items.filter(i => {
      const matchCat = selectedCat === 'All' || i.category === selectedCat;
      const matchSearch = !search.trim() ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase()) ||
        i.ownerName.toLowerCase().includes(search.toLowerCase());
      const matchDeposit = !depositMax.trim() || i.deposit <= parseFloat(depositMax);
      return matchCat && matchSearch && matchDeposit;
    });
    if (sortBy === 'Lowest Deposit') list = [...list].sort((a, b) => a.deposit - b.deposit);
    else if (sortBy === 'Highest Trust') {
      list = [...list].sort((a, b) => {
        const ownerA = students.find(s => s.id === a.ownerId);
        const ownerB = students.find(s => s.id === b.ownerId);
        return (ownerB?.trustScore || 0) - (ownerA?.trustScore || 0);
      });
    }
    return list;
  }, [items, selectedCat, search, depositMax, sortBy, students]);

  function handleBorrowPress(item: Item) {
    if (student?.isFlagged) {
      showAlert('Account Flagged', 'Your account is flagged. Return overdue items to restore borrowing privileges.');
      return;
    }
    if ((student?.trustScore || 0) < 30) {
      showAlert('Low Trust Score', 'Your trust score is too low to borrow items. Return items on time to improve it.');
      return;
    }
    setSelectedItem(item);
    setShowBorrow(true);
  }

  async function handleBorrowSubmit(days: number) {
    if (!selectedItem || !user) return;
    try {
      await createBorrowRequest({ itemId: selectedItem.id, itemTitle: selectedItem.title, borrowerId: user.id, ownerId: selectedItem.ownerId, daysRequested: days });
      showAlert('Request Sent', 'Your borrow request has been sent to the owner.');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to send request');
    }
  }

  async function handleAddItem(data: { title: string; description: string; deposit: number; category: string }) {
    if (!user) return;
    try {
      await createItem({ ...data, ownerId: user.id, ownerName: (user as Student).name });
      showAlert('Item Listed', 'Your item has been listed on the marketplace!');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to list item');
    }
  }

  async function handleApprove(borrowId: string) {
    try { await approveRequest(borrowId); showAlert('Approved', 'Borrow request approved successfully.'); }
    catch (err: any) { showAlert('Error', err.message); }
  }

  async function handleReject(borrowId: string) {
    try { await rejectRequest(borrowId); showAlert('Rejected', 'Borrow request has been rejected.'); }
    catch (err: any) { showAlert('Error', err.message); }
  }

  async function handleReturn(borrow: BorrowRecord) {
    try {
      const result = await returnBorrowedItem(borrow.id);
      await refreshUser();
      const wasOverdue = new Date() > new Date(result.borrow.dueDate);
      showAlert('Item Returned', wasOverdue ? 'Returned late. Trust score -20. Please return on time next time!' : 'On-time return! +10 trust score and +10 reward points!');
    } catch (err: any) { showAlert('Error', err.message); }
  }

  function openDispute(borrow: BorrowRecord) {
    setDisputeBorrow(borrow);
    setShowDispute(true);
  }

  async function handleDisputeSubmit(reason: string, description: string) {
    if (!disputeBorrow || !user) return;
    const isOwner = disputeBorrow.ownerId === user.id;
    const againstUser = isOwner ? disputeBorrow.borrowerId : disputeBorrow.ownerId;
    const againstUserProfile = students.find(s => s.id === againstUser);
    await fileDispute({
      borrowId: disputeBorrow.id,
      itemTitle: disputeBorrow.itemTitle,
      raisedBy: user.id,
      raisedByName: (user as Student).name,
      againstUser,
      againstUserName: againstUserProfile?.name || 'Unknown',
      reason,
      description,
    });
    showAlert('Dispute Filed', 'Your dispute has been submitted for admin review.');
  }

  const browseList = filteredItems();
  const myItems = items.filter(i => i.ownerId === user?.id);
  const allMyRequests = borrows.filter(b => b.ownerId === user?.id || b.borrowerId === user?.id);

  const statusColor = (b: BorrowRecord) => {
    const ov = b.status === 'approved' && new Date() > new Date(b.dueDate);
    if (ov) return Colors.danger;
    return b.status === 'pending' ? Colors.warning : b.status === 'approved' ? Colors.accent : b.status === 'returned' ? Colors.neonGreen : Colors.danger;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Marketplace"
        subtitle={`${items.filter(i => i.isAvailable).length} items available`}
        rightAction={{ icon: 'add', onPress: () => setShowAddItem(true) }}
      />

      {/* Sub Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'browse', label: 'Browse' },
          { key: 'my_items', label: 'My Items' },
          { key: 'requests', label: `Requests${incomingRequests.length > 0 ? ` (${incomingRequests.length})` : ''}` },
        ].map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key as any)} style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'browse' ? (
        <>
          {/* Search bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items, owners..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialIcons name="close" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(f => !f)}
              style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            >
              <MaterialIcons name="tune" size={20} color={showFilters ? Colors.primary : Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Expandable Filters */}
          {showFilters ? (
            <View style={styles.filterPanel}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Max Deposit (₹)</Text>
                <View style={styles.depositInput}>
                  <TextInput
                    style={styles.depositField}
                    placeholder="No limit"
                    placeholderTextColor={Colors.textMuted}
                    value={depositMax}
                    onChangeText={setDepositMax}
                    keyboardType="numeric"
                  />
                  {depositMax ? (
                    <TouchableOpacity onPress={() => setDepositMax('')}>
                      <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Sort By</Text>
                <View style={styles.sortChips}>
                  {SORT_OPTIONS.map(s => (
                    <TouchableOpacity key={s} onPress={() => setSortBy(s)} style={[styles.sortChip, sortBy === s && styles.sortChipActive]}>
                      <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {/* Category Filter */}
          <View style={styles.catWrap}>
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i}
              contentContainerStyle={styles.catList}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedCat(item)} style={[styles.catChip, selectedCat === item && styles.catChipActive]}>
                  <Text style={[styles.catText, selectedCat === item && styles.catTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <FlatList
            data={browseList}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { loadItems(); loadBorrows(); }} tintColor={Colors.primary} />}
            ListEmptyComponent={
              search || selectedCat !== 'All' || depositMax
                ? <EmptyState icon="search-off" title="No results" subtitle="Try adjusting your filters or search terms" />
                : <EmptyState icon="storefront" title="No items yet" subtitle="Be the first to list an item on the marketplace!" />
            }
            renderItem={({ item }) => {
              const myBorrow = myBorrows.find(b => b.itemId === item.id);
              return (
                <ItemCard
                  item={item}
                  isOwn={item.ownerId === user?.id}
                  onBorrow={() => handleBorrowPress(item)}
                  borrowStatus={myBorrow?.status}
                  showActions={!myBorrow || myBorrow.status !== 'approved'}
                />
              );
            }}
          />
        </>
      ) : tab === 'my_items' ? (
        <FlatList
          data={myItems}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="inventory-2" title="No items listed" subtitle="Tap the + button to list your first item" />}
          renderItem={({ item }) => <ItemCard item={item} isOwn={true} showActions={false} />}
        />
      ) : (
        <FlatList
          data={allMyRequests}
          keyExtractor={b => b.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="pending" title="No requests" subtitle="Borrow requests will appear here" />}
          renderItem={({ item: borrow }) => {
            const isOwner = borrow.ownerId === user?.id;
            const isBorrower = borrow.borrowerId === user?.id;
            const tc = statusColor(borrow);
            const isOverdue = borrow.status === 'approved' && new Date() > new Date(borrow.dueDate);
            return (
              <View style={[styles.requestCard, { backgroundColor: tc + '14', borderColor: tc + '40' }]}>
                <View style={styles.requestTop}>
                  <Text style={styles.requestTitle} numberOfLines={1}>{borrow.itemTitle}</Text>
                  <View style={[styles.statusPill, { backgroundColor: tc + '22' }]}>
                    <Text style={[styles.statusText, { color: tc }]}>{isOverdue ? 'OVERDUE' : borrow.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.requestMeta}>
                  {isOwner ? 'Incoming request' : 'Your request'} · Due: {new Date(borrow.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
                {isOwner && borrow.status === 'pending' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleApprove(borrow.id)}>
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(borrow.id)}>
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {isBorrower && borrow.status === 'approved' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.returnBtn, { flex: 2 }]} onPress={() => handleReturn(borrow)}>
                      <Text style={styles.returnBtnText}>Return Item</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.disputeBtn]} onPress={() => openDispute(borrow)}>
                      <MaterialIcons name="gavel" size={14} color={Colors.danger} />
                      <Text style={styles.disputeBtnText}>Dispute</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {isOwner && borrow.status === 'approved' ? (
                  <TouchableOpacity style={[styles.actionBtn, styles.disputeBtn, { marginTop: Spacing.sm }]} onPress={() => openDispute(borrow)}>
                    <MaterialIcons name="gavel" size={14} color={Colors.danger} />
                    <Text style={styles.disputeBtnText}>File Dispute</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
        />
      )}

      <BorrowRequestModal visible={showBorrow} item={selectedItem} onClose={() => setShowBorrow(false)} onSubmit={handleBorrowSubmit} />
      <AddItemModal visible={showAddItem} onClose={() => setShowAddItem(false)} onSubmit={handleAddItem} />
      <DisputeModal
        visible={showDispute}
        onClose={() => setShowDispute(false)}
        onSubmit={handleDisputeSubmit}
        borrow={disputeBorrow}
        againstUserName={
          disputeBorrow
            ? disputeBorrow.ownerId === user?.id
              ? (students.find(s => s.id === disputeBorrow.borrowerId)?.name || 'Unknown')
              : (students.find(s => s.id === disputeBorrow.ownerId)?.name || 'Unknown')
            : ''
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  tabRow: { flexDirection: 'row', marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.sm },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.primaryGlow, borderWidth: 1, borderColor: Colors.primary + '40' },
  tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.primaryLight, fontWeight: '600' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, marginBottom: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  filterBtn: {
    width: 42, height: 42, borderRadius: Radius.md,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  filterPanel: {
    marginHorizontal: Spacing.md, marginBottom: 8,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, gap: 10,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  filterLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  depositInput: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.inputBg, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.inputBorder,
    paddingHorizontal: 10, height: 34,
  },
  depositField: { color: Colors.textPrimary, fontSize: FontSize.sm, minWidth: 60 },
  sortChips: { flexDirection: 'row', gap: 6 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  sortChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  sortText: { fontSize: FontSize.xs, color: Colors.textMuted },
  sortTextActive: { color: Colors.primaryLight, fontWeight: '600' },
  catWrap: { height: 50 },
  catList: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  catText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  catTextActive: { color: Colors.primaryLight, fontWeight: '600' },
  list: { padding: Spacing.md, paddingTop: Spacing.sm },
  requestCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  requestTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  requestMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 9, borderRadius: Radius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  approveBtn: { backgroundColor: Colors.neonGreen + '22', borderWidth: 1, borderColor: Colors.neonGreen + '60' },
  approveBtnText: { color: Colors.neonGreen, fontSize: FontSize.sm, fontWeight: '600' },
  rejectBtn: { backgroundColor: Colors.danger + '22', borderWidth: 1, borderColor: Colors.danger + '60' },
  rejectBtnText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '600' },
  returnBtn: { backgroundColor: Colors.accent + '22', borderWidth: 1, borderColor: Colors.accent + '60' },
  returnBtnText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' },
  disputeBtn: { flex: 1, backgroundColor: Colors.danger + '14', borderWidth: 1, borderColor: Colors.danger + '40' },
  disputeBtnText: { color: Colors.danger, fontSize: FontSize.xs, fontWeight: '600' },
});
