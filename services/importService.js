/**
 * Extract text content from uploaded files.
 * PDF and DOCX require their respective CDN libraries to be loaded in index.html.
 */
export async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'json') {
    const text = await file.text()
    const data = JSON.parse(text)
    if (Array.isArray(data)) return { type: 'json', content: data }
    if (data.materials) return { type: 'json', content: data.materials }
    throw new Error('无法识别的 JSON 格式')
  }

  if (ext === 'txt') {
    const text = await file.text()
    return { type: 'text', content: text }
  }

  if (ext === 'pdf') {
    const text = await extractPdfText(file)
    return { type: 'text', content: text }
  }

  if (ext === 'docx') {
    const text = await extractDocxText(file)
    return { type: 'text', content: text }
  }

  throw new Error(`不支持的文件格式: .${ext}`)
}

async function extractPdfText(file) {
  if (window._loadPdfJs) await window._loadPdfJs()
  if (!window.pdfjsLib) throw new Error('PDF.js 加载失败，请检查网络连接')
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    fullText += content.items.map(item => item.str).join(' ') + '\n'
  }
  return fullText
}

async function extractDocxText(file) {
  if (window._loadMammoth) await window._loadMammoth()
  if (!window.mammoth) throw new Error('mammoth.js 加载失败，请检查网络连接')
  const arrayBuffer = await file.arrayBuffer()
  const result = await window.mammoth.extractRawText({ arrayBuffer })
  return result.value
}
