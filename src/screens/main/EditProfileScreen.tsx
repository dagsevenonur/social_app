import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { pickImage, uploadProfilePhoto } from '../../utils/imageUpload';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../navigation/types';
import type { UserProfile } from '../../types/user';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'Profile'>;

export function EditProfileScreen() {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const user = auth.currentUser;
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    bio: '',
    photoURL: '',
    website: '',
    location: '',
    phoneNumber: '',
    gender: 'prefer-not-to-say',
    birthDate: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi');
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePhotoSelect = async () => {
    try {
      setPhotoLoading(true);
      const imageUri = await pickImage();
      
      if (imageUri) {
        const photoURL = await uploadProfilePhoto(imageUri);
        setProfile(prev => ({ ...prev, photoURL }));
        
        // Firestore'u güncelle
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { photoURL });
        }
      }
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profile,
        updatedAt: new Date(),
      });

      navigation.goBack();
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profili Düzenle</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity 
          style={styles.photoContainer} 
          onPress={handlePhotoSelect}
          disabled={photoLoading}
        >
          {profile.photoURL ? (
            <Image source={{ uri: profile.photoURL }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="add-a-photo" size={32} color={theme.colors.primary} />
            </View>
          )}
          {photoLoading && (
            <View style={styles.photoLoading}>
              <Text>Yükleniyor...</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          placeholder="Ad Soyad"
          value={profile.displayName}
          onChangeText={(text) => setProfile(prev => ({ ...prev, displayName: text }))}
          autoCapitalize="words"
        />
        <Input
          placeholder="Hakkımda"
          value={profile.bio}
          onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
          multiline
          numberOfLines={4}
          style={styles.bioInput}
        />
        <Input
          placeholder="Website"
          value={profile.website}
          onChangeText={(text) => setProfile(prev => ({ ...prev, website: text }))}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Input
          placeholder="Konum"
          value={profile.location}
          onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
        />
        <Input
          placeholder="Telefon"
          value={profile.phoneNumber}
          onChangeText={(text) => setProfile(prev => ({ ...prev, phoneNumber: text }))}
          keyboardType="phone-pad"
        />
        
        <Button
          title="Kaydet"
          onPress={handleSave}
          loading={loading}
        />
        <Button
          title="İptal"
          variant="outline"
          onPress={() => navigation.goBack()}
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
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
}); 