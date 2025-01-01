import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { validateEmail, validatePassword, validatePasswordMatch } from '../../utils/validation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // E-posta doğrulama
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'E-posta geçersiz');
      return;
    }

    // Şifre doğrulama
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || 'Şifre geçersiz');
      return;
    }

    // Şifre eşleşme kontrolü
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordMatchValidation.isValid) {
      setError(passwordMatchValidation.error || 'Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Firestore'da kullanıcı profili oluştur
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        displayName: '',
        bio: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err: any) {
      // Firebase hata mesajlarını Türkçeleştir
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz e-posta adresi');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('E-posta/şifre girişi devre dışı');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf');
      } else {
        setError('Kayıt oluşturulurken bir hata oluştu');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Hesap Oluştur</Text>
        <Text style={styles.subtitle}>Yeni bir hesap oluşturun</Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder="E-posta"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          error={!!error}
        />
        <Input
          placeholder="Şifre"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
          error={!!error}
        />
        <Input
          placeholder="Şifre Tekrar"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError('');
          }}
          secureTextEntry
          error={!!error}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Text style={styles.passwordRequirements}>
          Şifreniz:
          {'\n'}- En az 8 karakter
          {'\n'}- En az bir büyük harf
          {'\n'}- En az bir küçük harf
          {'\n'}- En az bir rakam
          {'\n'}- En az bir özel karakter (!@#$%^&*) içermelidir
        </Text>

        <Button
          title="Kayıt Ol"
          onPress={handleRegister}
          loading={loading}
        />
        <Button
          title="Giriş Yap"
          variant="outline"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  header: {
    marginTop: theme.spacing.xl * 2,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  passwordRequirements: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
}); 