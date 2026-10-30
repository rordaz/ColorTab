# Release Notes

## [1.2.1] - 2026-10-29

### 🐛 Fixes

- **Plugin Guideline Compliance** – Remove debug logging, use Obsidian DOM helpers for dynamic elements and CSS helpers for runtime styles, and use explicit hex formatting for generated shades.

---

## [1.2.0] - 2026-10-29

### ✨ Features

- **Color Shade Submenu** – Choose darker or lighter shades from the selected palette color's tab context-menu submenu.
- **WCAG 2.1 Text Contrast** – Optionally ensure colored tab titles meet the 4.5:1 AA contrast ratio while preserving theme colors when they already pass.
- **Remove Color on Closing** – Optional setting that removes a file's saved tab color when its last open tab closes. The color remains while another tab for the same file is open.

### 🐛 Fixes

- **Inactive Tab Color Restoration** – Restore saved colors for background tabs during startup, including tabs Obsidian has not loaded yet.
- **Modifier-Click History Navigation** – Preserve Ctrl/Cmd-click Back and Forward navigation into a new tab while duplicate-tab prevention is enabled.

### 🙏 Contributors

Thanks to [@xRyul](https://github.com/xRyul) for [PR #2](https://github.com/rordaz/ColorTab/pull/2), [PR #3](https://github.com/rordaz/ColorTab/pull/3), [PR #4](https://github.com/rordaz/ColorTab/pull/4), and [PR #5](https://github.com/rordaz/ColorTab/pull/5).

---

## [1.1.4] - 2026-06-29

### 🐛 Fixes

- **Settings Toggle Reliability** – Replaced framework-managed toggle controls with explicit `addToggle` rendering, ensuring `onChange` callbacks fire correctly across all Obsidian versions
- **Reset Button Styling** – Replaced deprecated `.setDestructive()` API call with direct CSS class assignment (`mod-destructive`) for broader Obsidian compatibility
- **Settings Page Refresh** – Fixed settings page not properly refreshing after "Reset to Defaults" action (`this.update()` → `this.display()`)
- **Redundant Color Re-application** – Removed `setControlValue` override that triggered unnecessary color re-application on every settings toggle change

---

## [1.1.3] - 2026-06-27

### ✨ Improvements

- **Broader Obsidian Compatibility** – Lowered minimum required Obsidian version from `1.13.0` to `1.12.0`, allowing the plugin to be installed on Obsidian 1.12.x
- **Release Automation** – GitHub Releases now use the matching section from this repository's release notes as the published release description

---

## [1.1.2] - 2026-06-23

### ✨ Improvements

- **Release Automation** – GitHub Releases now use the matching section from this repository's release notes as the published release description

---

## [1.1.1] - 2026-06-23

### 🐛 Fixes

- **Tab Closing on Duplicate Prevention** – Fixed bug where Prevent Tab Duplication was closing sidebar views and local graphs
  - Sidebar panels (Outline, File Properties, Backlinks) no longer affected
  - Local graph, graph, and other auxiliary views now properly excluded
  - Only actual document tabs (markdown/file views) are now colored and managed
- **Excalidraw Tab Support** – Fixed issue where Excalidraw files could not be colored or managed by the plugin
  - Excalidraw tabs now use the same tab coloring and pinning logic as regular document tabs

---

## [1.1.0] - 2026-06-19

### ✨ Features

- **Prevent Tab Duplication** – New settings toggle to prevent opening duplicate tabs of the same file
  - When enabled, opening an already-open file will focus on the existing tab instead of creating a duplicate
  - Particularly useful for maintaining clean workspace organization alongside colored tabs

### 🐛 Fixes

- **Settings UI Fallback** – Added robust fallback renderer for older Obsidian versions
  - Ensures settings page renders correctly across all Obsidian versions ≥ 1.13.0
  - Fixes blank settings page issue on environments that don't consume the new settings API

### 📚 Documentation

- Updated README with "Prevent Tab Duplication" setting description

---

## [1.0.4] - 2026-06-15

### ✨ Features

- Initial stable release with core Color Tab functionality

### 📋 Previous Changes (1.0.0 – 1.0.3)

- Tab coloring with customizable color palette
- Auto-pin colored tabs support
- Popout window support
- Settings UI with live preview
