import { ref, computed, watch } from 'vue'
import { store, showToast, genId, addMaterialToSection, updateItemOverride } from '../store/state.js'
import { generateFullResume } from '../services/aiService.js'

const CATEGORY_LABELS = {
  cn: { work: '工作经历', project: '项目经历', personal: '个人信息', education: '教育经历', skill: '技能' },
  en: { work: 'Work', project: 'Projects', personal: 'Personal', education: 'Education', skill: 'Skills' }
}

export default {
  name: 'AiFullResumeDialog',
  setup() {
    const generating = ref(false)
    const updates = ref([])   // [{ materialId, cn, en }]
    const accepted = ref(false)
    const tone = ref('professional')
    const targetLang = ref('cn')
    const errorMsg = ref('')

    const isOpen = computed(() => store.ui.activeModal === 'aiFullResume')

    watch(isOpen, (v) => {
      if (v) {
        updates.value = []
        accepted.value = false
        errorMsg.value = ''
        targetLang.value = store.resume.meta.language
      }
    })

    function close() {
      store.ui.activeModal = null
      generating.value = false
    }

    const materialStats = computed(() => {
      const cats = ['work', 'project', 'personal', 'education', 'skill']
      return cats.map(c => ({
        key: c,
        label: CATEGORY_LABELS.cn[c],
        count: store.materials.filter(m => m.category === c).length
      })).filter(s => s.count > 0)
    })

    const hasJd = computed(() => store.jdContext.rawText.trim().length > 0)
    const totalMaterials = computed(() => store.materials.length)

    async function doGenerate() {
      if (!store.aiSettings.apiKey) {
        showToast('请先在设置中填写 API Key', 'warning')
        return
      }
      if (!totalMaterials.value) {
        showToast('素材库为空，请先添加素材', 'warning')
        return
      }
      generating.value = true
      updates.value = []
      accepted.value = false
      errorMsg.value = ''

      try {
        const result = await generateFullResume(
          store.materials,
          store.jdContext.rawText,
          targetLang.value,
          tone.value
        )
        updates.value = result.updates || []
        if (!updates.value.length) {
          errorMsg.value = 'AI 未返回任何内容，请重试'
        }
      } catch (e) {
        errorMsg.value = `生成失败: ${e.message}`
      } finally {
        generating.value = false
      }
    }

    // Resolve material display name from update entry
    function getUpdateTitle(upd) {
      const mat = store.materials.find(m => m.id === upd.materialId)
      if (!mat) return upd.materialId
      const d = mat.cn || mat.en || {}
      return d.company || d.name || d.title || upd.materialId
    }

    function getUpdateCat(upd) {
      const mat = store.materials.find(m => m.id === upd.materialId)
      return mat?.category || ''
    }

    function getContent(upd) {
      const d = upd[targetLang.value] || upd.cn || upd.en || {}
      return d
    }

    function applyToResume() {
      if (!updates.value.length) return
      let applied = 0

      for (const upd of updates.value) {
        const mat = store.materials.find(m => m.id === upd.materialId)
        if (!mat) continue

        // Ensure material is in its resume section
        const section = store.resume.sections.find(s => s.category === mat.category)
        if (!section) continue

        let item = section.items.find(i => i.materialId === mat.id)
        if (!item) {
          // Add it
          const newItem = { id: genId('item'), materialId: mat.id, overrides: { cn: {}, en: {} } }
          section.items.push(newItem)
          item = newItem
        }

        // Apply overrides for both languages
        for (const lang of ['cn', 'en']) {
          const fields = upd[lang] || {}
          if (!item.overrides[lang]) item.overrides[lang] = {}
          for (const [k, v] of Object.entries(fields)) {
            item.overrides[lang][k] = v
          }
        }
        applied++
      }

      showToast(`已将 ${applied} 条素材的 AI 内容应用到简历`, 'success')
      accepted.value = true
    }

    const tones = [
      { value: 'professional', label: '专业正式' },
      { value: 'concise', label: '简洁精炼' },
      { value: 'achievement-focused', label: '成就导向' },
    ]

    return {
      generating, updates, accepted, tone, targetLang, errorMsg,
      isOpen, materialStats, hasJd, totalMaterials, tones,
      close, doGenerate, applyToResume,
      getUpdateTitle, getUpdateCat, getContent,
      CATEGORY_LABELS, store
    }
  },
  template: `
    <Transition name="modal">
    <div v-if="isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center modal-backdrop"
      @click.self="close">
      <div class="rounded-3xl shadow-modal w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        style="background:white;">

        <!-- Header -->
        <div class="px-7 py-5" style="border-bottom:1px solid #f0ece6;">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold" style="color:#1c1c1c;">✨ AI 一键生成完整简历</h2>
              <p class="text-xs mt-1" style="color:#8b8580;">
                基于素材库和 JD，AI 为每条经历生成优化后的简历内容
              </p>
            </div>
            <button @click="close"
              class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f2ed] transition-colors flex-shrink-0"
              style="color:#8b8580; font-size:16px;">✕</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-7 py-5 space-y-5">

          <!-- Status cards row -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Materials status -->
            <div class="rounded-2xl p-4" style="background:#f5f2ed;">
              <div class="text-xs font-bold mb-2" style="color:#6b6560; text-transform:uppercase; letter-spacing:0.05em;">素材库</div>
              <div class="text-2xl font-bold mb-1" style="color:#1c1c1c;">{{ totalMaterials }}</div>
              <div class="text-xs" style="color:#8b8580;">条素材</div>
              <div class="flex flex-wrap gap-1 mt-2">
                <span v-for="s in materialStats" :key="s.key"
                  class="text-xs px-2 py-0.5 rounded-full"
                  style="background:#e8e4dd; color:#6b6560;">
                  {{ s.label }} {{ s.count }}
                </span>
              </div>
            </div>

            <!-- JD status -->
            <div class="rounded-2xl p-4"
              :style="hasJd ? 'background:#d4f0e0;' : 'background:#f5f2ed;'">
              <div class="text-xs font-bold mb-2"
                :style="hasJd ? 'color:#1a6640; text-transform:uppercase; letter-spacing:0.05em;' : 'color:#6b6560; text-transform:uppercase; letter-spacing:0.05em;'">
                JD 匹配
              </div>
              <div class="text-2xl font-bold mb-1" :style="hasJd ? 'color:#1a6640;' : 'color:#b0aaa4;'">
                {{ hasJd ? '✓' : '–' }}
              </div>
              <div class="text-xs" :style="hasJd ? 'color:#1a6640;' : 'color:#8b8580;'">
                {{ hasJd ? '已加载职位描述，AI 将精准匹配' : '未加载 JD（可在左侧 JD 匹配页面导入）' }}
              </div>
              <div v-if="store.jdContext.extractedRequirements.length" class="text-xs mt-1" style="color:#1a6640;">
                {{ store.jdContext.extractedRequirements.length }} 个关键需求
              </div>
            </div>
          </div>

          <!-- Settings -->
          <div class="flex flex-wrap gap-4">
            <div>
              <label class="w-label">输出语言</label>
              <div class="flex gap-1.5 mt-1">
                <button v-for="l in ['cn', 'en']" :key="l"
                  @click="targetLang = l"
                  class="px-4 py-2 text-xs rounded-xl font-semibold transition-all"
                  :style="targetLang === l
                    ? 'background:#1c1c1c; color:#e8c840;'
                    : 'background:#f5f2ed; color:#6b6560;'">
                  {{ l === 'cn' ? '中文' : 'English' }}
                </button>
              </div>
            </div>
            <div>
              <label class="w-label">写作风格</label>
              <select v-model="tone" class="w-input mt-1 text-xs">
                <option v-for="t in tones" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
          </div>

          <!-- Generate button -->
          <button @click="doGenerate"
            :disabled="generating || !totalMaterials"
            class="w-full py-3.5 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style="background:#1c1c1c; color:#e8c840;">
            <span v-if="generating" class="animate-spin text-lg">⟳</span>
            <span>{{ generating ? '⟳ AI 生成中，请稍候…' : '🚀 AI 一键生成完整简历' }}</span>
          </button>

          <!-- Error -->
          <div v-if="errorMsg" class="p-4 rounded-2xl text-sm" style="background:#fde2de; color:#8a1f18;">
            {{ errorMsg }}
          </div>

          <!-- Results -->
          <div v-if="updates.length" class="space-y-3">
            <div class="text-xs font-bold" style="color:#6b6560; text-transform:uppercase; letter-spacing:0.05em;">
              生成结果 · {{ updates.length }} 条
            </div>

            <div v-for="upd in updates" :key="upd.materialId"
              class="rounded-2xl overflow-hidden"
              style="border:1.5px solid #e8e4dd;">

              <!-- Item header -->
              <div class="flex items-center gap-3 px-4 py-3"
                style="background:#f5f2ed; border-bottom:1px solid #e8e4dd;">
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  style="background:#e8e4dd; color:#6b6560;">
                  {{ CATEGORY_LABELS.cn[getUpdateCat(upd)] || getUpdateCat(upd) }}
                </span>
                <span class="text-sm font-semibold" style="color:#1c1c1c;">{{ getUpdateTitle(upd) }}</span>
              </div>

              <!-- Content preview -->
              <div class="px-4 py-3 space-y-1.5">
                <!-- Summary -->
                <div v-if="getContent(upd).summary"
                  class="text-xs leading-relaxed" style="color:#3a3a3a;">
                  {{ getContent(upd).summary }}
                </div>
                <!-- Role -->
                <div v-if="getContent(upd).role"
                  class="text-xs font-medium" style="color:#6b6560;">
                  职位: {{ getContent(upd).role }}
                </div>
                <!-- Bullets -->
                <div v-if="getContent(upd).bullets?.length" class="space-y-1">
                  <div v-for="(b, i) in getContent(upd).bullets" :key="i"
                    class="flex gap-2 text-xs" style="color:#3a3a3a;">
                    <span style="color:#e8c840; flex-shrink:0;">•</span>
                    <span>{{ b }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 px-7 py-5"
          style="border-top:1px solid #f0ece6; background:#faf8f5;">
          <p v-if="updates.length && !accepted" class="text-xs" style="color:#8b8580;">
            应用后将自动把所有素材加入简历对应分区
          </p>
          <p v-if="accepted" class="text-xs font-semibold" style="color:#1a6640;">✓ 已应用到简历</p>
          <div v-if="!updates.length || accepted"></div>
          <div class="flex gap-3 ml-auto">
            <button @click="close" class="btn-ghost px-5 py-2.5 text-sm">✕ 关闭</button>
            <button v-if="updates.length && !accepted"
              @click="applyToResume"
              class="btn-accent px-6 py-2.5 text-sm font-bold">
              ✓ 应用到简历
            </button>
          </div>
        </div>
      </div>
    </div>
    </Transition>
  `
}
