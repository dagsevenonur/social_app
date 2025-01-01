import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { theme } from '../../theme';
import { validateEmail, validatePassword, checkLoginAttempts, recordLoginAttempt, getFirebaseAuthError } from '../../utils/validation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState<NodeJS.Timeout | null>(null);

  // Zamanlayıcıyı temizle
  useEffect(() => {
    return () => {
      if (lockoutTimer) {
        clearTimeout(lockoutTimer);
      }
    };
  }, [lockoutTimer]);

  const handleLogin = async () => {
    // Giriş denemesi kontrolü
    const loginCheck = checkLoginAttempts();
    if (!loginCheck.canTry) {
      setError(loginCheck.error || 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.');
      
      // Kilitlenme süresini ayarla
      if (loginCheck.remainingTime) {
        const timer = setTimeout(() => {
          setError('');
        }, loginCheck.remainingTime);
        setLockoutTimer(timer);
      }
      return;
    }

    // E-posta doğrulama
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'E-posta geçersiz');
      return;
    }

    if (!password) {
      setError('Şifre gerekli');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      recordLoginAttempt(true); // Başarılı giriş
    } catch (err: any) {
      console.log('Login Error:', err.code, err.message); // Hata detaylarını logla
      recordLoginAttempt(false); // Başarısız giriş
      setError(getFirebaseAuthError(err.code));

      // Güvenlik uyarısı
      if (err.code === 'auth/user-not-found' || 
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/invalid-login-credentials') {
        Alert.alert(
          'Güvenlik Uyarısı',
          'Birden fazla başarısız giriş denemesi hesabınızın geçici olarak kilitlenmesine neden olabilir.',
          [{ text: 'Anladım', style: 'default' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Şifremi unuttum fonksiyonu eklenecek
    Alert.alert(
      'Şifremi Unuttum',
      'Şifre sıfırlama bağlantısı e-posta adresinize gönderilecek.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Gönder',
          onPress: () => {
            if (!email) {
              setError('Lütfen e-posta adresinizi girin');
              return;
            }
            // TODO: Şifre sıfırlama fonksiyonu eklenecek
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Hoş Geldiniz</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
      </View>

      <View style={styles.form}>
        <Input
          placeholder="E-posta"
          value={email}
          onChangeText={(text) => {
            setEmail(text.trim());
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <Button
          title="Giriş Yap"
          onPress={handleLogin}
          loading={loading}
          disabled={loading || !!lockoutTimer}
        />
        <Button
          title="Şifremi Unuttum"
          variant="outline"
          onPress={handleForgotPassword}
        />
        <Button
          title="Hesap Oluştur"
          variant="outline"
          onPress={() => navigation.navigate('Register')}
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
}); 