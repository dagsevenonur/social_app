import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Post } from '../../components/Post';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Post as PostType } from '../../types/post';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
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

        const post: PostType = {
          id: docSnapshot.id,
          userId: data.userId,
          username: data.username || userData?.displayName || 'İsimsiz Kullanıcı',
          userPhotoURL: data.userAvatar || userData?.photoURL || null,
          imageUrl: data.imageUrl,
          caption: data.caption,
          likes: data.likes || [],
          comments: data.comments || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isLiked: currentUser ? (data.likes || []).includes(currentUser.uid) : false,
        };

        return post;
      }));

      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Gönderiler yüklenirken hata:', error);
    }
  };

  // Gönderi güncellendiğinde yerel state'i güncelle
  const handlePostUpdate = (updatedPost: PostType) => {
    setPosts(currentPosts => 
      currentPosts.map(p => p.id === updatedPost.id ? updatedPost : p)
    );
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Keşfet</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('CreatePost')}>
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Chat')}>
          <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <Post 
              post={item} 
              onLike={() => handleLike(item)}
              onPostUpdate={handlePostUpdate}
            />
          )}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz gönderi yok</Text>
              <Text style={styles.emptySubtext}>İlk gönderiyi sen paylaş!</Text>
            </View>
          }
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerButton: {
    padding: theme.spacing.xs,
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