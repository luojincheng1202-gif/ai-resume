import { ref, computed, watch } from 'vue'
import { store, showToast, updateItemOverride } from '../store/state.js'
import { generateContent } from '../services/aiService.js'

const CATEGORY_NAMES = {
  cn: { personal: '个人简介', education: '教育经历', work: '工作经历', project: '项目经历', skill: '技能' },
  en: { personal: 'Personal Summary', education: 'Education', work: 'Work Experience', project: 'Projects', skill: 'Skills' }
}

export default {
  name: 'AiWriteDialog',
  setup() {
    const generating = ref(false)
    const streamingText = ref('')
    const accepted = ref(false)
    const tone = ref('professional')
    const targetLang = ref('cn')

    const target = computed(() => store.ui.aiWriteTarget)
    const isOpen = computed(() => store.ui.activeModal === 'aiWrite')

    watch(isOpen, (v) => {
      if (v) {
        streamingText.value = ''
        accepted.value = false
        targetLang.value = store.resume.meta.language
      }
    })

    function close() {
      store.ui.activeModal = null
      store.ui.aiWriteTarget = null
      generating.value = false
    }

    const relevantMaterials = computed(() => {
      if (!target.value) return []
      return store.materials.filter(m => m.category === target.value.sectionCategory)
    })

    const materialsText = computed(() => {
      return relevantMaterials.value.map(m => {
        const d = m[targetLang.value] || m.cn || m.en || {}
        const parts = []
        if (d.company || d.name || d.institution) parts.push(d.company || d.name || d.institution)
        if (d.role || d.degree) parts.push(d.role || d.degree)
        if (d.bullets?.length) parts.push(d.bullets.join('; '))
        if (d.summary) parts.push(d.summary)
        if (d.items?.length) parts.push(d.items.join(', '))
        return parts.filter(Boolean).join(' | ')
      }).join('\n---\n')
    })

    async function doGenerate() {
      if (!store.aiSettings.apiKey) {
        showToast('请先在设置中填写 API Key', 'warning')
        return
      }
      if (!relevantMaterials.value.length) {
        showToast('素材库中没有对应分类的素材', 'warning')
        return
      }
      generating.value = true
      streamingText.value = ''
      accepted.value = false
      try {
        const catName = CATEGORY_NAMES[targetLang.value]?.[target.value?.sectionCategory] || target.value?.sectionCategory
        await generateContent(
          {
            section: catName,
            materialsText: materialsText.value,
            jdText: store.jdContext.rawText || '',
            tone: tone.value,
            language: targetLang.value
          },
          (chunk) => { streamingText.value += chunk }
        )
      } catch (e) {
        showToast(`生成失败: ${e.message}`, 'error')
        streamingText.value = ''
      } finally {
        generating.value = false
      }
    }

    function applyToResume() {
      if (!streamingText.value || !target.value) return
      const section = store.resume.sections.find(s => s.category === target.value.sectionCategory)
      if (!section) return
      const lines = streamingText.value
        .split('\n')
        .map(l => l.replace(/^[•·\-*]\s*/, '').trim())
        .filter(l => l.length > 10)
      if (section.items.length > 0) {
        const item = section.items[0]
        updateItemOverride(section.id, item.id, targetLang.value, 'bullets', lines)
        showToast('已应用到简历', 'success')
      } else {
        showToast('简历该分区尚无条目，请先从素材库添加一条后再应用', 'info')
      }
      accepted.value = true
    }

    const tones = [
      { value: 'professional', label: '专业正式' },
      { value: 'concise', label: '简洁精炼' },
      { value: 'achievement-focused', label: '成就导向' },
      { value: 'narrative', label: '叙事风格' }
    ]

    return {
      generating, streamingText, accepted, tone, targetLang,
      target, isOpen, relevantMaterials, tones,
      close, doGenerate, applyToResume, CATEGORY_NAMES, store
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
        <div class="flex items-center justify-between px-7 py-5" style="border-bottom:1px solid #f0ece6;">
          <div>
            <h2 class="text-lg font-bold flex items-center gap-2" style="color:#1c1c1c;">
              <span>✨</span> AI 生成简历内容
            </h2>
            <p v-if="target" class="text-xs mt-0.5" style="color:#8b8580;">
              {{ CATEGORY_NAMES[targetLang]?.[target.sectionCategory] || target.sectionCategory }}
            </p>
          </div>
          <button @click="close"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f2ed] transition-colors"
            style="color:#8b8580; font-size:16px;">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto px-7 py-5 space-y-5">

          <!-- Config -->
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

          <!-- Materials preview -->
          <div>
            <div class="text-xs font-semibold mb-2" style="color:#6b6560; text-transform:uppercase; letter-spacing:0.05em;">
              将使用的素材 · {{ relevantMaterials.length }} 条
            </div>
            <div v-if="relevantMaterials.length === 0"
              class="p-4 rounded-2xl text-xs" style="background:#fdefd2; color:#8a5a10;">
              素材库中暂无对应分类的素材，请先在左侧添加素材
            </div>
            <div v-else class="space-y-1">
              <div v-for="mat in relevantMaterials.slice(0, 4)" :key="mat.id"
                class="text-xs px-3 py-2 rounded-xl truncate"
                style="background:#f5f2ed; color:#6b6560;">
                {{ (mat[targetLang] || mat.cn || mat.en || {}).company || (mat[targetLang] || mat.cn || mat.en || {}).name || mat.id }}
              </div>
              <div v-if="relevantMaterials.length > 4" class="text-xs" style="color:#b0aaa4;">…还有 {{ relevantMaterials.length - 4 }} 条</div>
            </div>
          </div>

          <!-- JD hint -->
          <div v-if="store.jdContext.extractedRequirements.length"
            class="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs"
            style="background:#d4f0e0; color:#1a6640;">
            <span>✓</span>
            已加载 JD 需求 ({{ store.jdContext.extractedRequirements.length }} 项)，AI 将针对性优化
          </div>

          <!-- Generate btn -->
          <button @click="doGenerate"
            :disabled="generating || !relevantMaterials.length"
            class="w-full py-3 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            style="background:#1c1c1c; color:#e8c840;">
            <span v-if="generating" class="animate-spin text-lg">⟳</span>
            <span>{{ generating ? 'AI 生成中，请稍候…' : '🚀 开始 AI 写作' }}</span>
          </button>

          <!-- Stream output -->
          <div v-if="streamingText || generating">
            <div class="flex items-center gap-2 mb-2 text-xs font-semibold"
              style="color:#6b6560; text-transform:uppercase; letter-spacing:0.05em;">
              <span>AI 输出</span>
              <span v-if="generating" class="text-xs font-normal normal-case" style="color:#b0aaa4; letter-spacing:0;">生成中…</span>
            </div>
            <div class="rounded-2xl p-4 text-sm streaming-text min-h-24 max-h-64 overflow-y-auto"
              style="background:#f5f2ed; color:#1c1c1c; border:1.5px solid #e8e4dd;">
              {{ streamingText }}<span v-if="generating"
                class="inline-block w-0.5 h-4 ml-0.5 align-text-bottom animate-pulse"
                style="background:#e8c840;"></span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 px-7 py-5"
          style="border-top:1px solid #f0ece6; background:#faf8f5;">
          <button @click="close" class="btn-ghost px-5 py-2.5 text-sm">✕ 关闭</button>
          <button v-if="streamingText && !generating"
            @click="applyToResume"
            :disabled="accepted"
            class="btn-accent px-6 py-2.5 text-sm disabled:opacity-50">
            {{ accepted ? '✓ 已应用到简历' : '✓ 应用到简历' }}
          </button>
        </div>
      </div>
    </div>
    </Transition>
  `
}
