import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import type { Post as PostType } from '../types/post';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type PostScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface PostProps {
  post: PostType;
  onLike?: () => void;
  onPostUpdate?: (post: PostType) => void;
}

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width;

export function Post({ post, onLike, onPostUpdate }: PostProps) {
  const navigation = useNavigation<PostScreenNavigationProp>();
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleComment = () => {
    navigation.navigate('Comments', { 
      post,
      onUpdate: (updatedPost: PostType) => {
        onPostUpdate?.(updatedPost);
      }
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
          <View>
            <Text style={styles.username}>{post.username}</Text>
            <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <Image
        source={{ uri: post.imageUrl }}
        style={styles.image}
        onError={() => setImageError(true)}
      />

      <View style={styles.footer}>
        <View style={styles.actions}>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={onLike} style={styles.actionButton}>
              <Ionicons 
                name={post.isLiked ? "heart" : "heart-outline"} 
                size={28} 
                color={post.isLiked ? theme.colors.error : theme.colors.text} 
              />
              {post.likes.length > 0 && (
                <Text style={styles.actionCount}>{post.likes.length}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleComment} style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={26} color={theme.colors.text} />
              {post.comments.length > 0 && (
                <Text style={styles.actionCount}>{post.comments.length}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.username}</Text>
            {' '}{post.caption}
          </Text>
        </View>

        {post.comments.length > 0 && (
          <TouchableOpacity onPress={handleComment}>
            <Text style={styles.commentsText}>
              {post.comments.length} yorumun tümünü gör
            </Text>
          </TouchableOpacity>
        )}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  date: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    padding: theme.spacing.sm,
    marginRight: -theme.spacing.sm,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: theme.colors.surface,
  },
  footer: {
    paddingTop: theme.spacing.xs,
  },
  actions: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xs,
    marginLeft: -theme.spacing.xs,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  caption: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  commentsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  actionCount: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
}); 