export interface UserProfile {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  website?: string;
  location?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  birthDate?: string;
  createdAt: Date;
  updatedAt: Date;
} 