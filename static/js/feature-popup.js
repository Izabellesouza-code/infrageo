/* global L */
export function registerFeaturePopup(app) {

  app.hideFeatureQuickMenu = function hideFeatureQuickMenu(force = false) {
      if (!app.featureQuickMenuEl) return;
      if (app.state.featureQuickMenuPinned && !force) return;
      app.state.featureQuickMenuPinned = false;
      app.featureQuickMenuEl.classList.remove("is-visible", "is-pinned", "is-minimal");
    }

  app.FEATURE_POPUP = {
      hover: {
        maxRows: 5,
        hideDelayMs: 100,
        leaveDelayMs: 120,
        offsetPx: 12,
        padPx: 10,
        avoidPadPx: 16,
        pointRadiusPx: 18,
        /** Raio de hit (px) para pontos no identify/hover — um pouco generoso para cliques precisos */
        hitPointPx: 12,
        /** Distância máxima (px) até a linha para considerar "em cima" */
        hitLinePx: 6,
        /** Distância “suave” para preenchimento de polígono (não rouba clique de ponto/linha) */
        hitPolygonFillPx: 18,
        /** Tolerância Leaflet Path (melhora mouseover em traçados finos) */
        pathTolerancePx: 8,
      },
      detail: {
        skipEmpty: true,
      },
      leaflet: {
        direction: "top",
        sticky: true,
        opacity: 1,
        interactive: false,
      },
      municipios: {
        className: "hover-municipio-pill",
        subtitle: "Estado do Amazonas",
      },
      skipKeys: new Set([
        "source",
        "__source",
        "fid",
        "geometry",
        "geom",
        "shape_leng",
        "shape_area",
        "shape_len",
        "shape_le_1",
        "objectid",
        "oid",
      ]),
      preferredKeysByKind: {
        segmentos: ["vl_codigo", "ds_local_i", "ds_local_f", "vl_km_inic", "vl_km_fina", "versao_snv", "_source"],
        bueiros: ["vl_codigo", "codigo", "id", "municipio", "nm_municipio", "ds_local_i", "tipo", "contrato", "CONTRATO", "_source"],
        "bueiros-br319": ["vl_codigo", "codigo", "id", "municipio", "nm_municipio", "ds_local_i", "tipo", "contrato", "CONTRATO", "_source"],
        "bueiros-br174": ["vl_codigo", "codigo", "id", "municipio", "nm_municipio", "contrato", "CONTRATO", "_source"],
        "bueiros-br230": ["vl_codigo", "codigo", "id", "municipio", "nm_municipio", "contrato", "CONTRATO", "_source"],
        pontes: ["id", "ID", "km", "KM", "lat", "LAT", "lng", "LON", "local", "LOCAL", "vl_codigo", "municipio", "nm_municipio", "contrato", "CONTRATO", "_source"],
        "pontes-br319": ["id", "ID", "km", "KM", "lat", "LAT", "lng", "LON", "local", "LOCAL", "vl_codigo", "municipio", "nm_municipio", "contrato", "CONTRATO", "_source"],
        "pontes-br230": ["id", "ID", "km", "KM", "lat", "LAT", "lng", "LON", "local", "LOCAL", "vl_codigo", "municipio", "nm_municipio", "contrato", "CONTRATO", "_source"],
        jazidas: ["vl_codigo", "codigo", "id", "municipio", "nm_municipio", "tipo", "contrato", "CONTRATO", "_source"],
        "uc-estadual": ["Administra", "Ato_Legal", "CONTRATOS", "Codigo_BR", "Codigo_SNV", "area_ha", "ano", "_source"],
        "uc-municipal": ["Administra", "Ato_Legal", "CONTRATOS", "Codigo_BR", "Codigo_SNV", "area_ha", "ano", "_source"],
        "prads-br174": ["id", "codigo", "municipio", "nm_municipio", "contrato", "CONTRATO", "_source"],
        "pca-prads-br319": ["NOME", "nome", "KM", "km", "CONTRATO", "contrato", "ATIVIDADE", "ha", "MUNICIPIO", "municipio", "nm_municipio", "BR", "LAT", "LONG", "_source"],
        "prads-br319": ["NOME", "nome", "KM", "km", "CONTRATO", "contrato", "ATIVIDADE", "ha", "MUNICIPIO", "municipio", "nm_municipio", "BR", "LAT", "LONG", "_source"],
        "pca-prads-cmm-br319": ["NOME_PCA", "NOME", "nome", "KM", "km", "CONTRATO", "contrato", "MUNICIPIO", "municipio", "nm_municipio", "ha", "BR", "LAT", "LONG", "_source"],
        ip4: ["Nome", "Lote", "contrato", "Contrato", "Proc_dnit", "Supervisao", "Operacao", "_source"],
        municipios: ["nm_municipio", "NM_MUNICIPIO", "municipio", "nome", "NOME"],
        "ti-am": ["terrai_nom", "etnia_nome", "fase_ti", "municipio_", "uf_sigla", "modalidade"],
        "hidrovias-am": ["NOME", "CODIGO", "TRECHO", "EXTENSAO_K", "REGIAO_HID", "SEQUENCIA"],
      },
      preferredKeysFallback: ["id", "codigo", "vl_codigo", "municipio", "nm_municipio", "contrato", "CONTRATO", "nome", "NOME"],
      primaryNameKeys: [
        "nome",
        "NOME",
        "nm_municipio",
        "municipio",
        "vl_codigo",
        "codigo",
        "id",
        "ds_local_i",
        "terrai_nom",
        "Nome",
      ],
    };

  app.getPreferredKeysByKind = function getPreferredKeysByKind(selectionKind) {
      const kind = String(selectionKind || "");
      if (kind.startsWith("br-am:")) {
        return [
          "Km_inicial",
          "Km_final",
          "CODIGO_BR",
          "Codigo_BR",
          "UNIDADE_FE",
          "Unidade_Fe",
          "CONTRATO",
          "CONTRATADA",
          "vl_codigo",
          "contrato",
          "municipio",
          "nm_municipio",
        ];
      }
      const map = app.FEATURE_POPUP.preferredKeysByKind;
      return map[kind] || app.FEATURE_POPUP.preferredKeysFallback;
    }

  app.shouldSkipPopupKey = function shouldSkipPopupKey(key) {
      const kk = String(key || "").toLowerCase();
      if (!kk) return true;
      if (app.FEATURE_POPUP.skipKeys.has(kk)) return true;
      if (kk === "geometry" || kk === "geom") return true;
      return false;
    }

  app.pickQuickMenuRows = function pickQuickMenuRows(props, options = {}) {
      const { minimal = false, selectionKind = "", maxRows = app.FEATURE_POPUP.hover.maxRows } = options;
      const entries = Object.entries(props || {}).filter(([k, v]) => {
        if (app.shouldSkipPopupKey(k)) return false;
        if (v === undefined || v === null || String(v).trim() === "") return false;
        // HTML/XML sem texto útil (ex.: DESCRIÇÃO do PRADS) não entra no popup
        if (!app.formatAttributeDisplayValue(v, k)) return false;
        return true;
      });

      const toRow = ([key, value]) => ({
        label: app.normalizeFeatureLabel(key),
        value: app.formatAttributeDisplayValue(value, key),
        key,
      });

      if (!minimal) return entries.map(toRow);

      const preferred = app.getPreferredKeysByKind(selectionKind);
      const picked = [];
      const used = new Set();
      const normKey = (k) =>
        String(k || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");
      const propByNorm = new Map(entries.map((e) => [normKey(e[0]), e]));

      for (const pk of preferred || []) {
        const want = normKey(pk);
        const hit =
          propByNorm.get(want) ||
          entries.find(([k]) => {
            const nk = normKey(k);
            return nk === want || nk.includes(want) || want.includes(nk);
          });
        if (hit && !used.has(hit[0])) {
          used.add(hit[0]);
          picked.push(toRow(hit));
          if (picked.length >= maxRows) return picked;
        }
      }

      for (const entry of entries) {
        if (used.has(entry[0])) continue;
        picked.push(toRow(entry));
        if (picked.length >= maxRows) break;
      }
      return picked;
    }

  app.buildQuickMenuRowsHtml = function buildQuickMenuRowsHtml(rows) {
      return rows
        .map(
          (row) => `<div class="feature-quick-menu__row">
            <div class="feature-quick-menu__row-label">${app.escHtmlCell(row.label)}</div>
            <div class="feature-quick-menu__row-value">${app.escHtmlCell(row.value)}</div>
          </div>`,
        )
        .join("");
    }

  app.getLeafletTooltipOptions = function getLeafletTooltipOptions(extra = {}) {
      return {
        direction: app.FEATURE_POPUP.leaflet.direction,
        sticky: app.FEATURE_POPUP.leaflet.sticky,
        opacity: app.FEATURE_POPUP.leaflet.opacity,
        interactive: app.FEATURE_POPUP.leaflet.interactive,
        ...extra,
      };
    }

  app.bindMunicipioHoverPill = function bindMunicipioHoverPill(layer, name) {
      if (!layer || !name) return;
      const title = app.escapeHtml(name);
      const subtitle = app.escapeHtml(app.FEATURE_POPUP.municipios.subtitle);
      layer.bindTooltip(
        `<div class="hover-municipio-pill__title">${title}</div><div class="hover-municipio-pill__subtitle">${subtitle}</div>`,
        app.getLeafletTooltipOptions({ className: app.FEATURE_POPUP.municipios.className }),
      );
      if (layer.__infrageoMunicipioHoverBound) return;
      layer.__infrageoMunicipioHoverBound = true;
      layer.on("mouseover", () => {
        try {
          layer.openTooltip?.();
        } catch {
          // ignore
        }
      });
      layer.on("mouseout", () => {
        try {
          layer.closeTooltip?.();
        } catch {
          // ignore
        }
      });
    }

  app.pinFeatureQuickMenu = function pinFeatureQuickMenu(feature, selectionKind, e, results = null, layer = null) {
      if (!app.featureQuickMenuEl) return;
      app.cancelQuickMenuHide();
      app.featureQuickMenuEl.classList.add("is-minimal");
      const list = Array.isArray(results) ? results : null;
      const idx = app.state.identify?.activeIndex ?? 0;
      if (list && list.length > 1) {
        app.renderIdentifyQuickMenu(list, idx, { minimal: true });
      } else {
        app.renderFeatureQuickMenu(feature, selectionKind, { minimal: true });
      }
      app.featureQuickMenuEl.classList.add("is-visible", "is-pinned");
      app.state.featureQuickMenuPinned = true;
      const activeLayer = layer || list?.[idx]?.layer || null;
      requestAnimationFrame(() => {
        app.positionFeatureQuickMenuAvoidingRect(app.getAvoidRectForLayer(activeLayer, feature, e));
      });
    }

  app.showFeatureQuickMenuOnHover = function showFeatureQuickMenuOnHover(feature, selectionKind, e, layer = null) {
      if (!app.featureQuickMenuEl || app.state.featureQuickMenuPinned) return;
      app.cancelQuickMenuHide();
      app.featureQuickMenuEl.classList.add("is-minimal");
      app.featureQuickMenuEl.classList.remove("is-pinned");
      app.renderFeatureQuickMenu(feature, selectionKind, { minimal: true });
      app.featureQuickMenuEl.classList.add("is-visible");
      requestAnimationFrame(() => {
        app.positionFeatureQuickMenuAvoidingRect(app.getAvoidRectForLayer(layer, feature, e));
      });
    }

  app.quickMenuHideTimer = null;

  app.cancelQuickMenuHide = function cancelQuickMenuHide() {
      if (app.quickMenuHideTimer) {
        clearTimeout(app.quickMenuHideTimer);
        app.quickMenuHideTimer = null;
      }
    }

  app.scheduleQuickMenuHide = function scheduleQuickMenuHide(delayMs = app.FEATURE_POPUP.hover.hideDelayMs) {
      if (app.state.featureQuickMenuPinned) return;
      app.cancelQuickMenuHide();
      app.quickMenuHideTimer = setTimeout(() => {
        app.quickMenuHideTimer = null;
        app.hideFeatureQuickMenu();
      }, delayMs);
    }

  app.positionFeatureQuickMenuFromClientXY = function positionFeatureQuickMenuFromClientXY(clientX, clientY) {
      if (!app.featureQuickMenuEl) return;
      const offset = app.FEATURE_POPUP.hover.offsetPx;
      const pad = app.FEATURE_POPUP.hover.padPx;
      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;

      const r0 = app.featureQuickMenuEl.getBoundingClientRect();
      const w = r0.width || 320;
      const h = r0.height || 220;

      let x = (clientX ?? 0) + offset;
      let y = (clientY ?? 0) + offset;

      if (x + w + pad > vw) x = (clientX ?? 0) - w - offset;
      if (y + h + pad > vh) y = (clientY ?? 0) - h - offset;

      x = Math.max(pad, Math.min(x, Math.max(pad, vw - w - pad)));
      y = Math.max(pad, Math.min(y, Math.max(pad, vh - h - pad)));

      app.featureQuickMenuEl.style.left = `${Math.round(x)}px`;
      app.featureQuickMenuEl.style.top = `${Math.round(y)}px`;
    }

  app.latLngToClientXY = function latLngToClientXY(latlng) {
      if (!app.state.map || !latlng) return null;
      try {
        const pt = app.state.map.latLngToContainerPoint(latlng);
        const rect = app.state.map.getContainer().getBoundingClientRect();
        return { x: rect.left + pt.x, y: rect.top + pt.y };
      } catch {
        return null;
      }
    }

  app.getAvoidRectForLayer = function getAvoidRectForLayer(layer, feature, e) {
      const pad = app.FEATURE_POPUP.hover.avoidPadPx;
      try {
        if (layer?.getBounds) {
          const b = layer.getBounds();
          if (b?.isValid?.()) {
            const nw = app.latLngToClientXY(b.getNorthWest());
            const se = app.latLngToClientXY(b.getSouthEast());
            if (nw && se) {
              return {
                left: Math.min(nw.x, se.x) - pad,
                top: Math.min(nw.y, se.y) - pad,
                right: Math.max(nw.x, se.x) + pad,
                bottom: Math.max(nw.y, se.y) + pad,
              };
            }
          }
        }
        if (typeof layer?.getLatLng === "function") {
          const p = app.latLngToClientXY(layer.getLatLng());
          if (p) {
            const r = app.FEATURE_POPUP.hover.pointRadiusPx;
            return { left: p.x - r, top: p.y - r, right: p.x + r, bottom: p.y + r };
          }
        }
        const gt = feature?.geometry?.type;
        const coords = feature?.geometry?.coordinates;
        if (gt === "Point" && Array.isArray(coords) && coords.length >= 2) {
          const p = app.latLngToClientXY(L.latLng(coords[1], coords[0]));
          if (p) {
            const r = app.FEATURE_POPUP.hover.pointRadiusPx;
            return { left: p.x - r, top: p.y - r, right: p.x + r, bottom: p.y + r };
          }
        }
      } catch {
        // ignore
      }
      const oe = e?.originalEvent;
      if (oe && typeof oe.clientX === "number" && typeof oe.clientY === "number") {
        const r = app.FEATURE_POPUP.hover.pointRadiusPx + 4;
        return {
          left: oe.clientX - r,
          top: oe.clientY - r,
          right: oe.clientX + r,
          bottom: oe.clientY + r,
        };
      }
      if (e?.latlng) {
        const p = app.latLngToClientXY(e.latlng);
        if (p) {
          const r = app.FEATURE_POPUP.hover.pointRadiusPx + 4;
          return { left: p.x - r, top: p.y - r, right: p.x + r, bottom: p.y + r };
        }
      }
      return null;
    }

  app.rectsOverlap = function rectsOverlap(a, b) {
      return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    }

  app.positionFeatureQuickMenuAvoidingRect = function positionFeatureQuickMenuAvoidingRect(avoidRect) {
      if (!app.featureQuickMenuEl) return;
      const gap = 14;
      const margin = 10;
      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;
      const bottomInset = app.getBottomSheetInsetBottom();
      const usableBottom = vh - bottomInset;

      const menu = app.featureQuickMenuEl.getBoundingClientRect();
      const w = menu.width || 252;
      const h = menu.height || 140;

      const clamp = (x, y) => ({
        x: Math.max(margin, Math.min(x, vw - w - margin)),
        y: Math.max(margin, Math.min(y, usableBottom - h - margin)),
      });

      const rectAt = (x, y) => {
        const c = clamp(x, y);
        return { x: c.x, y: c.y, left: c.x, top: c.y, right: c.x + w, bottom: c.y + h };
      };

      const applyAt = (x, y) => {
        const c = clamp(x, y);
        app.featureQuickMenuEl.style.left = `${Math.round(c.x)}px`;
        app.featureQuickMenuEl.style.top = `${Math.round(c.y)}px`;
      };

      if (!avoidRect) {
        applyAt(margin, margin);
        return;
      }

      const candidates = [
        { x: avoidRect.right + gap, y: avoidRect.top },
        { x: avoidRect.left - w - gap, y: avoidRect.top },
        { x: avoidRect.left, y: avoidRect.bottom + gap },
        { x: avoidRect.left, y: avoidRect.top - h - gap },
      ];

      let best = null;
      for (const cand of candidates) {
        const rect = rectAt(cand.x, cand.y);
        if (!app.rectsOverlap(rect, avoidRect)) {
          const cx = (avoidRect.left + avoidRect.right) / 2;
          const cy = (avoidRect.top + avoidRect.bottom) / 2;
          const dist = Math.hypot(rect.left + w / 2 - cx, rect.top + h / 2 - cy);
          if (!best || dist > best.dist) best = { x: rect.x, y: rect.y, dist };
        }
      }
      if (best) {
        applyAt(best.x, best.y);
        return;
      }

      const corners = [
        clamp(margin, margin),
        clamp(vw - w - margin, margin),
        clamp(margin, usableBottom - h - margin),
        clamp(vw - w - margin, usableBottom - h - margin),
      ];
      for (const c of corners) {
        const rect = { left: c.x, top: c.y, right: c.x + w, bottom: c.y + h };
        if (!app.rectsOverlap(rect, avoidRect)) {
          applyAt(c.x, c.y);
          return;
        }
      }
      applyAt(avoidRect.right + gap, avoidRect.top);
    }

  app.getSelectionKindLayerLabel = function getSelectionKindLayerLabel(selectionKind) {
      if (selectionKind === "segmentos") return "RODOVIAS / SNV";
      if (selectionKind === "bueiros") return "BUEIROS — BR-317";
      if (selectionKind === "bueiros-br319") return "BUEIROS — BR-319";
      if (selectionKind === "pontes") return "PONTES — BR-307";
      if (selectionKind === "jazidas") return "JAZIDAS — BR-307";
      if (selectionKind === "pontes-br319") return "PONTES — BR-319";
      if (selectionKind === "pontes-br230") return "PONTES — BR-230";
      if (selectionKind === "hidrovias-am") return "HIDROVIAS";
      if (selectionKind === "uc-estadual") return "UC ESTADUAL";
      if (selectionKind === "uc-municipal") return "UC MUNICIPAL";
      if (selectionKind === "ti-am") return "TI AM";
      if (selectionKind === "ip4") return "IP4";
      if (selectionKind === "municipios") return "Municípios (AM)";
      if (selectionKind === "bueiros-br174") return "BUEIROS — BR-174";
      if (selectionKind === "bueiros-br230") return "BUEIROS — BR-230";
      if (selectionKind === "prads-br174") return "PRADS — BR-174";
      if (selectionKind === "pca-prads-br319") return "PCA - PRADS — BR-319";
      if (selectionKind === "prads-br319") return "PRADS — BR-319";
      if (selectionKind === "pca-prads-cmm-br319") return "PCA - PRADS CMM — BR-319";
      if (String(selectionKind || "").startsWith("br-am:")) {
        const id = app.brAmIdFromLayerKey(selectionKind);
        const name = app.normalizeBrAmDisplayName(app.getBrAmNameById(id) || "");
        const num = app.extractBrHighwayNumber(name);
        if (num) return `BR-${num}`;
        return name ? String(name).replace(/_/g, "-") : "BR-AM";
      }
      return "CAMADA";
    }

  app.getMunicipioNomeFromProps = function getMunicipioNomeFromProps(props) {
      const p = props || {};
      const looksLikeName = (val) => {
        if (val === null || val === undefined) return false;
        const s = app.normalizePtBrText(val).trim();
        if (!s) return false;
        // Evita campos de código/índice (ex.: "0", "12", "001")
        if (/^\d+$/.test(s)) return false;
        // Precisa ter ao menos uma letra
        if (!/[A-Za-zÀ-ÿ]/.test(s)) return false;
        // Evita strings muito longas (provável descrição)
        if (s.length > 80) return false;
        return true;
      };
      // Campos comuns em limites municipais (variam por fonte).
      const keys = [
        "nm_municipio",
        "NM_MUNICIPIO",
        "NM_MUNICÍPIO",
        "nm_munici",
        "NM_MUNICIP",
        "NM_MUNIC",
        "NM_MUN",
        "NOME_MUN",
        "NOME_MUNIC",
        "NOM_MUN",
        "municipio",
        "MUNICIPIO",
        "Município",
        "nm_mun",
        "NM_MUN_1",
        "NM_MUN_2",
        "Nome",
        "NOME",
        "nome",
        "nome_mun",
        "nome_municipio",
        "name",
        "NAME",
        "NAME_1",
        "NAME_2",
      ];
      for (const k of keys) {
        if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
        const v = p?.[k];
        if (looksLikeName(v)) return app.normalizePtBrText(v).trim();
      }

      // Fallback heurístico: procura qualquer campo que pareça nome de município.
      try {
        const candidates = [];
        for (const [k, val] of Object.entries(p)) {
          if (!looksLikeName(val)) continue;
          const s = app.normalizePtBrText(val).trim();
          const kk = String(k || "").toLowerCase();
          if (!kk) continue;
          if (kk.includes("municip") || kk.includes("munic") || kk.includes("nm_mun") || kk.includes("nome_mun")) {
            // prioriza campos com "nome"
            const score = (kk.includes("nome") ? 3 : 0) + (kk.includes("nm_") ? 2 : 0) + (kk.includes("municip") ? 1 : 0);
            candidates.push({ s, score });
          }
        }
        candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
        if (candidates.length) return candidates[0].s;
      } catch {
        // ignore
      }

      return "";
    }

  app.renderFeatureQuickMenu = function renderFeatureQuickMenu(feature, selectionKind, options = {}) {
      if (!app.featureQuickMenuEl || !app.featureQuickTitleEl || !app.featureQuickSubtitleEl || !app.featureQuickBodyEl) return;
      const { minimal = false } = options;
      const props = feature?.properties || {};
      const title = app.getSelectionKindLayerLabel(selectionKind);
      const preferred = app.getPreferredKeysByKind(selectionKind) || [];
      const primaryCandidates = [...preferred, ...app.FEATURE_POPUP.primaryNameKeys];
      let primaryName = app.normalizePtBrText(app.getFirstNonEmptyValue(props, primaryCandidates));
      // BR-AM: subtítulo útil (faixa de km / contratada), não só o número da BR.
      if (String(selectionKind || "").startsWith("br-am:")) {
        const km0 = app.getFirstNonEmptyValue(props, ["Km_inicial", "km_inicial", "KM_INICIAL"]);
        const km1 = app.getFirstNonEmptyValue(props, ["Km_final", "km_final", "KM_FINAL"]);
        if (km0 !== "" && km1 !== "" && String(km0) !== String(km1)) {
          primaryName = app.normalizePtBrText(`Km ${km0} – ${km1}`);
        } else {
          primaryName = app.normalizePtBrText(
            app.getFirstNonEmptyValue(props, ["CONTRATADA", "CONTRATO", "contrato", "CODIGO_BR", "Codigo_BR"]) ||
              primaryName,
          );
        }
      }
      const subtitle = primaryName || "Detalhes da feição";

      app.featureQuickTitleEl.textContent = title;
      app.featureQuickSubtitleEl.textContent = app.normalizePtBrText(String(subtitle));
      app.featureQuickSubtitleEl.hidden = Boolean(minimal && !primaryName);

      let rows = app.pickQuickMenuRows(props, { minimal, selectionKind, maxRows: app.FEATURE_POPUP.hover.maxRows });
      if (minimal && primaryName) {
        const primaryNorm = app.normalizeSearchText(primaryName);
        rows = rows.filter((row) => app.normalizeSearchText(row.value) !== primaryNorm);
        if (rows.length > app.FEATURE_POPUP.hover.maxRows) rows = rows.slice(0, app.FEATURE_POPUP.hover.maxRows);
      }
      app.featureQuickBodyEl.innerHTML = app.buildQuickMenuRowsHtml(rows);
    }

  try {
      app.featureQuickMenuEl?.addEventListener("mouseenter", app.cancelQuickMenuHide);
      app.featureQuickMenuEl?.addEventListener("mouseleave", () => {
        if (!app.state.featureQuickMenuPinned) app.scheduleQuickMenuHide(app.FEATURE_POPUP.hover.leaveDelayMs);
      });
      // Scroll dentro do popup não deve dar zoom no mapa.
      app.featureQuickMenuEl?.addEventListener(
        "wheel",
        (ev) => {
          ev.stopPropagation();
        },
        { passive: true }
      );
      // Touch/pointer: evita o mapa capturar o gesto de rolagem.
      app.featureQuickMenuEl?.addEventListener(
        "touchstart",
        (ev) => {
          ev.stopPropagation();
        },
        { passive: true }
      );
      app.featureQuickMenuEl?.addEventListener(
        "touchmove",
        (ev) => {
          ev.stopPropagation();
        },
        { passive: true }
      );
    }
  catch {
      // ignore
    }

  app.setLayerIdentifyMeta = function setLayerIdentifyMeta(layer, feature, selectionKind) {
      if (!layer) return;
      layer.__infrageoFeature = feature;
      layer.__infrageoSelectionKind = selectionKind;
      app.bumpPathHitTolerance(layer);
    }

  app.bumpPathHitTolerance = function bumpPathHitTolerance(layer) {
      const tol = app.FEATURE_POPUP.hover.pathTolerancePx ?? 8;
      try {
        if (!layer) return;
        if (typeof layer.eachLayer === "function") {
          layer.eachLayer((child) => bumpPathHitTolerance(child));
          return;
        }
        if (layer instanceof L.Path) {
          layer.options.tolerance = Math.max(Number(layer.options.tolerance) || 0, tol);
        }
      } catch {
        // ignore
      }
    }

  app.getHitGeometryRank = function getHitGeometryRank(layer, feature) {
      try {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) return 0;
        const t = String(feature?.geometry?.type || "");
        if (/Point/i.test(t)) return 0;
        if (/Line/i.test(t)) return 1;
        if (/Polygon/i.test(t)) return 2;
        if (layer instanceof L.Polygon) return 2;
        if (layer instanceof L.Polyline) return 1;
      } catch {
        // ignore
      }
      return 1;
    }

  app.layerHitDistancePx = function layerHitDistancePx(layer, latlng) {
      if (!app.state.map || !layer || !latlng) return Infinity;
      const hitPt = app.FEATURE_POPUP.hover.hitPointPx ?? 12;
      const hitLn = app.FEATURE_POPUP.hover.hitLinePx ?? 6;
      const hitPolyFill = app.FEATURE_POPUP.hover.hitPolygonFillPx ?? 18;
      try {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          const a = app.state.map.latLngToContainerPoint(latlng);
          const b = app.state.map.latLngToContainerPoint(layer.getLatLng());
          const d = a.distanceTo(b);
          return d <= hitPt ? d : Infinity;
        }
        if (typeof layer.getBounds === "function") {
          const b = layer.getBounds();
          if (b?.isValid?.()) {
            const pad = Math.max(hitLn, 8) / Math.max(window.innerWidth || 1, 1);
            if (!b.pad(Math.max(pad, 0.0008)).contains(latlng)) return Infinity;
          }
        }
        if (typeof layer.closestLayerPoint === "function") {
          const p = app.state.map.latLngToLayerPoint(latlng);
          const closest = layer.closestLayerPoint(p);
          if (closest && typeof closest.distance === "number") {
            const isPoly =
              layer instanceof L.Polygon || /Polygon/i.test(String(layer?.feature?.geometry?.type || ""));
            // Borda do polígono / linha: hit apertado para precisão
            if (closest.distance <= hitLn) return closest.distance;
            // Interior do polígono: ainda selecionável, mas com distância “suave”
            // para não ganhar de ponto/linha no mesmo clique.
            if (isPoly && typeof layer._containsPoint === "function" && layer._containsPoint(p)) {
              return Math.max(hitPolyFill, closest.distance);
            }
            return Infinity;
          }
        }
        if (typeof layer._containsPoint === "function") {
          const p = app.state.map.latLngToLayerPoint(latlng);
          if (!layer._containsPoint(p)) return Infinity;
          const isPoly =
            layer instanceof L.Polygon || /Polygon/i.test(String(layer?.feature?.geometry?.type || ""));
          return isPoly ? hitPolyFill : 0;
        }
      } catch {
        return Infinity;
      }
      return Infinity;
    }

  app.bindLayerIdentifyClick = function bindLayerIdentifyClick(leafletLayer) {
      if (!leafletLayer || leafletLayer.__infrageoIdentifyClickBound) return;
      leafletLayer.__infrageoIdentifyClickBound = true;
      leafletLayer.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        // Reidentifica no ponto do clique: todas as camadas sob o cursor, com precisão.
        if (e?.latlng) {
          const hits = app.identifyLayersAtLatLng(e.latlng);
          if (hits.length) {
            const best = hits[0];
            app.handleMapFeatureClick(e, best.feature, best.layer, best.selectionKind, {
              zoomTo: true,
              identifyResults: hits,
              activeIndex: 0,
            });
            return;
          }
        }
        const feature = leafletLayer.__infrageoFeature || leafletLayer.feature;
        const kind = leafletLayer.__infrageoSelectionKind;
        if (feature && kind) {
          app.handleMapFeatureClick(e, feature, leafletLayer, kind, { zoomTo: true });
          return;
        }
        app.handleIdentifyClick(e?.latlng, { zoomTo: true });
      });
    }

  app.handleMapFeatureClick = function handleMapFeatureClick(e, feature, layer, selectionKind, options = {}) {
      const { zoomTo = true, identifyResults = null, activeIndex = 0 } = options;
      if (!app.state.map || !feature) return;

      app.cancelQuickMenuHide();
      // Clique já traz a feição: não varre o mapa inteiro (custo alto em polígonos/UC).
      const results =
        Array.isArray(identifyResults) && identifyResults.length
          ? identifyResults
          : [{ feature, layer, selectionKind, z: app.getLayerZIndexHint(layer), geomRank: app.getHitGeometryRank(layer, feature), dist: 0 }];

      const safeIdx = Math.max(0, Math.min(Number(activeIndex) || 0, results.length - 1));
      app.state.identify.results = results;
      app.state.identify.activeIndex = safeIdx;

      const active = results[safeIdx] || { feature, layer, selectionKind };
      app.selectFeature(active.feature || feature, active.layer || layer, {
        zoomTo: false,
        selectionKind: active.selectionKind || selectionKind,
        showQuickMenu: false,
      });

      try {
        app.state.map.closePopup?.();
      } catch {
        // noop
      }

      try {
        app.hideMapCoordsControl();
      } catch {
        // ignore
      }

      // Várias camadas no mesmo ponto: pin do menu com chips para escolher com precisão.
      try {
        if (results.length > 1) {
          app.pinFeatureQuickMenu(
            active.feature || feature,
            active.selectionKind || selectionKind,
            e,
            results,
            active.layer || layer,
          );
        }
      } catch {
        // ignore
      }

      // Clique: tabela completa (todos os atributos) na barra inferior; hover usa o popup mínimo.
      void app.openAttributesTableFromMapClick(
        active.selectionKind || selectionKind,
        active.feature || feature,
        active.layer || layer,
        { zoomTo },
      );
    }

  app.TABLE_LAYER_IDS = new Set([
      "segmentos",
      "municipios",
      "ip4",
      "bueiros",
      "bueiros-br174",
      "bueiros-br230",
      "bueiros-br319",
      "pontes",
      "jazidas",
      "prads-br174",
      "pca-prads-br319",
      "prads-br319",
      "pca-prads-cmm-br319",
      "pontes-br319",
      "pontes-br230",
      "uc-estadual",
      "uc-municipal",
      "ti-am",
      "hidrovias-am",
    ]);

  app.tableLayerIdFromKind = function tableLayerIdFromKind(kind) {
      const k = String(kind || "");
      if (!k || k === "limite-estadual") return "";
      if (k.startsWith("br-am:")) return k;
      if (app.TABLE_LAYER_IDS.has(k)) return k;
      return "";
    }

  app.isFeatureQuickMenuVisible = function isFeatureQuickMenuVisible() {
      return Boolean(app.featureQuickMenuEl?.classList.contains("is-visible"));
    }

  app.maybeOpenAttributesTableWhenLayerEnabled = function maybeOpenAttributesTableWhenLayerEnabled(kind) {
      if (app.state.suppressAutoOpenTableOnLayerToggle) return;
      if (app.state.menuToggleLayersBusy) return;
      // Legenda aberta: só liga a camada no mapa, sem abrir painéis/tabelas.
      if (app.isMapLegendOpen()) return;
      if (!app.isBottomSheetVisible()) return;
      const layerId = app.tableLayerIdFromKind(kind);
      if (!layerId) return;
      if (String(app.state.tableDataset || "") === layerId) return;
      void app.openAttributesTableForLayer(layerId);
    }

  app.dismissTablesAndPopups = function dismissTablesAndPopups() {
      let closed = false;
      try {
        if (app.isFeatureQuickMenuVisible() || app.state.featureQuickMenuPinned) {
          app.hideFeatureQuickMenu(true);
          closed = true;
        }
      } catch {
        // ignore
      }
      try {
        if (app.isBottomSheetVisible()) {
          app.closeBottomSheet();
          closed = true;
        }
      } catch {
        // ignore
      }
      return closed;
    }

  app.attachQuickHover = function attachQuickHover(layer, feature, selectionKind) {
      if (!layer || !feature) return;
      if (layer.__infrageoQuickHoverBound) {
        layer.__infrageoFeature = feature;
        layer.__infrageoSelectionKind = selectionKind;
        return;
      }
      layer.__infrageoQuickHoverBound = true;
      app.bumpPathHitTolerance(layer);
      layer.on("mouseover", (e) => {
        try {
          L.DomEvent.stopPropagation(e);
        } catch {
          // ignore
        }
        // Prefere a feição mais precisa sob o cursor (ponto > linha > polígono).
        let f = layer.__infrageoFeature || feature;
        let kind = layer.__infrageoSelectionKind || selectionKind;
        let targetLayer = layer;
        try {
          const hits = e?.latlng ? app.identifyLayersAtLatLng(e.latlng) : [];
          if (hits.length) {
            f = hits[0].feature || f;
            kind = hits[0].selectionKind || kind;
            targetLayer = hits[0].layer || layer;
            // Guarda hits para o clique/pin poder listar todas as camadas.
            app.state.identify.results = hits;
            app.state.identify.activeIndex = 0;
          }
        } catch {
          // ignore
        }
        app.showFeatureQuickMenuOnHover(f, kind, e, targetLayer);
      });
      layer.on("mouseout", (e) => {
        if (app.state.featureQuickMenuPinned) return;
        const related = e?.originalEvent?.relatedTarget;
        if (related && app.featureQuickMenuEl?.contains(related)) return;
        app.scheduleQuickMenuHide(app.FEATURE_POPUP.hover.hideDelayMs);
      });
    }

  app.getLayerZIndexHint = function getLayerZIndexHint(layer) {
      try {
        const paneName = layer?.options?.pane;
        if (!paneName || !app.state.map) return 0;
        const paneEl = app.state.map.getPane?.(paneName);
        const z = paneEl ? parseInt(window.getComputedStyle(paneEl).zIndex || "0", 10) : 0;
        return Number.isFinite(z) ? z : 0;
      } catch {
        return 0;
      }
    }

  app.parseFeatureKmValue = function parseFeatureKmValue(value) {
      if (value === null || value === undefined || value === "") return null;
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const s = String(value)
        .trim()
        .replace(/\s+/g, "")
        .replace(",", ".");
      const n = Number.parseFloat(s);
      return Number.isFinite(n) ? n : null;
    }

  app.countGeometryVertices = function countGeometryVertices(geometry) {
      let n = 0;
      const walk = (coords) => {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === "number") {
          n += 1;
          return;
        }
        for (const c of coords) walk(c);
      };
      try {
        walk(geometry?.coordinates);
      } catch {
        // ignore
      }
      return n;
    }

  app.roughGeometryBboxArea = function roughGeometryBboxArea(geometry) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      const walk = (coords) => {
        if (!Array.isArray(coords)) return;
        if (typeof coords[0] === "number") {
          const x = coords[0];
          const y = coords[1];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          return;
        }
        for (const c of coords) walk(c);
      };
      try {
        walk(geometry?.coordinates);
      } catch {
        return Number.POSITIVE_INFINITY;
      }
      if (!Number.isFinite(minX) || !Number.isFinite(minY)) return Number.POSITIVE_INFINITY;
      return Math.abs(maxX - minX) * Math.abs(maxY - minY);
    }

  app.featureStretchSpecificityScore = function featureStretchSpecificityScore(feature) {
      try {
        const props = feature?.properties || {};
        const km0 = app.parseFeatureKmValue(
          props.Km_inicial ?? props.km_inicial ?? props.KM_INICIAL ?? props.Km_Inicio
        );
        const km1 = app.parseFeatureKmValue(
          props.Km_final ?? props.km_final ?? props.KM_FINAL ?? props.Km_Fim
        );
        let kmSpan = Number.POSITIVE_INFINITY;
        if (km0 !== null && km1 !== null) {
          kmSpan = Math.abs(km1 - km0);
          // Km 0–0 (ou idêntico) costuma ser o traçado completo da BR.
          if (kmSpan < 1e-6) kmSpan = Number.POSITIVE_INFINITY;
        }

        const bboxArea = app.roughGeometryBboxArea(feature?.geometry);
        const verts = app.countGeometryVertices(feature?.geometry);
        const kmPart = Number.isFinite(kmSpan) ? kmSpan : 1e5;
        const areaPart = Number.isFinite(bboxArea) ? bboxArea * 2e4 : 1e5;
        const vertPart = Math.min(verts, 80000) * 0.002;
        return kmPart + areaPart + vertPart;
      } catch {
        return 1e12;
      }
    }

  app.identifyLayersAtLatLng = function identifyLayersAtLatLng(latlng) {
      if (!app.state.map) return [];
      const out = [];
      const layers = app.state.map._layers ? Object.values(app.state.map._layers) : [];
      for (const lyr of layers) {
        if (!lyr || !lyr._map) continue;
        if (lyr === app.state.highlightOverlayLayer) continue;
        const feature = lyr.__infrageoFeature;
        const kind = lyr.__infrageoSelectionKind;
        if (!feature || !kind) continue;
        const dist = app.layerHitDistancePx(lyr, latlng);
        if (!Number.isFinite(dist) || dist === Infinity) continue;
        out.push({
          feature,
          layer: lyr,
          selectionKind: kind,
          z: app.getLayerZIndexHint(lyr),
          dist,
          geomRank: app.getHitGeometryRank(lyr, feature),
          stretch: app.featureStretchSpecificityScore(feature),
        });
      }
      // Precisão em camadas empilhadas:
      // 1) ponto > linha > polígono  2) mais perto do cursor  3) trecho mais específico  4) z-index
      out.sort((a, b) => {
        const gDiff = (a.geomRank || 0) - (b.geomRank || 0);
        if (gDiff) return gDiff;
        const dDiff = (a.dist || 0) - (b.dist || 0);
        if (Math.abs(dDiff) > 0.75) return dDiff;
        const sDiff = (a.stretch || 0) - (b.stretch || 0);
        if (sDiff) return sDiff;
        return (b.z || 0) - (a.z || 0);
      });
      return out;
    }

  app.renderIdentifyQuickMenu = function renderIdentifyQuickMenu(results, activeIndex = 0, options = {}) {
      if (!app.featureQuickMenuEl || !app.featureQuickTitleEl || !app.featureQuickSubtitleEl || !app.featureQuickBodyEl) return;
      const { minimal = false } = options;
      const safeIdx = Math.max(0, Math.min(activeIndex, (results?.length || 1) - 1));
      const active = results?.[safeIdx];
      if (!active?.feature) return;

      const kind = active.selectionKind || "segmentos";
      const props = active.feature?.properties || {};
      const preferred = app.getPreferredKeysByKind(kind) || [];
      const primaryName = app.normalizePtBrText(
        app.getFirstNonEmptyValue(props, [...preferred, ...app.FEATURE_POPUP.primaryNameKeys]),
      );
      const subtitle = primaryName || "Detalhes da feição";

      app.featureQuickTitleEl.textContent =
        results.length > 1 ? `Feições (${results.length})` : app.getSelectionKindLayerLabel(kind);
      app.featureQuickSubtitleEl.textContent = app.normalizePtBrText(
        results.length > 1 ? `${app.getSelectionKindLayerLabel(kind)} — ${String(subtitle)}` : String(subtitle),
      );
      app.featureQuickSubtitleEl.hidden = Boolean(minimal && results.length <= 1 && !primaryName);

      const chips =
        results.length > 1
          ? `<div class="feature-quick-menu__chips" role="listbox" aria-label="Camadas neste ponto">
            ${results
              .map((r, i) => {
                const pressed = i === safeIdx ? ' aria-pressed="true"' : ' aria-pressed="false"';
                const label = app.escHtmlCell(app.getSelectionKindLayerLabel(r.selectionKind));
                const title = app.escapeHtml(
                  `${app.getSelectionKindLayerLabel(r.selectionKind)}${
                    Number.isFinite(r.dist) ? ` · ${Math.round(r.dist)}px` : ""
                  }`,
                );
                return `<button type="button" class="feature-quick-menu__chip" data-identify-idx="${i}" title="${title}"${pressed}>${label}</button>`;
              })
              .join("")}
          </div>`
          : "";

      let bodyRows = app.pickQuickMenuRows(props, {
        minimal,
        selectionKind: kind,
        maxRows: app.FEATURE_POPUP.hover.maxRows,
      });
      if (minimal && primaryName) {
        const primaryNorm = app.normalizeSearchText(primaryName);
        bodyRows = bodyRows.filter((row) => app.normalizeSearchText(row.value) !== primaryNorm);
        if (bodyRows.length > app.FEATURE_POPUP.hover.maxRows) {
          bodyRows = bodyRows.slice(0, app.FEATURE_POPUP.hover.maxRows);
        }
      }
      app.featureQuickBodyEl.innerHTML = chips + app.buildQuickMenuRowsHtml(bodyRows);
    }

  app.resolveTableLayerId = function resolveTableLayerId(selectionKind, feature) {
      const kind = String(selectionKind || "");
      if (!kind || kind === "limite-municipal") return null;
      if (kind.startsWith("br-am:")) return kind;
      if (feature?._brAmId) return app.brAmLayerKeyFromId(feature._brAmId);
      if (app.TABLE_LAYER_IDS.has(kind)) return kind;
      if (feature) return `map-click:${kind}`;
      return null;
    }

  app.getLayerFeaturesArray = function getLayerFeaturesArray(layerId) {
      const id = String(layerId || "");
      if (id === "segmentos") return app.state.allFeatures || [];
      if (id === "municipios") return app.state.municipiosFeatures || [];
      if (id === "bueiros") return app.state.bueirosFeatures || [];
      if (id === "bueiros-br174") return app.state.bueirosBr174Features || [];
      if (id === "bueiros-br230") return app.state.bueirosBr230Features || [];
      if (id === "bueiros-br319") return app.state.bueirosBr319Features || [];
      if (id === "pontes") return app.state.pontesFeatures || [];
      if (id === "jazidas") return app.state.jazidasFeatures || [];
      if (id === "prads-br174") return app.state.pradsBr174Features || [];
      if (id === "pca-prads-br319") return app.state.pcaPradsBr319Features || [];
      if (id === "prads-br319") return app.state.pradsBr319Features || [];
      if (id === "pca-prads-cmm-br319") return app.state.pcaPradsCmmBr319Features || [];
      if (id === "pontes-br319") return app.state.pontesBr319Features || [];
      if (id === "pontes-br230") return app.state.pontesBr230Features || [];
      if (id === "uc-estadual") return app.state.ucEstadualFeatures || [];
      if (id === "uc-municipal") return app.state.ucMunicipalFeatures || [];
      if (id === "ti-am") return app.state.tiAmFeatures || [];
      if (id === "hidrovias-am") return app.state.hidroviasAmFeatures || [];
      if (id === "ip4") return app.state.ip4Features || [];
      if (id.startsWith("br-am:")) return app.state.brAmTables?.byKey?.[id]?.features || [];
      if (id.startsWith("map-click:")) return app.state.mapClickTables?.[id]?.features || [];
      return [];
    }

  app.LAYER_INDEX_FIELDS = {
      segmentos: "_tableIndex",
      municipios: "_municipioIndex",
      ip4: "_ip4Index",
      bueiros: "_bueirosIndex",
      "bueiros-br174": "_bueirosBr174Index",
      "bueiros-br230": "_bueirosBr230Index",
      "bueiros-br319": "_bueirosBr319Index",
      pontes: "_pontesIndex",
      jazidas: "_jazidasIndex",
      "prads-br174": "_pradsBr174Index",
      "pca-prads-br319": "_pcaPradsBr319Index",
      "prads-br319": "_pradsBr319Index",
      "pca-prads-cmm-br319": "_pcaPradsCmmBr319Index",
      "pontes-br319": "_pontesBr319Index",
      "pontes-br230": "_pontesBr230Index",
      "uc-estadual": "_ucEstadualIndex",
      "uc-municipal": "_ucMunicipalIndex",
      "ti-am": "_tiAmIndex",
      "hidrovias-am": "_hidroviasAmIndex",
      "map-click": "_mapClickIndex",
    };

  app.matchFeatureIndex = function matchFeatureIndex(features, feature, indexField) {
      if (!features?.length || !feature) return null;
      if (typeof feature[indexField] === "number") return feature[indexField];
      const direct = features.indexOf(feature);
      if (direct >= 0) return direct;
      let geomKey = "";
      try {
        geomKey = JSON.stringify(feature.geometry);
      } catch {
        // ignore
      }
      if (geomKey) {
        const gi = features.findIndex((f) => {
          try {
            return JSON.stringify(f?.geometry) === geomKey;
          } catch {
            return false;
          }
        });
        if (gi >= 0) return gi;
      }
      return null;
    }

  app.ensureMapClickTableLayer = function ensureMapClickTableLayer(selectionKind, feature, options = {}) {
      if (!feature) return null;
      const replace = Boolean(options?.replace);
      const kind = String(selectionKind || "shapefile");
      const layerId = `map-click:${kind}`;
      if (!app.state.mapClickTables) app.state.mapClickTables = {};
      if (!app.state.mapClickTables[layerId]) {
        app.state.mapClickTables[layerId] = {
          selectionKind: kind,
          features: [],
          selectedIndex: null,
          columnKeys: [],
          table: { sortKey: null, sortDir: "asc", filterText: "", columnFilters: {} },
        };
      }
      const entry = app.state.mapClickTables[layerId];

      if (replace) {
        const cloned = { ...feature, _mapClickIndex: 0 };
        entry.features = [cloned];
        entry.selectedIndex = 0;
        entry.columnKeys = app.collectColumnKeysFromFeatures([cloned]);
        try {
          feature._mapClickIndex = 0;
        } catch {
          // ignore
        }
        return layerId;
      }

      let idx = entry.features.indexOf(feature);
      if (idx < 0) {
        idx = entry.features.length;
        const cloned = { ...feature, _mapClickIndex: idx };
        entry.features.push(cloned);
        if (!entry.columnKeys.length) {
          entry.columnKeys = app.collectColumnKeysFromFeatures([cloned]);
        }
        try {
          feature._mapClickIndex = idx;
        } catch {
          // ignore
        }
      } else {
        try {
          feature._mapClickIndex = idx;
        } catch {
          // ignore
        }
      }
      entry.selectedIndex = idx;
      return layerId;
    }

  app.applyTableSelectionFromFeature = function applyTableSelectionFromFeature(layerId, feature) {
      if (!feature || !layerId) return;
      const n = (v) => (typeof v === "number" && !Number.isNaN(v) ? v : null);

      if (String(layerId).startsWith("br-am:")) {
        const key = String(layerId);
        if (!app.state.brAmTables) app.state.brAmTables = { byKey: {} };
        if (!app.state.brAmTables.byKey) app.state.brAmTables.byKey = {};
        if (!app.state.brAmTables.byKey[key]) {
          const id = app.brAmIdFromLayerKey(key);
          app.state.brAmTables.byKey[key] = {
            id,
            name: app.getBrAmNameById(id),
            features: [],
            layersByIndex: {},
            selectedIndex: null,
            columnKeys: [],
            table: { sortKey: null, sortDir: "asc", filterText: "" },
          };
        }
        app.state.brAmTables.byKey[key].selectedIndex = n(feature._brAmIndex);
        return;
      }

      const indexField = app.LAYER_INDEX_FIELDS[layerId] || (String(layerId).startsWith("map-click:") ? "_mapClickIndex" : null);
      let idx =
        indexField && typeof feature[indexField] === "number"
          ? feature[indexField]
          : {
              segmentos: n(feature._tableIndex),
              municipios: n(feature._municipioIndex),
              ip4: n(feature._ip4Index),
              bueiros: n(feature._bueirosIndex),
              "bueiros-br174": n(feature._bueirosBr174Index),
              "bueiros-br230": n(feature._bueirosBr230Index),
              "bueiros-br319": n(feature._bueirosBr319Index),
              pontes: n(feature._pontesIndex),
              jazidas: n(feature._jazidasIndex),
              "prads-br174": n(feature._pradsBr174Index),
              "pca-prads-br319": n(feature._pcaPradsBr319Index),
              "prads-br319": n(feature._pradsBr319Index),
              "pca-prads-cmm-br319": n(feature._pcaPradsCmmBr319Index),
              "pontes-br319": n(feature._pontesBr319Index),
              "pontes-br230": n(feature._pontesBr230Index),
              "uc-estadual": n(feature._ucEstadualIndex),
              "uc-municipal": n(feature._ucMunicipalIndex),
              "ti-am": n(feature._tiAmIndex),
              "hidrovias-am": n(feature._hidroviasAmIndex),
            }[layerId];

      if (typeof idx !== "number" && indexField) {
        const feats = app.getLayerFeaturesArray(layerId);
        const matched = app.matchFeatureIndex(feats, feature, indexField);
        if (typeof matched === "number") {
          idx = matched;
          try {
            feature[indexField] = matched;
          } catch {
            // ignore
          }
        }
      }

      if (String(layerId).startsWith("map-click:")) {
        const entry = app.state.mapClickTables?.[layerId];
        if (entry) entry.selectedIndex = typeof idx === "number" ? idx : n(feature._mapClickIndex);
        return;
      }

      if (typeof idx !== "number") return;

      const stateKey = {
        segmentos: "selectedFeatureIndex",
        municipios: "municipiosSelectedIndex",
        ip4: "ip4SelectedIndex",
        bueiros: "bueirosSelectedIndex",
        "bueiros-br174": "bueirosBr174SelectedIndex",
        "bueiros-br230": "bueirosBr230SelectedIndex",
        "bueiros-br319": "bueirosBr319SelectedIndex",
        pontes: "pontesSelectedIndex",
        jazidas: "jazidasSelectedIndex",
        "prads-br174": "pradsBr174SelectedIndex",
        "pca-prads-br319": "pcaPradsBr319SelectedIndex",
        "prads-br319": "pradsBr319SelectedIndex",
        "pca-prads-cmm-br319": "pcaPradsCmmBr319SelectedIndex",
        "pontes-br319": "pontesBr319SelectedIndex",
        "pontes-br230": "pontesBr230SelectedIndex",
        "uc-estadual": "ucEstadualSelectedIndex",
        "uc-municipal": "ucMunicipalSelectedIndex",
        "ti-am": "tiAmSelectedIndex",
        "hidrovias-am": "hidroviasAmSelectedIndex",
      }[layerId];

      if (stateKey) app.state[stateKey] = idx;
    }

  app.scrollToSelectedTableRow = function scrollToSelectedTableRow() {
      const row = document.querySelector("#all-attributes tr.selected-row");
      row?.scrollIntoView({ block: "nearest" });
    }

  app.openAttributesTableFromMapClick = async function openAttributesTableFromMapClick(selectionKind, feature, layer, options = {}) {
      const { zoomTo = true } = options;
      app.hideFeatureQuickMenu(true);
      app.state.tablePinnedFromMap = true;
      app.resetPeekSelectionSummary();

      // Tabela focada na feição clicada (todos os atributos), ainda minimalista.
      let layerId = app.ensureMapClickTableLayer(selectionKind, feature, { replace: true });
      if (!layerId) {
        layerId = app.resolveTableLayerId(selectionKind, feature);
        if (layerId && app.TABLE_LAYER_IDS.has(String(layerId)) && !app.getLayerFeaturesArray(layerId).length) {
          await app.openAttributesTableForLayer(layerId, { fromMapClick: true });
        }
        if (layerId && app.TABLE_LAYER_IDS.has(String(layerId)) && feature) {
          app.applyTableSelectionFromFeature(layerId, feature);
        } else if (!layerId) {
          return;
        }
      }

      app.state.lastMapClickLayerId = layerId;
      app.applyTableSelectionFromFeature(layerId, feature);
      app.state.tableDataset = layerId;
      app.openBottomSheet();
      app.expandBottomSheet();
      app.refreshPanelTableTitle();
      app.syncGeneralFilterPlaceholder();
      app.syncGeneralFilterValue();
      app.syncPeekSelectionSummary(feature, selectionKind);

      try {
        await app.openAttributesTableForLayer(layerId, { fromMapClick: true });
        app.applyTableSelectionFromFeature(layerId, feature);
        app.rerenderTableForLayerId(layerId);
        app.expandBottomSheet();
        app.scrollToSelectedTableRow();
      } catch {
        // ignore
      }

      if (zoomTo) {
        if (layer?.getBounds) {
          app.applySelectionZoomIfNeeded(layer, selectionKind, true, true);
        } else if (feature) {
          app.zoomToFeatureNow(feature, layer, selectionKind, true);
        }
      }
    }

  app.handleIdentifyClick = function handleIdentifyClick(latlng, options = {}) {
      const { zoomTo = true } = options;
      if (!app.state.map) return;

      let results = app.identifyLayersAtLatLng(latlng);
      if (!results.length) {
        app.state.identify.results = [];
        app.state.identify.activeIndex = 0;
        app.state.bueirosTableHoverPinned = false;
        if (!app.state.featureQuickMenuPinned) app.hideFeatureQuickMenu(true);
        try {
          app.hideMapCoordsControl();
        } catch {
          // ignore
        }
        try {
          app.state.map.closePopup?.();
        } catch {
          // noop
        }
        return;
      }

      app.state.identify.results = results;
      app.state.identify.activeIndex = 0;

      const first = results[0];
      app.handleMapFeatureClick(null, first.feature, first.layer, first.selectionKind, {
        zoomTo,
        identifyResults: results,
        activeIndex: 0,
      });
    }

}
