import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { AVATARS } from './AvatarSelector';
import { getImageUrl } from '../services/api';

interface ProfileAvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
}

export default function ProfileAvatar({ name, photoUrl, size = 60 }: ProfileAvatarProps) {
  // If photoUrl is an avatar ID
  const avatar = AVATARS.find(a => a.id === photoUrl);
  
  if (avatar) {
    return (
      <View style={[styles.container, { width: size, height: size, backgroundColor: avatar.color }]}>
        <Text style={[styles.emoji, { fontSize: size * 0.6 }]}>{avatar.emoji}</Text>
      </View>
    );
  }
  
  // If photoUrl is an actual photo URL or path
  if (photoUrl) {
    const imageUrl = getImageUrl(photoUrl);
    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.container, { width: size, height: size }]}
        />
      );
    }
  }
  
  // Default: Show first letter of name
  const initial = name.charAt(0).toUpperCase();
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  const colorIndex = initial.charCodeAt(0) % colors.length;
  
  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: colors[colorIndex] }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emoji: {
    textAlign: 'center',
  },
});
