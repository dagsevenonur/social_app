import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, MainStackParamList } from '../../navigation/types';
import type { Post as PostType } from '../../types/post';

interface UserProfile {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  website?: string;
  phoneNumber?: string;
  location?: string;
  email?: string;
}

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const user = auth.currentUser;
  const [profile, setProfile] = useState<UserProfile>({});
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Profil bilgilerini dinle
    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
      }
    );

    // Kullanıcının gönderilerini getir
    const fetchPosts = async () => {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('userId', '==', user.uid));
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

    fetchPosts();
    return () => unsubscribeProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
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
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
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

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statCount}>{posts.length}</Text>
              <Text style={styles.statLabel}>Gönderi</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statCount}>0</Text>
              <Text style={styles.statLabel}>Takipçi</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statCount}>0</Text>
              <Text style={styles.statLabel}>Takip</Text>
            </View>
          </View>

          {(profile.website || profile.location || profile.phoneNumber || profile.email) && (
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
              {profile.phoneNumber && (
                <TouchableOpacity style={styles.contactItem}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.text} />
                  <Text style={styles.contactText}>{profile.phoneNumber}</Text>
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
            title="Profili Düzenle" 
            variant="outline"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editButton}
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
                <Text style={styles.emptySubtext}>İlk gönderiyi paylaş!</Text>
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
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  stat: {
    alignItems: 'center',
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
  editButton: {
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
  emptySubtext: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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