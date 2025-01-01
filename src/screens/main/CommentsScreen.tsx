import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Input } from '../../components/Input';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import type { Comment } from '../../types/post';

type Props = NativeStackScreenProps<MainStackParamList, 'Comments'>;

export function CommentsScreen({ route, navigation }: Props) {
  const { post, onUpdate } = route.params;
  const [comments, setComments] = useState(post.comments);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!comment.trim() || sending) return;

    const user = auth.currentUser;
    if (!user) return;

    setSending(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      const newComment: Comment = {
        id: Date.now().toString(),
        userId: user.uid,
        username: userData?.displayName || user.displayName || 'İsimsiz Kullanıcı',
        userAvatar: userData?.photoURL || user.photoURL || undefined,
        text: comment.trim(),
        createdAt: new Date(),
      };

      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
        updatedAt: serverTimestamp(),
      });

      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      setComment('');

      onUpdate?.({
        ...post,
        comments: updatedComments,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Yorum gönderme hatası:', error);
    } finally {
      setSending(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        {item.userAvatar ? (
          <Image 
            source={{ uri: item.userAvatar }} 
            style={styles.avatar}
            onError={() => {}}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
          </View>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentMeta}>
            <Text style={styles.commentUsername}>{item.username}</Text>
            <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    </View>
  );

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yorumlar</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz yorum yapılmamış</Text>
              <Text style={styles.emptySubtext}>İlk yorumu sen yap!</Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.inputContainer}>
          <Input
            placeholder="Yorum yaz..."
            value={comment}
            onChangeText={setComment}
            style={styles.input}
            multiline
          />
          <TouchableOpacity 
            onPress={handleSend} 
            style={[
              styles.sendButton,
              (!comment.trim() || sending) && styles.sendButtonDisabled
            ]}
            disabled={!comment.trim() || sending}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={!comment.trim() || sending ? theme.colors.textSecondary : theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  commentContainer: {
    marginBottom: theme.spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.md,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  commentDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    marginRight: theme.spacing.md,
    marginVertical: 0,
  },
  sendButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 