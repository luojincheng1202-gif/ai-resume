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

const LABELS = {
  cn: { education:'教育经历', work:'工作经历', project:'项目经历', skill:'技能证书' },
  en: { education:'Education', work:'Experience', project:'Projects', skill:'Skills' }
}

export function renderSidebarTemplate(resumeData, lang, getData) {
  lang = lang || 'cn'
  const labels = LABELS[lang] || LABELS.cn
  const isCn = lang === 'cn'
  const sorted = [...(resumeData.sections||[])].filter(s=>s.visible!==false).sort((a,b)=>(a.order||0)-(b.order||0))

  // Collect data by category
  let personalData = null
  const byCategory = {}
  for (const section of sorted) {
    const items = section.items.map(item=>getData(item,lang)).filter(Boolean)
    if (section.category === 'personal') { personalData = items[0] || null; continue }
    byCategory[section.category] = { section, items }
  }

  const p = personalData || {}
  const contacts = [
    p.email    && `<div class="contact-item"><span class="contact-icon">✉</span>${esc(p.email)}</div>`,
    p.phone    && `<div class="contact-item"><span class="contact-icon">✆</span>${esc(p.phone)}</div>`,
    p.location && `<div class="contact-item"><span class="contact-icon">⊙</span>${esc(p.location)}</div>`,
    p.linkedin && `<div class="contact-item"><span class="contact-icon">in</span><a href="${esc(p.linkedin)}" target="_blank">LinkedIn</a></div>`,
    p.github   && `<div class="contact-item"><span class="contact-icon">gh</span><a href="${esc(p.github)}" target="_blank">GitHub</a></div>`,
  ].filter(Boolean)

  // Sidebar: personal info + skills
  let sidebarHtml = ''
  if (p.name) {
    sidebarHtml += `<div class="sb-name">${esc(p.name)}</div>`
    if (p.title) sidebarHtml += `<div class="sb-title">${esc(p.title)}</div>`
    if (contacts.length) sidebarHtml += `<div class="sb-section"><div class="sb-section-title">${isCn?'联系方式':'Contact'}</div><div class="sb-contacts">${contacts.join('')}</div></div>`
    if (p.summary) sidebarHtml += `<div class="sb-section"><div class="sb-section-title">${isCn?'个人简介':'About'}</div><div class="sb-summary">${esc(p.summary)}</div></div>`
  }
  // Skills in sidebar
  const skillCat = byCategory['skill']
  if (skillCat) {
    sidebarHtml += `<div class="sb-section"><div class="sb-section-title">${labels.skill}</div>`
    for (const d of skillCat.items) {
      if (!d || !d.label) continue
      const items = (d.items||[]).filter(Boolean)
      const bullets = (d.bullets||[]).filter(Boolean)
      const list = bullets.length ? bullets : items
      sidebarHtml += `<div class="sb-skill"><div class="sb-skill-label">${esc(d.label)}</div>${list.length?`<div class="sb-skill-items">${list.map(esc).join(' · ')}</div>`:''}</div>`
    }
    sidebarHtml += '</div>'
  }
  // Education in sidebar
  const eduCat = byCategory['education']
  if (eduCat) {
    sidebarHtml += `<div class="sb-section"><div class="sb-section-title">${labels.education}</div>`
    for (const d of eduCat.items) {
      if (!d || !d.institution) continue
      const period = datePeriod(d.startDate, d.endDate, false, lang)
      sidebarHtml += `<div class="sb-edu"><div class="sb-edu-inst">${esc(d.institution)}</div><div class="sb-edu-degree">${[d.degree,d.major].filter(Boolean).map(esc).join(' · ')}</div>${period?`<div class="sb-edu-date">${esc(period)}</div>`:''}</div>`
    }
    sidebarHtml += '</div>'
  }

  // Main content: work + project
  let mainHtml = ''
  for (const cat of ['work','project']) {
    const catData = byCategory[cat]
    if (!catData) continue
    const items = catData.items
    if (!items.length) continue
    mainHtml += `<div class="main-section"><div class="main-section-title">${labels[cat]||cat}</div>`
    for (const d of items) {
      if (cat === 'work') {
        if (!d || !d.company) continue
        const period = datePeriod(d.startDate, d.endDate, d.isCurrent, lang)
        const bullets = (d.bullets||[]).filter(Boolean)
        mainHtml += `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.company)}</span><span class="entry-date">${esc(period)}</span></div>${d.role?`<div class="entry-sub">${esc(d.role)}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
      } else {
        if (!d || !d.name) continue
        const period = datePeriod(d.startDate, d.endDate, false, lang)
        const tech = d.techStack?.length ? `<span class="tech">${d.techStack.map(esc).join(' · ')}</span>` : ''
        const bullets = (d.bullets||[]).filter(Boolean)
        const link = d.url ? ` <a href="${esc(d.url)}" target="_blank">↗</a>` : ''
        mainHtml += `<div class="entry"><div class="entry-row"><span class="entry-title">${esc(d.name)}${link}</span><span class="entry-date">${esc(period)}</span></div>${(d.role||tech)?`<div class="entry-sub">${[d.role?esc(d.role):'',tech].filter(Boolean).join(' · ')}</div>`:''} ${bullets.length?`<ul>${bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}</div>`
      }
    }
    mainHtml += '</div>'
  }
  // Other categories
  for (const [cat, catData] of Object.entries(byCategory)) {
    if (['work','project','education','skill'].includes(cat)) continue
    const items = catData.items
    if (!items.length) continue
    mainHtml += `<div class="main-section"><div class="main-section-title">${labels[cat]||cat}</div>${items.map(d=>d&&d.label?`<div class="entry-title">${esc(d.label)}</div>`:'').join('')}</div>`
  }

  const bodyFont = isCn ? "'Noto Sans SC','PingFang SC',sans-serif" : "'Arial','Helvetica',sans-serif"
  const sbFont = isCn ? "'Noto Sans SC',sans-serif" : "'Arial',sans-serif"

  return `<!DOCTYPE html>
<html lang="${isCn?'zh-CN':'en'}">
<head><meta charset="UTF-8"><title>Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
<style>
@page { size:A4; margin:0; }
*{ box-sizing:border-box; margin:0; padding:0; }
html,body{ height:100%; }
body{ font-family:${bodyFont}; font-size:10pt; line-height:1.55; color:#1a1a1a; background:white; max-width:210mm; margin:0 auto; display:flex; min-height:297mm; }
a{ color:#c8a000; text-decoration:none; }
.sidebar{
  width:72mm; background:#1e3a5f; color:white;
  padding:24pt 14pt; flex-shrink:0;
  font-family:${sbFont}; min-height:100%;
}
.sb-name{ font-size:${isCn?'16pt':'17pt'}; font-weight:700; line-height:1.2; color:white; margin-bottom:4pt; }
.sb-title{ font-size:9.5pt; color:rgba(255,255,255,0.75); margin-bottom:14pt; }
.sb-section{ margin-bottom:14pt; }
.sb-section-title{
  font-size:7.5pt; font-weight:700; text-transform:uppercase; letter-spacing:1.2px;
  color:rgba(255,255,255,0.5); border-bottom:1pt solid rgba(255,255,255,0.2);
  padding-bottom:3pt; margin-bottom:6pt;
}
.sb-contacts{ font-size:8.5pt; }
.contact-item{ display:flex; align-items:flex-start; gap:5pt; margin-bottom:4pt; color:rgba(255,255,255,0.82); word-break:break-all; }
.contact-item a{ color:#f0c040; }
.contact-icon{ font-size:7pt; opacity:0.6; flex-shrink:0; margin-top:1pt; }
.sb-summary{ font-size:8.5pt; color:rgba(255,255,255,0.78); line-height:1.5; }
.sb-skill{ margin-bottom:6pt; }
.sb-skill-label{ font-size:8.5pt; font-weight:600; color:rgba(255,255,255,0.9); }
.sb-skill-items{ font-size:8pt; color:rgba(255,255,255,0.65); margin-top:1pt; }
.sb-edu{ margin-bottom:7pt; }
.sb-edu-inst{ font-size:9pt; font-weight:600; color:rgba(255,255,255,0.9); }
.sb-edu-degree{ font-size:8pt; color:rgba(255,255,255,0.7); margin-top:1pt; }
.sb-edu-date{ font-size:7.5pt; color:rgba(255,255,255,0.5); margin-top:1pt; }
.main{ flex:1; padding:24pt 20pt; }
.main-section{ margin-bottom:12pt; }
.main-section-title{
  font-size:10pt; font-weight:700; text-transform:uppercase; letter-spacing:0.8px;
  color:#1e3a5f; border-bottom:2pt solid #1e3a5f; padding-bottom:2pt; margin-bottom:7pt;
}
.entry{ margin-bottom:7pt; page-break-inside:avoid; }
.entry-row{ display:flex; justify-content:space-between; align-items:baseline; }
.entry-title{ font-weight:700; font-size:10pt; flex:1; }
.entry-date{ color:#6b7280; font-size:9pt; white-space:nowrap; margin-left:6pt; flex-shrink:0; }
.entry-sub{ color:#374151; font-style:italic; font-size:9.5pt; margin-top:1pt; }
ul{ margin:3pt 0 0 14pt; padding:0; }
li{ margin-bottom:2pt; font-size:9.5pt; }
.tech{ color:#4b5563; font-size:9pt; }
@media print{ html,body{ height:auto; min-height:297mm; } .sidebar{ min-height:297mm; } .entry{ page-break-inside:avoid; } }
</style></head>
<body>
<div class="sidebar">${sidebarHtml}</div>
<div class="main">${mainHtml}</div>
</body></html>`
}
