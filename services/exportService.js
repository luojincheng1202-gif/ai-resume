import { store } from '../store/state.js'

/**
 * Export the resume iframe as a PDF file downloaded directly to disk.
 * Uses html2canvas + jsPDF (lazy-loaded). Falls back to print dialog on error.
 */
export async function printResume(iframeEl) {
  if (!iframeEl || !iframeEl.contentDocument?.body) {
    alert('请先切换到预览模式')
    return
  }

  try {
    if (window._loadHtml2Canvas) await window._loadHtml2Canvas()
    if (window._loadJsPDF) await window._loadJsPDF()

    if (!window.html2canvas || !window.jspdf) throw new Error('依赖库加载失败')

    const body = iframeEl.contentDocument.body

    // Wait for any pending font renders to settle
    await new Promise(r => setTimeout(r, 200))

    const canvas = await window.html2canvas(body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: body.scrollWidth,
      height: body.scrollHeight,
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
    })

    const { jsPDF } = window.jspdf
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

    const pageW = 210   // A4 mm
    const pageH = 297   // A4 mm

    const imgW = pageW
    const imgH = (canvas.height / canvas.width) * pageW

    const imgData = canvas.toDataURL('image/jpeg', 0.97)

    let pageCount = 0
    let yOffset = 0

    while (yOffset < imgH) {
      if (pageCount > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, -yOffset, imgW, imgH)
      yOffset += pageH
      pageCount++
      if (pageCount > 20) break
    }

    const filename = `resume_${new Date().toISOString().slice(0, 10)}.pdf`
    pdf.save(filename)

  } catch (e) {
    console.error('PDF export failed, falling back to print dialog:', e)
    iframeEl.contentWindow.focus()
    iframeEl.contentWindow.print()
  }
}

/**
 * Export the resume as a .docx Word file using html-docx-js.
 * @param {string} htmlContent — full HTML document string (without screen padding injection)
 */
export async function exportWord(htmlContent) {
  if (window._loadHtmlDocx) await window._loadHtmlDocx()
  if (!window.htmlDocx) throw new Error('html-docx-js 加载失败')

  // html-docx-js margin unit is twips (1 inch = 1440 twips; 1 mm ≈ 56.7 twips)
  const mmToTwips = mm => Math.round(mm * 56.7)
  const blob = window.htmlDocx.asBlob(htmlContent, {
    orientation: 'portrait',
    margins: {
      top:    mmToTwips(18),
      right:  mmToTwips(22),
      bottom: mmToTwips(16),
      left:   mmToTwips(22),
    }
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resume_${new Date().toISOString().slice(0, 10)}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export the full data (materials + resume) as a JSON backup file.
 */
export function exportBackup() {
  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    materials: store.materials,
    resume: store.resume
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `resume_backup_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
