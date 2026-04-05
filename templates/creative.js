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
    d.linkedin && `<a href="${esc(d.linkedin)}" target="_blank">LinkedIn</a>`,
    d.github   && `<a href="${esc(d.github)}" target="_blank">GitHub</a>`,
  ].filter(Boolean)
  return `
<div class="cr-header">
  <div class="cr-stripe"></div>
  <div class="cr-header-body">
    <div class="name">${esc(d.name)}</div>
    ${d.title ? `<div class="cr-title">${esc(d.title)}</div>` : ''}
    ${contacts.length ? `<div class="contact-line">${contacts.join(' &nbsp;·&nbsp; ')}</div>` : ''}
    ${d.summary ? `<div class="summary">${esc(d.summary)}</div>` : ''}
  </div>
</div>`
}
function renderEducation(d, lang) {
  if (!d || !d.institution) return ''
  const period = datePeriod(d.startDate, d.endDate, false, lang)
  const sub = [d.degree, d.major].filter(Boolean).map(esc).join(' · ')
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.institution)}</span><span class="entry-date">${esc(period)}</span></div>${sub?`<div class="entry-sub">${sub}${d.gpa?` · GPA ${esc(d.gpa)}`:''}</div>`:''}</div>`
}
function renderWork(d, lang) {
  if (!d || !d.company) return ''
  const period = datePeriod(d.startDate, d.endDate, d.isCurrent, lang)
  const bullets = (d.bullets||[]).filter(Boolean)
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.company)}</span><span class="entry-date">${esc(period)}</span></div>${d.role?`<div class="entry-sub">${esc(d.role)}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
}
function renderProject(d, lang) {
  if (!d || !d.name) return ''
  const period = datePeriod(d.startDate, d.endDate, false, lang)
  const tech = d.techStack?.length ? `<span class="tech">${d.techStack.map(esc).join(' · ')}</span>` : ''
  const bullets = (d.bullets||[]).filter(Boolean)
  const link = d.url ? ` <a href="${esc(d.url)}" target="_blank">↗</a>` : ''
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.name)}${link}</span><span class="entry-date">${esc(period)}</span></div>${(d.role||tech)?`<div class="entry-sub">${[d.role?esc(d.role):'',tech].filter(Boolean).join(' · ')}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
}
function renderSkill(d) {
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
    case 'skill':     return renderSkill(data)
    default: return ''
  }
}

const LABELS = {
  cn: { education:'教育经历', work:'工作经历', project:'项目经历', skill:'技能与证书' },
  en: { education:'Education', work:'Work Experience', project:'Projects', skill:'Skills & Certifications' }
}

// Accent colors cycling for section titles
const ACCENTS = ['#e74c3c','#e67e22','#2980b9','#27ae60','#8e44ad','#16a085']

export function renderCreativeTemplate(resumeData, lang, getData) {
  lang = lang || 'cn'
  const labels = LABELS[lang] || LABELS.cn
  const isCn = lang === 'cn'
  const sorted = [...(resumeData.sections||[])].filter(s=>s.visible!==false).sort((a,b)=>(a.order||0)-(b.order||0))

  let body = ''
  let accentIdx = 0
  for (const section of sorted) {
    const items = section.items.map(item=>getData(item,lang)).filter(Boolean)
    if (section.category === 'personal') {
      for (const d of items) body += renderEntry(d,'personal',lang)
      continue
    }
    const html = items.map(d=>renderEntry(d,section.category,lang)).filter(s=>s.trim()).join('')
    if (!html) continue
    const accent = ACCENTS[accentIdx++ % ACCENTS.length]
    body += `<div class="section"><div class="section-title" style="background:${accent};">${labels[section.category]||section.category}</div>${html}</div>`
  }

  const bodyFont = isCn ? "'Noto Sans SC','PingFang SC',sans-serif" : "'Helvetica Neue','Arial',sans-serif"

  return `<!DOCTYPE html>
<html lang="${isCn?'zh-CN':'en'}">
<head><meta charset="UTF-8"><title>Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
@page { size:A4; margin:0; }
*{ box-sizing:border-box; margin:0; padding:0; }
body{ font-family:${bodyFont}; font-size:10.5pt; line-height:1.55; color:#1a1a1a; background:white; max-width:210mm; margin:0 auto; }
a{ color:#2980b9; text-decoration:none; }
.cr-header{ position:relative; overflow:hidden; margin-bottom:14pt; }
.cr-stripe{ height:7pt; background:linear-gradient(90deg,#e74c3c 0%,#e67e22 25%,#2980b9 50%,#27ae60 75%,#8e44ad 100%); }
.cr-header-body{ padding:14pt 20pt 12pt; background:#f8f9fa; }
.name{ font-size:${isCn?'22pt':'24pt'}; font-weight:700; color:#1a1a1a; }
.cr-title{ font-size:11pt; color:#555; margin-top:3pt; }
.contact-line{ font-size:9pt; color:#666; margin-top:5pt; }
.contact-line a{ color:#2980b9; }
.summary{ font-size:10pt; color:#444; margin-top:7pt; line-height:1.6; padding-left:0; }
.section{ margin-bottom:11pt; }
.section-title{
  font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:1px;
  color:white; padding:3pt 10pt; display:inline-block;
  border-radius:0 3pt 3pt 0; margin-bottom:7pt; margin-left:-20mm;
}
.entry{ margin-bottom:7pt; page-break-inside:avoid; padding-left:0; }
.entry-row{ display:flex; justify-content:space-between; align-items:baseline; }
.entry-title{ font-weight:700; font-size:10.5pt; flex:1; }
.entry-date{ color:#6b7280; font-size:9.5pt; white-space:nowrap; margin-left:8pt; flex-shrink:0; }
.entry-sub{ color:#555; font-style:italic; font-size:10pt; margin-top:1pt; }
ul{ margin:3pt 0 0 16pt; padding:0; }
li{ margin-bottom:2pt; font-size:10pt; }
.skill-row{ display:flex; align-items:baseline; margin-bottom:3pt; font-size:10pt; }
.skill-entry{ display:flex; align-items:flex-start; margin-bottom:4pt; font-size:10pt; }
.skill-label{ font-weight:700; min-width:80pt; flex-shrink:0; color:#333; }
.skill-bullets{ margin:0; padding-left:14pt; list-style:disc; }
.skill-bullets li{ margin-bottom:1.5pt; }
.tech{ color:#666; font-size:9.5pt; }
.content-wrap{ }
@media print{ html,body{ height:auto; overflow:visible; } .entry{ page-break-inside:avoid; } .section-title{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } .cr-stripe{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } .cr-header-body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body><div class="content-wrap">${body}</div></body></html>`
}
