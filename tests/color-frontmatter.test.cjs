const assert = require("node:assert/strict");
const { test } = require("node:test");
const vm = require("node:vm");
const { buildSync } = require("esbuild");

const source = buildSync({
  entryPoints: ["main.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["obsidian"],
  write: false,
}).outputFiles[0].text;

class TFile {
  constructor(path) {
    this.path = path;
    this.extension = path.split(".").pop();
  }
}

function setup(paths = ["Note.md"]) {
  const notices = [];
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: () => ({
      Plugin: class {},
      PluginSettingTab: class {},
      TFile,
      Notice: class {
        constructor(message) {
          notices.push(message);
        }
      },
    }),
  });
  const plugin = new module.exports.default();
  const files = new Map(paths.map((path) => [path, new TFile(path)]));
  const properties = new Map(paths.map((path) => [path, { title: "Keep me" }]));
  const leaves = paths.map((path) => ({
    view: { file: files.get(path) },
    getRoot: () => "main",
    getViewState: () => ({ type: "markdown" }),
    setPinned: () => {},
  }));
  plugin.settings = {
    colors: [{ name: "Red", color: "#FFB3BA" }],
    fileColors: {},
    fileColorSlots: {},
    autoPinColoredTabs: false,
    removeColorOnClosing: false,
  };
  plugin.saveSettings = async () => {};
  plugin.app = {
    vault: { getAbstractFileByPath: (path) => files.get(path) },
    fileManager: {
      processFrontMatter: async (file, callback) =>
        callback(properties.get(file.path)),
    },
    workspace: { iterateAllLeaves: (callback) => leaves.forEach(callback) },
  };
  return { plugin, leaves, properties, notices };
}

test("assigning a color adds its lowercase palette name and preserves other properties", () => {
  const { plugin, leaves, properties } = setup();
  plugin.setTabColor(leaves[0], "#FFB3BA", 0);
  assert.deepEqual(properties.get("Note.md"), {
    title: "Keep me",
    "color-tab": "red",
  });
});

test("shades retain the customized palette name", () => {
  const { plugin, leaves, properties } = setup();
  plugin.settings.colors[0].name = " In Progress ";
  plugin.setTabColor(leaves[0], "#cc8f95", 0);
  assert.equal(properties.get("Note.md")["color-tab"], "in progress");
});

test("removing a color leaves the property present but unset", () => {
  const { plugin, leaves, properties } = setup();
  plugin.setTabColor(leaves[0], "#FFB3BA", 0);
  plugin.removeTabColor(leaves[0]);
  assert.equal(properties.get("Note.md")["color-tab"], null);
  assert.ok(Object.hasOwn(properties.get("Note.md"), "color-tab"));
  assert.equal(properties.get("Note.md").title, "Keep me");
});

test("remove-all clears properties for closed files too", () => {
  const { plugin, leaves, properties } = setup(["Note.md", "Closed.md"]);
  leaves.forEach((leaf) => plugin.setTabColor(leaf, "#FFB3BA", 0));
  leaves.pop();
  plugin.removeAllTabColors();
  for (const frontmatter of properties.values()) {
    assert.equal(frontmatter["color-tab"], null);
  }
});

test("closing the last colored tab clears its property when enabled", () => {
  const { plugin, leaves, properties } = setup();
  plugin.settings.removeColorOnClosing = true;
  plugin.setTabColor(leaves[0], "#FFB3BA", 0);
  plugin.applyAllColors();
  leaves.pop();
  plugin.applyAllColors();
  assert.equal(properties.get("Note.md")["color-tab"], null);
});

test("non-Markdown files are not modified", () => {
  const { plugin, leaves, properties } = setup(["Drawing.excalidraw"]);
  plugin.setTabColor(leaves[0], "#FFB3BA", 0);
  plugin.removeTabColor(leaves[0]);
  assert.ok(!Object.hasOwn(properties.get("Drawing.excalidraw"), "color-tab"));
});

test("frontmatter failures notify the user without rejecting", async () => {
  const { plugin, notices } = setup();
  plugin.app.fileManager.processFrontMatter = async () => {
    throw new Error("Read only");
  };
  await plugin.updateColorProperty("Note.md", "red");
  assert.equal(notices.length, 1);
  assert.match(notices[0], /could not update/);
});
