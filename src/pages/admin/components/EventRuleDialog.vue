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
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                    Event Type <span class="text-red-500">*</span>
                    <HelpTip
                      title="Event Type"
                      text="The system event this rule listens for (UPPERCASE_WITH_UNDERSCORES). When that event happens — or a schedule tick creates it — this rule’s actions run."
                    />
                  </label>
                  <input
                    v-model="form.event_type"
                    type="text"
                    pattern="^[A-Z_]+$"
                    required
                    :class="[
                      'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900',
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

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                  <label class="flex items-center text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      v-model="form.enabled"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    Rule Enabled
                    <HelpTip
                      title="Rule Enabled"
                      text="Off = the rule is ignored. On = it can log events and run actions."
                    />
                  </label>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                    Severity <span class="text-red-500">*</span>
                    <HelpTip
                      title="Severity"
                      text="Business importance shown in logs and dashboards. Critical stands out more than Important. This is not the same as queue Priority."
                    />
                  </label>
                  <select
                    v-model="form.severity"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
                  >
                    <option value="important">Important</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                    Priority
                    <HelpTip
                      title="Priority"
                      text="Technical processing order in the job queue. Auto picks from Severity (Critical → critical, otherwise high). Use only if you need to override."
                    />
                  </label>
                  <select
                    v-model="form.priority"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
                  >
                    <option :value="null">Auto ({{ computedPriority }})</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                    Execution Location
                    <HelpTip
                      title="Execution Location"
                      text="Where actions are meant to run. Server = this app’s backend. N8N = external workflow tool. Auto/Both are for advanced setups — leave Auto if unsure."
                    />
                  </label>
                  <select
                    v-model="form.execution_location"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
                  >
                    <option :value="null">Auto</option>
                    <option value="server">Server</option>
                    <option value="n8n">N8N</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  v-model="form.comment"
                  rows="3"
                  maxlength="255"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900 resize-none"
                  placeholder="Optional comment"
                ></textarea>
              </div>
            </div>

            <!-- Actions -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="inline-flex items-center text-lg font-semibold text-gray-900">
                  Actions <span class="text-red-500">*</span>
                  <HelpTip
                    title="Actions"
                    text="What happens when the rule fires. Notify = email/SMS/push. Report = build and send an operational report. Log Only = write to the event log, no messages."
                  />
                </h3>
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

              <p v-if="validationErrors.actions" class="mb-2 text-sm text-red-600">
                {{ validationErrors.actions }}
              </p>

              <div
                v-if="form.actions.length === 0"
                class="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
              >
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
                      <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                        Channels *
                        <HelpTip
                          title="Channels"
                          text="How to deliver the notification. EMAIL and SMS go through SendGrid / Twilio as transport only. PUSH is for mobile app alerts when enabled."
                        />
                      </label>
                      <div class="flex flex-wrap gap-2">
                        <label
                          v-for="channel in channels"
                          :key="channel"
                          class="flex items-center text-gray-900 font-medium"
                        >
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

                    <div
                      v-for="channel in action.channels.filter((c) => c === 'email' || c === 'sms')"
                      :key="channel"
                      class="p-3 bg-white border border-gray-200 rounded-lg space-y-3"
                    >
                      <div class="inline-flex items-center text-sm font-medium text-gray-900">
                        {{ channel.toUpperCase() }} content
                        <span class="font-normal text-gray-500 ml-1">
                          ({{ channel === 'email' ? 'SendGrid' : 'Twilio' }} transport)
                        </span>
                        <HelpTip
                          title="Message content"
                          text="Choose where the text comes from. System = auto from the event. Message Template = from Settings → Message Templates. Custom text = typed here. SendGrid/Twilio only deliver — they do not choose the wording."
                        />
                      </div>
                      <div>
                        <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                          Source
                          <HelpTip
                            title="Content source"
                            text="System text — built automatically from the event.&#10;Message Template — reusable template from Settings.&#10;Custom text — subject/body entered on this rule (supports {{VARIABLES}})."
                          />
                        </label>
                        <select
                          :value="getChannelMode(action, channel)"
                          @change="setChannelMode(action, channel, ($event.target as HTMLSelectElement).value)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          <option value="system">System text (auto from event)</option>
                          <option value="local">Message Template</option>
                          <option value="manual">Custom text</option>
                        </select>
                      </div>
                      <div v-if="getChannelMode(action, channel) === 'local'">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                          Template *
                        </label>
                        <select
                          :value="getChannelTemplateId(action, channel)"
                          @change="setChannelTemplateId(action, channel, ($event.target as HTMLSelectElement).value)"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          <option value="">Select template…</option>
                          <option
                            v-for="template in getTemplatesForChannel(channel as 'email' | 'sms')"
                            :key="template.id"
                            :value="String(template.id)"
                          >
                            {{ template.name }} [{{ template.category }}]
                          </option>
                        </select>
                      </div>
                      <div v-if="getChannelMode(action, channel) === 'manual'" class="space-y-2">
                        <div v-if="channel === 'email'">
                          <label class="block text-sm font-medium text-gray-700 mb-1">
                            Subject
                          </label>
                          <input
                            :value="getChannelSubject(action, channel)"
                            @input="setChannelSubject(action, channel, ($event.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="e.g. Update: {{PROJECT_NAME}}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">
                            Body *
                          </label>
                          <textarea
                            :value="getChannelBody(action, channel)"
                            @input="setChannelBody(action, channel, ($event.target as HTMLTextAreaElement).value)"
                            rows="3"
                            :placeholder="
                              channel === 'email'
                                ? 'HTML or text with {{PROJECT_NAME}}, {{STATUS}}…'
                                : 'SMS text with {{PROJECT_NAME}}…'
                            "
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-y"
                          ></textarea>
                          <p class="mt-1 text-xs text-gray-500" v-pre>
                            Variables: {{PROJECT_NAME}}, {{STATUS}}, {{TASK_NAME}}, {{URL}},
                            {{EVENT_LABEL}}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                        Recipients *
                        <HelpTip
                          title="Recipients"
                          text="Which roles receive this notification. Resolved to real users on the related project (admins are global)."
                        />
                      </label>
                      <div class="flex flex-wrap gap-2">
                        <label
                          v-for="role in roles"
                          :key="role"
                          class="flex items-center text-gray-900 font-medium"
                        >
                          <input
                            type="checkbox"
                            :value="role"
                            v-model="action.recipients"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                          />
                          {{ formatRoleLabel(role) }}
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Create Report Action -->
                  <div v-if="action.type === 'create_report'" class="space-y-4">
                    <div>
                      <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                        Period *
                        <HelpTip
                          title="Report period"
                          text="What data the report covers (daily / weekly / monthly summary). This is NOT when the rule runs — use Schedule below for timing."
                        />
                      </label>
                      <select
                        v-model="action.period"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div v-if="action.period === 'custom'">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Custom Period *
                      </label>
                      <input
                        v-model="action.custom_period"
                        type="text"
                        pattern="^P\d+[DM]$"
                        placeholder="P7D (7 days), P1M (1 month)"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 text-gray-900"
                      />
                    </div>

                    <div>
                      <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                        Recipients *
                        <HelpTip
                          title="Report recipients"
                          text="Who receives the generated report email. Usually Admin and Project Manager."
                        />
                      </label>
                      <div class="flex flex-wrap gap-2">
                        <label
                          v-for="role in roles"
                          :key="role"
                          class="flex items-center text-gray-900 font-medium"
                        >
                          <input
                            type="checkbox"
                            :value="role"
                            v-model="action.recipients"
                            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                          />
                          {{ formatRoleLabel(role) }}
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Log Only Action -->
                  <div v-if="action.type === 'log_only'">
                    <p class="inline-flex items-start gap-1 text-sm text-gray-600">
                      <span>
                        Writes to the event log only. No notifications are sent.
                      </span>
                      <HelpTip
                        title="Log Only"
                        text="Useful for auditing: the event is recorded, but nobody is emailed or texted."
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Schedule -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="inline-flex items-center text-lg font-semibold text-gray-900">
                    Schedule
                    <HelpTip
                      title="Schedule"
                      text="Optional. Controls WHEN this rule may run (like a calendar timer).&#10;&#10;• No schedule → actions run immediately when the event happens.&#10;• With schedule → actions run only in the time window you set (Frequency + At time / Until)."
                    />
                  </h3>
                  <p class="text-sm text-gray-600 mt-1">
                    Optional. Leave empty to run immediately on every matching event.
                  </p>
                </div>
                <button
                  v-if="!form.conditions?.time_conditions"
                  type="button"
                  @click="addScheduleFilter"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  + Add schedule
                </button>
              </div>

              <div
                v-if="!form.conditions?.time_conditions"
                class="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
              >
                <p class="text-gray-500">
                  No schedule. Outbox processes this rule immediately.
                </p>
              </div>

              <div
                v-else
                class="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm space-y-4"
              >
                <div class="flex items-center justify-between">
                  <h4 class="inline-flex items-center font-medium text-gray-900">
                    {{ scheduleSummary }}
                    <HelpTip
                      title="Summary"
                      text="Plain-language preview of the schedule you configured. Save the rule to apply it."
                    />
                  </h4>
                  <button
                    type="button"
                    @click="removeScheduleFilter"
                    class="text-red-600 hover:text-red-800"
                    title="Remove schedule"
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

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                      Frequency <span class="text-red-500">*</span>
                      <HelpTip
                        title="Frequency"
                        text="How often the schedule can match.&#10;&#10;Daily — every selected weekday.&#10;Weekly — on the weekdays you pick.&#10;Monthly — on a calendar day or an Nth weekday (e.g. 2nd Monday)."
                      />
                    </label>
                    <select
                      v-model="schedule.frequency"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                      Timezone
                      <HelpTip
                        title="Timezone"
                        text="All schedule times (At / Until) and day boundaries use this timezone — not the browser’s local clock."
                      />
                    </label>
                    <select
                      v-model="schedule.timezone"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="America/Toronto">America/Toronto</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                <div v-if="schedule.frequency === 'weekly' || schedule.frequency === 'daily'">
                  <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-2">
                    Days of week
                    <HelpTip
                      title="Days of week"
                      text="Which weekdays are allowed. Example: Mon–Fri for business days only. For Weekly, pick the days the rule should fire."
                    />
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <label
                      v-for="day in weekDays"
                      :key="day.value"
                      class="inline-flex items-center px-3 py-2 border rounded-md text-sm cursor-pointer"
                      :class="
                        isDaySelected(day.value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      "
                    >
                      <input
                        type="checkbox"
                        class="sr-only"
                        :checked="isDaySelected(day.value)"
                        @change="toggleDay(day.value)"
                      />
                      {{ day.label }}
                    </label>
                  </div>
                </div>

                <div v-if="schedule.frequency === 'monthly'" class="space-y-3">
                  <div>
                    <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                      Monthly on <span class="text-red-500">*</span>
                      <HelpTip
                        title="Monthly on"
                        text="Calendar day — fixed date each month (e.g. the 1st).&#10;&#10;Nth weekday — e.g. 2nd Monday of each month (date changes; weekday does not)."
                      />
                    </label>
                    <select
                      v-model="schedule.monthly_mode"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="day_of_month">Calendar day (e.g. 1st of each month)</option>
                      <option value="nth_weekday">Nth weekday (e.g. 2nd Monday)</option>
                    </select>
                  </div>

                  <div
                    v-if="schedule.monthly_mode !== 'nth_weekday'"
                    class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end"
                  >
                    <div>
                      <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                        Day of month
                        <HelpTip
                          title="Day of month"
                          text="Calendar date 1–31. If the month is shorter (e.g. day 31 in February), the last day of that month is used."
                        />
                      </label>
                      <input
                        v-model.number="schedule.day_of_month"
                        type="number"
                        min="1"
                        max="31"
                        :disabled="!!schedule.day_of_month_last"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100"
                      />
                    </div>
                    <label class="flex items-center text-sm font-medium text-gray-700 pb-3">
                      <input
                        type="checkbox"
                        v-model="schedule.day_of_month_last"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                      />
                      Last day of month
                      <HelpTip
                        title="Last day of month"
                        text="Use the final calendar day (28–31 depending on the month) instead of a fixed number."
                      />
                    </label>
                  </div>

                  <div
                    v-else
                    class="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <div>
                      <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                        Occurrence
                        <HelpTip
                          title="Occurrence"
                          text="Which Monday/Tuesday/… in the month: 1st, 2nd, 3rd, 4th, or Last."
                        />
                      </label>
                      <select
                        v-model.number="schedule.weekday_occurrence"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option :value="1">1st</option>
                        <option :value="2">2nd</option>
                        <option :value="3">3rd</option>
                        <option :value="4">4th</option>
                        <option :value="-1">Last</option>
                      </select>
                    </div>
                    <div>
                      <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                        Weekday
                        <HelpTip
                          title="Weekday"
                          text="Combined with Occurrence. Example: 2nd + Monday = second Monday of the month."
                        />
                      </label>
                      <select
                        v-model.number="monthlyWeekday"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option v-for="day in weekDays" :key="day.value" :value="day.value">
                          {{ day.full }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-2">
                    Months
                    <HelpTip
                      title="Months"
                      text="Limit to specific months. Leave all unchecked to run every month. Example: only January and July."
                    />
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <label
                      v-for="month in monthOptions"
                      :key="month.value"
                      class="inline-flex items-center px-2.5 py-1.5 border rounded-md text-xs cursor-pointer"
                      :class="
                        isMonthSelected(month.value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      "
                    >
                      <input
                        type="checkbox"
                        class="sr-only"
                        :checked="isMonthSelected(month.value)"
                        @change="toggleMonth(month.value)"
                      />
                      {{ month.label }}
                    </label>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                      At time <span class="text-red-500">*</span>
                      <HelpTip
                        title="At time"
                        text="Start of the allowed time window (in the selected Timezone). The rule may run from this time onward until Until."
                      />
                    </label>
                    <input
                      v-model="scheduleAt"
                      type="time"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label class="inline-flex items-center text-sm font-medium text-gray-700 mb-1">
                      Until
                      <HelpTip
                        title="Until"
                        text="End of the allowed time window.&#10;&#10;Why a window? The system checks on a timer every few minutes. A short window (e.g. 07:00–07:30) avoids missing an exact minute.&#10;&#10;Default if empty: At time + 30 minutes.&#10;&#10;• Before At → wait&#10;• Between At and Until → run&#10;• After Until → skip for this day"
                      />
                    </label>
                    <input
                      v-model="scheduleUntil"
                      type="time"
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>
                <p v-if="validationErrors.schedule" class="text-sm text-red-600">
                  {{ validationErrors.schedule }}
                </p>
              </div>
            </div>

            <!-- Form actions -->
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
  NotifyAction,
  RecipientRole,
  TimeConditionsValue,
  ChannelContentMode,
  ChannelContentSpec,
  NotifyChannel,
  MonthlyMode,
  WeekdayOccurrence,
} from '@/core/utils/admin-api'
import { eventRulesApi, type MessageTemplate } from '@/core/utils/eventRulesApi'
import HelpTip from '@/components/HelpTip.vue'

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

const emit = defineEmits<{
  close: []
  save: [rule: EventRule]
}>()

const isSubmitting = ref(false)
const validationErrors = ref<Record<string, string>>({})

const channels = ['email', 'sms', 'push'] as const
const roles: RecipientRole[] = [
  'admin',
  'project_manager',
  'task_lead',
  'team_members',
  'foreman',
  'worker',
  'contractor',
  'inspector',
]

const weekDays = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
  { value: 7, label: 'Sun', full: 'Sunday' },
]

const monthOptions = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
]

const weekdayOccurrenceLabels: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  [-1]: 'last',
}

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
  conditions: {},
  execution_location: null,
  comment: '',
})

const editingRule = computed(() => props.rule)

const computedPriority = computed(() => {
  if (form.value.priority) return form.value.priority
  return form.value.severity === 'critical' ? 'critical' : 'high'
})

function emptySchedule(): TimeConditionsValue {
  return {
    frequency: 'daily',
    days_of_week: [1, 2, 3, 4, 5],
    monthly_mode: 'day_of_month',
    day_of_month: 1,
    day_of_month_last: false,
    weekday_occurrence: 1,
    months: [],
    at_time: '09:00',
    until_time: '09:30',
    timezone: 'America/Toronto',
  }
}

/** Migrate legacy business_hours / weekdays / time_range into crontab fields. */
function migrateSchedule(raw: TimeConditionsValue): TimeConditionsValue {
  const base = emptySchedule()
  const merged: TimeConditionsValue = { ...base, ...raw }

  if (!merged.frequency) {
    merged.frequency = raw.weekdays_only ? 'weekly' : 'daily'
  }

  if (!merged.days_of_week?.length) {
    if (raw.specific_days?.length) {
      merged.days_of_week = [...raw.specific_days]
    } else if (raw.weekdays_only) {
      merged.days_of_week = [1, 2, 3, 4, 5]
    } else if (raw.weekends_only) {
      merged.days_of_week = [6, 7]
    } else if (merged.frequency === 'weekly') {
      merged.days_of_week = [1]
    } else {
      merged.days_of_week = [1, 2, 3, 4, 5, 6, 7]
    }
  }

  if (!merged.monthly_mode) {
    merged.monthly_mode = 'day_of_month'
  }
  if (merged.day_of_month_last === undefined) {
    merged.day_of_month_last = false
  }
  if (!merged.day_of_month) {
    merged.day_of_month = 1
  }
  if (merged.weekday_occurrence === undefined || merged.weekday_occurrence === null) {
    merged.weekday_occurrence = 1
  }
  if (!Array.isArray(merged.months)) {
    merged.months = []
  }

  if (!merged.at_time) {
    merged.at_time = raw.time_range?.start || (raw.business_hours_only ? '09:00' : '09:00')
  }
  if (!merged.until_time) {
    merged.until_time = raw.time_range?.end || (raw.business_hours_only ? '17:00' : '09:30')
  }
  if (!merged.timezone) {
    merged.timezone = 'America/Toronto'
  }

  return merged
}

const schedule = computed<TimeConditionsValue>({
  get() {
    ensureScheduleShape()
    return form.value.conditions!.time_conditions as TimeConditionsValue
  },
  set(val) {
    if (!form.value.conditions) form.value.conditions = {}
    form.value.conditions.time_conditions = val
  },
})

const scheduleAt = computed({
  get() {
    return schedule.value.at_time ?? '09:00'
  },
  set(v: string) {
    ensureScheduleShape()
    const tc = form.value.conditions!.time_conditions as TimeConditionsValue
    tc.at_time = v
  },
})

const scheduleUntil = computed({
  get() {
    return schedule.value.until_time ?? '09:30'
  },
  set(v: string) {
    ensureScheduleShape()
    const tc = form.value.conditions!.time_conditions as TimeConditionsValue
    tc.until_time = v
  },
})

const scheduleSummary = computed(() => {
  const tc = schedule.value
  const freq = tc.frequency || 'daily'
  const at = tc.at_time || '09:00'
  const until = tc.until_time || '09:30'
  const tz = tc.timezone || 'UTC'
  const monthsLabel =
    tc.months && tc.months.length > 0 && tc.months.length < 12
      ? ` in ${tc.months.map((m) => monthOptions.find((o) => o.value === m)?.label || m).join(', ')}`
      : ''

  if (freq === 'monthly') {
    if (tc.monthly_mode === 'nth_weekday') {
      const occ = weekdayOccurrenceLabels[tc.weekday_occurrence ?? 1] || '1st'
      const day =
        weekDays.find((w) => w.value === (tc.days_of_week?.[0] ?? 1))?.full || 'Monday'
      return `Monthly on ${occ} ${day}${monthsLabel}, ${at}–${until} (${tz})`
    }
    if (tc.day_of_month_last) {
      return `Monthly on last day${monthsLabel}, ${at}–${until} (${tz})`
    }
    return `Monthly on day ${tc.day_of_month || 1}${monthsLabel}, ${at}–${until} (${tz})`
  }
  const days = (tc.days_of_week || [])
    .slice()
    .sort((a, b) => a - b)
    .map((d) => weekDays.find((w) => w.value === d)?.label || String(d))
    .join(', ')
  if (freq === 'weekly') {
    return `Weekly on ${days || '—'}, ${at}–${until} (${tz})`
  }
  return `Daily${days && days !== 'Mon, Tue, Wed, Thu, Fri, Sat, Sun' ? ` (${days})` : ''}, ${at}–${until} (${tz})`
})

const monthlyWeekday = computed({
  get() {
    return schedule.value.days_of_week?.[0] ?? 1
  },
  set(v: number) {
    ensureScheduleShape()
    const tc = form.value.conditions!.time_conditions as TimeConditionsValue
    tc.days_of_week = [v]
  },
})

function isDaySelected(day: number): boolean {
  return (schedule.value.days_of_week || []).includes(day)
}

function toggleDay(day: number) {
  ensureScheduleShape()
  const tc = form.value.conditions!.time_conditions as TimeConditionsValue
  const current = new Set(tc.days_of_week || [])
  if (current.has(day)) {
    current.delete(day)
  } else {
    current.add(day)
  }
  tc.days_of_week = Array.from(current).sort((a, b) => a - b)
}

function isMonthSelected(month: number): boolean {
  return (schedule.value.months || []).includes(month)
}

function toggleMonth(month: number) {
  ensureScheduleShape()
  const tc = form.value.conditions!.time_conditions as TimeConditionsValue
  const current = new Set(tc.months || [])
  if (current.has(month)) {
    current.delete(month)
  } else {
    current.add(month)
  }
  tc.months = Array.from(current).sort((a, b) => a - b)
}

function formatRoleLabel(role: string): string {
  return role.replace(/_/g, ' ').toUpperCase()
}

function getActionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    notify: 'Notify',
    create_report: 'Create Report',
    log_only: 'Log Only',
  }
  return labels[type] || type
}

function extractLegacyNotifyRoles(conditions: unknown): RecipientRole[] {
  if (!conditions || typeof conditions !== 'object') return []
  const c = conditions as Record<string, unknown>
  const raw = c.notify_roles
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter((r): r is RecipientRole => typeof r === 'string') as RecipientRole[]
  }
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    const value = (raw as { value?: unknown }).value
    if (Array.isArray(value)) {
      return value.filter((r): r is RecipientRole => typeof r === 'string') as RecipientRole[]
    }
  }
  return []
}

function unwrapTimeConditions(raw: unknown): TimeConditionsValue | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const obj = raw as Record<string, unknown>
  if ('value' in obj && obj.value && typeof obj.value === 'object') {
    return migrateSchedule({ ...emptySchedule(), ...(obj.value as TimeConditionsValue) })
  }
  return migrateSchedule({ ...emptySchedule(), ...(obj as TimeConditionsValue) })
}

function normalizeConditionsForForm(raw: unknown): EventConditions {
  if (!raw || typeof raw !== 'object') return {}
  const c = raw as Record<string, unknown>
  const result: EventConditions = {}
  const time = unwrapTimeConditions(c.time_conditions)
  if (time) result.time_conditions = time
  return result
}

function migrateNotifyContent(action: NotifyAction): NotifyAction {
  const channel_content: Partial<Record<NotifyChannel, ChannelContentSpec>> = {
    ...(action.channel_content || {}),
  }
  const legacy = action.channel_templates || {}
  for (const ch of ['email', 'sms', 'push'] as NotifyChannel[]) {
    if (channel_content[ch]) continue
    const tid = legacy[ch]
    if (tid != null && Number(tid) > 0) {
      channel_content[ch] = { mode: 'local', template_id: Number(tid) }
    }
  }
  return {
    type: 'notify',
    channels: (action.channels || []).filter((ch) =>
      ['email', 'sms', 'push'].includes(ch),
    ) as NotifyAction['channels'],
    channel_content,
    recipients:
      Array.isArray(action.recipients) && action.recipients.length > 0
        ? action.recipients
        : [],
  }
}

function ensureChannelContent(action: NotifyAction, channel: string): ChannelContentSpec {
  if (!action.channel_content) action.channel_content = {}
  const key = channel as NotifyChannel
  if (!action.channel_content[key]) {
    action.channel_content[key] = { mode: 'system' }
  }
  return action.channel_content[key]!
}

function getChannelMode(action: NotifyAction, channel: string): ChannelContentMode {
  return ensureChannelContent(action, channel).mode || 'system'
}

function setChannelMode(action: NotifyAction, channel: string, mode: string) {
  const spec = ensureChannelContent(action, channel)
  const m = (['system', 'local', 'manual'].includes(mode) ? mode : 'system') as ChannelContentMode
  spec.mode = m
  if (m === 'local' && (channel === 'email' || channel === 'sms')) {
    loadTemplatesForChannel(channel)
  }
  if (m !== 'local') spec.template_id = null
  if (m !== 'manual') {
    delete spec.subject
    delete spec.body
  }
}

function getChannelTemplateId(action: NotifyAction, channel: string): string {
  const id = ensureChannelContent(action, channel).template_id
  return id != null && id > 0 ? String(id) : ''
}

function setChannelTemplateId(action: NotifyAction, channel: string, value: string) {
  const spec = ensureChannelContent(action, channel)
  spec.mode = 'local'
  spec.template_id = value ? Number(value) : null
}

function getChannelSubject(action: NotifyAction, channel: string): string {
  return ensureChannelContent(action, channel).subject || ''
}

function setChannelSubject(action: NotifyAction, channel: string, value: string) {
  const spec = ensureChannelContent(action, channel)
  spec.mode = 'manual'
  spec.subject = value
}

function getChannelBody(action: NotifyAction, channel: string): string {
  return ensureChannelContent(action, channel).body || ''
}

function setChannelBody(action: NotifyAction, channel: string, value: string) {
  const spec = ensureChannelContent(action, channel)
  spec.mode = 'manual'
  spec.body = value
}

function parseLegacyActions(
  input: unknown,
  legacyNotifyRoles: RecipientRole[] = [],
): EventRuleAction[] {
  if (!Array.isArray(input)) return []
  if (input.length === 0) return []

  const first = input[0] as unknown
  if (first && typeof first === 'object' && 'type' in (first as Record<string, unknown>)) {
    return (input as EventRuleAction[]).map((action) => {
      if (action.type === 'notify') {
        const migrated = migrateNotifyContent(action)
        if (legacyNotifyRoles.length > 0 && migrated.recipients.length === 0) {
          migrated.recipients = [...legacyNotifyRoles]
        }
        return migrated
      }
      if (action.type === 'create_report') {
        return {
          type: 'create_report' as const,
          period: action.period || 'daily',
          custom_period: action.custom_period,
          recipients: Array.isArray(action.recipients) ? action.recipients : [],
        }
      }
      return { type: 'log_only' as const }
    })
  }

  const result: EventRuleAction[] = []
  for (const v of input as string[]) {
    if (v === 'notify') {
      result.push({
        type: 'notify',
        channels: [],
        channel_content: {},
        recipients: [...legacyNotifyRoles],
      })
    } else if (v === 'log_only') {
      result.push({ type: 'log_only' })
    } else if (v.startsWith('create_') && v.endsWith('_report')) {
      const periodMap: Record<string, 'daily' | 'weekly' | 'monthly' | 'quarterly'> = {
        create_daily_report: 'daily',
        create_weekly_report: 'weekly',
        create_monthly_report: 'monthly',
        create_quarterly_report: 'quarterly',
      }
      result.push({
        type: 'create_report',
        period: periodMap[v] || 'daily',
        recipients: [],
      })
    } else if (v === 'create_report') {
      result.push({ type: 'create_report', period: 'daily', recipients: [] })
    }
  }
  return result
}

function getTemplatesForChannel(channel: 'email' | 'sms'): MessageTemplate[] {
  return templates.value[channel] || []
}

function addAction(type: 'notify' | 'create_report' | 'log_only') {
  if (type === 'notify') {
    form.value.actions.push({
      type: 'notify',
      channels: [],
      channel_content: {},
      recipients: [],
    })
    return
  }
  if (type === 'create_report') {
    form.value.actions.push({
      type: 'create_report',
      period: 'daily',
      recipients: [],
    })
    return
  }
  form.value.actions.push({ type: 'log_only' })
}

function onChannelChange(action: NotifyAction) {
  if (!action.channel_content) action.channel_content = {}
  action.channels.forEach((channel) => {
    if (!action.channel_content![channel]) {
      action.channel_content![channel] = { mode: 'system' }
    }
    if (
      (channel === 'email' || channel === 'sms') &&
      !templates.value[channel as 'email' | 'sms']?.length
    ) {
      loadTemplatesForChannel(channel as 'email' | 'sms')
    }
  })
  Object.keys(action.channel_content).forEach((channel) => {
    if (!action.channels.includes(channel as NotifyChannel)) {
      delete action.channel_content![channel as NotifyChannel]
    }
  })
}

async function loadTemplatesForChannel(channel: 'email' | 'sms') {
  try {
    const response = await eventRulesApi.listTemplates({ type: channel })
    if (response.status === 'success') {
      templates.value[channel] = response.data.templates.filter((t) => t.is_active)
    }
  } catch (error) {
    console.error(`Failed to load templates for ${channel}:`, error)
  }
}

function removeAction(index: number) {
  form.value.actions.splice(index, 1)
}

function ensureScheduleShape() {
  if (!form.value.conditions) form.value.conditions = {}
  if (!form.value.conditions.time_conditions) {
    form.value.conditions.time_conditions = emptySchedule()
    return
  }
  const migrated = migrateSchedule(form.value.conditions.time_conditions as TimeConditionsValue)
  const tc = form.value.conditions.time_conditions as TimeConditionsValue
  tc.frequency = migrated.frequency
  tc.days_of_week = migrated.days_of_week
  tc.monthly_mode = migrated.monthly_mode
  tc.day_of_month = migrated.day_of_month
  tc.day_of_month_last = migrated.day_of_month_last
  tc.weekday_occurrence = migrated.weekday_occurrence
  tc.months = migrated.months
  tc.at_time = migrated.at_time
  tc.until_time = migrated.until_time
  tc.timezone = migrated.timezone
}

function addScheduleFilter() {
  if (!form.value.conditions) form.value.conditions = {}
  form.value.conditions.time_conditions = emptySchedule()
}

function removeScheduleFilter() {
  if (form.value.conditions) {
    delete form.value.conditions.time_conditions
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

  if (form.value.conditions?.time_conditions) {
    const tc = migrateSchedule(form.value.conditions.time_conditions as TimeConditionsValue)
    if (tc.frequency === 'weekly' && !(tc.days_of_week && tc.days_of_week.length > 0)) {
      errors.schedule = 'Weekly schedule requires at least one day of week'
    }
    if (tc.frequency === 'monthly' && tc.monthly_mode === 'nth_weekday') {
      if (!(tc.days_of_week && tc.days_of_week.length > 0)) {
        errors.schedule = 'Nth weekday schedule requires a weekday'
      }
    }
    if (!tc.at_time) {
      errors.schedule = 'Schedule requires At time'
    }
  }

  for (const action of form.value.actions) {
    if (action.type === 'notify') {
      if (!action.channels || action.channels.length === 0) {
        errors.actions = 'Notify action must have at least one channel'
        break
      }
      if (!action.recipients || action.recipients.length === 0) {
        errors.actions = 'Notify action must have at least one recipient'
        break
      }
      for (const ch of action.channels) {
        if (ch !== 'email' && ch !== 'sms') continue
        const spec = action.channel_content?.[ch]
        const mode = spec?.mode || 'system'
        if (mode === 'local' && !(spec?.template_id && Number(spec.template_id) > 0)) {
          errors.actions = `Select a Message Template for ${ch.toUpperCase()}`
          break
        }
        if (mode === 'manual' && !(spec?.body && spec.body.trim())) {
          errors.actions = `Enter custom body for ${ch.toUpperCase()}`
          break
        }
      }
      if (errors.actions) break
    }
    if (action.type === 'create_report') {
      if (!action.recipients || action.recipients.length === 0) {
        errors.actions = 'Create Report action must have at least one recipient'
        break
      }
      if (action.period === 'custom' && !action.custom_period) {
        errors.actions = 'Custom period requires custom_period field'
        break
      }
    }
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

function buildSavePayload(): EventRule {
  const conditions: EventConditions = {}
  if (form.value.conditions?.time_conditions) {
    const tc = migrateSchedule(form.value.conditions.time_conditions as TimeConditionsValue)
    conditions.time_conditions = {
      frequency: tc.frequency || 'daily',
      days_of_week: tc.days_of_week || [1, 2, 3, 4, 5, 6, 7],
      monthly_mode: (tc.monthly_mode || 'day_of_month') as MonthlyMode,
      day_of_month: tc.day_of_month || 1,
      day_of_month_last: !!tc.day_of_month_last,
      weekday_occurrence: (tc.weekday_occurrence ?? 1) as WeekdayOccurrence,
      months: Array.isArray(tc.months) ? tc.months : [],
      at_time: tc.at_time || '09:00',
      until_time: tc.until_time || '09:30',
      timezone: tc.timezone || 'America/Toronto',
    }
  }
  const actions = form.value.actions.map((a) => {
    if (a.type !== 'notify') return a
    const migrated = migrateNotifyContent(a)
    // Drop legacy field on save
    delete migrated.channel_templates
    return migrated
  })
  return {
    ...form.value,
    actions,
    conditions: Object.keys(conditions).length > 0 ? conditions : {},
  }
}

async function handleSubmit() {
  if (!validateForm()) return
  isSubmitting.value = true
  try {
    emit('save', buildSavePayload())
  } finally {
    isSubmitting.value = false
  }
}

function closeDialog() {
  emit('close')
}

function resetForm() {
  form.value = {
    event_type: '',
    enabled: true,
    severity: 'important',
    priority: null,
    actions: [],
    conditions: {},
    execution_location: null,
    comment: '',
  }
}

watch(
  () => props.rule,
  (newRule) => {
    if (newRule) {
      const legacyRoles = extractLegacyNotifyRoles(newRule.conditions)
      const parsedActions = parseLegacyActions(newRule.actions as unknown, legacyRoles)
      form.value = {
        event_type: newRule.event_type,
        enabled: newRule.enabled,
        severity: newRule.severity,
        priority: newRule.priority ?? null,
        actions: parsedActions,
        conditions: normalizeConditionsForForm(newRule.conditions),
        execution_location: newRule.execution_location ?? null,
        comment: newRule.comment || '',
        updated_at: newRule.updated_at,
        updated_by: newRule.updated_by,
      }
    } else {
      resetForm()
    }
    validationErrors.value = {}
  },
  { immediate: true },
)

onMounted(() => {
  loadTemplatesForChannel('email')
  loadTemplatesForChannel('sms')
})

defineOptions({
  name: 'EventRuleDialog',
})
</script>
