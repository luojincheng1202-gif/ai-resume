import { store } from '../store/state.js'

// ── Provider registry ──────────────────────────────────────────────────────

export const PROVIDERS = {
  claude: {
    name: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-opus-4-5',
    models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5'],
    format: 'anthropic'
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    format: 'openai'
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    format: 'gemini'
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    format: 'openai'
  },
  minimax: {
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-Text-01',
    models: ['MiniMax-Text-01'],
    format: 'openai'
  },
  kimi: {
    name: 'Kimi (Moonshot)',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    format: 'openai'
  }
}

function getConfig() {
  const s = store.aiSettings
  const preset = PROVIDERS[s.provider] || PROVIDERS.openai
  return {
    format: preset.format,
    baseUrl: (s.baseUrl || preset.baseUrl).replace(/\/$/, ''),
    apiKey: s.apiKey,
    model: s.model || preset.defaultModel,
    stream: s.streamEnabled !== false
  }
}

function extractJson(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = match ? match[1].trim() : text.trim()
  return JSON.parse(raw)
}

// ── Adapter: Anthropic ─────────────────────────────────────────────────────

async function callAnthropic(config, messages, system, onChunk) {
  const url = `${config.baseUrl}/messages`
  const body = {
    model: config.model,
    max_tokens: 4096,
    messages,
    ...(system ? { system } : {}),
    stream: !!onChunk
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic ${res.status}: ${errText}`)
  }

  if (onChunk) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'content_block_delta' && data.delta?.text) {
              full += data.delta.text
              onChunk(data.delta.text)
            }
          } catch { /* ignore */ }
        }
      }
    }
    return full
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ── Adapter: OpenAI-compatible ─────────────────────────────────────────────

async function callOpenAI(config, messages, onChunk) {
  const url = `${config.baseUrl}/chat/completions`
  const body = { model: config.model, messages, stream: !!onChunk }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${config.baseUrl} ${res.status}: ${errText}`)
  }

  if (onChunk) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6))
            const delta = data.choices?.[0]?.delta?.content
            if (delta) { full += delta; onChunk(delta) }
          } catch { /* ignore */ }
        }
      }
    }
    return full
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Adapter: Google Gemini ─────────────────────────────────────────────────

async function callGemini(config, messages, onChunk) {
  const model = config.model
  const url = onChunk
    ? `${config.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`
    : `${config.baseUrl}/models/${model}:generateContent?key=${config.apiKey}`

  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

  const systemMsg = messages.find(m => m.role === 'system')
  if (systemMsg && contents.length > 0) {
    contents[0].parts[0].text = systemMsg.content + '\n\n' + contents[0].parts[0].text
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini ${res.status}: ${errText}`)
  }

  if (onChunk) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) { full += text; onChunk(text) }
          } catch { /* ignore */ }
        }
      }
    }
    return full
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function callAI(systemPrompt, userPrompt, { onChunk } = {}) {
  const config = getConfig()
  if (!config.apiKey) throw new Error('请先在设置中填写 API Key')

  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: userPrompt })

  const streamCb = onChunk && config.stream ? onChunk : null

  if (config.format === 'anthropic') {
    return callAnthropic(config, [{ role: 'user', content: userPrompt }], systemPrompt, streamCb)
  } else if (config.format === 'gemini') {
    return callGemini(config, messages, streamCb)
  } else {
    return callOpenAI(config, messages, streamCb)
  }
}

export async function testConnection() {
  try {
    const result = await callAI('You are a helpful assistant.', 'Say "OK" only.')
    return { ok: true, message: result.trim() }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export async function analyzeJd(jdText) {
  const system = `You are an expert HR analyst. Extract key requirements from the job description.
Return ONLY valid JSON, no other text:
{
  "requirements": [
    { "keyword": "React", "importance": "required", "frequency": 3 },
    { "keyword": "TypeScript", "importance": "preferred", "frequency": 1 }
  ]
}
importance must be one of: "required", "preferred", "nice-to-have"`

  const result = await callAI(system, `Job Description:\n${jdText}`)
  return extractJson(result)
}

export async function scoreMaterials(materials, requirements) {
  const system = `You are a resume expert. Score how well each resume material matches the job requirements.
Return ONLY valid JSON:
{
  "scores": {
    "MATERIAL_ID": { "score": 0.85, "matchedKeywords": ["React", "TypeScript"] }
  }
}
Score range: 0.0 to 1.0. Only include keywords that genuinely appear in the material.`

  const materialsText = materials.map(m => {
    const d = m.cn || m.en || {}
    const text = [
      d.company || d.name || d.institution || d.label || '',
      d.role || d.degree || d.title || '',
      (d.bullets || []).join(' '),
      d.summary || d.notes || '',
      (d.techStack || []).join(' '),
      (d.items || []).join(' ')
    ].filter(Boolean).join(' | ')
    return `ID: ${m.id}\nContent: ${text}`
  }).join('\n\n')

  const requirementsText = requirements
    .map(r => `${r.keyword} (${r.importance})`)
    .join(', ')

  const result = await callAI(system,
    `Requirements: ${requirementsText}\n\nMaterials:\n${materialsText}`)
  return extractJson(result)
}

export async function generateContent({ section, materialsText, jdText, tone, language }, onChunk) {
  const langName = language === 'cn' ? '中文' : 'English'
  const system = `You are a professional resume writer. Write polished resume content in ${langName}.
Tone: ${tone || 'professional and concise'}.
Use strong action verbs. For bullet points use format: action verb + result + quantified impact.`

  const parts = [
    `Target section: ${section}`,
    jdText ? `Job Description:\n${jdText}` : '',
    `Available materials:\n${materialsText}`
  ].filter(Boolean).join('\n\n')

  return callAI(system, parts, { onChunk })
}

/**
 * Generate optimized content for every material in the library based on JD + all materials.
 * Returns { updates: [{ materialId, cn: { bullets?, summary?, role? }, en: { ... } }] }
 */
export async function generateFullResume(materials, jdText, language, tone) {
  const langName = language === 'cn' ? '中文' : 'English'
  const otherLang = language === 'cn' ? 'English' : '中文'

  const system = `You are an elite resume writer. Given a candidate's raw resume materials and a job description, \
rewrite the content to be polished, ATS-optimized, and perfectly targeted to the role.

Rules:
- Use strong action verbs + quantified impact for every bullet
- Keep bullets concise (≤ 20 words each), max 4 bullets per entry
- For personal: write a punchy 2-sentence summary targeting the role
- Tone: ${tone || 'professional'}
- Primary output language: ${langName}. Also provide ${otherLang} translation for every field.

Return ONLY valid JSON (no markdown fences):
{
  "updates": [
    {
      "materialId": "<exact id>",
      "cn": { "bullets": ["...", "..."], "summary": "...", "role": "..." },
      "en": { "bullets": ["...", "..."], "summary": "...", "role": "..." }
    }
  ]
}
Only include fields relevant to the material's category:
- work/project: include "bullets" (required) and optionally "role"
- personal: include "summary" only
- education/skill: omit (no changes needed)
Return updates ONLY for work, project, and personal categories.`

  const matLines = materials
    .filter(m => ['work', 'project', 'personal'].includes(m.category))
    .map(m => {
      const d = m.cn || m.en || {}
      const fields = []
      if (d.company) fields.push(`company: ${d.company}`)
      if (d.name) fields.push(`name: ${d.name}`)
      if (d.role) fields.push(`role: ${d.role}`)
      if (d.title) fields.push(`title: ${d.title}`)
      if (d.bullets?.length) fields.push(`existing bullets: ${d.bullets.join(' | ')}`)
      if (d.summary) fields.push(`existing summary: ${d.summary}`)
      if (d.techStack?.length) fields.push(`tech: ${d.techStack.join(', ')}`)
      return `ID: ${m.id} [${m.category}]\n${fields.join('\n')}`
    }).join('\n\n---\n\n')

  const userMsg = [
    jdText ? `JOB DESCRIPTION:\n${jdText.slice(0, 3000)}` : '(No JD provided — write general high-impact content)',
    `MATERIALS:\n${matLines}`
  ].join('\n\n')

  const result = await callAI(system, userMsg)
  return extractJson(result)
}


export async function parseImportedResume(text) {
  const system = `You are a resume parser. Extract all resume information into structured JSON.
Return ONLY a JSON array of material objects:
[
  {
    "category": "personal",
    "cn": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "summary": "" },
    "en": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "summary": "" }
  },
  {
    "category": "education",
    "cn": { "institution": "", "degree": "", "major": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "gpa": "", "notes": "" },
    "en": { "institution": "", "degree": "", "major": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "gpa": "", "notes": "" }
  },
  {
    "category": "work",
    "cn": { "company": "", "role": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": false, "location": "", "bullets": [] },
    "en": { "company": "", "role": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": false, "location": "", "bullets": [] }
  },
  {
    "category": "project",
    "cn": { "name": "", "role": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "techStack": [], "url": "", "bullets": [] },
    "en": { "name": "", "role": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "techStack": [], "url": "", "bullets": [] }
  },
  {
    "category": "skill",
    "cn": { "label": "", "type": "skill", "items": [] },
    "en": { "label": "", "type": "skill", "items": [] }
  }
]
If resume is Chinese: fill cn fields first, translate to en. If English: fill en first, translate to cn.
Dates format: YYYY-MM. Return multiple objects for multiple entries of the same category.`

  const result = await callAI(system, `Parse this resume:\n\n${text}`)
  return extractJson(result)
}
