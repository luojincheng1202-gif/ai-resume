import { ref, computed } from 'vue'
import { store, addMaterialToSection } from '../store/state.js'
import ResumeItem from './ResumeItem.js'

const LABELS = {
  cn: { personal: '个人信息', education: '教育经历', work: '工作经历', project: '项目经历', skill: '技能与证书' },
  en: { personal: 'Personal', education: 'Education', work: 'Work Experience', project: 'Projects', skill: 'Skills & Certs' }
}

const CAT_ICONS = { personal: '👤', education: '🎓', work: '💼', project: '🔧', skill: '⚡' }

export default {
  name: 'ResumeSection',
  components: { ResumeItem },
  props: { section: { type: Object, required: true } },
  setup(props) {
    const isDragOver = ref(false)
    const lang = computed(() => store.resume.meta.language)
    const label = computed(() => LABELS[lang.value]?.[props.section.category] || props.section.category)

    function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; isDragOver.value = true }
    function onDragLeave() { isDragOver.value = false }
    function onDrop(e) {
      e.preventDefault(); isDragOver.value = false
      try {
        const payload = JSON.parse(e.dataTransfer.getData('text/plain'))
        addMaterialToSection(props.section.category, payload.materialId)
      } catch { /* ignore */ }
    }

    function openAddMaterial() {
      store.appSettings.activeCategory = props.section.category
      store.ui.editingMaterial = { category: props.section.category, mode: 'add' }
      store.ui.activeModal = 'materialEditor'
    }

    function openAiWrite() {
      store.ui.aiWriteTarget = { sectionCategory: props.section.category }
      store.ui.activeModal = 'aiWrite'
    }

    function moveItemUp(idx) {
      if (idx === 0) return
      const items = props.section.items
      const tmp = items[idx - 1]; items[idx - 1] = items[idx]; items[idx] = tmp
    }

    function moveItemDown(idx) {
      const items = props.section.items
      if (idx >= items.length - 1) return
      const tmp = items[idx + 1]; items[idx + 1] = items[idx]; items[idx] = tmp
    }

    return { isDragOver, lang, label, onDragOver, onDragLeave, onDrop, openAddMaterial, openAiWrite, moveItemUp, moveItemDown, store, CAT_ICONS }
  },
  template: `
    <div class="mb-4">
      <!-- Section header -->
      <div class="flex items-center justify-between px-4 py-3 mb-2 rounded-2xl"
        style="background:white; border:1.5px solid #f3f4f6; box-shadow:0 1px 6px rgba(0,0,0,0.04);">
        <div class="flex items-center gap-2.5">
          <span class="text-base">{{ CAT_ICONS[section.category] }}</span>
          <span class="font-semibold text-sm" style="color:#111827;">{{ label }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-semibold" style="background:#f3f4f6; color:#6b7280;">
            {{ section.items.length }}
          </span>
        </div>
        <div class="flex gap-1.5">
          <button @click="openAiWrite"
            class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold"
            style="border:1px solid #e5e7eb; color:#6b7280; background:white;">
            ✨ AI写作
          </button>
          <button @click="openAddMaterial"
            class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold"
            style="background:#f3f4f6; color:#374151;">
            ＋ 添加
          </button>
        </div>
      </div>

      <!-- Drop zone + items -->
      <div class="min-h-12 border-2 border-dashed rounded-2xl p-2 space-y-2 transition-all"
        :class="isDragOver ? 'drop-zone-active' : (section.items.length ? 'border-transparent' : '')"
        :style="!isDragOver && !section.items.length ? 'border-color:#e5e7eb;' : ''"
        @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">

        <div v-if="!section.items.length && !isDragOver" class="py-5 text-center text-xs" style="color:#9ca3af;">
          从左侧拖拽素材到此处，或点击 ＋ 添加
        </div>

        <div v-if="isDragOver && !section.items.length" class="py-5 text-center text-xs font-semibold" style="color:#854d0e;">
          松开以添加素材
        </div>

        <div v-for="(item, idx) in section.items" :key="item.id" class="flex gap-1.5">
          <div class="flex flex-col justify-center gap-0.5">
            <button @click="moveItemUp(idx)" :disabled="idx === 0"
              class="w-5 h-5 flex items-center justify-center rounded text-xs disabled:opacity-20"
              style="color:#9ca3af;">▲</button>
            <button @click="moveItemDown(idx)" :disabled="idx === section.items.length - 1"
              class="w-5 h-5 flex items-center justify-center rounded text-xs disabled:opacity-20"
              style="color:#9ca3af;">▼</button>
          </div>
          <div class="flex-1 min-w-0">
            <ResumeItem :item="item" :sectionId="section.id" :category="section.category" />
          </div>
        </div>

        <div v-if="isDragOver && section.items.length"
          class="py-3 text-center text-xs font-semibold rounded-xl"
          style="border:2px dashed #e8c840; color:#854d0e; background:#fef9c3;">
          松开以添加素材
        </div>
      </div>
    </div>
  `
}
