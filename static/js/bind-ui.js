/* global L */
export function registerBindUi(app) {

  if (app.earlyErrors.length) {
      app.setStatus(`Erro JS: ${app.earlyErrors[0]}`, "error");
    }

  app.bindUi = function bindUi() {
      // Mapa base: botão + painel (hover ou clique em telas sem hover)
      app.mapBasemapBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const next = !app.mapBasemapControl?.classList.contains("is-open");
        if (next) {
          app.mapBasemapControl?.classList.add("is-open");
          app.mapBasemapBtn?.setAttribute("aria-expanded", "true");
        } else {
          app.closeMapBasemapPicker();
        }
      });
      document.addEventListener("click", (e) => {
        if (!app.mapBasemapControl?.classList.contains("is-open")) return;
        const t = e.target;
        if (t?.closest?.("#map-basemap-control")) return;
        app.closeMapBasemapPicker();
      });
      // ESC global é tratado no initMap (evita listeners duplicados).

      // Clique nas linhas da tabela (delegação no container)
      const attrsHost = app.$("all-attributes");

      // Filtro por coluna (inputs no cabeçalho da tabela, um por campo/coluna)
      attrsHost?.addEventListener("input", (event) => {
        const target = event.target;
        const input = target?.closest?.("input.col-filter[data-col-key]");
        if (!input) return;

        const key = input.getAttribute("data-col-key") || "";
        if (!key) return;
        const table = input.closest?.("table");
        const tableId = table?.id || "";
        const value = input.value || "";
        const container = attrsHost;

        const caretStart = typeof input.selectionStart === "number" ? input.selectionStart : null;
        const caretEnd = typeof input.selectionEnd === "number" ? input.selectionEnd : null;

        const tableState = app.getTableStateById(tableId);
        if (!tableState) return;

        const norm = app.normalizeSearchText(value);
        if (!norm) {
          try {
            delete tableState.columnFilters[key];
          } catch {
            // ignore
          }
        } else {
          tableState.columnFilters[key] = value;
        }

        const pending = app.tableFilterDebounceTimers.get(tableId);
        if (pending) clearTimeout(pending);
        app.tableFilterDebounceTimers.delete(tableId);

        app.syncTableFilterChrome(container, {
          loading: false,
          columnFilters: tableState.columnFilters,
        });
        app.rerenderAttributesTableById(tableId);
        app.restoreColumnFilterFocus(tableId, key, caretStart, caretEnd);
      });

      attrsHost?.addEventListener("click", (event) => {
        const target = event.target;
        const kind = app.state.tableDataset;

        const selectRowInTable = (tableSel, row) => {
          if (!row) return;
          document.querySelectorAll(`${tableSel} tbody tr.selected-row`).forEach((r) => r.classList.remove("selected-row"));
          row.classList.add("selected-row");
        };

        const clearBtn = target?.closest?.("button[data-action=\"clear-table-filters\"]");
        if (clearBtn) {
          event.preventDefault();
          event.stopPropagation();
          app.clearCurrentTableFilters();
          return;
        };

        if (kind === "segmentos") {
          const row = target.closest?.("#all-attributes-table tbody tr[data-feature-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-feature-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.allFeatures[idx];
          const layer = app.state.layersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#all-attributes-table", row);
          app.state.selectedFeatureIndex = idx;
          app.state.suppressAutoFit = true;
          Promise.resolve(app.applyOnlyRodoviasSublayer("segmentos")).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, { zoomTo: false, zoomMaxFromPanel: true, fromAttributesTable: true });
          return;
        }

        if (kind === "bueiros") {
          const row = target.closest?.("#bueiros-attributes-table tbody tr[data-bueiros-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-bueiros-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.bueirosFeatures[idx];
          const layer = app.state.bueirosLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#bueiros-attributes-table", row);
          app.state.bueirosSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          Promise.resolve(app.applyOnlyRodoviasSublayer("bueiros")).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "bueiros",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "pontes") {
          const row = target.closest?.("#pontes-attributes-table tbody tr[data-pontes-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-pontes-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.pontesFeatures[idx];
          const layer = app.state.pontesLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#pontes-attributes-table", row);
          app.state.pontesSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          Promise.resolve(app.applyOnlyRodoviasSublayer("pontes")).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "pontes",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "jazidas") {
          const row = target.closest?.("#jazidas-attributes-table tbody tr[data-jazidas-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-jazidas-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.jazidasFeatures[idx];
          const layer = app.state.jazidasLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#jazidas-attributes-table", row);
          app.state.jazidasSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          Promise.resolve(app.applyOnlyRodoviasSublayer("jazidas")).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "jazidas",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (String(kind || "").startsWith("br-am:")) {
          const row = target.closest?.("table.attributes-table tbody tr[data-br-am-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-br-am-index"), 10);
          if (Number.isNaN(idx)) return;
          const key = String(kind);
          const entry = app.state.brAmTables?.byKey?.[key];
          if (!entry) return;
          const feature = entry.features?.[idx];
          if (!feature) return;
          const id = app.brAmIdFromLayerKey(key);
          const name = entry.name || app.getBrAmNameById(id) || "";

          event.stopPropagation();
          // o tableId é dinâmico; usamos seletor amplo pela tabela atual
          selectRowInTable("table.attributes-table", row);
          entry.selectedIndex = idx;

          // Se a camada ainda não estiver ligada, liga automaticamente para "aparecer no mapa"
          const wantsLayerOn = !app.state.brAm?.layersById?.[id];
          const onMapPromise = wantsLayerOn ? app.ensureBrAmLayerOnMap(id, name) : Promise.resolve(app.state.brAm.layersById[id]);

          Promise.resolve(onMapPromise)
            .then(() => {
              // highlight + zoom sem trocar dataset/tabela
              const leafletLayer = entry.layersByIndex?.[idx] || null;
              app.selectFeature(feature, leafletLayer, {
                zoomTo: true,
                selectionKind: key,
                zoomMaxFromPanel: true,
                fromAttributesTable: true,
                lightHover: true,
              });
            })
            .catch((e) => {
              app.setStatus(String(e?.message || e || "Falha ao exibir feição BR-AM no mapa"), "error");
            });
          return;
        }

        if (kind === "contract-results") {
          const row = target.closest?.("#contract-results-attributes-table tbody tr[data-contract-results-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-contract-results-index"), 10);
          if (Number.isNaN(idx)) return;
          const hit = app.state.contractResultsFeatures?.[idx];
          if (!hit) return;

          event.stopPropagation();
          selectRowInTable("#contract-results-attributes-table", row);
          app.state.contractResultsSelectedIndex = idx;
          try {
            const visibleNow = document.querySelectorAll("#contract-results-attributes-table tbody tr").length;
            app.updateTablePanelMeta({
              selected: 1,
              visible: visibleNow,
              total: app.state.contractResultsFeatures.length,
            });
          } catch {
            // ignore
          }

          const kind0 = String(hit._contractResultsKind || "");
          const origIndex = typeof hit._contractResultsOrigIndex === "number" ? hit._contractResultsOrigIndex : -1;
          const label = String(hit?.properties?.Camada || hit?.properties?.camada || "");

          const ensureKindOnMap = async () => {
            const ensureAndPick = async (toggleEl, ensureFn, getFeat, getLayer) => {
              try {
                if (toggleEl) toggleEl.checked = true;
              } catch {
                // ignore
              }
              await Promise.resolve(ensureFn?.());
              const f = getFeat?.();
              const lyr = getLayer?.();
              return { feature: f, layer: lyr };
            };

            if (kind0 === "ip4") {
              return await ensureAndPick(
                layerIp4Toggle,
                ensureIp4OnMap,
                () => app.state.ip4Features?.[origIndex],
                () => app.state.ip4LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "bueiros") {
              return await ensureAndPick(
                layerBueirosToggle,
                ensureBueirosBr317OnMap,
                () => app.state.bueirosFeatures?.[origIndex],
                () => app.state.bueirosLayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "pontes") {
              return await ensureAndPick(
                layerPontesToggle,
                ensurePontesBr307OnMap,
                () => app.state.pontesFeatures?.[origIndex],
                () => app.state.pontesLayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "jazidas") {
              return await ensureAndPick(
                layerJazidasToggle,
                ensureJazidasBr307OnMap,
                () => app.state.jazidasFeatures?.[origIndex],
                () => app.state.jazidasLayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "pontes-br319") {
              return await ensureAndPick(
                layerPontesBr319Toggle,
                ensurePontesBr319OnMap,
                () => app.state.pontesBr319Features?.[origIndex],
                () => app.state.pontesBr319LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "bueiros-br319") {
              return await ensureAndPick(
                layerBueirosBr319Toggle,
                ensureBueirosBr319OnMap,
                () => app.state.bueirosBr319Features?.[origIndex],
                () => app.state.bueirosBr319LayersByIndex?.[origIndex]
              );
            }

            if (kind0 === "uc-estadual") {
              return await ensureAndPick(
                layerUcEstadualToggle,
                ensureUcEstadualOnMap,
                () => app.state.ucEstadualFeatures?.[origIndex],
                () => app.state.ucEstadualLayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "uc-municipal") {
              return await ensureAndPick(
                layerUcMunicipalToggle,
                ensureUcMunicipalOnMap,
                () => app.state.ucMunicipalFeatures?.[origIndex],
                () => app.state.ucMunicipalLayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "bueiros-br174") {
              return await ensureAndPick(
                layerBueirosBr174Toggle,
                ensureBueirosBr174OnMap,
                () => app.state.bueirosBr174Features?.[origIndex],
                () => app.state.bueirosBr174LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "prads-br174") {
              return await ensureAndPick(
                layerPradsBr174Toggle,
                ensurePradsBr174OnMap,
                () => app.state.pradsBr174Features?.[origIndex],
                () => app.state.pradsBr174LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "pca-prads-br319") {
              return await ensureAndPick(
                layerPcaPradsBr319Toggle,
                ensurePcaPradsBr319OnMap,
                () => app.state.pcaPradsBr319Features?.[origIndex],
                () => app.state.pcaPradsBr319LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "prads-br319") {
              return await ensureAndPick(
                layerPradsBr319Toggle,
                ensurePradsBr319OnMap,
                () => app.state.pradsBr319Features?.[origIndex],
                () => app.state.pradsBr319LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "pca-prads-cmm-br319") {
              return await ensureAndPick(
                layerPcaPradsCmmBr319Toggle,
                ensurePcaPradsCmmBr319OnMap,
                () => app.state.pcaPradsCmmBr319Features?.[origIndex],
                () => app.state.pcaPradsCmmBr319LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "bueiros-br230") {
              return await ensureAndPick(
                layerBueirosBr230Toggle,
                ensureBueirosBr230OnMap,
                () => app.state.bueirosBr230Features?.[origIndex],
                () => app.state.bueirosBr230LayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "ti-am") {
              return await ensureAndPick(
                layerTiAmToggle,
                ensureTiAmOnMap,
                () => app.state.tiAmFeatures?.[origIndex],
                () => app.state.tiAmLayersByIndex?.[origIndex]
              );
            }
            if (kind0 === "hidrovias-am") {
              return await ensureAndPick(
                layerHidroviasAmToggle,
                ensureHidroviasAmOnMap,
                () => app.state.hidroviasAmFeatures?.[origIndex],
                () => app.state.hidroviasAmLayersByIndex?.[origIndex]
              );
            }

            const src = (app.state.extraContractSources || []).find((s) => s?.label === label);
            if (src?.features?.length) {
              app.buildExtraContractLayerOnMap(src);
              return { feature: src.features?.[origIndex], layer: null };
            }
            return { feature: null, layer: null };
          };

          Promise.resolve(ensureKindOnMap())
            .then(({ feature, layer }) => {
              if (!feature) {
                app.setStatus("Não foi possível localizar a feição original para este resultado.", "error");
                return;
              }
              // IMPORTANT: em "resultado do contrato", o usuário quer manter a tabela visível.
              // Então destacamos/zoom no mapa sem trocar dataset/tabela do painel.
              app.selectFeature(feature, layer, {
                zoomTo: true,
                selectionKind: kind0 || "segmentos",
                zoomMaxFromPanel: true,
                fromAttributesTable: true,
                lightHover: true,
              });
            })
            .catch((e) => {
              app.setStatus(String(e?.message || e || "Falha ao exibir feição no mapa"), "error");
            });
          return;
        }
        if (kind === "bueiros-br174") {
          const row = target.closest?.("#bueiros-br174-attributes-table tbody tr[data-bueiros-br174-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-bueiros-br174-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.bueirosBr174Features[idx];
          const layer = app.state.bueirosBr174LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#bueiros-br174-attributes-table", row);
          app.state.bueirosBr174SelectedIndex = idx;
          // Não liga/mostra camada automaticamente ao clicar na tabela.
          if (!layerBueirosBr174Toggle?.checked) {
            app.setStatus("Bueiros BR-174: ligue a camada para ver no mapa.", "info");
            return;
          }
          app.selectFeature(feature, layer, { zoomTo: false, selectionKind: "bueiros-br174", zoomMaxFromPanel: true, fromAttributesTable: true });
          return;
        }

        if (kind === "bueiros-br319") {
          const row = target.closest?.("#bueiros-br319-attributes-table tbody tr[data-bueiros-br319-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-bueiros-br319-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.bueirosBr319Features[idx];
          const layer = app.state.bueirosBr319LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#bueiros-br319-attributes-table", row);
          app.state.bueirosBr319SelectedIndex = idx;
          // Não liga/mostra camada automaticamente ao clicar na tabela.
          if (!layerBueirosBr319Toggle?.checked) {
            app.setStatus("Bueiros BR-319: ligue a camada para ver no mapa.", "info");
            return;
          }
          app.selectFeature(feature, layer, { zoomTo: false, selectionKind: "bueiros-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
          return;
        }

        if (kind === "bueiros-br230") {
          const row = target.closest?.("#bueiros-br230-attributes-table tbody tr[data-bueiros-br230-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-bueiros-br230-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.bueirosBr230Features[idx];
          const layer = app.state.bueirosBr230LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#bueiros-br230-attributes-table", row);
          app.state.bueirosBr230SelectedIndex = idx;
          // Não liga/mostra camada automaticamente ao clicar na tabela.
          if (!layerBueirosBr230Toggle?.checked) {
            app.setStatus("Bueiros BR-230: ligue a camada para ver no mapa.", "info");
            return;
          }
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "bueiros-br230",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "prads-br174") {
          const row = target.closest?.("#prads-br174-attributes-table tbody tr[data-prads-br174-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-prads-br174-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.pradsBr174Features[idx];
          const layer = app.state.pradsBr174LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#prads-br174-attributes-table", row);
          app.state.pradsBr174SelectedIndex = idx;
          // Não liga/mostra camada automaticamente ao clicar na tabela.
          if (!layerPradsBr174Toggle?.checked) {
            app.setStatus("PRADS BR-174: ligue a camada para ver no mapa.", "info");
            return;
          }
          app.selectFeature(feature, layer, { zoomTo: false, selectionKind: "prads-br174", zoomMaxFromPanel: true, fromAttributesTable: true });
          return;
        }


        if (kind === "pca-prads-br319") {
          const row = target.closest?.("#pca-prads-br319-attributes-table tbody tr[data-pca-prads-br319-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-pca-prads-br319-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.pcaPradsBr319Features[idx];
          const layer = app.state.pcaPradsBr319LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#pca-prads-br319-attributes-table", row);
          app.state.pcaPradsBr319SelectedIndex = idx;
          if (!layerPcaPradsBr319Toggle?.checked) {
            app.setStatus("PCA - PRADS BR-319: ligue a camada para ver no mapa.", "info");
            return;
          }
          app.selectFeature(feature, layer, { zoomTo: false, selectionKind: "pca-prads-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
          return;
        }
        if (kind === "prads-br319") {
          const row = target.closest?.("#prads-br319-attributes-table tbody tr[data-prads-br319-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-prads-br319-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.pradsBr319Features[idx];
          const layer = app.state.pradsBr319LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#prads-br319-attributes-table", row);
          app.state.pradsBr319SelectedIndex = idx;
          if (!layerPradsBr319Toggle?.checked) {
            app.setStatus("PRADS BR-319: ligue a camada para ver no mapa.", "info");
            return;
          }
          app.selectFeature(feature, layer, { zoomTo: false, selectionKind: "prads-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
          return;
        }
        if (kind === "pca-prads-cmm-br319") {
          const row = target.closest?.("#pca-prads-cmm-br319-attributes-table tbody tr[data-pca-prads-cmm-br319-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-pca-prads-cmm-br319-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.pcaPradsCmmBr319Features[idx];
          const layer = app.state.pcaPradsCmmBr319LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#pca-prads-cmm-br319-attributes-table", row);
          app.state.pcaPradsCmmBr319SelectedIndex = idx;
          if (!layerPcaPradsCmmBr319Toggle?.checked) {
            app.setStatus("PCA - PRADS CMM BR-319: ligue a camada para ver no mapa.", "info");
            return;
          }
          app.selectFeature(feature, layer, { zoomTo: false, selectionKind: "pca-prads-cmm-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
          return;
        }


        if (kind === "pontes-br319") {
          const row = target.closest?.("#pontes-br319-attributes-table tbody tr[data-pontes-br319-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-pontes-br319-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.pontesBr319Features[idx];
          const layer = app.state.pontesBr319LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#pontes-br319-attributes-table", row);
          app.state.pontesBr319SelectedIndex = idx;
          app.state.suppressAutoFit = true;
          if (layerPontesBr319Toggle) layerPontesBr319Toggle.checked = true;
          Promise.resolve(ensurePontesBr319OnMap()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "pontes-br319",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "pontes-br230") {
          const row = target.closest?.("#pontes-br230-attributes-table tbody tr[data-pontes-br230-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-pontes-br230-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.pontesBr230Features[idx];
          const layer = app.state.pontesBr230LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#pontes-br230-attributes-table", row);
          app.state.pontesBr230SelectedIndex = idx;
          app.state.suppressAutoFit = true;
          if (app.layerPontesBr230Toggle) app.layerPontesBr230Toggle.checked = true;
          Promise.resolve(app.ensurePontesBr230OnMap()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "pontes-br230",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }


        if (kind === "uc-estadual") {
          const row = target.closest?.("#uc-estadual-attributes-table tbody tr[data-uc-estadual-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-uc-estadual-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.ucEstadualFeatures[idx];
          const layer = app.state.ucEstadualLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#uc-estadual-attributes-table", row);
          app.state.ucEstadualSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          if (layerUcEstadualToggle) layerUcEstadualToggle.checked = true;
          Promise.resolve(ensureUcEstadualOnMap()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "uc-estadual",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "uc-municipal") {
          const row = target.closest?.("#uc-municipal-attributes-table tbody tr[data-uc-municipal-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-uc-municipal-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.ucMunicipalFeatures[idx];
          const layer = app.state.ucMunicipalLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#uc-municipal-attributes-table", row);
          app.state.ucMunicipalSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          if (layerUcMunicipalToggle) layerUcMunicipalToggle.checked = true;
          Promise.resolve(ensureUcMunicipalOnMap()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "uc-municipal",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "ti-am") {
          const row = target.closest?.("#ti-am-attributes-table tbody tr[data-ti-am-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-ti-am-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.tiAmFeatures[idx];
          const layer = app.state.tiAmLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#ti-am-attributes-table", row);
          app.state.tiAmSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          if (layerTiAmToggle) layerTiAmToggle.checked = true;
          Promise.resolve(ensureTiAmOnMap()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "ti-am",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "hidrovias-am") {
          const row = target.closest?.("#hidrovias-am-attributes-table tbody tr[data-hidrovias-am-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-hidrovias-am-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.hidroviasAmFeatures[idx];
          const layer = app.state.hidroviasAmLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#hidrovias-am-attributes-table", row);
          app.state.hidroviasAmSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          if (layerHidroviasAmToggle) layerHidroviasAmToggle.checked = true;
          Promise.resolve(ensureHidroviasAmOnMap()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "hidrovias-am",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "municipios") {
          const row = target.closest?.("#municipios-attributes-table tbody tr[data-municipio-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-municipio-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.municipiosFeatures[idx];
          const layer = app.state.municipiosLayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#municipios-attributes-table", row);
          app.state.municipiosSelectedIndex = idx;
          app.state.suppressAutoFit = true;
          Promise.resolve(app.attachLimiteMunicipalLayerIfNeeded()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "municipios",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }

        if (kind === "ip4") {
          const row = target.closest?.("#ip4-attributes-table tbody tr[data-ip4-index]");
          if (!row) return;
          const idx = parseInt(row.getAttribute("data-ip4-index"), 10);
          if (Number.isNaN(idx)) return;
          const feature = app.state.ip4Features[idx];
          const layer = app.state.ip4LayersByIndex[idx];
          if (!feature) return;
          event.stopPropagation();
          selectRowInTable("#ip4-attributes-table", row);
          app.state.ip4SelectedIndex = idx;
          // Ao clicar na linha, foca o SHP de origem (mostra apenas esse __source no mapa).
          // Clique repetido no mesmo SHP alterna (remove foco).
          try {
            const src = String(feature?.properties?.__source || feature?.properties?._source || "");
            if (src) {
              const prev = app.normalizeSearchText(app.state.ip4FocusSource || "");
              const next = app.normalizeSearchText(src);
              app.state.ip4FocusSource = prev && prev === next ? "" : src;
            }
          } catch {
            // ignore
          }
          app.state.suppressAutoFit = true;
          if (layerIp4Toggle) layerIp4Toggle.checked = true;
          Promise.resolve(ensureIp4OnMap()).finally(() => {
            app.state.suppressAutoFit = false;
          });
          // Reaplica filtros (contrato + foco IP4)
          app.applyContractFilterToMap();
          app.selectFeature(feature, layer, {
            zoomTo: false,
            selectionKind: "ip4",
            zoomMaxFromPanel: true,
            fromAttributesTable: true,
          });
          return;
        }
      });

      // Importante: tabelas não devem dar zoom no mapa (clique/duplo clique).

      // Clique fora do mapa e fora da sidebar/camadas: desfaz seleção atual.
      // Importante: não fecha a tabela ao explorar/arrastar o mapa. Ela fecha somente no botão "Fechar".
      document.addEventListener("click", (e) => {
        const target = e.target;
        const inMapArea = Boolean(target?.closest?.(".map-wrap"));
        const inSidebar = Boolean(target?.closest?.(".sidebar"));
        const inBottomSheet = Boolean(target?.closest?.("#bottom-sheet"));
        if (inMapArea || inSidebar || inBottomSheet) return;
        app.clearCurrentSelection();
      });

      app.featureQuickCloseBtn?.addEventListener("click", () => {
        app.hideFeatureQuickMenu(true);
      });

      app.featureQuickMenuEl?.addEventListener("click", (event) => {
        const target = event.target;
        const btn = target?.closest?.("button[data-identify-idx]");
        if (!btn) return;
        const idx = parseInt(btn.getAttribute("data-identify-idx"), 10);
        if (Number.isNaN(idx)) return;
        const results = app.state.identify?.results || [];
        const hit = results[idx];
        if (!hit?.feature) return;
        event.preventDefault();
        event.stopPropagation();
        app.state.identify.activeIndex = idx;
        app.handleMapFeatureClick(event, hit.feature, hit.layer, hit.selectionKind, {
          zoomTo: false,
          identifyResults: results,
          activeIndex: idx,
        });
        if (app.state.featureQuickMenuPinned) {
          app.renderIdentifyQuickMenu(results, idx, { minimal: true });
          requestAnimationFrame(() => {
            app.positionFeatureQuickMenuAvoidingRect(app.getAvoidRectForLayer(hit.layer, hit.feature, event));
          });
        }
      });

      app.bottomSheetClose?.addEventListener("click", () => app.closeBottomSheet());
      app.bottomSheetRestore?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        app.expandBottomSheet();
      });
      app.bottomSheet?.querySelector(".bottom-sheet-head")?.addEventListener("click", (e) => {
        if (!app.bottomSheet?.classList.contains("is-peek")) return;
        if (e.target.closest(".bottom-sheet-actions")) return;
        app.expandBottomSheet();
      });
      app.$("bottom-sheet-peek-main")?.addEventListener("click", (e) => {
        if (!app.bottomSheet?.classList.contains("is-peek")) return;
        e.preventDefault();
        app.expandBottomSheet();
      });
      app.bottomZoomSelected?.addEventListener("click", () => {
        if (!app.state.map || !app.state.selectedFeature) return;
        app.zoomSelectionFromTable(app.state.selectedFeature, app.state.selectedLayer, app.state.lastSelectionKind || "segmentos");
      });

      // Mobile/tablet: drawer de camadas (mapa em tela cheia).
      let wasMobileLayout = app.isMobileLayoutActive();
      const syncMobileSidebarDefault = () => {
        const mobile = app.isMobileLayoutActive();
        document.body.classList.toggle("is-mobile-layout", mobile);
        if (!mobile) {
          app.setMobileSidebarCollapsed(false);
          app.syncMobileSidebarChrome(false);
          return;
        }
        // Default: recolhida no mobile para priorizar o mapa.
        app.setMobileSidebarCollapsed(true);
      };
      syncMobileSidebarDefault();
      window.addEventListener("resize", () => {
        const mobile = app.isMobileLayoutActive();
        if (mobile !== wasMobileLayout) {
          wasMobileLayout = mobile;
          syncMobileSidebarDefault();
        }
        if (typeof app.invalidateMapSoon === "function") app.invalidateMapSoon();
        else {
          try {
            app.state.map?.invalidateSize?.({ animate: false });
          } catch {
            // ignore
          }
        }
      });
      window.addEventListener("orientationchange", () => {
        setTimeout(() => {
          wasMobileLayout = app.isMobileLayoutActive();
          syncMobileSidebarDefault();
          if (typeof app.invalidateMapSoon === "function") app.invalidateMapSoon();
        }, 180);
      });
      try {
        if (window.visualViewport && typeof app.invalidateMapSoon === "function") {
          window.visualViewport.addEventListener("resize", () => app.invalidateMapSoon());
          window.visualViewport.addEventListener("scroll", () => app.invalidateMapSoon());
        }
      } catch {
        // ignore
      }
      app.mobileSidebarToggleBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!app.isMobileLayoutActive()) return;
        const collapsed = document.body.classList.contains("mobile-sidebar-collapsed");
        app.setMobileSidebarCollapsed(!collapsed);
      });
      app.mobileSidebarBackdrop?.addEventListener("click", (e) => {
        e.preventDefault();
        app.closeMobileSidebarIfNeeded();
      });
      app.$("sidebar")?.addEventListener(
        "change",
        (e) => {
          const t = e.target;
          if (!(t instanceof HTMLInputElement)) return;
          if (t.type !== "checkbox") return;
          if (!app.isMobileLayoutActive()) return;
          setTimeout(() => app.closeMobileSidebarIfNeeded(), 220);
        },
        { passive: true }
      );
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (!app.isMobileLayoutActive()) return;
        if (document.body.classList.contains("mobile-sidebar-collapsed")) return;
        app.closeMobileSidebarIfNeeded();
      });

      app.themeToggleBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        app.setThemePreference(app.state.theme === "night" ? "light" : "night");
      });
      // Botão de zoom removido (tabelas nunca dão zoom).

      // Filtro removido do painel inferior.

      document.querySelector(".global-search")?.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        if (e.target?.id !== "global-search-input") return;
        e.preventDefault();
        void app.searchAndZoom(app.globalSearchInput?.value);
      });
      // Botão "Limpar" substituído por feedback de busca.
      const reopenLastResults = () => {
        // Se estiver aberto, fecha
        if (app.globalSearchResultsEl && !app.globalSearchResultsEl.hidden) {
          app.closeGlobalSearchResults();
          return;
        }
        // Se temos resultados anteriores, reabre imediatamente
        const last = app.state.globalSearch.lastResults || [];
        if (last.length) {
          app.state.globalSearch.results = last;
          app.state.globalSearch.activeIndex = 0;
          app.renderGlobalSearchResults(last);
          app.setStatus(`Pesquisa: ${last.length} resultados — escolha um`, "info");
          return;
        }
        // Se não há resultados guardados, mas há a última consulta, reexecuta
        const q = String(app.state.globalSearch.lastQuery || "").trim();
        if (q) void app.searchAndZoom(q);
      };
      app.globalSearchFeedback?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        reopenLastResults();
      });
      app.globalSearchFeedback?.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        reopenLastResults();
      });
      app.globalSearchFilterBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!app.globalSearchFilterEl) return;
        // O popup de filtros só fecha clicando fora (não fecha por toggle no botão).
        if (app.globalSearchFilterEl.hidden) app.openGlobalSearchFilter();
      });
      app.globalSearchFilterEl?.addEventListener("click", (e) => {
        // Não deixar o clique "vazar" para o handler global (clique fora),
        // senão o popup fecha ao clicar nas opções.
        try {
          e.stopPropagation();
        } catch {
          // ignore
        }
        const t = e.target;
        const btn = t?.closest?.("button[data-action]");
        if (btn) {
          const action = btn.getAttribute("data-action");
          if (action === "all") {
            app.state.globalSearch.defaultsInitialized = true;
            for (const d of app.getSearchKindDefs()) {
              app.state.globalSearch.enabledKinds.add(d.id);
            }
            app.openGlobalSearchFilter();
            return;
          }
          if (action === "clear") {
            // Mesmo efeito de "Desmarcar": limpa todos os filtros e desliga camadas no mapa.
            app.state.globalSearch.defaultsInitialized = true;
            app.state.globalSearch.enabledKinds.clear();
            app.clearMunicipioFilterOnly();
            try {
              app.clearContractSelectionOnly();
            } catch {
              // ignore
            }
            app.openGlobalSearchFilter();
            try {
              app.setStatus("Filtro: desligando camadas no mapa…", "info");
              for (const def of app.getSearchKindDefs()) {
                const kind = def?.id;
                if (!kind) continue;
                if (kind === "contratos") continue;
                app.setToggleChecked(kind, false);
                app.disableKindOnMap(kind);
              }
              app.setStatus("Filtro: camadas desligadas", "ok");
            } catch {
              // ignore
            }
            return;
          }
          if (action === "none") {
            app.state.globalSearch.defaultsInitialized = true;
            app.state.globalSearch.enabledKinds.clear();
            app.clearMunicipioFilterOnly();
            try {
              app.clearContractSelectionOnly();
            } catch {
              // ignore
            }
            app.openGlobalSearchFilter();
            try {
              app.setStatus("Filtro: desligando camadas no mapa…", "info");
              for (const def of app.getSearchKindDefs()) {
                const kind = def?.id;
                if (!kind) continue;
                if (kind === "contratos") continue;
                app.setToggleChecked(kind, false);
                app.disableKindOnMap(kind);
              }
              app.setStatus("Filtro: camadas desligadas", "ok");
            } catch {
              // ignore
            }
            return;
          }
          if (action === "apply") {
            app.state.globalSearch.defaultsInitialized = true;
            // Reconstrói enabledKinds a partir dos checkboxes marcados.
            app.state.globalSearch.enabledKinds.clear();
            try {
              const cbs = Array.from(
                document.querySelectorAll('#global-search-filter input[type="checkbox"][data-kind]'),
              );
              const selected = new Set();
              cbs.forEach((cb) => {
                const kind = cb.getAttribute("data-kind");
                if (!kind) return;
                if (cb.checked) selected.add(kind);
              });

              // Mantém somente as camadas selecionadas (no mapa).
              app.setStatus("Filtro: aplicando camadas no mapa…", "info");
              const ensureTasks = [];
              for (const def of app.getSearchKindDefs()) {
                const kind = def?.id;
                if (!kind) continue;
                const wantOn = selected.has(kind);
                app.setStatus(`Filtro: ${app.getSearchKindLabel(kind)} — ${wantOn ? "ligando" : "desligando"}…`, "info");
                if (kind === "contratos") {
                  if (!wantOn) app.disableKindOnMap("contratos");
                  else ensureTasks.push(Promise.resolve(ensureKindOnMap("contratos")));
                  continue;
                }
                if (kind === "municipios") {
                  if (wantOn) {
                    ensureTasks.push(Promise.resolve(app.ensureMunicipiosFilterListLoaded()));
                  } else {
                    app.clearMunicipioFilterOnly();
                    app.setMunicipiosOnMap(false);
                  }
                  continue;
                }
                app.setToggleChecked(kind, wantOn);
                if (wantOn) {
                  ensureTasks.push(Promise.resolve(ensureKindOnMap(kind)));
                } else {
                  app.disableKindOnMap(kind);
                }
              }

              // Atualiza conjunto ativo para a busca
              app.state.globalSearch.enabledKinds = selected;
              Promise.allSettled(ensureTasks).finally(() => {
                // Ir direto para a(s) camada(s) filtrada(s)
                try {
                  const kinds = Array.from(selected).filter((k) => k && k !== "contratos" && k !== "municipios");
                  let bounds = null;
                  for (const k of kinds) {
                    const group = app.getLayerGroupByKind(k);
                    const b = group?.getBounds?.();
                    if (!b?.isValid?.()) continue;
                    bounds = bounds ? bounds.extend(b) : b;
                  }
                  if (app.state.map && bounds?.isValid?.() && !app.normalizeSearchText(app.state.municipioFilter || "")) {
                    app.state.map.fitBounds(bounds, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
                  }
                } catch {
                  // ignore
                }
                app.setStatus("Filtro: camadas aplicadas no mapa", "ok");
                // Ao aplicar, fecha o popup (ele fecha somente aqui, fora e ESC)
                try {
                  app.closeGlobalSearchFilter();
                } catch {
                  // ignore
                }
                if (selected.has("municipios")) {
                  if (app.normalizeSearchText(app.state.municipioFilter || "")) {
                    void app.applyMunicipioFilterAndShowResults();
                  } else {
                    app.openGlobalSearchFilter();
                    app.setStatus("Filtro: marque Municípios e escolha um município na lista", "info");
                  }
                }
                if (selected.has("contratos")) {
                  if (app.normalizeContractKey(app.state.contractFilter)) {
                    void app.applyContractFilterAndShowResults();
                  } else if (!selected.has("municipios") || app.normalizeSearchText(app.state.municipioFilter || "")) {
                    app.openGlobalSearchFilter();
                    app.setStatus("Filtro: marque Contratos e escolha um contrato na lista", "info");
                  }
                }
              });
            } catch {
              // ignore
              app.setStatus("Filtro: não foi possível aplicar (erro)", "error");
            }
            return;
          }
        }

        const municipioOpt = t?.closest?.("button[data-filter-municipio]");
        if (municipioOpt && app.globalSearchFilterEl?.contains?.(municipioOpt)) {
          e.preventDefault();
          e.stopPropagation();
          const v = municipioOpt.getAttribute("data-filter-municipio") || "";
          app.state.globalSearch.enabledKinds.add("municipios");
          app.selectMunicipioFilterValue(v);
          try {
            app.closeGlobalSearchFilter();
          } catch {
            // ignore
          }
          return;
        }

        const contractOpt = t?.closest?.("button[data-filter-contract]");
        if (contractOpt && app.globalSearchFilterEl?.contains?.(contractOpt)) {
          e.preventDefault();
          e.stopPropagation();
          const v = contractOpt.getAttribute("data-filter-contract") || "";
          app.state.globalSearch.enabledKinds.add("contratos");
          app.selectContractFilterValue(v);
          try {
            app.closeGlobalSearchFilter();
          } catch {
            // ignore
          }
          return;
        }

      });

      // "change" cobre clique no checkbox e no texto do label.
      app.globalSearchFilterEl?.addEventListener("change", (e) => {
        const cb = e.target?.closest?.('input[type="checkbox"][data-kind]');
        if (!cb || !app.globalSearchFilterEl?.contains?.(cb)) return;
        app.applyGlobalSearchFilterKindToggle(cb);
      });

      app.globalSearchFilterEl?.addEventListener("input", (e) => {
        const input = e.target?.closest?.("#global-search-filter-municipio-input");
        if (!input || !app.globalSearchFilterEl?.contains?.(input)) return;
        app.state.municipioUiFilterText = input.value || "";
        app.renderGlobalSearchMunicipiosPanel();
      });

      app.globalSearchResultsEl?.addEventListener("click", (e) => {
        const t = e.target;
        const more = t?.closest?.("button.global-search-results__more[data-action=\"more\"]");
        if (more) {
          app.state.globalSearch.maxVisible = Math.min((app.state.globalSearch.maxVisible || 12) + 40, app.state.globalSearch.results.length);
          app.renderGlobalSearchResults(app.state.globalSearch.results);
          return;
        }
        const moreGroup = t?.closest?.("button.gsr-section__more[data-action=\"more-group\"][data-group]");
        if (moreGroup) {
          const g = moreGroup.getAttribute("data-group") || "";
          const key = app.normalizeSearchText(g) || g;
          if (!app.state.globalSearch.groupLimits) app.state.globalSearch.groupLimits = {};
          app.state.globalSearch.groupLimits[key] = Math.min((app.state.globalSearch.groupLimits[key] || 6) + 30, 200);
          app.renderGlobalSearchResults(app.state.globalSearch.results);
          return;
        }
        const item = t?.closest?.(".global-search-results__item[data-idx]");
        if (!item) return;
        const idx = parseInt(item.getAttribute("data-idx"), 10);
        if (Number.isNaN(idx)) return;
        const res = app.state.globalSearch.results?.[idx];
        void app.openSearchResult(res);
      });
      // Clique fora fecha popovers
      document.addEventListener("click", (e) => {
        const t = e.target;
        if (t?.closest?.(".global-search")) return;
        if (t?.closest?.("#global-search-filter")) return;
        if (t?.closest?.("#global-search-results")) return;
        app.closeGlobalSearchFilter();
        app.closeGlobalSearchResults();
      });

      // Menu de botão direito (context menu) para zoom na feição selecionada (na tabela)
      const ctx = document.createElement("div");
      ctx.className = "map-context-menu";
      ctx.hidden = true;
      ctx.innerHTML = `
        <button type="button" class="map-context-menu__item" data-action="zoom-selected">
          Dar zoom na camada selecionada
        </button>
      `;
      document.body.appendChild(ctx);

      const closeCtx = () => {
        ctx.hidden = true;
      };

      document.addEventListener("click", (e) => {
        if (ctx.hidden) return;
        const target = e.target;
        if (target?.closest?.(".map-context-menu")) return;
        closeCtx();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeCtx();
      });

      ctx.addEventListener("click", (e) => {
        const btn = e.target?.closest?.("button[data-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        if (action !== "zoom-selected") return;
        e.preventDefault();
        e.stopPropagation();
        closeCtx();
        if (!app.state.map || !app.state.selectedFeature) return;
        app.zoomToFeatureNow(app.state.selectedFeature, app.state.selectedLayer, app.state.lastSelectionKind || "segmentos", true);
      });

      const showCtxAt = (clientX, clientY) => {
        ctx.hidden = false;
        const x = clientX;
        const y = clientY;
        ctx.style.left = `${x}px`;
        ctx.style.top = `${y}px`;

        // Garante que fique dentro da tela
        const r = ctx.getBoundingClientRect();
        const pad = 10;
        let nx = x;
        let ny = y;
        if (r.right > window.innerWidth - pad) nx = Math.max(pad, window.innerWidth - r.width - pad);
        if (r.bottom > window.innerHeight - pad) ny = Math.max(pad, window.innerHeight - r.height - pad);
        ctx.style.left = `${nx}px`;
        ctx.style.top = `${ny}px`;
      };

      // Botão direito dentro da tabela: abre o menu e mantém a feição daquela linha como selecionada
      attrsHost?.addEventListener("contextmenu", (e) => {
        const target = e.target;
        const kind = app.state.tableDataset;

        const pickFromRow = (row, attrName, feats, layers, selectionKind) => {
          if (!row) return false;
          const idx = parseInt(row.getAttribute(attrName), 10);
          if (Number.isNaN(idx)) return false;
          const feature = feats?.[idx];
          const layer = layers?.[idx];
          if (!feature) return false;
          app.state.selectedFeature = feature;
          app.state.selectedLayer = layer || null;
          app.state.lastSelectionKind = selectionKind;
          return true;
        };

        let ok = false;
        if (kind === "segmentos") {
          const row = target.closest?.("#all-attributes-table tbody tr[data-feature-index]");
          ok = pickFromRow(row, "data-feature-index", app.state.allFeatures, app.state.layersByIndex, "segmentos");
        } else if (kind === "bueiros") {
          const row = target.closest?.("#bueiros-attributes-table tbody tr[data-bueiros-index]");
          ok = pickFromRow(row, "data-bueiros-index", app.state.bueirosFeatures, app.state.bueirosLayersByIndex, "bueiros");
        } else if (kind === "pontes") {
          const row = target.closest?.("#pontes-attributes-table tbody tr[data-pontes-index]");
          ok = pickFromRow(row, "data-pontes-index", app.state.pontesFeatures, app.state.pontesLayersByIndex, "pontes");
        } else if (kind === "jazidas") {
          const row = target.closest?.("#jazidas-attributes-table tbody tr[data-jazidas-index]");
          ok = pickFromRow(row, "data-jazidas-index", app.state.jazidasFeatures, app.state.jazidasLayersByIndex, "jazidas");
        } else if (kind === "bueiros-br174") {
          const row = target.closest?.("#bueiros-br174-attributes-table tbody tr[data-bueiros-br174-index]");
          ok = pickFromRow(row, "data-bueiros-br174-index", app.state.bueirosBr174Features, app.state.bueirosBr174LayersByIndex, "bueiros-br174");
        } else if (kind === "prads-br174") {
          const row = target.closest?.("#prads-br174-attributes-table tbody tr[data-prads-br174-index]");
          ok = pickFromRow(row, "data-prads-br174-index", app.state.pradsBr174Features, app.state.pradsBr174LayersByIndex, "prads-br174");
        } else if (kind === "pca-prads-br319") {
        } else if (kind === "prads-br319") {
          const row = target.closest?.("#pca-prads-br319-attributes-table tbody tr[data-pca-prads-br319-index]");
          ok = pickFromRow(row, "data-pca-prads-br319-index", app.state.pcaPradsBr319Features, app.state.pcaPradsBr319LayersByIndex, "pca-prads-br319");
          ok = pickFromRow(row, "data-prads-br319-index", app.state.pradsBr319Features, app.state.pradsBr319LayersByIndex, "prads-br319");
        } else if (kind === "pca-prads-cmm-br319") {
          const row = target.closest?.("#pca-prads-cmm-br319-attributes-table tbody tr[data-pca-prads-cmm-br319-index]");
          ok = pickFromRow(row, "data-pca-prads-cmm-br319-index", app.state.pcaPradsCmmBr319Features, app.state.pcaPradsCmmBr319LayersByIndex, "pca-prads-cmm-br319");
        } else if (kind === "pontes-br319") {
          const row = target.closest?.("#pontes-br319-attributes-table tbody tr[data-pontes-br319-index]");
          ok = pickFromRow(row, "data-pontes-br319-index", app.state.pontesBr319Features, app.state.pontesBr319LayersByIndex, "pontes-br319");
        } else if (kind === "pontes-br230") {
          const row = target.closest?.("#pontes-br230-attributes-table tbody tr[data-pontes-br230-index]");
          ok = pickFromRow(row, "data-pontes-br230-index", app.state.pontesBr230Features, app.state.pontesBr230LayersByIndex, "pontes-br230");
        } else if (kind === "uc-estadual") {
          const row = target.closest?.("#uc-estadual-attributes-table tbody tr[data-uc-estadual-index]");
          ok = pickFromRow(row, "data-uc-estadual-index", app.state.ucEstadualFeatures, app.state.ucEstadualLayersByIndex, "uc-estadual");
        } else if (kind === "uc-municipal") {
          const row = target.closest?.("#uc-municipal-attributes-table tbody tr[data-uc-municipal-index]");
          ok = pickFromRow(row, "data-uc-municipal-index", app.state.ucMunicipalFeatures, app.state.ucMunicipalLayersByIndex, "uc-municipal");
        }

        if (!ok) return;
        e.preventDefault();
        e.stopPropagation();
        showCtxAt(e.clientX, e.clientY);
      });

      function fitSegmentosBoundsNow() {
        if (!app.state.map || !app.state.geojsonLayer?.getBounds) return;
        const b = app.state.geojsonLayer.getBounds();
        if (!b?.isValid?.()) return;
        app.state.map.fitBounds(b, {
          animate: false,
          duration: 0,
          padding: [28, 28],
          maxZoom: 16,
        });
      }

      // Evita que clicar no toggle dispare o "zoom da camada"
      layerBueirosToggle?.addEventListener("click", (e) => e.stopPropagation());
      layerPontesToggle?.addEventListener("click", (e) => e.stopPropagation());
      layerJazidasToggle?.addEventListener("click", (e) => e.stopPropagation());
      app.layerLimiteToggle?.addEventListener("click", (e) => e.stopPropagation());
      app.layerLimiteMunicipalToggle?.addEventListener("click", (e) => e.stopPropagation());

      // Ao ligar/desligar toggle de camada:
      // - desligar: limpa seleção dessa camada
      // - ligar com tabela já aberta: abre automaticamente a tabela desta camada
      document.querySelector(".sidebar-section--layers")?.addEventListener("change", (e) => {
        const t = e.target;
        if (!t || t.type !== "checkbox") return;
        const id = String(t.id || "");
        if (!id.startsWith("layer-")) return;
        app.syncLayerRowsToggleUi();
        if (app.layerLegendEl?.classList.contains("is-open")) {
          try {
            app.renderLayerLegend();
          } catch {
            // ignore
          }
        }
        const kind = app.kindFromLayerToggleId(id);
        if (!t.checked) {
          if (kind) app.clearSelectionForTurnedOffKind(kind);
          // Última camada de dados off → mantém somente Limite Estadual ligado.
          if (id !== "layer-limite-estadual") app.ensureLimiteEstadualWhenNoDataLayers();
          return;
        }
        if (!kind) return;
        app.maybeOpenAttributesTableWhenLayerEnabled(kind);
      });

      app.layerLimiteToggle?.addEventListener("change", () => {
        if (!app.layerLimiteToggle) return;
        // Com todas as camadas de dados desligadas, Limite Estadual não pode ficar off.
        if (!app.layerLimiteToggle.checked && app.allAvailableDataTogglesOff()) {
          app.forceOnlyLimiteEstadualOn();
          app.renderLayerLegend();
          return;
        }
        app.applyLimiteEstadualVisibility();
        app.renderLayerLegend();
        if (!app.layerLimiteToggle.checked) {
          app.state.limiteEstadualUserHidden = true;
          // Garante remoção efetiva do mapa.
          try {
            if (app.state.map && app.state.boundaryLayer && app.state.map.hasLayer(app.state.boundaryLayer)) {
              app.state.map.removeLayer(app.state.boundaryLayer);
            }
          } catch {
            // ignore
          }
          // Libera referência: se ligar de novo, recarrega do endpoint.
          app.state.boundaryLayer = null;
          return;
        }
        app.state.limiteEstadualUserHidden = false;
        if (app.shouldExpandLayerGroupsOnToggle()) toggleLimitesAmMenu(true);
        void app.attachLimiteEstadualLayerIfNeeded().finally(() => {
          app.applyLimiteEstadualVisibility();
          app.bringLimiteEstadualToBackIfVisible();
        });
      });

      app.layerLimiteMunicipalToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (app.layerLimiteMunicipalToggle.checked) {
          if (app.shouldExpandLayerGroupsOnToggle()) toggleLimitesAmMenu(true);
          void app.attachLimiteMunicipalLayerIfNeeded().finally(() => {
            app.applyLimiteMunicipalVisibility();
          });
        } else {
          app.applyLimiteMunicipalVisibility();
        }
        app.renderLayerLegend();
      });

      app.layersDisableAllBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Desligar todas as camadas de dados, mantendo apenas Limite Estadual.
        app.turnOffAllDataLayersKeepLimiteEstadual();
      });

      app.menuToggleLayersBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          app.toggleDataLayersFromMenu();
        } catch {
          // ignore
        }
      });

      app.menuFitAmazonasBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        app.fitMapToStateBoundaryNow();
      });

      // Menu deixou de ser recolhível: mantém sempre visível
      try {
        const host = document.querySelector(".sidebar-section--menu");
        host?.classList?.remove("is-expanded");
        if (app.menuSubtree) app.menuSubtree.setAttribute("aria-hidden", "false");
      } catch {
        // noop
      }

      // Popup de município: foca uma camada com feições daquele município.
      app.municipioFilterPopup?.addEventListener("click", (e) => {
        const closeBtn = e.target?.closest?.("[data-municipio-popup-close]");
        if (closeBtn) {
          e.preventDefault();
          e.stopPropagation();
          if (app.municipioFilterPopup) app.municipioFilterPopup.hidden = true;
          return;
        }
        const pill = e.target?.closest?.("button[data-municipio-layer-kind]");
        if (!pill) return;
        e.preventDefault();
        e.stopPropagation();
        const kind = pill.getAttribute("data-municipio-layer-kind") || "";
        const label = pill.getAttribute("data-municipio-layer-label") || kind;
        if (!kind) return;
        app.state.municipioFocusLayerLabel = label;
        app.showMunicipioLayersPopup(app.state.municipioFilter);
        app.setToggleChecked(kind, true);
        app.setStatus(`Município: focando ${label}…`, "info");
        Promise.resolve(ensureKindOnMap(kind))
          .then(async () => {
            const group = app.getLayerGroupByKind(kind);
            if (group) app.ensureLayerVisibleOnMap(group, { force: true });
            app.applyContractFilterToMap();
            app.fitMapToMunicipioInLayerGroup(group);
            await app.openMunicipioMatchedLayerTable(kind);
            app.setStatus(`Município: ${app.state.municipioFilter} — ${label}`, "ok");
          })
          .catch(() => app.setStatus(`Município: não foi possível focar ${label}`, "error"));
      });

      app.menuContractSelect?.addEventListener("change", () => {
        app.state.contractFilter = app.normalizeContractValue(app.menuContractSelect.value);
        app.state.contractFocusLayerLabel = "";
        try {
          if (app.normalizeContractKey(app.state.contractFilter)) {
            app.state.globalSearch.enabledKinds.add("contratos");
          } else {
            app.state.globalSearch.enabledKinds.delete("contratos");
          }
        } catch {
          // ignore
        }
        void app.applyContractFilterAndShowResults();
      });

      function toggleRodoviasMenu(force) {
        if (!app.groupRodovias || !app.headRodovias) return;
        const next =
          force === true ? true : force === false ? false : !app.groupRodovias.classList.contains("is-expanded");
        app.groupRodovias.classList.toggle("is-expanded", next);
        app.headRodovias.setAttribute("aria-expanded", next ? "true" : "false");
        if (app.subtreeRodovias) app.subtreeRodovias.setAttribute("aria-hidden", next ? "false" : "true");
      }

      function toggleAquaviarioMenu(force) {
        if (!app.groupAquaviario || !app.headAquaviario) return;
        const next =
          force === true
            ? true
            : force === false
              ? false
              : !app.groupAquaviario.classList.contains("is-expanded");
        app.groupAquaviario.classList.toggle("is-expanded", next);
        app.headAquaviario.setAttribute("aria-expanded", next ? "true" : "false");
        if (app.subtreeAquaviario) app.subtreeAquaviario.setAttribute("aria-hidden", next ? "false" : "true");
      }

      function toggleUcMenu(force) {
        if (!app.groupUc || !app.headUc) return;
        const next =
          force === true ? true : force === false ? false : !app.groupUc.classList.contains("is-expanded");
        app.groupUc.classList.toggle("is-expanded", next);
        app.headUc.setAttribute("aria-expanded", next ? "true" : "false");
        if (app.subtreeUc) app.subtreeUc.setAttribute("aria-hidden", next ? "false" : "true");
      }

      function toggleLimitesAmMenu(force) {
        if (!app.groupLimitesAm || !app.headLimitesAm) return;
        const next =
          force === true
            ? true
            : force === false
              ? false
              : !app.groupLimitesAm.classList.contains("is-expanded");
        app.groupLimitesAm.classList.toggle("is-expanded", next);
        app.headLimitesAm.setAttribute("aria-expanded", next ? "true" : "false");
        if (app.subtreeLimitesAm) app.subtreeLimitesAm.setAttribute("aria-hidden", next ? "false" : "true");
      }

      app.headRodovias?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleRodoviasMenu();
      });
      app.headRodovias?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleRodoviasMenu();
        }
      });

      app.headAquaviario?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleAquaviarioMenu();
      });
      app.headAquaviario?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleAquaviarioMenu();
        }
      });

      app.headUc?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleUcMenu();
      });
      app.headUc?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleUcMenu();
        }
      });

      app.headLimitesAm?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLimitesAmMenu();
      });
      app.headLimitesAm?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleLimitesAmMenu();
        }
      });

      app.headBrAm?.addEventListener("click", (e) => {
        e.stopPropagation();
        app.toggleBrAmGroup();
      });
      app.headBrAm?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          app.toggleBrAmGroup();
        }
      });

      function toggleBranchBr317(force) {
        if (!app.branchBr317 || !app.branchHeadBr317) return;
        const next =
          force === true ? true : force === false ? false : !app.branchBr317.classList.contains("is-expanded");
        app.branchBr317.classList.toggle("is-expanded", next);
        app.branchHeadBr317.setAttribute("aria-expanded", next ? "true" : "false");
      }

      app.branchHeadBr317?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBranchBr317();
      });
      app.branchHeadBr317?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleBranchBr317();
        }
      });

      function toggleBranchBr307(force) {
        if (!app.branchBr307 || !app.branchHeadBr307) return;
        const next =
          force === true ? true : force === false ? false : !app.branchBr307.classList.contains("is-expanded");
        app.branchBr307.classList.toggle("is-expanded", next);
        app.branchHeadBr307.setAttribute("aria-expanded", next ? "true" : "false");
      }

      app.branchHeadBr307?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBranchBr307();
      });
      app.branchHeadBr307?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleBranchBr307();
        }
      });

      function toggleBranchBr319(force) {
        if (!app.branchBr319 || !app.branchHeadBr319) return;
        const next =
          force === true ? true : force === false ? false : !app.branchBr319.classList.contains("is-expanded");
        app.branchBr319.classList.toggle("is-expanded", next);
        app.branchHeadBr319.setAttribute("aria-expanded", next ? "true" : "false");
      }

      app.branchHeadBr319?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBranchBr319();
      });
      app.branchHeadBr319?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleBranchBr319();
        }
      });

      function toggleBranchBr230(force) {
        if (!app.branchBr230 || !app.branchHeadBr230) return;
        const next =
          force === true ? true : force === false ? false : !app.branchBr230.classList.contains("is-expanded");
        app.branchBr230.classList.toggle("is-expanded", next);
        app.branchHeadBr230.setAttribute("aria-expanded", next ? "true" : "false");
      }

      app.branchHeadBr230?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBranchBr230();
      });
      app.branchHeadBr230?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleBranchBr230();
        }
      });

      function toggleBranchBr174(force) {
        if (!app.branchBr174 || !app.branchHeadBr174) return;
        const next =
          force === true ? true : force === false ? false : !app.branchBr174.classList.contains("is-expanded");
        app.branchBr174.classList.toggle("is-expanded", next);
        app.branchHeadBr174.setAttribute("aria-expanded", next ? "true" : "false");
      }

      app.branchHeadBr174?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleBranchBr174();
      });
      app.branchHeadBr174?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleBranchBr174();
        }
      });

      layerBueirosToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerBueirosToggle.checked) {
          void ensureBueirosBr317OnMap();
        } else if (app.state.bueirosLayer) {
          app.state.map.removeLayer(app.state.bueirosLayer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      app.fetchBueirosBr317Info().then(app.applyBueirosAvailability);
      app.fetchPontesBr307Info().then(app.applyPontesAvailability);
      app.fetchPontesBr319Info().then(app.applyPontesBr319Availability);
      app.fetchPontesBr230Info().then(app.applyPontesBr230Availability);
      app.fetchBueirosBr319Info().then(app.applyBueirosBr319Availability);
      app.fetchJazidasBr307Info().then(app.applyJazidasAvailability);
      app.fetchUcEstadualInfo().then(app.applyUcEstadualAvailability);
      app.fetchUcMunicipalInfo().then(app.applyUcMunicipalAvailability);
      app.fetchIp4Info().then(app.applyIp4Availability);
      app.fetchHidroviasAmInfo().then(app.applyHidroviasAmAvailability);
      app.fetchTiAmInfo().then(app.applyTiAmAvailability);
      app.fetchLimiteMunicipalInfo().then(app.applyLimiteMunicipalAvailability);
      app.fetchBueirosBr174Info().then(app.applyBueirosBr174Availability);
      app.fetchPradsBr174Info().then(app.applyPradsBr174Availability);
      app.fetchPcaPradsBr319Info().then(app.applyPcaPradsBr319Availability);
      app.fetchPradsBr319Info().then(app.applyPradsBr319Availability);
      app.fetchPcaPradsCmmBr319Info().then(app.applyPcaPradsCmmBr319Availability);
      app.fetchBueirosBr230Info().then(app.applyBueirosBr230Availability);
      void app.initBrAmGroup();


      layerPontesToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerPontesToggle.checked) {
          void ensurePontesBr307OnMap();
        } else if (app.state.pontesBr307Layer) {
          app.state.map.removeLayer(app.state.pontesBr307Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerPontesBr319Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerPontesBr319Toggle.checked) {
          void ensurePontesBr319OnMap();
        } else if (app.state.pontesBr319Layer) {
          app.state.map.removeLayer(app.state.pontesBr319Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      app.layerPontesBr230Toggle?.addEventListener("click", (e) => e.stopPropagation());
      app.layerPontesBr230Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (app.layerPontesBr230Toggle.checked) {
          void app.ensurePontesBr230OnMap();
        } else if (app.state.pontesBr230Layer) {
          app.state.map.removeLayer(app.state.pontesBr230Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerBueirosBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
      layerBueirosBr319Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerBueirosBr319Toggle.checked) {
          void ensureBueirosBr319OnMap();
        } else if (app.state.bueirosBr319Layer) {
          app.state.map.removeLayer(app.state.bueirosBr319Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });


      layerJazidasToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerJazidasToggle.checked) {
          void ensureJazidasBr307OnMap();
        } else if (app.state.jazidasBr307Layer) {
          app.state.map.removeLayer(app.state.jazidasBr307Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });


      layerUcEstadualToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerUcEstadualToggle.checked) {
          if (app.shouldExpandLayerGroupsOnToggle()) toggleUcMenu(true);
          void ensureUcEstadualOnMap();
        } else if (app.state.ucEstadualLayer) {
          app.state.map.removeLayer(app.state.ucEstadualLayer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerUcMunicipalToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerUcMunicipalToggle.checked) {
          if (app.shouldExpandLayerGroupsOnToggle()) toggleUcMenu(true);
          void ensureUcMunicipalOnMap();
        } else if (app.state.ucMunicipalLayer) {
          app.state.map.removeLayer(app.state.ucMunicipalLayer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerIp4Toggle?.addEventListener("click", (e) => e.stopPropagation());
      layerIp4Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerIp4Toggle.checked) {
          if (app.shouldExpandLayerGroupsOnToggle()) toggleAquaviarioMenu(true);
          void ensureIp4OnMap();
        } else if (app.state.ip4Layer) {
          app.state.map.removeLayer(app.state.ip4Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerHidroviasAmToggle?.addEventListener("click", (e) => e.stopPropagation());
      layerHidroviasAmToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerHidroviasAmToggle.checked) {
          if (app.shouldExpandLayerGroupsOnToggle()) toggleAquaviarioMenu(true);
          void ensureHidroviasAmOnMap();
        } else if (app.state.hidroviasAmLayer) {
          app.state.map.removeLayer(app.state.hidroviasAmLayer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerTiAmToggle?.addEventListener("click", (e) => e.stopPropagation());
      layerTiAmToggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerTiAmToggle.checked) {
          if (app.shouldExpandLayerGroupsOnToggle()) toggleUcMenu(true);
          void ensureTiAmOnMap();
        } else if (app.state.tiAmLayer) {
          app.state.map.removeLayer(app.state.tiAmLayer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerBueirosBr174Toggle?.addEventListener("click", (e) => e.stopPropagation());
      layerPradsBr174Toggle?.addEventListener("click", (e) => e.stopPropagation());
      layerPcaPradsBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
      layerPradsBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
      layerPcaPradsCmmBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
      layerBueirosBr230Toggle?.addEventListener("click", (e) => e.stopPropagation());

      layerBueirosBr174Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerBueirosBr174Toggle.checked) {
          void ensureBueirosBr174OnMap();
        } else if (app.state.bueirosBr174Layer) {
          app.state.map.removeLayer(app.state.bueirosBr174Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });

      layerPradsBr174Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerPradsBr174Toggle.checked) {
          void ensurePradsBr174OnMap();
        } else if (app.state.pradsBr174Layer) {
          app.state.map.removeLayer(app.state.pradsBr174Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });


      layerPcaPradsBr319Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerPcaPradsBr319Toggle.checked) {
          void ensurePcaPradsBr319OnMap();
        } else if (app.state.pcaPradsBr319Layer) {
          app.state.map.removeLayer(app.state.pcaPradsBr319Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });
      layerPradsBr319Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerPradsBr319Toggle.checked) {
          void ensurePradsBr319OnMap();
        } else if (app.state.pradsBr319Layer) {
          app.state.map.removeLayer(app.state.pradsBr319Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });
      layerPcaPradsCmmBr319Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerPcaPradsCmmBr319Toggle.checked) {
          void ensurePcaPradsCmmBr319OnMap();
        } else if (app.state.pcaPradsCmmBr319Layer) {
          app.state.map.removeLayer(app.state.pcaPradsCmmBr319Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });


      layerBueirosBr230Toggle?.addEventListener("change", () => {
        if (!app.state.map) return;
        if (layerBueirosBr230Toggle.checked) {
          void ensureBueirosBr230OnMap();
        } else if (app.state.bueirosBr230Layer) {
          app.state.map.removeLayer(app.state.bueirosBr230Layer);
          app.afterRodoviasSublayerVisibilityChange();
        }
        app.renderLayerLegend();
      });


      const fitSegmentos = () => {
        // Segmentos BR-319 removido do mapa.
        return;
        if (!app.state.geojsonLayer) {
          app.state.pendingFitSegmentos = true;
          app.setStatus("Dados: carregando (zoom pendente)...", "loading");
          return;
        }
        const b = app.state.geojsonLayer.getBounds?.();
        if (!b?.isValid?.()) return;
        if (!app.state.map.hasLayer(app.state.geojsonLayer)) {
          if (app.layerSegmentosToggle) app.layerSegmentosToggle.checked = true;
          app.mountDataLayerIfAllowed(app.state.geojsonLayer, app.layerSegmentosToggle);
          if (app.state.geojsonLayer.bringToFront) app.state.geojsonLayer.bringToFront();
        }
        fitSegmentosBoundsNow();
      };

      app.layerRowSegmentos?.addEventListener("click", fitSegmentos);
      app.layerRowSegmentos?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fitSegmentos();
        }
      });

      // Menu "3 pontinhos" das subcamadas (kebab menu)
      app.enhanceLayerKebabMenus();

      function closeAllLayerMenus() {
        document.querySelectorAll(".layer-kebab-menu").forEach((m) => {
          m.hidden = true;
          m.classList.remove("is-above");
          m.style.visibility = "";
        });
        document.querySelectorAll(".layer-kebab[aria-expanded=\"true\"]").forEach((b) => {
          b.setAttribute("aria-expanded", "false");
        });
      }

      document.addEventListener("click", (e) => {
        const target = e.target;
        const kebabBtn = target?.closest?.(".layer-kebab[data-layer-menu]");
        const menuItem = target?.closest?.(".layer-kebab-item[data-layer-action]");

        if (menuItem) {
          const layer = menuItem.getAttribute("data-layer");
          const action = menuItem.getAttribute("data-layer-action");
          if (action !== "table" || !layer) return;
          e.preventDefault();
          e.stopPropagation();
          closeAllLayerMenus();
          void app.openAttributesTableForLayer(layer);
          return;
        }

        if (kebabBtn) {
          e.preventDefault();
          e.stopPropagation();
          const layer = kebabBtn.getAttribute("data-layer-menu");
          if (!layer) return;
          let menu = document.querySelector(`.layer-kebab-menu[data-layer-menu-popover="${layer}"]`);
          if (!menu) return;
          if (!menu.querySelector(".layer-kebab-item__title")) {
            menu.innerHTML = app.buildLayerKebabMenuInnerHtml(layer);
          }

          const willOpen = Boolean(menu.hidden);
          closeAllLayerMenus();
          if (!willOpen) return;

          app.positionLayerKebabMenu(kebabBtn, menu);
          kebabBtn.setAttribute("aria-expanded", "true");
          return;
        }

        // Clique fora: fecha menus
        if (!target?.closest?.(".layer-kebab-menu")) {
          closeAllLayerMenus();
        }
      });

      // Fecha o menu ao rolar a lista de camadas ou redimensionar (evita “flutuar” errado).
      document.querySelector(".sidebar-layers-scroll")?.addEventListener(
        "scroll",
        () => closeAllLayerMenus(),
        { passive: true },
      );
      window.addEventListener("resize", () => closeAllLayerMenus(), { passive: true });
      window.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") closeAllLayerMenus();
        },
        { passive: true },
      );

      app.btnFit?.addEventListener("click", () => {
        if (!app.state.map) return;
        if (
          app.state.geojsonLayer &&
          app.state.map.hasLayer(app.state.geojsonLayer) &&
          app.state.boundsAll?.isValid?.()
        ) {
          app.state.map.fitBounds(app.state.boundsAll, { animate: false, duration: 0, padding: [20, 20] });
          return;
        }
        const bb = app.state.boundaryLayer?.getBounds?.();
        if (bb?.isValid?.()) {
          app.state.map.fitBounds(bb, { animate: false, duration: 0, padding: [20, 20] });
        }
      });

      app.btnLocate?.addEventListener("click", () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const m = L.circleMarker([latitude, longitude], {
              radius: 7,
              color: "#2862ab",
              weight: 2,
              fillColor: "#2862ab",
              fillOpacity: 0.35,
            }).addTo(app.state.map);
            app.state.map.setView([latitude, longitude], 12, { animate: false, duration: 0 });
            // Sem delay: remove imediatamente o marcador temporário.
            app.state.map.removeLayer(m);
          },
          () => {}
        );
      });

      app.btnLegend?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!app.layerLegendEl) return;
        const next = !app.layerLegendEl.classList.contains("is-open");
        app.setLegendPanelOpen(next);
      });
      try {
        app.updateCamadasFootSummary();
      } catch {
        // ignore
      }
      app.layerLegendCloseBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        app.setLegendPanelOpen(false);
      });
      app.layerLegendClearBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        app.clearMapLegendLayers();
      });
      app.layerLegendBodyEl?.addEventListener("change", (e) => {
        const input = e.target?.closest?.("input.map-legend__check");
        if (!input) return;
        const checked = Boolean(input.checked);
        const layerToggleId = input.getAttribute("data-layer-toggle") || "";
        const nodeId = input.getAttribute("data-legend-node") || "";

        if (layerToggleId) {
          app.applyLegendLeafToggle(layerToggleId, checked);
        } else if (nodeId) {
          app.applyLegendTreeNodeToggle(nodeId, checked);
        } else {
          return;
        }

        // Atualiza o painel após os change handlers das camadas.
        window.setTimeout(() => {
          try {
            app.renderLayerLegend();
            app.updateCamadasFootSummary();
          } catch {
            // ignore
          }
        }, 0);
      });

      // Redimensionamento do painel inferior (arrastar a "linha" superior)
      if (app.bottomSheet && app.bottomSheetHandle) {
        const minH = 180;
        const maxH = () => Math.max(minH, Math.round(window.innerHeight * 0.9));
        let startY = 0;
        let startH = 0;
        let dragging = false;

        const onMove = (clientY) => {
          if (!dragging) return;
          const dy = startY - clientY;
          const next = Math.min(maxH(), Math.max(minH, startH + dy));
          app.bottomSheet.style.height = `${next}px`;
        };

        const onPointerMove = (e) => onMove(e.clientY);
        const onTouchMove = (e) => {
          const t = e.touches?.[0];
          if (t) onMove(t.clientY);
        };
        const stop = () => {
          dragging = false;
          document.body.style.userSelect = "";
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("touchmove", onTouchMove);
        };

        const start = (clientY) => {
          dragging = true;
          startY = clientY;
          startH = app.bottomSheet.getBoundingClientRect().height;
          document.body.style.userSelect = "none";
          window.addEventListener("pointermove", onPointerMove);
          window.addEventListener("pointerup", stop, { once: true });
          window.addEventListener("touchmove", onTouchMove, { passive: true });
          window.addEventListener("touchend", stop, { once: true });
        };

        app.bottomSheetHandle.addEventListener("pointerdown", (e) => start(e.clientY));
        app.bottomSheetHandle.addEventListener("touchstart", (e) => {
          const t = e.touches?.[0];
          if (t) start(t.clientY);
        });

        window.addEventListener("resize", () => {
          const h = app.bottomSheet.getBoundingClientRect().height;
          if (h > maxH()) app.bottomSheet.style.height = `${maxH()}px`;
        });
      }
    }

  app.initMap = function initMap() {
      app.state.map = L.map("map", {
        zoomControl: true,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
        inertia: false,
        // Evita o retângulo ("quadro") do box-zoom ao interagir/selecionar no mapa
        boxZoom: false,
      }).setView([-4.5, -63], 6);

      // Coordenadas com precisão: último clique (camadas/feições).
      try {
        // Só exibe quando uma feição/camada for clicada.
      } catch {
        // ignore
      }

      // Não abre a tabela automaticamente na inicialização.

      // Tecla ESC (global): aplica para todas as funcionalidades do mapa
      // - fecha pickers/menus/tooltip
      // - sai de modos (seleção)
      // - se houver seleção: limpa e reenquadra no Amazonas
      if (!app.state.escGlobalHandlerAttached) {
        app.state.escGlobalHandlerAttached = true;
        document.addEventListener("keydown", (e) => {
          if (e.key !== "Escape") return;

          // Não atrapalhar digitação em inputs/textarea/select — mas ESC ainda fecha tabela/popup.
          const ae = document.activeElement;
          const tag = (ae?.tagName || "").toLowerCase();
          const isTyping = tag === "input" || tag === "textarea" || tag === "select" || ae?.isContentEditable;
          if (isTyping) {
            try {
              if (app.dismissTablesAndPopups()) {
                e.preventDefault();
                return;
              }
            } catch {
              // ignore
            }
            try {
              app.closeGlobalSearchFilter();
            } catch {
              // ignore
            }
            try {
              app.closeGlobalSearchResults();
            } catch {
              // ignore
            }
            try {
              app.closeMapBasemapPicker();
            } catch {
              // ignore
            }
            // Não limpa seleção / não reenquadra enquanto o usuário está editando.
            return;
          }

          // Tabela aberta e/ou popup: ESC fecha ambos.
          try {
            if (app.dismissTablesAndPopups()) {
              e.preventDefault();
              return;
            }
          } catch {
            // ignore
          }

          // Fecha popovers da busca global (resultados/filtros)
          try {
            app.closeGlobalSearchFilter();
          } catch {
            // ignore
          }
          try {
            app.closeGlobalSearchResults();
          } catch {
            // ignore
          }

          // Fecha UI de mapa base / contrato / menus flutuantes
          try {
            app.closeMapBasemapPicker();
          } catch {
            // ignore
          }
          try {
            // Garante que nenhum "quadro" de seleção fique visível
            if (typeof clearBoxRect === "function") clearBoxRect();
          } catch {
            // ignore
          }

          // Sai de modo de seleção (se existir no UI)
          try {
            app.state.selectionMode = "click";
            if (app.menuSelectMode) app.menuSelectMode.value = "click";
          } catch {
            // ignore
          }

          // Se há seleção, limpa e reenquadra
          if (app.state.selectedFeature || app.state.selectedFeatureIndex !== null) {
            app.clearCurrentSelection();
            app.fitMapToStateBoundaryNow();
          }
        });
      }
      app.ensureInfraGeoPanes();
      // Garantia extra (em alguns builds o handler pode estar ativo mesmo com opção falsa)
      app.state.map.boxZoom?.disable?.();
      app.state.basemapLayers = app.buildBasemapLayers();
      app.setBasemapLayer(app.state.currentBasemapId || "imagery");
      app.setupBasemapSelect();

      // Limite Municipal só é carregado quando o usuário ligar a camada (sem auto-ativar na inicialização).

      // Seleção por arraste (retângulo)
      try {
        if (app.menuSelectMode) {
          app.menuSelectMode.value = app.state.selectionMode;
          app.menuSelectMode.addEventListener("change", () => {
            // Desativa seleção por retângulo: ela cria um "quadro" visual que não queremos exibir.
            const next = String(app.menuSelectMode.value || "click");
            app.state.selectionMode = next === "box" ? "click" : next;
            if (next === "box") {
              try {
                app.menuSelectMode.value = "click";
              } catch {
                // ignore
              }
            }
            app.setStatus("Seleção: clique", "ok");
          });
        }
        if (app.menuSelectTarget) {
          app.menuSelectTarget.value = app.state.selectionTarget;
          app.menuSelectTarget.addEventListener("change", () => {
            app.state.selectionTarget = String(app.menuSelectTarget.value || "auto");
          });
        }
      } catch {
        // noop
      }

      const ensureBoxRect = () => null;

      const clearBoxRect = () => {
        if (!app.state.map) return;
        if (app.state.boxSelect.rectLayer && app.state.map.hasLayer(app.state.boxSelect.rectLayer)) {
          app.state.map.removeLayer(app.state.boxSelect.rectLayer);
        }
        app.state.boxSelect.rectLayer = null;
      };

      const layerCandidatesByTarget = () => {
        const mk = (target, group, kind) => ({ target, group, kind });
        return [
          mk("segmentos", app.state.geojsonLayer, "segmentos"),
          mk("bueiros", app.state.bueirosLayer, "bueiros"),
          mk("pontes", app.state.pontesBr307Layer, "pontes"),
          mk("jazidas", app.state.jazidasBr307Layer, "jazidas"),
          mk("hidrovias-am", app.state.hidroviasAmLayer, "hidrovias-am"),
          mk("ip4", app.state.ip4Layer, "ip4"),
          mk("uc-estadual", app.state.ucEstadualLayer, "uc-estadual"),
          mk("uc-municipal", app.state.ucMunicipalLayer, "uc-municipal"),
          mk("ti-am", app.state.tiAmLayer, "ti-am"),
          mk("pontes-br319", app.state.pontesBr319Layer, "pontes-br319"),
          mk("pontes-br230", app.state.pontesBr230Layer, "pontes-br230"),
          mk("bueiros-br319", app.state.bueirosBr319Layer, "bueiros-br319"),
          mk("bueiros-br174", app.state.bueirosBr174Layer, "bueiros-br174"),
          mk("prads-br174", app.state.pradsBr174Layer, "prads-br174"),
          mk("pca-prads-br319", app.state.pcaPradsBr319Layer, "pca-prads-br319"),
          mk("prads-br319", app.state.pradsBr319Layer, "prads-br319"),
          mk("pca-prads-cmm-br319", app.state.pcaPradsCmmBr319Layer, "pca-prads-cmm-br319"),
          mk("bueiros-br230", app.state.bueirosBr230Layer, "bueiros-br230"),
        ];
      };

      const isGroupVisible = (group) => Boolean(app.state.map && group && app.state.map.hasLayer(group));

      const findFirstFeatureInBounds = (group, bounds) => {
        if (!group?.eachLayer) return { hit: null, count: 0 };
        let count = 0;
        let first = null;
        group.eachLayer((lyr) => {
          if (!lyr) return;
          let inside = false;
          try {
            if (typeof lyr.getLatLng === "function") {
              const ll = lyr.getLatLng();
              inside = Boolean(ll && bounds.contains(ll));
            } else if (typeof lyr.getBounds === "function") {
              const b = lyr.getBounds();
              inside = Boolean(b && bounds.intersects(b));
            }
          } catch {
            inside = false;
          }
          if (!inside) return;
          count++;
          if (!first) first = lyr;
        });
        return { hit: first, count };
      };

      const applyBoxSelection = (bounds) => {
        if (!app.state.map) return;
        const target = String(app.state.selectionTarget || "auto");
        const candidates = layerCandidatesByTarget();

        const ordered =
          target === "auto"
            ? candidates.filter((c) => isGroupVisible(c.group))
            : candidates.filter((c) => c.target === target && isGroupVisible(c.group));

        for (const c of ordered) {
          const { hit, count } = findFirstFeatureInBounds(c.group, bounds);
          if (!hit?.feature) continue;
          app.setStatus(`Seleção: ${count} feição(ões) na caixa`, "ok");
          app.handleIdentifyClick(hit.getLatLng?.() || bounds.getCenter?.() || null, { zoomTo: true });
          return;
        }
        app.setStatus("Seleção: nenhuma feição na caixa", "ok");
      };

      const onMouseDown = (e) => {
        if (app.state.selectionMode !== "box") return;
        if (!app.state.map) return;
        const oe = e?.originalEvent;
        if (oe && oe.button !== undefined && oe.button !== 0) return;
        app.state.boxSelect.active = true;
        app.state.boxSelect.startLatLng = e.latlng;
        try {
          app.state.map.dragging?.disable?.();
        } catch {
          // noop
        }
        const b = L.latLngBounds(e.latlng, e.latlng);
        ensureBoxRect(b);
      };

      const onMouseMove = (e) => {
        if (app.state.selectionMode !== "box") return;
        if (!app.state.map || !app.state.boxSelect.active || !app.state.boxSelect.startLatLng) return;
        const b = L.latLngBounds(app.state.boxSelect.startLatLng, e.latlng);
        ensureBoxRect(b);
      };

      const onMouseUp = (e) => {
        if (app.state.selectionMode !== "box") return;
        if (!app.state.map || !app.state.boxSelect.active || !app.state.boxSelect.startLatLng) return;
        const b = L.latLngBounds(app.state.boxSelect.startLatLng, e.latlng);
        app.state.boxSelect.active = false;
        app.state.boxSelect.startLatLng = null;
        try {
          app.state.map.dragging?.enable?.();
        } catch {
          // noop
        }
        clearBoxRect();
        // Ignora cliques (retângulo minúsculo)
        try {
          const sw = app.state.map.latLngToContainerPoint(b.getSouthWest());
          const ne = app.state.map.latLngToContainerPoint(b.getNorthEast());
          const w = Math.abs(ne.x - sw.x);
          const h = Math.abs(ne.y - sw.y);
          if (w < 6 && h < 6) return;
        } catch {
          // ignore
        }
        applyBoxSelection(b);
      };

      // Leaflet events (latlng garantido)
      app.state.map.on("mousedown", onMouseDown);
      app.state.map.on("mousemove", onMouseMove);
      app.state.map.on("mouseup", onMouseUp);

      // Limite Estadual: inicia ligado ao abrir o mapa.
      try {
        if (app.layerLimiteToggle && !app.layerLimiteToggle.disabled) app.layerLimiteToggle.checked = true;
      } catch {
        // noop
      }
      app.state.limiteEstadualUserHidden = false;
      void app.attachLimiteEstadualLayerIfNeeded().finally(() => {
        app.applyLimiteEstadualVisibility();
        app.bringLimiteEstadualToBackIfVisible();
      });

      // Estado inicial: somente Limite Estadual ligado (todas as camadas de dados desligadas).
      try {
        app.state.suppressAutoFit = true;
        app.turnOffAllDataLayersKeepLimiteEstadual();
      } catch {
        // ignore
      } finally {
        app.state.suppressAutoFit = false;
        app.syncLayerRowsToggleUi();
      }

      // Clique no mapa: identifica todas as camadas/feições sobrepostas no ponto.
      app.state.map.on("click", (e) => {
        app.handleIdentifyClick(e?.latlng, { zoomTo: true });
      });

      // Boot imediato: enquadra no Amazonas e libera splash.
      app.fitMapToStateBoundaryNow();
      app.setStatus("Dados: pronto", "ok");
      app.hideAppLoadingSplash();

      const schedule = (fn) => {
        // Sem delay: executa imediatamente.
        try {
          fn();
        } catch {
          // ignore
        }
      };

      /**
       * Warm-up: pré-carrega endpoints de camadas em background para que o 1º ligar/desligar
       * não tenha "delay" (o backend gera/cacheia GeoJSON e o navegador já deixa em cache HTTP).
       * Não adiciona nada ao mapa: apenas aquece.
       */
      const warmupLayerEndpoints = () => {
        // Só aquece endpoints de camadas presentes na UI (evita lixo de memória/rede).
        const urls = [
          "/layers/limite-estadual",
          "/layers/limite-municipal",
          "/layers/limite-municipal/polygons",
          app.layerBueirosToggle && "/layers/bueiros-br317",
          app.layerPontesToggle && "/layers/pontes-br307",
          app.layerJazidasToggle && "/layers/jazidas-br307/jazida-pontos",
          app.layerPontesBr319Toggle && "/layers/pontes-br319",
          app.layerPontesBr230Toggle && "/layers/pontes-br230",
          app.layerBueirosBr319Toggle && "/layers/bueiros-br319",
          app.layerBueirosBr174Toggle && "/layers/bueiros-br174",
          app.layerPradsBr174Toggle && "/layers/prads-br174",
          app.layerPcaPradsBr319Toggle && "/layers/pca-prads-br319",
          app.layerPradsBr319Toggle && "/layers/prads-br319",
          app.layerPcaPradsCmmBr319Toggle && "/layers/pca-prads-cmm-br319",
          app.layerBueirosBr230Toggle && "/layers/bueiros-br230",
          app.layerUcEstadualToggle && "/layers/uc-estadual",
          app.layerUcMunicipalToggle && "/layers/uc-municipal",
          app.layerIp4Toggle && "/layers/ip4",
          app.layerTiAmToggle && "/layers/ti-am",
          app.layerHidroviasAmToggle && "/layers/hidrovias-am",
        ].filter(Boolean);

        // Pré-aquece o cache compartilhado (mesma Promise usada ao ligar a camada).
        void Promise.allSettled(urls.map((u) => app.fetchLayerGeoJson(u)));
      };

      // Carrega shapefiles em background só depois que a UI aparecer.
      const startBackgroundLoad = () => {
        // Warm-up: pré-carrega GeoJSON em paralelo para o 1º ligar de camada ser imediato.
        warmupLayerEndpoints();
        fetch("/layers")
          .then((r) => r.json())
          .then(async (payload) => {
          const layers = payload?.layers || [];
          if (!layers.length) {
            // Fallback: endpoint antigo
            return { fallbackToData: true };
          }

          // Segmentos BR-319 removido: não pré-carregar "camada principal" no boot.
          // As camadas são carregadas sob demanda quando o usuário liga no switch.
          const toFetch = [];
          const settled = await Promise.allSettled(
            toFetch.map(async (item) => {
              const rr = await fetch(`/layers/${item.id}`);
              if (!rr.ok) throw new Error((await rr.text()) || rr.statusText);
              const data = await rr.json();
              return { item, data };
            }),
          );
          let primarySet = false;

          for (const res of settled) {
            if (res.status !== "fulfilled") continue;
            const { item, data } = res.value || {};
            try {
              const originalFeatures = data?.features || [];
              const mapped = originalFeatures.map((f, idx) => ({ ...f, _tableIndex: idx }));
              data.features = mapped;

              const name = String(item?.name || "");
              const isBoundary = /limite/i.test(name);
              const isSegmentos = /segmentos/i.test(name);
              const lowerName = name.toLowerCase();

              // Evita duplicar o Limite Estadual:
              // a camada oficial com pane/visibilidade é criada por `attachLimiteEstadualLayerIfNeeded()`.
              if (isBoundary) {
                continue;
              }

              const inferSelectionKindFromLayerName = () => {
                // Rodovias / estruturas
                // Importante: NUNCA classificar BUEIROS como SNV.
                // Alguns shapefiles/nomes podem conter "snv" em campos/descrições; se for bueiro, mantém como bueiro.
                const isBueiroLayer = lowerName.includes("bueir");
                const isSnvLayer = lowerName.includes("snv");
                const inRodoviaFolder = lowerName.includes("/rodovia/") || lowerName.includes("\\rodovia\\");
                const inBueirosFolder = lowerName.includes("/bueiros/") || lowerName.includes("\\bueiros\\");

                // Heurística forte por pasta: se está em RODOVIA e tem SNV → SNV.
                // Se está em BUEIROS → BUEIROS.
                if (inBueirosFolder && /br-?\s*319/i.test(name)) return "bueiros-br319";
                if (inBueirosFolder && /br-?\s*317/i.test(name)) return "bueiros";
                if (inBueirosFolder && /br-?\s*174/i.test(name)) return "bueiros-br174";
                if (inBueirosFolder && /br-?\s*230/i.test(name)) return "bueiros-br230";

                // SNV somente quando NÃO for bueiro.

                if (lowerName.includes("bueir") && /br-?\s*319/i.test(name)) return "bueiros-br319";
                if (lowerName.includes("bueir") && /br-?\s*317/i.test(name)) return "bueiros";
                if (lowerName.includes("bueir") && /br-?\s*174/i.test(name)) return "bueiros-br174";
                if (lowerName.includes("bueir") && /br-?\s*230/i.test(name)) return "bueiros-br230";
                if (lowerName.includes("ponte") && /br-?\s*319/i.test(name)) return "pontes-br319";
                if (lowerName.includes("ponte") && /br-?\s*307/i.test(name)) return "pontes";
                if (lowerName.includes("jazid")) return "jazidas";
                if (lowerName.includes("cmm") && (lowerName.includes("pca") || lowerName.includes("prad"))) return "pca-prads-cmm-br319";
                if (lowerName.includes("pca")) return "pca-prads-br319";
                if (lowerName.includes("pca")) return "prads-br319";
                if (lowerName.includes("prad")) return "prads-br174";
                // Meio ambiente
                if (lowerName.includes("uc") && lowerName.includes("estad")) return "uc-estadual";
                if (lowerName.includes("uc") && lowerName.includes("munic")) return "uc-municipal";
                // Default: ignorar (não criar camada genérica no mapa)
                return "";
              };

              const inferredKind = inferSelectionKindFromLayerName();

              // Segmentos BR-319 removido: não construir nem adicionar ao mapa.
              if (isSegmentos || inferredKind === "segmentos" || !inferredKind) {
                continue;
              }

              const layer = L.geoJSON(data, {
                style: (feature) => app.getSegmentLayerStyle(feature),
                pointToLayer(_feature, latlng) {
                  return app.pointAsCircleMarker(latlng);
                },
              });

              // Não existe mais "camada principal" de segmentos.
              const shouldBePrimary = false;
              if (shouldBePrimary && !primarySet) {
                primarySet = true;
                app.state.geojsonLayer = layer;
                app.state.allFeatures = mapped;
                app.state.totalFeaturesCount = mapped.length;
                app.state.visibleFeaturesCount = mapped.length;
                app.updateGeneralSelectionInfo(0);

                layer.eachLayer((leafletLayer) => {
                  const f = leafletLayer.feature;
                  const idx = f?._tableIndex;
                  if (typeof idx === "number") app.state.layersByIndex[idx] = leafletLayer;
                });

                layer.eachLayer((leafletLayer) => {
                  const f = leafletLayer.feature;
                  app.setLayerIdentifyMeta(leafletLayer, f, "segmentos");
                  app.attachQuickHover(leafletLayer, f, "segmentos");
                  app.bindLayerIdentifyClick(leafletLayer);
                });

                app.state.boundsAll = layer.getBounds();
                // Segmentos BR-319 removido do mapa (não adicionar).
              }

              // Para camadas não-primárias: habilita hover/click com selectionKind inferido,
              // garantindo que (ex.) BUEIROS BR-319 e SNV sejam tratados como camadas diferentes.
              if (!shouldBePrimary) {
                layer.eachLayer((leafletLayer) => {
                  const f = leafletLayer.feature;
                  app.setLayerIdentifyMeta(leafletLayer, f, inferredKind);
                  app.attachQuickHover(leafletLayer, f, inferredKind);
                  app.bindLayerIdentifyClick(leafletLayer);
                });

                // Adiciona ao mapa se estiver ligado no menu (camadas fora do menu já são controladas por toggles dedicados)
                // Para não mudar comportamento existente, mantém camadas "descobertas" desligadas por padrão.
              }
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn("Falha ao processar camada", item, e);
            }
          }

          // Limite Estadual não é carregado automaticamente; somente quando o usuário ligar no switch.

          const segmentsOn = Boolean(app.layerSegmentosToggle?.checked);
          if (segmentsOn && app.state.boundsAll?.isValid?.()) {
            app.state.map.fitBounds(app.state.boundsAll, { animate: false, duration: 0 });
          } else {
            const bb = app.state.boundaryLayer?.getBounds?.();
            if (bb?.isValid?.()) {
              app.state.map.fitBounds(bb, { animate: false, duration: 0 });
            }
          }

          app.renderAllAttributesTable();
          app.setupHeaderSortClick();

          app.refreshContractOptions();
          void app.ensureContractSourcesLoaded();

          // Não força Limite Estadual na inicialização.
          if (app.layerLimiteToggle) app.layerLimiteToggle.disabled = false;
          app.layerLimiteRow?.classList.remove("layer-row--disabled");

          // Se o usuário clicou em "Segmentos" (enquadrar) antes de carregar, aplica agora.
          if (app.state.pendingFitSegmentos) {
            app.state.pendingFitSegmentos = false;
            if (app.state.geojsonLayer && app.state.map) {
              if (app.layerSegmentosToggle) app.layerSegmentosToggle.checked = true;
              if (!app.state.map.hasLayer(app.state.geojsonLayer)) {
                app.mountDataLayerIfAllowed(app.state.geojsonLayer, app.layerSegmentosToggle);
                if (app.state.geojsonLayer.bringToFront) app.state.geojsonLayer.bringToFront();
              }
              const b = app.state.geojsonLayer.getBounds?.();
              if (b?.isValid?.()) {
                app.state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24] });
              }
            }
          }

          app.bringLimiteEstadualToBackIfVisible();

          app.setStatus(`Dados: ${app.state.totalFeaturesCount} feições`);
          return { fallbackToData: false };
        })
        .then((res) => {
          if (!res?.fallbackToData) return;

          // Fallback legacy
          return fetch("/data")
            .then((r) => r.json())
            .then(async (data) => {
              const originalFeatures = data.features || [];
              app.state.allFeatures = originalFeatures.map((f, idx) => ({ ...f, _tableIndex: idx }));
              app.state.totalFeaturesCount = app.state.allFeatures.length;
              app.state.visibleFeaturesCount = app.state.allFeatures.length;
              app.updateGeneralSelectionInfo(0);
              data.features = app.state.allFeatures;

              app.state.geojsonLayer = L.geoJSON(data, {
                style: (feature) => {
                  return app.getSegmentLayerStyle(feature);
                },
                onEachFeature: (feature, layer) => {
                  const idx = feature._tableIndex;
                  if (typeof idx === "number") app.state.layersByIndex[idx] = layer;
                  app.setLayerIdentifyMeta(layer, feature, "segmentos");
                  app.attachQuickHover(layer, feature, "segmentos");
                  app.bindLayerIdentifyClick(layer);
                },
              });

              if (app.layerSegmentosToggle?.checked) {
                app.mountDataLayerIfAllowed(app.state.geojsonLayer, app.layerSegmentosToggle);
              }

              app.state.boundsAll = app.state.geojsonLayer.getBounds();
              // Limite Estadual não é carregado automaticamente; somente quando o usuário ligar no switch.
              const segmentsOnFb = Boolean(app.layerSegmentosToggle?.checked);
              if (segmentsOnFb && app.state.boundsAll?.isValid?.()) {
                app.state.map.fitBounds(app.state.boundsAll, { animate: false, duration: 0 });
              } else {
                const bbLim = app.state.boundaryLayer?.getBounds?.();
                if (bbLim?.isValid?.()) {
                  app.state.map.fitBounds(bbLim, { animate: false, duration: 0 });
                }
              }

              // Não força Limite Estadual na inicialização.
              if (app.layerLimiteToggle) app.layerLimiteToggle.disabled = false;
              app.layerLimiteRow?.classList.remove("layer-row--disabled");
              app.bringLimiteEstadualToBackIfVisible();

              if (app.state.pendingFitSegmentos) {
                app.state.pendingFitSegmentos = false;
                if (app.layerSegmentosToggle) app.layerSegmentosToggle.checked = true;
                if (!app.state.map.hasLayer(app.state.geojsonLayer)) {
                  app.mountDataLayerIfAllowed(app.state.geojsonLayer, app.layerSegmentosToggle);
                  if (app.state.geojsonLayer.bringToFront) app.state.geojsonLayer.bringToFront();
                }
                const b = app.state.geojsonLayer.getBounds?.();
                if (b?.isValid?.()) {
                  app.state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24] });
                }
              }

              app.renderAllAttributesTable();
              app.setupHeaderSortClick();

              app.refreshContractOptions();
              void app.ensureContractSourcesLoaded();

              app.setStatus(`Dados: ${app.state.totalFeaturesCount} feições`);
            });
          })
          .catch((err) => {
            console.error(err);
            app.setStatus("Dados: erro ao carregar", "error");
          });
      };
      // Sem delay para iniciar carga pesada
      startBackgroundLoad();
    }

  app.boot = function boot() {
    app.setThemePreference(app.loadThemePreference());
    app.bindUi();
    app.initMap();
    try {
      app.renderLayerLegend();
    } catch {
      // ignore
    }
  };

}
