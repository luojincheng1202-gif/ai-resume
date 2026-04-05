import { computed, ref } from 'vue'
import { store } from '../store/state.js'
import MaterialItem from './MaterialItem.js'
import TemplateManager from './TemplateManager.js'

const CATEGORIES = [
  { key: 'work',      label: '全部工作' },
  { key: 'project',   label: '全部项目' },
  { key: 'education', label: '全部教育' },
  { key: 'skill',     label: '全部技能' },
  { key: 'personal',  label: '全部个人' },
]

const CAT_LABELS = {
  work: '工作经历', project: '项目经历', education: '教育经历',
  skill: '技能证书', personal: '个人信息'
}

const FILTER_CHIPS = [
  { key: 'work',      label: '工作' },
  { key: 'project',   label: '项目' },
  { key: 'education', label: '教育' },
  { key: 'skill',     label: '技能' },
  { key: 'personal',  label: '个人' },
]

export default {
  name: 'LeftPanel',
  components: { MaterialItem, TemplateManager },
  setup() {
    const searchText = ref('')

    const activeCategory = computed({
      get: () => store.appSettings.activeCategory,
      set: v => { store.appSettings.activeCategory = v }
    })

    const filtered = computed(() => {
      let mats = store.materials.filter(m => m.category === activeCategory.value)
      if (searchText.value.trim()) {
        const q = searchText.value.toLowerCase()
        mats = mats.filter(m => {
          const d = m.cn || m.en || {}
          return Object.values(d).join(' ').toLowerCase().includes(q)
        })
      }
      return [...mats].sort((a, b) => {
        if (a.jdScore != null && b.jdScore != null) return b.jdScore - a.jdScore
        if (a.jdScore != null) return -1
        if (b.jdScore != null) return 1
        return 0
      })
    })

    const activeCatLabel = computed(() => CAT_LABELS[activeCategory.value] || '')

    function openAdd() {
      store.ui.editingMaterial = { category: activeCategory.value, mode: 'add' }
      store.ui.activeModal = 'materialEditor'
    }

    function openImport() {
      store.ui.activeModal = 'import'
    }

    return {
      activeCategory, filtered, searchText, activeCatLabel,
      openAdd, openImport, FILTER_CHIPS, store
    }
  },
  template: `
    <div class="flex flex-col overflow-hidden"
      style="background:white; border-radius:2rem; border:1px solid rgba(229,231,235,0.6); box-shadow:0 2px 12px rgba(0,0,0,0.06);">

      <!-- Template manager (fullscreen inside the card) -->
      <TemplateManager v-if="store.ui.leftView === 'templates'" class="flex-1 overflow-hidden" />

      <!-- Material library -->
      <template v-else>

      <!-- Header -->
      <div class="px-5 pt-5 pb-4 flex-shrink-0">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-serif text-2xl tracking-tight" style="color:#111827;">素材库</h2>
          <div class="flex gap-2">
            <button @click="openImport"
              class="w-9 h-9 rounded-full flex items-center justify-center text-xs"
              style="background:#f3f4f6; color:#374151;"
              title="导入素材">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
            <button @click="openAdd"
              class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style="background:#111827; color:white;"
              title="添加素材">＋</button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative mb-4">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2" style="color:#9ca3af;"
            xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input v-model="searchText"
            class="w-full rounded-full text-sm focus:outline-none transition-all"
            style="background:#f9fafb; border:1.5px solid #e5e7eb; padding:0.5rem 1rem 0.5rem 2.5rem; font-family:inherit; color:#111827;"
            :placeholder="'搜索' + activeCatLabel + '…'" />
        </div>

        <!-- Filter chips -->
        <div class="flex gap-2 overflow-x-auto pb-1" style="scrollbar-width:none;">
          <button v-for="chip in FILTER_CHIPS" :key="chip.key"
            @click="activeCategory = chip.key"
            :class="['filter-chip', activeCategory === chip.key ? 'active' : '']">
            {{ chip.label }}
          </button>
        </div>
      </div>

      <!-- Material list -->
      <div class="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <div v-if="filtered.length === 0" class="py-12 text-center">
          <div class="text-4xl mb-3">📋</div>
          <div class="text-sm font-medium mb-1" style="color:#6b7280;">暂无{{ activeCatLabel }}</div>
          <button @click="openAdd"
            class="mt-3 px-5 py-2 rounded-full text-sm font-semibold"
            style="background:#111827; color:white;">＋ 添加素材</button>
        </div>
        <MaterialItem v-for="mat in filtered" :key="mat.id" :material="mat" />
      </div>

      </template>
    </div>
  `
}
