// ============================================================
// Campus Share - Supabase Backend Service
// All data persisted in OnSpace Cloud (Supabase-compatible)
// ============================================================

import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// ─── TYPES ──────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  email: string;
  usn: string;
  role: 'student';
  trustScore: number;
  rewardPoints: number;
  isFlagged: boolean;
  flagReason?: string;
  borrowHistory: BorrowRecord[];
  createdAt: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: string;
}

export type User = Student | Admin;

export interface Item {
  id: string;
  title: string;
  description: string;
  deposit: number;
  ownerId: string;
  ownerName: string;
  isAvailable: boolean;
  category: string;
  imageIndex: number;
  createdAt: string;
}

export interface BorrowRecord {
  id: string;
  itemId: string;
  itemTitle: string;
  borrowerId: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'returned' | 'overdue' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  returnedAt?: string;
  dueDate: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  description: string;
  uploaderId: string;
  uploaderName: string;
  fileType: string;
  semester: string;
  comments: NoteComment[];
  createdAt: string;
}

export interface NoteComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  type: 'comment' | 'error_report' | 'suggestion';
  reply?: string;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isUrgent: boolean;
  postedBy: string;
  createdAt: string;
}

// ─── ROW MAPPERS ────────────────────────────────────────────

function mapProfile(row: any): Student | Admin {
  if (row.role === 'admin') {
    return {
      id: row.id,
      name: row.username || 'Admin',
      email: row.email,
      role: 'admin',
      createdAt: row.created_at || new Date().toISOString(),
    } as Admin;
  }
  return {
    id: row.id,
    name: row.username || 'Student',
    email: row.email,
    usn: row.usn || '',
    role: 'student',
    trustScore: row.trust_score ?? 100,
    rewardPoints: row.reward_points ?? 0,
    isFlagged: row.is_flagged ?? false,
    flagReason: row.flag_reason || undefined,
    borrowHistory: [],
    createdAt: row.created_at || new Date().toISOString(),
  } as Student;
}

function mapItem(row: any): Item {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    deposit: row.deposit,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    isAvailable: row.is_available,
    category: row.category,
    imageIndex: row.image_index ?? 0,
    createdAt: row.created_at,
  };
}

function mapBorrow(row: any): BorrowRecord {
  return {
    id: row.id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    borrowerId: row.borrower_id,
    ownerId: row.owner_id,
    status: row.status,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at || undefined,
    returnedAt: row.returned_at || undefined,
    dueDate: row.due_date,
  };
}

function mapNote(row: any, comments: NoteComment[] = []): Note {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    description: row.description,
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name,
    fileType: row.file_type,
    semester: row.semester,
    comments,
    createdAt: row.created_at,
  };
}

function mapComment(row: any): NoteComment {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    text: row.text,
    type: row.type,
    reply: row.reply || undefined,
    createdAt: row.created_at,
  };
}

function mapNotice(row: any): Notice {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isUrgent: row.is_urgent,
    postedBy: row.posted_by,
    createdAt: row.created_at,
  };
}

// ─── USER OPERATIONS ────────────────────────────────────────

export async function getUserById(id: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return undefined;
  return mapProfile(data);
}

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapProfile) as Student[];
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  const dbUpdates: any = {};
  if (updates.trustScore !== undefined) dbUpdates.trust_score = updates.trustScore;
  if (updates.rewardPoints !== undefined) dbUpdates.reward_points = updates.rewardPoints;
  if (updates.isFlagged !== undefined) dbUpdates.is_flagged = updates.isFlagged;
  if (updates.flagReason !== undefined) dbUpdates.flag_reason = updates.flagReason;
  if (updates.name !== undefined) dbUpdates.username = updates.name;

  const { data, error } = await supabase
    .from('user_profiles')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data) as Student;
}

// ─── TRUST SCORE ────────────────────────────────────────────

export async function decreaseTrustScore(userId: string, amount: number, reason?: string): Promise<Student> {
  const user = await getUserById(userId) as Student;
  if (!user) throw new Error('User not found');
  const newScore = Math.max(0, user.trustScore - amount);
  const flagged = newScore <= 40;
  return updateStudent(userId, {
    trustScore: newScore,
    isFlagged: flagged || user.isFlagged,
    flagReason: flagged ? (reason || 'Low trust score') : user.flagReason,
  });
}

export async function increaseTrustScore(userId: string, amount: number): Promise<Student> {
  const user = await getUserById(userId) as Student;
  if (!user) throw new Error('User not found');
  return updateStudent(userId, { trustScore: Math.min(100, user.trustScore + amount) });
}

export async function addRewardPoints(userId: string, points: number): Promise<Student> {
  const user = await getUserById(userId) as Student;
  if (!user) throw new Error('User not found');
  return updateStudent(userId, { rewardPoints: (user.rewardPoints || 0) + points });
}

export function getBadgeLevel(points: number): { label: string; color: string } {
  if (points >= 100) return { label: 'Elite', color: '#F59E0B' };
  if (points >= 40) return { label: 'Trusted', color: '#8B5CF6' };
  return { label: 'Beginner', color: '#3B82F6' };
}

export async function clearFlag(userId: string): Promise<Student> {
  return updateStudent(userId, { isFlagged: false, flagReason: undefined });
}

// ─── ITEM OPERATIONS ────────────────────────────────────────

export async function getItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapItem);
}

export async function addItem(data: {
  title: string;
  description: string;
  deposit: number;
  category: string;
  ownerId: string;
  ownerName: string;
}): Promise<Item> {
  const { data: rows, error } = await supabase.from('items').select('id').limit(100);
  const imageIndex = (rows?.length || 0) % 6;

  const { data: inserted, error: insertError } = await supabase
    .from('items')
    .insert({
      title: data.title,
      description: data.description,
      deposit: data.deposit,
      category: data.category,
      owner_id: data.ownerId,
      owner_name: data.ownerName,
      is_available: true,
      image_index: imageIndex,
    })
    .select()
    .single();
  if (insertError) throw new Error(insertError.message);
  return mapItem(inserted);
}

export async function updateItemAvailability(itemId: string, isAvailable: boolean): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ is_available: isAvailable })
    .eq('id', itemId);
  if (error) throw new Error(error.message);
}

// ─── BORROW OPERATIONS ──────────────────────────────────────

export async function getBorrows(): Promise<BorrowRecord[]> {
  const { data, error } = await supabase
    .from('borrows')
    .select('*')
    .order('requested_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapBorrow);
}

export async function requestBorrow(data: {
  itemId: string;
  itemTitle: string;
  borrowerId: string;
  ownerId: string;
  daysRequested: number;
}): Promise<BorrowRecord> {
  // Check existing active borrow for this item
  const { data: existing } = await supabase
    .from('borrows')
    .select('id')
    .eq('item_id', data.itemId)
    .in('status', ['pending', 'approved'])
    .limit(1);
  if (existing && existing.length > 0) throw new Error('This item already has a pending or active borrow request.');

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + data.daysRequested);

  const { data: inserted, error } = await supabase
    .from('borrows')
    .insert({
      item_id: data.itemId,
      item_title: data.itemTitle,
      borrower_id: data.borrowerId,
      owner_id: data.ownerId,
      status: 'pending',
      due_date: dueDate.toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapBorrow(inserted);
}

export async function approveBorrow(borrowId: string): Promise<BorrowRecord> {
  const { data, error } = await supabase
    .from('borrows')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', borrowId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await updateItemAvailability(data.item_id, false);
  // Fire notification to borrower
  await createNotification({
    userId: data.borrower_id,
    type: 'borrow_approved',
    title: 'Borrow Request Approved',
    body: `Your request for "${data.item_title}" has been approved! Pick it up and return by ${new Date(data.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`,
    relatedId: borrowId,
  });
  return mapBorrow(data);
}

export async function rejectBorrow(borrowId: string): Promise<BorrowRecord> {
  const { data, error } = await supabase
    .from('borrows')
    .update({ status: 'rejected' })
    .eq('id', borrowId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  // Fire notification to borrower
  await createNotification({
    userId: data.borrower_id,
    type: 'borrow_rejected',
    title: 'Borrow Request Rejected',
    body: `Your request for "${data.item_title}" was not approved by the owner. Try borrowing from another listing.`,
    relatedId: borrowId,
  });
  return mapBorrow(data);
}

export async function returnItem(borrowId: string): Promise<{ borrow: BorrowRecord; student: Student }> {
  const { data: borrow, error: fetchErr } = await supabase
    .from('borrows')
    .select('*')
    .eq('id', borrowId)
    .single();
  if (fetchErr || !borrow) throw new Error('Borrow record not found');

  const { data: updated, error: updateErr } = await supabase
    .from('borrows')
    .update({ status: 'returned', returned_at: new Date().toISOString() })
    .eq('id', borrowId)
    .select()
    .single();
  if (updateErr) throw new Error(updateErr.message);

  await updateItemAvailability(borrow.item_id, true);

  const isOverdue = new Date() > new Date(borrow.due_date);
  let student: Student;
  if (isOverdue) {
    student = await decreaseTrustScore(borrow.borrower_id, 20, `Overdue return: ${borrow.item_title}`);
    await createNotification({
      userId: borrow.borrower_id,
      type: 'trust_score_change',
      title: 'Trust Score Decreased',
      body: `Late return of "${borrow.item_title}". Your trust score dropped by 20 points. Return items on time to maintain a healthy score.`,
      relatedId: borrow.id,
    });
  } else {
    await increaseTrustScore(borrow.borrower_id, 10);
    student = await addRewardPoints(borrow.borrower_id, 10);
    await createNotification({
      userId: borrow.borrower_id,
      type: 'trust_score_change',
      title: 'Trust Score Increased +10',
      body: `On-time return of "${borrow.item_title}"! You earned +10 trust score and +10 reward points. Keep it up!`,
      relatedId: borrow.id,
    });
  }

  return { borrow: mapBorrow(updated), student };
}

export async function checkAndFlagOverdueUsers(): Promise<void> {
  const { data: overdueBorrows } = await supabase
    .from('borrows')
    .select('*')
    .eq('status', 'approved')
    .lt('due_date', new Date().toISOString());

  if (!overdueBorrows || overdueBorrows.length === 0) return;

  for (const b of overdueBorrows) {
    const profile = await getUserById(b.borrower_id) as Student;
    if (profile && !profile.isFlagged) {
      await updateStudent(b.borrower_id, {
        isFlagged: true,
        flagReason: `Overdue item: ${b.item_title}`,
        trustScore: Math.max(0, profile.trustScore - 20),
      });
      await createNotification({
        userId: b.borrower_id,
        type: 'overdue_warning',
        title: 'Item Overdue — Account Flagged',
        body: `"${b.item_title}" is overdue. Your trust score has been reduced by 20 and your account is now flagged. Return the item immediately.`,
        relatedId: b.id,
      });
    }
  }
}

// ─── NOTES OPERATIONS ───────────────────────────────────────

export async function getNotes(): Promise<Note[]> {
  const { data: noteRows, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  if (!noteRows || noteRows.length === 0) return [];

  const noteIds = noteRows.map((n: any) => n.id);
  const { data: commentRows } = await supabase
    .from('note_comments')
    .select('*')
    .in('note_id', noteIds)
    .order('created_at', { ascending: false });

  return noteRows.map((n: any) => {
    const comments = (commentRows || [])
      .filter((c: any) => c.note_id === n.id)
      .map(mapComment);
    return mapNote(n, comments);
  });
}

export async function addNote(data: {
  title: string;
  subject: string;
  description: string;
  uploaderId: string;
  uploaderName: string;
  semester: string;
}): Promise<Note> {
  const { data: inserted, error } = await supabase
    .from('notes')
    .insert({
      title: data.title,
      subject: data.subject,
      description: data.description,
      uploader_id: data.uploaderId,
      uploader_name: data.uploaderName,
      file_type: 'PDF',
      semester: data.semester,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapNote(inserted, []);
}

export async function addNoteComment(
  noteId: string,
  comment: Omit<NoteComment, 'id' | 'createdAt'>
): Promise<Note> {
  const { error } = await supabase.from('note_comments').insert({
    note_id: noteId,
    author_id: comment.authorId,
    author_name: comment.authorName,
    text: comment.text,
    type: comment.type,
  });
  if (error) throw new Error(error.message);

  // Return updated note with comments
  const { data: noteRow } = await supabase.from('notes').select('*').eq('id', noteId).single();
  const { data: commentRows } = await supabase
    .from('note_comments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false });
  return mapNote(noteRow, (commentRows || []).map(mapComment));
}

export async function replyToComment(noteId: string, commentId: string, reply: string): Promise<Note> {
  const { error } = await supabase
    .from('note_comments')
    .update({ reply })
    .eq('id', commentId);
  if (error) throw new Error(error.message);

  const { data: noteRow } = await supabase.from('notes').select('*').eq('id', noteId).single();
  const { data: commentRows } = await supabase
    .from('note_comments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: false });
  return mapNote(noteRow, (commentRows || []).map(mapComment));
}

// ─── NOTICES OPERATIONS ─────────────────────────────────────

export async function getNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapNotice);
}

export async function postNotice(data: {
  title: string;
  content: string;
  isUrgent: boolean;
  postedBy: string;
}): Promise<Notice> {
  const { data: inserted, error } = await supabase
    .from('notices')
    .insert({
      title: data.title,
      content: data.content,
      is_urgent: data.isUrgent,
      posted_by: data.postedBy,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapNotice(inserted);
}

// ─── NOTIFICATIONS ─────────────────────────────────────────

export interface AppNotification {
  id: string;
  userId: string;
  type: 'borrow_approved' | 'borrow_rejected' | 'overdue_warning' | 'trust_score_change' | 'urgent_notice' | 'dispute_opened' | 'dispute_resolved' | 'general';
  title: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    relatedId: row.related_id || undefined,
    createdAt: row.created_at,
  };
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return (data || []).map(mapNotification);
}

export async function createNotification(data: {
  userId: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  relatedId?: string;
}): Promise<AppNotification | null> {
  const { data: inserted, error } = await supabase
    .from('notifications')
    .insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      related_id: data.relatedId || null,
      is_read: false,
    })
    .select()
    .single();
  if (error) return null;
  return mapNotification(inserted);
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function deleteNotification(notifId: string): Promise<void> {
  await supabase.from('notifications').delete().eq('id', notifId);
}

// ─── DISPUTES ────────────────────────────────────────────────

export interface Dispute {
  id: string;
  borrowId: string;
  itemTitle: string;
  raisedBy: string;
  raisedByName: string;
  againstUser: string;
  againstUserName: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

function mapDispute(row: any): Dispute {
  return {
    id: row.id,
    borrowId: row.borrow_id,
    itemTitle: row.item_title,
    raisedBy: row.raised_by,
    raisedByName: row.raised_by_name,
    againstUser: row.against_user,
    againstUserName: row.against_user_name,
    reason: row.reason,
    description: row.description,
    status: row.status,
    adminNotes: row.admin_notes || undefined,
    resolvedAt: row.resolved_at || undefined,
    createdAt: row.created_at,
  };
}

export async function getDisputes(): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapDispute);
}

export async function getUserDisputes(userId: string): Promise<Dispute[]> {
  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .or(`raised_by.eq.${userId},against_user.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map(mapDispute);
}

export async function createDispute(data: {
  borrowId: string;
  itemTitle: string;
  raisedBy: string;
  raisedByName: string;
  againstUser: string;
  againstUserName: string;
  reason: string;
  description: string;
}): Promise<Dispute> {
  const { data: inserted, error } = await supabase
    .from('disputes')
    .insert({
      borrow_id: data.borrowId,
      item_title: data.itemTitle,
      raised_by: data.raisedBy,
      raised_by_name: data.raisedByName,
      against_user: data.againstUser,
      against_user_name: data.againstUserName,
      reason: data.reason,
      description: data.description,
      status: 'open',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapDispute(inserted);
}

export async function updateDisputeStatus(
  disputeId: string,
  status: Dispute['status'],
  adminNotes?: string
): Promise<Dispute> {
  const updates: any = { status };
  if (adminNotes) updates.admin_notes = adminNotes;
  if (status === 'resolved' || status === 'dismissed') updates.resolved_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('disputes')
    .update(updates)
    .eq('id', disputeId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapDispute(data);
}

// ─── AI ASSISTANT ───────────────────────────────────────────

const AI_RESPONSES: Record<string, string> = {
  borrow: "You can borrow items through the Marketplace tab. Search for what you need, click on an item, and send a borrow request. The owner will approve or reject it. Remember: maintain a good trust score to access high-value items!",
  return: "To return a borrowed item, go to Marketplace > Requests and tap 'Return Item'. Returning on time gives you +10 trust score and +10 reward points. Late returns will flag your account.",
  trust: "Your Trust Score starts at 100. It decreases by 20 for overdue returns and increases by 10 for each successful on-time return. Keep your score above 60 to access all items on the platform.",
  reward: "Reward Points are earned by returning items on time (+10 per return). You can achieve three badge levels: Beginner (0-39 pts), Trusted (40-99 pts), and Elite (100+ pts). Earn Elite to unlock premium features!",
  notes: "You can share and access academic notes in the Notes tab. Upload your own notes by clicking the '+' button. You can comment on others' notes to report errors or leave suggestions for the community.",
  notice: "All campus notices are displayed in the Notices tab. Urgent notices are highlighted in orange and appear at the top. Check regularly to stay updated on exams, events, and announcements.",
  flag: "If your account is flagged, you cannot borrow new items. Flags occur due to overdue items or low trust score. Return all overdue items promptly to clear your flag and restore borrowing privileges.",
  help: "I can help you with: borrowing items, returning items, trust score, reward points, sharing notes, and viewing notices. Just type your question and I'll assist you!",
  hi: "Hello! Welcome to Campus Share. I'm your AI assistant. How can I help you today? You can ask me about borrowing, returning, trust scores, notes, or notices!",
  hello: "Hello! Welcome to Campus Share. I'm your AI assistant. How can I help you today? You can ask me about borrowing, returning, trust scores, notes, or notices!",
  score: "Your trust score reflects your reliability on the platform. It starts at 100 and changes based on your behavior. Return items on time to maintain or improve your score.",
  deposit: "Every item on Campus Share has a deposit amount set by the owner. This is a security measure to ensure items are returned in good condition.",
  item: "To list an item, go to Marketplace and click the '+' button. Fill in the title, description, category, and deposit amount. Your item will be visible to all students on campus.",
  admin: "The Admin Dashboard is accessible only to campus administrators. Admins can view all users, manage flagged accounts, post notices, and monitor platform activity.",
};

export function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return "That's a great question! Campus Share helps students borrow items, share notes, and stay updated with campus notices. Try asking about 'borrowing', 'trust score', 'reward points', or 'notes' for more specific help!";
}

// ─── UTILS ──────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export function isOverdue(dueDate: string): boolean {
  return new Date() > new Date(dueDate);
}

// ─── DEMO SEED ─────────────────────────────────────────────

export async function seedDemoDataForUser(userId: string, userName: string): Promise<void> {
  // Only seed if no items exist yet
  const { data: existing } = await supabase.from('items').select('id').limit(1);
  if (existing && existing.length > 0) return;

  // Seed items for the demo student
  const demoItems = [
    {
      title: 'Scientific Calculator (Casio FX-991)',
      description: 'Advanced scientific calculator, perfect for engineering exams. Well maintained.',
      deposit: 200,
      owner_id: userId,
      owner_name: userName,
      is_available: true,
      category: 'Electronics',
      image_index: 0,
    },
    {
      title: 'Circuit Board Toolkit',
      description: 'Complete toolkit with soldering iron, multimeter, and components for lab projects.',
      deposit: 500,
      owner_id: userId,
      owner_name: userName,
      is_available: true,
      category: 'Lab Equipment',
      image_index: 1,
    },
    {
      title: 'Engineering Drawing Board',
      description: 'A3 size drawing board with T-square and set squares included.',
      deposit: 150,
      owner_id: userId,
      owner_name: userName,
      is_available: true,
      category: 'Stationery',
      image_index: 2,
    },
    {
      title: 'Arduino Starter Kit',
      description: 'Complete Arduino Uno kit with sensors, LEDs, resistors, and breadboard.',
      deposit: 800,
      owner_id: userId,
      owner_name: userName,
      is_available: true,
      category: 'Electronics',
      image_index: 3,
    },
  ];

  await supabase.from('items').insert(demoItems);

  // Seed notes
  const demoNotes = [
    {
      title: 'Data Structures - Complete Module 1',
      subject: 'Data Structures & Algorithms',
      description: 'Comprehensive notes covering Arrays, Linked Lists, Stacks and Queues with examples and time complexity analysis.',
      uploader_id: userId,
      uploader_name: userName,
      file_type: 'PDF',
      semester: '3rd Sem',
    },
    {
      title: 'Engineering Mathematics - Integration Formulas',
      subject: 'Engineering Mathematics',
      description: 'Quick reference sheet for all integration formulas, with solved examples and tips for exams.',
      uploader_id: userId,
      uploader_name: userName,
      file_type: 'PDF',
      semester: '2nd Sem',
    },
  ];

  await supabase.from('notes').insert(demoNotes);
}

// Legacy no-op — backend now initializes via Supabase
export async function initializeBackend(): Promise<void> {}
