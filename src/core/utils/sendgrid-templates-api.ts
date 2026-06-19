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
    const response = await api.get('/api/v1/sendgrid/dynamic-templates')
    return unwrapTemplates(response.data)
  },
}
