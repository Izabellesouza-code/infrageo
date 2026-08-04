/* global L */
export function registerBottomSheet(app) {

  app.ensureInfraGeoPanes = function ensureInfraGeoPanes() {
      if (!app.state.map) return null;
      if (app.state.panes) return app.state.panes;

      // Ordem: limite (fundo) → polígonos → linhas → pontos → highlight (topo)
      const mk = (name, zIndex) => {
        const id = `ig-${name}`;
        let pane = app.state.map.getPane?.(id);
        if (!pane) pane = app.state.map.createPane(id);
        if (pane && pane.style) pane.style.zIndex = String(zIndex);
        return id;
      };

      app.state.panes = {
        boundary: mk("boundary", 240),
        polygons: mk("polygons", 340),
        lines: mk("lines", 420),
        points: mk("points", 520),
        // Mantém abaixo do tooltipPane (Leaflet usa ~650) para não “tapar” tooltips/popups.
        highlight: mk("highlight", 640),
      };
      return app.state.panes;
    }

  app.isBottomSheetVisible = function isBottomSheetVisible() {
      return Boolean(app.bottomSheet && !app.bottomSheet.classList.contains("is-collapsed"));
    }

  app.syncBottomSheetChrome = function syncBottomSheetChrome() {
      const peeking = Boolean(app.bottomSheet?.classList.contains("is-peek"));
      const hasPeekSelection = Boolean(app.state.peekSelectionActive);
      if (app.bottomSheetRestore) app.bottomSheetRestore.hidden = !peeking;
      if (app.bottomZoomSelected) app.bottomZoomSelected.hidden = peeking && !hasPeekSelection;
      app.bottomSheet?.classList.toggle("is-peek-active", peeking);
      app.bottomSheet?.classList.toggle("has-peek-selection", peeking && hasPeekSelection);
      // Não sobrepor o sheet com o chip “Camada selecionada” (canto inferior esquerdo).
      if (app.isBottomSheetVisible()) {
        try {
          app.hideMapCoordsControl();
        } catch {
          // ignore
        }
      }
    }

  app.getFeatureDisplayLabel = function getFeatureDisplayLabel(feature) {
      const props = feature?.properties || {};
      return (
        app.getFirstNonEmptyValue(props, [
          "nome",
          "NOME",
          "nm_municipio",
          "municipio",
          "vl_codigo",
          "codigo",
          "id",
          "ds_local_i",
          "contrato",
          "CONTRATO",
          "contratos",
          "CONTRATOS",
        ]) || "Feição selecionada"
      );
    }

  app.resetPeekSelectionSummary = function resetPeekSelectionSummary() {
      app.state.peekSelectionActive = false;
      const peekLabel = app.$("bottom-sheet-peek-label");
      const peekHint = app.$("bottom-sheet-peek-hint");
      if (peekLabel) peekLabel.textContent = "Tabela de atributos";
      if (peekHint) peekHint.textContent = "Toque para expandir";
      app.bottomSheet?.classList.remove("has-peek-selection");
      app.syncBottomSheetChrome();
    }

  app.syncPeekSelectionSummary = function syncPeekSelectionSummary(feature, selectionKind) {
      const peekLabel = app.$("bottom-sheet-peek-label");
      const peekHint = app.$("bottom-sheet-peek-hint");
      if (!peekLabel || !peekHint) return;
      if (!feature) {
        app.resetPeekSelectionSummary();
        return;
      }
      app.state.peekSelectionActive = true;
      const layerLabel = app.getPanelTableLabel();
      peekLabel.textContent = String(layerLabel || "Camada");
      peekHint.textContent = `${app.getFeatureDisplayLabel(feature)} · selecionado`;
      app.bottomSheet?.classList.add("has-peek-selection");
      app.syncBottomSheetChrome();
    }

  app.peekBottomSheet = function peekBottomSheet() {
      if (!app.isBottomSheetVisible()) return;
      app.bottomSheet.classList.add("is-peek");
      app.bottomSheet.style.height = "";
      app.syncBottomSheetChrome();
    }

  app.expandBottomSheet = function expandBottomSheet() {
      if (!app.bottomSheet) return;
      app.closeMobileSidebarIfNeeded();
      app.bottomSheet.classList.remove("is-peek");
      app.syncBottomSheetChrome();
    }

  app.openBottomSheet = function openBottomSheet() {
      if (!app.bottomSheet) return;
      app.closeMobileSidebarIfNeeded();
      app.bottomSheet.classList.remove("is-collapsed", "is-peek");
      app.bottomSheet.setAttribute("aria-hidden", "false");
      app.syncBottomSheetChrome();
      try {
        if (app.state.map?.invalidateSize) {
          requestAnimationFrame(() => app.state.map.invalidateSize({ animate: false }));
        }
      } catch {
        // ignore
      }
    }

  app.closeBottomSheet = function closeBottomSheet() {
      if (!app.bottomSheet) return;
      app.bottomSheet.classList.add("is-collapsed");
      app.bottomSheet.classList.remove("is-peek");
      app.bottomSheet.setAttribute("aria-hidden", "true");
      app.state.tablePinnedFromMap = false;
      app.state.lastMapClickLayerId = null;
      app.resetPeekSelectionSummary();
      app.syncBottomSheetChrome();
    }

  app.getBottomSheetInsetBottom = function getBottomSheetInsetBottom() {
      if (!app.isBottomSheetVisible()) return 0;
      return Math.ceil(app.bottomSheet.getBoundingClientRect().height) + 16;
    }

  app.fitMapBoundsWithSheetPadding = function fitMapBoundsWithSheetPadding(bounds, options = {}) {
      if (!app.state.map || !bounds?.isValid?.()) return;
      const mapCap = typeof app.state.map.getMaxZoom === "function" ? app.state.map.getMaxZoom() : 22;
      const maxZ = typeof options.maxZoom === "number" ? options.maxZoom : mapCap;
      const padX = typeof options.padX === "number" ? options.padX : 20;
      const padTop = typeof options.padTop === "number" ? options.padTop : 20;
      const padBottom = app.getBottomSheetInsetBottom() + padX;
      app.state.map.fitBounds(bounds, {
        maxZoom: maxZ,
        animate: false,
        duration: 0,
        paddingTopLeft: L.point(padX, padTop),
        paddingBottomRight: L.point(padX, padBottom),
      });
    }

  app.zoomSelectionFromTable = function zoomSelectionFromTable(feature, layer, selectionKind) {
      app.peekBottomSheet();
      app.syncPeekSelectionSummary(feature, selectionKind);
      if (layer?.getBounds) {
        app.applySelectionZoomIfNeeded(layer, selectionKind, true, true);
      } else {
        app.zoomToFeatureNow(feature, layer, selectionKind, true);
      }
      app.pinFeatureQuickMenu(feature, selectionKind, null, null, layer);
    }

  app.syncBottomZoomButton = function syncBottomZoomButton() {
      if (!app.bottomZoomSelected) return;
      app.bottomZoomSelected.disabled = !app.state.selectedFeature;
    }

}
