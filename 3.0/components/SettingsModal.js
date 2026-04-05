import { ref, computed, watch } from 'vue'
import { store, showToast } from '../store/state.js'
import { PROVIDERS, testConnection } from '../services/aiService.js'
import { exportBackup } from '../services/exportService.js'

export default {
  name: 'SettingsModal',
  setup() {
    const testing = ref(false)
    const testResult = ref(null)
    const showKey = ref(false)

    const isOpen = computed(() => store.ui.activeModal === 'settings')
    const settings = computed(() => store.aiSettings)
    const providerList = computed(() => Object.entries(PROVIDERS).map(([key, p]) => ({ key, ...p })))
    const currentPreset = computed(() => PROVIDERS[settings.value.provider] || PROVIDERS.openai)

    watch(() => settings.value.provider, () => {
      settings.value.model = (PROVIDERS[settings.value.provider] || PROVIDERS.openai).defaultModel
      testResult.value = null
    })

    function close() { store.ui.activeModal = null }

    async function doTest() {
      testing.value = true
      testResult.value = null
      try {
        const result = await testConnection()
        testResult.value = result
        if (result.ok) showToast('连接成功 ✓', 'success')
        else showToast(`连接失败: ${result.error}`, 'error')
      } catch (e) {
        testResult.value = { ok: false, error: e.message }
      } finally {
        testing.value = false
      }
    }

    function doExportBackup() {
      exportBackup()
      showToast('备份已下载', 'success')
    }

    function resetResume() {
      if (!confirm('确认清空当前简历内容？素材库不受影响。')) return
      store.resume.sections = [
        { id: 'sec_personal',  category: 'personal',  visible: true, order: 0, items: [] },
        { id: 'sec_education', category: 'education', visible: true, order: 1, items: [] },
        { id: 'sec_work',      category: 'work',      visible: true, order: 2, items: [] },
        { id: 'sec_project',   category: 'project',   visible: true, order: 3, items: [] },
        { id: 'sec_skill',     category: 'skill',     visible: true, order: 4, items: [] },
      ]
      showToast('简历已清空', 'info')
    }

    function clearMaterials() {
      if (!confirm('确认清空所有素材？此操作不可恢复。')) return
      store.materials.splice(0)
      showToast('素材库已清空', 'info')
    }

    return {
      testing, testResult, showKey, isOpen, settings, providerList, currentPreset,
      close, doTest, doExportBackup, resetResume, clearMaterials, store, PROVIDERS
    }
  },
  template: `
    <Transition name="modal">
    <div v-if="isOpen"
      class="fixed inset-0 z-40 flex items-center justify-center modal-backdrop"
      @click.self="close">
      <div class="rounded-3xl shadow-modal w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden"
        style="background:white;">

        <!-- Header -->
        <div class="flex items-center justify-between px-7 py-5" style="border-bottom:1px solid #f0ece6;">
          <div>
            <h2 class="text-lg font-bold" style="color:#1c1c1c;">设置</h2>
            <p class="text-xs mt-0.5" style="color:#8b8580;">配置 AI 模型 · 管理数据</p>
          </div>
          <button @click="close"
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f5f2ed] transition-colors"
            style="color:#8b8580; font-size:16px;">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto px-7 py-6 space-y-7">

          <!-- AI Provider -->
          <div>
            <h3 class="text-xs font-bold mb-4" style="color:#6b6560; text-transform:uppercase; letter-spacing:0.06em;">
              AI 大模型配置
            </h3>

            <div class="space-y-4">
              <div>
                <label class="w-label">模型提供商</label>
                <select v-model="settings.provider" class="w-input">
                  <option v-for="p in providerList" :key="p.key" :value="p.key">{{ p.name }}</option>
                </select>
              </div>

              <div>
                <label class="w-label">API Key</label>
                <div class="relative">
                  <input v-model="settings.apiKey"
                    :type="showKey ? 'text' : 'password'"
                    class="w-input pr-14"
                    placeholder="sk-…" />
                  <button @click="showKey = !showKey"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 font-semibold"
                    style="color:#8b8580;">
                    {{ showKey ? '隐藏' : '显示' }}
                  </button>
                </div>
                <p class="text-xs mt-1.5" style="color:#b0aaa4;">API Key 仅存储在本地浏览器，不会上传任何服务器</p>
              </div>

              <div>
                <label class="w-label">API Base URL <span class="font-normal normal-case" style="color:#b0aaa4;">（留空用默认）</span></label>
                <input v-model="settings.baseUrl" class="w-input"
                  :placeholder="currentPreset.baseUrl" />
              </div>

              <div>
                <label class="w-label">模型</label>
                <input v-model="settings.model" class="w-input mb-2"
                  :placeholder="currentPreset.defaultModel" />
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="m in currentPreset.models" :key="m"
                    @click="settings.model = m"
                    class="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                    :style="settings.model === m
                      ? 'background:#1c1c1c; color:#e8c840;'
                      : 'background:#f0ece6; color:#6b6560;'">
                    {{ m }}
                  </button>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <input type="checkbox" v-model="settings.streamEnabled" id="stream" class="w-4 h-4 accent-[#e8c840]" />
                <label for="stream" class="text-sm" style="color:#3a3a3a;">启用流式输出（打字机效果）</label>
              </div>

              <button @click="doTest" :disabled="testing || !settings.apiKey"
                class="btn-primary w-full py-2.5 text-sm disabled:opacity-50">
                {{ testing ? '⟳ 测试中…' : '🔗 测试连接' }}
              </button>

              <div v-if="testResult" class="p-3 rounded-2xl text-sm"
                :style="testResult.ok
                  ? 'background:#d4f0e0; color:#1a6640;'
                  : 'background:#fde2de; color:#8a1f18;'">
                <span v-if="testResult.ok">✓ 连接成功！响应: {{ testResult.message }}</span>
                <span v-else>✕ {{ testResult.error }}</span>
              </div>
            </div>
          </div>

          <!-- Language -->
          <div>
            <h3 class="text-xs font-bold mb-4" style="color:#6b6560; text-transform:uppercase; letter-spacing:0.06em;">
              简历语言
            </h3>
            <div class="flex gap-2">
              <button v-for="l in ['cn', 'en']" :key="l"
                @click="store.resume.meta.language = l"
                class="px-5 py-2.5 text-sm rounded-xl font-semibold transition-all"
                :style="store.resume.meta.language === l
                  ? 'background:#1c1c1c; color:#e8c840;'
                  : 'background:#f5f2ed; color:#6b6560;'">
                {{ l === 'cn' ? '中文简历' : 'English Resume' }}
              </button>
            </div>
          </div>

          <!-- Data management -->
          <div>
            <h3 class="text-xs font-bold mb-4" style="color:#6b6560; text-transform:uppercase; letter-spacing:0.06em;">
              数据管理
            </h3>
            <div class="space-y-2">
              <button @click="doExportBackup"
                class="btn-ghost w-full py-3 text-sm text-left px-4 flex items-center gap-3">
                💾 导出数据备份（JSON）
              </button>
              <button @click="resetResume"
                class="w-full py-3 text-sm text-left px-4 flex items-center gap-3 rounded-xl font-medium"
                style="border:1.5px solid #fdefd2; color:#8a5a10; background:white;">
                🗑 清空当前简历（保留素材库）
              </button>
              <button @click="clearMaterials"
                class="w-full py-3 text-sm text-left px-4 flex items-center gap-3 rounded-xl font-medium"
                style="border:1.5px solid #fde2de; color:#8a1f18; background:white;">
                ⚠ 清空全部素材库
              </button>
            </div>
          </div>

        </div>

        <div class="px-7 py-5 flex justify-end" style="border-top:1px solid #f0ece6; background:#faf8f5;">
          <button @click="close" class="btn-accent px-7 py-2.5 text-sm">✓ 完成</button>
        </div>
      </div>
    </div>
    </Transition>
  `
}
