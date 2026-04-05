import { computed, ref } from 'vue'
import { store, deleteMaterial, addMaterialToSection } from '../store/state.js'

export default {
  name: 'MaterialItem',
  props: {
    material: { type: Object, required: true }
  },
  setup(props) {
    const lang = computed(() => store.resume.meta.language)
    const expanded = ref(false)

    const data = computed(() =>
      props.material[lang.value] || props.material.cn || props.material.en || {}
    )

    const title = computed(() => {
      const d = data.value
      return d.name || d.company || d.institution || d.label || d.title || '(未命名)'
    })

    const subtitle = computed(() => {
      const d = data.value
      return d.role || d.degree || d.major || ''
    })

    const dateRange = computed(() => {
      const d = data.value
      if (!d.startDate && !d.endDate) return ''
      const end = d.isCurrent ? '至今' : (d.endDate || '')
      return [d.startDate, end].filter(Boolean).join(' — ')
    })

    // Content summary for the collapsed card view
    const summary = computed(() => {
      const d = data.value
      const cat = props.material.category
      if (cat === 'personal')  return d.summary || ''
      if (cat === 'education') return [d.degree, d.major].filter(Boolean).join(' · ')
      if (cat === 'work' || cat === 'project') return (d.bullets || [])[0] || ''
      if (cat === 'skill') return (d.bullets || [])[0] || (d.items || []).slice(0, 4).join(' · ')
      return ''
    })

    const scoreInfo = computed(() => {
      const score = props.material.jdScore
      if (score == null) return null
      const pct = Math.round(score * 100)
      if (score >= 0.7) return { pct, cls: 'score-high' }
      if (score >= 0.4) return { pct, cls: 'score-mid' }
      return { pct, cls: 'score-low' }
    })

    const detailRows = computed(() => {
      const d = data.value
      const cat = props.material.category
      const rows = []
      if (cat === 'personal') {
        if (d.email)    rows.push({ icon: '✉', label: '邮箱',   val: d.email })
        if (d.phone)    rows.push({ icon: '☎', label: '电话',   val: d.phone })
        if (d.location) rows.push({ icon: '◎', label: '城市',   val: d.location })
        if (d.linkedin) rows.push({ icon: '🔗', label: 'LinkedIn', val: d.linkedin })
        if (d.github)   rows.push({ icon: '⌨', label: 'GitHub',  val: d.github })
      }
      if (cat === 'education') {
        if (d.degree)   rows.push({ icon: '🎓', label: '学位',  val: d.degree })
        if (d.major)    rows.push({ icon: '📖', label: '专业',  val: d.major })
        if (d.gpa)      rows.push({ icon: '★',  label: 'GPA',   val: d.gpa })
      }
      if (cat === 'work')    { if (d.location) rows.push({ icon: '◎', label: '城市', val: d.location }) }
      if (cat === 'project') {
        if (d.role) rows.push({ icon: '👤', label: '角色', val: d.role })
        if (d.url)  rows.push({ icon: '🔗', label: '链接', val: d.url })
      }
      return rows
    })

    function onEdit(e) {
      e.stopPropagation()
      store.ui.editingMaterial = { id: props.material.id, category: props.material.category, mode: 'edit' }
      store.ui.activeModal = 'materialEditor'
    }

    function onDelete(e) {
      e.stopPropagation()
      if (confirm('确认删除这条素材？')) deleteMaterial(props.material.id)
    }

    function onAdd(e) {
      e.stopPropagation()
      addMaterialToSection(props.material.category, props.material.id)
    }

    function onDragStart(e) {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        materialId: props.material.id, category: props.material.category
      }))
      e.dataTransfer.effectAllowed = 'copy'
    }

    return {
      data, title, subtitle, dateRange, summary, scoreInfo, detailRows,
      lang, expanded, onEdit, onDelete, onAdd, onDragStart
    }
  },
  template: `
    <div class="material-card rounded-2xl overflow-hidden transition-all cursor-pointer select-none group relative"
      :style="expanded
        ? 'background:white; border:1.5px solid #111827; box-shadow:0 4px 20px rgba(0,0,0,0.1);'
        : 'background:white; border:1.5px solid #e5e7eb;'"
      style="transition: border-color 0.15s, box-shadow 0.15s;"
      draggable="true"
      @dragstart="onDragStart"
      @mouseenter="if(!expanded) { $el.style.borderColor='#d1d5db'; $el.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'; }"
      @mouseleave="if(!expanded) { $el.style.borderColor='#e5e7eb'; $el.style.boxShadow='none'; }">

      <!-- Card header (always visible) -->
      <div class="p-4" @click="expanded = !expanded">
        <div class="flex justify-between items-start gap-2 mb-2">
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-sm truncate" style="color:#111827;">{{ title }}</h4>
            <p v-if="subtitle || dateRange" class="text-xs mt-0.5" style="color:#6b7280;">
              <span v-if="subtitle">{{ subtitle }}</span>
              <span v-if="subtitle && dateRange"> · </span>
              <span v-if="dateRange">{{ dateRange }}</span>
            </p>
          </div>
          <!-- JD score badge -->
          <span v-if="scoreInfo"
            class="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
            :class="scoreInfo.cls">{{ scoreInfo.pct }}%</span>
        </div>

        <!-- Content summary (2-line clamp) -->
        <p v-if="summary && !expanded"
          class="text-xs leading-relaxed line-clamp-2 mt-1"
          style="color:#6b7280;">{{ summary }}</p>
      </div>

      <!-- Action buttons (hover reveal, top-right corner) -->
      <div class="mat-actions absolute top-3 right-3 flex gap-1 rounded-xl p-1"
        style="background:rgba(255,255,255,0.95); backdrop-filter:blur(4px); box-shadow:0 1px 6px rgba(0,0,0,0.12);"
        @click.stop>
        <button @click="onAdd"
          class="w-7 h-7 flex items-center justify-center rounded-lg text-sm"
          style="color:#16a34a;"
          title="加入简历">＋</button>
        <button @click="onEdit"
          class="w-7 h-7 flex items-center justify-center rounded-lg text-xs"
          style="color:#374151;"
          title="编辑">✏</button>
        <button @click="onDelete"
          class="w-7 h-7 flex items-center justify-center rounded-lg text-xs"
          style="color:#dc2626;"
          title="删除">✕</button>
      </div>

      <!-- Expanded detail panel -->
      <div v-if="expanded" style="border-top:1px solid #f3f4f6;">

        <!-- Personal: contact info -->
        <div v-if="material.category === 'personal'" class="px-4 pb-4 pt-3 space-y-2">
          <div v-if="data.title" class="text-xs font-semibold" style="color:#6b7280;">{{ data.title }}</div>
          <div v-if="data.summary" class="text-xs leading-relaxed p-3 rounded-xl" style="background:#f9fafb; color:#374151;">{{ data.summary }}</div>
          <div class="space-y-1.5">
            <div v-for="row in detailRows" :key="row.label" class="flex items-center gap-2 text-xs">
              <span class="w-4 text-center flex-shrink-0" style="color:#9ca3af;">{{ row.icon }}</span>
              <span class="font-medium flex-shrink-0" style="color:#6b7280; width:52px;">{{ row.label }}</span>
              <span class="truncate" style="color:#111827;">{{ row.val }}</span>
            </div>
          </div>
        </div>

        <!-- Education -->
        <div v-else-if="material.category === 'education'" class="px-4 pb-4 pt-3 space-y-2">
          <div class="space-y-1.5">
            <div v-for="row in detailRows" :key="row.label" class="flex items-center gap-2 text-xs">
              <span class="w-4 text-center" style="color:#9ca3af;">{{ row.icon }}</span>
              <span class="font-medium" style="color:#6b7280; width:52px;">{{ row.label }}</span>
              <span class="truncate" style="color:#111827;">{{ row.val }}</span>
            </div>
          </div>
          <div v-if="data.notes" class="text-xs p-3 rounded-xl" style="background:#f9fafb; color:#6b7280;">{{ data.notes }}</div>
        </div>

        <!-- Work / Project: bullets -->
        <div v-else-if="material.category === 'work' || material.category === 'project'" class="px-4 pb-4 pt-3 space-y-2">
          <div v-if="detailRows.length" class="space-y-1">
            <div v-for="row in detailRows" :key="row.label" class="flex items-center gap-2 text-xs">
              <span style="color:#9ca3af;">{{ row.icon }}</span>
              <span class="font-medium" style="color:#6b7280; width:52px;">{{ row.label }}</span>
              <span class="truncate" style="color:#111827;">{{ row.val }}</span>
            </div>
          </div>
          <div v-if="data.techStack?.length" class="flex flex-wrap gap-1.5">
            <span v-for="t in data.techStack" :key="t"
              class="text-xs px-2 py-0.5 rounded-lg font-medium"
              style="background:#f3f4f6; color:#374151;">{{ t }}</span>
          </div>
          <div v-if="data.bullets?.length" class="space-y-1.5">
            <div v-for="(b, i) in data.bullets" :key="i" class="flex gap-2 text-xs leading-relaxed">
              <span class="flex-shrink-0 mt-0.5 font-bold" style="color:#e8c840;">•</span>
              <span style="color:#374151;">{{ b }}</span>
            </div>
          </div>
          <div v-else class="text-xs" style="color:#9ca3af;">暂无内容描述</div>
        </div>

        <!-- Skill -->
        <div v-else-if="material.category === 'skill'" class="px-4 pb-4 pt-3">
          <div v-if="data.type === 'cert'" class="space-y-1.5 text-xs">
            <div class="flex gap-2"><span style="color:#6b7280;">证书</span><span style="color:#111827; font-weight:600;">{{ data.certName }}</span></div>
            <div v-if="data.issuer" class="flex gap-2"><span style="color:#6b7280;">机构</span><span style="color:#111827;">{{ data.issuer }}</span></div>
            <div v-if="data.issueDate" class="flex gap-2"><span style="color:#6b7280;">时间</span><span style="color:#111827;">{{ data.issueDate }}</span></div>
          </div>
          <div v-else-if="data.bullets?.length" class="space-y-1.5">
            <div v-for="(b, i) in data.bullets" :key="i" class="flex gap-2 text-xs leading-relaxed">
              <span class="flex-shrink-0 mt-0.5 font-bold" style="color:#e8c840;">•</span>
              <span style="color:#374151;">{{ b }}</span>
            </div>
          </div>
          <div v-else-if="data.items?.length" class="flex flex-wrap gap-1.5">
            <span v-for="item in data.items" :key="item"
              class="text-xs px-2.5 py-1 rounded-xl font-medium"
              style="background:#f3f4f6; color:#374151;">{{ item }}</span>
          </div>
        </div>

        <!-- JD keywords -->
        <div v-if="material.jdHighlightedKeywords?.length" class="px-4 pb-3 flex flex-wrap gap-1">
          <span v-for="kw in material.jdHighlightedKeywords.slice(0, 6)" :key="kw"
            class="text-xs px-2 py-0.5 rounded-full font-medium"
            style="background:#fef9c3; color:#854d0e;">{{ kw }}</span>
        </div>

        <!-- Expanded action bar -->
        <div class="px-4 pb-4 flex gap-2" @click.stop>
          <button @click="onAdd"
            class="flex-1 py-2 rounded-xl text-xs font-semibold"
            style="background:#111827; color:white;">＋ 加入简历</button>
          <button @click="onEdit"
            class="px-4 py-2 rounded-xl text-xs font-medium"
            style="background:#f3f4f6; color:#374151;">✏ 编辑</button>
          <button @click="onDelete"
            class="px-4 py-2 rounded-xl text-xs font-medium"
            style="background:#fee2e2; color:#dc2626;">✕</button>
        </div>

      </div>
    </div>
  `
}
