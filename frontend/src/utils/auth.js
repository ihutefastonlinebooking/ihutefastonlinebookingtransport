import jwtDecode from 'jwt-decode';

const TOKEN_KEY = 'hute_admin_token';

export function storeToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const { exp } = jwtDecode(token);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch (e) {
    return true;
  }
}

export function isAuthenticated() {
  const t = getToken();
  return !!t && !isTokenExpired(t);
}

export default { storeToken, getToken, clearToken, isAuthenticated };
