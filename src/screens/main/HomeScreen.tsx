import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Post } from '../../components/Post';
import { theme } from '../../theme';
import type { Post as PostType } from '../../types/post';

export function HomeScreen() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const currentUser = auth.currentUser;
      const fetchedPosts = await Promise.all(querySnapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        
        // Kullanıcı bilgilerini al
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        const userData = userDoc.data();

        return {
          id: docSnapshot.id,
          ...data,
          username: data.username || userData?.displayName || 'İsimsiz Kullanıcı',
          userAvatar: data.userAvatar || userData?.photoURL || null,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          isLiked: currentUser ? data.likes.includes(currentUser.uid) : false,
        } as PostType;
      }));

      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Gönderiler yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchPosts().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleLike = async (post: PostType) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', post.id);
      if (post.isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
      
      // Yerel state'i güncelle
      setPosts(currentPosts => 
        currentPosts.map(p => 
          p.id === post.id 
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked 
                  ? p.likes.filter(id => id !== user.uid)
                  : [...p.likes, user.uid]
              }
            : p
        )
      );
    } catch (error) {
      console.error('Beğeni işlemi başarısız:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Gönderiler</Text>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Henüz hiç gönderi yok</Text>
      <Text style={styles.emptySubtext}>İlk gönderiyi sen paylaş!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Post
            post={item}
            onLike={() => handleLike(item)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
}); 