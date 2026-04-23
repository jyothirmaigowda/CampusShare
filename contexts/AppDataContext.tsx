import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';
import {
  Item, BorrowRecord, Note, Notice, AppNotification, Dispute,
  getItems, getBorrows, getNotes, getNotices, getNotifications, getDisputes, getUserDisputes,
  addItem, requestBorrow, approveBorrow, rejectBorrow, returnItem,
  addNote, addNoteComment, replyToComment,
  postNotice, getStudents, clearFlag,
  createNotification, markNotificationRead, markAllNotificationsRead, deleteNotification,
  createDispute, updateDisputeStatus,
  Student, checkAndFlagOverdueUsers,
} from '@/services/backend';

const supabase = getSupabaseClient();

interface AppDataContextType {
  items: Item[];
  borrows: BorrowRecord[];
  notes: Note[];
  notices: Notice[];
  students: Student[];
  notifications: AppNotification[];
  disputes: Dispute[];
  unreadCount: number;
  isLoading: boolean;
  loadAll: () => Promise<void>;
  loadItems: () => Promise<void>;
  loadBorrows: () => Promise<void>;
  loadNotes: () => Promise<void>;
  loadNotices: () => Promise<void>;
  loadStudents: () => Promise<void>;
  loadNotifications: (userId: string) => Promise<void>;
  loadDisputes: () => Promise<void>;
  createItem: (data: Parameters<typeof addItem>[0]) => Promise<Item>;
  createBorrowRequest: (data: Parameters<typeof requestBorrow>[0]) => Promise<BorrowRecord>;
  approveRequest: (borrowId: string) => Promise<BorrowRecord>;
  rejectRequest: (borrowId: string) => Promise<BorrowRecord>;
  returnBorrowedItem: (borrowId: string) => Promise<{ borrow: BorrowRecord; student: Student }>;
  createNote: (data: Parameters<typeof addNote>[0]) => Promise<Note>;
  createNoteComment: (noteId: string, comment: Parameters<typeof addNoteComment>[1]) => Promise<Note>;
  replyComment: (noteId: string, commentId: string, reply: string) => Promise<Note>;
  createNotice: (data: Parameters<typeof postNotice>[0]) => Promise<Notice>;
  unflagUser: (userId: string) => Promise<Student>;
  markRead: (notifId: string) => Promise<void>;
  markAllRead: (userId: string) => Promise<void>;
  removeNotification: (notifId: string) => Promise<void>;
  fileDispute: (data: Parameters<typeof createDispute>[0]) => Promise<Dispute>;
  resolveDispute: (disputeId: string, status: Dispute['status'], adminNotes?: string) => Promise<Dispute>;
  // current user id for notifications
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
}

export const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ─── Real-time subscriptions ──────────────────────────────
  useEffect(() => {
    const itemsSub = supabase.channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => loadItems())
      .subscribe();

    const borrowsSub = supabase.channel('borrows-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrows' }, () => loadBorrows())
      .subscribe();

    const notesSub = supabase.channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => loadNotes())
      .subscribe();

    const commentsSub = supabase.channel('note-comments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_comments' }, () => loadNotes())
      .subscribe();

    const noticesSub = supabase.channel('notices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => loadNotices())
      .subscribe();

    const profilesSub = supabase.channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => loadStudents())
      .subscribe();

    const notifSub = supabase.channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        if (currentUserId) loadNotifications(currentUserId);
      })
      .subscribe();

    const disputesSub = supabase.channel('disputes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => loadDisputes())
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSub);
      supabase.removeChannel(borrowsSub);
      supabase.removeChannel(notesSub);
      supabase.removeChannel(commentsSub);
      supabase.removeChannel(noticesSub);
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(notifSub);
      supabase.removeChannel(disputesSub);
    };
  }, [currentUserId]);

  const loadItems = useCallback(async () => {
    try { const data = await getItems(); setItems(data); } catch (e) {}
  }, []);

  const loadBorrows = useCallback(async () => {
    try {
      await checkAndFlagOverdueUsers();
      const data = await getBorrows();
      setBorrows(data);
    } catch (e) {}
  }, []);

  const loadNotes = useCallback(async () => {
    try { const data = await getNotes(); setNotes(data); } catch (e) {}
  }, []);

  const loadNotices = useCallback(async () => {
    try { const data = await getNotices(); setNotices(data); } catch (e) {}
  }, []);

  const loadStudents = useCallback(async () => {
    try { const data = await getStudents(); setStudents(data); } catch (e) {}
  }, []);

  const loadNotifications = useCallback(async (userId: string) => {
    try { const data = await getNotifications(userId); setNotifications(data); } catch (e) {}
  }, []);

  const loadDisputes = useCallback(async () => {
    try { const data = await getDisputes(); setDisputes(data); } catch (e) {}
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasks = [loadItems(), loadBorrows(), loadNotes(), loadNotices(), loadStudents(), loadDisputes()];
      if (currentUserId) tasks.push(loadNotifications(currentUserId));
      await Promise.all(tasks);
    } finally {
      setIsLoading(false);
    }
  }, [loadItems, loadBorrows, loadNotes, loadNotices, loadStudents, loadNotifications, loadDisputes, currentUserId]);

  const createItem = useCallback(async (data: Parameters<typeof addItem>[0]) => {
    const item = await addItem(data);
    setItems(prev => [item, ...prev]);
    return item;
  }, []);

  const createBorrowRequest = useCallback(async (data: Parameters<typeof requestBorrow>[0]) => {
    const borrow = await requestBorrow(data);
    setBorrows(prev => [borrow, ...prev]);
    return borrow;
  }, []);

  const approveRequest = useCallback(async (borrowId: string) => {
    const borrow = await approveBorrow(borrowId);
    return borrow;
  }, []);

  const rejectRequest = useCallback(async (borrowId: string) => {
    const borrow = await rejectBorrow(borrowId);
    return borrow;
  }, []);

  const returnBorrowedItem = useCallback(async (borrowId: string) => {
    const result = await returnItem(borrowId);
    return result;
  }, []);

  const createNote = useCallback(async (data: Parameters<typeof addNote>[0]) => {
    const note = await addNote(data);
    setNotes(prev => [note, ...prev]);
    return note;
  }, []);

  const createNoteComment = useCallback(async (noteId: string, comment: Parameters<typeof addNoteComment>[1]) => {
    const note = await addNoteComment(noteId, comment);
    setNotes(prev => prev.map(n => n.id === noteId ? note : n));
    return note;
  }, []);

  const replyComment = useCallback(async (noteId: string, commentId: string, reply: string) => {
    const note = await replyToComment(noteId, commentId, reply);
    setNotes(prev => prev.map(n => n.id === noteId ? note : n));
    return note;
  }, []);

  const createNotice = useCallback(async (data: Parameters<typeof postNotice>[0]) => {
    const notice = await postNotice(data);
    setNotices(prev => [notice, ...prev]);
    // If urgent, create notifications for all students
    if (data.isUrgent) {
      for (const s of students) {
        await createNotification({
          userId: s.id,
          type: 'urgent_notice',
          title: `Urgent Notice: ${data.title}`,
          body: data.content.substring(0, 120) + (data.content.length > 120 ? '...' : ''),
        }).catch(() => {});
      }
    }
    return notice;
  }, [students]);

  const unflagUser = useCallback(async (userId: string) => {
    const student = await clearFlag(userId);
    setStudents(prev => prev.map(s => s.id === userId ? { ...s, isFlagged: false, flagReason: undefined } : s));
    return student;
  }, []);

  const markRead = useCallback(async (notifId: string) => {
    await markNotificationRead(notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  }, []);

  const markAllRead = useCallback(async (userId: string) => {
    await markAllNotificationsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const removeNotification = useCallback(async (notifId: string) => {
    await deleteNotification(notifId);
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }, []);

  const fileDispute = useCallback(async (data: Parameters<typeof createDispute>[0]) => {
    const dispute = await createDispute(data);
    setDisputes(prev => [dispute, ...prev]);
    // Notify the admin (fire notification to against_user as well)
    await createNotification({
      userId: data.againstUser,
      type: 'dispute_opened',
      title: 'Dispute Filed Against You',
      body: `${data.raisedByName} has filed a dispute regarding "${data.itemTitle}". Reason: ${data.reason.replace(/_/g, ' ')}. Campus admin will review this.`,
      relatedId: dispute.id,
    }).catch(() => {});
    return dispute;
  }, []);

  const resolveDispute = useCallback(async (disputeId: string, status: Dispute['status'], adminNotes?: string) => {
    const dispute = await updateDisputeStatus(disputeId, status, adminNotes);
    setDisputes(prev => prev.map(d => d.id === disputeId ? dispute : d));
    // Notify both parties
    const resolved = disputes.find(d => d.id === disputeId);
    if (resolved) {
      const label = status === 'resolved' ? 'Resolved' : 'Dismissed';
      for (const uid of [resolved.raisedBy, resolved.againstUser]) {
        await createNotification({
          userId: uid,
          type: 'dispute_resolved',
          title: `Dispute ${label}`,
          body: `Your dispute about "${resolved.itemTitle}" has been ${label.toLowerCase()} by admin.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
          relatedId: disputeId,
        }).catch(() => {});
      }
    }
    return dispute;
  }, [disputes]);

  return (
    <AppDataContext.Provider value={{
      items, borrows, notes, notices, students, notifications, disputes, unreadCount, isLoading,
      loadAll, loadItems, loadBorrows, loadNotes, loadNotices, loadStudents, loadNotifications, loadDisputes,
      createItem, createBorrowRequest, approveRequest, rejectRequest, returnBorrowedItem,
      createNote, createNoteComment, replyComment, createNotice, unflagUser,
      markRead, markAllRead, removeNotification,
      fileDispute, resolveDispute,
      currentUserId, setCurrentUserId,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}
