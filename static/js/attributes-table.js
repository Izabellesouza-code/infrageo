/* global L */
export function registerAttributesTable(app) {

  app.rerenderTableForLayerId = function rerenderTableForLayerId(layerId) {
      if (!layerId) return;
      if (layerId === "municipios") {
        app.renderMunicipiosAttributesTable(app.state.municipiosSelectedIndex);
      } else if (layerId === "bueiros") {
        app.renderBueirosAttributesTable(app.state.bueirosSelectedIndex);
      } else if (layerId === "bueiros-br174") {
        app.renderBueirosBr174AttributesTable(app.state.bueirosBr174SelectedIndex);
      } else if (layerId === "bueiros-br319") {
        app.renderBueirosBr319AttributesTable(app.state.bueirosBr319SelectedIndex);
      } else if (layerId === "bueiros-br230") {
        app.renderBueirosBr230AttributesTable(app.state.bueirosBr230SelectedIndex);
      } else if (layerId === "pontes") {
        app.renderPontesAttributesTable(app.state.pontesSelectedIndex);
      } else if (layerId === "jazidas") {
        app.renderJazidasAttributesTable(app.state.jazidasSelectedIndex);
      } else if (layerId === "prads-br174") {
        app.renderPradsBr174AttributesTable(app.state.pradsBr174SelectedIndex);
      } else if (layerId === "pca-prads-br319") {
      } else if (layerId === "prads-br319") {
        app.renderPcaPradsBr319AttributesTable(app.state.pcaPradsBr319SelectedIndex);
        app.renderPradsBr319AttributesTable(app.state.pradsBr319SelectedIndex);
      } else if (layerId === "pca-prads-cmm-br319") {
        app.renderPcaPradsCmmBr319AttributesTable(app.state.pcaPradsCmmBr319SelectedIndex);
      } else if (layerId === "pontes-br319") {
        app.renderPontesBr319AttributesTable(app.state.pontesBr319SelectedIndex);
      } else if (layerId === "pontes-br230") {
        app.renderPontesBr230AttributesTable(app.state.pontesBr230SelectedIndex);
      } else if (layerId === "uc-estadual") {
        app.renderUcEstadualAttributesTable(app.state.ucEstadualSelectedIndex);
      } else if (layerId === "uc-municipal") {
        app.renderUcMunicipalAttributesTable(app.state.ucMunicipalSelectedIndex);
      } else if (layerId === "hidrovias-am") {
        app.renderHidroviasAmAttributesTable(app.state.hidroviasAmSelectedIndex);
      } else if (layerId === "ip4") {
        app.renderIp4AttributesTable(app.state.ip4SelectedIndex);
      } else if (layerId === "ti-am") {
        app.renderTiAmAttributesTable(app.state.tiAmSelectedIndex);
      } else if (String(layerId).startsWith("br-am:")) {
        const key = String(layerId);
        const entry = app.state.brAmTables?.byKey?.[key];
        app.renderBrAmAttributesTable(key, entry?.selectedIndex ?? null);
      } else if (String(layerId).startsWith("map-click:")) {
        app.renderMapClickAttributesTable(layerId, app.state.mapClickTables?.[layerId]?.selectedIndex ?? null);
      } else {
        app.renderAllAttributesTable();
        if (app.state.selectedFeatureIndex !== null) {
          app.highlightRowForFeature(app.state.allFeatures[app.state.selectedFeatureIndex]);
        }
      }
    }

  app.updateTablePanelMeta = function updateTablePanelMeta({ selected = 0, visible = 0, total = 0 } = {}) {
      const legacyMeta = app.$("general-selection-info");
      if (legacyMeta) {
        legacyMeta.innerHTML = "";
        legacyMeta.hidden = true;
      }
    }

  app.updateGeneralSelectionInfo = function updateGeneralSelectionInfo(selectedCount) {
      app.updateTablePanelMeta({
        selected: selectedCount,
        visible: app.state.visibleFeaturesCount || app.state.totalFeaturesCount || 0,
        total: app.state.totalFeaturesCount || 0,
      });
    }

  app.clearSelectedRowHighlight = function clearSelectedRowHighlight() {
      if (app.state.selectedFeatureIndex === null) return;
      const prev = document.querySelector(
        `#all-attributes-table tbody tr[data-feature-index="${app.state.selectedFeatureIndex}"]`
      );
      if (prev) prev.classList.remove("selected-row");
      app.state.selectedFeatureIndex = null;
      app.updateGeneralSelectionInfo(0);
    }

  app.highlightRowForFeature = function highlightRowForFeature(feature) {
      const idx = feature?._tableIndex;
      if (typeof idx !== "number") {
        app.clearSelectedRowHighlight();
        return;
      }
      if (!app.state.allFeatures || app.state.allFeatures.length === 0) {
        app.clearSelectedRowHighlight();
        return;
      }

      app.clearSelectedRowHighlight();
      const row = document.querySelector(
        `#all-attributes-table tbody tr[data-feature-index="${idx}"]`
      );
      if (row) {
        row.classList.add("selected-row");
        app.state.selectedFeatureIndex = idx;
        row.scrollIntoView({ block: "nearest" });
      }
      app.updateGeneralSelectionInfo(1);
    }

  app.getFilteredSortedFeatures = function getFilteredSortedFeatures() {
      const text = app.normalizeSearchText(app.state.generalTable.filterText || "");
      let features = app.state.allFeatures.slice();

      if (text) {
        features = features.filter((f) => {
          return app.featureMatchesQuery(f?.properties, text);
        });
      }

      // Filtros por coluna (tabela geral). Cada coluna usa o nome real do campo.
      const colFilters = app.state.generalTable?.columnFilters || {};
      const activeCols = Object.entries(colFilters).filter(([, v]) => app.normalizeSearchText(v));
      if (activeCols.length) {
        features = features.filter((f) => {
          const p = f?.properties || {};
          return activeCols.every(([k, raw]) => {
            const q = app.normalizeSearchText(raw);
            if (!q) return true;
            const v = app.normalizeSearchText(p?.[k]);
            return v.includes(q);
          });
        });
      }

      const { sortKey, sortDir } = app.state.generalTable;
      if (sortKey) {
        const dir = sortDir === "desc" ? -1 : 1;
        features.sort((a, b) => {
          const av = a.properties?.[sortKey];
          const bv = b.properties?.[sortKey];
          const aNum = app.isNumericLike(av);
          const bNum = app.isNumericLike(bv);

          if (aNum && bNum) return (app.toNumber(av) - app.toNumber(bv)) * dir;
          const as = (av ?? "").toString();
          const bs = (bv ?? "").toString();
          return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
        });
      }

      return features;
    }

  app.tableFilterDebounceTimers = new Map();

  app.countActiveColumnFilters = function countActiveColumnFilters(columnFilters) {
      const cf = columnFilters || {};
      return Object.values(cf).filter((v) => app.normalizeSearchText(v)).length;
    }

  app.buildTableMiniToolsHtml = function buildTableMiniToolsHtml() {
      return `
        <div class="table-mini-tools" role="status">
          <div class="table-filter-status" aria-live="polite">
            <span class="table-filter-status__spinner" aria-hidden="true"></span>
            <span class="table-filter-status__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" focusable="false">
                <path d="M4 5.5h16l-6.2 7.1v4.7L10.2 19v-6.4L4 5.5Z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="table-filter-status__text"></span>
          </div>
          <button type="button" class="table-filter-clear" data-action="clear-table-filters" hidden>
            <svg class="table-filter-clear__icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
              <path d="M6.5 7h11M9.2 7V5.8A1.3 1.3 0 0 1 10.5 4.5h3A1.3 1.3 0 0 1 14.8 5.8V7m.7 0v11.2a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="table-filter-clear__label">Limpar filtros</span>
            <span class="table-filter-clear__label-short">Limpar</span>
          </button>
        </div>
      `;
    }

  app.syncTableFilterChrome = function syncTableFilterChrome(container, { loading = false, visible = 0, total = 0, columnFilters = {} } = {}) {
      if (!container) return;
      const statusEl = container.querySelector(".table-filter-status");
      const clearBtn = container.querySelector(".table-filter-clear");
      const table = container.querySelector("table.attributes-table");
      const activeCount = app.countActiveColumnFilters(columnFilters);
      if (statusEl) {
        const textEl = statusEl.querySelector(".table-filter-status__text");
        statusEl.classList.toggle("is-loading", Boolean(loading));
        statusEl.classList.toggle("is-active", activeCount > 0 && !loading);
        if (textEl) {
          if (loading) {
            textEl.textContent = "Filtrando…";
          } else if (activeCount > 0) {
            if (total > visible) {
              textEl.innerHTML = `<strong>${visible}</strong> de ${total} registros`;
            } else {
              textEl.innerHTML =
                visible === 1
                  ? `<strong>1</strong> resultado`
                  : `<strong>${visible}</strong> resultados`;
            }
          } else {
            textEl.innerHTML =
              total === 1 ? `<strong>1</strong> registro` : `<strong>${total}</strong> registros`;
          }
        }
      }
      if (clearBtn) {
        clearBtn.hidden = activeCount === 0;
        clearBtn.setAttribute("aria-label", "Limpar filtros da tabela");
      }
      if (table) table.classList.toggle("is-filtering", Boolean(loading));
    }

  app.buildCombinedHeaderCells = function buildCombinedHeaderCells(keys, { sortKey, sortDir, columnFilters, headerKeyAttr = "data-key", filterableKeys = null } = {}) {
      const colFilters = columnFilters || {};
      const filterableSet = Array.isArray(filterableKeys) ? new Set(filterableKeys) : null;
      return keys
        .map((h) => {
          const indicator = sortKey === h ? (sortDir === "asc" ? "▲" : "▼") : "";
          const safe = app.escHtmlCell(h);
          const current = app.escHtmlCell(colFilters?.[h] ?? "");
          const attr = headerKeyAttr ? ` ${headerKeyAttr}="${safe}"` : ` data-key="${safe}"`;
          const showFilter = !filterableSet || filterableSet.has(h);
          const filterInput = showFilter
            ? `<input class="col-filter" type="search" inputmode="search" data-col-key="${safe}" placeholder="Filtrar…" value="${current}" />`
            : "";
          return `<th class="sortable col-header-cell"${attr}>
            <div class="col-header-top">
              <span class="col-header-name">${safe}</span>
              ${indicator ? `<span class="sort-indicator">${indicator}</span>` : ""}
            </div>
            ${filterInput}
          </th>`;
        })
        .join("");
    }

  app.getTableStateById = function getTableStateById(tableId) {
      const ensureState = (obj) => {
        if (!obj) return null;
        if (!obj.columnFilters) obj.columnFilters = {};
        return obj;
      };
      if (tableId === "all-attributes-table") return ensureState(app.state.generalTable);
      if (tableId === "bueiros-attributes-table") return ensureState(app.state.bueirosTable);
      if (tableId === "pontes-attributes-table") return ensureState(app.state.pontesTable);
      if (tableId === "jazidas-attributes-table") return ensureState(app.state.jazidasTable);
      if (tableId === "bueiros-br174-attributes-table") return ensureState(app.state.bueirosBr174Table);
      if (tableId === "bueiros-br230-attributes-table") return ensureState(app.state.bueirosBr230Table);
      if (tableId === "bueiros-br319-attributes-table") return ensureState(app.state.bueirosBr319Table);
      if (tableId === "prads-br174-attributes-table") return ensureState(app.state.pradsBr174Table);
      if (tableId === "pca-prads-br319-attributes-table") return ensureState(app.state.pcaPradsBr319Table);
      if (tableId === "prads-br319-attributes-table") return ensureState(app.state.pradsBr319Table);
      if (tableId === "pca-prads-cmm-br319-attributes-table") return ensureState(app.state.pcaPradsCmmBr319Table);
      if (tableId === "pontes-br319-attributes-table") return ensureState(app.state.pontesBr319Table);
      if (tableId === "pontes-br230-attributes-table") return ensureState(app.state.pontesBr230Table);
      if (tableId === "uc-estadual-attributes-table") return ensureState(app.state.ucEstadualTable);
      if (tableId === "uc-municipal-attributes-table") return ensureState(app.state.ucMunicipalTable);
      if (tableId === "hidrovias-am-attributes-table") return ensureState(app.state.hidroviasAmTable);
      if (tableId === "ti-am-attributes-table") return ensureState(app.state.tiAmTable);
      if (tableId === "ip4-attributes-table") return ensureState(app.state.ip4Table);
      if (tableId === "municipios-attributes-table") return ensureState(app.state.municipiosTable);
      if (tableId === "contract-results-attributes-table") return ensureState(app.state.contractResultsTable);
      if (tableId.startsWith("map-click-")) {
        const layerId = String(app.state.tableDataset || "");
        return ensureState(app.state.mapClickTables?.[layerId]?.table);
      }
      if (tableId.startsWith("br-am-") && String(app.state.tableDataset || "").startsWith("br-am:")) {
        const entry = app.state.brAmTables?.byKey?.[String(app.state.tableDataset)];
        return ensureState(entry?.table);
      }
      return null;
    }

  app.rerenderAttributesTableById = function rerenderAttributesTableById(tableId) {
      if (tableId === "all-attributes-table") app.renderAllAttributesTable();
      else if (tableId === "bueiros-attributes-table") app.renderBueirosAttributesTable(app.state.bueirosSelectedIndex);
      else if (tableId === "pontes-attributes-table") app.renderPontesAttributesTable(app.state.pontesSelectedIndex);
      else if (tableId === "jazidas-attributes-table") app.renderJazidasAttributesTable(app.state.jazidasSelectedIndex);
      else if (tableId === "bueiros-br174-attributes-table") app.renderBueirosBr174AttributesTable(app.state.bueirosBr174SelectedIndex);
      else if (tableId === "bueiros-br230-attributes-table") app.renderBueirosBr230AttributesTable(app.state.bueirosBr230SelectedIndex);
      else if (tableId === "bueiros-br319-attributes-table") app.renderBueirosBr319AttributesTable(app.state.bueirosBr319SelectedIndex);
      else if (tableId === "prads-br174-attributes-table") app.renderPradsBr174AttributesTable(app.state.pradsBr174SelectedIndex);
      else if (tableId === "pca-prads-br319-attributes-table") app.renderPcaPradsBr319AttributesTable(app.state.pcaPradsBr319SelectedIndex);
      else if (tableId === "prads-br319-attributes-table") app.renderPradsBr319AttributesTable(app.state.pradsBr319SelectedIndex);
      else if (tableId === "pca-prads-cmm-br319-attributes-table") app.renderPcaPradsCmmBr319AttributesTable(app.state.pcaPradsCmmBr319SelectedIndex);
      else if (tableId === "pontes-br319-attributes-table") app.renderPontesBr319AttributesTable(app.state.pontesBr319SelectedIndex);
      else if (tableId === "pontes-br230-attributes-table") app.renderPontesBr230AttributesTable(app.state.pontesBr230SelectedIndex);
      else if (tableId === "uc-estadual-attributes-table") app.renderUcEstadualAttributesTable(app.state.ucEstadualSelectedIndex);
      else if (tableId === "uc-municipal-attributes-table") app.renderUcMunicipalAttributesTable(app.state.ucMunicipalSelectedIndex);
      else if (tableId === "hidrovias-am-attributes-table") app.renderHidroviasAmAttributesTable(app.state.hidroviasAmSelectedIndex);
      else if (tableId === "ti-am-attributes-table") app.renderTiAmAttributesTable(app.state.tiAmSelectedIndex);
      else if (tableId === "ip4-attributes-table") app.renderIp4AttributesTable(app.state.ip4SelectedIndex);
      else if (tableId === "municipios-attributes-table") app.renderMunicipiosAttributesTable(app.state.municipiosSelectedIndex);
      else if (tableId === "contract-results-attributes-table") app.renderContractResultsAttributesTable(app.state.contractResultsSelectedIndex);
      else if (tableId.startsWith("map-click-") && String(app.state.tableDataset || "").startsWith("map-click:")) {
        app.renderMapClickAttributesTable(String(app.state.tableDataset), app.state.mapClickTables?.[String(app.state.tableDataset)]?.selectedIndex ?? null);
      }
      else if (tableId.startsWith("br-am-") && String(app.state.tableDataset || "").startsWith("br-am:")) {
        app.renderBrAmAttributesTable(String(app.state.tableDataset), app.state.brAmTables?.byKey?.[String(app.state.tableDataset)]?.selectedIndex ?? null);
      }
    }

  app.restoreColumnFilterFocus = function restoreColumnFilterFocus(tableId, key, caretStart, caretEnd) {
      const esc = (s) => {
        try {
          return window.CSS && typeof window.CSS.escape === "function" ? window.CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");
        } catch {
          return String(s).replace(/["\\]/g, "\\$&");
        }
      };
      try {
        const sel = `#${esc(tableId)} input.col-filter[data-col-key="${esc(key)}"]`;
        const next = document.querySelector(sel);
        if (!next) return;
        next.focus?.();
        if (caretStart !== null && caretEnd !== null && typeof next.setSelectionRange === "function") {
          next.setSelectionRange(caretStart, caretEnd);
        }
      } catch {
        // ignore
      }
    }

  app.renderAllAttributesTable = function renderAllAttributesTable() {
      // Segmentos (tabela geral): mesmo layout/formatadores das demais tabelas.
      const headers = app.collectColumnKeysFromFeatures(app.state.allFeatures);
      const features = app.getFilteredSortedFeatures();
      app.state.visibleFeaturesCount = features.length;
      const selIdx = app.state.selectedFeatureIndex;

      app.renderGenericAttributesTable({
        containerId: "all-attributes",
        tableId: "all-attributes-table",
        keys: headers,
        features,
        getIndex: (f) => f?._tableIndex,
        dataAttr: "data-feature-index",
        highlightIndex: selIdx,
        headerKeyAttr: "data-key",
        sortKey: app.state.generalTable.sortKey,
        sortDir: app.state.generalTable.sortDir,
        columnFilters: app.state.generalTable?.columnFilters || {},
        emptyMessage: "Nenhum registro encontrado.",
        sourceTotal: app.state.allFeatures.length,
      });
      app.updateGeneralSelectionInfo(app.state.selectedFeatureIndex === null ? 0 : 1);
    }

  app.getFilteredSortedBueirosFeatures = function getFilteredSortedBueirosFeatures() {
      const text = app.normalizeSearchText(app.state.bueirosTable.filterText || "");
      let features = app.state.bueirosFeatures.slice();
      if (text) {
        features = features.filter((f) => app.featureMatchesQuery(f?.properties, text));
      }

      // Filtros por coluna (bueiros BR-317)
      const colFilters = app.state.bueirosTable?.columnFilters || {};
      const activeCols = Object.entries(colFilters).filter(([, v]) => app.normalizeSearchText(v));
      if (activeCols.length) {
        features = features.filter((f) => {
          const p = f?.properties || {};
          return activeCols.every(([k, raw]) => {
            const q = app.normalizeSearchText(raw);
            if (!q) return true;
            const v = app.normalizeSearchText(p?.[k]);
            return v.includes(q);
          });
        });
      }

      const { sortKey, sortDir } = app.state.bueirosTable;
      if (sortKey) {
        const dir = sortDir === "desc" ? -1 : 1;
        features.sort((a, b) => {
          const av = a.properties?.[sortKey];
          const bv = b.properties?.[sortKey];
          const aNum = app.isNumericLike(av);
          const bNum = app.isNumericLike(bv);
          if (aNum && bNum) return (app.toNumber(av) - app.toNumber(bv)) * dir;
          const as = (av ?? "").toString();
          const bs = (bv ?? "").toString();
          return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
        });
      }
      return features;
    }

  app.updateBueirosTableSelectionInfo = function updateBueirosTableSelectionInfo(visibleCount, totalCount, highlightIndex) {
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: visibleCount,
        total: totalCount,
      });
    }

  app.updatePontesTableSelectionInfo = function updatePontesTableSelectionInfo(visibleCount, totalCount, highlightIndex) {
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: visibleCount,
        total: totalCount,
      });
    }

  app.updateJazidasTableSelectionInfo = function updateJazidasTableSelectionInfo(visibleCount, totalCount, highlightIndex) {
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: visibleCount,
        total: totalCount,
      });
    }

  app.getPanelTableLabel = function getPanelTableLabel() {
      if (app.state.tableDataset === "contract-results") return "Resultado do contrato";
      if (String(app.state.tableDataset || "").startsWith("br-am:")) {
        const id = app.brAmIdFromLayerKey(app.state.tableDataset);
        const name = app.normalizeBrAmDisplayName(app.getBrAmNameById(id) || "");
        return name ? `BR-AM · ${name}` : "BR-AM";
      }
      if (app.state.tableDataset === "bueiros") return "Bueiros BR-317";
      if (app.state.tableDataset === "bueiros-br174") return "Bueiros BR-174";
      if (app.state.tableDataset === "bueiros-br230") return "Bueiros BR-230";
      if (app.state.tableDataset === "bueiros-br319") return "Bueiros BR-319";
      if (app.state.tableDataset === "pontes") return "Pontes BR-307";
      if (app.state.tableDataset === "jazidas") return "Jazidas BR-307";
      if (app.state.tableDataset === "prads-br174") return "PRADS BR-174";
      if (app.state.tableDataset === "pca-prads-br319") return "PCA - PRADS BR-319";
      if (app.state.tableDataset === "prads-br319") return "PRADS BR-319";
      if (app.state.tableDataset === "pca-prads-cmm-br319") return "PCA - PRADS CMM BR-319";
      if (app.state.tableDataset === "pontes-br319") return "Pontes BR-319";
      if (app.state.tableDataset === "pontes-br230") return "Pontes BR-230";
      if (app.state.tableDataset === "uc-estadual") return "UC estadual";
      if (app.state.tableDataset === "uc-municipal") return "UC municipal";
      if (app.state.tableDataset === "hidrovias-am") return "Hidrovias AM";
      if (app.state.tableDataset === "ip4") return "IP4";
      if (app.state.tableDataset === "ti-am") return "TI AM";
      if (app.state.tableDataset === "municipios") return "Municípios (AM)";
      if (String(app.state.tableDataset || "").startsWith("map-click:")) {
        const kind = String(app.state.tableDataset).slice("map-click:".length);
        return app.getSelectionKindLayerLabel(kind);
      }
      return "Rodovias";
    }

  app.refreshPanelTableTitle = function refreshPanelTableTitle() {
      const label = app.$("panel-table-label");
      if (!label) return;
      label.textContent = app.getPanelTableLabel();
    }

  app.syncGeneralFilterPlaceholder = function syncGeneralFilterPlaceholder() {
      if (!app.generalFilterInput) return;
      const ds = String(app.state.tableDataset || "");
      const map = {
        "contract-results": "Filtrar pela coluna contrato…",
        bueiros: "Filtrar pela tabela de bueiros (qualquer coluna)…",
        "bueiros-br174": "Filtrar pela tabela de bueiros BR-174 (qualquer coluna)…",
        "bueiros-br230": "Filtrar pela tabela de bueiros BR-230 (qualquer coluna)…",
        "bueiros-br319": "Filtrar pela tabela de bueiros BR-319 (qualquer coluna)…",
        pontes: "Filtrar pela tabela de pontes (qualquer coluna)…",
        jazidas: "Filtrar pela tabela de jazidas (qualquer coluna)…",
        "prads-br174": "Filtrar pela tabela de PRADS BR-174 (qualquer coluna)…",
        "pca-prads-br319": "Filtrar pela tabela de PCA - PRADS (qualquer coluna)…",
        "prads-br319": "Filtrar pela tabela de PRADS (qualquer coluna)…",
        "pca-prads-cmm-br319": "Filtrar pela tabela de PCA - PRADS CMM (qualquer coluna)…",
        "pontes-br319": "Filtrar pela tabela de pontes BR-319 (qualquer coluna)…",
        "pontes-br230": "Filtrar pela tabela de pontes BR-230 (qualquer coluna)…",
        "uc-estadual": "Filtrar pela tabela de UC Estadual (qualquer coluna)…",
        "uc-municipal": "Filtrar pela tabela de UC Municipal (qualquer coluna)…",
        "hidrovias-am": "Filtrar pela tabela de Hidrovias AM (qualquer coluna)…",
        ip4: "Filtrar pela tabela de IP4 (qualquer coluna)…",
        municipios: "Filtrar pela tabela de municípios (qualquer coluna)…",
        "ti-am": "Filtrar pela tabela de TI AM (qualquer coluna)…",
      };
      if (ds.startsWith("br-am:")) {
        app.generalFilterInput.placeholder = "Filtrar pela tabela BR-AM (qualquer coluna)…";
        return;
      }
      app.generalFilterInput.placeholder = map[ds] || "Filtrar pela tabela de segmentos (qualquer coluna)…";
    }

  app.syncGeneralFilterValue = function syncGeneralFilterValue() {
      if (!app.generalFilterInput) return;
      const ds = String(app.state.tableDataset || "");
      if (ds === "contract-results") {
        app.generalFilterInput.value = app.state.contractResultsTable.filterText;
        return;
      }
      if (ds.startsWith("br-am:")) {
        app.generalFilterInput.value = app.state.brAmTables?.byKey?.[ds]?.table?.filterText || "";
        return;
      }
      const tables = {
        bueiros: app.state.bueirosTable,
        "bueiros-br174": app.state.bueirosBr174Table,
        "bueiros-br230": app.state.bueirosBr230Table,
        "bueiros-br319": app.state.bueirosBr319Table,
        pontes: app.state.pontesTable,
        jazidas: app.state.jazidasTable,
        "prads-br174": app.state.pradsBr174Table,
        "pca-prads-br319": app.state.pcaPradsBr319Table,
        "prads-br319": app.state.pradsBr319Table,
        "pca-prads-cmm-br319": app.state.pcaPradsCmmBr319Table,
        "pontes-br319": app.state.pontesBr319Table,
        "pontes-br230": app.state.pontesBr230Table,
        "uc-estadual": app.state.ucEstadualTable,
        "uc-municipal": app.state.ucMunicipalTable,
        "hidrovias-am": app.state.hidroviasAmTable,
        ip4: app.state.ip4Table,
        municipios: app.state.municipiosTable,
        "ti-am": app.state.tiAmTable,
      };
      app.generalFilterInput.value = tables[ds]?.filterText || app.state.generalTable.filterText;
    }

  app.clearBueirosRowHighlight = function clearBueirosRowHighlight() {
      document.querySelectorAll("#bueiros-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.bueirosSelectedIndex = null;
    }

  app.clearBueirosBr174RowHighlight = function clearBueirosBr174RowHighlight() {
      document.querySelectorAll("#bueiros-br174-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.bueirosBr174SelectedIndex = null;
    }

  app.clearPontesRowHighlight = function clearPontesRowHighlight() {
      document.querySelectorAll("#pontes-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.pontesSelectedIndex = null;
    }

  app.clearJazidasRowHighlight = function clearJazidasRowHighlight() {
      document.querySelectorAll("#jazidas-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.jazidasSelectedIndex = null;
    }

  app.clearPradsBr174RowHighlight = function clearPradsBr174RowHighlight() {
      document.querySelectorAll("#prads-br174-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.pradsBr174SelectedIndex = null;
    }

  app.clearPcaPradsBr319RowHighlight = function clearPcaPradsBr319RowHighlight() {
      document.querySelectorAll("#pca-prads-br319-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.pcaPradsBr319SelectedIndex = null;
    }

  app.clearPradsBr319RowHighlight = function clearPradsBr319RowHighlight() {
      document.querySelectorAll("#prads-br319-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.pradsBr319SelectedIndex = null;
    }

  app.clearPcaPradsCmmBr319RowHighlight = function clearPcaPradsCmmBr319RowHighlight() {
      document.querySelectorAll("#pca-prads-cmm-br319-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.pcaPradsCmmBr319SelectedIndex = null;
    }

  app.clearPontesBr319RowHighlight = function clearPontesBr319RowHighlight() {
      document.querySelectorAll("#pontes-br319-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.pontesBr319SelectedIndex = null;
    }

  app.clearPontesBr230RowHighlight = function clearPontesBr230RowHighlight() {
      document.querySelectorAll("#pontes-br230-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.pontesBr230SelectedIndex = null;
    }

  app.clearUcEstadualRowHighlight = function clearUcEstadualRowHighlight() {
      document.querySelectorAll("#uc-estadual-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.ucEstadualSelectedIndex = null;
    }

  app.clearUcMunicipalRowHighlight = function clearUcMunicipalRowHighlight() {
      document.querySelectorAll("#uc-municipal-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.ucMunicipalSelectedIndex = null;
    }

  app.clearTiAmRowHighlight = function clearTiAmRowHighlight() {
      document.querySelectorAll("#ti-am-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.tiAmSelectedIndex = null;
    }

  app.clearHidroviasAmRowHighlight = function clearHidroviasAmRowHighlight() {
      document.querySelectorAll("#hidrovias-am-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.hidroviasAmSelectedIndex = null;
    }

  app.clearIp4RowHighlight = function clearIp4RowHighlight() {
      document.querySelectorAll("#ip4-attributes-table tbody tr.selected-row").forEach((r) => {
        r.classList.remove("selected-row");
      });
      app.state.ip4SelectedIndex = null;
    }

  app.isSyntheticAttributeKey = function isSyntheticAttributeKey(key) {
      const k = String(key || "");
      if (!k) return true;
      const low = k.toLowerCase();
      if (low === "__source" || low === "_source" || low === "_note" || low === "source") return true;
      if (low.startsWith("__")) return true;
      return false;
    }

  app.collectColumnKeysFromFeatures = function collectColumnKeysFromFeatures(features) {
      const keySet = new Set();
      (features || []).forEach((f) => {
        const p = f?.properties;
        if (!p || typeof p !== "object") return;
        Object.keys(p).forEach((k) => {
          if (app.isSyntheticAttributeKey(k)) return;
          keySet.add(k);
        });
      });
      return Array.from(keySet).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
    }

  app.collectAllColumnKeysFromFeatures = function collectAllColumnKeysFromFeatures(features) {
      return app.collectColumnKeysFromFeatures(features);
    }

  app.getFilteredSortedPontesFeatures = function getFilteredSortedPontesFeatures() {
      const text = app.normalizeSearchText(app.state.pontesTable.filterText || "");
      let features = app.state.pontesFeatures.slice();
      if (text) features = features.filter((f) => app.featureMatchesQuery(f?.properties, text));

      // Filtros por coluna (pontes BR-307)
      const colFilters = app.state.pontesTable?.columnFilters || {};
      const activeCols = Object.entries(colFilters).filter(([, v]) => app.normalizeSearchText(v));
      if (activeCols.length) {
        features = features.filter((f) => {
          const p = f?.properties || {};
          return activeCols.every(([k, raw]) => {
            const q = app.normalizeSearchText(raw);
            if (!q) return true;
            const v = app.normalizeSearchText(p?.[k]);
            return v.includes(q);
          });
        });
      }

      const { sortKey, sortDir } = app.state.pontesTable;
      if (sortKey) {
        const dir = sortDir === "desc" ? -1 : 1;
        features.sort((a, b) => {
          const av = a.properties?.[sortKey];
          const bv = b.properties?.[sortKey];
          const aNum = app.isNumericLike(av);
          const bNum = app.isNumericLike(bv);
          if (aNum && bNum) return (app.toNumber(av) - app.toNumber(bv)) * dir;
          const as = (av ?? "").toString();
          const bs = (bv ?? "").toString();
          return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
        });
      }
      return features;
    }

  app.getFilteredSortedJazidasFeatures = function getFilteredSortedJazidasFeatures() {
      const text = app.normalizeSearchText(app.state.jazidasTable.filterText || "");
      let features = app.state.jazidasFeatures.slice();
      if (text) features = features.filter((f) => app.featureMatchesQuery(f?.properties, text));

      // Filtros por coluna (jazidas BR-307)
      const colFilters = app.state.jazidasTable?.columnFilters || {};
      const activeCols = Object.entries(colFilters).filter(([, v]) => app.normalizeSearchText(v));
      if (activeCols.length) {
        features = features.filter((f) => {
          const p = f?.properties || {};
          return activeCols.every(([k, raw]) => {
            const q = app.normalizeSearchText(raw);
            if (!q) return true;
            const v = app.normalizeSearchText(p?.[k]);
            return v.includes(q);
          });
        });
      }

      const { sortKey, sortDir } = app.state.jazidasTable;
      if (sortKey) {
        const dir = sortDir === "desc" ? -1 : 1;
        features.sort((a, b) => {
          const av = a.properties?.[sortKey];
          const bv = b.properties?.[sortKey];
          const aNum = app.isNumericLike(av);
          const bNum = app.isNumericLike(bv);
          if (aNum && bNum) return (app.toNumber(av) - app.toNumber(bv)) * dir;
          const as = (av ?? "").toString();
          const bs = (bv ?? "").toString();
          return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
        });
      }
      return features;
    }

  app.getFilteredSortedGenericFeatures = function getFilteredSortedGenericFeatures(featuresIn, tableState, options = {}) {
      const text = app.normalizeSearchText(tableState?.filterText || "");
      let features = (featuresIn || []).slice();
      // Filtro global por contrato também precisa afetar a tabela (não só o mapa/popup).
      // Município: só no mapa — a tabela do SHP mantém todos os registros/colunas originais.
      if (app.normalizeContractKey(app.state.contractFilter)) {
        features = features.filter((f) => app.featureMatchesContract(f));
      }
      if (text) {
        const matchFn = options.contractColumnsOnly ? app.featureMatchesContratoColumnsQuery : app.featureMatchesQuery;
        features = features.filter((f) => matchFn(f?.properties, text));
      }

      // Filtros por coluna (genérico): aplica somente às chaves existentes.
      const colFilters = tableState?.columnFilters || {};
      const activeCols = Object.entries(colFilters).filter(([, v]) => app.normalizeSearchText(v));
      if (activeCols.length) {
        features = features.filter((f) => {
          const p = f?.properties || {};
          return activeCols.every(([k, raw]) => {
            const q = app.normalizeSearchText(raw);
            if (!q) return true;
            const v = app.normalizeSearchText(p?.[k]);
            return v.includes(q);
          });
        });
      }

      const sortKey = tableState?.sortKey;
      const sortDir = tableState?.sortDir;
      if (sortKey) {
        const dir = sortDir === "desc" ? -1 : 1;
        features.sort((a, b) => {
          const av = a.properties?.[sortKey];
          const bv = b.properties?.[sortKey];
          const aNum = app.isNumericLike(av);
          const bNum = app.isNumericLike(bv);
          if (aNum && bNum) return (app.toNumber(av) - app.toNumber(bv)) * dir;
          const as = (av ?? "").toString();
          const bs = (bv ?? "").toString();
          return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
        });
      }
      return features;
    }

  app.renderGenericAttributesTable = function renderGenericAttributesTable({
      containerId = "all-attributes",
      tableId,
      keys,
      features,
      getIndex,
      dataAttr,
      highlightIndex,
      headerKeyAttr,
      sortKey,
      sortDir,
      columnFilters,
      emptyMessage,
      sourceTotal,
      filterableKeys = null,
    }) {
      const container = app.$(containerId);
      if (!container) return;
      keys = (keys || []).filter((k) => !app.isSyntheticAttributeKey(k));
      const colFilters = columnFilters || {};
      const headerRow = app.buildCombinedHeaderCells(keys, {
        sortKey,
        sortDir,
        columnFilters: colFilters,
        headerKeyAttr,
        filterableKeys,
      });

      const visible = features.length;
      const total = typeof sourceTotal === "number" ? sourceTotal : visible;

      const bodyRows = features
        .map((f) => {
          const idx = getIndex(f);
          const cells = keys
            .map((h) => {
              const raw = f.properties?.[h];
              const numClass = app.isNumericLike(raw) && !/[A-Za-zÀ-ÿ_/]/.test(String(raw ?? ""))
                ? ' class="is-num"'
                : "";
              return `<td${numClass}>${app.escAttributeCell(raw, h)}</td>`;
            })
            .join("");
          const rowClass = idx === highlightIndex ? "selected-row" : "";
          return `<tr ${dataAttr}="${idx}" class="${rowClass}">${cells}</tr>`;
        })
        .join("");

      if (!keys.length) {
        container.innerHTML = `<div class="panel-body panel-body--muted">${app.escHtmlCell(emptyMessage)}</div>`;
        return { visible: 0, total: 0 };
      }

      container.innerHTML = `
        ${app.buildTableMiniToolsHtml()}
        <table class="attributes-table attributes-table--filled" id="${tableId}">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      `;

      app.syncTableFilterChrome(container, {
        visible,
        total,
        columnFilters: colFilters,
      });

      return { visible, total };
    }

  app.renderBueirosAttributesTable = function renderBueirosAttributesTable(highlightIndex) {
      const keys =
        app.state.bueirosColumnKeys.length > 0 ? app.state.bueirosColumnKeys : app.collectBueirosColumnKeys(app.state.bueirosFeatures);
      if (!app.state.bueirosColumnKeys.length && keys.length) app.state.bueirosColumnKeys = keys;
      app.state.bueirosSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedBueirosFeatures();
      const res = app.renderGenericAttributesTable({
        tableId: "bueiros-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._bueirosIndex,
        dataAttr: "data-bueiros-index",
        highlightIndex,
        headerKeyAttr: "data-bueiros-key",
        sortKey: app.state.bueirosTable.sortKey,
        sortDir: app.state.bueirosTable.sortDir,
        columnFilters: app.state.bueirosTable?.columnFilters,
        emptyMessage: "Nenhuma feição de bueiros carregada.",
      });
      app.updateBueirosTableSelectionInfo(res.visible, app.state.bueirosFeatures.length, highlightIndex);
    }

  app.renderPontesAttributesTable = function renderPontesAttributesTable(highlightIndex) {
      const keys =
        app.state.pontesColumnKeys.length > 0 ? app.state.pontesColumnKeys : app.collectColumnKeysFromFeatures(app.state.pontesFeatures);
      if (!app.state.pontesColumnKeys.length && keys.length) app.state.pontesColumnKeys = keys;
      app.state.pontesSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedPontesFeatures();
      const res = app.renderGenericAttributesTable({
        tableId: "pontes-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._pontesIndex,
        dataAttr: "data-pontes-index",
        highlightIndex,
        headerKeyAttr: "data-pontes-key",
        sortKey: app.state.pontesTable.sortKey,
        sortDir: app.state.pontesTable.sortDir,
        columnFilters: app.state.pontesTable?.columnFilters,
        emptyMessage: "Nenhuma feição de pontes carregada.",
      });
      app.updatePontesTableSelectionInfo(res.visible, app.state.pontesFeatures.length, highlightIndex);
    }

  app.renderJazidasAttributesTable = function renderJazidasAttributesTable(highlightIndex) {
      const keys =
        app.state.jazidasColumnKeys.length > 0 ? app.state.jazidasColumnKeys : app.collectColumnKeysFromFeatures(app.state.jazidasFeatures);
      if (!app.state.jazidasColumnKeys.length && keys.length) app.state.jazidasColumnKeys = keys;
      app.state.jazidasSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedJazidasFeatures();
      const res = app.renderGenericAttributesTable({
        tableId: "jazidas-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._jazidasIndex,
        dataAttr: "data-jazidas-index",
        highlightIndex,
        headerKeyAttr: "data-jazidas-key",
        sortKey: app.state.jazidasTable.sortKey,
        sortDir: app.state.jazidasTable.sortDir,
        columnFilters: app.state.jazidasTable?.columnFilters,
        emptyMessage: "Nenhuma feição de jazidas carregada.",
      });
      app.updateJazidasTableSelectionInfo(res.visible, app.state.jazidasFeatures.length, highlightIndex);
    }

  app.renderBueirosBr174AttributesTable = function renderBueirosBr174AttributesTable(highlightIndex) {
      const keys =
        app.state.bueirosBr174ColumnKeys.length > 0
          ? app.state.bueirosBr174ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.bueirosBr174Features);
      if (!app.state.bueirosBr174ColumnKeys.length && keys.length) app.state.bueirosBr174ColumnKeys = keys;
      app.state.bueirosBr174SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.bueirosBr174Features, app.state.bueirosBr174Table);
      const res = app.renderGenericAttributesTable({
        tableId: "bueiros-br174-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._bueirosBr174Index,
        dataAttr: "data-bueiros-br174-index",
        highlightIndex,
        headerKeyAttr: 'data-bueiros-br174-key',
        sortKey: app.state.bueirosBr174Table.sortKey,
        sortDir: app.state.bueirosBr174Table.sortDir,
        columnFilters: app.state.bueirosBr174Table?.columnFilters,
        emptyMessage: "Nenhuma feição de bueiros BR-174 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.bueirosBr174Features.length,
      });
    }

  app.renderPradsBr174AttributesTable = function renderPradsBr174AttributesTable(highlightIndex) {
      const keys =
        app.state.pradsBr174ColumnKeys.length > 0
          ? app.state.pradsBr174ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.pradsBr174Features);
      if (!app.state.pradsBr174ColumnKeys.length && keys.length) app.state.pradsBr174ColumnKeys = keys;
      app.state.pradsBr174SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.pradsBr174Features, app.state.pradsBr174Table);
      const res = app.renderGenericAttributesTable({
        tableId: "prads-br174-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._pradsBr174Index,
        dataAttr: "data-prads-br174-index",
        highlightIndex,
        headerKeyAttr: 'data-prads-br174-key',
        sortKey: app.state.pradsBr174Table.sortKey,
        sortDir: app.state.pradsBr174Table.sortDir,
        columnFilters: app.state.pradsBr174Table?.columnFilters,
        emptyMessage: "Nenhuma feição de PRADS BR-174 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.pradsBr174Features.length,
      });
    }

  app.renderPcaPradsBr319AttributesTable = function renderPcaPradsBr319AttributesTable(highlightIndex) {
      const keys =
        app.state.pcaPradsBr319ColumnKeys.length > 0
          ? app.state.pcaPradsBr319ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.pcaPradsBr319Features);
      if (!app.state.pcaPradsBr319ColumnKeys.length && keys.length) app.state.pcaPradsBr319ColumnKeys = keys;
      app.state.pcaPradsBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.pcaPradsBr319Features, app.state.pcaPradsBr319Table);
      const res = app.renderGenericAttributesTable({
        tableId: "pca-prads-br319-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._pcaPradsBr319Index,
        dataAttr: "data-pca-prads-br319-index",
        highlightIndex,
        headerKeyAttr: 'data-pca-prads-br319-key',
        sortKey: app.state.pcaPradsBr319Table.sortKey,
        sortDir: app.state.pcaPradsBr319Table.sortDir,
        columnFilters: app.state.pcaPradsBr319Table?.columnFilters,
        emptyMessage: "Nenhuma feição de PCA - PRADS BR-319 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.pcaPradsBr319Features.length,
      });
    }

  app.renderPradsBr319AttributesTable = function renderPradsBr319AttributesTable(highlightIndex) {
      const keys =
        app.state.pradsBr319ColumnKeys.length > 0
          ? app.state.pradsBr319ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.pradsBr319Features);
      if (!app.state.pradsBr319ColumnKeys.length && keys.length) app.state.pradsBr319ColumnKeys = keys;
      app.state.pradsBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.pradsBr319Features, app.state.pradsBr319Table);
      const res = app.renderGenericAttributesTable({
        tableId: "prads-br319-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._pradsBr319Index,
        dataAttr: "data-prads-br319-index",
        highlightIndex,
        headerKeyAttr: 'data-prads-br319-key',
        sortKey: app.state.pradsBr319Table.sortKey,
        sortDir: app.state.pradsBr319Table.sortDir,
        columnFilters: app.state.pradsBr319Table?.columnFilters,
        emptyMessage: "Nenhuma feição de PRADS BR-319 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.pradsBr319Features.length,
      });
    }

  app.renderPcaPradsCmmBr319AttributesTable = function renderPcaPradsCmmBr319AttributesTable(highlightIndex) {
      const keys =
        app.state.pcaPradsCmmBr319ColumnKeys.length > 0
          ? app.state.pcaPradsCmmBr319ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.pcaPradsCmmBr319Features);
      if (!app.state.pcaPradsCmmBr319ColumnKeys.length && keys.length) app.state.pcaPradsCmmBr319ColumnKeys = keys;
      app.state.pcaPradsCmmBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.pcaPradsCmmBr319Features, app.state.pcaPradsCmmBr319Table);
      const res = app.renderGenericAttributesTable({
        tableId: "pca-prads-cmm-br319-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._pcaPradsCmmBr319Index,
        dataAttr: "data-pca-prads-cmm-br319-index",
        highlightIndex,
        headerKeyAttr: 'data-pca-prads-cmm-br319-key',
        sortKey: app.state.pcaPradsCmmBr319Table.sortKey,
        sortDir: app.state.pcaPradsCmmBr319Table.sortDir,
        columnFilters: app.state.pcaPradsCmmBr319Table?.columnFilters,
        emptyMessage: "Nenhuma feição de PCA - PRADS CMM BR-319 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.pcaPradsCmmBr319Features.length,
      });
    }

  app.renderBueirosBr230AttributesTable = function renderBueirosBr230AttributesTable(highlightIndex) {
      const keys =
        app.state.bueirosBr230ColumnKeys.length > 0
          ? app.state.bueirosBr230ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.bueirosBr230Features);
      if (!app.state.bueirosBr230ColumnKeys.length && keys.length) app.state.bueirosBr230ColumnKeys = keys;
      app.state.bueirosBr230SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.bueirosBr230Features, app.state.bueirosBr230Table);
      const res = app.renderGenericAttributesTable({
        tableId: "bueiros-br230-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._bueirosBr230Index,
        dataAttr: "data-bueiros-br230-index",
        highlightIndex,
        headerKeyAttr: "data-bueiros-br230-key",
        sortKey: app.state.bueirosBr230Table.sortKey,
        sortDir: app.state.bueirosBr230Table.sortDir,
        columnFilters: app.state.bueirosBr230Table?.columnFilters,
        emptyMessage: "Nenhuma feição de bueiros BR-230 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.bueirosBr230Features.length,
      });
    }

  app.renderBueirosBr319AttributesTable = function renderBueirosBr319AttributesTable(highlightIndex) {
      const keys =
        app.state.bueirosBr319ColumnKeys.length > 0
          ? app.state.bueirosBr319ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.bueirosBr319Features);
      if (!app.state.bueirosBr319ColumnKeys.length && keys.length) app.state.bueirosBr319ColumnKeys = keys;
      app.state.bueirosBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.bueirosBr319Features, app.state.bueirosBr319Table);
      const res = app.renderGenericAttributesTable({
        tableId: "bueiros-br319-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._bueirosBr319Index,
        dataAttr: "data-bueiros-br319-index",
        highlightIndex,
        headerKeyAttr: "data-bueiros-br319-key",
        sortKey: app.state.bueirosBr319Table.sortKey,
        sortDir: app.state.bueirosBr319Table.sortDir,
        columnFilters: app.state.bueirosBr319Table?.columnFilters,
        emptyMessage: "Nenhuma feição de bueiros BR-319 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.bueirosBr319Features.length,
      });
    }

  app.renderPontesBr319AttributesTable = function renderPontesBr319AttributesTable(highlightIndex) {
      const keys =
        app.state.pontesBr319ColumnKeys.length > 0
          ? app.state.pontesBr319ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.pontesBr319Features);
      if (!app.state.pontesBr319ColumnKeys.length && keys.length) app.state.pontesBr319ColumnKeys = keys;
      app.state.pontesBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.pontesBr319Features, app.state.pontesBr319Table);
      const res = app.renderGenericAttributesTable({
        tableId: "pontes-br319-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._pontesBr319Index,
        dataAttr: "data-pontes-br319-index",
        highlightIndex,
        headerKeyAttr: "data-pontes-br319-key",
        sortKey: app.state.pontesBr319Table.sortKey,
        sortDir: app.state.pontesBr319Table.sortDir,
        columnFilters: app.state.pontesBr319Table?.columnFilters,
        emptyMessage: "Nenhuma feição de pontes BR-319 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.pontesBr319Features.length,
      });
    }

  app.renderPontesBr230AttributesTable = function renderPontesBr230AttributesTable(highlightIndex) {
      const keys =
        app.state.pontesBr230ColumnKeys.length > 0
          ? app.state.pontesBr230ColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.pontesBr230Features);
      if (!app.state.pontesBr230ColumnKeys.length && keys.length) app.state.pontesBr230ColumnKeys = keys;
      app.state.pontesBr230SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.pontesBr230Features, app.state.pontesBr230Table);
      const res = app.renderGenericAttributesTable({
        tableId: "pontes-br230-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._pontesBr230Index,
        dataAttr: "data-pontes-br230-index",
        highlightIndex,
        headerKeyAttr: "data-pontes-br230-key",
        sortKey: app.state.pontesBr230Table.sortKey,
        sortDir: app.state.pontesBr230Table.sortDir,
        columnFilters: app.state.pontesBr230Table?.columnFilters,
        emptyMessage: "Nenhuma feição de pontes BR-230 carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.pontesBr230Features.length,
      });
    }

  app.renderUcEstadualAttributesTable = function renderUcEstadualAttributesTable(highlightIndex) {
      const keys =
        app.state.ucEstadualColumnKeys.length > 0 ? app.state.ucEstadualColumnKeys : app.collectColumnKeysFromFeatures(app.state.ucEstadualFeatures);
      if (!app.state.ucEstadualColumnKeys.length && keys.length) app.state.ucEstadualColumnKeys = keys;
      app.state.ucEstadualSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.ucEstadualFeatures, app.state.ucEstadualTable);
      const res = app.renderGenericAttributesTable({
        tableId: "uc-estadual-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._ucEstadualIndex,
        dataAttr: "data-uc-estadual-index",
        highlightIndex,
        headerKeyAttr: "data-uc-estadual-key",
        sortKey: app.state.ucEstadualTable.sortKey,
        sortDir: app.state.ucEstadualTable.sortDir,
        columnFilters: app.state.ucEstadualTable?.columnFilters,
        emptyMessage: "Nenhuma feição de UC Estadual carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.ucEstadualFeatures.length,
      });
    }

  app.renderUcMunicipalAttributesTable = function renderUcMunicipalAttributesTable(highlightIndex) {
      const keys =
        app.state.ucMunicipalColumnKeys.length > 0 ? app.state.ucMunicipalColumnKeys : app.collectColumnKeysFromFeatures(app.state.ucMunicipalFeatures);
      if (!app.state.ucMunicipalColumnKeys.length && keys.length) app.state.ucMunicipalColumnKeys = keys;
      app.state.ucMunicipalSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.ucMunicipalFeatures, app.state.ucMunicipalTable);
      const res = app.renderGenericAttributesTable({
        tableId: "uc-municipal-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._ucMunicipalIndex,
        dataAttr: "data-uc-municipal-index",
        highlightIndex,
        headerKeyAttr: "data-uc-municipal-key",
        sortKey: app.state.ucMunicipalTable.sortKey,
        sortDir: app.state.ucMunicipalTable.sortDir,
        columnFilters: app.state.ucMunicipalTable?.columnFilters,
        emptyMessage: "Nenhuma feição de UC Municipal carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.ucMunicipalFeatures.length,
      });
    }

  app.renderTiAmAttributesTable = function renderTiAmAttributesTable(highlightIndex) {
      const keys = app.state.tiAmColumnKeys.length > 0 ? app.state.tiAmColumnKeys : app.collectColumnKeysFromFeatures(app.state.tiAmFeatures);
      if (!app.state.tiAmColumnKeys.length && keys.length) app.state.tiAmColumnKeys = keys;
      app.state.tiAmSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.tiAmFeatures, app.state.tiAmTable);
      const res = app.renderGenericAttributesTable({
        tableId: "ti-am-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._tiAmIndex,
        dataAttr: "data-ti-am-index",
        highlightIndex,
        headerKeyAttr: "data-ti-am-key",
        sortKey: app.state.tiAmTable.sortKey,
        sortDir: app.state.tiAmTable.sortDir,
        columnFilters: app.state.tiAmTable?.columnFilters,
        emptyMessage: "Nenhuma feição de TI AM carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.tiAmFeatures.length,
      });
    }

  app.renderHidroviasAmAttributesTable = function renderHidroviasAmAttributesTable(highlightIndex) {
      const keys =
        app.state.hidroviasAmColumnKeys.length > 0
          ? app.state.hidroviasAmColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.hidroviasAmFeatures);
      if (!app.state.hidroviasAmColumnKeys.length && keys.length) app.state.hidroviasAmColumnKeys = keys;
      app.state.hidroviasAmSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.hidroviasAmFeatures, app.state.hidroviasAmTable);
      const res = app.renderGenericAttributesTable({
        tableId: "hidrovias-am-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._hidroviasAmIndex,
        dataAttr: "data-hidrovias-am-index",
        highlightIndex,
        headerKeyAttr: "data-hidrovias-am-key",
        sortKey: app.state.hidroviasAmTable.sortKey,
        sortDir: app.state.hidroviasAmTable.sortDir,
        columnFilters: app.state.hidroviasAmTable?.columnFilters,
        emptyMessage: "Nenhuma feição de Hidrovias AM carregada.",
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.hidroviasAmFeatures.length,
      });
    }

  app.renderMapClickAttributesTable = function renderMapClickAttributesTable(layerId, highlightIndex) {
      const entry = app.state.mapClickTables?.[layerId];
      if (!entry) return;
      const keys =
        entry.columnKeys.length > 0 ? entry.columnKeys : app.collectColumnKeysFromFeatures(entry.features);
      if (!entry.columnKeys.length && keys.length) entry.columnKeys = keys;
      entry.selectedIndex = typeof highlightIndex === "number" ? highlightIndex : entry.selectedIndex;

      // Uma feição: lista compacta campo → valor (mesma ordem/regras do FEATURE_POPUP).
      if (entry.features.length === 1) {
        const feature = entry.features[0];
        const props = feature?.properties || {};
        const kind = entry.selectionKind || String(layerId).slice("map-click:".length);
        const preferred = app.getPreferredKeysByKind(kind) || [];
        const allKeys = Object.keys(props).filter((k) => !app.shouldSkipPopupKey(k));
        const preferredSet = new Set(preferred.map((k) => String(k)));
        const ordered = [
          ...preferred.filter((k) => Object.prototype.hasOwnProperty.call(props, k)),
          ...allKeys
            .filter((k) => !preferredSet.has(k))
            .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })),
        ];
        const rows = ordered
          .map((key) => {
            const value = props[key];
            if (app.FEATURE_POPUP.detail.skipEmpty) {
              if (value === undefined || value === null || String(value).trim() === "") return "";
            }
            const display =
              value === undefined || value === null || String(value).trim() === ""
                ? "—"
                : app.formatAttributeDisplayValue(value, key);
            if (app.FEATURE_POPUP.detail.skipEmpty && !display) return "";
            return `<tr>
              <th scope="row">${app.escHtmlCell(app.normalizeFeatureLabel(key))}</th>
              <td>${app.escHtmlCell(display || "—")}</td>
            </tr>`;
          })
          .filter(Boolean)
          .join("");

        const host = app.$("all-attributes");
        if (host) {
          host.innerHTML = `
            <div class="feature-detail-mini">
              <div class="feature-detail-mini__body">
                <table class="feature-detail-mini__table attributes-table--filled" aria-label="Atributos da feição">
                  <tbody>${rows || `<tr><td colspan="2" class="feature-detail-mini__empty">Sem atributos preenchidos.</td></tr>`}</tbody>
                </table>
              </div>
            </div>`;
        }
        app.updateTablePanelMeta({
          selected: 1,
          visible: 1,
          total: 1,
        });
        return;
      }

      const tableDomId = `map-click-${String(layerId).replace(/[^a-z0-9_-]+/gi, "-")}-attributes-table`;
      const feats = app.getFilteredSortedGenericFeatures(entry.features, entry.table);
      const res = app.renderGenericAttributesTable({
        tableId: tableDomId,
        keys,
        features: feats,
        getIndex: (f) => f?._mapClickIndex,
        dataAttr: "data-map-click-index",
        highlightIndex,
        headerKeyAttr: "data-map-click-key",
        sortKey: entry.table.sortKey,
        sortDir: entry.table.sortDir,
        columnFilters: entry.table?.columnFilters,
        emptyMessage: "Nenhum atributo para esta feição.",
        sourceTotal: entry.features.length,
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: entry.features.length,
      });
    }

  app.renderMunicipiosAttributesTable = function renderMunicipiosAttributesTable(highlightIndex) {
      const keys =
        app.state.municipiosColumnKeys.length > 0
          ? app.state.municipiosColumnKeys
          : app.collectColumnKeysFromFeatures(app.state.municipiosFeatures);
      if (!app.state.municipiosColumnKeys.length && keys.length) app.state.municipiosColumnKeys = keys;
      app.state.municipiosSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.municipiosFeatures, app.state.municipiosTable);
      const res = app.renderGenericAttributesTable({
        tableId: "municipios-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._municipioIndex,
        dataAttr: "data-municipio-index",
        highlightIndex,
        headerKeyAttr: "data-municipio-key",
        sortKey: app.state.municipiosTable.sortKey,
        sortDir: app.state.municipiosTable.sortDir,
        columnFilters: app.state.municipiosTable?.columnFilters,
        emptyMessage: "Nenhum município carregado.",
        sourceTotal: app.state.municipiosFeatures.length,
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.municipiosFeatures.length,
      });
    }

  app.renderIp4AttributesTable = function renderIp4AttributesTable(highlightIndex) {
      // IP4: todas as colunas do SHP (sem campos sintéticos do sistema).
      let keys =
        app.state.ip4ColumnKeys.length > 0 ? app.state.ip4ColumnKeys : app.collectAllColumnKeysFromFeatures(app.state.ip4Features);
      keys = (keys || []).filter((k) => !app.isSyntheticAttributeKey(k));
      app.state.ip4ColumnKeys = keys;
      app.state.ip4SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

      const feats = app.getFilteredSortedGenericFeatures(app.state.ip4Features, app.state.ip4Table);
      const res = app.renderGenericAttributesTable({
        tableId: "ip4-attributes-table",
        keys,
        features: feats,
        getIndex: (f) => f?._ip4Index,
        dataAttr: "data-ip4-index",
        highlightIndex,
        headerKeyAttr: "data-ip4-key",
        sortKey: app.state.ip4Table.sortKey,
        sortDir: app.state.ip4Table.sortDir,
        columnFilters: app.state.ip4Table?.columnFilters,
        emptyMessage: "Nenhuma feição de IP4 carregada.",
        sourceTotal: app.state.ip4Features.length,
      });
      app.updateTablePanelMeta({
        selected: typeof highlightIndex === "number" ? 1 : 0,
        visible: res.visible,
        total: app.state.ip4Features.length,
      });
    }

  app.openAttributesTableForLayer = async function openAttributesTableForLayer(layerId, options = {}) {
      if (!layerId) return;
      const fromMapClick = Boolean(options?.fromMapClick);
      if (!fromMapClick) app.clearContractSelectionOnly();
      // Abre a UI imediatamente (sem "delay") e carrega dados em seguida.
      app.state.tableDataset = layerId;
      app.openBottomSheet();
      app.expandBottomSheet();
      app.refreshPanelTableTitle();
      app.syncGeneralFilterPlaceholder();
      app.syncGeneralFilterValue();
      try {
        const host = app.$("all-attributes");
        if (host) {
          host.innerHTML = '<div class="panel-body panel-body--muted">Carregando tabela de atributos…</div>';
        }
        const el = app.$("general-selection-info");
        if (el) el.textContent = "— carregando…";
      } catch {
        // ignore
      }

      // Garante que a tabela tenha dados mesmo com a subcamada desligada
      try {
        if (String(layerId).startsWith("map-click:")) {
          app.rerenderTableForLayerId(layerId);
          app.expandBottomSheet();
          return;
        }
        if (String(layerId).startsWith("br-am:")) {
          const key = String(layerId);
          const id = app.brAmIdFromLayerKey(key);
          if (!id) return;

          if (!app.state.brAmTables) app.state.brAmTables = { byKey: {} };
          if (!app.state.brAmTables.byKey) app.state.brAmTables.byKey = {};
          if (!app.state.brAmTables.byKey[key]) {
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
          const entry = app.state.brAmTables.byKey[key];

          if (!entry.features.length) {
            const r = await fetch(`/layers/${encodeURIComponent(id)}`);
            if (r.ok) {
              const data = await r.json();
              const feats = (data.features || []).map((f, i) => ({ ...f, _brAmId: id, _brAmIndex: i }));
              entry.features = feats;
              entry.columnKeys = [];
            }
          }
          // Render imediato após carregar
          app.renderBrAmAttributesTable(key, entry.selectedIndex ?? null);
          return;
        }
        if (layerId === "bueiros" && !app.state.bueirosFeatures.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/bueiros-br317"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosIndex: i }));
            app.state.bueirosFeatures = feats;
            app.state.bueirosLayersByIndex = app.state.bueirosLayersByIndex || {};
            app.state.bueirosColumnKeys = [];
          }
        }
        if (layerId === "bueiros-br174" && !app.state.bueirosBr174Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/bueiros-br174"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr174Index: i }));
            app.state.bueirosBr174Features = feats;
            app.state.bueirosBr174LayersByIndex = app.state.bueirosBr174LayersByIndex || {};
            app.state.bueirosBr174ColumnKeys = [];
          }
        }
        if (layerId === "pontes" && !app.state.pontesFeatures.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/pontes-br307"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _pontesIndex: i }));
            app.state.pontesFeatures = feats;
            app.state.pontesLayersByIndex = app.state.pontesLayersByIndex || {};
            app.state.pontesColumnKeys = [];
          }
        }
        if (layerId === "jazidas" && !app.state.jazidasFeatures.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/jazidas-br307/jazida-pontos"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _jazidasIndex: i }));
            app.state.jazidasFeatures = feats;
            app.state.jazidasLayersByIndex = app.state.jazidasLayersByIndex || {};
            app.state.jazidasColumnKeys = [];
          }
        }
        if (layerId === "prads-br174" && !app.state.pradsBr174Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/prads-br174"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr174Index: i }));
            app.state.pradsBr174Features = feats;
            app.state.pradsBr174LayersByIndex = app.state.pradsBr174LayersByIndex || {};
            app.state.pradsBr174ColumnKeys = [];
          }
        }
        if (layerId === "pca-prads-br319" && !app.state.pcaPradsBr319Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/pca-prads-br319"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsBr319Index: i }));
            app.state.pcaPradsBr319Features = feats;
            app.state.pcaPradsBr319LayersByIndex = app.state.pcaPradsBr319LayersByIndex || {};
            app.state.pcaPradsBr319ColumnKeys = [];
          }
        }
        if (layerId === "prads-br319" && !app.state.pradsBr319Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/prads-br319"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr319Index: i }));
            app.state.pradsBr319Features = feats;
            app.state.pradsBr319LayersByIndex = app.state.pradsBr319LayersByIndex || {};
            app.state.pradsBr319ColumnKeys = [];
          }
        }
        if (layerId === "pca-prads-cmm-br319" && !app.state.pcaPradsCmmBr319Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/pca-prads-cmm-br319"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsCmmBr319Index: i }));
            app.state.pcaPradsCmmBr319Features = feats;
            app.state.pcaPradsCmmBr319LayersByIndex = app.state.pcaPradsCmmBr319LayersByIndex || {};
            app.state.pcaPradsCmmBr319ColumnKeys = [];
          }
        }
        if (layerId === "bueiros-br230" && !app.state.bueirosBr230Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/bueiros-br230"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr230Index: i }));
            app.state.bueirosBr230Features = feats;
            app.state.bueirosBr230LayersByIndex = app.state.bueirosBr230LayersByIndex || {};
            app.state.bueirosBr230ColumnKeys = [];
          }
        }
        if (layerId === "bueiros-br319" && !app.state.bueirosBr319Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/bueiros-br319"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr319Index: i }));
            app.state.bueirosBr319Features = feats;
            app.state.bueirosBr319LayersByIndex = app.state.bueirosBr319LayersByIndex || {};
            app.state.bueirosBr319ColumnKeys = [];
          }
        }
        if (layerId === "pontes-br319" && !app.state.pontesBr319Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/pontes-br319"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _pontesBr319Index: i }));
            app.state.pontesBr319Features = feats;
            app.state.pontesBr319LayersByIndex = app.state.pontesBr319LayersByIndex || {};
            app.state.pontesBr319ColumnKeys = [];
          }
        }
        if (layerId === "pontes-br230" && !app.state.pontesBr230Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/pontes-br230"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _pontesBr230Index: i }));
            app.state.pontesBr230Features = feats;
            app.state.pontesBr230LayersByIndex = app.state.pontesBr230LayersByIndex || {};
            app.state.pontesBr230ColumnKeys = [];
          }
        }

        if (layerId === "uc-estadual" && !app.state.ucEstadualFeatures.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/uc-estadual"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _ucEstadualIndex: i }));
            app.state.ucEstadualFeatures = feats;
            app.state.ucEstadualLayersByIndex = app.state.ucEstadualLayersByIndex || {};
            app.state.ucEstadualColumnKeys = [];
          }
        }
        if (layerId === "uc-municipal" && !app.state.ucMunicipalFeatures.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/uc-municipal"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _ucMunicipalIndex: i }));
            app.state.ucMunicipalFeatures = feats;
            app.state.ucMunicipalLayersByIndex = app.state.ucMunicipalLayersByIndex || {};
            app.state.ucMunicipalColumnKeys = [];
          }
        }
        if (layerId === "ti-am" && !app.state.tiAmFeatures.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/ti-am"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _tiAmIndex: i }));
            app.state.tiAmFeatures = feats;
            app.state.tiAmLayersByIndex = app.state.tiAmLayersByIndex || {};
            app.state.tiAmColumnKeys = [];
          }
        }
        if (layerId === "hidrovias-am" && !app.state.hidroviasAmFeatures.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/hidrovias-am"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _hidroviasAmIndex: i }));
            app.state.hidroviasAmFeatures = feats;
            app.state.hidroviasAmLayersByIndex = app.state.hidroviasAmLayersByIndex || {};
            app.state.hidroviasAmColumnKeys = [];
          }
        }
        if (layerId === "ip4" && !app.state.ip4Features.length) {
          let __layerData = null;
          try { __layerData = await app.fetchLayerGeoJson("/layers/ip4"); } catch {}
          if (__layerData) {
            const data = __layerData;
            const feats = (data.features || []).map((f, i) => ({ ...f, _ip4Index: i }));
            app.state.ip4Features = feats;
            app.state.ip4LayersByIndex = app.state.ip4LayersByIndex || {};
            app.state.ip4ColumnKeys = [];
          }
        }
        if (layerId === "municipios" && !app.state.municipiosFeatures.length) {
          await app.attachLimiteMunicipalLayerIfNeeded();
        }
      } catch {
        // sem dados: a renderização exibirá mensagem vazia
      }

      app.rerenderTableForLayerId(layerId);
      app.expandBottomSheet();
    }

  app.resetBueirosFeatureStyle = function resetBueirosFeatureStyle(layer) {
      if (!layer?.feature) return;
      app.applyBueirosStyleToLayer(layer);
    }

  app.resetLayerVisualSelection = function resetLayerVisualSelection(layer) {
      if (!layer) return;
      if (app.state.geojsonLayer?.hasLayer?.(layer)) {
        app.state.geojsonLayer.resetStyle(layer);
      } else if (app.state.bueirosLayer?.hasLayer?.(layer)) {
        app.resetBueirosFeatureStyle(layer);
      } else if (app.state.pontesBr307Layer?.hasLayer?.(layer)) {
        app.applyPontesStyleToLayer(layer);
      } else if (app.state.jazidasBr307Layer?.hasLayer?.(layer)) {
        app.applyJazidasStyleToLayer(layer);
      } else if (app.state.pontesBr319Layer?.hasLayer?.(layer)) {
        app.state.pontesBr319Layer.resetStyle(layer);
      } else if (app.state.ucEstadualLayer?.hasLayer?.(layer)) {
        app.applyUcEstadualStyleToLayer(layer);
      } else if (app.state.ucMunicipalLayer?.hasLayer?.(layer)) {
        app.applyUcMunicipalStyleToLayer(layer);
      } else if (app.state.bueirosBr174Layer?.hasLayer?.(layer)) {
        app.state.bueirosBr174Layer.resetStyle(layer);
      } else if (app.state.pradsBr174Layer?.hasLayer?.(layer)) {
        app.state.pradsBr174Layer.resetStyle(layer);
      } else if (app.state.pcaPradsBr319Layer?.hasLayer?.(layer)) {
      } else if (app.state.pradsBr319Layer?.hasLayer?.(layer)) {
        app.state.pcaPradsBr319Layer.resetStyle(layer);
        app.state.pradsBr319Layer.resetStyle(layer);
      } else if (app.state.pcaPradsCmmBr319Layer?.hasLayer?.(layer)) {
        app.state.pcaPradsCmmBr319Layer.resetStyle(layer);
      } else if (app.state.ip4Layer?.hasLayer?.(layer)) {
        app.applyIp4StyleToLayer(layer);
      }
    }

  app.clearCurrentSelection = function clearCurrentSelection() {
      if (app.state.highlightOverlayLayer && app.state.map) {
        try {
          app.state.map.removeLayer(app.state.highlightOverlayLayer);
        } catch {
          // ignore
        }
        app.state.highlightOverlayLayer = null;
      }
      if (app.state.selectedLayer) {
        app.resetLayerVisualSelection(app.state.selectedLayer);
        app.state.selectedLayer = null;
      }
      app.clearSelectedRowHighlight();
      app.clearBueirosRowHighlight();
      app.clearPontesRowHighlight();
      app.clearJazidasRowHighlight();
      app.clearBueirosBr174RowHighlight();
      app.clearPradsBr174RowHighlight();
      app.clearPcaPradsBr319RowHighlight();
      app.clearPradsBr319RowHighlight();
      app.clearPcaPradsCmmBr319RowHighlight();
      app.clearPontesBr319RowHighlight();
      app.clearPontesBr230RowHighlight();
      app.clearUcEstadualRowHighlight();
      app.clearUcMunicipalRowHighlight();
      app.clearTiAmRowHighlight();
      app.clearHidroviasAmRowHighlight();
      app.clearIp4RowHighlight();
      app.hideFeatureQuickMenu(true);
      app.resetPeekSelectionSummary();
      app.state.bueirosTableHoverPinned = false;
      app.state.selectedFeature = null;
      app.state.selectedLayer = null;
      app.state.lastSelectionKind = "segmentos";
      app.state.identify.results = [];
      app.state.identify.activeIndex = 0;
      app.syncBottomZoomButton();
    }

  app.kindFromLayerToggleId = function kindFromLayerToggleId(id) {
      const s = String(id || "");
      if (!s.startsWith("layer-")) return "";
      const rest = s.slice("layer-".length);
      if (rest === "bueiros-br317") return "bueiros";
      if (rest === "pontes-br307") return "pontes";
      if (rest === "jazidas-br307") return "jazidas";
      if (rest === "limite-municipal") return "municipios";
      if (rest === "limite-estadual") return "";
      if (rest.startsWith("br-am-")) return `br-am:${rest.slice("br-am-".length)}`;
      return rest;
    }

  app.clearSelectionForTurnedOffKind = function clearSelectionForTurnedOffKind(kind) {
      const k = String(kind || "");
      if (!k) return;
      const selectedKind = String(app.state.lastSelectionKind || "");
      let belongs = selectedKind === k;
      try {
        const group = app.getLayerGroupByKind(k);
        if (!belongs && group && app.state.selectedLayer) {
          belongs = group === app.state.selectedLayer || Boolean(group.hasLayer?.(app.state.selectedLayer));
        }
      } catch {
        // ignore
      }
      const mapClickId = `map-click:${k}`;
      const sheetForKind =
        app.state.tablePinnedFromMap &&
        (String(app.state.tableDataset || "") === mapClickId ||
          String(app.state.lastMapClickLayerId || "") === mapClickId ||
          String(app.state.tableDataset || "") === k);
      if (belongs || (app.state.highlightOverlayLayer && selectedKind === k) || sheetForKind) {
        app.clearCurrentSelection();
      }
      if (sheetForKind || (belongs && app.state.tablePinnedFromMap)) {
        try {
          app.closeBottomSheet();
        } catch {
          // ignore
        }
      }
    }

  app.applySelectionZoomIfNeeded = function applySelectionZoomIfNeeded(layer, selectionKind, zoomMaxFromPanel, zoomTo) {
      if (!zoomTo || !app.state.map || !layer?.getBounds) return;
      const b = layer.getBounds();
      if (!b?.isValid?.()) return;
      const mapCap = typeof app.state.map.getMaxZoom === "function" ? app.state.map.getMaxZoom() : 22;
      let maxZ;
      const zoomTight =
        selectionKind === "bueiros" ||
        selectionKind === "pontes" ||
        selectionKind === "pontes-br319" ||
        selectionKind === "uc-estadual" ||
        selectionKind === "uc-municipal" ||
        selectionKind === "ip4";
      if (zoomTight || zoomMaxFromPanel) {
        maxZ = mapCap;
      } else {
        maxZ = 14;
      }
      const pad =
        zoomMaxFromPanel || zoomTight ? [20, 20] : [24, 24];
      app.fitMapBoundsWithSheetPadding(b, {
        maxZoom: maxZ,
        padX: pad[0],
        padTop: pad[0],
      });
    }

  app.zoomToFeatureNow = function zoomToFeatureNow(feature, layer, selectionKind, zoomMaxFromPanel) {
      if (!app.state.map) return;
      const mapCap = typeof app.state.map.getMaxZoom === "function" ? app.state.map.getMaxZoom() : 22;
      const maxZ = zoomMaxFromPanel || selectionKind !== "segmentos" ? mapCap : 14;
      const pad = zoomMaxFromPanel || selectionKind !== "segmentos" ? [20, 20] : [24, 24];

      let b = null;
      try {
        if (layer?.getBounds) b = layer.getBounds();
      } catch {
        b = null;
      }
      if (!b?.isValid?.()) {
        try {
          b = L.geoJSON(feature).getBounds?.();
        } catch {
          b = null;
        }
      }
      if (!b?.isValid?.()) return;
      app.fitMapBoundsWithSheetPadding(b, {
        maxZoom: maxZ,
        padX: pad[0],
        padTop: pad[0],
      });
    }

  app.selectFeature = function selectFeature(feature, layer, options = {}) {
      const {
        zoomTo = false,
        selectionKind = "segmentos",
        openActions = false,
        /** Hover leve: evita atualizar tabelas/painéis a cada mouseover */
        lightHover = false,
        /** Zoom o mais próximo possível (útil ao clicar na tabela dentro de Ações) */
        zoomMaxFromPanel = false,
        /** Seleção disparada por clique na tabela (não trocar de aba). */
        fromAttributesTable = false,
        /** Não zera o pin da tabela de bueiros (1.º hover) */
        skipBueirosHoverPinReset = false,
        /** Após processar, fixa a tabela de bueiros até novo clique no mapa */
        fromBueirosHover = false,
        /** Exibe o card rápido de detalhes (somente clique no mapa). */
        showQuickMenu = false,
      } = options;

      if (!skipBueirosHoverPinReset) {
        app.state.bueirosTableHoverPinned = false;
      }

      // Zoom por clique no mapa usa zoomTo=true; cliques na tabela disparam zoom+minimizar ao final.
      if (layer?.getBounds) {
        app.applySelectionZoomIfNeeded(layer, selectionKind, zoomMaxFromPanel, zoomTo);
      } else if (zoomTo) {
        app.zoomToFeatureNow(feature, null, selectionKind, zoomMaxFromPanel);
      }

      if (app.state.highlightOverlayLayer) {
        app.state.map.removeLayer(app.state.highlightOverlayLayer);
        app.state.highlightOverlayLayer = null;
      }

      app.state.selectedFeature = feature || null;
      if (app.state.selectedLayer) {
        app.resetLayerVisualSelection(app.state.selectedLayer);
      }
      app.state.selectedLayer = layer || null;
      app.state.lastSelectionKind = selectionKind || "segmentos";
      app.syncBottomZoomButton();

      const gt = feature?.geometry?.type;
      const lineHighlightStyle = {
        color: "#ffd000",
        weight: 8,
        opacity: 1,
        fillOpacity: 0,
        className: "selected-feature",
      };
      const polyHighlightStyle = {
        color: "#ffd000",
        weight: 5,
        fillColor: "#ffd000",
        fillOpacity: 0.35,
        className: "selected-feature",
      };

      app.state.highlightOverlayLayer = L.geoJSON(feature, {
        interactive: false,
        pointToLayer(_f, latlng) {
          return L.circleMarker(latlng, {
            radius: 14,
            color: "#ffd000",
            weight: 5,
            fillColor: "#ffd000",
            fillOpacity: 0.55,
            className: "selected-feature",
          });
        },
        style(f) {
          const t = f?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") return lineHighlightStyle;
          if (t === "Polygon" || t === "MultiPolygon") return polyHighlightStyle;
          if (t === "Point" || t === "MultiPoint") return {};
          return lineHighlightStyle;
        },
      }).addTo(app.state.map);

      if (app.state.highlightOverlayLayer.bringToFront) app.state.highlightOverlayLayer.bringToFront();
      if (layer?.bringToFront) layer.bringToFront();

      if (lightHover) {
        // Mantém apenas highlight + estado de seleção (sem custo de tabelas/painéis)
        return;
      }

      // Aba "Selecionado" removida — mantém somente a tabela geral.

      // Esses datasets também precisam limpar/ressincronizar seleção de linha.
      app.clearTiAmRowHighlight();
      app.clearHidroviasAmRowHighlight();
      app.clearIp4RowHighlight();

      if (selectionKind === "segmentos") {
        app.state.tableDataset = "segmentos";
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.highlightRowForFeature(feature);
        // Se a tabela estiver aberta, mantém coerência com o dataset atual.
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderAllAttributesTable();
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "bueiros") {
        app.clearSelectedRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "bueiros";
        const hIdx = typeof feature._bueirosIndex === "number" ? feature._bueirosIndex : null;
        app.state.bueirosSelectedIndex = typeof hIdx === "number" ? hIdx : null;

        // Selecionar na tabela SEM abrir a tabela automaticamente.
        // Se o painel inferior já estiver aberto, atualiza a tabela/seleção para manter coerência.
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderBueirosAttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "pontes") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "pontes";
        const hIdx = typeof feature._pontesIndex === "number" ? feature._pontesIndex : null;
        app.state.pontesSelectedIndex = typeof hIdx === "number" ? hIdx : null;

        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderPontesAttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "jazidas") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "jazidas";
        const hIdx = typeof feature._jazidasIndex === "number" ? feature._jazidasIndex : null;
        app.state.jazidasSelectedIndex = typeof hIdx === "number" ? hIdx : null;

        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderJazidasAttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "bueiros-br174") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "bueiros-br174";
        const hIdx = typeof feature._bueirosBr174Index === "number" ? feature._bueirosBr174Index : null;
        app.state.bueirosBr174SelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderBueirosBr174AttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "prads-br174") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "prads-br174";
        const hIdx = typeof feature._pradsBr174Index === "number" ? feature._pradsBr174Index : null;
        app.state.pradsBr174SelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderPradsBr174AttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "pca-prads-br319") {
      } else if (selectionKind === "prads-br319") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "pca-prads-br319";
        const hIdx = typeof feature._pcaPradsBr319Index === "number" ? feature._pcaPradsBr319Index : null;
        app.state.pcaPradsBr319SelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderPcaPradsBr319AttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "pca-prads-cmm-br319") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "pca-prads-cmm-br319";
        const hIdx = typeof feature._pcaPradsCmmBr319Index === "number" ? feature._pcaPradsCmmBr319Index : null;
        app.state.pcaPradsCmmBr319SelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderPcaPradsCmmBr319AttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "pontes-br319") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "pontes-br319";
        const hIdx = typeof feature._pontesBr319Index === "number" ? feature._pontesBr319Index : null;
        app.state.pontesBr319SelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderPontesBr319AttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "uc-estadual") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "uc-estadual";
        const hIdx = typeof feature._ucEstadualIndex === "number" ? feature._ucEstadualIndex : null;
        app.state.ucEstadualSelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderUcEstadualAttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "uc-municipal") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.state.tableDataset = "uc-municipal";
        const hIdx = typeof feature._ucMunicipalIndex === "number" ? feature._ucMunicipalIndex : null;
        app.state.ucMunicipalSelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderUcMunicipalAttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "ti-am") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "ti-am";
        const hIdx = typeof feature._tiAmIndex === "number" ? feature._tiAmIndex : null;
        app.state.tiAmSelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderTiAmAttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "hidrovias-am") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "hidrovias-am";
        const hIdx = typeof feature._hidroviasAmIndex === "number" ? feature._hidroviasAmIndex : null;
        app.state.hidroviasAmSelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderHidroviasAmAttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else if (selectionKind === "ip4") {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.state.tableDataset = "ip4";
        const hIdx = typeof feature._ip4Index === "number" ? feature._ip4Index : null;
        app.state.ip4SelectedIndex = typeof hIdx === "number" ? hIdx : null;
        if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
          app.renderIp4AttributesTable(hIdx);
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
      } else {
        app.clearSelectedRowHighlight();
        app.clearBueirosRowHighlight();
        app.clearBueirosBr174RowHighlight();
        app.clearPontesRowHighlight();
        app.clearJazidasRowHighlight();
        app.clearPradsBr174RowHighlight();
        app.clearPcaPradsBr319RowHighlight();
        app.clearPradsBr319RowHighlight();
        app.clearPcaPradsCmmBr319RowHighlight();
        app.clearPontesBr319RowHighlight();
        app.clearPontesBr230RowHighlight();
        app.clearUcEstadualRowHighlight();
        app.clearUcMunicipalRowHighlight();
        app.clearTiAmRowHighlight();
        app.clearHidroviasAmRowHighlight();
        app.clearIp4RowHighlight();
      }

      if (openActions) app.openBottomSheet();
      if (showQuickMenu) void app.openAttributesTableFromMapClick(selectionKind, feature, layer);

      if (!lightHover) {
        const layerId = app.resolveTableLayerId(selectionKind, feature);
        if (layerId) {
          app.state.tableDataset = layerId;
          app.applyTableSelectionFromFeature(layerId, feature);
          if (app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed")) {
            app.rerenderTableForLayerId(layerId);
            app.refreshPanelTableTitle();
            app.syncGeneralFilterPlaceholder();
            app.syncGeneralFilterValue();
          }
        }
      }

      if (fromBueirosHover) {
        app.state.bueirosTableHoverPinned = true;
      }

      if (fromAttributesTable && app.isBottomSheetVisible()) {
        app.zoomSelectionFromTable(feature, layer, selectionKind);
      }
    }

  app.setupHeaderSortClick = function setupHeaderSortClick() {
      const container = app.$("all-attributes");
      if (!container) return;
      container.addEventListener("click", (event) => {
        if (event.target.closest("input.col-filter, .table-filter-clear, .table-filter-status")) return;
        const thUm = event.target.closest("th.sortable[data-uc-municipal-key]");
        if (thUm) {
          const key = thUm.getAttribute("data-uc-municipal-key");
          if (!key) return;
          if (app.state.ucMunicipalTable.sortKey === key) {
            app.state.ucMunicipalTable.sortDir = app.state.ucMunicipalTable.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.ucMunicipalTable.sortKey = key;
            app.state.ucMunicipalTable.sortDir = "asc";
          }
          app.renderUcMunicipalAttributesTable(app.state.ucMunicipalSelectedIndex);
          return;
        }

        const thIp4 = event.target.closest("th.sortable[data-ip4-key]");
        if (thIp4) {
          const key = thIp4.getAttribute("data-ip4-key");
          if (!key) return;
          if (app.state.ip4Table.sortKey === key) {
            app.state.ip4Table.sortDir = app.state.ip4Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.ip4Table.sortKey = key;
            app.state.ip4Table.sortDir = "asc";
          }
          app.renderIp4AttributesTable(app.state.ip4SelectedIndex);
          return;
        }

        const thContract = event.target.closest("th.sortable[data-contract-results-key]");
        if (thContract) {
          const key = thContract.getAttribute("data-contract-results-key");
          if (!key) return;
          if (app.state.contractResultsTable.sortKey === key) {
            app.state.contractResultsTable.sortDir = app.state.contractResultsTable.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.contractResultsTable.sortKey = key;
            app.state.contractResultsTable.sortDir = "asc";
          }
          app.renderContractResultsAttributesTable(app.state.contractResultsSelectedIndex);
          return;
        }

        const thTi = event.target.closest("th.sortable[data-ti-am-key]");
        if (thTi) {
          const key = thTi.getAttribute("data-ti-am-key");
          if (!key) return;
          if (app.state.tiAmTable.sortKey === key) {
            app.state.tiAmTable.sortDir = app.state.tiAmTable.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.tiAmTable.sortKey = key;
            app.state.tiAmTable.sortDir = "asc";
          }
          app.renderTiAmAttributesTable(app.state.tiAmSelectedIndex);
          return;
        }

        const thUc = event.target.closest("th.sortable[data-uc-estadual-key]");
        if (thUc) {
          const key = thUc.getAttribute("data-uc-estadual-key");
          if (!key) return;
          if (app.state.ucEstadualTable.sortKey === key) {
            app.state.ucEstadualTable.sortDir = app.state.ucEstadualTable.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.ucEstadualTable.sortKey = key;
            app.state.ucEstadualTable.sortDir = "asc";
          }
          app.renderUcEstadualAttributesTable(app.state.ucEstadualSelectedIndex);
          return;
        }


        const thP319 = event.target.closest("th.sortable[data-pontes-br319-key]");
        if (thP319) {
          const key = thP319.getAttribute("data-pontes-br319-key");
          if (!key) return;
          if (app.state.pontesBr319Table.sortKey === key) {
            app.state.pontesBr319Table.sortDir = app.state.pontesBr319Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.pontesBr319Table.sortKey = key;
            app.state.pontesBr319Table.sortDir = "asc";
          }
          app.renderPontesBr319AttributesTable(app.state.pontesBr319SelectedIndex);
          return;
        }

        const thPrads = event.target.closest("th.sortable[data-prads-br174-key]");
        if (thPrads) {
          const key = thPrads.getAttribute("data-prads-br174-key");
          if (!key) return;
          if (app.state.pradsBr174Table.sortKey === key) {
            app.state.pradsBr174Table.sortDir = app.state.pradsBr174Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.pradsBr174Table.sortKey = key;
            app.state.pradsBr174Table.sortDir = "asc";
          }
          app.renderPradsBr174AttributesTable(app.state.pradsBr174SelectedIndex);
          return;
        }

        const thPcaPrads = event.target.closest("th.sortable[data-pca-prads-br319-key]");
        if (thPcaPrads) {
          const key = thPcaPrads.getAttribute("data-pca-prads-br319-key");
          if (!key) return;
          if (app.state.pcaPradsBr319Table.sortKey === key) {
            app.state.pcaPradsBr319Table.sortDir = app.state.pcaPradsBr319Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.pcaPradsBr319Table.sortKey = key;
            app.state.pcaPradsBr319Table.sortDir = "asc";
          }
          app.renderPcaPradsBr319AttributesTable(app.state.pcaPradsBr319SelectedIndex);
          return;
        }
        const thPradsBr319 = event.target.closest("th.sortable[data-prads-br319-key]");
        if (thPradsBr319) {
          const key = thPradsBr319.getAttribute("data-prads-br319-key");
          if (!key) return;
          if (app.state.pradsBr319Table.sortKey === key) {
            app.state.pradsBr319Table.sortDir = app.state.pradsBr319Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.pradsBr319Table.sortKey = key;
            app.state.pradsBr319Table.sortDir = "asc";
          }
          app.renderPradsBr319AttributesTable(app.state.pradsBr319SelectedIndex);
          return;
        }
        const thPcaPradsCmm = event.target.closest("th.sortable[data-pca-prads-cmm-br319-key]");
        if (thPcaPradsCmm) {
          const key = thPcaPradsCmm.getAttribute("data-pca-prads-cmm-br319-key");
          if (!key) return;
          if (app.state.pcaPradsCmmBr319Table.sortKey === key) {
            app.state.pcaPradsCmmBr319Table.sortDir = app.state.pcaPradsCmmBr319Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.pcaPradsCmmBr319Table.sortKey = key;
            app.state.pcaPradsCmmBr319Table.sortDir = "asc";
          }
          app.renderPcaPradsCmmBr319AttributesTable(app.state.pcaPradsCmmBr319SelectedIndex);
          return;
        }

        const thBu174 = event.target.closest("th.sortable[data-bueiros-br174-key]");
        if (thBu174) {
          const key = thBu174.getAttribute("data-bueiros-br174-key");
          if (!key) return;
          if (app.state.bueirosBr174Table.sortKey === key) {
            app.state.bueirosBr174Table.sortDir = app.state.bueirosBr174Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.bueirosBr174Table.sortKey = key;
            app.state.bueirosBr174Table.sortDir = "asc";
          }
          app.renderBueirosBr174AttributesTable(app.state.bueirosBr174SelectedIndex);
          return;
        }

        const thBu230 = event.target.closest("th.sortable[data-bueiros-br230-key]");
        if (thBu230) {
          const key = thBu230.getAttribute("data-bueiros-br230-key");
          if (!key) return;
          if (app.state.bueirosBr230Table.sortKey === key) {
            app.state.bueirosBr230Table.sortDir = app.state.bueirosBr230Table.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.bueirosBr230Table.sortKey = key;
            app.state.bueirosBr230Table.sortDir = "asc";
          }
          app.renderBueirosBr230AttributesTable(app.state.bueirosBr230SelectedIndex);
          return;
        }

        const thJ = event.target.closest("th.sortable[data-jazidas-key]");
        if (thJ) {
          const key = thJ.getAttribute("data-jazidas-key");
          if (!key) return;
          if (app.state.jazidasTable.sortKey === key) {
            app.state.jazidasTable.sortDir = app.state.jazidasTable.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.jazidasTable.sortKey = key;
            app.state.jazidasTable.sortDir = "asc";
          }
          app.renderJazidasAttributesTable(app.state.jazidasSelectedIndex);
          return;
        }

        const thP = event.target.closest("th.sortable[data-pontes-key]");
        if (thP) {
          const key = thP.getAttribute("data-pontes-key");
          if (!key) return;
          if (app.state.pontesTable.sortKey === key) {
            app.state.pontesTable.sortDir = app.state.pontesTable.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.pontesTable.sortKey = key;
            app.state.pontesTable.sortDir = "asc";
          }
          app.renderPontesAttributesTable(app.state.pontesSelectedIndex);
          return;
        }

        const thB = event.target.closest("th.sortable[data-bueiros-key]");
        if (thB) {
          const key = thB.getAttribute("data-bueiros-key");
          if (!key) return;
          if (app.state.bueirosTable.sortKey === key) {
            app.state.bueirosTable.sortDir = app.state.bueirosTable.sortDir === "asc" ? "desc" : "asc";
          } else {
            app.state.bueirosTable.sortKey = key;
            app.state.bueirosTable.sortDir = "asc";
          }
          app.renderBueirosAttributesTable(app.state.bueirosSelectedIndex);
          return;
        }

        const th = event.target.closest("th.sortable[data-key]");
        if (!th) return;
        const key = th.getAttribute("data-key");
        if (!key) return;

        if (app.state.generalTable.sortKey === key) {
          app.state.generalTable.sortDir = app.state.generalTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          app.state.generalTable.sortKey = key;
          app.state.generalTable.sortDir = "asc";
        }

        app.renderAllAttributesTable();

        if (app.state.selectedFeatureIndex !== null) {
          app.highlightRowForFeature(app.state.allFeatures[app.state.selectedFeatureIndex]);
        }
      });
    }

  app.clearCurrentTableFilters = function clearCurrentTableFilters() {
      for (const timer of app.tableFilterDebounceTimers.values()) clearTimeout(timer);
      app.tableFilterDebounceTimers.clear();

      const clearState = (tableState) => {
        if (!tableState) return;
        tableState.filterText = "";
        tableState.columnFilters = {};
      };

      const kind = app.state.tableDataset;
      if (kind === "bueiros") clearState(app.state.bueirosTable);
      else if (kind === "bueiros-br174") clearState(app.state.bueirosBr174Table);
      else if (kind === "bueiros-br230") clearState(app.state.bueirosBr230Table);
      else if (kind === "bueiros-br319") clearState(app.state.bueirosBr319Table);
      else if (kind === "pontes") clearState(app.state.pontesTable);
      else if (kind === "jazidas") clearState(app.state.jazidasTable);
      else if (kind === "prads-br174") clearState(app.state.pradsBr174Table);
      else if (kind === "pca-prads-br319") clearState(app.state.pcaPradsBr319Table);
      else if (kind === "prads-br319") clearState(app.state.pradsBr319Table);
      else if (kind === "pca-prads-cmm-br319") clearState(app.state.pcaPradsCmmBr319Table);
      else if (kind === "pontes-br319") clearState(app.state.pontesBr319Table);
      else if (kind === "uc-estadual") clearState(app.state.ucEstadualTable);
      else if (kind === "uc-municipal") clearState(app.state.ucMunicipalTable);
      else if (kind === "hidrovias-am") clearState(app.state.hidroviasAmTable);
      else if (kind === "ip4") clearState(app.state.ip4Table);
      else if (kind === "municipios") clearState(app.state.municipiosTable);
      else if (kind === "ti-am") clearState(app.state.tiAmTable);
      else if (kind === "contract-results") clearState(app.state.contractResultsTable);
      else if (String(kind || "").startsWith("br-am:")) {
        const entry = app.state.brAmTables?.byKey?.[String(kind)];
        clearState(entry?.table);
      } else {
        clearState(app.state.generalTable);
      }

      if (app.generalFilterInput) app.generalFilterInput.value = "";

      // re-render tabela atual
      if (kind === "bueiros") app.renderBueirosAttributesTable(app.state.bueirosSelectedIndex);
      else if (kind === "bueiros-br174") app.renderBueirosBr174AttributesTable(app.state.bueirosBr174SelectedIndex);
      else if (kind === "bueiros-br230") app.renderBueirosBr230AttributesTable(app.state.bueirosBr230SelectedIndex);
      else if (kind === "bueiros-br319") app.renderBueirosBr319AttributesTable(app.state.bueirosBr319SelectedIndex);
      else if (kind === "pontes") app.renderPontesAttributesTable(app.state.pontesSelectedIndex);
      else if (kind === "jazidas") app.renderJazidasAttributesTable(app.state.jazidasSelectedIndex);
      else if (kind === "prads-br174") app.renderPradsBr174AttributesTable(app.state.pradsBr174SelectedIndex);
      else if (kind === "pca-prads-br319") app.renderPcaPradsBr319AttributesTable(app.state.pcaPradsBr319SelectedIndex);
      else if (kind === "prads-br319") app.renderPradsBr319AttributesTable(app.state.pradsBr319SelectedIndex);
      else if (kind === "pca-prads-cmm-br319") app.renderPcaPradsCmmBr319AttributesTable(app.state.pcaPradsCmmBr319SelectedIndex);
      else if (kind === "pontes-br319") app.renderPontesBr319AttributesTable(app.state.pontesBr319SelectedIndex);
      else if (kind === "uc-estadual") app.renderUcEstadualAttributesTable(app.state.ucEstadualSelectedIndex);
      else if (kind === "uc-municipal") app.renderUcMunicipalAttributesTable(app.state.ucMunicipalSelectedIndex);
      else if (kind === "hidrovias-am") app.renderHidroviasAmAttributesTable(app.state.hidroviasAmSelectedIndex);
      else if (kind === "ip4") app.renderIp4AttributesTable(app.state.ip4SelectedIndex);
      else if (kind === "municipios") app.renderMunicipiosAttributesTable(app.state.municipiosSelectedIndex);
      else if (kind === "ti-am") app.renderTiAmAttributesTable(app.state.tiAmSelectedIndex);
      else if (kind === "contract-results") app.renderContractResultsAttributesTable(app.state.contractResultsSelectedIndex);
      else if (String(kind || "").startsWith("br-am:")) {
        const key = String(kind);
        const entry = app.state.brAmTables?.byKey?.[key];
        app.renderBrAmAttributesTable(key, entry?.selectedIndex ?? null);
      } else {
        app.renderAllAttributesTable();
      }
    }

}
