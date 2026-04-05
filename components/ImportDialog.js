import { ref } from 'vue'
import { store, importMaterials, showToast, genId } from '../store/state.js'
import { extractTextFromFile } from '../services/importService.js'
import { parseImportedResume } from '../services/aiService.js'

const CATEGORY_LABELS = {
  personal: '个人信息', education: '教育经历', work: '工作经历',
  project: '项目经历', skill: '技能/证书'
}

export default {
  name: 'ImportDialog',
  setup() {
    // ── Material import state ──────────────────────────────────────────
    const parsing = ref(false)
    const parsedMaterials = ref([])
    const selectedIds = ref(new Set())
    const step = ref('upload')   // 'upload' | 'preview'
    const errorMsg = ref('')

    function close() {
      store.ui.activeModal = null
      resetState()
    }

    function resetState() {
      parsedMaterials.value = []
      selectedIds.value = new Set()
      step.value = 'upload'
      errorMsg.value = ''
      parsing.value = false
    }

    // ── Material file upload ──────────────────────────────────────────
    async function onFileChange(e) {
      const file = e.target.files?.[0]
      if (!file) return
      parsing.value = true
      errorMsg.value = ''
      try {
        const result = await extractTextFromFile(file)
        if (result.type === 'json') {
          const mats = result.content.map(m => ({ ...m, id: m.id || genId('mat') }))
          parsedMaterials.value = mats
          selectedIds.value = new Set(mats.map(m => m.id))
        } else {
          if (!store.aiSettings.apiKey) {
            errorMsg.value = '解析 PDF/Word 需要 AI API Key，请先在设置中配置'
            parsing.value = false
            return
          }
          const mats = await parseImportedResume(result.content)
          const withIds = mats.map(m => ({ ...m, id: genId('mat') }))
          parsedMaterials.value = withIds
          selectedIds.value = new Set(withIds.map(m => m.id))
        }
        step.value = 'preview'
      } catch (err) {
        errorMsg.value = `解析失败: ${err.message}`
      } finally {
        parsing.value = false
        e.target.value = ''
      }
    }

    function toggleSelect(id) {
      const s = new Set(selectedIds.value)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      selectedIds.value = s
    }

    function selectAll() { selectedIds.value = new Set(parsedMaterials.value.map(m => m.id)) }
    function deselectAll() { selectedIds.value = new Set() }

    function doImport() {
      const toImport = parsedMaterials.value.filter(m => selectedIds.value.has(m.id))
      if (!toImport.length) {
        showToast('请选择要导入的素材', 'warning')
        return
      }
      importMaterials(toImport)
      close()
    }

    function getTitle(mat) {
      const d = mat.cn || mat.en || {}
      return d.name || d.company || d.institution || d.label || d.title || '(未命名)'
    }
    function getSubtitle(mat) {
      const d = mat.cn || mat.en || {}
      return d.role || d.degree || d.major || ''
    }

    return {
      parsing, parsedMaterials, selectedIds, step, errorMsg,
      close, onFileChange, toggleSelect, selectAll, deselectAll,
      doImport, CATEGORY_LABELS, getTitle, getSubtitle, store
    }
  },
  template: `
    <Transition name="modal">
    <div v-if="store.ui.activeModal === 'import'"
      class="fixed inset-0 z-40 flex items-center justify-center modal-backdrop"
      @click.self="close">
      <div class="rounded-3xl shadow-modal w-full max-w-xl mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        style="background:white;">

        <!-- Header -->
        <div class="flex items-center justify-between px-7 py-5" style="border-bottom:1px solid #f0ece6;">
          <div>
            <h2 class="text-lg font-bold" style="color:#1c1c1c;">导入简历</h2>
            <p class="text-xs mt-0.5" style="color:#8b8580;">
              {{ step === 'upload' ? '支持 PDF、Word、纯文本和 JSON 格式' : '确认要导入的素材' }}
            </p>
          </div>
          <button @click="close"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f2ed] transition-colors"
            style="color:#8b8580; font-size:16px;">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto px-7 py-5">

          <!-- Upload step -->
          <template v-if="step === 'upload'">
            <label class="flex flex-col items-center justify-center rounded-2xl p-10 cursor-pointer transition-all"
              style="border:2px dashed #e2ddd5; background:#faf8f5;"
              @mouseenter="$el.style.borderColor='#e8c840'; $el.style.background='#fdf5cc'"
              @mouseleave="$el.style.borderColor='#e2ddd5'; $el.style.background='#faf8f5'">
              <div class="text-4xl mb-3">📄</div>
              <div class="text-sm font-semibold mb-1" style="color:#1c1c1c;">点击选择文件</div>
              <div class="text-xs" style="color:#8b8580;">PDF · DOCX · TXT · JSON</div>
              <input type="file" class="hidden" accept=".pdf,.docx,.txt,.json" @change="onFileChange" :disabled="parsing" />
            </label>
            <div v-if="parsing" class="mt-5 flex items-center gap-3 text-sm" style="color:#8b8580;">
              <span class="animate-spin text-lg">⟳</span> AI 正在解析简历内容，请稍候…
            </div>
            <div v-if="errorMsg" class="mt-4 p-4 rounded-2xl text-sm" style="background:#fde2de; color:#8a1f18;">
              {{ errorMsg }}
            </div>
          </template>

          <!-- Preview step -->
          <template v-else-if="step === 'preview'">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm" style="color:#6b6560;">
                解析到 <strong style="color:#1c1c1c;">{{ parsedMaterials.length }}</strong> 条素材，
                已选 <strong style="color:#e8c840; background:#1c1c1c; padding:1px 6px; border-radius:6px;">{{ selectedIds.size }}</strong> 条
              </div>
              <div class="flex gap-3 text-xs">
                <button @click="selectAll" style="color:#1c1c1c; font-weight:600;">全选</button>
                <span style="color:#d4cfc8;">|</span>
                <button @click="deselectAll" style="color:#8b8580;">取消</button>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="mat in parsedMaterials" :key="mat.id"
                @click="toggleSelect(mat.id)"
                class="flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                :style="selectedIds.has(mat.id)
                  ? 'background:#fdf5cc; border:1.5px solid #e8c840;'
                  : 'background:#faf8f5; border:1.5px solid #e8e4dd;'">
                <div class="mt-0.5 flex-shrink-0">
                  <div class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                    :style="selectedIds.has(mat.id) ? 'background:#1c1c1c; border-color:#1c1c1c;' : 'border-color:#d4cfc8;'">
                    <span v-if="selectedIds.has(mat.id)" style="color:#e8c840; font-size:10px; font-weight:800;">✓</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      style="background:#f0ece6; color:#6b6560;">
                      {{ CATEGORY_LABELS[mat.category] || mat.category }}
                    </span>
                    <span class="text-sm font-semibold truncate" style="color:#1c1c1c;">{{ getTitle(mat) }}</span>
                  </div>
                  <div v-if="getSubtitle(mat)" class="text-xs" style="color:#8b8580;">{{ getSubtitle(mat) }}</div>
                </div>
              </div>
            </div>
          </template>

        </div>

        <!-- Footer -->
        <div class="flex justify-between gap-3 px-7 py-5"
          style="border-top:1px solid #f0ece6; background:#faf8f5;">
          <button v-if="step === 'preview'" @click="step = 'upload'" class="btn-ghost px-5 py-2.5 text-sm">
            ← 重新上传
          </button>
          <div v-else></div>
          <div class="flex gap-3">
            <button @click="close" class="btn-ghost px-5 py-2.5 text-sm">✕ 关闭</button>
            <button v-if="step === 'preview'" @click="doImport"
              :disabled="selectedIds.size === 0"
              class="btn-accent px-6 py-2.5 text-sm disabled:opacity-50">
              ✓ 导入 {{ selectedIds.size }} 条素材
            </button>
          </div>
        </div>
      </div>
    </div>
    </Transition>
  `
}
