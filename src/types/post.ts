export interface Post {
  id: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  imageUrl: string;
  caption: string;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
} 