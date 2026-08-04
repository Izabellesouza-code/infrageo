/* global L */
export function registerBrAm(app) {

  app.normalizeBrAmDisplayName = function normalizeBrAmDisplayName(layerName) {
      const raw = String(layerName || "");
      // Ex.: "BR-AM/BR_174.shp" → "BR-174"
      const rel = raw.replace(/\\/g, "/");
      let s = rel.replace(/^BR-AM\//i, "");
      s = s.replace(/\.shp$/i, "");
      const parts = s.split("/").filter(Boolean);
      s = parts.length ? parts[parts.length - 1] : s;
      s = String(s || "").trim();
      if (!s) return "Camada";
      const num = app.extractBrHighwayNumber(s);
      if (num) return `BR-${num}`;
      return s.replace(/_/g, "-");
    }

  app.extractBrHighwayNumber = function extractBrHighwayNumber(label) {
      const s = String(label || "");
      const m = s.match(/(?:^|[^0-9])(?:BR[_\-\s]*)?(\d{2,4})(?:[^0-9]|$)/i) || s.match(/(\d{2,4})/);
      return m ? String(m[1]) : "";
    }

  app.BR_AM_LEGEND_PALETTE = [
      "#2E7D32",
      "#1565C0",
      "#00897B",
      "#5E35B1",
      "#00838F",
      "#2F6FD6",
      "#ca8a04",
      "#1E88E5",
      "#43A047",
      "#0D47A1",
      "#c026d3",
      "#ea580c",
      "#0891b2",
      "#65a30d",
      "#be123c",
      "#7c3aed",
      "#0e7490",
      "#b45309",
      "#059669",
      "#db2777",
    ];

  app.getBrAmLayerColor = function getBrAmLayerColor(layerId, layerName) {
      let h = 2166136261;
      const seed = String(layerId || layerName || "br-am");
      for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return app.BR_AM_LEGEND_PALETTE[(h >>> 0) % app.BR_AM_LEGEND_PALETTE.length];
    }

  app.createBrShieldIcon = function createBrShieldIcon(label, { small = false } = {}) {
      const wrap = document.createElement("span");
      wrap.className = small ? "br-shield br-shield--sm" : "br-shield br-shield--inline";
      wrap.setAttribute("aria-hidden", "true");
      wrap.title = `Rodovia federal ${String(label || "BR")}`;

      const prefix = document.createElement("span");
      prefix.className = "br-shield__prefix";
      prefix.textContent = "BR";
      wrap.appendChild(prefix);

      const num = app.extractBrHighwayNumber(label);
      if (num && !small) {
        const numEl = document.createElement("span");
        numEl.className = "br-shield__num";
        numEl.textContent = num;
        wrap.appendChild(numEl);
      }
      return wrap;
    }

  app.makeBrShieldMapIcon = function makeBrShieldMapIcon(brNum) {
      const num = String(brNum || "").replace(/\D/g, "") || "?";
      return L.divIcon({
        className: "br-shield-map-wrap",
        html:
          `<div class="br-shield br-shield--map" title="BR-${num}">` +
          `<span class="br-shield__prefix">BR</span>` +
          `<span class="br-shield__num">${num}</span>` +
          `</div>`,
        iconSize: [36, 42],
        iconAnchor: [18, 21],
      });
    }

  app.flattenLeafletLatLngs = function flattenLeafletLatLngs(latlngs) {
      const out = [];
      (function walk(v) {
        if (!v) return;
        if (typeof v.lat === "number" && typeof v.lng === "number") {
          out.push(v);
          return;
        }
        if (Array.isArray(v)) v.forEach(walk);
      })(latlngs);
      return out;
    }

  app.latLngsFromGeoJsonGeometry = function latLngsFromGeoJsonGeometry(geometry) {
      const out = [];
      if (!geometry || geometry.coordinates == null) return out;
      (function walk(c) {
        if (!Array.isArray(c) || !c.length) return;
        if (typeof c[0] === "number" && typeof c[1] === "number") {
          out.push(L.latLng(c[1], c[0]));
          return;
        }
        c.forEach(walk);
      })(geometry.coordinates);
      return out;
    }

  app.buildBrShieldMarkersGroup = function buildBrShieldMarkersGroup(geoJsonLayer, brLabel) {
      const num = app.extractBrHighwayNumber(brLabel);
      const icon = app.makeBrShieldMapIcon(num);
      const group = L.layerGroup();

      // Uma única placa por camada BR (centro aproximado do traçado).
      const all = [];
      geoJsonLayer?.eachLayer?.((lyr) => {
        let flat = [];
        try {
          if (lyr?.feature?.geometry) flat = app.latLngsFromGeoJsonGeometry(lyr.feature.geometry);
        } catch {
          flat = [];
        }
        if (!flat.length) flat = app.flattenLeafletLatLngs(lyr.getLatLngs?.() || []);
        if (!flat.length && (lyr instanceof L.Marker || lyr instanceof L.CircleMarker)) {
          try {
            flat = [lyr.getLatLng()];
          } catch {
            flat = [];
          }
        }
        if (!flat.length) {
          try {
            const b = lyr.getBounds?.();
            if (b?.isValid?.()) flat = [b.getCenter()];
          } catch {
            // ignore
          }
        }
        if (flat.length) all.push(...flat);
      });

      let at = null;
      if (all.length) {
        at = all[Math.floor(all.length / 2)];
      } else {
        try {
          const b = geoJsonLayer.getBounds?.();
          if (b?.isValid?.()) at = b.getCenter();
        } catch {
          // ignore
        }
      }
      if (!at) return group;

      L.marker(at, {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 900,
      }).addTo(group);
      return group;
    }

  app.syncBrAmShieldsOnMap = function syncBrAmShieldsOnMap(layerId, geoLayer, layerName) {
      if (!app.state.map) return;
      if (!app.state.brAm.shieldsById) app.state.brAm.shieldsById = {};
      const prev = app.state.brAm.shieldsById[layerId];
      try {
        if (prev) app.state.map.removeLayer(prev);
      } catch {
        // ignore
      }
      delete app.state.brAm.shieldsById[layerId];
      if (!geoLayer) return;
      const toggleEl = document.getElementById(`layer-br-am-${layerId}`);
      if (toggleEl && !toggleEl.checked) return;
      const label = app.normalizeBrAmDisplayName(layerName) || String(layerName || "");
      const shields = app.buildBrShieldMarkersGroup(geoLayer, label);
      if (!shields.getLayers().length) return;
      try {
        shields.addTo(app.state.map);
      } catch {
        // ignore
      }
      app.state.brAm.shieldsById[layerId] = shields;
    }

  app.brAmLayerKeyFromId = function brAmLayerKeyFromId(id) {
      return `br-am:${String(id || "")}`;
    }

  app.brAmIdFromLayerKey = function brAmIdFromLayerKey(layerKey) {
      const s = String(layerKey || "");
      if (!s.startsWith("br-am:")) return "";
      return s.slice("br-am:".length);
    }

  app.getBrAmNameById = function getBrAmNameById(id) {
      const k = String(id || "");
      return (app.state.brAm?.nameById && app.state.brAm.nameById[k]) || "";
    }

  app.setBrAmGroupExpanded = function setBrAmGroupExpanded(next) {
      if (!app.groupBrAm || !app.headBrAm) return;
      app.groupBrAm.classList.toggle("is-expanded", Boolean(next));
      app.headBrAm.setAttribute("aria-expanded", next ? "true" : "false");
      if (app.subtreeBrAm) app.subtreeBrAm.setAttribute("aria-hidden", next ? "false" : "true");
    }

  app.toggleBrAmGroup = function toggleBrAmGroup(force) {
      if (!app.groupBrAm || !app.headBrAm) return;
      const next = force === true ? true : force === false ? false : !app.groupBrAm.classList.contains("is-expanded");
      app.setBrAmGroupExpanded(next);
    }

  app.ensureBrAmLayerOnMap = async function ensureBrAmLayerOnMap(layerId, layerName) {
      if (!app.state.map) return null;
      if (app.state.bulkLayersIntent === "off") return null;
      const toggleEl = document.getElementById(`layer-br-am-${layerId}`);
      if (app.state.brAm?.layersById?.[layerId]) {
        const existing = app.state.brAm.layersById[layerId];
        app.mountDataLayerIfAllowed(existing, toggleEl);
        app.syncBrAmShieldsOnMap(layerId, existing, layerName);
        return existing;
      }

      const label = app.normalizeBrAmDisplayName(layerName);
      app.setStatus(`Carregando: BR-AM — ${label}`, "loading");

      const r = await fetch(`/layers/${encodeURIComponent(layerId)}`);
      if (!r.ok) throw new Error(`Falha ao carregar camada BR-AM (${label})`);
      const geojson = await r.json();
      if (app.state.bulkLayersIntent === "off" || (toggleEl && !toggleEl.checked)) return null;

      app.ensureInfraGeoPanes();
      const pane = app.state.panes?.overlay || undefined;
      const layersByIndex = {};
      const lineColor = app.getBrAmLayerColor(layerId, layerName);
      let seq = 0;
      const lyr = L.geoJSON(geojson, {
        pane,
        style: () => ({
          color: lineColor,
          weight: 3,
          opacity: 0.95,
          fillColor: lineColor,
          fillOpacity: 0.12,
          tolerance: app.FEATURE_POPUP.hover.pathTolerancePx ?? 8,
        }),
        pointToLayer: (_feature, latlng) =>
          L.circleMarker(latlng, {
            pane,
            radius: 5,
            color: lineColor,
            weight: 1.5,
            opacity: 0.98,
            fillColor: lineColor,
            fillOpacity: 0.85,
            tolerance: app.FEATURE_POPUP.hover.pathTolerancePx ?? 8,
          }),
        onEachFeature: (feature, leafletLayer) => {
          try {
            if (feature) {
              feature._brAmId = String(layerId || "");
              feature._brAmIndex = seq;
            }
          } catch {
            // ignore
          }
          try {
            layersByIndex[seq] = leafletLayer;
          } catch {
            // ignore
          }
          const kind = app.brAmLayerKeyFromId(layerId);
          app.setLayerIdentifyMeta(leafletLayer, feature, kind);
          app.attachQuickHover(leafletLayer, feature, kind);
          app.bindLayerIdentifyClick(leafletLayer);
          seq += 1;
        },
      });

      if (app.state.bulkLayersIntent === "off" || (toggleEl && !toggleEl.checked)) return null;
      app.mountDataLayerIfAllowed(lyr, toggleEl);
      if (!app.state.brAm.layersById) app.state.brAm.layersById = {};
      app.state.brAm.layersById[layerId] = lyr;
      app.syncBrAmShieldsOnMap(layerId, lyr, layerName);
      // Mantém features + layersByIndex para seleção por trecho (tabela ↔ mapa).
      try {
        const key = app.brAmLayerKeyFromId(layerId);
        if (!app.state.brAmTables) app.state.brAmTables = { byKey: {} };
        if (!app.state.brAmTables.byKey) app.state.brAmTables.byKey = {};
        const prev = app.state.brAmTables.byKey[key] || {};
        const features = Array.isArray(geojson?.features) ? geojson.features : prev.features || [];
        app.state.brAmTables.byKey[key] = {
          id: String(layerId || ""),
          name: label || prev.name || app.getBrAmNameById(layerId),
          features,
          layersByIndex,
          selectedIndex: prev.selectedIndex ?? null,
          columnKeys: Array.isArray(prev.columnKeys) ? prev.columnKeys : [],
          table: prev.table || { sortKey: null, sortDir: "asc", filterText: "" },
        };
      } catch {
        // ignore
      }
      app.setStatus(`Camada ligada: BR-AM — ${label}`, "ok");
      return lyr;
    }

  app.removeBrAmLayerFromMap = function removeBrAmLayerFromMap(layerId, layerName) {
      if (!app.state.map) return;
      const lyr = app.state.brAm?.layersById?.[layerId];
      if (lyr && app.state.map.hasLayer(lyr)) app.state.map.removeLayer(lyr);
      try {
        if (app.state.brAm?.layersById) delete app.state.brAm.layersById[layerId];
      } catch {
        // ignore
      }
      try {
        const shields = app.state.brAm?.shieldsById?.[layerId];
        if (shields && app.state.map.hasLayer(shields)) app.state.map.removeLayer(shields);
        if (app.state.brAm?.shieldsById) delete app.state.brAm.shieldsById[layerId];
      } catch {
        // ignore
      }
      app.setStatus(`Camada desligada: BR-AM — ${app.normalizeBrAmDisplayName(layerName)}`, "ok");
    }

  app.buildLayerKebabMenuInnerHtml = function buildLayerKebabMenuInnerHtml(layerId) {
      const id = app.escHtmlCell(String(layerId || ""));
      return `
        <div class="layer-kebab-menu__head">Opções da camada</div>
        <button type="button" class="layer-kebab-item" role="menuitem" data-layer-action="table" data-layer="${id}">
          <span class="layer-kebab-item__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
              <path d="M4.5 5.5h15v13h-15z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="M4.5 9.2h15M4.5 13h15M9.2 5.5v13M14 5.5v13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="layer-kebab-item__copy">
            <span class="layer-kebab-item__title">Tabela de atributos</span>
            <span class="layer-kebab-item__hint">Abrir registros, filtrar e localizar no mapa</span>
          </span>
        </button>
      `;
    }

  app.enhanceLayerKebabMenus = function enhanceLayerKebabMenus() {
      document.querySelectorAll(".layer-kebab-menu[data-layer-menu-popover]").forEach((menu) => {
        const layerId = menu.getAttribute("data-layer-menu-popover");
        if (!layerId) return;
        if (menu.querySelector(".layer-kebab-item__title")) return;
        menu.innerHTML = app.buildLayerKebabMenuInnerHtml(layerId);
      });
      document.querySelectorAll(".layer-kebab[data-layer-menu]").forEach((btn) => {
        if (!btn.title || btn.title === "Opções") btn.title = "Opções da camada";
      });
    }

  app.positionLayerKebabMenu = function positionLayerKebabMenu(btn, menu) {
      if (!btn || !menu) return;
      if (menu.parentElement !== document.body) {
        document.body.appendChild(menu);
      }
      menu.hidden = false;
      menu.style.position = "fixed";
      menu.style.visibility = "hidden";
      menu.style.top = "0px";
      menu.style.left = "0px";
      menu.style.right = "auto";
      menu.style.bottom = "auto";

      const pad = 8;
      const r = btn.getBoundingClientRect();
      const mw = Math.min(268, Math.max(200, window.innerWidth - pad * 2));
      menu.style.width = `${mw}px`;
      const mh = Math.max(menu.offsetHeight || 0, 72);

      let left = r.right - mw;
      left = Math.max(pad, Math.min(left, window.innerWidth - mw - pad));

      let top = r.bottom + 6;
      menu.classList.remove("is-above");
      if (top + mh > window.innerHeight - pad) {
        top = Math.max(pad, r.top - mh - 6);
        menu.classList.add("is-above");
      }

      menu.style.top = `${Math.round(top)}px`;
      menu.style.left = `${Math.round(left)}px`;
      menu.style.visibility = "";
    }

  app.renderBrAmLayerToggles = function renderBrAmLayerToggles(layers) {
      if (!app.groupBrAm || !app.subtreeBrAm) return;
      try {
        app.subtreeBrAm.innerHTML = "";
      } catch {
        // ignore
      }

      for (const it of layers || []) {
        const lid = String(it?.id || "");
        const lname = String(it?.name || "");
        if (!lid) continue;

        const row = document.createElement("div");
        row.className = "layer-row layer-row--nested";

        const left = document.createElement("div");
        left.className = "layer-left";
        const displayName = app.normalizeBrAmDisplayName(lname);
        const icon = app.createBrShieldIcon(displayName);
        icon.classList.add("layer-icon", "layer-icon--br-shield");

        const meta = document.createElement("div");
        meta.className = "layer-meta";
        const nameEl = document.createElement("div");
        nameEl.className = "layer-name";
        nameEl.textContent = displayName;

        meta.appendChild(nameEl);
        left.appendChild(icon);
        left.appendChild(meta);

        const right = document.createElement("div");
        right.className = "layer-right";

        // Kebab menu (Tabela de atributos)
        const kebab = document.createElement("button");
        kebab.type = "button";
        kebab.className = "layer-kebab";
        kebab.setAttribute("data-layer-menu", app.brAmLayerKeyFromId(lid));
        kebab.setAttribute("aria-haspopup", "menu");
        kebab.setAttribute("aria-expanded", "false");
        kebab.setAttribute("aria-label", `Opções da camada ${nameEl.textContent}`);
        kebab.title = "Opções da camada";
        kebab.textContent = "⋯";

        const kebabMenu = document.createElement("div");
        kebabMenu.className = "layer-kebab-menu";
        kebabMenu.setAttribute("data-layer-menu-popover", app.brAmLayerKeyFromId(lid));
        kebabMenu.setAttribute("role", "menu");
        kebabMenu.hidden = true;
        kebabMenu.innerHTML = app.buildLayerKebabMenuInnerHtml(app.brAmLayerKeyFromId(lid));

        right.appendChild(kebab);
        right.appendChild(kebabMenu);

        const sw = document.createElement("label");
        sw.className = "switch";
        sw.title = `Mostrar/ocultar camada ${nameEl.textContent} (BR-AM)`;

        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = `layer-br-am-${lid}`;

        const ui = document.createElement("span");
        ui.className = "switch-ui";

        sw.appendChild(input);
        sw.appendChild(ui);
        right.appendChild(sw);

        row.appendChild(left);
        row.appendChild(right);
        app.subtreeBrAm.appendChild(row);

        input.addEventListener("change", () => {
          if (!app.state.map) return;
          if (input.checked) {
            void app.ensureBrAmLayerOnMap(lid, lname).catch((e) => {
              try {
                input.checked = false;
              } catch {
                // ignore
              }
              app.setStatus(String(e?.message || e || "Falha ao carregar camada BR-AM"), "error");
            });
          } else {
            app.clearSelectionForTurnedOffKind(app.brAmLayerKeyFromId(lid));
            app.removeBrAmLayerFromMap(lid, lname);
          }
        });
      }
    }

  app.initBrAmGroup = async function initBrAmGroup() {
      if (!app.groupBrAm || !app.subtreeBrAm) return;
      if (app.state.brAm?.loaded) return;
      if (app.state.brAm?.loadPromise) return app.state.brAm.loadPromise;

      // Mostra só se houver conteúdo em assets/BR-AM
      app.state.brAm.loadPromise = fetch("/layers")
        .then((rr) => rr.json())
        .then((payload) => {
          const all = Array.isArray(payload?.layers) ? payload.layers : [];
          const bram = all
            .filter((l) => String(l?.name || "").replace(/\\/g, "/").startsWith("BR-AM/"))
            .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR"));

          app.state.brAm.discovered = bram;
          app.state.brAm.nameById = {};
          for (const it of bram) {
            const id = String(it?.id || "");
            if (!id) continue;
            app.state.brAm.nameById[id] = String(it?.name || "");
          }
          app.state.brAm.loaded = true;

          if (!bram.length) {
            app.groupBrAm.hidden = true;
            return;
          }

          app.groupBrAm.hidden = false;
          app.renderBrAmLayerToggles(bram);
          app.setBrAmGroupExpanded(false);
          if (app.layerLegendEl?.classList.contains("is-open")) {
            try {
              app.renderLayerLegend();
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {
          // Silencioso: não quebra o app se /layers falhar momentaneamente.
          try {
            app.groupBrAm.hidden = true;
          } catch {
            // ignore
          }
        })
        .finally(() => {
          app.state.brAm.loadPromise = null;
        });

      return app.state.brAm.loadPromise;
    }

  app.collectBrAmToggles = function collectBrAmToggles() {
      return Array.from(document.querySelectorAll('input[type="checkbox"][id^="layer-br-am-"]'));
    }

  app.renderBrAmAttributesTable = function renderBrAmAttributesTable(layerKey, highlightIndex) {
      const id = app.brAmIdFromLayerKey(layerKey);
      const entry = app.state.brAmTables?.byKey?.[layerKey];
      if (!entry) return;

      const keys =
        entry.columnKeys && entry.columnKeys.length > 0 ? entry.columnKeys : app.collectColumnKeysFromFeatures(entry.features);
      if ((!entry.columnKeys || !entry.columnKeys.length) && keys.length) entry.columnKeys = keys;
      entry.selectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(entry.features, entry.table || { sortKey: null, sortDir: "asc", filterText: "" });
      const res = app.renderGenericAttributesTable({
        tableId: `br-am-${id}-attributes-table`,
        keys: entry.columnKeys || [],
        features: feats,
        getIndex: (f) => f?._brAmIndex,
        dataAttr: "data-br-am-index",
        highlightIndex,
        headerKeyAttr: "data-br-am-key",
        sortKey: entry.table?.sortKey,
        sortDir: entry.table?.sortDir,
        columnFilters: entry.table?.columnFilters,
        emptyMessage: "Nenhuma feição carregada para esta camada BR-AM.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: entry.features.length,
      });
    }

}
