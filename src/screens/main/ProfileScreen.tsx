import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, Image, Linking, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import type { Post as PostType } from '../../types/post';

interface UserProfile {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  website?: string;
  location?: string;
  email?: string;
  phoneNumber?: string;
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const user = auth.currentUser;
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<PostType[]>([]);

  useEffect(() => {
    if (!user) return;

    // Profil bilgilerini dinle
    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
      setLoading(false);
    });

    // Takipçi ve takip sayılarını al
    const fetchFollowCounts = async () => {
      // Takipçileri say
      const followersRef = collection(db, 'follows');
      const followersQ = query(followersRef, where('following', 'array-contains', user.uid));
      const followersSnapshot = await getDocs(followersQ);
      setFollowersCount(followersSnapshot.size);

      // Takip edilenleri say
      const followingDoc = await getDoc(doc(db, 'follows', user.uid));
      if (followingDoc.exists()) {
        const data = followingDoc.data();
        setFollowingCount(data?.following?.length || 0);
      }
    };

    // Gönderileri al
    const fetchPosts = async () => {
      const postsRef = collection(db, 'posts');
      const postsQ = query(postsRef, where('userId', '==', user.uid));
      const postsSnapshot = await getDocs(postsQ);
      const userPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PostType[];
      setPosts(userPosts);
    };

    fetchFollowCounts();
    fetchPosts();

    return () => unsubscribeProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
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
          <Ionicons name="heart" size={16} color="white" />
          <Text style={styles.postStatText}>{item.likes?.length || 0}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble" size={16} color="white" />
          <Text style={styles.postStatText}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
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
          
          <View style={styles.contactInfo}>
            {profile.website && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => Linking.openURL(profile.website || '')}
              >
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
            {profile.phoneNumber && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => Linking.openURL(`tel:${profile.phoneNumber}`)}
              >
                <Ionicons name="call-outline" size={20} color={theme.colors.text} />
                <Text style={styles.contactText}>{profile.phoneNumber}</Text>
              </TouchableOpacity>
            )}
            {profile.email && (
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => Linking.openURL(`mailto:${profile.email}`)}
              >
                <Ionicons name="mail-outline" size={20} color={theme.colors.text} />
                <Text style={styles.contactText}>{profile.email}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          numColumns={3}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Henüz gönderi yok</Text>
              <Text style={styles.emptySubtext}>İlk gönderiyi paylaş!</Text>
            </View>
          }
        />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerButton: {
    padding: theme.spacing.xs,
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
  contactInfo: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
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
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
}); 