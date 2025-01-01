import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          isLiked: currentUser ? data.likes.includes(currentUser.uid) : false,
        } as PostType;
      });

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

  return (
    <SafeAreaView style={styles.container}>
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
}); 