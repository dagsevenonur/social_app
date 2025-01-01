import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const IMGBB_API_KEY = '08cb5a26218c8c74d119b2638476acf1';

export async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (!permission.granted) {
    throw new Error('Galeri izni gerekli');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });

  if (!result.canceled && result.assets[0].uri) {
    return result.assets[0].uri;
  }

  return null;
}

export async function uploadProfilePhoto(uri: string): Promise<string> {
  try {
    // Resmi base64'e çevir
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // ImgBB'ye yükle
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('ImgBB Response:', data); // Debug için

    if (!data.success) {
      throw new Error(data.error?.message || 'Fotoğraf yüklenemedi');
    }

    return data.data.display_url;
  } catch (error) {
    console.error('Fotoğraf yükleme hatası:', error);
    throw error;
  }
}

export async function uploadImage(uri: string): Promise<string> {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  
  formData.append('image', {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  try {
    const response = await fetch('https://api.imgbb.com/1/upload?key=YOUR_IMGBB_API_KEY', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Resim yükleme başarısız');
    }
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    throw error;
  }
} 