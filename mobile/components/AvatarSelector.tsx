import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';

const AVATARS = [
  { id: 'avatar1', emoji: '👤', color: '#3b82f6' },
  { id: 'avatar2', emoji: '👨', color: '#8b5cf6' },
  { id: 'avatar3', emoji: '👩', color: '#ec4899' },
  { id: 'avatar4', emoji: '👶', color: '#f59e0b' },
  { id: 'avatar5', emoji: '👧', color: '#10b981' },
  { id: 'avatar6', emoji: '👦', color: '#06b6d4' },
  { id: 'avatar7', emoji: '🧑', color: '#6366f1' },
  { id: 'avatar8', emoji: '👴', color: '#84cc16' },
  { id: 'avatar9', emoji: '👵', color: '#f97316' },
  { id: 'avatar10', emoji: '🧔', color: '#14b8a6' },
  { id: 'avatar11', emoji: '🧓', color: '#a855f7' },
  { id: 'avatar12', emoji: '👨‍⚕️', color: '#ef4444' },
  { id: 'avatar13', emoji: '👩‍⚕️', color: '#22c55e' },
  { id: 'avatar14', emoji: '👨‍🎓', color: '#3b82f6' },
  { id: 'avatar15', emoji: '👩‍🎓', color: '#ec4899' },
  { id: 'avatar16', emoji: '🧑‍💼', color: '#8b5cf6' },
];

interface AvatarSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (avatarId: string) => void;
  selectedAvatar?: string;
}

export default function AvatarSelector({ visible, onClose, onSelect, selectedAvatar }: AvatarSelectorProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Avatar</Text>
          <ScrollView style={styles.avatarGrid} contentContainerStyle={styles.avatarGridContent}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarOption,
                  { backgroundColor: avatar.color },
                  selectedAvatar === avatar.id && styles.avatarSelected,
                ]}
                onPress={() => {
                  onSelect(avatar.id);
                  onClose();
                }}
              >
                <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarGrid: {
    maxHeight: 400,
  },
  avatarGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarSelected: {
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
});

export { AVATARS };
