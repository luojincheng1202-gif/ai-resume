import { ref, computed } from 'vue'
import { store, showToast } from '../store/state.js'
import { analyzeJd, scoreMaterials } from '../services/aiService.js'

export default {
  name: 'JdMatcher',
  props: {
    compact: { type: Boolean, default: false }
  },
  setup(props) {
    const analyzing = ref(false)
    const scoring   = ref(false)
    const fetchingUrl = ref(false)
    const urlInput  = ref('')
    const expanded  = ref(false)  // compact mode: toggle textarea open

    const jd = computed(() => store.jdContext)
    const requirements = computed(() => jd.value.extractedRequirements || [])
    const hasRequirements = computed(() => requirements.value.length > 0)

    // Overall match score: average of all scored materials
    const avgScore = computed(() => {
      const scored = store.materials.filter(m => m.jdScore != null)
      if (!scored.length) return null
      return Math.round(scored.reduce((s, m) => s + m.jdScore, 0) / scored.length * 100)
    })

    async function fetchFromUrl() {
      if (!urlInput.value) return
      fetchingUrl.value = true
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlInput.value)}`
        const res = await fetch(proxyUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const html = await res.text()
        const tmp = document.createElement('div')
        tmp.innerHTML = html
        store.jdContext.rawText = tmp.innerText?.slice(0, 8000) || ''
        store.jdContext.url = urlInput.value
        showToast('JD 内容已获取', 'success')
      } catch {
        showToast('获取失败（CORS 限制），请手动粘贴 JD 文本', 'warning')
      } finally {
        fetchingUrl.value = false
      }
    }

    async function doAnalyze() {
      if (!jd.value.rawText.trim()) { showToast('请先输入 JD 内容', 'warning'); return }
      analyzing.value = true
      try {
        const result = await analyzeJd(jd.value.rawText)
        store.jdContext.extractedRequirements = result.requirements || []
        expanded.value = false
        showToast(`已提取 ${store.jdContext.extractedRequirements.length} 个关键需求`, 'success')
      } catch (e) {
        showToast(`分析失败: ${e.message}`, 'error')
      } finally {
        analyzing.value = false
      }
    }

    async function doScore() {
      if (!hasRequirements.value) { showToast('请先分析 JD', 'warning'); return }
      if (!store.materials.length) { showToast('素材库为空', 'warning'); return }
      scoring.value = true
      try {
        const result = await scoreMaterials(store.materials, requirements.value)
        const scores = result.scores || {}
        for (const mat of store.materials) {
          const s = scores[mat.id]
          if (s) { mat.jdScore = s.score; mat.jdHighlightedKeywords = s.matchedKeywords || [] }
          else   { mat.jdScore = 0; mat.jdHighlightedKeywords = [] }
        }
        showToast('已为所有素材评分', 'success')
      } catch (e) {
        showToast(`评分失败: ${e.message}`, 'error')
      } finally {
        scoring.value = false
      }
    }

    function clearJd() {
      store.jdContext.rawText = ''
      store.jdContext.url = ''
      store.jdContext.extractedRequirements = []
      for (const mat of store.materials) { mat.jdScore = null; mat.jdHighlightedKeywords = [] }
    }

    return {
      analyzing, scoring, fetchingUrl, urlInput, expanded,
      jd, requirements, hasRequirements, avgScore,
      fetchFromUrl, doAnalyze, doScore, clearJd, store
    }
  },
  template: `
    <!-- ── Dark glassmorphism JD card ── -->
    <div class="relative overflow-hidden flex-shrink-0"
      style="background:#1A1A1A; border-radius:2rem; color:white; padding:1.5rem;">

      <!-- Blur glow accents -->
      <div class="glow-yellow" style="width:12rem; height:12rem; top:-3rem; right:-3rem;"></div>
      <div class="glow-red"    style="width:8rem;  height:8rem;  bottom:-2rem; right:25%;"></div>

      <!-- Content layer -->
      <div class="relative" style="z-index:1;">

        <!-- COMPACT MODE: has requirements → show results summary -->
        <template v-if="compact && hasRequirements">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-serif text-lg mb-0.5">JD 匹配分析</h3>
              <p class="text-xs uppercase tracking-wider" style="color:#6b7280;">
                {{ jd.url ? new URL(jd.url).hostname : '已粘贴 JD 文本' }}
              </p>
            </div>
            <div v-if="avgScore != null"
              class="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
              style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#facc15;">
              {{ avgScore }}%
            </div>
          </div>

          <!-- Top requirements list (max 4) -->
          <div class="space-y-2 mb-4">
            <div v-for="req in requirements.slice(0, 4)" :key="req.keyword"
              class="flex items-center gap-2 text-sm">
              <svg v-if="req.importance === 'required'"
                xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="#facc15" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
              </svg>
              <span :style="req.importance === 'required' ? 'color:#d1d5db;' : 'color:#6b7280;'">
                {{ req.keyword }}
              </span>
            </div>
            <div v-if="requirements.length > 4" class="text-xs" style="color:#6b7280;">
              +{{ requirements.length - 4 }} 更多需求
            </div>
          </div>

          <!-- Score button + clear -->
          <div class="flex gap-2">
            <button @click="doScore" :disabled="scoring"
              class="flex-1 py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);">
              <svg v-if="!scoring" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>
              <span :class="scoring ? 'animate-spin' : ''" v-if="scoring">⟳</span>
              <span>{{ scoring ? '评分中…' : 'AI 评分素材' }}</span>
            </button>
            <button @click="clearJd"
              class="px-3 py-2.5 rounded-xl text-sm transition-colors"
              style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); color:#9ca3af;"
              title="清除 JD">✕</button>
          </div>
        </template>

        <!-- COMPACT MODE: no requirements → compact input prompt -->
        <template v-else-if="compact && !hasRequirements">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-serif text-base">JD 匹配</h3>
            <button @click="expanded = !expanded"
              class="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); color:#d1d5db;">
              {{ expanded ? '收起' : '粘贴 JD' }}
            </button>
          </div>

          <div v-if="!expanded" class="text-xs" style="color:#6b7280;">
            粘贴职位描述，AI 自动分析匹配度并评分
          </div>

          <div v-else class="space-y-3">
            <textarea v-model="jd.rawText" rows="5"
              class="w-full text-xs resize-none rounded-xl px-3 py-2.5"
              style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:white; outline:none; font-family:inherit;"
              placeholder="粘贴 JD 内容…"></textarea>
            <button @click="doAnalyze" :disabled="analyzing || !jd.rawText.trim()"
              class="w-full py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);">
              <span :class="analyzing ? 'animate-spin' : ''">{{ analyzing ? '⟳' : '✨' }}</span>
              {{ analyzing ? 'AI 分析中…' : 'AI 分析 JD' }}
            </button>
          </div>
        </template>

        <!-- FULL MODE (leftView === 'jd') -->
        <template v-else>
          <div class="flex justify-between items-start mb-5">
            <div>
              <h3 class="font-serif text-xl mb-1">JD 匹配分析</h3>
              <p class="text-xs uppercase tracking-wider" style="color:#6b7280;">粘贴职位描述，AI 智能分析</p>
            </div>
            <div v-if="avgScore != null"
              class="w-12 h-12 rounded-full flex items-center justify-center font-bold"
              style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#facc15;">
              {{ avgScore }}%
            </div>
          </div>

          <!-- URL input -->
          <div class="mb-3">
            <div class="flex gap-2">
              <input v-model="urlInput"
                class="flex-1 text-xs rounded-xl px-3 py-2"
                style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:white; outline:none; font-family:inherit;"
                placeholder="职位链接（可选）" />
              <button @click="fetchFromUrl" :disabled="fetchingUrl || !urlInput"
                class="px-3 py-2 text-xs rounded-xl whitespace-nowrap disabled:opacity-50 transition-colors"
                style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); color:#d1d5db;">
                {{ fetchingUrl ? '⟳' : '获取' }}
              </button>
            </div>
          </div>

          <!-- JD textarea -->
          <textarea v-model="jd.rawText" rows="7"
            class="w-full text-xs resize-none rounded-xl px-3 py-2.5 mb-3"
            style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:white; outline:none; font-family:inherit;"
            placeholder="粘贴完整的职位描述（JD）内容…"></textarea>

          <div class="flex gap-2 mb-4">
            <button @click="doAnalyze" :disabled="analyzing"
              class="flex-1 py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);">
              <span :class="analyzing ? 'animate-spin' : ''">{{ analyzing ? '⟳' : '🔍' }}</span>
              {{ analyzing ? 'AI 分析中…' : 'AI 分析 JD' }}
            </button>
            <button @click="clearJd"
              class="px-4 py-2.5 rounded-xl text-sm transition-colors"
              style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); color:#9ca3af;">
              清除
            </button>
          </div>

          <!-- Requirements result -->
          <div v-if="hasRequirements" class="rounded-2xl p-4 space-y-3"
            style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12);">
            <p class="text-xs uppercase tracking-wider font-semibold" style="color:#6b7280;">
              关键需求 · {{ requirements.length }} 项
            </p>
            <div class="space-y-2">
              <div v-for="req in requirements" :key="req.keyword"
                class="flex items-center gap-2.5 text-sm">
                <svg v-if="req.importance === 'required'"
                  xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="#facc15" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                <span :style="req.importance === 'required' ? 'color:#d1d5db;' : 'color:#6b7280;'">
                  {{ req.keyword }}
                  <span class="text-xs ml-1" style="color:#4b5563;">
                    {{ req.importance === 'required' ? '(必须)' : req.importance === 'preferred' ? '(优先)' : '' }}
                  </span>
                </span>
              </div>
            </div>
            <button @click="doScore" :disabled="scoring"
              class="w-full py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);">
              <svg v-if="!scoring" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>
              <span :class="scoring ? 'animate-spin' : ''" v-if="scoring">⟳</span>
              {{ scoring ? 'AI 评分中…' : '✨ AI 为所有素材评分' }}
            </button>
          </div>
        </template>

      </div>
    </div>
  `
}
