/* global L */
export function registerLayers(app) {

  app.tryFindLoadedLayerByProps = function tryFindLoadedLayerByProps(kind, props) {
      const p = props || {};
      const pick = (x) => app.normalizeSearchText(x);
      const wantCode = pick(app.firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]));
      const wantName = pick(app.firstPropValueByKeyHints(p, ["nome", "NOME", "descricao", "DESCRICAO", "terrai_nom"]));
      const match = (pp) => {
        const code = pick(app.firstPropValueByKeyHints(pp, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]));
        if (wantCode && code && code === wantCode) return true;
        const nm = pick(app.firstPropValueByKeyHints(pp, ["nome", "NOME", "descricao", "DESCRICAO", "terrai_nom"]));
        if (wantName && nm && nm === wantName) return true;
        return false;
      };

      const table = {
        bueiros: [app.state.bueirosFeatures, app.state.bueirosLayersByIndex],
        pontes: [app.state.pontesFeatures, app.state.pontesLayersByIndex],
        jazidas: [app.state.jazidasFeatures, app.state.jazidasLayersByIndex],
        "pontes-br319": [app.state.pontesBr319Features, app.state.pontesBr319LayersByIndex],
        "pontes-br230": [app.state.pontesBr230Features, app.state.pontesBr230LayersByIndex],
        "bueiros-br319": [app.state.bueirosBr319Features, app.state.bueirosBr319LayersByIndex],
        "bueiros-br174": [app.state.bueirosBr174Features, app.state.bueirosBr174LayersByIndex],
        "bueiros-br230": [app.state.bueirosBr230Features, app.state.bueirosBr230LayersByIndex],
        "prads-br174": [app.state.pradsBr174Features, app.state.pradsBr174LayersByIndex],
        "pca-prads-br319": [app.state.pcaPradsBr319Features, app.state.pcaPradsBr319LayersByIndex],
        "prads-br319": [app.state.pradsBr319Features, app.state.pradsBr319LayersByIndex],
        "pca-prads-cmm-br319": [app.state.pcaPradsCmmBr319Features, app.state.pcaPradsCmmBr319LayersByIndex],
        "uc-estadual": [app.state.ucEstadualFeatures, app.state.ucEstadualLayersByIndex],
        "uc-municipal": [app.state.ucMunicipalFeatures, app.state.ucMunicipalLayersByIndex],
        "ti-am": [app.state.tiAmFeatures, app.state.tiAmLayersByIndex],
        ip4: [app.state.ip4Features, app.state.ip4LayersByIndex],
        segmentos: [app.state.allFeatures, app.state.layersByIndex],
      };
      const pair = table[kind];
      const feats = pair?.[0] || [];
      const layers = pair?.[1] || {};
      for (let i = 0; i < feats.length; i++) {
        const f = feats[i];
        if (!f?.properties) continue;
        if (match(f.properties)) {
          const idx =
            f._tableIndex ??
            f._bueirosIndex ??
            f._pontesIndex ??
            f._jazidasIndex ??
            f._tiAmIndex ??
            f._ip4Index ??
            f._ucEstadualIndex ??
            f._ucMunicipalIndex ??
            i;
          return { feature: f, layer: layers[idx] || null };
        }
      }
      return null;
    }

  app.layerGeoJsonFetchByUrl = new Map();

  app.fetchLayerGeoJson = function fetchLayerGeoJson(url) {
      const key = String(url || "");
      if (!key) return Promise.reject(new Error("URL vazia"));
      const cached = app.layerGeoJsonFetchByUrl.get(key);
      if (cached) return cached;
      const promise = fetch(key)
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.text()) || r.statusText);
          return r.json();
        })
        .catch((err) => {
          app.layerGeoJsonFetchByUrl.delete(key);
          throw err;
        });
      app.layerGeoJsonFetchByUrl.set(key, promise);
      return promise;
    }

  app.clearEphemeralClientCaches = function clearEphemeralClientCaches({ keepLimiteEndpoints = true } = {}) {
      try {
        app.state.searchCache = {};
      } catch {
        // ignore
      }
      try {
        app.featureColors.clear();
        app.colorIndex = 0;
      } catch {
        // ignore
      }
      try {
        if (!keepLimiteEndpoints) {
          app.layerGeoJsonFetchByUrl.clear();
        } else {
          for (const key of Array.from(app.layerGeoJsonFetchByUrl.keys())) {
            if (String(key).includes("limite-estadual")) continue;
            app.layerGeoJsonFetchByUrl.delete(key);
          }
        }
      } catch {
        // ignore
      }
      try {
        if (app.state.mapClickTables && typeof app.state.mapClickTables === "object") {
          app.state.mapClickTables = {};
        }
      } catch {
        // ignore
      }
    }

  app.setStatus = function setStatus(text, _kind = "ok") {
      if (!app.statusEl) return;
      app.statusEl.textContent = text;
      if (app.statusEl.parentElement) app.statusEl.parentElement.style.opacity = "1";
    }

  app.fetchBueirosBr317Info = function fetchBueirosBr317Info() {
      return fetch("/layers/bueiros-br317/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.applyBueirosAvailability = function applyBueirosAvailability(info) {
      if (!app.layerBueirosToggle) return;
      if (!info?.available) {
        if (app.layerBueirosHint) app.layerBueirosHint.textContent = "Indisponível (assets/BR-317)";
        app.layerBueirosToggle.disabled = true;
        app.layerBueirosToggle.checked = false;
        app.layerBueirosRow?.classList.add("layer-row--disabled");
        if (app.state.bueirosLayer && app.state.map) app.state.map.removeLayer(app.state.bueirosLayer);
        app.state.bueirosFeatures = [];
        app.state.bueirosLayersByIndex = {};
        app.state.bueirosColumnKeys = [];
        app.state.bueirosSelectedIndex = null;
        if (app.state.tableDataset === "bueiros") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerBueirosToggle.disabled = false;
      app.layerBueirosRow?.classList.remove("layer-row--disabled");
      if (app.layerBueirosHint) app.layerBueirosHint.textContent = "BR-317";
    }

  app.collectBueirosColumnKeys = function collectBueirosColumnKeys(features) {
      return app.collectColumnKeysFromFeatures(features);
    }

  app.ensureBueirosBr317OnMap = async function ensureBueirosBr317OnMap() {
      if (!app.state.map || !app.layerBueirosToggle?.checked) return;
      if (app.state.bueirosLayer) {
        app.mountDataLayerIfAllowed(app.state.bueirosLayer, app.layerBueirosToggle);
        if (app.state.bueirosLayer.bringToFront) app.state.bueirosLayer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.bueirosLoading) return;
      app.state.bueirosLoading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/bueiros-br317");
        // Se o usuário desligou enquanto carregava, não renderiza/adiciona no mapa.
        if (!app.layerBueirosToggle?.checked || !app.state.map) return;
        const rawFeats = data.features || [];
        const feats = rawFeats.map((f, i) => ({ ...f, _bueirosIndex: i }));
        data.features = feats;
        app.state.bueirosFeatures = feats;
        app.state.bueirosLayersByIndex = {};
        app.state.bueirosColumnKeys = app.collectBueirosColumnKeys(feats);

        app.state.bueirosLayer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createBueirosPointIcon("bueiros"),
              interactive: true,
              riseOnHover: true,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") {
              return app.getBueirosLineStyle();
            }
            if (t === "Polygon" || t === "MultiPolygon") {
              return app.getBueirosPolygonStyle();
            }
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._bueirosIndex;
            if (typeof idx === "number") app.state.bueirosLayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "bueiros");
            app.attachQuickHover(lyr, feature, "bueiros");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.bueirosLayer, app.layerBueirosToggle);
        if (app.state.bueirosLayer.bringToFront) app.state.bueirosLayer.bringToFront();
        if (app.state.totalFeaturesCount > 0) {
          app.setStatus(`Dados: ${app.state.totalFeaturesCount} feições`);
        } else {
          app.setStatus("Dados: pronto");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("Bueiros: não carregado (verifique Z: e shapefile)", "error");
        app.layerBueirosToggle.checked = false;
        app.state.bueirosFeatures = [];
        app.state.bueirosLayersByIndex = {};
        app.state.bueirosColumnKeys = [];
        app.state.bueirosLayer = null;
      } finally {
        app.state.bueirosLoading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.fetchPontesBr307Info = function fetchPontesBr307Info() {
      return fetch("/layers/pontes-br307/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchJazidasBr307Info = function fetchJazidasBr307Info() {
      return fetch("/layers/jazidas-br307/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchBueirosBr174Info = function fetchBueirosBr174Info() {
      return fetch("/layers/bueiros-br174/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchPradsBr174Info = function fetchPradsBr174Info() {
      return fetch("/layers/prads-br174/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchPcaPradsBr319Info = function fetchPcaPradsBr319Info() {
      return fetch("/layers/pca-prads-br319/info")
        .then(async (r) => {
          if (!r.ok) return { available: false, message: `HTTP ${r.status}` };
          return r.json();
        })
        .catch(() => ({ available: false }));
    }

  app.fetchPradsBr319Info = function fetchPradsBr319Info() {
      return fetch("/layers/prads-br319/info")
        .then(async (r) => {
          if (!r.ok) return { available: false, message: `HTTP ${r.status}` };
          return r.json();
        })
        .catch(() => ({ available: false }));
    }

  app.fetchPcaPradsCmmBr319Info = function fetchPcaPradsCmmBr319Info() {
      return fetch("/layers/pca-prads-cmm-br319/info")
        .then(async (r) => {
          if (!r.ok) return { available: false, message: `HTTP ${r.status}` };
          return r.json();
        })
        .catch(() => ({ available: false }));
    }

  app.fetchBueirosBr230Info = function fetchBueirosBr230Info() {
      return fetch("/layers/bueiros-br230/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchUcEstadualInfo = function fetchUcEstadualInfo() {
      return fetch("/layers/uc-estadual/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchUcMunicipalInfo = function fetchUcMunicipalInfo() {
      return fetch("/layers/uc-municipal/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchIp4Info = function fetchIp4Info() {
      return fetch("/layers/ip4/info")
        .then((r) => {
          // Se o backend ainda não tiver sido reiniciado (404), não bloquear o switch.
          if (!r.ok) return { available: true, _unknown: true };
          return r.json();
        })
        .catch(() => ({ available: true, _unknown: true }));
    }

  app.fetchHidroviasAmInfo = function fetchHidroviasAmInfo() {
      return fetch("/layers/hidrovias-am/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchTiAmInfo = function fetchTiAmInfo() {
      return fetch("/layers/ti-am/info")
        .then((r) => {
          // Se o backend ainda não tiver sido reiniciado (404), não bloquear o switch.
          if (!r.ok) return { available: true, _unknown: true };
          return r.json();
        })
        .catch(() => ({ available: true, _unknown: true }));
    }

  app.applyPontesAvailability = function applyPontesAvailability(info) {
      if (!app.layerPontesToggle) return;
      if (!info?.available) {
        if (app.layerPontesHint) app.layerPontesHint.textContent = "Indisponível (assets/BR-307/PONTES)";
        app.layerPontesToggle.disabled = true;
        app.layerPontesToggle.checked = false;
        app.layerPontesRow?.classList.add("layer-row--disabled");
        if (app.state.pontesBr307Layer && app.state.map) app.state.map.removeLayer(app.state.pontesBr307Layer);
        app.state.pontesFeatures = [];
        app.state.pontesLayersByIndex = {};
        return;
      }
      app.layerPontesToggle.disabled = false;
      app.layerPontesRow?.classList.remove("layer-row--disabled");
      if (app.layerPontesHint) {
        app.layerPontesHint.textContent = info.shapefile ? String(info.shapefile).replace(/\.shp$/i, "") : "BR-307";
      }
    }

  app.fetchPontesBr319Info = function fetchPontesBr319Info() {
      return fetch("/layers/pontes-br319/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.fetchPontesBr230Info = function fetchPontesBr230Info() {
      return fetch("/layers/pontes-br230/info")
        .then((r) => (r.ok ? r.json() : { available: false }))
        .catch(() => ({ available: false }));
    }

  app.fetchBueirosBr319Info = function fetchBueirosBr319Info() {
      return fetch("/layers/bueiros-br319/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.applyPontesBr319Availability = function applyPontesBr319Availability(info) {
      if (!app.layerPontesBr319Toggle) return;
      if (!info?.available) {
        if (app.layerPontesBr319Hint) app.layerPontesBr319Hint.textContent = "Indisponível (assets/BR-319)";
        app.layerPontesBr319Toggle.disabled = true;
        app.layerPontesBr319Toggle.checked = false;
        app.layerPontesBr319Row?.classList.add("layer-row--disabled");
        if (app.state.pontesBr319Layer && app.state.map) app.state.map.removeLayer(app.state.pontesBr319Layer);
        app.state.pontesBr319Features = [];
        app.state.pontesBr319LayersByIndex = {};
        app.state.pontesBr319ColumnKeys = [];
        if (app.state.tableDataset === "pontes-br319") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerPontesBr319Toggle.disabled = false;
      app.layerPontesBr319Row?.classList.remove("layer-row--disabled");
      if (app.layerPontesBr319Hint) {
        app.layerPontesBr319Hint.textContent = info.shapefile ? String(info.shapefile).replace(/\.shp$/i, "") : "BR-319";
      }
    }

  app.applyPontesBr230Availability = function applyPontesBr230Availability(info) {
      if (!app.layerPontesBr230Toggle) return;
      if (!info?.available) {
        if (app.layerPontesBr230Hint) app.layerPontesBr230Hint.textContent = "Indisponível (assets/BR-230/PONTES_BR230)";
        app.layerPontesBr230Toggle.disabled = true;
        app.layerPontesBr230Toggle.checked = false;
        app.layerPontesBr230Row?.classList.add("layer-row--disabled");
        if (app.state.pontesBr230Layer && app.state.map) app.state.map.removeLayer(app.state.pontesBr230Layer);
        app.state.pontesBr230Features = [];
        app.state.pontesBr230LayersByIndex = {};
        app.state.pontesBr230ColumnKeys = [];
        app.state.pontesBr230Layer = null;
        if (app.state.tableDataset === "pontes-br230") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerPontesBr230Toggle.disabled = false;
      app.layerPontesBr230Row?.classList.remove("layer-row--disabled");
      if (app.layerPontesBr230Hint) app.layerPontesBr230Hint.textContent = "BR-230";
    }

  app.applyBueirosBr319Availability = function applyBueirosBr319Availability(info) {
      if (!app.layerBueirosBr319Toggle) return;
      if (!info?.available) {
        if (app.layerBueirosBr319Hint) app.layerBueirosBr319Hint.textContent = "Indisponível (assets/BR-319/SHP_BUEIRO)";
        app.layerBueirosBr319Toggle.disabled = true;
        app.layerBueirosBr319Toggle.checked = false;
        app.layerBueirosBr319Row?.classList.add("layer-row--disabled");
        if (app.state.bueirosBr319Layer && app.state.map) app.state.map.removeLayer(app.state.bueirosBr319Layer);
        app.state.bueirosBr319Layer = null;
        app.state.bueirosBr319Features = [];
        app.state.bueirosBr319LayersByIndex = {};
        app.state.bueirosBr319SelectedIndex = null;
        app.state.bueirosBr319ColumnKeys = [];
        if (app.state.tableDataset === "bueiros-br319") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerBueirosBr319Toggle.disabled = false;
      app.layerBueirosBr319Row?.classList.remove("layer-row--disabled");
      if (app.layerBueirosBr319Hint) {
        app.layerBueirosBr319Hint.textContent = "BR-319";
      }
    }

  app.applyBueirosBr174Availability = function applyBueirosBr174Availability(info) {
      if (!app.layerBueirosBr174Toggle) return;
      if (!info?.available) {
        if (app.layerBueirosBr174Hint) app.layerBueirosBr174Hint.textContent = "Indisponível (assets/BR-174)";
        app.layerBueirosBr174Toggle.disabled = true;
        app.layerBueirosBr174Toggle.checked = false;
        app.layerBueirosBr174Row?.classList.add("layer-row--disabled");
        if (app.state.bueirosBr174Layer && app.state.map) app.state.map.removeLayer(app.state.bueirosBr174Layer);
        app.state.bueirosBr174Layer = null;
        return;
      }
      app.layerBueirosBr174Toggle.disabled = false;
      app.layerBueirosBr174Row?.classList.remove("layer-row--disabled");
      if (app.layerBueirosBr174Hint) {
        app.layerBueirosBr174Hint.textContent = "BR-174";
      }
    }

  app.applyPradsBr174Availability = function applyPradsBr174Availability(info) {
      if (!app.layerPradsBr174Toggle) return;
      if (!info?.available) {
        if (app.layerPradsBr174Hint) app.layerPradsBr174Hint.textContent = "Indisponível (assets/BR-174)";
        app.layerPradsBr174Toggle.disabled = true;
        app.layerPradsBr174Toggle.checked = false;
        app.layerPradsBr174Row?.classList.add("layer-row--disabled");
        if (app.state.pradsBr174Layer && app.state.map) app.state.map.removeLayer(app.state.pradsBr174Layer);
        app.state.pradsBr174Layer = null;
        return;
      }
      app.layerPradsBr174Toggle.disabled = false;
      app.layerPradsBr174Row?.classList.remove("layer-row--disabled");
      if (app.layerPradsBr174Hint) {
        app.layerPradsBr174Hint.textContent = info.shapefile ? String(info.shapefile).replace(/\.shp$/i, "") : "BR-174";
      }
    }

  app.applyPcaPradsBr319Availability = function applyPcaPradsBr319Availability(info) {
      if (!app.layerPcaPradsBr319Toggle) return;
      if (!info?.available) {
        if (app.layerPcaPradsBr319Hint) {
          app.layerPcaPradsBr319Hint.textContent = "Indisponível (assets/BR-319/PCA_PRAD)";
        }
        app.layerPcaPradsBr319Toggle.disabled = true;
        app.layerPcaPradsBr319Toggle.checked = false;
        app.layerPcaPradsBr319Row?.classList.add("layer-row--disabled");
        if (app.state.pcaPradsBr319Layer && app.state.map) app.state.map.removeLayer(app.state.pcaPradsBr319Layer);
        app.state.pcaPradsBr319Layer = null;
        return;
      }
      app.layerPcaPradsBr319Toggle.disabled = false;
      app.layerPcaPradsBr319Row?.classList.remove("layer-row--disabled");
      if (app.layerPcaPradsBr319Hint) {
        app.layerPcaPradsBr319Hint.textContent = info.shapefile
          ? String(info.shapefile).replace(/\.shp$/i, "")
          : "BR-319";
      }
    }

  app.applyPradsBr319Availability = function applyPradsBr319Availability(info) {
      if (!app.layerPradsBr319Toggle) return;
      if (!info?.available) {
        if (app.layerPradsBr319Hint) {
          app.layerPradsBr319Hint.textContent = "Indisponível (assets/BR-319/SP_PRADES_NOVO/PRADs_BR 319)";
        }
        app.layerPradsBr319Toggle.disabled = true;
        app.layerPradsBr319Toggle.checked = false;
        app.layerPradsBr319Row?.classList.add("layer-row--disabled");
        if (app.state.pradsBr319Layer && app.state.map) app.state.map.removeLayer(app.state.pradsBr319Layer);
        app.state.pradsBr319Layer = null;
        return;
      }
      app.layerPradsBr319Toggle.disabled = false;
      app.layerPradsBr319Row?.classList.remove("layer-row--disabled");
      if (app.layerPradsBr319Hint) {
        app.layerPradsBr319Hint.textContent = info.shapefile
          ? String(info.shapefile).replace(/\.shp$/i, "")
          : "BR-319";
      }
    }

  app.applyPcaPradsCmmBr319Availability = function applyPcaPradsCmmBr319Availability(info) {
      if (!app.layerPcaPradsCmmBr319Toggle) return;
      if (!info?.available) {
        if (app.layerPcaPradsCmmBr319Hint) {
          app.layerPcaPradsCmmBr319Hint.textContent = "Indisponível (assets/BR-319/PCA_PRAD_CMM)";
        }
        app.layerPcaPradsCmmBr319Toggle.disabled = true;
        app.layerPcaPradsCmmBr319Toggle.checked = false;
        app.layerPcaPradsCmmBr319Row?.classList.add("layer-row--disabled");
        if (app.state.pcaPradsCmmBr319Layer && app.state.map) app.state.map.removeLayer(app.state.pcaPradsCmmBr319Layer);
        app.state.pcaPradsCmmBr319Layer = null;
        return;
      }
      app.layerPcaPradsCmmBr319Toggle.disabled = false;
      app.layerPcaPradsCmmBr319Row?.classList.remove("layer-row--disabled");
      if (app.layerPcaPradsCmmBr319Hint) {
        app.layerPcaPradsCmmBr319Hint.textContent = info.shapefile
          ? String(info.shapefile).replace(/\.shp$/i, "")
          : "BR-319";
      }
    }

  app.applyBueirosBr230Availability = function applyBueirosBr230Availability(info) {
      if (!app.layerBueirosBr230Toggle) return;
      if (!info?.available) {
        if (app.layerBueirosBr230Hint) app.layerBueirosBr230Hint.textContent = "Indisponível (assets/BR-230)";
        app.layerBueirosBr230Toggle.disabled = true;
        app.layerBueirosBr230Toggle.checked = false;
        app.layerBueirosBr230Row?.classList.add("layer-row--disabled");
        if (app.state.bueirosBr230Layer && app.state.map) app.state.map.removeLayer(app.state.bueirosBr230Layer);
        app.state.bueirosBr230Layer = null;
        app.state.bueirosBr230Features = [];
        app.state.bueirosBr230LayersByIndex = {};
        return;
      }
      app.layerBueirosBr230Toggle.disabled = false;
      app.layerBueirosBr230Row?.classList.remove("layer-row--disabled");
      if (app.layerBueirosBr230Hint) {
        app.layerBueirosBr230Hint.textContent = "BR-230";
      }
    }

  app.ensurePontesBr319OnMap = async function ensurePontesBr319OnMap() {
      if (!app.state.map || !app.layerPontesBr319Toggle?.checked) return;
      if (app.state.pontesBr319Layer) {
        app.mountDataLayerIfAllowed(app.state.pontesBr319Layer, app.layerPontesBr319Toggle);
        if (app.state.pontesBr319Layer.bringToFront) app.state.pontesBr319Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.pontesBr319Loading) return;
      app.state.pontesBr319Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/pontes-br319");
        const rawFeats = data.features || [];
        const featsP = rawFeats.map((f, i) => ({ ...f, _pontesBr319Index: i }));
        data.features = featsP;
        app.state.pontesBr319Features = featsP;
        app.state.pontesBr319LayersByIndex = {};

        app.state.pontesBr319Layer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createPontesPointIcon("pontes-br319"),
              interactive: true,
              riseOnHover: true,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") {
              return app.isSatelliteBasemapActive()
                ? { color: "#bae6fd", weight: 4.2, opacity: 0.98 }
                : { color: "#0ea5e9", weight: 3.8, opacity: 0.92 };
            }
            if (t === "Polygon" || t === "MultiPolygon") {
              return app.isSatelliteBasemapActive()
                ? { color: "#bae6fd", weight: 2.2, fillColor: "#7dd3fc", fillOpacity: 0.36 }
                : { color: "#0ea5e9", weight: 2.0, fillColor: "#7dd3fc", fillOpacity: 0.22 };
            }
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._pontesBr319Index;
            if (typeof idx === "number") app.state.pontesBr319LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "pontes-br319");
            app.attachQuickHover(lyr, feature, "pontes-br319");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.pontesBr319Layer, app.layerPontesBr319Toggle);
        if (app.state.pontesBr319Layer.bringToFront) app.state.pontesBr319Layer.bringToFront();
        if (app.state.totalFeaturesCount > 0) {
          app.setStatus(`Dados: ${app.state.totalFeaturesCount} feições`);
        } else {
          app.setStatus("Dados: pronto");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("Pontes BR-319: não carregado (verifique Z: e shapefile)", "error");
        if (app.layerPontesBr319Toggle) app.layerPontesBr319Toggle.checked = false;
        app.state.pontesBr319Features = [];
        app.state.pontesBr319LayersByIndex = {};
        app.state.pontesBr319Layer = null;
      } finally {
        app.state.pontesBr319Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensurePontesBr230OnMap = async function ensurePontesBr230OnMap() {
      if (!app.state.map || !app.layerPontesBr230Toggle?.checked) return;
      if (app.state.pontesBr230Layer) {
        app.mountDataLayerIfAllowed(app.state.pontesBr230Layer, app.layerPontesBr230Toggle);
        if (app.state.pontesBr230Layer.bringToFront) app.state.pontesBr230Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.pontesBr230Loading) return;
      app.state.pontesBr230Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/pontes-br230");
        const rawFeats = data.features || [];
        const featsP = rawFeats.map((f, i) => ({ ...f, _pontesBr230Index: i }));
        data.features = featsP;
        app.state.pontesBr230Features = featsP;
        app.state.pontesBr230LayersByIndex = {};

        app.state.pontesBr230Layer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createPontesPointIcon("pontes-br230"),
              interactive: true,
              riseOnHover: true,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") {
              return app.isSatelliteBasemapActive()
                ? { color: "#c4b5fd", weight: 4.2, opacity: 0.98 }
                : { color: "#7c3aed", weight: 3.8, opacity: 0.92 };
            }
            if (t === "Polygon" || t === "MultiPolygon") {
              return app.isSatelliteBasemapActive()
                ? { color: "#c4b5fd", weight: 2.2, fillColor: "#ddd6fe", fillOpacity: 0.36 }
                : { color: "#7c3aed", weight: 2.0, fillColor: "#ddd6fe", fillOpacity: 0.22 };
            }
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._pontesBr230Index;
            if (typeof idx === "number") app.state.pontesBr230LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "pontes-br230");
            app.attachQuickHover(lyr, feature, "pontes-br230");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.pontesBr230Layer, app.layerPontesBr230Toggle);
        if (app.state.pontesBr230Layer.bringToFront) app.state.pontesBr230Layer.bringToFront();
        if (app.state.totalFeaturesCount > 0) {
          app.setStatus(`Dados: ${app.state.totalFeaturesCount} feições`);
        } else {
          app.setStatus("Dados: pronto");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("Pontes BR-230: não carregado (verifique assets/BR-230/PONTES_BR230)", "error");
        if (app.layerPontesBr230Toggle) app.layerPontesBr230Toggle.checked = false;
        app.state.pontesBr230Features = [];
        app.state.pontesBr230LayersByIndex = {};
        app.state.pontesBr230Layer = null;
      } finally {
        app.state.pontesBr230Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensureBueirosBr319OnMap = async function ensureBueirosBr319OnMap() {
      if (!app.state.map || !app.layerBueirosBr319Toggle?.checked) return;
      if (app.state.bueirosBr319Layer) {
        app.mountDataLayerIfAllowed(app.state.bueirosBr319Layer, app.layerBueirosBr319Toggle);
        if (app.state.bueirosBr319Layer.bringToFront) app.state.bueirosBr319Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.bueirosBr319Loading) return;
      app.state.bueirosBr319Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/bueiros-br319");

        const rawFeats = data.features || [];
        const feats = rawFeats.map((f, i) => ({ ...f, _bueirosBr319Index: i }));
        data.features = feats;

        app.state.bueirosBr319Features = feats;
        app.state.bueirosBr319LayersByIndex = {};

        const layer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createBueirosPointIcon("bueiros-br319"),
              interactive: true,
              riseOnHover: true,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") return app.getBueirosLineStyle();
            if (t === "Polygon" || t === "MultiPolygon") return app.getBueirosPolygonStyle();
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature?._bueirosBr319Index;
            if (typeof idx === "number") app.state.bueirosBr319LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "bueiros-br319");
            app.applyBueirosStyleToLayer(lyr);
            app.attachQuickHover(lyr, feature, "bueiros-br319");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.state.bueirosBr319Layer = layer;
        app.mountDataLayerIfAllowed(layer, app.layerBueirosBr319Toggle);
        if (layer.bringToFront) layer.bringToFront();
      } catch (e) {
        console.warn(e);
        app.setStatus("Bueiros BR-319: não carregado (verifique assets/BR-319/SHP_BUEIRO)", "error");
        if (app.layerBueirosBr319Toggle) app.layerBueirosBr319Toggle.checked = false;
        app.state.bueirosBr319Features = [];
        app.state.bueirosBr319LayersByIndex = {};
        app.state.bueirosBr319Layer = null;
      } finally {
        app.state.bueirosBr319Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.getPradsStyleByKind = function getPradsStyleByKind(kind) {
      const legendId = String(kind || "").includes("319") ? "br-319" : String(kind || "").includes("174") ? "br-174" : "prads";
      const color = app.getLegendAccentById(legendId);
      const fillDef = app.getSimpleLegendDefs().find((d) => d.id === legendId);
      const fillColor = fillDef?.fill || color;
      return (feature) => {
        const t = feature?.geometry?.type;
        if (t === "LineString" || t === "MultiLineString") return { color, weight: 2.2, opacity: 0.9 };
        if (t === "Polygon" || t === "MultiPolygon")
          return { color, weight: 1.4, opacity: 0.9, fillColor, fillOpacity: 0.22 };
        return {};
      };
    }

  app.ensureBueirosBr174OnMap = async function ensureBueirosBr174OnMap() {
      if (!app.state.map || !app.layerBueirosBr174Toggle?.checked) return;
      if (app.state.bueirosBr174Layer) {
        app.mountDataLayerIfAllowed(app.state.bueirosBr174Layer, app.layerBueirosBr174Toggle);
        if (app.state.bueirosBr174Layer.bringToFront) app.state.bueirosBr174Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.bueirosBr174Loading) return;
      app.state.bueirosBr174Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/bueiros-br174");
        const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr174Index: i }));
        data.features = feats;
        app.state.bueirosBr174Features = feats;
        app.state.bueirosBr174LayersByIndex = {};
        app.state.bueirosBr174ColumnKeys = [];
        app.state.bueirosBr174Layer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, { icon: app.createBueirosPointIcon("bueiros-br174"), interactive: true, riseOnHover: true });
          },
          onEachFeature(feature, lyr) {
            const idx = feature._bueirosBr174Index;
            if (typeof idx === "number") app.state.bueirosBr174LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "bueiros-br174");
            app.attachQuickHover(lyr, feature, "bueiros-br174");
            app.bindLayerIdentifyClick(lyr);
          },
        });
        app.mountDataLayerIfAllowed(app.state.bueirosBr174Layer, app.layerBueirosBr174Toggle);
        if (app.state.bueirosBr174Layer.bringToFront) app.state.bueirosBr174Layer.bringToFront();
      } catch (e) {
        console.warn(e);
        app.setStatus("Bueiros BR-174: não carregado (verifique assets/BR-174 e o shapefile)", "error");
        if (app.layerBueirosBr174Toggle) app.layerBueirosBr174Toggle.checked = false;
        app.state.bueirosBr174Layer = null;
      } finally {
        app.state.bueirosBr174Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensurePradsBr174OnMap = async function ensurePradsBr174OnMap() {
      if (!app.state.map || !app.layerPradsBr174Toggle?.checked) return;
      if (app.state.pradsBr174Layer) {
        app.mountDataLayerIfAllowed(app.state.pradsBr174Layer, app.layerPradsBr174Toggle);
        if (app.state.pradsBr174Layer.bringToFront) app.state.pradsBr174Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.pradsBr174Loading) return;
      app.state.pradsBr174Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/prads-br174");
        const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr174Index: i }));
        data.features = feats;
        app.state.pradsBr174Features = feats;
        app.state.pradsBr174LayersByIndex = {};
        app.state.pradsBr174ColumnKeys = [];
        app.state.pradsBr174Layer = L.geoJSON(data, {
          style: app.getPradsStyleByKind("prads-br174"),
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, { icon: app.createPradsPointIcon("prads-br174"), interactive: true, riseOnHover: true });
          },
          onEachFeature(feature, lyr) {
            const idx = feature._pradsBr174Index;
            if (typeof idx === "number") app.state.pradsBr174LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "prads-br174");
            app.attachQuickHover(lyr, feature, "prads-br174");
            app.bindLayerIdentifyClick(lyr);
          },
        });
        app.mountDataLayerIfAllowed(app.state.pradsBr174Layer, app.layerPradsBr174Toggle);
        if (app.state.pradsBr174Layer.bringToFront) app.state.pradsBr174Layer.bringToFront();
      } catch (e) {
        console.warn(e);
        app.setStatus("PRADS BR-174: não carregado (verifique assets/BR-174 e o shapefile)", "error");
        if (app.layerPradsBr174Toggle) app.layerPradsBr174Toggle.checked = false;
        app.state.pradsBr174Layer = null;
      } finally {
        app.state.pradsBr174Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensurePcaPradsBr319OnMap = async function ensurePcaPradsBr319OnMap() {
      if (!app.state.map || !app.layerPcaPradsBr319Toggle?.checked) return;
      if (app.state.pcaPradsBr319Layer) {
        app.mountDataLayerIfAllowed(app.state.pcaPradsBr319Layer, app.layerPcaPradsBr319Toggle);
        if (app.state.pcaPradsBr319Layer.bringToFront) app.state.pcaPradsBr319Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.pcaPradsBr319Loading) return;
      app.state.pcaPradsBr319Loading = true;
      try {
        app.ensureInfraGeoPanes();
        const data = await app.fetchLayerGeoJson("/layers/pca-prads-br319");
        const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsBr319Index: i }));
        data.features = feats;
        app.state.pcaPradsBr319Features = feats;
        app.state.pcaPradsBr319LayersByIndex = {};
        app.state.pcaPradsBr319ColumnKeys = [];
        const geoOpts = {
          style: app.getPradsStyleByKind("pca-prads-br319"),
          pointToLayer(_feature, latlng) {
            const markerOpts = { icon: app.createPradsPointIcon("pca-prads-br319"), interactive: true, riseOnHover: true };
            if (app.state.panes?.points) markerOpts.pane = app.state.panes.points;
            return L.marker(latlng, markerOpts);
          },
          onEachFeature(feature, lyr) {
            const idx = feature._pcaPradsBr319Index;
            if (typeof idx === "number") app.state.pcaPradsBr319LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "pca-prads-br319");
            app.attachQuickHover(lyr, feature, "pca-prads-br319");
            app.bindLayerIdentifyClick(lyr);
          },
        };
        if (app.state.panes?.points) geoOpts.pane = app.state.panes.points;
        app.state.pcaPradsBr319Layer = L.geoJSON(data, geoOpts);
        app.mountDataLayerIfAllowed(app.state.pcaPradsBr319Layer, app.layerPcaPradsBr319Toggle);
        if (app.state.pcaPradsBr319Layer.bringToFront) app.state.pcaPradsBr319Layer.bringToFront();
      } catch (e) {
        console.warn(e);
        app.setStatus("PCA - PRADS BR-319: não carregado (verifique assets/BR-319 e o shapefile)", "error");
        if (app.layerPcaPradsBr319Toggle) app.layerPcaPradsBr319Toggle.checked = false;
        app.state.pcaPradsBr319Layer = null;
      } finally {
        app.state.pcaPradsBr319Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensurePradsBr319OnMap = async function ensurePradsBr319OnMap() {
      if (!app.state.map || !app.layerPradsBr319Toggle?.checked) return;
      if (app.state.pradsBr319Layer) {
        app.mountDataLayerIfAllowed(app.state.pradsBr319Layer, app.layerPradsBr319Toggle);
        if (app.state.pradsBr319Layer.bringToFront) app.state.pradsBr319Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.pradsBr319Loading) return;
      app.state.pradsBr319Loading = true;
      try {
        app.ensureInfraGeoPanes();
        const data = await app.fetchLayerGeoJson("/layers/prads-br319");
        const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr319Index: i }));
        data.features = feats;
        app.state.pradsBr319Features = feats;
        app.state.pradsBr319LayersByIndex = {};
        app.state.pradsBr319ColumnKeys = [];
        const geoOpts = {
          style: app.getPradsStyleByKind("prads-br319"),
          pointToLayer(_feature, latlng) {
            const markerOpts = { icon: app.createPradsPointIcon("prads-br319"), interactive: true, riseOnHover: true };
            if (app.state.panes?.points) markerOpts.pane = app.state.panes.points;
            return L.marker(latlng, markerOpts);
          },
          onEachFeature(feature, lyr) {
            const idx = feature._pradsBr319Index;
            if (typeof idx === "number") app.state.pradsBr319LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "prads-br319");
            app.attachQuickHover(lyr, feature, "prads-br319");
            app.bindLayerIdentifyClick(lyr);
          },
        };
        if (app.state.panes?.points) geoOpts.pane = app.state.panes.points;
        app.state.pradsBr319Layer = L.geoJSON(data, geoOpts);
        app.mountDataLayerIfAllowed(app.state.pradsBr319Layer, app.layerPradsBr319Toggle);
        if (app.state.pradsBr319Layer.bringToFront) app.state.pradsBr319Layer.bringToFront();
      } catch (e) {
        console.warn(e);
        app.setStatus("PRADS BR-319: não carregado (verifique assets/BR-319 e o shapefile)", "error");
        if (app.layerPradsBr319Toggle) app.layerPradsBr319Toggle.checked = false;
        app.state.pradsBr319Layer = null;
      } finally {
        app.state.pradsBr319Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensurePcaPradsCmmBr319OnMap = async function ensurePcaPradsCmmBr319OnMap() {
      if (!app.state.map || !app.layerPcaPradsCmmBr319Toggle?.checked) return;
      if (app.state.pcaPradsCmmBr319Layer) {
        app.mountDataLayerIfAllowed(app.state.pcaPradsCmmBr319Layer, app.layerPcaPradsCmmBr319Toggle);
        if (app.state.pcaPradsCmmBr319Layer.bringToFront) app.state.pcaPradsCmmBr319Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.pcaPradsCmmBr319Loading) return;
      app.state.pcaPradsCmmBr319Loading = true;
      try {
        app.ensureInfraGeoPanes();
        const data = await app.fetchLayerGeoJson("/layers/pca-prads-cmm-br319");
        const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsCmmBr319Index: i }));
        data.features = feats;
        app.state.pcaPradsCmmBr319Features = feats;
        app.state.pcaPradsCmmBr319LayersByIndex = {};
        app.state.pcaPradsCmmBr319ColumnKeys = [];
        const geoOpts = {
          style: app.getPradsStyleByKind("pca-prads-cmm-br319"),
          pointToLayer(_feature, latlng) {
            const markerOpts = { icon: app.createPradsPointIcon("pca-prads-cmm-br319"), interactive: true, riseOnHover: true };
            if (app.state.panes?.points) markerOpts.pane = app.state.panes.points;
            return L.marker(latlng, markerOpts);
          },
          onEachFeature(feature, lyr) {
            const idx = feature._pcaPradsCmmBr319Index;
            if (typeof idx === "number") app.state.pcaPradsCmmBr319LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "pca-prads-cmm-br319");
            app.attachQuickHover(lyr, feature, "pca-prads-cmm-br319");
            app.bindLayerIdentifyClick(lyr);
          },
        };
        if (app.state.panes?.points) geoOpts.pane = app.state.panes.points;
        app.state.pcaPradsCmmBr319Layer = L.geoJSON(data, geoOpts);
        app.mountDataLayerIfAllowed(app.state.pcaPradsCmmBr319Layer, app.layerPcaPradsCmmBr319Toggle);
        if (app.state.pcaPradsCmmBr319Layer.bringToFront) app.state.pcaPradsCmmBr319Layer.bringToFront();
      } catch (e) {
        console.warn(e);
        app.setStatus("PCA - PRADS CMM BR-319: não carregado (verifique assets/BR-319 e o shapefile)", "error");
        if (app.layerPcaPradsCmmBr319Toggle) app.layerPcaPradsCmmBr319Toggle.checked = false;
        app.state.pcaPradsCmmBr319Layer = null;
      } finally {
        app.state.pcaPradsCmmBr319Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensureBueirosBr230OnMap = async function ensureBueirosBr230OnMap() {
      if (!app.state.map || !app.layerBueirosBr230Toggle?.checked) return;
      if (app.state.bueirosBr230Layer) {
        app.mountDataLayerIfAllowed(app.state.bueirosBr230Layer, app.layerBueirosBr230Toggle);
        if (app.state.bueirosBr230Layer.bringToFront) app.state.bueirosBr230Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.bueirosBr230Loading) return;
      app.state.bueirosBr230Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/bueiros-br230");
        const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr230Index: i }));
        data.features = feats;
        app.state.bueirosBr230Features = feats;
        app.state.bueirosBr230LayersByIndex = {};
        app.state.bueirosBr230ColumnKeys = [];
        app.state.bueirosBr230Layer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, { icon: app.createBueirosPointIcon("bueiros-br230"), interactive: true, riseOnHover: true });
          },
          onEachFeature(feature, lyr) {
            const idx = feature._bueirosBr230Index;
            if (typeof idx === "number") app.state.bueirosBr230LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "bueiros-br230");
            app.attachQuickHover(lyr, feature, "bueiros-br230");
            app.bindLayerIdentifyClick(lyr);
          },
        });
        app.mountDataLayerIfAllowed(app.state.bueirosBr230Layer, app.layerBueirosBr230Toggle);
        if (app.state.bueirosBr230Layer.bringToFront) app.state.bueirosBr230Layer.bringToFront();
      } catch (e) {
        console.warn(e);
        app.setStatus("Bueiros BR-230: não carregado (verifique assets/BR-230 e o shapefile)", "error");
        if (app.layerBueirosBr230Toggle) app.layerBueirosBr230Toggle.checked = false;
        app.state.bueirosBr230Layer = null;
      } finally {
        app.state.bueirosBr230Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.applyJazidasAvailability = function applyJazidasAvailability(info) {
      if (!app.layerJazidasToggle) return;
      if (!info?.available) {
        if (app.layerJazidasHint) app.layerJazidasHint.textContent = "Indisponível (assets/BR-307/JAZIDAS)";
        app.layerJazidasToggle.disabled = true;
        app.layerJazidasToggle.checked = false;
        app.layerJazidasRow?.classList.add("layer-row--disabled");
        if (app.state.jazidasBr307Layer && app.state.map) app.state.map.removeLayer(app.state.jazidasBr307Layer);
        app.state.jazidasFeatures = [];
        app.state.jazidasLayersByIndex = {};
        return;
      }
      app.layerJazidasToggle.disabled = false;
      app.layerJazidasRow?.classList.remove("layer-row--disabled");
      if (app.layerJazidasHint) {
        if (Array.isArray(info.shapefiles) && info.shapefiles.length) {
          const base = info.shapefiles[0];
          app.layerJazidasHint.textContent = info.shapefiles.length > 1 ? `${base.replace(/\\.shp$/i, "")} +${info.shapefiles.length - 1}` : base.replace(/\\.shp$/i, "");
        } else {
          app.layerJazidasHint.textContent = "BR-307";
        }
      }
    }

  app.applyUcEstadualAvailability = function applyUcEstadualAvailability(info) {
      if (!app.layerUcEstadualToggle) return;
      if (!info?.available) {
        app.layerUcEstadualToggle.disabled = true;
        app.layerUcEstadualToggle.checked = false;
        app.layerUcEstadualRow?.classList.add("layer-row--disabled");
        if (app.state.ucEstadualLayer && app.state.map) app.state.map.removeLayer(app.state.ucEstadualLayer);
        app.state.ucEstadualLayer = null;
        app.state.ucEstadualFeatures = [];
        app.state.ucEstadualLayersByIndex = {};
        app.state.ucEstadualColumnKeys = [];
        if (app.state.tableDataset === "uc-estadual") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerUcEstadualToggle.disabled = false;
      app.layerUcEstadualRow?.classList.remove("layer-row--disabled");
    }

  app.applyUcMunicipalAvailability = function applyUcMunicipalAvailability(info) {
      if (!app.layerUcMunicipalToggle) return;
      if (!info?.available) {
        app.layerUcMunicipalToggle.disabled = true;
        app.layerUcMunicipalToggle.checked = false;
        app.layerUcMunicipalRow?.classList.add("layer-row--disabled");
        if (app.state.ucMunicipalLayer && app.state.map) app.state.map.removeLayer(app.state.ucMunicipalLayer);
        app.state.ucMunicipalLayer = null;
        app.state.ucMunicipalFeatures = [];
        app.state.ucMunicipalLayersByIndex = {};
        app.state.ucMunicipalColumnKeys = [];
        if (app.state.tableDataset === "uc-municipal") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerUcMunicipalToggle.disabled = false;
      app.layerUcMunicipalRow?.classList.remove("layer-row--disabled");
    }

  app.applyHidroviasAmAvailability = function applyHidroviasAmAvailability(info) {
      if (!app.layerHidroviasAmToggle) return;
      if (!info?.available) {
        app.layerHidroviasAmToggle.disabled = true;
        app.layerHidroviasAmToggle.checked = false;
        app.layerHidroviasAmRow?.classList.add("layer-row--disabled");
        if (app.state.hidroviasAmLayer && app.state.map) app.state.map.removeLayer(app.state.hidroviasAmLayer);
        app.state.hidroviasAmLayer = null;
        app.state.hidroviasAmFeatures = [];
        app.state.hidroviasAmLayersByIndex = {};
        app.state.hidroviasAmColumnKeys = [];
        if (app.state.tableDataset === "hidrovias-am") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerHidroviasAmToggle.disabled = false;
      app.layerHidroviasAmRow?.classList.remove("layer-row--disabled");
      // Se estiver marcado por padrão, garante carga após checagem de disponibilidade.
      if (app.state.map && app.layerHidroviasAmToggle.checked) {
        void app.ensureHidroviasAmOnMap();
      }
    }

  app.applyTiAmAvailability = function applyTiAmAvailability(info) {
      if (!app.layerTiAmToggle) return;
      // Se não conseguimos checar disponibilidade, não desabilita (deixa o load real decidir).
      if (info?._unknown) {
        app.layerTiAmToggle.disabled = false;
        app.layerTiAmRow?.classList.remove("layer-row--disabled");
        return;
      }
      if (!info?.available) {
        app.layerTiAmToggle.disabled = true;
        app.layerTiAmToggle.checked = false;
        app.layerTiAmRow?.classList.add("layer-row--disabled");
        if (app.state.tiAmLayer && app.state.map) app.state.map.removeLayer(app.state.tiAmLayer);
        app.state.tiAmLayer = null;
        app.state.tiAmFeatures = [];
        app.state.tiAmLayersByIndex = {};
        app.state.tiAmColumnKeys = [];
        if (app.state.tableDataset === "ti-am") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerTiAmToggle.disabled = false;
      app.layerTiAmRow?.classList.remove("layer-row--disabled");
    }

  app.applyIp4Availability = function applyIp4Availability(info) {
      if (!app.layerIp4Toggle) return;
      // Se não conseguimos checar disponibilidade, não desabilita (deixa o load real decidir).
      if (info?._unknown) {
        app.layerIp4Toggle.disabled = false;
        app.layerIp4Row?.classList.remove("layer-row--disabled");
        if (app.layerIp4Hint) app.layerIp4Hint.textContent = "IP4 (checagem pendente — tente ligar)";
        return;
      }
      if (!info?.available) {
        const rec = typeof info?.bestRecords === "number" ? info.bestRecords : null;
        if (app.layerIp4Hint) {
          app.layerIp4Hint.textContent = rec === 0 ? "Camada vazia (0 registros)" : "Indisponível (assets/IP4)";
        }
        app.layerIp4Toggle.disabled = true;
        app.layerIp4Toggle.checked = false;
        app.layerIp4Row?.classList.add("layer-row--disabled");
        if (app.state.ip4Layer && app.state.map) app.state.map.removeLayer(app.state.ip4Layer);
        app.state.ip4Layer = null;
        app.state.ip4Features = [];
        app.state.ip4LayersByIndex = {};
        app.state.ip4ColumnKeys = [];
        if (app.state.tableDataset === "ip4") {
          app.state.tableDataset = "segmentos";
          if (app.$("all-attributes")) {
            app.renderAllAttributesTable();
          }
          app.refreshPanelTableTitle();
          app.syncGeneralFilterPlaceholder();
          app.syncGeneralFilterValue();
        }
        return;
      }
      app.layerIp4Toggle.disabled = false;
      app.layerIp4Row?.classList.remove("layer-row--disabled");
      if (app.layerIp4Hint) {
        const name = String(info?.bestShapefile || "IP4").replace(/\.shp$/i, "");
        const rec = typeof info?.bestRecords === "number" ? info.bestRecords : null;
        const fromZip = info?.bestZip ? ` (ZIP: ${String(info.bestZip)})` : "";
        // Mesmo vazio, a camada pode ligar e mostrar um placeholder.
        app.layerIp4Hint.textContent = rec === 0 ? "Sem feições (placeholder no mapa)" : `${name}${fromZip}`;
      }
    }

  app.ensureIp4OnMap = async function ensureIp4OnMap() {
      if (!app.state.map || !app.layerIp4Toggle?.checked) return;
      app.ensureInfraGeoPanes();
      if (app.state.ip4Layer) {
        app.mountDataLayerIfAllowed(app.state.ip4Layer, app.layerIp4Toggle);
        if (app.state.ip4Layer.bringToFront) app.state.ip4Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.ip4Loading) return;
      app.state.ip4Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/ip4");
        const feats = (data.features || []).map((f, i) => ({ ...f, _ip4Index: i }));
        data.features = feats;
        app.state.ip4Features = feats;
        app.state.ip4LayersByIndex = {};
        app.state.ip4ColumnKeys = [];

        const ip4Color = "#c97900";

        app.state.ip4Layer = L.geoJSON(data, {
          pane: app.state.panes?.polygons,
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createIp4PointIcon(),
              pane: app.state.panes?.points,
              riseOnHover: true,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            const tune = app.getBasemapTuning();
            if (t === "LineString" || t === "MultiLineString") {
              const w = Math.max(1.6, 2.6 + tune.lineWeightDelta);
              return { color: ip4Color, weight: w, opacity: tune.lineOpacity };
            }
            if (t === "Polygon" || t === "MultiPolygon") {
              const w = Math.max(1.4, 2.4 + tune.lineWeightDelta);
              return { color: ip4Color, weight: w, opacity: tune.lineOpacity, fillColor: "#ffbf6a", fillOpacity: app.tunedFill(0.18).fillOpacity };
            }
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._ip4Index;
            if (typeof idx === "number") app.state.ip4LayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "ip4");
            app.attachQuickHover(lyr, feature, "ip4");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.ip4Layer, app.layerIp4Toggle);
        if (app.state.ip4Layer.bringToFront) app.state.ip4Layer.bringToFront();
        app.setStatus(`IP4: carregado (${feats.length} feições)`, "ok");

        // Ajuda de diagnóstico: se o shapefile vier vazio, mostra dica na UI (sem travar).
        try {
          const n = feats.length;
          if (app.layerIp4Hint && n === 0) app.layerIp4Hint.textContent = "Instalações Portuárias (sem feições no SHP)";
        } catch {
          // ignore
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("IP4: não carregado (verifique assets/IP4 ou ZIP do entregável)", "error");
        if (app.layerIp4Toggle) app.layerIp4Toggle.checked = false;
        app.state.ip4Layer = null;
        app.state.ip4Features = [];
        app.state.ip4LayersByIndex = {};
        app.state.ip4ColumnKeys = [];
      } finally {
        app.state.ip4Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensureUcEstadualOnMap = async function ensureUcEstadualOnMap() {
      if (!app.state.map || !app.layerUcEstadualToggle?.checked) return;
      app.ensureInfraGeoPanes();
      if (app.state.ucEstadualLayer) {
        app.mountDataLayerIfAllowed(app.state.ucEstadualLayer, app.layerUcEstadualToggle);
        if (app.state.ucEstadualLayer.bringToFront) app.state.ucEstadualLayer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.ucEstadualLoading) return;
      app.state.ucEstadualLoading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/uc-estadual");
        const feats = (data.features || []).map((f, i) => ({ ...f, _ucEstadualIndex: i }));
        data.features = feats;
        app.state.ucEstadualFeatures = feats;
        app.state.ucEstadualLayersByIndex = {};
        app.state.ucEstadualColumnKeys = [];

        app.state.ucEstadualLayer = L.geoJSON(data, {
          pane: app.state.panes?.polygons,
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createUcEstadualPointIcon(),
              interactive: true,
              riseOnHover: true,
              pane: app.state.panes?.points,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") return app.getUcEstadualLineStyle();
            if (t === "Polygon" || t === "MultiPolygon") return app.getUcEstadualPolygonStyle();
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._ucEstadualIndex;
            if (typeof idx === "number") app.state.ucEstadualLayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "uc-estadual");
            app.attachQuickHover(lyr, feature, "uc-estadual");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.ucEstadualLayer, app.layerUcEstadualToggle);
        if (app.state.ucEstadualLayer.bringToFront) app.state.ucEstadualLayer.bringToFront();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("UC Estadual: não carregado (verifique Z: e shapefile)", "error");
        if (app.layerUcEstadualToggle) app.layerUcEstadualToggle.checked = false;
        app.state.ucEstadualLayer = null;
        app.state.ucEstadualFeatures = [];
        app.state.ucEstadualLayersByIndex = {};
      } finally {
        app.state.ucEstadualLoading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensureUcMunicipalOnMap = async function ensureUcMunicipalOnMap() {
      if (!app.state.map || !app.layerUcMunicipalToggle?.checked) return;
      app.ensureInfraGeoPanes();
      if (app.state.ucMunicipalLayer) {
        app.mountDataLayerIfAllowed(app.state.ucMunicipalLayer, app.layerUcMunicipalToggle);
        if (app.state.ucMunicipalLayer.bringToFront) app.state.ucMunicipalLayer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.ucMunicipalLoading) return;
      app.state.ucMunicipalLoading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/uc-municipal");
        const feats = (data.features || []).map((f, i) => ({ ...f, _ucMunicipalIndex: i }));
        data.features = feats;
        app.state.ucMunicipalFeatures = feats;
        app.state.ucMunicipalLayersByIndex = {};
        app.state.ucMunicipalColumnKeys = [];

        app.state.ucMunicipalLayer = L.geoJSON(data, {
          pane: app.state.panes?.polygons,
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createUcMunicipalPointIcon(),
              interactive: true,
              riseOnHover: true,
              pane: app.state.panes?.points,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") return app.getUcMunicipalLineStyle();
            if (t === "Polygon" || t === "MultiPolygon") return app.getUcMunicipalPolygonStyle();
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._ucMunicipalIndex;
            if (typeof idx === "number") app.state.ucMunicipalLayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "uc-municipal");
            app.attachQuickHover(lyr, feature, "uc-municipal");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.ucMunicipalLayer, app.layerUcMunicipalToggle);
        if (app.state.ucMunicipalLayer.bringToFront) app.state.ucMunicipalLayer.bringToFront();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("UC Municipal: não carregado (verifique assets/UC Municipal.json)", "error");
        if (app.layerUcMunicipalToggle) app.layerUcMunicipalToggle.checked = false;
        app.state.ucMunicipalLayer = null;
        app.state.ucMunicipalFeatures = [];
        app.state.ucMunicipalLayersByIndex = {};
      } finally {
        app.state.ucMunicipalLoading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensureTiAmOnMap = async function ensureTiAmOnMap() {
      if (!app.state.map || !app.layerTiAmToggle?.checked) return;
      app.ensureInfraGeoPanes();
      if (app.state.tiAmLayer) {
        app.mountDataLayerIfAllowed(app.state.tiAmLayer, app.layerTiAmToggle);
        if (app.state.tiAmLayer.bringToFront) app.state.tiAmLayer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.tiAmLoading) return;
      app.state.tiAmLoading = true;
      try {
        app.setStatus("TI AM: carregando…", "info");
        let data = null;

        // Preferência: endpoint dedicado.
        try {
          data = await app.fetchLayerGeoJson("/layers/ti-am");
        } catch {
          data = null;
        }

        // Fallback: auto-discovery pelo índice de camadas existente.
        if (!data) {
          const payload = await fetch("/layers").then((rr) => rr.json());
          const layers = payload?.layers || [];
          const hit = layers.find((it) => {
            const name = String(it?.name || "");
            return /ti_am_atualizada/i.test(name) || /ti[ _-]?am/i.test(name);
          });
          if (!hit?.id) throw new Error("Layer not found");
          const r2 = await fetch(`/layers/${hit.id}`);
          if (!r2.ok) throw new Error((await r2.text()) || r2.statusText);
          data = await r2.json();
        }

        const feats = (data.features || []).map((f, i) => ({ ...f, _tiAmIndex: i }));
        data.features = feats;
        app.state.tiAmFeatures = feats;
        app.state.tiAmLayersByIndex = {};
        app.state.tiAmColumnKeys = [];

        app.state.tiAmLayer = L.geoJSON(data, {
          pane: app.state.panes?.polygons,
          pointToLayer(_feature, latlng) {
            return app.pointAsCircleMarker(latlng);
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") {
              const tune = app.getBasemapTuning();
              const w = Math.max(1.4, 2.2 + tune.lineWeightDelta);
              return { color: "#6ba09c", weight: w, opacity: tune.lineOpacity };
            }
            if (t === "Polygon" || t === "MultiPolygon") {
              const tune = app.getBasemapTuning();
              const w = Math.max(1.2, 2.0 + tune.lineWeightDelta);
              return {
                color: "#6ba09c",
                weight: w,
                opacity: tune.lineOpacity,
                fillColor: "#bcdae8",
                fillOpacity: app.tunedFill(0.16).fillOpacity,
              };
            }
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._tiAmIndex;
            if (typeof idx === "number") app.state.tiAmLayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "ti-am");
            app.attachQuickHover(lyr, feature, "ti-am");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.tiAmLayer, app.layerTiAmToggle);
        if (app.state.tiAmLayer.bringToFront) app.state.tiAmLayer.bringToFront();
        app.setStatus(`TI AM: carregado (${app.state.tiAmFeatures.length} feições)`, "ok");
      } catch (e) {
        console.warn(e);
        const msg = String(e?.message || "");
        // Flask abort(...) pode mandar HTML; tenta extrair algo curto.
        const clean = msg
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        app.setStatus(
          clean ? `TI AM: não carregado — ${clean}` : "TI AM: não carregado (verifique assets/TI_AM_ATUALIZADA e o shapefile)",
          "error",
        );
        if (app.layerTiAmToggle) app.layerTiAmToggle.checked = false;
        app.state.tiAmLayer = null;
        app.state.tiAmFeatures = [];
        app.state.tiAmLayersByIndex = {};
      } finally {
        app.state.tiAmLoading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensureHidroviasAmOnMap = async function ensureHidroviasAmOnMap() {
      if (!app.state.map || !app.layerHidroviasAmToggle?.checked) return;
      app.ensureInfraGeoPanes();
      if (app.state.hidroviasAmLayer) {
        app.mountDataLayerIfAllowed(app.state.hidroviasAmLayer, app.layerHidroviasAmToggle);
        if (app.state.hidroviasAmLayer.bringToFront) app.state.hidroviasAmLayer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.hidroviasAmLoading) return;
      app.state.hidroviasAmLoading = true;
      try {
        app.setStatus("Hidrovias AM: carregando…", "info");
        const data = await app.fetchLayerGeoJson("/layers/hidrovias-am");
        const feats = (data.features || []).map((f, i) => ({ ...f, _hidroviasAmIndex: i }));
        data.features = feats;
        app.state.hidroviasAmFeatures = feats;
        app.state.hidroviasAmLayersByIndex = {};
        app.state.hidroviasAmColumnKeys = [];

        app.state.hidroviasAmLayer = L.geoJSON(data, {
          pane: app.state.panes?.lines,
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") {
              // Mais visível no Carto/OSM/satélite
              return { color: "#1060d0", weight: 3.8, opacity: 0.95 };
            }
            if (t === "Polygon" || t === "MultiPolygon") {
              return { color: "#1060d0", weight: 2.2, opacity: 0.95, fillColor: "#1060d0", fillOpacity: 0.12 };
            }
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._hidroviasAmIndex;
            if (typeof idx === "number") app.state.hidroviasAmLayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "hidrovias-am");
            app.attachQuickHover(lyr, feature, "hidrovias-am");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.hidroviasAmLayer, app.layerHidroviasAmToggle);
        if (app.state.hidroviasAmLayer.bringToFront) app.state.hidroviasAmLayer.bringToFront();
        app.setStatus(`Hidrovias AM: carregado (${app.state.hidroviasAmFeatures.length} feições)`, "ok");
      } catch (e) {
        console.warn(e);
        const msg = String(e?.message || "");
        const clean = msg
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        app.setStatus(
          clean
            ? `Hidrovias AM: não carregado — ${clean}`
            : "Hidrovias AM: não carregado (verifique assets/SNV_HIDROVIAS_AM e o shapefile)",
          "error",
        );
        if (app.layerHidroviasAmToggle) app.layerHidroviasAmToggle.checked = false;
        app.state.hidroviasAmLayer = null;
        app.state.hidroviasAmFeatures = [];
        app.state.hidroviasAmLayersByIndex = {};
      } finally {
        app.state.hidroviasAmLoading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensurePontesBr307OnMap = async function ensurePontesBr307OnMap() {
      if (!app.state.map || !app.layerPontesToggle?.checked) return;
      if (app.state.pontesBr307Layer) {
        app.mountDataLayerIfAllowed(app.state.pontesBr307Layer, app.layerPontesToggle);
        if (app.state.pontesBr307Layer.bringToFront) app.state.pontesBr307Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.pontesBr307Loading) return;
      app.state.pontesBr307Loading = true;
      try {
        const data = await app.fetchLayerGeoJson("/layers/pontes-br307");
        // Se o usuário desligou enquanto carregava, não renderiza/adiciona no mapa.
        if (!app.layerPontesToggle?.checked || !app.state.map) return;
        const rawFeatsP = data.features || [];
        const featsP = rawFeatsP.map((f, i) => ({ ...f, _pontesIndex: i }));
        data.features = featsP;
        app.state.pontesFeatures = featsP;
        app.state.pontesLayersByIndex = {};

        app.state.pontesBr307Layer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createPontesPointIcon("pontes"),
              interactive: true,
              riseOnHover: true,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") {
              return app.getPontesLineStyle();
            }
            if (t === "Polygon" || t === "MultiPolygon") {
              return app.getPontesPolygonStyle();
            }
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._pontesIndex;
            if (typeof idx === "number") app.state.pontesLayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "pontes");
            app.attachQuickHover(lyr, feature, "pontes");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.pontesBr307Layer, app.layerPontesToggle);
        if (app.state.pontesBr307Layer.bringToFront) app.state.pontesBr307Layer.bringToFront();
        if (app.state.totalFeaturesCount > 0) {
          app.setStatus(`Dados: ${app.state.totalFeaturesCount} feições`);
        } else {
          app.setStatus("Dados: pronto");
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("Pontes: não carregado (verifique Z: e shapefile)", "error");
        app.layerPontesToggle.checked = false;
        app.state.pontesFeatures = [];
        app.state.pontesLayersByIndex = {};
      } finally {
        app.state.pontesBr307Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

  app.ensureJazidasBr307OnMap = async function ensureJazidasBr307OnMap() {
      if (!app.state.map || !app.layerJazidasToggle?.checked) return;
      if (app.state.jazidasBr307Layer) {
        app.mountDataLayerIfAllowed(app.state.jazidasBr307Layer, app.layerJazidasToggle);
        if (app.state.jazidasBr307Layer.bringToFront) app.state.jazidasBr307Layer.bringToFront();
        app.afterRodoviasSublayerVisibilityChange();
        return;
      }
      if (app.state.jazidasBr307Loading) return;
      app.state.jazidasBr307Loading = true;
      try {
        // Usa a camada de pontos para identificação (mais fácil de ver no mapa)
        const data = await app.fetchLayerGeoJson("/layers/jazidas-br307/jazida-pontos");
        // Se o usuário desligou enquanto carregava, não renderiza/adiciona no mapa.
        if (!app.layerJazidasToggle?.checked || !app.state.map) return;
        const rawFeats = data.features || [];
        const feats = rawFeats.map((f, i) => ({ ...f, _jazidasIndex: i }));
        data.features = feats;
        app.state.jazidasFeatures = feats;
        app.state.jazidasLayersByIndex = {};

        app.state.jazidasBr307Layer = L.geoJSON(data, {
          pointToLayer(_feature, latlng) {
            return L.marker(latlng, {
              icon: app.createJazidasPointIcon(),
              interactive: true,
              riseOnHover: true,
            });
          },
          style(feature) {
            const t = feature?.geometry?.type;
            if (t === "LineString" || t === "MultiLineString") return app.getJazidasLineStyle();
            if (t === "Polygon" || t === "MultiPolygon") return app.getJazidasPolygonStyle();
            return {};
          },
          onEachFeature(feature, lyr) {
            const idx = feature._jazidasIndex;
            if (typeof idx === "number") app.state.jazidasLayersByIndex[idx] = lyr;
            app.setLayerIdentifyMeta(lyr, feature, "jazidas");
            app.attachQuickHover(lyr, feature, "jazidas");
            app.bindLayerIdentifyClick(lyr);
          },
        });

        app.mountDataLayerIfAllowed(app.state.jazidasBr307Layer, app.layerJazidasToggle);
        if (app.state.jazidasBr307Layer.bringToFront) app.state.jazidasBr307Layer.bringToFront();
        if (app.state.totalFeaturesCount > 0) app.setStatus(`Dados: ${app.state.totalFeaturesCount} feições`);
        else app.setStatus("Dados: pronto");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        app.setStatus("Jazidas: não carregado (verifique Z: e shapefile)", "error");
        app.layerJazidasToggle.checked = false;
        app.state.jazidasFeatures = [];
        app.state.jazidasLayersByIndex = {};
      } finally {
        app.state.jazidasBr307Loading = false;
        app.afterRodoviasSublayerVisibilityChange();
      }
    }

}
