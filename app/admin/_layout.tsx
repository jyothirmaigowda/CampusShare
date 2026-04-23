import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

export default function AdminLayout() {
  const { user, isInitialized } = useAuth();
  if (!isInitialized) return null;
  if (!user) return <Redirect href="/" />;
  if (user.role !== 'admin') return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
