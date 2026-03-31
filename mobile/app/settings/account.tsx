import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import SectionCard from '../../components/settings/SectionCard';
import SettingItem from '../../components/settings/SettingItem';
import { authService } from '../../services/auth.service';

export default function AccountSettingsScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Logout failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionCard title="Account Controls">
          <SettingItem icon="edit" title="Edit Profile" subtitle="Update your personal details" onPress={() => router.push('/profile' as any)} />
          <SettingItem icon="lock-reset" title="Change Password" subtitle="Update account password" onPress={() => Alert.alert('Coming soon', 'Password update flow can be connected here.')} />
          <SettingItem icon="logout" title="Logout" subtitle="Sign out from this device" onPress={handleLogout} />
          <SettingItem icon="delete-forever" title="Delete Account" subtitle="Permanently remove your account" onPress={() => Alert.alert('Delete account', 'Account deletion request started.')} />
        </SectionCard>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 120 },
  backButton: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
});
