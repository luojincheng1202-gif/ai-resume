import { ref, computed } from 'vue'
import { store, getResolvedData, removeItemFromSection, updateItemOverride } from '../store/state.js'

export default {
  name: 'ResumeItem',
  props: {
    item:      { type: Object, required: true },
    sectionId: { type: String, required: true },
    category:  { type: String, required: true }
  },
  setup(props) {
    const editing = ref(false)
    const lang = computed(() => store.resume.meta.language)
    const data = computed(() => getResolvedData(props.item, lang.value))
    const form = ref(null)

    function startEdit() {
      form.value = JSON.parse(JSON.stringify(data.value))
      if (!Array.isArray(form.value.bullets))   form.value.bullets = []
      if (!Array.isArray(form.value.items))     form.value.items = []
      if (!Array.isArray(form.value.techStack)) form.value.techStack = []
      editing.value = true
    }

    function cancelEdit() { editing.value = false; form.value = null }

    function saveEdit() {
      const f = form.value
      for (const [k, v] of Object.entries(f)) updateItemOverride(props.sectionId, props.item.id, lang.value, k, v)
      editing.value = false; form.value = null
    }

    function remove() { removeItemFromSection(props.sectionId, props.item.id) }

    const displayTitle   = computed(() => { const d = data.value; return d.name || d.company || d.institution || d.label || d.title || '(未填写)' })
    const displaySub     = computed(() => { const d = data.value; return d.role || d.degree || d.title || '' })
    const displayBullets = computed(() => data.value.bullets || [])
    const displayItems   = computed(() => data.value.items   || [])

    const bulletsText = computed({
      get: () => (form.value?.bullets || []).join('\n'),
      set: (v) => { if (form.value) form.value.bullets = v.split('\n').map(s => s.trim()).filter(Boolean) }
    })
    const techText = computed({
      get: () => (form.value?.techStack || []).join(', '),
      set: (v) => { if (form.value) form.value.techStack = v.split(/[,，]/).map(s => s.trim()).filter(Boolean) }
    })
    const itemsText = computed({
      get: () => (form.value?.items || []).join(', '),
      set: (v) => { if (form.value) form.value.items = v.split(/[,，]/).map(s => s.trim()).filter(Boolean) }
    })

    return { editing, form, lang, data, displayTitle, displaySub, displayBullets, displayItems, bulletsText, techText, itemsText, startEdit, cancelEdit, saveEdit, remove }
  },
  template: `
    <div class="rounded-2xl overflow-hidden transition-all"
      style="background:white; border:1.5px solid #f3f4f6; box-shadow:0 1px 8px rgba(0,0,0,0.04);">

      <template v-if="!editing">
        <div class="flex items-start justify-between p-4 gap-2">
          <div class="flex-1 min-w-0">

            <template v-if="category === 'personal'">
              <div class="font-semibold text-sm" style="color:#111827;">{{ data.name || '(未填写姓名)' }}</div>
              <div v-if="data.title" class="text-xs mt-0.5" style="color:#6b7280;">{{ data.title }}</div>
              <div v-if="data.email || data.phone" class="text-xs mt-1" style="color:#9ca3af;">
                {{ [data.email, data.phone, data.location].filter(Boolean).join(' · ') }}
              </div>
              <div v-if="data.summary" class="text-xs mt-1.5 line-clamp-2 leading-relaxed" style="color:#9ca3af;">{{ data.summary }}</div>
            </template>

            <template v-else-if="category === 'education'">
              <div class="font-semibold text-sm" style="color:#111827;">{{ data.institution || '(未填写学校)' }}</div>
              <div class="text-xs mt-0.5" style="color:#6b7280;">{{ [data.degree, data.major].filter(Boolean).join(' · ') }}</div>
              <div class="text-xs mt-0.5" style="color:#9ca3af;">{{ [data.startDate, data.endDate].filter(Boolean).join(' — ') }}</div>
            </template>

            <template v-else-if="category === 'work' || category === 'project'">
              <div class="font-semibold text-sm" style="color:#111827;">{{ displayTitle }}</div>
              <div v-if="displaySub" class="text-xs mt-0.5" style="color:#6b7280;">{{ displaySub }}</div>
              <div v-if="displayBullets.length" class="mt-1.5 space-y-0.5">
                <div v-for="(b, i) in displayBullets.slice(0, 2)" :key="i" class="text-xs truncate" style="color:#9ca3af;">• {{ b }}</div>
                <div v-if="displayBullets.length > 2" class="text-xs" style="color:#d1d5db;">…共 {{ displayBullets.length }} 条</div>
              </div>
            </template>

            <template v-else-if="category === 'skill'">
              <div class="font-semibold text-sm" style="color:#111827;">{{ data.label || '(未填写)' }}</div>
              <div class="text-xs truncate mt-0.5" style="color:#9ca3af;">{{ displayItems.join(' · ') || data.certName || '' }}</div>
            </template>

          </div>

          <div class="flex gap-1 flex-shrink-0">
            <button @click="startEdit"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium"
              style="color:#6b7280;">✏ 编辑</button>
            <button @click="remove"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium"
              style="color:#dc2626;">✕ 移除</button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="p-4" style="background:#fef9c3; border-bottom:1.5px solid #e8c840;">
          <div class="text-xs font-semibold mb-3" style="color:#854d0e;">
            编辑 ({{ lang === 'cn' ? '中文' : 'English' }}) · 修改仅影响此简历
          </div>
          <div class="space-y-2">

            <template v-if="category === 'personal'">
              <div class="grid grid-cols-2 gap-2">
                <input v-model="form.name"     class="edit-input" :placeholder="lang==='cn'?'姓名':'Name'" />
                <input v-model="form.title"    class="edit-input" :placeholder="lang==='cn'?'职位头衔':'Title'" />
                <input v-model="form.email"    class="edit-input" placeholder="Email" />
                <input v-model="form.phone"    class="edit-input" :placeholder="lang==='cn'?'电话':'Phone'" />
                <input v-model="form.location" class="edit-input" :placeholder="lang==='cn'?'城市':'Location'" />
              </div>
              <textarea v-model="form.summary" class="edit-input w-full" rows="3"
                :placeholder="lang==='cn'?'个人简介…':'Summary…'"></textarea>
            </template>

            <template v-else-if="category === 'education'">
              <input v-model="form.institution" class="edit-input w-full" :placeholder="lang==='cn'?'学校':'Institution'" />
              <div class="grid grid-cols-2 gap-2">
                <input v-model="form.degree"    class="edit-input" :placeholder="lang==='cn'?'学位':'Degree'" />
                <input v-model="form.major"     class="edit-input" :placeholder="lang==='cn'?'专业':'Major'" />
                <input v-model="form.startDate" class="edit-input" placeholder="YYYY-MM" />
                <input v-model="form.endDate"   class="edit-input" placeholder="YYYY-MM" />
              </div>
            </template>

            <template v-else-if="category === 'work'">
              <input v-model="form.company"   class="edit-input w-full" :placeholder="lang==='cn'?'公司':'Company'" />
              <input v-model="form.role"      class="edit-input w-full" :placeholder="lang==='cn'?'职位':'Role'" />
              <div class="grid grid-cols-2 gap-2">
                <input v-model="form.startDate" class="edit-input" placeholder="YYYY-MM" />
                <input v-model="form.endDate"   class="edit-input" placeholder="YYYY-MM" :disabled="form.isCurrent" />
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" v-model="form.isCurrent" id="ic_edit" class="w-3.5 h-3.5 accent-[#e8c840]" />
                <label for="ic_edit" class="text-xs" style="color:#6b7280;">{{ lang==='cn'?'至今在职':'Currently working' }}</label>
              </div>
              <textarea v-model="bulletsText" class="edit-input w-full font-mono" rows="4"
                :placeholder="lang==='cn'?'每行一条工作内容…':'One bullet per line…'"></textarea>
            </template>

            <template v-else-if="category === 'project'">
              <input v-model="form.name" class="edit-input w-full" :placeholder="lang==='cn'?'项目名称':'Project Name'" />
              <div class="grid grid-cols-2 gap-2">
                <input v-model="form.role"      class="edit-input" :placeholder="lang==='cn'?'角色':'Role'" />
                <input v-model="form.url"       class="edit-input" placeholder="URL" />
                <input v-model="form.startDate" class="edit-input" placeholder="YYYY-MM" />
                <input v-model="form.endDate"   class="edit-input" placeholder="YYYY-MM" />
              </div>
              <input v-model="techText" class="edit-input w-full" :placeholder="lang==='cn'?'技术栈（逗号分隔）':'Tech stack (comma separated)'" />
              <textarea v-model="bulletsText" class="edit-input w-full font-mono" rows="4"
                :placeholder="lang==='cn'?'每行一条项目描述…':'One bullet per line…'"></textarea>
            </template>

            <template v-else-if="category === 'skill'">
              <input v-model="form.label" class="edit-input w-full" :placeholder="lang==='cn'?'分类名称':'Category label'" />
              <input v-model="itemsText"  class="edit-input w-full" :placeholder="lang==='cn'?'技能项（逗号分隔）':'Items (comma separated)'" />
            </template>

          </div>
          <div class="flex justify-end gap-2 mt-3">
            <button @click="cancelEdit" class="btn-ghost px-4 py-1.5 text-xs">✕ 取消</button>
            <button @click="saveEdit"   class="btn-accent px-4 py-1.5 text-xs">✓ 保存</button>
          </div>
        </div>
      </template>

    </div>
  `
}
