#!/usr/bin/env node
/**
 * Script to generate SQL INSERT statements from task-templates.json
 * Usage: node scripts/generate-import-sql.js > migrations/import_task_templates_data.sql
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read JSON file
const jsonPath = path.join(__dirname, '../src/core/mock-data/task-templates.json')
const templates = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

console.log('-- Migration: Import task templates data')
console.log('-- Generated from: src/core/mock-data/task-templates.json')
console.log('-- Total templates:', templates.length)
console.log('-- Date:', new Date().toISOString().split('T')[0])
console.log('')
console.log('INSERT INTO `fw_task_templates`')
console.log('  (`name`, `category`, `duration_days`, `start_offset_days`, `end_offset_days`, `milestone`, `status`, `notes`, `wbs_path`, `task_order`)')
console.log('VALUES')

const values = templates.map((template, index) => {
  const name = (template.name || '').replace(/'/g, "''") // Escape single quotes
  const category = (template.category || null)
  const durationDays = template.duration_days || null
  const startOffsetDays = template.start_offset_days !== null && template.start_offset_days !== undefined ? template.start_offset_days : null
  const endOffsetDays = template.end_offset_days !== null && template.end_offset_days !== undefined ? template.end_offset_days : null
  const milestone = template.milestone || null
  const status = template.status || 'planned'
  const notes = template.notes ? (template.notes || '').replace(/'/g, "''") : null
  const wbsPath = template.wbs_path || null
  const taskOrder = template.task_order || null

  const parts = [
    `'${name}'`,
    category ? `'${category}'` : 'NULL',
    durationDays !== null ? durationDays : 'NULL',
    startOffsetDays !== null ? startOffsetDays : 'NULL',
    endOffsetDays !== null ? endOffsetDays : 'NULL',
    milestone ? `'${milestone}'` : 'NULL',
    `'${status}'`,
    notes ? `'${notes}'` : 'NULL',
    wbsPath ? `'${wbsPath}'` : 'NULL',
    taskOrder !== null ? taskOrder : 'NULL',
  ]

  return `  (${parts.join(', ')})${index < templates.length - 1 ? ',' : ';'}`
})

console.log(values.join('\n'))
console.log('')
console.log('-- Verify import')
console.log(`SELECT COUNT(*) as imported_count FROM \`fw_task_templates\`;`)
console.log(`-- Expected: ${templates.length}`)

