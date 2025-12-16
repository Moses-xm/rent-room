'use client';
export const useRemember = () => {
  if (typeof window !== 'undefined') {
    const isRemember = localStorage.getItem('isRemember');
    if (isRemember && isRemember === 'true') {
      const rememberedEmail = localStorage.getItem('rememberedEmail') || '';
      const rememberedPassword =
        localStorage.getItem('rememberedPassword') || '';
      return { isRemember: true, rememberedEmail, rememberedPassword };
    }
    return { isRemember: false };
  }
  return { isRemember: false };
};
