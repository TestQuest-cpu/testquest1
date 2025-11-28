// CREDITS TO USD CONVERSION RATE
// Change this single value to update the conversion rate across the entire app
export const CREDITS_TO_USD = 100; // 100 credits = $1 USD

export const getDeveloperTheme = (isLightMode) => ({
  background: isLightMode ? '#F5F7FA' : '#0E0F15',
  cardBackground: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
  textPrimary: isLightMode ? '#1A1A1A' : 'white',
  textSecondary: isLightMode ? '#6B7280' : 'rgba(255, 255, 255, 0.7)',
  textMuted: isLightMode ? '#9CA3AF' : 'rgba(255, 255, 255, 0.5)',
  buttonDark: isLightMode ? '#E5E7EB' : '#2A2A2A',
  buttonDarkHover: isLightMode ? '#D1D5DB' : '#3A3A3A',
  buttonLight: isLightMode ? '#F3F4F6' : '#1F1F1F',
  buttonLightHover: isLightMode ? '#E5E7EB' : '#2F2F2F',
  border: isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
  borderHover: isLightMode ? 'rgba(0, 212, 255, 0.4)' : 'rgba(0, 212, 255, 0.3)',
  cardHoverShadow: isLightMode ? '0 20px 40px rgba(0, 0, 0, 0.1)' : '0 20px 40px rgba(0, 212, 255, 0.15)',
  platformBadgeBg: isLightMode ? 'rgba(0, 212, 255, 0.15)' : 'rgba(0, 212, 255, 0.2)',
  statsCardBg: isLightMode ? '#F3F4F6' : '#1F1F1F',
});

export const getTesterTheme = (isLightMode) => ({
  background: isLightMode ? '#F5F7FA' : '#0E0F15',
  cardBackground: isLightMode ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
  textPrimary: isLightMode ? '#1A1A1A' : 'white',
  textSecondary: isLightMode ? '#6B7280' : 'rgba(255, 255, 255, 0.7)',
  textMuted: isLightMode ? '#9CA3AF' : 'rgba(255, 255, 255, 0.5)',
  buttonDark: isLightMode ? '#E5E7EB' : '#2A2A2A',
  buttonDarkHover: isLightMode ? '#D1D5DB' : '#3A3A3A',
  buttonLight: isLightMode ? '#F3F4F6' : '#1F1F1F',
  buttonLightHover: isLightMode ? '#E5E7EB' : '#2F2F2F',
  border: isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
  borderHover: isLightMode ? 'rgba(78, 205, 196, 0.4)' : 'rgba(78, 205, 196, 0.3)',
  statsCardBg: isLightMode ? '#F3F4F6' : '#1F1F1F',
});

export const getAdminTheme = (isLightMode) => ({
  background: isLightMode ? '#F5F7FA' : '#0E0F15',
  cardBackground: isLightMode ? '#FFFFFF' : '#1F1F1F',
  cardBackgroundAlt: isLightMode ? '#F9FAFB' : '#2A2A2A',
  textPrimary: isLightMode ? '#1A1A1A' : 'white',
  textSecondary: isLightMode ? '#6B7280' : 'rgba(255, 255, 255, 0.7)',
  textMuted: isLightMode ? '#9CA3AF' : 'rgba(255, 255, 255, 0.5)',
  buttonDark: isLightMode ? '#E5E7EB' : '#2A2A2A',
  buttonDarkHover: isLightMode ? '#D1D5DB' : '#3A3A3A',
  buttonLight: isLightMode ? '#F3F4F6' : 'rgba(255, 255, 255, 0.05)',
  buttonLightHover: isLightMode ? '#E5E7EB' : 'rgba(255, 255, 255, 0.1)',
  border: isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
  borderAlt: isLightMode ? '#E5E7EB' : '#2A2A2A',
  statsCardBg: isLightMode ? '#F9FAFB' : 'rgba(255, 255, 255, 0.03)',
  tableHeaderBg: isLightMode ? '#F3F4F6' : 'rgba(255, 255, 255, 0.03)',
  tableRowBorder: isLightMode ? '#E5E7EB' : 'rgba(255, 255, 255, 0.05)',
});

export const getModeratorTheme = (isLightMode) => ({
  background: isLightMode ? '#F5F7FA' : '#0E0F15',
  cardBackground: isLightMode ? '#FFFFFF' : '#1F1F1F',
  cardBackgroundAlt: isLightMode ? '#F9FAFB' : '#2A2A2A',
  textPrimary: isLightMode ? '#1A1A1A' : 'white',
  textSecondary: isLightMode ? '#6B7280' : 'rgba(255, 255, 255, 0.7)',
  textMuted: isLightMode ? '#9CA3AF' : 'rgba(255, 255, 255, 0.5)',
  buttonDark: isLightMode ? '#E5E7EB' : '#2A2A2A',
  buttonDarkHover: isLightMode ? '#D1D5DB' : '#3A3A3A',
  buttonLight: isLightMode ? '#F3F4F6' : 'rgba(255, 255, 255, 0.05)',
  buttonLightHover: isLightMode ? '#E5E7EB' : 'rgba(255, 255, 255, 0.1)',
  border: isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
  borderAlt: isLightMode ? '#E5E7EB' : '#2A2A2A',
  statsCardBg: isLightMode ? '#F9FAFB' : 'rgba(255, 255, 255, 0.03)',
  tableHeaderBg: isLightMode ? '#F3F4F6' : 'rgba(255, 255, 255, 0.03)',
  tableRowBorder: isLightMode ? '#E5E7EB' : 'rgba(255, 255, 255, 0.05)',
});
