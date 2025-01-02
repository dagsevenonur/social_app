import type { Post } from '../types/post';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  UserProfile: { userId: string };
  Comments: { 
    post: Post;
    onUpdate?: (post: Post) => void;
  };
  Search: undefined;
  Notifications: undefined;
  Chat: undefined;
  CreatePost: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  CreatePost: undefined;
  Profile: undefined;
  EditProfile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
}; 