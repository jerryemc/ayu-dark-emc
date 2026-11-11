#!/usr/bin/env node
// Build the VS Code color theme from the Emacs palette.
//
// The palette is read straight from themes/emacs/ayu-dark-emc-theme.el, so the
// Emacs file stays the single source of truth: edit a color there, run
// `npm run build`, and the VS Code theme follows.
//
// Role choices follow the faces in emc-theme-faces.el (font-lock-* for syntax,
// mode-line / corfu / vertico / diff-hl / ansi-color for the UI).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const elFile = process.env.EMACS_THEME
  ?? resolve(root, "..", "themes", "emacs", "ayu-dark-emc-theme.el");
const outFile = resolve(root, "themes", "ayu-dark-emc-color-theme.json");

// ---------------------------------------------------------------- palette ---

function readPalette(file) {
  const src = readFileSync(file, "utf8");
  const pal = {};
  // (name "#RRGGBB")
  for (const m of src.matchAll(/\(\s*([a-z0-9-]+)\s+"(#[0-9A-Fa-f]{6})"\s*\)/g)) {
    pal[m[1]] = m[2].toUpperCase();
  }
  // (alias other-name)  -- role names that point at another palette entry
  for (const m of src.matchAll(/\(\s*([a-z0-9-]+)\s+([a-z][a-z0-9-]*)\s*\)/g)) {
    if (!(m[1] in pal) && m[2] in pal) pal[m[1]] = pal[m[2]];
  }
  return pal;
}

const P = readPalette(elFile);
if (Object.keys(P).length < 60) {
  throw new Error(`Only ${Object.keys(P).length} colors parsed from ${elFile}`);
}

/** Palette color by name; throws on typos so a bad name never ships. */
function c(name) {
  const v = P[name];
  if (!v) throw new Error(`Unknown palette color: ${name}`);
  return v;
}

const hex2 = (n) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Color with an alpha channel (0..1). */
function a(name, alpha) {
  return c(name) + hex2(alpha * 255);
}

/**
 * Translucent color that, drawn over `bg`, looks exactly like `target`.
 * VS Code layers selections, find matches and diff highlights on top of each
 * other, so these need alpha; this keeps the Emacs look on the plain
 * background while letting the layers underneath show through.
 */
function over(target, alpha, bg = "default-black") {
  const t = rgb(c(target));
  const b = rgb(c(bg));
  const f = t.map((tv, i) => Math.min(255, Math.max(0, b[i] + (tv - b[i]) / alpha)));
  return "#" + f.map(hex2).join("") + hex2(alpha * 255);
}

const none = "#00000000";

// ------------------------------------------------------------- workbench ---

const bg = c("default-black");      // editor, sidebar, panels
const fg = c("default-white");      // editor text
const uiFg = c("yellow-white");     // mode-line / minibuffer text
const popup = c("dark-black");      // corfu, vertico-posframe, company
const surface = c("blue-black");    // lazy-highlight, vertico-current
const border = c("black-black");    // window-divider, vertical-border
const accent = c("light-orange");   // cursor, keywords, isearch
const muted = c("white-grey");
const dim = c("default-grey");      // comments, line numbers
const hl = c("dark-grey");          // hl-line

const errorC = c("light-red");      // flycheck/flymake error
const warnC = c("light-yellow");    // flycheck warning (function-yellow)
const infoC = c("light-lime");      // flycheck info
const added = c("light-lime");      // diff-hl-insert
const changed = c("light-yellow");  // diff-hl-change
const removed = c("light-red");     // diff-hl-delete

const colors = {
  // Base
  "foreground": uiFg,
  "descriptionForeground": muted,
  "disabledForeground": dim,
  "errorForeground": errorC,
  "focusBorder": a("dark-orange", 0.8),
  "icon.foreground": muted,
  "selection.background": a("light-orange", 0.3),
  "widget.border": surface,
  "widget.shadow": "#00000080",
  "sash.hoverBorder": c("dark-orange"),
  "scrollbar.shadow": "#00000066",
  "textLink.foreground": c("light-blue"),
  "textLink.activeForeground": c("bright-blue"),
  "textPreformat.foreground": c("light-lime"),
  "textPreformat.background": popup,
  "textBlockQuote.background": popup,
  "textBlockQuote.border": c("grey-orange"),
  "textCodeBlock.background": border,
  "textSeparator.foreground": hl,

  // Title bar / command center
  "titleBar.activeBackground": bg,
  "titleBar.activeForeground": uiFg,
  "titleBar.inactiveBackground": bg,
  "titleBar.inactiveForeground": dim,
  "titleBar.border": border,
  "commandCenter.background": popup,
  "commandCenter.foreground": muted,
  "commandCenter.border": hl,
  "commandCenter.activeBackground": hl,
  "commandCenter.activeForeground": fg,
  "commandCenter.activeBorder": c("grey-orange"),
  "commandCenter.inactiveBorder": popup,

  // Activity bar
  "activityBar.background": bg,
  "activityBar.foreground": uiFg,
  "activityBar.inactiveForeground": dim,
  "activityBar.border": border,
  "activityBar.activeBorder": accent,
  "activityBarBadge.background": accent,
  "activityBarBadge.foreground": bg,
  "activityBarTop.foreground": uiFg,
  "activityBarTop.inactiveForeground": dim,
  "activityBarTop.activeBorder": accent,

  // Side bar (treemacs)
  "sideBar.background": bg,
  "sideBar.foreground": uiFg,
  "sideBar.border": border,
  "sideBarTitle.foreground": uiFg,
  "sideBarSectionHeader.background": bg,
  "sideBarSectionHeader.foreground": c("light-purple"), // treemacs-root-face
  "sideBarSectionHeader.border": border,
  "sideBarStickyScroll.background": bg,
  "sideBarStickyScroll.shadow": "#00000080",

  // Lists and trees (vertico)
  "list.activeSelectionBackground": surface,
  "list.activeSelectionForeground": c("light-blue"),
  "list.activeSelectionIconForeground": c("light-blue"),
  "list.inactiveSelectionBackground": popup,
  "list.inactiveSelectionForeground": fg,
  "list.focusBackground": surface,
  "list.focusForeground": c("light-blue"),
  "list.focusOutline": a("dark-blue", 0.8),
  "list.inactiveFocusOutline": none,
  "list.hoverBackground": popup,
  "list.hoverForeground": fg,
  "list.highlightForeground": warnC,              // completions-common-part
  "list.focusHighlightForeground": c("bright-yellow"),
  "list.errorForeground": errorC,
  "list.warningForeground": warnC,
  "list.invalidItemForeground": c("medium-red"),
  "list.deemphasizedForeground": dim,
  "list.dropBackground": a("blue-black", 0.9),
  "list.filterMatchBackground": a("light-orange", 0.2),
  "list.filterMatchBorder": a("light-orange", 0.5),
  "listFilterWidget.background": popup,
  "listFilterWidget.outline": accent,
  "listFilterWidget.noMatchesOutline": errorC,
  "tree.indentGuidesStroke": hl,
  "tree.inactiveIndentGuidesStroke": a("dark-grey", 0.5),
  "pickerGroup.foreground": c("bright-blue"),     // vertico-group-title
  "pickerGroup.border": surface,
  "quickInput.background": popup,                 // vertico-posframe
  "quickInput.foreground": fg,
  "quickInputTitle.background": surface,
  "quickInputList.focusBackground": surface,      // vertico-current
  "quickInputList.focusForeground": c("light-blue"),
  "quickInputList.focusIconForeground": c("light-blue"),

  // Inputs, dropdowns, buttons, checkboxes
  "input.background": popup,
  "input.foreground": uiFg,
  "input.border": hl,
  "input.placeholderForeground": dim,
  "inputOption.activeBackground": a("light-orange", 0.2),
  "inputOption.activeBorder": a("light-orange", 0.6),
  "inputOption.activeForeground": accent,
  "inputOption.hoverBackground": hl,
  "inputValidation.errorBackground": c("black-red"),
  "inputValidation.errorBorder": errorC,
  "inputValidation.warningBackground": c("black-yellow"),
  "inputValidation.warningBorder": warnC,
  "inputValidation.infoBackground": c("black-blue"),
  "inputValidation.infoBorder": c("light-blue"),
  "dropdown.background": popup,
  "dropdown.listBackground": popup,
  "dropdown.foreground": uiFg,
  "dropdown.border": hl,
  "button.background": accent,
  "button.foreground": bg,
  "button.hoverBackground": c("bright-orange"),
  "button.border": none,
  "button.separator": a("default-black", 0.4),
  "button.secondaryBackground": hl,
  "button.secondaryForeground": fg,
  "button.secondaryHoverBackground": c("black-orange"),
  "checkbox.background": popup,
  "checkbox.foreground": fg,
  "checkbox.border": hl,
  "badge.background": accent,
  "badge.foreground": bg,
  "progressBar.background": accent,
  "keybindingLabel.background": a("dark-grey", 0.6),
  "keybindingLabel.foreground": fg,
  "keybindingLabel.border": hl,
  "keybindingLabel.bottomBorder": border,
  "toolbar.hoverBackground": hl,
  "toolbar.activeBackground": a("dark-grey", 0.8),

  // Menus, notifications
  "menu.background": popup,
  "menu.foreground": fg,
  "menu.selectionBackground": surface,
  "menu.selectionForeground": c("light-blue"),
  "menu.separatorBackground": hl,
  "menu.border": border,
  "notifications.background": popup,
  "notifications.foreground": fg,
  "notifications.border": surface,
  "notificationCenterHeader.background": surface,
  "notificationCenterHeader.foreground": uiFg,
  "notificationToast.border": surface,
  "notificationsErrorIcon.foreground": errorC,
  "notificationsWarningIcon.foreground": warnC,
  "notificationsInfoIcon.foreground": c("light-blue"),
  "notificationLink.foreground": c("light-blue"),

  // Editor
  "editor.background": bg,
  "editor.foreground": fg,
  "editorCursor.foreground": accent,
  "editorCursor.background": bg,
  "editor.selectionBackground": over("selected-orange", 0.4),
  "editor.inactiveSelectionBackground": over("selected-orange", 0.25),
  "editor.selectionHighlightBackground": over("blue-black", 0.5),
  "editor.selectionHighlightBorder": a("black-blue", 0.8),
  "editor.wordHighlightBackground": over("blue-black", 0.5),
  "editor.wordHighlightStrongBackground": over("black-blue", 0.5),
  "editor.wordHighlightTextBackground": over("blue-black", 0.5),
  "editor.findMatchBackground": a("light-orange", 0.4),       // isearch
  "editor.findMatchBorder": accent,
  "editor.findMatchHighlightBackground": over("black-blue", 0.5), // lazy-highlight
  "editor.findMatchHighlightBorder": none,
  "editor.findRangeHighlightBackground": a("dark-grey", 0.4),
  "editor.lineHighlightBackground": hl,                       // hl-line
  "editor.lineHighlightBorder": none,
  "editor.rangeHighlightBackground": a("blue-black", 0.6),
  "editor.symbolHighlightBackground": a("light-orange", 0.2),
  "editor.hoverHighlightBackground": a("blue-black", 0.7),
  "editor.linkedEditingBackground": a("black-blue", 0.4),
  "editor.snippetTabstopHighlightBackground": a("blue-black", 0.9), // yas-field
  "editor.snippetFinalTabstopHighlightBorder": c("grey-orange"),
  "editor.foldBackground": a("blue-black", 0.5),
  "editor.foldPlaceholderForeground": c("grey-orange"),
  "editor.stackFrameHighlightBackground": a("black-yellow", 0.5),
  "editor.focusedStackFrameHighlightBackground": a("black-green", 0.6),
  "editorLink.activeForeground": c("light-blue"),
  "editorLineNumber.foreground": dim,
  "editorLineNumber.activeForeground": c("dark-orange"),
  "editorLineNumber.dimmedForeground": hl,
  "editorBracketMatch.background": a("light-orange", 0.12),  // show-paren-match
  "editorBracketMatch.border": accent,
  // rainbow-delimiters depth 1..6
  "editorBracketHighlight.foreground1": c("dark-lime"),
  "editorBracketHighlight.foreground2": c("dark-cyan"),
  "editorBracketHighlight.foreground3": c("dark-blue"),
  "editorBracketHighlight.foreground4": c("dark-purple"),
  "editorBracketHighlight.foreground5": c("dark-orange"),
  "editorBracketHighlight.foreground6": c("dark-yellow"),
  "editorBracketHighlight.unexpectedBracket.foreground": c("dark-red"),
  "editorBracketPairGuide.activeBackground1": a("dark-lime", 0.6),
  "editorBracketPairGuide.activeBackground2": a("dark-cyan", 0.6),
  "editorBracketPairGuide.activeBackground3": a("dark-blue", 0.6),
  "editorBracketPairGuide.activeBackground4": a("dark-purple", 0.6),
  "editorBracketPairGuide.activeBackground5": a("dark-orange", 0.6),
  "editorBracketPairGuide.activeBackground6": a("dark-yellow", 0.6),
  "editorIndentGuide.background1": hl,
  "editorIndentGuide.activeBackground1": c("grey-orange"),
  "editorWhitespace.foreground": c("black-blue"),
  "editorRuler.foreground": hl,
  "editorCodeLens.foreground": dim,
  "editorInlayHint.foreground": muted,
  "editorInlayHint.background": a("blue-black", 0.6),
  "editorGhostText.foreground": c("dark-yellow"),           // company-preview, dimmed
  "editorLightBulb.foreground": warnC,                      // lsp-ui code action
  "editorLightBulbAutoFix.foreground": c("light-blue"),
  "editorUnnecessaryCode.opacity": "#000000AA",
  "editorError.foreground": errorC,
  "editorWarning.foreground": warnC,
  "editorInfo.foreground": infoC,
  "editorHint.foreground": c("white-cyan"),
  "problemsErrorIcon.foreground": errorC,
  "problemsWarningIcon.foreground": warnC,
  "problemsInfoIcon.foreground": infoC,
  "editorGutter.background": bg,
  "editorGutter.addedBackground": added,
  "editorGutter.modifiedBackground": changed,
  "editorGutter.deletedBackground": removed,
  "editorGutter.foldingControlForeground": muted,
  "editorOverviewRuler.border": border,
  "editorOverviewRuler.background": bg,
  "editorOverviewRuler.addedForeground": a("light-lime", 0.6),
  "editorOverviewRuler.modifiedForeground": a("light-yellow", 0.6),
  "editorOverviewRuler.deletedForeground": a("light-red", 0.6),
  "editorOverviewRuler.errorForeground": errorC,
  "editorOverviewRuler.warningForeground": warnC,
  "editorOverviewRuler.infoForeground": infoC,
  "editorOverviewRuler.findMatchForeground": a("light-orange", 0.7),
  "editorOverviewRuler.selectionHighlightForeground": a("light-blue", 0.5),
  "editorOverviewRuler.wordHighlightForeground": a("light-blue", 0.5),
  "editorOverviewRuler.wordHighlightStrongForeground": a("bright-blue", 0.6),
  "editorOverviewRuler.bracketMatchForeground": a("light-orange", 0.5),
  "editorStickyScroll.background": bg,
  "editorStickyScroll.border": hl,
  "editorStickyScroll.shadow": "#00000080",
  "editorStickyScrollHover.background": popup,

  // Editor widgets: find, suggest (corfu), hover, peek
  "editorWidget.background": popup,
  "editorWidget.foreground": fg,
  "editorWidget.border": surface,
  "editorWidget.resizeBorder": c("dark-orange"),
  "editorSuggestWidget.background": popup,                 // corfu-default
  "editorSuggestWidget.foreground": fg,
  "editorSuggestWidget.border": surface,                   // corfu-border
  "editorSuggestWidget.selectedBackground": c("selected-orange"), // corfu-current
  "editorSuggestWidget.selectedForeground": fg,
  "editorSuggestWidget.selectedIconForeground": accent,
  "editorSuggestWidget.highlightForeground": warnC,        // completions-common-part
  "editorSuggestWidget.focusHighlightForeground": c("bright-yellow"),
  "editorSuggestWidgetStatus.foreground": muted,
  "editorHoverWidget.background": popup,
  "editorHoverWidget.foreground": fg,
  "editorHoverWidget.border": surface,
  "editorHoverWidget.highlightForeground": warnC,
  "editorHoverWidget.statusBarBackground": surface,
  "editorMarkerNavigation.background": popup,
  "editorMarkerNavigationError.background": errorC,
  "editorMarkerNavigationError.headerBackground": a("light-red", 0.15),
  "editorMarkerNavigationWarning.background": warnC,
  "editorMarkerNavigationWarning.headerBackground": a("light-yellow", 0.15),
  "editorMarkerNavigationInfo.background": infoC,
  "editorMarkerNavigationInfo.headerBackground": a("light-lime", 0.15),
  "peekView.border": c("dark-blue"),
  "peekViewTitle.background": surface,
  "peekViewTitleLabel.foreground": c("bright-blue"),
  "peekViewTitleDescription.foreground": muted,
  "peekViewEditor.background": border,
  "peekViewEditorGutter.background": border,
  "peekViewEditor.matchHighlightBackground": a("light-orange", 0.3),
  "peekViewEditorStickyScroll.background": border,
  "peekViewResult.background": popup,
  "peekViewResult.fileForeground": c("bright-blue"),
  "peekViewResult.lineForeground": muted,
  "peekViewResult.matchHighlightBackground": a("light-orange", 0.3),
  "peekViewResult.selectionBackground": surface,
  "peekViewResult.selectionForeground": c("light-blue"),
  "debugExceptionWidget.background": popup,
  "debugExceptionWidget.border": errorC,

  // Minimap and scrollbars
  "minimap.background": bg,
  "minimap.selectionHighlight": c("selected-orange"),
  "minimap.findMatchHighlight": accent,
  "minimap.errorHighlight": errorC,
  "minimap.warningHighlight": warnC,
  "minimap.infoHighlight": infoC,
  "minimapSlider.background": a("dark-grey", 0.5),
  "minimapSlider.hoverBackground": a("dark-grey", 0.7),
  "minimapSlider.activeBackground": a("dark-grey", 0.9),
  "minimapGutter.addedBackground": added,
  "minimapGutter.modifiedBackground": changed,
  "minimapGutter.deletedBackground": removed,
  "scrollbarSlider.background": a("dark-grey", 0.6),
  "scrollbarSlider.hoverBackground": a("default-grey", 0.4),
  "scrollbarSlider.activeBackground": a("default-grey", 0.6),

  // Diff (diff / magit faces)
  "diffEditor.insertedLineBackground": over("black-green", 0.5),
  "diffEditor.removedLineBackground": over("black-red", 0.5),
  "diffEditor.insertedTextBackground": a("dark-green", 0.3),
  "diffEditor.removedTextBackground": a("dark-red", 0.3),
  "diffEditorGutter.insertedLineBackground": over("black-green", 0.6),
  "diffEditorGutter.removedLineBackground": over("black-red", 0.6),
  "diffEditorOverview.insertedForeground": a("light-lime", 0.6),
  "diffEditorOverview.removedForeground": a("light-red", 0.6),
  "diffEditor.border": border,
  "diffEditor.diagonalFill": a("dark-grey", 0.6),
  "diffEditor.unchangedRegionBackground": popup,
  "diffEditor.unchangedRegionForeground": muted,
  "multiDiffEditor.background": bg,
  "multiDiffEditor.headerBackground": popup,
  "multiDiffEditor.border": border,
  "merge.currentHeaderBackground": a("dark-green", 0.6),
  "merge.currentContentBackground": a("black-green", 0.4),
  "merge.incomingHeaderBackground": a("dark-blue", 0.6),
  "merge.incomingContentBackground": a("black-blue", 0.4),
  "merge.commonHeaderBackground": a("dark-grey", 0.9),
  "merge.commonContentBackground": a("dark-grey", 0.5),
  "editorOverviewRuler.currentContentForeground": c("dark-green"),
  "editorOverviewRuler.incomingContentForeground": c("dark-blue"),

  // Tabs and editor groups (tab-bar / tab-line)
  "editorGroup.border": border,
  "editorGroup.dropBackground": a("blue-black", 0.7),
  "editorGroupHeader.tabsBackground": bg,
  "editorGroupHeader.tabsBorder": border,
  "editorGroupHeader.noTabsBackground": bg,
  "editorGroupHeader.border": border,
  "tab.activeBackground": popup,
  "tab.activeForeground": fg,
  "tab.activeBorderTop": accent,
  "tab.activeBorder": popup,
  "tab.inactiveBackground": bg,
  "tab.inactiveForeground": muted,
  "tab.hoverBackground": popup,
  "tab.hoverForeground": fg,
  "tab.unfocusedActiveBackground": popup,
  "tab.unfocusedActiveForeground": muted,
  "tab.unfocusedActiveBorderTop": c("grey-orange"),
  "tab.unfocusedInactiveForeground": dim,
  "tab.unfocusedHoverBackground": popup,
  "tab.border": border,
  "tab.lastPinnedBorder": hl,
  "tab.activeModifiedBorder": warnC,
  "tab.inactiveModifiedBorder": a("light-yellow", 0.5),
  "breadcrumb.background": bg,
  "breadcrumb.foreground": muted,
  "breadcrumb.focusForeground": fg,
  "breadcrumb.activeSelectionForeground": c("light-blue"),
  "breadcrumbPicker.background": popup,

  // Panel, terminal
  "panel.background": bg,
  "panel.border": border,
  "panel.dropBorder": accent,
  "panelTitle.activeForeground": uiFg,
  "panelTitle.activeBorder": accent,
  "panelTitle.inactiveForeground": dim,
  "panelSection.border": border,
  "panelSectionHeader.background": bg,
  "panelInput.border": hl,
  "panelStickyScroll.background": bg,
  "panelStickyScroll.shadow": "#00000080",
  "outputView.background": bg,
  "terminal.background": bg,
  "terminal.foreground": fg,
  "terminal.border": border,
  "terminalCursor.foreground": accent,
  "terminalCursor.background": bg,
  "terminal.selectionBackground": over("selected-orange", 0.5),
  "terminal.inactiveSelectionBackground": over("selected-orange", 0.3),
  "terminal.findMatchBackground": a("light-orange", 0.4),
  "terminal.findMatchHighlightBackground": over("black-blue", 0.5),
  "terminalCommandDecoration.defaultBackground": dim,
  "terminalCommandDecoration.successBackground": c("medium-lime"),
  "terminalCommandDecoration.errorBackground": c("medium-red"),
  "terminalOverviewRuler.cursorForeground": a("light-orange", 0.6),
  "terminalStickyScroll.background": bg,
  "terminalStickyScrollHover.background": popup,
  // ansi-color-*; black/bright-black lifted one step so text in them is legible
  "terminal.ansiBlack": hl,
  "terminal.ansiRed": c("light-red"),
  "terminal.ansiGreen": c("light-lime"),
  "terminal.ansiYellow": c("light-orange"),
  "terminal.ansiBlue": c("light-blue"),
  "terminal.ansiMagenta": c("light-purple"),
  "terminal.ansiCyan": c("light-cyan"),
  "terminal.ansiWhite": fg,
  "terminal.ansiBrightBlack": dim,
  "terminal.ansiBrightRed": c("white-red"),
  "terminal.ansiBrightGreen": c("white-lime"),
  "terminal.ansiBrightYellow": c("white-yellow"),
  "terminal.ansiBrightBlue": c("white-blue"),
  "terminal.ansiBrightMagenta": c("white-purple"),
  "terminal.ansiBrightCyan": c("white-cyan"),
  "terminal.ansiBrightWhite": c("white-white"),

  // Status bar (mode-line)
  "statusBar.background": bg,
  "statusBar.foreground": uiFg,
  "statusBar.border": border,
  "statusBar.focusBorder": accent,
  "statusBar.noFolderBackground": bg,
  "statusBar.noFolderForeground": uiFg,
  "statusBar.debuggingBackground": c("black-orange"),
  "statusBar.debuggingForeground": c("white-orange"),
  "statusBar.debuggingBorder": border,
  "statusBarItem.hoverBackground": surface,            // mode-line-highlight
  "statusBarItem.hoverForeground": fg,
  "statusBarItem.activeBackground": a("black-blue", 0.8),
  "statusBarItem.compactHoverBackground": hl,
  "statusBarItem.prominentBackground": surface,
  "statusBarItem.prominentForeground": warnC,
  "statusBarItem.prominentHoverBackground": c("black-blue"),
  "statusBarItem.remoteBackground": c("medium-orange"),
  "statusBarItem.remoteForeground": bg,
  "statusBarItem.remoteHoverBackground": accent,
  "statusBarItem.errorBackground": c("black-red"),
  "statusBarItem.errorForeground": c("white-red"),
  "statusBarItem.warningBackground": c("black-yellow"),
  "statusBarItem.warningForeground": c("white-yellow"),
  "statusBarItem.focusBorder": accent,

  // Source control (treemacs git faces)
  "gitDecoration.addedResourceForeground": accent,
  "gitDecoration.modifiedResourceForeground": c("medium-green"),
  "gitDecoration.stageModifiedResourceForeground": c("medium-green"),
  "gitDecoration.untrackedResourceForeground": c("dark-lime"),
  "gitDecoration.deletedResourceForeground": errorC,
  "gitDecoration.stageDeletedResourceForeground": errorC,
  "gitDecoration.renamedResourceForeground": c("light-cyan"),
  "gitDecoration.ignoredResourceForeground": dim,
  "gitDecoration.conflictingResourceForeground": c("medium-red"),
  "gitDecoration.submoduleResourceForeground": c("grey-blue"),
  "git.blame.editorDecorationForeground": dim,
  "scmGraph.foreground1": c("light-orange"),
  "scmGraph.foreground2": c("light-blue"),
  "scmGraph.foreground3": c("light-lime"),
  "scmGraph.foreground4": c("light-purple"),
  "scmGraph.foreground5": c("light-cyan"),
  "scmGraph.historyItemHoverLabelForeground": bg,
  "scmGraph.historyItemRefColor": c("light-blue"),
  "scmGraph.historyItemRemoteRefColor": c("light-purple"),
  "scmGraph.historyItemBaseRefColor": c("light-orange"),

  // Symbol icons (outline, breadcrumbs, suggest) follow the syntax colors
  "symbolIcon.arrayForeground": c("medium-cyan"),
  "symbolIcon.booleanForeground": c("light-purple"),
  "symbolIcon.classForeground": c("medium-cyan"),
  "symbolIcon.colorForeground": c("light-pink"),
  "symbolIcon.constantForeground": c("light-purple"),
  "symbolIcon.constructorForeground": c("medium-blue"),
  "symbolIcon.enumeratorForeground": c("medium-cyan"),
  "symbolIcon.enumeratorMemberForeground": c("light-purple"),
  "symbolIcon.eventForeground": c("light-red"),
  "symbolIcon.fieldForeground": c("bright-blue"),
  "symbolIcon.fileForeground": muted,
  "symbolIcon.folderForeground": muted,
  "symbolIcon.functionForeground": c("medium-blue"),
  "symbolIcon.interfaceForeground": c("medium-cyan"),
  "symbolIcon.keyForeground": c("bright-blue"),
  "symbolIcon.keywordForeground": accent,
  "symbolIcon.methodForeground": c("medium-blue"),
  "symbolIcon.moduleForeground": c("light-yellow"),
  "symbolIcon.namespaceForeground": c("light-yellow"),
  "symbolIcon.nullForeground": c("light-purple"),
  "symbolIcon.numberForeground": c("white-cyan"),
  "symbolIcon.objectForeground": c("medium-cyan"),
  "symbolIcon.operatorForeground": c("white-orange"),
  "symbolIcon.packageForeground": c("light-yellow"),
  "symbolIcon.propertyForeground": c("bright-blue"),
  "symbolIcon.referenceForeground": c("light-blue"),
  "symbolIcon.snippetForeground": muted,
  "symbolIcon.stringForeground": c("medium-lime"),
  "symbolIcon.structForeground": c("medium-cyan"),
  "symbolIcon.textForeground": muted,
  "symbolIcon.typeParameterForeground": c("medium-cyan"),
  "symbolIcon.unitForeground": c("white-cyan"),
  "symbolIcon.variableForeground": c("bright-blue"),

  // Debugging
  "debugToolBar.background": popup,
  "debugToolBar.border": surface,
  "debugIcon.breakpointForeground": c("medium-red"),
  "debugIcon.breakpointDisabledForeground": c("grey-red"),
  "debugIcon.breakpointUnverifiedForeground": c("grey-red"),
  "debugIcon.breakpointCurrentStackframeForeground": warnC,
  "debugIcon.startForeground": c("light-lime"),
  "debugIcon.pauseForeground": c("light-blue"),
  "debugIcon.stopForeground": c("light-red"),
  "debugIcon.restartForeground": c("light-lime"),
  "debugIcon.continueForeground": c("light-blue"),
  "debugIcon.stepOverForeground": c("light-blue"),
  "debugIcon.stepIntoForeground": c("light-blue"),
  "debugIcon.stepOutForeground": c("light-blue"),
  "debugConsole.infoForeground": c("light-blue"),
  "debugConsole.warningForeground": warnC,
  "debugConsole.errorForeground": errorC,
  "debugConsole.sourceForeground": muted,
  "debugConsoleInputIcon.foreground": accent,
  "debugTokenExpression.name": c("bright-blue"),
  "debugTokenExpression.value": muted,
  "debugTokenExpression.string": c("medium-lime"),
  "debugTokenExpression.number": c("white-cyan"),
  "debugTokenExpression.boolean": c("light-purple"),
  "debugTokenExpression.error": errorC,

  // Settings, welcome, misc
  "settings.headerForeground": fg,
  "settings.modifiedItemIndicator": accent,
  "settings.focusedRowBackground": a("dark-black", 0.6),
  "settings.rowHoverBackground": a("dark-black", 0.5),
  "settings.focusedRowBorder": a("dark-orange", 0.5),
  "settings.headerBorder": border,
  "settings.sashBorder": border,
  "settings.dropdownBackground": popup,
  "settings.checkboxBackground": popup,
  "settings.textInputBackground": popup,
  "settings.numberInputBackground": popup,
  "welcomePage.background": bg,
  "welcomePage.tileBackground": popup,
  "welcomePage.tileHoverBackground": hl,
  "welcomePage.tileBorder": surface,
  "welcomePage.progress.background": hl,
  "welcomePage.progress.foreground": accent,
  "walkThrough.embeddedEditorBackground": border,
  "extensionButton.prominentBackground": accent,
  "extensionButton.prominentForeground": bg,
  "extensionButton.prominentHoverBackground": c("bright-orange"),
  "extensionBadge.remoteBackground": accent,
  "extensionBadge.remoteForeground": bg,
  "extensionIcon.starForeground": c("light-yellow"),
  "extensionIcon.verifiedForeground": c("light-blue"),
  "profileBadge.background": accent,
  "profileBadge.foreground": bg,
  "charts.foreground": fg,
  "charts.lines": hl,
  "charts.red": c("light-red"),
  "charts.blue": c("light-blue"),
  "charts.yellow": c("light-yellow"),
  "charts.orange": c("light-orange"),
  "charts.green": c("light-lime"),
  "charts.purple": c("light-purple"),

  // Chat / inline chat
  "chat.requestBackground": a("dark-black", 0.8),
  "chat.requestBorder": surface,
  "chat.slashCommandBackground": surface,
  "chat.slashCommandForeground": c("light-blue"),
  "chat.avatarBackground": popup,
  "chat.avatarForeground": fg,
  "chat.editedFileForeground": c("medium-green"),
  "inlineChat.background": popup,
  "inlineChat.foreground": fg,
  "inlineChat.border": surface,
  "inlineChat.shadow": "#00000080",
  "inlineChatInput.background": bg,
  "inlineChatInput.border": hl,
  "inlineChatInput.focusBorder": a("dark-orange", 0.8),
  "inlineChatInput.placeholderForeground": dim,
  "inlineChatDiff.inserted": a("dark-green", 0.3),
  "inlineChatDiff.removed": a("dark-red", 0.3),
};

// ----------------------------------------------------------------- syntax ---
// font-lock faces from emc-theme-faces.el:
//   keyword      light-orange italic     builtin     light-orange
//   comment      default-grey italic     doc         dark-lime italic
//   constant     light-purple bold       string      medium-lime
//   function     medium-blue bold        type        medium-cyan
//   variable     bright-blue             property    bright-blue
//   number       white-cyan              operator    white-orange
//   punctuation  white-orange            preprocessor light-yellow
//   regexp group white-orange bold       doc-markup  light-yellow
//   warning      light-red bold

const rule = (name, scope, foreground, fontStyle) => {
  const settings = {};
  if (foreground) settings.foreground = c(foreground);
  if (fontStyle !== undefined) settings.fontStyle = fontStyle;
  return { name, scope, settings };
};

const tokenColors = [
  rule("Comment", ["comment", "punctuation.definition.comment"], "default-grey", "italic"),
  rule("Documentation", [
    "comment.block.documentation",
    "comment.block.javadoc",
    "comment.line.documentation",
    "comment.line.double-slash.documentation",
    "comment.line.triple-slash",
    "string.quoted.docstring",
    "string.docstring",
    "string.docstring string",
    "string.docstring punctuation.definition.string",
    "comment.line.documentation punctuation.definition.comment",
    "comment.line.double-slash.documentation punctuation.definition.comment",
    "string.quoted.docstring punctuation.definition.string",
    "comment.block.documentation punctuation.definition.comment",
  ], "dark-lime", "italic"),
  rule("Documentation markup", [
    "storage.type.class.jsdoc",
    "storage.type.class.doxygen",
    "keyword.other.documentation",
    "storage.type.class.javadoc",
    "punctuation.definition.block.tag.jsdoc",
    "punctuation.definition.inline.tag.jsdoc",
  ], "light-yellow", ""),
  rule("Documentation names", [
    "variable.other.jsdoc",
    "variable.parameter.jsdoc",
    "entity.name.type.instance.jsdoc",
  ], "bright-blue", "italic"),

  rule("String", [
    "string",
    "punctuation.definition.string",
    "constant.other.symbol",
    "string.template",
  ], "medium-lime"),
  rule("String prefix (f\"\", r\"\", b\"\")", ["storage.type.string", "storage.type.string.python"], "medium-lime", ""),
  rule("Regexp", ["string.regexp"], "medium-lime"),
  rule("Regexp literal chars", [
    "string.regexp constant.other.character-class.range",
    "string.regexp constant.character.numeric",
    "string.regexp constant.character.control",
    "string.regexp constant.other.character-class.set",
  ], "medium-lime", ""),
  rule("Escape / regexp grouping", [
    "constant.character.escape",
    "constant.character.format.placeholder",
    "constant.other.placeholder",
    "constant.other.character-class.regexp",
    "constant.character.character-class.regexp",
    "keyword.operator.quantifier.regexp",
    "keyword.operator.or.regexp",
    "keyword.control.anchor.regexp",
    "punctuation.definition.group.regexp",
    "punctuation.definition.character-class.regexp",
    "support.other.parenthesis.regexp",
    "support.other.escape.special.regexp",
    "constant.character.escape.backslash.regexp",
    "string.regexp constant.character.escape",
  ], "white-orange", "bold"),
  rule("Interpolation delimiters", [
    "punctuation.definition.template-expression",
    "punctuation.section.embedded",
    "punctuation.definition.interpolation",
    "storage.type.format",
    "constant.character.format",
    "constant.character.format.placeholder.other.python",
  ], "white-orange", ""),
  rule("Interpolated code", ["meta.embedded", "meta.template.expression", "source.groovy.embedded"], "default-white", ""),

  rule("Number", ["constant.numeric", "keyword.other.unit", "storage.type.number", "constant.numeric keyword", "constant.numeric storage"], "white-cyan", ""),
  rule("Constant", [
    "constant.language",
    "constant.other",
    "support.constant",
    "variable.other.enummember",
    "entity.name.constant",
    "constant.character",
  ], "light-purple", "bold"),

  rule("Keyword", [
    "keyword",
    "keyword.control",
    "keyword.other",
    "storage",
    "storage.type",
    "storage.modifier",
    "keyword.operator.new",
    "keyword.operator.expression",
    "keyword.operator.logical.python",
    "keyword.operator.word",
    "keyword.operator.wordlike",
    "keyword.operator.sizeof",
    "keyword.operator.alignof",
    "keyword.operator.typeid",
    "keyword.operator.cast",
    "keyword.operator.delete",
    "keyword.operator.instanceof",
    "keyword.operator.in",
    "keyword.operator.of",
    "keyword.operator.and",
    "keyword.operator.or",
    "keyword.operator.not",
  ], "light-orange", "italic"),
  rule("Language variables (self, this, super)", [
    "variable.language",
    "variable.parameter.function.language.special.self.python",
    "variable.parameter.function.language.special.cls.python",
  ], "light-orange", "italic"),
  rule("Operator", [
    "keyword.operator",
    "storage.type.function.arrow",
    "punctuation.separator.key-value",
    "punctuation.accessor",
    "keyword.operator.assignment",
  ], "white-orange", ""),
  rule("Punctuation", [
    "punctuation",
    "punctuation.separator",
    "punctuation.terminator",
    "punctuation.section",
    "meta.brace",
    "meta.delimiter",
  ], "white-orange"),

  rule("Preprocessor", [
    "meta.preprocessor",
    "keyword.control.directive",
    "keyword.control.import.c",
    "keyword.control.import.cpp",
    "punctuation.definition.directive",
    "entity.name.function.preprocessor",
    "meta.preprocessor.macro entity.name.function",
    "support.macro",
    "support.function.macro",
    "entity.name.function.macro.julia",
    "entity.name.function.macro",
  ], "light-yellow", ""),
  rule("Decorator / annotation / attribute", [
    "meta.decorator",
    "meta.decorator variable.other",
    "meta.decorator entity.name.function",
    "entity.name.function.decorator",
    "punctuation.decorator",
    "storage.type.annotation",
    "punctuation.definition.annotation",
    "meta.attribute.rust",
    "meta.attribute.cs",
    "punctuation.definition.attribute.rust",
    "punctuation.definition.decorator",
    "entity.name.function.attribute",
  ], "light-yellow", ""),

  rule("Builtin function / library", [
    "support.function",
    "support.function.builtin",
    "support.variable",
    "variable.other.predefined",
  ], "light-orange", ""),

  rule("Function definition", [
    "entity.name.function",
    "meta.definition.method entity.name.function",
    "meta.function entity.name.function",
    "entity.name.function.member",
    "entity.name.method",
  ], "medium-blue", "bold"),
  rule("Function call", [
    "meta.function-call entity.name.function",
    "meta.function-call.generic",
    "meta.function-call.python",
    "meta.method-call entity.name.function",
    "variable.function",
    "entity.name.function.call",
    "meta.function.call entity.name.function",
    "meta.function.call.rust entity.name.function",
    "entity.name.function.member.call",
    "support.function.go",
  ], "medium-blue", ""),

  rule("Type", [
    "entity.name.type",
    "entity.name.class",
    "entity.name.struct",
    "entity.name.enum",
    "entity.name.union",
    "entity.name.interface",
    "entity.name.trait",
    "entity.name.type.class",
    "entity.other.inherited-class",
    "support.type",
    "support.class",
    "storage.type.primitive",
    "storage.type.built-in",
    "storage.type.built-in.primitive",
    "storage.type.numeric.go",
    "storage.type.byte.go",
    "storage.type.string.go",
    "storage.type.boolean.go",
    "storage.type.rune.go",
    "storage.type.error.go",
    "storage.type.uintptr.go",
    "source.java storage.type",
    "source.c storage.type",
    "source.cpp storage.type",
    "source.cs storage.type",
    "source.haskell storage.type",
    "source.julia support.type",
    "entity.name.type.parameter",
    "support.class.component",
  ], "medium-cyan", ""),
  rule("Keyword-like storage in C-family", [
    "source.c storage.type.struct",
    "source.c storage.type.enum",
    "source.c storage.type.union",
    "source.cpp storage.type.struct",
    "source.cpp storage.type.class",
    "source.cpp storage.type.enum",
    "source.cpp storage.type.union",
    "source.cpp storage.type.template",
    "source.cpp storage.type.namespace",
    "source.java storage.type.class",
    "source.java storage.type.interface",
    "source.java storage.type.enum",
    "source.java storage.type.record",
    "source.cs storage.type.class",
    "source.cs storage.type.struct",
    "source.cs storage.type.interface",
    "source.cs storage.type.enum",
  ], "light-orange", "italic"),

  rule("Variable", [
    "variable",
    "variable.other",
    "variable.other.readwrite",
    "variable.other.constant",
    "variable.parameter.function-call",
    "meta.function-call.arguments",
  ], "default-white", ""),
  rule("Variable / parameter definition", [
    "variable.parameter",
    "meta.parameter variable",
    "meta.definition.variable variable.other",
    "meta.definition.variable variable.other.constant",
    "meta.definition.variable.name",
    "variable.other.declaration",
    "entity.name.variable",
    "variable.other.assignment",
    "meta.assignment.left-hand-side variable",
    "entity.name.variable.local",
    "entity.name.variable.parameter",
  ], "bright-blue", ""),
  rule("Property / key", [
    "variable.other.property",
    "variable.other.object.property",
    "variable.other.member",
    "meta.attribute.python",
    "variable.object.property",
    "support.variable.property",
    "meta.object-literal.key",
    "meta.object.member",
    "support.type.property-name",
    "entity.name.tag.yaml",
    "keyword.other.definition.ini",
    "entity.name.tag.toml",
    "support.type.property-name.toml",
    "entity.other.attribute-name.table.toml",
    "meta.attribute-with-value.id entity.other.attribute-name",
    "variable.other.member.c",
    "entity.name.variable.field",
    "entity.name.variable.property",
  ], "bright-blue", ""),
  rule("Namespace / module", [
    "entity.name.namespace",
    "entity.name.module",
    "entity.name.package",
    "entity.name.import",
    "entity.name.type.module",
    "support.other.namespace",
  ], "medium-cyan", ""),
  rule("Label", ["entity.name.label", "punctuation.definition.label"], "white-cyan"),

  // HTML / XML / JSX
  rule("Tag", ["entity.name.tag", "meta.tag.sgml", "markup.heading.html"], "light-orange", ""),
  rule("Tag punctuation", [
    "punctuation.definition.tag",
    "punctuation.definition.tag.begin",
    "punctuation.definition.tag.end",
  ], "grey-orange"),
  rule("Tag attribute", ["entity.other.attribute-name"], "bright-blue", "italic"),
  rule("CSS selectors", [
    "entity.other.attribute-name.class.css",
    "entity.other.attribute-name.id.css",
    "entity.other.attribute-name.class",
    "entity.other.attribute-name.id",
  ], "medium-blue", ""),
  rule("CSS pseudo", [
    "entity.other.attribute-name.pseudo-class",
    "entity.other.attribute-name.pseudo-element",
  ], "medium-cyan", "italic"),
  rule("CSS tag selectors", [
    "source.css entity.name.tag",
    "source.scss entity.name.tag",
    "source.sass entity.name.tag",
    "source.less entity.name.tag",
  ], "light-orange", ""),
  rule("CSS values", ["support.constant.property-value", "support.constant.color", "constant.other.color", "support.constant.font-name", "constant.other.color.rgb-value"], "light-purple", ""),
  rule("CSS custom properties", ["variable.css", "variable.argument.css", "variable.scss", "variable.other.less", "support.type.custom-property"], "bright-blue", ""),
  rule("CSS units", ["keyword.other.unit.css", "keyword.other.unit.scss"], "white-cyan"),
  rule("CSS at-rules", ["keyword.control.at-rule", "punctuation.definition.keyword.css"], "light-yellow", ""),

  // JSON nesting: keys alternate like org levels so deep objects stay readable
  ...["bright-blue", "bright-purple", "bright-lime", "bright-orange"].map((color, depth) => {
    const nest = "meta.structure.dictionary.value.json ".repeat(depth) + (depth ? "meta.structure.dictionary.json " : "");
    return rule(`JSON key L${depth + 1}`, [
      `${nest}support.type.property-name.json`,
      `${nest}support.type.property-name.json punctuation`,
    ], color);
  }),

  // Shell
  rule("Shell variables", [
    "variable.other.normal.shell",
    "variable.other.positional.shell",
    "variable.other.special.shell",
    "punctuation.definition.variable.shell",
    "variable.other.bracket.shell",
  ], "bright-blue"),

  // LaTeX
  rule("LaTeX command", ["punctuation.definition.function.latex", "punctuation.definition.function.tex", "punctuation.definition.keyword.latex", "support.function.be.latex", "support.function.general.tex", "support.function.section.latex", "keyword.control.preamble.latex", "keyword.control.include.latex"], "light-orange", ""),
  rule("LaTeX math", ["support.class.math.block.environment.latex", "string.other.math", "meta.math"], "light-cyan", ""),
  rule("LaTeX math command", ["constant.character.math.tex", "support.function.math.tex", "constant.character.math", "constant.other.math.tex", "constant.other.general.math.tex", "punctuation.definition.constant.math.tex", "punctuation.definition.function.math.tex", "punctuation.definition.constant.math.latex"], "light-purple", ""),

  // Markup (markdown-mode / org faces)
  rule("Heading 1", ["markup.heading.1", "heading.1.markdown", "markup.heading.setext.1", "heading.1.markdown entity.name.section"], "light-red", "bold"),
  rule("Heading 2", ["markup.heading.2", "heading.2.markdown", "markup.heading.setext.2", "heading.2.markdown entity.name.section"], "light-orange", "bold"),
  rule("Heading 3", ["heading.3.markdown", "heading.3.markdown entity.name.section"], "light-blue", "bold"),
  rule("Heading 4", ["heading.4.markdown", "heading.4.markdown entity.name.section"], "light-lime", "bold"),
  rule("Heading 5", ["heading.5.markdown", "heading.5.markdown entity.name.section"], "light-orange", "bold"),
  rule("Heading 6", ["heading.6.markdown", "heading.6.markdown entity.name.section"], "light-purple", "bold"),
  rule("Heading (generic)", ["markup.heading", "markup.heading entity.name"], "light-orange", "bold"),
  rule("Heading markers", ["punctuation.definition.heading.markdown"], "white-grey", ""),
  rule("Bold", ["markup.bold", "markup.strong"], undefined, "bold"),
  rule("Italic", ["markup.italic", "emphasis"], undefined, "italic"),
  rule("Bold italic", ["markup.bold markup.italic", "markup.italic markup.bold"], undefined, "bold italic"),
  rule("Strikethrough", ["markup.strikethrough"], undefined, "strikethrough"),
  rule("Underline", ["markup.underline"], undefined, "underline"),
  rule("Inline code", ["markup.inline.raw", "markup.inline.raw.string.markdown", "markup.raw.monospace"], "light-lime"),
  rule("Code fence", ["markup.fenced_code.block.markdown punctuation.definition.markdown", "punctuation.definition.markdown", "fenced_code.block.language"], "white-grey"),
  rule("Link text", ["string.other.link", "markup.underline.link.image", "meta.link.inline.markdown string.other.link.title"], "light-blue", ""),
  rule("Link URL", ["markup.underline.link", "meta.link.inline.markdown markup.underline.link"], "light-lime", ""),
  rule("Link reference", ["constant.other.reference.link", "string.other.link.description.title"], "white-grey"),
  rule("List bullet", ["punctuation.definition.list.begin.markdown", "beginning.punctuation.definition.list.markdown", "markup.list punctuation.definition.list.begin"], "white-orange"),
  rule("Blockquote", ["markup.quote", "punctuation.definition.quote.begin.markdown"], "white-grey", "italic"),
  rule("Separator", ["meta.separator", "meta.separator.markdown"], "light-orange", "bold"),
  rule("Table", ["markup.table"], "light-blue"),
  rule("Front matter key", ["meta.embedded.block.frontmatter entity.name.tag.yaml"], "light-orange"),

  // Diff
  rule("Diff inserted", ["markup.inserted", "punctuation.definition.inserted"], "light-lime"),
  rule("Diff deleted", ["markup.deleted", "punctuation.definition.deleted"], "light-red"),
  rule("Diff changed", ["markup.changed", "punctuation.definition.changed"], "light-yellow"),
  rule("Diff header", ["meta.diff.header", "meta.diff.header.from-file", "meta.diff.header.to-file"], "light-orange", "bold"),
  rule("Diff range", ["meta.diff.range", "meta.diff.index"], "light-orange", ""),

  // Search editor
  rule("Search: file name", ["entity.name.filename.find-in-files"], "light-orange", "bold"),
  rule("Search: line number", ["constant.numeric.line-number.find-in-files - match"], "default-grey"),
  rule("Search: match line number", ["constant.numeric.line-number.match"], "dark-orange"),

  rule("Invalid", ["invalid", "invalid.illegal"], "medium-red", "underline"),
  rule("Deprecated", ["invalid.deprecated"], "light-red", "strikethrough"),
  rule("TODO/FIXME (hl-todo)", ["comment keyword.codetag.notation", "comment.line.todo", "keyword.todo", "comment keyword.other.todo"], "light-red", "bold"),
];

// Semantic tokens (language servers). Plain variable uses stay default-white,
// as with treesit-font-lock-level 3 in Emacs; definitions get bright-blue.
const semanticTokenColors = {
  "namespace": c("medium-cyan"),
  "type": c("medium-cyan"),
  "class": c("medium-cyan"),
  "enum": c("medium-cyan"),
  "interface": c("medium-cyan"),
  "struct": c("medium-cyan"),
  "typeParameter": c("medium-cyan"),
  "type.defaultLibrary": c("medium-cyan"),
  "class.defaultLibrary": c("medium-cyan"),
  "function": { foreground: c("medium-blue"), bold: false },
  "method": { foreground: c("medium-blue"), bold: false },
  "function.declaration": { foreground: c("medium-blue"), bold: true },
  "method.declaration": { foreground: c("medium-blue"), bold: true },
  "function.defaultLibrary": { foreground: c("light-orange"), bold: false },
  "method.defaultLibrary": { foreground: c("medium-blue"), bold: false },
  "macro": c("light-yellow"),
  "decorator": c("light-yellow"),
  "variable": { foreground: c("default-white"), bold: false },
  "variable.declaration": { foreground: c("bright-blue"), bold: false },
  "parameter": { foreground: c("default-white"), bold: false },
  "parameter.declaration": { foreground: c("bright-blue"), bold: false },
  "variable.readonly": { foreground: c("default-white"), bold: false },
  "variable.readonly.declaration": { foreground: c("bright-blue"), bold: false },
  "variable.defaultLibrary": c("light-orange"),
  "variable.readonly.defaultLibrary": { foreground: c("light-purple"), bold: true },
  "selfParameter": { foreground: c("light-orange"), italic: true },
  "selfKeyword": { foreground: c("light-orange"), italic: true },
  "property": { foreground: c("bright-blue"), bold: false },
  "property.readonly": { foreground: c("bright-blue"), bold: false },
  "enumMember": { foreground: c("light-purple"), bold: true },
  "event": c("light-red"),
  "keyword": { foreground: c("light-orange"), italic: true },
  "modifier": { foreground: c("light-orange"), italic: true },
  "comment": { foreground: c("default-grey"), italic: true },
  "string": c("medium-lime"),
  "number": c("white-cyan"),
  "regexp": c("medium-lime"),
  "operator": c("white-orange"),
  "label": c("white-cyan"),
  "*.deprecated": { strikethrough: true },
};

// ------------------------------------------------------------------ write ---

const theme = {
  $schema: "vscode://schemas/color-theme",
  name: "Ayu Dark EMC",
  type: "dark",
  semanticHighlighting: true,
  colors,
  tokenColors,
  semanticTokenColors,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(theme, null, 2) + "\n");
console.log(
  `Wrote ${outFile}\n  ${Object.keys(P).length} palette colors, ` +
  `${Object.keys(colors).length} UI colors, ${tokenColors.length} token rules, ` +
  `${Object.keys(semanticTokenColors).length} semantic rules`,
);
