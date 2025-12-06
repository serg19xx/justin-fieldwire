#!/usr/bin/env ts-node
/**
 * Script to import task templates from TSV file
 * Usage: npx ts-node scripts/import-task-templates.ts <path-to-tsv-file>
 */

import * as fs from 'fs'
import * as path from 'path'

// Import the import function (we'll need to adapt it for Node.js)
async function importTasksFromTSVFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // For Node.js, we'll parse and output JSON that can be imported
  // In browser, use the actual import function
  console.log('📥 Reading TSV file:', filePath)
  console.log('📋 File content length:', content.length)
  console.log('\n⚠️  For browser import, use the TaskTemplateImporter component in the UI')
  console.log('   or call importTasksFromTSV() function from task-templates-import.ts')
}

// Main
const filePath = process.argv[2]

if (!filePath) {
  console.error('❌ Error: Please provide TSV file path')
  console.log('Usage: npx ts-node scripts/import-task-templates.ts <path-to-tsv-file>')
  process.exit(1)
}

if (!fs.existsSync(filePath)) {
  console.error('❌ Error: File not found:', filePath)
  process.exit(1)
}

importTasksFromTSVFile(filePath).catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})

