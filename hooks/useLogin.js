'use client';
export const useLogin = () => {
  if (typeof window !== 'undefined') {
    const isLogin = localStorage.getItem('X-Token');
    const firstName = localStorage.getItem('firstName') ?? '';
    const lastName = localStorage.getItem('lastName') ?? '';

    return {
      isLogin: isLogin ? true : false,
      firstName,
      lastName,
      username: `${firstName} ${lastName}`,
    };
  }
  return { isLogin: false };
};
