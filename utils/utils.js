'use client';
export const handleLogin = (res) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('X-Token', res?.token);
    localStorage.setItem('firstName', res?.firstName);
    localStorage.setItem('lastName', res?.lastName);
  }
};

export const handleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('X-Token');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
  }
};

export const handleRemember = (remember, email, password) => {
  if (typeof window !== 'undefined') {
    if (remember) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberedPassword', password);
      localStorage.setItem('isRemember', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberedPassword');
      localStorage.removeItem('isRemember');
    }
  }
};
