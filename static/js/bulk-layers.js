/* global L */
export function registerBulkLayers(app) {

  app.ensureLayerVisibleOnMap = function ensureLayerVisibleOnMap(layerObj, { force = false } = {}) {
      if (!app.state.map || !layerObj) return;
      // Limite Estadual sempre pode ser (re)montado, inclusive no "desligar todas".
      if (layerObj === app.state.boundaryLayer) {
        try {
          if (!app.state.map.hasLayer(layerObj)) layerObj.addTo(app.state.map);
        } catch {
          // noop
        }
        return;
      }
      if (!force && app.state.bulkLayersIntent === "off") return;
      try {
        if (!app.state.map.hasLayer(layerObj)) layerObj.addTo(app.state.map);
      } catch {
        // noop
      }
    }

  app.toggleForDataLayer = function toggleForDataLayer(layer) {
      if (!layer) return null;
      if (layer === app.state.geojsonLayer) return app.layerSegmentosToggle;
      if (layer === app.state.bueirosLayer) return app.layerBueirosToggle;
      if (layer === app.state.pontesBr307Layer) return app.layerPontesToggle;
      if (layer === app.state.pontesBr319Layer) return app.layerPontesBr319Toggle;
      if (layer === app.state.pontesBr230Layer) return app.layerPontesBr230Toggle;
      if (layer === app.state.bueirosBr319Layer) return app.layerBueirosBr319Toggle;
      if (layer === app.state.jazidasBr307Layer) return app.layerJazidasToggle;
      if (layer === app.state.hidroviasAmLayer) return app.layerHidroviasAmToggle;
      if (layer === app.state.ucEstadualLayer) return app.layerUcEstadualToggle;
      if (layer === app.state.ucMunicipalLayer) return app.layerUcMunicipalToggle;
      if (layer === app.state.ip4Layer) return app.layerIp4Toggle;
      if (layer === app.state.tiAmLayer) return app.layerTiAmToggle;
      if (layer === app.state.bueirosBr174Layer) return app.layerBueirosBr174Toggle;
      if (layer === app.state.pradsBr174Layer) return app.layerPradsBr174Toggle;
      if (layer === app.state.pcaPradsBr319Layer) return app.layerPcaPradsBr319Toggle;
      if (layer === app.state.pradsBr319Layer) return app.layerPradsBr319Toggle;
      if (layer === app.state.pcaPradsCmmBr319Layer) return app.layerPcaPradsCmmBr319Toggle;
      if (layer === app.state.bueirosBr230Layer) return app.layerBueirosBr230Toggle;
      if (layer === app.state.boundaryMunicipalLayer || layer === app.state.boundaryMunicipalHoverLayer) {
        return app.layerLimiteMunicipalToggle;
      }
      return null;
    }

  app.mountDataLayerIfAllowed = function mountDataLayerIfAllowed(layer, toggleEl = null) {
      if (!app.state.map || !layer) return false;
      // Limite Estadual: nunca bloqueado pelo "desligar todas".
      if (layer === app.state.boundaryLayer) {
        try {
          if (!app.state.map.hasLayer(layer)) layer.addTo(app.state.map);
          return true;
        } catch {
          return false;
        }
      }
      if (app.state.bulkLayersIntent === "off") return false;
      const toggle = toggleEl || app.toggleForDataLayer(layer);
      if (toggle && !toggle.checked) return false;
      try {
        if (!app.state.map.hasLayer(layer)) layer.addTo(app.state.map);
        return true;
      } catch {
        return false;
      }
    }

  app.syncLayerRowsToggleUi = function syncLayerRowsToggleUi() {
      document.querySelectorAll('.layer-row input[type="checkbox"][id^="layer-"]').forEach((inp) => {
        const row = inp.closest?.(".layer-row");
        if (!row) return;
        row.classList.toggle("is-on", Boolean(inp.checked));
        row.classList.toggle("is-off", !inp.checked);
        row.setAttribute("data-layer-on", inp.checked ? "1" : "0");
      });
      try {
        app.updateCamadasFootSummary();
      } catch {
        // ignore
      }
      try {
        if (!app.menuToggleLayersBtn) return;
        const txt = app.menuToggleLayersBtn.querySelector?.(".sidebar-action-text");
        if (!txt) return;
        txt.dataset.originalText = "Ligar/Desligar camadas";
        if (!app.state.menuToggleLayersBusy) {
          txt.textContent = "Ligar/Desligar camadas";
        }
        app.menuToggleLayersBtn.setAttribute(
          "title",
          app.allAvailableDataTogglesOff()
            ? "Ligar todas as camadas de dados"
            : "Desligar todas as camadas de dados (mantém o Limite Estadual)",
        );
      } catch {
        // ignore
      }
    }

  app.collapseAllCamadasGroups = function collapseAllCamadasGroups() {
      try {
        document.querySelectorAll(".sidebar-section--layers .layer-group").forEach((group) => {
          group.classList.remove("is-expanded");
          const head = group.querySelector(".layer-group-heading--toggle, .layer-group-heading");
          const subtree = group.querySelector(".layer-subtree");
          if (head) head.setAttribute("aria-expanded", "false");
          if (subtree) subtree.setAttribute("aria-hidden", "true");
        });
        document.querySelectorAll(".sidebar-section--layers .layer-branch").forEach((branch) => {
          branch.classList.remove("is-expanded");
          const head = branch.querySelector(".layer-branch-head--toggle, .layer-branch-head");
          if (head) head.setAttribute("aria-expanded", "false");
        });
        try {
          app.setBrAmGroupExpanded(false);
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    }

  app.bumpMapLayerEpoch = function bumpMapLayerEpoch(intent = null) {
      app.state.mapLayerEpoch = (app.state.mapLayerEpoch || 0) + 1;
      app.state.bulkLayersIntent = intent;
      return app.state.mapLayerEpoch;
    }

  app.purgeAllDataLayersFromMapSync = function purgeAllDataLayersFromMapSync({ keepLimiteEstadual = true } = {}) {
      if (!app.state.map) return;
      const m = app.state.map;
      const keep = new Set();
      const boundaryPaneId = app.state.panes?.boundary || "";
      try {
        if (app.state.base) keep.add(app.state.base);
        if (keepLimiteEstadual && app.state.boundaryLayer) keep.add(app.state.boundaryLayer);
      } catch {
        // ignore
      }

      const isBoundaryRelated = (lyr) => {
        if (!lyr || !keepLimiteEstadual) return false;
        // Nunca remover Limite Estadual (grupo ou filhos).
        if (lyr === app.state.boundaryLayer) return true;
        try {
          if (app.state.boundaryLayer?.hasLayer?.(lyr)) return true;
        } catch {
          // ignore
        }
        // Municipal nunca é protegido.
        if (lyr === app.state.boundaryMunicipalLayer || lyr === app.state.boundaryMunicipalHoverLayer) return false;
        // Qualquer vetor no pane de boundary (exceto municipal) = limite estadual.
        try {
          if (boundaryPaneId && lyr?.options?.pane === boundaryPaneId) return true;
        } catch {
          // ignore
        }
        return false;
      };

      // 1) Remoção explícita das layers conhecidas (rápido e previsível).
      for (const lyr of app.listDataLayersForBulkOff({ includeLimiteEstadual: !keepLimiteEstadual })) {
        if (isBoundaryRelated(lyr)) continue;
        try {
          if (lyr && m.hasLayer(lyr)) m.removeLayer(lyr);
        } catch {
          // ignore
        }
        try {
          lyr?.remove?.();
        } catch {
          // ignore
        }
      }

      // 2) Varredura residual: qualquer GeoJSON/FeatureGroup que tenha sobrado.
      const leftovers = [];
      try {
        m.eachLayer((lyr) => {
          if (!lyr || keep.has(lyr)) return;
          if (lyr instanceof L.TileLayer || lyr instanceof L.GridLayer) return;
          if (lyr === app.state.base) return;
          if (isBoundaryRelated(lyr)) return;
          leftovers.push(lyr);
        });
      } catch {
        // ignore
      }
      for (const lyr of leftovers) {
        try {
          m.removeLayer(lyr);
        } catch {
          // ignore
        }
      }

      // 3) Garante Limite Estadual de volta no mapa (não pode sumir no bulk-off).
      if (keepLimiteEstadual && app.state.boundaryLayer) {
        try {
          if (!m.hasLayer(app.state.boundaryLayer)) app.state.boundaryLayer.addTo(m);
        } catch {
          // ignore
        }
      }
    }

  app.getAllDataLayerToggles = function getAllDataLayerToggles() {
      const nodes = Array.from(document.querySelectorAll('.layer-row input[type="checkbox"][id^="layer-"]'));
      return nodes.filter((el) => {
        if (!el) return false;
        const id = String(el.id || "");
        // Nunca tratar Limite Estadual como camada “desligável” no bulk.
        if (id === "layer-limite-estadual") return false;
        if (el === app.layerLimiteToggle) return false;
        return true;
      });
    }

  app.allAvailableDataTogglesOff = function allAvailableDataTogglesOff() {
      const toggles = app.getAllDataLayerToggles().filter((t) => !t.disabled);
      if (!toggles.length) return true;
      return toggles.every((t) => !t.checked);
    }

  app.ensureToggleLayerLoaded = async function ensureToggleLayerLoaded(toggleEl) {
      const meta = app.getEnsureForToggle(toggleEl);
      if (!meta?.ensure) return;
      await Promise.resolve(meta.ensure());
      // Limite Municipal: linha visual + hover — usar apply* (não só o hover).
      if (toggleEl === app.layerLimiteMunicipalToggle) {
        try {
          app.applyLimiteMunicipalVisibility();
        } catch {
          // ignore
        }
        return;
      }
      try {
        const lyr = meta.getLayer?.();
        if (lyr) app.ensureLayerVisibleOnMap(lyr);
      } catch {
        // ignore
      }
    }

  app.loadAllCheckedLayersNow = async function loadAllCheckedLayersNow() {
      const toggles = app.getAllDataLayerToggles().filter((t) => t && !t.disabled && t.checked);
      // Carrega em paralelo (não muda zoom; sem delays artificiais)
      await Promise.allSettled(toggles.map((t) => app.ensureToggleLayerLoaded(t)));
    }

  app.listDataLayersForBulkOff = function listDataLayersForBulkOff({ includeLimiteEstadual = false } = {}) {
      const layers = [
        app.state.geojsonLayer,
        app.state.bueirosLayer,
        app.state.pontesBr307Layer,
        app.state.pontesBr319Layer,
        app.state.pontesBr230Layer,
        app.state.bueirosBr319Layer,
        app.state.jazidasBr307Layer,
        app.state.hidroviasAmLayer,
        app.state.ucEstadualLayer,
        app.state.ucMunicipalLayer,
        app.state.ip4Layer,
        app.state.tiAmLayer,
        app.state.bueirosBr174Layer,
        app.state.pradsBr174Layer,
        app.state.pcaPradsBr319Layer,
        app.state.pradsBr319Layer,
        app.state.pcaPradsCmmBr319Layer,
        app.state.bueirosBr230Layer,
        app.state.boundaryMunicipalLayer,
        app.state.boundaryMunicipalHoverLayer,
      ];
      if (includeLimiteEstadual) layers.push(app.state.boundaryLayer);
      try {
        const brAm = app.state.brAm?.layersById || {};
        for (const lyr of Object.values(brAm)) layers.push(lyr);
      } catch {
        // ignore
      }
      try {
        const shields = app.state.brAm?.shieldsById || {};
        for (const lyr of Object.values(shields)) layers.push(lyr);
      } catch {
        // ignore
      }
      return layers.filter(Boolean);
    }

  app.setDataPanesHiddenInstant = function setDataPanesHiddenInstant(hidden) {
      if (!app.state.map) return;
      app.ensureInfraGeoPanes();
      const paneIds = [];
      try {
        if (app.state.panes?.polygons) paneIds.push(app.state.panes.polygons);
        if (app.state.panes?.lines) paneIds.push(app.state.panes.lines);
        if (app.state.panes?.points) paneIds.push(app.state.panes.points);
        if (app.state.panes?.highlight) paneIds.push(app.state.panes.highlight);
        paneIds.push("markerPane");
        paneIds.push("shadowPane");
      } catch {
        // ignore
      }
      for (const id of paneIds) {
        try {
          const pane = typeof id === "string" ? app.state.map.getPane?.(id) : null;
          if (pane?.style) pane.style.visibility = hidden ? "hidden" : "";
        } catch {
          // ignore
        }
      }
    }

  app.uncheckAllDataLayerToggles = function uncheckAllDataLayerToggles({ keepLimiteEstadual = true } = {}) {
      app.getAllDataLayerToggles().forEach((el) => {
        if (el) el.checked = false;
      });
      if (app.layerLimiteMunicipalToggle) app.layerLimiteMunicipalToggle.checked = false;
      // Limite Estadual: sempre ligado quando keepLimiteEstadual (padrão do bulk-off).
      const limel = app.layerLimiteToggle || app.$("layer-limite-estadual");
      if (keepLimiteEstadual) {
        try {
          if (limel) {
            limel.disabled = false;
            limel.checked = true;
          }
        } catch {
          // ignore
        }
      } else if (limel) {
        limel.checked = false;
      }
    }

  app.turnOnAllDataLayersFast = function turnOnAllDataLayersFast() {
      if (!app.state.map) return;
      app.bumpMapLayerEpoch("on");
      app.state.suppressAutoFit = true;
      app.state.suppressAutoOpenTableOnLayerToggle = true;
      try {
        app.hideFeatureQuickMenu(true);
        app.collapseAllCamadasGroups();
      } catch {
        // ignore
      }

      app.getAllDataLayerToggles()
        .filter((t) => t && !t.disabled)
        .forEach((t) => {
          t.checked = true;
          try {
            t.dispatchEvent(new Event("change", { bubbles: true }));
          } catch {
            // ignore
          }
        });
      app.syncLayerRowsToggleUi();
      // Não expandir a árvore ao ligar em lote — só liga no mapa.
      try {
        app.collapseAllCamadasGroups();
      } catch {
        // ignore
      }

      app.state.suppressAutoFit = false;
      app.state.suppressAutoOpenTableOnLayerToggle = false;
      // Carrega em paralelo sem bloquear o clique.
      void app.loadAllCheckedLayersNow().finally(() => {
        if (app.state.bulkLayersIntent === "on") app.state.bulkLayersIntent = null;
        app.syncLayerRowsToggleUi();
        try {
          app.collapseAllCamadasGroups();
          app.renderLayerLegend();
        } catch {
          // ignore
        }
      });
    }

  app.getEnsureForToggle = function getEnsureForToggle(toggleEl) {
      // Mapeia toggle -> ensure() / layer getter para podermos "await" o carregamento real.
      const table = new Map([
        [app.layerBueirosToggle, { ensure: app.ensureBueirosBr317OnMap, getLayer: () => app.state.bueirosLayer }],
        [app.layerPontesToggle, { ensure: app.ensurePontesBr307OnMap, getLayer: () => app.state.pontesBr307Layer }],
        [app.layerJazidasToggle, { ensure: app.ensureJazidasBr307OnMap, getLayer: () => app.state.jazidasBr307Layer }],
        [app.layerUcEstadualToggle, { ensure: app.ensureUcEstadualOnMap, getLayer: () => app.state.ucEstadualLayer }],
        [app.layerUcMunicipalToggle, { ensure: app.ensureUcMunicipalOnMap, getLayer: () => app.state.ucMunicipalLayer }],
        [app.layerIp4Toggle, { ensure: app.ensureIp4OnMap, getLayer: () => app.state.ip4Layer }],
        [app.layerTiAmToggle, { ensure: app.ensureTiAmOnMap, getLayer: () => app.state.tiAmLayer }],
        [app.layerHidroviasAmToggle, { ensure: app.ensureHidroviasAmOnMap, getLayer: () => app.state.hidroviasAmLayer }],
        [app.layerPontesBr319Toggle, { ensure: app.ensurePontesBr319OnMap, getLayer: () => app.state.pontesBr319Layer }],
        [app.layerPontesBr230Toggle, { ensure: app.ensurePontesBr230OnMap, getLayer: () => app.state.pontesBr230Layer }],
        [app.layerBueirosBr319Toggle, { ensure: app.ensureBueirosBr319OnMap, getLayer: () => app.state.bueirosBr319Layer }],
        [app.layerBueirosBr174Toggle, { ensure: app.ensureBueirosBr174OnMap, getLayer: () => app.state.bueirosBr174Layer }],
        [app.layerBueirosBr230Toggle, { ensure: app.ensureBueirosBr230OnMap, getLayer: () => app.state.bueirosBr230Layer }],
        [app.layerPradsBr174Toggle, { ensure: app.ensurePradsBr174OnMap, getLayer: () => app.state.pradsBr174Layer }],
        [app.layerPcaPradsBr319Toggle, { ensure: app.ensurePcaPradsBr319OnMap, getLayer: () => app.state.pcaPradsBr319Layer }],
        [app.layerPradsBr319Toggle, { ensure: app.ensurePradsBr319OnMap, getLayer: () => app.state.pradsBr319Layer }],
        [app.layerPcaPradsCmmBr319Toggle, { ensure: app.ensurePcaPradsCmmBr319OnMap, getLayer: () => app.state.pcaPradsCmmBr319Layer }],
        [app.layerLimiteMunicipalToggle, { ensure: app.attachLimiteMunicipalLayerIfNeeded, getLayer: () => app.state.boundaryMunicipalHoverLayer }],
      ]);
      return table.get(toggleEl) || null;
    }

  app.toggleDataLayersFromMenu = function toggleDataLayersFromMenu() {
      if (!app.state.map) return;
      if (app.state.menuToggleLayersBusy) return;
      app.state.menuToggleLayersBusy = true;
      try {
        app.state.lockViewToAmazonasUntil = 0;

        if (app.allAvailableDataTogglesOff()) {
          app.turnOnAllDataLayersFast();
          return;
        }

        app.turnOffAllDataLayersKeepLimiteEstadual();
        app.collapseAllCamadasGroups();
      } finally {
        app.state.menuToggleLayersBusy = false;
        app.syncLayerRowsToggleUi();
      }
    }

}
