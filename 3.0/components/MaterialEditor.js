import { ref, computed, watch } from 'vue'
import { store, genId, saveMaterial, showToast } from '../store/state.js'

const EMPTY_MATERIAL = (category) => ({
  id: null,
  category,
  jdScore: null,
  jdHighlightedKeywords: [],
  cn: getEmptyFields(category),
  en: getEmptyFields(category)
})

function getEmptyFields(category) {
  switch (category) {
    case 'personal':
      return { name: '', title: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', summary: '' }
    case 'education':
      return { institution: '', degree: '', major: '', startDate: '', endDate: '', gpa: '', notes: '' }
    case 'work':
      return { company: '', role: '', startDate: '', endDate: '', isCurrent: false, location: '', bullets: [] }
    case 'project':
      return { name: '', role: '', startDate: '', endDate: '', techStack: [], url: '', bullets: [] }
    case 'skill':
      return { label: '', type: 'skill', bullets: [], items: [], certName: '', issuer: '', issueDate: '' }
    default:
      return {}
  }
}

export default {
  name: 'MaterialEditor',
  setup() {
    const activeLang = ref('cn')
    const form = ref(null)

    const editingInfo = computed(() => store.ui.editingMaterial)
    const isEditing = computed(() => editingInfo.value?.mode === 'edit')

    watch(editingInfo, (info) => {
      if (!info) return
      if (info.mode === 'edit') {
        const mat = store.materials.find(m => m.id === info.id)
        form.value = mat ? JSON.parse(JSON.stringify(mat)) : EMPTY_MATERIAL(info.category)
      } else {
        form.value = EMPTY_MATERIAL(info.category)
        form.value.category = info.category
      }
    }, { immediate: true })

    const category = computed(() => form.value?.category || 'work')
    const d = computed(() => form.value?.[activeLang.value] || {})

    const bulletsText = computed({
      get() { return (d.value.bullets || []).join('\n') },
      set(val) {
        if (!form.value) return
        form.value[activeLang.value].bullets = val.split('\n').map(s => s.trim()).filter(Boolean)
      }
    })

    const techText = computed({
      get() { return (d.value.techStack || []).join(', ') },
      set(val) {
        if (!form.value) return
        form.value[activeLang.value].techStack = val.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      }
    })

    const itemsText = computed({
      get() { return (d.value.items || []).join(', ') },
      set(val) {
        if (!form.value) return
        form.value[activeLang.value].items = val.split(/[,，]/).map(s => s.trim()).filter(Boolean)
      }
    })

    function close() {
      store.ui.activeModal = null
      store.ui.editingMaterial = null
    }

    function save() {
      if (!form.value) return
      const mat = { ...form.value }
      if (!mat.id) mat.id = genId('mat')
      saveMaterial(mat)
      showToast(isEditing.value ? '素材已更新' : '素材已添加', 'success')
      close()
    }

    const CATEGORY_LABELS = { personal: '个人信息', education: '教育经历', work: '工作经历', project: '项目经历', skill: '技能/证书' }

    return {
      activeLang, form, category, d, isEditing,
      bulletsText, techText, itemsText,
      close, save, store, CATEGORY_LABELS
    }
  },
  template: `
    <Transition name="modal">
    <div v-if="store.ui.activeModal === 'materialEditor' && form"
      class="fixed inset-0 z-40 flex items-center justify-center modal-backdrop"
      @click.self="close">
      <div class="rounded-3xl shadow-modal w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        style="background:white;">

        <!-- Header -->
        <div class="flex items-center justify-between px-7 py-5" style="border-bottom:1px solid #f0ece6;">
          <div>
            <h2 class="text-lg font-bold" style="color:#1c1c1c;">
              {{ isEditing ? '编辑素材' : '添加素材' }}
            </h2>
            <p class="text-xs mt-0.5" style="color:#8b8580;">{{ CATEGORY_LABELS[category] }}</p>
          </div>
          <button @click="close"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f2ed] transition-colors"
            style="color:#8b8580; font-size:16px;">✕</button>
        </div>

        <!-- Lang tabs -->
        <div class="flex gap-2 px-7 pt-5">
          <button v-for="lang in ['cn', 'en']" :key="lang"
            @click="activeLang = lang"
            class="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            :style="activeLang === lang
              ? 'background:#1c1c1c; color:#e8c840;'
              : 'background:#f5f2ed; color:#6b6560;'">
            {{ lang === 'cn' ? '中文' : 'English' }}
          </button>
        </div>

        <!-- Form body -->
        <div class="flex-1 overflow-y-auto px-7 py-5 space-y-4">

          <!-- Personal -->
          <template v-if="category === 'personal'">
            <div class="grid grid-cols-2 gap-3">
              <div><label class="w-label">{{ activeLang==='cn'?'姓名':'Name' }}</label><input v-model="d.name" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'职位头衔':'Title' }}</label><input v-model="d.title" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'邮箱':'Email' }}</label><input v-model="d.email" class="w-input" type="email" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'电话':'Phone' }}</label><input v-model="d.phone" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'城市':'Location' }}</label><input v-model="d.location" class="w-input" /></div>
              <div><label class="w-label">LinkedIn</label><input v-model="d.linkedin" class="w-input" /></div>
              <div><label class="w-label">GitHub</label><input v-model="d.github" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'个人网站':'Website' }}</label><input v-model="d.website" class="w-input" /></div>
            </div>
            <div><label class="w-label">{{ activeLang==='cn'?'个人简介':'Summary' }}</label>
              <textarea v-model="d.summary" class="w-input" rows="3"></textarea></div>
          </template>

          <!-- Education -->
          <template v-else-if="category === 'education'">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2"><label class="w-label">{{ activeLang==='cn'?'学校名称':'Institution' }}</label><input v-model="d.institution" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'学位':'Degree' }}</label><input v-model="d.degree" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'专业':'Major' }}</label><input v-model="d.major" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'开始时间':'Start Date' }}</label><input v-model="d.startDate" class="w-input" placeholder="YYYY-MM" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'结束时间':'End Date' }}</label><input v-model="d.endDate" class="w-input" placeholder="YYYY-MM" /></div>
              <div><label class="w-label">GPA</label><input v-model="d.gpa" class="w-input" /></div>
            </div>
            <div><label class="w-label">{{ activeLang==='cn'?'备注':'Notes' }}</label>
              <textarea v-model="d.notes" class="w-input" rows="2"></textarea></div>
          </template>

          <!-- Work -->
          <template v-else-if="category === 'work'">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2"><label class="w-label">{{ activeLang==='cn'?'公司名称':'Company' }}</label><input v-model="d.company" class="w-input" /></div>
              <div class="col-span-2"><label class="w-label">{{ activeLang==='cn'?'职位':'Role' }}</label><input v-model="d.role" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'开始时间':'Start' }}</label><input v-model="d.startDate" class="w-input" placeholder="YYYY-MM" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'结束时间':'End' }}</label>
                <input v-model="d.endDate" class="w-input" placeholder="YYYY-MM" :disabled="d.isCurrent" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'城市':'Location' }}</label><input v-model="d.location" class="w-input" /></div>
              <div class="flex items-center gap-2 mt-5">
                <input type="checkbox" v-model="d.isCurrent" id="isCurrent" class="w-4 h-4 accent-[#e8c840]" />
                <label for="isCurrent" class="text-sm" style="color:#3a3a3a;">{{ activeLang==='cn'?'至今在职':'Currently here' }}</label>
              </div>
            </div>
            <div>
              <label class="w-label">{{ activeLang==='cn'?'工作内容（每行一条）':'Bullets (one per line)' }}</label>
              <textarea v-model="bulletsText" class="w-input font-mono" rows="5"
                :placeholder="activeLang==='cn'?'负责 XXX 系统设计，将性能提升 40%':'Led the design of XXX system, improving performance by 40%'"></textarea>
            </div>
          </template>

          <!-- Project -->
          <template v-else-if="category === 'project'">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2"><label class="w-label">{{ activeLang==='cn'?'项目名称':'Project Name' }}</label><input v-model="d.name" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'担任角色':'Role' }}</label><input v-model="d.role" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'项目链接':'URL' }}</label><input v-model="d.url" class="w-input" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'开始时间':'Start' }}</label><input v-model="d.startDate" class="w-input" placeholder="YYYY-MM" /></div>
              <div><label class="w-label">{{ activeLang==='cn'?'结束时间':'End' }}</label><input v-model="d.endDate" class="w-input" placeholder="YYYY-MM" /></div>
              <div class="col-span-2">
                <label class="w-label">{{ activeLang==='cn'?'技术栈（逗号分隔）':'Tech Stack (comma separated)' }}</label>
                <input v-model="techText" class="w-input" placeholder="Vue 3, Node.js, PostgreSQL" />
              </div>
            </div>
            <div>
              <label class="w-label">{{ activeLang==='cn'?'项目描述（每行一条）':'Bullets (one per line)' }}</label>
              <textarea v-model="bulletsText" class="w-input font-mono" rows="4"></textarea>
            </div>
          </template>

          <!-- Skill -->
          <template v-else-if="category === 'skill'">
            <div class="grid grid-cols-2 gap-3">
              <div><label class="w-label">{{ activeLang==='cn'?'分类标签':'Label' }}</label><input v-model="d.label" class="w-input" :placeholder="activeLang==='cn'?'编程语言':'Languages'" /></div>
              <div>
                <label class="w-label">{{ activeLang==='cn'?'类型':'Type' }}</label>
                <select v-model="d.type" class="w-input">
                  <option value="skill">{{ activeLang==='cn'?'技能':'Skill' }}</option>
                  <option value="cert">{{ activeLang==='cn'?'证书':'Certificate' }}</option>
                </select>
              </div>
            </div>
            <template v-if="d.type !== 'cert'">
              <div>
                <label class="w-label">{{ activeLang==='cn'?'技能描述（每行一条完整描述）':'Skill description (one sentence per line)' }}</label>
                <textarea v-model="bulletsText" class="w-input font-mono" rows="4"
                  :placeholder="activeLang==='cn'?'每行一条完整描述，例如：熟练掌握 Python、Vue.js 等开发技术':'One sentence per line, e.g.: Proficient in Python and Vue.js'"></textarea>
              </div>
            </template>
            <template v-else>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="w-label">{{ activeLang==='cn'?'证书名称':'Cert Name' }}</label><input v-model="d.certName" class="w-input" /></div>
                <div><label class="w-label">{{ activeLang==='cn'?'颁发机构':'Issuer' }}</label><input v-model="d.issuer" class="w-input" /></div>
                <div><label class="w-label">{{ activeLang==='cn'?'获得时间':'Issue Date' }}</label><input v-model="d.issueDate" class="w-input" placeholder="YYYY-MM" /></div>
                <div><label class="w-label">{{ activeLang==='cn'?'有效期至':'Expiry' }}</label><input v-model="d.expiryDate" class="w-input" placeholder="YYYY-MM" /></div>
              </div>
            </template>
          </template>

        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 px-7 py-5" style="border-top:1px solid #f0ece6; background:#faf8f5;">
          <button @click="close" class="btn-ghost px-5 py-2.5 text-sm">✕ 取消</button>
          <button @click="save" class="btn-accent px-6 py-2.5 text-sm">✓ 保存素材</button>
        </div>
      </div>
    </div>
    </Transition>
  `
}
