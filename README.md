# Color Tab

An [Obsidian](https://obsidian.md) plugin that lets you assign a background color to any open tab, making it easy to visually distinguish notes at a glance.

---

## Why use Color Tab?

When working with several notes simultaneously — researching, cross-referencing, or writing — it can be hard to quickly jump to the right tab. Color Tab lets you **visually tag each tab with a color**, so you can cycle through your open notes faster and reduce mental overhead.

Examples of how people use it:

- 🔴 **Red** – notes that still need work or are blocking something
- 🟡 **Yellow** – reference material you keep coming back to
- 🟢 **Green** – notes that are done / reviewed
- 🔵 **Blue** – the note you are actively writing
- 🟣 **Lavender** – meeting notes or daily logs

---

## How to install

1. Copy `main.js`, `manifest.json`, and `styles.css` into your vault at:
   ```
   <your-vault>/.obsidian/plugins/color-tab/
   ```
2. Open Obsidian → **Settings → Community Plugins**.
3. Disable **Safe Mode** if prompted.
4. Find **Color Tab** in the list and toggle it **on**.

## How to use

### Assign a color to a tab

1. **Right-click** on any open tab header.
2. The default Obsidian context menu will appear (Close, Pin, etc.).
3. Scroll to the bottom — you will see a separator followed by the 5 color options.
4. Click a color name to apply it. The tab background and title will update immediately.

### Remove a color

1. Right-click the colored tab.
2. Click **Remove tab color** at the bottom of the menu.

### Customize your colors

1. Go to **Settings → Color Tab**.
2. Each of the 5 color slots has a **name field** and a **color picker**.
3. Changes take effect immediately — open tabs update live.
4. Click **Reset** to restore the default pastel palette.

## Default colors

| Slot | Name     | Hex       |
| ---- | -------- | --------- |
| 1    | Red      | `#FFB3BA` |
| 2    | Yellow   | `#FFDFBA` |
| 3    | Green    | `#B5EAD7` |
| 4    | Blue     | `#BAE1FF` |
| 5    | Lavender | `#E2BAFF` |

All defaults are soft pastels so they remain readable in both light and dark themes.

## License

MIT
