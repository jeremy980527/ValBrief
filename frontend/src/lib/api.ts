import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

export const userApi = {
  register: (email: string, username: string, password: string) =>
    api.post('/users/register', { email, username, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post('/users/login', { email, password }).then(r => r.data),
  logout: () => api.post('/users/logout').then(r => r.data),
  me: () => api.get('/users/me').then(r => r.data),
}

export const authApi = {
  linkViaUrl: (callbackUrl: string, regionOverride?: string) =>
    api.post('/auth/link-via-url', { callbackUrl, regionOverride }).then(r => r.data),
  unlink: () =>
    api.delete('/auth/link').then(r => r.data),
}

export const shopApi = {
  get: () => api.get('/shop').then(r => r.data),
}

export const missionsApi = {
  get: () => api.get('/missions').then(r => r.data),
}

export const newsApi = {
  get: () => api.get('/news').then(r => r.data),
}

export const teamApi = {
  list: () => api.get('/team').then(r => r.data),
  create: (data: any) => api.post('/team', data).then(r => r.data),
  delete: (id: string) => api.delete(`/team/${id}`).then(r => r.data),
}

export default api
