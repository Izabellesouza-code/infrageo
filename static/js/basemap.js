/* global L */
export function registerBasemap(app) {

  app.FEATURE_COLORS_MAX = 400;

  app.colorPalette = [
      "#2E7D32",
      "#1565C0",
      "#00897B",
      "#5E35B1",
      "#00838F",
      "#2F6FD6",
      "#3C8D2F",
      "#1E88E5",
      "#43A047",
      "#0D47A1",
    ];

  app.featureColors = new Map();

  app.colorIndex = 0;

  app.hideMapCoordsControl = function hideMapCoordsControl() {
      if (!app.state.coordsControl) return;
      try {
        app.state.coordsControl.remove?.();
      } catch {
        // ignore
      }
      app.state.coordsControl = null;
      app.state.coordsControlEl = null;
    }

  app.renderMapCoords = function renderMapCoords() {
      if (!app.state.coordsControlEl) return;
      const layerLabel = app.state.coords?.selectedLayerLabel ? `Camada selecionada: ${app.state.coords.selectedLayerLabel}` : "Camada selecionada: —";
      app.state.coordsControlEl.textContent = layerLabel;
    }

  app.isSatelliteBasemapActive = function isSatelliteBasemapActive() {
      const id = String(app.state.currentBasemapId || "");
      return id === "imagery" || id === "google-earth";
    }

  app.getBasemapStyleMode = function getBasemapStyleMode() {
      const id = String(app.state.currentBasemapId || "");
      if (id === "imagery" || id === "google-earth") return "imagery";
      if (id === "dark") return "dark";
      if (id === "gray") return "gray";
      if (id === "carto-positron") return "carto";
      if (id === "osm") return "osm";
      if (id === "streets") return "streets";
      if (id === "topo") return "topo";
      if (id === "terrain") return "terrain";
      return "carto";
    }

  app.getBasemapTuning = function getBasemapTuning() {
      const mode = app.getBasemapStyleMode();
      // Ideia:
      // - Carto (limpo): pode ser mais “forte”
      // - OSM/Streets/Topo/Terrain: base mais “barulhenta” → reduzir peso/opacidade
      // - Dark/Gray: reduzir peso e ajustar contraste
      if (mode === "imagery") return { lineWeightDelta: 0, lineOpacity: 0.97, fillOpacityScale: 1.0 };
      if (mode === "carto") return { lineWeightDelta: 0, lineOpacity: 0.95, fillOpacityScale: 1.0 };
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        return { lineWeightDelta: -0.7, lineOpacity: 0.78, fillOpacityScale: 0.65 };
      }
      if (mode === "dark") return { lineWeightDelta: -0.7, lineOpacity: 0.82, fillOpacityScale: 0.55 };
      if (mode === "gray") return { lineWeightDelta: -0.8, lineOpacity: 0.72, fillOpacityScale: 0.55 };
      return { lineWeightDelta: 0, lineOpacity: 0.95, fillOpacityScale: 1.0 };
    }

  app.tunedLine = function tunedLine(weight) {
      const t = app.getBasemapTuning();
      return { weight: Math.max(1.4, (weight || 2.4) + t.lineWeightDelta), opacity: t.lineOpacity };
    }

  app.tunedFill = function tunedFill(fillOpacity) {
      const t = app.getBasemapTuning();
      return { fillOpacity: Math.max(0.06, Math.min(0.6, (fillOpacity || 0.2) * t.fillOpacityScale)) };
    }

  app.getBoundaryLayerStyle = function getBoundaryLayerStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        return {
          color: "#d1d5db",
          weight: 1.4,
          opacity: 0.88,
          fillOpacity: 0,
        };
      }
      if (mode === "dark") {
        return { color: "rgba(226,232,240,.92)", weight: 1.2, opacity: 0.9, fillOpacity: 0 };
      }
      if (mode === "gray") {
        return { color: "rgba(15,23,42,.85)", weight: 1.1, opacity: 0.7, fillOpacity: 0 };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        return { color: "rgba(15,23,42,.78)", weight: 0.95, opacity: 0.55, fillOpacity: 0 };
      }
      return {
        color: app.isSatelliteBasemapActive() ? "#d1d5db" : "#111111",
        weight: 1,
        opacity: 0.65,
        fillOpacity: 0,
      };
    }

  app.getLimiteMunicipalLayerStyle = function getLimiteMunicipalLayerStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        // fillOpacity mínimo para capturar hover em toda a área do município (Leaflet só “pega” no traço quando fillOpacity=0)
        return { color: "#457c78", weight: 0.9, opacity: 0.75, fillColor: "#457c78", fillOpacity: 0.01 };
      }
      if (mode === "dark") {
        return { color: "rgba(148,163,184,.85)", weight: 0.9, opacity: 0.65, fillColor: "rgba(148,163,184,.85)", fillOpacity: 0.01 };
      }
      if (mode === "gray") {
        return { color: "rgba(51,65,85,.70)", weight: 0.85, opacity: 0.55, fillColor: "rgba(51,65,85,.70)", fillOpacity: 0.01 };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        return { color: "rgba(51,65,85,.62)", weight: 0.75, opacity: 0.45, fillColor: "rgba(51,65,85,.62)", fillOpacity: 0.01 };
      }
      return { color: "#334155", weight: 0.8, opacity: 0.5, fillColor: "#334155", fillOpacity: 0.01 };
    }

  app.getSegmentLayerStyle = function getSegmentLayerStyle(feature) {
      const color = app.getColorForFeature(feature);
      if (app.isSatelliteBasemapActive()) {
        return {
          color,
          weight: 2.2,
          opacity: 1,
          fillColor: color,
          fillOpacity: 0.72,
        };
      }
      return { color, weight: 1.5, fillColor: color, fillOpacity: 0.45 };
    }

  app.createBueirosPointIcon = function createBueirosPointIcon(kind = "bueiros") {
      return app.createStandardPointIcon(kind || "bueiros");
    }

  app.createPontesPointIcon = function createPontesPointIcon(kind = "pontes") {
      return app.createStandardPointIcon(kind || "pontes");
    }

  app.createJazidasPointIcon = function createJazidasPointIcon() {
      return app.createStandardPointIcon("jazidas");
    }

  app.createIp4PointIcon = function createIp4PointIcon() {
      return app.createStandardPointIcon("ip4");
    }

  app.createPradsPointIcon = function createPradsPointIcon(kind = "prads") {
      return app.createStandardPointIcon(kind || "prads");
    }

  app.getBueirosLineStyle = function getBueirosLineStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        return { color: "#ffe0b2", weight: 3.6, opacity: 0.98 };
      }
      if (mode === "dark") {
        return { color: "rgba(203,213,225,.92)", weight: 2.6, opacity: 0.85 };
      }
      if (mode === "gray") {
        return { color: "rgba(71,85,105,.92)", weight: 2.4, opacity: 0.72 };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(2.6);
        return { color: "rgba(71,85,105,.92)", weight: t.weight, opacity: t.opacity };
      }
      return { color: "#4e342e", weight: 3, opacity: 0.92 };
    }

  app.getBueirosPolygonStyle = function getBueirosPolygonStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        return {
          color: "#ffe0b2",
          weight: 2.2,
          fillColor: "#ffcc80",
          fillOpacity: 0.42,
        };
      }
      if (mode === "dark") {
        return { color: "rgba(203,213,225,.92)", weight: 1.7, fillColor: "rgba(148,163,184,.35)", fillOpacity: 0.18 };
      }
      if (mode === "gray") {
        return { color: "rgba(71,85,105,.88)", weight: 1.6, fillColor: "rgba(71,85,105,.18)", fillOpacity: 0.12 };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(1.7);
        const f = app.tunedFill(0.18);
        return { color: "rgba(71,85,105,.88)", weight: t.weight, fillColor: "rgba(71,85,105,.18)", fillOpacity: f.fillOpacity };
      }
      return {
        color: "#4e342e",
        weight: 2,
        fillColor: "#8d6e63",
        fillOpacity: 0.28,
      };
    }

  app.getJazidasLineStyle = function getJazidasLineStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        return { color: "#ef6c00", weight: 3.4, opacity: 0.98 };
      }
      if (mode === "dark") {
        return { color: "rgba(251,191,36,.95)", weight: 2.6, opacity: 0.85 };
      }
      if (mode === "gray") {
        return { color: "rgba(180,83,9,.95)", weight: 2.4, opacity: 0.75 };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(2.6);
        return { color: "#ef6c00", weight: t.weight, opacity: t.opacity };
      }
      return { color: "#ef6c00", weight: 2.8, opacity: 0.92 };
    }

  app.getJazidasPolygonStyle = function getJazidasPolygonStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        const c = "#ef6c00";
        return { color: c, weight: 2.2, fillColor: "rgba(239,108,0,.22)", fillOpacity: app.tunedFill(0.28).fillOpacity };
      }
      if (mode === "dark") {
        return { color: "rgba(251,191,36,.95)", weight: 1.7, fillColor: "rgba(251,191,36,.22)", fillOpacity: 0.14 };
      }
      if (mode === "gray") {
        return { color: "rgba(180,83,9,.92)", weight: 1.6, fillColor: "rgba(180,83,9,.18)", fillOpacity: 0.12 };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(1.7);
        const f = app.tunedFill(0.22);
        return { color: "#ef6c00", weight: t.weight, fillColor: "rgba(239,108,0,.18)", fillOpacity: f.fillOpacity };
      }
      return { color: "#ef6c00", weight: 1.8, fillColor: "rgba(239,108,0,.16)", fillOpacity: app.tunedFill(0.24).fillOpacity };
    }

  app.getPontesLineStyle = function getPontesLineStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        return { color: "#0d47a1", weight: 4.4, opacity: 0.98 };
      }
      if (mode === "dark") {
        const t = app.tunedLine(3.0);
        return { color: "rgba(147,197,253,.95)", weight: t.weight, opacity: t.opacity };
      }
      if (mode === "gray") {
        const t = app.tunedLine(3.0);
        return { color: "rgba(30,64,175,.90)", weight: t.weight, opacity: t.opacity };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(3.0);
        return { color: "#0d47a1", weight: t.weight, opacity: t.opacity };
      }
      return { color: "#0d47a1", weight: 4, opacity: 0.92 };
    }

  app.getPontesPolygonStyle = function getPontesPolygonStyle() {
      const mode = app.getBasemapStyleMode();
      if (mode === "imagery") {
        const c = "#0d47a1";
        return { color: c, weight: 2.2, fillColor: c, fillOpacity: app.tunedFill(0.20).fillOpacity };
      }
      if (mode === "dark") {
        const c = "rgba(147,197,253,.95)";
        const t = app.tunedLine(1.8);
        return { color: c, weight: t.weight, fillColor: c, fillOpacity: app.tunedFill(0.14).fillOpacity };
      }
      if (mode === "gray") {
        const c = "rgba(30,64,175,.90)";
        const t = app.tunedLine(1.7);
        return { color: c, weight: t.weight, fillColor: c, fillOpacity: app.tunedFill(0.12).fillOpacity };
      }
      if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(1.8);
        const f = app.tunedFill(0.18);
        const c = "#0d47a1";
        return { color: c, weight: t.weight, fillColor: c, fillOpacity: f.fillOpacity };
      }
      const c = "#0d47a1";
      return { color: c, weight: 2, fillColor: c, fillOpacity: app.tunedFill(0.16).fillOpacity };
    }

  app.applyBueirosStyleToLayer = function applyBueirosStyleToLayer(layer) {
      if (!layer?.feature) return;
      const kind = layer.__infrageoSelectionKind || "bueiros";
      const t = layer.feature?.geometry?.type;
      if (layer instanceof L.Marker) {
        layer.setIcon(app.createBueirosPointIcon(kind));
        return;
      }
      if (t === "LineString" || t === "MultiLineString") {
        layer.setStyle(app.getBueirosLineStyle());
        return;
      }
      if (t === "Polygon" || t === "MultiPolygon") {
        layer.setStyle(app.getBueirosPolygonStyle());
      }
    }

  app.applyPontesStyleToLayer = function applyPontesStyleToLayer(layer) {
      if (!layer?.feature) return;
      const kind = layer.__infrageoSelectionKind || "pontes";
      const t = layer.feature?.geometry?.type;
      if (layer instanceof L.Marker) {
        layer.setIcon(app.createPontesPointIcon(kind));
        return;
      }
      if (t === "LineString" || t === "MultiLineString") {
        layer.setStyle(app.getPontesLineStyle());
        return;
      }
      if (t === "Polygon" || t === "MultiPolygon") {
        layer.setStyle(app.getPontesPolygonStyle());
      }
    }

  app.applyJazidasStyleToLayer = function applyJazidasStyleToLayer(layer) {
      if (!layer?.feature) return;
      const t = layer.feature?.geometry?.type;
      if (layer instanceof L.Marker) {
        layer.setIcon(app.createJazidasPointIcon());
        return;
      }
      if (t === "LineString" || t === "MultiLineString") {
        layer.setStyle(app.getJazidasLineStyle());
        return;
      }
      if (t === "Polygon" || t === "MultiPolygon") {
        layer.setStyle(app.getJazidasPolygonStyle());
      }
    }

  app.applyIp4StyleToLayer = function applyIp4StyleToLayer(layer) {
      if (!layer?.feature) return;
      const t = layer.feature?.geometry?.type;
      const ip4Color = "#c97900";
      if (layer instanceof L.Marker) {
        layer.setIcon(app.createIp4PointIcon());
        return;
      }
      const tune = app.getBasemapTuning();
      if (t === "LineString" || t === "MultiLineString") {
        const w = Math.max(1.6, 2.6 + tune.lineWeightDelta);
        layer.setStyle({ color: ip4Color, weight: w, opacity: tune.lineOpacity });
        return;
      }
      if (t === "Polygon" || t === "MultiPolygon") {
        const w = Math.max(1.4, 2.4 + tune.lineWeightDelta);
        layer.setStyle({
          color: ip4Color,
          weight: w,
          opacity: tune.lineOpacity,
          fillColor: "#ffbf6a",
          fillOpacity: app.tunedFill(0.18).fillOpacity,
        });
      }
    }

  app.createUcEstadualPointIcon = function createUcEstadualPointIcon() {
      return app.createStandardPointIcon("uc-estadual");
    }

  app.getUcEstadualLineStyle = function getUcEstadualLineStyle() {
      const mode = app.getBasemapStyleMode();
      const c = "#457c78";
      if (mode === "imagery") return { color: c, weight: 3.2, opacity: 0.95 };
      if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(2.6);
        return { color: c, weight: t.weight, opacity: t.opacity };
      }
      return { color: c, weight: 2.8, opacity: 0.9 };
    }

  app.getUcEstadualPolygonStyle = function getUcEstadualPolygonStyle() {
      const mode = app.getBasemapStyleMode();
      const c = "#457c78";
      if (mode === "imagery") return { color: c, weight: 2.0, fillColor: "rgba(200,232,216,.55)", fillOpacity: app.tunedFill(0.22).fillOpacity };
      if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(1.7);
        return { color: c, weight: t.weight, fillColor: "rgba(200,232,216,.42)", fillOpacity: app.tunedFill(0.16).fillOpacity };
      }
      return { color: c, weight: 1.6, fillColor: "rgba(200,232,216,.38)", fillOpacity: app.tunedFill(0.18).fillOpacity };
    }

  app.applyUcEstadualStyleToLayer = function applyUcEstadualStyleToLayer(layer) {
      if (!layer?.feature) return;
      const t = layer.feature?.geometry?.type;
      if (layer instanceof L.Marker) {
        layer.setIcon(app.createUcEstadualPointIcon());
        return;
      }
      if (t === "LineString" || t === "MultiLineString") {
        layer.setStyle(app.getUcEstadualLineStyle());
        return;
      }
      if (t === "Polygon" || t === "MultiPolygon") {
        layer.setStyle(app.getUcEstadualPolygonStyle());
      }
    }

  app.createUcMunicipalPointIcon = function createUcMunicipalPointIcon() {
      return app.createStandardPointIcon("uc-municipal");
    }

  app.getUcMunicipalLineStyle = function getUcMunicipalLineStyle() {
      const mode = app.getBasemapStyleMode();
      const c = app.getLegendAccentById("uc-municipal");
      if (mode === "imagery") return { color: c, weight: 3.1, opacity: 0.96 };
      if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(2.5);
        return { color: c, weight: t.weight, opacity: t.opacity };
      }
      return { color: c, weight: 2.7, opacity: 0.9 };
    }

  app.getUcMunicipalPolygonStyle = function getUcMunicipalPolygonStyle() {
      const mode = app.getBasemapStyleMode();
      const c = app.getLegendAccentById("uc-municipal");
      const fill = "rgba(187, 222, 251, .5)";
      if (mode === "imagery") return { color: c, weight: 1.9, fillColor: fill, fillOpacity: app.tunedFill(0.20).fillOpacity };
      if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
        const t = app.tunedLine(1.6);
        return { color: c, weight: t.weight, fillColor: fill, fillOpacity: app.tunedFill(0.14).fillOpacity };
      }
      return { color: c, weight: 1.5, fillColor: fill, fillOpacity: app.tunedFill(0.16).fillOpacity };
    }

  app.applyUcMunicipalStyleToLayer = function applyUcMunicipalStyleToLayer(layer) {
      if (!layer?.feature) return;
      const t = layer.feature?.geometry?.type;
      if (layer instanceof L.Marker) {
        layer.setIcon(app.createUcMunicipalPointIcon());
        return;
      }
      if (t === "LineString" || t === "MultiLineString") {
        layer.setStyle(app.getUcMunicipalLineStyle());
        return;
      }
      if (t === "Polygon" || t === "MultiPolygon") {
        layer.setStyle(app.getUcMunicipalPolygonStyle());
      }
    }

  app.refreshLayerStylesForBasemap = function refreshLayerStylesForBasemap() {
      if (app.state.geojsonLayer?.setStyle) {
        app.state.geojsonLayer.setStyle((feature) => app.getSegmentLayerStyle(feature));
      }
      if (app.state.boundaryLayer?.setStyle) {
        app.state.boundaryLayer.setStyle(app.getBoundaryLayerStyle());
      }
      if (app.state.boundaryMunicipalLayer?.setStyle) {
        app.state.boundaryMunicipalLayer.setStyle(app.getLimiteMunicipalLayerStyle());
      }
      app.state.bueirosLayer?.eachLayer((layer) => app.applyBueirosStyleToLayer(layer));
      app.state.bueirosBr319Layer?.eachLayer?.((layer) => app.applyBueirosStyleToLayer(layer));
      app.state.bueirosBr174Layer?.eachLayer?.((layer) => app.applyBueirosStyleToLayer(layer));
      app.state.bueirosBr230Layer?.eachLayer?.((layer) => app.applyBueirosStyleToLayer(layer));
      app.state.pontesBr307Layer?.eachLayer((layer) => app.applyPontesStyleToLayer(layer));
      app.state.jazidasBr307Layer?.eachLayer((layer) => app.applyJazidasStyleToLayer(layer));
      app.state.ucEstadualLayer?.eachLayer((layer) => app.applyUcEstadualStyleToLayer(layer));
      app.state.ucMunicipalLayer?.eachLayer((layer) => app.applyUcMunicipalStyleToLayer(layer));
      app.state.ip4Layer?.eachLayer?.((layer) => app.applyIp4StyleToLayer(layer));
      if (app.state.tiAmLayer?.setStyle) {
        app.state.tiAmLayer.setStyle((feature) => {
          const t = feature?.geometry?.type;
          const tune = app.getBasemapTuning();
          // TI AM: verde mais claro/azulado (referência) para diferenciar das UCs.
          const c = "#6ba09c";
          if (t === "LineString" || t === "MultiLineString") {
            const w = Math.max(1.4, 2.2 + tune.lineWeightDelta);
            return { color: c, weight: w, opacity: tune.lineOpacity };
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            const w = Math.max(1.2, 2.0 + tune.lineWeightDelta);
            return { color: c, weight: w, opacity: tune.lineOpacity, fillColor: "#bcdae8", fillOpacity: app.tunedFill(0.16).fillOpacity };
          }
          return {};
        });
      }
      if (app.state.hidroviasAmLayer?.setStyle) {
        app.state.hidroviasAmLayer.setStyle((feature) => {
          const c = "#2862ab";
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") {
            const tl = app.tunedLine(3.4);
            return { color: c, weight: tl.weight, opacity: tl.opacity };
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            const tl = app.tunedLine(2.0);
            return { color: c, weight: tl.weight, opacity: tl.opacity, fillColor: c, fillOpacity: app.tunedFill(0.12).fillOpacity };
          }
          return {};
        });
      }
      if (app.state.pradsBr174Layer?.setStyle) app.state.pradsBr174Layer.setStyle(app.getPradsStyleByKind("prads-br174"));
      if (app.state.pcaPradsBr319Layer?.setStyle) app.state.pcaPradsBr319Layer.setStyle(app.getPradsStyleByKind("pca-prads-br319"));
      if (app.state.pradsBr319Layer?.setStyle) app.state.pradsBr319Layer.setStyle(app.getPradsStyleByKind("prads-br319"));
      if (app.state.pcaPradsCmmBr319Layer?.setStyle) app.state.pcaPradsCmmBr319Layer.setStyle(app.getPradsStyleByKind("pca-prads-cmm-br319"));
    }

  app.hideAppLoadingSplash = function hideAppLoadingSplash() {
      const el = app.loadingSplashEl;
      if (!el) return;
      el.setAttribute("aria-busy", "false");
      document.body.classList.remove("has-loading-splash");
      el.classList.add("app-loading-splash--hidden");
      el.style.display = "none";
    }

  app.buildBasemapLayers = function buildBasemapLayers() {
      const osmAttr =
        '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>';
      const cartoAttr =
        '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" rel="noopener">CARTO</a>';
      const safeEsriBasemap = (newId, legacyId) => {
        try {
          return L.esri.basemapLayer(newId);
        } catch (e) {
          try {
            return L.esri.basemapLayer(legacyId);
          } catch {
            return null;
          }
        }
      };
      return {
        // Evita warning de serviços "mature support" (Esri Leaflet BasemapLayer):
        // usa os novos IDs recomendados pelo ArcGIS.
        // Importante: usar IMAGERY sem labels/bordas para não “desenhar limites” no satélite.
        imagery: safeEsriBasemap("arcgis/imagery", "Imagery"),
        // Imagem de satélite Google (visual tipo Google Earth).
        "google-earth": L.tileLayer("https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
          subdomains: ["0", "1", "2", "3"],
          maxZoom: 21,
          attribution: '&copy; <a href="https://www.google.com/maps" rel="noopener">Google</a>',
        }),
        streets: safeEsriBasemap("arcgis/streets-beta", "Streets"),
        topo: safeEsriBasemap("arcgis/outdoor-beta", "Topographic"),
        terrain: safeEsriBasemap("arcgis/navigation-beta", "Terrain"),
        osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: osmAttr,
        }),
        // Usa variante sem rótulos/bordas para não parecer "Limite Estadual" quando o SHP estiver desligado.
        "carto-positron": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd",
          maxZoom: 20,
          attribution: cartoAttr,
        }),
        gray: safeEsriBasemap("arcgis/light-gray-beta", "Gray"),
        dark: safeEsriBasemap("arcgis/dark-gray-beta", "DarkGray"),
      };
    }

  app.applyUiThemeForBasemap = function applyUiThemeForBasemap(id) {
      // Mantém o layout padrão claro para todos os mapas base, incluindo satélite.
      if (id) document.body.classList.remove("theme-satellite");
    }

  app.applyThemeClass = function applyThemeClass(theme) {
      const night = theme === "night";
      document.body.classList.toggle("theme-night", night);
      if (app.themeToggleBtn) {
        app.themeToggleBtn.setAttribute("aria-pressed", night ? "true" : "false");
        // Ícone: lua = ativar noturno, sol = voltar ao claro
        app.themeToggleBtn.textContent = night ? "☀" : "☾";
        app.themeToggleBtn.title = night ? "Mudar para tema claro" : "Mudar para tema noturno";
      }
    }

  app.loadThemePreference = function loadThemePreference() {
      try {
        const stored = localStorage.getItem("infrageo.theme");
        if (stored === "night" || stored === "light") return stored;
      } catch {
        // ignore
      }
      // Fallback: respeita preferência do sistema quando possível.
      try {
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "light";
      } catch {
        return "light";
      }
    }

  app.setThemePreference = function setThemePreference(nextTheme) {
      app.state.theme = nextTheme === "night" ? "night" : "light";
      app.applyThemeClass(app.state.theme);
      try {
        localStorage.setItem("infrageo.theme", app.state.theme);
      } catch {
        // ignore
      }
    }

  app.syncBasemapRadiosToLayer = function syncBasemapRadiosToLayer(id) {
      const inputs = document.querySelectorAll('input[name="basemap-choice"]');
      if (!inputs.length) return;
      inputs.forEach((inp) => {
        const layerOk = Boolean(app.state.basemapLayers?.[inp.value]);
        inp.disabled = !layerOk;
        inp.checked = layerOk && inp.value === id;
      });
    }

  app.closeMapBasemapPicker = function closeMapBasemapPicker() {
      app.mapBasemapControl?.classList.remove("is-open");
      app.mapBasemapBtn?.setAttribute("aria-expanded", "false");
    }

  app.setBasemapLayer = function setBasemapLayer(id) {
      const layers = app.state.basemapLayers;
      if (!app.state.map || !layers || !layers[id]) return;
      if (app.state.base) {
        try {
          app.state.map.removeLayer(app.state.base);
        } catch (e) {
          /* ignore */
        }
      }
      app.state.base = layers[id];
      app.state.base.addTo(app.state.map);
      if (app.state.base.bringToBack) app.state.base.bringToBack();
      app.state.currentBasemapId = id;
      app.applyUiThemeForBasemap(id);
      app.refreshLayerStylesForBasemap();
      app.renderLayerLegend();
      if (app.basemapSelect && app.basemapSelect.value !== id) app.basemapSelect.value = id;
      app.syncBasemapRadiosToLayer(id);
      app.bringLimiteEstadualToBackIfVisible();
    }

  app.setupBasemapSelect = function setupBasemapSelect() {
      if (!app.basemapSelect || !app.state.map || !app.state.basemapLayers) return;
      // Desabilita opções sem layer.
      Array.from(app.basemapSelect.options || []).forEach((opt) => {
        const id = opt.value;
        opt.disabled = !app.state.basemapLayers?.[id];
      });
      app.basemapSelect.value = app.state.currentBasemapId || "imagery";
      app.basemapSelect.addEventListener("change", () => {
        const id = app.basemapSelect.value;
        if (app.state.basemapLayers[id]) app.setBasemapLayer(id);
      });
      document.querySelectorAll('input[name="basemap-choice"]').forEach((inp) => {
        inp.addEventListener("change", () => {
          if (!inp.checked) return;
          const id = inp.value;
          if (app.state.basemapLayers[id]) app.setBasemapLayer(id);
          app.closeMapBasemapPicker();
        });
      });
      app.syncBasemapRadiosToLayer(app.state.currentBasemapId || "imagery");
    }

  app.getColorForFeature = function getColorForFeature(feature) {
      const key =
        feature?.id ??
        (feature?.properties && JSON.stringify(feature.properties)) ??
        String(Math.random());

      if (!app.featureColors.has(key)) {
        if (app.featureColors.size >= app.FEATURE_COLORS_MAX) {
          // Evita Map ilimitado: descarta entradas antigas em lote.
          const drop = Math.max(40, Math.floor(app.FEATURE_COLORS_MAX / 4));
          let i = 0;
          for (const k of app.featureColors.keys()) {
            app.featureColors.delete(k);
            if (++i >= drop) break;
          }
        }
        const color = app.colorPalette[app.colorIndex % app.colorPalette.length];
        app.featureColors.set(key, color);
        app.colorIndex += 1;
      }
      return app.featureColors.get(key);
    }

}
