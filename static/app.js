/* global L */
(() => {
  const $ = (id) => document.getElementById(id);

  // Captura erros de JS para exibir no status (ajuda em campo quando "nada funciona").
  const earlyErrors = [];
  window.addEventListener("error", (e) => {
    try {
      earlyErrors.push(String(e?.message || e));
    } catch {
      earlyErrors.push("Erro desconhecido");
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    try {
      earlyErrors.push(String(e?.reason?.message || e?.reason || e));
    } catch {
      earlyErrors.push("Promise rejeitada (desconhecido)");
    }
  });

  const statusEl = $("data-status");
  const loadingSplashEl = $("app-loading-splash");
  const mapEl = $("map");
  const featureQuickMenuEl = $("feature-quick-menu");
  const featureQuickCloseBtn = $("feature-quick-close");
  const featureQuickTitleEl = $("feature-quick-title");
  const featureQuickSubtitleEl = $("feature-quick-subtitle");
  const featureQuickBodyEl = $("feature-quick-body");

  const bottomSheet = $("bottom-sheet");
  const bottomSheetClose = $("bottom-sheet-close");
  const bottomSheetRestore = $("bottom-sheet-restore");
  const bottomSheetHandle = $("bottom-sheet-handle");
  const bottomZoomSelected = $("bottom-zoom-selected");
  const themeToggleBtn = $("theme-toggle");
  const mobileSidebarToggleBtn = $("mobile-sidebar-toggle");
  const mobileSidebarBackdrop = $("mobile-sidebar-backdrop");

  function isMobileLayoutActive() {
    try {
      return window.matchMedia && window.matchMedia("(max-width: 980px)").matches;
    } catch {
      return window.innerWidth <= 980;
    }
  }

  function syncMobileSidebarChrome(collapsed) {
    const isCollapsed = Boolean(collapsed);
    const open = isMobileLayoutActive() && !isCollapsed;
    document.body.classList.toggle("mobile-sidebar-open", open);
    document.body.classList.toggle("is-mobile-layout", isMobileLayoutActive());
    try {
      if (mobileSidebarBackdrop) {
        mobileSidebarBackdrop.hidden = !open;
        mobileSidebarBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
        mobileSidebarBackdrop.tabIndex = open ? 0 : -1;
      }
      if (mobileSidebarToggleBtn) {
        mobileSidebarToggleBtn.setAttribute("aria-pressed", isCollapsed ? "false" : "true");
        mobileSidebarToggleBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        const label = isCollapsed ? "Abrir menu e camadas" : "Fechar menu e camadas";
        mobileSidebarToggleBtn.setAttribute("aria-label", label);
        mobileSidebarToggleBtn.title = label;
        const text = mobileSidebarToggleBtn.querySelector(".mobile-sidebar-toggle__label");
        if (text) text.textContent = isCollapsed ? "Menu" : "Fechar";
      }
    } catch {
      // ignore
    }
  }

  function setMobileSidebarCollapsed(collapsed) {
    document.body.classList.toggle("mobile-sidebar-collapsed", Boolean(collapsed));
    syncMobileSidebarChrome(collapsed);
    try {
      if (state.map?.invalidateSize) {
        requestAnimationFrame(() => state.map.invalidateSize({ animate: false }));
      }
    } catch {
      // ignore
    }
  }

  function closeMobileSidebarIfNeeded() {
    if (isMobileLayoutActive() && !document.body.classList.contains("mobile-sidebar-collapsed")) {
      setMobileSidebarCollapsed(true);
    }
  }

  const globalSearchInput = $("global-search-input");
  const globalSearchFeedback = $("global-search-feedback");
  const globalSearchFilterBtn = $("global-search-filter-btn");
  const globalSearchFilterEl = $("global-search-filter");
  const globalSearchResultsEl = $("global-search-results");
  const generalFilterInput = $("general-filter");
  const generalFilterHint = $("general-filter-hint");

  // Os popovers da busca (filtros/resultados) precisam estar no <body>.
  // Dentro do header/topbar eles podem ficar invisíveis por stacking context/backdrop-filter.
  try {
    if (globalSearchFilterEl && globalSearchFilterEl.parentElement !== document.body) {
      document.body.appendChild(globalSearchFilterEl);
    }
    if (globalSearchResultsEl && globalSearchResultsEl.parentElement !== document.body) {
      document.body.appendChild(globalSearchResultsEl);
    }
  } catch {
    // ignore
  }

  // Segmentos BR-319 removido do projeto (não exibir no UI / não controlar por toggle)
  const layerRowSegmentos = null;
  const layerSegmentosToggle = null;
  const layerBueirosToggle = $("layer-bueiros-br317");
  const layerBueirosRow = $("layer-row-bueiros-br317");
  const layerBueirosHint = $("layer-bueiros-br317-hint");
  const branchBr317 = $("layer-branch-br317");
  const branchHeadBr317 = $("layer-branch-br317-head");
  const branchBr307 = $("layer-branch-br307");
  const branchHeadBr307 = $("layer-branch-br307-head");
  const branchBr319 = $("layer-branch-br319");
  const branchHeadBr319 = $("layer-branch-br319-head");
  const branchBr230 = $("layer-branch-br230");
  const branchHeadBr230 = $("layer-branch-br230-head");
  const layerBueirosBr230Toggle = $("layer-bueiros-br230");
  const layerBueirosBr230Row = $("layer-row-bueiros-br230");
  const layerBueirosBr230Hint = $("layer-bueiros-br230-hint");
  const layerPontesBr230Toggle = $("layer-pontes-br230");
  const layerPontesBr230Row = $("layer-row-pontes-br230");
  const layerPontesBr230Hint = $("layer-pontes-br230-hint");
  const layerPontesToggle = $("layer-pontes-br307");
  const layerPontesRow = $("layer-row-pontes-br307");
  const layerPontesHint = $("layer-pontes-br307-hint");
  const layerJazidasToggle = $("layer-jazidas-br307");
  const layerJazidasRow = $("layer-row-jazidas-br307");
  const layerJazidasHint = $("layer-jazidas-br307-hint");
  const layerPontesBr319Toggle = $("layer-pontes-br319");
  const layerPontesBr319Row = $("layer-row-pontes-br319");
  const layerPontesBr319Hint = $("layer-pontes-br319-hint");
  const layerBueirosBr319Toggle = $("layer-bueiros-br319");
  const layerBueirosBr319Row = $("layer-row-bueiros-br319");
  const layerBueirosBr319Hint = $("layer-bueiros-br319-hint");
  const branchBr174 = $("layer-branch-br174");
  const branchHeadBr174 = $("layer-branch-br174-head");
  const layerBueirosBr174Toggle = $("layer-bueiros-br174");
  const layerBueirosBr174Row = $("layer-row-bueiros-br174");
  const layerBueirosBr174Hint = $("layer-bueiros-br174-hint");
  const layerPradsBr174Toggle = $("layer-prads-br174");
  const layerPradsBr174Row = $("layer-row-prads-br174");
  const layerPradsBr174Hint = $("layer-prads-br174-hint");
  const layerPcaPradsBr319Toggle = $("layer-pca-prads-br319");
  const layerPradsBr319Toggle = $("layer-prads-br319");
  const layerPcaPradsBr319Row = $("layer-row-pca-prads-br319");
  const layerPradsBr319Row = $("layer-row-prads-br319");
  const layerPcaPradsBr319Hint = $("layer-pca-prads-br319-hint");
  const layerPradsBr319Hint = $("layer-prads-br319-hint");
  const layerPcaPradsCmmBr319Toggle = $("layer-pca-prads-cmm-br319");
  const layerPcaPradsCmmBr319Row = $("layer-row-pca-prads-cmm-br319");
  const layerPcaPradsCmmBr319Hint = $("layer-pca-prads-cmm-br319-hint");
  const layerIp4Toggle = $("layer-ip4");
  const layerIp4Row = $("layer-row-ip4");
  const layerIp4Hint = $("layer-ip4-hint");
  const groupRodovias = $("layer-group-rodovias");
  const headRodovias = $("layer-rodovias-head");
  const subtreeRodovias = $("layer-rodovias-subtree");
  const groupBrAm = $("layer-group-br-am");
  const headBrAm = $("layer-br-am-head");
  const subtreeBrAm = $("layer-br-am-subtree");
  const groupAquaviario = $("layer-group-aquaviario");
  const headAquaviario = $("layer-aquaviario-head");
  const subtreeAquaviario = $("layer-aquaviario-subtree");
  const groupUc = $("layer-group-uc");
  const headUc = $("layer-uc-head");
  const subtreeUc = $("layer-uc-subtree");
  const groupLimitesAm = $("layer-group-limite");
  const headLimitesAm = $("layer-limites-am-head");
  const subtreeLimitesAm = $("layer-limites-am-subtree");

  const layersDisableAllBtn = $("layers-disable-all");
  const layerLimiteToggle = $("layer-limite-estadual");
  const layerLimiteRow = $("layer-row-limite-estadual");
  const layerLimiteMunicipalToggle = $("layer-limite-municipal");
  const layerLimiteMunicipalRow = $("layer-row-limite-municipal");
  const layerUcEstadualToggle = $("layer-uc-estadual");
  const layerUcEstadualRow = $("layer-row-uc-estadual");
  const layerUcMunicipalToggle = $("layer-uc-municipal");
  const layerUcMunicipalRow = $("layer-row-uc-municipal");
  const layerHidroviasAmToggle = $("layer-hidrovias-am");
  const layerHidroviasAmRow = $("layer-row-hidrovias-am");
  const layerTiAmToggle = $("layer-ti-am");
  const layerTiAmRow = $("layer-row-ti-am");

  const btnFit = $("tool-fit");
  const btnLocate = $("tool-locate");
  const btnLegend = $("menu-toggle-legend");
  const camadasFootCountEl = $("camadas-foot-count");
  const camadasFootListEl = $("camadas-foot-list");
  const camadasFootEmptyEl = $("camadas-foot-empty");
  const layerLegendEl = $("map-legend");
  const layerLegendBodyEl = $("map-legend-body");
  const layerLegendCloseBtn = $("map-legend-close");
  const layerLegendClearBtn = $("map-legend-clear");
  const basemapSelect = $("basemap-select");
  const mapBasemapControl = $("map-basemap-control");
  const mapBasemapBtn = $("map-basemap-btn");
  const menuToggleLayersBtn = $("menu-toggle-layers");
  const menuFitAmazonasBtn = $("menu-fit-amazonas");
  const menuDeselectLayersBtn = $("menu-deselect-layers");
  const menuSelectMode = $("menu-select-mode");
  const menuSelectTarget = $("menu-select-target");
  const menuSubtree = $("menu-subtree");
  const menuContractSelect = $("menu-contract");
  const municipioFilterPopup = $("municipio-filter-popup");

  const state = {
    map: null,
    base: null,
    basemapLayers: null,
    coords: {
      click: null,
      selectedLayerLabel: null,
    },
    coordsPrecision: 6,
    coordsControlEl: null,
    coordsControl: null,
    // Inicia no Carto Positron (padrão InfraGeo)
    currentBasemapId: "carto-positron",
    theme: "light", // "light" | "night"
    geojsonLayer: null,
    boundaryLayer: null,
    // Se o usuário desligar o limite explicitamente, não reativar automaticamente (fallback/menu).
    limiteEstadualUserHidden: false,
    boundaryMunicipalLayer: null,
    boundaryMunicipalHoverLayer: null,
    boundaryMunicipalLoading: false,
    boundaryMunicipalLoadPromise: null,
    municipiosFeatures: [],
    municipiosLayersByIndex: {},
    municipiosSelectedIndex: null,
    municipiosColumnKeys: [],
    municipiosTable: { sortKey: null, sortDir: "asc", filterText: "" },
    bueirosLayer: null,
    bueirosLoading: false,
    pontesBr307Layer: null,
    pontesBr307Loading: false,
    pontesBr319Layer: null,
    pontesBr319Loading: false,
    pontesBr230Layer: null,
    pontesBr230Loading: false,
    bueirosBr319Layer: null,
    bueirosBr319Loading: false,
    bueirosBr230Layer: null,
    bueirosBr230Loading: false,
    bueirosBr174Layer: null,
    bueirosBr174Loading: false,
    pradsBr174Layer: null,
    pradsBr174Loading: false,
    pcaPradsBr319Layer: null,
    pradsBr319Layer: null,
    pcaPradsBr319Loading: false,
    pradsBr319Loading: false,
    pcaPradsCmmBr319Layer: null,
    pcaPradsCmmBr319Loading: false,
    bueirosBr230Features: [],
    bueirosBr230LayersByIndex: {},
    bueirosBr230SelectedIndex: null,
    bueirosBr230ColumnKeys: [],
    bueirosBr230Table: { sortKey: null, sortDir: "asc", filterText: "" },
    bueirosBr174Features: [],
    bueirosBr174LayersByIndex: {},
    bueirosBr174SelectedIndex: null,
    bueirosBr174ColumnKeys: [],
    bueirosBr174Table: { sortKey: null, sortDir: "asc", filterText: "" },
    pradsBr174Features: [],
    pradsBr174LayersByIndex: {},
    pradsBr174SelectedIndex: null,
    pradsBr174ColumnKeys: [],
    pradsBr174Table: { sortKey: null, sortDir: "asc", filterText: "" },
    pcaPradsBr319Features: [],
    pradsBr319Features: [],
    pcaPradsBr319LayersByIndex: {},
    pradsBr319LayersByIndex: {},
    pcaPradsBr319SelectedIndex: null,
    pradsBr319SelectedIndex: null,
    pcaPradsBr319ColumnKeys: [],
    pradsBr319ColumnKeys: [],
    pcaPradsBr319Table: { sortKey: null, sortDir: "asc", filterText: "" },
    pradsBr319Table: { sortKey: null, sortDir: "asc", filterText: "" },
    pcaPradsCmmBr319Features: [],
    pcaPradsCmmBr319LayersByIndex: {},
    pcaPradsCmmBr319SelectedIndex: null,
    pcaPradsCmmBr319ColumnKeys: [],
    pcaPradsCmmBr319Table: { sortKey: null, sortDir: "asc", filterText: "" },
    jazidasBr307Layer: null,
    jazidasBr307Loading: false,
    ucEstadualLayer: null,
    ucEstadualLoading: false,
    ucMunicipalLayer: null,
    ucMunicipalLoading: false,
    ip4Layer: null,
    ip4Loading: false,
    ip4Features: [],
    ip4LayersByIndex: {},
    ip4SelectedIndex: null,
    ip4ColumnKeys: [],
    ip4Table: { sortKey: null, sortDir: "asc", filterText: "" },
    /** Quando definido, mostra apenas feições do IP4 vindas deste SHP (__source). */
    ip4FocusSource: "",
    contractResultsFeatures: [],
    contractResultsColumnKeys: [],
    contractResultsSelectedIndex: null,
    contractResultsTable: { sortKey: null, sortDir: "asc", filterText: "" },
    allFeatures: [],
    selectedLayer: null,
    identify: {
      results: [],
      activeIndex: 0,
    },
    highlightOverlayLayer: null,
    selectedFeatureIndex: null,
    layersByIndex: {},
    totalFeaturesCount: 0,
    visibleFeaturesCount: 0,
    generalTable: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    boundsAll: null,
    pendingFitSegmentos: false,
    /** "segmentos" | "bueiros" — qual conjunto a aba Tabela exibe */
    tableDataset: "segmentos",
    bueirosFeatures: [],
    bueirosLayersByIndex: {},
    bueirosColumnKeys: [],
    bueirosSelectedIndex: null,
    /** Tabela de bueiros aberta por hover: não atualiza até clique no mapa ou em outra feição */
    bueirosTableHoverPinned: false,
    bueirosTable: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    pontesFeatures: [],
    pontesLayersByIndex: {},
    pontesSelectedIndex: null,
    pontesColumnKeys: [],
    pontesBr319Features: [],
    pontesBr319LayersByIndex: {},
    pontesBr319SelectedIndex: null,
    pontesBr319ColumnKeys: [],
    pontesBr319Table: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    pontesBr230Features: [],
    pontesBr230LayersByIndex: {},
    pontesBr230SelectedIndex: null,
    pontesBr230ColumnKeys: [],
    pontesBr230Table: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    bueirosBr319Features: [],
    bueirosBr319LayersByIndex: {},
    bueirosBr319SelectedIndex: null,
    bueirosBr319ColumnKeys: [],
    bueirosBr319Table: { sortKey: null, sortDir: "asc", filterText: "" },
    pontesTable: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    jazidasFeatures: [],
    jazidasLayersByIndex: {},
    jazidasSelectedIndex: null,
    jazidasColumnKeys: [],
    jazidasTable: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    ucEstadualFeatures: [],
    ucEstadualLayersByIndex: {},
    ucEstadualSelectedIndex: null,
    ucEstadualColumnKeys: [],
    ucEstadualTable: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    ucMunicipalFeatures: [],
    ucMunicipalLayersByIndex: {},
    ucMunicipalSelectedIndex: null,
    ucMunicipalColumnKeys: [],
    ucMunicipalTable: {
      sortKey: null,
      sortDir: "asc",
      filterText: "",
    },
    hidroviasAmLayer: null,
    hidroviasAmLoading: false,
    hidroviasAmFeatures: [],
    hidroviasAmLayersByIndex: {},
    hidroviasAmSelectedIndex: null,
    hidroviasAmColumnKeys: [],
    hidroviasAmTable: { sortKey: null, sortDir: "asc", filterText: "" },
    tiAmLayer: null,
    tiAmLoading: false,
    tiAmFeatures: [],
    tiAmLayersByIndex: {},
    tiAmSelectedIndex: null,
    tiAmColumnKeys: [],
    tiAmTable: { sortKey: null, sortDir: "asc", filterText: "" },
    /** Filtro global por contrato (aplica em todas as tabelas). Vazio = todos. */
    contractFilter: "",
    /** Filtro global por município (Limite Municipal). Vazio = todos. */
    municipioFilter: "",
    /** Filtro (texto) dentro da lista de municípios do painel Filtros. */
    municipioUiFilterText: "",
    /** Filtro (texto) dentro da lista de contratos do painel Filtros. */
    contractUiFilterText: "",
    /** Nomes de municípios para o painel Filtros (lista leve, sem montar Leaflet). */
    municipioFilterOptions: [],
    municipioFilterListLoaded: false,
    municipioFilterListPromise: null,
    /** Bounds cache do município selecionado (filtro). */
    municipioFilterBounds: null,
    /** Camada em foco no popup de municípios. */
    municipioFocusLayerLabel: "",
    /** Quando definido, mostra somente a camada alvo no mapa (foco do popup de contrato). */
    contractFocusLayerLabel: "",
    contractSourcesLoaded: false,
    contractSourcesLoadPromise: null,
    contractSourcesAttempted: false,
    extraContractSources: [],
    /** Tabelas genéricas para SHPs clicados no mapa (camadas sem tabela dedicada). */
    mapClickTables: {},
    /** Tabela inferior fixa após clique no mapa (não minimizar). */
    tablePinnedFromMap: false,
    /** Popup de hover fixado após clique no SHP. */
    featureQuickMenuPinned: false,
    /** Resumo da feição selecionada na barra peek da tabela. */
    peekSelectionActive: false,
    lastMapClickLayerId: null,
    lastSelectionKind: "segmentos",
    selectedFeature: null,
    suppressAutoFit: false,
    /** Evita abrir tabela ao ligar camadas em lote (menu Ligar/Desligar). */
    suppressAutoOpenTableOnLayerToggle: false,
    /** "off" | "on" | null — evita race de ensure* recolocando camada após desligar tudo. */
    bulkLayersIntent: null,
    /** Incrementado a cada ligar/desligar em lote. */
    mapLayerEpoch: 0,
    /** Evita "delay" de auto-enquadramento ao ligar/desligar camadas. */
    disableAutoFitOnLayerToggle: true,
    /** Quando definido (timestamp ms), qualquer auto-enquadramento vira "enquadrar Amazonas". */
    lockViewToAmazonasUntil: 0,
    panes: null,
    brAm: {
      discovered: [],
      /** Mapa id->name vindo do /layers (ex.: BR-AM/BR_319.shp). */
      nameById: {},
      /** Leaflet layer por id (sha) vindo do /layers */
      layersById: {},
      /** FeatureGroup de placas BR no mapa por id */
      shieldsById: {},
      loaded: false,
      loadPromise: null,
    },
    brAmTables: {
      /** layerKey ("br-am:<id>") -> { id,name,features,layersByIndex,selectedIndex,columnKeys,table } */
      byKey: {},
    },
    selectionMode: "click",
    selectionTarget: "auto",
    boxSelect: {
      active: false,
      startLatLng: null,
      rectLayer: null,
    },
    escClearSelectionHandlerAttached: false,
    escGlobalHandlerAttached: false,
    globalSearch: {
      enabledKinds: new Set(),
      /** Evita re-habilitar defaults depois do usuário mexer (ex.: "Desmarcar"). */
      defaultsInitialized: false,
      results: [],
      activeIndex: 0,
      uiOpen: false,
      maxVisible: 12,
      runToken: 0,
      groupLimits: {},
      lastQuery: "",
      lastResults: [],
    },
    searchCache: {},
    /** Evita cliques repetidos no botão "Desligar/Ligar camadas" enquanto processa. */
    menuToggleLayersBusy: false,
  };

  function normalizeBrAmDisplayName(layerName) {
    const raw = String(layerName || "");
    // Ex.: "BR-AM/BR_174.shp" → "BR-174"
    const rel = raw.replace(/\\/g, "/");
    let s = rel.replace(/^BR-AM\//i, "");
    s = s.replace(/\.shp$/i, "");
    const parts = s.split("/").filter(Boolean);
    s = parts.length ? parts[parts.length - 1] : s;
    s = String(s || "").trim();
    if (!s) return "Camada";
    const num = extractBrHighwayNumber(s);
    if (num) return `BR-${num}`;
    return s.replace(/_/g, "-");
  }

  function extractBrHighwayNumber(label) {
    const s = String(label || "");
    const m = s.match(/(?:^|[^0-9])(?:BR[_\-\s]*)?(\d{2,4})(?:[^0-9]|$)/i) || s.match(/(\d{2,4})/);
    return m ? String(m[1]) : "";
  }

  /** Cor estável (distinta por camada) para demandas BR-AM. */
  const BR_AM_LEGEND_PALETTE = [
    "#2E7D32",
    "#1565C0",
    "#00897B",
    "#5E35B1",
    "#00838F",
    "#2F6FD6",
    "#ca8a04",
    "#1E88E5",
    "#43A047",
    "#0D47A1",
    "#c026d3",
    "#ea580c",
    "#0891b2",
    "#65a30d",
    "#be123c",
    "#7c3aed",
    "#0e7490",
    "#b45309",
    "#059669",
    "#db2777",
  ];

  function getBrAmLayerColor(layerId, layerName) {
    let h = 2166136261;
    const seed = String(layerId || layerName || "br-am");
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return BR_AM_LEGEND_PALETTE[(h >>> 0) % BR_AM_LEGEND_PALETTE.length];
  }

  function createBrShieldIcon(label, { small = false } = {}) {
    const wrap = document.createElement("span");
    wrap.className = small ? "br-shield br-shield--sm" : "br-shield br-shield--inline";
    wrap.setAttribute("aria-hidden", "true");
    wrap.title = `Rodovia federal ${String(label || "BR")}`;

    const prefix = document.createElement("span");
    prefix.className = "br-shield__prefix";
    prefix.textContent = "BR";
    wrap.appendChild(prefix);

    const num = extractBrHighwayNumber(label);
    if (num && !small) {
      const numEl = document.createElement("span");
      numEl.className = "br-shield__num";
      numEl.textContent = num;
      wrap.appendChild(numEl);
    }
    return wrap;
  }

  function makeBrShieldMapIcon(brNum) {
    const num = String(brNum || "").replace(/\D/g, "") || "?";
    return L.divIcon({
      className: "br-shield-map-wrap",
      html:
        `<div class="br-shield br-shield--map" title="BR-${num}">` +
        `<span class="br-shield__prefix">BR</span>` +
        `<span class="br-shield__num">${num}</span>` +
        `</div>`,
      iconSize: [36, 42],
      iconAnchor: [18, 21],
    });
  }

  function flattenLeafletLatLngs(latlngs) {
    const out = [];
    (function walk(v) {
      if (!v) return;
      if (typeof v.lat === "number" && typeof v.lng === "number") {
        out.push(v);
        return;
      }
      if (Array.isArray(v)) v.forEach(walk);
    })(latlngs);
    return out;
  }

  function latLngsFromGeoJsonGeometry(geometry) {
    const out = [];
    if (!geometry || geometry.coordinates == null) return out;
    (function walk(c) {
      if (!Array.isArray(c) || !c.length) return;
      if (typeof c[0] === "number" && typeof c[1] === "number") {
        out.push(L.latLng(c[1], c[0]));
        return;
      }
      c.forEach(walk);
    })(geometry.coordinates);
    return out;
  }


  function buildBrShieldMarkersGroup(geoJsonLayer, brLabel) {
    const num = extractBrHighwayNumber(brLabel);
    const icon = makeBrShieldMapIcon(num);
    const group = L.layerGroup();

    // Uma única placa por camada BR (centro aproximado do traçado).
    const all = [];
    geoJsonLayer?.eachLayer?.((lyr) => {
      let flat = [];
      try {
        if (lyr?.feature?.geometry) flat = latLngsFromGeoJsonGeometry(lyr.feature.geometry);
      } catch {
        flat = [];
      }
      if (!flat.length) flat = flattenLeafletLatLngs(lyr.getLatLngs?.() || []);
      if (!flat.length && (lyr instanceof L.Marker || lyr instanceof L.CircleMarker)) {
        try {
          flat = [lyr.getLatLng()];
        } catch {
          flat = [];
        }
      }
      if (!flat.length) {
        try {
          const b = lyr.getBounds?.();
          if (b?.isValid?.()) flat = [b.getCenter()];
        } catch {
          // ignore
        }
      }
      if (flat.length) all.push(...flat);
    });

    let at = null;
    if (all.length) {
      at = all[Math.floor(all.length / 2)];
    } else {
      try {
        const b = geoJsonLayer.getBounds?.();
        if (b?.isValid?.()) at = b.getCenter();
      } catch {
        // ignore
      }
    }
    if (!at) return group;

    L.marker(at, {
      icon,
      interactive: false,
      keyboard: false,
      zIndexOffset: 900,
    }).addTo(group);
    return group;
  }

  function syncBrAmShieldsOnMap(layerId, geoLayer, layerName) {
    if (!state.map) return;
    if (!state.brAm.shieldsById) state.brAm.shieldsById = {};
    const prev = state.brAm.shieldsById[layerId];
    try {
      if (prev) state.map.removeLayer(prev);
    } catch {
      // ignore
    }
    delete state.brAm.shieldsById[layerId];
    if (!geoLayer) return;
    const toggleEl = document.getElementById(`layer-br-am-${layerId}`);
    if (toggleEl && !toggleEl.checked) return;
    const label = normalizeBrAmDisplayName(layerName) || String(layerName || "");
    const shields = buildBrShieldMarkersGroup(geoLayer, label);
    if (!shields.getLayers().length) return;
    try {
      shields.addTo(state.map);
    } catch {
      // ignore
    }
    state.brAm.shieldsById[layerId] = shields;
  }

  function brAmLayerKeyFromId(id) {
    return `br-am:${String(id || "")}`;
  }

  function brAmIdFromLayerKey(layerKey) {
    const s = String(layerKey || "");
    if (!s.startsWith("br-am:")) return "";
    return s.slice("br-am:".length);
  }

  function getBrAmNameById(id) {
    const k = String(id || "");
    return (state.brAm?.nameById && state.brAm.nameById[k]) || "";
  }

  function setBrAmGroupExpanded(next) {
    if (!groupBrAm || !headBrAm) return;
    groupBrAm.classList.toggle("is-expanded", Boolean(next));
    headBrAm.setAttribute("aria-expanded", next ? "true" : "false");
    if (subtreeBrAm) subtreeBrAm.setAttribute("aria-hidden", next ? "false" : "true");
  }

  function toggleBrAmGroup(force) {
    if (!groupBrAm || !headBrAm) return;
    const next = force === true ? true : force === false ? false : !groupBrAm.classList.contains("is-expanded");
    setBrAmGroupExpanded(next);
  }

  async function ensureBrAmLayerOnMap(layerId, layerName) {
    if (!state.map) return null;
    if (state.bulkLayersIntent === "off") return null;
    const toggleEl = document.getElementById(`layer-br-am-${layerId}`);
    if (state.brAm?.layersById?.[layerId]) {
      const existing = state.brAm.layersById[layerId];
      mountDataLayerIfAllowed(existing, toggleEl);
      syncBrAmShieldsOnMap(layerId, existing, layerName);
      return existing;
    }

    const label = normalizeBrAmDisplayName(layerName);
    setStatus(`Carregando: BR-AM — ${label}`, "loading");

    const r = await fetch(`/layers/${encodeURIComponent(layerId)}`);
    if (!r.ok) throw new Error(`Falha ao carregar camada BR-AM (${label})`);
    const geojson = await r.json();
    if (state.bulkLayersIntent === "off" || (toggleEl && !toggleEl.checked)) return null;

    ensureInfraGeoPanes();
    const pane = state.panes?.overlay || undefined;
    const layersByIndex = {};
    const lineColor = getBrAmLayerColor(layerId, layerName);
    let seq = 0;
    const lyr = L.geoJSON(geojson, {
      pane,
      style: () => ({
        color: lineColor,
        weight: 3,
        opacity: 0.95,
        fillColor: lineColor,
        fillOpacity: 0.12,
        tolerance: FEATURE_POPUP.hover.pathTolerancePx ?? 8,
      }),
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, {
          pane,
          radius: 5,
          color: lineColor,
          weight: 1.5,
          opacity: 0.98,
          fillColor: lineColor,
          fillOpacity: 0.85,
          tolerance: FEATURE_POPUP.hover.pathTolerancePx ?? 8,
        }),
      onEachFeature: (feature, leafletLayer) => {
        try {
          if (feature) {
            feature._brAmId = String(layerId || "");
            feature._brAmIndex = seq;
          }
        } catch {
          // ignore
        }
        try {
          layersByIndex[seq] = leafletLayer;
        } catch {
          // ignore
        }
        const kind = brAmLayerKeyFromId(layerId);
        setLayerIdentifyMeta(leafletLayer, feature, kind);
        attachQuickHover(leafletLayer, feature, kind);
        bindLayerIdentifyClick(leafletLayer);
        seq += 1;
      },
    });

    if (state.bulkLayersIntent === "off" || (toggleEl && !toggleEl.checked)) return null;
    mountDataLayerIfAllowed(lyr, toggleEl);
    if (!state.brAm.layersById) state.brAm.layersById = {};
    state.brAm.layersById[layerId] = lyr;
    syncBrAmShieldsOnMap(layerId, lyr, layerName);
    // Mantém features + layersByIndex para seleção por trecho (tabela ↔ mapa).
    try {
      const key = brAmLayerKeyFromId(layerId);
      if (!state.brAmTables) state.brAmTables = { byKey: {} };
      if (!state.brAmTables.byKey) state.brAmTables.byKey = {};
      const prev = state.brAmTables.byKey[key] || {};
      const features = Array.isArray(geojson?.features) ? geojson.features : prev.features || [];
      state.brAmTables.byKey[key] = {
        id: String(layerId || ""),
        name: label || prev.name || getBrAmNameById(layerId),
        features,
        layersByIndex,
        selectedIndex: prev.selectedIndex ?? null,
        columnKeys: Array.isArray(prev.columnKeys) ? prev.columnKeys : [],
        table: prev.table || { sortKey: null, sortDir: "asc", filterText: "" },
      };
    } catch {
      // ignore
    }
    setStatus(`Camada ligada: BR-AM — ${label}`, "ok");
    return lyr;
  }

  function removeBrAmLayerFromMap(layerId, layerName) {
    if (!state.map) return;
    const lyr = state.brAm?.layersById?.[layerId];
    if (lyr && state.map.hasLayer(lyr)) state.map.removeLayer(lyr);
    try {
      if (state.brAm?.layersById) delete state.brAm.layersById[layerId];
    } catch {
      // ignore
    }
    try {
      const shields = state.brAm?.shieldsById?.[layerId];
      if (shields && state.map.hasLayer(shields)) state.map.removeLayer(shields);
      if (state.brAm?.shieldsById) delete state.brAm.shieldsById[layerId];
    } catch {
      // ignore
    }
    setStatus(`Camada desligada: BR-AM — ${normalizeBrAmDisplayName(layerName)}`, "ok");
  }

  function buildLayerKebabMenuInnerHtml(layerId) {
    const id = escHtmlCell(String(layerId || ""));
    return `
      <div class="layer-kebab-menu__head">Opções da camada</div>
      <button type="button" class="layer-kebab-item" role="menuitem" data-layer-action="table" data-layer="${id}">
        <span class="layer-kebab-item__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
            <path d="M4.5 5.5h15v13h-15z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M4.5 9.2h15M4.5 13h15M9.2 5.5v13M14 5.5v13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="layer-kebab-item__copy">
          <span class="layer-kebab-item__title">Tabela de atributos</span>
          <span class="layer-kebab-item__hint">Abrir registros, filtrar e localizar no mapa</span>
        </span>
      </button>
    `;
  }

  function enhanceLayerKebabMenus() {
    document.querySelectorAll(".layer-kebab-menu[data-layer-menu-popover]").forEach((menu) => {
      const layerId = menu.getAttribute("data-layer-menu-popover");
      if (!layerId) return;
      if (menu.querySelector(".layer-kebab-item__title")) return;
      menu.innerHTML = buildLayerKebabMenuInnerHtml(layerId);
    });
    document.querySelectorAll(".layer-kebab[data-layer-menu]").forEach((btn) => {
      if (!btn.title || btn.title === "Opções") btn.title = "Opções da camada";
    });
  }

  function positionLayerKebabMenu(btn, menu) {
    if (!btn || !menu) return;
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }
    menu.hidden = false;
    menu.style.position = "fixed";
    menu.style.visibility = "hidden";
    menu.style.top = "0px";
    menu.style.left = "0px";
    menu.style.right = "auto";
    menu.style.bottom = "auto";

    const pad = 8;
    const r = btn.getBoundingClientRect();
    const mw = Math.min(268, Math.max(200, window.innerWidth - pad * 2));
    menu.style.width = `${mw}px`;
    const mh = Math.max(menu.offsetHeight || 0, 72);

    let left = r.right - mw;
    left = Math.max(pad, Math.min(left, window.innerWidth - mw - pad));

    let top = r.bottom + 6;
    menu.classList.remove("is-above");
    if (top + mh > window.innerHeight - pad) {
      top = Math.max(pad, r.top - mh - 6);
      menu.classList.add("is-above");
    }

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.visibility = "";
  }

  function renderBrAmLayerToggles(layers) {
    if (!groupBrAm || !subtreeBrAm) return;
    try {
      subtreeBrAm.innerHTML = "";
    } catch {
      // ignore
    }

    for (const it of layers || []) {
      const lid = String(it?.id || "");
      const lname = String(it?.name || "");
      if (!lid) continue;

      const row = document.createElement("div");
      row.className = "layer-row layer-row--nested";

      const left = document.createElement("div");
      left.className = "layer-left";
      const displayName = normalizeBrAmDisplayName(lname);
      const icon = createBrShieldIcon(displayName);
      icon.classList.add("layer-icon", "layer-icon--br-shield");

      const meta = document.createElement("div");
      meta.className = "layer-meta";
      const nameEl = document.createElement("div");
      nameEl.className = "layer-name";
      nameEl.textContent = displayName;

      meta.appendChild(nameEl);
      left.appendChild(icon);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.className = "layer-right";

      // Kebab menu (Tabela de atributos)
      const kebab = document.createElement("button");
      kebab.type = "button";
      kebab.className = "layer-kebab";
      kebab.setAttribute("data-layer-menu", brAmLayerKeyFromId(lid));
      kebab.setAttribute("aria-haspopup", "menu");
      kebab.setAttribute("aria-expanded", "false");
      kebab.setAttribute("aria-label", `Opções da camada ${nameEl.textContent}`);
      kebab.title = "Opções da camada";
      kebab.textContent = "⋯";

      const kebabMenu = document.createElement("div");
      kebabMenu.className = "layer-kebab-menu";
      kebabMenu.setAttribute("data-layer-menu-popover", brAmLayerKeyFromId(lid));
      kebabMenu.setAttribute("role", "menu");
      kebabMenu.hidden = true;
      kebabMenu.innerHTML = buildLayerKebabMenuInnerHtml(brAmLayerKeyFromId(lid));

      right.appendChild(kebab);
      right.appendChild(kebabMenu);

      const sw = document.createElement("label");
      sw.className = "switch";
      sw.title = `Mostrar/ocultar camada ${nameEl.textContent} (BR-AM)`;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = `layer-br-am-${lid}`;

      const ui = document.createElement("span");
      ui.className = "switch-ui";

      sw.appendChild(input);
      sw.appendChild(ui);
      right.appendChild(sw);

      row.appendChild(left);
      row.appendChild(right);
      subtreeBrAm.appendChild(row);

      input.addEventListener("change", () => {
        if (!state.map) return;
        if (input.checked) {
          void ensureBrAmLayerOnMap(lid, lname).catch((e) => {
            try {
              input.checked = false;
            } catch {
              // ignore
            }
            setStatus(String(e?.message || e || "Falha ao carregar camada BR-AM"), "error");
          });
        } else {
          clearSelectionForTurnedOffKind(brAmLayerKeyFromId(lid));
          removeBrAmLayerFromMap(lid, lname);
        }
      });
    }
  }

  async function initBrAmGroup() {
    if (!groupBrAm || !subtreeBrAm) return;
    if (state.brAm?.loaded) return;
    if (state.brAm?.loadPromise) return state.brAm.loadPromise;

    // Mostra só se houver conteúdo em assets/BR-AM
    state.brAm.loadPromise = fetch("/layers")
      .then((rr) => rr.json())
      .then((payload) => {
        const all = Array.isArray(payload?.layers) ? payload.layers : [];
        const bram = all
          .filter((l) => String(l?.name || "").replace(/\\/g, "/").startsWith("BR-AM/"))
          .sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR"));

        state.brAm.discovered = bram;
        state.brAm.nameById = {};
        for (const it of bram) {
          const id = String(it?.id || "");
          if (!id) continue;
          state.brAm.nameById[id] = String(it?.name || "");
        }
        state.brAm.loaded = true;

        if (!bram.length) {
          groupBrAm.hidden = true;
          return;
        }

        groupBrAm.hidden = false;
        renderBrAmLayerToggles(bram);
        setBrAmGroupExpanded(false);
        if (layerLegendEl?.classList.contains("is-open")) {
          try {
            renderLayerLegend();
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Silencioso: não quebra o app se /layers falhar momentaneamente.
        try {
          groupBrAm.hidden = true;
        } catch {
          // ignore
        }
      })
      .finally(() => {
        state.brAm.loadPromise = null;
      });

    return state.brAm.loadPromise;
  }

  function getSearchKindDefs() {
    // `id` precisa bater com os handlers/rotas existentes.
    return [
      { id: "municipios", label: "Municípios" },
      { id: "bueiros", label: "Bueiros (BR-317)" },
      { id: "pontes", label: "Pontes (BR-307)" },
      { id: "jazidas", label: "Jazidas (BR-307)" },
      { id: "hidrovias-am", label: "Hidrovias AM" },
      { id: "ip4", label: "IP4" },
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

  function syncContratosFilterKindFromState() {
    try {
      if (normalizeContractKey(state.contractFilter)) {
        state.globalSearch.enabledKinds.add("contratos");
      }
    } catch {
      // ignore
    }
  }

  function syncMunicipiosFilterKindFromState() {
    try {
      if (normalizeSearchText(state.municipioFilter || "")) {
        state.globalSearch.enabledKinds.add("municipios");
      }
    } catch {
      // ignore
    }
  }


  function applyGlobalSearchFilterKindToggle(cb) {
    if (!cb) return;
    state.globalSearch.defaultsInitialized = true;
    const kind = cb.getAttribute("data-kind");
    if (!kind) return;
    if (cb.checked) state.globalSearch.enabledKinds.add(kind);
    else state.globalSearch.enabledKinds.delete(kind);

    setStatus(`Filtro: ${getSearchKindLabel(kind)} — ${cb.checked ? "ligando" : "desligando"}…`, "info");
    if (kind === "municipios") {
      if (cb.checked) {
        // Não monta o Limite Municipal no clique — só a lista (evita "página sem resposta").
        renderGlobalSearchMunicipiosPanel();
        void ensureMunicipiosFilterListLoaded()
          .then(() => {
            renderGlobalSearchMunicipiosPanel();
            setStatus("Filtro: Municípios — escolha um município na lista abaixo", "ok");
          })
          .catch(() => setStatus("Filtro: Municípios não carregou", "error"));
      } else {
        clearMunicipioFilterOnly();
        setMunicipiosOnMap(false);
        renderGlobalSearchMunicipiosPanel();
        setStatus("Filtro: Municípios desligada", "ok");
      }
      return;
    }
    if (kind === "contratos") {
      if (cb.checked) {
        renderGlobalSearchContractsPanel();
        void ensureContractSourcesLoaded()
          .then(() => {
            refreshContractOptions();
            renderGlobalSearchContractsPanel();
            setStatus("Filtro: Contratos — escolha um contrato na lista abaixo", "ok");
          })
          .catch(() => setStatus("Filtro: Contratos não carregou", "error"));
      } else {
        disableKindOnMap("contratos");
        renderGlobalSearchContractsPanel();
        setStatus("Filtro: Contratos desligada", "ok");
      }
      return;
    }
    setToggleChecked(kind, Boolean(cb.checked));
    if (cb.checked) {
      Promise.resolve(ensureKindOnMap(kind))
        .then(() => setStatus(`Filtro: ${getSearchKindLabel(kind)} ligada`, "ok"))
        .catch(() => setStatus(`Filtro: ${getSearchKindLabel(kind)} não carregou`, "error"));
    } else {
      disableKindOnMap(kind);
      setStatus(`Filtro: ${getSearchKindLabel(kind)} desligada`, "ok");
    }
  }

  function ensureGlobalSearchDefaults() {
    if (state.globalSearch.defaultsInitialized) return;
    if (state.globalSearch.enabledKinds.size) {
      state.globalSearch.defaultsInitialized = true;
      return;
    }
    // Camadas do mapa ligadas por padrão. Municípios/Contratos só se já houver filtro ativo.
    for (const def of getSearchKindDefs()) {
      if (def?.id === "contratos" || def?.id === "municipios") continue;
      state.globalSearch.enabledKinds.add(def.id);
    }
    syncContratosFilterKindFromState();
    syncMunicipiosFilterKindFromState();
    state.globalSearch.defaultsInitialized = true;
  }

  function openGlobalSearchFilter() {
    if (!globalSearchFilterEl || !globalSearchFilterBtn) return;
    ensureGlobalSearchDefaults();
    syncContratosFilterKindFromState();
    syncMunicipiosFilterKindFromState();
    const defs = getSearchKindDefs();
    const defsForUi = defs;
    const isOn = (id) => state.globalSearch.enabledKinds.has(id);
    globalSearchFilterEl.innerHTML = `
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
            <input type="checkbox" data-kind="${escHtmlCell(d.id)}" ${isOn(d.id) ? "checked" : ""} />
            <span>${escHtmlCell(d.label)}</span>
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
    globalSearchFilterEl.hidden = false;
    globalSearchFilterBtn.setAttribute("aria-expanded", "true");
    try {
      renderGlobalSearchMunicipiosPanel();
      renderGlobalSearchContractsPanel();
    } catch {
      // ignore
    }
    if (state.globalSearch.enabledKinds.has("municipios")) {
      void ensureMunicipiosFilterListLoaded().then(() => {
        renderGlobalSearchMunicipiosPanel();
      });
    }
    if (state.globalSearch.enabledKinds.has("contratos")) {
      void ensureContractSourcesLoaded().then(() => {
        refreshContractOptions();
        renderGlobalSearchContractsPanel();
      });
    }
  }

  function getSearchKindLabel(kind) {
    const defs = getSearchKindDefs();
    const hit = defs.find((d) => d?.id === kind);
    return String(hit?.label || kind || "Camada");
  }

  function setGlobalSearchFeedback(kind, payload) {
    if (!globalSearchFeedback) return;
    if (kind === "searching") {
      globalSearchFeedback.classList.add("is-searching");
      globalSearchFeedback.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>Pesquisando…</span>`;
      return;
    }
    globalSearchFeedback.classList.remove("is-searching");
    if (kind === "results") {
      const n = Math.max(0, Number(payload?.count || 0));
      globalSearchFeedback.textContent = n === 1 ? "Resultado: 1" : `Resultados: ${n}`;
      return;
    }
    if (kind === "none") {
      globalSearchFeedback.textContent = "Sem resultados";
      return;
    }
    globalSearchFeedback.textContent = "Pesquisar";
  }

  function closeGlobalSearchFilter() {
    if (!globalSearchFilterEl || !globalSearchFilterBtn) return;
    globalSearchFilterEl.hidden = true;
    globalSearchFilterBtn.setAttribute("aria-expanded", "false");
  }

  function closeGlobalSearchResults() {
    if (!globalSearchResultsEl) return;
    globalSearchResultsEl.hidden = true;
    globalSearchResultsEl.innerHTML = "";
    state.globalSearch.results = [];
    state.globalSearch.activeIndex = 0;
  }

  function renderGlobalSearchResults(results) {
    if (!globalSearchResultsEl) return;
    if (!results?.length) {
      closeGlobalSearchResults();
      return;
    }
    const active = state.globalSearch.activeIndex || 0;
    const total = results.length;
    const groupDefault = 6;
    const limits = state.globalSearch.groupLimits || {};

    // Agrupa por camada para reduzir poluição visual.
    const groups = new Map();
    results.forEach((r) => {
      const label = String(r?.kindLabel || r?.kind || "Resultados");
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(r);
    });

    globalSearchResultsEl.hidden = false;
    globalSearchResultsEl.innerHTML =
      `
        <div class="global-search-results__head">
          <div class="global-search-results__head-title">Resultados</div>
          <div class="global-search-results__head-meta">${total} encontrados</div>
        </div>
      ` +
      Array.from(groups.entries())
        .map(([label, items]) => {
          const groupKey = normalizeSearchText(label) || label;
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
                    <div class="global-search-results__title">${escHtmlCell(r.title)}</div>
                    <div class="global-search-results__subtitle">${escHtmlCell(r.subtitle || "")}</div>
                  </div>
                </div>
              `;
            })
            .join("");
          return `
            <section class="gsr-section" data-group="${escHtmlCell(groupKey)}">
              <div class="gsr-section__head">
                <div class="gsr-section__label">${escHtmlCell(label)}</div>
                <div class="gsr-section__count">${items.length}</div>
              </div>
              <div class="gsr-section__body">${body}</div>
              ${
                more
                  ? `<button type="button" class="gsr-section__more" data-action="more-group" data-group="${escHtmlCell(groupKey)}">
                      Mostrar mais (${items.length - lim})
                    </button>`
                  : ""
              }
            </section>
          `;
        })
        .join("");
  }


  function firstPropValueByKeyHints(props, hints) {
    const p = props || {};
    if (!p || typeof p !== "object") return "";
    const keys = Object.keys(p);
    const norm = (x) => normalizeSearchText(x);
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

  function bestTitleForFeature(kind, feature) {
    const p = feature?.properties || {};
    if (kind === "municipios") return getMunicipioNomeFromProps(p) || "Município";
    if (kind === "ti-am") {
      return normalizePtBrText(p.terrai_nom || p.terrai_cod || "") || "TI";
    }
    if (kind === "ip4") {
      return (
        normalizePtBrText(
          firstPropValueByKeyHints(p, ["Nome", "NOME", "nome"]) ||
            firstPropValueByKeyHints(p, ["contrato", "Contrato", "CONTRATO"]) ||
            "",
        ) || "IP4"
      );
    }
    if (
      kind === "prads-br174" ||
      kind === "prads-br319" ||
      kind === "pca-prads-br319" ||
      kind === "pca-prads-cmm-br319"
    ) {
      const nome =
        firstPropValueByKeyHints(p, ["NOME_PCA", "NOME", "nome", "Nome", "id", "codigo", "CODIGO"]) ||
        getFirstNonEmptyValue(p, ["NOME_PCA", "NOME", "nome", "id"]);
      if (kind === "pca-prads-cmm-br319") return nome ? String(nome).trim() : "PCA - PRADS CMM";
      if (kind === "pca-prads-br319") return nome ? String(nome).trim() : "PCA - PRADS";
      if (kind === "prads-br319") return nome ? String(nome).trim() : "PRADS";
      return nome ? String(nome).trim() : "PRADS (BR-174)";
    }

    if (kind === "uc-estadual" || kind === "uc-municipal") {
      return (
        getFirstNonEmptyValue(p, ["Administra", "ADMINISTRA", "Nome", "NOME"]) ||
        getFirstNonEmptyValue(p, ["Ato_Legal", "ATO_LEGAL", "ano"]) ||
        (kind === "uc-estadual" ? "UC Estadual" : "UC Municipal")
      );
    }
    if (kind.startsWith("snv-")) {
      return getFirstNonEmptyValue(p, ["Codigo_BR", "Codigo_SNV", "vl_codigo", "codigo"]) || "SNV";
    }
    if (kind === "bueiros" || kind === "bueiros-br319" || kind === "bueiros-br174" || kind === "bueiros-br230") {
      const code =
        firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "Código", "CODIGO", "id", "ID"]) ||
        getFirstNonEmptyValue(p, ["vl_codigo", "codigo", "id"]);
      const mun = firstPropValueByKeyHints(p, ["municipio", "nm_municipio", "municipio_", "NM_MUNICIPIO"]);
      if (code) return `Bueiro ${String(code).trim()}`;
      if (mun) return `Bueiro — ${String(mun).trim()}`;
      return "Bueiro";
    }
    if (kind === "pontes" || kind === "pontes-br319" || kind === "pontes-br230") {
      const code = firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]);
      if (code) return `Ponte ${String(code).trim()}`;
      return "Ponte";
    }
    if (kind === "jazidas") {
      const code = firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]);
      if (code) return `Jazida ${String(code).trim()}`;
      return "Jazida";
    }
    return (
      getFirstNonEmptyValue(p, ["vl_codigo", "codigo", "Codigo_BR", "Codigo_SNV", "id", "nome", "NOME"]) ||
      getFirstNonEmptyValue(p, ["municipio", "nm_municipio", "municipio_", "uf_sigla"]) ||
      "Resultado"
    );
  }

  function bestSubtitleForFeature(kind, feature) {
    const p = feature?.properties || {};
    if (kind === "municipios") return "Estado do Amazonas";
    if (kind === "ti-am") {
      return getFirstNonEmptyValue(p, ["etnia_nome", "fase_ti", "municipio_", "uf_sigla"]) || "Terra Indígena";
    }
    if (kind === "ip4") {
      return (
        getFirstNonEmptyValue(p, ["contrato", "Contrato", "CONTRATO", "Contratos"]) ||
        getFirstNonEmptyValue(p, ["Lote", "lote"]) ||
        "IP4 — pequeno porte (hidrovias)"
      );
    }
    if (
      kind === "prads-br174" ||
      kind === "prads-br319" ||
      kind === "pca-prads-br319" ||
      kind === "pca-prads-cmm-br319"
    ) {
      const mun = firstPropValueByKeyHints(p, ["MUNICIPIO", "municipio", "nm_municipio", "NM_MUNICIPIO"]);
      const km = firstPropValueByKeyHints(p, ["KM", "km"]);
      const contrato = firstPropValueByKeyHints(p, ["CONTRATO", "contrato"]);
      const parts = [
        mun ? `Município: ${String(mun).trim()}` : "",
        km ? `KM: ${String(km).trim()}` : "",
        contrato ? `Contrato: ${String(contrato).trim()}` : "",
      ].filter(Boolean);
      if (parts.length) return parts.join(" • ");
      if (kind === "pca-prads-cmm-br319") return "PCA - PRADS CMM — BR-319";
      if (kind === "pca-prads-br319") return "PCA - PRADS — BR-319";
      if (kind === "prads-br319") return "PRADS — BR-319";
      return "PRADS — BR-174";
    }

    if (kind === "uc-estadual" || kind === "uc-municipal") {
      const area = getFirstNonEmptyValue(p, ["area_ha", "AREA_HA", "area"]);
      const ano = getFirstNonEmptyValue(p, ["ano", "ANO"]);
      const a = area ? `Área: ${area} ha` : "";
      const y = ano ? `Ano: ${ano}` : "";
      const extra = [a, y].filter(Boolean).join(" • ");
      return extra || getFirstNonEmptyValue(p, ["_source"]) || "";
    }
    if (kind === "bueiros" || kind === "bueiros-br319" || kind === "bueiros-br174" || kind === "bueiros-br230") {
      const mun = firstPropValueByKeyHints(p, ["municipio", "nm_municipio", "municipio_", "NM_MUNICIPIO"]);
      const src = getFirstNonEmptyValue(p, ["_source"]);
      const extra = [mun ? `Município: ${String(mun).trim()}` : "", src ? String(src) : ""].filter(Boolean).join(" • ");
      return extra;
    }
    return getFirstNonEmptyValue(p, ["municipio", "nm_municipio", "municipio_", "uf_sigla", "_source"]) || "";
  }

  function getToggleElForKind(kind) {
    const k = String(kind || "");
    const byRef = {
      bueiros: layerBueirosToggle,
      pontes: layerPontesToggle,
      jazidas: layerJazidasToggle,
      "hidrovias-am": layerHidroviasAmToggle,
      "pontes-br319": layerPontesBr319Toggle,
      "pontes-br230": layerPontesBr230Toggle,
      "bueiros-br319": layerBueirosBr319Toggle,
      "bueiros-br174": layerBueirosBr174Toggle,
      "bueiros-br230": layerBueirosBr230Toggle,
      "prads-br174": layerPradsBr174Toggle,
      "pca-prads-br319": layerPcaPradsBr319Toggle,
      "prads-br319": layerPradsBr319Toggle,
      "pca-prads-cmm-br319": layerPcaPradsCmmBr319Toggle,
      "uc-estadual": layerUcEstadualToggle,
      "uc-municipal": layerUcMunicipalToggle,
      "ti-am": layerTiAmToggle,
      ip4: layerIp4Toggle,
      municipios: layerLimiteMunicipalToggle,
    };
    if (byRef[k]) return byRef[k];
    if (k.startsWith("br-am:")) {
      const id = k.slice("br-am:".length);
      return document.getElementById(`layer-br-am-${id}`);
    }
    // Fallback genérico: layer-{kind}
    return document.getElementById(`layer-${k}`);
  }

  function toggleIdFromKind(kind) {
    const k = String(kind || "");
    if (k === "bueiros") return "layer-bueiros-br317";
    if (k === "pontes") return "layer-pontes-br307";
    if (k === "jazidas") return "layer-jazidas-br307";
    if (k === "municipios") return "layer-limite-municipal";
    if (k.startsWith("br-am:")) return `layer-br-am-${k.slice("br-am:".length)}`;
    return `layer-${k}`;
  }

  /** Liga/desliga uma camada pelo kind, disparando o mesmo fluxo da sidebar. */
  function setLayerToggleAndApply(kind, checked) {
    const el = getToggleElForKind(kind) || document.getElementById(toggleIdFromKind(kind));
    if (!el || el.disabled) return false;
    const next = Boolean(checked);
    if (el.checked === next) return true;
    el.checked = next;
    try {
      el.dispatchEvent(new Event("change", { bubbles: true }));
    } catch {
      // ignore
    }
    return true;
  }

  function setToggleChecked(kind, checked) {
    const el = getToggleElForKind(kind);
    if (!el || el.disabled) return;
    el.checked = Boolean(checked);
  }

  function setMunicipiosOnMap(wantOn) {
    if (!state.map) return;
    if (layerLimiteMunicipalToggle) {
      layerLimiteMunicipalToggle.checked = Boolean(wantOn);
    }
    if (wantOn) {
      void attachLimiteMunicipalLayerIfNeeded().finally(() => {
        applyLimiteMunicipalVisibility();
      });
      return;
    }
    applyLimiteMunicipalVisibility();
  }

  async function ensureKindOnMap(kind) {
    // Garante camada carregada/visível, mesmo que estivesse desligada
    try {
      if (kind === "contratos") return ensureContractSourcesLoaded();
      if (kind === "bueiros") return ensureBueirosBr317OnMap();
      if (kind === "pontes") return ensurePontesBr307OnMap();
      if (kind === "jazidas") return ensureJazidasBr307OnMap();
      if (kind === "hidrovias-am") return ensureHidroviasAmOnMap();
      if (kind === "pontes-br319") return ensurePontesBr319OnMap();
      if (kind === "pontes-br230") return ensurePontesBr230OnMap();
      if (kind === "bueiros-br319") return ensureBueirosBr319OnMap();
      if (kind === "bueiros-br174") return ensureBueirosBr174OnMap();
      if (kind === "prads-br174") return ensurePradsBr174OnMap();
      if (kind === "pca-prads-br319") return ensurePcaPradsBr319OnMap();
      if (kind === "prads-br319") return ensurePradsBr319OnMap();
      if (kind === "pca-prads-cmm-br319") return ensurePcaPradsCmmBr319OnMap();
      if (kind === "bueiros-br230") return ensureBueirosBr230OnMap();
      if (kind === "uc-estadual") return ensureUcEstadualOnMap();
      if (kind === "uc-municipal") return ensureUcMunicipalOnMap();
      if (kind === "ti-am") return ensureTiAmOnMap();
      if (kind === "ip4") return ensureIp4OnMap();
    } catch {
      // ignore
    }
    return null;
  }

  function disableKindOnMap(kind) {
    if (kind === "contratos") {
      clearContractSelectionOnly();
      try {
        state.globalSearch.enabledKinds.delete("contratos");
      } catch {
        // ignore
      }
      return;
    }
    if (kind === "municipios") {
      clearMunicipioFilterOnly();
      setMunicipiosOnMap(false);
      return;
    }
    if (!state.map) return;
    const lyr = getLayerGroupByKind(kind);
    try {
      if (lyr && state.map.hasLayer(lyr)) state.map.removeLayer(lyr);
    } catch {
      // ignore
    }
  }

  function collectBrAmToggles() {
    return Array.from(document.querySelectorAll('input[type="checkbox"][id^="layer-br-am-"]'));
  }

  function getSimpleLegendDefs() {
    return [
      {
        id: "br-am",
        label: "Rodovias BR-AM",
        shape: "line",
        color: "#06b6d4",
        getToggles: () => collectBrAmToggles(),
      },
      {
        id: "br-319",
        label: "BR-319",
        shape: "line",
        color: "#dc2626",
        fill: "rgba(220, 38, 38, .38)",
        getToggles: () =>
          [
            layerBueirosBr319Toggle,
            layerPontesBr319Toggle,
            layerPcaPradsBr319Toggle,
            layerPradsBr319Toggle,
            layerPcaPradsCmmBr319Toggle,
          ].filter(Boolean),
      },
      {
        id: "br-174",
        label: "BR-174",
        shape: "line",
        color: "#ec4899",
        fill: "rgba(236, 72, 153, .38)",
        getToggles: () =>
          [layerBueirosBr174Toggle, layerPradsBr174Toggle].filter(Boolean),
      },
      {
        id: "br-307",
        label: "BR-307",
        shape: "line",
        color: "#ec4899",
        fill: "rgba(236, 72, 153, .38)",
        getToggles: () =>
          [layerPontesToggle, layerJazidasToggle].filter(Boolean),
      },
      {
        id: "br-230",
        label: "BR-230",
        shape: "line",
        color: "#ca8a04",
        fill: "rgba(202, 138, 4, .38)",
        getToggles: () =>
          [layerBueirosBr230Toggle, layerPontesBr230Toggle].filter(Boolean),
      },
      {
        id: "bueiros",
        label: "Bueiros",
        shape: "point",
        color: "#2563eb",
        getToggles: () =>
          [layerBueirosToggle, layerBueirosBr174Toggle, layerBueirosBr319Toggle].filter(Boolean),
      },
      {
        id: "pontes",
        label: "Pontes",
        shape: "point",
        color: "#b45309",
        getToggles: () => [layerPontesBr319Toggle].filter(Boolean),
      },
      {
        id: "jazidas",
        label: "Jazidas",
        shape: "point",
        color: "#7c3aed",
        getToggles: () => [],
      },
      {
        id: "prads",
        label: "PRADS / PCA",
        shape: "poly",
        color: "#b45309",
        fill: "rgba(251, 191, 36, .45)",
        getToggles: () =>
          [
            layerPradsBr174Toggle,
            layerPcaPradsBr319Toggle,
            layerPradsBr319Toggle,
            layerPcaPradsCmmBr319Toggle,
          ].filter(Boolean),
      },
      {
        id: "ip4",
        label: "IP4",
        shape: "point",
        color: "#c97900",
        getToggles: () => [layerIp4Toggle].filter(Boolean),
      },
      {
        id: "hidrovias",
        label: "Hidrovias",
        shape: "line",
        color: "#1060d0",
        getToggles: () => [layerHidroviasAmToggle].filter(Boolean),
      },
      {
        id: "uc-estadual",
        label: "UC Estadual",
        shape: "poly",
        color: "#457c78",
        fill: "rgba(200, 232, 216, .55)",
        getToggles: () => [layerUcEstadualToggle].filter(Boolean),
      },
      {
        id: "uc-municipal",
        label: "UC Municipal",
        shape: "poly",
        color: "#1976d2",
        fill: "rgba(187, 222, 251, .5)",
        getToggles: () => [layerUcMunicipalToggle].filter(Boolean),
      },
      {
        id: "ti-am",
        label: "TI AM",
        shape: "poly",
        color: "#6ba09c",
        fill: "rgba(188, 218, 232, .55)",
        getToggles: () => [layerTiAmToggle].filter(Boolean),
      },
      {
        id: "limite-estadual",
        label: "Limite estadual",
        shape: "line",
        color: "#334155",
        getToggles: () => [layerLimiteToggle].filter(Boolean),
      },
      {
        id: "limite-municipal",
        label: "Limite municipal",
        shape: "line",
        color: "#64748b",
        getToggles: () => [layerLimiteMunicipalToggle].filter(Boolean),
      },
    ];
  }

  function legendSwatchHtml(def) {
    const color = def.color || "#64748b";
    const fill = def.fill || color;
    if (def.shape === "line") {
      return `<span class="map-legend__swatch map-legend__swatch--line" style="--swatch:${color}" aria-hidden="true"></span>`;
    }
    if (def.shape === "poly") {
      return `<span class="map-legend__swatch map-legend__swatch--poly" style="--swatch:${color};--swatch-fill:${fill}" aria-hidden="true"></span>`;
    }
    // Mesmo visual dos pontos do mapa (disco na cor da legenda).
    return `<span class="map-legend__swatch map-legend__swatch--point" style="--swatch:${color}" aria-hidden="true"></span>`;
  }

  /** Cor de acento da legenda (fonte única mapa ↔ legenda). */
  function getLegendAccentById(id) {
    try {
      const hit = getSimpleLegendDefs().find((d) => d.id === id);
      if (hit?.color) return String(hit.color);
    } catch {
      // ignore
    }
    return "#64748b";
  }

  function resolvePointLegendId(kind) {
    const k = String(kind || "");
    if (k.includes("319")) return "br-319";
    if (k.includes("174")) return "br-174";
    if (k.includes("307") || k === "pontes" || k === "jazidas") return "br-307";
    if (k.includes("230")) return "br-230";
    if (k.startsWith("bueiros")) return "bueiros";
    if (k.startsWith("pontes")) return "pontes";
    if (k === "ip4") return "ip4";
    if (k.startsWith("prads") || k.startsWith("pca-prads")) return "prads";
    if (k === "uc-estadual") return "uc-estadual";
    if (k === "uc-municipal") return "uc-municipal";
    return k;
  }

  /**
   * Ponto padrão: disco pequeno na cor da legenda.
   * Reduz poluição visual (antes 28–30px com pictogramas).
   */
  function createStandardPointIcon(kind = "point", options = {}) {
    const legendId = resolvePointLegendId(kind);
    const color = options.color || getLegendAccentById(legendId);
    const size = typeof options.size === "number" ? options.size : 14;
    const sat = isSatelliteBasemapActive();
    const ring = sat ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.98)";
    const edge = sat ? "rgba(2,8,23,.42)" : "rgba(15,23,42,.26)";
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="7" cy="7" r="5.15" fill="${color}" stroke="${ring}" stroke-width="1.5"/>
      <circle cx="7" cy="7" r="5.15" fill="none" stroke="${edge}" stroke-width="0.5"/>
    </svg>`;
    const safeKind = String(kind || "point").replace(/[^a-z0-9_-]+/gi, "-");
    return L.divIcon({
      className: `leaflet-standard-point-wrap leaflet-${safeKind}-icon-wrap`,
      html: `<div class="map-point-icon map-point-icon--dot map-point-icon--${safeKind}">${svg}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  function setLegendPanelOpen(open) {
    if (!layerLegendEl) return;
    const next = Boolean(open);
    layerLegendEl.classList.toggle("is-open", next);
    layerLegendEl.setAttribute("aria-hidden", next ? "false" : "true");
    try {
      btnLegend?.classList.toggle("is-active", next);
      btnLegend?.setAttribute("aria-expanded", next ? "true" : "false");
    } catch {
      // ignore
    }
    if (next) renderLayerLegend();
  }

  function getCamadasFootLayerLabel(inp) {
    const row = inp?.closest?.(".layer-row");
    const name =
      row?.querySelector?.(".layer-name")?.textContent?.trim() ||
      inp?.getAttribute?.("aria-label")?.trim() ||
      "";
    const branch =
      row?.closest?.(".layer-branch")?.querySelector?.(".layer-branch-title")?.textContent?.trim() ||
      "";
    const group =
      row?.closest?.(".layer-group")?.querySelector?.(".layer-group-heading-title")?.textContent?.trim() ||
      "";
    let label = name || String(inp?.id || "").replace(/^layer-/, "") || "Camada";
    if (branch && name && !name.toUpperCase().includes(branch.toUpperCase())) {
      label = `${name} · ${branch}`;
    } else if (!name && group) {
      label = group;
    }
    return normalizePtBrText(label);
  }

  function updateCamadasFootSummary() {
    if (!camadasFootCountEl && !camadasFootListEl) return;
    try {
      const inputs = Array.from(
        document.querySelectorAll(
          '.sidebar-section--layers .layer-row input[type="checkbox"][id^="layer-"]'
        )
      );
      const active = inputs.filter((inp) => inp?.checked);
      const on = active.length;
      if (camadasFootCountEl) {
        camadasFootCountEl.textContent = String(on);
        camadasFootCountEl.title =
          on === 0 ? "Nenhuma camada ligada" : on === 1 ? "1 camada ligada" : `${on} camadas ligadas`;
      }
      if (camadasFootListEl) {
        camadasFootListEl.innerHTML = active
          .map((inp) => {
            const label = escapeHtml(getCamadasFootLayerLabel(inp));
            return `<li class="camadas-foot__item"><span class="camadas-foot__dot" aria-hidden="true"></span><span class="camadas-foot__name" title="${label}">${label}</span></li>`;
          })
          .join("");
        camadasFootListEl.hidden = on === 0;
      }
      if (camadasFootEmptyEl) camadasFootEmptyEl.hidden = on > 0;
    } catch {
      // ignore
    }
  }

  function isMapLegendOpen() {
    return Boolean(layerLegendEl?.classList.contains("is-open"));
  }

  /** Com a legenda aberta, não expandir grupos/ramos da barra ao ligar camada. */
  function shouldExpandLayerGroupsOnToggle() {
    return !isMapLegendOpen();
  }

  function applyLegendToggleGroup(def, checked) {
    const toggles = (typeof def.getToggles === "function" ? def.getToggles() : []) || [];
    const usable = toggles.filter((el) => el && !el.disabled);
    if (!usable.length) return;

    if (!checked) {
      for (const el of usable) {
        if (!el.checked) continue;
        el.checked = false;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }

    // Liga todas as camadas do grupo (espelha as opções de Camadas).
    for (const el of usable) {
      if (el.checked) continue;
      el.checked = true;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function applyLegendLeafToggle(toggleId, checked) {
    const el = document.getElementById(String(toggleId || ""));
    if (!el || el.disabled) return;
    if (Boolean(el.checked) === Boolean(checked)) return;
    el.checked = Boolean(checked);
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function collectTogglesFromLegendNode(node) {
    if (!node) return [];
    if (node.type === "leaf") {
      const t = typeof node.getToggle === "function" ? node.getToggle() : null;
      return t ? [t] : [];
    }
    const kids = Array.isArray(node.children) ? node.children : [];
    return kids.flatMap((child) => collectTogglesFromLegendNode(child));
  }

  function legendLeaf(toggleEl, label, accentId, shape = "point", colorOverride = null) {
    if (!toggleEl || toggleEl.disabled) return null;
    const accent = getSimpleLegendDefs().find((d) => d.id === accentId) || {};
    const color = colorOverride || accent.color || getLegendAccentById(accentId);
    return {
      type: "leaf",
      id: toggleEl.id,
      label,
      shape: shape || accent.shape || "point",
      color,
      fill: accent.fill,
      getToggle: () => toggleEl,
    };
  }

  function legendBranch(id, label, children) {
    const kids = (children || []).filter(Boolean);
    if (!kids.length) return null;
    return { type: "branch", id, label, children: kids };
  }

  function legendGroup(id, label, children) {
    const kids = (children || []).filter(Boolean);
    if (!kids.length) return null;
    return { type: "group", id, label, children: kids };
  }

  /** Árvore da legenda = mesma hierarquia de Camadas. */
  function getCamadasLegendTree() {
    const brAmLeaves = collectBrAmToggles()
      .filter((el) => el && !el.disabled)
      .map((el) => {
        const rawId = String(el.id || "").replace(/^layer-br-am-/, "");
        const rawName =
          getBrAmNameById(rawId) ||
          el.closest?.(".layer-row")?.querySelector?.(".layer-name")?.textContent?.trim() ||
          rawId ||
          "BR-AM";
        return legendLeaf(el, normalizeBrAmDisplayName(rawName), "br-am", "line", getBrAmLayerColor(rawId, rawName));
      })
      .filter(Boolean);

    return [
      legendGroup("oae-oac", "OAE/OAC", [
        legendBranch("br-317", "BR-317", [legendLeaf(layerBueirosToggle, "Bueiros", "bueiros")]),
        legendBranch("br-307", "BR-307", [
          legendLeaf(layerPontesToggle, "Pontes", "br-307"),
          legendLeaf(layerJazidasToggle, "Jazidas", "br-307"),
        ]),
        legendBranch("br-319", "BR-319", [
          legendLeaf(layerBueirosBr319Toggle, "Bueiros", "br-319"),
          legendLeaf(layerPontesBr319Toggle, "Pontes", "br-319"),
          legendLeaf(layerPcaPradsBr319Toggle, "PCA - PRADS", "br-319", "poly"),
          legendLeaf(layerPradsBr319Toggle, "PRADS", "br-319", "poly"),
          legendLeaf(layerPcaPradsCmmBr319Toggle, "PCA - PRADS CMM", "br-319", "poly"),
        ]),
        legendBranch("br-230", "BR-230", [
          legendLeaf(layerBueirosBr230Toggle, "Bueiros", "br-230"),
          legendLeaf(layerPontesBr230Toggle, "Pontes", "br-230"),
        ]),
        legendBranch("br-174", "BR-174", [
          legendLeaf(layerBueirosBr174Toggle, "Bueiros", "br-174"),
          legendLeaf(layerPradsBr174Toggle, "PRADS", "br-174", "poly"),
        ]),
      ]),
      legendGroup("br-am", "BR-AM", brAmLeaves),
      legendGroup("aquaviario", "Aquaviário", [
        legendLeaf(layerIp4Toggle, "IP4", "ip4"),
        legendLeaf(layerHidroviasAmToggle, "Hidrovias", "hidrovias", "line"),
      ]),
      legendGroup("uc", "Unidades de Conservação", [
        legendLeaf(layerUcEstadualToggle, "UC Estadual", "uc-estadual", "poly"),
        legendLeaf(layerUcMunicipalToggle, "UC Municipal", "uc-municipal", "poly"),
        legendLeaf(layerTiAmToggle, "TI AM", "ti-am", "poly"),
      ]),
      legendGroup("limites-am", "Limites AM", [
        legendLeaf(layerLimiteToggle, "Limite estadual", "limite-estadual", "line"),
        legendLeaf(layerLimiteMunicipalToggle, "Limite municipal", "limite-municipal", "line"),
      ]),
    ].filter(Boolean);
  }

  function renderLegendLeafRow(leaf) {
    const toggle = typeof leaf.getToggle === "function" ? leaf.getToggle() : null;
    if (!toggle || toggle.disabled) return "";
    const on = Boolean(toggle.checked);
    const id = `legend-leaf-${leaf.id}`;
    return `<label class="map-legend__row map-legend__row--leaf${on ? " is-on" : ""}" for="${id}">
      <input id="${id}" class="map-legend__check" type="checkbox" data-layer-toggle="${leaf.id}" ${
      on ? "checked" : ""
    } />
      ${legendSwatchHtml(leaf)}
      <span class="map-legend__label">${escapeHtml(String(leaf.label || ""))}</span>
    </label>`;
  }

  function renderLegendTreeNode(node, depth = 0) {
    if (!node) return "";
    if (node.type === "leaf") return renderLegendLeafRow(node);

    const kids = Array.isArray(node.children) ? node.children : [];
    const toggles = collectTogglesFromLegendNode(node).filter((el) => el && !el.disabled);
    if (!toggles.length) return "";
    const onCount = toggles.filter((el) => el.checked).length;
    const allOn = onCount === toggles.length;
    const someOn = onCount > 0;
    const id = `legend-node-${node.id}`;
    const childrenHtml = kids.map((child) => renderLegendTreeNode(child, depth + 1)).join("");
    if (!childrenHtml) return "";

    return `<div class="map-legend__node map-legend__node--${node.type}" data-depth="${depth}">
      <label class="map-legend__row map-legend__row--${node.type}${someOn ? " is-on" : ""}" for="${id}">
        <input
          id="${id}"
          class="map-legend__check"
          type="checkbox"
          data-legend-node="${node.id}"
          ${allOn ? "checked" : ""}
          ${someOn && !allOn ? "data-indeterminate=\"1\"" : ""}
        />
        <span class="map-legend__node-mark" aria-hidden="true"></span>
        <span class="map-legend__label">${escapeHtml(String(node.label || ""))}</span>
      </label>
      <div class="map-legend__children">${childrenHtml}</div>
    </div>`;
  }

  /** Limpa a legenda: desliga as camadas de dados (mantém só Limite Estadual). */
  function clearMapLegendLayers() {
    try {
      turnOffAllDataLayersKeepLimiteEstadual();
    } catch {
      // Fallback: desliga item a item via legenda.
      for (const def of getSimpleLegendDefs()) {
        if (def.id === "limite-estadual") continue;
        try {
          applyLegendToggleGroup(def, false);
        } catch {
          // ignore
        }
      }
    }
    try {
      renderLayerLegend();
    } catch {
      // ignore
    }
  }

  function renderLayerLegend() {
    if (!layerLegendBodyEl) return;
    const tree = getCamadasLegendTree();
    const html = tree.map((node) => renderLegendTreeNode(node, 0)).filter(Boolean).join("");
    layerLegendBodyEl.innerHTML =
      html || `<div class="map-legend__empty">Nenhuma legenda disponível no momento.</div>`;

    // Checkboxes de grupo parcialmente ligados.
    try {
      layerLegendBodyEl.querySelectorAll('input.map-legend__check[data-indeterminate="1"]').forEach((inp) => {
        inp.indeterminate = true;
      });
    } catch {
      // ignore
    }
  }

  function findLegendNodeById(nodes, id) {
    for (const node of nodes || []) {
      if (!node) continue;
      if (node.id === id) return node;
      if (node.children) {
        const hit = findLegendNodeById(node.children, id);
        if (hit) return hit;
      }
    }
    return null;
  }

  function applyLegendTreeNodeToggle(nodeId, checked) {
    const node = findLegendNodeById(getCamadasLegendTree(), nodeId);
    if (!node) return;
    const toggles = collectTogglesFromLegendNode(node).filter((el) => el && !el.disabled);
    for (const el of toggles) {
      if (Boolean(el.checked) === Boolean(checked)) continue;
      el.checked = Boolean(checked);
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function getLayerGroupByKind(kind) {
    if (kind === "bueiros") return state.bueirosLayer;
    if (kind === "pontes") return state.pontesBr307Layer;
    if (kind === "jazidas") return state.jazidasBr307Layer;
    if (kind === "hidrovias-am") return state.hidroviasAmLayer;
    if (kind === "pontes-br319") return state.pontesBr319Layer;
    if (kind === "pontes-br230") return state.pontesBr230Layer;
    if (kind === "bueiros-br319") return state.bueirosBr319Layer;
    if (kind === "bueiros-br174") return state.bueirosBr174Layer;
    if (kind === "prads-br174") return state.pradsBr174Layer;
    if (kind === "pca-prads-br319") return state.pcaPradsBr319Layer;
    if (kind === "prads-br319") return state.pradsBr319Layer;
    if (kind === "pca-prads-cmm-br319") return state.pcaPradsCmmBr319Layer;
    if (kind === "bueiros-br230") return state.bueirosBr230Layer;
    if (kind === "uc-estadual") return state.ucEstadualLayer;
    if (kind === "uc-municipal") return state.ucMunicipalLayer;
    if (kind === "ti-am") return state.tiAmLayer;
    if (kind === "ip4") return state.ip4Layer;
    if (kind === "segmentos") return state.geojsonLayer;
    if (kind === "municipios") return state.boundaryMunicipalLayer || state.boundaryMunicipalHoverLayer;
    if (String(kind || "").startsWith("br-am:")) {
      const id = brAmIdFromLayerKey(kind);
      return state.brAm?.layersById?.[id] || null;
    }
    return null;
  }

  function tryFindLoadedLayerByProps(kind, props) {
    const p = props || {};
    const pick = (x) => normalizeSearchText(x);
    const wantCode = pick(firstPropValueByKeyHints(p, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]));
    const wantName = pick(firstPropValueByKeyHints(p, ["nome", "NOME", "descricao", "DESCRICAO", "terrai_nom"]));
    const match = (pp) => {
      const code = pick(firstPropValueByKeyHints(pp, ["vl_codigo", "codigo", "CODIGO", "id", "ID"]));
      if (wantCode && code && code === wantCode) return true;
      const nm = pick(firstPropValueByKeyHints(pp, ["nome", "NOME", "descricao", "DESCRICAO", "terrai_nom"]));
      if (wantName && nm && nm === wantName) return true;
      return false;
    };

    const table = {
      bueiros: [state.bueirosFeatures, state.bueirosLayersByIndex],
      pontes: [state.pontesFeatures, state.pontesLayersByIndex],
      jazidas: [state.jazidasFeatures, state.jazidasLayersByIndex],
      "pontes-br319": [state.pontesBr319Features, state.pontesBr319LayersByIndex],
      "pontes-br230": [state.pontesBr230Features, state.pontesBr230LayersByIndex],
      "bueiros-br319": [state.bueirosBr319Features, state.bueirosBr319LayersByIndex],
      "bueiros-br174": [state.bueirosBr174Features, state.bueirosBr174LayersByIndex],
      "bueiros-br230": [state.bueirosBr230Features, state.bueirosBr230LayersByIndex],
      "prads-br174": [state.pradsBr174Features, state.pradsBr174LayersByIndex],
      "pca-prads-br319": [state.pcaPradsBr319Features, state.pcaPradsBr319LayersByIndex],
      "prads-br319": [state.pradsBr319Features, state.pradsBr319LayersByIndex],
      "pca-prads-cmm-br319": [state.pcaPradsCmmBr319Features, state.pcaPradsCmmBr319LayersByIndex],
      "uc-estadual": [state.ucEstadualFeatures, state.ucEstadualLayersByIndex],
      "uc-municipal": [state.ucMunicipalFeatures, state.ucMunicipalLayersByIndex],
      "ti-am": [state.tiAmFeatures, state.tiAmLayersByIndex],
      ip4: [state.ip4Features, state.ip4LayersByIndex],
      segmentos: [state.allFeatures, state.layersByIndex],
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

  function flashSearchHit(feature) {
    if (!state.map || !feature) return;
    ensureInfraGeoPanes();
    let temp = null;
    try {
      temp = L.geoJSON(feature, {
        pane: state.panes?.highlight,
        style: () => ({ color: "#334155", weight: 3, opacity: 0.95, fillColor: "#94a3b8", fillOpacity: 0.12 }),
        pointToLayer(_f, latlng) {
          return L.circleMarker(latlng, { radius: 9, color: "#334155", weight: 3, fillColor: "#94a3b8", fillOpacity: 0.35 });
        },
      }).addTo(state.map);
      const b = temp.getBounds?.();
      if (b?.isValid?.()) state.map.fitBounds(b, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
    } catch {
      // ignore
    }
    if (temp) {
      window.setTimeout(() => {
        try {
          if (state.map && temp) state.map.removeLayer(temp);
        } catch {
          // ignore
        }
      }, 2500);
    }
  }

  async function getFeaturesForSearchKind(kind) {
    // Cache (somente features; não depende do mapa).
    if (state.searchCache?.[kind]?.features?.length) return state.searchCache[kind].features;

    // Municipios vem da camada hover (polígonos)
    if (kind === "municipios") {
      try {
        await attachLimiteMunicipalLayerIfNeeded();
      } catch {
        // ignore
      }
      return state.municipiosFeatures || [];
    }

    // Mesmo com a camada "desligada", a busca deve funcionar.
    // Então, quando não houver dados em memória, buscamos via API.
    const inMemory = () => {
      if (kind === "bueiros" && state.bueirosFeatures?.length) return state.bueirosFeatures;
      if (kind === "pontes" && state.pontesFeatures?.length) return state.pontesFeatures;
      if (kind === "jazidas" && state.jazidasFeatures?.length) return state.jazidasFeatures;
      if (kind === "pontes-br319" && state.pontesBr319Features?.length) return state.pontesBr319Features;
      if (kind === "pontes-br230" && state.pontesBr230Features?.length) return state.pontesBr230Features;
      if (kind === "bueiros-br319" && state.bueirosBr319Features?.length) return state.bueirosBr319Features;
      if (kind === "bueiros-br174" && state.bueirosBr174Features?.length) return state.bueirosBr174Features;
      if (kind === "bueiros-br230" && state.bueirosBr230Features?.length) return state.bueirosBr230Features;
      if (kind === "prads-br174" && state.pradsBr174Features?.length) return state.pradsBr174Features;
      if (kind === "pca-prads-br319" && state.pcaPradsBr319Features?.length) return state.pcaPradsBr319Features;
      if (kind === "prads-br319" && state.pradsBr319Features?.length) return state.pradsBr319Features;
      if (kind === "pca-prads-cmm-br319" && state.pcaPradsCmmBr319Features?.length) {
        return state.pcaPradsCmmBr319Features;
      }
      if (kind === "ip4" && state.ip4Features?.length) return state.ip4Features;
      if (kind === "hidrovias-am" && state.hidroviasAmFeatures?.length) return state.hidroviasAmFeatures;
      if (kind === "uc-estadual" && state.ucEstadualFeatures?.length) return state.ucEstadualFeatures;
      if (kind === "uc-municipal" && state.ucMunicipalFeatures?.length) return state.ucMunicipalFeatures;
      if (kind === "ti-am" && state.tiAmFeatures?.length) return state.tiAmFeatures;
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
      "ip4": "/layers/ip4",
      "hidrovias-am": "/layers/hidrovias-am",
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
      state.searchCache[kind] = { features: feats };
      return feats;
    } catch {
      return [];
    }
  }

  function scoreFeatureMatch(props, query) {
    const q = normalizeSearchText(query);
    if (!q) return null;
    // Exato em algum campo = score 0 (mais preciso)
    for (const v of Object.values(props || {})) {
      if (normalizeSearchText(v) === q) return 0;
    }
    // Todos tokens presentes = score 1
    if (featureMatchesQuery(props, q)) return 1;
    return null;
  }

  async function globalSearchRun(rawQuery) {
    ensureGlobalSearchDefaults();
    const raw = String(rawQuery || "").trim();
    const q = normalizeSearchText(raw);
    if (!q) return [];
    const defs = getSearchKindDefs();
    const enabled = defs.filter((d) => state.globalSearch.enabledKinds.has(d.id));
    const out = [];

    // Pesquisa paralela por camada para reduzir delay (rede/CPU).
    const settled = await Promise.allSettled(
      enabled.map(async (def) => {
        const feats = await getFeaturesForSearchKind(def.id);
        if (!feats?.length) return [];
        const hits = [];
        for (const f of feats) {
          const sc = scoreFeatureMatch(f?.properties, q);
          if (sc === null) continue;
          hits.push({
            kind: def.id,
            kindLabel: def.label,
            score: sc,
            feature: f,
            title: bestTitleForFeature(def.id, f),
            subtitle: bestSubtitleForFeature(def.id, f),
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

  async function openSearchResult(res) {
    if (!res) return;
    closeGlobalSearchResults();
    closeGlobalSearchFilter();
    if (!res.feature) return;
    // Municípios: abre direto na camada hover (polígono), sem depender de toggle.
    if (res.kind === "municipios") {
      try {
        if (layerLimiteMunicipalToggle) layerLimiteMunicipalToggle.checked = true;
        await attachLimiteMunicipalLayerIfNeeded();
        applyLimiteMunicipalVisibility();
      } catch {
        // ignore
      }
      const idx = res.feature?._municipioIndex;
      const lyr = typeof idx === "number" ? state.municipiosLayersByIndex?.[idx] : null;
      if (lyr && state.map) {
        try {
          const b = lyr.getBounds?.();
          if (b?.isValid?.()) state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24], maxZoom: 11 });
        } catch {
          // ignore
        }
        try {
          lyr.openTooltip?.();
        } catch {
          // ignore
        }
      } else {
        flashSearchHit(res.feature);
      }
      try {
        selectFeature(res.feature, lyr, { zoomTo: false, selectionKind: "municipios", zoomMaxFromPanel: true });
        void openAttributesTableFromMapClick("municipios", res.feature, lyr);
      } catch {
        // ignore
      }
      const nm = getMunicipioNomeFromProps(res.feature?.properties) || "Município";
      setStatus(`Pesquisa: Municípios (AM) — ${nm}`, "ok");
      return;
    }
    // Liga camada (se houver toggle) e garante carregar, mesmo desligada.
    setToggleChecked(res.kind, true);
    await ensureKindOnMap(res.kind);

    // Tenta selecionar a feição na camada carregada; fallback: realce temporário.
    const hit = tryFindLoadedLayerByProps(res.kind, res.feature?.properties);
    if (hit?.feature && hit?.layer) {
      try {
      } catch {
        // ignore
      }
      try {
        selectFeature(hit.feature, hit.layer, { zoomTo: true, selectionKind: res.kind, zoomMaxFromPanel: true });
        void openAttributesTableFromMapClick(res.kind, hit.feature, hit.layer);
      } catch {
        flashSearchHit(res.feature);
      }
    } else {
      flashSearchHit(res.feature);
    }
    setStatus(`Pesquisa: ${res.kindLabel} — ${res.title}`, "ok");
  }

  function ensureInfraGeoPanes() {
    if (!state.map) return null;
    if (state.panes) return state.panes;

    // Ordem: limite (fundo) → polígonos → linhas → pontos → highlight (topo)
    const mk = (name, zIndex) => {
      const id = `ig-${name}`;
      let pane = state.map.getPane?.(id);
      if (!pane) pane = state.map.createPane(id);
      if (pane && pane.style) pane.style.zIndex = String(zIndex);
      return id;
    };

    state.panes = {
      boundary: mk("boundary", 240),
      polygons: mk("polygons", 340),
      lines: mk("lines", 420),
      points: mk("points", 520),
      // Mantém abaixo do tooltipPane (Leaflet usa ~650) para não “tapar” tooltips/popups.
      highlight: mk("highlight", 640),
    };
    return state.panes;
  }

  function isBottomSheetVisible() {
    return Boolean(bottomSheet && !bottomSheet.classList.contains("is-collapsed"));
  }

  function syncBottomSheetChrome() {
    const peeking = Boolean(bottomSheet?.classList.contains("is-peek"));
    const hasPeekSelection = Boolean(state.peekSelectionActive);
    if (bottomSheetRestore) bottomSheetRestore.hidden = !peeking;
    if (bottomZoomSelected) bottomZoomSelected.hidden = peeking && !hasPeekSelection;
    bottomSheet?.classList.toggle("is-peek-active", peeking);
    bottomSheet?.classList.toggle("has-peek-selection", peeking && hasPeekSelection);
    // Não sobrepor o sheet com o chip “Camada selecionada” (canto inferior esquerdo).
    if (isBottomSheetVisible()) {
      try {
        hideMapCoordsControl();
      } catch {
        // ignore
      }
    }
  }

  function getFeatureDisplayLabel(feature) {
    const props = feature?.properties || {};
    return (
      getFirstNonEmptyValue(props, [
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

  function resetPeekSelectionSummary() {
    state.peekSelectionActive = false;
    const peekLabel = $("bottom-sheet-peek-label");
    const peekHint = $("bottom-sheet-peek-hint");
    if (peekLabel) peekLabel.textContent = "Tabela de atributos";
    if (peekHint) peekHint.textContent = "Toque para expandir";
    bottomSheet?.classList.remove("has-peek-selection");
    syncBottomSheetChrome();
  }

  function syncPeekSelectionSummary(feature, selectionKind) {
    const peekLabel = $("bottom-sheet-peek-label");
    const peekHint = $("bottom-sheet-peek-hint");
    if (!peekLabel || !peekHint) return;
    if (!feature) {
      resetPeekSelectionSummary();
      return;
    }
    state.peekSelectionActive = true;
    const layerLabel = getPanelTableLabel();
    peekLabel.textContent = String(layerLabel || "Camada");
    peekHint.textContent = `${getFeatureDisplayLabel(feature)} · selecionado`;
    bottomSheet?.classList.add("has-peek-selection");
    syncBottomSheetChrome();
  }

  function peekBottomSheet() {
    if (!isBottomSheetVisible()) return;
    bottomSheet.classList.add("is-peek");
    bottomSheet.style.height = "";
    syncBottomSheetChrome();
  }

  function expandBottomSheet() {
    if (!bottomSheet) return;
    closeMobileSidebarIfNeeded();
    bottomSheet.classList.remove("is-peek");
    syncBottomSheetChrome();
  }

  function openBottomSheet() {
    if (!bottomSheet) return;
    closeMobileSidebarIfNeeded();
    bottomSheet.classList.remove("is-collapsed", "is-peek");
    bottomSheet.setAttribute("aria-hidden", "false");
    syncBottomSheetChrome();
    try {
      if (state.map?.invalidateSize) {
        requestAnimationFrame(() => state.map.invalidateSize({ animate: false }));
      }
    } catch {
      // ignore
    }
  }

  function closeBottomSheet() {
    if (!bottomSheet) return;
    bottomSheet.classList.add("is-collapsed");
    bottomSheet.classList.remove("is-peek");
    bottomSheet.setAttribute("aria-hidden", "true");
    state.tablePinnedFromMap = false;
    state.lastMapClickLayerId = null;
    resetPeekSelectionSummary();
    syncBottomSheetChrome();
  }

  function getBottomSheetInsetBottom() {
    if (!isBottomSheetVisible()) return 0;
    return Math.ceil(bottomSheet.getBoundingClientRect().height) + 16;
  }

  function fitMapBoundsWithSheetPadding(bounds, options = {}) {
    if (!state.map || !bounds?.isValid?.()) return;
    const mapCap = typeof state.map.getMaxZoom === "function" ? state.map.getMaxZoom() : 22;
    const maxZ = typeof options.maxZoom === "number" ? options.maxZoom : mapCap;
    const padX = typeof options.padX === "number" ? options.padX : 20;
    const padTop = typeof options.padTop === "number" ? options.padTop : 20;
    const padBottom = getBottomSheetInsetBottom() + padX;
    state.map.fitBounds(bounds, {
      maxZoom: maxZ,
      animate: false,
      duration: 0,
      paddingTopLeft: L.point(padX, padTop),
      paddingBottomRight: L.point(padX, padBottom),
    });
  }

  function zoomSelectionFromTable(feature, layer, selectionKind) {
    peekBottomSheet();
    syncPeekSelectionSummary(feature, selectionKind);
    if (layer?.getBounds) {
      applySelectionZoomIfNeeded(layer, selectionKind, true, true);
    } else {
      zoomToFeatureNow(feature, layer, selectionKind, true);
    }
    pinFeatureQuickMenu(feature, selectionKind, null, null, layer);
  }

  function syncBottomZoomButton() {
    if (!bottomZoomSelected) return;
    bottomZoomSelected.disabled = !state.selectedFeature;
  }

  /** Cache compartilhado de GeoJSON: warm-up + ligar camada reutilizam a mesma Promise. */
  const layerGeoJsonFetchByUrl = new Map();
  const FEATURE_COLORS_MAX = 400;

  function fetchLayerGeoJson(url) {
    const key = String(url || "");
    if (!key) return Promise.reject(new Error("URL vazia"));
    const cached = layerGeoJsonFetchByUrl.get(key);
    if (cached) return cached;
    const promise = fetch(key)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || r.statusText);
        return r.json();
      })
      .catch((err) => {
        layerGeoJsonFetchByUrl.delete(key);
        throw err;
      });
    layerGeoJsonFetchByUrl.set(key, promise);
    return promise;
  }

  /** Libera caches de sessão (busca, cores, GeoJSON em memória). */
  function clearEphemeralClientCaches({ keepLimiteEndpoints = true } = {}) {
    try {
      state.searchCache = {};
    } catch {
      // ignore
    }
    try {
      featureColors.clear();
      colorIndex = 0;
    } catch {
      // ignore
    }
    try {
      if (!keepLimiteEndpoints) {
        layerGeoJsonFetchByUrl.clear();
      } else {
        for (const key of Array.from(layerGeoJsonFetchByUrl.keys())) {
          if (String(key).includes("limite-estadual")) continue;
          layerGeoJsonFetchByUrl.delete(key);
        }
      }
    } catch {
      // ignore
    }
    try {
      if (state.mapClickTables && typeof state.mapClickTables === "object") {
        state.mapClickTables = {};
      }
    } catch {
      // ignore
    }
  }

  const colorPalette = [
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
  const featureColors = new Map();
  let colorIndex = 0;

  function setStatus(text, _kind = "ok") {
    if (!statusEl) return;
    statusEl.textContent = text;
    if (statusEl.parentElement) statusEl.parentElement.style.opacity = "1";
  }

  if (earlyErrors.length) {
    setStatus(`Erro JS: ${earlyErrors[0]}`, "error");
  }

  function hideFeatureQuickMenu(force = false) {
    if (!featureQuickMenuEl) return;
    if (state.featureQuickMenuPinned && !force) return;
    state.featureQuickMenuPinned = false;
    featureQuickMenuEl.classList.remove("is-visible", "is-pinned", "is-minimal");
  }

  /**
   * Configuração única de popups (hover, tooltips Leaflet e detalhe do clique).
   * Todas as camadas reutilizam estes valores — não criar opções ad hoc por camada.
   */
  const FEATURE_POPUP = {
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

  function getPreferredKeysByKind(selectionKind) {
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
    const map = FEATURE_POPUP.preferredKeysByKind;
    return map[kind] || FEATURE_POPUP.preferredKeysFallback;
  }

  function shouldSkipPopupKey(key) {
    const kk = String(key || "").toLowerCase();
    if (!kk) return true;
    if (FEATURE_POPUP.skipKeys.has(kk)) return true;
    if (kk === "geometry" || kk === "geom") return true;
    return false;
  }

  function pickQuickMenuRows(props, options = {}) {
    const { minimal = false, selectionKind = "", maxRows = FEATURE_POPUP.hover.maxRows } = options;
    const entries = Object.entries(props || {}).filter(([k, v]) => {
      if (shouldSkipPopupKey(k)) return false;
      if (v === undefined || v === null || String(v).trim() === "") return false;
      // HTML/XML sem texto útil (ex.: DESCRIÇÃO do PRADS) não entra no popup
      if (!formatAttributeDisplayValue(v, k)) return false;
      return true;
    });

    const toRow = ([key, value]) => ({
      label: normalizeFeatureLabel(key),
      value: formatAttributeDisplayValue(value, key),
      key,
    });

    if (!minimal) return entries.map(toRow);

    const preferred = getPreferredKeysByKind(selectionKind);
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

  function buildQuickMenuRowsHtml(rows) {
    return rows
      .map(
        (row) => `<div class="feature-quick-menu__row">
          <div class="feature-quick-menu__row-label">${escHtmlCell(row.label)}</div>
          <div class="feature-quick-menu__row-value">${escHtmlCell(row.value)}</div>
        </div>`,
      )
      .join("");
  }

  function getLeafletTooltipOptions(extra = {}) {
    return {
      direction: FEATURE_POPUP.leaflet.direction,
      sticky: FEATURE_POPUP.leaflet.sticky,
      opacity: FEATURE_POPUP.leaflet.opacity,
      interactive: FEATURE_POPUP.leaflet.interactive,
      ...extra,
    };
  }

  function bindMunicipioHoverPill(layer, name) {
    if (!layer || !name) return;
    const title = escapeHtml(name);
    const subtitle = escapeHtml(FEATURE_POPUP.municipios.subtitle);
    layer.bindTooltip(
      `<div class="hover-municipio-pill__title">${title}</div><div class="hover-municipio-pill__subtitle">${subtitle}</div>`,
      getLeafletTooltipOptions({ className: FEATURE_POPUP.municipios.className }),
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

  function pinFeatureQuickMenu(feature, selectionKind, e, results = null, layer = null) {
    if (!featureQuickMenuEl) return;
    cancelQuickMenuHide();
    featureQuickMenuEl.classList.add("is-minimal");
    const list = Array.isArray(results) ? results : null;
    const idx = state.identify?.activeIndex ?? 0;
    if (list && list.length) {
      renderIdentifyQuickMenu(list, idx, { minimal: true, showLayerPicker: true });
    } else {
      renderFeatureQuickMenu(feature, selectionKind, { minimal: true });
    }
    featureQuickMenuEl.classList.add("is-visible", "is-pinned");
    state.featureQuickMenuPinned = true;
    const activeLayer = layer || list?.[idx]?.layer || null;
    requestAnimationFrame(() => {
      positionFeatureQuickMenuAvoidingRect(getAvoidRectForLayer(activeLayer, feature, e));
    });
  }

  function showFeatureQuickMenuOnHover(feature, selectionKind, e, layer = null) {
    if (!featureQuickMenuEl || state.featureQuickMenuPinned) return;
    cancelQuickMenuHide();
    featureQuickMenuEl.classList.add("is-minimal");
    featureQuickMenuEl.classList.remove("is-pinned");
    renderFeatureQuickMenu(feature, selectionKind, { minimal: true });
    featureQuickMenuEl.classList.add("is-visible");
    requestAnimationFrame(() => {
      positionFeatureQuickMenuAvoidingRect(getAvoidRectForLayer(layer, feature, e));
    });
  }

  let quickMenuHideTimer = null;

  function cancelQuickMenuHide() {
    if (quickMenuHideTimer) {
      clearTimeout(quickMenuHideTimer);
      quickMenuHideTimer = null;
    }
  }

  function scheduleQuickMenuHide(delayMs = FEATURE_POPUP.hover.hideDelayMs) {
    if (state.featureQuickMenuPinned) return;
    cancelQuickMenuHide();
    quickMenuHideTimer = setTimeout(() => {
      quickMenuHideTimer = null;
      hideFeatureQuickMenu();
    }, delayMs);
  }

  function positionFeatureQuickMenuFromClientXY(clientX, clientY) {
    if (!featureQuickMenuEl) return;
    const offset = FEATURE_POPUP.hover.offsetPx;
    const pad = FEATURE_POPUP.hover.padPx;
    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;

    const r0 = featureQuickMenuEl.getBoundingClientRect();
    const w = r0.width || 320;
    const h = r0.height || 220;

    let x = (clientX ?? 0) + offset;
    let y = (clientY ?? 0) + offset;

    if (x + w + pad > vw) x = (clientX ?? 0) - w - offset;
    if (y + h + pad > vh) y = (clientY ?? 0) - h - offset;

    x = Math.max(pad, Math.min(x, Math.max(pad, vw - w - pad)));
    y = Math.max(pad, Math.min(y, Math.max(pad, vh - h - pad)));

    featureQuickMenuEl.style.left = `${Math.round(x)}px`;
    featureQuickMenuEl.style.top = `${Math.round(y)}px`;
  }


  function latLngToClientXY(latlng) {
    if (!state.map || !latlng) return null;
    try {
      const pt = state.map.latLngToContainerPoint(latlng);
      const rect = state.map.getContainer().getBoundingClientRect();
      return { x: rect.left + pt.x, y: rect.top + pt.y };
    } catch {
      return null;
    }
  }

  function getAvoidRectForLayer(layer, feature, e) {
    const pad = FEATURE_POPUP.hover.avoidPadPx;
    try {
      if (layer?.getBounds) {
        const b = layer.getBounds();
        if (b?.isValid?.()) {
          const nw = latLngToClientXY(b.getNorthWest());
          const se = latLngToClientXY(b.getSouthEast());
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
        const p = latLngToClientXY(layer.getLatLng());
        if (p) {
          const r = FEATURE_POPUP.hover.pointRadiusPx;
          return { left: p.x - r, top: p.y - r, right: p.x + r, bottom: p.y + r };
        }
      }
      const gt = feature?.geometry?.type;
      const coords = feature?.geometry?.coordinates;
      if (gt === "Point" && Array.isArray(coords) && coords.length >= 2) {
        const p = latLngToClientXY(L.latLng(coords[1], coords[0]));
        if (p) {
          const r = FEATURE_POPUP.hover.pointRadiusPx;
          return { left: p.x - r, top: p.y - r, right: p.x + r, bottom: p.y + r };
        }
      }
    } catch {
      // ignore
    }
    const oe = e?.originalEvent;
    if (oe && typeof oe.clientX === "number" && typeof oe.clientY === "number") {
      const r = FEATURE_POPUP.hover.pointRadiusPx + 4;
      return {
        left: oe.clientX - r,
        top: oe.clientY - r,
        right: oe.clientX + r,
        bottom: oe.clientY + r,
      };
    }
    if (e?.latlng) {
      const p = latLngToClientXY(e.latlng);
      if (p) {
        const r = FEATURE_POPUP.hover.pointRadiusPx + 4;
        return { left: p.x - r, top: p.y - r, right: p.x + r, bottom: p.y + r };
      }
    }
    return null;
  }

  function rectsOverlap(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }

  function positionFeatureQuickMenuAvoidingRect(avoidRect) {
    if (!featureQuickMenuEl) return;
    const gap = 14;
    const margin = 10;
    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    const bottomInset = getBottomSheetInsetBottom();
    const usableBottom = vh - bottomInset;

    const menu = featureQuickMenuEl.getBoundingClientRect();
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
      featureQuickMenuEl.style.left = `${Math.round(c.x)}px`;
      featureQuickMenuEl.style.top = `${Math.round(c.y)}px`;
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
      if (!rectsOverlap(rect, avoidRect)) {
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
      if (!rectsOverlap(rect, avoidRect)) {
        applyAt(c.x, c.y);
        return;
      }
    }
    applyAt(avoidRect.right + gap, avoidRect.top);
  }

  function normalizeFeatureLabel(key) {
    const raw = String(key || "").trim();
    const aliases = {
      unidade_fe: "Unidade FE",
      codigo_br: "Código BR",
      codigo_snv: "Código SNV",
      contratada: "Contratada",
      contrato: "Contrato",
      contratos: "Contratos",
      km_inicial: "Km inicial",
      km_final: "Km final",
      nm_municipio: "Município",
      municipio: "Município",
      vl_codigo: "Código",
      terrai_nom: "Terra indígena",
      etnia_nome: "Etnia",
      nome: "Nome",
      lote: "Lote",
      operacao: "Operação",
      supervisao: "Supervisão",
      proc_dnit: "Proc. DNIT",
      proc_ipaam: "Proc. IPAAM",
      area_ha: "Área (ha)",
      area_km2: "Área (km²)",
      extensao_k: "Extensão (km)",
      regiao_hid: "Região hidrográfica",
      sequencia: "Sequência",
      codigo: "Código",
      trecho: "Trecho",
      observacao: "Observação",
      condicao: "Condição",
      dimensao: "Dimensão",
      largura: "Largura",
      br_uf: "BR/UF",
      atividade: "Atividade",
      descricao: "Descrição",
      descriptio: "Descrição",
      modalidade: "Modalidade",
      fase_ti: "Fase da TI",
      uf_sigla: "UF",
    };
    const k = raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (aliases[k]) return aliases[k];
    return normalizePtBrText(raw)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function normalizePtBrText(input) {
    const s = String(input ?? "");
    // Corrige "mojibake" (UTF-8 interpretado como Latin-1/CP1252) quando aparecer.
    const maybeFixMojibake = (x) => {
      if (!x) return x;
      // Substituições diretas dos padrões mais comuns em pt-BR (ex.: TefÃ© → Tefé).
      const directPairs = [
        [/Ã©/g, "é"],
        [/Ã¡/g, "á"],
        [/Ã£/g, "ã"],
        [/Ã¢/g, "â"],
        [/Ãª/g, "ê"],
        [/Ã­/g, "í"],
        [/Ã³/g, "ó"],
        [/Ãµ/g, "õ"],
        [/Ã´/g, "ô"],
        [/Ãº/g, "ú"],
        [/Ã§/g, "ç"],
        [/Ã‰/g, "É"],
        [/Ã/g, "Á"],
        [/Ãƒ/g, "Ã"],
        [/ÃŠ/g, "Ê"],
        [/Ã“/g, "Ó"],
        [/Ã•/g, "Õ"],
        [/Ãš/g, "Ú"],
        [/Ã‡/g, "Ç"],
        [/Âº/g, "º"],
        [/Âª/g, "ª"],
        [/Â /g, " "],
      ];
      let direct = x;
      let touched = false;
      for (const [re, rep] of directPairs) {
        const next = direct.replace(re, rep);
        if (next !== direct) {
          direct = next;
          touched = true;
        }
      }
      if (touched && !/[ÃÂ][^\u0000-\u007F]/.test(direct)) return direct;

      // Heurística segura via latin1→utf-8:
      // - Mojibake típico tem "Ã§", "Ã£", "Â°" etc (Ã/Â seguidos de não-ASCII).
      // - Texto PT-BR válido pode conter "Ã" (ex.: "MANUTENÇÃO"), normalmente seguido de ASCII ("ÃO").
      if (!/[ÃÂ][^\u0000-\u007F]/.test(x)) return touched ? direct : x;
      try {
        const cp1252Map = new Map([
          [0x20ac, 0x80],
          [0x201a, 0x82],
          [0x0192, 0x83],
          [0x201e, 0x84],
          [0x2026, 0x85],
          [0x2020, 0x86],
          [0x2021, 0x87],
          [0x02c6, 0x88],
          [0x2030, 0x89],
          [0x0160, 0x8a],
          [0x2039, 0x8b],
          [0x0152, 0x8c],
          [0x017d, 0x8e],
          [0x2018, 0x91],
          [0x2019, 0x92],
          [0x201c, 0x93],
          [0x201d, 0x94],
          [0x2022, 0x95],
          [0x2013, 0x96],
          [0x2014, 0x97],
          [0x02dc, 0x98],
          [0x2122, 0x99],
          [0x0161, 0x9a],
          [0x203a, 0x9b],
          [0x0153, 0x9c],
          [0x017e, 0x9e],
          [0x0178, 0x9f],
        ]);
        const bytes = Uint8Array.from(x, (ch) => {
          const code = ch.charCodeAt(0);
          if (code <= 0xff) return code;
          const mapped = cp1252Map.get(code);
          return typeof mapped === "number" ? mapped : 0x3f;
        });
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
        if (decoded && decoded !== x && !/[ÃÂ][^\u0000-\u007F]/.test(decoded)) return decoded;
        return touched ? direct : decoded || x;
      } catch {
        return touched ? direct : x;
      }
    };
    let out = maybeFixMojibake(s);
    // Normaliza composição de acentos (NFC) para consistência em PT-BR.
    try {
      out = out.normalize("NFC");
    } catch {
      // ignore
    }
    return out;
  }

  function normalizeSearchText(input) {
    let s = normalizePtBrText(input ?? "");
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

  function getFirstNonEmptyValue(props, keys) {
    for (const key of keys) {
      const val = props?.[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") return val;
    }
    return "";
  }

  function getSelectionKindLayerLabel(selectionKind) {
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
      const id = brAmIdFromLayerKey(selectionKind);
      const name = normalizeBrAmDisplayName(getBrAmNameById(id) || "");
      const num = extractBrHighwayNumber(name);
      if (num) return `BR-${num}`;
      return name ? String(name).replace(/_/g, "-") : "BR-AM";
    }
    return "CAMADA";
  }

  function getMunicipioNomeFromProps(props) {
    const p = props || {};
    const looksLikeName = (val) => {
      if (val === null || val === undefined) return false;
      const s = normalizePtBrText(val).trim();
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
      if (looksLikeName(v)) return normalizePtBrText(v).trim();
    }

    // Fallback heurístico: procura qualquer campo que pareça nome de município.
    try {
      const candidates = [];
      for (const [k, val] of Object.entries(p)) {
        if (!looksLikeName(val)) continue;
        const s = normalizePtBrText(val).trim();
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

  function renderFeatureQuickMenu(feature, selectionKind, options = {}) {
    if (!featureQuickMenuEl || !featureQuickTitleEl || !featureQuickSubtitleEl || !featureQuickBodyEl) return;
    const { minimal = false } = options;
    const props = feature?.properties || {};
    const title = getSelectionKindLayerLabel(selectionKind);
    const preferred = getPreferredKeysByKind(selectionKind) || [];
    const primaryCandidates = [...preferred, ...FEATURE_POPUP.primaryNameKeys];
    let primaryName = normalizePtBrText(getFirstNonEmptyValue(props, primaryCandidates));
    // BR-AM: subtítulo útil (faixa de km / contratada), não só o número da BR.
    if (String(selectionKind || "").startsWith("br-am:")) {
      const km0 = getFirstNonEmptyValue(props, ["Km_inicial", "km_inicial", "KM_INICIAL"]);
      const km1 = getFirstNonEmptyValue(props, ["Km_final", "km_final", "KM_FINAL"]);
      if (km0 !== "" && km1 !== "" && String(km0) !== String(km1)) {
        primaryName = normalizePtBrText(`Km ${km0} – ${km1}`);
      } else {
        primaryName = normalizePtBrText(
          getFirstNonEmptyValue(props, ["CONTRATADA", "CONTRATO", "contrato", "CODIGO_BR", "Codigo_BR"]) ||
            primaryName,
        );
      }
    }
    const subtitle = primaryName || "Detalhes da feição";

    featureQuickTitleEl.textContent = title;
    featureQuickSubtitleEl.textContent = normalizePtBrText(String(subtitle));
    featureQuickSubtitleEl.hidden = Boolean(minimal && !primaryName);

    let rows = pickQuickMenuRows(props, { minimal, selectionKind, maxRows: FEATURE_POPUP.hover.maxRows });
    if (minimal && primaryName) {
      const primaryNorm = normalizeSearchText(primaryName);
      rows = rows.filter((row) => normalizeSearchText(row.value) !== primaryNorm);
      if (rows.length > FEATURE_POPUP.hover.maxRows) rows = rows.slice(0, FEATURE_POPUP.hover.maxRows);
    }
    featureQuickBodyEl.innerHTML = buildQuickMenuRowsHtml(rows);
  }

  // Evita "sumir" quando o mouse encosta no próprio painel.
  try {
    featureQuickMenuEl?.addEventListener("mouseenter", cancelQuickMenuHide);
    featureQuickMenuEl?.addEventListener("mouseleave", () => {
      if (!state.featureQuickMenuPinned) scheduleQuickMenuHide(FEATURE_POPUP.hover.leaveDelayMs);
    });
    // Scroll dentro do popup não deve dar zoom no mapa.
    featureQuickMenuEl?.addEventListener(
      "wheel",
      (ev) => {
        ev.stopPropagation();
      },
      { passive: true }
    );
    // Touch/pointer: evita o mapa capturar o gesto de rolagem.
    featureQuickMenuEl?.addEventListener(
      "touchstart",
      (ev) => {
        ev.stopPropagation();
      },
      { passive: true }
    );
    featureQuickMenuEl?.addEventListener(
      "touchmove",
      (ev) => {
        ev.stopPropagation();
      },
      { passive: true }
    );
  } catch {
    // ignore
  }

  function setLayerIdentifyMeta(layer, feature, selectionKind) {
    if (!layer) return;
    layer.__infrageoFeature = feature;
    layer.__infrageoSelectionKind = selectionKind;
    bumpPathHitTolerance(layer);
  }

  function bumpPathHitTolerance(layer) {
    const tol = FEATURE_POPUP.hover.pathTolerancePx ?? 8;
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

  /** 0 = ponto (mais preciso), 1 = linha, 2 = polígono/área. */
  function getHitGeometryRank(layer, feature) {
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

  /** Distância em px do cursor à feição; Infinity se fora do hit. */
  function layerHitDistancePx(layer, latlng) {
    if (!state.map || !layer || !latlng) return Infinity;
    const hitPt = FEATURE_POPUP.hover.hitPointPx ?? 12;
    const hitLn = FEATURE_POPUP.hover.hitLinePx ?? 6;
    const hitPolyFill = FEATURE_POPUP.hover.hitPolygonFillPx ?? 18;
    try {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        const a = state.map.latLngToContainerPoint(latlng);
        const b = state.map.latLngToContainerPoint(layer.getLatLng());
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
        const p = state.map.latLngToLayerPoint(latlng);
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
        const p = state.map.latLngToLayerPoint(latlng);
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


  function bindLayerIdentifyClick(leafletLayer) {
    if (!leafletLayer || leafletLayer.__infrageoIdentifyClickBound) return;
    leafletLayer.__infrageoIdentifyClickBound = true;
    leafletLayer.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      // Reidentifica no ponto do clique: todas as camadas sob o cursor, com precisão.
      if (e?.latlng) {
        const hits = identifyLayersAtLatLng(e.latlng);
        if (hits.length) {
          const best = hits[0];
          handleMapFeatureClick(e, best.feature, best.layer, best.selectionKind, {
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
        handleMapFeatureClick(e, feature, leafletLayer, kind, { zoomTo: true });
        return;
      }
      handleIdentifyClick(e?.latlng, { zoomTo: true });
    });
  }

  function handleMapFeatureClick(e, feature, layer, selectionKind, options = {}) {
    const { zoomTo = true, identifyResults = null, activeIndex = 0 } = options;
    if (!state.map || !feature) return;

    cancelQuickMenuHide();
    // Clique já traz a feição: não varre o mapa inteiro (custo alto em polígonos/UC).
    const results =
      Array.isArray(identifyResults) && identifyResults.length
        ? identifyResults
        : [{ feature, layer, selectionKind, z: getLayerZIndexHint(layer), geomRank: getHitGeometryRank(layer, feature), dist: 0 }];

    const safeIdx = Math.max(0, Math.min(Number(activeIndex) || 0, results.length - 1));
    state.identify.results = results;
    state.identify.activeIndex = safeIdx;

    const active = results[safeIdx] || { feature, layer, selectionKind };
    selectFeature(active.feature || feature, active.layer || layer, {
      zoomTo: false,
      selectionKind: active.selectionKind || selectionKind,
      showQuickMenu: false,
    });

    try {
      state.map.closePopup?.();
    } catch {
      // noop
    }

    try {
      hideMapCoordsControl();
    } catch {
      // ignore
    }

    // Clique no SHP: seleciona a feição e abre menu com checkboxes das camadas no ponto.
    try {
      pinFeatureQuickMenu(
        active.feature || feature,
        active.selectionKind || selectionKind,
        e,
        results,
        active.layer || layer,
      );
    } catch {
      // ignore
    }

    // Clique: tabela completa (todos os atributos) na barra inferior; hover usa o popup mínimo.
    void openAttributesTableFromMapClick(
      active.selectionKind || selectionKind,
      active.feature || feature,
      active.layer || layer,
      { zoomTo },
    );
  }

  const TABLE_LAYER_IDS = new Set([
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

  function tableLayerIdFromKind(kind) {
    const k = String(kind || "");
    if (!k || k === "limite-estadual") return "";
    if (k.startsWith("br-am:")) return k;
    if (TABLE_LAYER_IDS.has(k)) return k;
    return "";
  }

  function isFeatureQuickMenuVisible() {
    return Boolean(featureQuickMenuEl?.classList.contains("is-visible"));
  }

  /** Se a barra de tabela já estiver aberta, troca para a tabela da camada recém-ligada. */
  function maybeOpenAttributesTableWhenLayerEnabled(kind) {
    if (state.suppressAutoOpenTableOnLayerToggle) return;
    if (state.menuToggleLayersBusy) return;
    // Legenda aberta: só liga a camada no mapa, sem abrir painéis/tabelas.
    if (isMapLegendOpen()) return;
    if (!isBottomSheetVisible()) return;
    const layerId = tableLayerIdFromKind(kind);
    if (!layerId) return;
    if (String(state.tableDataset || "") === layerId) return;
    void openAttributesTableForLayer(layerId);
  }

  /** ESC / fechar: table + popup. */
  function dismissTablesAndPopups() {
    let closed = false;
    try {
      if (isFeatureQuickMenuVisible() || state.featureQuickMenuPinned) {
        hideFeatureQuickMenu(true);
        closed = true;
      }
    } catch {
      // ignore
    }
    try {
      if (isBottomSheetVisible()) {
        closeBottomSheet();
        closed = true;
      }
    } catch {
      // ignore
    }
    return closed;
  }

  function attachQuickHover(layer, feature, selectionKind) {
    if (!layer || !feature) return;
    if (layer.__infrageoQuickHoverBound) {
      layer.__infrageoFeature = feature;
      layer.__infrageoSelectionKind = selectionKind;
      return;
    }
    layer.__infrageoQuickHoverBound = true;
    bumpPathHitTolerance(layer);
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
        const hits = e?.latlng ? identifyLayersAtLatLng(e.latlng) : [];
        if (hits.length) {
          f = hits[0].feature || f;
          kind = hits[0].selectionKind || kind;
          targetLayer = hits[0].layer || layer;
          // Guarda hits para o clique/pin poder listar todas as camadas.
          state.identify.results = hits;
          state.identify.activeIndex = 0;
        }
      } catch {
        // ignore
      }
      showFeatureQuickMenuOnHover(f, kind, e, targetLayer);
    });
    layer.on("mouseout", (e) => {
      if (state.featureQuickMenuPinned) return;
      const related = e?.originalEvent?.relatedTarget;
      if (related && featureQuickMenuEl?.contains(related)) return;
      scheduleQuickMenuHide(FEATURE_POPUP.hover.hideDelayMs);
    });
  }

  function getLayerZIndexHint(layer) {
    try {
      const paneName = layer?.options?.pane;
      if (!paneName || !state.map) return 0;
      const paneEl = state.map.getPane?.(paneName);
      const z = paneEl ? parseInt(window.getComputedStyle(paneEl).zIndex || "0", 10) : 0;
      return Number.isFinite(z) ? z : 0;
    } catch {
      return 0;
    }
  }

  function parseFeatureKmValue(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const s = String(value)
      .trim()
      .replace(/\s+/g, "")
      .replace(",", ".");
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : null;
  }

  /** Conta vértices da geometria (proxy leve de “tamanho” do trecho). */
  function countGeometryVertices(geometry) {
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

  /** ÁREA aproximada do bbox (graus²) a partir das coordenadas — sem criar layer Leaflet. */
  function roughGeometryBboxArea(geometry) {
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

  /**
   * Score menor = trecho mais específico.
   * Demove feições “BR inteira” (Km 0–0 / bbox statewide / muitos vértices)
   * que se sobrepõem aos trechos reais de km.
   */
  function featureStretchSpecificityScore(feature) {
    try {
      const props = feature?.properties || {};
      const km0 = parseFeatureKmValue(
        props.Km_inicial ?? props.km_inicial ?? props.KM_INICIAL ?? props.Km_Inicio
      );
      const km1 = parseFeatureKmValue(
        props.Km_final ?? props.km_final ?? props.KM_FINAL ?? props.Km_Fim
      );
      let kmSpan = Number.POSITIVE_INFINITY;
      if (km0 !== null && km1 !== null) {
        kmSpan = Math.abs(km1 - km0);
        // Km 0–0 (ou idêntico) costuma ser o traçado completo da BR.
        if (kmSpan < 1e-6) kmSpan = Number.POSITIVE_INFINITY;
      }

      const bboxArea = roughGeometryBboxArea(feature?.geometry);
      const verts = countGeometryVertices(feature?.geometry);
      const kmPart = Number.isFinite(kmSpan) ? kmSpan : 1e5;
      const areaPart = Number.isFinite(bboxArea) ? bboxArea * 2e4 : 1e5;
      const vertPart = Math.min(verts, 80000) * 0.002;
      return kmPart + areaPart + vertPart;
    } catch {
      return 1e12;
    }
  }

  function identifyLayersAtLatLng(latlng) {
    if (!state.map) return [];
    const out = [];
    const layers = state.map._layers ? Object.values(state.map._layers) : [];
    for (const lyr of layers) {
      if (!lyr || !lyr._map) continue;
      if (lyr === state.highlightOverlayLayer) continue;
      const feature = lyr.__infrageoFeature;
      const kind = lyr.__infrageoSelectionKind;
      if (!feature || !kind) continue;
      const dist = layerHitDistancePx(lyr, latlng);
      if (!Number.isFinite(dist) || dist === Infinity) continue;
      out.push({
        feature,
        layer: lyr,
        selectionKind: kind,
        z: getLayerZIndexHint(lyr),
        dist,
        geomRank: getHitGeometryRank(lyr, feature),
        stretch: featureStretchSpecificityScore(feature),
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

  function uniqueIdentifyKinds(results) {
    const seen = new Set();
    const out = [];
    for (const r of results || []) {
      const k = String(r?.selectionKind || "");
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(k);
    }
    return out;
  }

  function buildIdentifyLayerPickerHtml(results, activeIndex = 0) {
    const kinds = uniqueIdentifyKinds(results);
    if (!kinds.length) return "";
    const activeKind = String(results?.[activeIndex]?.selectionKind || kinds[0] || "");
    const opts = kinds
      .map((k) => {
        const el = getToggleElForKind(k) || document.getElementById(toggleIdFromKind(k));
        const checked = el ? Boolean(el.checked) : true;
        const isActive = k === activeKind;
        const label = escHtmlCell(getSelectionKindLayerLabel(k));
        return `<label class="feature-quick-menu__layer-opt${isActive ? " is-active" : ""}">
          <input type="checkbox" data-layer-kind="${escHtmlCell(k)}" ${checked ? "checked" : ""} />
          <button type="button" class="feature-quick-menu__layer-pick" data-identify-kind="${escHtmlCell(k)}" aria-pressed="${isActive ? "true" : "false"}">
            <span class="feature-quick-menu__layer-pick-label">${label}</span>
            <span class="feature-quick-menu__layer-pick-hint">${isActive ? "selecionada" : "selecionar"}</span>
          </button>
        </label>`;
      })
      .join("");
    return `<div class="feature-quick-menu__layers" role="group" aria-label="Camadas neste ponto">
      <div class="feature-quick-menu__layers-title">Camadas neste ponto</div>
      <div class="feature-quick-menu__layers-list">${opts}</div>
      <div class="feature-quick-menu__layers-actions">
        <button type="button" class="btn btn--ghost feature-quick-menu__action" data-action="clear-selection">Limpar seleção</button>
        <button type="button" class="btn btn--ghost feature-quick-menu__action" data-action="deselect-hit-layers">Desmarcar estas</button>
      </div>
    </div>`;
  }

  function renderIdentifyQuickMenu(results, activeIndex = 0, options = {}) {
    if (!featureQuickMenuEl || !featureQuickTitleEl || !featureQuickSubtitleEl || !featureQuickBodyEl) return;
    const { minimal = false, showLayerPicker = false } = options;
    const safeIdx = Math.max(0, Math.min(activeIndex, (results?.length || 1) - 1));
    const active = results?.[safeIdx];
    if (!active?.feature) return;

    const kind = active.selectionKind || "segmentos";
    const props = active.feature?.properties || {};
    const preferred = getPreferredKeysByKind(kind) || [];
    const primaryName = normalizePtBrText(
      getFirstNonEmptyValue(props, [...preferred, ...FEATURE_POPUP.primaryNameKeys]),
    );
    const subtitle = primaryName || "Detalhes da feição";
    const uniqueKinds = uniqueIdentifyKinds(results);

    featureQuickTitleEl.textContent =
      uniqueKinds.length > 1
        ? `Camadas (${uniqueKinds.length})`
        : results.length > 1
          ? `Feições (${results.length})`
          : getSelectionKindLayerLabel(kind);
    featureQuickSubtitleEl.textContent = normalizePtBrText(
      results.length > 1 || uniqueKinds.length > 1
        ? `${getSelectionKindLayerLabel(kind)} — ${String(subtitle)}`
        : String(subtitle),
    );
    featureQuickSubtitleEl.hidden = Boolean(minimal && results.length <= 1 && uniqueKinds.length <= 1 && !primaryName);

    const chips =
      results.length > 1
        ? `<div class="feature-quick-menu__chips" role="listbox" aria-label="Feições neste ponto">
          ${results
            .map((r, i) => {
              const pressed = i === safeIdx ? ' aria-pressed="true"' : ' aria-pressed="false"';
              const label = escHtmlCell(getSelectionKindLayerLabel(r.selectionKind));
              const title = escapeHtml(
                `${getSelectionKindLayerLabel(r.selectionKind)}${
                  Number.isFinite(r.dist) ? ` · ${Math.round(r.dist)}px` : ""
                }`,
              );
              return `<button type="button" class="feature-quick-menu__chip" data-identify-idx="${i}" title="${title}"${pressed}>${label}</button>`;
            })
            .join("")}
        </div>`
        : "";

    const layerPicker = showLayerPicker || uniqueKinds.length > 0 ? buildIdentifyLayerPickerHtml(results, safeIdx) : "";

    let bodyRows = pickQuickMenuRows(props, {
      minimal,
      selectionKind: kind,
      maxRows: FEATURE_POPUP.hover.maxRows,
    });
    if (minimal && primaryName) {
      const primaryNorm = normalizeSearchText(primaryName);
      bodyRows = bodyRows.filter((row) => normalizeSearchText(row.value) !== primaryNorm);
      if (bodyRows.length > FEATURE_POPUP.hover.maxRows) {
        bodyRows = bodyRows.slice(0, FEATURE_POPUP.hover.maxRows);
      }
    }
    featureQuickBodyEl.innerHTML = layerPicker + chips + buildQuickMenuRowsHtml(bodyRows);
  }

  function resolveTableLayerId(selectionKind, feature) {
    const kind = String(selectionKind || "");
    if (!kind || kind === "limite-municipal") return null;
    if (kind.startsWith("br-am:")) return kind;
    if (feature?._brAmId) return brAmLayerKeyFromId(feature._brAmId);
    if (TABLE_LAYER_IDS.has(kind)) return kind;
    if (feature) return `map-click:${kind}`;
    return null;
  }

  function getLayerFeaturesArray(layerId) {
    const id = String(layerId || "");
    if (id === "segmentos") return state.allFeatures || [];
    if (id === "municipios") return state.municipiosFeatures || [];
    if (id === "bueiros") return state.bueirosFeatures || [];
    if (id === "bueiros-br174") return state.bueirosBr174Features || [];
    if (id === "bueiros-br230") return state.bueirosBr230Features || [];
    if (id === "bueiros-br319") return state.bueirosBr319Features || [];
    if (id === "pontes") return state.pontesFeatures || [];
    if (id === "jazidas") return state.jazidasFeatures || [];
    if (id === "prads-br174") return state.pradsBr174Features || [];
    if (id === "pca-prads-br319") return state.pcaPradsBr319Features || [];
    if (id === "prads-br319") return state.pradsBr319Features || [];
    if (id === "pca-prads-cmm-br319") return state.pcaPradsCmmBr319Features || [];
    if (id === "pontes-br319") return state.pontesBr319Features || [];
    if (id === "pontes-br230") return state.pontesBr230Features || [];
    if (id === "uc-estadual") return state.ucEstadualFeatures || [];
    if (id === "uc-municipal") return state.ucMunicipalFeatures || [];
    if (id === "ti-am") return state.tiAmFeatures || [];
    if (id === "hidrovias-am") return state.hidroviasAmFeatures || [];
    if (id === "ip4") return state.ip4Features || [];
    if (id.startsWith("br-am:")) return state.brAmTables?.byKey?.[id]?.features || [];
    if (id.startsWith("map-click:")) return state.mapClickTables?.[id]?.features || [];
    return [];
  }

  const LAYER_INDEX_FIELDS = {
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

  function matchFeatureIndex(features, feature, indexField) {
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

  function ensureMapClickTableLayer(selectionKind, feature, options = {}) {
    if (!feature) return null;
    const replace = Boolean(options?.replace);
    const kind = String(selectionKind || "shapefile");
    const layerId = `map-click:${kind}`;
    if (!state.mapClickTables) state.mapClickTables = {};
    if (!state.mapClickTables[layerId]) {
      state.mapClickTables[layerId] = {
        selectionKind: kind,
        features: [],
        selectedIndex: null,
        columnKeys: [],
        table: { sortKey: null, sortDir: "asc", filterText: "", columnFilters: {} },
      };
    }
    const entry = state.mapClickTables[layerId];

    if (replace) {
      const cloned = { ...feature, _mapClickIndex: 0 };
      entry.features = [cloned];
      entry.selectedIndex = 0;
      entry.columnKeys = collectColumnKeysFromFeatures([cloned]);
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
        entry.columnKeys = collectColumnKeysFromFeatures([cloned]);
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

  function rerenderTableForLayerId(layerId) {
    if (!layerId) return;
    if (layerId === "municipios") {
      renderMunicipiosAttributesTable(state.municipiosSelectedIndex);
    } else if (layerId === "bueiros") {
      renderBueirosAttributesTable(state.bueirosSelectedIndex);
    } else if (layerId === "bueiros-br174") {
      renderBueirosBr174AttributesTable(state.bueirosBr174SelectedIndex);
    } else if (layerId === "bueiros-br319") {
      renderBueirosBr319AttributesTable(state.bueirosBr319SelectedIndex);
    } else if (layerId === "bueiros-br230") {
      renderBueirosBr230AttributesTable(state.bueirosBr230SelectedIndex);
    } else if (layerId === "pontes") {
      renderPontesAttributesTable(state.pontesSelectedIndex);
    } else if (layerId === "jazidas") {
      renderJazidasAttributesTable(state.jazidasSelectedIndex);
    } else if (layerId === "prads-br174") {
      renderPradsBr174AttributesTable(state.pradsBr174SelectedIndex);
    } else if (layerId === "pca-prads-br319") {
      renderPcaPradsBr319AttributesTable(state.pcaPradsBr319SelectedIndex);
    } else if (layerId === "prads-br319") {
      renderPradsBr319AttributesTable(state.pradsBr319SelectedIndex);
    } else if (layerId === "pca-prads-cmm-br319") {
      renderPcaPradsCmmBr319AttributesTable(state.pcaPradsCmmBr319SelectedIndex);
    } else if (layerId === "pontes-br319") {
      renderPontesBr319AttributesTable(state.pontesBr319SelectedIndex);
    } else if (layerId === "pontes-br230") {
      renderPontesBr230AttributesTable(state.pontesBr230SelectedIndex);
    } else if (layerId === "uc-estadual") {
      renderUcEstadualAttributesTable(state.ucEstadualSelectedIndex);
    } else if (layerId === "uc-municipal") {
      renderUcMunicipalAttributesTable(state.ucMunicipalSelectedIndex);
    } else if (layerId === "hidrovias-am") {
      renderHidroviasAmAttributesTable(state.hidroviasAmSelectedIndex);
    } else if (layerId === "ip4") {
      renderIp4AttributesTable(state.ip4SelectedIndex);
    } else if (layerId === "ti-am") {
      renderTiAmAttributesTable(state.tiAmSelectedIndex);
    } else if (String(layerId).startsWith("br-am:")) {
      const key = String(layerId);
      const entry = state.brAmTables?.byKey?.[key];
      renderBrAmAttributesTable(key, entry?.selectedIndex ?? null);
    } else if (String(layerId).startsWith("map-click:")) {
      renderMapClickAttributesTable(layerId, state.mapClickTables?.[layerId]?.selectedIndex ?? null);
    } else {
      renderAllAttributesTable();
      if (state.selectedFeatureIndex !== null) {
        highlightRowForFeature(state.allFeatures[state.selectedFeatureIndex]);
      }
    }
  }

  function applyTableSelectionFromFeature(layerId, feature) {
    if (!feature || !layerId) return;
    const n = (v) => (typeof v === "number" && !Number.isNaN(v) ? v : null);

    if (String(layerId).startsWith("br-am:")) {
      const key = String(layerId);
      if (!state.brAmTables) state.brAmTables = { byKey: {} };
      if (!state.brAmTables.byKey) state.brAmTables.byKey = {};
      if (!state.brAmTables.byKey[key]) {
        const id = brAmIdFromLayerKey(key);
        state.brAmTables.byKey[key] = {
          id,
          name: getBrAmNameById(id),
          features: [],
          layersByIndex: {},
          selectedIndex: null,
          columnKeys: [],
          table: { sortKey: null, sortDir: "asc", filterText: "" },
        };
      }
      state.brAmTables.byKey[key].selectedIndex = n(feature._brAmIndex);
      return;
    }

    const indexField = LAYER_INDEX_FIELDS[layerId] || (String(layerId).startsWith("map-click:") ? "_mapClickIndex" : null);
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
      const feats = getLayerFeaturesArray(layerId);
      const matched = matchFeatureIndex(feats, feature, indexField);
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
      const entry = state.mapClickTables?.[layerId];
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

    if (stateKey) state[stateKey] = idx;
  }

  function scrollToSelectedTableRow() {
    const row = document.querySelector("#all-attributes tr.selected-row");
    row?.scrollIntoView({ block: "nearest" });
  }

  async function openAttributesTableFromMapClick(selectionKind, feature, layer, options = {}) {
    const { zoomTo = true } = options;
    hideFeatureQuickMenu(true);
    state.tablePinnedFromMap = true;
    resetPeekSelectionSummary();

    // Tabela focada na feição clicada (todos os atributos), ainda minimalista.
    let layerId = ensureMapClickTableLayer(selectionKind, feature, { replace: true });
    if (!layerId) {
      layerId = resolveTableLayerId(selectionKind, feature);
      if (layerId && TABLE_LAYER_IDS.has(String(layerId)) && !getLayerFeaturesArray(layerId).length) {
        await openAttributesTableForLayer(layerId, { fromMapClick: true });
      }
      if (layerId && TABLE_LAYER_IDS.has(String(layerId)) && feature) {
        applyTableSelectionFromFeature(layerId, feature);
      } else if (!layerId) {
        return;
      }
    }

    state.lastMapClickLayerId = layerId;
    applyTableSelectionFromFeature(layerId, feature);
    state.tableDataset = layerId;
    openBottomSheet();
    expandBottomSheet();
    refreshPanelTableTitle();
    syncGeneralFilterPlaceholder();
    syncGeneralFilterValue();
    syncPeekSelectionSummary(feature, selectionKind);

    try {
      await openAttributesTableForLayer(layerId, { fromMapClick: true });
      applyTableSelectionFromFeature(layerId, feature);
      rerenderTableForLayerId(layerId);
      expandBottomSheet();
      scrollToSelectedTableRow();
    } catch {
      // ignore
    }

    if (zoomTo) {
      if (layer?.getBounds) {
        applySelectionZoomIfNeeded(layer, selectionKind, true, true);
      } else if (feature) {
        zoomToFeatureNow(feature, layer, selectionKind, true);
      }
    }
  }

  function handleIdentifyClick(latlng, options = {}) {
    const { zoomTo = true } = options;
    if (!state.map) return;

    let results = identifyLayersAtLatLng(latlng);
    if (!results.length) {
      state.identify.results = [];
      state.identify.activeIndex = 0;
      state.bueirosTableHoverPinned = false;
      try {
        clearCurrentSelection();
      } catch {
        // ignore
      }
      hideFeatureQuickMenu(true);
      try {
        hideMapCoordsControl();
      } catch {
        // ignore
      }
      try {
        state.map.closePopup?.();
      } catch {
        // noop
      }
      return;
    }

    state.identify.results = results;
    state.identify.activeIndex = 0;

    const first = results[0];
    handleMapFeatureClick(null, first.feature, first.layer, first.selectionKind, {
      zoomTo,
      identifyResults: results,
      activeIndex: 0,
    });
  }

  function formatCoordNumber(n, digits) {
    const d = typeof digits === "number" ? digits : 6;
    if (typeof n !== "number" || Number.isNaN(n) || !Number.isFinite(n)) return "-";
    return n.toFixed(d);
  }


  function hideMapCoordsControl() {
    if (!state.coordsControl) return;
    try {
      state.coordsControl.remove?.();
    } catch {
      // ignore
    }
    state.coordsControl = null;
    state.coordsControlEl = null;
  }

  function renderMapCoords() {
    if (!state.coordsControlEl) return;
    const layerLabel = state.coords?.selectedLayerLabel ? `Camada selecionada: ${state.coords.selectedLayerLabel}` : "Camada selecionada: —";
    state.coordsControlEl.textContent = layerLabel;
  }

  function isSatelliteBasemapActive() {
    const id = String(state.currentBasemapId || "");
    return id === "imagery" || id === "google-earth";
  }

  function getBasemapStyleMode() {
    const id = String(state.currentBasemapId || "");
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

  function getBasemapTuning() {
    const mode = getBasemapStyleMode();
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

  // Paleta antiga (igual ao padrão da imagem)

  function tunedLine(weight) {
    const t = getBasemapTuning();
    return { weight: Math.max(1.4, (weight || 2.4) + t.lineWeightDelta), opacity: t.lineOpacity };
  }

  function tunedFill(fillOpacity) {
    const t = getBasemapTuning();
    return { fillOpacity: Math.max(0.06, Math.min(0.6, (fillOpacity || 0.2) * t.fillOpacityScale)) };
  }

  function getBoundaryLayerStyle() {
    const mode = getBasemapStyleMode();
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
      color: isSatelliteBasemapActive() ? "#d1d5db" : "#111111",
      weight: 1,
      opacity: 0.65,
      fillOpacity: 0,
    };
  }

  function getLimiteMunicipalLayerStyle() {
    const mode = getBasemapStyleMode();
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

  function getSegmentLayerStyle(feature) {
    const color = getColorForFeature(feature);
    if (isSatelliteBasemapActive()) {
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

  /** Ícone minimalista: “boca” de bueiro (anel + abertura). */
  function createBueirosPointIcon(kind = "bueiros") {
    return createStandardPointIcon(kind || "bueiros");
  }

  function createPontesPointIcon(kind = "pontes") {
    return createStandardPointIcon(kind || "pontes");
  }

  function createJazidasPointIcon() {
    return createStandardPointIcon("jazidas");
  }

  function createIp4PointIcon() {
    return createStandardPointIcon("ip4");
  }

  function createPradsPointIcon(kind = "prads") {
    return createStandardPointIcon(kind || "prads");
  }
  function getBueirosLineStyle() {
    const mode = getBasemapStyleMode();
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
      const t = tunedLine(2.6);
      return { color: "rgba(71,85,105,.92)", weight: t.weight, opacity: t.opacity };
    }
    return { color: "#4e342e", weight: 3, opacity: 0.92 };
  }

  function getBueirosPolygonStyle() {
    const mode = getBasemapStyleMode();
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
      const t = tunedLine(1.7);
      const f = tunedFill(0.18);
      return { color: "rgba(71,85,105,.88)", weight: t.weight, fillColor: "rgba(71,85,105,.18)", fillOpacity: f.fillOpacity };
    }
    return {
      color: "#4e342e",
      weight: 2,
      fillColor: "#8d6e63",
      fillOpacity: 0.28,
    };
  }

  function getJazidasLineStyle() {
    const mode = getBasemapStyleMode();
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
      const t = tunedLine(2.6);
      return { color: "#ef6c00", weight: t.weight, opacity: t.opacity };
    }
    return { color: "#ef6c00", weight: 2.8, opacity: 0.92 };
  }

  function getJazidasPolygonStyle() {
    const mode = getBasemapStyleMode();
    if (mode === "imagery") {
      const c = "#ef6c00";
      return { color: c, weight: 2.2, fillColor: "rgba(239,108,0,.22)", fillOpacity: tunedFill(0.28).fillOpacity };
    }
    if (mode === "dark") {
      return { color: "rgba(251,191,36,.95)", weight: 1.7, fillColor: "rgba(251,191,36,.22)", fillOpacity: 0.14 };
    }
    if (mode === "gray") {
      return { color: "rgba(180,83,9,.92)", weight: 1.6, fillColor: "rgba(180,83,9,.18)", fillOpacity: 0.12 };
    }
    if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
      const t = tunedLine(1.7);
      const f = tunedFill(0.22);
      return { color: "#ef6c00", weight: t.weight, fillColor: "rgba(239,108,0,.18)", fillOpacity: f.fillOpacity };
    }
    return { color: "#ef6c00", weight: 1.8, fillColor: "rgba(239,108,0,.16)", fillOpacity: tunedFill(0.24).fillOpacity };
  }

  function getPontesLineStyle() {
    const mode = getBasemapStyleMode();
    if (mode === "imagery") {
      return { color: "#0d47a1", weight: 4.4, opacity: 0.98 };
    }
    if (mode === "dark") {
      const t = tunedLine(3.0);
      return { color: "rgba(147,197,253,.95)", weight: t.weight, opacity: t.opacity };
    }
    if (mode === "gray") {
      const t = tunedLine(3.0);
      return { color: "rgba(30,64,175,.90)", weight: t.weight, opacity: t.opacity };
    }
    if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
      const t = tunedLine(3.0);
      return { color: "#0d47a1", weight: t.weight, opacity: t.opacity };
    }
    return { color: "#0d47a1", weight: 4, opacity: 0.92 };
  }

  function getPontesPolygonStyle() {
    const mode = getBasemapStyleMode();
    if (mode === "imagery") {
      const c = "#0d47a1";
      return { color: c, weight: 2.2, fillColor: c, fillOpacity: tunedFill(0.20).fillOpacity };
    }
    if (mode === "dark") {
      const c = "rgba(147,197,253,.95)";
      const t = tunedLine(1.8);
      return { color: c, weight: t.weight, fillColor: c, fillOpacity: tunedFill(0.14).fillOpacity };
    }
    if (mode === "gray") {
      const c = "rgba(30,64,175,.90)";
      const t = tunedLine(1.7);
      return { color: c, weight: t.weight, fillColor: c, fillOpacity: tunedFill(0.12).fillOpacity };
    }
    if (mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
      const t = tunedLine(1.8);
      const f = tunedFill(0.18);
      const c = "#0d47a1";
      return { color: c, weight: t.weight, fillColor: c, fillOpacity: f.fillOpacity };
    }
    const c = "#0d47a1";
    return { color: c, weight: 2, fillColor: c, fillOpacity: tunedFill(0.16).fillOpacity };
  }

  function applyBueirosStyleToLayer(layer) {
    if (!layer?.feature) return;
    const kind = layer.__infrageoSelectionKind || "bueiros";
    const t = layer.feature?.geometry?.type;
    if (layer instanceof L.Marker) {
      layer.setIcon(createBueirosPointIcon(kind));
      return;
    }
    if (t === "LineString" || t === "MultiLineString") {
      layer.setStyle(getBueirosLineStyle());
      return;
    }
    if (t === "Polygon" || t === "MultiPolygon") {
      layer.setStyle(getBueirosPolygonStyle());
    }
  }

  function applyPontesStyleToLayer(layer) {
    if (!layer?.feature) return;
    const kind = layer.__infrageoSelectionKind || "pontes";
    const t = layer.feature?.geometry?.type;
    if (layer instanceof L.Marker) {
      layer.setIcon(createPontesPointIcon(kind));
      return;
    }
    if (t === "LineString" || t === "MultiLineString") {
      layer.setStyle(getPontesLineStyle());
      return;
    }
    if (t === "Polygon" || t === "MultiPolygon") {
      layer.setStyle(getPontesPolygonStyle());
    }
  }

  function applyJazidasStyleToLayer(layer) {
    if (!layer?.feature) return;
    const t = layer.feature?.geometry?.type;
    if (layer instanceof L.Marker) {
      layer.setIcon(createJazidasPointIcon());
      return;
    }
    if (t === "LineString" || t === "MultiLineString") {
      layer.setStyle(getJazidasLineStyle());
      return;
    }
    if (t === "Polygon" || t === "MultiPolygon") {
      layer.setStyle(getJazidasPolygonStyle());
    }
  }

  function applyIp4StyleToLayer(layer) {
    if (!layer?.feature) return;
    const t = layer.feature?.geometry?.type;
    const ip4Color = "#c97900";
    if (layer instanceof L.Marker) {
      layer.setIcon(createIp4PointIcon());
      return;
    }
    const tune = getBasemapTuning();
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
        fillOpacity: tunedFill(0.18).fillOpacity,
      });
    }
  }


  function createUcEstadualPointIcon() {
    return createStandardPointIcon("uc-estadual");
  }
  function getUcEstadualLineStyle() {
    const mode = getBasemapStyleMode();
    const c = "#457c78";
    if (mode === "imagery") return { color: c, weight: 3.2, opacity: 0.95 };
    if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
      const t = tunedLine(2.6);
      return { color: c, weight: t.weight, opacity: t.opacity };
    }
    return { color: c, weight: 2.8, opacity: 0.9 };
  }

  function getUcEstadualPolygonStyle() {
    const mode = getBasemapStyleMode();
    const c = "#457c78";
    if (mode === "imagery") return { color: c, weight: 2.0, fillColor: "rgba(200,232,216,.55)", fillOpacity: tunedFill(0.22).fillOpacity };
    if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
      const t = tunedLine(1.7);
      return { color: c, weight: t.weight, fillColor: "rgba(200,232,216,.42)", fillOpacity: tunedFill(0.16).fillOpacity };
    }
    return { color: c, weight: 1.6, fillColor: "rgba(200,232,216,.38)", fillOpacity: tunedFill(0.18).fillOpacity };
  }

  function applyUcEstadualStyleToLayer(layer) {
    if (!layer?.feature) return;
    const t = layer.feature?.geometry?.type;
    if (layer instanceof L.Marker) {
      layer.setIcon(createUcEstadualPointIcon());
      return;
    }
    if (t === "LineString" || t === "MultiLineString") {
      layer.setStyle(getUcEstadualLineStyle());
      return;
    }
    if (t === "Polygon" || t === "MultiPolygon") {
      layer.setStyle(getUcEstadualPolygonStyle());
    }
  }

  function createUcMunicipalPointIcon() {
    return createStandardPointIcon("uc-municipal");
  }
  function getUcMunicipalLineStyle() {
    const mode = getBasemapStyleMode();
    const c = getLegendAccentById("uc-municipal");
    if (mode === "imagery") return { color: c, weight: 3.1, opacity: 0.96 };
    if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
      const t = tunedLine(2.5);
      return { color: c, weight: t.weight, opacity: t.opacity };
    }
    return { color: c, weight: 2.7, opacity: 0.9 };
  }

  function getUcMunicipalPolygonStyle() {
    const mode = getBasemapStyleMode();
    const c = getLegendAccentById("uc-municipal");
    const fill = "rgba(187, 222, 251, .5)";
    if (mode === "imagery") return { color: c, weight: 1.9, fillColor: fill, fillOpacity: tunedFill(0.20).fillOpacity };
    if (mode === "dark" || mode === "gray" || mode === "osm" || mode === "streets" || mode === "topo" || mode === "terrain") {
      const t = tunedLine(1.6);
      return { color: c, weight: t.weight, fillColor: fill, fillOpacity: tunedFill(0.14).fillOpacity };
    }
    return { color: c, weight: 1.5, fillColor: fill, fillOpacity: tunedFill(0.16).fillOpacity };
  }

  function applyUcMunicipalStyleToLayer(layer) {
    if (!layer?.feature) return;
    const t = layer.feature?.geometry?.type;
    if (layer instanceof L.Marker) {
      layer.setIcon(createUcMunicipalPointIcon());
      return;
    }
    if (t === "LineString" || t === "MultiLineString") {
      layer.setStyle(getUcMunicipalLineStyle());
      return;
    }
    if (t === "Polygon" || t === "MultiPolygon") {
      layer.setStyle(getUcMunicipalPolygonStyle());
    }
  }

  function refreshLayerStylesForBasemap() {
    if (state.geojsonLayer?.setStyle) {
      state.geojsonLayer.setStyle((feature) => getSegmentLayerStyle(feature));
    }
    if (state.boundaryLayer?.setStyle) {
      state.boundaryLayer.setStyle(getBoundaryLayerStyle());
    }
    if (state.boundaryMunicipalLayer?.setStyle) {
      state.boundaryMunicipalLayer.setStyle(getLimiteMunicipalLayerStyle());
    }
    state.bueirosLayer?.eachLayer((layer) => applyBueirosStyleToLayer(layer));
    state.bueirosBr319Layer?.eachLayer?.((layer) => applyBueirosStyleToLayer(layer));
    state.bueirosBr174Layer?.eachLayer?.((layer) => applyBueirosStyleToLayer(layer));
    state.bueirosBr230Layer?.eachLayer?.((layer) => applyBueirosStyleToLayer(layer));
    state.pontesBr307Layer?.eachLayer((layer) => applyPontesStyleToLayer(layer));
    state.jazidasBr307Layer?.eachLayer((layer) => applyJazidasStyleToLayer(layer));
    state.ucEstadualLayer?.eachLayer((layer) => applyUcEstadualStyleToLayer(layer));
    state.ucMunicipalLayer?.eachLayer((layer) => applyUcMunicipalStyleToLayer(layer));
    state.ip4Layer?.eachLayer?.((layer) => applyIp4StyleToLayer(layer));
    if (state.tiAmLayer?.setStyle) {
      state.tiAmLayer.setStyle((feature) => {
        const t = feature?.geometry?.type;
        const tune = getBasemapTuning();
        // TI AM: verde mais claro/azulado (referência) para diferenciar das UCs.
        const c = "#6ba09c";
        if (t === "LineString" || t === "MultiLineString") {
          const w = Math.max(1.4, 2.2 + tune.lineWeightDelta);
          return { color: c, weight: w, opacity: tune.lineOpacity };
        }
        if (t === "Polygon" || t === "MultiPolygon") {
          const w = Math.max(1.2, 2.0 + tune.lineWeightDelta);
          return { color: c, weight: w, opacity: tune.lineOpacity, fillColor: "#bcdae8", fillOpacity: tunedFill(0.16).fillOpacity };
        }
        return {};
      });
    }
    if (state.hidroviasAmLayer?.setStyle) {
      state.hidroviasAmLayer.setStyle((feature) => {
        const c = "#2862ab";
        const t = feature?.geometry?.type;
        if (t === "LineString" || t === "MultiLineString") {
          const tl = tunedLine(3.4);
          return { color: c, weight: tl.weight, opacity: tl.opacity };
        }
        if (t === "Polygon" || t === "MultiPolygon") {
          const tl = tunedLine(2.0);
          return { color: c, weight: tl.weight, opacity: tl.opacity, fillColor: c, fillOpacity: tunedFill(0.12).fillOpacity };
        }
        return {};
      });
    }
    if (state.pradsBr174Layer?.setStyle) state.pradsBr174Layer.setStyle(getPradsStyleByKind("prads-br174"));
    if (state.pcaPradsBr319Layer?.setStyle) state.pcaPradsBr319Layer.setStyle(getPradsStyleByKind("pca-prads-br319"));
    if (state.pradsBr319Layer?.setStyle) state.pradsBr319Layer.setStyle(getPradsStyleByKind("prads-br319"));
    if (state.pcaPradsCmmBr319Layer?.setStyle) state.pcaPradsCmmBr319Layer.setStyle(getPradsStyleByKind("pca-prads-cmm-br319"));
  }

  /** Remove a splash de carregamento após dados prontos ou erro (abertura / F5). */
  function hideAppLoadingSplash() {
    const el = loadingSplashEl;
    if (!el) return;
    el.setAttribute("aria-busy", "false");
    document.body.classList.remove("has-loading-splash");
    el.classList.add("app-loading-splash--hidden");
    el.style.display = "none";
  }

  /** Limite estadual: envia para trás do mapa base só se a camada estiver no mapa. */
  function bringLimiteEstadualToBackIfVisible() {
    if (!state.map || !state.boundaryLayer || !state.map.hasLayer(state.boundaryLayer)) return;
    if (state.boundaryLayer.bringToBack) state.boundaryLayer.bringToBack();
  }

  /** Limite municipal: mantém acima do limite estadual quando visível. */
  function bringLimiteMunicipalToFrontIfVisible() {
    if (!state.map) return;
    if (state.boundaryMunicipalHoverLayer && state.map.hasLayer(state.boundaryMunicipalHoverLayer)) {
      if (state.boundaryMunicipalHoverLayer.bringToFront) state.boundaryMunicipalHoverLayer.bringToFront();
    }
    if (state.boundaryMunicipalLayer && state.map.hasLayer(state.boundaryMunicipalLayer)) {
      if (state.boundaryMunicipalLayer.bringToFront) state.boundaryMunicipalLayer.bringToFront();
    }
  }

  /** Sincroniza visibilidade do SHP de limite com o switch da sidebar. */
  function applyLimiteEstadualVisibility() {
    if (!state.map || !state.boundaryLayer || !layerLimiteToggle) return;
    if (layerLimiteToggle.checked) {
      if (!state.map.hasLayer(state.boundaryLayer)) state.boundaryLayer.addTo(state.map);
      bringLimiteEstadualToBackIfVisible();
    } else if (state.map.hasLayer(state.boundaryLayer)) {
      state.map.removeLayer(state.boundaryLayer);
    }
  }

  function applyLimiteMunicipalVisibility() {
    if (!state.map || !layerLimiteMunicipalToggle) return;
    const m = state.map;
    const removeMunicipal = () => {
      try {
        if (state.boundaryMunicipalLayer && m.hasLayer(state.boundaryMunicipalLayer)) {
          m.removeLayer(state.boundaryMunicipalLayer);
        }
      } catch {
        // ignore
      }
      try {
        if (state.boundaryMunicipalHoverLayer && m.hasLayer(state.boundaryMunicipalHoverLayer)) {
          m.removeLayer(state.boundaryMunicipalHoverLayer);
        }
      } catch {
        // ignore
      }
    };

    // Desligar todas / switch off: remove do mapa linha e hover.
    if (state.bulkLayersIntent === "off" || !layerLimiteMunicipalToggle.checked) {
      removeMunicipal();
      return;
    }

    // Switch ligado: mostra linhas + polígonos de hover.
    if (state.boundaryMunicipalHoverLayer && !m.hasLayer(state.boundaryMunicipalHoverLayer)) {
      state.boundaryMunicipalHoverLayer.addTo(m);
    }
    if (state.boundaryMunicipalLayer && !m.hasLayer(state.boundaryMunicipalLayer)) {
      state.boundaryMunicipalLayer.addTo(m);
    }
    bringLimiteEstadualToBackIfVisible();
    bringLimiteMunicipalToFrontIfVisible();
  }

  /**
   * Garante camada de limite estadual quando ela não veio em /layers (ex.: lista vazia, fallback /data).
   */
  async function attachLimiteEstadualLayerIfNeeded() {
    if (state.boundaryLayer || !state.map) return;
    ensureInfraGeoPanes();
    let data;
    try {
      data = await fetchLayerGeoJson("/layers/limite-estadual");
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
    state.boundaryLayer = L.geoJSON(data, {
      pane: state.panes?.boundary,
      style: () => getBoundaryLayerStyle(),
    });
  }

  async function attachLimiteMunicipalLayerIfNeeded() {
    if (state.boundaryMunicipalLayer && state.boundaryMunicipalHoverLayer) return;
    if (!state.map) return;
    // Evita corrida: se já estiver carregando, espera o mesmo Promise.
    if (state.boundaryMunicipalLoadPromise) return state.boundaryMunicipalLoadPromise;
    ensureInfraGeoPanes();
    state.boundaryMunicipalLoading = true;
    state.boundaryMunicipalLoadPromise = (async () => {
      try {
        // 1) Camada visual: linhas (como já existia)
        if (!state.boundaryMunicipalLayer) {
          let __layerData = null;
          try {
            __layerData = await fetchLayerGeoJson("/layers/limite-municipal");
          } catch {
            // ignore
          }
          if (__layerData) {
            const data = __layerData;
            state.boundaryMunicipalLayer = L.geoJSON(data, {
              pane: state.panes?.lines,
              style: () => getLimiteMunicipalLayerStyle(),
            });
          }
        }

        // 2) Camada de hover: polígonos com atributos (transparente, mas interativa)
        if (!state.boundaryMunicipalHoverLayer) {
          const rpData = await fetchLayerGeoJson("/layers/limite-municipal/polygons").catch(() => null);
          if (rpData) {
            const poly = rpData;
            let mIdx = 0;
            state.municipiosFeatures = [];
            state.municipiosLayersByIndex = {};
            state.boundaryMunicipalHoverLayer = L.geoJSON(poly, {
              pane: state.panes?.polygons,
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
                state.municipiosFeatures[idx] = feature;
                state.municipiosLayersByIndex[idx] = layer;
                setLayerIdentifyMeta(layer, feature, "municipios");
                bindLayerIdentifyClick(layer);
                const name = getMunicipioNomeFromProps(feature?.properties);
                if (!name) return;
                // Municípios: pill minimalista (única exceção visual ao card IP4).
                bindMunicipioHoverPill(layer, name);
              },
            });
          }
        }
      } catch {
        // ignore (handled by availability fetch)
      } finally {
        state.boundaryMunicipalLoading = false;
        state.boundaryMunicipalLoadPromise = null;
      }
    })();
    return state.boundaryMunicipalLoadPromise;
  }

  /** Segmentos + Bueiros + Pontes ligados (ignora toggles ausentes/desabilitados). */
  function allRodoviasSublayersChecked() {
    const toggles = [
      layerSegmentosToggle,
      layerBueirosToggle,
      layerPontesToggle,
      layerJazidasToggle,
      layerBueirosBr174Toggle,
      layerPradsBr174Toggle,
      layerPcaPradsBr319Toggle,
      layerPradsBr319Toggle,
      layerPcaPradsCmmBr319Toggle,
    ].filter((t) => t && !t.disabled);
    if (!toggles.length) return false;
    return toggles.every((t) => Boolean(t.checked));
  }

  /** Enquadra no shapefile de limite estadual, sem animação. */
  function fitMapToStateBoundaryNow() {
    if (!state.map) return;
    const bb = state.boundaryLayer?.getBounds?.();
    if (!bb?.isValid?.()) return;
    state.map.fitBounds(bb, { animate: false, duration: 0, padding: [24, 24] });
    bringLimiteEstadualToBackIfVisible();
  }

  function escapeHtml(text) {
    return normalizePtBrText(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeContractValue(v) {
    return (v ?? "").toString().trim();
  }

  function normalizeContractKey(v) {
    // Chave canônica para comparar contratos:
    // - sem case sensitive
    // - sem acentos
    // - sem caracteres especiais
    return normalizeSearchText(normalizeContractValue(v));
  }

  function normalizeContractLayerDedupeKey(label) {
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

  function looksLikeKnownDedicatedLayer(label) {
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

  /** Colunas de contrato aceitas nos GeoJSON (case-insensitive). */
  const CONTRACT_ATTR_KEYS = new Set(["contrato", "contratos"]);

  function isContratoColumnKey(key) {
    const k = String(key || "").trim().toLowerCase();
    // Aceita contrato/contratos. Exclui "contratada" (empresa).
    return CONTRACT_ATTR_KEYS.has(k);
  }

  function contractKeyCandidates(props) {
    if (!props || typeof props !== "object") return [];
    const out = [];
    for (const k of Object.keys(props)) {
      if (isContratoColumnKey(k)) out.push(k);
    }
    return out;
  }

  function looksLikeContractValue(raw) {
    // Requisito: não forçar heurísticas/regex para "validar" contratos.
    // Basta existir texto não vazio.
    const s = normalizeContractValue(raw);
    return Boolean(s && normalizeSearchText(s));
  }

  function isIp4Feature(feature) {
    try {
      if (typeof feature?._ip4Index === "number") return true;
    } catch {
      // ignore
    }
    const src = String(feature?.properties?.__source || feature?.properties?._source || "");
    return /ip4/i.test(src);
  }

  function ip4SourceMatchesFocus(feature) {
    const wanted = normalizeSearchText(state.ip4FocusSource || "");
    if (!wanted) return true;
    const src = String(feature?.properties?.__source || feature?.properties?._source || "");
    if (!src) return true;
    return normalizeSearchText(src) === wanted;
  }

  function parseContractValues(raw) {
    const s = normalizeContractValue(raw);
    if (!s) return [];
    // Suporta múltiplos contratos no mesmo campo
    // Ex.: "SR-168-2020; SR-595/20" | "SR-168-2020,SR-595/20" | "SR-168-2020 | SR-595/20"
    return s
      .split(/[;,|\n]/g)
      .map((x) => normalizeContractValue(x))
      .filter(Boolean);
  }

  function contractEquals(a, b) {
    const aa = normalizeContractKey(a);
    const bb = normalizeContractKey(b);
    if (!aa || !bb) return false;
    return aa === bb;
  }

  function getFeatureContracts(feature) {
    const props = feature?.properties;
    const out = [];
    const seen = new Set();

    // Colunas contrato/contratos (qualquer capitalização) nos GeoJSON.
    const candidates = contractKeyCandidates(props);
    for (const k of candidates) {
      const vals = parseContractValues(props?.[k]);
      for (const v of vals) {
        if (!looksLikeContractValue(v)) continue;
        const key = normalizeContractKey(v);
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(normalizeContractValue(v));
      }
    }
    return out;
  }

  function featureMatchesContract(feature) {
    const wanted = normalizeContractKey(state.contractFilter);
    if (!wanted) return true;
    const vals = getFeatureContracts(feature);
    if (!vals.length) return false;
    return vals.some((v) => normalizeContractKey(v) === wanted);
  }

  function featureHasContractColumn(feature) {
    const props = feature?.properties;
    return contractKeyCandidates(props).length > 0;
  }

  function setLeafletLayerFilteredVisibility(leafletLayer, visible) {
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

  function pointAsCircleMarker(latlng) {
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

  function applyContractFilterToLeafletGroup(groupLayer) {
    if (!groupLayer?.eachLayer) return;
    const hasContract = Boolean(normalizeContractKey(state.contractFilter));
    const hasMun = Boolean(normalizeSearchText(state.municipioFilter || ""));
    groupLayer.eachLayer((leafletLayer) => {
      const f = leafletLayer?.feature;
      if (!f) {
        setLeafletLayerFilteredVisibility(leafletLayer, true);
        return;
      }
      let ok = true;
      if (hasContract) {
        // Camadas sem coluna "contratos": não entram no filtro de contrato
        if (featureHasContractColumn(f)) ok = ok && featureMatchesContract(f);
      }
      if (hasMun) {
        ok = ok && featureMatchesMunicipio(f);
      }
      if (ok && isIp4Feature(f)) ok = ip4SourceMatchesFocus(f);
      setLeafletLayerFilteredVisibility(leafletLayer, ok);
    });
  }

  function applyContractFilterToMap() {
    // Aplica somente nas camadas existentes/ligadas
    const layers = [
      state.geojsonLayer,
      state.bueirosLayer,
      state.pontesBr307Layer,
      state.jazidasBr307Layer,
      state.pontesBr319Layer,
      state.pontesBr230Layer,
      state.bueirosBr174Layer,
      state.bueirosBr230Layer,
      state.bueirosBr319Layer,
      state.pradsBr174Layer,
      state.pcaPradsBr319Layer,
      state.pradsBr319Layer,
      state.ucEstadualLayer,
      state.pcaPradsCmmBr319Layer,
      state.ucMunicipalLayer,
      state.tiAmLayer,
      state.hidroviasAmLayer,
      state.ip4Layer,
    ];
    for (const l of layers) applyContractFilterToLeafletGroup(l);
    try {
      const brAmLayers = state.brAm?.layersById ? Object.values(state.brAm.layersById) : [];
      for (const l of brAmLayers) applyContractFilterToLeafletGroup(l);
    } catch {
      // ignore
    }

    // Aplica também nas camadas descobertas (extraContractSources) que já foram adicionadas ao mapa.
    for (const src of state.extraContractSources || []) {
      if (src?.layer) applyContractFilterToLeafletGroup(src.layer);
    }
  }

  function ensureLayerVisibleOnMap(layerObj, { force = false } = {}) {
    if (!state.map || !layerObj) return;
    // Limite Estadual sempre pode ser (re)montado, inclusive no "desligar todas".
    if (layerObj === state.boundaryLayer) {
      try {
        if (!state.map.hasLayer(layerObj)) layerObj.addTo(state.map);
      } catch {
        // noop
      }
      return;
    }
    if (!force && state.bulkLayersIntent === "off") return;
    try {
      if (!state.map.hasLayer(layerObj)) layerObj.addTo(state.map);
    } catch {
      // noop
    }
  }

  function toggleForDataLayer(layer) {
    if (!layer) return null;
    if (layer === state.geojsonLayer) return layerSegmentosToggle;
    if (layer === state.bueirosLayer) return layerBueirosToggle;
    if (layer === state.pontesBr307Layer) return layerPontesToggle;
    if (layer === state.pontesBr319Layer) return layerPontesBr319Toggle;
    if (layer === state.pontesBr230Layer) return layerPontesBr230Toggle;
    if (layer === state.bueirosBr319Layer) return layerBueirosBr319Toggle;
    if (layer === state.jazidasBr307Layer) return layerJazidasToggle;
    if (layer === state.hidroviasAmLayer) return layerHidroviasAmToggle;
    if (layer === state.ucEstadualLayer) return layerUcEstadualToggle;
    if (layer === state.ucMunicipalLayer) return layerUcMunicipalToggle;
    if (layer === state.ip4Layer) return layerIp4Toggle;
    if (layer === state.tiAmLayer) return layerTiAmToggle;
    if (layer === state.bueirosBr174Layer) return layerBueirosBr174Toggle;
    if (layer === state.pradsBr174Layer) return layerPradsBr174Toggle;
    if (layer === state.pcaPradsBr319Layer) return layerPcaPradsBr319Toggle;
    if (layer === state.pradsBr319Layer) return layerPradsBr319Toggle;
    if (layer === state.pcaPradsCmmBr319Layer) return layerPcaPradsCmmBr319Toggle;
    if (layer === state.bueirosBr230Layer) return layerBueirosBr230Toggle;
    if (layer === state.boundaryMunicipalLayer || layer === state.boundaryMunicipalHoverLayer) {
      return layerLimiteMunicipalToggle;
    }
    return null;
  }

  /** Só adiciona no mapa se a camada ainda deve estar ligada (anti-race). */
  function mountDataLayerIfAllowed(layer, toggleEl = null) {
    if (!state.map || !layer) return false;
    // Limite Estadual: nunca bloqueado pelo "desligar todas".
    if (layer === state.boundaryLayer) {
      try {
        if (!state.map.hasLayer(layer)) layer.addTo(state.map);
        return true;
      } catch {
        return false;
      }
    }
    if (state.bulkLayersIntent === "off") return false;
    const toggle = toggleEl || toggleForDataLayer(layer);
    if (toggle && !toggle.checked) return false;
    try {
      if (!state.map.hasLayer(layer)) layer.addTo(state.map);
      return true;
    } catch {
      return false;
    }
  }

  function syncLayerRowsToggleUi() {
    document.querySelectorAll('.layer-row input[type="checkbox"][id^="layer-"]').forEach((inp) => {
      const row = inp.closest?.(".layer-row");
      if (!row) return;
      row.classList.toggle("is-on", Boolean(inp.checked));
      row.classList.toggle("is-off", !inp.checked);
      row.setAttribute("data-layer-on", inp.checked ? "1" : "0");
    });
    try {
      updateCamadasFootSummary();
    } catch {
      // ignore
    }
    try {
      if (!menuToggleLayersBtn) return;
      const txt = menuToggleLayersBtn.querySelector?.(".sidebar-action-text");
      if (!txt) return;
      txt.dataset.originalText = "Ligar/Desligar camadas";
      if (!state.menuToggleLayersBusy) {
        txt.textContent = "Ligar/Desligar camadas";
      }
      menuToggleLayersBtn.setAttribute(
        "title",
        allAvailableDataTogglesOff()
          ? "Ligar todas as camadas de dados"
          : "Desligar todas as camadas de dados (mantém o Limite Estadual)",
      );
    } catch {
      // ignore
    }
  }

  /** Fecha (recolhe) todos os grupos/ramos da lista Camadas. */
  function collapseAllCamadasGroups() {
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
        setBrAmGroupExpanded(false);
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }

  function bumpMapLayerEpoch(intent = null) {
    state.mapLayerEpoch = (state.mapLayerEpoch || 0) + 1;
    state.bulkLayersIntent = intent;
    return state.mapLayerEpoch;
  }

  /** Remove do mapa qualquer vetor que não seja basemap/limite estadual. */
  function purgeAllDataLayersFromMapSync({ keepLimiteEstadual = true } = {}) {
    if (!state.map) return;
    const m = state.map;
    const keep = new Set();
    const boundaryPaneId = state.panes?.boundary || "";
    try {
      if (state.base) keep.add(state.base);
      if (keepLimiteEstadual && state.boundaryLayer) keep.add(state.boundaryLayer);
    } catch {
      // ignore
    }

    const isBoundaryRelated = (lyr) => {
      if (!lyr || !keepLimiteEstadual) return false;
      // Nunca remover Limite Estadual (grupo ou filhos).
      if (lyr === state.boundaryLayer) return true;
      try {
        if (state.boundaryLayer?.hasLayer?.(lyr)) return true;
      } catch {
        // ignore
      }
      // Municipal nunca é protegido.
      if (lyr === state.boundaryMunicipalLayer || lyr === state.boundaryMunicipalHoverLayer) return false;
      // Qualquer vetor no pane de boundary (exceto municipal) = limite estadual.
      try {
        if (boundaryPaneId && lyr?.options?.pane === boundaryPaneId) return true;
      } catch {
        // ignore
      }
      return false;
    };

    // 1) Remoção explícita das layers conhecidas (rápido e previsível).
    for (const lyr of listDataLayersForBulkOff({ includeLimiteEstadual: !keepLimiteEstadual })) {
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
        if (lyr === state.base) return;
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
    if (keepLimiteEstadual && state.boundaryLayer) {
      try {
        if (!m.hasLayer(state.boundaryLayer)) state.boundaryLayer.addTo(m);
      } catch {
        // ignore
      }
    }
  }

  function buildExtraContractLayerOnMap(src) {
    if (!state.map || !src?.features?.length) return null;
    ensureInfraGeoPanes();
    if (src.layer) {
      ensureLayerVisibleOnMap(src.layer);
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
      pane: state.panes?.lines,
      interactive: true,
      style: () => ({ color: "#2862ab", weight: 2.2, opacity: 0.95, fillOpacity: 0.12 }),
      pointToLayer(_feature, latlng) {
        const m = pointAsCircleMarker(latlng);
        try {
          if (m?.options) m.options.pane = state.panes?.points;
        } catch {
          // noop
        }
        return m;
      },
      onEachFeature(feature, leafletLayer) {
        setLayerIdentifyMeta(leafletLayer, feature, inferredKind);
        attachQuickHover(leafletLayer, feature, inferredKind);
        bindLayerIdentifyClick(leafletLayer);
      },
    });
    src.layer = layer;
    layer.addTo(state.map);
    return layer;
  }

  async function ensureAllContractLayersOnMap() {
    const contract = normalizeContractValue(state.contractFilter);
    if (!contract) return;
    // Garante que camadas do contrato possam ser ligadas mesmo após bulk-off.
    if (state.bulkLayersIntent === "off") state.bulkLayersIntent = null;

    // Camadas "fixas": só liga se tiver registros para o contrato.
    const need = (label, feats, toggleEl, ensureFn, getLayerFn) => {
      const n = layerCountForContract(feats, contract);
      if (n <= 0) return Promise.resolve();
      if (toggleEl) toggleEl.checked = true;
      if (!ensureFn) return Promise.resolve();
      return Promise.resolve(ensureFn()).finally(() => {
        const lyr = getLayerFn?.();
        if (lyr) ensureLayerVisibleOnMap(lyr, { force: true });
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
      const n = layerCountForContract(src?.features || [], contract);
      if (n <= 0) continue;
      buildExtraContractLayerOnMap(src);
    }
  }

  function collectSortedContractValues() {
    const allSets = getContractLayerFeatureSets();
    const mergedByKey = new Map();
    for (const feats of allSets) {
      for (const f of feats || []) {
        for (const v of getFeatureContracts(f)) {
          const display = normalizeContractValue(v);
          const key = normalizeContractKey(display);
          if (!key) continue;
          if (!mergedByKey.has(key)) mergedByKey.set(key, display);
        }
      }
    }
    const sorted = Array.from(mergedByKey.values());
    sorted.sort((a, b) => normalizeContractKey(a).localeCompare(normalizeContractKey(b), "pt-BR"));
    return { mergedByKey, sorted };
  }

  function refreshContractOptions() {
    if (!menuContractSelect) return;
    const { mergedByKey, sorted } = collectSortedContractValues();

    // Prefere o valor atual do select; se estiver vazio, preserva state.contractFilter.
    const prev = normalizeContractValue(menuContractSelect.value || state.contractFilter);

    menuContractSelect.innerHTML = [
      `<option value="">Todos</option>`,
      ...sorted.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`),
    ].join("");

    const prevKey = normalizeContractKey(prev);
    if (prevKey && mergedByKey.has(prevKey)) {
      menuContractSelect.value = mergedByKey.get(prevKey) || prev;
      state.contractFilter = normalizeContractValue(menuContractSelect.value);
    } else if (prevKey && !state.contractSourcesLoaded) {
      // Ainda carregando: não apaga o filtro escolhido pelo usuário.
      menuContractSelect.value = prev;
    } else if (!prevKey) {
      menuContractSelect.value = "";
    } else {
      // Lista final não contém o valor — volta para Todos sem perder UI de sync.
      menuContractSelect.value = "";
      state.contractFilter = "";
    }

    try {
      renderGlobalSearchContractsPanel();
    } catch {
      // ignore
    }
  }

  function selectContractFilterValue(rawValue) {
    const display = normalizeContractValue(rawValue);
    state.contractFilter = display;
    state.contractFocusLayerLabel = "";
    try {
      if (normalizeContractKey(display)) {
        state.globalSearch.enabledKinds.add("contratos");
      } else {
        state.globalSearch.enabledKinds.delete("contratos");
      }
    } catch {
      // ignore
    }
    if (menuContractSelect) {
      const wantKey = normalizeContractKey(display);
      let matched = false;
      for (const opt of Array.from(menuContractSelect.options || [])) {
        const ov = String(opt.value || "");
        if (ov === display || normalizeContractKey(ov) === wantKey) {
          menuContractSelect.value = ov;
          matched = true;
          break;
        }
      }
      if (!matched) {
        if (display) {
          const opt = document.createElement("option");
          opt.value = display;
          opt.textContent = display;
          menuContractSelect.appendChild(opt);
        }
        menuContractSelect.value = display;
      }
    }
    try {
      renderGlobalSearchContractsPanel();
    } catch {
      // ignore
    }
    void applyContractFilterAndShowResults();
  }

  function getMunicipioNomeFromPropsFast(props) {
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
      const s = normalizePtBrText(p[k]).trim();
      if (!s || /^\d+$/.test(s) || !/[A-Za-zÀ-ÿ]/.test(s) || s.length > 80) continue;
      return s;
    }
    return "";
  }

  /** IP4: município vem da coluna Nome/NOME. */
  function getIp4MunicipioNome(feature) {
    const p = feature?.properties || {};
    for (const k of ["Nome", "NOME", "nome"]) {
      if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
      const s = normalizePtBrText(p[k]).trim();
      if (s) return s;
    }
    return "";
  }

  function municipioNameMatchesWanted(featureName, wantedRaw) {
    const a = normalizeSearchText(featureName || "");
    const b = normalizeSearchText(wantedRaw || "");
    if (!a || !b) return false;
    if (a === b) return true;
    // Ex.: "Urucará" ↔ "Urucará"; "Manaus (São Raimundo)" ↔ "Manaus"
    if (a.startsWith(b + " ") || a.startsWith(b + "(") || a.startsWith(b + " (")) return true;
    return false;
  }

  /** Lista leve de nomes a partir do Limite Municipal (não monta camada Leaflet). */
  async function ensureMunicipiosFilterListLoaded() {
    if (state.municipioFilterListLoaded) return state.municipioFilterOptions;
    if (state.municipioFilterListPromise) return state.municipioFilterListPromise;

    state.municipioFilterListPromise = (async () => {
      try {
        let feats = (state.municipiosFeatures || []).filter(Boolean);
        if (!feats.length) {
          // Cede um frame para a UI pintar o painel ("Carregando…") antes do fetch/parse.
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
          const rpData = await fetchLayerGeoJson("/layers/limite-municipal/polygons").catch(() => null);
          feats = Array.isArray(rpData?.features) ? rpData.features : [];
          if (feats.length && !(state.municipiosFeatures || []).length) {
            state.municipiosFeatures = feats.map((f, i) => {
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
            getMunicipioNomeFromPropsFast(f?.properties) || getMunicipioNomeFromProps(f?.properties);
          const key = normalizeSearchText(display);
          if (!key) continue;
          if (!mergedByKey.has(key)) mergedByKey.set(key, display);
        }
        const sorted = Array.from(mergedByKey.values());
        sorted.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
        state.municipioFilterOptions = sorted;
        state.municipioFilterListLoaded = true;
        return sorted;
      } catch {
        state.municipioFilterOptions = [];
        state.municipioFilterListLoaded = true;
        return [];
      } finally {
        state.municipioFilterListPromise = null;
      }
    })();

    return state.municipioFilterListPromise;
  }


  function collectSortedMunicipioValues() {
    if (state.municipioFilterOptions?.length) {
      const mergedByKey = new Map();
      for (const v of state.municipioFilterOptions) {
        const key = normalizeSearchText(v);
        if (key) mergedByKey.set(key, v);
      }
      return { mergedByKey, sorted: state.municipioFilterOptions.slice() };
    }
    const mergedByKey = new Map();
    for (const f of state.municipiosFeatures || []) {
      if (!f) continue;
      const display =
        getMunicipioNomeFromPropsFast(f?.properties) || getMunicipioNomeFromProps(f?.properties);
      const key = normalizeSearchText(display);
      if (!key) continue;
      if (!mergedByKey.has(key)) mergedByKey.set(key, display);
    }
    const sorted = Array.from(mergedByKey.values());
    sorted.sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
    return { mergedByKey, sorted };
  }

  function clearMunicipioFilterOnly(options = {}) {
    const keepKind = Boolean(options?.keepKind);
    const had = Boolean(normalizeSearchText(state.municipioFilter || ""));
    state.municipioFilter = "";
    state.municipioFilterBounds = null;
    state.municipioFocusLayerLabel = "";
    if (!keepKind) {
      try {
        state.globalSearch.enabledKinds.delete("municipios");
      } catch {
        // ignore
      }
    }
    try {
      if (municipioFilterPopup) {
        municipioFilterPopup.hidden = true;
        municipioFilterPopup.innerHTML = "";
      }
    } catch {
      // ignore
    }
    try {
      applyContractFilterToMap();
    } catch {
      // ignore
    }
    try {
      renderGlobalSearchMunicipiosPanel();
    } catch {
      // ignore
    }
    try {
      if (state.tableDataset === "municipios") {
        closeBottomSheet();
      } else if (state.tableDataset) {
        rerenderTableForLayerId(state.tableDataset);
      }
    } catch {
      // ignore
    }
    if (had) {
      try {
        setStatus("Município: filtro removido", "ok");
      } catch {
        // ignore
      }
    }
  }

  function getFeatureMunicipioName(feature) {
    if (typeof feature?._ip4Index === "number") {
      const ip4Nome = getIp4MunicipioNome(feature);
      if (ip4Nome) return ip4Nome;
    }
    const p = feature?.properties || {};
    return (
      getMunicipioNomeFromPropsFast(p) ||
      getMunicipioNomeFromProps(p) ||
      getFirstNonEmptyValue(p, [
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

  function getSelectedMunicipioBounds() {
    if (state.municipioFilterBounds?.isValid?.()) return state.municipioFilterBounds;
    const wanted = normalizeSearchText(state.municipioFilter || "");
    if (!wanted) return null;
    const feats = state.municipiosFeatures || [];
    let idx = feats.findIndex((f) => normalizeSearchText(getMunicipioNomeFromProps(f?.properties)) === wanted);
    if (idx < 0) {
      idx = feats.findIndex(
        (f) => normalizeSearchText(getMunicipioNomeFromPropsFast(f?.properties)) === wanted,
      );
    }
    if (idx < 0) return null;
    let b = null;
    try {
      b = state.municipiosLayersByIndex?.[idx]?.getBounds?.();
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
    if (b?.isValid?.()) state.municipioFilterBounds = b;
    return state.municipioFilterBounds;
  }

  function getFeatureLatLngApprox(feature) {
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

  function featureMatchesMunicipio(feature) {
    const wanted = normalizeSearchText(state.municipioFilter || "");
    if (!wanted) return true;
    // IP4: filtrar estritamente pela coluna Nome/NOME do município.
    if (typeof feature?._ip4Index === "number") {
      return municipioNameMatchesWanted(getIp4MunicipioNome(feature), state.municipioFilter);
    }
    const name = getFeatureMunicipioName(feature);
    if (name) return municipioNameMatchesWanted(name, state.municipioFilter);
    const munBounds = getSelectedMunicipioBounds();
    if (!munBounds?.isValid?.()) return false;
    const ll = getFeatureLatLngApprox(feature);
    if (ll) return munBounds.contains(ll);
    try {
      const fb = L.geoJSON(feature).getBounds?.();
      return Boolean(fb?.isValid?.() && (munBounds.intersects(fb) || munBounds.contains(fb.getCenter())));
    } catch {
      return false;
    }
  }

  function layerCountForMunicipio(features, municipio) {
    const wanted = normalizeSearchText(municipio || "");
    if (!wanted || !features?.length) return 0;
    let n = 0;
    for (const f of features) {
      const name =
        typeof f?._ip4Index === "number" ? getIp4MunicipioNome(f) : getFeatureMunicipioName(f);
      if (!name) continue;
      if (municipioNameMatchesWanted(name, municipio)) n++;
    }
    return n;
  }

  async function ensureAllMunicipioLayersOnMap() {
    const municipio = normalizePtBrText(state.municipioFilter || "").trim();
    const wanted = normalizeSearchText(municipio);
    if (!wanted) return;
    if (state.bulkLayersIntent === "off") state.bulkLayersIntent = null;

    const need = (feats, toggleEl, ensureFn, getLayerFn) => {
      const n = layerCountForMunicipio(feats, municipio);
      if (n <= 0) return Promise.resolve();
      if (toggleEl) toggleEl.checked = true;
      if (!ensureFn) return Promise.resolve();
      return Promise.resolve(ensureFn()).finally(() => {
        const lyr = getLayerFn?.();
        if (lyr) ensureLayerVisibleOnMap(lyr, { force: true });
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

  function fitMapToMunicipioInLayerGroup(groupLayer) {
    if (!state.map || !groupLayer?.eachLayer) return;
    let bounds = null;
    groupLayer.eachLayer((leafletLayer) => {
      const f = leafletLayer?.feature;
      if (!f || !featureMatchesMunicipio(f)) return;
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
      state.map.fitBounds(bounds, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
    }
  }

  function showMunicipioLayersPopup(municipio) {
    if (!municipioFilterPopup) return;
    const c = normalizePtBrText(municipio || "").trim();
    if (!c) {
      municipioFilterPopup.hidden = true;
      municipioFilterPopup.innerHTML = "";
      return;
    }

    // Evita conflito visual/cliques com o painel de mapa base (mesmo canto direito).
    try {
      mapBasemapControl?.classList.remove("is-open");
      mapBasemapBtn?.setAttribute("aria-expanded", "false");
    } catch {
      // ignore
    }

    const parts = [];
    for (const entry of getContractLayerCatalog()) {
      const n = layerCountForMunicipio(entry.feats(), c);
      if (n <= 0) continue;
      const isSelected =
        normalizeSearchText(state.municipioFocusLayerLabel) === normalizeSearchText(entry.label);
      const cls = `menu-contract-pill${isSelected ? " is-selected" : ""}`;
      parts.push(
        `<button type="button" class="${cls}" data-municipio-layer-kind="${escapeHtml(
          entry.kind,
        )}" data-municipio-layer-label="${escapeHtml(entry.label)}" aria-pressed="${
          isSelected ? "true" : "false"
        }">${escapeHtml(entry.label)}: ${n}</button>`,
      );
    }

    municipioFilterPopup.innerHTML = `
      <div class="municipio-filter-popup__head">
        <div class="municipio-filter-popup__title">${escapeHtml(c)}</div>
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
    municipioFilterPopup.hidden = false;
  }

  function pickMunicipioMatchedCatalogEntry(preferredKind) {
    const municipio = state.municipioFilter || "";
    const catalog = getContractLayerCatalog();
    const prefer = String(preferredKind || state.municipioFocusLayerLabel || "").trim();
    if (prefer) {
      const byKind = catalog.find(
        (e) =>
          e.kind === prefer && layerCountForMunicipio(e.feats(), municipio) > 0,
      );
      if (byKind) return byKind;
      const byLabel = catalog.find(
        (e) =>
          normalizeSearchText(e.label) === normalizeSearchText(prefer) &&
          layerCountForMunicipio(e.feats(), municipio) > 0,
      );
      if (byLabel) return byLabel;
    }
    return (
      catalog.find((e) => layerCountForMunicipio(e.feats(), municipio) > 0) || null
    );
  }

  async function openMunicipioMatchedLayerTable(preferredKind) {
    // Nunca abre a tabela "Municípios (AM)" no filtro — só o SHP com dados do município.
    if (state.tableDataset === "municipios") {
      try {
        closeBottomSheet();
      } catch {
        // ignore
      }
    }
    const entry = pickMunicipioMatchedCatalogEntry(preferredKind);
    if (!entry) return null;
    const layerId = tableLayerIdFromKind(entry.kind);
    if (!layerId) return null;
    state.municipioFocusLayerLabel = entry.label;
    await openAttributesTableForLayer(layerId);
    return entry;
  }

  async function applyMunicipioFilterAndShowResults() {
    const wanted = normalizeSearchText(state.municipioFilter || "");
    if (!wanted) {
      showMunicipioLayersPopup("");
      applyContractFilterToMap();
      try {
        if (state.tableDataset && state.tableDataset !== "municipios") {
          rerenderTableForLayerId(state.tableDataset);
        } else if (state.tableDataset === "municipios") {
          closeBottomSheet();
        }
      } catch {
        // ignore
      }
      setStatus("Município: Todos", "ok");
      return;
    }
    if (state.bulkLayersIntent === "off") state.bulkLayersIntent = null;
    state.municipioFilterBounds = null;
    state.municipioFocusLayerLabel = "";
    setStatus(`Município: aplicando filtro ${state.municipioFilter}…`, "info");
    showMunicipioLayersPopup(state.municipioFilter);
    try {
      if (layerLimiteMunicipalToggle) layerLimiteMunicipalToggle.checked = true;
      await ensureMunicipiosFilterListLoaded();
      await new Promise((r) => setTimeout(r, 0));
      await attachLimiteMunicipalLayerIfNeeded();
      applyLimiteMunicipalVisibility();

      const idx = await findGlobalSearchHitInMunicipios(state.municipioFilter);
      if (idx < 0) {
        setStatus(`Município: ${state.municipioFilter} não encontrado`, "error");
        return;
      }
      const feature = state.municipiosFeatures?.[idx];
      const lyr = state.municipiosLayersByIndex?.[idx] || null;
      const nm =
        getMunicipioNomeFromPropsFast(feature?.properties) ||
        getMunicipioNomeFromProps(feature?.properties) ||
        state.municipioFilter;
      state.municipioFilter = nm;
      state.municipioFilterBounds = null;

      if (lyr && state.map) {
        try {
          const b = lyr.getBounds?.();
          if (b?.isValid?.()) {
            state.municipioFilterBounds = b;
            state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24], maxZoom: 11 });
          }
        } catch {
          // ignore
        }
      }

      // Carrega atributos das camadas e liga as que têm feições neste município.
      await ensureContractSourcesLoaded();
      state.suppressAutoOpenTableOnLayerToggle = true;
      try {
        await ensureAllMunicipioLayersOnMap();
      } finally {
        state.suppressAutoOpenTableOnLayerToggle = false;
      }
      applyContractFilterToMap();
      showMunicipioLayersPopup(nm);

      // Tabela = SHP filtrado (IP4 etc.), não Limite Municipal / Municípios AM.
      const matched = await openMunicipioMatchedLayerTable("ip4");
      try {
        renderLayerLegend();
      } catch {
        // ignore
      }
      setStatus(
        matched
          ? `Município: ${nm} — tabela ${matched.label}`
          : `Município: ${nm} — camadas filtradas`,
        "ok",
      );
    } catch {
      setStatus("Município: não foi possível aplicar o filtro", "error");
    }
  }

  function selectMunicipioFilterValue(rawValue) {
    const display = normalizePtBrText(rawValue || "").trim();
    state.municipioFilter = display;
    try {
      state.globalSearch.enabledKinds.add("municipios");
    } catch {
      // ignore
    }
    try {
      renderGlobalSearchMunicipiosPanel();
    } catch {
      // ignore
    }
    if (!normalizeSearchText(display)) {
      clearMunicipioFilterOnly({ keepKind: true });
      return;
    }
    void applyMunicipioFilterAndShowResults();
  }

  function renderGlobalSearchMunicipiosPanel() {
    const panel = globalSearchFilterEl?.querySelector?.("#global-search-filter-municipios");
    if (!panel) return;
    const enabled = Boolean(state.globalSearch.enabledKinds.has("municipios"));
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

    const current = normalizePtBrText(state.municipioFilter || "").trim();
    const currentKey = normalizeSearchText(current);
    const loading = Boolean(state.municipioFilterListPromise) && !state.municipioFilterListLoaded;
    const { sorted } = collectSortedMunicipioValues();
    const q = normalizeSearchText(state.municipioUiFilterText || "");
    const filtered = q ? sorted.filter((v) => normalizeSearchText(v).includes(q)) : sorted;

    const optsHtml = [
      { value: "", text: "Todos", selected: !currentKey },
      ...filtered.map((v) => ({
        value: v,
        text: v,
        selected: normalizeSearchText(v) === currentKey,
      })),
    ]
      .map((o) => {
        const cls = `global-search-filter__contract-opt${o.selected ? " is-selected" : ""}`;
        const check = o.selected ? "✓" : "";
        return `<button type="button" class="${cls}" data-filter-municipio="${escapeHtml(o.value)}" aria-pressed="${
          o.selected ? "true" : "false"
        }"><span>${escapeHtml(o.text)}</span><span class="global-search-filter__contract-check" aria-hidden="true">${check}</span></button>`;
      })
      .join("");

    let bodyHtml = optsHtml;
    if ((loading || (!state.municipioFilterListLoaded && !sorted.length)) && sorted.length === 0) {
      bodyHtml = `<div class="global-search-filter__contract-empty">Carregando municípios…</div>`;
    } else if (state.municipioFilterListLoaded && sorted.length === 0) {
      bodyHtml = `<div class="global-search-filter__contract-empty">Sem municípios disponíveis.</div>`;
    } else if (sorted.length && filtered.length === 0) {
      bodyHtml = `<div class="global-search-filter__contract-empty">Nenhum município encontrado.</div>`;
    }

    panel.innerHTML = `
      <div class="global-search-filter__contract-head">
        <div class="global-search-filter__contract-title">Município</div>
        <div class="global-search-filter__contract-current">${escapeHtml(current || "Todos")}</div>
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
          value="${escapeHtml(state.municipioUiFilterText || "")}"
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
    if (!state.municipioFilterListLoaded && !state.municipioFilterListPromise) {
      void ensureMunicipiosFilterListLoaded().then(() => {
        renderGlobalSearchMunicipiosPanel();
      });
    }
  }

  function renderGlobalSearchContractsPanel() {
    const panel = globalSearchFilterEl?.querySelector?.("#global-search-filter-contracts");
    if (!panel) return;
    const enabled = Boolean(state.globalSearch.enabledKinds.has("contratos"));
    panel.hidden = !enabled;
    panel.setAttribute("aria-hidden", enabled ? "false" : "true");
    if (!enabled) {
      panel.innerHTML = "";
      return;
    }

    const prevInput = panel.querySelector?.("#global-search-filter-contract-input");
    const prevFocused = document.activeElement === prevInput;
    const prevSelStart = prevInput?.selectionStart;
    const prevSelEnd = prevInput?.selectionEnd;

    const current = normalizeContractValue(state.contractFilter);
    const currentKey = normalizeContractKey(current);
    const isLoading = Boolean(state.contractSourcesLoadPromise) && !state.contractSourcesLoaded;
    const { sorted: allSorted } = collectSortedContractValues();
    const q = normalizeSearchText(state.contractUiFilterText || "");
    const sorted = q
      ? allSorted.filter((v) => normalizeContractKey(v).includes(q) || normalizeSearchText(v).includes(q))
      : allSorted;

    const optsHtml = [
      {
        value: "",
        text: "Todos",
        selected: !currentKey,
      },
      ...sorted.map((v) => ({
        value: v,
        text: v,
        selected: normalizeContractKey(v) === currentKey,
      })),
    ]
      .map((o) => {
        const cls = `global-search-filter__contract-opt${o.selected ? " is-selected" : ""}`;
        const check = o.selected ? "✓" : "";
        return `<button type="button" class="${cls}" data-filter-contract="${escapeHtml(o.value)}" aria-pressed="${
          o.selected ? "true" : "false"
        }"><span>${escapeHtml(o.text)}</span><span class="global-search-filter__contract-check" aria-hidden="true">${check}</span></button>`;
      })
      .join("");

    let bodyHtml = optsHtml;
    if (isLoading && allSorted.length === 0) {
      bodyHtml = `<div class="global-search-filter__contract-empty">Carregando contratos…</div>`;
    } else if (state.contractSourcesAttempted && allSorted.length === 0) {
      bodyHtml = `<div class="global-search-filter__contract-empty">Sem contratos disponíveis.</div>`;
    } else if (!isLoading && allSorted.length > 0 && sorted.length === 0) {
      bodyHtml = `<div class="global-search-filter__contract-empty">Nenhum contrato encontrado.</div>`;
    }

    panel.innerHTML = `
      <div class="global-search-filter__contract-head">
        <div class="global-search-filter__contract-title">Contrato</div>
        <div class="global-search-filter__contract-current">${escapeHtml(current || "Todos")}</div>
      </div>
      <label class="global-search-filter__contract-filter">
        <input
          id="global-search-filter-contract-input"
          class="global-search-filter__contract-input"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Buscar contrato…"
          aria-label="Buscar contrato"
          value="${escapeHtml(state.contractUiFilterText || "")}"
        />
      </label>
      <div class="global-search-filter__contract-list" role="listbox" aria-label="Contratos">
        ${bodyHtml}
      </div>
    `;

    if (prevFocused) {
      const input = panel.querySelector?.("#global-search-filter-contract-input");
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

    if (!state.contractSourcesLoaded) {
      void ensureContractSourcesLoaded().then(() => {
        refreshContractOptions();
        renderGlobalSearchContractsPanel();
      });
    }
  }

  async function fetchGeojsonFeatures(url, indexField) {
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

  async function ensureContractSourcesLoaded() {
    if (state.contractSourcesLoaded) return;
    // Evita "corrida": se já está carregando, aguarda o mesmo Promise.
    if (state.contractSourcesLoadPromise) return state.contractSourcesLoadPromise;

    state.contractSourcesLoadPromise = (async () => {
      state.contractSourcesAttempted = true;

      // Carrega em paralelo (só properties/features para montar a lista de contratos).
      const loaders = [
        ["bueirosFeatures", "/layers/bueiros-br317", "_bueirosIndex"],
        ["pontesFeatures", "/layers/pontes-br307", "_pontesIndex"],
        ["jazidasFeatures", "/layers/jazidas-br307", "_jazidasIndex"],
        ["bueirosBr174Features", "/layers/bueiros-br174", "_bueirosBr174Index"],
        ["pradsBr174Features", "/layers/prads-br174", "_pradsBr174Index"],
        ["pcaPradsBr319Features", "/layers/pca-prads-br319", "_pcaPradsBr319Index"],
        ["pradsBr319Features", "/layers/prads-br319", "_pradsBr319Index"],
        ["pcaPradsCmmBr319Features", "/layers/pca-prads-cmm-br319", "_pcaPradsCmmBr319Index"],
        ["bueirosBr230Features", "/layers/bueiros-br230", "_bueirosBr230Index"],
        ["pontesBr319Features", "/layers/pontes-br319", "_pontesBr319Index"],
        ["pontesBr230Features", "/layers/pontes-br230", "_pontesBr230Index"],
        ["bueirosBr319Features", "/layers/bueiros-br319", "_bueirosBr319Index"],
        ["ucEstadualFeatures", "/layers/uc-estadual", "_ucEstadualIndex"],
        ["ucMunicipalFeatures", "/layers/uc-municipal", "_ucMunicipalIndex"],
        ["ip4Features", "/layers/ip4", "_ip4Index"],
        ["tiAmFeatures", "/layers/ti-am", "_tiAmIndex"],
        ["hidroviasAmFeatures", "/layers/hidrovias-am", "_hidroviasAmIndex"],
      ];

      await Promise.all(
        loaders.map(async ([stateKey, url, indexField]) => {
          if (state[stateKey]?.length) return;
          state[stateKey] = await fetchGeojsonFeatures(url, indexField);
        })
      );

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
        if (!state.extraContractSources) state.extraContractSources = [];
        // evita duplicar
        if (!state.extraContractSources.some((s) => s?.label === label)) {
          state.extraContractSources.push({ label, features: feats });
        }
      } catch {
        // ignore
      }
    }

    // Bueiros BR-307: tenta achar por auto-discovery (assets/BR-307/**BUEIROS*.shp)
    await tryLoadDiscoveredLayerByName(/br-?307/i, /buei/gi, "Bueiros BR-307");

    // Descoberta genérica: camadas em /layers com coluna contrato/contratos.
    try {
      const rr = await fetch("/layers");
      if (rr.ok) {
        const payload = await rr.json();
        const items = payload?.layers || [];
        const candidates = [];
        for (const it of items) {
          const name = String(it?.name || "");
          if (/limite/i.test(name)) continue;
          if (/segmentos/i.test(name)) continue;
          if (looksLikeKnownDedicatedLayer(name)) continue;
          const id = it?.id;
          if (!id) continue;
          candidates.push({ id, name });
        }
        // Limita descoberta genérica para não travar o painel.
        const capped = candidates.slice(0, 24);
        await Promise.all(
          capped.map(async ({ id, name }) => {
            try {
              const label = name.replace(/\.shp$/i, "");
              const dedupeKey = normalizeContractLayerDedupeKey(label);
              if (!state.extraContractSources) state.extraContractSources = [];
              const existingIdx = state.extraContractSources.findIndex((s) => s?.dedupeKey === dedupeKey);
              const r2 = await fetch(`/layers/${id}`);
              if (!r2.ok) return;
              const data = await r2.json();
              const feats = (data.features || []).map((f, i) => ({ ...f, _extraIndex: i }));
              if (!feats.length) return;
              const has = feats.some((f) => featureHasContractColumn(f));
              if (!has) return;
              const next = { label, dedupeKey, features: feats };
              if (existingIdx >= 0) state.extraContractSources[existingIdx] = next;
              else state.extraContractSources.push(next);
            } catch {
              // ignore
            }
          })
        );
      }
    } catch {
      // ignore
    }

      refreshContractOptions();
      // Marca carregado após a tentativa (mesmo se lista vazia) para não ficar em loop.
      state.contractSourcesLoaded = true;
    })();

    try {
      await state.contractSourcesLoadPromise;
    } finally {
      state.contractSourcesLoadPromise = null;
    }
  }

  function layerCountForContract(features, contract) {
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
      const vals = getFeatureContracts(f);
      if (!vals.length) continue;
      if (!vals.some((v) => contractEquals(v, contract))) continue;
      const key = getStableKey(f, i);
      if (used.has(key)) continue;
      used.add(key);
      n++;
    }
    return n;
  }

  function inferKindFromContractLabel(label) {
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

  function getContractLayerCatalog() {
    return [
      { kind: "ip4", label: "IP4", feats: () => state.ip4Features || [] },
      { kind: "bueiros", label: "Bueiros BR-317", feats: () => state.bueirosFeatures || [] },
      { kind: "pontes", label: "Pontes BR-307", feats: () => state.pontesFeatures || [] },
      { kind: "jazidas", label: "Jazidas BR-307", feats: () => state.jazidasFeatures || [] },
      { kind: "pontes-br319", label: "Pontes BR-319", feats: () => state.pontesBr319Features || [] },
      { kind: "pontes-br230", label: "Pontes BR-230", feats: () => state.pontesBr230Features || [] },
      { kind: "bueiros-br319", label: "Bueiros BR-319", feats: () => state.bueirosBr319Features || [] },
      { kind: "uc-estadual", label: "UC Estadual", feats: () => state.ucEstadualFeatures || [] },
      { kind: "uc-municipal", label: "UC Municipal", feats: () => state.ucMunicipalFeatures || [] },
      { kind: "bueiros-br174", label: "Bueiros BR-174", feats: () => state.bueirosBr174Features || [] },
      { kind: "prads-br174", label: "PRADS BR-174", feats: () => state.pradsBr174Features || [] },
      { kind: "pca-prads-br319", label: "PCA - PRADS BR-319", feats: () => state.pcaPradsBr319Features || [] },
      { kind: "prads-br319", label: "PRADS BR-319", feats: () => state.pradsBr319Features || [] },
      { kind: "pca-prads-cmm-br319", label: "PCA - PRADS CMM BR-319", feats: () => state.pcaPradsCmmBr319Features || [] },
      { kind: "bueiros-br230", label: "Bueiros BR-230", feats: () => state.bueirosBr230Features || [] },
      { kind: "ti-am", label: "TI AM", feats: () => state.tiAmFeatures || [] },
      { kind: "hidrovias-am", label: "Hidrovias AM", feats: () => state.hidroviasAmFeatures || [] },
    ];
  }

  function forEachContractLayerSource(fn) {
    for (const entry of getContractLayerCatalog()) fn(entry);
    for (const src of state.extraContractSources || []) {
      if (!src?.features?.length) continue;
      fn({
        kind: inferKindFromContractLabel(src.label),
        label: src.label,
        feats: () => src.features || [],
      });
    }
  }

  function getContractLayerFeatureSets() {
    const out = [];
    forEachContractLayerSource(({ feats }) => {
      const list = feats();
      if (list?.length) out.push(list);
    });
    return out;
  }

  async function applyContractFilterAndShowResults() {
    const hasContract = Boolean(normalizeContractKey(state.contractFilter));
    if (!hasContract) {
      applyContractFilterToMap();
      if (state.tableDataset === "contract-results") closeBottomSheet();
      return;
    }
    // Se o usuário usou "Desligar todas", permite religar as camadas do contrato.
    if (state.bulkLayersIntent === "off") state.bulkLayersIntent = null;
    setStatus(`Contrato: aplicando filtro ${normalizeContractValue(state.contractFilter)}…`, "info");
    void openContractResultsTable();
    try {
      await ensureContractSourcesLoaded();
      await ensureAllContractLayersOnMap();
      applyContractFilterToMap();
      fitMapToCurrentContract();
      if (state.tableDataset === "contract-results") void openContractResultsTable();
      try {
        renderLayerLegend();
      } catch {
        // ignore
      }
      setStatus(`Contrato: ${normalizeContractValue(state.contractFilter)}`, "ok");
    } catch {
      setStatus("Contrato: não foi possível aplicar o filtro", "error");
    }
  }

  function collectContractBoundsFromLayerGroup(groupLayer, boundsIn) {
    if (!groupLayer?.eachLayer) return boundsIn || null;
    let bounds = boundsIn || null;
    groupLayer.eachLayer((leafletLayer) => {
      const f = leafletLayer?.feature;
      if (!f) return;
      if (!featureHasContractColumn(f)) return;
      if (!featureMatchesContract(f)) return;
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


  function fitMapToCurrentContract() {
    if (!state.map || !normalizeContractKey(state.contractFilter)) return;
    const layers = [
      state.geojsonLayer,
      state.bueirosLayer,
      state.pontesBr307Layer,
      state.jazidasBr307Layer,
      state.pontesBr319Layer,
      state.pontesBr230Layer,
      state.bueirosBr174Layer,
      state.bueirosBr230Layer,
      state.bueirosBr319Layer,
      state.pradsBr174Layer,
      state.pcaPradsBr319Layer,
      state.pradsBr319Layer,
      state.pcaPradsCmmBr319Layer,
      state.ucEstadualLayer,
      state.ucMunicipalLayer,
      state.tiAmLayer,
      state.hidroviasAmLayer,
      state.ip4Layer,
    ];
    let bounds = null;
    for (const lyr of layers) bounds = collectContractBoundsFromLayerGroup(lyr, bounds);
    try {
      const brAmLayers = state.brAm?.layersById ? Object.values(state.brAm.layersById) : [];
      for (const lyr of brAmLayers) bounds = collectContractBoundsFromLayerGroup(lyr, bounds);
    } catch {
      // ignore
    }
    for (const src of state.extraContractSources || []) {
      if (src?.layer) bounds = collectContractBoundsFromLayerGroup(src.layer, bounds);
    }
    if (bounds?.isValid?.()) {
      state.map.fitBounds(bounds, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
    }
  }

  // buildExtraContractLayerOnMap removido (reversão da última alteração)

  /**
   * Lista dinâmica de toggles de camadas.
   * Requisito: qualquer camada adicionada depois (novo switch na sidebar)
   * deve automaticamente entrar na lógica do botão "Desligar/Ligar camadas".
   *
   * Critério:
   * - inputs checkbox dentro de .layer-row
   * - id começando com "layer-"
   * - EXCETO o "Limite Estadual" (fallback obrigatório do mapa)
   */
  function getAllDataLayerToggles() {
    const nodes = Array.from(document.querySelectorAll('.layer-row input[type="checkbox"][id^="layer-"]'));
    return nodes.filter((el) => {
      if (!el) return false;
      const id = String(el.id || "");
      // Nunca tratar Limite Estadual como camada “desligável” no bulk.
      if (id === "layer-limite-estadual") return false;
      if (el === layerLimiteToggle) return false;
      return true;
    });
  }


  function allAvailableDataTogglesOff() {
    const toggles = getAllDataLayerToggles().filter((t) => !t.disabled);
    if (!toggles.length) return true;
    return toggles.every((t) => !t.checked);
  }

  async function ensureToggleLayerLoaded(toggleEl) {
    const meta = getEnsureForToggle(toggleEl);
    if (!meta?.ensure) return;
    await Promise.resolve(meta.ensure());
    // Limite Municipal: linha visual + hover — usar apply* (não só o hover).
    if (toggleEl === layerLimiteMunicipalToggle) {
      try {
        applyLimiteMunicipalVisibility();
      } catch {
        // ignore
      }
      return;
    }
    try {
      const lyr = meta.getLayer?.();
      if (lyr) ensureLayerVisibleOnMap(lyr);
    } catch {
      // ignore
    }
  }

  async function loadAllCheckedLayersNow() {
    const toggles = getAllDataLayerToggles().filter((t) => t && !t.disabled && t.checked);
    // Carrega em paralelo (não muda zoom; sem delays artificiais)
    await Promise.allSettled(toggles.map((t) => ensureToggleLayerLoaded(t)));
  }


  /** Se não houver nenhuma camada de dados ligada, mantém só o Limite Estadual ligado. */
  function ensureLimiteEstadualWhenNoDataLayers() {
    if (!state.map) return;
    if (!allAvailableDataTogglesOff()) return;
    forceOnlyLimiteEstadualOn();
  }


  function listDataLayersForBulkOff({ includeLimiteEstadual = false } = {}) {
    const layers = [
      state.geojsonLayer,
      state.bueirosLayer,
      state.pontesBr307Layer,
      state.pontesBr319Layer,
      state.pontesBr230Layer,
      state.bueirosBr319Layer,
      state.jazidasBr307Layer,
      state.hidroviasAmLayer,
      state.ucEstadualLayer,
      state.ucMunicipalLayer,
      state.ip4Layer,
      state.tiAmLayer,
      state.bueirosBr174Layer,
      state.pradsBr174Layer,
      state.pcaPradsBr319Layer,
      state.pradsBr319Layer,
      state.pcaPradsCmmBr319Layer,
      state.bueirosBr230Layer,
      state.boundaryMunicipalLayer,
      state.boundaryMunicipalHoverLayer,
    ];
    if (includeLimiteEstadual) layers.push(state.boundaryLayer);
    try {
      const brAm = state.brAm?.layersById || {};
      for (const lyr of Object.values(brAm)) layers.push(lyr);
    } catch {
      // ignore
    }
    try {
      const shields = state.brAm?.shieldsById || {};
      for (const lyr of Object.values(shields)) layers.push(lyr);
    } catch {
      // ignore
    }
    return layers.filter(Boolean);
  }

  /** Esconde panes de dados na hora (limite estadual fica no pane boundary). */
  function setDataPanesHiddenInstant(hidden) {
    if (!state.map) return;
    ensureInfraGeoPanes();
    const paneIds = [];
    try {
      if (state.panes?.polygons) paneIds.push(state.panes.polygons);
      if (state.panes?.lines) paneIds.push(state.panes.lines);
      if (state.panes?.points) paneIds.push(state.panes.points);
      if (state.panes?.highlight) paneIds.push(state.panes.highlight);
      paneIds.push("markerPane");
      paneIds.push("shadowPane");
    } catch {
      // ignore
    }
    for (const id of paneIds) {
      try {
        const pane = typeof id === "string" ? state.map.getPane?.(id) : null;
        if (pane?.style) pane.style.visibility = hidden ? "hidden" : "";
      } catch {
        // ignore
      }
    }
  }

  /** Remove camadas em fatias para não congelar a UI. */

  function uncheckAllDataLayerToggles({ keepLimiteEstadual = true } = {}) {
    getAllDataLayerToggles().forEach((el) => {
      if (el) el.checked = false;
    });
    if (layerLimiteMunicipalToggle) layerLimiteMunicipalToggle.checked = false;
    // Limite Estadual: sempre ligado quando keepLimiteEstadual (padrão do bulk-off).
    const limel = layerLimiteToggle || $("layer-limite-estadual");
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

  /** Força UI + mapa só com Limite Estadual (única camada obrigatória). */
  function forceOnlyLimiteEstadualOn() {
    state.limiteEstadualUserHidden = false;
    const limel = layerLimiteToggle || $("layer-limite-estadual");
    try {
      if (limel) {
        limel.disabled = false;
        limel.checked = true;
      }
    } catch {
      // ignore
    }
    try {
      if (layerLimiteMunicipalToggle) layerLimiteMunicipalToggle.checked = false;
    } catch {
      // ignore
    }
    try {
      applyLimiteMunicipalVisibility();
    } catch {
      // ignore
    }
    // Reaplica imediatamente se a camada já estiver em memória.
    try {
      if (state.map && state.boundaryLayer) {
        if (!state.map.hasLayer(state.boundaryLayer)) state.boundaryLayer.addTo(state.map);
        bringLimiteEstadualToBackIfVisible();
      }
    } catch {
      // ignore
    }
    void Promise.resolve(attachLimiteEstadualLayerIfNeeded())
      .catch(() => null)
      .finally(() => {
        try {
          const lim = layerLimiteToggle || $("layer-limite-estadual");
          if (lim) {
            lim.disabled = false;
            lim.checked = true;
          }
          applyLimiteEstadualVisibility();
          bringLimiteEstadualToBackIfVisible();
          syncLayerRowsToggleUi();
        } catch {
          // ignore
        }
      });
  }

  function turnOffAllDataLayersKeepLimiteEstadual() {
    if (!state.map) return;
    bumpMapLayerEpoch("off");
    state.suppressAutoFit = true;
    state.suppressAutoOpenTableOnLayerToggle = true;
    // Sempre manter Limite Estadual como única camada de dados ligada.
    state.limiteEstadualUserHidden = false;

    // 1) UI imediata: tudo off, Limite Estadual on (nunca desliga).
    uncheckAllDataLayerToggles({ keepLimiteEstadual: true });
    try {
      const limel = layerLimiteToggle || $("layer-limite-estadual");
      if (limel) {
        limel.disabled = false;
        limel.checked = true;
      }
    } catch {
      // ignore
    }
    forceOnlyLimiteEstadualOn();
    syncLayerRowsToggleUi();
    clearCurrentSelection();
    try {
      dismissTablesAndPopups?.();
    } catch {
      // ignore
    }

    // 2) Remoção síncrona do mapa (protege e reconfirma Limite Estadual).
    setDataPanesHiddenInstant(true);
    purgeAllDataLayersFromMapSync({ keepLimiteEstadual: true });
    setDataPanesHiddenInstant(false);
    clearEphemeralClientCaches({ keepLimiteEndpoints: true });

    const ensureLimiteOnly = () => {
      try {
        const limel = layerLimiteToggle || $("layer-limite-estadual");
        if (limel) {
          limel.disabled = false;
          limel.checked = true;
        }
      } catch {
        // ignore
      }
      forceOnlyLimiteEstadualOn();
      syncLayerRowsToggleUi();
    };

    ensureLimiteOnly();
    void Promise.resolve(attachLimiteEstadualLayerIfNeeded())
      .catch(() => null)
      .finally(() => {
        ensureLimiteOnly();
      });

    state.suppressAutoFit = false;
    state.suppressAutoOpenTableOnLayerToggle = false;
    window.setTimeout(() => {
      if (state.bulkLayersIntent === "off") state.bulkLayersIntent = null;
      ensureLimiteOnly();
      try {
        renderLayerLegend();
      } catch {
        // ignore
      }
    }, 400);
  }

  function turnOnAllDataLayersFast() {
    if (!state.map) return;
    bumpMapLayerEpoch("on");
    state.suppressAutoFit = true;
    state.suppressAutoOpenTableOnLayerToggle = true;
    try {
      hideFeatureQuickMenu(true);
      collapseAllCamadasGroups();
    } catch {
      // ignore
    }

    getAllDataLayerToggles()
      .filter((t) => t && !t.disabled)
      .forEach((t) => {
        t.checked = true;
        try {
          t.dispatchEvent(new Event("change", { bubbles: true }));
        } catch {
          // ignore
        }
      });
    syncLayerRowsToggleUi();
    // Não expandir a árvore ao ligar em lote — só liga no mapa.
    try {
      collapseAllCamadasGroups();
    } catch {
      // ignore
    }

    state.suppressAutoFit = false;
    state.suppressAutoOpenTableOnLayerToggle = false;
    // Carrega em paralelo sem bloquear o clique.
    void loadAllCheckedLayersNow().finally(() => {
      if (state.bulkLayersIntent === "on") state.bulkLayersIntent = null;
      syncLayerRowsToggleUi();
      try {
        collapseAllCamadasGroups();
        renderLayerLegend();
      } catch {
        // ignore
      }
    });
  }


  /** Mantido por compatibilidade; não introduz espera artificial. */

  function getEnsureForToggle(toggleEl) {
    // Mapeia toggle -> ensure() / layer getter para podermos "await" o carregamento real.
    const table = new Map([
      [layerBueirosToggle, { ensure: ensureBueirosBr317OnMap, getLayer: () => state.bueirosLayer }],
      [layerPontesToggle, { ensure: ensurePontesBr307OnMap, getLayer: () => state.pontesBr307Layer }],
      [layerJazidasToggle, { ensure: ensureJazidasBr307OnMap, getLayer: () => state.jazidasBr307Layer }],
      [layerUcEstadualToggle, { ensure: ensureUcEstadualOnMap, getLayer: () => state.ucEstadualLayer }],
      [layerUcMunicipalToggle, { ensure: ensureUcMunicipalOnMap, getLayer: () => state.ucMunicipalLayer }],
      [layerIp4Toggle, { ensure: ensureIp4OnMap, getLayer: () => state.ip4Layer }],
      [layerTiAmToggle, { ensure: ensureTiAmOnMap, getLayer: () => state.tiAmLayer }],
      [layerHidroviasAmToggle, { ensure: ensureHidroviasAmOnMap, getLayer: () => state.hidroviasAmLayer }],
      [layerPontesBr319Toggle, { ensure: ensurePontesBr319OnMap, getLayer: () => state.pontesBr319Layer }],
      [layerPontesBr230Toggle, { ensure: ensurePontesBr230OnMap, getLayer: () => state.pontesBr230Layer }],
      [layerBueirosBr319Toggle, { ensure: ensureBueirosBr319OnMap, getLayer: () => state.bueirosBr319Layer }],
      [layerBueirosBr174Toggle, { ensure: ensureBueirosBr174OnMap, getLayer: () => state.bueirosBr174Layer }],
      [layerBueirosBr230Toggle, { ensure: ensureBueirosBr230OnMap, getLayer: () => state.bueirosBr230Layer }],
      [layerPradsBr174Toggle, { ensure: ensurePradsBr174OnMap, getLayer: () => state.pradsBr174Layer }],
      [layerPcaPradsBr319Toggle, { ensure: ensurePcaPradsBr319OnMap, getLayer: () => state.pcaPradsBr319Layer }],
      [layerPradsBr319Toggle, { ensure: ensurePradsBr319OnMap, getLayer: () => state.pradsBr319Layer }],
      [layerPcaPradsCmmBr319Toggle, { ensure: ensurePcaPradsCmmBr319OnMap, getLayer: () => state.pcaPradsCmmBr319Layer }],
      [layerLimiteMunicipalToggle, { ensure: attachLimiteMunicipalLayerIfNeeded, getLayer: () => state.boundaryMunicipalHoverLayer }],
    ]);
    return table.get(toggleEl) || null;
  }

  function toggleDataLayersFromMenu() {
    if (!state.map) return;
    if (state.menuToggleLayersBusy) return;
    state.menuToggleLayersBusy = true;
    try {
      state.lockViewToAmazonasUntil = 0;

      if (allAvailableDataTogglesOff()) {
        turnOnAllDataLayersFast();
        return;
      }

      turnOffAllDataLayersKeepLimiteEstadual();
      collapseAllCamadasGroups();
    } finally {
      state.menuToggleLayersBusy = false;
      syncLayerRowsToggleUi();
    }
  }


  /** "Desligar todas" mantém somente o Limite Estadual (nunca zera o mapa). */

  /** Deixa o mapa somente com o Limite Estadual (remove todo o resto). */

  /**
   * Depois de ligar/desligar subcamadas de Rodovias: se todas estiverem ativas, zoom no limite estadual;
   * senão, prioriza extensão dos segmentos, depois bueiros, depois pontes, depois jazidas.
   */
  function afterRodoviasSublayerVisibilityChange() {
    if (!state.map) return;
    // Desempenho/UX: ligar/desligar camadas deve ser instantâneo (sem auto-zoom),
    // pois calcular bounds e chamar fitBounds em camadas grandes causa travadas perceptíveis.
    if (state.disableAutoFitOnLayerToggle) return;
    if (state.suppressAutoFit) return;
    // lockViewToAmazonasUntil desativado (0): sem comportamento especial temporizado.
    if (allRodoviasSublayersChecked()) {
      fitMapToStateBoundaryNow();
      return;
    }
    if (layerSegmentosToggle?.checked && state.geojsonLayer) {
      const b = state.geojsonLayer.getBounds?.();
      if (b?.isValid?.()) {
        state.map.fitBounds(b, {
          animate: false,
          duration: 0,
          padding: [28, 28],
          maxZoom: 16,
        });
      }
      return;
    }
    if (layerBueirosToggle?.checked && state.bueirosLayer?.getBounds) {
      const b = state.bueirosLayer.getBounds();
      if (b?.isValid?.()) {
        state.map.fitBounds(b, {
          maxZoom: 17,
          padding: [36, 36],
          animate: false,
          duration: 0,
        });
      }
      return;
    }
    if (layerPontesToggle?.checked && state.pontesBr307Layer?.getBounds) {
      const b = state.pontesBr307Layer.getBounds();
      if (b?.isValid?.()) {
        state.map.fitBounds(b, {
          maxZoom: 17,
          padding: [36, 36],
          animate: false,
          duration: 0,
        });
      }
      return;
    }
    if (layerJazidasToggle?.checked && state.jazidasBr307Layer?.getBounds) {
      const b = state.jazidasBr307Layer.getBounds();
      if (b?.isValid?.()) {
        state.map.fitBounds(b, {
          maxZoom: 17,
          padding: [36, 36],
          animate: false,
          duration: 0,
        });
      }
    }
  }

  function fetchBueirosBr317Info() {
    return fetch("/layers/bueiros-br317/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }


  function applyBueirosAvailability(info) {
    if (!layerBueirosToggle) return;
    if (!info?.available) {
      if (layerBueirosHint) layerBueirosHint.textContent = "Indisponível (assets/BR-317)";
      layerBueirosToggle.disabled = true;
      layerBueirosToggle.checked = false;
      layerBueirosRow?.classList.add("layer-row--disabled");
      if (state.bueirosLayer && state.map) state.map.removeLayer(state.bueirosLayer);
      state.bueirosFeatures = [];
      state.bueirosLayersByIndex = {};
      state.bueirosColumnKeys = [];
      state.bueirosSelectedIndex = null;
      if (state.tableDataset === "bueiros") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerBueirosToggle.disabled = false;
    layerBueirosRow?.classList.remove("layer-row--disabled");
    if (layerBueirosHint) layerBueirosHint.textContent = "BR-317";
  }


  function collectBueirosColumnKeys(features) {
    return collectColumnKeysFromFeatures(features);
  }

  async function ensureBueirosBr317OnMap() {
    if (!state.map || !layerBueirosToggle?.checked) return;
    if (state.bueirosLayer) {
      mountDataLayerIfAllowed(state.bueirosLayer, layerBueirosToggle);
      if (state.bueirosLayer.bringToFront) state.bueirosLayer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.bueirosLoading) return;
    state.bueirosLoading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/bueiros-br317");
      // Se o usuário desligou enquanto carregava, não renderiza/adiciona no mapa.
      if (!layerBueirosToggle?.checked || !state.map) return;
      const rawFeats = data.features || [];
      const feats = rawFeats.map((f, i) => ({ ...f, _bueirosIndex: i }));
      data.features = feats;
      state.bueirosFeatures = feats;
      state.bueirosLayersByIndex = {};
      state.bueirosColumnKeys = collectBueirosColumnKeys(feats);

      state.bueirosLayer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createBueirosPointIcon("bueiros"),
            interactive: true,
            riseOnHover: true,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") {
            return getBueirosLineStyle();
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            return getBueirosPolygonStyle();
          }
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._bueirosIndex;
          if (typeof idx === "number") state.bueirosLayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "bueiros");
          attachQuickHover(lyr, feature, "bueiros");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.bueirosLayer, layerBueirosToggle);
      if (state.bueirosLayer.bringToFront) state.bueirosLayer.bringToFront();
      if (state.totalFeaturesCount > 0) {
        setStatus(`Dados: ${state.totalFeaturesCount} feições`);
      } else {
        setStatus("Dados: pronto");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("Bueiros: não carregado (verifique Z: e shapefile)", "error");
      layerBueirosToggle.checked = false;
      state.bueirosFeatures = [];
      state.bueirosLayersByIndex = {};
      state.bueirosColumnKeys = [];
      state.bueirosLayer = null;
    } finally {
      state.bueirosLoading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }


  function fetchPontesBr307Info() {
    return fetch("/layers/pontes-br307/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchJazidasBr307Info() {
    return fetch("/layers/jazidas-br307/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchBueirosBr174Info() {
    return fetch("/layers/bueiros-br174/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchPradsBr174Info() {
    return fetch("/layers/prads-br174/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchPcaPradsBr319Info() {
    return fetch("/layers/pca-prads-br319/info")
      .then(async (r) => {
        if (!r.ok) return { available: false, message: `HTTP ${r.status}` };
        return r.json();
      })
      .catch(() => ({ available: false }));
  }
  function fetchPradsBr319Info() {
    return fetch("/layers/prads-br319/info")
      .then(async (r) => {
        if (!r.ok) return { available: false, message: `HTTP ${r.status}` };
        return r.json();
      })
      .catch(() => ({ available: false }));
  }
  function fetchPcaPradsCmmBr319Info() {
    return fetch("/layers/pca-prads-cmm-br319/info")
      .then(async (r) => {
        if (!r.ok) return { available: false, message: `HTTP ${r.status}` };
        return r.json();
      })
      .catch(() => ({ available: false }));
  }


  function fetchBueirosBr230Info() {
    return fetch("/layers/bueiros-br230/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }


  function fetchUcEstadualInfo() {
    return fetch("/layers/uc-estadual/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchUcMunicipalInfo() {
    return fetch("/layers/uc-municipal/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchIp4Info() {
    return fetch("/layers/ip4/info")
      .then((r) => {
        // Se o backend ainda não tiver sido reiniciado (404), não bloquear o switch.
        if (!r.ok) return { available: true, _unknown: true };
        return r.json();
      })
      .catch(() => ({ available: true, _unknown: true }));
  }

  function fetchHidroviasAmInfo() {
    return fetch("/layers/hidrovias-am/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchTiAmInfo() {
    return fetch("/layers/ti-am/info")
      .then((r) => {
        // Se o backend ainda não tiver sido reiniciado (404), não bloquear o switch.
        if (!r.ok) return { available: true, _unknown: true };
        return r.json();
      })
      .catch(() => ({ available: true, _unknown: true }));
  }

  function fetchLimiteMunicipalInfo() {
    return fetch("/layers/limite-municipal/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function applyLimiteMunicipalAvailability(info) {
    if (!layerLimiteMunicipalToggle) return;
    if (!info?.available) {
      layerLimiteMunicipalToggle.disabled = true;
      layerLimiteMunicipalToggle.checked = false;
      layerLimiteMunicipalRow?.classList.add("layer-row--disabled");
      if (state.boundaryMunicipalHoverLayer && state.map) state.map.removeLayer(state.boundaryMunicipalHoverLayer);
      if (state.boundaryMunicipalLayer && state.map) state.map.removeLayer(state.boundaryMunicipalLayer);
      state.boundaryMunicipalLayer = null;
      state.boundaryMunicipalHoverLayer = null;
      return;
    }
    layerLimiteMunicipalToggle.disabled = false;
    layerLimiteMunicipalRow?.classList.remove("layer-row--disabled");
  }

  function applyPontesAvailability(info) {
    if (!layerPontesToggle) return;
    if (!info?.available) {
      if (layerPontesHint) layerPontesHint.textContent = "Indisponível (assets/BR-307/PONTES)";
      layerPontesToggle.disabled = true;
      layerPontesToggle.checked = false;
      layerPontesRow?.classList.add("layer-row--disabled");
      if (state.pontesBr307Layer && state.map) state.map.removeLayer(state.pontesBr307Layer);
      state.pontesFeatures = [];
      state.pontesLayersByIndex = {};
      return;
    }
    layerPontesToggle.disabled = false;
    layerPontesRow?.classList.remove("layer-row--disabled");
    if (layerPontesHint) {
      layerPontesHint.textContent = info.shapefile ? String(info.shapefile).replace(/\.shp$/i, "") : "BR-307";
    }
  }

  function fetchPontesBr319Info() {
    return fetch("/layers/pontes-br319/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }

  function fetchPontesBr230Info() {
    return fetch("/layers/pontes-br230/info")
      .then((r) => (r.ok ? r.json() : { available: false }))
      .catch(() => ({ available: false }));
  }

  function fetchBueirosBr319Info() {
    return fetch("/layers/bueiros-br319/info")
      .then((r) => r.json())
      .catch(() => ({ available: false }));
  }


  function applyPontesBr319Availability(info) {
    if (!layerPontesBr319Toggle) return;
    if (!info?.available) {
      if (layerPontesBr319Hint) layerPontesBr319Hint.textContent = "Indisponível (assets/BR-319)";
      layerPontesBr319Toggle.disabled = true;
      layerPontesBr319Toggle.checked = false;
      layerPontesBr319Row?.classList.add("layer-row--disabled");
      if (state.pontesBr319Layer && state.map) state.map.removeLayer(state.pontesBr319Layer);
      state.pontesBr319Features = [];
      state.pontesBr319LayersByIndex = {};
      state.pontesBr319ColumnKeys = [];
      if (state.tableDataset === "pontes-br319") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerPontesBr319Toggle.disabled = false;
    layerPontesBr319Row?.classList.remove("layer-row--disabled");
    if (layerPontesBr319Hint) {
      layerPontesBr319Hint.textContent = info.shapefile ? String(info.shapefile).replace(/\.shp$/i, "") : "BR-319";
    }
  }

  function applyPontesBr230Availability(info) {
    if (!layerPontesBr230Toggle) return;
    if (!info?.available) {
      if (layerPontesBr230Hint) layerPontesBr230Hint.textContent = "Indisponível (assets/BR-230/PONTES_BR230)";
      layerPontesBr230Toggle.disabled = true;
      layerPontesBr230Toggle.checked = false;
      layerPontesBr230Row?.classList.add("layer-row--disabled");
      if (state.pontesBr230Layer && state.map) state.map.removeLayer(state.pontesBr230Layer);
      state.pontesBr230Features = [];
      state.pontesBr230LayersByIndex = {};
      state.pontesBr230ColumnKeys = [];
      state.pontesBr230Layer = null;
      if (state.tableDataset === "pontes-br230") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerPontesBr230Toggle.disabled = false;
    layerPontesBr230Row?.classList.remove("layer-row--disabled");
    if (layerPontesBr230Hint) layerPontesBr230Hint.textContent = "BR-230";
  }

  function applyBueirosBr319Availability(info) {
    if (!layerBueirosBr319Toggle) return;
    if (!info?.available) {
      if (layerBueirosBr319Hint) layerBueirosBr319Hint.textContent = "Indisponível (assets/BR-319/SHP_BUEIRO)";
      layerBueirosBr319Toggle.disabled = true;
      layerBueirosBr319Toggle.checked = false;
      layerBueirosBr319Row?.classList.add("layer-row--disabled");
      if (state.bueirosBr319Layer && state.map) state.map.removeLayer(state.bueirosBr319Layer);
      state.bueirosBr319Layer = null;
      state.bueirosBr319Features = [];
      state.bueirosBr319LayersByIndex = {};
      state.bueirosBr319SelectedIndex = null;
      state.bueirosBr319ColumnKeys = [];
      if (state.tableDataset === "bueiros-br319") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerBueirosBr319Toggle.disabled = false;
    layerBueirosBr319Row?.classList.remove("layer-row--disabled");
    if (layerBueirosBr319Hint) {
      layerBueirosBr319Hint.textContent = "BR-319";
    }
  }


  function applyBueirosBr174Availability(info) {
    if (!layerBueirosBr174Toggle) return;
    if (!info?.available) {
      if (layerBueirosBr174Hint) layerBueirosBr174Hint.textContent = "Indisponível (assets/BR-174)";
      layerBueirosBr174Toggle.disabled = true;
      layerBueirosBr174Toggle.checked = false;
      layerBueirosBr174Row?.classList.add("layer-row--disabled");
      if (state.bueirosBr174Layer && state.map) state.map.removeLayer(state.bueirosBr174Layer);
      state.bueirosBr174Layer = null;
      return;
    }
    layerBueirosBr174Toggle.disabled = false;
    layerBueirosBr174Row?.classList.remove("layer-row--disabled");
    if (layerBueirosBr174Hint) {
      layerBueirosBr174Hint.textContent = "BR-174";
    }
  }

  function applyPradsBr174Availability(info) {
    if (!layerPradsBr174Toggle) return;
    if (!info?.available) {
      if (layerPradsBr174Hint) layerPradsBr174Hint.textContent = "Indisponível (assets/BR-174)";
      layerPradsBr174Toggle.disabled = true;
      layerPradsBr174Toggle.checked = false;
      layerPradsBr174Row?.classList.add("layer-row--disabled");
      if (state.pradsBr174Layer && state.map) state.map.removeLayer(state.pradsBr174Layer);
      state.pradsBr174Layer = null;
      return;
    }
    layerPradsBr174Toggle.disabled = false;
    layerPradsBr174Row?.classList.remove("layer-row--disabled");
    if (layerPradsBr174Hint) {
      layerPradsBr174Hint.textContent = info.shapefile ? String(info.shapefile).replace(/\.shp$/i, "") : "BR-174";
    }
  }

  function applyPcaPradsBr319Availability(info) {
    if (!layerPcaPradsBr319Toggle) return;
    if (!info?.available) {
      if (layerPcaPradsBr319Hint) {
        layerPcaPradsBr319Hint.textContent = "Indisponível (assets/BR-319/PCA_PRAD)";
      }
      layerPcaPradsBr319Toggle.disabled = true;
      layerPcaPradsBr319Toggle.checked = false;
      layerPcaPradsBr319Row?.classList.add("layer-row--disabled");
      if (state.pcaPradsBr319Layer && state.map) state.map.removeLayer(state.pcaPradsBr319Layer);
      state.pcaPradsBr319Layer = null;
      return;
    }
    layerPcaPradsBr319Toggle.disabled = false;
    layerPcaPradsBr319Row?.classList.remove("layer-row--disabled");
    if (layerPcaPradsBr319Hint) {
      layerPcaPradsBr319Hint.textContent = info.shapefile
        ? String(info.shapefile).replace(/\.shp$/i, "")
        : "BR-319";
    }
  }
  function applyPradsBr319Availability(info) {
    if (!layerPradsBr319Toggle) return;
    if (!info?.available) {
      if (layerPradsBr319Hint) {
        layerPradsBr319Hint.textContent = "Indisponível (assets/BR-319/SP_PRADES_NOVO/PRADs_BR 319)";
      }
      layerPradsBr319Toggle.disabled = true;
      layerPradsBr319Toggle.checked = false;
      layerPradsBr319Row?.classList.add("layer-row--disabled");
      if (state.pradsBr319Layer && state.map) state.map.removeLayer(state.pradsBr319Layer);
      state.pradsBr319Layer = null;
      return;
    }
    layerPradsBr319Toggle.disabled = false;
    layerPradsBr319Row?.classList.remove("layer-row--disabled");
    if (layerPradsBr319Hint) {
      layerPradsBr319Hint.textContent = info.shapefile
        ? String(info.shapefile).replace(/\.shp$/i, "")
        : "BR-319";
    }
  }
  function applyPcaPradsCmmBr319Availability(info) {
    if (!layerPcaPradsCmmBr319Toggle) return;
    if (!info?.available) {
      if (layerPcaPradsCmmBr319Hint) {
        layerPcaPradsCmmBr319Hint.textContent = "Indisponível (assets/BR-319/PCA_PRAD_CMM)";
      }
      layerPcaPradsCmmBr319Toggle.disabled = true;
      layerPcaPradsCmmBr319Toggle.checked = false;
      layerPcaPradsCmmBr319Row?.classList.add("layer-row--disabled");
      if (state.pcaPradsCmmBr319Layer && state.map) state.map.removeLayer(state.pcaPradsCmmBr319Layer);
      state.pcaPradsCmmBr319Layer = null;
      return;
    }
    layerPcaPradsCmmBr319Toggle.disabled = false;
    layerPcaPradsCmmBr319Row?.classList.remove("layer-row--disabled");
    if (layerPcaPradsCmmBr319Hint) {
      layerPcaPradsCmmBr319Hint.textContent = info.shapefile
        ? String(info.shapefile).replace(/\.shp$/i, "")
        : "BR-319";
    }
  }


  function applyBueirosBr230Availability(info) {
    if (!layerBueirosBr230Toggle) return;
    if (!info?.available) {
      if (layerBueirosBr230Hint) layerBueirosBr230Hint.textContent = "Indisponível (assets/BR-230)";
      layerBueirosBr230Toggle.disabled = true;
      layerBueirosBr230Toggle.checked = false;
      layerBueirosBr230Row?.classList.add("layer-row--disabled");
      if (state.bueirosBr230Layer && state.map) state.map.removeLayer(state.bueirosBr230Layer);
      state.bueirosBr230Layer = null;
      state.bueirosBr230Features = [];
      state.bueirosBr230LayersByIndex = {};
      return;
    }
    layerBueirosBr230Toggle.disabled = false;
    layerBueirosBr230Row?.classList.remove("layer-row--disabled");
    if (layerBueirosBr230Hint) {
      layerBueirosBr230Hint.textContent = "BR-230";
    }
  }


  async function ensurePontesBr319OnMap() {
    if (!state.map || !layerPontesBr319Toggle?.checked) return;
    if (state.pontesBr319Layer) {
      mountDataLayerIfAllowed(state.pontesBr319Layer, layerPontesBr319Toggle);
      if (state.pontesBr319Layer.bringToFront) state.pontesBr319Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.pontesBr319Loading) return;
    state.pontesBr319Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/pontes-br319");
      const rawFeats = data.features || [];
      const featsP = rawFeats.map((f, i) => ({ ...f, _pontesBr319Index: i }));
      data.features = featsP;
      state.pontesBr319Features = featsP;
      state.pontesBr319LayersByIndex = {};

      state.pontesBr319Layer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createPontesPointIcon("pontes-br319"),
            interactive: true,
            riseOnHover: true,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") {
            return isSatelliteBasemapActive()
              ? { color: "#bae6fd", weight: 4.2, opacity: 0.98 }
              : { color: "#0ea5e9", weight: 3.8, opacity: 0.92 };
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            return isSatelliteBasemapActive()
              ? { color: "#bae6fd", weight: 2.2, fillColor: "#7dd3fc", fillOpacity: 0.36 }
              : { color: "#0ea5e9", weight: 2.0, fillColor: "#7dd3fc", fillOpacity: 0.22 };
          }
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._pontesBr319Index;
          if (typeof idx === "number") state.pontesBr319LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "pontes-br319");
          attachQuickHover(lyr, feature, "pontes-br319");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.pontesBr319Layer, layerPontesBr319Toggle);
      if (state.pontesBr319Layer.bringToFront) state.pontesBr319Layer.bringToFront();
      if (state.totalFeaturesCount > 0) {
        setStatus(`Dados: ${state.totalFeaturesCount} feições`);
      } else {
        setStatus("Dados: pronto");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("Pontes BR-319: não carregado (verifique Z: e shapefile)", "error");
      if (layerPontesBr319Toggle) layerPontesBr319Toggle.checked = false;
      state.pontesBr319Features = [];
      state.pontesBr319LayersByIndex = {};
      state.pontesBr319Layer = null;
    } finally {
      state.pontesBr319Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensurePontesBr230OnMap() {
    if (!state.map || !layerPontesBr230Toggle?.checked) return;
    if (state.pontesBr230Layer) {
      mountDataLayerIfAllowed(state.pontesBr230Layer, layerPontesBr230Toggle);
      if (state.pontesBr230Layer.bringToFront) state.pontesBr230Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.pontesBr230Loading) return;
    state.pontesBr230Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/pontes-br230");
      const rawFeats = data.features || [];
      const featsP = rawFeats.map((f, i) => ({ ...f, _pontesBr230Index: i }));
      data.features = featsP;
      state.pontesBr230Features = featsP;
      state.pontesBr230LayersByIndex = {};

      state.pontesBr230Layer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createPontesPointIcon("pontes-br230"),
            interactive: true,
            riseOnHover: true,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") {
            return isSatelliteBasemapActive()
              ? { color: "#c4b5fd", weight: 4.2, opacity: 0.98 }
              : { color: "#7c3aed", weight: 3.8, opacity: 0.92 };
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            return isSatelliteBasemapActive()
              ? { color: "#c4b5fd", weight: 2.2, fillColor: "#ddd6fe", fillOpacity: 0.36 }
              : { color: "#7c3aed", weight: 2.0, fillColor: "#ddd6fe", fillOpacity: 0.22 };
          }
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._pontesBr230Index;
          if (typeof idx === "number") state.pontesBr230LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "pontes-br230");
          attachQuickHover(lyr, feature, "pontes-br230");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.pontesBr230Layer, layerPontesBr230Toggle);
      if (state.pontesBr230Layer.bringToFront) state.pontesBr230Layer.bringToFront();
      if (state.totalFeaturesCount > 0) {
        setStatus(`Dados: ${state.totalFeaturesCount} feições`);
      } else {
        setStatus("Dados: pronto");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("Pontes BR-230: não carregado (verifique assets/BR-230/PONTES_BR230)", "error");
      if (layerPontesBr230Toggle) layerPontesBr230Toggle.checked = false;
      state.pontesBr230Features = [];
      state.pontesBr230LayersByIndex = {};
      state.pontesBr230Layer = null;
    } finally {
      state.pontesBr230Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensureBueirosBr319OnMap() {
    if (!state.map || !layerBueirosBr319Toggle?.checked) return;
    if (state.bueirosBr319Layer) {
      mountDataLayerIfAllowed(state.bueirosBr319Layer, layerBueirosBr319Toggle);
      if (state.bueirosBr319Layer.bringToFront) state.bueirosBr319Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.bueirosBr319Loading) return;
    state.bueirosBr319Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/bueiros-br319");

      const rawFeats = data.features || [];
      const feats = rawFeats.map((f, i) => ({ ...f, _bueirosBr319Index: i }));
      data.features = feats;

      state.bueirosBr319Features = feats;
      state.bueirosBr319LayersByIndex = {};

      const layer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createBueirosPointIcon("bueiros-br319"),
            interactive: true,
            riseOnHover: true,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") return getBueirosLineStyle();
          if (t === "Polygon" || t === "MultiPolygon") return getBueirosPolygonStyle();
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature?._bueirosBr319Index;
          if (typeof idx === "number") state.bueirosBr319LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "bueiros-br319");
          applyBueirosStyleToLayer(lyr);
          attachQuickHover(lyr, feature, "bueiros-br319");
          bindLayerIdentifyClick(lyr);
        },
      });

      state.bueirosBr319Layer = layer;
      mountDataLayerIfAllowed(layer, layerBueirosBr319Toggle);
      if (layer.bringToFront) layer.bringToFront();
    } catch (e) {
      console.warn(e);
      setStatus("Bueiros BR-319: não carregado (verifique assets/BR-319/SHP_BUEIRO)", "error");
      if (layerBueirosBr319Toggle) layerBueirosBr319Toggle.checked = false;
      state.bueirosBr319Features = [];
      state.bueirosBr319LayersByIndex = {};
      state.bueirosBr319Layer = null;
    } finally {
      state.bueirosBr319Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }


  function getPradsStyleByKind(kind) {
    const legendId = String(kind || "").includes("319") ? "br-319" : String(kind || "").includes("174") ? "br-174" : "prads";
    const color = getLegendAccentById(legendId);
    const fillDef = getSimpleLegendDefs().find((d) => d.id === legendId);
    const fillColor = fillDef?.fill || color;
    return (feature) => {
      const t = feature?.geometry?.type;
      if (t === "LineString" || t === "MultiLineString") return { color, weight: 2.2, opacity: 0.9 };
      if (t === "Polygon" || t === "MultiPolygon")
        return { color, weight: 1.4, opacity: 0.9, fillColor, fillOpacity: 0.22 };
      return {};
    };
  }

  async function ensureBueirosBr174OnMap() {
    if (!state.map || !layerBueirosBr174Toggle?.checked) return;
    if (state.bueirosBr174Layer) {
      mountDataLayerIfAllowed(state.bueirosBr174Layer, layerBueirosBr174Toggle);
      if (state.bueirosBr174Layer.bringToFront) state.bueirosBr174Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.bueirosBr174Loading) return;
    state.bueirosBr174Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/bueiros-br174");
      const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr174Index: i }));
      data.features = feats;
      state.bueirosBr174Features = feats;
      state.bueirosBr174LayersByIndex = {};
      state.bueirosBr174ColumnKeys = [];
      state.bueirosBr174Layer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, { icon: createBueirosPointIcon("bueiros-br174"), interactive: true, riseOnHover: true });
        },
        onEachFeature(feature, lyr) {
          const idx = feature._bueirosBr174Index;
          if (typeof idx === "number") state.bueirosBr174LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "bueiros-br174");
          attachQuickHover(lyr, feature, "bueiros-br174");
          bindLayerIdentifyClick(lyr);
        },
      });
      mountDataLayerIfAllowed(state.bueirosBr174Layer, layerBueirosBr174Toggle);
      if (state.bueirosBr174Layer.bringToFront) state.bueirosBr174Layer.bringToFront();
    } catch (e) {
      console.warn(e);
      setStatus("Bueiros BR-174: não carregado (verifique assets/BR-174 e o shapefile)", "error");
      if (layerBueirosBr174Toggle) layerBueirosBr174Toggle.checked = false;
      state.bueirosBr174Layer = null;
    } finally {
      state.bueirosBr174Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensurePradsBr174OnMap() {
    if (!state.map || !layerPradsBr174Toggle?.checked) return;
    if (state.pradsBr174Layer) {
      mountDataLayerIfAllowed(state.pradsBr174Layer, layerPradsBr174Toggle);
      if (state.pradsBr174Layer.bringToFront) state.pradsBr174Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.pradsBr174Loading) return;
    state.pradsBr174Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/prads-br174");
      const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr174Index: i }));
      data.features = feats;
      state.pradsBr174Features = feats;
      state.pradsBr174LayersByIndex = {};
      state.pradsBr174ColumnKeys = [];
      state.pradsBr174Layer = L.geoJSON(data, {
        style: getPradsStyleByKind("prads-br174"),
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, { icon: createPradsPointIcon("prads-br174"), interactive: true, riseOnHover: true });
        },
        onEachFeature(feature, lyr) {
          const idx = feature._pradsBr174Index;
          if (typeof idx === "number") state.pradsBr174LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "prads-br174");
          attachQuickHover(lyr, feature, "prads-br174");
          bindLayerIdentifyClick(lyr);
        },
      });
      mountDataLayerIfAllowed(state.pradsBr174Layer, layerPradsBr174Toggle);
      if (state.pradsBr174Layer.bringToFront) state.pradsBr174Layer.bringToFront();
    } catch (e) {
      console.warn(e);
      setStatus("PRADS BR-174: não carregado (verifique assets/BR-174 e o shapefile)", "error");
      if (layerPradsBr174Toggle) layerPradsBr174Toggle.checked = false;
      state.pradsBr174Layer = null;
    } finally {
      state.pradsBr174Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensurePcaPradsBr319OnMap() {
    if (!state.map || !layerPcaPradsBr319Toggle?.checked) return;
    if (state.pcaPradsBr319Layer) {
      mountDataLayerIfAllowed(state.pcaPradsBr319Layer, layerPcaPradsBr319Toggle);
      if (state.pcaPradsBr319Layer.bringToFront) state.pcaPradsBr319Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.pcaPradsBr319Loading) return;
    state.pcaPradsBr319Loading = true;
    try {
      ensureInfraGeoPanes();
      const data = await fetchLayerGeoJson("/layers/pca-prads-br319");
      const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsBr319Index: i }));
      data.features = feats;
      state.pcaPradsBr319Features = feats;
      state.pcaPradsBr319LayersByIndex = {};
      state.pcaPradsBr319ColumnKeys = [];
      const geoOpts = {
        style: getPradsStyleByKind("pca-prads-br319"),
        pointToLayer(_feature, latlng) {
          const markerOpts = { icon: createPradsPointIcon("pca-prads-br319"), interactive: true, riseOnHover: true };
          if (state.panes?.points) markerOpts.pane = state.panes.points;
          return L.marker(latlng, markerOpts);
        },
        onEachFeature(feature, lyr) {
          const idx = feature._pcaPradsBr319Index;
          if (typeof idx === "number") state.pcaPradsBr319LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "pca-prads-br319");
          attachQuickHover(lyr, feature, "pca-prads-br319");
          bindLayerIdentifyClick(lyr);
        },
      };
      if (state.panes?.points) geoOpts.pane = state.panes.points;
      state.pcaPradsBr319Layer = L.geoJSON(data, geoOpts);
      mountDataLayerIfAllowed(state.pcaPradsBr319Layer, layerPcaPradsBr319Toggle);
      if (state.pcaPradsBr319Layer.bringToFront) state.pcaPradsBr319Layer.bringToFront();
    } catch (e) {
      console.warn(e);
      setStatus("PCA - PRADS BR-319: não carregado (verifique assets/BR-319 e o shapefile)", "error");
      if (layerPcaPradsBr319Toggle) layerPcaPradsBr319Toggle.checked = false;
      state.pcaPradsBr319Layer = null;
    } finally {
      state.pcaPradsBr319Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }
  async function ensurePradsBr319OnMap() {
    if (!state.map || !layerPradsBr319Toggle?.checked) return;
    if (state.pradsBr319Layer) {
      mountDataLayerIfAllowed(state.pradsBr319Layer, layerPradsBr319Toggle);
      if (state.pradsBr319Layer.bringToFront) state.pradsBr319Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.pradsBr319Loading) return;
    state.pradsBr319Loading = true;
    try {
      ensureInfraGeoPanes();
      const data = await fetchLayerGeoJson("/layers/prads-br319");
      const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr319Index: i }));
      data.features = feats;
      state.pradsBr319Features = feats;
      state.pradsBr319LayersByIndex = {};
      state.pradsBr319ColumnKeys = [];
      const geoOpts = {
        style: getPradsStyleByKind("prads-br319"),
        pointToLayer(_feature, latlng) {
          const markerOpts = { icon: createPradsPointIcon("prads-br319"), interactive: true, riseOnHover: true };
          if (state.panes?.points) markerOpts.pane = state.panes.points;
          return L.marker(latlng, markerOpts);
        },
        onEachFeature(feature, lyr) {
          const idx = feature._pradsBr319Index;
          if (typeof idx === "number") state.pradsBr319LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "prads-br319");
          attachQuickHover(lyr, feature, "prads-br319");
          bindLayerIdentifyClick(lyr);
        },
      };
      if (state.panes?.points) geoOpts.pane = state.panes.points;
      state.pradsBr319Layer = L.geoJSON(data, geoOpts);
      mountDataLayerIfAllowed(state.pradsBr319Layer, layerPradsBr319Toggle);
      if (state.pradsBr319Layer.bringToFront) state.pradsBr319Layer.bringToFront();
    } catch (e) {
      console.warn(e);
      setStatus("PRADS BR-319: não carregado (verifique assets/BR-319 e o shapefile)", "error");
      if (layerPradsBr319Toggle) layerPradsBr319Toggle.checked = false;
      state.pradsBr319Layer = null;
    } finally {
      state.pradsBr319Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }
  async function ensurePcaPradsCmmBr319OnMap() {
    if (!state.map || !layerPcaPradsCmmBr319Toggle?.checked) return;
    if (state.pcaPradsCmmBr319Layer) {
      mountDataLayerIfAllowed(state.pcaPradsCmmBr319Layer, layerPcaPradsCmmBr319Toggle);
      if (state.pcaPradsCmmBr319Layer.bringToFront) state.pcaPradsCmmBr319Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.pcaPradsCmmBr319Loading) return;
    state.pcaPradsCmmBr319Loading = true;
    try {
      ensureInfraGeoPanes();
      const data = await fetchLayerGeoJson("/layers/pca-prads-cmm-br319");
      const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsCmmBr319Index: i }));
      data.features = feats;
      state.pcaPradsCmmBr319Features = feats;
      state.pcaPradsCmmBr319LayersByIndex = {};
      state.pcaPradsCmmBr319ColumnKeys = [];
      const geoOpts = {
        style: getPradsStyleByKind("pca-prads-cmm-br319"),
        pointToLayer(_feature, latlng) {
          const markerOpts = { icon: createPradsPointIcon("pca-prads-cmm-br319"), interactive: true, riseOnHover: true };
          if (state.panes?.points) markerOpts.pane = state.panes.points;
          return L.marker(latlng, markerOpts);
        },
        onEachFeature(feature, lyr) {
          const idx = feature._pcaPradsCmmBr319Index;
          if (typeof idx === "number") state.pcaPradsCmmBr319LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "pca-prads-cmm-br319");
          attachQuickHover(lyr, feature, "pca-prads-cmm-br319");
          bindLayerIdentifyClick(lyr);
        },
      };
      if (state.panes?.points) geoOpts.pane = state.panes.points;
      state.pcaPradsCmmBr319Layer = L.geoJSON(data, geoOpts);
      mountDataLayerIfAllowed(state.pcaPradsCmmBr319Layer, layerPcaPradsCmmBr319Toggle);
      if (state.pcaPradsCmmBr319Layer.bringToFront) state.pcaPradsCmmBr319Layer.bringToFront();
    } catch (e) {
      console.warn(e);
      setStatus("PCA - PRADS CMM BR-319: não carregado (verifique assets/BR-319 e o shapefile)", "error");
      if (layerPcaPradsCmmBr319Toggle) layerPcaPradsCmmBr319Toggle.checked = false;
      state.pcaPradsCmmBr319Layer = null;
    } finally {
      state.pcaPradsCmmBr319Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }


  async function ensureBueirosBr230OnMap() {
    if (!state.map || !layerBueirosBr230Toggle?.checked) return;
    if (state.bueirosBr230Layer) {
      mountDataLayerIfAllowed(state.bueirosBr230Layer, layerBueirosBr230Toggle);
      if (state.bueirosBr230Layer.bringToFront) state.bueirosBr230Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.bueirosBr230Loading) return;
    state.bueirosBr230Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/bueiros-br230");
      const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr230Index: i }));
      data.features = feats;
      state.bueirosBr230Features = feats;
      state.bueirosBr230LayersByIndex = {};
      state.bueirosBr230ColumnKeys = [];
      state.bueirosBr230Layer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, { icon: createBueirosPointIcon("bueiros-br230"), interactive: true, riseOnHover: true });
        },
        onEachFeature(feature, lyr) {
          const idx = feature._bueirosBr230Index;
          if (typeof idx === "number") state.bueirosBr230LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "bueiros-br230");
          attachQuickHover(lyr, feature, "bueiros-br230");
          bindLayerIdentifyClick(lyr);
        },
      });
      mountDataLayerIfAllowed(state.bueirosBr230Layer, layerBueirosBr230Toggle);
      if (state.bueirosBr230Layer.bringToFront) state.bueirosBr230Layer.bringToFront();
    } catch (e) {
      console.warn(e);
      setStatus("Bueiros BR-230: não carregado (verifique assets/BR-230 e o shapefile)", "error");
      if (layerBueirosBr230Toggle) layerBueirosBr230Toggle.checked = false;
      state.bueirosBr230Layer = null;
    } finally {
      state.bueirosBr230Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }


  function applyJazidasAvailability(info) {
    if (!layerJazidasToggle) return;
    if (!info?.available) {
      if (layerJazidasHint) layerJazidasHint.textContent = "Indisponível (assets/BR-307/JAZIDAS)";
      layerJazidasToggle.disabled = true;
      layerJazidasToggle.checked = false;
      layerJazidasRow?.classList.add("layer-row--disabled");
      if (state.jazidasBr307Layer && state.map) state.map.removeLayer(state.jazidasBr307Layer);
      state.jazidasFeatures = [];
      state.jazidasLayersByIndex = {};
      return;
    }
    layerJazidasToggle.disabled = false;
    layerJazidasRow?.classList.remove("layer-row--disabled");
    if (layerJazidasHint) {
      if (Array.isArray(info.shapefiles) && info.shapefiles.length) {
        const base = info.shapefiles[0];
        layerJazidasHint.textContent = info.shapefiles.length > 1 ? `${base.replace(/\\.shp$/i, "")} +${info.shapefiles.length - 1}` : base.replace(/\\.shp$/i, "");
      } else {
        layerJazidasHint.textContent = "BR-307";
      }
    }
  }


  function applyUcEstadualAvailability(info) {
    if (!layerUcEstadualToggle) return;
    if (!info?.available) {
      layerUcEstadualToggle.disabled = true;
      layerUcEstadualToggle.checked = false;
      layerUcEstadualRow?.classList.add("layer-row--disabled");
      if (state.ucEstadualLayer && state.map) state.map.removeLayer(state.ucEstadualLayer);
      state.ucEstadualLayer = null;
      state.ucEstadualFeatures = [];
      state.ucEstadualLayersByIndex = {};
      state.ucEstadualColumnKeys = [];
      if (state.tableDataset === "uc-estadual") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerUcEstadualToggle.disabled = false;
    layerUcEstadualRow?.classList.remove("layer-row--disabled");
  }

  function applyUcMunicipalAvailability(info) {
    if (!layerUcMunicipalToggle) return;
    if (!info?.available) {
      layerUcMunicipalToggle.disabled = true;
      layerUcMunicipalToggle.checked = false;
      layerUcMunicipalRow?.classList.add("layer-row--disabled");
      if (state.ucMunicipalLayer && state.map) state.map.removeLayer(state.ucMunicipalLayer);
      state.ucMunicipalLayer = null;
      state.ucMunicipalFeatures = [];
      state.ucMunicipalLayersByIndex = {};
      state.ucMunicipalColumnKeys = [];
      if (state.tableDataset === "uc-municipal") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerUcMunicipalToggle.disabled = false;
    layerUcMunicipalRow?.classList.remove("layer-row--disabled");
  }

  function applyHidroviasAmAvailability(info) {
    if (!layerHidroviasAmToggle) return;
    if (!info?.available) {
      layerHidroviasAmToggle.disabled = true;
      layerHidroviasAmToggle.checked = false;
      layerHidroviasAmRow?.classList.add("layer-row--disabled");
      if (state.hidroviasAmLayer && state.map) state.map.removeLayer(state.hidroviasAmLayer);
      state.hidroviasAmLayer = null;
      state.hidroviasAmFeatures = [];
      state.hidroviasAmLayersByIndex = {};
      state.hidroviasAmColumnKeys = [];
      if (state.tableDataset === "hidrovias-am") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerHidroviasAmToggle.disabled = false;
    layerHidroviasAmRow?.classList.remove("layer-row--disabled");
    // Se estiver marcado por padrão, garante carga após checagem de disponibilidade.
    if (state.map && layerHidroviasAmToggle.checked) {
      void ensureHidroviasAmOnMap();
    }
  }

  function applyTiAmAvailability(info) {
    if (!layerTiAmToggle) return;
    // Se não conseguimos checar disponibilidade, não desabilita (deixa o load real decidir).
    if (info?._unknown) {
      layerTiAmToggle.disabled = false;
      layerTiAmRow?.classList.remove("layer-row--disabled");
      return;
    }
    if (!info?.available) {
      layerTiAmToggle.disabled = true;
      layerTiAmToggle.checked = false;
      layerTiAmRow?.classList.add("layer-row--disabled");
      if (state.tiAmLayer && state.map) state.map.removeLayer(state.tiAmLayer);
      state.tiAmLayer = null;
      state.tiAmFeatures = [];
      state.tiAmLayersByIndex = {};
      state.tiAmColumnKeys = [];
      if (state.tableDataset === "ti-am") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerTiAmToggle.disabled = false;
    layerTiAmRow?.classList.remove("layer-row--disabled");
  }

  function applyIp4Availability(info) {
    if (!layerIp4Toggle) return;
    // Se não conseguimos checar disponibilidade, não desabilita (deixa o load real decidir).
    if (info?._unknown) {
      layerIp4Toggle.disabled = false;
      layerIp4Row?.classList.remove("layer-row--disabled");
      if (layerIp4Hint) layerIp4Hint.textContent = "IP4 (checagem pendente — tente ligar)";
      return;
    }
    if (!info?.available) {
      const rec = typeof info?.bestRecords === "number" ? info.bestRecords : null;
      if (layerIp4Hint) {
        layerIp4Hint.textContent = rec === 0 ? "Camada vazia (0 registros)" : "Indisponível (assets/IP4)";
      }
      layerIp4Toggle.disabled = true;
      layerIp4Toggle.checked = false;
      layerIp4Row?.classList.add("layer-row--disabled");
      if (state.ip4Layer && state.map) state.map.removeLayer(state.ip4Layer);
      state.ip4Layer = null;
      state.ip4Features = [];
      state.ip4LayersByIndex = {};
      state.ip4ColumnKeys = [];
      if (state.tableDataset === "ip4") {
        state.tableDataset = "segmentos";
        if ($("all-attributes")) {
          renderAllAttributesTable();
        }
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
      return;
    }
    layerIp4Toggle.disabled = false;
    layerIp4Row?.classList.remove("layer-row--disabled");
    if (layerIp4Hint) {
      const name = String(info?.bestShapefile || "IP4").replace(/\.shp$/i, "");
      const rec = typeof info?.bestRecords === "number" ? info.bestRecords : null;
      const fromZip = info?.bestZip ? ` (ZIP: ${String(info.bestZip)})` : "";
      // Mesmo vazio, a camada pode ligar e mostrar um placeholder.
      layerIp4Hint.textContent = rec === 0 ? "Sem feições (placeholder no mapa)" : `${name}${fromZip}`;
    }
  }

  async function ensureIp4OnMap() {
    if (!state.map || !layerIp4Toggle?.checked) return;
    ensureInfraGeoPanes();
    if (state.ip4Layer) {
      mountDataLayerIfAllowed(state.ip4Layer, layerIp4Toggle);
      if (state.ip4Layer.bringToFront) state.ip4Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.ip4Loading) return;
    state.ip4Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/ip4");
      const feats = (data.features || []).map((f, i) => ({ ...f, _ip4Index: i }));
      data.features = feats;
      state.ip4Features = feats;
      state.ip4LayersByIndex = {};
      state.ip4ColumnKeys = [];

      const ip4Color = "#c97900";

      state.ip4Layer = L.geoJSON(data, {
        pane: state.panes?.polygons,
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createIp4PointIcon(),
            pane: state.panes?.points,
            riseOnHover: true,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          const tune = getBasemapTuning();
          if (t === "LineString" || t === "MultiLineString") {
            const w = Math.max(1.6, 2.6 + tune.lineWeightDelta);
            return { color: ip4Color, weight: w, opacity: tune.lineOpacity };
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            const w = Math.max(1.4, 2.4 + tune.lineWeightDelta);
            return { color: ip4Color, weight: w, opacity: tune.lineOpacity, fillColor: "#ffbf6a", fillOpacity: tunedFill(0.18).fillOpacity };
          }
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._ip4Index;
          if (typeof idx === "number") state.ip4LayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "ip4");
          attachQuickHover(lyr, feature, "ip4");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.ip4Layer, layerIp4Toggle);
      if (state.ip4Layer.bringToFront) state.ip4Layer.bringToFront();
      setStatus(`IP4: carregado (${feats.length} feições)`, "ok");

      // Ajuda de diagnóstico: se o shapefile vier vazio, mostra dica na UI (sem travar).
      try {
        const n = feats.length;
        if (layerIp4Hint && n === 0) layerIp4Hint.textContent = "Instalações Portuárias (sem feições no SHP)";
      } catch {
        // ignore
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("IP4: não carregado (verifique assets/IP4 ou ZIP do entregável)", "error");
      if (layerIp4Toggle) layerIp4Toggle.checked = false;
      state.ip4Layer = null;
      state.ip4Features = [];
      state.ip4LayersByIndex = {};
      state.ip4ColumnKeys = [];
    } finally {
      state.ip4Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }


  async function ensureUcEstadualOnMap() {
    if (!state.map || !layerUcEstadualToggle?.checked) return;
    ensureInfraGeoPanes();
    if (state.ucEstadualLayer) {
      mountDataLayerIfAllowed(state.ucEstadualLayer, layerUcEstadualToggle);
      if (state.ucEstadualLayer.bringToFront) state.ucEstadualLayer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.ucEstadualLoading) return;
    state.ucEstadualLoading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/uc-estadual");
      const feats = (data.features || []).map((f, i) => ({ ...f, _ucEstadualIndex: i }));
      data.features = feats;
      state.ucEstadualFeatures = feats;
      state.ucEstadualLayersByIndex = {};
      state.ucEstadualColumnKeys = [];

      state.ucEstadualLayer = L.geoJSON(data, {
        pane: state.panes?.polygons,
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createUcEstadualPointIcon(),
            interactive: true,
            riseOnHover: true,
            pane: state.panes?.points,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") return getUcEstadualLineStyle();
          if (t === "Polygon" || t === "MultiPolygon") return getUcEstadualPolygonStyle();
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._ucEstadualIndex;
          if (typeof idx === "number") state.ucEstadualLayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "uc-estadual");
          attachQuickHover(lyr, feature, "uc-estadual");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.ucEstadualLayer, layerUcEstadualToggle);
      if (state.ucEstadualLayer.bringToFront) state.ucEstadualLayer.bringToFront();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("UC Estadual: não carregado (verifique Z: e shapefile)", "error");
      if (layerUcEstadualToggle) layerUcEstadualToggle.checked = false;
      state.ucEstadualLayer = null;
      state.ucEstadualFeatures = [];
      state.ucEstadualLayersByIndex = {};
    } finally {
      state.ucEstadualLoading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensureUcMunicipalOnMap() {
    if (!state.map || !layerUcMunicipalToggle?.checked) return;
    ensureInfraGeoPanes();
    if (state.ucMunicipalLayer) {
      mountDataLayerIfAllowed(state.ucMunicipalLayer, layerUcMunicipalToggle);
      if (state.ucMunicipalLayer.bringToFront) state.ucMunicipalLayer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.ucMunicipalLoading) return;
    state.ucMunicipalLoading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/uc-municipal");
      const feats = (data.features || []).map((f, i) => ({ ...f, _ucMunicipalIndex: i }));
      data.features = feats;
      state.ucMunicipalFeatures = feats;
      state.ucMunicipalLayersByIndex = {};
      state.ucMunicipalColumnKeys = [];

      state.ucMunicipalLayer = L.geoJSON(data, {
        pane: state.panes?.polygons,
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createUcMunicipalPointIcon(),
            interactive: true,
            riseOnHover: true,
            pane: state.panes?.points,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") return getUcMunicipalLineStyle();
          if (t === "Polygon" || t === "MultiPolygon") return getUcMunicipalPolygonStyle();
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._ucMunicipalIndex;
          if (typeof idx === "number") state.ucMunicipalLayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "uc-municipal");
          attachQuickHover(lyr, feature, "uc-municipal");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.ucMunicipalLayer, layerUcMunicipalToggle);
      if (state.ucMunicipalLayer.bringToFront) state.ucMunicipalLayer.bringToFront();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("UC Municipal: não carregado (verifique assets/UC Municipal.json)", "error");
      if (layerUcMunicipalToggle) layerUcMunicipalToggle.checked = false;
      state.ucMunicipalLayer = null;
      state.ucMunicipalFeatures = [];
      state.ucMunicipalLayersByIndex = {};
    } finally {
      state.ucMunicipalLoading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensureTiAmOnMap() {
    if (!state.map || !layerTiAmToggle?.checked) return;
    ensureInfraGeoPanes();
    if (state.tiAmLayer) {
      mountDataLayerIfAllowed(state.tiAmLayer, layerTiAmToggle);
      if (state.tiAmLayer.bringToFront) state.tiAmLayer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.tiAmLoading) return;
    state.tiAmLoading = true;
    try {
      setStatus("TI AM: carregando…", "info");
      let data = null;

      // Preferência: endpoint dedicado.
      try {
        data = await fetchLayerGeoJson("/layers/ti-am");
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
      state.tiAmFeatures = feats;
      state.tiAmLayersByIndex = {};
      state.tiAmColumnKeys = [];

      state.tiAmLayer = L.geoJSON(data, {
        pane: state.panes?.polygons,
        pointToLayer(_feature, latlng) {
          return pointAsCircleMarker(latlng);
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") {
            const tune = getBasemapTuning();
            const w = Math.max(1.4, 2.2 + tune.lineWeightDelta);
            return { color: "#6ba09c", weight: w, opacity: tune.lineOpacity };
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            const tune = getBasemapTuning();
            const w = Math.max(1.2, 2.0 + tune.lineWeightDelta);
            return {
              color: "#6ba09c",
              weight: w,
              opacity: tune.lineOpacity,
              fillColor: "#bcdae8",
              fillOpacity: tunedFill(0.16).fillOpacity,
            };
          }
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._tiAmIndex;
          if (typeof idx === "number") state.tiAmLayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "ti-am");
          attachQuickHover(lyr, feature, "ti-am");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.tiAmLayer, layerTiAmToggle);
      if (state.tiAmLayer.bringToFront) state.tiAmLayer.bringToFront();
      setStatus(`TI AM: carregado (${state.tiAmFeatures.length} feições)`, "ok");
    } catch (e) {
      console.warn(e);
      const msg = String(e?.message || "");
      // Flask abort(...) pode mandar HTML; tenta extrair algo curto.
      const clean = msg
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      setStatus(
        clean ? `TI AM: não carregado — ${clean}` : "TI AM: não carregado (verifique assets/TI_AM_ATUALIZADA e o shapefile)",
        "error",
      );
      if (layerTiAmToggle) layerTiAmToggle.checked = false;
      state.tiAmLayer = null;
      state.tiAmFeatures = [];
      state.tiAmLayersByIndex = {};
    } finally {
      state.tiAmLoading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensureHidroviasAmOnMap() {
    if (!state.map || !layerHidroviasAmToggle?.checked) return;
    ensureInfraGeoPanes();
    if (state.hidroviasAmLayer) {
      mountDataLayerIfAllowed(state.hidroviasAmLayer, layerHidroviasAmToggle);
      if (state.hidroviasAmLayer.bringToFront) state.hidroviasAmLayer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.hidroviasAmLoading) return;
    state.hidroviasAmLoading = true;
    try {
      setStatus("Hidrovias AM: carregando…", "info");
      const data = await fetchLayerGeoJson("/layers/hidrovias-am");
      const feats = (data.features || []).map((f, i) => ({ ...f, _hidroviasAmIndex: i }));
      data.features = feats;
      state.hidroviasAmFeatures = feats;
      state.hidroviasAmLayersByIndex = {};
      state.hidroviasAmColumnKeys = [];

      state.hidroviasAmLayer = L.geoJSON(data, {
        pane: state.panes?.lines,
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
          if (typeof idx === "number") state.hidroviasAmLayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "hidrovias-am");
          attachQuickHover(lyr, feature, "hidrovias-am");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.hidroviasAmLayer, layerHidroviasAmToggle);
      if (state.hidroviasAmLayer.bringToFront) state.hidroviasAmLayer.bringToFront();
      setStatus(`Hidrovias AM: carregado (${state.hidroviasAmFeatures.length} feições)`, "ok");
    } catch (e) {
      console.warn(e);
      const msg = String(e?.message || "");
      const clean = msg
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      setStatus(
        clean
          ? `Hidrovias AM: não carregado — ${clean}`
          : "Hidrovias AM: não carregado (verifique assets/SNV_HIDROVIAS_AM e o shapefile)",
        "error",
      );
      if (layerHidroviasAmToggle) layerHidroviasAmToggle.checked = false;
      state.hidroviasAmLayer = null;
      state.hidroviasAmFeatures = [];
      state.hidroviasAmLayersByIndex = {};
    } finally {
      state.hidroviasAmLoading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensurePontesBr307OnMap() {
    if (!state.map || !layerPontesToggle?.checked) return;
    if (state.pontesBr307Layer) {
      mountDataLayerIfAllowed(state.pontesBr307Layer, layerPontesToggle);
      if (state.pontesBr307Layer.bringToFront) state.pontesBr307Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.pontesBr307Loading) return;
    state.pontesBr307Loading = true;
    try {
      const data = await fetchLayerGeoJson("/layers/pontes-br307");
      // Se o usuário desligou enquanto carregava, não renderiza/adiciona no mapa.
      if (!layerPontesToggle?.checked || !state.map) return;
      const rawFeatsP = data.features || [];
      const featsP = rawFeatsP.map((f, i) => ({ ...f, _pontesIndex: i }));
      data.features = featsP;
      state.pontesFeatures = featsP;
      state.pontesLayersByIndex = {};

      state.pontesBr307Layer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createPontesPointIcon("pontes"),
            interactive: true,
            riseOnHover: true,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") {
            return getPontesLineStyle();
          }
          if (t === "Polygon" || t === "MultiPolygon") {
            return getPontesPolygonStyle();
          }
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._pontesIndex;
          if (typeof idx === "number") state.pontesLayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "pontes");
          attachQuickHover(lyr, feature, "pontes");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.pontesBr307Layer, layerPontesToggle);
      if (state.pontesBr307Layer.bringToFront) state.pontesBr307Layer.bringToFront();
      if (state.totalFeaturesCount > 0) {
        setStatus(`Dados: ${state.totalFeaturesCount} feições`);
      } else {
        setStatus("Dados: pronto");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("Pontes: não carregado (verifique Z: e shapefile)", "error");
      layerPontesToggle.checked = false;
      state.pontesFeatures = [];
      state.pontesLayersByIndex = {};
    } finally {
      state.pontesBr307Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  async function ensureJazidasBr307OnMap() {
    if (!state.map || !layerJazidasToggle?.checked) return;
    if (state.jazidasBr307Layer) {
      mountDataLayerIfAllowed(state.jazidasBr307Layer, layerJazidasToggle);
      if (state.jazidasBr307Layer.bringToFront) state.jazidasBr307Layer.bringToFront();
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (state.jazidasBr307Loading) return;
    state.jazidasBr307Loading = true;
    try {
      // Usa a camada de pontos para identificação (mais fácil de ver no mapa)
      const data = await fetchLayerGeoJson("/layers/jazidas-br307/jazida-pontos");
      // Se o usuário desligou enquanto carregava, não renderiza/adiciona no mapa.
      if (!layerJazidasToggle?.checked || !state.map) return;
      const rawFeats = data.features || [];
      const feats = rawFeats.map((f, i) => ({ ...f, _jazidasIndex: i }));
      data.features = feats;
      state.jazidasFeatures = feats;
      state.jazidasLayersByIndex = {};

      state.jazidasBr307Layer = L.geoJSON(data, {
        pointToLayer(_feature, latlng) {
          return L.marker(latlng, {
            icon: createJazidasPointIcon(),
            interactive: true,
            riseOnHover: true,
          });
        },
        style(feature) {
          const t = feature?.geometry?.type;
          if (t === "LineString" || t === "MultiLineString") return getJazidasLineStyle();
          if (t === "Polygon" || t === "MultiPolygon") return getJazidasPolygonStyle();
          return {};
        },
        onEachFeature(feature, lyr) {
          const idx = feature._jazidasIndex;
          if (typeof idx === "number") state.jazidasLayersByIndex[idx] = lyr;
          setLayerIdentifyMeta(lyr, feature, "jazidas");
          attachQuickHover(lyr, feature, "jazidas");
          bindLayerIdentifyClick(lyr);
        },
      });

      mountDataLayerIfAllowed(state.jazidasBr307Layer, layerJazidasToggle);
      if (state.jazidasBr307Layer.bringToFront) state.jazidasBr307Layer.bringToFront();
      if (state.totalFeaturesCount > 0) setStatus(`Dados: ${state.totalFeaturesCount} feições`);
      else setStatus("Dados: pronto");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
      setStatus("Jazidas: não carregado (verifique Z: e shapefile)", "error");
      layerJazidasToggle.checked = false;
      state.jazidasFeatures = [];
      state.jazidasLayersByIndex = {};
    } finally {
      state.jazidasBr307Loading = false;
      afterRodoviasSublayerVisibilityChange();
    }
  }

  function buildBasemapLayers() {
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

  /** Ajusta o tema da interface para combinar com o mapa base atual. */
  function applyUiThemeForBasemap(id) {
    // Mantém o layout padrão claro para todos os mapas base, incluindo satélite.
    if (id) document.body.classList.remove("theme-satellite");
  }

  function applyThemeClass(theme) {
    const night = theme === "night";
    document.body.classList.toggle("theme-night", night);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute("aria-pressed", night ? "true" : "false");
      // Ícone: lua = ativar noturno, sol = voltar ao claro
      themeToggleBtn.textContent = night ? "☀" : "☾";
      themeToggleBtn.title = night ? "Mudar para tema claro" : "Mudar para tema noturno";
    }
  }

  function loadThemePreference() {
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

  function setThemePreference(nextTheme) {
    state.theme = nextTheme === "night" ? "night" : "light";
    applyThemeClass(state.theme);
    try {
      localStorage.setItem("infrageo.theme", state.theme);
    } catch {
      // ignore
    }
  }

  function syncBasemapRadiosToLayer(id) {
    const inputs = document.querySelectorAll('input[name="basemap-choice"]');
    if (!inputs.length) return;
    inputs.forEach((inp) => {
      const layerOk = Boolean(state.basemapLayers?.[inp.value]);
      inp.disabled = !layerOk;
      inp.checked = layerOk && inp.value === id;
    });
  }

  function closeMapBasemapPicker() {
    mapBasemapControl?.classList.remove("is-open");
    mapBasemapBtn?.setAttribute("aria-expanded", "false");
  }

  function setBasemapLayer(id) {
    const layers = state.basemapLayers;
    if (!state.map || !layers || !layers[id]) return;
    if (state.base) {
      try {
        state.map.removeLayer(state.base);
      } catch (e) {
        /* ignore */
      }
    }
    state.base = layers[id];
    state.base.addTo(state.map);
    if (state.base.bringToBack) state.base.bringToBack();
    state.currentBasemapId = id;
    applyUiThemeForBasemap(id);
    refreshLayerStylesForBasemap();
    renderLayerLegend();
    if (basemapSelect && basemapSelect.value !== id) basemapSelect.value = id;
    syncBasemapRadiosToLayer(id);
    bringLimiteEstadualToBackIfVisible();
  }

  function setupBasemapSelect() {
    if (!basemapSelect || !state.map || !state.basemapLayers) return;
    // Desabilita opções sem layer.
    Array.from(basemapSelect.options || []).forEach((opt) => {
      const id = opt.value;
      opt.disabled = !state.basemapLayers?.[id];
    });
    basemapSelect.value = state.currentBasemapId || "imagery";
    basemapSelect.addEventListener("change", () => {
      const id = basemapSelect.value;
      if (state.basemapLayers[id]) setBasemapLayer(id);
    });
    document.querySelectorAll('input[name="basemap-choice"]').forEach((inp) => {
      inp.addEventListener("change", () => {
        if (!inp.checked) return;
        const id = inp.value;
        if (state.basemapLayers[id]) setBasemapLayer(id);
        closeMapBasemapPicker();
      });
    });
    syncBasemapRadiosToLayer(state.currentBasemapId || "imagery");
  }

  function getColorForFeature(feature) {
    const key =
      feature?.id ??
      (feature?.properties && JSON.stringify(feature.properties)) ??
      String(Math.random());

    if (!featureColors.has(key)) {
      if (featureColors.size >= FEATURE_COLORS_MAX) {
        // Evita Map ilimitado: descarta entradas antigas em lote.
        const drop = Math.max(40, Math.floor(FEATURE_COLORS_MAX / 4));
        let i = 0;
        for (const k of featureColors.keys()) {
          featureColors.delete(k);
          if (++i >= drop) break;
        }
      }
      const color = colorPalette[colorIndex % colorPalette.length];
      featureColors.set(key, color);
      colorIndex += 1;
    }
    return featureColors.get(key);
  }

  function isNumericLike(value) {
    if (value === null || value === undefined) return false;
    const s = String(value).trim();
    if (!s) return false;
    const normalized = s.replace(/\./g, "").replace(",", ".");
    return !Number.isNaN(Number(normalized));
  }

  function toNumber(value) {
    const s = String(value).trim().replace(/\./g, "").replace(",", ".");
    return Number(s);
  }

  function updateTablePanelMeta({ selected = 0, visible = 0, total = 0 } = {}) {
    const legacyMeta = $("general-selection-info");
    if (legacyMeta) {
      legacyMeta.innerHTML = "";
      legacyMeta.hidden = true;
    }
  }

  function updateGeneralSelectionInfo(selectedCount) {
    updateTablePanelMeta({
      selected: selectedCount,
      visible: state.visibleFeaturesCount || state.totalFeaturesCount || 0,
      total: state.totalFeaturesCount || 0,
    });
  }

  function clearSelectedRowHighlight() {
    if (state.selectedFeatureIndex === null) return;
    const prev = document.querySelector(
      `#all-attributes-table tbody tr[data-feature-index="${state.selectedFeatureIndex}"]`
    );
    if (prev) prev.classList.remove("selected-row");
    state.selectedFeatureIndex = null;
    updateGeneralSelectionInfo(0);
  }

  function highlightRowForFeature(feature) {
    const idx = feature?._tableIndex;
    if (typeof idx !== "number") {
      clearSelectedRowHighlight();
      return;
    }
    if (!state.allFeatures || state.allFeatures.length === 0) {
      clearSelectedRowHighlight();
      return;
    }

    clearSelectedRowHighlight();
    const row = document.querySelector(
      `#all-attributes-table tbody tr[data-feature-index="${idx}"]`
    );
    if (row) {
      row.classList.add("selected-row");
      state.selectedFeatureIndex = idx;
      row.scrollIntoView({ block: "nearest" });
    }
    updateGeneralSelectionInfo(1);
  }

  function getFilteredSortedFeatures() {
    const text = normalizeSearchText(state.generalTable.filterText || "");
    let features = state.allFeatures.slice();

    if (text) {
      features = features.filter((f) => {
        return featureMatchesQuery(f?.properties, text);
      });
    }

    // Filtros por coluna (tabela geral). Cada coluna usa o nome real do campo.
    const colFilters = state.generalTable?.columnFilters || {};
    const activeCols = Object.entries(colFilters).filter(([, v]) => normalizeSearchText(v));
    if (activeCols.length) {
      features = features.filter((f) => {
        const p = f?.properties || {};
        return activeCols.every(([k, raw]) => {
          const q = normalizeSearchText(raw);
          if (!q) return true;
          const v = normalizeSearchText(p?.[k]);
          return v.includes(q);
        });
      });
    }

    const { sortKey, sortDir } = state.generalTable;
    if (sortKey) {
      const dir = sortDir === "desc" ? -1 : 1;
      features.sort((a, b) => {
        const av = a.properties?.[sortKey];
        const bv = b.properties?.[sortKey];
        const aNum = isNumericLike(av);
        const bNum = isNumericLike(bv);

        if (aNum && bNum) return (toNumber(av) - toNumber(bv)) * dir;
        const as = (av ?? "").toString();
        const bs = (bv ?? "").toString();
        return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
      });
    }

    return features;
  }

  const tableFilterDebounceTimers = new Map();

  function countActiveColumnFilters(columnFilters) {
    const cf = columnFilters || {};
    return Object.values(cf).filter((v) => normalizeSearchText(v)).length;
  }

  function buildTableMiniToolsHtml() {
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

  function syncTableFilterChrome(container, { loading = false, visible = 0, total = 0, columnFilters = {} } = {}) {
    if (!container) return;
    const statusEl = container.querySelector(".table-filter-status");
    const clearBtn = container.querySelector(".table-filter-clear");
    const table = container.querySelector("table.attributes-table");
    const activeCount = countActiveColumnFilters(columnFilters);
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

  function buildCombinedHeaderCells(keys, { sortKey, sortDir, columnFilters, headerKeyAttr = "data-key", filterableKeys = null } = {}) {
    const colFilters = columnFilters || {};
    const filterableSet = Array.isArray(filterableKeys) ? new Set(filterableKeys) : null;
    return keys
      .map((h) => {
        const indicator = sortKey === h ? (sortDir === "asc" ? "▲" : "▼") : "";
        const safe = escHtmlCell(h);
        const current = escHtmlCell(colFilters?.[h] ?? "");
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

  function getTableStateById(tableId) {
    const ensureState = (obj) => {
      if (!obj) return null;
      if (!obj.columnFilters) obj.columnFilters = {};
      return obj;
    };
    if (tableId === "all-attributes-table") return ensureState(state.generalTable);
    if (tableId === "bueiros-attributes-table") return ensureState(state.bueirosTable);
    if (tableId === "pontes-attributes-table") return ensureState(state.pontesTable);
    if (tableId === "jazidas-attributes-table") return ensureState(state.jazidasTable);
    if (tableId === "bueiros-br174-attributes-table") return ensureState(state.bueirosBr174Table);
    if (tableId === "bueiros-br230-attributes-table") return ensureState(state.bueirosBr230Table);
    if (tableId === "bueiros-br319-attributes-table") return ensureState(state.bueirosBr319Table);
    if (tableId === "prads-br174-attributes-table") return ensureState(state.pradsBr174Table);
    if (tableId === "pca-prads-br319-attributes-table") return ensureState(state.pcaPradsBr319Table);
    if (tableId === "prads-br319-attributes-table") return ensureState(state.pradsBr319Table);
    if (tableId === "pca-prads-cmm-br319-attributes-table") return ensureState(state.pcaPradsCmmBr319Table);
    if (tableId === "pontes-br319-attributes-table") return ensureState(state.pontesBr319Table);
    if (tableId === "pontes-br230-attributes-table") return ensureState(state.pontesBr230Table);
    if (tableId === "uc-estadual-attributes-table") return ensureState(state.ucEstadualTable);
    if (tableId === "uc-municipal-attributes-table") return ensureState(state.ucMunicipalTable);
    if (tableId === "hidrovias-am-attributes-table") return ensureState(state.hidroviasAmTable);
    if (tableId === "ti-am-attributes-table") return ensureState(state.tiAmTable);
    if (tableId === "ip4-attributes-table") return ensureState(state.ip4Table);
    if (tableId === "municipios-attributes-table") return ensureState(state.municipiosTable);
    if (tableId === "contract-results-attributes-table") return ensureState(state.contractResultsTable);
    if (tableId.startsWith("map-click-")) {
      const layerId = String(state.tableDataset || "");
      return ensureState(state.mapClickTables?.[layerId]?.table);
    }
    if (tableId.startsWith("br-am-") && String(state.tableDataset || "").startsWith("br-am:")) {
      const entry = state.brAmTables?.byKey?.[String(state.tableDataset)];
      return ensureState(entry?.table);
    }
    return null;
  }

  function rerenderAttributesTableById(tableId) {
    if (tableId === "all-attributes-table") renderAllAttributesTable();
    else if (tableId === "bueiros-attributes-table") renderBueirosAttributesTable(state.bueirosSelectedIndex);
    else if (tableId === "pontes-attributes-table") renderPontesAttributesTable(state.pontesSelectedIndex);
    else if (tableId === "jazidas-attributes-table") renderJazidasAttributesTable(state.jazidasSelectedIndex);
    else if (tableId === "bueiros-br174-attributes-table") renderBueirosBr174AttributesTable(state.bueirosBr174SelectedIndex);
    else if (tableId === "bueiros-br230-attributes-table") renderBueirosBr230AttributesTable(state.bueirosBr230SelectedIndex);
    else if (tableId === "bueiros-br319-attributes-table") renderBueirosBr319AttributesTable(state.bueirosBr319SelectedIndex);
    else if (tableId === "prads-br174-attributes-table") renderPradsBr174AttributesTable(state.pradsBr174SelectedIndex);
    else if (tableId === "pca-prads-br319-attributes-table") renderPcaPradsBr319AttributesTable(state.pcaPradsBr319SelectedIndex);
    else if (tableId === "prads-br319-attributes-table") renderPradsBr319AttributesTable(state.pradsBr319SelectedIndex);
    else if (tableId === "pca-prads-cmm-br319-attributes-table") renderPcaPradsCmmBr319AttributesTable(state.pcaPradsCmmBr319SelectedIndex);
    else if (tableId === "pontes-br319-attributes-table") renderPontesBr319AttributesTable(state.pontesBr319SelectedIndex);
    else if (tableId === "pontes-br230-attributes-table") renderPontesBr230AttributesTable(state.pontesBr230SelectedIndex);
    else if (tableId === "uc-estadual-attributes-table") renderUcEstadualAttributesTable(state.ucEstadualSelectedIndex);
    else if (tableId === "uc-municipal-attributes-table") renderUcMunicipalAttributesTable(state.ucMunicipalSelectedIndex);
    else if (tableId === "hidrovias-am-attributes-table") renderHidroviasAmAttributesTable(state.hidroviasAmSelectedIndex);
    else if (tableId === "ti-am-attributes-table") renderTiAmAttributesTable(state.tiAmSelectedIndex);
    else if (tableId === "ip4-attributes-table") renderIp4AttributesTable(state.ip4SelectedIndex);
    else if (tableId === "municipios-attributes-table") renderMunicipiosAttributesTable(state.municipiosSelectedIndex);
    else if (tableId === "contract-results-attributes-table") renderContractResultsAttributesTable(state.contractResultsSelectedIndex);
    else if (tableId.startsWith("map-click-") && String(state.tableDataset || "").startsWith("map-click:")) {
      renderMapClickAttributesTable(String(state.tableDataset), state.mapClickTables?.[String(state.tableDataset)]?.selectedIndex ?? null);
    }
    else if (tableId.startsWith("br-am-") && String(state.tableDataset || "").startsWith("br-am:")) {
      renderBrAmAttributesTable(String(state.tableDataset), state.brAmTables?.byKey?.[String(state.tableDataset)]?.selectedIndex ?? null);
    }
  }

  function restoreColumnFilterFocus(tableId, key, caretStart, caretEnd) {
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

  function renderAllAttributesTable() {
    // Segmentos (tabela geral): mesmo layout/formatadores das demais tabelas.
    const headers = collectColumnKeysFromFeatures(state.allFeatures);
    const features = getFilteredSortedFeatures();
    state.visibleFeaturesCount = features.length;
    const selIdx = state.selectedFeatureIndex;

    renderGenericAttributesTable({
      containerId: "all-attributes",
      tableId: "all-attributes-table",
      keys: headers,
      features,
      getIndex: (f) => f?._tableIndex,
      dataAttr: "data-feature-index",
      highlightIndex: selIdx,
      headerKeyAttr: "data-key",
      sortKey: state.generalTable.sortKey,
      sortDir: state.generalTable.sortDir,
      columnFilters: state.generalTable?.columnFilters || {},
      emptyMessage: "Nenhum registro encontrado.",
      sourceTotal: state.allFeatures.length,
    });
    updateGeneralSelectionInfo(state.selectedFeatureIndex === null ? 0 : 1);
  }

  function escHtmlCell(value) {
    if (value === null || value === undefined) return "";
    return normalizePtBrText(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Detecta blobs HTML/XML (ex.: campo DESCRIÇÃO do PRADS exportado do ArcGIS/QGIS).
   */
  function looksLikeHtmlOrXmlBlob(value) {
    const s = String(value ?? "").trim();
    if (s.length < 12) return false;
    if (/<\s*html[\s>]/i.test(s) || /<\s*head[\s>]/i.test(s) || /<\s*body[\s>]/i.test(s)) return true;
    if (/xmlns\s*:/i.test(s) || /urn:schemas-microsoft-com/i.test(s)) return true;
    if (/<\?xml[\s>]/i.test(s)) return true;
    // Tag HTML genérica com fechamento
    if (/<[a-zA-Z][\w:-]*[\s>]/.test(s) && /<\/[a-zA-Z][\w:-]*>/.test(s)) return true;
    return false;
  }

  /** Converte HTML/XML em texto legível; vazio se só sobrar lixo de markup. */
  function stripHtmlToPlainText(value) {
    let s = String(value ?? "");
    if (!s) return "";
    if (!looksLikeHtmlOrXmlBlob(s) && !/<[a-zA-Z!/?]/.test(s)) return s;
    try {
      s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
      s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
      s = s.replace(/<!--[\s\S]*?-->/g, " ");
      s = s.replace(/<[^>]+>/g, " ");
      s = s
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&#(\d+);/g, (_, n) => {
          const code = Number(n);
          return Number.isFinite(code) ? String.fromCharCode(code) : "";
        });
      s = s.replace(/\s+/g, " ").trim();
      // Sobras típicas de XSL/FO sem conteúdo útil
      if (!s || /^xmlns:/i.test(s) || /^fo:/i.test(s) || s.length < 2) return "";
      if (/^https?:\/\//i.test(s) && s.length < 12) return "";
      return s;
    } catch {
      return "";
    }
  }

  /**
   * Exibição padronizada de células da tabela de atributos (não altera o dado original no mapa/state).
   * - Remove pasta/.shp de fontes e caminhos
   * - Remove HTML/XML bruto de descrições
   * - Números decimais com 2 casas (pt-BR); inteiros sem casas
   */
  function formatAttributeDisplayValue(value, key = "") {
    if (value === null || value === undefined) return "";
    let raw = normalizePtBrText(value).trim();
    if (!raw) return "";

    const keyLow = String(key || "").toLowerCase();

    if (looksLikeHtmlOrXmlBlob(raw) || (/descri/i.test(keyLow) && /<[a-zA-Z!/?]/.test(raw))) {
      raw = stripHtmlToPlainText(raw);
      if (!raw) return "";
      if (raw.length > 280) return `${raw.slice(0, 277)}…`;
    }

    const looksLikePath =
      keyLow.includes("source") ||
      keyLow.includes("fonte") ||
      /\.shp$/i.test(raw) ||
      /[/\\]/.test(raw);
    if (looksLikePath) {
      const base = raw.replace(/\\/g, "/").split("/").filter(Boolean).pop() || raw;
      return base.replace(/\.shp$/i, "").trim() || raw;
    }

    // Códigos/IDs com letras, barra ou hífen no meio → manter texto.
    if (/[A-Za-zÀ-ÿ_/]/.test(raw) && !/^-?\d+([.,]\d+)?$/.test(raw)) {
      return raw;
    }

    if (!isNumericLike(raw)) return raw;
    const n = toNumber(raw);
    if (!Number.isFinite(n)) return raw;
    if (Number.isInteger(n)) return String(n);
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function escAttributeCell(value, key = "") {
    return escHtmlCell(formatAttributeDisplayValue(value, key));
  }


  /** Texto pesquisável somente nas colunas de contrato */
  function haystackFromContratoColumns(p) {
    if (!p || typeof p !== "object") return "";
    const keys = contractKeyCandidates(p);
    return keys
      .map((k) => normalizeSearchText(p[k]))
      .filter(Boolean)
      .join(" ");
  }

  function featureMatchesContratoColumnsQuery(props, rawQuery) {
    const q = normalizeSearchText(rawQuery);
    if (!q) return false;
    const tokens = q.split(" ").filter(Boolean);
    if (!tokens.length) return false;

    const keys = contractKeyCandidates(props);
    if (!keys.length) return false;

    for (const k of keys) {
      const nv = normalizeSearchText(props?.[k]);
      if (nv && nv === q) return true;
    }

    const hay = haystackFromContratoColumns(props);
    if (!hay) return false;
    return tokens.every((t) => hay.includes(t));
  }

  /** Texto pesquisável a partir de todas as propriedades do shapefile */
  function haystackFromProperties(p) {
    if (!p || typeof p !== "object") return "";
    // Mantém como string "normalizada" para busca sem acento/caixa.
    return Object.values(p)
      .map((v) => normalizeSearchText(v))
      .filter(Boolean)
      .join(" ");
  }

  function featureMatchesQuery(props, rawQuery) {
    const q = normalizeSearchText(rawQuery);
    if (!q) return false;
    const tokens = q.split(" ").filter(Boolean);
    if (!tokens.length) return false;

    // 1) Match exato em QUALQUER campo (sem margem de erro quando o nome é idêntico).
    for (const v of Object.values(props || {})) {
      const nv = normalizeSearchText(v);
      if (nv && nv === q) return true;
    }

    // 2) Fallback: todos os termos precisam existir no haystack (permite "Sao Gabriel" etc).
    const hay = haystackFromProperties(props);
    if (!hay) return false;
    return tokens.every((t) => hay.includes(t));
  }

  /** Ordem das camadas na pesquisa global (atributo data-search-order em .global-search). */

  async function findGlobalSearchHitInMunicipios(q) {
    // Garante que a camada de polígonos (hover) esteja carregada em memória.
    if (!state.boundaryMunicipalHoverLayer || !state.municipiosFeatures.length) {
      try {
        await attachLimiteMunicipalLayerIfNeeded();
      } catch {
        // ignore
      }
    }
    const feats = state.municipiosFeatures || [];
    if (!feats.length) return -1;

    const qq = normalizeSearchText(q);
    // Primeiro: match exato pelo nome do município (sem margem de erro).
    const idxExact = feats.findIndex((f) => normalizeSearchText(getMunicipioNomeFromProps(f?.properties)) === qq);
    if (idxExact >= 0) return idxExact;

    // Fallback: busca normalizada em qualquer atributo.
    return feats.findIndex((f) => featureMatchesQuery(f?.properties, qq));
  }

  /**
   * Deixa ligada somente uma subcamada de Rodovias (segmentos / bueiros / pontes),
   * atualiza os switches e o mapa.
   */
  async function applyOnlyRodoviasSublayer(target) {
    if (!state.map) return;
    const seg = target === "segmentos";
    const bu = target === "bueiros" && layerBueirosToggle && !layerBueirosToggle.disabled;
    const po = target === "pontes" && layerPontesToggle && !layerPontesToggle.disabled;
    const ja = target === "jazidas" && layerJazidasToggle && !layerJazidasToggle.disabled;

    if (layerSegmentosToggle) layerSegmentosToggle.checked = seg;
    if (layerBueirosToggle) layerBueirosToggle.checked = bu;
    if (layerPontesToggle) layerPontesToggle.checked = po;
    if (layerJazidasToggle) layerJazidasToggle.checked = ja;

    if (state.geojsonLayer && state.map.hasLayer(state.geojsonLayer)) {
      state.map.removeLayer(state.geojsonLayer);
    }
    if (state.bueirosLayer && state.map.hasLayer(state.bueirosLayer)) {
      state.map.removeLayer(state.bueirosLayer);
    }
    if (state.pontesBr307Layer && state.map.hasLayer(state.pontesBr307Layer)) {
      state.map.removeLayer(state.pontesBr307Layer);
    }
    if (state.jazidasBr307Layer && state.map.hasLayer(state.jazidasBr307Layer)) {
      state.map.removeLayer(state.jazidasBr307Layer);
    }

    if (seg && state.geojsonLayer) {
      // Segmentos BR-319 removido do mapa.
      afterRodoviasSublayerVisibilityChange();
      return;
    }
    if (bu) {
      await ensureBueirosBr317OnMap();
      return;
    }
    if (po) {
      await ensurePontesBr307OnMap();
      return;
    }
    if (ja) {
      await ensureJazidasBr307OnMap();
      return;
    }
    afterRodoviasSublayerVisibilityChange();
  }

  /** Índice da feição nas jazidas (usa dados em memória ou busca na API). */

  /** Índice da feição nos bueiros (usa dados em memória ou busca na API). */

  /** Índice da feição nas pontes (usa dados em memória ou busca na API). */

  function getFilteredSortedBueirosFeatures() {
    const text = normalizeSearchText(state.bueirosTable.filterText || "");
    let features = state.bueirosFeatures.slice();
    if (text) {
      features = features.filter((f) => featureMatchesQuery(f?.properties, text));
    }

    // Filtros por coluna (bueiros BR-317)
    const colFilters = state.bueirosTable?.columnFilters || {};
    const activeCols = Object.entries(colFilters).filter(([, v]) => normalizeSearchText(v));
    if (activeCols.length) {
      features = features.filter((f) => {
        const p = f?.properties || {};
        return activeCols.every(([k, raw]) => {
          const q = normalizeSearchText(raw);
          if (!q) return true;
          const v = normalizeSearchText(p?.[k]);
          return v.includes(q);
        });
      });
    }

    const { sortKey, sortDir } = state.bueirosTable;
    if (sortKey) {
      const dir = sortDir === "desc" ? -1 : 1;
      features.sort((a, b) => {
        const av = a.properties?.[sortKey];
        const bv = b.properties?.[sortKey];
        const aNum = isNumericLike(av);
        const bNum = isNumericLike(bv);
        if (aNum && bNum) return (toNumber(av) - toNumber(bv)) * dir;
        const as = (av ?? "").toString();
        const bs = (bv ?? "").toString();
        return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
      });
    }
    return features;
  }

  function updateBueirosTableSelectionInfo(visibleCount, totalCount, highlightIndex) {
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: visibleCount,
      total: totalCount,
    });
  }

  function updatePontesTableSelectionInfo(visibleCount, totalCount, highlightIndex) {
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: visibleCount,
      total: totalCount,
    });
  }

  function updateJazidasTableSelectionInfo(visibleCount, totalCount, highlightIndex) {
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: visibleCount,
      total: totalCount,
    });
  }

  function getPanelTableLabel() {
    if (state.tableDataset === "contract-results") return "Resultado do contrato";
    if (String(state.tableDataset || "").startsWith("br-am:")) {
      const id = brAmIdFromLayerKey(state.tableDataset);
      const name = normalizeBrAmDisplayName(getBrAmNameById(id) || "");
      return name ? `BR-AM · ${name}` : "BR-AM";
    }
    if (state.tableDataset === "bueiros") return "Bueiros BR-317";
    if (state.tableDataset === "bueiros-br174") return "Bueiros BR-174";
    if (state.tableDataset === "bueiros-br230") return "Bueiros BR-230";
    if (state.tableDataset === "bueiros-br319") return "Bueiros BR-319";
    if (state.tableDataset === "pontes") return "Pontes BR-307";
    if (state.tableDataset === "jazidas") return "Jazidas BR-307";
    if (state.tableDataset === "prads-br174") return "PRADS BR-174";
    if (state.tableDataset === "pca-prads-br319") return "PCA - PRADS BR-319";
    if (state.tableDataset === "prads-br319") return "PRADS BR-319";
    if (state.tableDataset === "pca-prads-cmm-br319") return "PCA - PRADS CMM BR-319";
    if (state.tableDataset === "pontes-br319") return "Pontes BR-319";
    if (state.tableDataset === "pontes-br230") return "Pontes BR-230";
    if (state.tableDataset === "uc-estadual") return "UC estadual";
    if (state.tableDataset === "uc-municipal") return "UC municipal";
    if (state.tableDataset === "hidrovias-am") return "Hidrovias AM";
    if (state.tableDataset === "ip4") return "IP4";
    if (state.tableDataset === "ti-am") return "TI AM";
    if (state.tableDataset === "municipios") return "Municípios (AM)";
    if (String(state.tableDataset || "").startsWith("map-click:")) {
      const kind = String(state.tableDataset).slice("map-click:".length);
      return getSelectionKindLayerLabel(kind);
    }
    return "Rodovias";
  }

  function refreshPanelTableTitle() {
    const label = $("panel-table-label");
    if (!label) return;
    label.textContent = getPanelTableLabel();
  }

  function syncGeneralFilterPlaceholder() {
    if (!generalFilterInput) return;
    const ds = String(state.tableDataset || "");
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
      generalFilterInput.placeholder = "Filtrar pela tabela BR-AM (qualquer coluna)…";
      return;
    }
    generalFilterInput.placeholder = map[ds] || "Filtrar pela tabela de segmentos (qualquer coluna)…";
  }

  function syncGeneralFilterValue() {
    if (!generalFilterInput) return;
    const ds = String(state.tableDataset || "");
    if (ds === "contract-results") {
      generalFilterInput.value = state.contractResultsTable.filterText;
      return;
    }
    if (ds.startsWith("br-am:")) {
      generalFilterInput.value = state.brAmTables?.byKey?.[ds]?.table?.filterText || "";
      return;
    }
    const tables = {
      bueiros: state.bueirosTable,
      "bueiros-br174": state.bueirosBr174Table,
      "bueiros-br230": state.bueirosBr230Table,
      "bueiros-br319": state.bueirosBr319Table,
      pontes: state.pontesTable,
      jazidas: state.jazidasTable,
      "prads-br174": state.pradsBr174Table,
      "pca-prads-br319": state.pcaPradsBr319Table,
      "prads-br319": state.pradsBr319Table,
      "pca-prads-cmm-br319": state.pcaPradsCmmBr319Table,
      "pontes-br319": state.pontesBr319Table,
      "pontes-br230": state.pontesBr230Table,
      "uc-estadual": state.ucEstadualTable,
      "uc-municipal": state.ucMunicipalTable,
      "hidrovias-am": state.hidroviasAmTable,
      ip4: state.ip4Table,
      municipios: state.municipiosTable,
      "ti-am": state.tiAmTable,
    };
    generalFilterInput.value = tables[ds]?.filterText || state.generalTable.filterText;
  }

  function clearBueirosRowHighlight() {
    document.querySelectorAll("#bueiros-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.bueirosSelectedIndex = null;
  }

  function clearBueirosBr174RowHighlight() {
    document.querySelectorAll("#bueiros-br174-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.bueirosBr174SelectedIndex = null;
  }

  function clearPontesRowHighlight() {
    document.querySelectorAll("#pontes-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.pontesSelectedIndex = null;
  }

  function clearJazidasRowHighlight() {
    document.querySelectorAll("#jazidas-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.jazidasSelectedIndex = null;
  }

  function clearContractResultsRowHighlight() {
    document.querySelectorAll("#contract-results-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.contractResultsSelectedIndex = null;
  }

  function clearPradsBr174RowHighlight() {
    document.querySelectorAll("#prads-br174-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.pradsBr174SelectedIndex = null;
  }

  function clearPcaPradsBr319RowHighlight() {
    document.querySelectorAll("#pca-prads-br319-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.pcaPradsBr319SelectedIndex = null;
  }
  function clearPradsBr319RowHighlight() {
    document.querySelectorAll("#prads-br319-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.pradsBr319SelectedIndex = null;
  }
  function clearPcaPradsCmmBr319RowHighlight() {
    document.querySelectorAll("#pca-prads-cmm-br319-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.pcaPradsCmmBr319SelectedIndex = null;
  }


  function clearPontesBr319RowHighlight() {
    document.querySelectorAll("#pontes-br319-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.pontesBr319SelectedIndex = null;
  }

  function clearPontesBr230RowHighlight() {
    document.querySelectorAll("#pontes-br230-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.pontesBr230SelectedIndex = null;
  }


  function clearUcEstadualRowHighlight() {
    document.querySelectorAll("#uc-estadual-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.ucEstadualSelectedIndex = null;
  }

  function clearUcMunicipalRowHighlight() {
    document.querySelectorAll("#uc-municipal-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.ucMunicipalSelectedIndex = null;
  }

  function clearTiAmRowHighlight() {
    document.querySelectorAll("#ti-am-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.tiAmSelectedIndex = null;
  }

  function clearHidroviasAmRowHighlight() {
    document.querySelectorAll("#hidrovias-am-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.hidroviasAmSelectedIndex = null;
  }

  function clearIp4RowHighlight() {
    document.querySelectorAll("#ip4-attributes-table tbody tr.selected-row").forEach((r) => {
      r.classList.remove("selected-row");
    });
    state.ip4SelectedIndex = null;
  }

  /** Campos internos do sistema — não fazem parte dos atributos do SHP. */
  function isSyntheticAttributeKey(key) {
    const k = String(key || "");
    if (!k) return true;
    const low = k.toLowerCase();
    if (low === "__source" || low === "_source" || low === "_note" || low === "source") return true;
    if (low.startsWith("__")) return true;
    return false;
  }

  function collectColumnKeysFromFeatures(features) {
    const keySet = new Set();
    (features || []).forEach((f) => {
      const p = f?.properties;
      if (!p || typeof p !== "object") return;
      Object.keys(p).forEach((k) => {
        if (isSyntheticAttributeKey(k)) return;
        keySet.add(k);
      });
    });
    return Array.from(keySet).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  }

  function collectAllColumnKeysFromFeatures(features) {
    return collectColumnKeysFromFeatures(features);
  }

  function getFilteredSortedPontesFeatures() {
    const text = normalizeSearchText(state.pontesTable.filterText || "");
    let features = state.pontesFeatures.slice();
    if (text) features = features.filter((f) => featureMatchesQuery(f?.properties, text));

    // Filtros por coluna (pontes BR-307)
    const colFilters = state.pontesTable?.columnFilters || {};
    const activeCols = Object.entries(colFilters).filter(([, v]) => normalizeSearchText(v));
    if (activeCols.length) {
      features = features.filter((f) => {
        const p = f?.properties || {};
        return activeCols.every(([k, raw]) => {
          const q = normalizeSearchText(raw);
          if (!q) return true;
          const v = normalizeSearchText(p?.[k]);
          return v.includes(q);
        });
      });
    }

    const { sortKey, sortDir } = state.pontesTable;
    if (sortKey) {
      const dir = sortDir === "desc" ? -1 : 1;
      features.sort((a, b) => {
        const av = a.properties?.[sortKey];
        const bv = b.properties?.[sortKey];
        const aNum = isNumericLike(av);
        const bNum = isNumericLike(bv);
        if (aNum && bNum) return (toNumber(av) - toNumber(bv)) * dir;
        const as = (av ?? "").toString();
        const bs = (bv ?? "").toString();
        return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
      });
    }
    return features;
  }

  function getFilteredSortedJazidasFeatures() {
    const text = normalizeSearchText(state.jazidasTable.filterText || "");
    let features = state.jazidasFeatures.slice();
    if (text) features = features.filter((f) => featureMatchesQuery(f?.properties, text));

    // Filtros por coluna (jazidas BR-307)
    const colFilters = state.jazidasTable?.columnFilters || {};
    const activeCols = Object.entries(colFilters).filter(([, v]) => normalizeSearchText(v));
    if (activeCols.length) {
      features = features.filter((f) => {
        const p = f?.properties || {};
        return activeCols.every(([k, raw]) => {
          const q = normalizeSearchText(raw);
          if (!q) return true;
          const v = normalizeSearchText(p?.[k]);
          return v.includes(q);
        });
      });
    }

    const { sortKey, sortDir } = state.jazidasTable;
    if (sortKey) {
      const dir = sortDir === "desc" ? -1 : 1;
      features.sort((a, b) => {
        const av = a.properties?.[sortKey];
        const bv = b.properties?.[sortKey];
        const aNum = isNumericLike(av);
        const bNum = isNumericLike(bv);
        if (aNum && bNum) return (toNumber(av) - toNumber(bv)) * dir;
        const as = (av ?? "").toString();
        const bs = (bv ?? "").toString();
        return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
      });
    }
    return features;
  }

  function getFilteredSortedGenericFeatures(featuresIn, tableState, options = {}) {
    const text = normalizeSearchText(tableState?.filterText || "");
    let features = (featuresIn || []).slice();
    // Filtro global por contrato também precisa afetar a tabela (não só o mapa/popup).
    // Município: só no mapa — a tabela do SHP mantém todos os registros/colunas originais.
    if (normalizeContractKey(state.contractFilter)) {
      features = features.filter((f) => featureMatchesContract(f));
    }
    if (text) {
      const matchFn = options.contractColumnsOnly ? featureMatchesContratoColumnsQuery : featureMatchesQuery;
      features = features.filter((f) => matchFn(f?.properties, text));
    }

    // Filtros por coluna (genérico): aplica somente às chaves existentes.
    const colFilters = tableState?.columnFilters || {};
    const activeCols = Object.entries(colFilters).filter(([, v]) => normalizeSearchText(v));
    if (activeCols.length) {
      features = features.filter((f) => {
        const p = f?.properties || {};
        return activeCols.every(([k, raw]) => {
          const q = normalizeSearchText(raw);
          if (!q) return true;
          const v = normalizeSearchText(p?.[k]);
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
        const aNum = isNumericLike(av);
        const bNum = isNumericLike(bv);
        if (aNum && bNum) return (toNumber(av) - toNumber(bv)) * dir;
        const as = (av ?? "").toString();
        const bs = (bv ?? "").toString();
        return as.localeCompare(bs, "pt-BR", { sensitivity: "base" }) * dir;
      });
    }
    return features;
  }

  function renderGenericAttributesTable({
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
    const container = $(containerId);
    if (!container) return;
    keys = (keys || []).filter((k) => !isSyntheticAttributeKey(k));
    const colFilters = columnFilters || {};
    const headerRow = buildCombinedHeaderCells(keys, {
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
            const numClass = isNumericLike(raw) && !/[A-Za-zÀ-ÿ_/]/.test(String(raw ?? ""))
              ? ' class="is-num"'
              : "";
            return `<td${numClass}>${escAttributeCell(raw, h)}</td>`;
          })
          .join("");
        const rowClass = idx === highlightIndex ? "selected-row" : "";
        return `<tr ${dataAttr}="${idx}" class="${rowClass}">${cells}</tr>`;
      })
      .join("");

    if (!keys.length) {
      container.innerHTML = `<div class="panel-body panel-body--muted">${escHtmlCell(emptyMessage)}</div>`;
      return { visible: 0, total: 0 };
    }

    container.innerHTML = `
      ${buildTableMiniToolsHtml()}
      <table class="attributes-table attributes-table--filled" id="${tableId}">
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;

    syncTableFilterChrome(container, {
      visible,
      total,
      columnFilters: colFilters,
    });

    return { visible, total };
  }

  function pruneNonContratoColumnFilters(columnFilters, keys) {
    const cf = columnFilters || {};
    const allowed = new Set((keys || []).filter(isContratoColumnKey));
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

  function renderContractResultsAttributesTable(highlightIndex) {
    const keys =
      state.contractResultsColumnKeys.length > 0
        ? state.contractResultsColumnKeys
        : collectColumnKeysFromFeatures(state.contractResultsFeatures);
    if (!state.contractResultsColumnKeys.length && keys.length) state.contractResultsColumnKeys = keys;
    state.contractResultsSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const contratoFilterKeys = keys.filter(isContratoColumnKey);
    pruneNonContratoColumnFilters(state.contractResultsTable?.columnFilters, keys);

    const feats = getFilteredSortedGenericFeatures(state.contractResultsFeatures, state.contractResultsTable, {
      contractColumnsOnly: true,
    });
    const res = renderGenericAttributesTable({
      tableId: "contract-results-attributes-table",
      keys: state.contractResultsColumnKeys,
      features: feats,
      getIndex: (f) => f?._contractResultsIndex,
      dataAttr: "data-contract-results-index",
      highlightIndex,
      headerKeyAttr: "data-contract-results-key",
      sortKey: state.contractResultsTable.sortKey,
      sortDir: state.contractResultsTable.sortDir,
      columnFilters: state.contractResultsTable?.columnFilters,
      emptyMessage: "Sem resultados para este contrato.",
      filterableKeys: contratoFilterKeys,
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.contractResultsFeatures.length,
    });
  }

  function renderBrAmAttributesTable(layerKey, highlightIndex) {
    const id = brAmIdFromLayerKey(layerKey);
    const entry = state.brAmTables?.byKey?.[layerKey];
    if (!entry) return;

    const keys =
      entry.columnKeys && entry.columnKeys.length > 0 ? entry.columnKeys : collectColumnKeysFromFeatures(entry.features);
    if ((!entry.columnKeys || !entry.columnKeys.length) && keys.length) entry.columnKeys = keys;
    entry.selectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(entry.features, entry.table || { sortKey: null, sortDir: "asc", filterText: "" });
    const res = renderGenericAttributesTable({
      tableId: `br-am-${id}-attributes-table`,
      keys: entry.columnKeys || [],
      features: feats,
      getIndex: (f) => f?._brAmIndex,
      dataAttr: "data-br-am-index",
      highlightIndex,
      headerKeyAttr: "data-br-am-key",
      sortKey: entry.table?.sortKey,
      sortDir: entry.table?.sortDir,
      columnFilters: entry.table?.columnFilters,
      emptyMessage: "Nenhuma feição carregada para esta camada BR-AM.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: entry.features.length,
    });
  }

  function renderBueirosAttributesTable(highlightIndex) {
    const keys =
      state.bueirosColumnKeys.length > 0 ? state.bueirosColumnKeys : collectBueirosColumnKeys(state.bueirosFeatures);
    if (!state.bueirosColumnKeys.length && keys.length) state.bueirosColumnKeys = keys;
    state.bueirosSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedBueirosFeatures();
    const res = renderGenericAttributesTable({
      tableId: "bueiros-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._bueirosIndex,
      dataAttr: "data-bueiros-index",
      highlightIndex,
      headerKeyAttr: "data-bueiros-key",
      sortKey: state.bueirosTable.sortKey,
      sortDir: state.bueirosTable.sortDir,
      columnFilters: state.bueirosTable?.columnFilters,
      emptyMessage: "Nenhuma feição de bueiros carregada.",
    });
    updateBueirosTableSelectionInfo(res.visible, state.bueirosFeatures.length, highlightIndex);
  }

  function renderPontesAttributesTable(highlightIndex) {
    const keys =
      state.pontesColumnKeys.length > 0 ? state.pontesColumnKeys : collectColumnKeysFromFeatures(state.pontesFeatures);
    if (!state.pontesColumnKeys.length && keys.length) state.pontesColumnKeys = keys;
    state.pontesSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedPontesFeatures();
    const res = renderGenericAttributesTable({
      tableId: "pontes-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._pontesIndex,
      dataAttr: "data-pontes-index",
      highlightIndex,
      headerKeyAttr: "data-pontes-key",
      sortKey: state.pontesTable.sortKey,
      sortDir: state.pontesTable.sortDir,
      columnFilters: state.pontesTable?.columnFilters,
      emptyMessage: "Nenhuma feição de pontes carregada.",
    });
    updatePontesTableSelectionInfo(res.visible, state.pontesFeatures.length, highlightIndex);
  }

  function renderJazidasAttributesTable(highlightIndex) {
    const keys =
      state.jazidasColumnKeys.length > 0 ? state.jazidasColumnKeys : collectColumnKeysFromFeatures(state.jazidasFeatures);
    if (!state.jazidasColumnKeys.length && keys.length) state.jazidasColumnKeys = keys;
    state.jazidasSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedJazidasFeatures();
    const res = renderGenericAttributesTable({
      tableId: "jazidas-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._jazidasIndex,
      dataAttr: "data-jazidas-index",
      highlightIndex,
      headerKeyAttr: "data-jazidas-key",
      sortKey: state.jazidasTable.sortKey,
      sortDir: state.jazidasTable.sortDir,
      columnFilters: state.jazidasTable?.columnFilters,
      emptyMessage: "Nenhuma feição de jazidas carregada.",
    });
    updateJazidasTableSelectionInfo(res.visible, state.jazidasFeatures.length, highlightIndex);
  }

  function renderBueirosBr174AttributesTable(highlightIndex) {
    const keys =
      state.bueirosBr174ColumnKeys.length > 0
        ? state.bueirosBr174ColumnKeys
        : collectColumnKeysFromFeatures(state.bueirosBr174Features);
    if (!state.bueirosBr174ColumnKeys.length && keys.length) state.bueirosBr174ColumnKeys = keys;
    state.bueirosBr174SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.bueirosBr174Features, state.bueirosBr174Table);
    const res = renderGenericAttributesTable({
      tableId: "bueiros-br174-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._bueirosBr174Index,
      dataAttr: "data-bueiros-br174-index",
      highlightIndex,
      headerKeyAttr: 'data-bueiros-br174-key',
      sortKey: state.bueirosBr174Table.sortKey,
      sortDir: state.bueirosBr174Table.sortDir,
      columnFilters: state.bueirosBr174Table?.columnFilters,
      emptyMessage: "Nenhuma feição de bueiros BR-174 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.bueirosBr174Features.length,
    });
  }

  function renderPradsBr174AttributesTable(highlightIndex) {
    const keys =
      state.pradsBr174ColumnKeys.length > 0
        ? state.pradsBr174ColumnKeys
        : collectColumnKeysFromFeatures(state.pradsBr174Features);
    if (!state.pradsBr174ColumnKeys.length && keys.length) state.pradsBr174ColumnKeys = keys;
    state.pradsBr174SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.pradsBr174Features, state.pradsBr174Table);
    const res = renderGenericAttributesTable({
      tableId: "prads-br174-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._pradsBr174Index,
      dataAttr: "data-prads-br174-index",
      highlightIndex,
      headerKeyAttr: 'data-prads-br174-key',
      sortKey: state.pradsBr174Table.sortKey,
      sortDir: state.pradsBr174Table.sortDir,
      columnFilters: state.pradsBr174Table?.columnFilters,
      emptyMessage: "Nenhuma feição de PRADS BR-174 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.pradsBr174Features.length,
    });
  }

  function renderPcaPradsBr319AttributesTable(highlightIndex) {
    const keys =
      state.pcaPradsBr319ColumnKeys.length > 0
        ? state.pcaPradsBr319ColumnKeys
        : collectColumnKeysFromFeatures(state.pcaPradsBr319Features);
    if (!state.pcaPradsBr319ColumnKeys.length && keys.length) state.pcaPradsBr319ColumnKeys = keys;
    state.pcaPradsBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.pcaPradsBr319Features, state.pcaPradsBr319Table);
    const res = renderGenericAttributesTable({
      tableId: "pca-prads-br319-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._pcaPradsBr319Index,
      dataAttr: "data-pca-prads-br319-index",
      highlightIndex,
      headerKeyAttr: 'data-pca-prads-br319-key',
      sortKey: state.pcaPradsBr319Table.sortKey,
      sortDir: state.pcaPradsBr319Table.sortDir,
      columnFilters: state.pcaPradsBr319Table?.columnFilters,
      emptyMessage: "Nenhuma feição de PCA - PRADS BR-319 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.pcaPradsBr319Features.length,
    });
  }
  function renderPradsBr319AttributesTable(highlightIndex) {
    const keys =
      state.pradsBr319ColumnKeys.length > 0
        ? state.pradsBr319ColumnKeys
        : collectColumnKeysFromFeatures(state.pradsBr319Features);
    if (!state.pradsBr319ColumnKeys.length && keys.length) state.pradsBr319ColumnKeys = keys;
    state.pradsBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.pradsBr319Features, state.pradsBr319Table);
    const res = renderGenericAttributesTable({
      tableId: "prads-br319-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._pradsBr319Index,
      dataAttr: "data-prads-br319-index",
      highlightIndex,
      headerKeyAttr: 'data-prads-br319-key',
      sortKey: state.pradsBr319Table.sortKey,
      sortDir: state.pradsBr319Table.sortDir,
      columnFilters: state.pradsBr319Table?.columnFilters,
      emptyMessage: "Nenhuma feição de PRADS BR-319 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.pradsBr319Features.length,
    });
  }
  function renderPcaPradsCmmBr319AttributesTable(highlightIndex) {
    const keys =
      state.pcaPradsCmmBr319ColumnKeys.length > 0
        ? state.pcaPradsCmmBr319ColumnKeys
        : collectColumnKeysFromFeatures(state.pcaPradsCmmBr319Features);
    if (!state.pcaPradsCmmBr319ColumnKeys.length && keys.length) state.pcaPradsCmmBr319ColumnKeys = keys;
    state.pcaPradsCmmBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.pcaPradsCmmBr319Features, state.pcaPradsCmmBr319Table);
    const res = renderGenericAttributesTable({
      tableId: "pca-prads-cmm-br319-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._pcaPradsCmmBr319Index,
      dataAttr: "data-pca-prads-cmm-br319-index",
      highlightIndex,
      headerKeyAttr: 'data-pca-prads-cmm-br319-key',
      sortKey: state.pcaPradsCmmBr319Table.sortKey,
      sortDir: state.pcaPradsCmmBr319Table.sortDir,
      columnFilters: state.pcaPradsCmmBr319Table?.columnFilters,
      emptyMessage: "Nenhuma feição de PCA - PRADS CMM BR-319 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.pcaPradsCmmBr319Features.length,
    });
  }


  function renderBueirosBr230AttributesTable(highlightIndex) {
    const keys =
      state.bueirosBr230ColumnKeys.length > 0
        ? state.bueirosBr230ColumnKeys
        : collectColumnKeysFromFeatures(state.bueirosBr230Features);
    if (!state.bueirosBr230ColumnKeys.length && keys.length) state.bueirosBr230ColumnKeys = keys;
    state.bueirosBr230SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.bueirosBr230Features, state.bueirosBr230Table);
    const res = renderGenericAttributesTable({
      tableId: "bueiros-br230-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._bueirosBr230Index,
      dataAttr: "data-bueiros-br230-index",
      highlightIndex,
      headerKeyAttr: "data-bueiros-br230-key",
      sortKey: state.bueirosBr230Table.sortKey,
      sortDir: state.bueirosBr230Table.sortDir,
      columnFilters: state.bueirosBr230Table?.columnFilters,
      emptyMessage: "Nenhuma feição de bueiros BR-230 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.bueirosBr230Features.length,
    });
  }

  function renderBueirosBr319AttributesTable(highlightIndex) {
    const keys =
      state.bueirosBr319ColumnKeys.length > 0
        ? state.bueirosBr319ColumnKeys
        : collectColumnKeysFromFeatures(state.bueirosBr319Features);
    if (!state.bueirosBr319ColumnKeys.length && keys.length) state.bueirosBr319ColumnKeys = keys;
    state.bueirosBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.bueirosBr319Features, state.bueirosBr319Table);
    const res = renderGenericAttributesTable({
      tableId: "bueiros-br319-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._bueirosBr319Index,
      dataAttr: "data-bueiros-br319-index",
      highlightIndex,
      headerKeyAttr: "data-bueiros-br319-key",
      sortKey: state.bueirosBr319Table.sortKey,
      sortDir: state.bueirosBr319Table.sortDir,
      columnFilters: state.bueirosBr319Table?.columnFilters,
      emptyMessage: "Nenhuma feição de bueiros BR-319 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.bueirosBr319Features.length,
    });
  }


  function renderPontesBr319AttributesTable(highlightIndex) {
    const keys =
      state.pontesBr319ColumnKeys.length > 0
        ? state.pontesBr319ColumnKeys
        : collectColumnKeysFromFeatures(state.pontesBr319Features);
    if (!state.pontesBr319ColumnKeys.length && keys.length) state.pontesBr319ColumnKeys = keys;
    state.pontesBr319SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.pontesBr319Features, state.pontesBr319Table);
    const res = renderGenericAttributesTable({
      tableId: "pontes-br319-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._pontesBr319Index,
      dataAttr: "data-pontes-br319-index",
      highlightIndex,
      headerKeyAttr: "data-pontes-br319-key",
      sortKey: state.pontesBr319Table.sortKey,
      sortDir: state.pontesBr319Table.sortDir,
      columnFilters: state.pontesBr319Table?.columnFilters,
      emptyMessage: "Nenhuma feição de pontes BR-319 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.pontesBr319Features.length,
    });
  }

  function renderPontesBr230AttributesTable(highlightIndex) {
    const keys =
      state.pontesBr230ColumnKeys.length > 0
        ? state.pontesBr230ColumnKeys
        : collectColumnKeysFromFeatures(state.pontesBr230Features);
    if (!state.pontesBr230ColumnKeys.length && keys.length) state.pontesBr230ColumnKeys = keys;
    state.pontesBr230SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.pontesBr230Features, state.pontesBr230Table);
    const res = renderGenericAttributesTable({
      tableId: "pontes-br230-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._pontesBr230Index,
      dataAttr: "data-pontes-br230-index",
      highlightIndex,
      headerKeyAttr: "data-pontes-br230-key",
      sortKey: state.pontesBr230Table.sortKey,
      sortDir: state.pontesBr230Table.sortDir,
      columnFilters: state.pontesBr230Table?.columnFilters,
      emptyMessage: "Nenhuma feição de pontes BR-230 carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.pontesBr230Features.length,
    });
  }


  function renderUcEstadualAttributesTable(highlightIndex) {
    const keys =
      state.ucEstadualColumnKeys.length > 0 ? state.ucEstadualColumnKeys : collectColumnKeysFromFeatures(state.ucEstadualFeatures);
    if (!state.ucEstadualColumnKeys.length && keys.length) state.ucEstadualColumnKeys = keys;
    state.ucEstadualSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.ucEstadualFeatures, state.ucEstadualTable);
    const res = renderGenericAttributesTable({
      tableId: "uc-estadual-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._ucEstadualIndex,
      dataAttr: "data-uc-estadual-index",
      highlightIndex,
      headerKeyAttr: "data-uc-estadual-key",
      sortKey: state.ucEstadualTable.sortKey,
      sortDir: state.ucEstadualTable.sortDir,
      columnFilters: state.ucEstadualTable?.columnFilters,
      emptyMessage: "Nenhuma feição de UC Estadual carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.ucEstadualFeatures.length,
    });
  }

  function renderUcMunicipalAttributesTable(highlightIndex) {
    const keys =
      state.ucMunicipalColumnKeys.length > 0 ? state.ucMunicipalColumnKeys : collectColumnKeysFromFeatures(state.ucMunicipalFeatures);
    if (!state.ucMunicipalColumnKeys.length && keys.length) state.ucMunicipalColumnKeys = keys;
    state.ucMunicipalSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.ucMunicipalFeatures, state.ucMunicipalTable);
    const res = renderGenericAttributesTable({
      tableId: "uc-municipal-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._ucMunicipalIndex,
      dataAttr: "data-uc-municipal-index",
      highlightIndex,
      headerKeyAttr: "data-uc-municipal-key",
      sortKey: state.ucMunicipalTable.sortKey,
      sortDir: state.ucMunicipalTable.sortDir,
      columnFilters: state.ucMunicipalTable?.columnFilters,
      emptyMessage: "Nenhuma feição de UC Municipal carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.ucMunicipalFeatures.length,
    });
  }

  function renderTiAmAttributesTable(highlightIndex) {
    const keys = state.tiAmColumnKeys.length > 0 ? state.tiAmColumnKeys : collectColumnKeysFromFeatures(state.tiAmFeatures);
    if (!state.tiAmColumnKeys.length && keys.length) state.tiAmColumnKeys = keys;
    state.tiAmSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.tiAmFeatures, state.tiAmTable);
    const res = renderGenericAttributesTable({
      tableId: "ti-am-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._tiAmIndex,
      dataAttr: "data-ti-am-index",
      highlightIndex,
      headerKeyAttr: "data-ti-am-key",
      sortKey: state.tiAmTable.sortKey,
      sortDir: state.tiAmTable.sortDir,
      columnFilters: state.tiAmTable?.columnFilters,
      emptyMessage: "Nenhuma feição de TI AM carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.tiAmFeatures.length,
    });
  }

  function renderHidroviasAmAttributesTable(highlightIndex) {
    const keys =
      state.hidroviasAmColumnKeys.length > 0
        ? state.hidroviasAmColumnKeys
        : collectColumnKeysFromFeatures(state.hidroviasAmFeatures);
    if (!state.hidroviasAmColumnKeys.length && keys.length) state.hidroviasAmColumnKeys = keys;
    state.hidroviasAmSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.hidroviasAmFeatures, state.hidroviasAmTable);
    const res = renderGenericAttributesTable({
      tableId: "hidrovias-am-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._hidroviasAmIndex,
      dataAttr: "data-hidrovias-am-index",
      highlightIndex,
      headerKeyAttr: "data-hidrovias-am-key",
      sortKey: state.hidroviasAmTable.sortKey,
      sortDir: state.hidroviasAmTable.sortDir,
      columnFilters: state.hidroviasAmTable?.columnFilters,
      emptyMessage: "Nenhuma feição de Hidrovias AM carregada.",
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.hidroviasAmFeatures.length,
    });
  }

  function renderMapClickAttributesTable(layerId, highlightIndex) {
    const entry = state.mapClickTables?.[layerId];
    if (!entry) return;
    const keys =
      entry.columnKeys.length > 0 ? entry.columnKeys : collectColumnKeysFromFeatures(entry.features);
    if (!entry.columnKeys.length && keys.length) entry.columnKeys = keys;
    entry.selectedIndex = typeof highlightIndex === "number" ? highlightIndex : entry.selectedIndex;

    // Uma feição: lista compacta campo → valor (mesma ordem/regras do FEATURE_POPUP).
    if (entry.features.length === 1) {
      const feature = entry.features[0];
      const props = feature?.properties || {};
      const kind = entry.selectionKind || String(layerId).slice("map-click:".length);
      const preferred = getPreferredKeysByKind(kind) || [];
      const allKeys = Object.keys(props).filter((k) => !shouldSkipPopupKey(k));
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
          if (FEATURE_POPUP.detail.skipEmpty) {
            if (value === undefined || value === null || String(value).trim() === "") return "";
          }
          const display =
            value === undefined || value === null || String(value).trim() === ""
              ? "—"
              : formatAttributeDisplayValue(value, key);
          if (FEATURE_POPUP.detail.skipEmpty && !display) return "";
          return `<tr>
            <th scope="row">${escHtmlCell(normalizeFeatureLabel(key))}</th>
            <td>${escHtmlCell(display || "—")}</td>
          </tr>`;
        })
        .filter(Boolean)
        .join("");

      const host = $("all-attributes");
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
      updateTablePanelMeta({
        selected: 1,
        visible: 1,
        total: 1,
      });
      return;
    }

    const tableDomId = `map-click-${String(layerId).replace(/[^a-z0-9_-]+/gi, "-")}-attributes-table`;
    const feats = getFilteredSortedGenericFeatures(entry.features, entry.table);
    const res = renderGenericAttributesTable({
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
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: entry.features.length,
    });
  }

  function renderMunicipiosAttributesTable(highlightIndex) {
    const keys =
      state.municipiosColumnKeys.length > 0
        ? state.municipiosColumnKeys
        : collectColumnKeysFromFeatures(state.municipiosFeatures);
    if (!state.municipiosColumnKeys.length && keys.length) state.municipiosColumnKeys = keys;
    state.municipiosSelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.municipiosFeatures, state.municipiosTable);
    const res = renderGenericAttributesTable({
      tableId: "municipios-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._municipioIndex,
      dataAttr: "data-municipio-index",
      highlightIndex,
      headerKeyAttr: "data-municipio-key",
      sortKey: state.municipiosTable.sortKey,
      sortDir: state.municipiosTable.sortDir,
      columnFilters: state.municipiosTable?.columnFilters,
      emptyMessage: "Nenhum município carregado.",
      sourceTotal: state.municipiosFeatures.length,
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.municipiosFeatures.length,
    });
  }

  function renderIp4AttributesTable(highlightIndex) {
    // IP4: todas as colunas do SHP (sem campos sintéticos do sistema).
    let keys =
      state.ip4ColumnKeys.length > 0 ? state.ip4ColumnKeys : collectAllColumnKeysFromFeatures(state.ip4Features);
    keys = (keys || []).filter((k) => !isSyntheticAttributeKey(k));
    state.ip4ColumnKeys = keys;
    state.ip4SelectedIndex = typeof highlightIndex === "number" ? highlightIndex : null;

    const feats = getFilteredSortedGenericFeatures(state.ip4Features, state.ip4Table);
    const res = renderGenericAttributesTable({
      tableId: "ip4-attributes-table",
      keys,
      features: feats,
      getIndex: (f) => f?._ip4Index,
      dataAttr: "data-ip4-index",
      highlightIndex,
      headerKeyAttr: "data-ip4-key",
      sortKey: state.ip4Table.sortKey,
      sortDir: state.ip4Table.sortDir,
      columnFilters: state.ip4Table?.columnFilters,
      emptyMessage: "Nenhuma feição de IP4 carregada.",
      sourceTotal: state.ip4Features.length,
    });
    updateTablePanelMeta({
      selected: typeof highlightIndex === "number" ? 1 : 0,
      visible: res.visible,
      total: state.ip4Features.length,
    });
  }

  function buildContractResultsData() {
    const addHits = (kind, label, feats) => {
      const out = [];
      for (let i = 0; i < (feats || []).length; i++) {
        const f = feats[i];
        if (!featureMatchesContract(f)) continue;
        const p = f?.properties || {};
        const src = String(p.__source || p._source || "");
        const mun =
          getFirstNonEmptyValue(p, ["municipio", "nm_municipio", "municipio_", "NM_MUNICIPIO"]) ||
          getFirstNonEmptyValue(p, ["Município", "Municipio"]);
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
    forEachContractLayerSource(({ kind, label, feats }) => {
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

  async function openContractResultsTable() {
    // Tabela consolidada: resultados do contrato em todas as camadas.
    const wanted = normalizeContractKey(state.contractFilter);
    if (!wanted) return;

    state.contractResultsSelectedIndex = null;
    state.contractResultsTable.sortKey = null;
    state.contractResultsTable.sortDir = "asc";
    state.tableDataset = "contract-results";
    openBottomSheet();
    refreshPanelTableTitle();
    syncGeneralFilterPlaceholder();
    syncGeneralFilterValue();
    try {
      const host = $("all-attributes");
      if (host) {
        host.innerHTML = '<div class="panel-body panel-body--muted">Carregando resultados do contrato…</div>';
      }
      const el = $("general-selection-info");
      if (el) el.textContent = "— carregando…";
    } catch {
      // ignore
    }

    await Promise.resolve(ensureContractSourcesLoaded());
    if (normalizeContractKey(state.contractFilter) !== wanted) return;
    if (state.tableDataset !== "contract-results") return;

    const { all, mergedKeys } = buildContractResultsData();
    state.contractResultsFeatures = all;
    state.contractResultsColumnKeys = mergedKeys;

    renderContractResultsAttributesTable(state.contractResultsSelectedIndex);
  }

  async function openAttributesTableForLayer(layerId, options = {}) {
    if (!layerId) return;
    const fromMapClick = Boolean(options?.fromMapClick);
    if (!fromMapClick) clearContractSelectionOnly();
    // Abre a UI imediatamente (sem "delay") e carrega dados em seguida.
    state.tableDataset = layerId;
    openBottomSheet();
    expandBottomSheet();
    refreshPanelTableTitle();
    syncGeneralFilterPlaceholder();
    syncGeneralFilterValue();
    try {
      const host = $("all-attributes");
      if (host) {
        host.innerHTML = '<div class="panel-body panel-body--muted">Carregando tabela de atributos…</div>';
      }
      const el = $("general-selection-info");
      if (el) el.textContent = "— carregando…";
    } catch {
      // ignore
    }

    // Garante que a tabela tenha dados mesmo com a subcamada desligada
    try {
      if (String(layerId).startsWith("map-click:")) {
        rerenderTableForLayerId(layerId);
        expandBottomSheet();
        return;
      }
      if (String(layerId).startsWith("br-am:")) {
        const key = String(layerId);
        const id = brAmIdFromLayerKey(key);
        if (!id) return;

        if (!state.brAmTables) state.brAmTables = { byKey: {} };
        if (!state.brAmTables.byKey) state.brAmTables.byKey = {};
        if (!state.brAmTables.byKey[key]) {
          state.brAmTables.byKey[key] = {
            id,
            name: getBrAmNameById(id),
            features: [],
            layersByIndex: {},
            selectedIndex: null,
            columnKeys: [],
            table: { sortKey: null, sortDir: "asc", filterText: "" },
          };
        }
        const entry = state.brAmTables.byKey[key];

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
        renderBrAmAttributesTable(key, entry.selectedIndex ?? null);
        return;
      }
      if (layerId === "bueiros" && !state.bueirosFeatures.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/bueiros-br317"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosIndex: i }));
          state.bueirosFeatures = feats;
          state.bueirosLayersByIndex = state.bueirosLayersByIndex || {};
          state.bueirosColumnKeys = [];
        }
      }
      if (layerId === "bueiros-br174" && !state.bueirosBr174Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/bueiros-br174"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr174Index: i }));
          state.bueirosBr174Features = feats;
          state.bueirosBr174LayersByIndex = state.bueirosBr174LayersByIndex || {};
          state.bueirosBr174ColumnKeys = [];
        }
      }
      if (layerId === "pontes" && !state.pontesFeatures.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/pontes-br307"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _pontesIndex: i }));
          state.pontesFeatures = feats;
          state.pontesLayersByIndex = state.pontesLayersByIndex || {};
          state.pontesColumnKeys = [];
        }
      }
      if (layerId === "jazidas" && !state.jazidasFeatures.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/jazidas-br307/jazida-pontos"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _jazidasIndex: i }));
          state.jazidasFeatures = feats;
          state.jazidasLayersByIndex = state.jazidasLayersByIndex || {};
          state.jazidasColumnKeys = [];
        }
      }
      if (layerId === "prads-br174" && !state.pradsBr174Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/prads-br174"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr174Index: i }));
          state.pradsBr174Features = feats;
          state.pradsBr174LayersByIndex = state.pradsBr174LayersByIndex || {};
          state.pradsBr174ColumnKeys = [];
        }
      }
      if (layerId === "pca-prads-br319" && !state.pcaPradsBr319Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/pca-prads-br319"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsBr319Index: i }));
          state.pcaPradsBr319Features = feats;
          state.pcaPradsBr319LayersByIndex = state.pcaPradsBr319LayersByIndex || {};
          state.pcaPradsBr319ColumnKeys = [];
        }
      }
      if (layerId === "prads-br319" && !state.pradsBr319Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/prads-br319"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _pradsBr319Index: i }));
          state.pradsBr319Features = feats;
          state.pradsBr319LayersByIndex = state.pradsBr319LayersByIndex || {};
          state.pradsBr319ColumnKeys = [];
        }
      }
      if (layerId === "pca-prads-cmm-br319" && !state.pcaPradsCmmBr319Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/pca-prads-cmm-br319"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _pcaPradsCmmBr319Index: i }));
          state.pcaPradsCmmBr319Features = feats;
          state.pcaPradsCmmBr319LayersByIndex = state.pcaPradsCmmBr319LayersByIndex || {};
          state.pcaPradsCmmBr319ColumnKeys = [];
        }
      }
      if (layerId === "bueiros-br230" && !state.bueirosBr230Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/bueiros-br230"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr230Index: i }));
          state.bueirosBr230Features = feats;
          state.bueirosBr230LayersByIndex = state.bueirosBr230LayersByIndex || {};
          state.bueirosBr230ColumnKeys = [];
        }
      }
      if (layerId === "bueiros-br319" && !state.bueirosBr319Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/bueiros-br319"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _bueirosBr319Index: i }));
          state.bueirosBr319Features = feats;
          state.bueirosBr319LayersByIndex = state.bueirosBr319LayersByIndex || {};
          state.bueirosBr319ColumnKeys = [];
        }
      }
      if (layerId === "pontes-br319" && !state.pontesBr319Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/pontes-br319"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _pontesBr319Index: i }));
          state.pontesBr319Features = feats;
          state.pontesBr319LayersByIndex = state.pontesBr319LayersByIndex || {};
          state.pontesBr319ColumnKeys = [];
        }
      }
      if (layerId === "pontes-br230" && !state.pontesBr230Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/pontes-br230"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _pontesBr230Index: i }));
          state.pontesBr230Features = feats;
          state.pontesBr230LayersByIndex = state.pontesBr230LayersByIndex || {};
          state.pontesBr230ColumnKeys = [];
        }
      }

      if (layerId === "uc-estadual" && !state.ucEstadualFeatures.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/uc-estadual"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _ucEstadualIndex: i }));
          state.ucEstadualFeatures = feats;
          state.ucEstadualLayersByIndex = state.ucEstadualLayersByIndex || {};
          state.ucEstadualColumnKeys = [];
        }
      }
      if (layerId === "uc-municipal" && !state.ucMunicipalFeatures.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/uc-municipal"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _ucMunicipalIndex: i }));
          state.ucMunicipalFeatures = feats;
          state.ucMunicipalLayersByIndex = state.ucMunicipalLayersByIndex || {};
          state.ucMunicipalColumnKeys = [];
        }
      }
      if (layerId === "ti-am" && !state.tiAmFeatures.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/ti-am"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _tiAmIndex: i }));
          state.tiAmFeatures = feats;
          state.tiAmLayersByIndex = state.tiAmLayersByIndex || {};
          state.tiAmColumnKeys = [];
        }
      }
      if (layerId === "hidrovias-am" && !state.hidroviasAmFeatures.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/hidrovias-am"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _hidroviasAmIndex: i }));
          state.hidroviasAmFeatures = feats;
          state.hidroviasAmLayersByIndex = state.hidroviasAmLayersByIndex || {};
          state.hidroviasAmColumnKeys = [];
        }
      }
      if (layerId === "ip4" && !state.ip4Features.length) {
        let __layerData = null;
        try { __layerData = await fetchLayerGeoJson("/layers/ip4"); } catch {}
        if (__layerData) {
          const data = __layerData;
          const feats = (data.features || []).map((f, i) => ({ ...f, _ip4Index: i }));
          state.ip4Features = feats;
          state.ip4LayersByIndex = state.ip4LayersByIndex || {};
          state.ip4ColumnKeys = [];
        }
      }
      if (layerId === "municipios" && !state.municipiosFeatures.length) {
        await attachLimiteMunicipalLayerIfNeeded();
      }
    } catch {
      // sem dados: a renderização exibirá mensagem vazia
    }

    rerenderTableForLayerId(layerId);
    expandBottomSheet();
  }

  /** Restaura o estilo padrão de uma feição de bueiros (GeoJSON + marcador). */
  function resetBueirosFeatureStyle(layer) {
    if (!layer?.feature) return;
    applyBueirosStyleToLayer(layer);
  }

  function resetLayerVisualSelection(layer) {
    if (!layer) return;
    if (state.geojsonLayer?.hasLayer?.(layer)) {
      state.geojsonLayer.resetStyle(layer);
    } else if (state.bueirosLayer?.hasLayer?.(layer)) {
      resetBueirosFeatureStyle(layer);
    } else if (state.pontesBr307Layer?.hasLayer?.(layer)) {
      applyPontesStyleToLayer(layer);
    } else if (state.jazidasBr307Layer?.hasLayer?.(layer)) {
      applyJazidasStyleToLayer(layer);
    } else if (state.pontesBr319Layer?.hasLayer?.(layer)) {
      state.pontesBr319Layer.resetStyle(layer);
    } else if (state.ucEstadualLayer?.hasLayer?.(layer)) {
      applyUcEstadualStyleToLayer(layer);
    } else if (state.ucMunicipalLayer?.hasLayer?.(layer)) {
      applyUcMunicipalStyleToLayer(layer);
    } else if (state.bueirosBr174Layer?.hasLayer?.(layer)) {
      state.bueirosBr174Layer.resetStyle(layer);
    } else if (state.pradsBr174Layer?.hasLayer?.(layer)) {
      state.pradsBr174Layer.resetStyle(layer);
    } else if (state.pcaPradsBr319Layer?.hasLayer?.(layer)) {
    } else if (state.pradsBr319Layer?.hasLayer?.(layer)) {
      state.pcaPradsBr319Layer.resetStyle(layer);
      state.pradsBr319Layer.resetStyle(layer);
    } else if (state.pcaPradsCmmBr319Layer?.hasLayer?.(layer)) {
      state.pcaPradsCmmBr319Layer.resetStyle(layer);
    } else if (state.ip4Layer?.hasLayer?.(layer)) {
      applyIp4StyleToLayer(layer);
    }
  }

  function clearCurrentSelection() {
    if (state.highlightOverlayLayer && state.map) {
      try {
        state.map.removeLayer(state.highlightOverlayLayer);
      } catch {
        // ignore
      }
      state.highlightOverlayLayer = null;
    }
    if (state.selectedLayer) {
      resetLayerVisualSelection(state.selectedLayer);
      state.selectedLayer = null;
    }
    clearSelectedRowHighlight();
    clearBueirosRowHighlight();
    clearPontesRowHighlight();
    clearJazidasRowHighlight();
    clearBueirosBr174RowHighlight();
    clearPradsBr174RowHighlight();
    clearPcaPradsBr319RowHighlight();
    clearPradsBr319RowHighlight();
    clearPcaPradsCmmBr319RowHighlight();
    clearPontesBr319RowHighlight();
    clearPontesBr230RowHighlight();
    clearUcEstadualRowHighlight();
    clearUcMunicipalRowHighlight();
    clearTiAmRowHighlight();
    clearHidroviasAmRowHighlight();
    clearIp4RowHighlight();
    hideFeatureQuickMenu(true);
    resetPeekSelectionSummary();
    state.bueirosTableHoverPinned = false;
    state.selectedFeature = null;
    state.selectedLayer = null;
    state.lastSelectionKind = "segmentos";
    state.identify.results = [];
    state.identify.activeIndex = 0;
    syncBottomZoomButton();
  }

  function kindFromLayerToggleId(id) {
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

  /** Ao desligar uma camada, remove highlight/seleção desta camada (inclui glow amarelo). */
  function clearSelectionForTurnedOffKind(kind) {
    const k = String(kind || "");
    if (!k) return;
    const selectedKind = String(state.lastSelectionKind || "");
    let belongs = selectedKind === k;
    try {
      const group = getLayerGroupByKind(k);
      if (!belongs && group && state.selectedLayer) {
        belongs = group === state.selectedLayer || Boolean(group.hasLayer?.(state.selectedLayer));
      }
    } catch {
      // ignore
    }
    const mapClickId = `map-click:${k}`;
    const sheetForKind =
      state.tablePinnedFromMap &&
      (String(state.tableDataset || "") === mapClickId ||
        String(state.lastMapClickLayerId || "") === mapClickId ||
        String(state.tableDataset || "") === k);
    if (belongs || (state.highlightOverlayLayer && selectedKind === k) || sheetForKind) {
      clearCurrentSelection();
    }
    if (sheetForKind || (belongs && state.tablePinnedFromMap)) {
      try {
        closeBottomSheet();
      } catch {
        // ignore
      }
    }
  }

  /** Zoom imediato (sem esperar highlight/tabela) — evita sensação de atraso no 1.º clique */
  function applySelectionZoomIfNeeded(layer, selectionKind, zoomMaxFromPanel, zoomTo) {
    if (!zoomTo || !state.map || !layer?.getBounds) return;
    const b = layer.getBounds();
    if (!b?.isValid?.()) return;
    const mapCap = typeof state.map.getMaxZoom === "function" ? state.map.getMaxZoom() : 22;
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
    fitMapBoundsWithSheetPadding(b, {
      maxZoom: maxZ,
      padX: pad[0],
      padTop: pad[0],
    });
  }

  function zoomToFeatureNow(feature, layer, selectionKind, zoomMaxFromPanel) {
    if (!state.map) return;
    const mapCap = typeof state.map.getMaxZoom === "function" ? state.map.getMaxZoom() : 22;
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
    fitMapBoundsWithSheetPadding(b, {
      maxZoom: maxZ,
      padX: pad[0],
      padTop: pad[0],
    });
  }

  function selectFeature(feature, layer, options = {}) {
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
      state.bueirosTableHoverPinned = false;
    }

    // Zoom por clique no mapa usa zoomTo=true; cliques na tabela disparam zoom+minimizar ao final.
    if (layer?.getBounds) {
      applySelectionZoomIfNeeded(layer, selectionKind, zoomMaxFromPanel, zoomTo);
    } else if (zoomTo) {
      zoomToFeatureNow(feature, null, selectionKind, zoomMaxFromPanel);
    }

    if (state.highlightOverlayLayer) {
      state.map.removeLayer(state.highlightOverlayLayer);
      state.highlightOverlayLayer = null;
    }

    state.selectedFeature = feature || null;
    if (state.selectedLayer) {
      resetLayerVisualSelection(state.selectedLayer);
    }
    state.selectedLayer = layer || null;
    state.lastSelectionKind = selectionKind || "segmentos";
    syncBottomZoomButton();

    const gt = feature?.geometry?.type;
    const lineHighlightStyle = {
      color: "#ffd000",
      weight: 8,
      opacity: 1,
      fillOpacity: 0,
      className: "selected-feature",
    };
    const polyHighlightStyle = {
      color: "#f59e0b",
      weight: 3,
      fillColor: "#ffd000",
      fillOpacity: 0.35,
      className: "selected-feature",
    };

    state.highlightOverlayLayer = L.geoJSON(feature, {
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
    }).addTo(state.map);

    if (state.highlightOverlayLayer.bringToFront) state.highlightOverlayLayer.bringToFront();
    if (layer?.bringToFront) layer.bringToFront();

    if (lightHover) {
      // Mantém apenas highlight + estado de seleção (sem custo de tabelas/painéis)
      return;
    }

    // Aba "Selecionado" removida — mantém somente a tabela geral.

    // Esses datasets também precisam limpar/ressincronizar seleção de linha.
    clearTiAmRowHighlight();
    clearHidroviasAmRowHighlight();
    clearIp4RowHighlight();

    if (selectionKind === "segmentos") {
      state.tableDataset = "segmentos";
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      highlightRowForFeature(feature);
      // Se a tabela estiver aberta, mantém coerência com o dataset atual.
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderAllAttributesTable();
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "bueiros") {
      clearSelectedRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "bueiros";
      const hIdx = typeof feature._bueirosIndex === "number" ? feature._bueirosIndex : null;
      state.bueirosSelectedIndex = typeof hIdx === "number" ? hIdx : null;

      // Selecionar na tabela SEM abrir a tabela automaticamente.
      // Se o painel inferior já estiver aberto, atualiza a tabela/seleção para manter coerência.
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderBueirosAttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "pontes") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "pontes";
      const hIdx = typeof feature._pontesIndex === "number" ? feature._pontesIndex : null;
      state.pontesSelectedIndex = typeof hIdx === "number" ? hIdx : null;

      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderPontesAttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "jazidas") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "jazidas";
      const hIdx = typeof feature._jazidasIndex === "number" ? feature._jazidasIndex : null;
      state.jazidasSelectedIndex = typeof hIdx === "number" ? hIdx : null;

      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderJazidasAttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "bueiros-br174") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "bueiros-br174";
      const hIdx = typeof feature._bueirosBr174Index === "number" ? feature._bueirosBr174Index : null;
      state.bueirosBr174SelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderBueirosBr174AttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "prads-br174") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "prads-br174";
      const hIdx = typeof feature._pradsBr174Index === "number" ? feature._pradsBr174Index : null;
      state.pradsBr174SelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderPradsBr174AttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "pca-prads-br319") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "pca-prads-br319";
      const hIdx = typeof feature._pcaPradsBr319Index === "number" ? feature._pcaPradsBr319Index : null;
      state.pcaPradsBr319SelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderPcaPradsBr319AttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "prads-br319") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "prads-br319";
      const hIdx = typeof feature._pradsBr319Index === "number" ? feature._pradsBr319Index : null;
      state.pradsBr319SelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderPradsBr319AttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "pca-prads-cmm-br319") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "pca-prads-cmm-br319";
      const hIdx = typeof feature._pcaPradsCmmBr319Index === "number" ? feature._pcaPradsCmmBr319Index : null;
      state.pcaPradsCmmBr319SelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderPcaPradsCmmBr319AttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "pontes-br319") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "pontes-br319";
      const hIdx = typeof feature._pontesBr319Index === "number" ? feature._pontesBr319Index : null;
      state.pontesBr319SelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderPontesBr319AttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "uc-estadual") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "uc-estadual";
      const hIdx = typeof feature._ucEstadualIndex === "number" ? feature._ucEstadualIndex : null;
      state.ucEstadualSelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderUcEstadualAttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "uc-municipal") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      state.tableDataset = "uc-municipal";
      const hIdx = typeof feature._ucMunicipalIndex === "number" ? feature._ucMunicipalIndex : null;
      state.ucMunicipalSelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderUcMunicipalAttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "ti-am") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "ti-am";
      const hIdx = typeof feature._tiAmIndex === "number" ? feature._tiAmIndex : null;
      state.tiAmSelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderTiAmAttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "hidrovias-am") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "hidrovias-am";
      const hIdx = typeof feature._hidroviasAmIndex === "number" ? feature._hidroviasAmIndex : null;
      state.hidroviasAmSelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderHidroviasAmAttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else if (selectionKind === "ip4") {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      state.tableDataset = "ip4";
      const hIdx = typeof feature._ip4Index === "number" ? feature._ip4Index : null;
      state.ip4SelectedIndex = typeof hIdx === "number" ? hIdx : null;
      if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
        renderIp4AttributesTable(hIdx);
        refreshPanelTableTitle();
        syncGeneralFilterPlaceholder();
        syncGeneralFilterValue();
      }
    } else {
      clearSelectedRowHighlight();
      clearBueirosRowHighlight();
      clearBueirosBr174RowHighlight();
      clearPontesRowHighlight();
      clearJazidasRowHighlight();
      clearPradsBr174RowHighlight();
      clearPcaPradsBr319RowHighlight();
      clearPradsBr319RowHighlight();
      clearPcaPradsCmmBr319RowHighlight();
      clearPontesBr319RowHighlight();
      clearPontesBr230RowHighlight();
      clearUcEstadualRowHighlight();
      clearUcMunicipalRowHighlight();
      clearTiAmRowHighlight();
      clearHidroviasAmRowHighlight();
      clearIp4RowHighlight();
    }

    if (openActions) openBottomSheet();
    if (showQuickMenu) void openAttributesTableFromMapClick(selectionKind, feature, layer);

    if (!lightHover) {
      const layerId = resolveTableLayerId(selectionKind, feature);
      if (layerId) {
        state.tableDataset = layerId;
        applyTableSelectionFromFeature(layerId, feature);
        if (bottomSheet && !bottomSheet.classList.contains("is-collapsed")) {
          rerenderTableForLayerId(layerId);
          refreshPanelTableTitle();
          syncGeneralFilterPlaceholder();
          syncGeneralFilterValue();
        }
      }
    }

    if (fromBueirosHover) {
      state.bueirosTableHoverPinned = true;
    }

    if (fromAttributesTable && isBottomSheetVisible()) {
      zoomSelectionFromTable(feature, layer, selectionKind);
    }
  }

  /** Os cliques na tabela vêm por delegação em `#all-attributes` (bindUi). */
  function setupHeaderSortClick() {
    const container = $("all-attributes");
    if (!container) return;
    container.addEventListener("click", (event) => {
      if (event.target.closest("input.col-filter, .table-filter-clear, .table-filter-status")) return;
      const thUm = event.target.closest("th.sortable[data-uc-municipal-key]");
      if (thUm) {
        const key = thUm.getAttribute("data-uc-municipal-key");
        if (!key) return;
        if (state.ucMunicipalTable.sortKey === key) {
          state.ucMunicipalTable.sortDir = state.ucMunicipalTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.ucMunicipalTable.sortKey = key;
          state.ucMunicipalTable.sortDir = "asc";
        }
        renderUcMunicipalAttributesTable(state.ucMunicipalSelectedIndex);
        return;
      }

      const thIp4 = event.target.closest("th.sortable[data-ip4-key]");
      if (thIp4) {
        const key = thIp4.getAttribute("data-ip4-key");
        if (!key) return;
        if (state.ip4Table.sortKey === key) {
          state.ip4Table.sortDir = state.ip4Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.ip4Table.sortKey = key;
          state.ip4Table.sortDir = "asc";
        }
        renderIp4AttributesTable(state.ip4SelectedIndex);
        return;
      }

      const thContract = event.target.closest("th.sortable[data-contract-results-key]");
      if (thContract) {
        const key = thContract.getAttribute("data-contract-results-key");
        if (!key) return;
        if (state.contractResultsTable.sortKey === key) {
          state.contractResultsTable.sortDir = state.contractResultsTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.contractResultsTable.sortKey = key;
          state.contractResultsTable.sortDir = "asc";
        }
        renderContractResultsAttributesTable(state.contractResultsSelectedIndex);
        return;
      }

      const thTi = event.target.closest("th.sortable[data-ti-am-key]");
      if (thTi) {
        const key = thTi.getAttribute("data-ti-am-key");
        if (!key) return;
        if (state.tiAmTable.sortKey === key) {
          state.tiAmTable.sortDir = state.tiAmTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.tiAmTable.sortKey = key;
          state.tiAmTable.sortDir = "asc";
        }
        renderTiAmAttributesTable(state.tiAmSelectedIndex);
        return;
      }

      const thUc = event.target.closest("th.sortable[data-uc-estadual-key]");
      if (thUc) {
        const key = thUc.getAttribute("data-uc-estadual-key");
        if (!key) return;
        if (state.ucEstadualTable.sortKey === key) {
          state.ucEstadualTable.sortDir = state.ucEstadualTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.ucEstadualTable.sortKey = key;
          state.ucEstadualTable.sortDir = "asc";
        }
        renderUcEstadualAttributesTable(state.ucEstadualSelectedIndex);
        return;
      }


      const thP319 = event.target.closest("th.sortable[data-pontes-br319-key]");
      if (thP319) {
        const key = thP319.getAttribute("data-pontes-br319-key");
        if (!key) return;
        if (state.pontesBr319Table.sortKey === key) {
          state.pontesBr319Table.sortDir = state.pontesBr319Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.pontesBr319Table.sortKey = key;
          state.pontesBr319Table.sortDir = "asc";
        }
        renderPontesBr319AttributesTable(state.pontesBr319SelectedIndex);
        return;
      }

      const thPrads = event.target.closest("th.sortable[data-prads-br174-key]");
      if (thPrads) {
        const key = thPrads.getAttribute("data-prads-br174-key");
        if (!key) return;
        if (state.pradsBr174Table.sortKey === key) {
          state.pradsBr174Table.sortDir = state.pradsBr174Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.pradsBr174Table.sortKey = key;
          state.pradsBr174Table.sortDir = "asc";
        }
        renderPradsBr174AttributesTable(state.pradsBr174SelectedIndex);
        return;
      }

      const thPcaPrads = event.target.closest("th.sortable[data-pca-prads-br319-key]");
      if (thPcaPrads) {
        const key = thPcaPrads.getAttribute("data-pca-prads-br319-key");
        if (!key) return;
        if (state.pcaPradsBr319Table.sortKey === key) {
          state.pcaPradsBr319Table.sortDir = state.pcaPradsBr319Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.pcaPradsBr319Table.sortKey = key;
          state.pcaPradsBr319Table.sortDir = "asc";
        }
        renderPcaPradsBr319AttributesTable(state.pcaPradsBr319SelectedIndex);
        return;
      }
      const thPradsBr319 = event.target.closest("th.sortable[data-prads-br319-key]");
      if (thPradsBr319) {
        const key = thPradsBr319.getAttribute("data-prads-br319-key");
        if (!key) return;
        if (state.pradsBr319Table.sortKey === key) {
          state.pradsBr319Table.sortDir = state.pradsBr319Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.pradsBr319Table.sortKey = key;
          state.pradsBr319Table.sortDir = "asc";
        }
        renderPradsBr319AttributesTable(state.pradsBr319SelectedIndex);
        return;
      }
      const thPcaPradsCmm = event.target.closest("th.sortable[data-pca-prads-cmm-br319-key]");
      if (thPcaPradsCmm) {
        const key = thPcaPradsCmm.getAttribute("data-pca-prads-cmm-br319-key");
        if (!key) return;
        if (state.pcaPradsCmmBr319Table.sortKey === key) {
          state.pcaPradsCmmBr319Table.sortDir = state.pcaPradsCmmBr319Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.pcaPradsCmmBr319Table.sortKey = key;
          state.pcaPradsCmmBr319Table.sortDir = "asc";
        }
        renderPcaPradsCmmBr319AttributesTable(state.pcaPradsCmmBr319SelectedIndex);
        return;
      }

      const thBu174 = event.target.closest("th.sortable[data-bueiros-br174-key]");
      if (thBu174) {
        const key = thBu174.getAttribute("data-bueiros-br174-key");
        if (!key) return;
        if (state.bueirosBr174Table.sortKey === key) {
          state.bueirosBr174Table.sortDir = state.bueirosBr174Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.bueirosBr174Table.sortKey = key;
          state.bueirosBr174Table.sortDir = "asc";
        }
        renderBueirosBr174AttributesTable(state.bueirosBr174SelectedIndex);
        return;
      }

      const thBu230 = event.target.closest("th.sortable[data-bueiros-br230-key]");
      if (thBu230) {
        const key = thBu230.getAttribute("data-bueiros-br230-key");
        if (!key) return;
        if (state.bueirosBr230Table.sortKey === key) {
          state.bueirosBr230Table.sortDir = state.bueirosBr230Table.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.bueirosBr230Table.sortKey = key;
          state.bueirosBr230Table.sortDir = "asc";
        }
        renderBueirosBr230AttributesTable(state.bueirosBr230SelectedIndex);
        return;
      }

      const thJ = event.target.closest("th.sortable[data-jazidas-key]");
      if (thJ) {
        const key = thJ.getAttribute("data-jazidas-key");
        if (!key) return;
        if (state.jazidasTable.sortKey === key) {
          state.jazidasTable.sortDir = state.jazidasTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.jazidasTable.sortKey = key;
          state.jazidasTable.sortDir = "asc";
        }
        renderJazidasAttributesTable(state.jazidasSelectedIndex);
        return;
      }

      const thP = event.target.closest("th.sortable[data-pontes-key]");
      if (thP) {
        const key = thP.getAttribute("data-pontes-key");
        if (!key) return;
        if (state.pontesTable.sortKey === key) {
          state.pontesTable.sortDir = state.pontesTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.pontesTable.sortKey = key;
          state.pontesTable.sortDir = "asc";
        }
        renderPontesAttributesTable(state.pontesSelectedIndex);
        return;
      }

      const thB = event.target.closest("th.sortable[data-bueiros-key]");
      if (thB) {
        const key = thB.getAttribute("data-bueiros-key");
        if (!key) return;
        if (state.bueirosTable.sortKey === key) {
          state.bueirosTable.sortDir = state.bueirosTable.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.bueirosTable.sortKey = key;
          state.bueirosTable.sortDir = "asc";
        }
        renderBueirosAttributesTable(state.bueirosSelectedIndex);
        return;
      }

      const th = event.target.closest("th.sortable[data-key]");
      if (!th) return;
      const key = th.getAttribute("data-key");
      if (!key) return;

      if (state.generalTable.sortKey === key) {
        state.generalTable.sortDir = state.generalTable.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.generalTable.sortKey = key;
        state.generalTable.sortDir = "asc";
      }

      renderAllAttributesTable();

      if (state.selectedFeatureIndex !== null) {
        highlightRowForFeature(state.allFeatures[state.selectedFeatureIndex]);
      }
    });
  }


  function clearCurrentTableFilters() {
    for (const timer of tableFilterDebounceTimers.values()) clearTimeout(timer);
    tableFilterDebounceTimers.clear();

    const clearState = (tableState) => {
      if (!tableState) return;
      tableState.filterText = "";
      tableState.columnFilters = {};
    };

    const kind = state.tableDataset;
    if (kind === "bueiros") clearState(state.bueirosTable);
    else if (kind === "bueiros-br174") clearState(state.bueirosBr174Table);
    else if (kind === "bueiros-br230") clearState(state.bueirosBr230Table);
    else if (kind === "bueiros-br319") clearState(state.bueirosBr319Table);
    else if (kind === "pontes") clearState(state.pontesTable);
    else if (kind === "jazidas") clearState(state.jazidasTable);
    else if (kind === "prads-br174") clearState(state.pradsBr174Table);
    else if (kind === "pca-prads-br319") clearState(state.pcaPradsBr319Table);
    else if (kind === "prads-br319") clearState(state.pradsBr319Table);
    else if (kind === "pca-prads-cmm-br319") clearState(state.pcaPradsCmmBr319Table);
    else if (kind === "pontes-br319") clearState(state.pontesBr319Table);
    else if (kind === "uc-estadual") clearState(state.ucEstadualTable);
    else if (kind === "uc-municipal") clearState(state.ucMunicipalTable);
    else if (kind === "hidrovias-am") clearState(state.hidroviasAmTable);
    else if (kind === "ip4") clearState(state.ip4Table);
    else if (kind === "municipios") clearState(state.municipiosTable);
    else if (kind === "ti-am") clearState(state.tiAmTable);
    else if (kind === "contract-results") clearState(state.contractResultsTable);
    else if (String(kind || "").startsWith("br-am:")) {
      const entry = state.brAmTables?.byKey?.[String(kind)];
      clearState(entry?.table);
    } else {
      clearState(state.generalTable);
    }

    if (generalFilterInput) generalFilterInput.value = "";

    // re-render tabela atual
    if (kind === "bueiros") renderBueirosAttributesTable(state.bueirosSelectedIndex);
    else if (kind === "bueiros-br174") renderBueirosBr174AttributesTable(state.bueirosBr174SelectedIndex);
    else if (kind === "bueiros-br230") renderBueirosBr230AttributesTable(state.bueirosBr230SelectedIndex);
    else if (kind === "bueiros-br319") renderBueirosBr319AttributesTable(state.bueirosBr319SelectedIndex);
    else if (kind === "pontes") renderPontesAttributesTable(state.pontesSelectedIndex);
    else if (kind === "jazidas") renderJazidasAttributesTable(state.jazidasSelectedIndex);
    else if (kind === "prads-br174") renderPradsBr174AttributesTable(state.pradsBr174SelectedIndex);
    else if (kind === "pca-prads-br319") renderPcaPradsBr319AttributesTable(state.pcaPradsBr319SelectedIndex);
    else if (kind === "prads-br319") renderPradsBr319AttributesTable(state.pradsBr319SelectedIndex);
    else if (kind === "pca-prads-cmm-br319") renderPcaPradsCmmBr319AttributesTable(state.pcaPradsCmmBr319SelectedIndex);
    else if (kind === "pontes-br319") renderPontesBr319AttributesTable(state.pontesBr319SelectedIndex);
    else if (kind === "uc-estadual") renderUcEstadualAttributesTable(state.ucEstadualSelectedIndex);
    else if (kind === "uc-municipal") renderUcMunicipalAttributesTable(state.ucMunicipalSelectedIndex);
    else if (kind === "hidrovias-am") renderHidroviasAmAttributesTable(state.hidroviasAmSelectedIndex);
    else if (kind === "ip4") renderIp4AttributesTable(state.ip4SelectedIndex);
    else if (kind === "municipios") renderMunicipiosAttributesTable(state.municipiosSelectedIndex);
    else if (kind === "ti-am") renderTiAmAttributesTable(state.tiAmSelectedIndex);
    else if (kind === "contract-results") renderContractResultsAttributesTable(state.contractResultsSelectedIndex);
    else if (String(kind || "").startsWith("br-am:")) {
      const key = String(kind);
      const entry = state.brAmTables?.byKey?.[key];
      renderBrAmAttributesTable(key, entry?.selectedIndex ?? null);
    } else {
      renderAllAttributesTable();
    }
  }

  function clearContractFilterCache() {
    // Zera seleção e UI do filtro de contrato
    state.contractFilter = "";
    state.contractFocusLayerLabel = "";
    state.ip4FocusSource = "";

    // Zera caches de carregamento/lista
    state.contractSourcesLoaded = false;
    state.contractSourcesAttempted = false;
    state.contractSourcesLoadPromise = null;

    // Remove fontes "descobertas" (podem poluir lista/popup)
    state.extraContractSources = [];

    // Limpa resultados consolidados (tabela "Resultado do contrato")
    state.contractResultsFeatures = [];
    state.contractResultsColumnKeys = [];
    state.contractResultsSelectedIndex = null;
    try {
      state.contractResultsTable.sortKey = null;
      state.contractResultsTable.sortDir = "asc";
      state.contractResultsTable.filterText = "";
      state.contractResultsTable.columnFilters = {};
    } catch {
      // ignore
    }

    // Reset do select (mantém "Todos" apenas)
    try {
      if (menuContractSelect) {
        menuContractSelect.innerHTML = `<option value="">Todos</option>`;
        menuContractSelect.value = "";
      }
    } catch {
      // ignore
    }

  }

  function clearContractSelectionOnly() {
    // Mantém a lista de contratos carregada, mas remove o filtro atual
    // e restaura visibilidade no mapa.
    const had = Boolean(normalizeContractKey(state.contractFilter) || state.contractFocusLayerLabel || state.ip4FocusSource);
    state.contractFilter = "";
    state.contractFocusLayerLabel = "";
    state.ip4FocusSource = "";

    try {
      if (menuContractSelect) menuContractSelect.value = "";
    } catch {
      // ignore
    }
    try {
      applyContractFilterToMap();
    } catch {
      // ignore
    }
    if (had) {
      try {
        setStatus("Contrato: filtro removido (voltou para camada sem filtro)", "ok");
      } catch {
        // ignore
      }
    }
  }

  async function searchAndZoom(text) {
    // Evita "delay" por corrida: se o usuário pesquisar de novo,
    // ignora resultados antigos.
    state.globalSearch.runToken += 1;
    const myToken = state.globalSearch.runToken;
    setGlobalSearchFeedback("searching");
    const results = await globalSearchRun(text || "");
    if (myToken !== state.globalSearch.runToken) return;
    state.globalSearch.lastQuery = String(text || "");
    state.globalSearch.lastResults = results || [];
    if (!results.length) {
      closeGlobalSearchResults();
      setStatus("Pesquisa: nenhum resultado nos filtros selecionados", "error");
      setGlobalSearchFeedback("none");
      return;
    }
    if (results.length === 1) {
      await openSearchResult(results[0]);
      setGlobalSearchFeedback("results", { count: 1 });
      return;
    }
    state.globalSearch.results = results;
    state.globalSearch.activeIndex = 0;
    renderGlobalSearchResults(results);
    setStatus(`Pesquisa: ${results.length} resultados — escolha um`, "info");
    setGlobalSearchFeedback("results", { count: results.length });
  }

  function bindUi() {
    // Mapa base: botão + painel (hover ou clique em telas sem hover)
    mapBasemapBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = !mapBasemapControl?.classList.contains("is-open");
      if (next) {
        mapBasemapControl?.classList.add("is-open");
        mapBasemapBtn?.setAttribute("aria-expanded", "true");
      } else {
        closeMapBasemapPicker();
      }
    });
    document.addEventListener("click", (e) => {
      if (!mapBasemapControl?.classList.contains("is-open")) return;
      const t = e.target;
      if (t?.closest?.("#map-basemap-control")) return;
      closeMapBasemapPicker();
    });
    // ESC global é tratado no initMap (evita listeners duplicados).

    // Clique nas linhas da tabela (delegação no container)
    const attrsHost = $("all-attributes");

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

      const tableState = getTableStateById(tableId);
      if (!tableState) return;

      const norm = normalizeSearchText(value);
      if (!norm) {
        try {
          delete tableState.columnFilters[key];
        } catch {
          // ignore
        }
      } else {
        tableState.columnFilters[key] = value;
      }

      const pending = tableFilterDebounceTimers.get(tableId);
      if (pending) clearTimeout(pending);
      tableFilterDebounceTimers.delete(tableId);

      syncTableFilterChrome(container, {
        loading: false,
        columnFilters: tableState.columnFilters,
      });
      rerenderAttributesTableById(tableId);
      restoreColumnFilterFocus(tableId, key, caretStart, caretEnd);
    });

    attrsHost?.addEventListener("click", (event) => {
      const target = event.target;
      const kind = state.tableDataset;

      const selectRowInTable = (tableSel, row) => {
        if (!row) return;
        document.querySelectorAll(`${tableSel} tbody tr.selected-row`).forEach((r) => r.classList.remove("selected-row"));
        row.classList.add("selected-row");
      };

      const clearBtn = target?.closest?.("button[data-action=\"clear-table-filters\"]");
      if (clearBtn) {
        event.preventDefault();
        event.stopPropagation();
        clearCurrentTableFilters();
        return;
      };

      if (kind === "segmentos") {
        const row = target.closest?.("#all-attributes-table tbody tr[data-feature-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-feature-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.allFeatures[idx];
        const layer = state.layersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#all-attributes-table", row);
        state.selectedFeatureIndex = idx;
        state.suppressAutoFit = true;
        Promise.resolve(applyOnlyRodoviasSublayer("segmentos")).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, { zoomTo: false, zoomMaxFromPanel: true, fromAttributesTable: true });
        return;
      }

      if (kind === "bueiros") {
        const row = target.closest?.("#bueiros-attributes-table tbody tr[data-bueiros-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-bueiros-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.bueirosFeatures[idx];
        const layer = state.bueirosLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#bueiros-attributes-table", row);
        state.bueirosSelectedIndex = idx;
        state.suppressAutoFit = true;
        Promise.resolve(applyOnlyRodoviasSublayer("bueiros")).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.pontesFeatures[idx];
        const layer = state.pontesLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#pontes-attributes-table", row);
        state.pontesSelectedIndex = idx;
        state.suppressAutoFit = true;
        Promise.resolve(applyOnlyRodoviasSublayer("pontes")).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.jazidasFeatures[idx];
        const layer = state.jazidasLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#jazidas-attributes-table", row);
        state.jazidasSelectedIndex = idx;
        state.suppressAutoFit = true;
        Promise.resolve(applyOnlyRodoviasSublayer("jazidas")).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const entry = state.brAmTables?.byKey?.[key];
        if (!entry) return;
        const feature = entry.features?.[idx];
        if (!feature) return;
        const id = brAmIdFromLayerKey(key);
        const name = entry.name || getBrAmNameById(id) || "";

        event.stopPropagation();
        // o tableId é dinâmico; usamos seletor amplo pela tabela atual
        selectRowInTable("table.attributes-table", row);
        entry.selectedIndex = idx;

        // Se a camada ainda não estiver ligada, liga automaticamente para "aparecer no mapa"
        const wantsLayerOn = !state.brAm?.layersById?.[id];
        const onMapPromise = wantsLayerOn ? ensureBrAmLayerOnMap(id, name) : Promise.resolve(state.brAm.layersById[id]);

        Promise.resolve(onMapPromise)
          .then(() => {
            // highlight + zoom sem trocar dataset/tabela
            const leafletLayer = entry.layersByIndex?.[idx] || null;
            selectFeature(feature, leafletLayer, {
              zoomTo: true,
              selectionKind: key,
              zoomMaxFromPanel: true,
              fromAttributesTable: true,
              lightHover: true,
            });
          })
          .catch((e) => {
            setStatus(String(e?.message || e || "Falha ao exibir feição BR-AM no mapa"), "error");
          });
        return;
      }

      if (kind === "contract-results") {
        const row = target.closest?.("#contract-results-attributes-table tbody tr[data-contract-results-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-contract-results-index"), 10);
        if (Number.isNaN(idx)) return;
        const hit = state.contractResultsFeatures?.[idx];
        if (!hit) return;

        event.stopPropagation();
        selectRowInTable("#contract-results-attributes-table", row);
        state.contractResultsSelectedIndex = idx;
        try {
          const visibleNow = document.querySelectorAll("#contract-results-attributes-table tbody tr").length;
          updateTablePanelMeta({
            selected: 1,
            visible: visibleNow,
            total: state.contractResultsFeatures.length,
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
              () => state.ip4Features?.[origIndex],
              () => state.ip4LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "bueiros") {
            return await ensureAndPick(
              layerBueirosToggle,
              ensureBueirosBr317OnMap,
              () => state.bueirosFeatures?.[origIndex],
              () => state.bueirosLayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "pontes") {
            return await ensureAndPick(
              layerPontesToggle,
              ensurePontesBr307OnMap,
              () => state.pontesFeatures?.[origIndex],
              () => state.pontesLayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "jazidas") {
            return await ensureAndPick(
              layerJazidasToggle,
              ensureJazidasBr307OnMap,
              () => state.jazidasFeatures?.[origIndex],
              () => state.jazidasLayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "pontes-br319") {
            return await ensureAndPick(
              layerPontesBr319Toggle,
              ensurePontesBr319OnMap,
              () => state.pontesBr319Features?.[origIndex],
              () => state.pontesBr319LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "bueiros-br319") {
            return await ensureAndPick(
              layerBueirosBr319Toggle,
              ensureBueirosBr319OnMap,
              () => state.bueirosBr319Features?.[origIndex],
              () => state.bueirosBr319LayersByIndex?.[origIndex]
            );
          }

          if (kind0 === "uc-estadual") {
            return await ensureAndPick(
              layerUcEstadualToggle,
              ensureUcEstadualOnMap,
              () => state.ucEstadualFeatures?.[origIndex],
              () => state.ucEstadualLayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "uc-municipal") {
            return await ensureAndPick(
              layerUcMunicipalToggle,
              ensureUcMunicipalOnMap,
              () => state.ucMunicipalFeatures?.[origIndex],
              () => state.ucMunicipalLayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "bueiros-br174") {
            return await ensureAndPick(
              layerBueirosBr174Toggle,
              ensureBueirosBr174OnMap,
              () => state.bueirosBr174Features?.[origIndex],
              () => state.bueirosBr174LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "prads-br174") {
            return await ensureAndPick(
              layerPradsBr174Toggle,
              ensurePradsBr174OnMap,
              () => state.pradsBr174Features?.[origIndex],
              () => state.pradsBr174LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "pca-prads-br319") {
            return await ensureAndPick(
              layerPcaPradsBr319Toggle,
              ensurePcaPradsBr319OnMap,
              () => state.pcaPradsBr319Features?.[origIndex],
              () => state.pcaPradsBr319LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "prads-br319") {
            return await ensureAndPick(
              layerPradsBr319Toggle,
              ensurePradsBr319OnMap,
              () => state.pradsBr319Features?.[origIndex],
              () => state.pradsBr319LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "pca-prads-cmm-br319") {
            return await ensureAndPick(
              layerPcaPradsCmmBr319Toggle,
              ensurePcaPradsCmmBr319OnMap,
              () => state.pcaPradsCmmBr319Features?.[origIndex],
              () => state.pcaPradsCmmBr319LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "bueiros-br230") {
            return await ensureAndPick(
              layerBueirosBr230Toggle,
              ensureBueirosBr230OnMap,
              () => state.bueirosBr230Features?.[origIndex],
              () => state.bueirosBr230LayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "ti-am") {
            return await ensureAndPick(
              layerTiAmToggle,
              ensureTiAmOnMap,
              () => state.tiAmFeatures?.[origIndex],
              () => state.tiAmLayersByIndex?.[origIndex]
            );
          }
          if (kind0 === "hidrovias-am") {
            return await ensureAndPick(
              layerHidroviasAmToggle,
              ensureHidroviasAmOnMap,
              () => state.hidroviasAmFeatures?.[origIndex],
              () => state.hidroviasAmLayersByIndex?.[origIndex]
            );
          }

          const src = (state.extraContractSources || []).find((s) => s?.label === label);
          if (src?.features?.length) {
            buildExtraContractLayerOnMap(src);
            return { feature: src.features?.[origIndex], layer: null };
          }
          return { feature: null, layer: null };
        };

        Promise.resolve(ensureKindOnMap())
          .then(({ feature, layer }) => {
            if (!feature) {
              setStatus("Não foi possível localizar a feição original para este resultado.", "error");
              return;
            }
            // IMPORTANT: em "resultado do contrato", o usuário quer manter a tabela visível.
            // Então destacamos/zoom no mapa sem trocar dataset/tabela do painel.
            selectFeature(feature, layer, {
              zoomTo: true,
              selectionKind: kind0 || "segmentos",
              zoomMaxFromPanel: true,
              fromAttributesTable: true,
              lightHover: true,
            });
          })
          .catch((e) => {
            setStatus(String(e?.message || e || "Falha ao exibir feição no mapa"), "error");
          });
        return;
      }
      if (kind === "bueiros-br174") {
        const row = target.closest?.("#bueiros-br174-attributes-table tbody tr[data-bueiros-br174-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-bueiros-br174-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.bueirosBr174Features[idx];
        const layer = state.bueirosBr174LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#bueiros-br174-attributes-table", row);
        state.bueirosBr174SelectedIndex = idx;
        // Não liga/mostra camada automaticamente ao clicar na tabela.
        if (!layerBueirosBr174Toggle?.checked) {
          setStatus("Bueiros BR-174: ligue a camada para ver no mapa.", "info");
          return;
        }
        selectFeature(feature, layer, { zoomTo: false, selectionKind: "bueiros-br174", zoomMaxFromPanel: true, fromAttributesTable: true });
        return;
      }

      if (kind === "bueiros-br319") {
        const row = target.closest?.("#bueiros-br319-attributes-table tbody tr[data-bueiros-br319-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-bueiros-br319-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.bueirosBr319Features[idx];
        const layer = state.bueirosBr319LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#bueiros-br319-attributes-table", row);
        state.bueirosBr319SelectedIndex = idx;
        // Não liga/mostra camada automaticamente ao clicar na tabela.
        if (!layerBueirosBr319Toggle?.checked) {
          setStatus("Bueiros BR-319: ligue a camada para ver no mapa.", "info");
          return;
        }
        selectFeature(feature, layer, { zoomTo: false, selectionKind: "bueiros-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
        return;
      }

      if (kind === "bueiros-br230") {
        const row = target.closest?.("#bueiros-br230-attributes-table tbody tr[data-bueiros-br230-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-bueiros-br230-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.bueirosBr230Features[idx];
        const layer = state.bueirosBr230LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#bueiros-br230-attributes-table", row);
        state.bueirosBr230SelectedIndex = idx;
        // Não liga/mostra camada automaticamente ao clicar na tabela.
        if (!layerBueirosBr230Toggle?.checked) {
          setStatus("Bueiros BR-230: ligue a camada para ver no mapa.", "info");
          return;
        }
        selectFeature(feature, layer, {
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
        const feature = state.pradsBr174Features[idx];
        const layer = state.pradsBr174LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#prads-br174-attributes-table", row);
        state.pradsBr174SelectedIndex = idx;
        // Não liga/mostra camada automaticamente ao clicar na tabela.
        if (!layerPradsBr174Toggle?.checked) {
          setStatus("PRADS BR-174: ligue a camada para ver no mapa.", "info");
          return;
        }
        selectFeature(feature, layer, { zoomTo: false, selectionKind: "prads-br174", zoomMaxFromPanel: true, fromAttributesTable: true });
        return;
      }


      if (kind === "pca-prads-br319") {
        const row = target.closest?.("#pca-prads-br319-attributes-table tbody tr[data-pca-prads-br319-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-pca-prads-br319-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.pcaPradsBr319Features[idx];
        const layer = state.pcaPradsBr319LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#pca-prads-br319-attributes-table", row);
        state.pcaPradsBr319SelectedIndex = idx;
        if (!layerPcaPradsBr319Toggle?.checked) {
          setStatus("PCA - PRADS BR-319: ligue a camada para ver no mapa.", "info");
          return;
        }
        selectFeature(feature, layer, { zoomTo: false, selectionKind: "pca-prads-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
        return;
      }
      if (kind === "prads-br319") {
        const row = target.closest?.("#prads-br319-attributes-table tbody tr[data-prads-br319-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-prads-br319-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.pradsBr319Features[idx];
        const layer = state.pradsBr319LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#prads-br319-attributes-table", row);
        state.pradsBr319SelectedIndex = idx;
        if (!layerPradsBr319Toggle?.checked) {
          setStatus("PRADS BR-319: ligue a camada para ver no mapa.", "info");
          return;
        }
        selectFeature(feature, layer, { zoomTo: false, selectionKind: "prads-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
        return;
      }
      if (kind === "pca-prads-cmm-br319") {
        const row = target.closest?.("#pca-prads-cmm-br319-attributes-table tbody tr[data-pca-prads-cmm-br319-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-pca-prads-cmm-br319-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.pcaPradsCmmBr319Features[idx];
        const layer = state.pcaPradsCmmBr319LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#pca-prads-cmm-br319-attributes-table", row);
        state.pcaPradsCmmBr319SelectedIndex = idx;
        if (!layerPcaPradsCmmBr319Toggle?.checked) {
          setStatus("PCA - PRADS CMM BR-319: ligue a camada para ver no mapa.", "info");
          return;
        }
        selectFeature(feature, layer, { zoomTo: false, selectionKind: "pca-prads-cmm-br319", zoomMaxFromPanel: true, fromAttributesTable: true });
        return;
      }


      if (kind === "pontes-br319") {
        const row = target.closest?.("#pontes-br319-attributes-table tbody tr[data-pontes-br319-index]");
        if (!row) return;
        const idx = parseInt(row.getAttribute("data-pontes-br319-index"), 10);
        if (Number.isNaN(idx)) return;
        const feature = state.pontesBr319Features[idx];
        const layer = state.pontesBr319LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#pontes-br319-attributes-table", row);
        state.pontesBr319SelectedIndex = idx;
        state.suppressAutoFit = true;
        if (layerPontesBr319Toggle) layerPontesBr319Toggle.checked = true;
        Promise.resolve(ensurePontesBr319OnMap()).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.pontesBr230Features[idx];
        const layer = state.pontesBr230LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#pontes-br230-attributes-table", row);
        state.pontesBr230SelectedIndex = idx;
        state.suppressAutoFit = true;
        if (layerPontesBr230Toggle) layerPontesBr230Toggle.checked = true;
        Promise.resolve(ensurePontesBr230OnMap()).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.ucEstadualFeatures[idx];
        const layer = state.ucEstadualLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#uc-estadual-attributes-table", row);
        state.ucEstadualSelectedIndex = idx;
        state.suppressAutoFit = true;
        if (layerUcEstadualToggle) layerUcEstadualToggle.checked = true;
        Promise.resolve(ensureUcEstadualOnMap()).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.ucMunicipalFeatures[idx];
        const layer = state.ucMunicipalLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#uc-municipal-attributes-table", row);
        state.ucMunicipalSelectedIndex = idx;
        state.suppressAutoFit = true;
        if (layerUcMunicipalToggle) layerUcMunicipalToggle.checked = true;
        Promise.resolve(ensureUcMunicipalOnMap()).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.tiAmFeatures[idx];
        const layer = state.tiAmLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#ti-am-attributes-table", row);
        state.tiAmSelectedIndex = idx;
        state.suppressAutoFit = true;
        if (layerTiAmToggle) layerTiAmToggle.checked = true;
        Promise.resolve(ensureTiAmOnMap()).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.hidroviasAmFeatures[idx];
        const layer = state.hidroviasAmLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#hidrovias-am-attributes-table", row);
        state.hidroviasAmSelectedIndex = idx;
        state.suppressAutoFit = true;
        if (layerHidroviasAmToggle) layerHidroviasAmToggle.checked = true;
        Promise.resolve(ensureHidroviasAmOnMap()).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.municipiosFeatures[idx];
        const layer = state.municipiosLayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#municipios-attributes-table", row);
        state.municipiosSelectedIndex = idx;
        state.suppressAutoFit = true;
        Promise.resolve(attachLimiteMunicipalLayerIfNeeded()).finally(() => {
          state.suppressAutoFit = false;
        });
        selectFeature(feature, layer, {
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
        const feature = state.ip4Features[idx];
        const layer = state.ip4LayersByIndex[idx];
        if (!feature) return;
        event.stopPropagation();
        selectRowInTable("#ip4-attributes-table", row);
        state.ip4SelectedIndex = idx;
        // Ao clicar na linha, foca o SHP de origem (mostra apenas esse __source no mapa).
        // Clique repetido no mesmo SHP alterna (remove foco).
        try {
          const src = String(feature?.properties?.__source || feature?.properties?._source || "");
          if (src) {
            const prev = normalizeSearchText(state.ip4FocusSource || "");
            const next = normalizeSearchText(src);
            state.ip4FocusSource = prev && prev === next ? "" : src;
          }
        } catch {
          // ignore
        }
        state.suppressAutoFit = true;
        if (layerIp4Toggle) layerIp4Toggle.checked = true;
        Promise.resolve(ensureIp4OnMap()).finally(() => {
          state.suppressAutoFit = false;
        });
        // Reaplica filtros (contrato + foco IP4)
        applyContractFilterToMap();
        selectFeature(feature, layer, {
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
      clearCurrentSelection();
    });

    featureQuickCloseBtn?.addEventListener("click", () => {
      hideFeatureQuickMenu(true);
    });

    featureQuickMenuEl?.addEventListener("click", (event) => {
      const target = event.target;

      const actionBtn = target?.closest?.("button[data-action]");
      if (actionBtn && featureQuickMenuEl.contains(actionBtn)) {
        const action = actionBtn.getAttribute("data-action");
        event.preventDefault();
        event.stopPropagation();
        if (action === "clear-selection") {
          clearCurrentSelection();
          hideFeatureQuickMenu(true);
          return;
        }
        if (action === "deselect-hit-layers") {
          const kinds = uniqueIdentifyKinds(state.identify?.results || []);
          for (const k of kinds) {
            setLayerToggleAndApply(k, false);
          }
          clearCurrentSelection();
          hideFeatureQuickMenu(true);
          try {
            closeMobileSidebarIfNeeded();
          } catch {
            // ignore
          }
          return;
        }
      }

      const pickBtn = target?.closest?.("button[data-identify-kind]");
      if (pickBtn) {
        const kind = pickBtn.getAttribute("data-identify-kind");
        const results = state.identify?.results || [];
        const idx = results.findIndex((r) => String(r?.selectionKind || "") === String(kind || ""));
        if (idx < 0) return;
        event.preventDefault();
        event.stopPropagation();
        const hit = results[idx];
        state.identify.activeIndex = idx;
        handleMapFeatureClick(event, hit.feature, hit.layer, hit.selectionKind, {
          zoomTo: false,
          identifyResults: results,
          activeIndex: idx,
        });
        return;
      }

      const btn = target?.closest?.("button[data-identify-idx]");
      if (!btn) return;
      const idx = parseInt(btn.getAttribute("data-identify-idx"), 10);
      if (Number.isNaN(idx)) return;
      const results = state.identify?.results || [];
      const hit = results[idx];
      if (!hit?.feature) return;
      event.preventDefault();
      event.stopPropagation();
      state.identify.activeIndex = idx;
      handleMapFeatureClick(event, hit.feature, hit.layer, hit.selectionKind, {
        zoomTo: false,
        identifyResults: results,
        activeIndex: idx,
      });
      if (state.featureQuickMenuPinned) {
        renderIdentifyQuickMenu(results, idx, { minimal: true, showLayerPicker: true });
        requestAnimationFrame(() => {
          positionFeatureQuickMenuAvoidingRect(getAvoidRectForLayer(hit.layer, hit.feature, event));
        });
      }
    });

    featureQuickMenuEl?.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.type !== "checkbox") return;
      const kind = input.getAttribute("data-layer-kind");
      if (!kind) return;
      event.stopPropagation();
      const turnedOn = Boolean(input.checked);
      setLayerToggleAndApply(kind, turnedOn);
      if (!turnedOn) {
        try {
          clearSelectionForTurnedOffKind(kind);
        } catch {
          // ignore
        }
        // Se desligou a camada ativa, troca para outra ainda presente ou limpa.
        const results = (state.identify?.results || []).filter((r) => String(r?.selectionKind || "") !== kind);
        state.identify.results = results;
        if (!results.length) {
          clearCurrentSelection();
          hideFeatureQuickMenu(true);
          return;
        }
        const nextIdx = Math.min(state.identify.activeIndex || 0, results.length - 1);
        state.identify.activeIndex = nextIdx;
        const hit = results[nextIdx];
        handleMapFeatureClick(event, hit.feature, hit.layer, hit.selectionKind, {
          zoomTo: false,
          identifyResults: results,
          activeIndex: nextIdx,
        });
      } else {
        // Atualiza checkboxes/estado visual do menu.
        const results = state.identify?.results || [];
        const idx = state.identify?.activeIndex || 0;
        if (results.length) {
          renderIdentifyQuickMenu(results, idx, { minimal: true, showLayerPicker: true });
        }
      }
    });

    bottomSheetClose?.addEventListener("click", () => closeBottomSheet());
    bottomSheetRestore?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      expandBottomSheet();
    });
    bottomSheet?.querySelector(".bottom-sheet-head")?.addEventListener("click", (e) => {
      if (!bottomSheet?.classList.contains("is-peek")) return;
      if (e.target.closest(".bottom-sheet-actions")) return;
      expandBottomSheet();
    });
    $("bottom-sheet-peek-main")?.addEventListener("click", (e) => {
      if (!bottomSheet?.classList.contains("is-peek")) return;
      e.preventDefault();
      expandBottomSheet();
    });
    bottomZoomSelected?.addEventListener("click", () => {
      if (!state.map || !state.selectedFeature) return;
      zoomSelectionFromTable(state.selectedFeature, state.selectedLayer, state.lastSelectionKind || "segmentos");
    });

    // Mobile/tablet: drawer de camadas (mapa em tela cheia).
    let wasMobileLayout = isMobileLayoutActive();
    let mapResizeTimer = null;
    const invalidateMapSoon = () => {
      try {
        if (mapResizeTimer) clearTimeout(mapResizeTimer);
        mapResizeTimer = setTimeout(() => {
          try {
            state.map?.invalidateSize?.({ animate: false });
          } catch {
            // ignore
          }
        }, 80);
      } catch {
        // ignore
      }
    };
    const syncMobileSidebarDefault = () => {
      const mobile = isMobileLayoutActive();
      document.body.classList.toggle("is-mobile-layout", mobile);
      if (!mobile) {
        setMobileSidebarCollapsed(false);
        syncMobileSidebarChrome(false);
        return;
      }
      // Default: recolhida no mobile para priorizar o mapa.
      setMobileSidebarCollapsed(true);
    };
    syncMobileSidebarDefault();
    window.addEventListener("resize", () => {
      const mobile = isMobileLayoutActive();
      if (mobile !== wasMobileLayout) {
        wasMobileLayout = mobile;
        syncMobileSidebarDefault();
      }
      invalidateMapSoon();
    });
    window.addEventListener("orientationchange", () => {
      // Aguarda a barra de URL / rotação estabilizar no mobile.
      setTimeout(() => {
        wasMobileLayout = isMobileLayoutActive();
        syncMobileSidebarDefault();
        invalidateMapSoon();
      }, 180);
    });
    try {
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", invalidateMapSoon);
        window.visualViewport.addEventListener("scroll", invalidateMapSoon);
      }
    } catch {
      // ignore
    }
    mobileSidebarToggleBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isMobileLayoutActive()) return;
      const collapsed = document.body.classList.contains("mobile-sidebar-collapsed");
      setMobileSidebarCollapsed(!collapsed);
    });
    mobileSidebarBackdrop?.addEventListener("click", (e) => {
      e.preventDefault();
      closeMobileSidebarIfNeeded();
    });
    // Fecha o drawer ao ligar/desligar uma camada (libera o mapa no celular).
    $("sidebar")?.addEventListener(
      "change",
      (e) => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement)) return;
        if (t.type !== "checkbox") return;
        if (!isMobileLayoutActive()) return;
        // Pequeno atraso para o usuário ver o toggle antes do drawer fechar.
        setTimeout(() => closeMobileSidebarIfNeeded(), 220);
      },
      { passive: true }
    );
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!isMobileLayoutActive()) return;
      if (document.body.classList.contains("mobile-sidebar-collapsed")) return;
      closeMobileSidebarIfNeeded();
    });

    themeToggleBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setThemePreference(state.theme === "night" ? "light" : "night");
    });
    // Botão de zoom removido (tabelas nunca dão zoom).

    // Filtro removido do painel inferior.

    document.querySelector(".global-search")?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (e.target?.id !== "global-search-input") return;
      e.preventDefault();
      void searchAndZoom(globalSearchInput?.value);
    });
    // Botão "Limpar" substituído por feedback de busca.
    const reopenLastResults = () => {
      // Se estiver aberto, fecha
      if (globalSearchResultsEl && !globalSearchResultsEl.hidden) {
        closeGlobalSearchResults();
        return;
      }
      // Se temos resultados anteriores, reabre imediatamente
      const last = state.globalSearch.lastResults || [];
      if (last.length) {
        state.globalSearch.results = last;
        state.globalSearch.activeIndex = 0;
        renderGlobalSearchResults(last);
        setStatus(`Pesquisa: ${last.length} resultados — escolha um`, "info");
        return;
      }
      // Se não há resultados guardados, mas há a última consulta, reexecuta
      const q = String(state.globalSearch.lastQuery || "").trim();
      if (q) void searchAndZoom(q);
    };
    globalSearchFeedback?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      reopenLastResults();
    });
    globalSearchFeedback?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      reopenLastResults();
    });
    globalSearchFilterBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!globalSearchFilterEl) return;
      if (globalSearchFilterEl.hidden) openGlobalSearchFilter();
      else closeGlobalSearchFilter();
    });
    globalSearchFilterEl?.addEventListener("click", (e) => {
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
          state.globalSearch.defaultsInitialized = true;
          for (const d of getSearchKindDefs()) {
            state.globalSearch.enabledKinds.add(d.id);
          }
          openGlobalSearchFilter();
          return;
        }
        if (action === "clear") {
          // Mesmo efeito de "Desmarcar": limpa todos os filtros e desliga camadas no mapa.
          state.globalSearch.defaultsInitialized = true;
          state.globalSearch.enabledKinds.clear();
          clearMunicipioFilterOnly();
          try {
            clearContractSelectionOnly();
          } catch {
            // ignore
          }
          openGlobalSearchFilter();
          try {
            setStatus("Filtro: desligando camadas no mapa…", "info");
            for (const def of getSearchKindDefs()) {
              const kind = def?.id;
              if (!kind) continue;
              if (kind === "contratos") continue;
              setToggleChecked(kind, false);
              disableKindOnMap(kind);
            }
            setStatus("Filtro: camadas desligadas", "ok");
          } catch {
            // ignore
          }
          return;
        }
        if (action === "none") {
          state.globalSearch.defaultsInitialized = true;
          state.globalSearch.enabledKinds.clear();
          clearMunicipioFilterOnly();
          try {
            clearContractSelectionOnly();
          } catch {
            // ignore
          }
          openGlobalSearchFilter();
          try {
            setStatus("Filtro: desligando camadas no mapa…", "info");
            for (const def of getSearchKindDefs()) {
              const kind = def?.id;
              if (!kind) continue;
              if (kind === "contratos") continue;
              setToggleChecked(kind, false);
              disableKindOnMap(kind);
            }
            setStatus("Filtro: camadas desligadas", "ok");
          } catch {
            // ignore
          }
          return;
        }
        if (action === "apply") {
          state.globalSearch.defaultsInitialized = true;
          // Reconstrói enabledKinds a partir dos checkboxes marcados.
          state.globalSearch.enabledKinds.clear();
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
            setStatus("Filtro: aplicando camadas no mapa…", "info");
            const ensureTasks = [];
            for (const def of getSearchKindDefs()) {
              const kind = def?.id;
              if (!kind) continue;
              const wantOn = selected.has(kind);
              setStatus(`Filtro: ${getSearchKindLabel(kind)} — ${wantOn ? "ligando" : "desligando"}…`, "info");
              if (kind === "contratos") {
                if (!wantOn) disableKindOnMap("contratos");
                else ensureTasks.push(Promise.resolve(ensureKindOnMap("contratos")));
                continue;
              }
              if (kind === "municipios") {
                if (wantOn) {
                  ensureTasks.push(Promise.resolve(ensureMunicipiosFilterListLoaded()));
                } else {
                  clearMunicipioFilterOnly();
                  setMunicipiosOnMap(false);
                }
                continue;
              }
              setToggleChecked(kind, wantOn);
              if (wantOn) {
                ensureTasks.push(Promise.resolve(ensureKindOnMap(kind)));
              } else {
                disableKindOnMap(kind);
              }
            }

            // Atualiza conjunto ativo para a busca
            state.globalSearch.enabledKinds = selected;
            Promise.allSettled(ensureTasks).finally(() => {
              // Ir direto para a(s) camada(s) filtrada(s)
              try {
                const kinds = Array.from(selected).filter((k) => k && k !== "contratos" && k !== "municipios");
                let bounds = null;
                for (const k of kinds) {
                  const group = getLayerGroupByKind(k);
                  const b = group?.getBounds?.();
                  if (!b?.isValid?.()) continue;
                  bounds = bounds ? bounds.extend(b) : b;
                }
                if (state.map && bounds?.isValid?.() && !normalizeSearchText(state.municipioFilter || "")) {
                  state.map.fitBounds(bounds, { animate: false, duration: 0, padding: [28, 28], maxZoom: 16 });
                }
              } catch {
                // ignore
              }
              setStatus("Filtro: camadas aplicadas no mapa", "ok");
              // Ao aplicar, fecha o popup (ele fecha somente aqui, fora e ESC)
              try {
                closeGlobalSearchFilter();
              } catch {
                // ignore
              }
              if (selected.has("municipios")) {
                if (normalizeSearchText(state.municipioFilter || "")) {
                  void applyMunicipioFilterAndShowResults();
                } else {
                  openGlobalSearchFilter();
                  setStatus("Filtro: marque Municípios e escolha um município na lista", "info");
                }
              }
              if (selected.has("contratos")) {
                if (normalizeContractKey(state.contractFilter)) {
                  void applyContractFilterAndShowResults();
                } else if (!selected.has("municipios") || normalizeSearchText(state.municipioFilter || "")) {
                  openGlobalSearchFilter();
                  setStatus("Filtro: marque Contratos e escolha um contrato na lista", "info");
                }
              }
            });
          } catch {
            // ignore
            setStatus("Filtro: não foi possível aplicar (erro)", "error");
          }
          return;
        }
      }

      const municipioOpt = t?.closest?.("button[data-filter-municipio]");
      if (municipioOpt && globalSearchFilterEl?.contains?.(municipioOpt)) {
        e.preventDefault();
        e.stopPropagation();
        const v = municipioOpt.getAttribute("data-filter-municipio") || "";
        state.globalSearch.enabledKinds.add("municipios");
        selectMunicipioFilterValue(v);
        try {
          closeGlobalSearchFilter();
        } catch {
          // ignore
        }
        return;
      }

      const contractOpt = t?.closest?.("button[data-filter-contract]");
      if (contractOpt && globalSearchFilterEl?.contains?.(contractOpt)) {
        e.preventDefault();
        e.stopPropagation();
        const v = contractOpt.getAttribute("data-filter-contract") || "";
        state.globalSearch.enabledKinds.add("contratos");
        selectContractFilterValue(v);
        try {
          closeGlobalSearchFilter();
        } catch {
          // ignore
        }
        return;
      }

    });

    // "change" cobre clique no checkbox e no texto do label.
    globalSearchFilterEl?.addEventListener("change", (e) => {
      const cb = e.target?.closest?.('input[type="checkbox"][data-kind]');
      if (!cb || !globalSearchFilterEl?.contains?.(cb)) return;
      applyGlobalSearchFilterKindToggle(cb);
    });

    globalSearchFilterEl?.addEventListener("input", (e) => {
      const municipioInput = e.target?.closest?.("#global-search-filter-municipio-input");
      if (municipioInput && globalSearchFilterEl?.contains?.(municipioInput)) {
        state.municipioUiFilterText = municipioInput.value || "";
        renderGlobalSearchMunicipiosPanel();
        return;
      }
      const contractInput = e.target?.closest?.("#global-search-filter-contract-input");
      if (contractInput && globalSearchFilterEl?.contains?.(contractInput)) {
        state.contractUiFilterText = contractInput.value || "";
        renderGlobalSearchContractsPanel();
      }
    });

    globalSearchResultsEl?.addEventListener("click", (e) => {
      const t = e.target;
      const more = t?.closest?.("button.global-search-results__more[data-action=\"more\"]");
      if (more) {
        state.globalSearch.maxVisible = Math.min((state.globalSearch.maxVisible || 12) + 40, state.globalSearch.results.length);
        renderGlobalSearchResults(state.globalSearch.results);
        return;
      }
      const moreGroup = t?.closest?.("button.gsr-section__more[data-action=\"more-group\"][data-group]");
      if (moreGroup) {
        const g = moreGroup.getAttribute("data-group") || "";
        const key = normalizeSearchText(g) || g;
        if (!state.globalSearch.groupLimits) state.globalSearch.groupLimits = {};
        state.globalSearch.groupLimits[key] = Math.min((state.globalSearch.groupLimits[key] || 6) + 30, 200);
        renderGlobalSearchResults(state.globalSearch.results);
        return;
      }
      const item = t?.closest?.(".global-search-results__item[data-idx]");
      if (!item) return;
      const idx = parseInt(item.getAttribute("data-idx"), 10);
      if (Number.isNaN(idx)) return;
      const res = state.globalSearch.results?.[idx];
      void openSearchResult(res);
    });
    // Clique fora fecha popovers
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (t?.closest?.(".global-search")) return;
      if (t?.closest?.("#global-search-filter")) return;
      if (t?.closest?.("#global-search-results")) return;
      closeGlobalSearchFilter();
      closeGlobalSearchResults();
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
      if (!state.map || !state.selectedFeature) return;
      zoomToFeatureNow(state.selectedFeature, state.selectedLayer, state.lastSelectionKind || "segmentos", true);
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
      const kind = state.tableDataset;

      const pickFromRow = (row, attrName, feats, layers, selectionKind) => {
        if (!row) return false;
        const idx = parseInt(row.getAttribute(attrName), 10);
        if (Number.isNaN(idx)) return false;
        const feature = feats?.[idx];
        const layer = layers?.[idx];
        if (!feature) return false;
        state.selectedFeature = feature;
        state.selectedLayer = layer || null;
        state.lastSelectionKind = selectionKind;
        return true;
      };

      let ok = false;
      if (kind === "segmentos") {
        const row = target.closest?.("#all-attributes-table tbody tr[data-feature-index]");
        ok = pickFromRow(row, "data-feature-index", state.allFeatures, state.layersByIndex, "segmentos");
      } else if (kind === "bueiros") {
        const row = target.closest?.("#bueiros-attributes-table tbody tr[data-bueiros-index]");
        ok = pickFromRow(row, "data-bueiros-index", state.bueirosFeatures, state.bueirosLayersByIndex, "bueiros");
      } else if (kind === "pontes") {
        const row = target.closest?.("#pontes-attributes-table tbody tr[data-pontes-index]");
        ok = pickFromRow(row, "data-pontes-index", state.pontesFeatures, state.pontesLayersByIndex, "pontes");
      } else if (kind === "jazidas") {
        const row = target.closest?.("#jazidas-attributes-table tbody tr[data-jazidas-index]");
        ok = pickFromRow(row, "data-jazidas-index", state.jazidasFeatures, state.jazidasLayersByIndex, "jazidas");
      } else if (kind === "bueiros-br174") {
        const row = target.closest?.("#bueiros-br174-attributes-table tbody tr[data-bueiros-br174-index]");
        ok = pickFromRow(row, "data-bueiros-br174-index", state.bueirosBr174Features, state.bueirosBr174LayersByIndex, "bueiros-br174");
      } else if (kind === "prads-br174") {
        const row = target.closest?.("#prads-br174-attributes-table tbody tr[data-prads-br174-index]");
        ok = pickFromRow(row, "data-prads-br174-index", state.pradsBr174Features, state.pradsBr174LayersByIndex, "prads-br174");
      } else if (kind === "pca-prads-br319") {
      } else if (kind === "prads-br319") {
        const row = target.closest?.("#pca-prads-br319-attributes-table tbody tr[data-pca-prads-br319-index]");
        ok = pickFromRow(row, "data-pca-prads-br319-index", state.pcaPradsBr319Features, state.pcaPradsBr319LayersByIndex, "pca-prads-br319");
        ok = pickFromRow(row, "data-prads-br319-index", state.pradsBr319Features, state.pradsBr319LayersByIndex, "prads-br319");
      } else if (kind === "pca-prads-cmm-br319") {
        const row = target.closest?.("#pca-prads-cmm-br319-attributes-table tbody tr[data-pca-prads-cmm-br319-index]");
        ok = pickFromRow(row, "data-pca-prads-cmm-br319-index", state.pcaPradsCmmBr319Features, state.pcaPradsCmmBr319LayersByIndex, "pca-prads-cmm-br319");
      } else if (kind === "pontes-br319") {
        const row = target.closest?.("#pontes-br319-attributes-table tbody tr[data-pontes-br319-index]");
        ok = pickFromRow(row, "data-pontes-br319-index", state.pontesBr319Features, state.pontesBr319LayersByIndex, "pontes-br319");
      } else if (kind === "pontes-br230") {
        const row = target.closest?.("#pontes-br230-attributes-table tbody tr[data-pontes-br230-index]");
        ok = pickFromRow(row, "data-pontes-br230-index", state.pontesBr230Features, state.pontesBr230LayersByIndex, "pontes-br230");
      } else if (kind === "uc-estadual") {
        const row = target.closest?.("#uc-estadual-attributes-table tbody tr[data-uc-estadual-index]");
        ok = pickFromRow(row, "data-uc-estadual-index", state.ucEstadualFeatures, state.ucEstadualLayersByIndex, "uc-estadual");
      } else if (kind === "uc-municipal") {
        const row = target.closest?.("#uc-municipal-attributes-table tbody tr[data-uc-municipal-index]");
        ok = pickFromRow(row, "data-uc-municipal-index", state.ucMunicipalFeatures, state.ucMunicipalLayersByIndex, "uc-municipal");
      }

      if (!ok) return;
      e.preventDefault();
      e.stopPropagation();
      showCtxAt(e.clientX, e.clientY);
    });

    function fitSegmentosBoundsNow() {
      if (!state.map || !state.geojsonLayer?.getBounds) return;
      const b = state.geojsonLayer.getBounds();
      if (!b?.isValid?.()) return;
      state.map.fitBounds(b, {
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
    layerLimiteToggle?.addEventListener("click", (e) => e.stopPropagation());
    layerLimiteMunicipalToggle?.addEventListener("click", (e) => e.stopPropagation());

    // Ao ligar/desligar toggle de camada:
    // - desligar: limpa seleção dessa camada
    // - ligar com tabela já aberta: abre automaticamente a tabela desta camada
    document.querySelector(".sidebar-section--layers")?.addEventListener("change", (e) => {
      const t = e.target;
      if (!t || t.type !== "checkbox") return;
      const id = String(t.id || "");
      if (!id.startsWith("layer-")) return;
      syncLayerRowsToggleUi();
      if (layerLegendEl?.classList.contains("is-open")) {
        try {
          renderLayerLegend();
        } catch {
          // ignore
        }
      }
      const kind = kindFromLayerToggleId(id);
      if (!t.checked) {
        if (kind) clearSelectionForTurnedOffKind(kind);
        // Última camada de dados off → mantém somente Limite Estadual ligado.
        if (id !== "layer-limite-estadual") ensureLimiteEstadualWhenNoDataLayers();
        return;
      }
      if (!kind) return;
      maybeOpenAttributesTableWhenLayerEnabled(kind);
    });

    layerLimiteToggle?.addEventListener("change", () => {
      if (!layerLimiteToggle) return;
      // Com todas as camadas de dados desligadas, Limite Estadual não pode ficar off.
      if (!layerLimiteToggle.checked && allAvailableDataTogglesOff()) {
        forceOnlyLimiteEstadualOn();
        renderLayerLegend();
        return;
      }
      applyLimiteEstadualVisibility();
      renderLayerLegend();
      if (!layerLimiteToggle.checked) {
        state.limiteEstadualUserHidden = true;
        // Garante remoção efetiva do mapa.
        try {
          if (state.map && state.boundaryLayer && state.map.hasLayer(state.boundaryLayer)) {
            state.map.removeLayer(state.boundaryLayer);
          }
        } catch {
          // ignore
        }
        // Libera referência: se ligar de novo, recarrega do endpoint.
        state.boundaryLayer = null;
        return;
      }
      state.limiteEstadualUserHidden = false;
      if (shouldExpandLayerGroupsOnToggle()) toggleLimitesAmMenu(true);
      void attachLimiteEstadualLayerIfNeeded().finally(() => {
        applyLimiteEstadualVisibility();
        bringLimiteEstadualToBackIfVisible();
      });
    });

    layerLimiteMunicipalToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerLimiteMunicipalToggle.checked) {
        if (shouldExpandLayerGroupsOnToggle()) toggleLimitesAmMenu(true);
        void attachLimiteMunicipalLayerIfNeeded().finally(() => {
          applyLimiteMunicipalVisibility();
        });
      } else {
        applyLimiteMunicipalVisibility();
      }
      renderLayerLegend();
    });

    layersDisableAllBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Desligar todas as camadas de dados, mantendo apenas Limite Estadual.
      turnOffAllDataLayersKeepLimiteEstadual();
    });

    menuToggleLayersBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        toggleDataLayersFromMenu();
      } catch {
        // ignore
      }
    });

    menuDeselectLayersBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        turnOffAllDataLayersKeepLimiteEstadual();
        clearCurrentSelection();
        hideFeatureQuickMenu(true);
        closeMobileSidebarIfNeeded();
        setStatus("Camadas desmarcadas — mantido apenas o Limite Estadual", "ok");
      } catch {
        // ignore
      }
    });

    menuFitAmazonasBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      fitMapToStateBoundaryNow();
    });

    // Menu deixou de ser recolhível: mantém sempre visível
    try {
      const host = document.querySelector(".sidebar-section--menu");
      host?.classList?.remove("is-expanded");
      if (menuSubtree) menuSubtree.setAttribute("aria-hidden", "false");
    } catch {
      // noop
    }

    // Popup de município: foca uma camada com feições daquele município.
    municipioFilterPopup?.addEventListener("click", (e) => {
      const closeBtn = e.target?.closest?.("[data-municipio-popup-close]");
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (municipioFilterPopup) municipioFilterPopup.hidden = true;
        return;
      }
      const pill = e.target?.closest?.("button[data-municipio-layer-kind]");
      if (!pill) return;
      e.preventDefault();
      e.stopPropagation();
      const kind = pill.getAttribute("data-municipio-layer-kind") || "";
      const label = pill.getAttribute("data-municipio-layer-label") || kind;
      if (!kind) return;
      state.municipioFocusLayerLabel = label;
      showMunicipioLayersPopup(state.municipioFilter);
      setToggleChecked(kind, true);
      setStatus(`Município: focando ${label}…`, "info");
      Promise.resolve(ensureKindOnMap(kind))
        .then(async () => {
          const group = getLayerGroupByKind(kind);
          if (group) ensureLayerVisibleOnMap(group, { force: true });
          applyContractFilterToMap();
          fitMapToMunicipioInLayerGroup(group);
          await openMunicipioMatchedLayerTable(kind);
          setStatus(`Município: ${state.municipioFilter} — ${label}`, "ok");
        })
        .catch(() => setStatus(`Município: não foi possível focar ${label}`, "error"));
    });

    menuContractSelect?.addEventListener("change", () => {
      state.contractFilter = normalizeContractValue(menuContractSelect.value);
      state.contractFocusLayerLabel = "";
      try {
        if (normalizeContractKey(state.contractFilter)) {
          state.globalSearch.enabledKinds.add("contratos");
        } else {
          state.globalSearch.enabledKinds.delete("contratos");
        }
      } catch {
        // ignore
      }
      void applyContractFilterAndShowResults();
    });

    function toggleRodoviasMenu(force) {
      if (!groupRodovias || !headRodovias) return;
      const next =
        force === true ? true : force === false ? false : !groupRodovias.classList.contains("is-expanded");
      groupRodovias.classList.toggle("is-expanded", next);
      headRodovias.setAttribute("aria-expanded", next ? "true" : "false");
      if (subtreeRodovias) subtreeRodovias.setAttribute("aria-hidden", next ? "false" : "true");
    }

    function toggleAquaviarioMenu(force) {
      if (!groupAquaviario || !headAquaviario) return;
      const next =
        force === true
          ? true
          : force === false
            ? false
            : !groupAquaviario.classList.contains("is-expanded");
      groupAquaviario.classList.toggle("is-expanded", next);
      headAquaviario.setAttribute("aria-expanded", next ? "true" : "false");
      if (subtreeAquaviario) subtreeAquaviario.setAttribute("aria-hidden", next ? "false" : "true");
    }

    function toggleUcMenu(force) {
      if (!groupUc || !headUc) return;
      const next =
        force === true ? true : force === false ? false : !groupUc.classList.contains("is-expanded");
      groupUc.classList.toggle("is-expanded", next);
      headUc.setAttribute("aria-expanded", next ? "true" : "false");
      if (subtreeUc) subtreeUc.setAttribute("aria-hidden", next ? "false" : "true");
    }

    function toggleLimitesAmMenu(force) {
      if (!groupLimitesAm || !headLimitesAm) return;
      const next =
        force === true
          ? true
          : force === false
            ? false
            : !groupLimitesAm.classList.contains("is-expanded");
      groupLimitesAm.classList.toggle("is-expanded", next);
      headLimitesAm.setAttribute("aria-expanded", next ? "true" : "false");
      if (subtreeLimitesAm) subtreeLimitesAm.setAttribute("aria-hidden", next ? "false" : "true");
    }

    headRodovias?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleRodoviasMenu();
    });
    headRodovias?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleRodoviasMenu();
      }
    });

    headAquaviario?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAquaviarioMenu();
    });
    headAquaviario?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleAquaviarioMenu();
      }
    });

    headUc?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleUcMenu();
    });
    headUc?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleUcMenu();
      }
    });

    headLimitesAm?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLimitesAmMenu();
    });
    headLimitesAm?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleLimitesAmMenu();
      }
    });

    headBrAm?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBrAmGroup();
    });
    headBrAm?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBrAmGroup();
      }
    });

    function toggleBranchBr317(force) {
      if (!branchBr317 || !branchHeadBr317) return;
      const next =
        force === true ? true : force === false ? false : !branchBr317.classList.contains("is-expanded");
      branchBr317.classList.toggle("is-expanded", next);
      branchHeadBr317.setAttribute("aria-expanded", next ? "true" : "false");
    }

    branchHeadBr317?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBranchBr317();
    });
    branchHeadBr317?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBranchBr317();
      }
    });

    function toggleBranchBr307(force) {
      if (!branchBr307 || !branchHeadBr307) return;
      const next =
        force === true ? true : force === false ? false : !branchBr307.classList.contains("is-expanded");
      branchBr307.classList.toggle("is-expanded", next);
      branchHeadBr307.setAttribute("aria-expanded", next ? "true" : "false");
    }

    branchHeadBr307?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBranchBr307();
    });
    branchHeadBr307?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBranchBr307();
      }
    });

    function toggleBranchBr319(force) {
      if (!branchBr319 || !branchHeadBr319) return;
      const next =
        force === true ? true : force === false ? false : !branchBr319.classList.contains("is-expanded");
      branchBr319.classList.toggle("is-expanded", next);
      branchHeadBr319.setAttribute("aria-expanded", next ? "true" : "false");
    }

    branchHeadBr319?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBranchBr319();
    });
    branchHeadBr319?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBranchBr319();
      }
    });

    function toggleBranchBr230(force) {
      if (!branchBr230 || !branchHeadBr230) return;
      const next =
        force === true ? true : force === false ? false : !branchBr230.classList.contains("is-expanded");
      branchBr230.classList.toggle("is-expanded", next);
      branchHeadBr230.setAttribute("aria-expanded", next ? "true" : "false");
    }

    branchHeadBr230?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBranchBr230();
    });
    branchHeadBr230?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBranchBr230();
      }
    });

    function toggleBranchBr174(force) {
      if (!branchBr174 || !branchHeadBr174) return;
      const next =
        force === true ? true : force === false ? false : !branchBr174.classList.contains("is-expanded");
      branchBr174.classList.toggle("is-expanded", next);
      branchHeadBr174.setAttribute("aria-expanded", next ? "true" : "false");
    }

    branchHeadBr174?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleBranchBr174();
    });
    branchHeadBr174?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleBranchBr174();
      }
    });

    layerBueirosToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerBueirosToggle.checked) {
        void ensureBueirosBr317OnMap();
      } else if (state.bueirosLayer) {
        state.map.removeLayer(state.bueirosLayer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    fetchBueirosBr317Info().then(applyBueirosAvailability);
    fetchPontesBr307Info().then(applyPontesAvailability);
    fetchPontesBr319Info().then(applyPontesBr319Availability);
    fetchPontesBr230Info().then(applyPontesBr230Availability);
    fetchBueirosBr319Info().then(applyBueirosBr319Availability);
    fetchJazidasBr307Info().then(applyJazidasAvailability);
    fetchUcEstadualInfo().then(applyUcEstadualAvailability);
    fetchUcMunicipalInfo().then(applyUcMunicipalAvailability);
    fetchIp4Info().then(applyIp4Availability);
    fetchHidroviasAmInfo().then(applyHidroviasAmAvailability);
    fetchTiAmInfo().then(applyTiAmAvailability);
    fetchLimiteMunicipalInfo().then(applyLimiteMunicipalAvailability);
    fetchBueirosBr174Info().then(applyBueirosBr174Availability);
    fetchPradsBr174Info().then(applyPradsBr174Availability);
    fetchPcaPradsBr319Info().then(applyPcaPradsBr319Availability);
    fetchPradsBr319Info().then(applyPradsBr319Availability);
    fetchPcaPradsCmmBr319Info().then(applyPcaPradsCmmBr319Availability);
    fetchBueirosBr230Info().then(applyBueirosBr230Availability);
    void initBrAmGroup();


    layerPontesToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerPontesToggle.checked) {
        void ensurePontesBr307OnMap();
      } else if (state.pontesBr307Layer) {
        state.map.removeLayer(state.pontesBr307Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerPontesBr319Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerPontesBr319Toggle.checked) {
        void ensurePontesBr319OnMap();
      } else if (state.pontesBr319Layer) {
        state.map.removeLayer(state.pontesBr319Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerPontesBr230Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerPontesBr230Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerPontesBr230Toggle.checked) {
        void ensurePontesBr230OnMap();
      } else if (state.pontesBr230Layer) {
        state.map.removeLayer(state.pontesBr230Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerBueirosBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerBueirosBr319Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerBueirosBr319Toggle.checked) {
        void ensureBueirosBr319OnMap();
      } else if (state.bueirosBr319Layer) {
        state.map.removeLayer(state.bueirosBr319Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });


    layerJazidasToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerJazidasToggle.checked) {
        void ensureJazidasBr307OnMap();
      } else if (state.jazidasBr307Layer) {
        state.map.removeLayer(state.jazidasBr307Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });


    layerUcEstadualToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerUcEstadualToggle.checked) {
        if (shouldExpandLayerGroupsOnToggle()) toggleUcMenu(true);
        void ensureUcEstadualOnMap();
      } else if (state.ucEstadualLayer) {
        state.map.removeLayer(state.ucEstadualLayer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerUcMunicipalToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerUcMunicipalToggle.checked) {
        if (shouldExpandLayerGroupsOnToggle()) toggleUcMenu(true);
        void ensureUcMunicipalOnMap();
      } else if (state.ucMunicipalLayer) {
        state.map.removeLayer(state.ucMunicipalLayer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerIp4Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerIp4Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerIp4Toggle.checked) {
        if (shouldExpandLayerGroupsOnToggle()) toggleAquaviarioMenu(true);
        void ensureIp4OnMap();
      } else if (state.ip4Layer) {
        state.map.removeLayer(state.ip4Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerHidroviasAmToggle?.addEventListener("click", (e) => e.stopPropagation());
    layerHidroviasAmToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerHidroviasAmToggle.checked) {
        if (shouldExpandLayerGroupsOnToggle()) toggleAquaviarioMenu(true);
        void ensureHidroviasAmOnMap();
      } else if (state.hidroviasAmLayer) {
        state.map.removeLayer(state.hidroviasAmLayer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerTiAmToggle?.addEventListener("click", (e) => e.stopPropagation());
    layerTiAmToggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerTiAmToggle.checked) {
        if (shouldExpandLayerGroupsOnToggle()) toggleUcMenu(true);
        void ensureTiAmOnMap();
      } else if (state.tiAmLayer) {
        state.map.removeLayer(state.tiAmLayer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerBueirosBr174Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerPradsBr174Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerPcaPradsBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerPradsBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerPcaPradsCmmBr319Toggle?.addEventListener("click", (e) => e.stopPropagation());
    layerBueirosBr230Toggle?.addEventListener("click", (e) => e.stopPropagation());

    layerBueirosBr174Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerBueirosBr174Toggle.checked) {
        void ensureBueirosBr174OnMap();
      } else if (state.bueirosBr174Layer) {
        state.map.removeLayer(state.bueirosBr174Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });

    layerPradsBr174Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerPradsBr174Toggle.checked) {
        void ensurePradsBr174OnMap();
      } else if (state.pradsBr174Layer) {
        state.map.removeLayer(state.pradsBr174Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });


    layerPcaPradsBr319Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerPcaPradsBr319Toggle.checked) {
        void ensurePcaPradsBr319OnMap();
      } else if (state.pcaPradsBr319Layer) {
        state.map.removeLayer(state.pcaPradsBr319Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });
    layerPradsBr319Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerPradsBr319Toggle.checked) {
        void ensurePradsBr319OnMap();
      } else if (state.pradsBr319Layer) {
        state.map.removeLayer(state.pradsBr319Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });
    layerPcaPradsCmmBr319Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerPcaPradsCmmBr319Toggle.checked) {
        void ensurePcaPradsCmmBr319OnMap();
      } else if (state.pcaPradsCmmBr319Layer) {
        state.map.removeLayer(state.pcaPradsCmmBr319Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });


    layerBueirosBr230Toggle?.addEventListener("change", () => {
      if (!state.map) return;
      if (layerBueirosBr230Toggle.checked) {
        void ensureBueirosBr230OnMap();
      } else if (state.bueirosBr230Layer) {
        state.map.removeLayer(state.bueirosBr230Layer);
        afterRodoviasSublayerVisibilityChange();
      }
      renderLayerLegend();
    });


    const fitSegmentos = () => {
      // Segmentos BR-319 removido do mapa.
      return;
      if (!state.geojsonLayer) {
        state.pendingFitSegmentos = true;
        setStatus("Dados: carregando (zoom pendente)...", "loading");
        return;
      }
      const b = state.geojsonLayer.getBounds?.();
      if (!b?.isValid?.()) return;
      if (!state.map.hasLayer(state.geojsonLayer)) {
        if (layerSegmentosToggle) layerSegmentosToggle.checked = true;
        mountDataLayerIfAllowed(state.geojsonLayer, layerSegmentosToggle);
        if (state.geojsonLayer.bringToFront) state.geojsonLayer.bringToFront();
      }
      fitSegmentosBoundsNow();
    };

    layerRowSegmentos?.addEventListener("click", fitSegmentos);
    layerRowSegmentos?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fitSegmentos();
      }
    });

    // Menu "3 pontinhos" das subcamadas (kebab menu)
    enhanceLayerKebabMenus();

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
        void openAttributesTableForLayer(layer);
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
          menu.innerHTML = buildLayerKebabMenuInnerHtml(layer);
        }

        const willOpen = Boolean(menu.hidden);
        closeAllLayerMenus();
        if (!willOpen) return;

        positionLayerKebabMenu(kebabBtn, menu);
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

    btnFit?.addEventListener("click", () => {
      if (!state.map) return;
      if (
        state.geojsonLayer &&
        state.map.hasLayer(state.geojsonLayer) &&
        state.boundsAll?.isValid?.()
      ) {
        state.map.fitBounds(state.boundsAll, { animate: false, duration: 0, padding: [20, 20] });
        return;
      }
      const bb = state.boundaryLayer?.getBounds?.();
      if (bb?.isValid?.()) {
        state.map.fitBounds(bb, { animate: false, duration: 0, padding: [20, 20] });
      }
    });

    btnLocate?.addEventListener("click", () => {
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
          }).addTo(state.map);
          state.map.setView([latitude, longitude], 12, { animate: false, duration: 0 });
          // Sem delay: remove imediatamente o marcador temporário.
          state.map.removeLayer(m);
        },
        () => {}
      );
    });

    btnLegend?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!layerLegendEl) return;
      const next = !layerLegendEl.classList.contains("is-open");
      setLegendPanelOpen(next);
    });
    try {
      updateCamadasFootSummary();
    } catch {
      // ignore
    }
    layerLegendCloseBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setLegendPanelOpen(false);
    });
    layerLegendClearBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearMapLegendLayers();
    });
    layerLegendBodyEl?.addEventListener("change", (e) => {
      const input = e.target?.closest?.("input.map-legend__check");
      if (!input) return;
      const checked = Boolean(input.checked);
      const layerToggleId = input.getAttribute("data-layer-toggle") || "";
      const nodeId = input.getAttribute("data-legend-node") || "";

      if (layerToggleId) {
        applyLegendLeafToggle(layerToggleId, checked);
      } else if (nodeId) {
        applyLegendTreeNodeToggle(nodeId, checked);
      } else {
        return;
      }

      // Atualiza o painel após os change handlers das camadas.
      window.setTimeout(() => {
        try {
          renderLayerLegend();
          updateCamadasFootSummary();
        } catch {
          // ignore
        }
      }, 0);
    });

    // Redimensionamento do painel inferior (arrastar a "linha" superior)
    if (bottomSheet && bottomSheetHandle) {
      const minH = 180;
      const maxH = () => Math.max(minH, Math.round(window.innerHeight * 0.9));
      let startY = 0;
      let startH = 0;
      let dragging = false;

      const onMove = (clientY) => {
        if (!dragging) return;
        const dy = startY - clientY;
        const next = Math.min(maxH(), Math.max(minH, startH + dy));
        bottomSheet.style.height = `${next}px`;
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
        startH = bottomSheet.getBoundingClientRect().height;
        document.body.style.userSelect = "none";
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", stop, { once: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("touchend", stop, { once: true });
      };

      bottomSheetHandle.addEventListener("pointerdown", (e) => start(e.clientY));
      bottomSheetHandle.addEventListener("touchstart", (e) => {
        const t = e.touches?.[0];
        if (t) start(t.clientY);
      });

      window.addEventListener("resize", () => {
        const h = bottomSheet.getBoundingClientRect().height;
        if (h > maxH()) bottomSheet.style.height = `${maxH()}px`;
      });
    }
  }

  function initMap() {
    state.map = L.map("map", {
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
    if (!state.escGlobalHandlerAttached) {
      state.escGlobalHandlerAttached = true;
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;

        // Não atrapalhar digitação em inputs/textarea/select — mas ESC ainda fecha tabela/popup.
        const ae = document.activeElement;
        const tag = (ae?.tagName || "").toLowerCase();
        const isTyping = tag === "input" || tag === "textarea" || tag === "select" || ae?.isContentEditable;
        if (isTyping) {
          try {
            if (dismissTablesAndPopups()) {
              e.preventDefault();
              return;
            }
          } catch {
            // ignore
          }
          try {
            closeGlobalSearchFilter();
          } catch {
            // ignore
          }
          try {
            closeGlobalSearchResults();
          } catch {
            // ignore
          }
          try {
            closeMapBasemapPicker();
          } catch {
            // ignore
          }
          // Não limpa seleção / não reenquadra enquanto o usuário está editando.
          return;
        }

        // Tabela aberta e/ou popup: ESC fecha ambos.
        try {
          if (dismissTablesAndPopups()) {
            e.preventDefault();
            return;
          }
        } catch {
          // ignore
        }

        // Fecha popovers da busca global (resultados/filtros)
        try {
          closeGlobalSearchFilter();
        } catch {
          // ignore
        }
        try {
          closeGlobalSearchResults();
        } catch {
          // ignore
        }

        // Fecha UI de mapa base / contrato / menus flutuantes
        try {
          closeMapBasemapPicker();
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
          state.selectionMode = "click";
          if (menuSelectMode) menuSelectMode.value = "click";
        } catch {
          // ignore
        }

        // Se há seleção, limpa e reenquadra
        if (state.selectedFeature || state.selectedFeatureIndex !== null) {
          clearCurrentSelection();
          fitMapToStateBoundaryNow();
        }
      });
    }
    ensureInfraGeoPanes();
    // Garantia extra (em alguns builds o handler pode estar ativo mesmo com opção falsa)
    state.map.boxZoom?.disable?.();
    state.basemapLayers = buildBasemapLayers();
    setBasemapLayer(state.currentBasemapId || "imagery");
    setupBasemapSelect();

    // Limite Municipal só é carregado quando o usuário ligar a camada (sem auto-ativar na inicialização).

    // Seleção por arraste (retângulo)
    try {
      if (menuSelectMode) {
        menuSelectMode.value = state.selectionMode;
        menuSelectMode.addEventListener("change", () => {
          // Desativa seleção por retângulo: ela cria um "quadro" visual que não queremos exibir.
          const next = String(menuSelectMode.value || "click");
          state.selectionMode = next === "box" ? "click" : next;
          if (next === "box") {
            try {
              menuSelectMode.value = "click";
            } catch {
              // ignore
            }
          }
          setStatus("Seleção: clique", "ok");
        });
      }
      if (menuSelectTarget) {
        menuSelectTarget.value = state.selectionTarget;
        menuSelectTarget.addEventListener("change", () => {
          state.selectionTarget = String(menuSelectTarget.value || "auto");
        });
      }
    } catch {
      // noop
    }

    const ensureBoxRect = () => null;

    const clearBoxRect = () => {
      if (!state.map) return;
      if (state.boxSelect.rectLayer && state.map.hasLayer(state.boxSelect.rectLayer)) {
        state.map.removeLayer(state.boxSelect.rectLayer);
      }
      state.boxSelect.rectLayer = null;
    };

    const layerCandidatesByTarget = () => {
      const mk = (target, group, kind) => ({ target, group, kind });
      return [
        mk("segmentos", state.geojsonLayer, "segmentos"),
        mk("bueiros", state.bueirosLayer, "bueiros"),
        mk("pontes", state.pontesBr307Layer, "pontes"),
        mk("jazidas", state.jazidasBr307Layer, "jazidas"),
        mk("hidrovias-am", state.hidroviasAmLayer, "hidrovias-am"),
        mk("ip4", state.ip4Layer, "ip4"),
        mk("uc-estadual", state.ucEstadualLayer, "uc-estadual"),
        mk("uc-municipal", state.ucMunicipalLayer, "uc-municipal"),
        mk("ti-am", state.tiAmLayer, "ti-am"),
        mk("pontes-br319", state.pontesBr319Layer, "pontes-br319"),
        mk("pontes-br230", state.pontesBr230Layer, "pontes-br230"),
        mk("bueiros-br319", state.bueirosBr319Layer, "bueiros-br319"),
        mk("bueiros-br174", state.bueirosBr174Layer, "bueiros-br174"),
        mk("prads-br174", state.pradsBr174Layer, "prads-br174"),
        mk("pca-prads-br319", state.pcaPradsBr319Layer, "pca-prads-br319"),
        mk("prads-br319", state.pradsBr319Layer, "prads-br319"),
        mk("pca-prads-cmm-br319", state.pcaPradsCmmBr319Layer, "pca-prads-cmm-br319"),
        mk("bueiros-br230", state.bueirosBr230Layer, "bueiros-br230"),
      ];
    };

    const isGroupVisible = (group) => Boolean(state.map && group && state.map.hasLayer(group));

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
      if (!state.map) return;
      const target = String(state.selectionTarget || "auto");
      const candidates = layerCandidatesByTarget();

      const ordered =
        target === "auto"
          ? candidates.filter((c) => isGroupVisible(c.group))
          : candidates.filter((c) => c.target === target && isGroupVisible(c.group));

      for (const c of ordered) {
        const { hit, count } = findFirstFeatureInBounds(c.group, bounds);
        if (!hit?.feature) continue;
        setStatus(`Seleção: ${count} feição(ões) na caixa`, "ok");
        handleIdentifyClick(hit.getLatLng?.() || bounds.getCenter?.() || null, { zoomTo: true });
        return;
      }
      setStatus("Seleção: nenhuma feição na caixa", "ok");
    };

    const onMouseDown = (e) => {
      if (state.selectionMode !== "box") return;
      if (!state.map) return;
      const oe = e?.originalEvent;
      if (oe && oe.button !== undefined && oe.button !== 0) return;
      state.boxSelect.active = true;
      state.boxSelect.startLatLng = e.latlng;
      try {
        state.map.dragging?.disable?.();
      } catch {
        // noop
      }
      const b = L.latLngBounds(e.latlng, e.latlng);
      ensureBoxRect(b);
    };

    const onMouseMove = (e) => {
      if (state.selectionMode !== "box") return;
      if (!state.map || !state.boxSelect.active || !state.boxSelect.startLatLng) return;
      const b = L.latLngBounds(state.boxSelect.startLatLng, e.latlng);
      ensureBoxRect(b);
    };

    const onMouseUp = (e) => {
      if (state.selectionMode !== "box") return;
      if (!state.map || !state.boxSelect.active || !state.boxSelect.startLatLng) return;
      const b = L.latLngBounds(state.boxSelect.startLatLng, e.latlng);
      state.boxSelect.active = false;
      state.boxSelect.startLatLng = null;
      try {
        state.map.dragging?.enable?.();
      } catch {
        // noop
      }
      clearBoxRect();
      // Ignora cliques (retângulo minúsculo)
      try {
        const sw = state.map.latLngToContainerPoint(b.getSouthWest());
        const ne = state.map.latLngToContainerPoint(b.getNorthEast());
        const w = Math.abs(ne.x - sw.x);
        const h = Math.abs(ne.y - sw.y);
        if (w < 6 && h < 6) return;
      } catch {
        // ignore
      }
      applyBoxSelection(b);
    };

    // Leaflet events (latlng garantido)
    state.map.on("mousedown", onMouseDown);
    state.map.on("mousemove", onMouseMove);
    state.map.on("mouseup", onMouseUp);

    // Limite Estadual: inicia ligado ao abrir o mapa.
    try {
      if (layerLimiteToggle && !layerLimiteToggle.disabled) layerLimiteToggle.checked = true;
    } catch {
      // noop
    }
    state.limiteEstadualUserHidden = false;
    void attachLimiteEstadualLayerIfNeeded().finally(() => {
      applyLimiteEstadualVisibility();
      bringLimiteEstadualToBackIfVisible();
    });

    // Estado inicial: somente Limite Estadual ligado (todas as camadas de dados desligadas).
    try {
      state.suppressAutoFit = true;
      turnOffAllDataLayersKeepLimiteEstadual();
    } catch {
      // ignore
    } finally {
      state.suppressAutoFit = false;
      syncLayerRowsToggleUi();
    }

    // Clique no mapa: identifica todas as camadas/feições sobrepostas no ponto.
    state.map.on("click", (e) => {
      handleIdentifyClick(e?.latlng, { zoomTo: true });
    });

    // Boot imediato: enquadra no Amazonas e libera splash.
    fitMapToStateBoundaryNow();
    setStatus("Dados: pronto", "ok");
    hideAppLoadingSplash();

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
        layerBueirosToggle && "/layers/bueiros-br317",
        layerPontesToggle && "/layers/pontes-br307",
        layerJazidasToggle && "/layers/jazidas-br307/jazida-pontos",
        layerPontesBr319Toggle && "/layers/pontes-br319",
        layerPontesBr230Toggle && "/layers/pontes-br230",
        layerBueirosBr319Toggle && "/layers/bueiros-br319",
        layerBueirosBr174Toggle && "/layers/bueiros-br174",
        layerPradsBr174Toggle && "/layers/prads-br174",
        layerPcaPradsBr319Toggle && "/layers/pca-prads-br319",
        layerPradsBr319Toggle && "/layers/prads-br319",
        layerPcaPradsCmmBr319Toggle && "/layers/pca-prads-cmm-br319",
        layerBueirosBr230Toggle && "/layers/bueiros-br230",
        layerUcEstadualToggle && "/layers/uc-estadual",
        layerUcMunicipalToggle && "/layers/uc-municipal",
        layerIp4Toggle && "/layers/ip4",
        layerTiAmToggle && "/layers/ti-am",
        layerHidroviasAmToggle && "/layers/hidrovias-am",
      ].filter(Boolean);

      // Pré-aquece o cache compartilhado (mesma Promise usada ao ligar a camada).
      void Promise.allSettled(urls.map((u) => fetchLayerGeoJson(u)));
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
              style: (feature) => getSegmentLayerStyle(feature),
              pointToLayer(_feature, latlng) {
                return pointAsCircleMarker(latlng);
              },
            });

            // Não existe mais "camada principal" de segmentos.
            const shouldBePrimary = false;
            if (shouldBePrimary && !primarySet) {
              primarySet = true;
              state.geojsonLayer = layer;
              state.allFeatures = mapped;
              state.totalFeaturesCount = mapped.length;
              state.visibleFeaturesCount = mapped.length;
              updateGeneralSelectionInfo(0);

              layer.eachLayer((leafletLayer) => {
                const f = leafletLayer.feature;
                const idx = f?._tableIndex;
                if (typeof idx === "number") state.layersByIndex[idx] = leafletLayer;
              });

              layer.eachLayer((leafletLayer) => {
                const f = leafletLayer.feature;
                setLayerIdentifyMeta(leafletLayer, f, "segmentos");
                attachQuickHover(leafletLayer, f, "segmentos");
                bindLayerIdentifyClick(leafletLayer);
              });

              state.boundsAll = layer.getBounds();
              // Segmentos BR-319 removido do mapa (não adicionar).
            }

            // Para camadas não-primárias: habilita hover/click com selectionKind inferido,
            // garantindo que (ex.) BUEIROS BR-319 e SNV sejam tratados como camadas diferentes.
            if (!shouldBePrimary) {
              layer.eachLayer((leafletLayer) => {
                const f = leafletLayer.feature;
                setLayerIdentifyMeta(leafletLayer, f, inferredKind);
                attachQuickHover(leafletLayer, f, inferredKind);
                bindLayerIdentifyClick(leafletLayer);
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

        const segmentsOn = Boolean(layerSegmentosToggle?.checked);
        if (segmentsOn && state.boundsAll?.isValid?.()) {
          state.map.fitBounds(state.boundsAll, { animate: false, duration: 0 });
        } else {
          const bb = state.boundaryLayer?.getBounds?.();
          if (bb?.isValid?.()) {
            state.map.fitBounds(bb, { animate: false, duration: 0 });
          }
        }

        renderAllAttributesTable();
        setupHeaderSortClick();

        refreshContractOptions();
        void ensureContractSourcesLoaded();

        // Não força Limite Estadual na inicialização.
        if (layerLimiteToggle) layerLimiteToggle.disabled = false;
        layerLimiteRow?.classList.remove("layer-row--disabled");

        // Se o usuário clicou em "Segmentos" (enquadrar) antes de carregar, aplica agora.
        if (state.pendingFitSegmentos) {
          state.pendingFitSegmentos = false;
          if (state.geojsonLayer && state.map) {
            if (layerSegmentosToggle) layerSegmentosToggle.checked = true;
            if (!state.map.hasLayer(state.geojsonLayer)) {
              mountDataLayerIfAllowed(state.geojsonLayer, layerSegmentosToggle);
              if (state.geojsonLayer.bringToFront) state.geojsonLayer.bringToFront();
            }
            const b = state.geojsonLayer.getBounds?.();
            if (b?.isValid?.()) {
              state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24] });
            }
          }
        }

        bringLimiteEstadualToBackIfVisible();

        setStatus(`Dados: ${state.totalFeaturesCount} feições`);
        return { fallbackToData: false };
      })
      .then((res) => {
        if (!res?.fallbackToData) return;

        // Fallback legacy
        return fetch("/data")
          .then((r) => r.json())
          .then(async (data) => {
            const originalFeatures = data.features || [];
            state.allFeatures = originalFeatures.map((f, idx) => ({ ...f, _tableIndex: idx }));
            state.totalFeaturesCount = state.allFeatures.length;
            state.visibleFeaturesCount = state.allFeatures.length;
            updateGeneralSelectionInfo(0);
            data.features = state.allFeatures;

            state.geojsonLayer = L.geoJSON(data, {
              style: (feature) => {
                return getSegmentLayerStyle(feature);
              },
              onEachFeature: (feature, layer) => {
                const idx = feature._tableIndex;
                if (typeof idx === "number") state.layersByIndex[idx] = layer;
                setLayerIdentifyMeta(layer, feature, "segmentos");
                attachQuickHover(layer, feature, "segmentos");
                bindLayerIdentifyClick(layer);
              },
            });

            if (layerSegmentosToggle?.checked) {
              mountDataLayerIfAllowed(state.geojsonLayer, layerSegmentosToggle);
            }

            state.boundsAll = state.geojsonLayer.getBounds();
            // Limite Estadual não é carregado automaticamente; somente quando o usuário ligar no switch.
            const segmentsOnFb = Boolean(layerSegmentosToggle?.checked);
            if (segmentsOnFb && state.boundsAll?.isValid?.()) {
              state.map.fitBounds(state.boundsAll, { animate: false, duration: 0 });
            } else {
              const bbLim = state.boundaryLayer?.getBounds?.();
              if (bbLim?.isValid?.()) {
                state.map.fitBounds(bbLim, { animate: false, duration: 0 });
              }
            }

            // Não força Limite Estadual na inicialização.
            if (layerLimiteToggle) layerLimiteToggle.disabled = false;
            layerLimiteRow?.classList.remove("layer-row--disabled");
            bringLimiteEstadualToBackIfVisible();

            if (state.pendingFitSegmentos) {
              state.pendingFitSegmentos = false;
              if (layerSegmentosToggle) layerSegmentosToggle.checked = true;
              if (!state.map.hasLayer(state.geojsonLayer)) {
                mountDataLayerIfAllowed(state.geojsonLayer, layerSegmentosToggle);
                if (state.geojsonLayer.bringToFront) state.geojsonLayer.bringToFront();
              }
              const b = state.geojsonLayer.getBounds?.();
              if (b?.isValid?.()) {
                state.map.fitBounds(b, { animate: false, duration: 0, padding: [24, 24] });
              }
            }

            renderAllAttributesTable();
            setupHeaderSortClick();

            refreshContractOptions();
            void ensureContractSourcesLoaded();

            setStatus(`Dados: ${state.totalFeaturesCount} feições`);
          });
        })
        .catch((err) => {
          console.error(err);
          setStatus("Dados: erro ao carregar", "error");
        });
    };
    // Sem delay para iniciar carga pesada
    startBackgroundLoad();
  }

  // Tema (claro/noturno) — aplica antes de iniciar o mapa/UI pesada
  setThemePreference(loadThemePreference());

  bindUi();
  initMap();
  // Legenda minimalista abaixo das camadas (sincroniza com toggles / mapa base)
  try {
    renderLayerLegend();
  } catch {
    // ignore
  }

  // Removido: pré-carga que altera toggles temporariamente.
})();

