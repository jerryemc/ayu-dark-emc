;;; ayu-dark-emc-theme.el --- custom theme  -*- lexical-binding: t -*-
;;; Commentary:


;; 01-lime
;; 02-cyan
;; 03-blue
;; 04-purple
;; 05-orange
;; 06-yellow
;; 09-green
;; 07-pink
;; 08-red

;;; Code:
(deftheme ayu-dark-emc "Ayu dark theme, EMC's version.")
(load (expand-file-name "emc-theme-faces"
                        (file-name-directory (or load-file-name buffer-file-name)))
      nil t)

;; Color palette
;; Each family keeps ONE OKLCH hue; every family shares the same tier ladder:
;;   tier      L      C
;;   white   0.860  0.075   soft accents
;;   bright  0.810  0.125   headings, variables
;;   light   0.750  0.180   main accents
;;   medium  0.665  0.170   functions, types, strings
;;   dark    0.545  0.145   delimiters, docs, icons
;;   grey    0.550  0.045   dimmed / outline levels
;;   black   0.400  0.085   deep shades, backgrounds
;; L offset per family (yellow +.08 ... red -.02) evens out how bright each hue looks;
;; chroma is capped at 97% of the sRGB gamut (90% for white/grey/black), so no
;; channel sits at 00/FF (no neon).
(emc-theme-define 'ayu-dark-emc
  (
      ;; neutrals: warm-tinted to sit on default-black
      (default-white   "#EFEBE0")
      (white-white     "#FFFBF7")
      (yellow-white    "#DFDBC0")
      (cyan-white      "#D5F7F4")
      (default-grey    "#7C8474")  ; comments
      (white-grey      "#9C9F94")
      (dark-grey       "#31302C")  ; hl-line
      (default-black   "#121210")  ; background
      (dark-black      "#222224")
      (black-black     "#080806")
      (blue-black      "#172935")  ; surface, same hue as blue
      (selected-orange "#433123")  ; region, same hue as orange
      ;; 01 orange  (h 60, L +0.03)
      (white-orange    "#FCD1B0")
      (bright-orange   "#FEBA83")
      (light-orange    "#FD9D44")
      (medium-orange   "#E28114")
      (dark-orange     "#AF630D")
      (grey-orange     "#8F7460")
      (black-orange    "#714318")
      ;; 02 yellow  (h 97, L +0.08)
      (white-yellow    "#F9ECB3")
      (bright-yellow   "#F2DB75")
      (light-yellow    "#E6C61D")
      (medium-yellow   "#C7AB18")
      (dark-yellow     "#9D8710")
      (grey-yellow     "#918A6B")
      (black-yellow    "#6B5D1C")
      ;; 03 lime  (h 122, L +0.07)
      (white-lime      "#DFF1B9")
      (bright-lime     "#CAE585")
      (light-lime      "#B1D538")
      (medium-lime     "#98B91F")
      (dark-lime       "#779110")
      (grey-lime       "#818B6D")
      (black-lime      "#536228")
      ;; 04 cyan  (h 180, L +0.05..+0.075, C x0.55..0.85: whitened / pastel, nudged green)
      (white-cyan      "#CAEFE7")
      (bright-cyan     "#9EE8D9")
      (light-cyan      "#82D9C8")
      (medium-cyan     "#6BBCAD")
      (dark-cyan       "#509386")
      (grey-cyan       "#6A8B84")
      (black-cyan      "#2D5F56")
      ;; 05 blue  (h 237.5, L +0.035, C x0.74 except grey)
      (white-blue      "#BDE2FC")
      (bright-blue     "#97D5FE")
      (light-blue      "#66C4FD")
      (medium-blue     "#43A9E3")
      (dark-blue       "#2E83B2")
      (grey-blue       "#638094")
      (black-blue      "#2D5670")
      ;; 06 purple  (h 307.4, L +0.022, C x0.87 except grey)
      (white-purple    "#E4CDFA")
      (bright-purple   "#DAB6FD")
      (light-purple    "#CE9AFD")
      (medium-purple   "#B37FE1")
      (dark-purple     "#8A60B0")
      (grey-purple     "#7F718D")
      (black-purple    "#58426D")
      ;; 07 pink  (h 355, L -0.01)
      (white-pink      "#F6BAD0")
      (bright-pink     "#FD9BC2")
      (light-pink      "#FD76B0")
      (medium-pink     "#DD5D96")
      (dark-pink       "#AB4271")
      (grey-pink       "#856470")
      (black-pink      "#673047")
      ;; 08 red  (h 28; tight ladder anchored on medium: L .765/.725/.685/.645/.605, even 0.04 steps)
      (white-red       "#FD8F82")
      (bright-red      "#FA7A6C")
      (light-red       "#F1685B")
      (medium-red      "#E25C50")
      (dark-red        "#D05448")
      (grey-red        "#84625D")
      (black-red       "#682E28")
      ;; 09 green  (h 150, L +0.02)
      (white-green     "#B5E6BE")
      (bright-green    "#89DE9C")
      (light-green     "#48D373")
      (medium-green    "#30B65D")
      (dark-green      "#1C8D44")
      (grey-green      "#657F6A")
      (black-green     "#255A33")
      ;; Role names the shared faces use; this palette reuses its own colors.
      (gold                       light-orange)
      (function-yellow            light-yellow)
      (variable-peach             bright-blue)
      (diff-added-bg              black-green)
      (diff-removed-bg            black-red)
      (diff-added-highlight-bg    dark-green)
      (diff-removed-highlight-bg  dark-red)
      (diff-changed-bg            black-yellow)
      (ediff-added-highlight-bg   dark-green)
      (ediff-changed-highlight-bg dark-blue)
      (ediff-changed-bg           black-blue)
      (whitespace-trailing-bg     black-red)))

(provide-theme 'ayu-dark-emc)
;;; ayu-dark-emc-theme.el ends here
