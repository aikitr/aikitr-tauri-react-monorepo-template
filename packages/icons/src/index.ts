/**
 * 应用图标系统
 *
 * 规范：
 * - 基础图标直接来自 lucide-react（禁止硬编码 SVG，保持一致性）
 * - 业务图标以 AiIcon* 命名，并从这里统一 re-export
 * - 保证所有图标支持 size/className 两个基础属性
 */

// ── 基础图标（lucide-react 二次导出，便于统一替换） ──
export {
  Menu as UiIconMenu,
  X as UiIconX,
  Home as UiIconHome,
  Settings as UiIconSettings,
  User as UiIconUser,
  LogIn as UiIconLogin,
  LogOut as UiIconLogout,
  Search as UiIconSearch,
  Folder as UiIconFolder,
  FolderOpen as UiIconFolderOpen,
  File as UiIconFile,
  ChevronRight as UiIconChevronRight,
  ChevronDown as UiIconChevronDown,
  ChevronLeft as UiIconChevronLeft,
  Check as UiIconCheck,
  AlertTriangle as UiIconAlertTriangle,
  Info as UiIconInfo,
  Loader2 as UiIconLoader2,
  Sun as UiIconSun,
  Moon as UiIconMoon,
  Minus as UiIconMinimize,
  Square as UiIconMaximize,
  Minimize2 as UiIconRestore,
  type LucideIcon as UiIconType,
} from "lucide-react";
