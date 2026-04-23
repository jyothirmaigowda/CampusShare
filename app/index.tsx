import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { NeonInput } from '@/components/ui/NeonInput';
import { NeonButton } from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

type Tab = 'login' | 'register';
type Role = 'student' | 'admin';

export default function AuthScreen() {
  const router = useRouter();
  const { user, login, register, isLoading, isInitialized } = useAuth();
  const { showAlert } = useAlert();

  const [tab, setTab] = useState<Tab>('login');
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (isInitialized && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [user, isInitialized]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Minimum 6 characters';
    if (tab === 'register') {
      if (!name.trim()) errs.name = 'Name is required';
      if (!usn.trim()) errs.usn = 'USN is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      showAlert('Login Failed', err.message || 'Invalid credentials');
    }
  }

  async function handleRegister() {
    if (!validate()) return;
    try {
      await register({ name: name.trim(), email: email.trim(), usn: usn.trim(), password });
    } catch (err: any) {
      showAlert('Registration Failed', err.message || 'Something went wrong');
    }
  }

  function fillDemo(r: Role) {
    if (r === 'admin') {
      setEmail('admin@campus.edu');
      setPassword('Admin@123456');
    } else {
      // Student demo: pre-fill register form with demo data
      setName('Arjun Sharma');
      setUsn('CS21001');
      setEmail('arjun@campus.edu');
      setPassword('Student@123');
      setTab('register');
      setRole('student');
    }
    if (r === 'admin') {
      setTab('login');
      setRole(r);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.heroWrap, { opacity: fadeAnim }]}>
            <Image source={require('@/assets/images/hero.png')} style={styles.heroImage} contentFit="cover" transition={400} />
            <View style={styles.heroOverlay} />
            <View style={styles.logoArea}>
              <View style={styles.logoBadge}>
                <MaterialIcons name="school" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.appName}>Campus Share</Text>
              <Text style={styles.tagline}>Borrow. Learn. Connect.</Text>
            </View>
          </Animated.View>

          <View style={styles.formCard}>
            {/* Role Switcher */}
            <View style={styles.roleRow}>
              {(['student', 'admin'] as Role[]).map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => { setRole(r); if (r === 'admin') setTab('login'); }}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                >
                  <MaterialIcons
                    name={r === 'admin' ? 'admin-panel-settings' : 'person'}
                    size={16}
                    color={role === r ? Colors.primary : Colors.textMuted}
                  />
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                    {r === 'admin' ? 'Admin' : 'Student'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab */}
            {role === 'student' ? (
              <View style={styles.tabRow}>
                {(['login', 'register'] as Tab[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTab(t)}
                    style={[styles.tab, tab === t && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                      {t === 'login' ? 'Login' : 'Register'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Form */}
            {tab === 'register' && role === 'student' ? (
              <NeonInput label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" autoCapitalize="words" error={errors.name} />
            ) : null}
            {tab === 'register' && role === 'student' ? (
              <NeonInput label="USN" value={usn} onChangeText={setUsn} placeholder="e.g. CS21001" autoCapitalize="characters" error={errors.usn} />
            ) : null}
            <NeonInput label="Email" value={email} onChangeText={setEmail} placeholder="you@campus.edu" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
            <NeonInput label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry error={errors.password} />

            <NeonButton
              label={tab === 'login' ? `Login as ${role === 'admin' ? 'Admin' : 'Student'}` : 'Create Account'}
              onPress={tab === 'login' ? handleLogin : handleRegister}
              loading={isLoading}
              fullWidth
            />

            {/* Demo Quick Fill */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Quick Demo — Student: fills register form · Admin: fills login</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity onPress={() => fillDemo('student')} style={styles.demoBtn}>
                  <MaterialIcons name="person" size={14} color={Colors.accent} />
                  <Text style={[styles.demoBtnText, { color: Colors.accent }]}>Student Demo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => fillDemo('admin')} style={[styles.demoBtn, styles.demoBtnAdmin]}>
                  <MaterialIcons name="admin-panel-settings" size={14} color={Colors.warning} />
                  <Text style={[styles.demoBtnText, { color: Colors.warning }]}>Admin Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  heroWrap: { height: 260, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 16, 0.6)',
  },
  logoArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingBottom: Spacing.lg,
  },
  logoBadge: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primaryGlow, borderWidth: 1.5,
    borderColor: Colors.primary + '60', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  appName: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  tagline: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: 2 },
  formCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.lg, paddingBottom: 36,
    borderTopWidth: 1, borderColor: Colors.border,
    flex: 1, minHeight: 440,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  roleChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  roleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  roleText: { fontSize: FontSize.base, color: Colors.textMuted, fontWeight: '500' },
  roleTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.lg },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.base, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: '#ffffff', fontWeight: FontWeight.semibold },
  demoSection: { marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderColor: Colors.divider },
  demoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.sm },
  demoRow: { flexDirection: 'row', gap: Spacing.sm },
  demoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.accent + '40', backgroundColor: Colors.accentGlow,
  },
  demoBtnAdmin: { borderColor: Colors.warning + '40', backgroundColor: Colors.warningGlow },
  demoBtnText: { fontSize: FontSize.sm, fontWeight: '600' },
});
