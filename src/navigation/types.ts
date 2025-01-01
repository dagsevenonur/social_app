import type { Post } from '../types/post';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  TabNavigator: undefined;
  Comments: {
    post: Post;
    onUpdate?: (post: Post) => void;
  };
  EditProfile: undefined;
  CreatePost: undefined;
  Notifications: undefined;
  Chat: undefined;
  UserProfile: {
    userId: string;
  };
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