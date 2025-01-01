export const theme = {
  colors: {
    primary: '#2B3A67',
    secondary: '#E84855',
    accent: '#FF9B71',
    highlight: '#FFFD82',
    brown: '#B56B45',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#2B3A67',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
    error: '#E84855',
    success: '#28A745',
    warning: '#FFFD82',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
} as const;

export type Theme = typeof theme; 