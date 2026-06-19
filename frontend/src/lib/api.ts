import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data),
  mfa: (code: string) =>
    api.post('/auth/mfa', { code }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
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
