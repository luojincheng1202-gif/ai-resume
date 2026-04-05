// ── Helpers ────────────────────────────────────────────────────────────────

function esc(str) {
  if (str == null) return ''
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
function fmtDate(dateStr, lang) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (lang === 'cn') return parts.length >= 2 ? `${parts[0]}年${parseInt(parts[1])}月` : `${parts[0]}年`
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return parts.length >= 2 ? `${months[parseInt(parts[1])-1]} ${parts[0]}` : parts[0]
}
function datePeriod(start, end, isCurrent, lang) {
  const s = fmtDate(start, lang)
  const e = isCurrent ? (lang==='cn'?'至今':'Present') : (end ? fmtDate(end, lang) : '')
  if (!s && !e) return ''
  if (!e) return s
  return `${s} ${lang==='cn'?'—':'–'} ${e}`
}

function renderPersonal(d, lang) {
  if (!d || !d.name) return ''
  const contacts = [
    d.email    && `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`,
    d.phone    && esc(d.phone),
    d.location && esc(d.location),
    d.linkedin && `<a href="${esc(d.linkedin)}" target="_blank">linkedin</a>`,
    d.github   && `<a href="${esc(d.github)}" target="_blank">github</a>`,
    d.website  && `<a href="${esc(d.website)}" target="_blank">${esc(d.website)}</a>`,
  ].filter(Boolean)
  return `
<div class="personal-header">
  <div class="tc-prompt">$&gt; <span class="name">${esc(d.name)}</span>${d.title?` <span class="tc-at">@</span><span class="tc-role">${esc(d.title)}</span>`:''}</div>
  ${contacts.length ? `<div class="contact-line">${contacts.join(' &nbsp;|&nbsp; ')}</div>` : ''}
  ${d.summary ? `<div class="summary">${esc(d.summary)}</div>` : ''}
</div>`
}
function renderEducation(d, lang) {
  if (!d || !d.institution) return ''
  const period = datePeriod(d.startDate, d.endDate, false, lang)
  const sub = [d.degree, d.major].filter(Boolean).map(esc).join(' / ')
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.institution)}</span><span class="entry-date"># ${esc(period)}</span></div>${sub?`<div class="entry-sub">${sub}${d.gpa?` // gpa: ${esc(d.gpa)}`:''}</div>`:''}</div>`
}
function renderWork(d, lang) {
  if (!d || !d.company) return ''
  const period = datePeriod(d.startDate, d.endDate, d.isCurrent, lang)
  const bullets = (d.bullets||[]).filter(Boolean)
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.company)}</span><span class="entry-date"># ${esc(period)}</span></div>${d.role?`<div class="entry-sub">role: ${esc(d.role)}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
}
function renderProject(d, lang) {
  if (!d || !d.name) return ''
  const period = datePeriod(d.startDate, d.endDate, false, lang)
  const tech = d.techStack?.length ? `<span class="tc-tech">[${d.techStack.map(esc).join(', ')}]</span>` : ''
  const bullets = (d.bullets||[]).filter(Boolean)
  const link = d.url ? ` <a href="${esc(d.url)}" target="_blank" class="tc-link">→ ${esc(d.url)}</a>` : ''
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.name)}</span><span class="entry-date"># ${esc(period)}</span></div>${(d.role||tech||link)?`<div class="entry-sub">${[d.role?`role: ${esc(d.role)}`:'', tech, link].filter(Boolean).join(' ')}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
}
function renderSkill(d) {
  if (!d || !d.label) return ''
  const bullets = (d.bullets||[]).filter(Boolean)
  if (bullets.length) return `<div class="skill-entry"><span class="skill-label">${esc(d.label)}</span><ul class="skill-bullets">${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></div>`
  const items = (d.items||[]).filter(Boolean)
  if (!items.length) return ''
  return `<div class="skill-row"><span class="skill-label">${esc(d.label)}</span><span class="tc-items">${items.map(esc).join(', ')}</span></div>`
}
function renderEntry(data, category, lang) {
  switch(category) {
    case 'personal':  return renderPersonal(data, lang)
    case 'education': return renderEducation(data, lang)
    case 'work':      return renderWork(data, lang)
    case 'project':   return renderProject(data, lang)
    case 'skill':     return renderSkill(data)
    default: return ''
  }
}

const LABELS = {
  cn: { education:'教育经历', work:'工作经历', project:'项目经历', skill:'技能与证书' },
  en: { education:'# education', work:'# experience', project:'# projects', skill:'# skills' }
}

export function renderTechnicalTemplate(resumeData, lang, getData) {
  lang = lang || 'cn'
  const isCn = lang === 'cn'
  const labels = {
    education: isCn ? '// 教育经历' : '// education',
    work:      isCn ? '// 工作经历' : '// experience',
    project:   isCn ? '// 项目经历' : '// projects',
    skill:     isCn ? '// 技能证书' : '// skills',
  }
  const sorted = [...(resumeData.sections||[])].filter(s=>s.visible!==false).sort((a,b)=>(a.order||0)-(b.order||0))

  let body = ''
  for (const section of sorted) {
    const items = section.items.map(item=>getData(item,lang)).filter(Boolean)
    if (section.category === 'personal') {
      for (const d of items) body += renderEntry(d,'personal',lang)
      continue
    }
    const html = items.map(d=>renderEntry(d,section.category,lang)).filter(s=>s.trim()).join('')
    if (!html) continue
    body += `<div class="section"><div class="section-title">${labels[section.category]||('// '+section.category)}</div>${html}</div>`
  }

  const monoFont = "'Courier New','Consolas','Lucida Console',monospace"
  const bodyFont = isCn ? `'Noto Sans SC','PingFang SC',${monoFont}` : monoFont

  return `<!DOCTYPE html>
<html lang="${isCn?'zh-CN':'en'}">
<head><meta charset="UTF-8"><title>Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
@page { size:A4; margin:18mm 22mm 16mm; }
*{ box-sizing:border-box; margin:0; padding:0; }
body{ font-family:${bodyFont}; font-size:9.5pt; line-height:1.55; color:#1a1a1a; background:#fafafa; max-width:210mm; margin:0 auto; }
a{ color:#0066cc; text-decoration:none; }
.personal-header{ background:#1a1a1a; color:#e0e0e0; padding:14pt 16pt; margin-bottom:14pt; border-radius:0; }
.tc-prompt{ font-size:${isCn?'13pt':'14pt'}; font-weight:700; color:#e0e0e0; }
.name{ color:#7dd3fc; font-family:${monoFont}; }
.tc-at{ color:#f59e0b; }
.tc-role{ color:#86efac; }
.contact-line{ font-size:8.5pt; color:#9ca3af; margin-top:6pt; font-family:${monoFont}; }
.contact-line a{ color:#7dd3fc; }
.summary{ font-size:9pt; color:#d1d5db; margin-top:7pt; line-height:1.5; font-family:${bodyFont}; }
.section{ margin-bottom:11pt; }
.section-title{
  font-family:${monoFont}; font-size:10pt; font-weight:700; color:#0066cc;
  background:#f3f4f6; padding:3pt 8pt; margin-bottom:6pt;
  border-left:3pt solid #0066cc;
}
.entry{ margin-bottom:7pt; page-break-inside:avoid; }
.entry-row{ display:flex; justify-content:space-between; align-items:baseline; }
.entry-title{ font-weight:700; font-size:9.5pt; flex:1; font-family:${monoFont}; }
.entry-date{ color:#6b7280; font-size:9pt; white-space:nowrap; margin-left:8pt; flex-shrink:0; font-family:${monoFont}; }
.entry-sub{ color:#4b5563; font-size:9pt; margin-top:1pt; font-family:${monoFont}; }
ul{ margin:3pt 0 0 16pt; padding:0; }
li{ margin-bottom:2pt; font-size:9.5pt; font-family:${bodyFont}; }
.skill-row{ display:flex; align-items:baseline; margin-bottom:3pt; font-size:9.5pt; }
.skill-entry{ display:flex; align-items:flex-start; margin-bottom:4pt; font-size:9.5pt; }
.skill-label{ font-weight:700; min-width:75pt; flex-shrink:0; font-family:${monoFont}; color:#0066cc; }
.skill-bullets{ margin:0; padding-left:12pt; list-style:none; }
.skill-bullets li::before{ content:'- '; }
.skill-bullets li{ margin-bottom:1.5pt; font-family:${bodyFont}; }
.tc-items{ color:#374151; }
.tc-tech{ color:#059669; }
.tc-link{ font-size:8pt; color:#0066cc; }
@media print{ html,body{ height:auto; overflow:visible; } .entry{ page-break-inside:avoid; } .personal-header,.section-title{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body>${body}</body></html>`
}
