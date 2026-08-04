/* global L */
export function registerLegend(app) {

  app.getSimpleLegendDefs = function getSimpleLegendDefs() {
      return [
        {
          id: "br-am",
          label: "Rodovias BR-AM",
          shape: "line",
          color: "#06b6d4",
          getToggles: () => app.collectBrAmToggles(),
        },
        {
          id: "br-319",
          label: "BR-319",
          shape: "line",
          color: "#dc2626",
          fill: "rgba(220, 38, 38, .38)",
          getToggles: () =>
            [
              app.layerBueirosBr319Toggle,
              app.layerPontesBr319Toggle,
              app.layerPcaPradsBr319Toggle,
              app.layerPradsBr319Toggle,
              app.layerPcaPradsCmmBr319Toggle,
            ].filter(Boolean),
        },
        {
          id: "br-174",
          label: "BR-174",
          shape: "line",
          color: "#ec4899",
          fill: "rgba(236, 72, 153, .38)",
          getToggles: () =>
            [app.layerBueirosBr174Toggle, app.layerPradsBr174Toggle].filter(Boolean),
        },
        {
          id: "br-307",
          label: "BR-307",
          shape: "line",
          color: "#ec4899",
          fill: "rgba(236, 72, 153, .38)",
          getToggles: () =>
            [app.layerPontesToggle, app.layerJazidasToggle].filter(Boolean),
        },
        {
          id: "br-230",
          label: "BR-230",
          shape: "line",
          color: "#ca8a04",
          fill: "rgba(202, 138, 4, .38)",
          getToggles: () =>
            [app.layerBueirosBr230Toggle, app.layerPontesBr230Toggle].filter(Boolean),
        },
        {
          id: "bueiros",
          label: "Bueiros",
          shape: "point",
          color: "#2563eb",
          getToggles: () =>
            [app.layerBueirosToggle, app.layerBueirosBr174Toggle, app.layerBueirosBr319Toggle].filter(Boolean),
        },
        {
          id: "pontes",
          label: "Pontes",
          shape: "point",
          color: "#b45309",
          getToggles: () => [app.layerPontesBr319Toggle].filter(Boolean),
        },
        {
          id: "jazidas",
          label: "Jazidas",
          shape: "point",
          color: "#7c3aed",
          getToggles: () => [],
        },
        {
          id: "prads",
          label: "PRADS / PCA",
          shape: "poly",
          color: "#b45309",
          fill: "rgba(251, 191, 36, .45)",
          getToggles: () =>
            [
              app.layerPradsBr174Toggle,
              app.layerPcaPradsBr319Toggle,
              app.layerPradsBr319Toggle,
              app.layerPcaPradsCmmBr319Toggle,
            ].filter(Boolean),
        },
        {
          id: "ip4",
          label: "IP4",
          shape: "point",
          color: "#c97900",
          getToggles: () => [app.layerIp4Toggle].filter(Boolean),
        },
        {
          id: "hidrovias",
          label: "Hidrovias",
          shape: "line",
          color: "#1060d0",
          getToggles: () => [app.layerHidroviasAmToggle].filter(Boolean),
        },
        {
          id: "uc-estadual",
          label: "UC Estadual",
          shape: "poly",
          color: "#457c78",
          fill: "rgba(200, 232, 216, .55)",
          getToggles: () => [app.layerUcEstadualToggle].filter(Boolean),
        },
        {
          id: "uc-municipal",
          label: "UC Municipal",
          shape: "poly",
          color: "#1976d2",
          fill: "rgba(187, 222, 251, .5)",
          getToggles: () => [app.layerUcMunicipalToggle].filter(Boolean),
        },
        {
          id: "ti-am",
          label: "TI AM",
          shape: "poly",
          color: "#6ba09c",
          fill: "rgba(188, 218, 232, .55)",
          getToggles: () => [app.layerTiAmToggle].filter(Boolean),
        },
        {
          id: "limite-estadual",
          label: "Limite estadual",
          shape: "line",
          color: "#334155",
          getToggles: () => [app.layerLimiteToggle].filter(Boolean),
        },
        {
          id: "limite-municipal",
          label: "Limite municipal",
          shape: "line",
          color: "#64748b",
          getToggles: () => [app.layerLimiteMunicipalToggle].filter(Boolean),
        },
      ];
    }

  app.legendSwatchHtml = function legendSwatchHtml(def) {
      const color = def.color || "#64748b";
      const fill = def.fill || color;
      if (def.shape === "line") {
        return `<span class="map-legend__swatch map-legend__swatch--line" style="--swatch:${color}" aria-hidden="true"></span>`;
      }
      if (def.shape === "poly") {
        return `<span class="map-legend__swatch map-legend__swatch--poly" style="--swatch:${color};--swatch-fill:${fill}" aria-hidden="true"></span>`;
      }
      // Mesmo visual dos pontos do mapa (disco na cor da legenda).
      return `<span class="map-legend__swatch map-legend__swatch--point" style="--swatch:${color}" aria-hidden="true"></span>`;
    }

  app.getLegendAccentById = function getLegendAccentById(id) {
      try {
        const hit = app.getSimpleLegendDefs().find((d) => d.id === id);
        if (hit?.color) return String(hit.color);
      } catch {
        // ignore
      }
      return "#64748b";
    }

  app.resolvePointLegendId = function resolvePointLegendId(kind) {
      const k = String(kind || "");
      if (k.includes("319")) return "br-319";
      if (k.includes("174")) return "br-174";
      if (k.includes("307") || k === "pontes" || k === "jazidas") return "br-307";
      if (k.includes("230")) return "br-230";
      if (k.startsWith("bueiros")) return "bueiros";
      if (k.startsWith("pontes")) return "pontes";
      if (k === "ip4") return "ip4";
      if (k.startsWith("prads") || k.startsWith("pca-prads")) return "prads";
      if (k === "uc-estadual") return "uc-estadual";
      if (k === "uc-municipal") return "uc-municipal";
      return k;
    }

  app.createStandardPointIcon = function createStandardPointIcon(kind = "point", options = {}) {
      const legendId = app.resolvePointLegendId(kind);
      const color = options.color || app.getLegendAccentById(legendId);
      const size = typeof options.size === "number" ? options.size : 14;
      const sat = app.isSatelliteBasemapActive();
      const ring = sat ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.98)";
      const edge = sat ? "rgba(2,8,23,.42)" : "rgba(15,23,42,.26)";
      const svg = `<svg width="${size}" height="${size}" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="7" cy="7" r="5.15" fill="${color}" stroke="${ring}" stroke-width="1.5"/>
        <circle cx="7" cy="7" r="5.15" fill="none" stroke="${edge}" stroke-width="0.5"/>
      </svg>`;
      const safeKind = String(kind || "point").replace(/[^a-z0-9_-]+/gi, "-");
      return L.divIcon({
        className: `leaflet-standard-point-wrap leaflet-${safeKind}-icon-wrap`,
        html: `<div class="map-point-icon map-point-icon--dot map-point-icon--${safeKind}">${svg}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

  app.setLegendPanelOpen = function setLegendPanelOpen(open) {
      if (!app.layerLegendEl) return;
      const next = Boolean(open);
      app.layerLegendEl.classList.toggle("is-open", next);
      app.layerLegendEl.setAttribute("aria-hidden", next ? "false" : "true");
      try {
        app.btnLegend?.classList.toggle("is-active", next);
        app.btnLegend?.setAttribute("aria-expanded", next ? "true" : "false");
      } catch {
        // ignore
      }
      if (next) app.renderLayerLegend();
    }

  app.getCamadasFootLayerLabel = function getCamadasFootLayerLabel(inp) {
      const row = inp?.closest?.(".layer-row");
      const name =
        row?.querySelector?.(".layer-name")?.textContent?.trim() ||
        inp?.getAttribute?.("aria-label")?.trim() ||
        "";
      const branch =
        row?.closest?.(".layer-branch")?.querySelector?.(".layer-branch-title")?.textContent?.trim() ||
        "";
      const group =
        row?.closest?.(".layer-group")?.querySelector?.(".layer-group-heading-title")?.textContent?.trim() ||
        "";
      let label = name || String(inp?.id || "").replace(/^layer-/, "") || "Camada";
      if (branch && name && !name.toUpperCase().includes(branch.toUpperCase())) {
        label = `${name} · ${branch}`;
      } else if (!name && group) {
        label = group;
      }
      return app.normalizePtBrText(label);
    }

  app.updateCamadasFootSummary = function updateCamadasFootSummary() {
      if (!app.camadasFootCountEl && !app.camadasFootListEl) return;
      try {
        const inputs = Array.from(
          document.querySelectorAll(
            '.sidebar-section--layers .layer-row input[type="checkbox"][id^="layer-"]'
          )
        );
        const active = inputs.filter((inp) => inp?.checked);
        const on = active.length;
        if (app.camadasFootCountEl) {
          app.camadasFootCountEl.textContent = String(on);
          app.camadasFootCountEl.title =
            on === 0 ? "Nenhuma camada ligada" : on === 1 ? "1 camada ligada" : `${on} camadas ligadas`;
        }
        if (app.camadasFootListEl) {
          app.camadasFootListEl.innerHTML = active
            .map((inp) => {
              const label = app.escapeHtml(app.getCamadasFootLayerLabel(inp));
              return `<li class="camadas-foot__item"><span class="camadas-foot__dot" aria-hidden="true"></span><span class="camadas-foot__name" title="${label}">${label}</span></li>`;
            })
            .join("");
          app.camadasFootListEl.hidden = on === 0;
        }
        if (app.camadasFootEmptyEl) app.camadasFootEmptyEl.hidden = on > 0;
      } catch {
        // ignore
      }
    }

  app.isMapLegendOpen = function isMapLegendOpen() {
      return Boolean(app.layerLegendEl?.classList.contains("is-open"));
    }

  app.shouldExpandLayerGroupsOnToggle = function shouldExpandLayerGroupsOnToggle() {
      return !app.isMapLegendOpen();
    }

  app.applyLegendToggleGroup = function applyLegendToggleGroup(def, checked) {
      const toggles = (typeof def.getToggles === "function" ? def.getToggles() : []) || [];
      const usable = toggles.filter((el) => el && !el.disabled);
      if (!usable.length) return;

      if (!checked) {
        for (const el of usable) {
          if (!el.checked) continue;
          el.checked = false;
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return;
      }

      // Liga todas as camadas do grupo (espelha as opções de Camadas).
      for (const el of usable) {
        if (el.checked) continue;
        el.checked = true;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

  app.applyLegendLeafToggle = function applyLegendLeafToggle(toggleId, checked) {
      const el = document.getElementById(String(toggleId || ""));
      if (!el || el.disabled) return;
      if (Boolean(el.checked) === Boolean(checked)) return;
      el.checked = Boolean(checked);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }

  app.collectTogglesFromLegendNode = function collectTogglesFromLegendNode(node) {
      if (!node) return [];
      if (node.type === "leaf") {
        const t = typeof node.getToggle === "function" ? node.getToggle() : null;
        return t ? [t] : [];
      }
      const kids = Array.isArray(node.children) ? node.children : [];
      return kids.flatMap((child) => collectTogglesFromLegendNode(child));
    }

  app.legendLeaf = function legendLeaf(toggleEl, label, accentId, shape = "point", colorOverride = null) {
      if (!toggleEl || toggleEl.disabled) return null;
      const accent = app.getSimpleLegendDefs().find((d) => d.id === accentId) || {};
      const color = colorOverride || accent.color || app.getLegendAccentById(accentId);
      return {
        type: "leaf",
        id: toggleEl.id,
        label,
        shape: shape || accent.shape || "point",
        color,
        fill: accent.fill,
        getToggle: () => toggleEl,
      };
    }

  app.legendBranch = function legendBranch(id, label, children) {
      const kids = (children || []).filter(Boolean);
      if (!kids.length) return null;
      return { type: "branch", id, label, children: kids };
    }

  app.legendGroup = function legendGroup(id, label, children) {
      const kids = (children || []).filter(Boolean);
      if (!kids.length) return null;
      return { type: "group", id, label, children: kids };
    }

  app.getCamadasLegendTree = function getCamadasLegendTree() {
      const brAmLeaves = app.collectBrAmToggles()
        .filter((el) => el && !el.disabled)
        .map((el) => {
          const rawId = String(el.id || "").replace(/^layer-br-am-/, "");
          const rawName =
            app.getBrAmNameById(rawId) ||
            el.closest?.(".layer-row")?.querySelector?.(".layer-name")?.textContent?.trim() ||
            rawId ||
            "BR-AM";
          return app.legendLeaf(el, app.normalizeBrAmDisplayName(rawName), "br-am", "line", app.getBrAmLayerColor(rawId, rawName));
        })
        .filter(Boolean);

      return [
        app.legendGroup("oae-oac", "OAE/OAC", [
          app.legendBranch("br-317", "BR-317", [app.legendLeaf(app.layerBueirosToggle, "Bueiros", "bueiros")]),
          app.legendBranch("br-307", "BR-307", [
            app.legendLeaf(app.layerPontesToggle, "Pontes", "br-307"),
            app.legendLeaf(app.layerJazidasToggle, "Jazidas", "br-307"),
          ]),
          app.legendBranch("br-319", "BR-319", [
            app.legendLeaf(app.layerBueirosBr319Toggle, "Bueiros", "br-319"),
            app.legendLeaf(app.layerPontesBr319Toggle, "Pontes", "br-319"),
            app.legendLeaf(app.layerPcaPradsBr319Toggle, "PCA - PRADS", "br-319", "poly"),
            app.legendLeaf(app.layerPradsBr319Toggle, "PRADS", "br-319", "poly"),
            app.legendLeaf(app.layerPcaPradsCmmBr319Toggle, "PCA - PRADS CMM", "br-319", "poly"),
          ]),
          app.legendBranch("br-230", "BR-230", [
            app.legendLeaf(app.layerBueirosBr230Toggle, "Bueiros", "br-230"),
            app.legendLeaf(app.layerPontesBr230Toggle, "Pontes", "br-230"),
          ]),
          app.legendBranch("br-174", "BR-174", [
            app.legendLeaf(app.layerBueirosBr174Toggle, "Bueiros", "br-174"),
            app.legendLeaf(app.layerPradsBr174Toggle, "PRADS", "br-174", "poly"),
          ]),
        ]),
        app.legendGroup("br-am", "BR-AM", brAmLeaves),
        app.legendGroup("aquaviario", "Aquaviário", [
          app.legendLeaf(app.layerIp4Toggle, "IP4", "ip4"),
          app.legendLeaf(app.layerHidroviasAmToggle, "Hidrovias", "hidrovias", "line"),
        ]),
        app.legendGroup("uc", "Unidades de Conservação", [
          app.legendLeaf(app.layerUcEstadualToggle, "UC Estadual", "uc-estadual", "poly"),
          app.legendLeaf(app.layerUcMunicipalToggle, "UC Municipal", "uc-municipal", "poly"),
          app.legendLeaf(app.layerTiAmToggle, "TI AM", "ti-am", "poly"),
        ]),
        app.legendGroup("limites-am", "Limites AM", [
          app.legendLeaf(app.layerLimiteToggle, "Limite estadual", "limite-estadual", "line"),
          app.legendLeaf(app.layerLimiteMunicipalToggle, "Limite municipal", "limite-municipal", "line"),
        ]),
      ].filter(Boolean);
    }

  app.renderLegendLeafRow = function renderLegendLeafRow(leaf) {
      const toggle = typeof leaf.getToggle === "function" ? leaf.getToggle() : null;
      if (!toggle || toggle.disabled) return "";
      const on = Boolean(toggle.checked);
      const id = `legend-leaf-${leaf.id}`;
      return `<label class="map-legend__row map-legend__row--leaf${on ? " is-on" : ""}" for="${id}">
        <input id="${id}" class="map-legend__check" type="checkbox" data-layer-toggle="${leaf.id}" ${
        on ? "checked" : ""
      } />
        ${app.legendSwatchHtml(leaf)}
        <span class="map-legend__label">${app.escapeHtml(String(leaf.label || ""))}</span>
      </label>`;
    }

  app.renderLegendTreeNode = function renderLegendTreeNode(node, depth = 0) {
      if (!node) return "";
      if (node.type === "leaf") return app.renderLegendLeafRow(node);

      const kids = Array.isArray(node.children) ? node.children : [];
      const toggles = app.collectTogglesFromLegendNode(node).filter((el) => el && !el.disabled);
      if (!toggles.length) return "";
      const onCount = toggles.filter((el) => el.checked).length;
      const allOn = onCount === toggles.length;
      const someOn = onCount > 0;
      const id = `legend-node-${node.id}`;
      const childrenHtml = kids.map((child) => renderLegendTreeNode(child, depth + 1)).join("");
      if (!childrenHtml) return "";

      return `<div class="map-legend__node map-legend__node--${node.type}" data-depth="${depth}">
        <label class="map-legend__row map-legend__row--${node.type}${someOn ? " is-on" : ""}" for="${id}">
          <input
            id="${id}"
            class="map-legend__check"
            type="checkbox"
            data-legend-node="${node.id}"
            ${allOn ? "checked" : ""}
            ${someOn && !allOn ? "data-indeterminate=\"1\"" : ""}
          />
          <span class="map-legend__node-mark" aria-hidden="true"></span>
          <span class="map-legend__label">${app.escapeHtml(String(node.label || ""))}</span>
        </label>
        <div class="map-legend__children">${childrenHtml}</div>
      </div>`;
    }

  app.clearMapLegendLayers = function clearMapLegendLayers() {
      try {
        app.turnOffAllDataLayersKeepLimiteEstadual();
      } catch {
        // Fallback: desliga item a item via legenda.
        for (const def of app.getSimpleLegendDefs()) {
          if (def.id === "limite-estadual") continue;
          try {
            app.applyLegendToggleGroup(def, false);
          } catch {
            // ignore
          }
        }
      }
      try {
        app.renderLayerLegend();
      } catch {
        // ignore
      }
    }

  app.renderLayerLegend = function renderLayerLegend() {
      if (!app.layerLegendBodyEl) return;
      const tree = app.getCamadasLegendTree();
      const html = tree.map((node) => app.renderLegendTreeNode(node, 0)).filter(Boolean).join("");
      app.layerLegendBodyEl.innerHTML =
        html || `<div class="map-legend__empty">Nenhuma legenda disponível no momento.</div>`;

      // Checkboxes de grupo parcialmente ligados.
      try {
        app.layerLegendBodyEl.querySelectorAll('input.map-legend__check[data-indeterminate="1"]').forEach((inp) => {
          inp.indeterminate = true;
        });
      } catch {
        // ignore
      }
    }

  app.findLegendNodeById = function findLegendNodeById(nodes, id) {
      for (const node of nodes || []) {
        if (!node) continue;
        if (node.id === id) return node;
        if (node.children) {
          const hit = findLegendNodeById(node.children, id);
          if (hit) return hit;
        }
      }
      return null;
    }

  app.applyLegendTreeNodeToggle = function applyLegendTreeNodeToggle(nodeId, checked) {
      const node = app.findLegendNodeById(app.getCamadasLegendTree(), nodeId);
      if (!node) return;
      const toggles = app.collectTogglesFromLegendNode(node).filter((el) => el && !el.disabled);
      for (const el of toggles) {
        if (Boolean(el.checked) === Boolean(checked)) continue;
        el.checked = Boolean(checked);
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

  app.getLayerGroupByKind = function getLayerGroupByKind(kind) {
      if (kind === "bueiros") return app.state.bueirosLayer;
      if (kind === "pontes") return app.state.pontesBr307Layer;
      if (kind === "jazidas") return app.state.jazidasBr307Layer;
      if (kind === "hidrovias-am") return app.state.hidroviasAmLayer;
      if (kind === "pontes-br319") return app.state.pontesBr319Layer;
      if (kind === "pontes-br230") return app.state.pontesBr230Layer;
      if (kind === "bueiros-br319") return app.state.bueirosBr319Layer;
      if (kind === "bueiros-br174") return app.state.bueirosBr174Layer;
      if (kind === "prads-br174") return app.state.pradsBr174Layer;
      if (kind === "pca-prads-br319") return app.state.pcaPradsBr319Layer;
      if (kind === "prads-br319") return app.state.pradsBr319Layer;
      if (kind === "pca-prads-cmm-br319") return app.state.pcaPradsCmmBr319Layer;
      if (kind === "bueiros-br230") return app.state.bueirosBr230Layer;
      if (kind === "uc-estadual") return app.state.ucEstadualLayer;
      if (kind === "uc-municipal") return app.state.ucMunicipalLayer;
      if (kind === "ti-am") return app.state.tiAmLayer;
      if (kind === "ip4") return app.state.ip4Layer;
      if (kind === "segmentos") return app.state.geojsonLayer;
      if (kind === "municipios") return app.state.boundaryMunicipalLayer || app.state.boundaryMunicipalHoverLayer;
      if (String(kind || "").startsWith("br-am:")) {
        const id = app.brAmIdFromLayerKey(kind);
        return app.state.brAm?.layersById?.[id] || null;
      }
      return null;
    }

}
