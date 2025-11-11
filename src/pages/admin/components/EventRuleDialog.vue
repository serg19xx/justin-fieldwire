<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]"
    >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-300 bg-gray-50">
        <h2 class="text-xl font-semibold text-gray-900">
          {{ editingRule ? 'Edit Event Rule' : 'Create Event Rule' }}
        </h2>
        <button @click="closeDialog" class="text-gray-600 hover:text-gray-800 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <form @submit.prevent="handleSubmit">
          <!-- Basic Information -->
          <div class="space-y-6 mb-6">
            <!-- First row: Event Type + Rule Enabled -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Event Type <span class="text-red-500">*</span>
                </label>
                <div>
                  <input
                    v-model="form.event_type"
                    type="text"
                    pattern="^[A-Z_]+$"
                    required
                    :class="[
                      'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900',
                      validationErrors.event_type
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : '',
                    ]"
                    placeholder="PROJECT_CREATED"
                  />
                  <p v-if="validationErrors.event_type" class="mt-1 text-sm text-red-600">
                    {{ validationErrors.event_type }}
                  </p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  &nbsp;
                </label>
                <div>
                  <label class="flex items-center text-sm font-medium text-gray-700">
                    <input type="checkbox" v-model="form.enabled" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2" />
                    Rule Enabled
                  </label>
                </div>
              </div>
            </div>

            <!-- Second row: Severity, Priority, Execution Location -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Severity <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.severity"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                >
                  <option value="important">Important</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  v-model="form.priority"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                >
                  <option :value="null">Auto ({{ computedPriority }})</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Execution Location
                </label>
                <select
                  v-model="form.execution_location"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                >
                  <option :value="null">Auto</option>
                  <option value="server">Server</option>
                  <option value="n8n">N8N</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>

            <!-- Comment - full width -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Comment
              </label>
              <textarea
                v-model="form.comment"
                rows="3"
                maxlength="255"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900 resize-none"
                placeholder="Optional comment"
              ></textarea>
            </div>
          </div>

          <!-- Actions -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Actions <span class="text-red-500">*</span></h3>
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="addAction('notify')"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Notify
                </button>
                <button
                  type="button"
                  @click="addAction('create_report')"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Report
                </button>
              <button
                type="button"
                  @click="addAction('log_only')"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Log Only
              </button>
              </div>
            </div>

            <div v-if="form.actions.length === 0" class="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <p class="text-gray-500">No actions added. Add at least one action for the rule.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(action, index) in form.actions"
                :key="index"
                class="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
              >
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-900">{{ getActionTypeLabel(action.type) }}</h4>
                <button
                  type="button"
                    @click="removeAction(index)"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
                </div>

                <!-- Notify Action -->
                <div v-if="action.type === 'notify'" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Channels *</label>
                    <div class="flex flex-wrap gap-2">
                      <label v-for="channel in channels" :key="channel" class="flex items-center text-gray-900 font-medium">
                        <input
                          type="checkbox"
                          :value="channel"
                          v-model="action.channels"
                          @change="onChannelChange(action)"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        {{ channel.toUpperCase() }}
                      </label>
                    </div>
                  </div>

                  <!-- Channel Templates -->
                  <div v-for="channel in action.channels" :key="channel">
                    <div v-if="channel === 'email' || channel === 'sms'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Template for {{ channel.toUpperCase() }}
                      </label>
                      <select
                        v-model="(action.channel_templates || {})[channel]"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                      >
                        <option :value="null">Use default template</option>
                        <option
                          v-for="template in getTemplatesForChannel(channel)"
                          :key="template.id"
                          :value="template.id"
                        >
                          {{ template.name }} [{{ template.category }}]
                          <span v-if="template.parent_id">
                            [Base: {{ getParentTemplateName(template.parent_id) }}]
                          </span>
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label class="flex items-center text-gray-900 font-medium">
                      <input
                        type="checkbox"
                        v-model="action.store_for_dashboard"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span class="text-gray-900 font-medium">Store for dashboard</span>
                    </label>
                  </div>
                </div>

                <!-- Create Report Action -->
                <div v-if="action.type === 'create_report'" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                    <select
                      v-model="action.period"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div v-if="action.period === 'custom'">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Custom Period *</label>
                    <input
                      v-model="action.custom_period"
                      type="text"
                      pattern="^P\d+[DM]$"
                      placeholder="P7D (7 days), P1M (1 month)"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                    <div class="flex flex-wrap gap-2">
                      <label v-for="role in roles" :key="role" class="flex items-center text-gray-900 font-medium">
                        <input
                          type="checkbox"
                          :value="role"
                          v-model="action.recipients"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        {{ role.replace('_', ' ').toUpperCase() }}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label class="flex items-center text-gray-900 font-medium">
                      <input
                        type="checkbox"
                        v-model="action.store_for_dashboard"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span class="text-gray-900 font-medium">Store for dashboard</span>
                    </label>
                  </div>
                </div>

                <!-- Log Only Action -->
                <div v-if="action.type === 'log_only'">
                  <div>
                    <label class="flex items-center text-gray-900 font-medium">
                      <input
                        type="checkbox"
                        v-model="action.store_for_dashboard"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      <span class="text-gray-900 font-medium">Store for dashboard</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Conditions -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Conditions</h3>
              <div class="flex gap-2 flex-wrap">
                <button
                  type="button"
                  @click="addCondition('notify_roles')"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Notify Roles
                </button>
                <button
                  type="button"
                  @click="addCondition('time_conditions')"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Time Conditions
                </button>
                <button
                  type="button"
                  @click="addCondition('project_conditions')"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Project Conditions
                </button>
              <button
                type="button"
                  @click="addCondition('task_conditions')"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Task Conditions
              </button>
              </div>
            </div>

            <div class="mb-4">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  v-model="strictMode"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span class="text-gray-900 font-medium">Strict mode (all conditions must be met)</span>
              </label>
            </div>

            <div v-if="!form.conditions || Object.keys(form.conditions).length === 1" class="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <p class="text-gray-500">No conditions added. Rules without conditions will trigger on all events.</p>
            </div>

            <div v-else class="space-y-4">
              <!-- Notify Roles -->
              <div v-if="form.conditions?.notify_roles" class="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-900">Notify Roles *</h4>
                  <button
                    type="button"
                    @click="removeCondition('notify_roles')"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div class="flex flex-wrap gap-2">
                  <label v-for="role in roles" :key="role" class="flex items-center text-gray-900 font-medium">
                    <input
                      type="checkbox"
                      :value="role"
                      v-model="form.conditions.notify_roles.value"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    {{ role.replace('_', ' ').toUpperCase() }}
                  </label>
                </div>
                  <select
                  v-model="form.conditions.notify_roles.priority"
                  class="mt-2 px-3 py-1 border border-gray-400 rounded text-sm text-gray-900 bg-white"
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                  <option value="optional">Optional</option>
                </select>
              </div>


              <!-- Time Conditions -->
              <div v-if="form.conditions?.time_conditions" class="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-900">Time Conditions</h4>
                  <button
                    type="button"
                    @click="removeCondition('time_conditions')"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      v-model="form.conditions.time_conditions.value.business_hours_only"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    <span class="text-gray-900 font-medium">Business hours only</span>
                  </div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      v-model="form.conditions.time_conditions.value.weekdays_only"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    <span class="text-gray-900 font-medium">Weekdays only</span>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select
                      v-model="form.conditions.time_conditions.value.timezone"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                  >
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        v-model="timeRange.start"
                        type="time"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        v-model="timeRange.end"
                        type="time"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                      />
                    </div>
                  </div>
                </div>
                  <select
                  v-model="form.conditions.time_conditions.priority"
                  class="mt-2 px-3 py-1 border border-gray-400 rounded text-sm text-gray-900 bg-white"
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                  <option value="optional">Optional</option>
                </select>
              </div>

              <!-- Project Conditions -->
              <div v-if="form.conditions?.project_conditions" class="p-4 bg-violet-50 border border-violet-200 rounded-lg shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-900">Project Conditions</h4>
                  <button
                    type="button"
                    @click="removeCondition('project_conditions')"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Min Budget</label>
                    <input
                      v-model.number="form.conditions.project_conditions.value.min_budget"
                      type="number"
                      min="0"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-400 text-gray-900"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div class="flex flex-wrap gap-2">
                      <label v-for="status in ['active', 'planning', 'completed', 'on_hold']" :key="status" class="flex items-center text-gray-900 font-medium">
                        <input
                          type="checkbox"
                          :value="status"
                          v-model="form.conditions.project_conditions.value.status"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        {{ status.replace('_', ' ').toUpperCase() }}
                      </label>
                    </div>
                  </div>
                </div>
                <select
                  v-model="form.conditions.project_conditions.priority"
                  class="mt-2 px-3 py-1 border border-gray-400 rounded text-sm text-gray-900 bg-white"
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                  <option value="optional">Optional</option>
                </select>
              </div>

              <!-- Task Conditions -->
              <div v-if="form.conditions?.task_conditions" class="p-4 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-medium text-gray-900">Task Conditions</h4>
                <button
                  type="button"
                    @click="removeCondition('task_conditions')"
                  class="text-red-600 hover:text-red-800"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div class="flex flex-wrap gap-2">
                      <label v-for="status in ['planned', 'scheduled', 'scheduled_accepted', 'in_progress', 'partially_completed', 'delayed_due_to_issue', 'ready_for_inspection', 'completed']" :key="status" class="flex items-center text-gray-900 font-medium">
                        <input
                          type="checkbox"
                          :value="status"
                          v-model="form.conditions.task_conditions.value.status"
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                        />
                        {{ status.replace('_', ' ').toUpperCase() }}
                      </label>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      v-model="form.conditions.task_conditions.value.overdue_only"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    <span class="text-gray-900 font-medium">Overdue tasks only</span>
                  </div>
                </div>
                <select
                  v-model="form.conditions.task_conditions.priority"
                  class="mt-2 px-3 py-1 border border-gray-400 rounded text-sm text-gray-900 bg-white"
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="closeDialog"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type {
  EventRule,
  EventType,
  EventRuleConditionType,
  EventRuleActionType,
  EventRuleAction,
  EventConditions,
} from '@/core/utils/admin-api'
import { eventRulesApi, type MessageTemplate } from '@/core/utils/eventRulesApi'

// Props
interface Props {
  isOpen: boolean
  rule?: EventRule | null
  eventTypes: EventType[]
  conditions: EventRuleConditionType[]
  actions: EventRuleActionType[]
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  rule: null,
  eventTypes: () => [],
  conditions: () => [],
  actions: () => [],
})

// Emits
const emit = defineEmits<{
  close: []
  save: [rule: EventRule]
}>()

// State
const isSubmitting = ref(false)
const validationErrors = ref<Record<string, string>>({})
// inline add buttons used directly; no modals

const channels = ['email', 'sms', 'webhook']
const roles = ['admin', 'project_manager', 'contractor', 'architect', 'viewer', 'guest']

const templates = ref<{
  email: MessageTemplate[]
  sms: MessageTemplate[]
}>({
  email: [],
  sms: [],
})

const form = ref<EventRule>({
  event_type: '',
  enabled: true,
  severity: 'important',
  priority: null,
  actions: [],
  conditions: {
    strict_mode: false,
  },
  execution_location: null,
  comment: '',
})

// Computed
const editingRule = computed(() => props.rule)

const computedPriority = computed(() => {
  if (form.value.priority) return form.value.priority
  return form.value.severity === 'critical' ? 'critical' : 'high'
})

// Methods
function getActionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    notify: 'Notify',
    create_report: 'Create Report',
    log_only: 'Log Only',
  }
  return labels[type] || type
}

// Safe accessors to satisfy template type-checking
const strictMode = computed<boolean>({
  get() {
    ensureConditionsObject()
    return Boolean(form.value.conditions!.strict_mode)
  },
  set(val: boolean) {
    ensureConditionsObject()
    form.value.conditions!.strict_mode = val
  },
})

const timeRange = computed<{ start: string; end: string }>({
  get() {
    normalizeConditions()
    const tr = form.value.conditions!.time_conditions!.value!.time_range!
    return { start: tr.start as string, end: tr.end as string }
  },
  set(val) {
    ensureConditionsObject()
    if (!form.value.conditions!.time_conditions) {
      addCondition('time_conditions')
    }
    normalizeConditions()
    form.value.conditions!.time_conditions!.value!.time_range = {
      start: val.start,
      end: val.end,
    }
  },
})

function parseLegacyActions(input: unknown): EventRuleAction[] {
  if (Array.isArray(input)) {
    // If already objects
    if (input.length === 0) return []
    const first = input[0] as unknown
    if (first && typeof first === 'object' && 'type' in (first as Record<string, unknown>)) {
      // Normalize actions to ensure channel_templates exists for notify actions
      return (input as EventRuleAction[]).map(action => {
        if (action.type === 'notify') {
          return {
            ...action,
            channels: action.channels || [],
            channel_templates: action.channel_templates || {},
            store_for_dashboard: action.store_for_dashboard !== undefined ? action.store_for_dashboard : true,
          }
        }
        return action
      })
    }
    // Legacy strings → new objects
    const result: EventRuleAction[] = []
    for (const v of input as string[]) {
      if (v === 'notify') {
        result.push({ type: 'notify', channels: [], channel_templates: {}, store_for_dashboard: true })
      } else if (v === 'log_only') {
        result.push({ type: 'log_only', store_for_dashboard: false })
      } else if (v.startsWith('create_') && v.endsWith('_report')) {
        if (v === 'create_daily_report') result.push({ type: 'create_report', period: 'daily', store_for_dashboard: true, recipients: [] })
        else if (v === 'create_weekly_report') result.push({ type: 'create_report', period: 'weekly', store_for_dashboard: true, recipients: [] })
        else if (v === 'create_monthly_report') result.push({ type: 'create_report', period: 'monthly', store_for_dashboard: true, recipients: [] })
        else if (v === 'create_quarterly_report') result.push({ type: 'create_report', period: 'quarterly', store_for_dashboard: true, recipients: [] })
        else result.push({ type: 'create_report', period: 'daily', store_for_dashboard: true, recipients: [] })
      } else if (v === 'create_report') {
        result.push({ type: 'create_report', period: 'daily', store_for_dashboard: true, recipients: [] })
      }
    }
    return result
  }
  return []
}

function getTemplatesForChannel(channel: 'email' | 'sms'): MessageTemplate[] {
  return templates.value[channel] || []
}

function getParentTemplateName(parentId: number): string {
  for (const channelTemplates of Object.values(templates.value)) {
    const parent = channelTemplates.find(t => t.id === parentId)
    if (parent) return parent.name
  }
  return 'Unknown'
}

function addAction(type: 'notify' | 'create_report' | 'log_only') {
  if (type === 'notify') {
    const action: EventRuleAction = {
      type: 'notify',
      channels: [],
      channel_templates: {},
      store_for_dashboard: true,
    }
    form.value.actions.push(action)
    // ensure notify_roles condition exists to avoid empty payload later
    if (!form.value.conditions || !('notify_roles' in form.value.conditions)) {
      if (!form.value.conditions) {
        form.value.conditions = { strict_mode: false } as EventConditions
      }
      form.value.conditions.notify_roles = { value: [], priority: 'required' }
    }
    return
  }
  if (type === 'create_report') {
    const action: EventRuleAction = {
      type: 'create_report',
      period: 'daily',
      recipients: [],
      store_for_dashboard: true,
    }
    form.value.actions.push(action)
    return
  }
  if (type === 'log_only') {
    const action: EventRuleAction = {
      type: 'log_only',
      store_for_dashboard: true,
    }
    form.value.actions.push(action)
  }
}

function onChannelChange(action: { type: string; channels: string[]; channel_templates?: Record<string, number | null> }) {
  if (!action.channel_templates) {
    action.channel_templates = {}
  }

  // Load templates for new channels
  action.channels.forEach((channel: string) => {
    if ((channel === 'email' || channel === 'sms') && !templates.value[channel as 'email' | 'sms']?.length) {
      loadTemplatesForChannel(channel as 'email' | 'sms')
    }
  })

  // Remove templates for removed channels
  Object.keys(action.channel_templates).forEach(channel => {
    if (!action.channels.includes(channel)) {
      delete action.channel_templates![channel]
    }
  })
}

async function loadTemplatesForChannel(channel: 'email' | 'sms') {
  try {
    const response = await eventRulesApi.listTemplates({ type: channel })
    if (response.status === 'success') {
      templates.value[channel] = response.data.templates.filter(t => t.is_active)
    }
  } catch (error) {
    console.error(`Failed to load templates for ${channel}:`, error)
  }
}

function removeAction(index: number) {
  form.value.actions.splice(index, 1)
}

function addCondition(type: 'notify_roles' | 'time_conditions' | 'project_conditions' | 'task_conditions') {
  if (!form.value.conditions) {
    form.value.conditions = { strict_mode: false } as EventConditions
  }

  if (type === 'notify_roles') {
    form.value.conditions.notify_roles = {
      value: [],
      priority: 'required',
    }
  } else if (type === 'time_conditions') {
    form.value.conditions.time_conditions = {
      value: {
        business_hours_only: false,
        weekdays_only: false,
        timezone: 'America/New_York',
        time_range: { start: '09:00', end: '17:00' }
      },
      priority: 'preferred',
    }
  } else if (type === 'project_conditions') {
    form.value.conditions.project_conditions = {
      value: {
        min_budget: 0,
        status: []
      },
      priority: 'preferred',
    }
  } else if (type === 'task_conditions') {
    form.value.conditions.task_conditions = {
      value: {
        status: [],
        overdue_only: false
      },
      priority: 'preferred',
    }
  }
}

function ensureConditionsObject() {
  if (!form.value.conditions || typeof form.value.conditions !== 'object') {
    form.value.conditions = { strict_mode: false } as EventConditions
  }
}

function removeCondition(type: string) {
  if (form.value.conditions) {
    if (type === 'notify_roles') delete form.value.conditions.notify_roles
    if (type === 'time_conditions') delete form.value.conditions.time_conditions
    if (type === 'project_conditions') delete form.value.conditions.project_conditions
    if (type === 'task_conditions') delete form.value.conditions.task_conditions
  }
}

function normalizeConditions() {
  ensureConditionsObject()
  const c = form.value.conditions!
  if (c.time_conditions) {
    const tc = c.time_conditions as unknown as {
      value?: {
        business_hours_only?: boolean
        weekdays_only?: boolean
        timezone?: string
        time_range?: { start?: string; end?: string }
      }
      priority?: string
    }
    if (!tc.value) tc.value = {}
    if (tc.value.business_hours_only === undefined) tc.value.business_hours_only = false
    if (tc.value.weekdays_only === undefined) tc.value.weekdays_only = false
    if (!tc.value.timezone) tc.value.timezone = 'America/New_York'
    if (!tc.value.time_range) tc.value.time_range = { start: '09:00', end: '17:00' }
    if (!tc.value.time_range.start) tc.value.time_range.start = '09:00'
    if (!tc.value.time_range.end) tc.value.time_range.end = '17:00'
  }
}

function validateForm(): boolean {
  const errors: Record<string, string> = {}

  if (!form.value.event_type.trim()) {
    errors.event_type = 'Event type is required'
  } else if (!/^[A-Z_]+$/.test(form.value.event_type)) {
    errors.event_type = 'Event type must be UPPERCASE with underscores'
  }

  if (form.value.actions.length === 0) {
    errors.actions = 'At least one action is required'
  }

  // Validate actions
  let hasNotify = false
  for (const action of form.value.actions) {
    if (action.type === 'notify') {
      hasNotify = true
      if (!action.channels || action.channels.length === 0) {
        errors.actions = 'Notify action must have at least one channel'
        break
      }
    }
    if (action.type === 'create_report' && action.period === 'custom' && !action.custom_period) {
      errors.actions = 'Custom period requires custom_period field'
      break
    }
  }

  // If notify action exists, require notify_roles to be non-empty
  if (hasNotify) {
    const roles = form.value.conditions?.notify_roles?.value
    if (!roles || roles.length === 0) {
      errors.conditions = 'Select at least one role in Notify Roles'
    }
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  // Ensure conditions object exists before saving
  ensureConditionsObject()

  isSubmitting.value = true
  try {
    emit('save', { ...form.value })
  } finally {
    isSubmitting.value = false
  }
}

function closeDialog() {
  emit('close')
}

// Watch for rule changes
watch(
  () => props.rule,
  (newRule) => {
    if (newRule) {
      const normalizedConditions = newRule.conditions && typeof newRule.conditions === 'object'
        ? newRule.conditions
        : { strict_mode: false }
      const parsedActions = parseLegacyActions(newRule.actions as unknown)
      // Ensure channel_templates is initialized for all notify actions
      parsedActions.forEach(action => {
        if (action.type === 'notify' && !action.channel_templates) {
          action.channel_templates = {}
        }
      })
      form.value = {
        event_type: newRule.event_type,
        enabled: newRule.enabled,
        severity: newRule.severity,
        priority: newRule.priority ?? null,
        actions: parsedActions,
        conditions: normalizedConditions,
        execution_location: newRule.execution_location ?? null,
        comment: newRule.comment || '',
        updated_at: newRule.updated_at,
        updated_by: newRule.updated_by,
      }
      normalizeConditions()
    } else {
      // Reset form for new rule
      form.value = {
        event_type: '',
        enabled: true,
        severity: 'important',
        priority: null,
        actions: [],
        conditions: {
          strict_mode: false,
        },
        execution_location: null,
        comment: '',
      }
      normalizeConditions()
    }
    validationErrors.value = {}
  },
  { immediate: true },
)

// Load templates on mount
onMounted(() => {
  loadTemplatesForChannel('email')
  loadTemplatesForChannel('sms')
})

defineOptions({
  name: 'EventRuleDialog',
})
</script>

