import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { userId } = route.params;
  const currentUser = auth.currentUser;

  const [profile, setProfile] = useState<UserProfile>({});
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Kullanıcı profilini dinle
    const unsubscribeProfile = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
      setLoading(false);
    });

    // Kullanıcının gönderilerini al
    const fetchPosts = async () => {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const userPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostType[];
      setPosts(userPosts);
    };

    // Takip durumunu kontrol et
    const checkFollowStatus = async () => {
      if (!currentUser) return;
      const followRef = doc(db, 'follows', currentUser.uid);
      const followDoc = await getDoc(followRef);
      if (followDoc.exists()) {
        const data = followDoc.data();
        setIsFollowing(data?.following?.includes(userId) || false);
      }
    };

    // Takipçi ve takip edilen sayılarını al
    const fetchFollowCounts = async () => {
      const followersRef = collection(db, 'follows');
      const followersQ = query(followersRef, where('following', 'array-contains', userId));
      const followersSnapshot = await getDocs(followersQ);
      setFollowersCount(followersSnapshot.size);

      const followingDoc = await getDoc(doc(db, 'follows', userId));
      if (followingDoc.exists()) {
        const data = followingDoc.data();
        setFollowingCount(data?.following?.length || 0);
      }
    };

    fetchPosts();
    checkFollowStatus();
    fetchFollowCounts();

    return () => {
      unsubscribeProfile();
    };
  }, [userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      const followRef = doc(db, 'follows', currentUser.uid);
      const followDoc = await getDoc(followRef);

      if (!followDoc.exists()) {
        // Kullanıcının follows dökümanını oluştur
        await setDoc(followRef, {
          following: [],
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.displayName || 'Kullanıcı'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={40} color={theme.colors.textSecondary} />
            </View>
          )}

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Gönderi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </View>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.displayName}>{profile.displayName || 'İsimsiz Kullanıcı'}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          {profile.website && (
            <Text style={styles.website} onPress={() => Linking.openURL(profile.website || '')}>
              {profile.website}
            </Text>
          )}
          {profile.location && <Text style={styles.location}>{profile.location}</Text>}
        </View>

        {currentUser && currentUser.uid !== userId && (
          <View style={styles.actionButtons}>
            <Button
              title={isFollowing ? "Takibi Bırak" : "Takip Et"}
              onPress={handleFollow}
              variant={isFollowing ? "outline" : "primary"}
              style={styles.followButton}
            />
            <Button
              title="Mesaj"
              onPress={() => {/* Mesajlaşma özelliği eklenecek */}}
              variant="outline"
              style={styles.messageButton}
            />
          </View>
        )}

        <View style={styles.postsGrid}>
          {posts.map(post => (
            <Image
              key={post.id}
              source={{ uri: post.imageUrl }}
              style={styles.postImage}
            />
          ))}
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  profileHeader: {
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  profileInfo: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  displayName: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  bio: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  website: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  location: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    paddingTop: 0,
    gap: theme.spacing.sm,
  },
  followButton: {
    flex: 1,
  },
  messageButton: {
    flex: 1,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.xs,
  },
  postImage: {
    width: '33.33%',
    aspectRatio: 1,
    padding: theme.spacing.xs,
  },
}); 