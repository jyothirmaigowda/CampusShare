import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAppData } from '@/hooks/useAppData';
import { AddNoteModal } from '@/components/feature/AddNoteModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { NeonButton } from '@/components/ui/NeonButton';
import { useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { Note, Student, formatTimeAgo } from '@/services/backend';
import { Modal, ScrollView } from 'react-native';

const SEMESTERS = ['All', '1st Sem', '2nd Sem', '3rd Sem', '4th Sem', '5th Sem', '6th Sem', '7th Sem', '8th Sem'];
const COMMENT_TYPES = [
  { key: 'comment', label: 'Comment', color: Colors.accent },
  { key: 'error_report', label: 'Error Report', color: Colors.danger },
  { key: 'suggestion', label: 'Suggestion', color: Colors.neonGreen },
];

export default function NotesScreen() {
  const { user } = useAuth();
  const { notes, isLoading, loadNotes, createNote, createNoteComment } = useAppData();
  const { showAlert } = useAlert();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<'comment' | 'error_report' | 'suggestion'>('comment');
  const [addingComment, setAddingComment] = useState(false);
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('All');

  useEffect(() => { loadNotes(); }, []);

  const student = user as Student;

  // Filtered notes
  const filteredNotes = notes.filter(n => {
    const matchSem = semester === 'All' || n.semester === semester;
    const matchSearch = !search.trim() ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subject.toLowerCase().includes(search.toLowerCase()) ||
      n.uploaderName.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    return matchSem && matchSearch;
  });

  async function handleAddNote(data: { title: string; subject: string; description: string; semester: string }) {
    if (!user) return;
    try {
      await createNote({ ...data, uploaderId: user.id, uploaderName: (user as Student).name });
      showAlert('Notes Shared', 'Your notes are now available to all students!');
    } catch (err: any) {
      showAlert('Error', err.message);
    }
  }

  async function handleAddComment() {
    if (!commentText.trim() || !selectedNote || !user) return;
    setAddingComment(true);
    try {
      const updated = await createNoteComment(selectedNote.id, {
        authorId: user.id,
        authorName: (user as Student).name,
        text: commentText.trim(),
        type: commentType,
      });
      setSelectedNote(updated);
      setCommentText('');
    } catch (err: any) {
      showAlert('Error', err.message);
    } finally {
      setAddingComment(false);
    }
  }

  const commentTypeColor: Record<string, string> = { comment: Colors.accent, error_report: Colors.danger, suggestion: Colors.neonGreen };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Notes"
        subtitle={`${notes.length} notes shared`}
        rightAction={{ icon: 'add', onPress: () => setShowAdd(true) }}
      />

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, subjects..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Semester Filter */}
      <View style={styles.semWrap}>
        <FlatList
          data={SEMESTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={s => s}
          contentContainerStyle={styles.semList}
          renderItem={({ item: s }) => (
            <TouchableOpacity onPress={() => setSemester(s)} style={[styles.semChip, semester === s && styles.semChipActive]}>
              <Text style={[styles.semText, semester === s && styles.semTextActive]}>{s}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={n => n.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadNotes} tintColor={Colors.primary} />}
        ListEmptyComponent={
          search || semester !== 'All'
            ? <EmptyState icon="search-off" title="No notes found" subtitle="Try adjusting your search or semester filter" />
            : <EmptyState icon="menu-book" title="No notes yet" subtitle="Share your notes to help fellow students!" />
        }
        renderItem={({ item: note }) => (
          <GlassCard onPress={() => setSelectedNote(note)} style={styles.noteCard} glowColor={Colors.accent}>
            <View style={styles.noteTop}>
              <View style={styles.fileIcon}>
                <MaterialIcons name="picture-as-pdf" size={24} color={Colors.danger} />
              </View>
              <View style={styles.noteInfo}>
                <Text style={styles.noteTitle} numberOfLines={2}>{note.title}</Text>
                <Text style={styles.noteSubject}>{note.subject}</Text>
              </View>
            </View>
            <Text style={styles.noteDesc} numberOfLines={2}>{note.description}</Text>
            <View style={styles.noteMeta}>
              <Badge label={note.semester} color={Colors.accent} size="sm" />
              <View style={styles.metaRight}>
                <MaterialIcons name="comment" size={12} color={Colors.textMuted} />
                <Text style={styles.commentCount}>{note.comments.length}</Text>
                <Text style={styles.noteAuthor}>{note.uploaderName}</Text>
              </View>
            </View>
          </GlassCard>
        )}
      />

      <AddNoteModal visible={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleAddNote} />

      {/* Note Detail Modal */}
      <Modal visible={!!selectedNote} animationType="slide" onRequestClose={() => setSelectedNote(null)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedNote(null)} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedNote?.title}</Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {selectedNote ? (
              <>
                <GlassCard style={{ marginBottom: Spacing.md }}>
                  <Text style={styles.detailSubject}>{selectedNote.subject}</Text>
                  <Text style={styles.detailDesc}>{selectedNote.description}</Text>
                  <View style={styles.detailMeta}>
                    <Badge label={selectedNote.semester} color={Colors.accent} size="sm" />
                    <Text style={styles.detailAuthor}>By {selectedNote.uploaderName} · {formatTimeAgo(selectedNote.createdAt)}</Text>
                  </View>
                  <TouchableOpacity style={styles.downloadBtn}>
                    <MaterialIcons name="download" size={18} color={Colors.primary} />
                    <Text style={styles.downloadText}>View/Download (Simulated)</Text>
                  </TouchableOpacity>
                </GlassCard>

                <Text style={styles.commentsTitle}>Comments ({selectedNote.comments.length})</Text>

                {/* Add Comment */}
                <GlassCard style={{ marginBottom: Spacing.md }}>
                  <View style={styles.typeRow}>
                    {COMMENT_TYPES.map(ct => (
                      <TouchableOpacity
                        key={ct.key}
                        onPress={() => setCommentType(ct.key as any)}
                        style={[styles.typeChip, commentType === ct.key && { borderColor: ct.color, backgroundColor: ct.color + '18' }]}
                      >
                        <Text style={[styles.typeText, commentType === ct.key && { color: ct.color }]}>{ct.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Write a comment..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={styles.commentInput}
                    textAlignVertical="top"
                  />
                  <NeonButton label="Post Comment" onPress={handleAddComment} loading={addingComment} size="sm" fullWidth style={{ marginTop: Spacing.sm }} />
                </GlassCard>

                {selectedNote.comments.map(c => (
                  <GlassCard key={c.id} style={{ marginBottom: Spacing.sm }}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{c.authorName}</Text>
                      <Badge label={c.type.replace('_', ' ')} color={commentTypeColor[c.type] || Colors.accent} size="sm" />
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                    {c.reply ? (
                      <View style={styles.replyBox}>
                        <MaterialIcons name="subdirectory-arrow-right" size={14} color={Colors.primary} />
                        <Text style={styles.replyText}>{c.reply}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.commentTime}>{formatTimeAgo(c.createdAt)}</Text>
                  </GlassCard>
                ))}

                <View style={{ height: 40 }} />
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchRow: { paddingHorizontal: Spacing.md, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  semWrap: { height: 48 },
  semList: { paddingHorizontal: Spacing.md, alignItems: 'center', gap: 8 },
  semChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  semChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  semText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  semTextActive: { color: Colors.accentLight, fontWeight: '600' },
  list: { padding: Spacing.md, paddingTop: Spacing.sm },
  noteCard: { marginBottom: Spacing.md },
  noteTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  fileIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.danger + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.danger + '30' },
  noteInfo: { flex: 1 },
  noteTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, lineHeight: 22 },
  noteSubject: { fontSize: FontSize.sm, color: Colors.accent, marginTop: 2 },
  noteDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  noteMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentCount: { fontSize: FontSize.xs, color: Colors.textMuted },
  noteAuthor: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 4 },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderBottomWidth: 1, borderColor: Colors.border },
  modalTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalScroll: { flex: 1, padding: Spacing.md },
  detailSubject: { fontSize: FontSize.base, color: Colors.accent, fontWeight: '600', marginBottom: 6 },
  detailDesc: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.md },
  detailMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  detailAuthor: { fontSize: FontSize.xs, color: Colors.textMuted },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '40' },
  downloadText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },
  commentsTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  typeChip: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border },
  typeText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted },
  commentInput: { backgroundColor: Colors.inputBg, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.inputBorder, color: Colors.textPrimary, fontSize: FontSize.base, padding: Spacing.md, minHeight: 80 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentAuthor: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  commentText: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22, marginBottom: 6 },
  replyBox: { flexDirection: 'row', gap: 4, backgroundColor: Colors.primaryGlow, borderRadius: 8, padding: Spacing.sm, marginBottom: 6, borderWidth: 1, borderColor: Colors.primary + '30' },
  replyText: { flex: 1, fontSize: FontSize.sm, color: Colors.primaryLight },
  commentTime: { fontSize: FontSize.xs, color: Colors.textMuted },
});
