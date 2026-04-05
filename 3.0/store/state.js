import { reactive, watch } from 'vue'
import { save, load } from '../services/storageService.js'

// ── Helpers ────────────────────────────────────────────────────────────────

export function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const defaultResume = () => ({
  meta: { language: 'cn', template: 'classic' },
  sections: [
    { id: 'sec_personal', category: 'personal', visible: true, order: 0, items: [] },
    { id: 'sec_education', category: 'education', visible: true, order: 1, items: [] },
    { id: 'sec_work', category: 'work', visible: true, order: 2, items: [] },
    { id: 'sec_project', category: 'project', visible: true, order: 3, items: [] },
    { id: 'sec_skill', category: 'skill', visible: true, order: 4, items: [] },
  ]
})

// ── Store ──────────────────────────────────────────────────────────────────

export const store = reactive({
  materials: (load('rb_materials') || { materials: [] }).materials,
  resume: load('rb_resume') || defaultResume(),
  aiSettings: load('rb_aiSettings') || {
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: '',
    streamEnabled: true
  },
  jdContext: load('rb_jd') || {
    rawText: '',
    url: '',
    extractedRequirements: []
  },
  appSettings: load('rb_app') || {
    sidebarWidth: 380,
    activeCategory: 'work'
  },

  // Ephemeral UI state — not persisted
  ui: {
    isLoading: false,
    loadingMessage: '',
    activeModal: null,        // 'settings' | 'materialEditor' | 'import' | 'aiWrite'
    editingMaterial: null,    // { id?, category, mode: 'add'|'edit' }
    toast: { show: false, message: '', type: 'info' },
    rightMode: 'edit',        // 'edit' | 'preview'
    jdOpen: false,
    aiWriteTarget: null,      // { sectionCategory }
    leftView: 'library',      // 'library' | 'jd'
  }
})

// ── Persistence ────────────────────────────────────────────────────────────

const timers = {}
function debounce(key, fn, delay = 500) {
  clearTimeout(timers[key])
  timers[key] = setTimeout(fn, delay)
}

watch(() => store.materials,   () => debounce('mat', () => save('rb_materials', { version: 1, materials: store.materials })), { deep: true })
watch(() => store.resume,      () => debounce('res', () => save('rb_resume', store.resume)), { deep: true })
watch(() => store.aiSettings,  () => debounce('ai',  () => save('rb_aiSettings', store.aiSettings)), { deep: true })
watch(() => store.jdContext,   () => debounce('jd',  () => save('rb_jd', store.jdContext)), { deep: true })
watch(() => store.appSettings, () => debounce('app', () => save('rb_app', store.appSettings)), { deep: true })

// ── Actions ────────────────────────────────────────────────────────────────

export function showToast(message, type = 'info', duration = 3000) {
  store.ui.toast = { show: true, message, type }
  setTimeout(() => { store.ui.toast.show = false }, duration)
}

export function getMaterialById(id) {
  return store.materials.find(m => m.id === id)
}

export function getResolvedData(item, lang) {
  const mat = getMaterialById(item.materialId)
  const base = mat ? (mat[lang] || {}) : {}
  const overrides = (item.overrides || {})[lang] || {}
  return Object.assign({}, base, overrides)
}

export function addMaterialToSection(category, materialId) {
  const section = store.resume.sections.find(s => s.category === category)
  if (!section) return
  if (section.items.find(i => i.materialId === materialId)) {
    showToast('该素材已在简历中', 'warning')
    return
  }
  section.items.push({
    id: genId('item'),
    materialId,
    overrides: { cn: {}, en: {} }
  })
  showToast('已添加到简历 ✓', 'success')
}

export function removeItemFromSection(sectionId, itemId) {
  const section = store.resume.sections.find(s => s.id === sectionId)
  if (!section) return
  const idx = section.items.findIndex(i => i.id === itemId)
  if (idx !== -1) section.items.splice(idx, 1)
}

export function updateItemOverride(sectionId, itemId, lang, field, value) {
  const section = store.resume.sections.find(s => s.id === sectionId)
  if (!section) return
  const item = section.items.find(i => i.id === itemId)
  if (!item) return
  if (!item.overrides) item.overrides = { cn: {}, en: {} }
  if (!item.overrides[lang]) item.overrides[lang] = {}
  item.overrides[lang][field] = value
}

export function deleteMaterial(materialId) {
  const idx = store.materials.findIndex(m => m.id === materialId)
  if (idx !== -1) store.materials.splice(idx, 1)
  for (const section of store.resume.sections) {
    const i = section.items.findIndex(item => item.materialId === materialId)
    if (i !== -1) section.items.splice(i, 1)
  }
}

export function saveMaterial(matData) {
  const existing = store.materials.find(m => m.id === matData.id)
  if (existing) {
    Object.assign(existing, matData)
  } else {
    store.materials.push(matData)
  }
}

export function importMaterials(materials) {
  for (const mat of materials) {
    if (!mat.id) mat.id = genId('mat')
    store.materials.push(mat)
  }
  showToast(`已导入 ${materials.length} 条素材`, 'success')
}

