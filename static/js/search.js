/* global L */
export function registerSearch(app) {

  app.getSearchKindDefs = function getSearchKindDefs() {
      // `id` precisa bater com os handlers/rotas existentes.
      return [
        { id: "municipios", label: "Municípios" },
        { id: "bueiros", label: "Bueiros (BR-317)" },
        { id: "pontes", label: "Pontes (BR-307)" },
        { id: "jazidas", label: "Jazidas (BR-307)" },
        { id: "hidrovias-am", label: "Hidrovias AM" },
        { id: "pontes-br319", label: "Pontes (BR-319)" },
        { id: "pontes-br230", label: "Pontes (BR-230)" },
        { id: "bueiros-br319", label: "Bueiros (BR-319)" },
        { id: "bueiros-br174", label: "Bueiros (BR-174)" },
        { id: "bueiros-br230", label: "Bueiros (BR-230)" },
        { id: "prads-br174", label: "PRADS (BR-174)" },
        { id: "pca-prads-br319", label: "PCA - PRADS" },
        { id: "prads-br319", label: "PRADS" },
        { id: "pca-prads-cmm-br319", label: "PCA - PRADS CMM" },
        { id: "uc-estadual", label: "UC Estadual" },
        { id: "uc-municipal", label: "UC Municipal" },
        { id: "ti-am", label: "TI AM" },
        { id: "contratos", label: "Contratos" },
      ];
    }

  app.syncContratosFilterKindFromState = function syncContratosFilterKindFromState() {
      try {
        if (app.normalizeContractKey(app.state.contractFilter)) {
          app.state.globalSearch.enabledKinds.add("contratos");
        }
      } catch {
        // ignore
      }
    }

  app.syncMunicipiosFilterKindFromState = function syncMunicipiosFilterKindFromState() {
      try {
        if (app.normalizeSearchText(app.state.municipioFilter || "")) {
          app.state.globalSearch.enabledKinds.add("municipios");
        }
      } catch {
        // ignore
      }
    }

  app.applyGlobalSearchFilterKindToggle = function applyGlobalSearchFilterKindToggle(cb) {
      if (!cb) return;
      app.state.globalSearch.defaultsInitialized = true;
      const kind = cb.getAttribute("data-kind");
      if (!kind) return;
      if (cb.checked) app.state.globalSearch.enabledKinds.add(kind);
      else app.state.globalSearch.enabledKinds.delete(kind);

      app.setStatus(`Filtro: ${app.getSearchKindLabel(kind)} — ${cb.checked ? "ligando" : "desligando"}…`, "info");
      if (kind === "municipios") {
        if (cb.checked) {
          // Não monta o Limite Municipal no clique — só a lista (evita "página sem resposta").
          app.renderGlobalSearchMunicipiosPanel();
          void app.ensureMunicipiosFilterListLoaded()
            .then(() => {
              app.renderGlobalSearchMunicipiosPanel();
              app.setStatus("Filtro: Municípios — escolha um município na lista abaixo", "ok");
            })
            .catch(() => app.setStatus("Filtro: Municípios não carregou", "error"));
        } else {
          app.clearMunicipioFilterOnly();
          app.setMunicipiosOnMap(false);
          app.renderGlobalSearchMunicipiosPanel();
          app.setStatus("Filtro: Municípios desligada", "ok");
        }
        return;
      }
      if (kind === "contratos") {
        if (cb.checked) {
          app.renderGlobalSearchContractsPanel();
          void app.ensureContractSourcesLoaded()
            .then(() => {
              app.refreshContractOptions();
              app.renderGlobalSearchContractsPanel();
              app.setStatus("Filtro: Contratos — escolha um contrato na lista abaixo", "ok");
            })
            .catch(() => app.setStatus("Filtro: Contratos não carregou", "error"));
        } else {
          app.disableKindOnMap("contratos");
          app.renderGlobalSearchContractsPanel();
          app.setStatus("Filtro: Contratos desligada", "ok");
        }
        return;
      }
      app.setToggleChecked(kind, Boolean(cb.checked));
      if (cb.checked) {
        Promise.resolve(app.ensureKindOnMap(kind))
          .then(() => app.setStatus(`Filtro: ${app.getSearchKindLabel(kind)} ligada`, "ok"))
          .catch(() => app.setStatus(`Filtro: ${app.getSearchKindLabel(kind)} não carregou`, "error"));
      } else {
        app.disableKindOnMap(kind);
        app.setStatus(`Filtro: ${app.getSearchKindLabel(kind)} desligada`, "ok");
      }
    }

  app.ensureGlobalSearchDefaults = function ensureGlobalSearchDefaults() {
      if (app.state.globalSearch.defaultsInitialized) return;
      if (app.state.globalSearch.enabledKinds.size) {
        app.state.globalSearch.defaultsInitialized = true;
        return;
      }
      // Camadas do mapa ligadas por padrão. Municípios/Contratos só se já houver filtro ativo.
      for (const def of app.getSearchKindDefs()) {
        if (def?.id === "contratos" || def?.id === "municipios") continue;
        app.state.globalSearch.enabledKinds.add(def.id);
      }
      app.syncContratosFilterKindFromState();
      app.syncMunicipiosFilterKindFromState();
      app.state.globalSearch.defaultsInitialized = true;
    }

  app.openGlobalSearchFilter = function openGlobalSearchFilter() {
      if (!app.globalSearchFilterEl || !app.globalSearchFilterBtn) return;
      app.ensureGlobalSearchDefaults();
      app.syncContratosFilterKindFromState();
      app.syncMunicipiosFilterKindFromState();
      const defs = app.getSearchKindDefs();
      const defsForUi = defs;
      const isOn = (id) => app.state.globalSearch.enabledKinds.has(id);
      app.globalSearchFilterEl.innerHTML = `
        <div class="global-search-filter__head">
          <div class="global-search-filter__title">Filtros de camadas</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="btn btn--ghost" data-action="all">Marcar tudo</button>
            <button type="button" class="btn btn--ghost" data-action="none">Desmarcar</button>
          </div>
        </div>
        <div class="global-search-filter__grid">
          ${defsForUi
            .map(
              (d) => `
            <label class="global-search-filter__opt">
              <input type="checkbox" data-kind="${app.escHtmlCell(d.id)}" ${isOn(d.id) ? "checked" : ""} />
              <span>${app.escHtmlCell(d.label)}</span>
            </label>`,
            )
            .join("")}
        </div>
        <div id="global-search-filter-municipios" class="global-search-filter__contracts" hidden></div>
        <div id="global-search-filter-contracts" class="global-search-filter__contracts" hidden></div>
        <div class="global-search-filter__foot" style="display:flex;justify-content:flex-end;gap:8px;padding:10px 12px;border-top:1px solid rgba(148,163,184,.25);">
          <button type="button" class="btn btn--ghost" data-action="clear">Limpar filtros</button>
          <button type="button" class="btn" data-action="apply">Filtrar</button>
        </div>
      `;
      app.globalSearchFilterEl.hidden = false;
      app.globalSearchFilterBtn.setAttribute("aria-expanded", "true");
      try {
        app.renderGlobalSearchMunicipiosPanel();
        app.renderGlobalSearchContractsPanel();
      } catch {
        // ignore
      }
      if (app.state.globalSearch.enabledKinds.has("municipios")) {
        void app.ensureMunicipiosFilterListLoaded().then(() => {
          app.renderGlobalSearchMunicipiosPanel();
        });
      }
      if (app.state.globalSearch.enabledKinds.has("contratos")) {
        void app.ensureContractSourcesLoaded().then(() => {
          app.refreshContractOptions();
          app.renderGlobalSearchContractsPanel();
        });
      }
    }

  app.getSearchKindLabel = function getSearchKindLabel(kind) {
      const defs = app.getSearchKindDefs();
      const hit = defs.find((d) => d?.id === kind);
      return String(hit?.label || kind || "Camada");
    }

  app.setGlobalSearchFeedback = function setGlobalSearchFeedback(kind, payload) {
      if (!app.globalSearchFeedback) return;
      if (kind === "searching") {
        app.globalSearchFeedback.classList.add("is-searching");
        app.globalSearchFeedback.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>Pesquisando…</span>`;
        return;
      }
      app.globalSearchFeedback.classList.remove("is-searching");
      if (kind === "results") {
        const n = Math.max(0, Number(payload?.count || 0));
        app.globalSearchFeedback.textContent = n === 1 ? "Resultado: 1" : `Resultados: ${n}`;
        return;
      }
      if (kind === "none") {
        app.globalSearchFeedback.textContent = "Sem resultados";
        return;
      }
      app.globalSearchFeedback.textContent = "Pesquisar";
    }

  app.closeGlobalSearchFilter = function closeGlobalSearchFilter() {
      if (!app.globalSearchFilterEl || !app.globalSearchFilterBtn) return;
      app.globalSearchFilterEl.hidden = true;
      app.globalSearchFilterBtn.setAttribute("aria-expanded", "false");
    }

  app.closeGlobalSearchResults = function closeGlobalSearchResults() {
      if (!app.globalSearchResultsEl) return;
      app.globalSearchResultsEl.hidden = true;
      app.globalSearchResultsEl.innerHTML = "";
      app.state.globalSearch.results = [];
      app.state.globalSearch.activeIndex = 0;
    }

  app.renderGlobalSearchResults = function renderGlobalSearchResults(results) {
      if (!app.globalSearchResultsEl) return;
      if (!results?.length) {
        app.closeGlobalSearchResults();
        return;
      }
      const active = app.state.globalSearch.activeIndex || 0;
      const total = results.length;
      const groupDefault = 6;
      const limits = app.state.globalSearch.groupLimits || {};

      // Agrupa por camada para reduzir poluição visual.
      const groups = new Map();
      results.forEach((r) => {
        const label = String(r?.kindLabel || r?.kind || "Resultados");
        if (!groups.has(label)) groups.set(label, []);
        groups.get(label).push(r);
      });

      app.globalSearchResultsEl.hidden = false;
      app.globalSearchResultsEl.innerHTML =
        `
          <div class="global-search-results__head">
            <div class="global-search-results__head-title">Resultados</div>
            <div class="global-search-results__head-meta">${total} encontrados</div>
          </div>
        ` +
        Array.from(groups.entries())
          .map(([label, items]) => {
            const groupKey = app.normalizeSearchText(label) || label;
            const lim = Math.max(2, Number(limits[groupKey] ?? groupDefault));
            const slice = items.slice(0, lim);
            const more = items.length > lim;
            const body = slice
              .map((r) => {
                const idx = results.indexOf(r);
                const cls = `global-search-results__item${idx === active ? " is-active" : ""}`;
                return `
                  <div class="${cls}" role="option" aria-selected="${idx === active ? "true" : "false"}" data-idx="${idx}">
                    <div class="global-search-results__meta">
                      <div class="global-search-results__title">${app.escHtmlCell(r.title)}</div>
                      <div class="global-search-results__subtitle">${app.escHtmlCell(r.subtitle || "")}</div>
                    </div>
                  </div>
                `;
              })
              .join("");
            return `
              <section class="gsr-section" data-group="${app.escHtmlCell(groupKey)}">
                <div class="gsr-section__head">
                  <div class="gsr-section__label">${app.escHtmlCell(label)}</div>
                  <div class="gsr-section__count">${items.length}</div>
                </div>
                <div class="gsr-section__body">${body}</div>
                ${
                  more
                    ? `<button type="button" class="gsr-section__more" data-action="more-group" data-group="${app.escHtmlCell(groupKey)}">
                        Mostrar mais (${items.length - lim})
                      </button>`
                    : ""
                }
              </section>
            `;
          })
          .join("");
    }

  app.firstPropValueByKeyHints = function firstPropValueByKeyHints(props, hints) {
      const p = props || {};
      if (!p || typeof p !== "object") return "";
      const keys = Object.keys(p);
      const norm = (x) => app.normalizeSearchText(x);
      const has = (k) => Object.prototype.hasOwnProperty.call(p, k);

      // 1) tenta chaves diretas
      for (const k of hints) {
        if (has(k)) {
          const v = p?.[k];
          if (v !== undefined && v !== null && String(v).trim() !== "") return v;
        }
      }
      // 2) fallback: match case-insensitive/normalizado
      const want = hints.map((h) => norm(h));
      for (const k of keys) {
        const nk = norm(k);
        const idx = want.indexOf(nk);
        if (idx < 0) continue;
        const v = p?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
      }
      return "";
    }

  app.bestTitleForFeature = function bestTitleForFeature(kind, feature) {
      const p = feature?.properties || {};
      if (kind === "municipios") return app.getMunicipioNomeFromProps(p) || "Município";
      if (kind === "ti-am") {
        return app.normalizePtBrText(p.terrai_nom || p.terrai_cod || "") || "TI";
      }
      if (kind === "ip4") {
        return (
          app.normalizePtBrText(
            app.firstPropValueByKeyHints(p, ["Nome", "NOME", "nome"]) ||
              app.firstPropValueByKeyHints(p, ["contrato", "Contrato", "CONTRATO"]) ||
              "",
          ) || "IP4"
        );
      }

      if (kind === "uc-estadual" || kind === "uc-municipal") {
        return (
          app.getFirstNonEmptyValue(p, ["Administra", "ADMINISTRA", "Nome", "NOME"]) ||
          app.getFirstNonEmptyValue(p, ["Ato_Legal", "ATO_LEGAL", "ano"]) ||
          (kind === "uc-estadual" ? "UC Estadual" : "UC Municipal")
        );
      }
      if (kind.startsWith("snv-")) {
        return app.getFirstNonEmptyValue(p, ["Codigo_BR", "Codigo_SNV", "vl_codigo", "codigo"]) || "SNV";
      }
      if (kind === "bueiros" || kind === "bueiros-br319" || kind === "bueiros-br174" || kind === "bueiros-br230") {
        const code =
          app.firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "Código", "CODIGO", "id", "ID"]) ||
          app.getFirstNonEmptyValue(p, ["vl_codigo", "codigo", "id"]);
        const mun = app.firstPropValueByKeyHints(p, ["municipio", "nm_municipio", "municipio_", "NM_MUNICIPIO"]);
        if (code) return `Bueiro ${String(code).trim()}`;
        if (mun) return `Bueiro — ${String(mun).trim()}`;
        return "Bueiro";
      }
      if (kind === "pontes" || kind === "pontes-br319" || kind === "pontes-br230") {
        const code = app.firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]);
        if (code) return `Ponte ${String(code).trim()}`;
        return "Ponte";
      }
      if (kind === "jazidas") {
        const code = app.firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]);
        if (code) return `Jazida ${String(code).trim()}`;
        return "Jazida";
      }
      return (
        app.getFirstNonEmptyValue(p, ["vl_codigo", "codigo", "Codigo_BR", "Codigo_SNV", "id", "nome", "NOME"]) ||
        app.getFirstNonEmptyValue(p, ["municipio", "nm_municipio", "municipio_", "uf_sigla"]) ||
        "Resultado"
      );
    }

  app.bestSubtitleForFeature = function bestSubtitleForFeature(kind, feature) {
      const p = feature?.properties || {};
      if (kind === "municipios") return "Estado do Amazonas";
      if (kind === "ti-am") {
        return app.getFirstNonEmptyValue(p, ["etnia_nome", "fase_ti", "municipio_", "uf_sigla"]) || "Terra Indígena";
      }
      if (kind === "ip4") {
        return (
          app.getFirstNonEmptyValue(p, ["contrato", "Contrato", "CONTRATO", "Contratos"]) ||
          app.getFirstNonEmptyValue(p, ["Lote", "lote"]) ||
          "IP4 — pequeno porte (hidrovias)"
        );
      }

      if (kind === "uc-estadual" || kind === "uc-municipal") {
        const area = app.getFirstNonEmptyValue(p, ["area_ha", "AREA_HA", "area"]);
        const ano = app.getFirstNonEmptyValue(p, ["ano", "ANO"]);
        const a = area ? `Área: ${area} ha` : "";
        const y = ano ? `Ano: ${ano}` : "";
        const extra = [a, y].filter(Boolean).join(" • ");
        return extra || app.getFirstNonEmptyValue(p, ["_source"]) || "";
      }
      if (kind === "bueiros" || kind === "bueiros-br319" || kind === "bueiros-br174" || kind === "bueiros-br230") {
        const mun = app.firstPropValueByKeyHints(p, ["municipio", "nm_municipio", "municipio_", "NM_MUNICIPIO"]);
        const src = app.getFirstNonEmptyValue(p, ["_source"]);
        const extra = [mun ? `Município: ${String(mun).trim()}` : "", src ? String(src) : ""].filter(Boolean).join(" • ");
        return extra;
      }
      return app.getFirstNonEmptyValue(p, ["municipio", "nm_municipio", "municipio_", "uf_sigla", "_source"]) || "";
    }

  app.getToggleElForKind = function getToggleElForKind(kind) {
      const byRef = {
        bueiros: app.layerBueirosToggle,
        pontes: app.layerPontesToggle,
        jazidas: app.layerJazidasToggle,
        "hidrovias-am": app.layerHidroviasAmToggle,
        "pontes-br319": app.layerPontesBr319Toggle,
        "pontes-br230": app.layerPontesBr230Toggle,
        "bueiros-br319": app.layerBueirosBr319Toggle,
        "bueiros-br174": app.layerBueirosBr174Toggle,
        "bueiros-br230": app.layerBueirosBr230Toggle,
        "prads-br174": app.layerPradsBr174Toggle,
        "pca-prads-br319": app.layerPcaPradsBr319Toggle,
        "prads-br319": app.layerPradsBr319Toggle,
        "pca-prads-cmm-br319": app.layerPcaPradsCmmBr319Toggle,
        "uc-estadual": app.layerUcEstadualToggle,
        "uc-municipal": app.layerUcMunicipalToggle,
        "ti-am": app.layerTiAmToggle,
        ip4: app.layerIp4Toggle,
        municipios: app.layerLimiteMunicipalToggle,
      };
      return byRef[String(kind || "")] || null;
    }

  app.setToggleChecked = function setToggleChecked(kind, checked) {
      const el = app.getToggleElForKind(kind);
      if (!el || el.disabled) return;
      el.checked = Boolean(checked);
    }

  app.setMunicipiosOnMap = function setMunicipiosOnMap(wantOn) {
      if (!app.state.map) return;
      if (app.layerLimiteMunicipalToggle) {
        app.layerLimiteMunicipalToggle.checked = Boolean(wantOn);
      }
      if (wantOn) {
        void app.attachLimiteMunicipalLayerIfNeeded().finally(() => {
          app.applyLimiteMunicipalVisibility();
        });
        return;
      }
      app.applyLimiteMunicipalVisibility();
    }

  app.ensureKindOnMap = async function ensureKindOnMap(kind) {
      // Garante camada carregada/visível, mesmo que estivesse desligada
      try {
        if (kind === "contratos") return app.ensureContractSourcesLoaded();
        if (kind === "bueiros") return app.ensureBueirosBr317OnMap();
        if (kind === "pontes") return app.ensurePontesBr307OnMap();
        if (kind === "jazidas") return app.ensureJazidasBr307OnMap();
        if (kind === "hidrovias-am") return app.ensureHidroviasAmOnMap();
        if (kind === "pontes-br319") return app.ensurePontesBr319OnMap();
        if (kind === "pontes-br230") return app.ensurePontesBr230OnMap();
        if (kind === "bueiros-br319") return app.ensureBueirosBr319OnMap();
        if (kind === "bueiros-br174") return app.ensureBueirosBr174OnMap();
        if (kind === "prads-br174") return app.ensurePradsBr174OnMap();
        if (kind === "pca-prads-br319") return app.ensurePcaPradsBr319OnMap();
        if (kind === "prads-br319") return app.ensurePradsBr319OnMap();
        if (kind === "pca-prads-cmm-br319") return app.ensurePcaPradsCmmBr319OnMap();
        if (kind === "bueiros-br230") return app.ensureBueirosBr230OnMap();
        if (kind === "uc-estadual") return app.ensureUcEstadualOnMap();
        if (kind === "uc-municipal") return app.ensureUcMunicipalOnMap();
        if (kind === "ti-am") return app.ensureTiAmOnMap();
        if (kind === "ip4") return app.ensureIp4OnMap();
      } catch {
        // ignore
      }
      return null;
    }

  app.disableKindOnMap = function disableKindOnMap(kind) {
      if (kind === "contratos") {
        app.clearContractSelectionOnly();
        try {
          app.state.globalSearch.enabledKinds.delete("contratos");
        } catch {
          // ignore
        }
        return;
      }
      if (kind === "municipios") {
        app.clearMunicipioFilterOnly();
        app.setMunicipiosOnMap(false);
        return;
      }
      if (!app.state.map) return;
      const lyr = app.getLayerGroupByKind(kind);
      try {
        if (lyr && app.state.map.hasLayer(lyr)) app.state.map.removeLayer(lyr);
      } catch {
        // ignore
      }
    }

  app.flashSearchHit = function flashSearchHit(feature) {
      if (!app.state.map || !feature) return;
      app.ensureInfraGeoPanes();
      let temp = null;
      try {
        temp = L.geoJSON(feature, {
          pane: app.state.panes?.highlight,
          style: () => ({ color: "#334155", weight: 3, opacity: 0.95, fillColor: "#94a3b8", fillOpacity: 0.12 }),
          pointToLayer(_f, latlng) {
            return L.circleMarker(latlng, { radius: 9, color: "#334155", weight: 3, fillColor: "#94a3b8", fillOpacity: 0.35 });
          },
        }).addTo(app.state.map);
        const b = temp.getBounds?.();
        if (b?.isValid?.()) app.state.map.fitBounds(b, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
      } catch {
        // ignore
      }
      if (temp) {
        window.setTimeout(() => {
          try {
            if (app.state.map && temp) app.state.map.removeLayer(temp);
          } catch {
            // ignore
          }
        }, 2500);
      }
    }

  app.getFeaturesForSearchKind = async function getFeaturesForSearchKind(kind) {
      // Cache (somente features; não depende do mapa).
      if (app.state.searchCache?.[kind]?.features?.length) return app.state.searchCache[kind].features;

      // Municipios vem da camada hover (polígonos)
      if (kind === "municipios") {
        try {
          await app.attachLimiteMunicipalLayerIfNeeded();
        } catch {
          // ignore
        }
        return app.state.municipiosFeatures || [];
      }

      // Mesmo com a camada "desligada", a busca deve funcionar.
      // Então, quando não houver dados em memória, buscamos via API.
      const inMemory = () => {
        if (kind === "bueiros" && app.state.bueirosFeatures?.length) return app.state.bueirosFeatures;
        if (kind === "pontes" && app.state.pontesFeatures?.length) return app.state.pontesFeatures;
        if (kind === "jazidas" && app.state.jazidasFeatures?.length) return app.state.jazidasFeatures;
        return null;
      };
      const mem = inMemory();
      if (mem && mem.length) return mem;

      const byEndpoint = {
        "bueiros": "/layers/bueiros-br317",
        "pontes": "/layers/pontes-br307",
        "jazidas": "/layers/jazidas-br307/jazida-pontos",
        "pontes-br319": "/layers/pontes-br319",
        "pontes-br230": "/layers/pontes-br230",
        "bueiros-br319": "/layers/bueiros-br319",
        "bueiros-br174": "/layers/bueiros-br174",
        "bueiros-br230": "/layers/bueiros-br230",
        "prads-br174": "/layers/prads-br174",
        "pca-prads-br319": "/layers/pca-prads-br319",
        "prads-br319": "/layers/prads-br319",
        "pca-prads-cmm-br319": "/layers/pca-prads-cmm-br319",
        "uc-estadual": "/layers/uc-estadual",
        "uc-municipal": "/layers/uc-municipal",
        "ti-am": "/layers/ti-am",
      };
      const url = byEndpoint[kind];
      if (!url) return [];

      try {
        const r = await fetch(url);
        if (!r.ok) return [];
        const data = await r.json();
        const feats = (data.features || []).map((f, i) => ({ ...f, _searchIndex: i }));
        app.state.searchCache[kind] = { features: feats };
        return feats;
      } catch {
        return [];
      }
    }

  app.scoreFeatureMatch = function scoreFeatureMatch(props, query) {
      const q = app.normalizeSearchText(query);
      if (!q) return null;
      // Exato em algum campo = score 0 (mais preciso)
      for (const v of Object.values(props || {})) {
        if (app.normalizeSearchText(v) === q) return 0;
      }
      // Todos tokens presentes = score 1
      if (app.featureMatchesQuery(props, q)) return 1;
      return null;
    }

  app.globalSearchRun = async function globalSearchRun(rawQuery) {
      app.ensureGlobalSearchDefaults();
      const raw = String(rawQuery || "").trim();
      const q = app.normalizeSearchText(raw);
      if (!q) return [];
      const defs = app.getSearchKindDefs();
      const enabled = defs.filter((d) => app.state.globalSearch.enabledKinds.has(d.id));
      const out = [];

      // Pesquisa paralela por camada para reduzir delay (rede/CPU).
      const settled = await Promise.allSettled(
        enabled.map(async (def) => {
          const feats = await app.getFeaturesForSearchKind(def.id);
          if (!feats?.length) return [];
          const hits = [];
          for (const f of feats) {
            const sc = app.scoreFeatureMatch(f?.properties, q);
            if (sc === null) continue;
            hits.push({
              kind: def.id,
              kindLabel: def.label,
              score: sc,
              feature: f,
              title: app.bestTitleForFeature(def.id, f),
              subtitle: app.bestSubtitleForFeature(def.id, f),
            });
          }
          return hits;
        }),
      );
      for (const res of settled) {
        if (res.status !== "fulfilled") continue;
        out.push(...(res.value || []));
      }
      out.sort((a, b) => a.score - b.score || String(a.kindLabel).localeCompare(String(b.kindLabel), "pt-BR", { sensitivity: "base" }));
      return out.slice(0, 80);
    }

  app.openSearchResult = async function openSearchResult(res) {
      if (!res) return;
      app.closeGlobalSearchResults();
      app.closeGlobalSearchFilter();
      if (!res.feature) return;
      // Municípios: abre direto na camada hover (polígono), sem depender de toggle.
      if (res.kind === "municipios") {
        try {
          if (app.layerLimiteMunicipalToggle) app.layerLimiteMunicipalToggle.checked = true;
          await app.attachLimiteMunicipalLayerIfNeeded();
          app.applyLimiteMunicipalVisibility();
        } catch {
          // ignore
        }
        const idx = res.feature?._municipioIndex;
        const lyr = typeof idx === "number" ? app.state.municipiosLayersByIndex?.[idx] : null;
        if (lyr && app.state.map) {
          try {
            const b = lyr.getBounds?.();
            if (b?.isValid?.()) app.state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24], maxZoom: 11 });
          } catch {
            // ignore
          }
          try {
            lyr.openTooltip?.();
          } catch {
            // ignore
          }
        } else {
          app.flashSearchHit(res.feature);
        }
        try {
          app.selectFeature(res.feature, lyr, { zoomTo: false, selectionKind: "municipios", zoomMaxFromPanel: true });
          void app.openAttributesTableFromMapClick("municipios", res.feature, lyr);
        } catch {
          // ignore
        }
        const nm = app.getMunicipioNomeFromProps(res.feature?.properties) || "Município";
        app.setStatus(`Pesquisa: Municípios (AM) — ${nm}`, "ok");
        return;
      }
      // Liga camada (se houver toggle) e garante carregar, mesmo desligada.
      app.setToggleChecked(res.kind, true);
      await app.ensureKindOnMap(res.kind);

      // Tenta selecionar a feição na camada carregada; fallback: realce temporário.
      const hit = app.tryFindLoadedLayerByProps(res.kind, res.feature?.properties);
      if (hit?.feature && hit?.layer) {
        try {
        } catch {
          // ignore
        }
        try {
          app.selectFeature(hit.feature, hit.layer, { zoomTo: true, selectionKind: res.kind, zoomMaxFromPanel: true });
          void app.openAttributesTableFromMapClick(res.kind, hit.feature, hit.layer);
        } catch {
          app.flashSearchHit(res.feature);
        }
      } else {
        app.flashSearchHit(res.feature);
      }
      app.setStatus(`Pesquisa: ${res.kindLabel} — ${res.title}`, "ok");
    }

  app.normalizeSearchText = function normalizeSearchText(input) {
      let s = app.normalizePtBrText(input ?? "");
      s = String(s).toLowerCase();
      try {
        // Remove acentos/diacríticos: Á -> A, Ç -> C, etc.
        s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      } catch {
        // ignore
      }
      // Remove caracteres especiais/pontuação (fica só [a-z0-9] e espaço).
      // Isso garante busca NÃO case-sensitive e independente de símbolos.
      s = s.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
      return s;
    }

  app.renderGlobalSearchMunicipiosPanel = function renderGlobalSearchMunicipiosPanel() {
      const panel = app.globalSearchFilterEl?.querySelector?.("#global-search-filter-municipios");
      if (!panel) return;
      const enabled = Boolean(app.state.globalSearch.enabledKinds.has("municipios"));
      panel.hidden = !enabled;
      panel.setAttribute("aria-hidden", enabled ? "false" : "true");
      if (!enabled) {
        panel.innerHTML = "";
        return;
      }

      const prevInput = panel.querySelector?.("#global-search-filter-municipio-input");
      const prevFocused = document.activeElement === prevInput;
      const prevSelStart = prevInput?.selectionStart ?? null;
      const prevSelEnd = prevInput?.selectionEnd ?? null;

      const current = app.normalizePtBrText(app.state.municipioFilter || "").trim();
      const currentKey = app.normalizeSearchText(current);
      const loading = Boolean(app.state.municipioFilterListPromise) && !app.state.municipioFilterListLoaded;
      const { sorted } = app.collectSortedMunicipioValues();
      const q = app.normalizeSearchText(app.state.municipioUiFilterText || "");
      const filtered = q ? sorted.filter((v) => app.normalizeSearchText(v).includes(q)) : sorted;

      const optsHtml = [
        { value: "", text: "Todos", selected: !currentKey },
        ...filtered.map((v) => ({
          value: v,
          text: v,
          selected: app.normalizeSearchText(v) === currentKey,
        })),
      ]
        .map((o) => {
          const cls = `global-search-filter__contract-opt${o.selected ? " is-selected" : ""}`;
          const check = o.selected ? "✓" : "";
          return `<button type="button" class="${cls}" data-filter-municipio="${app.escapeHtml(o.value)}" aria-pressed="${
            o.selected ? "true" : "false"
          }"><span>${app.escapeHtml(o.text)}</span><span class="global-search-filter__contract-check" aria-hidden="true">${check}</span></button>`;
        })
        .join("");

      let bodyHtml = optsHtml;
      if ((loading || (!app.state.municipioFilterListLoaded && !sorted.length)) && sorted.length === 0) {
        bodyHtml = `<div class="global-search-filter__contract-empty">Carregando municípios…</div>`;
      } else if (app.state.municipioFilterListLoaded && sorted.length === 0) {
        bodyHtml = `<div class="global-search-filter__contract-empty">Sem municípios disponíveis.</div>`;
      } else if (sorted.length && filtered.length === 0) {
        bodyHtml = `<div class="global-search-filter__contract-empty">Nenhum município encontrado.</div>`;
      }

      panel.innerHTML = `
        <div class="global-search-filter__contract-head">
          <div class="global-search-filter__contract-title">Município</div>
          <div class="global-search-filter__contract-current">${app.escapeHtml(current || "Todos")}</div>
        </div>
        <label class="global-search-filter__contract-filter">
          <input
            id="global-search-filter-municipio-input"
            class="global-search-filter__contract-input"
            type="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="Buscar município…"
            aria-label="Buscar município"
            value="${app.escapeHtml(app.state.municipioUiFilterText || "")}"
          />
        </label>
        <div class="global-search-filter__contract-list" role="listbox" aria-label="Municípios">
          ${bodyHtml}
        </div>
      `;

      if (prevFocused) {
        const input = panel.querySelector?.("#global-search-filter-municipio-input");
        if (input) {
          try {
            input.focus({ preventScroll: true });
            if (typeof prevSelStart === "number" && typeof prevSelEnd === "number") {
              input.setSelectionRange(prevSelStart, prevSelEnd);
            }
          } catch {
            // ignore
          }
        }
      }

      // Uma única carga — nunca reencadeia se já falhou/terminou (evita travar a aba).
      if (!app.state.municipioFilterListLoaded && !app.state.municipioFilterListPromise) {
        void app.ensureMunicipiosFilterListLoaded().then(() => {
          renderGlobalSearchMunicipiosPanel();
        });
      }
    }

  app.renderGlobalSearchContractsPanel = function renderGlobalSearchContractsPanel() {
      const panel = app.globalSearchFilterEl?.querySelector?.("#global-search-filter-contracts");
      if (!panel) return;
      const enabled = Boolean(app.state.globalSearch.enabledKinds.has("contratos"));
      panel.hidden = !enabled;
      panel.setAttribute("aria-hidden", enabled ? "false" : "true");
      if (!enabled) {
        panel.innerHTML = "";
        return;
      }

      const current = app.normalizeContractValue(app.state.contractFilter);
      const currentKey = app.normalizeContractKey(current);
      const isLoading = Boolean(app.state.contractSourcesLoadPromise) && !app.state.contractSourcesLoaded;
      const { sorted } = app.collectSortedContractValues();

      const optsHtml = [
        {
          value: "",
          text: "Todos",
          selected: !currentKey,
        },
        ...sorted.map((v) => ({
          value: v,
          text: v,
          selected: app.normalizeContractKey(v) === currentKey,
        })),
      ]
        .map((o) => {
          const cls = `global-search-filter__contract-opt${o.selected ? " is-selected" : ""}`;
          const check = o.selected ? "✓" : "";
          return `<button type="button" class="${cls}" data-filter-contract="${app.escapeHtml(o.value)}" aria-pressed="${
            o.selected ? "true" : "false"
          }"><span>${app.escapeHtml(o.text)}</span><span class="global-search-filter__contract-check" aria-hidden="true">${check}</span></button>`;
        })
        .join("");

      let bodyHtml = optsHtml;
      if (isLoading && sorted.length === 0) {
        bodyHtml = `<div class="global-search-filter__contract-empty">Carregando contratos…</div>`;
      } else if (app.state.contractSourcesAttempted && sorted.length === 0) {
        bodyHtml = `<div class="global-search-filter__contract-empty">Sem contratos disponíveis.</div>`;
      }

      panel.innerHTML = `
        <div class="global-search-filter__contract-head">
          <div class="global-search-filter__contract-title">Contrato</div>
          <div class="global-search-filter__contract-current">${app.escapeHtml(current || "Todos")}</div>
        </div>
        <div class="global-search-filter__contract-list" role="listbox" aria-label="Contratos">
          ${bodyHtml}
        </div>
      `;

      if (!app.state.contractSourcesLoaded) {
        void app.ensureContractSourcesLoaded().then(() => {
          app.refreshContractOptions();
          renderGlobalSearchContractsPanel();
        });
      }
    }

  app.haystackFromContratoColumns = function haystackFromContratoColumns(p) {
      if (!p || typeof p !== "object") return "";
      const keys = app.contractKeyCandidates(p);
      return keys
        .map((k) => app.normalizeSearchText(p[k]))
        .filter(Boolean)
        .join(" ");
    }

  app.featureMatchesContratoColumnsQuery = function featureMatchesContratoColumnsQuery(props, rawQuery) {
      const q = app.normalizeSearchText(rawQuery);
      if (!q) return false;
      const tokens = q.split(" ").filter(Boolean);
      if (!tokens.length) return false;

      const keys = app.contractKeyCandidates(props);
      if (!keys.length) return false;

      for (const k of keys) {
        const nv = app.normalizeSearchText(props?.[k]);
        if (nv && nv === q) return true;
      }

      const hay = app.haystackFromContratoColumns(props);
      if (!hay) return false;
      return tokens.every((t) => hay.includes(t));
    }

  app.haystackFromProperties = function haystackFromProperties(p) {
      if (!p || typeof p !== "object") return "";
      // Mantém como string "normalizada" para busca sem acento/caixa.
      return Object.values(p)
        .map((v) => app.normalizeSearchText(v))
        .filter(Boolean)
        .join(" ");
    }

  app.featureMatchesQuery = function featureMatchesQuery(props, rawQuery) {
      const q = app.normalizeSearchText(rawQuery);
      if (!q) return false;
      const tokens = q.split(" ").filter(Boolean);
      if (!tokens.length) return false;

      // 1) Match exato em QUALQUER campo (sem margem de erro quando o nome é idêntico).
      for (const v of Object.values(props || {})) {
        const nv = app.normalizeSearchText(v);
        if (nv && nv === q) return true;
      }

      // 2) Fallback: todos os termos precisam existir no haystack (permite "Sao Gabriel" etc).
      const hay = app.haystackFromProperties(props);
      if (!hay) return false;
      return tokens.every((t) => hay.includes(t));
    }

  app.findGlobalSearchHitInMunicipios = async function findGlobalSearchHitInMunicipios(q) {
      // Garante que a camada de polígonos (hover) esteja carregada em memória.
      if (!app.state.boundaryMunicipalHoverLayer || !app.state.municipiosFeatures.length) {
        try {
          await app.attachLimiteMunicipalLayerIfNeeded();
        } catch {
          // ignore
        }
      }
      const feats = app.state.municipiosFeatures || [];
      if (!feats.length) return -1;

      const qq = app.normalizeSearchText(q);
      // Primeiro: match exato pelo nome do município (sem margem de erro).
      const idxExact = feats.findIndex((f) => app.normalizeSearchText(app.getMunicipioNomeFromProps(f?.properties)) === qq);
      if (idxExact >= 0) return idxExact;

      // Fallback: busca normalizada em qualquer atributo.
      return feats.findIndex((f) => app.featureMatchesQuery(f?.properties, qq));
    }

  app.applyOnlyRodoviasSublayer = async function applyOnlyRodoviasSublayer(target) {
      if (!app.state.map) return;
      const seg = target === "segmentos";
      const bu = target === "bueiros" && app.layerBueirosToggle && !app.layerBueirosToggle.disabled;
      const po = target === "pontes" && app.layerPontesToggle && !app.layerPontesToggle.disabled;
      const ja = target === "jazidas" && app.layerJazidasToggle && !app.layerJazidasToggle.disabled;

      if (app.layerSegmentosToggle) app.layerSegmentosToggle.checked = seg;
      if (app.layerBueirosToggle) app.layerBueirosToggle.checked = bu;
      if (app.layerPontesToggle) app.layerPontesToggle.checked = po;
      if (app.layerJazidasToggle) app.layerJazidasToggle.checked = ja;

      if (app.state.geojsonLayer && app.state.map.hasLayer(app.state.geojsonLayer)) {
        app.state.map.removeLayer(app.state.geojsonLayer);
      }
      if (app.state.bueirosLayer && app.state.map.hasLayer(app.state.bueirosLayer)) {
        app.state.map.removeLayer(app.state.bueirosLayer);
      }
      if (app.state.pontesBr307Layer && app.state.map.hasLayer(app.state.pontesBr307Layer)) {
        app.state.map.removeLayer(app.state.pontesBr307Layer);
      }
      if (app.state.jazidasBr307Layer && app.state.map.hasLayer(app.state.jazidasBr307Layer)) {
        app.state.map.removeLayer(app.state.jazidasBr307Layer);
      }

      if (seg && app.state.geojsonLayer) {
        // Segmentos BR-319 removido do mapa.
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (bu) {
        await app.ensureBueirosBr317OnMap();
        return;
      }
      if (po) {
        await app.ensurePontesBr307OnMap();
        return;
      }
      if (ja) {
        await app.ensureJazidasBr307OnMap();
        return;
      }
      app.afterRodoviasSublayerVisibilityChange();
    }

  app.searchAndZoom = async function searchAndZoom(text) {
      // Evita "delay" por corrida: se o usuário pesquisar de novo,
      // ignora resultados antigos.
      app.state.globalSearch.runToken += 1;
      const myToken = app.state.globalSearch.runToken;
      app.setGlobalSearchFeedback("searching");
      const results = await app.globalSearchRun(text || "");
      if (myToken !== app.state.globalSearch.runToken) return;
      app.state.globalSearch.lastQuery = String(text || "");
      app.state.globalSearch.lastResults = results || [];
      if (!results.length) {
        app.closeGlobalSearchResults();
        app.setStatus("Pesquisa: nenhum resultado nos filtros selecionados", "error");
        app.setGlobalSearchFeedback("none");
        return;
      }
      if (results.length === 1) {
        await app.openSearchResult(results[0]);
        app.setGlobalSearchFeedback("results", { count: 1 });
        return;
      }
      app.state.globalSearch.results = results;
      app.state.globalSearch.activeIndex = 0;
      app.renderGlobalSearchResults(results);
      app.setStatus(`Pesquisa: ${results.length} resultados — escolha um`, "info");
      app.setGlobalSearchFeedback("results", { count: results.length });
    }

}
