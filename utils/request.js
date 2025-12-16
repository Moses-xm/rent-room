'use client';
import { getNotificationInstance } from '@/contexts/NotificationContext';

const getToken = () => localStorage.getItem('X-Token');

// Request interceptor - Automatically adds Authorization header if token exists
const requestInterceptor = (options) => {
  const token = getToken();
  const { method = 'GET', headers = {}, body, ...resOptions } = options;
  return {
    method,
    ...resOptions,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
      ...(token ? { 'X-Token': token } : {}),
    },
  };
};

const handleError = (message) => {
  const notification = getNotificationInstance();
  notification.error({
    message,
  });
};

/**
 *  fetch method
 */
async function request(url, options) {
  try {
    const response = await fetch(url, requestInterceptor(options));
    const { status } = response;
    if (!response.ok) {
      const errorText = response.statusText;
      if (status === 401) {
        // Unauthorized
        window.location.href = '/login';
      }
      if (status === 500) {
        const data = await response.json();
        handleError(data?.message);
        return;
      }
      handleError(errorText || `Request error ${status}`);
    }

    let data = null;
    try {
      data = await response.json();
      return data;
    } catch (jsonError) {
      handleError(
        `[Response Parsing Error] ${url} - Invalid JSON: ${jsonError}`
      );
      return;
    }
  } catch (err) {
    console.log(err);
    handleError(`Network error`, '');
    return;
  }
}

export default request;
