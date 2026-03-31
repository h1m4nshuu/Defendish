import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import ProfileAvatar from '../../components/ProfileAvatar';
import { useTheme } from '../../hooks/useTheme';

export default function ProfileScreen() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const { colors } = useTheme();

  useEffect(() => {
    loadProfiles();
  }, []);

  // Reload profiles when screen comes into focus
  useFocusEffect(() => {
    loadProfiles();
  });

  const loadProfiles = async () => {
    try {
      const current = await profileService.getCurrentProfile();
      setCurrentProfile(current);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profiles');
    }
  };

  const getProfileIcon = (profile: any) => {
    const relation = String(profile?.relation || '').toLowerCase();
    if (relation.includes('self')) return 'account-circle-outline';
    if (relation.includes('child') || relation.includes('kid')) return 'baby-face-outline';
    if (relation.includes('spouse') || relation.includes('wife') || relation.includes('husband')) return 'heart-outline';
    if (relation.includes('parent') || relation.includes('mother') || relation.includes('father')) return 'account-supervisor-outline';
    return 'account-outline';
  };

  const handleHealthIncidents = () => {
    Alert.alert('Coming soon', 'Health Incidents will be available in a future update.');
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await authService.logout();
        router.replace('/login');
      } catch (error) {
        console.error('Logout error:', error);
        router.replace('/login');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to logout?')) {
        await performLogout();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: performLogout,
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      {currentProfile && (
        <View style={styles.currentProfileCard}>
          <View style={styles.currentProfileHeader}>
            <Text style={styles.currentProfileLabel}>Current Profile</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push({
                pathname: '/profile/edit',
                params: { profileId: currentProfile.id }
              })}
            >
              <Text style={styles.editButtonText}>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfoRow}>
            <ProfileAvatar 
              name={currentProfile.name}
              photoUrl={currentProfile.photoUrl}
              size={80}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.currentProfileName}>{currentProfile.name}</Text>
              <Text style={styles.currentProfileDetail}>
                {currentProfile.relation.charAt(0).toUpperCase() +
                  currentProfile.relation.slice(1)}
              </Text>
            </View>
          </View>
          {currentProfile.allergies && currentProfile.allergies.length > 0 && (
            <View style={styles.allergyContainer}>
              <Text style={styles.allergyLabel}>Allergies:</Text>
              {currentProfile.allergies.slice(0, 2).map((allergy: string, index: number) => (
                <View key={index} style={styles.allergyBadge}>
                  <Text style={styles.allergyText}>{allergy}</Text>
                </View>
              ))}
              {currentProfile.allergies.length > 2 && (
                <View style={styles.allergyBadge}>
                  <Text style={styles.allergyText}>
                    +{currentProfile.allergies.length - 2} more
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.switchProfileButton, { backgroundColor: colors.card }]}
          onPress={() =>
            router.push({ pathname: '/profile/select', params: { action: 'switch' } })
          }
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.infoBackground }]}>
            <MaterialCommunityIcons
              name="account-switch-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.switchProfileText, { color: colors.text }]}>Switch or Add Profile</Text>
          <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/profile/medicines')}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.infoBackground }]}>
            <MaterialCommunityIcons name="pill" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.menuItemText, { color: colors.text }]}>Dose Reminder</Text>
          <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => router.push('/settings/health')}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.infoBackground }]}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.menuItemText, { color: colors.text }]}>Health Records</Text>
          <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={handleHealthIncidents}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.infoBackground }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.menuItemText, { color: colors.text }]}>Health Incidents</Text>
          <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  currentProfileCard: {
    backgroundColor: '#2563eb',
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  currentProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentProfileLabel: {
    color: '#bfdbfe',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  currentProfileName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentProfileDetail: {
    color: '#e0e7ff',
    fontSize: 16,
  },
  allergyContainer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyLabel: {
    color: '#e0e7ff',
    fontSize: 14,
    width: '100%',
    marginBottom: 4,
  },
  allergyBadge: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  allergyText: {
    color: '#ffffff',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  switchProfileButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  switchProfileText: {
    fontSize: 16,
    flex: 1,
    color: '#1f2937',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  menuItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    flex: 1,
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  spacer: {
    height: 100,
  },
});
