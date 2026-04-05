// ── Helpers ────────────────────────────────────────────────────────────────

function esc(str) {
  if (str == null) return ''
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
function fmtDate(dateStr, lang) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (lang === 'cn') return parts.length >= 2 ? `${parts[0]}年${parseInt(parts[1])}月` : `${parts[0]}年`
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
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
  const isCn = lang === 'cn'
  const contacts = [
    d.email    && `${esc(d.email)}`,
    d.phone    && `${esc(d.phone)}`,
    d.location && `${esc(d.location)}`,
    d.linkedin && `<a href="${esc(d.linkedin)}" target="_blank">LinkedIn</a>`,
    d.github   && `<a href="${esc(d.github)}" target="_blank">GitHub</a>`,
    d.website  && `<a href="${esc(d.website)}" target="_blank">${esc(d.website)}</a>`,
  ].filter(Boolean)
  return `
<div class="personal-header">
  <div class="name">${esc(d.name)}</div>
  ${d.title ? `<div class="ac-title">${esc(d.title)}</div>` : ''}
  ${contacts.length ? `<div class="ac-contact-block">${contacts.map(c=>`<span>${c}</span>`).join('<span class="ac-sep"> &nbsp;·&nbsp; </span>')}</div>` : ''}
  ${d.summary ? `<div class="summary">${esc(d.summary)}</div>` : ''}
</div>`
}
function renderEducation(d, lang) {
  if (!d || !d.institution) return ''
  const period = datePeriod(d.startDate, d.endDate, false, lang)
  const sub = [d.degree, d.major].filter(Boolean).map(esc).join(', ')
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.institution)}</span><span class="entry-date">${esc(period)}</span></div>${sub?`<div class="entry-sub">${sub}${d.gpa?` (GPA: ${esc(d.gpa)})`:''}</div>`:''} ${d.honors?.length?`<div class="entry-extra">${d.honors.map(esc).join('; ')}</div>`:''} ${d.notes?`<div class="entry-extra">${esc(d.notes)}</div>`:''}</div>`
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
  const tech = d.techStack?.length ? `<span class="tech">${d.techStack.map(esc).join(', ')}</span>` : ''
  const bullets = (d.bullets||[]).filter(Boolean)
  const link = d.url ? ` [<a href="${esc(d.url)}" target="_blank">link</a>]` : ''
  return `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.name)}${link}</span><span class="entry-date">${esc(period)}</span></div>${(d.role||tech)?`<div class="entry-sub">${[d.role?esc(d.role):'',tech].filter(Boolean).join('. ')}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
}
function renderSkill(d) {
  if (!d || !d.label) return ''
  const bullets = (d.bullets||[]).filter(Boolean)
  if (bullets.length) return `<div class="skill-entry"><span class="skill-label">${esc(d.label)}:</span><ul class="skill-bullets">${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></div>`
  const items = (d.items||[]).filter(Boolean)
  if (!items.length) return ''
  return `<div class="skill-row"><span class="skill-label">${esc(d.label)}:</span><span>${items.map(esc).join('; ')}</span></div>`
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
  cn: { education:'教育经历', work:'工作经历', project:'科研与项目', skill:'技能与证书' },
  en: { education:'Education', work:'Professional Experience', project:'Research & Projects', skill:'Skills & Certifications' }
}

export function renderAcademicTemplate(resumeData, lang, getData) {
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

  const serifFont = isCn ? "'Noto Serif SC','STSong','SimSun',serif" : "'Times New Roman','Georgia',serif"

  return `<!DOCTYPE html>
<html lang="${isCn?'zh-CN':'en'}">
<head><meta charset="UTF-8"><title>Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page { size:A4; margin:22mm 28mm 20mm; }
*{ box-sizing:border-box; margin:0; padding:0; }
body{ font-family:${serifFont}; font-size:10.5pt; line-height:1.6; color:#111; background:white; max-width:210mm; margin:0 auto; }
a{ color:#111; text-decoration:underline; }
.personal-header{ text-align:center; padding-bottom:12pt; margin-bottom:14pt; }
.name{ font-size:${isCn?'20pt':'22pt'}; font-weight:700; letter-spacing:${isCn?'2px':'1px'}; color:#111; }
.ac-title{ font-size:11pt; color:#444; margin-top:3pt; font-style:italic; }
.ac-contact-block{ font-size:9pt; color:#555; margin-top:7pt; }
.ac-sep{ color:#bbb; }
.summary{ font-size:10pt; color:#333; margin-top:8pt; line-height:1.7; text-align:justify; }
.section{ margin-bottom:12pt; }
.section-title{
  font-size:11pt; font-weight:700; text-transform:uppercase;
  letter-spacing:${isCn?'1px':'2px'}; color:#111;
  border-bottom:1pt solid #111; padding-bottom:2pt; margin-bottom:8pt;
  text-align:center;
}
.entry{ margin-bottom:8pt; page-break-inside:avoid; }
.entry-row{ display:flex; justify-content:space-between; align-items:baseline; }
.entry-title{ font-weight:700; font-size:10.5pt; flex:1; }
.entry-date{ color:#555; font-size:9.5pt; white-space:nowrap; margin-left:8pt; flex-shrink:0; font-style:italic; }
.entry-sub{ color:#333; font-style:italic; font-size:10pt; margin-top:1.5pt; }
.entry-extra{ color:#555; font-size:9.5pt; margin-top:2pt; }
ul{ margin:4pt 0 0 18pt; padding:0; }
li{ margin-bottom:2.5pt; font-size:10pt; }
.skill-row{ display:flex; align-items:baseline; margin-bottom:4pt; font-size:10pt; }
.skill-entry{ display:flex; align-items:flex-start; margin-bottom:5pt; font-size:10pt; }
.skill-label{ font-weight:700; min-width:90pt; flex-shrink:0; }
.skill-bullets{ margin:0; padding-left:14pt; list-style:disc; }
.skill-bullets li{ margin-bottom:2pt; }
.tech{ color:#555; font-size:9.5pt; }
@media print{ html,body{ height:auto; overflow:visible; } .entry{ page-break-inside:avoid; } }
</style></head>
<body>${body}</body></html>`
}
