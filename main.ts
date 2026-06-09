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
};

export default class ColorTabPlugin extends Plugin {
	settings: ColorTabSettings;

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

		this.app.workspace.onLayoutReady(() => this.applyAllColors());
	}

	// ── Context menu ──────────────────────────────────────────────────────────

	private addColorMenuItems(menu: Menu, leaf: WorkspaceLeaf) {
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
		const path = this.getFilePath(leaf);
		if (path) {
			this.settings.fileColors[path] = color;
			this.saveSettings();
		}
		this.applyColorToLeaf(leaf, color);
	}

	removeTabColor(leaf: WorkspaceLeaf) {
		const path = this.getFilePath(leaf);
		if (path) {
			delete this.settings.fileColors[path];
			this.saveSettings();
		}
		this.applyColorToLeaf(leaf, null);
	}

	removeAllTabColors() {
		this.settings.fileColors = {};
		this.saveSettings();
		this.app.workspace.iterateAllLeaves((leaf) =>
			this.applyColorToLeaf(leaf, null)
		);
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
			const path = this.getFilePath(leaf);
			const color = path ? (this.settings.fileColors[path] ?? null) : null;
			this.applyColorToLeaf(leaf, color);
		});
	}

	// ── Helpers ───────────────────────────────────────────────────────────────

	private getFilePath(leaf: WorkspaceLeaf): string | null {
		const file = (leaf.view as unknown as { file?: { path: string } })
			?.file;
		return file?.path ?? null;
	}

	// ── Settings persistence ──────────────────────────────────────────────────

	async loadSettings() {
		const saved = await this.loadData();
		this.settings = {
			colors: saved?.colors ?? DEFAULT_COLORS.map((c) => ({ ...c })),
			fileColors: saved?.fileColors ?? {},
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

		containerEl.createEl("h2", { text: "Color Tab – Settings" });
		containerEl.createEl("p", {
			text: "Customize the 5 colors shown in the tab context menu.",
			cls: "color-tab-settings-desc",
		});

		this.plugin.settings.colors.forEach((entry, index) => {
			const setting = new Setting(containerEl)
				.setName(`Color ${index + 1}`)
				.addText((text) => {
					text.setPlaceholder("Name")
						.setValue(entry.name)
						.onChange(async (value) => {
							this.plugin.settings.colors[index].name = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.style.width = "140px";
				})
				.addColorPicker((picker) => {
					picker
						.setValue(entry.color)
						.onChange(async (value) => {
							this.plugin.settings.colors[index].color = value;
							await this.plugin.saveSettings();
							// Re-apply updated colors live
							this.plugin.applyAllColors();
						});
				});

			// Live swatch preview next to the controls
			const swatch = setting.controlEl.createEl("span", {
				cls: "color-tab-settings-swatch",
			});
			swatch.style.backgroundColor = entry.color;

			// Keep swatch in sync when picker changes
			const picker = setting.controlEl.querySelector(
				"input[type=color]"
			) as HTMLInputElement | null;
			picker?.addEventListener("input", () => {
				swatch.style.backgroundColor = picker.value;
			});
		});

		new Setting(containerEl)
			.setName("Reset to defaults")
			.setDesc("Restore the original pastel color palette.")
			.addButton((btn) => {
				btn.setButtonText("Reset")
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.colors = DEFAULT_COLORS.map(
							(c) => ({ ...c })
						);
						await this.plugin.saveSettings();
						this.plugin.applyAllColors();
						this.display();
					});
			});
	}
}
