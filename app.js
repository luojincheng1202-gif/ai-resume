import { createApp } from 'vue'
import { store } from './store/state.js'

import LeftPanel          from './components/LeftPanel.js'
import JdMatcher          from './components/JdMatcher.js'
import RightPanel         from './components/RightPanel.js'
import MaterialEditor     from './components/MaterialEditor.js'
import SettingsModal      from './components/SettingsModal.js'
import ImportDialog       from './components/ImportDialog.js'
import AiWriteDialog      from './components/AiWriteDialog.js'
import AiFullResumeDialog from './components/AiFullResumeDialog.js'
import ToastNotification  from './components/ToastNotification.js'

// ── Sidebar navigation categories ─────────────────────────────────────────

const CATEGORIES = [
  { key: 'work',      label: '工作', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>` },
  { key: 'project',   label: '项目', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>` },
  { key: 'education', label: '教育', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>` },
  { key: 'skill',     label: '技能', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>` },
  { key: 'personal',  label: '个人', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>` },
]

// ── Root App component ─────────────────────────────────────────────────────

const App = {
  name: 'App',
  components: {
    LeftPanel, JdMatcher, RightPanel,
    MaterialEditor, SettingsModal, ImportDialog, AiWriteDialog, AiFullResumeDialog,
    ToastNotification
  },
  setup() {
    function setCategory(key) {
      store.appSettings.activeCategory = key
      store.ui.leftView = 'library'
    }
    function isActiveCat(key) {
      return store.ui.leftView === 'library' && store.appSettings.activeCategory === key
    }
    return { store, CATEGORIES, setCategory, isActiveCat }
  },
  template: `
    <div class="flex h-screen overflow-hidden p-3 gap-3" style="background:#EBE9E4;">

      <!-- ── Floating pill sidebar ── -->
      <nav class="flex flex-col items-center py-6 gap-2 flex-shrink-0 border border-stone-200/60"
        style="width:72px; background:white; border-radius:2rem; box-shadow:0 2px 12px rgba(0,0,0,0.06);">

        <!-- Logo -->
        <div class="w-11 h-11 rounded-full flex items-center justify-center mb-3 flex-shrink-0 font-serif italic font-bold text-xl shadow-md"
          style="background:#111827; color:white;">R</div>

        <!-- Category nav buttons -->
        <div class="flex flex-col gap-1.5 w-full px-3">
          <button v-for="cat in CATEGORIES" :key="cat.key"
            @click="setCategory(cat.key)"
            :class="['sidebar-btn w-full', isActiveCat(cat.key) ? 'active' : '']"
            :title="cat.label">
            <span v-html="cat.svg"></span>
          </button>
        </div>

        <div class="flex-1"></div>

        <!-- Bottom: JD/Templates/Lang/Settings -->
        <div class="flex flex-col gap-1.5 w-full px-3">

          <!-- JD match (target icon) -->
          <button @click="store.ui.leftView = store.ui.leftView === 'jd' ? 'library' : 'jd'"
            :class="['sidebar-btn w-full', store.ui.leftView === 'jd' ? 'active' : '']"
            title="JD 匹配">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </button>

          <!-- Template (layout icon) -->
          <button @click="store.ui.leftView = 'templates'"
            :class="['sidebar-btn w-full', store.ui.leftView === 'templates' ? 'active' : '']"
            title="模板">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          </button>

          <!-- Language toggle -->
          <button @click="store.resume.meta.language = store.resume.meta.language === 'cn' ? 'en' : 'cn'"
            class="sidebar-btn w-full text-xs font-bold"
            title="切换语言">
            {{ store.resume.meta.language === 'cn' ? '中' : 'EN' }}
          </button>

          <!-- Settings -->
          <button @click="store.ui.activeModal = 'settings'"
            :class="['sidebar-btn w-full', store.ui.activeModal === 'settings' ? 'active' : '']"
            title="设置">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </nav>

      <!-- ── Left column (JD dark card + material library) ── -->
      <aside class="flex flex-col gap-3 flex-shrink-0 overflow-hidden" style="width:400px;">

        <!-- JD view: full-height JdMatcher dark card -->
        <template v-if="store.ui.leftView === 'jd'">
          <JdMatcher class="flex-1" />
        </template>

        <!-- Templates or Library: compact JD card (library only) + LeftPanel -->
        <template v-else>
          <JdMatcher v-if="store.ui.leftView === 'library'" :compact="true" />
          <LeftPanel class="flex-1 min-h-0" />
        </template>

      </aside>

      <!-- ── Right main panel ── -->
      <main class="flex-1 min-w-0 overflow-hidden border border-stone-200/60"
        style="background:white; border-radius:2rem; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <RightPanel />
      </main>

      <!-- Modals -->
      <MaterialEditor />
      <SettingsModal />
      <ImportDialog />
      <AiWriteDialog />
      <AiFullResumeDialog />

      <!-- Toasts -->
      <ToastNotification />

    </div>
  `
}

// ── Mount ──────────────────────────────────────────────────────────────────

createApp(App).mount('#app')
