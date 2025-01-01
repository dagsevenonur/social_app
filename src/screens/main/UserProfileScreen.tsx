import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, onSnapshot, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import type { Post as PostType } from '../../types/post';

type Props = NativeStackScreenProps<MainStackParamList, 'UserProfile'>;

interface UserProfile {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  website?: string;
  location?: string;
  email?: string;
}

export function UserProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<Props['route']>();
  const { userId } = route.params;
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState<UserProfile>({});
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0
  });

  useEffect(() => {
    // Profil bilgilerini dinle
    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
      }
    );

    // Kullanıcının gönderilerini getir
    const fetchPosts = async () => {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const userPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as PostType[];

      setPosts(userPosts);
      setLoading(false);
    };

    // Takip durumunu kontrol et
    const checkFollowStatus = async () => {
      if (!currentUser) return;
      
      const followRef = doc(db, 'follows', currentUser.uid);
      const followDoc = await getDoc(followRef);
      if (followDoc.exists()) {
        const followData = followDoc.data();
        setIsFollowing(followData.following?.includes(userId) || false);
      }
    };

    // Takipçi ve takip sayılarını getir
    const fetchStats = async () => {
      // Kullanıcının takip ettiklerini getir
      const userFollowsRef = doc(db, 'follows', userId);
      const userFollowsDoc = await getDoc(userFollowsRef);
      const following = userFollowsDoc.exists() ? userFollowsDoc.data().following?.length || 0 : 0;

      // Kullanıcının takipçilerini getir
      const followersQuery = query(collection(db, 'follows'), where('following', 'array-contains', userId));
      const followersSnapshot = await getDocs(followersQuery);
      const followers = followersSnapshot.size;

      setStats({
        followers,
        following,
        posts: posts.length
      });
    };

    fetchPosts();
    checkFollowStatus();
    fetchStats();
    return () => unsubscribeProfile();
  }, [userId, currentUser, posts]);

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      const followRef = doc(db, 'follows', currentUser.uid);
      const followDoc = await getDoc(followRef);

      if (!followDoc.exists()) {
        // Kullanıcının follows dökümanını oluştur
        await setDoc(followRef, {
          following: [],
          followers: [],
          updatedAt: serverTimestamp()
        });
      }

      if (isFollowing) {
        await updateDoc(followRef, {
          following: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(followRef, {
          following: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Takip işlemi başarısız:', error);
      Alert.alert('Hata', 'Takip işlemi sırasında bir hata oluştu');
    }
  };

  const renderPost = ({ item }: { item: PostType }) => (
    <TouchableOpacity 
      style={styles.postContainer}
      onPress={() => navigation.navigate('Comments', { post: item })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <Ionicons name="heart" size={16} color={theme.colors.text} />
          <Text style={styles.postStatText}>{item.likes.length}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble" size={16} color={theme.colors.text} />
          <Text style={styles.postStatText}>{item.comments.length}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.displayName || 'Profil'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.profileInfo}>
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={40} color={theme.colors.textSecondary} />
            </View>
          )}
          
          <Text style={styles.username}>{profile.displayName || 'İsimsiz Kullanıcı'}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statCount}>{stats.posts}</Text>
              <Text style={styles.statLabel}>Gönderi</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statCount}>{stats.followers}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statCount}>{stats.following}</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </View>
          </View>

          {(profile.website || profile.location || profile.email) && (
            <View style={styles.contactInfo}>
              {profile.website && (
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="globe-outline" size={20} color={theme.colors.text} />
                  <Text style={styles.contactText}>{profile.website}</Text>
                </TouchableOpacity>
              )}
              {profile.location && (
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="location-outline" size={20} color={theme.colors.text} />
                  <Text style={styles.contactText}>{profile.location}</Text>
                </TouchableOpacity>
              )}
              {profile.email && (
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.text} />
                  <Text style={styles.contactText}>{profile.email}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Button 
            title={isFollowing ? "Takibi Bırak" : "Takip Et"}
            variant={isFollowing ? "outline" : "primary"}
            onPress={handleFollow}
            style={styles.followButton}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Henüz gönderi yok</Text>
              </View>
            }
          />
        )}
      </ScrollView>
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
  profileInfo: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.md,
  },
  avatarFallback: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bio: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  stat: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statCount: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  followButton: {
    marginBottom: theme.spacing.lg,
  },
  postContainer: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 1,
  },
  postImage: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  postStats: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postStatText: {
    fontSize: 12,
    color: 'white',
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  contactInfo: {
    width: '100%',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  contactText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
}); 