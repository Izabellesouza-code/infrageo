/* global L */
export function registerContracts(app) {

  app.normalizeContractValue = function normalizeContractValue(v) {
      return (v ?? "").toString().trim();
    }

  app.normalizeContractKey = function normalizeContractKey(v) {
      // Chave canônica para comparar contratos:
      // - sem case sensitive
      // - sem acentos
      // - sem caracteres especiais
      return app.normalizeSearchText(app.normalizeContractValue(v));
    }

  app.normalizeContractLayerDedupeKey = function normalizeContractLayerDedupeKey(label) {
      // Normaliza rótulos vindos de caminhos para deduplicar:
      // - separador / ou \\
      // - remove ".shp"
      // - remove sufixos comuns de duplicação "(1)", "(2)", etc
      const raw = String(label || "").trim().replaceAll("\\", "/");
      const last = raw.split("/").filter(Boolean).at(-1) || raw;
      return last
        .replace(/\.shp$/i, "")
        .replace(/\(\s*\d+\s*\)\s*$/i, "")
        .replace(/\s+/g, " ")
        .toLowerCase()
        // Normaliza variações comuns em nomes de camadas (evita duplicar por grafia diferente)
        .replace(/\bbuieros\b/g, "bueiros")
        .replace(/\bbueiro\b/g, "bueiros")
        .replace(/\bponte\b/g, "pontes");
    }

  app.looksLikeKnownDedicatedLayer = function looksLikeKnownDedicatedLayer(label) {
      // Evita duplicar camadas que já têm endpoint/toggle dedicado
      const s = String(label || "").toLowerCase();
      // IP4 tem toggle/endpoint dedicado
      if (s.includes("ip4")) return true;
      if (s.includes("uc_estadual") || (s.includes("uc") && s.includes("estad"))) return true;
      if (s.includes("uc_municipal") || (s.includes("uc") && s.includes("munic"))) return true;
      if (s.includes("prads")) return true;
      // BR-317 bueiros/snv já têm fluxo próprio
      if (s.includes("br-317") && (s.includes("bueir") || s.includes("rodovia") || s.includes("snv"))) return true;
      // BR-174 bueiros/prads/snv já têm fluxo próprio
      if (s.includes("br-174") && (s.includes("bueir") || s.includes("rodovia") || s.includes("snv") || s.includes("prad"))) return true;
      // BR-230 bueiros/snv já têm fluxo próprio
      if (s.includes("br-230") && (s.includes("bueir") || s.includes("rodovia") || s.includes("snv"))) return true;
      // BR-319 snv/pontes já têm fluxo próprio
      if (
        s.includes("br-319") &&
        (s.includes("rodovia") || s.includes("snv") || s.includes("pontes") || s.includes("ponte") || s.includes("bueir") || s.includes("buier"))
      )
        return true;
      // BR-307 pontes/jazidas já têm fluxo próprio
      if (s.includes("br-307") && (s.includes("ponte") || s.includes("jazid"))) return true;
      return false;
    }

  app.CONTRACT_ATTR_KEYS = new Set(["contrato", "contratos"]);

  app.isContratoColumnKey = function isContratoColumnKey(key) {
      const k = String(key || "").trim().toLowerCase();
      return app.CONTRACT_ATTR_KEYS.has(k);
    }

  app.contractKeyCandidates = function contractKeyCandidates(props) {
      if (!props || typeof props !== "object") return [];
      const out = [];
      for (const k of Object.keys(props)) {
        if (app.isContratoColumnKey(k)) out.push(k);
      }
      return out;
    }

  app.looksLikeContractValue = function looksLikeContractValue(raw) {
      // Requisito: não forçar heurísticas/regex para "validar" contratos.
      // Basta existir texto não vazio.
      const s = app.normalizeContractValue(raw);
      return Boolean(s && app.normalizeSearchText(s));
    }

  app.isIp4Feature = function isIp4Feature(feature) {
      try {
        if (typeof feature?._ip4Index === "number") return true;
      } catch {
        // ignore
      }
      const src = String(feature?.properties?.__source || feature?.properties?._source || "");
      return /ip4/i.test(src);
    }

  app.ip4SourceMatchesFocus = function ip4SourceMatchesFocus(feature) {
      const wanted = app.normalizeSearchText(app.state.ip4FocusSource || "");
      if (!wanted) return true;
      const src = String(feature?.properties?.__source || feature?.properties?._source || "");
      if (!src) return true;
      return app.normalizeSearchText(src) === wanted;
    }

  app.parseContractValues = function parseContractValues(raw) {
      const s = app.normalizeContractValue(raw);
      if (!s) return [];
      // Suporta múltiplos contratos no mesmo campo
      // Ex.: "SR-168-2020; SR-595/20" | "SR-168-2020,SR-595/20" | "SR-168-2020 | SR-595/20"
      return s
        .split(/[;,|\n]/g)
        .map((x) => app.normalizeContractValue(x))
        .filter(Boolean);
    }

  app.contractEquals = function contractEquals(a, b) {
      const aa = app.normalizeContractKey(a);
      const bb = app.normalizeContractKey(b);
      if (!aa || !bb) return false;
      return aa === bb;
    }

  app.getFeatureContracts = function getFeatureContracts(feature) {
      const props = feature?.properties;
      const out = [];
      const seen = new Set();

      // Regra: somente a coluna "contratos" (case-sensitive).
      const candidates = app.contractKeyCandidates(props);
      for (const k of candidates) {
        const vals = app.parseContractValues(props?.[k]);
        for (const v of vals) {
          if (!app.looksLikeContractValue(v)) continue;
          const key = app.normalizeContractKey(v);
          if (!key) continue;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(app.normalizeContractValue(v));
        }
      }
      return out;
    }

  app.featureMatchesContract = function featureMatchesContract(feature) {
      const wanted = app.normalizeContractKey(app.state.contractFilter);
      if (!wanted) return true;
      const vals = app.getFeatureContracts(feature);
      if (!vals.length) return false;
      return vals.some((v) => app.normalizeContractKey(v) === wanted);
    }

  app.featureHasContractColumn = function featureHasContractColumn(feature) {
      const props = feature?.properties;
      return app.contractKeyCandidates(props).length > 0;
    }

  app.setLeafletLayerFilteredVisibility = function setLeafletLayerFilteredVisibility(leafletLayer, visible) {
      if (!leafletLayer) return;
      // Vector (Path)
      if (typeof leafletLayer.setStyle === "function") {
        if (!leafletLayer._igOriginalStyle) {
          // guarda o estilo atual uma vez
          try {
            leafletLayer._igOriginalStyle = { ...(leafletLayer.options || {}) };
          } catch {
            leafletLayer._igOriginalStyle = null;
          }
        }
        const base = leafletLayer._igOriginalStyle || leafletLayer.options || {};
        const next = visible
          ? {
              opacity: base.opacity ?? 1,
              fillOpacity: base.fillOpacity ?? (typeof base.fillColor !== "undefined" ? 0.35 : 0),
            }
          : { opacity: 0, fillOpacity: 0 };
        leafletLayer.setStyle(next);
        const el = leafletLayer.getElement?.();
        if (el) el.style.pointerEvents = visible ? "" : "none";
        return;
      }
      // Marker
      if (typeof leafletLayer.setOpacity === "function") {
        leafletLayer.setOpacity(visible ? 1 : 0);
        const el = leafletLayer.getElement?.();
        if (el) el.style.pointerEvents = visible ? "" : "none";
      }
    }

  app.pointAsCircleMarker = function pointAsCircleMarker(latlng) {
      // Evita o marcador azul padrão do Leaflet em camadas genéricas/descobertas
      return L.circleMarker(latlng, {
        radius: 6,
        color: "#2862ab",
        weight: 2,
        opacity: 0.95,
        fillColor: "#ffffff",
        fillOpacity: 0.85,
      });
    }

  app.applyContractFilterToLeafletGroup = function applyContractFilterToLeafletGroup(groupLayer) {
      if (!groupLayer?.eachLayer) return;
      const hasContract = Boolean(app.normalizeContractKey(app.state.contractFilter));
      const hasMun = Boolean(app.normalizeSearchText(app.state.municipioFilter || ""));
      groupLayer.eachLayer((leafletLayer) => {
        const f = leafletLayer?.feature;
        if (!f) {
          app.setLeafletLayerFilteredVisibility(leafletLayer, true);
          return;
        }
        let ok = true;
        if (hasContract) {
          // Camadas sem coluna "contratos": não entram no filtro de contrato
          if (app.featureHasContractColumn(f)) ok = ok && app.featureMatchesContract(f);
        }
        if (hasMun) {
          ok = ok && app.featureMatchesMunicipio(f);
        }
        if (ok && app.isIp4Feature(f)) ok = app.ip4SourceMatchesFocus(f);
        app.setLeafletLayerFilteredVisibility(leafletLayer, ok);
      });
    }

  app.applyContractFilterToMap = function applyContractFilterToMap() {
      // Aplica somente nas camadas existentes/ligadas
      const layers = [
        app.state.geojsonLayer,
        app.state.bueirosLayer,
        app.state.pontesBr307Layer,
        app.state.jazidasBr307Layer,
        app.state.pontesBr319Layer,
        app.state.pontesBr230Layer,
        app.state.bueirosBr174Layer,
        app.state.bueirosBr230Layer,
        app.state.bueirosBr319Layer,
        app.state.pradsBr174Layer,
        app.state.pcaPradsBr319Layer,
        app.state.pradsBr319Layer,
        app.state.ucEstadualLayer,
        app.state.pcaPradsCmmBr319Layer,
        app.state.ucMunicipalLayer,
        app.state.tiAmLayer,
        app.state.hidroviasAmLayer,
        app.state.ip4Layer,
      ];
      for (const l of layers) app.applyContractFilterToLeafletGroup(l);
      try {
        const brAmLayers = app.state.brAm?.layersById ? Object.values(app.state.brAm.layersById) : [];
        for (const l of brAmLayers) app.applyContractFilterToLeafletGroup(l);
      } catch {
        // ignore
      }

      // Aplica também nas camadas descobertas (extraContractSources) que já foram adicionadas ao mapa.
      for (const src of app.state.extraContractSources || []) {
        if (src?.layer) app.applyContractFilterToLeafletGroup(src.layer);
      }
    }

  app.buildExtraContractLayerOnMap = function buildExtraContractLayerOnMap(src) {
      if (!app.state.map || !src?.features?.length) return null;
      app.ensureInfraGeoPanes();
      if (src.layer) {
        app.ensureLayerVisibleOnMap(src.layer);
        return src.layer;
      }
      // Camadas "descobertas" (extra): precisam de hover (popup) com info mínima.
      const inferKindFromLabel = (label) => {
        const s = String(label || "").toLowerCase();
        if (s.includes("bueiro")) return s.includes("319") ? "bueiros-br319" : s.includes("174") ? "bueiros-br174" : s.includes("230") ? "bueiros-br230" : "bueiros";
        if (s.includes("ponte")) return s.includes("319") ? "pontes-br319" : s.includes("230") ? "pontes-br230" : "pontes";
        if (s.includes("jazid")) return "jazidas";
        if (s.includes("hidrovia")) return "hidrovias-am";
        if (s.includes("uc") && s.includes("estad")) return "uc-estadual";
        if (s.includes("uc") && s.includes("munic")) return "uc-municipal";
        if (s.includes("terra") || s.includes("ti")) return "ti-am";
        if (s.includes("snv")) {
        }
        return "segmentos";
      };
      const inferredKind = inferKindFromLabel(src.label);

      // Leve: exibe geometria e habilita hover tooltip.
      const data = { type: "FeatureCollection", features: src.features };
      const layer = L.geoJSON(data, {
        pane: app.state.panes?.lines,
        interactive: true,
        style: () => ({ color: "#2862ab", weight: 2.2, opacity: 0.95, fillOpacity: 0.12 }),
        pointToLayer(_feature, latlng) {
          const m = app.pointAsCircleMarker(latlng);
          try {
            if (m?.options) m.options.pane = app.state.panes?.points;
          } catch {
            // noop
          }
          return m;
        },
        onEachFeature(feature, leafletLayer) {
          app.setLayerIdentifyMeta(leafletLayer, feature, inferredKind);
          app.attachQuickHover(leafletLayer, feature, inferredKind);
          app.bindLayerIdentifyClick(leafletLayer);
        },
      });
      src.layer = layer;
      layer.addTo(app.state.map);
      return layer;
    }

  app.ensureAllContractLayersOnMap = async function ensureAllContractLayersOnMap() {
      const contract = app.normalizeContractValue(state.contractFilter);
      if (!contract) return;
      // Garante que camadas do contrato possam ser ligadas mesmo após bulk-off.
      if (state.bulkLayersIntent === "off") state.bulkLayersIntent = null;

      // Camadas "fixas": só liga se tiver registros para o contrato.
      const need = (label, feats, toggleEl, ensureFn, getLayerFn) => {
        const n = app.layerCountForContract(feats, contract);
        if (n <= 0) return Promise.resolve();
        if (toggleEl) toggleEl.checked = true;
        if (!ensureFn) return Promise.resolve();
        return Promise.resolve(ensureFn()).finally(() => {
          const lyr = getLayerFn?.();
          if (lyr) app.ensureLayerVisibleOnMap(lyr, { force: true });
        });
      };

      await Promise.allSettled([
        need("Bueiros BR-317", state.bueirosFeatures, layerBueirosToggle, ensureBueirosBr317OnMap, () => state.bueirosLayer),
        need("Pontes BR-307", state.pontesFeatures, layerPontesToggle, ensurePontesBr307OnMap, () => state.pontesBr307Layer),
        need("Jazidas BR-307", state.jazidasFeatures, layerJazidasToggle, ensureJazidasBr307OnMap, () => state.jazidasBr307Layer),
        need("IP4", state.ip4Features, layerIp4Toggle, ensureIp4OnMap, () => state.ip4Layer),
        need("Pontes BR-319", state.pontesBr319Features, layerPontesBr319Toggle, ensurePontesBr319OnMap, () => state.pontesBr319Layer),
        need("Pontes BR-230", state.pontesBr230Features, layerPontesBr230Toggle, ensurePontesBr230OnMap, () => state.pontesBr230Layer),
        need("Bueiros BR-319", state.bueirosBr319Features, layerBueirosBr319Toggle, ensureBueirosBr319OnMap, () => state.bueirosBr319Layer),
        need("UC Estadual", state.ucEstadualFeatures, layerUcEstadualToggle, ensureUcEstadualOnMap, () => state.ucEstadualLayer),
        need("UC Municipal", state.ucMunicipalFeatures, layerUcMunicipalToggle, ensureUcMunicipalOnMap, () => state.ucMunicipalLayer),
        need("Bueiros BR-174", state.bueirosBr174Features, layerBueirosBr174Toggle, ensureBueirosBr174OnMap, () => state.bueirosBr174Layer),
        need("PRADS BR-174", state.pradsBr174Features, layerPradsBr174Toggle, ensurePradsBr174OnMap, () => state.pradsBr174Layer),
        need("PCA - PRADS BR-319", state.pcaPradsBr319Features, layerPcaPradsBr319Toggle, ensurePcaPradsBr319OnMap, () => state.pcaPradsBr319Layer),
        need("PRADS BR-319", state.pradsBr319Features, layerPradsBr319Toggle, ensurePradsBr319OnMap, () => state.pradsBr319Layer),
        need("PCA - PRADS CMM BR-319", state.pcaPradsCmmBr319Features, layerPcaPradsCmmBr319Toggle, ensurePcaPradsCmmBr319OnMap, () => state.pcaPradsCmmBr319Layer),
        need("Bueiros BR-230", state.bueirosBr230Features, layerBueirosBr230Toggle, ensureBueirosBr230OnMap, () => state.bueirosBr230Layer),
        need("TI AM", state.tiAmFeatures, layerTiAmToggle, ensureTiAmOnMap, () => state.tiAmLayer),
        need("Hidrovias AM", state.hidroviasAmFeatures, layerHidroviasAmToggle, ensureHidroviasAmOnMap, () => state.hidroviasAmLayer),
      ]);

      // Camadas descobertas: cria layer no mapa somente se tiver registros do contrato.
      for (const src of state.extraContractSources || []) {
        const n = app.layerCountForContract(src?.features || [], contract);
        if (n <= 0) continue;
        app.buildExtraContractLayerOnMap(src);
      }
    }

  app.collectSortedContractValues = function collectSortedContractValues() {
      const allSets = app.getContractLayerFeatureSets();
      // Não incluir `extraContractSources` no dropdown (podem não ter tabela no UI).
      const mergedByKey = new Map();
      for (const feats of allSets) {
        for (const f of feats || []) {
          for (const v of app.getFeatureContracts(f)) {
            const display = app.normalizeContractValue(v);
            const key = app.normalizeContractKey(display);
            if (!key) continue;
            if (!mergedByKey.has(key)) mergedByKey.set(key, display);
          }
        }
      }
      const sorted = Array.from(mergedByKey.values());
      sorted.sort((a, b) => app.normalizeContractKey(a).localeCompare(app.normalizeContractKey(b), "pt-BR"));
      return { mergedByKey, sorted };
    }

  app.refreshContractOptions = function refreshContractOptions() {
      if (!app.menuContractSelect) return;
      const { mergedByKey, sorted } = app.collectSortedContractValues();

      // Prefere o valor atual do select; se estiver vazio, preserva state.contractFilter.
      const prev = app.normalizeContractValue(app.menuContractSelect.value || app.state.contractFilter);

      app.menuContractSelect.innerHTML = [
        `<option value="">Todos</option>`,
        ...sorted.map((v) => `<option value="${app.escapeHtml(v)}">${app.escapeHtml(v)}</option>`),
      ].join("");

      const prevKey = app.normalizeContractKey(prev);
      if (prevKey && mergedByKey.has(prevKey)) {
        app.menuContractSelect.value = mergedByKey.get(prevKey) || prev;
        app.state.contractFilter = app.normalizeContractValue(app.menuContractSelect.value);
      } else if (prevKey && !app.state.contractSourcesLoaded) {
        // Ainda carregando: não apaga o filtro escolhido pelo usuário.
        app.menuContractSelect.value = prev;
      } else if (!prevKey) {
        app.menuContractSelect.value = "";
      } else {
        // Lista final não contém o valor — volta para Todos sem perder UI de sync.
        app.menuContractSelect.value = "";
        app.state.contractFilter = "";
      }

      try {
        app.renderGlobalSearchContractsPanel();
      } catch {
        // ignore
      }
    }

  app.selectContractFilterValue = function selectContractFilterValue(rawValue) {
      const display = app.normalizeContractValue(rawValue);
      app.state.contractFilter = display;
      app.state.contractFocusLayerLabel = "";
      try {
        if (app.normalizeContractKey(display)) {
          app.state.globalSearch.enabledKinds.add("contratos");
        } else {
          app.state.globalSearch.enabledKinds.delete("contratos");
        }
      } catch {
        // ignore
      }
      if (app.menuContractSelect) {
        const wantKey = app.normalizeContractKey(display);
        let matched = false;
        for (const opt of Array.from(app.menuContractSelect.options || [])) {
          const ov = String(opt.value || "");
          if (ov === display || app.normalizeContractKey(ov) === wantKey) {
            app.menuContractSelect.value = ov;
            matched = true;
            break;
          }
        }
        if (!matched) {
          if (display) {
            const opt = document.createElement("option");
            opt.value = display;
            opt.textContent = display;
            app.menuContractSelect.appendChild(opt);
          }
          app.menuContractSelect.value = display;
        }
      }
      try {
        app.renderGlobalSearchContractsPanel();
      } catch {
        // ignore
      }
      void app.applyContractFilterAndShowResults();
    }

  app.getMunicipioNomeFromPropsFast = function getMunicipioNomeFromPropsFast(props) {
      const p = props || {};
      const keys = [
        "nm_municipio",
        "NM_MUNICIPIO",
        "municipio",
        "MUNICIPIO",
        "Nome",
        "NOME",
        "nome",
        "NAME",
      ];
      for (const k of keys) {
        if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
        const s = app.normalizePtBrText(p[k]).trim();
        if (!s || /^\d+$/.test(s) || !/[A-Za-zÀ-ÿ]/.test(s) || s.length > 80) continue;
        return s;
      }
      return "";
    }

  app.getIp4MunicipioNome = function getIp4MunicipioNome(feature) {
      const p = feature?.properties || {};
      for (const k of ["Nome", "NOME", "nome"]) {
        if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
        const s = app.normalizePtBrText(p[k]).trim();
        if (s) return s;
      }
      return "";
    }

  app.municipioNameMatchesWanted = function municipioNameMatchesWanted(featureName, wantedRaw) {
      const a = app.normalizeSearchText(featureName || "");
      const b = app.normalizeSearchText(wantedRaw || "");
      if (!a || !b) return false;
      if (a === b) return true;
      // Ex.: "Urucará" ↔ "Urucará"; "Manaus (São Raimundo)" ↔ "Manaus"
      if (a.startsWith(b + " ") || a.startsWith(b + "(") || a.startsWith(b + " (")) return true;
      return false;
    }

  app.ensureMunicipiosFilterListLoaded = async function ensureMunicipiosFilterListLoaded() {
      if (app.state.municipioFilterListLoaded) return app.state.municipioFilterOptions;
      if (app.state.municipioFilterListPromise) return app.state.municipioFilterListPromise;

      app.state.municipioFilterListPromise = (async () => {
        try {
          let feats = (app.state.municipiosFeatures || []).filter(Boolean);
          if (!feats.length) {
            // Cede um frame para a UI pintar o painel ("Carregando…") antes do fetch/parse.
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
            const rpData = await app.fetchLayerGeoJson("/layers/limite-municipal/polygons").catch(() => null);
            feats = Array.isArray(rpData?.features) ? rpData.features : [];
            if (feats.length && !(app.state.municipiosFeatures || []).length) {
              app.state.municipiosFeatures = feats.map((f, i) => {
                try {
                  f._municipioIndex = i;
                } catch {
                  // ignore
                }
                return f;
              });
            }
          }

          const mergedByKey = new Map();
          for (const f of feats) {
            const display =
              app.getMunicipioNomeFromPropsFast(f?.properties) || app.getMunicipioNomeFromProps(f?.properties);
            const key = app.normalizeSearchText(display);
            if (!key) continue;
            if (!mergedByKey.has(key)) mergedByKey.set(key, display);
          }
          const sorted = Array.from(mergedByKey.values());
          sorted.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
          app.state.municipioFilterOptions = sorted;
          app.state.municipioFilterListLoaded = true;
          return sorted;
        } catch {
          app.state.municipioFilterOptions = [];
          app.state.municipioFilterListLoaded = true;
          return [];
        } finally {
          app.state.municipioFilterListPromise = null;
        }
      })();

      return app.state.municipioFilterListPromise;
    }

  app.collectSortedMunicipioValues = function collectSortedMunicipioValues() {
      if (app.state.municipioFilterOptions?.length) {
        const mergedByKey = new Map();
        for (const v of app.state.municipioFilterOptions) {
          const key = app.normalizeSearchText(v);
          if (key) mergedByKey.set(key, v);
        }
        return { mergedByKey, sorted: app.state.municipioFilterOptions.slice() };
      }
      const mergedByKey = new Map();
      for (const f of app.state.municipiosFeatures || []) {
        if (!f) continue;
        const display =
          app.getMunicipioNomeFromPropsFast(f?.properties) || app.getMunicipioNomeFromProps(f?.properties);
        const key = app.normalizeSearchText(display);
        if (!key) continue;
        if (!mergedByKey.has(key)) mergedByKey.set(key, display);
      }
      const sorted = Array.from(mergedByKey.values());
      sorted.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
      return { mergedByKey, sorted };
    }

  app.clearMunicipioFilterOnly = function clearMunicipioFilterOnly(options = {}) {
      const keepKind = Boolean(options?.keepKind);
      const had = Boolean(app.normalizeSearchText(app.state.municipioFilter || ""));
      app.state.municipioFilter = "";
      app.state.municipioFilterBounds = null;
      app.state.municipioFocusLayerLabel = "";
      if (!keepKind) {
        try {
          app.state.globalSearch.enabledKinds.delete("municipios");
        } catch {
          // ignore
        }
      }
      try {
        if (app.municipioFilterPopup) {
          app.municipioFilterPopup.hidden = true;
          app.municipioFilterPopup.innerHTML = "";
        }
      } catch {
        // ignore
      }
      try {
        app.applyContractFilterToMap();
      } catch {
        // ignore
      }
      try {
        app.renderGlobalSearchMunicipiosPanel();
      } catch {
        // ignore
      }
      try {
        if (app.state.tableDataset === "municipios") {
          app.closeBottomSheet();
        } else if (app.state.tableDataset) {
          app.rerenderTableForLayerId(app.state.tableDataset);
        }
      } catch {
        // ignore
      }
      if (had) {
        try {
          app.setStatus("Município: filtro removido", "ok");
        } catch {
          // ignore
        }
      }
    }

  app.getFeatureMunicipioName = function getFeatureMunicipioName(feature) {
      if (typeof feature?._ip4Index === "number") {
        const ip4Nome = app.getIp4MunicipioNome(feature);
        if (ip4Nome) return ip4Nome;
      }
      const p = feature?.properties || {};
      return (
        app.getMunicipioNomeFromPropsFast(p) ||
        app.getMunicipioNomeFromProps(p) ||
        app.getFirstNonEmptyValue(p, [
          "nm_municipio",
          "NM_MUNICIPIO",
          "municipio",
          "MUNICIPIO",
          "municipio_",
          "Municipio",
          "Nome",
          "NOME",
          "nome",
        ]) ||
        ""
      );
    }

  app.getSelectedMunicipioBounds = function getSelectedMunicipioBounds() {
      if (app.state.municipioFilterBounds?.isValid?.()) return app.state.municipioFilterBounds;
      const wanted = app.normalizeSearchText(app.state.municipioFilter || "");
      if (!wanted) return null;
      const feats = app.state.municipiosFeatures || [];
      let idx = feats.findIndex((f) => app.normalizeSearchText(app.getMunicipioNomeFromProps(f?.properties)) === wanted);
      if (idx < 0) {
        idx = feats.findIndex(
          (f) => app.normalizeSearchText(app.getMunicipioNomeFromPropsFast(f?.properties)) === wanted,
        );
      }
      if (idx < 0) return null;
      let b = null;
      try {
        b = app.state.municipiosLayersByIndex?.[idx]?.getBounds?.();
      } catch {
        b = null;
      }
      if (!b?.isValid?.()) {
        try {
          b = L.geoJSON(feats[idx]).getBounds?.();
        } catch {
          b = null;
        }
      }
      if (b?.isValid?.()) app.state.municipioFilterBounds = b;
      return app.state.municipioFilterBounds;
    }

  app.getFeatureLatLngApprox = function getFeatureLatLngApprox(feature) {
      const g = feature?.geometry;
      if (!g) return null;
      const walk = (coords) => {
        if (!Array.isArray(coords) || !coords.length) return null;
        if (typeof coords[0] === "number" && typeof coords[1] === "number") {
          return L.latLng(coords[1], coords[0]);
        }
        return walk(coords[0]);
      };
      try {
        if (g.type === "Point") return L.latLng(g.coordinates[1], g.coordinates[0]);
        return walk(g.coordinates);
      } catch {
        return null;
      }
    }

  app.featureMatchesMunicipio = function featureMatchesMunicipio(feature) {
      const wanted = app.normalizeSearchText(app.state.municipioFilter || "");
      if (!wanted) return true;
      // IP4: filtrar estritamente pela coluna Nome/NOME do município.
      if (typeof feature?._ip4Index === "number") {
        return app.municipioNameMatchesWanted(app.getIp4MunicipioNome(feature), app.state.municipioFilter);
      }
      const name = app.getFeatureMunicipioName(feature);
      if (name) return app.municipioNameMatchesWanted(name, app.state.municipioFilter);
      const munBounds = app.getSelectedMunicipioBounds();
      if (!munBounds?.isValid?.()) return false;
      const ll = app.getFeatureLatLngApprox(feature);
      if (ll) return munBounds.contains(ll);
      try {
        const fb = L.geoJSON(feature).getBounds?.();
        return Boolean(fb?.isValid?.() && (munBounds.intersects(fb) || munBounds.contains(fb.getCenter())));
      } catch {
        return false;
      }
    }

  app.layerCountForMunicipio = function layerCountForMunicipio(features, municipio) {
      const wanted = app.normalizeSearchText(municipio || "");
      if (!wanted || !features?.length) return 0;
      let n = 0;
      for (const f of features) {
        const name =
          typeof f?._ip4Index === "number" ? app.getIp4MunicipioNome(f) : app.getFeatureMunicipioName(f);
        if (!name) continue;
        if (app.municipioNameMatchesWanted(name, municipio)) n++;
      }
      return n;
    }

  app.ensureAllMunicipioLayersOnMap = async function ensureAllMunicipioLayersOnMap() {
      const municipio = app.normalizePtBrText(state.municipioFilter || "").trim();
      const wanted = app.normalizeSearchText(municipio);
      if (!wanted) return;
      if (state.bulkLayersIntent === "off") state.bulkLayersIntent = null;

      const need = (feats, toggleEl, ensureFn, getLayerFn) => {
        const n = app.layerCountForMunicipio(feats, municipio);
        if (n <= 0) return Promise.resolve();
        if (toggleEl) toggleEl.checked = true;
        if (!ensureFn) return Promise.resolve();
        return Promise.resolve(ensureFn()).finally(() => {
          const lyr = getLayerFn?.();
          if (lyr) app.ensureLayerVisibleOnMap(lyr, { force: true });
        });
      };

      await Promise.allSettled([
        need(state.bueirosFeatures, layerBueirosToggle, ensureBueirosBr317OnMap, () => state.bueirosLayer),
        need(state.pontesFeatures, layerPontesToggle, ensurePontesBr307OnMap, () => state.pontesBr307Layer),
        need(state.jazidasFeatures, layerJazidasToggle, ensureJazidasBr307OnMap, () => state.jazidasBr307Layer),
        need(state.ip4Features, layerIp4Toggle, ensureIp4OnMap, () => state.ip4Layer),
        need(state.pontesBr319Features, layerPontesBr319Toggle, ensurePontesBr319OnMap, () => state.pontesBr319Layer),
        need(state.pontesBr230Features, layerPontesBr230Toggle, ensurePontesBr230OnMap, () => state.pontesBr230Layer),
        need(state.bueirosBr319Features, layerBueirosBr319Toggle, ensureBueirosBr319OnMap, () => state.bueirosBr319Layer),
        need(state.ucEstadualFeatures, layerUcEstadualToggle, ensureUcEstadualOnMap, () => state.ucEstadualLayer),
        need(state.ucMunicipalFeatures, layerUcMunicipalToggle, ensureUcMunicipalOnMap, () => state.ucMunicipalLayer),
        need(state.bueirosBr174Features, layerBueirosBr174Toggle, ensureBueirosBr174OnMap, () => state.bueirosBr174Layer),
        need(state.pradsBr174Features, layerPradsBr174Toggle, ensurePradsBr174OnMap, () => state.pradsBr174Layer),
        need(state.pcaPradsBr319Features, layerPcaPradsBr319Toggle, ensurePcaPradsBr319OnMap, () => state.pcaPradsBr319Layer),
        need(state.pradsBr319Features, layerPradsBr319Toggle, ensurePradsBr319OnMap, () => state.pradsBr319Layer),
        need(state.pcaPradsCmmBr319Features, layerPcaPradsCmmBr319Toggle, ensurePcaPradsCmmBr319OnMap, () => state.pcaPradsCmmBr319Layer),
        need(state.bueirosBr230Features, layerBueirosBr230Toggle, ensureBueirosBr230OnMap, () => state.bueirosBr230Layer),
        need(state.tiAmFeatures, layerTiAmToggle, ensureTiAmOnMap, () => state.tiAmLayer),
        need(state.hidroviasAmFeatures, layerHidroviasAmToggle, ensureHidroviasAmOnMap, () => state.hidroviasAmLayer),
      ]);
    }

  app.fitMapToMunicipioInLayerGroup = function fitMapToMunicipioInLayerGroup(groupLayer) {
      if (!app.state.map || !groupLayer?.eachLayer) return;
      let bounds = null;
      groupLayer.eachLayer((leafletLayer) => {
        const f = leafletLayer?.feature;
        if (!f || !app.featureMatchesMunicipio(f)) return;
        let b = null;
        try {
          b = leafletLayer.getBounds?.();
        } catch {
          b = null;
        }
        if (!b?.isValid?.()) {
          try {
            b = L.geoJSON(f).getBounds?.();
          } catch {
            b = null;
          }
        }
        if (!b?.isValid?.()) return;
        bounds = bounds ? bounds.extend(b) : b;
      });
      if (bounds?.isValid?.()) {
        app.state.map.fitBounds(bounds, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
      }
    }

  app.showMunicipioLayersPopup = function showMunicipioLayersPopup(municipio) {
      if (!app.municipioFilterPopup) return;
      const c = app.normalizePtBrText(municipio || "").trim();
      if (!c) {
        app.municipioFilterPopup.hidden = true;
        app.municipioFilterPopup.innerHTML = "";
        return;
      }

      // Evita conflito visual/cliques com o painel de mapa base (mesmo canto direito).
      try {
        app.mapBasemapControl?.classList.remove("is-open");
        app.mapBasemapBtn?.setAttribute("aria-expanded", "false");
      } catch {
        // ignore
      }

      const parts = [];
      for (const entry of app.getContractLayerCatalog()) {
        const n = app.layerCountForMunicipio(entry.feats(), c);
        if (n <= 0) continue;
        const isSelected =
          app.normalizeSearchText(app.state.municipioFocusLayerLabel) === app.normalizeSearchText(entry.label);
        const cls = `menu-contract-pill${isSelected ? " is-selected" : ""}`;
        parts.push(
          `<button type="button" class="${cls}" data-municipio-layer-kind="${app.escapeHtml(
            entry.kind,
          )}" data-municipio-layer-label="${app.escapeHtml(entry.label)}" aria-pressed="${
            isSelected ? "true" : "false"
          }">${app.escapeHtml(entry.label)}: ${n}</button>`,
        );
      }

      app.municipioFilterPopup.innerHTML = `
        <div class="municipio-filter-popup__head">
          <div class="municipio-filter-popup__title">${app.escapeHtml(c)}</div>
          <button type="button" class="btn btn--ghost municipio-filter-popup__close" data-municipio-popup-close="1" aria-label="Fechar">✕</button>
        </div>
        <div class="municipio-filter-popup__meta">
          ${
            parts.length
              ? parts.join("")
              : `<span class="menu-contract-pill">Nenhuma camada com este município</span>`
          }
        </div>
        <div class="municipio-filter-popup__hint">Toque numa camada para focar no mapa</div>
      `;
      app.municipioFilterPopup.hidden = false;
    }

  app.pickMunicipioMatchedCatalogEntry = function pickMunicipioMatchedCatalogEntry(preferredKind) {
      const municipio = app.state.municipioFilter || "";
      const catalog = app.getContractLayerCatalog();
      const prefer = String(preferredKind || app.state.municipioFocusLayerLabel || "").trim();
      if (prefer) {
        const byKind = catalog.find(
          (e) =>
            e.kind === prefer && app.layerCountForMunicipio(e.feats(), municipio) > 0,
        );
        if (byKind) return byKind;
        const byLabel = catalog.find(
          (e) =>
            app.normalizeSearchText(e.label) === app.normalizeSearchText(prefer) &&
            app.layerCountForMunicipio(e.feats(), municipio) > 0,
        );
        if (byLabel) return byLabel;
      }
      return (
        catalog.find((e) => app.layerCountForMunicipio(e.feats(), municipio) > 0) || null
      );
    }

  app.openMunicipioMatchedLayerTable = async function openMunicipioMatchedLayerTable(preferredKind) {
      // Nunca abre a tabela "Municípios (AM)" no filtro — só o SHP com dados do município.
      if (app.state.tableDataset === "municipios") {
        try {
          app.closeBottomSheet();
        } catch {
          // ignore
        }
      }
      const entry = app.pickMunicipioMatchedCatalogEntry(preferredKind);
      if (!entry) return null;
      const layerId = app.tableLayerIdFromKind(entry.kind);
      if (!layerId) return null;
      app.state.municipioFocusLayerLabel = entry.label;
      await app.openAttributesTableForLayer(layerId);
      return entry;
    }

  app.applyMunicipioFilterAndShowResults = async function applyMunicipioFilterAndShowResults() {
      const wanted = app.normalizeSearchText(app.state.municipioFilter || "");
      if (!wanted) {
        app.showMunicipioLayersPopup("");
        app.applyContractFilterToMap();
        try {
          if (app.state.tableDataset && app.state.tableDataset !== "municipios") {
            app.rerenderTableForLayerId(app.state.tableDataset);
          } else if (app.state.tableDataset === "municipios") {
            app.closeBottomSheet();
          }
        } catch {
          // ignore
        }
        app.setStatus("Município: Todos", "ok");
        return;
      }
      if (app.state.bulkLayersIntent === "off") app.state.bulkLayersIntent = null;
      app.state.municipioFilterBounds = null;
      app.state.municipioFocusLayerLabel = "";
      app.setStatus(`Município: aplicando filtro ${app.state.municipioFilter}…`, "info");
      app.showMunicipioLayersPopup(app.state.municipioFilter);
      try {
        if (app.layerLimiteMunicipalToggle) app.layerLimiteMunicipalToggle.checked = true;
        await app.ensureMunicipiosFilterListLoaded();
        await new Promise((r) => setTimeout(r, 0));
        await app.attachLimiteMunicipalLayerIfNeeded();
        app.applyLimiteMunicipalVisibility();

        const idx = await app.findGlobalSearchHitInMunicipios(app.state.municipioFilter);
        if (idx < 0) {
          app.setStatus(`Município: ${app.state.municipioFilter} não encontrado`, "error");
          return;
        }
        const feature = app.state.municipiosFeatures?.[idx];
        const lyr = app.state.municipiosLayersByIndex?.[idx] || null;
        const nm =
          app.getMunicipioNomeFromPropsFast(feature?.properties) ||
          app.getMunicipioNomeFromProps(feature?.properties) ||
          app.state.municipioFilter;
        app.state.municipioFilter = nm;
        app.state.municipioFilterBounds = null;

        if (lyr && app.state.map) {
          try {
            const b = lyr.getBounds?.();
            if (b?.isValid?.()) {
              app.state.municipioFilterBounds = b;
              app.state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24], maxZoom: 11 });
            }
          } catch {
            // ignore
          }
        }

        // Carrega atributos das camadas e liga as que têm feições neste município.
        await app.ensureContractSourcesLoaded();
        app.state.suppressAutoOpenTableOnLayerToggle = true;
        try {
          await app.ensureAllMunicipioLayersOnMap();
        } finally {
          app.state.suppressAutoOpenTableOnLayerToggle = false;
        }
        app.applyContractFilterToMap();
        app.showMunicipioLayersPopup(nm);

        // Tabela = SHP filtrado (IP4 etc.), não Limite Municipal / Municípios AM.
        const matched = await app.openMunicipioMatchedLayerTable("ip4");
        try {
          app.renderLayerLegend();
        } catch {
          // ignore
        }
        app.setStatus(
          matched
            ? `Município: ${nm} — tabela ${matched.label}`
            : `Município: ${nm} — camadas filtradas`,
          "ok",
        );
      } catch {
        app.setStatus("Município: não foi possível aplicar o filtro", "error");
      }
    }

  app.selectMunicipioFilterValue = function selectMunicipioFilterValue(rawValue) {
      const display = app.normalizePtBrText(rawValue || "").trim();
      app.state.municipioFilter = display;
      try {
        app.state.globalSearch.enabledKinds.add("municipios");
      } catch {
        // ignore
      }
      try {
        app.renderGlobalSearchMunicipiosPanel();
      } catch {
        // ignore
      }
      if (!app.normalizeSearchText(display)) {
        app.clearMunicipioFilterOnly({ keepKind: true });
        return;
      }
      void app.applyMunicipioFilterAndShowResults();
    }

  app.fetchGeojsonFeatures = async function fetchGeojsonFeatures(url, indexField) {
      try {
        const r = await fetch(url);
        if (!r.ok) return [];
        const data = await r.json();
        const feats = data.features || [];
        return feats.map((f, i) => ({ ...f, [indexField]: i }));
      } catch {
        return [];
      }
    }

  app.ensureContractSourcesLoaded = async function ensureContractSourcesLoaded() {
      if (app.state.contractSourcesLoaded) return;
      // Evita "corrida": se já está carregando, aguarda o mesmo Promise.
      if (app.state.contractSourcesLoadPromise) return app.state.contractSourcesLoadPromise;

      app.state.contractSourcesLoadPromise = (async () => {
        app.state.contractSourcesAttempted = true;

        // Carrega sob demanda (apenas para montar lista de contratos e contagens do popup).
        if (!app.state.bueirosFeatures.length) {
          app.state.bueirosFeatures = await app.fetchGeojsonFeatures("/layers/bueiros-br317", "_bueirosIndex");
        }
        if (!app.state.pontesFeatures.length) {
          app.state.pontesFeatures = await app.fetchGeojsonFeatures("/layers/pontes-br307", "_pontesIndex");
        }
        if (!app.state.jazidasFeatures.length) {
          // Jazidas: o endpoint principal pode ser pesado, mas precisamos de properties para contrato.
          app.state.jazidasFeatures = await app.fetchGeojsonFeatures("/layers/jazidas-br307", "_jazidasIndex");
        }
        if (!app.state.bueirosBr174Features.length) {
          app.state.bueirosBr174Features = await app.fetchGeojsonFeatures("/layers/bueiros-br174", "_bueirosBr174Index");
        }
        if (!app.state.pradsBr174Features.length) {
          app.state.pradsBr174Features = await app.fetchGeojsonFeatures("/layers/prads-br174", "_pradsBr174Index");
        }
        if (!app.state.pcaPradsBr319Features.length) {
          app.state.pcaPradsBr319Features = await app.fetchGeojsonFeatures("/layers/pca-prads-br319", "_pcaPradsBr319Index");
        }
        if (!app.state.pradsBr319Features.length) {
          app.state.pradsBr319Features = await app.fetchGeojsonFeatures("/layers/prads-br319", "_pradsBr319Index");
        }
        if (!app.state.pcaPradsCmmBr319Features.length) {
          app.state.pcaPradsCmmBr319Features = await app.fetchGeojsonFeatures("/layers/pca-prads-cmm-br319", "_pcaPradsCmmBr319Index");
        }
        if (!app.state.bueirosBr230Features.length) {
          app.state.bueirosBr230Features = await app.fetchGeojsonFeatures("/layers/bueiros-br230", "_bueirosBr230Index");
        }
        if (!app.state.pontesBr319Features.length) {
          app.state.pontesBr319Features = await app.fetchGeojsonFeatures("/layers/pontes-br319", "_pontesBr319Index");
        }
        if (!app.state.pontesBr230Features.length) {
          app.state.pontesBr230Features = await app.fetchGeojsonFeatures("/layers/pontes-br230", "_pontesBr230Index");
        }
        if (!app.state.bueirosBr319Features.length) {
          app.state.bueirosBr319Features = await app.fetchGeojsonFeatures("/layers/bueiros-br319", "_bueirosBr319Index");
        }
        if (!app.state.ucEstadualFeatures.length) {
          app.state.ucEstadualFeatures = await app.fetchGeojsonFeatures("/layers/uc-estadual", "_ucEstadualIndex");
        }
        if (!app.state.ucMunicipalFeatures.length) {
          app.state.ucMunicipalFeatures = await app.fetchGeojsonFeatures("/layers/uc-municipal", "_ucMunicipalIndex");
        }
        if (!app.state.ip4Features.length) {
          app.state.ip4Features = await app.fetchGeojsonFeatures("/layers/ip4", "_ip4Index");
        }
        if (!app.state.tiAmFeatures.length) {
          app.state.tiAmFeatures = await app.fetchGeojsonFeatures("/layers/ti-am", "_tiAmIndex");
        }
        if (!app.state.hidroviasAmFeatures.length) {
          app.state.hidroviasAmFeatures = await app.fetchGeojsonFeatures("/layers/hidrovias-am", "_hidroviasAmIndex");
        }

      async function tryLoadDiscoveredLayerByName(matchA, matchB, label) {
        try {
          const rr = await fetch("/layers");
          if (!rr.ok) return;
          const payload = await rr.json();
          const items = payload?.layers || [];
          const hit = items.find((it) => {
            const name = String(it?.name || "");
            return matchA.test(name) && matchB.test(name);
          });
          if (!hit?.id) return;
          const r2 = await fetch(`/layers/${hit.id}`);
          if (!r2.ok) return;
          const data = await r2.json();
          const feats = (data.features || []).map((f, i) => ({ ...f, _extraIndex: i }));
          if (!app.state.extraContractSources) app.state.extraContractSources = [];
          // evita duplicar
          if (!app.state.extraContractSources.some((s) => s?.label === label)) {
            app.state.extraContractSources.push({ label, features: feats });
          }
        } catch {
          // ignore
        }
      }

      // Bueiros BR-307: tenta achar por auto-discovery (assets/BR-307/**BUEIROS*.shp)
      await tryLoadDiscoveredLayerByName(/br-?307/i, /buei/gi, "Bueiros BR-307");

      // Descoberta genérica: adiciona qualquer camada em /layers com coluna exatamente "contratos" (case-sensitive).
      try {
        const rr = await fetch("/layers");
        if (rr.ok) {
          const payload = await rr.json();
          const items = payload?.layers || [];
          for (const it of items) {
            const name = String(it?.name || "");
            // ignora limites
            if (/limite/i.test(name)) continue;
            // ignora "segmentos" (camada não existe mais no filtro de contrato)
            if (/segmentos/i.test(name)) continue;
            // ignora camadas já atendidas por endpoints dedicados (evita duplicar no popup)
            if (app.looksLikeKnownDedicatedLayer(name)) continue;
            const id = it?.id;
            if (!id) continue;
            const label = name.replace(/\.shp$/i, "");
            const dedupeKey = app.normalizeContractLayerDedupeKey(label);
            if (!app.state.extraContractSources) app.state.extraContractSources = [];
            const existingIdx = app.state.extraContractSources.findIndex((s) => s?.dedupeKey === dedupeKey);
            const r2 = await fetch(`/layers/${id}`);
            if (!r2.ok) continue;
            const data = await r2.json();
            const feats = (data.features || []).map((f, i) => ({ ...f, _extraIndex: i }));
            if (!feats.length) continue;
            // Só entra se existir coluna exatamente "contratos" em pelo menos uma feição
            const has = feats.some((f) => app.featureHasContractColumn(f));
            if (!has) continue;
            const next = { label, dedupeKey, features: feats };
            if (existingIdx >= 0) {
              // Mantém somente uma (substitui pela última encontrada -> fica a "de baixo")
              app.state.extraContractSources[existingIdx] = next;
            } else {
              app.state.extraContractSources.push(next);
            }
          }
        }
      } catch {
        // ignore
      }

        app.refreshContractOptions();
        // Só considera "carregado" quando existe pelo menos 1 contrato além de "Todos".
        // Se continuar vazio (endpoints indisponíveis / sem coluna contrato), mantemos como não carregado
        // para permitir retry automático ao abrir/digitar.
        try {
          const optLen = app.menuContractSelect?.options?.length || 0;
          app.state.contractSourcesLoaded = optLen > 1;
        } catch {
          app.state.contractSourcesLoaded = false;
        }
      })();

      try {
        await app.state.contractSourcesLoadPromise;
      } finally {
        app.state.contractSourcesLoadPromise = null;
      }
    }

  app.layerCountForContract = function layerCountForContract(features, contract) {
      if (!features || !features.length) return 0;
      const used = new Set();
      const getStableKey = (f, fallbackIdx) => {
        const p = f?.properties || {};
        const candidates = [
          "OBJECTID",
          "OBJECTID_1",
          "OBJECTID_2",
          "objectid",
          "objectid_1",
          "objectid_2",
          "FID",
          "fid",
          "ID",
          "id",
          "Id",
        ];
        for (const k of candidates) {
          const v = p?.[k];
          if (v === null || v === undefined) continue;
          const s = String(v).trim();
          if (!s) continue;
          return `${k}:${s}`;
        }
        // Campos de índice interno quando presentes
        const idxFields = [
          "_ucEstadualIndex",
          "_ucMunicipalIndex",
          "_bueirosIndex",
          "_bueirosBr174Index",
          "_bueirosBr230Index",
          "_pontesIndex",
          "_pontesBr319Index",
          "_jazidasIndex",
          "_pradsBr174Index",
          "_pcaPradsBr319Index",
          "_pradsBr319Index",
          "_pcaPradsCmmBr319Index",
          "_extraIndex",
          "_tableIndex",
        ];
        for (const k of idxFields) {
          const v = f?.[k];
          if (typeof v === "number") return `${k}:${v}`;
        }
        return `i:${fallbackIdx}`;
      };

      let n = 0;
      for (let i = 0; i < features.length; i++) {
        const f = features[i];
        const vals = app.getFeatureContracts(f);
        if (!vals.length) continue;
        if (!vals.some((v) => app.contractEquals(v, contract))) continue;
        const key = getStableKey(f, i);
        if (used.has(key)) continue;
        used.add(key);
        n++;
      }
      return n;
    }

  app.inferKindFromContractLabel = function inferKindFromContractLabel(label) {
      const s = String(label || "").toLowerCase();
      if (s.includes("bueiro")) return s.includes("319") ? "bueiros-br319" : s.includes("174") ? "bueiros-br174" : s.includes("230") ? "bueiros-br230" : "bueiros";
      if (s.includes("ponte")) return s.includes("319") ? "pontes-br319" : s.includes("230") ? "pontes-br230" : "pontes";
      if (s.includes("jazid")) return "jazidas";
      if (s.includes("hidrovia")) return "hidrovias-am";
      if (s.includes("uc") && s.includes("estad")) return "uc-estadual";
      if (s.includes("uc") && s.includes("munic")) return "uc-municipal";
      if (s.includes("terra") || /\bti\b/.test(s)) return "ti-am";
      if (s.includes("ip4")) return "ip4";
      if (s.includes("snv")) {
      }
      if (s.includes("cmm") && (s.includes("pca") || s.includes("prad"))) return "pca-prads-cmm-br319";
      if (s.includes("pca")) return "pca-prads-br319";
      if (s.includes("pca")) return "prads-br319";
      if (s.includes("prad")) return "prads-br174";
      return "segmentos";
    }

  app.getContractLayerCatalog = function getContractLayerCatalog() {
      return [
        { kind: "ip4", label: "IP4", feats: () => app.state.ip4Features || [] },
        { kind: "bueiros", label: "Bueiros BR-317", feats: () => app.state.bueirosFeatures || [] },
        { kind: "pontes", label: "Pontes BR-307", feats: () => app.state.pontesFeatures || [] },
        { kind: "jazidas", label: "Jazidas BR-307", feats: () => app.state.jazidasFeatures || [] },
        { kind: "pontes-br319", label: "Pontes BR-319", feats: () => app.state.pontesBr319Features || [] },
        { kind: "pontes-br230", label: "Pontes BR-230", feats: () => app.state.pontesBr230Features || [] },
        { kind: "bueiros-br319", label: "Bueiros BR-319", feats: () => app.state.bueirosBr319Features || [] },
        { kind: "uc-estadual", label: "UC Estadual", feats: () => app.state.ucEstadualFeatures || [] },
        { kind: "uc-municipal", label: "UC Municipal", feats: () => app.state.ucMunicipalFeatures || [] },
        { kind: "bueiros-br174", label: "Bueiros BR-174", feats: () => app.state.bueirosBr174Features || [] },
        { kind: "prads-br174", label: "PRADS BR-174", feats: () => app.state.pradsBr174Features || [] },
        { kind: "pca-prads-br319", label: "PCA - PRADS BR-319", feats: () => app.state.pcaPradsBr319Features || [] },
        { kind: "prads-br319", label: "PRADS BR-319", feats: () => app.state.pradsBr319Features || [] },
        { kind: "pca-prads-cmm-br319", label: "PCA - PRADS CMM BR-319", feats: () => app.state.pcaPradsCmmBr319Features || [] },
        { kind: "bueiros-br230", label: "Bueiros BR-230", feats: () => app.state.bueirosBr230Features || [] },
        { kind: "ti-am", label: "TI AM", feats: () => app.state.tiAmFeatures || [] },
        { kind: "hidrovias-am", label: "Hidrovias AM", feats: () => app.state.hidroviasAmFeatures || [] },
      ];
    }

  app.forEachContractLayerSource = function forEachContractLayerSource(fn) {
      for (const entry of app.getContractLayerCatalog()) fn(entry);
      for (const src of app.state.extraContractSources || []) {
        if (!src?.features?.length) continue;
        fn({
          kind: app.inferKindFromContractLabel(src.label),
          label: src.label,
          feats: () => src.features || [],
        });
      }
    }

  app.getContractLayerFeatureSets = function getContractLayerFeatureSets() {
      const out = [];
      app.forEachContractLayerSource(({ feats }) => {
        const list = feats();
        if (list?.length) out.push(list);
      });
      return out;
    }

  app.applyContractFilterAndShowResults = async function applyContractFilterAndShowResults() {
      const hasContract = Boolean(app.normalizeContractKey(app.state.contractFilter));
      if (!hasContract) {
        app.applyContractFilterToMap();
        if (app.state.tableDataset === "contract-results") app.closeBottomSheet();
        return;
      }
      // Se o usuário usou "Desligar todas", permite religar as camadas do contrato.
      if (app.state.bulkLayersIntent === "off") app.state.bulkLayersIntent = null;
      app.setStatus(`Contrato: aplicando filtro ${app.normalizeContractValue(app.state.contractFilter)}…`, "info");
      void app.openContractResultsTable();
      try {
        await app.ensureContractSourcesLoaded();
        await app.ensureAllContractLayersOnMap();
        app.applyContractFilterToMap();
        app.fitMapToCurrentContract();
        if (app.state.tableDataset === "contract-results") void app.openContractResultsTable();
        try {
          app.renderLayerLegend();
        } catch {
          // ignore
        }
        app.setStatus(`Contrato: ${app.normalizeContractValue(app.state.contractFilter)}`, "ok");
      } catch {
        app.setStatus("Contrato: não foi possível aplicar o filtro", "error");
      }
    }

  app.collectContractBoundsFromLayerGroup = function collectContractBoundsFromLayerGroup(groupLayer, boundsIn) {
      if (!groupLayer?.eachLayer) return boundsIn || null;
      let bounds = boundsIn || null;
      groupLayer.eachLayer((leafletLayer) => {
        const f = leafletLayer?.feature;
        if (!f) return;
        if (!app.featureHasContractColumn(f)) return;
        if (!app.featureMatchesContract(f)) return;
        let b = null;
        try {
          if (typeof leafletLayer.getBounds === "function") b = leafletLayer.getBounds();
        } catch {
          b = null;
        }
        if (!b?.isValid?.()) {
          try {
            b = L.geoJSON(f).getBounds?.();
          } catch {
            b = null;
          }
        }
        if (!b?.isValid?.()) return;
        bounds = bounds ? bounds.extend(b) : b;
      });
      return bounds;
    }

  app.fitMapToCurrentContract = function fitMapToCurrentContract() {
      if (!app.state.map || !app.normalizeContractKey(app.state.contractFilter)) return;
      const layers = [
        app.state.geojsonLayer,
        app.state.bueirosLayer,
        app.state.pontesBr307Layer,
        app.state.jazidasBr307Layer,
        app.state.pontesBr319Layer,
        app.state.pontesBr230Layer,
        app.state.bueirosBr174Layer,
        app.state.bueirosBr230Layer,
        app.state.bueirosBr319Layer,
        app.state.pradsBr174Layer,
        app.state.pcaPradsBr319Layer,
        app.state.pradsBr319Layer,
        app.state.pcaPradsCmmBr319Layer,
        app.state.ucEstadualLayer,
        app.state.ucMunicipalLayer,
        app.state.tiAmLayer,
        app.state.hidroviasAmLayer,
        app.state.ip4Layer,
      ];
      let bounds = null;
      for (const lyr of layers) bounds = app.collectContractBoundsFromLayerGroup(lyr, bounds);
      try {
        const brAmLayers = app.state.brAm?.layersById ? Object.values(app.state.brAm.layersById) : [];
        for (const lyr of brAmLayers) bounds = app.collectContractBoundsFromLayerGroup(lyr, bounds);
      } catch {
        // ignore
      }
      for (const src of app.state.extraContractSources || []) {
        if (src?.layer) bounds = app.collectContractBoundsFromLayerGroup(src.layer, bounds);
      }
      if (bounds?.isValid?.()) {
        app.state.map.fitBounds(bounds, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
      }
    }

  app.clearContractResultsRowHighlight = function clearContractResultsRowHighlight() {
      document.querySelectorAll("#contract-results-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.contractResultsSelectedIndex = null;
    }

  app.pruneNonContratoColumnFilters = function pruneNonContratoColumnFilters(columnFilters, keys) {
      const cf = columnFilters || {};
      const allowed = new Set((keys || []).filter(app.isContratoColumnKey));
      for (const k of Object.keys(cf)) {
        if (!allowed.has(k)) {
          try {
            delete cf[k];
          } catch {
            // ignore
          }
        }
      }
      return cf;
    }

  app.renderContractResultsAttributesTable = function renderContractResultsAttributesTable(highlightIndex) {
      const keys =
        app.state.contractResultsColumnKeys.length > 0
          ? app.state.contractResultsColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.contractResultsFeatures);
      if (!app.state.contractResultsColumnKeys.length && keys.length) app.state.contractResultsColumnKeys = keys;
      app.state.contractResultsSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const contratoFilterKeys = keys.filter(app.isContratoColumnKey);
      app.pruneNonContratoColumnFilters(app.state.contractResultsTable?.columnFilters, keys);

      const feats = app.getFilteredSortedGenericFeatures(app.state.contractResultsFeatures, app.state.contractResultsTable, {
        contractColumnsOnly: true,
      });
      const res = app.renderGenericAttributesTable({
        tableId: "contract-results-attributes-table",
        keys: app.state.contractResultsColumnKeys,
        features: feats,
        getIndex: (f) => f?._contractResultsIndex,
        dataAttr: "data-contract-results-index",
        highlightIndex,
        headerKeyAttr: "data-contract-results-key",
        sortKey: app.state.contractResultsTable.sortKey,
        sortDir: app.state.contractResultsTable.sortDir,
        columnFilters: app.state.contractResultsTable?.columnFilters,
        emptyMessage: "Sem resultados para este contrato.",
        filterableKeys: contratoFilterKeys,
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.contractResultsFeatures.length,
      });
    }

  app.buildContractResultsData = function buildContractResultsData() {
      const addHits = (kind, label, feats) => {
        const out = [];
        for (let i = 0; i < (feats || []).length; i++) {
          const f = feats[i];
          if (!app.featureMatchesContract(f)) continue;
          const p = f?.properties || {};
          const src = String(p.__source || p._source || "");
          const mun =
            app.getFirstNonEmptyValue(p, ["municipio", "nm_municipio", "municipio_", "NM_MUNICIPIO"]) ||
            app.getFirstNonEmptyValue(p, ["Município", "Municipio"]);
          const mergedProps = {
            Camada: label,
            Fonte: src,
            Municipio: mun || "",
            ...p,
          };
          out.push({
            type: "Feature",
            geometry: null,
            _contractResultsKind: kind,
            _contractResultsOrigIndex: i,
            properties: mergedProps,
          });
        }
        return out;
      };

      const all = [];
      app.forEachContractLayerSource(({ kind, label, feats }) => {
        all.push(...addHits(kind, label, feats()));
      });

      for (let i = 0; i < all.length; i++) all[i]._contractResultsIndex = i;

      const metaFirst = ["Camada", "Fonte", "Municipio"];
      const normKey = (k) => String(k || "").trim().toLowerCase();

      const keySet = new Set();
      for (const f of all) {
        const p = f?.properties;
        if (!p || typeof p !== "object") continue;
        for (const k of Object.keys(p)) keySet.add(k);
      }
      const allKeys = Array.from(keySet).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));

      const used = new Set();
      const mergedKeys = [];
      for (const m of metaFirst) {
        const found = allKeys.find((k) => normKey(k) === normKey(m));
        if (found && !used.has(found)) {
          mergedKeys.push(found);
          used.add(found);
        }
      }
      for (const k of allKeys) {
        if (!used.has(k)) mergedKeys.push(k);
      }

      return { all, mergedKeys };
    }

  app.openContractResultsTable = async function openContractResultsTable() {
      // Tabela consolidada: resultados do contrato em todas as camadas.
      const wanted = app.normalizeContractKey(app.state.contractFilter);
      if (!wanted) return;

      app.state.contractResultsSelectedIndex = null;
      app.state.contractResultsTable.sortKey = null;
      app.state.contractResultsTable.sortDir = "asc";
      app.state.tableDataset = "contract-results";
      app.openBottomSheet();
      app.refreshPanelTableTitle();
      app.syncGeneralFilterPlaceholder();
      app.syncGeneralFilterValue();
      try {
        const host = app.$("all-attributes");
        if (host) {
          host.innerHTML = '<div class="panel-body panel-body--muted">Carregando resultados do contrato…</div>';
        }
        const el = app.$("general-selection-info");
        if (el) el.textContent = "— carregando…";
      } catch {
        // ignore
      }

      await Promise.resolve(app.ensureContractSourcesLoaded());
      if (app.normalizeContractKey(app.state.contractFilter) !== wanted) return;
      if (app.state.tableDataset !== "contract-results") return;

      const { all, mergedKeys } = app.buildContractResultsData();
      app.state.contractResultsFeatures = all;
      app.state.contractResultsColumnKeys = mergedKeys;

      app.renderContractResultsAttributesTable(app.state.contractResultsSelectedIndex);
    }

  app.clearContractFilterCache = function clearContractFilterCache() {
      // Zera seleção e UI do filtro de contrato
      app.state.contractFilter = "";
      app.state.contractFocusLayerLabel = "";
      app.state.ip4FocusSource = "";

      // Zera caches de carregamento/lista
      app.state.contractSourcesLoaded = false;
      app.state.contractSourcesAttempted = false;
      app.state.contractSourcesLoadPromise = null;

      // Remove fontes "descobertas" (podem poluir lista/popup)
      app.state.extraContractSources = [];

      // Limpa resultados consolidados (tabela "Resultado do contrato")
      app.state.contractResultsFeatures = [];
      app.state.contractResultsColumnKeys = [];
      app.state.contractResultsSelectedIndex = null;
      try {
        app.state.contractResultsTable.sortKey = null;
        app.state.contractResultsTable.sortDir = "asc";
        app.state.contractResultsTable.filterText = "";
        app.state.contractResultsTable.columnFilters = {};
      } catch {
        // ignore
      }

      // Reset do select (mantém "Todos" apenas)
      try {
        if (app.menuContractSelect) {
          app.menuContractSelect.innerHTML = `<option value="">Todos</option>`;
          app.menuContractSelect.value = "";
        }
      } catch {
        // ignore
      }

    }

  app.clearContractSelectionOnly = function clearContractSelectionOnly() {
      // Mantém a lista de contratos carregada, mas remove o filtro atual
      // e restaura visibilidade no mapa.
      const had = Boolean(app.normalizeContractKey(app.state.contractFilter) || app.state.contractFocusLayerLabel || app.state.ip4FocusSource);
      app.state.contractFilter = "";
      app.state.contractFocusLayerLabel = "";
      app.state.ip4FocusSource = "";

      try {
        if (app.menuContractSelect) app.menuContractSelect.value = "";
      } catch {
        // ignore
      }
      try {
        app.applyContractFilterToMap();
      } catch {
        // ignore
      }
      if (had) {
        try {
          app.setStatus("Contrato: filtro removido (voltou para camada sem filtro)", "ok");
        } catch {
          // ignore
        }
      }
    }

}
