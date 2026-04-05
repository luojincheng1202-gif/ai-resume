import { renderClassicTemplate }   from './classic.js'
import { renderModernTemplate }    from './modern.js'
import { renderExecutiveTemplate } from './executive.js'
import { renderSidebarTemplate }   from './sidebar.js'
import { renderCompactTemplate }   from './compact.js'
import { renderElegantTemplate }   from './elegant.js'
import { renderCreativeTemplate }  from './creative.js'
import { renderTimelineTemplate }  from './timeline.js'
import { renderTechnicalTemplate } from './technical.js'
import { renderCleanTemplate }     from './clean.js'
import { renderBoldTemplate }      from './bold.js'
import { renderAcademicTemplate }  from './academic.js'

export const BUILTIN_TEMPLATES = [
  { id: 'classic',   name: '经典',   nameEn: 'Classic',    fn: renderClassicTemplate },
  { id: 'modern',    name: '简约',   nameEn: 'Modern',     fn: renderModernTemplate },
  { id: 'executive', name: '商务',   nameEn: 'Executive',  fn: renderExecutiveTemplate },
  { id: 'sidebar',   name: '双栏',   nameEn: 'Sidebar',    fn: renderSidebarTemplate },
  { id: 'compact',   name: '紧凑',   nameEn: 'Compact',    fn: renderCompactTemplate },
  { id: 'elegant',   name: '优雅',   nameEn: 'Elegant',    fn: renderElegantTemplate },
  { id: 'creative',  name: '创意',   nameEn: 'Creative',   fn: renderCreativeTemplate },
  { id: 'timeline',  name: '时间轴', nameEn: 'Timeline',   fn: renderTimelineTemplate },
  { id: 'technical', name: '技术',   nameEn: 'Technical',  fn: renderTechnicalTemplate },
  { id: 'clean',     name: '极简',   nameEn: 'Clean',      fn: renderCleanTemplate },
  { id: 'bold',      name: '粗体',   nameEn: 'Bold',       fn: renderBoldTemplate },
  { id: 'academic',  name: '学术',   nameEn: 'Academic',   fn: renderAcademicTemplate },
]

/**
 * Returns a render function for the given template id.
 * Falls back to classic if id is not found.
 */
export function getTemplateRenderer(id) {
  const tpl = BUILTIN_TEMPLATES.find(t => t.id === id)
  return tpl ? tpl.fn : renderClassicTemplate
}
