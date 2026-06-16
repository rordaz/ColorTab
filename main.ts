import {
	App,
	Menu,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";

interface ColorEntry {
	name: string;
	color: string;
}

interface ColorTabSettings {
	colors: ColorEntry[];
	/** Maps file path → hex color */
	fileColors: Record<string, string>;
	autoPinColoredTabs: boolean;
}

const DEFAULT_COLORS: ColorEntry[] = [
	{ name: "Red",      color: "#FFB3BA" },
	{ name: "Yellow",   color: "#FFDFBA" },
	{ name: "Green",    color: "#B5EAD7" },
	{ name: "Blue",     color: "#BAE1FF" },
	{ name: "Lavender", color: "#E2BAFF" },
];

const DEFAULT_SETTINGS: ColorTabSettings = {
	colors: DEFAULT_COLORS,
	fileColors: {},
	autoPinColoredTabs: true,
};

export default class ColorTabPlugin extends Plugin {
	settings!: ColorTabSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ColorTabSettingTab(this.app, this));

		// Append color options to Obsidian's native tab context menu
		this.registerEvent(
			this.app.workspace.on(
				"file-menu",
				(menu, _file, source, leaf) => {
					if (source !== "tab-header" || !leaf) return;
					this.addColorMenuItems(menu, leaf);
				}
			)
		);

		// Re-apply stored colors whenever the layout changes
		this.registerEvent(
			this.app.workspace.on("layout-change", () =>
				this.applyAllColors()
			)
		);

		// Clear/apply color when a new file is loaded into any leaf
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () =>
				this.applyAllColors()
			)
		);

		this.app.workspace.onLayoutReady(() => {
			this.applyAllColors();
			this.registerColorCommands();
		});
	}

	// ── Commands (hotkeys) ────────────────────────────────────────────────────

	private registerColorCommands() {
		this.settings.colors.forEach(({ name, color }) => {
			this.addCommand({
				id: `set-${name.toLowerCase().replace(/\s+/g, "-")}`,			
				name: `Set tab color: ${name}`,
				checkCallback: (checking: boolean) => {
					const leaf = this.app.workspace.getMostRecentLeaf();
					if (!leaf || !this.isColorableLeaf(leaf)) return false;
					if (!checking) this.setTabColor(leaf, color);
					return true;
				},
			});
		});

		this.addCommand({
			id: "remove",
			name: "Remove tab color",
			checkCallback: (checking: boolean) => {
				const leaf = this.app.workspace.getMostRecentLeaf();
				if (!leaf || !this.isColorableLeaf(leaf)) return false;
				if (!checking) this.removeTabColor(leaf);
				return true;
			},
		});

		this.addCommand({
			id: "remove-all",
			name: "Remove all tabs' color",
			callback: () => this.removeAllTabColors(),
		});
	}

	// ── Context menu ──────────────────────────────────────────────────────────

	private addColorMenuItems(menu: Menu, leaf: WorkspaceLeaf) {
		if (!this.isColorableLeaf(leaf)) return;

		menu.addSeparator();

		this.settings.colors.forEach(({ name, color }) => {
			menu.addItem((item) => {
				item.setTitle(name);
				item.onClick(() => this.setTabColor(leaf, color));

				const el = (item as unknown as { dom: HTMLElement }).dom;
				if (el) {
					const swatch = el.createEl("span", { cls: "color-tab-swatch" });
					swatch.style.setProperty("--swatch-color", color);
				}
			});
		});

		menu.addItem((item) => {
			item.setTitle("Remove tab color");
			item.setIcon("x");
			item.onClick(() => this.removeTabColor(leaf));
		});

		menu.addItem((item) => {
			item.setTitle("Remove all tabs' color");
			item.setIcon("x-circle");
			item.onClick(() => this.removeAllTabColors());
		});
	}

	// ── Color application ─────────────────────────────────────────────────────

	setTabColor(leaf: WorkspaceLeaf, color: string) {
		if (!this.isColorableLeaf(leaf)) return;

		const path = this.getFilePath(leaf);
		if (path) {
			this.settings.fileColors[path] = color;
				void this.saveSettings();
		}
		this.applyColorToLeaf(leaf, color);
		if (this.settings.autoPinColoredTabs) {
			leaf.setPinned(true);
		}
	}

	removeTabColor(leaf: WorkspaceLeaf) {
		if (!this.isColorableLeaf(leaf)) return;

		const path = this.getFilePath(leaf);
		if (path) {
			delete this.settings.fileColors[path];
				void this.saveSettings();
		}
		this.applyColorToLeaf(leaf, null);
		if (this.settings.autoPinColoredTabs) {
			leaf.setPinned(false);
		}
	}

	removeAllTabColors() {
		const coloredPaths = new Set(Object.keys(this.settings.fileColors));
		this.settings.fileColors = {};
		void this.saveSettings();
		this.app.workspace.iterateAllLeaves((leaf) => {
			this.applyColorToLeaf(leaf, null);
			const path = this.getFilePath(leaf);
			if (
				this.settings.autoPinColoredTabs &&
				path &&
				coloredPaths.has(path)
			) {
				leaf.setPinned(false);
			}
		});
	}

	applyColorToLeaf(leaf: WorkspaceLeaf, color: string | null) {
		const tabHeader = (
			leaf as unknown as { tabHeaderEl: HTMLElement }
		).tabHeaderEl;
		if (!tabHeader) return;

		if (color) {
			tabHeader.style.setProperty("--tab-bg-color", color);
			tabHeader.classList.add("color-tab-colored");
		} else {
			tabHeader.style.removeProperty("--tab-bg-color");
			tabHeader.classList.remove("color-tab-colored");
		}
	}

	applyAllColors() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (!this.isColorableLeaf(leaf)) {
				// Strip any color/pin previously applied by this plugin to sidebar leaves
				const tabHeader = (
					leaf as unknown as { tabHeaderEl?: HTMLElement }
				).tabHeaderEl;
				if (tabHeader?.classList.contains("color-tab-colored")) {
					this.applyColorToLeaf(leaf, null);
					if (this.settings.autoPinColoredTabs) leaf.setPinned(false);
				}
				return;
			}
			const path = this.getFilePath(leaf)!;
			const color = this.settings.fileColors[path] ?? null;
			this.applyColorToLeaf(leaf, color);
			if (this.settings.autoPinColoredTabs && color) {
				leaf.setPinned(true);
			}
		});
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	private getFilePath(leaf: WorkspaceLeaf): string | null {
		const file = (leaf.view as unknown as { file?: { path: string } })
			?.file;
		return file?.path ?? null;
	}

	private isColorableLeaf(leaf: WorkspaceLeaf): boolean {
		if (this.getFilePath(leaf) === null) return false;
		// Exclude sidebar leaves (Outline, File Properties, Backlinks, etc.)
		// which are file-aware but must not be colored.
		// Allow leaves in the main window AND in any popout window.
		const root = leaf.getRoot();
		const ws = this.app.workspace as unknown as {
			leftSplit: unknown;
			rightSplit: unknown;
		};
		if (root === ws.leftSplit || root === ws.rightSplit) return false;
		return true;
	}

	// ── Settings persistence ──────────────────────────────────────────────────

	async loadSettings() {
		const saved = await this.loadData() as Partial<ColorTabSettings> | null;
		this.settings = {
			colors: saved?.colors ?? DEFAULT_COLORS.map((c) => ({ ...c })),
			fileColors: saved?.fileColors ?? {},
			autoPinColoredTabs: saved?.autoPinColoredTabs ?? DEFAULT_SETTINGS.autoPinColoredTabs,
		};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// ── Settings tab ──────────────────────────────────────────────────────────────

class ColorTabSettingTab extends PluginSettingTab {
	plugin: ColorTabPlugin;

	constructor(app: App, plugin: ColorTabPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Color Tab – Settings")
			.setHeading()
			.setDesc("Customize the 5 colors shown in the tab context menu.");

		this.plugin.settings.colors.forEach((entry, index) => {
			let hexInputEl: HTMLInputElement;
			let colorPickerEl: HTMLInputElement;
			let swatchEl: HTMLSpanElement;

			const setting = new Setting(containerEl)
				.setName(`Color ${index + 1}`)
				// ── Meaning / name field ──────────────────────────────────
				.addText((text) => {
					text.setPlaceholder("Meaning")
						.setValue(entry.name)
						.onChange(async (value) => {
							this.plugin.settings.colors[index].name = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.setCssStyles({ width: "120px" });
					text.inputEl.setAttribute("aria-label", "Color meaning / name");
				})
				// ── Hex code text input ───────────────────────────────────
				.addText((hex) => {
					hex.setPlaceholder("#rrggbb")
						.setValue(entry.color)
						.onChange(async (value) => {
							const normalized = value.trim();
							if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return;
							this.plugin.settings.colors[index].color = normalized;
							await this.plugin.saveSettings();
							this.plugin.applyAllColors();
							if (colorPickerEl) colorPickerEl.value = normalized;
							if (swatchEl) swatchEl.style.backgroundColor = normalized;
						});
					hex.inputEl.setCssStyles({ width: "88px", fontFamily: "monospace" });
					hex.inputEl.setAttribute("aria-label", "Hex color code");
					hexInputEl = hex.inputEl;
				})
				// ── Color picker ──────────────────────────────────────────
				.addColorPicker((picker) => {
					picker
						.setValue(entry.color)
						.onChange(async (value) => {
							this.plugin.settings.colors[index].color = value;
							await this.plugin.saveSettings();
							this.plugin.applyAllColors();
							if (hexInputEl) hexInputEl.value = value;
							if (swatchEl) swatchEl.style.backgroundColor = value;
						});
				});

			// Live swatch preview
			swatchEl = setting.controlEl.createEl("span", {
				cls: "color-tab-settings-swatch",
			});
			swatchEl.style.backgroundColor = entry.color;

			// Grab the native <input type="color"> for cross-sync
			colorPickerEl = setting.controlEl.querySelector(
				"input[type=color]"
			) as HTMLInputElement;

			// Keep hex field in sync when the native picker is dragged
			colorPickerEl?.addEventListener("input", () => {
				if (hexInputEl) hexInputEl.value = colorPickerEl.value;
				if (swatchEl) swatchEl.style.backgroundColor = colorPickerEl.value;
			});
		});

		new Setting(containerEl)
			.setName("Auto-pin colored tabs")
			.setDesc(
				"When enabled, applying a tab color pins the tab and removing color unpins it."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoPinColoredTabs)
					.onChange(async (value) => {
						this.plugin.settings.autoPinColoredTabs = value;
						await this.plugin.saveSettings();
						this.plugin.applyAllColors();
					});
			});

		new Setting(containerEl)
			.setName("Reset to defaults")
			.setDesc("Restore the original pastel color palette.")
			.addButton((btn) => {
				btn.setButtonText("Reset")
					.setDestructive()
					.onClick(async () => {
						this.plugin.settings.colors = DEFAULT_COLORS.map(
							(c) => ({ ...c })
						);
						this.plugin.settings.autoPinColoredTabs =
							DEFAULT_SETTINGS.autoPinColoredTabs;
						await this.plugin.saveSettings();
						this.plugin.applyAllColors();
						this.display();
					});
			});
	}
}
