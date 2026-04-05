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

// ── Renderers ───────────────────────────────────────────────────────────────

function renderPersonal(d, lang) {
  if (!d || !d.name) return ''
  const contacts = [
    d.email    && `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`,
    d.phone    && esc(d.phone),
    d.location && esc(d.location),
    d.linkedin && `<a href="${esc(d.linkedin)}" target="_blank">LinkedIn</a>`,
    d.github   && `<a href="${esc(d.github)}" target="_blank">GitHub</a>`,
  ].filter(Boolean)
  return `
<div class="personal-header">
  <div class="name">${esc(d.name)}${d.title?` <span class="name-title">/ ${esc(d.title)}</span>`:''}</div>
  ${contacts.length ? `<div class="contact-line">${contacts.join(' · ')}</div>` : ''}
  ${d.summary ? `<div class="summary">${esc(d.summary)}</div>` : ''}
</div>`
}
function renderEducation(d, lang) {
  if (!d || !d.institution) return ''
  const period = datePeriod(d.startDate, d.endDate, false, lang)
  const sub = [d.degree, d.major].filter(Boolean).map(esc).join(' · ')
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.institution)}</span><span class="entry-meta">${sub?`<em>${sub}</em> `:''}<span class="date">${esc(period)}</span></span></div></div>`
}
function renderWork(d, lang) {
  if (!d || !d.company) return ''
  const period = datePeriod(d.startDate, d.endDate, d.isCurrent, lang)
  const bullets = (d.bullets||[]).filter(Boolean)
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.company)}</span><span class="entry-meta">${d.role?`<em>${esc(d.role)}</em> `:''}<span class="date">${esc(period)}</span></span></div>${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
}
function renderProject(d, lang) {
  if (!d || !d.name) return ''
  const period = datePeriod(d.startDate, d.endDate, false, lang)
  const tech = d.techStack?.length ? `<span class="tech">${d.techStack.map(esc).join(', ')}</span>` : ''
  const bullets = (d.bullets||[]).filter(Boolean)
  const link = d.url ? ` <a href="${esc(d.url)}" target="_blank" class="proj-link">↗</a>` : ''
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.name)}${link}</span><span class="entry-meta">${d.role?`<em>${esc(d.role)}</em> `:''}<span class="date">${esc(period)}</span></span></div>${tech?`<div class="tech-line">${tech}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
}
function renderSkill(d, lang) {
  if (!d || !d.label) return ''
  const bullets = (d.bullets||[]).filter(Boolean)
  if (bullets.length) return `<div class="skill-entry"><span class="skill-label">${esc(d.label)}</span><ul class="skill-bullets">${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></div>`
  const items = (d.items||[]).filter(Boolean)
  if (!items.length) return ''
  return `<div class="skill-row"><span class="skill-label">${esc(d.label)}</span><span>${items.map(esc).join(' · ')}</span></div>`
}
function renderEntry(data, category, lang) {
  switch(category) {
    case 'personal':  return renderPersonal(data, lang)
    case 'education': return renderEducation(data, lang)
    case 'work':      return renderWork(data, lang)
    case 'project':   return renderProject(data, lang)
    case 'skill':     return renderSkill(data, lang)
    default: return ''
  }
}

const LABELS = {
  cn: { education:'教育经历', work:'工作经历', project:'项目经历', skill:'技能与证书' },
  en: { education:'Education', work:'Work Experience', project:'Projects', skill:'Skills' }
}

export function renderCompactTemplate(resumeData, lang, getData) {
  lang = lang || 'cn'
  const labels = LABELS[lang] || LABELS.cn
  const isCn = lang === 'cn'
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
    body += `<div class="section"><div class="section-title">${labels[section.category]||section.category}</div>${html}</div>`
  }

  const bodyFont = isCn ? "'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif" : "'Arial','Helvetica',sans-serif"

  return `<!DOCTYPE html>
<html lang="${isCn?'zh-CN':'en'}">
<head><meta charset="UTF-8"><title>Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
@page { size:A4; margin:12mm 16mm 10mm; }
*{ box-sizing:border-box; margin:0; padding:0; }
body{ font-family:${bodyFont}; font-size:9.5pt; line-height:1.45; color:#1a1a1a; background:white; max-width:210mm; margin:0 auto; }
a{ color:#1d4ed8; text-decoration:none; }
.personal-header{ padding-bottom:5pt; border-bottom:1.5pt solid #1a1a1a; margin-bottom:7pt; }
.name{ font-size:18pt; font-weight:700; color:#1a1a1a; }
.name-title{ font-size:12pt; font-weight:400; color:#6b7280; }
.contact-line{ font-size:8.5pt; color:#555; margin-top:3pt; }
.summary{ font-size:9pt; color:#374151; margin-top:4pt; line-height:1.5; }
.section{ margin-bottom:7pt; }
.section-title{
  font-size:8.5pt; font-weight:700; text-transform:uppercase; letter-spacing:1px;
  color:#1a1a1a; border-bottom:1pt solid #1a1a1a; padding-bottom:1.5pt; margin-bottom:4pt;
}
.entry{ margin-bottom:4pt; page-break-inside:avoid; }
.entry-row{ display:flex; justify-content:space-between; align-items:baseline; }
.entry-title{ font-weight:700; font-size:9.5pt; flex:1; }
.entry-meta{ font-size:8.5pt; color:#6b7280; white-space:nowrap; margin-left:6pt; flex-shrink:0; text-align:right; }
.entry-meta em{ font-style:italic; color:#374151; }
.date{ color:#6b7280; }
.tech-line{ font-size:8.5pt; color:#6b7280; margin-top:1pt; }
.tech{ }
ul{ margin:2pt 0 0 14pt; padding:0; }
li{ margin-bottom:1pt; font-size:9pt; }
.skill-row{ display:flex; align-items:baseline; margin-bottom:2pt; font-size:9pt; }
.skill-entry{ display:flex; align-items:flex-start; margin-bottom:3pt; font-size:9pt; }
.skill-label{ font-weight:700; min-width:70pt; flex-shrink:0; }
.skill-bullets{ margin:0; padding-left:12pt; list-style:disc; }
.skill-bullets li{ margin-bottom:1pt; }
.proj-link{ font-size:8pt; }
@media print{ html,body{ height:auto; overflow:visible; } .entry{ page-break-inside:avoid; } }
</style></head>
<body>${body}</body></html>`
}
