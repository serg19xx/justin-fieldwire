#!/usr/bin/env node
/**
 * Convert CLIENT_TEAM_ASSIGNMENTS testing guides (md) to static HTML in public/.
 * No external dependencies.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

const GUIDES = [
  {
    lang: 'en',
    md: 'docs/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE.md',
    out: 'public/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE.html',
    filename: 'CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE.html',
    title: 'Task assignments testing guide',
    openLabel: 'How to open',
    openText: 'this page is available at',
    noLogin: 'no login required',
    pdfHint: 'Print (Ctrl/Cmd+P) → Save as PDF',
  },
  {
    lang: 'ru',
    md: 'docs/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE_RU.md',
    out: 'public/CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE_RU.html',
    filename: 'CLIENT_TEAM_ASSIGNMENTS_TESTING_GUIDE_RU.html',
    title: 'Назначение сотрудников на задачи',
    openLabel: 'Как открыть',
    openText: 'страница доступна по адресу',
    noLogin: 'без входа в систему',
    pdfHint: 'Печать (Ctrl/Cmd+P) → Сохранить как PDF',
  },
]

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inlineFormat(text) {
  let out = escapeHtml(text)
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return out
}

function isTableRow(line) {
  return /^\|.+\|$/.test(line.trim())
}

function parseTableRow(line) {
  return line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((c) => c.trim())
}

function isSeparatorRow(cells) {
  return cells.every((c) => /^:?-+:?$/.test(c.replace(/\s/g, '')))
}

function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const html = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i += 1
      continue
    }

    if (/^---+$/.test(trimmed)) {
      html.push('<hr />')
      i += 1
      continue
    }

    if (/^### /.test(trimmed)) {
      html.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`)
      i += 1
      continue
    }

    if (/^## /.test(trimmed)) {
      html.push(`<h2>${inlineFormat(trimmed.slice(3))}</h2>`)
      i += 1
      continue
    }

    if (/^# /.test(trimmed)) {
      html.push(`<h1>${inlineFormat(trimmed.slice(2))}</h1>`)
      i += 1
      continue
    }

    if (isTableRow(trimmed)) {
      const rows = []
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(parseTableRow(lines[i]))
        i += 1
      }
      if (rows.length >= 2 && isSeparatorRow(rows[1])) {
        html.push('<table><thead><tr>')
        for (const cell of rows[0]) {
          html.push(`<th>${inlineFormat(cell)}</th>`)
        }
        html.push('</tr></thead><tbody>')
        for (let r = 2; r < rows.length; r += 1) {
          html.push('<tr>')
          for (const cell of rows[r]) {
            html.push(`<td>${inlineFormat(cell)}</td>`)
          }
          html.push('</tr>')
        }
        html.push('</tbody></table>')
      } else {
        for (const row of rows) {
          html.push(`<p>${row.map(inlineFormat).join(' | ')}</p>`)
        }
      }
      continue
    }

    if (/^[-*] /.test(trimmed)) {
      html.push('<ul>')
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        html.push(`<li>${inlineFormat(lines[i].trim().slice(2))}</li>`)
        i += 1
      }
      html.push('</ul>')
      continue
    }

    if (/^\d+\. /.test(trimmed)) {
      html.push('<ol>')
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        html.push(`<li>${inlineFormat(lines[i].trim().replace(/^\d+\.\s*/, ''))}</li>`)
        i += 1
      }
      html.push('</ol>')
      continue
    }

    html.push(`<p>${inlineFormat(trimmed)}</p>`)
    i += 1
  }

  return html.join('\n')
}

function buildPage(meta, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="${meta.lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FieldWire — ${escapeHtml(meta.title)}</title>
  <style>
    :root { --text:#1a1a1a; --muted:#555; --border:#ccc; --bg-alt:#f7f7f7; --accent:#2563eb; }
    * { box-sizing:border-box; }
    body { font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height:1.55; color:var(--text); max-width:50rem; margin:0 auto; padding:1.25rem 1rem 3rem; font-size:15px; }
    .howto-open { background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:0.75rem 1rem; margin-bottom:1.5rem; font-size:14px; }
    .howto-open strong { color:var(--accent); }
    .howto-open code { font-size:12px; word-break:break-all; background:#fff; padding:0.1rem 0.35rem; border-radius:4px; border:1px solid #bfdbfe; }
    h1 { font-size:1.55rem; margin:0 0 0.5rem; line-height:1.25; }
    h2 { font-size:1.15rem; margin:1.75rem 0 0.75rem; padding-bottom:0.25rem; border-bottom:2px solid var(--border); }
    h3 { font-size:1rem; margin:1rem 0 0.5rem; }
    p { margin:0.5rem 0; }
    ul,ol { margin:0.5rem 0; padding-left:1.35rem; }
    li { margin:0.3rem 0; }
    hr { border:none; border-top:1px solid var(--border); margin:1.5rem 0; }
    table { width:100%; border-collapse:collapse; margin:0.75rem 0 1rem; font-size:13px; }
    th,td { border:1px solid var(--border); padding:0.5rem 0.6rem; text-align:left; vertical-align:top; }
    th { background:var(--bg-alt); font-weight:600; }
    tr:nth-child(even) td { background:#fafafa; }
    code { font-size:0.9em; background:#f3f4f6; padding:0.1rem 0.3rem; border-radius:3px; }
    @media print { body { max-width:none; padding:0; font-size:11pt; } }
  </style>
</head>
<body>
  <div class="howto-open">
    <strong>${meta.openLabel}:</strong> ${meta.openText}
    <code id="self-url">…</code>
    (${meta.noLogin}).
    <br /><br />
    <strong>PDF:</strong> ${meta.pdfHint}.
  </div>
  <script>
    (function(){ try { var el=document.getElementById('self-url'); if(el&&window.location&&window.location.origin) el.textContent=window.location.origin+'/${meta.filename}'; } catch(e){} })();
  </script>
  ${bodyHtml}
</body>
</html>
`
}

for (const guide of GUIDES) {
  const mdPath = path.join(ROOT, guide.md)
  const outPath = path.join(ROOT, guide.out)
  const md = fs.readFileSync(mdPath, 'utf8')
  const body = markdownToHtml(md)
  fs.writeFileSync(outPath, buildPage(guide, body))
  console.log('Wrote', guide.out)
}
