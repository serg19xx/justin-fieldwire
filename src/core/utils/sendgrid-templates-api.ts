import { api } from './api'

export interface SendGridDynamicTemplate {
  id: string
  name: string
  version_name: string
}

export interface SendGridTemplatesResponse {
  templates: SendGridDynamicTemplate[]
  sendgridConfigured: boolean
}

function unwrapTemplates(body: unknown): SendGridTemplatesResponse {
  const root = body as {
    status?: string
    message?: string
    data?: { templates?: SendGridDynamicTemplate[]; sendgrid_configured?: boolean }
  }
  if (root?.status === 'error') {
    throw new Error(root.message ?? 'Failed to load SendGrid templates')
  }
  return {
    templates: root?.data?.templates ?? [],
    sendgridConfigured: Boolean(root?.data?.sendgrid_configured),
  }
}

export const sendgridTemplatesApi = {
  async listActive(): Promise<SendGridTemplatesResponse> {
    // Cache-bust with query only — do NOT send Cache-Control (not in CORS Allow-Headers → Network Error).
    const response = await api.get('/api/v1/sendgrid/dynamic-templates', {
      params: { _ts: Date.now() },
    })
    return unwrapTemplates(response.data)
  },
}
