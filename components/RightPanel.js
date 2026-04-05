import { computed } from 'vue'
import { store } from '../store/state.js'
import ResumeSection from './ResumeSection.js'
import PreviewPane from './PreviewPane.js'

export default {
  name: 'RightPanel',
  components: { ResumeSection, PreviewPane },
  setup() {
    const lang = computed(() => store.resume.meta.language)
    const mode = computed({
      get: () => store.ui.rightMode,
      set: v => { store.ui.rightMode = v }
    })

    const sortedSections = computed(() =>
      [...store.resume.sections].sort((a, b) => (a.order || 0) - (b.order || 0))
    )

    function openAiFullResume() { store.ui.activeModal = 'aiFullResume' }

    return { lang, mode, sortedSections, openAiFullResume, store }
  },
  template: `
    <div class="flex flex-col h-full overflow-hidden">

      <!-- Toolbar (from ZIP design) -->
      <header class="flex items-center justify-between flex-shrink-0 px-8"
        style="height:5rem; border-bottom:1px solid #f3f4f6;">

        <!-- Left: mode toggle -->
        <div class="flex items-center gap-3">
          <div class="flex p-1 rounded-full" style="background:#f3f4f6;">
            <button @click="mode = 'preview'"
              class="px-4 py-1.5 text-sm font-medium rounded-full transition-all"
              :style="mode === 'preview'
                ? 'background:white; color:#111827; box-shadow:0 1px 4px rgba(0,0,0,0.1);'
                : 'color:#6b7280;'">预览</button>
            <button @click="mode = 'edit'"
              class="px-4 py-1.5 text-sm font-medium rounded-full transition-all"
              :style="mode === 'edit'
                ? 'background:white; color:#111827; box-shadow:0 1px 4px rgba(0,0,0,0.1);'
                : 'color:#6b7280;'">编辑</button>
          </div>
        </div>

        <!-- Right: lang + AI + export (shown in preview mode, handled in PreviewPane) -->
        <div class="flex items-center gap-2">
          <!-- Language -->
          <button
            @click="store.resume.meta.language = lang === 'cn' ? 'en' : 'cn'"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full"
            style="border:1.5px solid #e5e7eb; color:#374151; background:white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            {{ lang === 'cn' ? '中文' : 'EN' }}
          </button>

          <!-- AI Full Resume -->
          <button @click="openAiFullResume"
            class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full"
            style="background:rgba(17,24,39,0.05); color:#374151; border:1.5px solid #e5e7eb;"
            title="基于 JD 和素材库一键生成完整简历">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>
            AI 生成
          </button>
        </div>
      </header>

      <!-- Edit mode -->
      <div v-if="mode === 'edit'" class="flex-1 overflow-y-auto p-6" style="background:#f9fafb;">
        <div v-if="!store.materials.length" class="py-20 text-center">
          <div class="text-5xl mb-4">📝</div>
          <div class="text-base font-semibold mb-2" style="color:#374151;">从素材库开始</div>
          <div class="text-sm" style="color:#9ca3af;">在左侧添加素材，然后拖拽到此处</div>
        </div>
        <ResumeSection
          v-for="section in sortedSections"
          :key="section.id"
          :section="section" />
      </div>

      <!-- Preview mode -->
      <PreviewPane v-else class="flex-1 overflow-hidden" />

    </div>
  `
}
