export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  imageUrl: string;
  caption: string;
  likes: string[]; // Beğenen kullanıcıların ID'leri
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: Date;
} 