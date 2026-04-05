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
<div class="ex-header">
  <div class="ex-name">${esc(d.name)}</div>
  ${d.title ? `<div class="ex-title">${esc(d.title)}</div>` : ''}
  ${contacts.length ? `<div class="ex-contacts">${contacts.join(' &nbsp;|&nbsp; ')}</div>` : ''}
  ${d.summary ? `<div class="ex-summary">${esc(d.summary)}</div>` : ''}
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
  en: { education:'Education', work:'Work Experience', project:'Projects', skill:'Skills & Certifications' }
}

export function renderExecutiveTemplate(resumeData, lang, getData) {
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

  const bodyFont = isCn ? "'Noto Serif SC','SimSun',serif" : "'Georgia','Times New Roman',serif"

  return `<!DOCTYPE html>
<html lang="${isCn?'zh-CN':'en'}">
<head><meta charset="UTF-8"><title>Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page { size:A4; margin:18mm 22mm 16mm; }
*{ box-sizing:border-box; margin:0; padding:0; }
body{ font-family:${bodyFont}; font-size:10.5pt; line-height:1.55; color:#1a1a1a; background:white; max-width:210mm; margin:0 auto; }
a{ color:#c8a000; text-decoration:none; }
.ex-header{
  background:#1e3a5f; color:white;
  margin:-16mm -20mm 16pt; padding:22pt 20mm 18pt;
}
.ex-name{ font-size:${isCn?'22pt':'24pt'}; font-weight:700; letter-spacing:1px; }
.ex-title{ font-size:11pt; color:rgba(255,255,255,0.8); margin-top:3pt; }
.ex-contacts{ font-size:9pt; color:rgba(255,255,255,0.7); margin-top:6pt; }
.ex-contacts a{ color:#f0c040; }
.ex-summary{ font-size:10pt; color:rgba(255,255,255,0.82); margin-top:7pt; line-height:1.6; }
.section{ margin-bottom:11pt; }
.section-title{
  font-size:10pt; font-weight:700; text-transform:uppercase;
  letter-spacing:${isCn?'0.5px':'1px'}; color:#1e3a5f;
  border-top:0.5pt solid #1e3a5f; border-bottom:2pt solid #1e3a5f;
  padding:3pt 0; margin-bottom:7pt;
}
.entry{ margin-bottom:7pt; page-break-inside:avoid; }
.entry-row{ display:flex; justify-content:space-between; align-items:baseline; }
.entry-title{ font-weight:700; font-size:10.5pt; flex:1; }
.entry-date{ color:#6b7280; font-size:9.5pt; white-space:nowrap; margin-left:8pt; flex-shrink:0; }
.entry-sub{ color:#374151; font-style:italic; font-size:10pt; margin-top:1pt; }
ul{ margin:3pt 0 0 16pt; padding:0; }
li{ margin-bottom:2pt; font-size:10pt; }
.skill-row{ display:flex; align-items:baseline; margin-bottom:3pt; font-size:10pt; }
.skill-entry{ display:flex; align-items:flex-start; margin-bottom:4pt; font-size:10pt; }
.skill-label{ font-weight:700; min-width:80pt; flex-shrink:0; color:#1e3a5f; }
.skill-bullets{ margin:0; padding-left:14pt; list-style:disc; }
.skill-bullets li{ margin-bottom:1.5pt; }
.tech{ color:#4b5563; font-size:9.5pt; }
@media print{ html,body{ height:auto; overflow:visible; } .entry{ page-break-inside:avoid; } }
</style></head>
<body>${body}</body></html>`
}
