/* global L */
export function registerLimites(app) {

  app.bringLimiteEstadualToBackIfVisible = function bringLimiteEstadualToBackIfVisible() {
      if (!app.state.map || !app.state.boundaryLayer || !app.state.map.hasLayer(app.state.boundaryLayer)) return;
      if (app.state.boundaryLayer.bringToBack) app.state.boundaryLayer.bringToBack();
    }

  app.bringLimiteMunicipalToFrontIfVisible = function bringLimiteMunicipalToFrontIfVisible() {
      if (!app.state.map) return;
      if (app.state.boundaryMunicipalHoverLayer && app.state.map.hasLayer(app.state.boundaryMunicipalHoverLayer)) {
        if (app.state.boundaryMunicipalHoverLayer.bringToFront) app.state.boundaryMunicipalHoverLayer.bringToFront();
      }
      if (app.state.boundaryMunicipalLayer && app.state.map.hasLayer(app.state.boundaryMunicipalLayer)) {
        if (app.state.boundaryMunicipalLayer.bringToFront) app.state.boundaryMunicipalLayer.bringToFront();
      }
    }

  app.applyLimiteEstadualVisibility = function applyLimiteEstadualVisibility() {
      if (!app.state.map || !app.state.boundaryLayer || !app.layerLimiteToggle) return;
      if (app.layerLimiteToggle.checked) {
        if (!app.state.map.hasLayer(app.state.boundaryLayer)) app.state.boundaryLayer.addTo(app.state.map);
        app.bringLimiteEstadualToBackIfVisible();
      } else if (app.state.map.hasLayer(app.state.boundaryLayer)) {
        app.state.map.removeLayer(app.state.boundaryLayer);
      }
    }

  app.applyLimiteMunicipalVisibility = function applyLimiteMunicipalVisibility() {
      if (!app.state.map || !app.layerLimiteMunicipalToggle) return;
      const m = app.state.map;
      const removeMunicipal = () => {
        try {
          if (app.state.boundaryMunicipalLayer && m.hasLayer(app.state.boundaryMunicipalLayer)) {
            m.removeLayer(app.state.boundaryMunicipalLayer);
          }
        } catch {
          // ignore
        }
        try {
          if (app.state.boundaryMunicipalHoverLayer && m.hasLayer(app.state.boundaryMunicipalHoverLayer)) {
            m.removeLayer(app.state.boundaryMunicipalHoverLayer);
          }
        } catch {
          // ignore
        }
      };

      // Desligar todas / switch off: remove do mapa linha e hover.
      if (app.state.bulkLayersIntent === "off" || !app.layerLimiteMunicipalToggle.checked) {
        removeMunicipal();
        return;
      }

      // Switch ligado: mostra linhas + polígonos de hover.
      if (app.state.boundaryMunicipalHoverLayer && !m.hasLayer(app.state.boundaryMunicipalHoverLayer)) {
        app.state.boundaryMunicipalHoverLayer.addTo(m);
      }
      if (app.state.boundaryMunicipalLayer && !m.hasLayer(app.state.boundaryMunicipalLayer)) {
        app.state.boundaryMunicipalLayer.addTo(m);
      }
      app.bringLimiteEstadualToBackIfVisible();
      app.bringLimiteMunicipalToFrontIfVisible();
    }

  app.attachLimiteEstadualLayerIfNeeded = async function attachLimiteEstadualLayerIfNeeded() {
      if (app.state.boundaryLayer || !app.state.map) return;
      app.ensureInfraGeoPanes();
      let data;
      try {
        data = await app.fetchLayerGeoJson("/layers/limite-estadual");
      } catch {
        return;
      }
      if (!data) return;
      const originalFeatures = data.features || [];
      // Alguns SHPs podem vir com feições duplicadas (mesma geometria repetida),
      // o que aparenta “a camada se sobrepondo a ela mesma”.
      // Deduplica por geometria para desenhar apenas uma vez.
      const uniqueFeatures = [];
      const seenGeom = new Set();
      for (const f of originalFeatures) {
        const g = f?.geometry;
        if (!g) continue;
        let key;
        try {
          key = JSON.stringify(g);
        } catch {
          // Se não conseguir serializar (raro), mantém a feição.
          uniqueFeatures.push(f);
          continue;
        }
        if (seenGeom.has(key)) continue;
        seenGeom.add(key);
        uniqueFeatures.push(f);
      }
      const mapped = uniqueFeatures.map((f, idx) => ({ ...f, _tableIndex: idx }));
      data.features = mapped;
      app.state.boundaryLayer = L.geoJSON(data, {
        pane: app.state.panes?.boundary,
        style: () => app.getBoundaryLayerStyle(),
      });
    }

  app.attachLimiteMunicipalLayerIfNeeded = async function attachLimiteMunicipalLayerIfNeeded() {
      if (app.state.boundaryMunicipalLayer && app.state.boundaryMunicipalHoverLayer) return;
      if (!app.state.map) return;
      // Evita corrida: se já estiver carregando, espera o mesmo Promise.
      if (app.state.boundaryMunicipalLoadPromise) return app.state.boundaryMunicipalLoadPromise;
      app.ensureInfraGeoPanes();
      app.state.boundaryMunicipalLoading = true;
      app.state.boundaryMunicipalLoadPromise = (async () => {
        try {
          // 1) Camada visual: linhas (como já existia)
          if (!app.state.boundaryMunicipalLayer) {
            let __layerData = null;
            try {
              __layerData = await app.fetchLayerGeoJson("/layers/limite-municipal");
            } catch {
              // ignore
            }
            if (__layerData) {
              const data = __layerData;
              app.state.boundaryMunicipalLayer = L.geoJSON(data, {
                pane: app.state.panes?.lines,
                style: () => app.getLimiteMunicipalLayerStyle(),
              });
            }
          }

          // 2) Camada de hover: polígonos com atributos (transparente, mas interativa)
          if (!app.state.boundaryMunicipalHoverLayer) {
            const rpData = await app.fetchLayerGeoJson("/layers/limite-municipal/polygons").catch(() => null);
            if (rpData) {
              const poly = rpData;
              let mIdx = 0;
              app.state.municipiosFeatures = [];
              app.state.municipiosLayersByIndex = {};
              app.state.boundaryMunicipalHoverLayer = L.geoJSON(poly, {
                pane: app.state.panes?.polygons,
                style: () => ({
                  color: "transparent",
                  weight: 0,
                  opacity: 0,
                  fillColor: "#000",
                  fillOpacity: 0.01,
                }),
                onEachFeature(feature, layer) {
                  const idx = mIdx++;
                  try {
                    feature._municipioIndex = idx;
                  } catch {
                    // ignore
                  }
                  app.state.municipiosFeatures[idx] = feature;
                  app.state.municipiosLayersByIndex[idx] = layer;
                  app.setLayerIdentifyMeta(layer, feature, "municipios");
                  app.bindLayerIdentifyClick(layer);
                  const name = app.getMunicipioNomeFromProps(feature?.properties);
                  if (!name) return;
                  // Municípios: pill minimalista (única exceção visual ao card IP4).
                  app.bindMunicipioHoverPill(layer, name);
                },
              });
            }
          }
        } catch {
          // ignore (handled by availability fetch)
        } finally {
          app.state.boundaryMunicipalLoading = false;
          app.state.boundaryMunicipalLoadPromise = null;
        }
      })();
      return app.state.boundaryMunicipalLoadPromise;
    }

  app.allRodoviasSublayersChecked = function allRodoviasSublayersChecked() {
      const toggles = [
        app.layerSegmentosToggle,
        app.layerBueirosToggle,
        app.layerPontesToggle,
        app.layerJazidasToggle,
        app.layerBueirosBr174Toggle,
        app.layerPradsBr174Toggle,
        app.layerPcaPradsBr319Toggle,
        app.layerPradsBr319Toggle,
        app.layerPcaPradsCmmBr319Toggle,
      ].filter((t) => t && !t.disabled);
      if (!toggles.length) return false;
      return toggles.every((t) => Boolean(t.checked));
    }

  app.fitMapToStateBoundaryNow = function fitMapToStateBoundaryNow() {
      if (!app.state.map) return;
      const bb = app.state.boundaryLayer?.getBounds?.();
      if (!bb?.isValid?.()) return;
      app.state.map.fitBounds(bb, { animate: false, duration: 0, padding: [24, 24] });
      app.bringLimiteEstadualToBackIfVisible();
    }

  app.ensureLimiteEstadualWhenNoDataLayers = function ensureLimiteEstadualWhenNoDataLayers() {
      if (!app.state.map) return;
      if (!app.allAvailableDataTogglesOff()) return;
      app.forceOnlyLimiteEstadualOn();
    }

  app.forceOnlyLimiteEstadualOn = function forceOnlyLimiteEstadualOn() {
      app.state.limiteEstadualUserHidden = false;
      const limel = app.layerLimiteToggle || app.$("layer-limite-estadual");
      try {
        if (limel) {
          limel.disabled = false;
          limel.checked = true;
        }
      } catch {
        // ignore
      }
      try {
        if (app.layerLimiteMunicipalToggle) app.layerLimiteMunicipalToggle.checked = false;
      } catch {
        // ignore
      }
      try {
        app.applyLimiteMunicipalVisibility();
      } catch {
        // ignore
      }
      // Reaplica imediatamente se a camada já estiver em memória.
      try {
        if (app.state.map && app.state.boundaryLayer) {
          if (!app.state.map.hasLayer(app.state.boundaryLayer)) app.state.boundaryLayer.addTo(app.state.map);
          app.bringLimiteEstadualToBackIfVisible();
        }
      } catch {
        // ignore
      }
      void Promise.resolve(app.attachLimiteEstadualLayerIfNeeded())
        .catch(() => null)
        .finally(() => {
          try {
            const lim = app.layerLimiteToggle || app.$("layer-limite-estadual");
            if (lim) {
              lim.disabled = false;
              lim.checked = true;
            }
            app.applyLimiteEstadualVisibility();
            app.bringLimiteEstadualToBackIfVisible();
            app.syncLayerRowsToggleUi();
          } catch {
            // ignore
          }
        });
    }

  app.turnOffAllDataLayersKeepLimiteEstadual = function turnOffAllDataLayersKeepLimiteEstadual() {
      if (!app.state.map) return;
      app.bumpMapLayerEpoch("off");
      app.state.suppressAutoFit = true;
      app.state.suppressAutoOpenTableOnLayerToggle = true;
      // Sempre manter Limite Estadual como única camada de dados ligada.
      app.state.limiteEstadualUserHidden = false;

      // 1) UI imediata: tudo off, Limite Estadual on (nunca desliga).
      app.uncheckAllDataLayerToggles({ keepLimiteEstadual: true });
      try {
        const limel = app.layerLimiteToggle || app.$("layer-limite-estadual");
        if (limel) {
          limel.disabled = false;
          limel.checked = true;
        }
      } catch {
        // ignore
      }
      app.forceOnlyLimiteEstadualOn();
      app.syncLayerRowsToggleUi();
      app.clearCurrentSelection();
      try {
        app.dismissTablesAndPopups?.();
      } catch {
        // ignore
      }

      // 2) Remoção síncrona do mapa (protege e reconfirma Limite Estadual).
      app.setDataPanesHiddenInstant(true);
      app.purgeAllDataLayersFromMapSync({ keepLimiteEstadual: true });
      app.setDataPanesHiddenInstant(false);
      app.clearEphemeralClientCaches({ keepLimiteEndpoints: true });

      const ensureLimiteOnly = () => {
        try {
          const limel = app.layerLimiteToggle || app.$("layer-limite-estadual");
          if (limel) {
            limel.disabled = false;
            limel.checked = true;
          }
        } catch {
          // ignore
        }
        app.forceOnlyLimiteEstadualOn();
        app.syncLayerRowsToggleUi();
      };

      ensureLimiteOnly();
      void Promise.resolve(app.attachLimiteEstadualLayerIfNeeded())
        .catch(() => null)
        .finally(() => {
          ensureLimiteOnly();
        });

      app.state.suppressAutoFit = false;
      app.state.suppressAutoOpenTableOnLayerToggle = false;
      window.setTimeout(() => {
        if (app.state.bulkLayersIntent === "off") app.state.bulkLayersIntent = null;
        ensureLimiteOnly();
        try {
          app.renderLayerLegend();
        } catch {
          // ignore
        }
      }, 400);
    }

  app.afterRodoviasSublayerVisibilityChange = function afterRodoviasSublayerVisibilityChange() {
      if (!app.state.map) return;
      // Desempenho/UX: ligar/desligar camadas deve ser instantâneo (sem auto-zoom),
      // pois calcular bounds e chamar fitBounds em camadas grandes causa travadas perceptíveis.
      if (app.state.disableAutoFitOnLayerToggle) return;
      if (app.state.suppressAutoFit) return;
      // lockViewToAmazonasUntil desativado (0): sem comportamento especial temporizado.
      if (app.allRodoviasSublayersChecked()) {
        app.fitMapToStateBoundaryNow();
        return;
      }
      if (app.layerSegmentosToggle?.checked && app.state.geojsonLayer) {
        const b = app.state.geojsonLayer.getBounds?.();
        if (b?.isValid?.()) {
          app.state.map.fitBounds(b, {
            animate: false,
            duration: 0,
            padding: [28, 28],
            maxZoom: 16,
          });
        }
        return;
      }
      if (app.layerBueirosToggle?.checked && app.state.bueirosLayer?.getBounds) {
        const b = app.state.bueirosLayer.getBounds();
        if (b?.isValid?.()) {
          app.state.map.fitBounds(b, {
            maxZoom: 17,
            padding: [36, 36],
            animate: false,
            duration: 0,
          });
        }
        return;
      }
      if (app.layerPontesToggle?.checked && app.state.pontesBr307Layer?.getBounds) {
        const b = app.state.pontesBr307Layer.getBounds();
        if (b?.isValid?.()) {
          app.state.map.fitBounds(b, {
            maxZoom: 17,
            padding: [36, 36],
            animate: false,
            duration: 0,
          });
        }
        return;
      }
      if (app.layerJazidasToggle?.checked && app.state.jazidasBr307Layer?.getBounds) {
        const b = app.state.jazidasBr307Layer.getBounds();
        if (b?.isValid?.()) {
          app.state.map.fitBounds(b, {
            maxZoom: 17,
            padding: [36, 36],
            animate: false,
            duration: 0,
          });
        }
      }
    }

  app.fetchLimiteMunicipalInfo = function fetchLimiteMunicipalInfo() {
      return fetch("/layers/limite-municipal/info")
        .then((r) => r.json())
        .catch(() => ({ available: false }));
    }

  app.applyLimiteMunicipalAvailability = function applyLimiteMunicipalAvailability(info) {
      if (!app.layerLimiteMunicipalToggle) return;
      if (!info?.available) {
        app.layerLimiteMunicipalToggle.disabled = true;
        app.layerLimiteMunicipalToggle.checked = false;
        app.layerLimiteMunicipalRow?.classList.add("layer-row--disabled");
        if (app.state.boundaryMunicipalHoverLayer && app.state.map) app.state.map.removeLayer(app.state.boundaryMunicipalHoverLayer);
        if (app.state.boundaryMunicipalLayer && app.state.map) app.state.map.removeLayer(app.state.boundaryMunicipalLayer);
        app.state.boundaryMunicipalLayer = null;
        app.state.boundaryMunicipalHoverLayer = null;
        return;
      }
      app.layerLimiteMunicipalToggle.disabled = false;
      app.layerLimiteMunicipalRow?.classList.remove("layer-row--disabled");
    }

}
