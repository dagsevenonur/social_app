import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { pickImage, uploadProfilePhoto } from '../../utils/imageUpload';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList } from '../../navigation/types';

type CreatePostScreenNavigationProp = NativeStackNavigationProp<MainTabParamList, 'CreatePost'>;

export function CreatePostScreen() {
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      const uri = await pickImage();
      if (uri) {
        setImageUri(uri);
      }
    } catch (error) {
      console.error('Fotoğraf seçme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const handlePost = async () => {
    if (!imageUri) {
      Alert.alert('Hata', 'Lütfen bir fotoğraf seçin');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Hata', 'Lütfen bir açıklama yazın');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      // Kullanıcı bilgilerini al
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // Fotoğrafı yükle
      const imageUrl = await uploadProfilePhoto(imageUri);

      // Gönderiyi oluştur
      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, {
        userId: user.uid,
        username: userData?.displayName || user.displayName || 'İsimsiz Kullanıcı',
        userAvatar: userData?.photoURL || user.photoURL || null,
        imageUrl,
        caption: caption.trim(),
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Başarılı', 'Gönderi paylaşıldı');
      navigation.goBack();
    } catch (error) {
      console.error('Gönderi paylaşma hatası:', error);
      Alert.alert('Hata', 'Gönderi paylaşılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Yeni Gönderi</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={handleImagePick}
          disabled={loading}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="add-photo-alternate" size={48} color={theme.colors.primary} />
              <Text style={styles.imagePlaceholderText}>Fotoğraf Seç</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          placeholder="Bir açıklama yazın..."
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={4}
          style={styles.captionInput}
        />

        <Button
          title="Paylaş"
          onPress={handlePost}
          loading={loading}
          disabled={!imageUri || !caption.trim() || loading}
        />
      </View>
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
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  imageContainer: {
    aspectRatio: 1,
    borderRadius: theme.spacing.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.primary,
  },
  captionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
}); 