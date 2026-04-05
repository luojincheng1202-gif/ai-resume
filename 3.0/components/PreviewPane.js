import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { store, getResolvedData } from '../store/state.js'
import { getTemplateRenderer, BUILTIN_TEMPLATES } from '../templates/registry.js'
import { printResume, exportWord } from '../services/exportService.js'

export default {
  name: 'PreviewPane',
  setup() {
    const iframeRef = ref(null)
    const lang = computed(() => store.resume.meta.language)
    const showTemplatePicker = ref(false)
    const exporting = ref(false)
    const wordExporting = ref(false)

    const allTemplates = computed(() => BUILTIN_TEMPLATES)

    const activeTemplateName = computed(() => {
      const id = store.resume.meta.template
      return BUILTIN_TEMPLATES.find(t => t.id === id)?.name || '经典'
    })

    function buildRawHtml() {
      const fn = getTemplateRenderer(store.resume.meta.template)
      return fn(store.resume, lang.value, (item, l) => getResolvedData(item, l))
    }

    function buildHtml() {
      // Inject screen-mode body padding so content has visible margins in both
      // preview and PDF export (html2canvas captures screen rendering, not @page).
      const inject = `<style>@media screen{body{padding:16mm 20mm!important;box-sizing:border-box!important;}}</style>`
      return buildRawHtml().replace('</head>', inject + '\n</head>')
    }

    function updateIframe() {
      if (!iframeRef.value) return
      iframeRef.value.srcdoc = buildHtml()
    }

    watch(
      () => JSON.stringify(store.resume),
      () => nextTick(updateIframe),
      { immediate: true }
    )

    onMounted(() => nextTick(updateIframe))

    async function doPrint() {
      if (exporting.value) return
      exporting.value = true
      try { await printResume(iframeRef.value) }
      finally { exporting.value = false }
    }

    async function doWordExport() {
      if (wordExporting.value) return
      wordExporting.value = true
      try { await exportWord(buildRawHtml()) }
      catch (e) { console.error('Word export failed:', e) }
      finally { wordExporting.value = false }
    }

    return {
      iframeRef, doPrint, exporting, doWordExport, wordExporting,
      showTemplatePicker, allTemplates, activeTemplateName, store
    }
  },
  template: `
    <div class="flex flex-col h-full">

      <!-- Preview sub-toolbar (inside PreviewPane, below main toolbar) -->
      <div class="flex items-center justify-between px-8 py-3 flex-shrink-0"
        style="border-bottom:1px solid #f3f4f6;">

        <div class="flex items-center gap-2">
          <span class="text-sm font-medium" style="color:#374151;">简历预览</span>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium"
            style="background:#f3f4f6; color:#6b7280;">A4</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Template picker -->
          <div class="relative">
            <button @click="showTemplatePicker = !showTemplatePicker"
              class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full"
              style="background:#f3f4f6; color:#374151; border:1.5px solid #e5e7eb;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              {{ activeTemplateName }}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <div v-if="showTemplatePicker" class="fixed inset-0 z-20" @click="showTemplatePicker = false"></div>

            <div v-if="showTemplatePicker"
              class="absolute top-full mt-2 right-0 rounded-2xl z-30 overflow-hidden"
              style="background:white; border:1.5px solid #f3f4f6; box-shadow:0 8px 24px rgba(0,0,0,0.12); min-width:150px;">
              <button v-for="tpl in allTemplates" :key="tpl.id"
                @click="store.resume.meta.template = tpl.id; showTemplatePicker = false"
                class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left"
                :style="store.resume.meta.template === tpl.id ? 'background:#f9fafb; font-weight:600;' : ''">
                <span v-if="store.resume.meta.template === tpl.id" class="text-xs font-bold" style="color:#e8c840;">✓</span>
                <span v-else style="width:14px; display:inline-block;"></span>
                {{ tpl.name }}
              </button>
            </div>
          </div>

          <!-- Export Word -->
          <button @click="doWordExport" :disabled="wordExporting"
            class="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full disabled:opacity-60"
            style="background:#1d6b38; color:white;">
            <svg v-if="!wordExporting" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
            <span v-if="wordExporting" class="animate-spin">⟳</span>
            {{ wordExporting ? '生成中…' : 'Word' }}
          </button>

          <!-- Export PDF -->
          <button @click="doPrint" :disabled="exporting"
            class="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full disabled:opacity-60"
            style="background:#111827; color:white;">
            <svg v-if="!exporting" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span v-if="exporting" class="animate-spin">⟳</span>
            {{ exporting ? '生成中…' : 'PDF' }}
          </button>
        </div>
      </div>

      <!-- A4 canvas -->
      <div class="flex-1 overflow-auto flex justify-center"
        style="background:#f8f7f5; padding:40px 48px;">
        <div style="width:210mm; min-height:297mm; box-shadow:0 8px 40px rgba(0,0,0,0.12); border-radius:2px; overflow:hidden; background:white;">
          <iframe
            ref="iframeRef"
            class="border-0 block"
            style="width:210mm; min-height:297mm;"
            sandbox="allow-same-origin allow-popups allow-modals">
          </iframe>
        </div>
      </div>
    </div>
  `
}
