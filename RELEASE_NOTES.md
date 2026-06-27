# Release Notes

## [1.1.3] - 2026-06-27

### ✨ Improvements

- **Broader Obsidian Compatibility** – Lowered minimum required Obsidian version from `1.13.0` to `1.12.0`, allowing the plugin to be installed on Obsidian 1.12.x

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
