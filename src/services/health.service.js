import axiosClient from '../api/axiosClient'

export async function getHealth() {
  const response = await axiosClient.get('/health')
  return response.data
}
