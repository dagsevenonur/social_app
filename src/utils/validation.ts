// E-posta doğrulama
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'E-posta adresi gerekli' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Geçerli bir e-posta adresi girin' };
  }

  // İzin verilen domainler (örnek)
  const allowedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
  const domain = email.split('@')[1];
  
  if (!allowedDomains.includes(domain)) {
    return { 
      isValid: false, 
      error: 'Sadece gmail.com, hotmail.com, outlook.com ve yahoo.com uzantılı e-postalar kabul edilmektedir' 
    };
  }

  return { isValid: true };
}

// Şifre doğrulama
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Şifre gerekli' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Şifre en az 8 karakter olmalıdır' };
  }

  // En az bir büyük harf
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir büyük harf içermelidir' };
  }

  // En az bir küçük harf
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir küçük harf içermelidir' };
  }

  // En az bir rakam
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir rakam içermelidir' };
  }

  // En az bir özel karakter
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Şifre en az bir özel karakter içermelidir' };
  }

  // Yaygın şifreleri kontrol et
  const commonPasswords = ['Password123!', 'Qwerty123!', 'Admin123!'];
  if (commonPasswords.includes(password)) {
    return { isValid: false, error: 'Lütfen daha güvenli bir şifre seçin' };
  }

  return { isValid: true };
}

// Şifre eşleşme kontrolü
export function validatePasswordMatch(password: string, confirmPassword: string): { isValid: boolean; error?: string } {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Şifreler eşleşmiyor' };
  }

  return { isValid: true };
}

// Giriş denemelerini kontrol et
interface LoginAttempt {
  timestamp: number;
  success: boolean;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 dakika (milisaniye cinsinden)
let loginAttempts: LoginAttempt[] = [];

export function checkLoginAttempts(): { canTry: boolean; error?: string; remainingTime?: number } {
  // Son 15 dakika içindeki denemeleri filtrele
  const now = Date.now();
  loginAttempts = loginAttempts.filter(
    attempt => now - attempt.timestamp < LOCKOUT_DURATION
  );

  // Başarısız denemeleri say
  const failedAttempts = loginAttempts.filter(attempt => !attempt.success).length;

  if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lastAttempt = loginAttempts[loginAttempts.length - 1];
    const remainingTime = LOCKOUT_DURATION - (now - lastAttempt.timestamp);
    const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));

    return {
      canTry: false,
      error: `Çok fazla başarısız deneme. Lütfen ${remainingMinutes} dakika sonra tekrar deneyin.`,
      remainingTime
    };
  }

  return { canTry: true };
}

export function recordLoginAttempt(success: boolean) {
  loginAttempts.push({
    timestamp: Date.now(),
    success
  });
}

// Firebase hata kodlarını Türkçe mesajlara çevir
export function getFirebaseAuthError(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı',
    'auth/wrong-password': 'E-posta veya şifre hatalı',
    'auth/invalid-email': 'Geçersiz e-posta adresi',
    'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
    'auth/too-many-requests': 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin',
    'auth/network-request-failed': 'Bağlantı hatası. İnternet bağlantınızı kontrol edin',
    'auth/invalid-login-credentials': 'E-posta veya şifre hatalı',
    'auth/invalid-credential': 'Geçersiz giriş bilgileri. Lütfen e-posta ve şifrenizi kontrol edin',
    'auth/internal-error': 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin',
  };

  console.log('Firebase Error Code:', errorCode); // Hata kodunu logla
  return errorMessages[errorCode] || 'Giriş yapılırken bir hata oluştu';
} 