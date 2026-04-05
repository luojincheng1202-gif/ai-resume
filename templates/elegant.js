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
<div class="personal-header">
  <div class="name">${esc(d.name)}</div>
  ${d.title ? `<div class="el-title">${esc(d.title)}</div>` : ''}
  <div class="el-rule"></div>
  ${contacts.length ? `<div class="contact-line">${contacts.join(' &nbsp;·&nbsp; ')}</div>` : ''}
  ${d.summary ? `<div class="summary">${esc(d.summary)}</div>` : ''}
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

export function renderElegantTemplate(resumeData, lang, getData) {
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
    body += `<div class="section"><div class="section-title"><span>${labels[section.category]||section.category}</span></div>${html}</div>`
  }

  const serifFont = isCn
    ? "'Noto Serif SC','STSong','SimSun',serif"
    : "'Garamond','Georgia','Times New Roman',serif"

  return `<!DOCTYPE html>
<html lang="${isCn?'zh-CN':'en'}">
<head><meta charset="UTF-8"><title>Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600&display=swap" rel="stylesheet">
<style>
@page { size:A4; margin:22mm 26mm 20mm; }
*{ box-sizing:border-box; margin:0; padding:0; }
body{ font-family:${serifFont}; font-size:10.5pt; line-height:1.6; color:#2c2c2c; background:white; max-width:210mm; margin:0 auto; }
a{ color:#8b6914; text-decoration:none; }
.personal-header{ text-align:center; padding-bottom:14pt; margin-bottom:14pt; }
.name{ font-size:${isCn?'28pt':'30pt'}; font-weight:${isCn?'600':'400'}; letter-spacing:${isCn?'4px':'6px'}; color:#1a1a1a; }
.el-title{ font-size:11pt; font-weight:300; color:#6b6b6b; margin-top:4pt; letter-spacing:2px; text-transform:uppercase; font-style:italic; }
.el-rule{ width:60pt; height:1pt; background:#c9a227; margin:10pt auto; }
.contact-line{ font-size:9pt; color:#6b6b6b; margin-top:4pt; letter-spacing:0.5px; }
.contact-line a{ color:#8b6914; }
.summary{ font-size:10pt; color:#444; margin-top:10pt; line-height:1.7; font-style:italic; }
.section{ margin-bottom:13pt; }
.section-title{
  font-size:10pt; font-weight:${isCn?'600':'400'}; letter-spacing:${isCn?'1px':'3px'};
  text-transform:uppercase; color:#8b6914; text-align:center;
  margin-bottom:8pt; position:relative;
}
.section-title::before,.section-title::after{
  content:''; position:absolute; top:50%; width:calc(50% - 60pt); height:0.5pt; background:#c9a227;
}
.section-title::before{ left:0; }
.section-title::after{ right:0; }
.section-title span{ background:white; padding:0 10pt; position:relative; z-index:1; }
.entry{ margin-bottom:8pt; page-break-inside:avoid; }
.entry-row{ display:flex; justify-content:space-between; align-items:baseline; }
.entry-title{ font-weight:600; font-size:10.5pt; flex:1; color:#1a1a1a; }
.entry-date{ color:#8b8b8b; font-size:9.5pt; white-space:nowrap; margin-left:8pt; flex-shrink:0; font-style:italic; }
.entry-sub{ color:#555; font-style:italic; font-size:10pt; margin-top:1.5pt; }
ul{ margin:4pt 0 0 18pt; padding:0; }
li{ margin-bottom:2.5pt; font-size:10pt; }
.skill-row{ display:flex; align-items:baseline; margin-bottom:4pt; font-size:10pt; }
.skill-entry{ display:flex; align-items:flex-start; margin-bottom:5pt; font-size:10pt; }
.skill-label{ font-weight:600; min-width:85pt; flex-shrink:0; color:#3a3a3a; }
.skill-bullets{ margin:0; padding-left:14pt; list-style:disc; }
.skill-bullets li{ margin-bottom:2pt; }
.tech{ color:#666; font-size:9.5pt; }
@media print{ html,body{ height:auto; overflow:visible; } .entry{ page-break-inside:avoid; } }
</style></head>
<body>${body}</body></html>`
}
