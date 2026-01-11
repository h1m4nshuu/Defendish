import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, TextInput, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { profileService } from '../../services/profile.service';

export default function SelectProfileScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileService.getProfiles();
      setProfiles(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profile: any) => {
    setSelectedProfile(profile);
    setShowPasswordModal(true);
  };

  const handleVerifyPassword = async () => {
    console.log('Verify button clicked');
    console.log('Password length:', password.length);
    
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setVerifying(true);
      console.log('Sending verification request...');
      await profileService.verifyPasswordForSwitch(password);
      console.log('Verification successful');
      await profileService.setCurrentProfile(selectedProfile);
      
      // Handle web vs native differently
      if (Platform.OS === 'web') {
        // On web, just show alert and navigate immediately
        alert(`Switched to ${selectedProfile.name}'s profile`);
        router.replace('/(tabs)');
      } else {
        // On native, use Alert.alert with callback
        Alert.alert('Success', `Switched to ${selectedProfile.name}'s profile`, [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Incorrect account password. Please enter the password you use to login.';
      
      if (Platform.OS === 'web') {
        alert('Error: ' + errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setVerifying(false);
      setPassword('');
    }
  };

  const cancelPasswordVerification = () => {
    setShowPasswordModal(false);
    setSelectedProfile(null);
    setPassword('');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Profile</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyText}>No profiles yet</Text>
          <Text style={styles.emptySubtext}>Create your first profile to get started</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/profile/create')}
          >
            <Text style={styles.createButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showPasswordModal) {
    return (
      <View style={styles.container}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Your Account Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your account password (used for login) to switch to {selectedProfile?.name}'s profile
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your account password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoFocus
                editable={!verifying}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.monkeyEmoji}>
                  {showPassword ? '🐵' : '🙈'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={cancelPasswordVerification}
                disabled={verifying}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.verifyButton, verifying && styles.buttonDisabled]}
                onPress={handleVerifyPassword}
                disabled={verifying}
              >
                <Text style={styles.verifyButtonText}>
                  {verifying ? 'Verifying...' : 'Verify'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Profile</Text>
        <Text style={styles.headerSubtitle}>Choose who's using the app</Text>
      </View>

      <View style={styles.profileList}>
        {profiles.map((profile: any) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.profileCard}
            onPress={() => handleProfileSelect(profile)}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileCardName}>{profile.name}</Text>
              <Text style={styles.profileRelation}>
                {profile.relation.charAt(0).toUpperCase() + profile.relation.slice(1)}
              </Text>
              {profile.allergies && profile.allergies.length > 0 && (
                <Text style={styles.allergyCount}>
                  {profile.allergies.length} allergie(s)
                </Text>
              )}
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addProfileCard}
          onPress={() => router.push('/profile/create')}
        >
          <Text style={styles.addProfileIcon}>+</Text>
          <Text style={styles.addProfileText}>Create New Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileList: {
    padding: 20,
    gap: 12,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 700,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileRelation: {
    fontSize: 14,
    color: '#6b7280',
  },
  allergyCount: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  addProfileCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 8,
  },
  addProfileIcon: {
    fontSize: 24,
    color: '#2563eb',
  },
  addProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  profileName: {
    fontWeight: '600',
    color: '#2563eb',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 24,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monkeyEmoji: {
    fontSize: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  verifyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
