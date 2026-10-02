import { api } from './api'
import type { User } from '../stores/auth'

export interface ClientAccessRequestPayload {
  role: 'doctor' | 'pharmacist'
  email: string
  phone: string
  password: string
}

export interface ClientAccessRequestResult {
  success: boolean
  message: string
  token?: string
  user?: User
}

export async function requestClientAccess(
  payload: ClientAccessRequestPayload,
): Promise<ClientAccessRequestResult> {
  try {
    const res = await api.post('/api/v1/auth/request-client-access', {
      role: payload.role,
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
    })

    if (res.data?.status === 'success' || res.data?.error_code === 0) {
      return {
        success: true,
        message: res.data?.message || 'Access granted successfully.',
        token: res.data?.data?.token,
        user: res.data?.data?.user,
      }
    }

    return {
      success: false,
      message: res.data?.message || 'Failed to verify account request.',
    }
  } catch (err: unknown) {
    const axiosErr = err as {
      response?: {
        status?: number
        data?: {
          message?: string
        }
      }
      message?: string
    }

    const msg =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      'Failed to request account access. Please check your credentials.'

    return {
      success: false,
      message: msg,
    }
  }
}
