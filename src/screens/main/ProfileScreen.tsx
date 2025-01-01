import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../navigation/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type ProfileScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Profile'>;

interface UserProfile {
  displayName?: string;
  bio?: string;
  photoURL?: string;
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const user = auth.currentUser;
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Firestore'dan gerçek zamanlı profil dinlemesi
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Profil dinleme hatası:', error);
        setLoading(false);
      }
    );

    // Cleanup fonksiyonu
    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <View style={styles.headerButtons}>
            <MaterialIcons
            name="edit"
            size={24}
            color={theme.colors.primary}
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editButton}
            />
            <MaterialIcons
            name="logout"
            size={24}
            color={theme.colors.primary}
            onPress={handleSignOut}
            style={styles.logoutButton}
            />
        </View>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileInfo}>
            {profile.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
            ) : (
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(profile.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>0</Text>
                    <Text style={styles.statLabel}>Gönderi</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>0</Text>
                    <Text style={styles.statLabel}>Takipçi</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>0</Text>
                    <Text style={styles.statLabel}>Takip</Text>
                </View>
            </View>
        </View>
        <View style={styles.userInfo}>
            <Text style={styles.displayName}>{profile.displayName || 'İsimsiz Kullanıcı'}</Text>
            {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>
        <View style={styles.postsContainer}>
            <Text style={styles.emptyStateText}>
            Henüz hiç gönderi paylaşılmadı.
            </Text>
        </View>
        <View style={styles.postsContainer}>
            <Text style={styles.sectionTitle}>Gönderiler</Text>
            <View style={styles.postsGrid}>
                <View style={styles.postBox}>
                    <View style={styles.emptyPost}>
                        <MaterialIcons name="image" size={32} color={theme.colors.textSecondary} />
                    </View>
                </View>
                <View style={styles.postBox}>
                    <View style={styles.emptyPost}>
                        <MaterialIcons name="image" size={32} color={theme.colors.textSecondary} />
                    </View>
                </View>
                <View style={styles.postBox}>
                    <View style={styles.emptyPost}>
                        <MaterialIcons name="image" size={32} color={theme.colors.textSecondary} />
                    </View>
                </View>
            </View>
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
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bio: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    textAlign: 'left',
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    marginTop: -20,
  },
  postsContainer: {
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  postBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    overflow: 'hidden',
  },
  emptyPost: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    marginTop: theme.spacing.xl,
  },
}); 