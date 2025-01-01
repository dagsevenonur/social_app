import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import type { Post as PostType } from '../types/post';
import { auth } from '../services/firebase';

interface PostProps {
  post: PostType;
  onLike?: () => void;
  onComment?: () => void;
  onPostUpdate?: (updatedPost: PostType) => void;
}

export function Post({ post, onLike, onComment, onPostUpdate }: PostProps) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const handleComment = () => {
    navigation.navigate('Comments', { post });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => navigation.navigate('UserProfile', { userId: post.userId })}
        >
          {post.userPhotoURL ? (
            <Image source={{ uri: post.userPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
            </View>
          )}
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timestamp}>
          {(() => {
            const now = new Date();
            const postDate = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
            const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
            
            if (diffInMinutes < 1) return 'Az önce';
            if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
            
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours} saat önce`;
            
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays} gün önce`;
            
            const diffInWeeks = Math.floor(diffInDays / 7);
            if (diffInWeeks < 4) return `${diffInWeeks} hafta önce`;
            
            const diffInMonths = Math.floor(diffInDays / 30);
            if (diffInMonths < 12) return `${diffInMonths} ay önce`;
            
            const diffInYears = Math.floor(diffInDays / 365);
            return `${diffInYears} yıl önce`;
          })()}
        </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Image source={{ uri: post.imageUrl }} style={styles.image} />

      <View style={styles.content}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons 
              name={post.likes.includes(auth.currentUser?.uid || '') ? "heart" : "heart-outline"} 
              size={24} 
              color={post.likes.includes(auth.currentUser?.uid || '') ? theme.colors.error : theme.colors.text} 
            />
            <Text style={styles.actionCount}>{post.likes.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <Ionicons name="chatbubble-outline" size={24} color={theme.colors.text} />
            <Text style={styles.actionCount}>{post.comments.length}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.caption}>
          <Text key="username" style={styles.username}>{post.username}</Text>
          <Text key="caption">{' '}{post.caption}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  moreButton: {
    padding: theme.spacing.xs,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.md,
  },
  caption: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
}); 