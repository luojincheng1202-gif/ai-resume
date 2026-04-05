import { computed } from 'vue'
import { store, getResolvedData } from '../store/state.js'
import { BUILTIN_TEMPLATES, getTemplateRenderer } from '../templates/registry.js'

export default {
  name: 'TemplateManager',
  setup() {
    const activeId = computed(() => store.resume.meta.template || 'classic')

    function buildThumbnailHtml(id) {
      try {
        const fn = getTemplateRenderer(id)
        return fn(store.resume, store.resume.meta.language, (item, l) => getResolvedData(item, l))
      } catch {
        return '<html><body style="background:white;"></body></html>'
      }
    }

    function activate(id) { store.resume.meta.template = id }

    return { activeId, builtins: BUILTIN_TEMPLATES, buildThumbnailHtml, activate }
  },
  template: `
    <div class="flex flex-col h-full overflow-hidden" style="background:white;">

      <!-- Header -->
      <div class="px-4 py-3.5 flex-shrink-0" style="border-bottom:1px solid #f3f4f6;">
        <div class="font-bold text-sm" style="color:#111827;">模板库</div>
        <div class="text-xs mt-0.5" style="color:#9ca3af;">选择简历样式，点击预览区即时切换</div>
      </div>

      <!-- Template grid -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="grid grid-cols-3 gap-3">
          <div v-for="tpl in builtins" :key="tpl.id"
            @click="activate(tpl.id)"
            class="cursor-pointer rounded-2xl overflow-hidden transition-all"
            :style="activeId === tpl.id
              ? 'border:2px solid #e8c840; box-shadow:0 4px 16px rgba(232,200,64,0.2);'
              : 'border:2px solid #f3f4f6; box-shadow:0 1px 4px rgba(0,0,0,0.04);'"
            @mouseenter="$el.style.boxShadow = activeId === tpl.id ? '0 4px 16px rgba(232,200,64,0.2)' : '0 4px 12px rgba(0,0,0,0.10)'"
            @mouseleave="$el.style.boxShadow = activeId === tpl.id ? '0 4px 16px rgba(232,200,64,0.2)' : '0 1px 4px rgba(0,0,0,0.04)'">

            <!-- Thumbnail -->
            <div style="width:100%; height:90px; overflow:hidden; background:#f9fafb;">
              <iframe :srcdoc="buildThumbnailHtml(tpl.id)" sandbox="allow-same-origin" scrolling="no"
                style="width:420px; height:280px; border:none; transform:scale(0.32); transform-origin:top left; pointer-events:none; display:block;">
              </iframe>
            </div>

            <!-- Label -->
            <div class="px-2 py-1.5 flex items-center justify-between"
              :style="activeId === tpl.id ? 'background:#fffdf0;' : 'background:white;'">
              <span class="text-xs font-semibold"
                :style="activeId === tpl.id ? 'color:#111827;' : 'color:#374151;'">{{ tpl.name }}</span>
              <span v-if="activeId === tpl.id"
                class="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style="background:#e8c840; color:#1c1c1c; font-size:9px;">✓</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
}
