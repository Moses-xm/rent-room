'use client';
export const usePrimaryColor = () => {
  if (typeof window !== 'undefined') {
    const colorPrimary = localStorage.getItem('colorPrimary');
    if (typeof colorPrimary === 'string') {
      return colorPrimary;
    }
    return '#7649dd';
  }
  return '#7649dd';
};
