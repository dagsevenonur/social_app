import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../utils/imageUpload';

interface UserProfile {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  website?: string;
  phoneNumber?: string;
  location?: string;
  email?: string;
}

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          setPhotoURL(data.photoURL || null);
          setWebsite(data.website || '');
          setPhoneNumber(data.phoneNumber || '');
          setLocation(data.location || '');
          setEmail(data.email || user.email || '');
        }
      } catch (error) {
        console.error('Profil bilgileri alınamadı:', error);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploading(true);
      try {
        const url = await uploadImage(result.assets[0].uri);
        setPhotoURL(url);
      } catch (error) {
        Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName,
        displayNameLower: displayName.toLowerCase(),
        bio: bio,
        photoURL,
        website,
        phoneNumber,
        location,
        email,
        updatedAt: serverTimestamp(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={handlePickImage}
          disabled={uploading}
        >
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={40} color={theme.colors.textSecondary} />
            </View>
          )}
          {uploading ? (
            <ActivityIndicator 
              style={styles.uploadIndicator} 
              color={theme.colors.primary} 
            />
          ) : (
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>

        <Input
          label="İsim"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="İsminizi girin"
        />

        <Input
          label="Hakkında"
          value={bio}
          onChangeText={setBio}
          placeholder="Kendinizden bahsedin"
          multiline
          numberOfLines={3}
          style={styles.bioInput}
        />

        <Input
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="Website adresinizi girin"
          keyboardType="url"
          autoCapitalize="none"
        />

        <Input
          label="Konum"
          value={location}
          onChangeText={setLocation}
          placeholder="Konumunuzu girin"
        />

        <Input
          label="Telefon"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Telefon numaranızı girin"
          keyboardType="phone-pad"
        />

        <Input
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          placeholder="E-posta adresinizi girin"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title="Kaydet"
          onPress={handleSave}
          loading={loading}
          disabled={loading || uploading}
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
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarFallback: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  uploadIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
}); 