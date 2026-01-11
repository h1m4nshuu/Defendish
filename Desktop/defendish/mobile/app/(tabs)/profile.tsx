import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function ProfileScreen() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  // Reload profiles when screen comes into focus
  useFocusEffect(() => {
    loadProfiles();
  });

  const loadProfiles = async () => {
    try {
      const response = await profileService.getProfiles();
      setProfiles(response.data);
      const current = await profileService.getCurrentProfile();
      setCurrentProfile(current);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profiles');
    }
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
      // Use native confirm on web
      if (confirm('Are you sure you want to logout?')) {
        await performLogout();
      }
    } else {
      // Use Alert.alert on mobile
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
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
        <Text style={styles.sectionTitle}>All Profiles</Text>
        {profiles.map((profile: any) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.profileCard}
            onPress={() =>
              router.push({ pathname: '/profile/select', params: { action: 'switch' } })
            }
          >
            <View>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileRelation}>{profile.relation}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addProfileButton}
          onPress={() => router.push('/profile/create')}
        >
          <Text style={styles.addProfileText}>+ Add New Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Health Records</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Health Incidents</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Settings</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  profileRelation: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  addProfileButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addProfileText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 100,
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
});
