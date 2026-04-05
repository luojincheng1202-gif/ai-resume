import { store } from '../store/state.js'

export default {
  name: 'ToastNotification',
  setup() {
    return { toast: store.ui.toast }
  },
  template: `
    <Transition name="toast">
      <div v-if="toast.show"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-modal text-sm font-medium max-w-xs"
        :style="{
          background: toast.type === 'success' ? '#1c1c1c' :
                      toast.type === 'error'   ? '#2a0f0f' :
                      toast.type === 'warning' ? '#2a1f0a' : '#1c1c1c',
          color: toast.type === 'success' ? '#e8c840' :
                 toast.type === 'error'   ? '#ff8070' :
                 toast.type === 'warning' ? '#ffc840' : '#e8e4de',
          border: '1px solid rgba(255,255,255,0.08)'
        }">
        <span style="font-size:16px; line-height:1;">
          <template v-if="toast.type === 'success'">✓</template>
          <template v-else-if="toast.type === 'error'">✕</template>
          <template v-else-if="toast.type === 'warning'">⚠</template>
          <template v-else>ℹ</template>
        </span>
        <span style="color:#e8e4de;">{{ toast.message }}</span>
      </div>
    </Transition>
  `
}
