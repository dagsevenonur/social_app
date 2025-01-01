import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { Post as PostType } from '../types/post';

interface PostProps {
  post: PostType;
  onLike?: () => void;
  onComment?: () => void;
}

export function Post({ post, onLike, onComment }: PostProps) {
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {post.userAvatar && !avatarError ? (
          <Image 
            source={{ uri: post.userAvatar }} 
            style={styles.avatar}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
          </View>
        )}
        <Text style={styles.username}>{post.username}</Text>
      </View>

      <Image
        source={{ uri: post.imageUrl }}
        style={styles.image}
        onError={() => setImageError(true)}
      />

      <View style={styles.actions}>
        <TouchableOpacity onPress={onLike} style={styles.actionButton}>
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={post.isLiked ? theme.colors.error : theme.colors.text} 
          />
          {post.likes.length > 0 && (
            <Text style={styles.actionText}>{post.likes.length}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onComment} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color={theme.colors.text} />
          {post.comments.length > 0 && (
            <Text style={styles.actionText}>{post.comments.length}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.caption}>{post.caption}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: theme.colors.surface,
  },
  actions: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  caption: {
    fontSize: 14,
    color: theme.colors.text,
  },
}); 