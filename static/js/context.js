/* global L */
export function createApp() {
  const app = {};

  app.$ = (id) => document.getElementById(id);
  const $ = (...args) => app.$(...args);

  app.earlyErrors = [];
  const earlyErrors = app.earlyErrors;

  window.addEventListener("error", (e) => {
      try {
        app.earlyErrors.push(String(e?.message || e));
      } catch {
        app.earlyErrors.push("Erro desconhecido");
      }
    });
  window.addEventListener("unhandledrejection", (e) => {
      try {
        app.earlyErrors.push(String(e?.reason?.message || e?.reason || e));
      } catch {
        app.earlyErrors.push("Promise rejeitada (desconhecido)");
      }
    });
  app.statusEl = $("data-status");
  app.loadingSplashEl = $("app-loading-splash");
  app.mapEl = $("map");
  app.featureQuickMenuEl = $("feature-quick-menu");
  app.featureQuickCloseBtn = $("feature-quick-close");
  app.featureQuickTitleEl = $("feature-quick-title");
  app.featureQuickSubtitleEl = $("feature-quick-subtitle");
  app.featureQuickBodyEl = $("feature-quick-body");
  app.bottomSheet = $("bottom-sheet");
  app.bottomSheetClose = $("bottom-sheet-close");
  app.bottomSheetRestore = $("bottom-sheet-restore");
  app.bottomSheetHandle = $("bottom-sheet-handle");
  app.bottomZoomSelected = $("bottom-zoom-selected");
  app.themeToggleBtn = $("theme-toggle");
  app.mobileSidebarToggleBtn = $("mobile-sidebar-toggle");
  app.mobileSidebarBackdrop = $("mobile-sidebar-backdrop");
  app.globalSearchInput = $("global-search-input");
  app.globalSearchFeedback = $("global-search-feedback");
  app.globalSearchFilterBtn = $("global-search-filter-btn");
  app.globalSearchFilterEl = $("global-search-filter");
  app.globalSearchResultsEl = $("global-search-results");
  app.generalFilterInput = $("general-filter");
  app.generalFilterHint = $("general-filter-hint");
  try {
      if (app.globalSearchFilterEl && app.globalSearchFilterEl.parentElement !== document.body) {
        document.body.appendChild(app.globalSearchFilterEl);
      }
      if (app.globalSearchResultsEl && app.globalSearchResultsEl.parentElement !== document.body) {
        document.body.appendChild(app.globalSearchResultsEl);
      }
    }
  catch {
      // ignore
    }
  app.layerRowSegmentos = null;
  app.layerSegmentosToggle = null;
  app.layerBueirosToggle = $("layer-bueiros-br317");
  app.layerBueirosRow = $("layer-row-bueiros-br317");
  app.layerBueirosHint = $("layer-bueiros-br317-hint");
  app.branchBr317 = $("layer-branch-br317");
  app.branchHeadBr317 = $("layer-branch-br317-head");
  app.branchBr307 = $("layer-branch-br307");
  app.branchHeadBr307 = $("layer-branch-br307-head");
  app.branchBr319 = $("layer-branch-br319");
  app.branchHeadBr319 = $("layer-branch-br319-head");
  app.branchBr230 = $("layer-branch-br230");
  app.branchHeadBr230 = $("layer-branch-br230-head");
  app.layerBueirosBr230Toggle = $("layer-bueiros-br230");
  app.layerBueirosBr230Row = $("layer-row-bueiros-br230");
  app.layerBueirosBr230Hint = $("layer-bueiros-br230-hint");
  app.layerPontesBr230Toggle = $("layer-pontes-br230");
  app.layerPontesBr230Row = $("layer-row-pontes-br230");
  app.layerPontesBr230Hint = $("layer-pontes-br230-hint");
  app.layerPontesToggle = $("layer-pontes-br307");
  app.layerPontesRow = $("layer-row-pontes-br307");
  app.layerPontesHint = $("layer-pontes-br307-hint");
  app.layerJazidasToggle = $("layer-jazidas-br307");
  app.layerJazidasRow = $("layer-row-jazidas-br307");
  app.layerJazidasHint = $("layer-jazidas-br307-hint");
  app.layerPontesBr319Toggle = $("layer-pontes-br319");
  app.layerPontesBr319Row = $("layer-row-pontes-br319");
  app.layerPontesBr319Hint = $("layer-pontes-br319-hint");
  app.layerBueirosBr319Toggle = $("layer-bueiros-br319");
  app.layerBueirosBr319Row = $("layer-row-bueiros-br319");
  app.layerBueirosBr319Hint = $("layer-bueiros-br319-hint");
  app.branchBr174 = $("layer-branch-br174");
  app.branchHeadBr174 = $("layer-branch-br174-head");
  app.layerBueirosBr174Toggle = $("layer-bueiros-br174");
  app.layerBueirosBr174Row = $("layer-row-bueiros-br174");
  app.layerBueirosBr174Hint = $("layer-bueiros-br174-hint");
  app.layerPradsBr174Toggle = $("layer-prads-br174");
  app.layerPradsBr174Row = $("layer-row-prads-br174");
  app.layerPradsBr174Hint = $("layer-prads-br174-hint");
  app.layerPcaPradsBr319Toggle = $("layer-pca-prads-br319");
  app.layerPradsBr319Toggle = $("layer-prads-br319");
  app.layerPcaPradsBr319Row = $("layer-row-pca-prads-br319");
  app.layerPradsBr319Row = $("layer-row-prads-br319");
  app.layerPcaPradsBr319Hint = $("layer-pca-prads-br319-hint");
  app.layerPradsBr319Hint = $("layer-prads-br319-hint");
  app.layerPcaPradsCmmBr319Toggle = $("layer-pca-prads-cmm-br319");
  app.layerPcaPradsCmmBr319Row = $("layer-row-pca-prads-cmm-br319");
  app.layerPcaPradsCmmBr319Hint = $("layer-pca-prads-cmm-br319-hint");
  app.layerIp4Toggle = $("layer-ip4");
  app.layerIp4Row = $("layer-row-ip4");
  app.layerIp4Hint = $("layer-ip4-hint");
  app.groupRodovias = $("layer-group-rodovias");
  app.headRodovias = $("layer-rodovias-head");
  app.subtreeRodovias = $("layer-rodovias-subtree");
  app.groupBrAm = $("layer-group-br-am");
  app.headBrAm = $("layer-br-am-head");
  app.subtreeBrAm = $("layer-br-am-subtree");
  app.groupAquaviario = $("layer-group-aquaviario");
  app.headAquaviario = $("layer-aquaviario-head");
  app.subtreeAquaviario = $("layer-aquaviario-subtree");
  app.groupUc = $("layer-group-uc");
  app.headUc = $("layer-uc-head");
  app.subtreeUc = $("layer-uc-subtree");
  app.groupLimitesAm = $("layer-group-limite");
  app.headLimitesAm = $("layer-limites-am-head");
  app.subtreeLimitesAm = $("layer-limites-am-subtree");
  app.layersDisableAllBtn = $("layers-disable-all");
  app.layerLimiteToggle = $("layer-limite-estadual");
  app.layerLimiteRow = $("layer-row-limite-estadual");
  app.layerLimiteMunicipalToggle = $("layer-limite-municipal");
  app.layerLimiteMunicipalRow = $("layer-row-limite-municipal");
  app.layerUcEstadualToggle = $("layer-uc-estadual");
  app.layerUcEstadualRow = $("layer-row-uc-estadual");
  app.layerUcMunicipalToggle = $("layer-uc-municipal");
  app.layerUcMunicipalRow = $("layer-row-uc-municipal");
  app.layerHidroviasAmToggle = $("layer-hidrovias-am");
  app.layerHidroviasAmRow = $("layer-row-hidrovias-am");
  app.layerTiAmToggle = $("layer-ti-am");
  app.layerTiAmRow = $("layer-row-ti-am");
  app.btnFit = $("tool-fit");
  app.btnLocate = $("tool-locate");
  app.btnLegend = $("menu-toggle-legend");
  app.camadasFootCountEl = $("camadas-foot-count");
  app.camadasFootListEl = $("camadas-foot-list");
  app.camadasFootEmptyEl = $("camadas-foot-empty");
  app.layerLegendEl = $("map-legend");
  app.layerLegendBodyEl = $("map-legend-body");
  app.layerLegendCloseBtn = $("map-legend-close");
  app.layerLegendClearBtn = $("map-legend-clear");
  app.basemapSelect = $("basemap-select");
  app.mapBasemapControl = $("map-basemap-control");
  app.mapBasemapBtn = $("map-basemap-btn");
  app.menuToggleLayersBtn = $("menu-toggle-layers");
  app.menuFitAmazonasBtn = $("menu-fit-amazonas");
  app.menuSelectMode = $("menu-select-mode");
  app.menuSelectTarget = $("menu-select-target");
  app.menuSubtree = $("menu-subtree");
  app.menuContractSelect = $("menu-contract");
  app.municipioFilterPopup = $("municipio-filter-popup");
  app.state = {
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

  app.boot = function boot() {
    throw new Error("boot not registered");
  };

  return app;
}
