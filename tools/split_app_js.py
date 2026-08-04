#!/usr/bin/env python3
"""
Split monolithic static/app.js (IIFE) into ES modules under static/js/
using a shared app-context / register* factory pattern.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_JS = ROOT / "static" / "app.js"
OUT_DIR = ROOT / "static" / "js"
BAK_JS = ROOT / "static" / "app.js.bak"

MODULE_ORDER = [
    "utils",
    "ui-mobile",
    "br-am",
    "search",
    "legend",
    "bottom-sheet",
    "feature-popup",
    "basemap",
    "limites",
    "contracts",
    "layers",
    "bulk-layers",
    "attributes-table",
    "bind-ui",
]

REGISTER_NAMES = {
    "utils": "registerUtils",
    "ui-mobile": "registerUiMobile",
    "br-am": "registerBrAm",
    "search": "registerSearch",
    "legend": "registerLegend",
    "bottom-sheet": "registerBottomSheet",
    "feature-popup": "registerFeaturePopup",
    "basemap": "registerBasemap",
    "limites": "registerLimites",
    "contracts": "registerContracts",
    "layers": "registerLayers",
    "bulk-layers": "registerBulkLayers",
    "attributes-table": "registerAttributesTable",
    "bind-ui": "registerBindUi",
}

# Top-level consts/lets that live on the shared app context (or a module, then assigned).
SHARED_VARS = {
    "BR_AM_LEGEND_PALETTE": "br-am",
    "layerGeoJsonFetchByUrl": "layers",
    "FEATURE_COLORS_MAX": "basemap",
    "colorPalette": "basemap",
    "featureColors": "basemap",
    "colorIndex": "basemap",
    "FEATURE_POPUP": "feature-popup",
    "quickMenuHideTimer": "feature-popup",
    "TABLE_LAYER_IDS": "feature-popup",
    "LAYER_INDEX_FIELDS": "feature-popup",
    "CONTRACT_ATTR_COLUMN": "contracts",
    "tableFilterDebounceTimers": "attributes-table",
}

JS_KEYWORDS = {
    "break", "case", "catch", "class", "const", "continue", "debugger", "default",
    "delete", "do", "else", "export", "extends", "false", "finally", "for",
    "function", "if", "import", "in", "instanceof", "let", "new", "null",
    "return", "super", "switch", "this", "throw", "true", "try", "typeof",
    "var", "void", "while", "with", "yield", "await", "async", "of", "static",
    "get", "set", "from", "as", "undefined", "NaN", "Infinity",
}


def classify_function(name: str) -> str:
    n = name

    # Mobile
    if re.search(r"Mobile|mobileSidebar", n):
        return "ui-mobile"

    # BR-AM / shields / kebab for BR-AM
    if re.search(
        r"BrAm|brAm|BrShield|ShieldMarker|LayerKebab|normalizeBrAm|extractBrHighway|"
        r"flattenLeafletLatLngs|latLngsFromGeoJsonGeometry",
        n,
    ):
        return "br-am"

    # Bottom sheet
    if re.search(
        r"BottomSheet|PeekSelection|peekBottom|expandBottom|openBottom|closeBottom|"
        r"BottomZoom|fitMapBoundsWithSheet|zoomSelectionFromTable|ensureInfraGeoPanes|"
        r"getFeatureDisplayLabel|getBottomSheetInset",
        n,
    ):
        return "bottom-sheet"

    # Feature popup / identify / hover
    if re.search(
        r"QuickMenu|Identify|QuickHover|FeatureQuick|HoverPill|pathTolerance|"
        r"HitGeometry|layerHitDistance|attachQuickHover|handleMapFeatureClick|"
        r"handleIdentifyClick|pinFeature|showFeatureQuick|cancelQuick|scheduleQuick|"
        r"positionFeatureQuick|latLngToClientXY|getAvoidRect|rectsOverlap|"
        r"getPreferredKeys|shouldSkipPopup|pickQuickMenu|buildQuickMenu|"
        r"getLeafletTooltip|bindMunicipioHover|setLayerIdentify|bumpPathHit|"
        r"getHitGeometry|tableLayerIdFromKind|isFeatureQuickMenuVisible|"
        r"maybeOpenAttributesTable|dismissTablesAndPopups|getLayerZIndexHint|"
        r"parseFeatureKm|countGeometryVertices|roughGeometryBbox|"
        r"featureStretchSpecificity|identifyLayersAtLatLng|renderIdentify|"
        r"resolveTableLayerId|getLayerFeaturesArray|matchFeatureIndex|"
        r"ensureMapClickTable|applyTableSelectionFromFeature|scrollToSelectedTableRow|"
        r"openAttributesTableFromMapClick|getSelectionKindLayerLabel|"
        r"getMunicipioNomeFromProps$|hideFeatureQuickMenu|renderFeatureQuickMenu",
        n,
    ):
        return "feature-popup"

    # Legend / camadas foot
    if re.search(
        r"Legend|legend|CamadasFoot|createStandardPointIcon|resolvePointLegend|"
        r"getLayerGroupByKind|shouldExpandLayerGroups|getSimpleLegend|"
        r"legendSwatch|getLegendAccent|collectTogglesFromLegend|"
        r"findLegendNode|applyLegend|clearMapLegend|renderLayerLegend|"
        r"isMapLegendOpen|setLegendPanelOpen|getCamadasLegend|"
        r"renderLegend|legendLeaf|legendBranch|legendGroup",
        n,
    ):
        return "legend"

    # Search
    if re.search(
        r"Search|searchAndZoom|getSearchKind|bestTitleForFeature|bestSubtitleForFeature|"
        r"firstPropValueByKeyHints|getToggleElForKind|setToggleChecked|setMunicipiosOnMap|"
        r"ensureKindOnMap|disableKindOnMap|collectBrAmToggles|flashSearchHit|"
        r"getFeaturesForSearchKind|scoreFeatureMatch|openSearchResult|"
        r"findGlobalSearchHit|applyOnlyRodoviasSublayer|haystackFrom|"
        r"featureMatchesQuery|featureMatchesContratoColumnsQuery|"
        r"renderGlobalSearchMunicipiosPanel|renderGlobalSearchContractsPanel|"
        r"syncContratosFilterKind|syncMunicipiosFilterKind|applyGlobalSearchFilter",
        n,
    ):
        return "search"

    # Basemap / theme / styles
    if re.search(
        r"Basemap|Theme|basemap|tunedLine|tunedFill|getBoundaryLayerStyle|"
        r"getLimiteMunicipalLayerStyle|getSegmentLayerStyle|createBueirosPoint|"
        r"createPontesPoint|createJazidasPoint|createIp4Point|createPradsPoint|"
        r"getBueirosLine|getBueirosPolygon|getJazidasLine|getJazidasPolygon|"
        r"getPontesLine|getPontesPolygon|applyBueirosStyle|applyPontesStyle|"
        r"applyJazidasStyle|applyIp4Style|createUcEstadualPoint|getUcEstadual|"
        r"applyUcEstadualStyle|createUcMunicipalPoint|getUcMunicipal|"
        r"applyUcMunicipalStyle|refreshLayerStylesForBasemap|isSatelliteBasemap|"
        r"getBasemapStyle|getBasemapTuning|hideAppLoadingSplash|getColorForFeature|"
        r"hideMapCoords|renderMapCoords|setupBasemap|setBasemap|closeMapBasemap|"
        r"syncBasemapRadios|applyUiTheme|applyThemeClass|loadTheme|setTheme",
        n,
    ):
        return "basemap"

    # Limites
    if re.search(
        r"LimiteEstadual|LimiteMunicipal|bringLimite|attachLimite|applyLimite|"
        r"allRodoviasSublayersChecked|fitMapToStateBoundary|"
        r"afterRodoviasSublayerVisibilityChange|fetchLimiteMunicipal",
        n,
    ):
        return "limites"

    # Bulk layers
    if re.search(
        r"AllDataLayer|Bulk|purgeAllData|loadAllChecked|turnOffAll|turnOnAll|"
        r"uncheckAllData|forceOnlyLimite|setDataPanesHidden|listDataLayersForBulk|"
        r"ensureLimiteEstadualWhenNoData|ensureToggleLayerLoaded|"
        r"allAvailableDataTogglesOff|getEnsureForToggle|toggleDataLayersFromMenu|"
        r"bumpMapLayerEpoch|collapseAllCamadasGroups|syncLayerRowsToggleUi|"
        r"mountDataLayerIfAllowed|toggleForDataLayer|ensureLayerVisibleOnMap",
        n,
    ):
        return "bulk-layers"

    # Contracts / municipio filter (shared filter panel)
    if re.search(
        r"Contract|contrato|Contrato|MunicipioFilter|municipioFilter|"
        r"normalizeContract|looksLikeKnownDedicated|isContratoColumn|"
        r"contractKey|looksLikeContract|isIp4Feature|ip4SourceMatches|"
        r"parseContract|contractEquals|getFeatureContracts|featureMatchesContract|"
        r"featureHasContract|setLeafletLayerFiltered|pointAsCircleMarker|"
        r"applyContractFilter|buildExtraContract|ensureAllContract|"
        r"collectSortedContract|refreshContractOptions|selectContractFilter|"
        r"getMunicipioNomeFromPropsFast|getIp4MunicipioNome|municipioNameMatches|"
        r"ensureMunicipiosFilterList|collectSortedMunicipio|clearMunicipioFilter|"
        r"getFeatureMunicipioName|getSelectedMunicipioBounds|getFeatureLatLngApprox|"
        r"featureMatchesMunicipio|layerCountForMunicipio|ensureAllMunicipioLayers|"
        r"fitMapToMunicipio|showMunicipioLayersPopup|pickMunicipioMatched|"
        r"openMunicipioMatched|applyMunicipioFilter|selectMunicipioFilter|"
        r"fetchGeojsonFeatures|ensureContractSources|tryLoadDiscoveredLayer|"
        r"layerCountForContract|inferKindFromContract|getContractLayer|"
        r"forEachContractLayer|applyContractFilterAndShow|collectContractBounds|"
        r"fitMapToCurrentContract|buildContractResults|openContractResults|"
        r"clearContractFilter|clearContractSelection",
        n,
    ):
        return "contracts"

    # Layers ensure/fetch/apply
    if re.search(
        r"^ensure(Bueiros|Pontes|Jazidas|Ip4|Uc|Ti|Hidrovias|Prads|Pca|BrAm).*"
        r"|^ensure.*OnMap$|"
        r"^fetch(Bueiros|Pontes|Jazidas|Ip4|Uc|Ti|Hidrovias|Prads|Pca|LayerGeoJson|"
        r"LimiteMunicipal).*|"
        r"^apply(Bueiros|Pontes|Jazidas|Ip4|Uc|Ti|Hidrovias|Prads|Pca|LimiteMunicipal).*Availability$|"
        r"getPradsStyleByKind|clearEphemeralClientCaches|collectBueirosColumnKeys|"
        r"setStatus$",
        n,
    ):
        return "layers"

    # Utils
    if n in {
        "escapeHtml",
        "normalizePtBrText",
        "normalizeSearchText",
        "normalizeFeatureLabel",
        "getFirstNonEmptyValue",
        "formatCoordNumber",
        "isNumericLike",
        "toNumber",
        "escHtmlCell",
        "looksLikeHtmlOrXmlBlob",
        "stripHtmlToPlainText",
        "formatAttributeDisplayValue",
        "escAttributeCell",
        "normalizeContractValue",  # small helper; also used by contracts — keep utils
        "normalizeContractKey",
        "normalizeContractLayerDedupeKey",
    }:
        return "utils"

    # Bind UI / init / toggles of menus
    if n in {
        "bindUi",
        "initMap",
        "fitSegmentosBoundsNow",
        "toggleRodoviasMenu",
        "toggleAquaviarioMenu",
        "toggleUcMenu",
        "toggleLimitesAmMenu",
        "toggleBranchBr317",
        "toggleBranchBr307",
        "toggleBranchBr319",
        "toggleBranchBr230",
        "toggleBranchBr174",
        "closeAllLayerMenus",
    }:
        return "bind-ui"

    # Attributes table / selection
    if re.search(
        r"AttributesTable|attributesTable|TableSelection|TableFilter|tablePanel|"
        r"renderAllAttributes|renderGenericAttributes|renderContractResults|"
        r"renderBrAmAttributes|renderBueiros|renderPontes|renderJazidas|"
        r"renderPrads|renderPca|renderUc|renderTi|renderHidrovias|renderMapClick|"
        r"renderMunicipios|renderIp4|openAttributesTableForLayer|"
        r"resetBueirosFeatureStyle|resetLayerVisualSelection|clearCurrentSelection|"
        r"kindFromLayerToggleId|clearSelectionForTurnedOff|applySelectionZoom|"
        r"zoomToFeatureNow|selectFeature|setupHeaderSort|clearCurrentTableFilters|"
        r"getFilteredSorted|updateTablePanel|updateGeneralSelection|"
        r"clearSelectedRow|highlightRowForFeature|countActiveColumnFilters|"
        r"buildTableMiniTools|syncTableFilterChrome|buildCombinedHeader|"
        r"getTableStateById|rerenderAttributes|restoreColumnFilter|"
        r"updateBueirosTable|updatePontesTable|updateJazidasTable|"
        r"getPanelTableLabel|refreshPanelTableTitle|syncGeneralFilter|"
        r"clearBueirosRow|clearPontesRow|clearJazidasRow|clearContractResultsRow|"
        r"clearPrads|clearPca|clearUc|clearTi|clearHidrovias|clearIp4Row|"
        r"isSyntheticAttributeKey|collectColumnKeys|collectAllColumnKeys|"
        r"pruneNonContratoColumnFilters|haystackFromContrato|"
        r"haystackFromProperties",
        n,
    ):
        return "attributes-table"

    # Fallback buckets by prefix
    if n.startswith(("ensure", "fetch", "apply")) and (
        "OnMap" in n or "Availability" in n or "Info" in n or "GeoJson" in n
    ):
        return "layers"

    if "Table" in n or "Selection" in n or "RowHighlight" in n:
        return "attributes-table"

    if "Contract" in n or "Municipio" in n:
        return "contracts"

    # Default: layers for map data helpers, else utils
    return "layers"


def extract_iife_body(text: str) -> str:
    # Strip /* global L */ and outer (() => { ... })();
    text = text.lstrip()
    text = re.sub(r"^/\*\s*global\s+L\s*\*/\s*", "", text)
    m = re.match(r"\(\(\)\s*=>\s*\{", text)
    if not m:
        raise SystemExit("Could not find IIFE start")
    start = m.end()
    # Find matching close: last "}\n)();" or "})();"
    end_m = re.search(r"\n\}\)\(\);\s*$", text)
    if not end_m:
        raise SystemExit("Could not find IIFE end")
    return text[start : end_m.start()]


def find_top_level_spans(body: str) -> list[dict]:
    """
    Split IIFE body into top-level items:
      - function
      - const/let/var decl
      - other statement blocks (try, calls)
    Uses brace depth relative to IIFE interior (depth 0 = top level).
    Regex-aware so literals like /"/g do not break string/brace scanning.
    """
    items: list[dict] = []
    i = 0
    n = len(body)

    def skip_string(j: int, quote: str) -> int:
        j += 1
        while j < n:
            ch = body[j]
            if ch == "\\":
                j += 2
                continue
            if ch == quote:
                return j + 1
            if quote == "`" and ch == "$" and j + 1 < n and body[j + 1] == "{":
                j += 2
                d = 1
                while j < n and d:
                    if body[j] == "\\":
                        j += 2
                        continue
                    if body[j] in ('"', "'", "`"):
                        j = skip_string(j, body[j])
                        continue
                    if body[j] == "/" and j + 1 < n and body[j + 1] == "/":
                        j = skip_line_comment(j)
                        continue
                    if body[j] == "/" and j + 1 < n and body[j + 1] == "*":
                        j = skip_block_comment(j)
                        continue
                    # regex inside ${}
                    if body[j] == "/" and looks_like_regex(j):
                        j = skip_regex(j)
                        continue
                    if body[j] == "{":
                        d += 1
                    elif body[j] == "}":
                        d -= 1
                    j += 1
                continue
            j += 1
        return j

    def skip_line_comment(j: int) -> int:
        while j < n and body[j] != "\n":
            j += 1
        return j

    def skip_block_comment(j: int) -> int:
        j += 2
        while j + 1 < n and not (body[j] == "*" and body[j + 1] == "/"):
            j += 1
        return min(n, j + 2)

    def prev_code_char(j: int) -> str:
        k = j - 1
        while k >= 0:
            if body[k] in " \t\r\n":
                k -= 1
                continue
            if k >= 1 and body[k] == "/" and body[k - 1] == "*":
                # end of block comment — walk back
                k -= 2
                while k >= 1 and not (body[k - 1] == "/" and body[k] == "*"):
                    k -= 1
                k -= 2
                continue
            if body[k] == "\n":
                # line comment above already skipped via whitespace? handle //
                pass
            return body[k]
        return ""

    def looks_like_regex(j: int) -> bool:
        """Heuristic: / starts a regexp rather than division."""
        if j + 1 < n and body[j + 1] in "/*":
            return False
        prev = prev_code_char(j)
        if prev == "":
            return True
        # after identifier/number/) ] } — likely division
        if prev.isalnum() or prev in "_$)]}" or prev == "`":
            # special: keyword before like return /foo/
            # look at preceding identifier
            k = j - 1
            while k >= 0 and body[k] in " \t\r\n":
                k -= 1
            end = k + 1
            while k >= 0 and (body[k].isalnum() or body[k] in "_$"):
                k -= 1
            word = body[k + 1 : end]
            if word in {
                "return",
                "throw",
                "case",
                "else",
                "in",
                "of",
                "typeof",
                "void",
                "delete",
                "await",
                "yield",
                "new",
                "instanceof",
            }:
                return True
            return False
        return prev in "=([,{;!&|?:~^+-*%<>"

    def skip_regex(j: int) -> int:
        """Skip /pattern/flags — do not interpret quotes inside as strings."""
        j += 1  # opening /
        in_class = False
        while j < n:
            ch = body[j]
            if ch == "\\":
                j += 2
                continue
            if ch == "[" and not in_class:
                in_class = True
                j += 1
                continue
            if ch == "]" and in_class:
                in_class = False
                j += 1
                continue
            if ch == "/" and not in_class:
                j += 1
                while j < n and body[j].isalpha():
                    j += 1
                return j
            if ch == "\n":
                return j
            j += 1
        return j

    def skip_code_token(j: int) -> int | None:
        """If at string/comment/regex, skip and return new index; else None."""
        if j >= n:
            return j
        if body[j] in ('"', "'", "`"):
            return skip_string(j, body[j])
        if body[j : j + 2] == "//":
            return skip_line_comment(j)
        if body[j : j + 2] == "/*":
            return skip_block_comment(j)
        if body[j] == "/" and looks_like_regex(j):
            return skip_regex(j)
        return None

    while i < n:
        if body[i] in " \t\r\n":
            i += 1
            continue
        skipped = skip_code_token(i)
        if skipped is not None and skipped != i:
            i = skipped
            continue

        rest = body[i:]
        fm = re.match(r"(async\s+)?function\s+(\w+)\s*\(", rest)
        cm = re.match(r"(const|let|var)\s+", rest) if not fm else None

        if fm:
            name = fm.group(2)
            start = i
            j = i + fm.end()
            paren = 1
            while j < n and paren:
                sk = skip_code_token(j)
                if sk is not None and sk != j:
                    j = sk
                    continue
                ch = body[j]
                if ch == "(":
                    paren += 1
                elif ch == ")":
                    paren -= 1
                j += 1
            while j < n and body[j] in " \t\r\n":
                j += 1
            if j >= n or body[j] != "{":
                raise SystemExit(f"Function {name}: expected '{{' near offset {j}")
            brace = 0
            k = j
            while k < n:
                sk = skip_code_token(k)
                if sk is not None and sk != k:
                    k = sk
                    continue
                ch = body[k]
                if ch == "{":
                    brace += 1
                elif ch == "}":
                    brace -= 1
                    if brace == 0:
                        k += 1
                        break
                k += 1
            items.append(
                {
                    "kind": "function",
                    "name": name,
                    "start": start,
                    "end": k,
                    "text": body[start:k],
                    "async": bool(fm.group(1)),
                }
            )
            i = k
            continue

        if cm:
            start = i
            j = i
            brace = paren = bracket = 0
            while j < n:
                sk = skip_code_token(j)
                if sk is not None and sk != j:
                    j = sk
                    continue
                ch = body[j]
                if ch == "{":
                    brace += 1
                elif ch == "}":
                    brace -= 1
                elif ch == "(":
                    paren += 1
                elif ch == ")":
                    paren -= 1
                elif ch == "[":
                    bracket += 1
                elif ch == "]":
                    bracket -= 1
                elif ch == ";" and brace == 0 and paren == 0 and bracket == 0:
                    j += 1
                    break
                j += 1
            decl_text = body[start:j]
            nm = re.match(r"(?:const|let|var)\b\s+([A-Za-z_$][\w$]*)", decl_text.strip())
            items.append(
                {
                    "kind": "var",
                    "name": nm.group(1) if nm else None,
                    "start": start,
                    "end": j,
                    "text": decl_text,
                }
            )
            i = j
            continue

        # Other top-level statement until ; or block
        start = i
        brace = paren = 0
        j = i
        while j < n:
            sk = skip_code_token(j)
            if sk is not None and sk != j:
                j = sk
                continue
            ch = body[j]
            if ch == "{":
                brace += 1
            elif ch == "}":
                brace -= 1
                if brace == 0 and paren == 0:
                    j += 1
                    while j < n and body[j] in " \t":
                        j += 1
                    if j < n and body[j] == ";":
                        j += 1
                    break
            elif ch == "(":
                paren += 1
            elif ch == ")":
                paren -= 1
            elif ch == ";" and brace == 0 and paren == 0:
                j += 1
                break
            j += 1
        stmt = body[start:j]
        items.append({"kind": "stmt", "name": None, "start": start, "end": j, "text": stmt})
        i = j

    return items


def collect_local_bindings(code: str) -> set[str]:
    """Heuristic locals inside a function body (declarations + nested functions + params)."""
    locals_: set[str] = set()
    for m in re.finditer(
        r"(?:^|[^A-Za-z0-9_$])(?:const|let|var)\s+([A-Za-z_$][\w$]*)",
        code,
    ):
        locals_.add(m.group(1))
    for m in re.finditer(r"(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(", code):
        locals_.add(m.group(1))
    # function foo(a, b) / async function foo(a, b)
    for m in re.finditer(
        r"(?:async\s+)?function(?:\s+[A-Za-z_$][\w$]*)?\s*\(([^)]*)\)",
        code,
    ):
        params = m.group(1)
        for part in params.split(","):
            part = part.strip().lstrip(".").split("=")[0].strip()
            if not part or part[0] in "{[" or not re.match(r"^[A-Za-z_$]", part):
                continue
            locals_.add(re.match(r"[A-Za-z_$][\w$]*", part).group(0))
    # arrow params: (a, b) =>  or  a =>
    for m in re.finditer(r"\(([^)]*)\)\s*=>", code):
        params = m.group(1)
        if not params.strip() or params.strip().startswith("{"):
            continue
        for part in params.split(","):
            part = part.strip().lstrip(".").split("=")[0].strip()
            if not part or part[0] in "{[" or not re.match(r"^[A-Za-z_$]", part):
                continue
            locals_.add(re.match(r"[A-Za-z_$][\w$]*", part).group(0))
    for m in re.finditer(r"(?:^|[^A-Za-z0-9_$])([A-Za-z_$][\w$]*)\s*=>", code):
        locals_.add(m.group(1))
    return locals_


def rewrite_app_refs(code: str, symbols: set[str], local_bind: set[str] | None = None) -> str:
    """
    Rewrite bare identifiers that are app symbols to app.NAME,
    skipping strings, comments, property access (.name), object keys (name:),
    and local bindings.
    """
    local_bind = set(local_bind or ()) | collect_local_bindings(code)
    # Never rewrite these via local-collection false positives from keywords
    local_bind -= JS_KEYWORDS
    out: list[str] = []
    i = 0
    n = len(code)
    # Last significant code character (ignores comments / whitespace we emit).
    last_code_char = ""

    def skip_string_raw(j: int, quote: str) -> tuple[str, int]:
        start = j
        j += 1
        while j < n:
            ch = code[j]
            if ch == "\\":
                j += 2
                continue
            if ch == quote:
                return code[start : j + 1], j + 1
            j += 1
        return code[start:j], j

    def skip_string(j: int, quote: str) -> tuple[str, int]:
        """
        Consume a string/template literal. For templates, rewrite ${...}
        expressions but keep scanning until the closing backtick.
        """
        parts: list[str] = [quote]
        j += 1
        while j < n:
            ch = code[j]
            if ch == "\\":
                parts.append(code[j : j + 2])
                j += 2
                continue
            if ch == quote:
                parts.append(quote)
                j += 1
                break
            if quote == "`" and ch == "$" and j + 1 < n and code[j + 1] == "{":
                j += 2  # ${
                d = 1
                expr_start = j
                while j < n and d:
                    c2 = code[j]
                    if c2 in ('"', "'", "`"):
                        _, j = skip_string_raw(j, c2)
                        continue
                    if c2 == "{":
                        d += 1
                    elif c2 == "}":
                        d -= 1
                        if d == 0:
                            break
                    j += 1
                expr = code[expr_start:j]
                rewritten = rewrite_app_refs(expr, symbols, local_bind)
                parts.append("${" + rewritten + "}")
                j += 1  # closing }
                continue
            parts.append(ch)
            j += 1
        return "".join(parts), j

    while i < n:
        ch = code[i]
        # comments — do not update last_code_char
        if ch == "/" and i + 1 < n and code[i + 1] == "/":
            j = i
            while j < n and code[j] != "\n":
                j += 1
            out.append(code[i:j])
            i = j
            continue
        if ch == "/" and i + 1 < n and code[i + 1] == "*":
            j = i + 2
            while j + 1 < n and not (code[j] == "*" and code[j + 1] == "/"):
                j += 1
            j = min(n, j + 2)
            out.append(code[i:j])
            i = j
            continue
        # strings
        if ch in ('"', "'", "`"):
            s, i = skip_string(i, ch)
            out.append(s)
            last_code_char = s[-1] if s else last_code_char
            continue
        # regex heuristics
        if ch == "/" and i + 1 < n and code[i + 1] not in "/*":
            prev = last_code_char
            prev_emit = "".join(out[-8:]).rstrip()
            if (
                not prev
                or prev in "=([,!&|?:;{}~^+-*%<>"
                or prev_emit.endswith(
                    (
                        "return",
                        "throw",
                        "case",
                        "else",
                        "typeof",
                        "void",
                        "delete",
                        "await",
                        "yield",
                        "new",
                        "=>",
                    )
                )
            ):
                j = i + 1
                in_class = False
                while j < n:
                    if code[j] == "\\":
                        j += 2
                        continue
                    if code[j] == "[" and not in_class:
                        in_class = True
                        j += 1
                        continue
                    if code[j] == "]" and in_class:
                        in_class = False
                        j += 1
                        continue
                    if code[j] == "/" and not in_class:
                        j += 1
                        while j < n and code[j].isalpha():
                            j += 1
                        break
                    if code[j] == "\n":
                        break
                    j += 1
                out.append(code[i:j])
                last_code_char = "/"
                i = j
                continue

        # identifier
        if ch.isalpha() or ch in "_$":
            j = i + 1
            while j < n and (code[j].isalnum() or code[j] in "_$"):
                j += 1
            ident = code[i:j]
            prev_non_ws = last_code_char
            k = j
            while k < n and code[k] in " \t":
                k += 1
            is_label_or_key = (
                k < n
                and code[k] == ":"
                and prev_non_ws not in ")],?"
            )
            trail = "".join(out[-12:]).rstrip()
            after_decl = bool(re.search(r"(?:const|let|var)$", trail))
            if (
                ident in symbols
                and ident not in JS_KEYWORDS
                and ident not in local_bind
                and prev_non_ws != "."
                and not is_label_or_key
                and not after_decl
            ):
                if re.search(r"(?:async\s+)?function$", trail):
                    out.append(ident)
                else:
                    out.append(f"app.{ident}")
            else:
                out.append(ident)
            last_code_char = ident[-1]
            i = j
            continue

        if ch not in " \t\r\n":
            last_code_char = ch
        out.append(ch)
        i += 1

    return "".join(out)


def convert_function_to_app_assign(fn_text: str, name: str, is_async: bool) -> str:
    """Turn `function name(...) {` into `app.name = function name(...) {`."""
    if is_async:
        return re.sub(
            r"^(?:async\s+)?function\s+" + re.escape(name) + r"\s*\(",
            f"app.{name} = async function {name}(",
            fn_text.lstrip(),
            count=1,
        )
    return re.sub(
        r"^function\s+" + re.escape(name) + r"\s*\(",
        f"app.{name} = function {name}(",
        fn_text.lstrip(),
        count=1,
    )


def convert_var_to_app_assign(var_text: str, name: str) -> str:
    """const X = ... → app.X = ...;  let X = ... → app.X = ...;"""
    t = var_text.strip()
    t = re.sub(
        r"^(?:const|let|var)\s+" + re.escape(name) + r"\s*=",
        f"app.{name} =",
        t,
        count=1,
    )
    if not t.endswith(";"):
        t += ";"
    return t


def main() -> None:
    source = APP_JS
    stub = APP_JS.read_text(encoding="utf-8", errors="replace") if APP_JS.exists() else ""
    if "Moved to ES modules" in stub or "(() =>" not in stub:
        if not BAK_JS.exists():
            raise SystemExit("app.js is a stub and app.js.bak is missing")
        source = BAK_JS
        print(f"Reading from backup {BAK_JS}...")
    else:
        print(f"Reading {APP_JS}...")
    raw = source.read_text(encoding="utf-8")
    body = extract_iife_body(raw)
    print("Parsing top-level spans...")
    items = find_top_level_spans(body)
    print(f"  {len(items)} top-level items")

    functions = [it for it in items if it["kind"] == "function"]
    print(f"  {len(functions)} functions")

    # Classify
    module_of: dict[str, str] = {}
    for fn in functions:
        module_of[fn["name"]] = classify_function(fn["name"])

    # Count per module
    from collections import Counter

    counts = Counter(module_of.values())
    for mod in MODULE_ORDER:
        print(f"  {mod}: {counts.get(mod, 0)} functions")

    # Find where state ends / first real function after DOM setup
    # Preamble = everything before first function `normalizeBrAmDisplayName`
    # Actually mobile functions are before search consts — put DOM+state in context,
    # mobile functions go to ui-mobile. Early error listeners + DOM + state = context.

    # Split items:
    # - context_items: from start until (but not including) first function,
    #   EXCLUDING mobile functions which appear early... Mobile fns are items.
    #
    # Structure:
    #   early: $, earlyErrors, listeners, DOM refs, (mobile fns), more DOM, state
    #   then BR_AM palette + br-am functions...
    #
    # Strategy:
    #   context gets: all var decls / stmts before first non-mobile function,
    #                 EXCEPT mobile function items go to ui-mobile.
    #   Actually mobile functions are interleaved with DOM consts.
    #
    # Better: context = all non-function items before normalizeBrAmDisplayName,
    #         plus the state object. Mobile functions classified separately.
    #         Vars after that go to their SHARED_VARS module.

    first_br = next(i for i, it in enumerate(items) if it.get("name") == "normalizeBrAmDisplayName")

    context_chunks: list[str] = []
    early_mobile_fns: list[dict] = []
    boot_stmts: list[str] = []

    # Items before first_br
    for it in items[:first_br]:
        if it["kind"] == "function":
            early_mobile_fns.append(it)
        else:
            context_chunks.append(it["text"])

    # Remaining items after first_br
    remaining = items[first_br:]

    # Trailing boot: setThemePreference / bindUi / initMap / renderLayerLegend
    # These appear as stmt items after initMap function
    bind_extra_stmts: list[str] = []

    all_fn_names = {fn["name"] for fn in functions}
    all_var_names = {it["name"] for it in items if it["kind"] == "var" and it["name"]}
    # DOM refs and state from context
    context_var_names = set()
    for chunk in context_chunks:
        for m in re.finditer(r"(?:^|[^A-Za-z0-9_$])(?:const|let|var)\s+([A-Za-z_$][\w$]*)", chunk):
            context_var_names.add(m.group(1))

    app_symbols = set(all_fn_names) | set(all_var_names) | context_var_names | set(SHARED_VARS)
    app_symbols.update({"$", "earlyErrors", "state"})

    # Bucket content per module
    module_parts: dict[str, list] = {m: [] for m in MODULE_ORDER}

    # Add early mobile functions to ui-mobile
    for fn in early_mobile_fns:
        module_parts["ui-mobile"].append(fn)

    init_map_end = next(
        (it["end"] for it in remaining if it.get("name") == "initMap"),
        10**12,
    )

    i = 0
    while i < len(remaining):
        it = remaining[i]
        nxt = remaining[i + 1] if i + 1 < len(remaining) else None

        # Merge try + following catch into one stmt so they stay paired
        if (
            it["kind"] == "stmt"
            and it["text"].lstrip().startswith("try")
            and nxt
            and nxt["kind"] == "stmt"
            and nxt["text"].lstrip().startswith("catch")
        ):
            merged = {
                "kind": "stmt",
                "name": None,
                "start": it["start"],
                "end": nxt["end"],
                "text": it["text"].rstrip() + "\n" + nxt["text"].lstrip(),
            }
            it = merged
            i += 1  # skip catch on next iteration advance

        if it["kind"] == "function":
            mod = module_of[it["name"]]
            module_parts[mod].append(it)
        elif it["kind"] == "var" and it["name"] in SHARED_VARS:
            mod = SHARED_VARS[it["name"]]
            module_parts[mod].append(it)
        elif it["kind"] == "stmt":
            text = it["text"].strip()
            # Anything after initMap closes is boot trailing — drop (boot is hardcoded)
            if it["start"] >= init_map_end:
                i += 1
                continue
            if re.search(
                r"setThemePreference|^\s*bindUi\s*\(|^\s*initMap\s*\(|renderLayerLegend",
                text,
            ):
                i += 1
                continue
            if "featureQuickMenuEl" in text or "cancelQuickMenuHide" in text:
                module_parts["feature-popup"].append(it)
            elif "earlyErrors" in text:
                module_parts["bind-ui"].append(it)
            else:
                module_parts["bind-ui"].append(it)
        else:
            module_parts["layers"].append(it)
        i += 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # --- Write context.js ---
    # Build context from chunks: assign everything to app
    ctx_body_raw = "\n".join(context_chunks)
    # Transform: const $ = ... → keep as local then app.$ = $
    # Simpler: rewrite all const/let at top to app.X =

    def build_context_js(raw_ctx: str) -> str:
        # Parse top-level vars in context similarly — reuse items before first_br non-fn
        lines = []
        lines.append("/* global L */")
        lines.append("export function createApp() {")
        lines.append("  const app = {};")
        lines.append("")
        lines.append("  app.$ = (id) => document.getElementById(id);")
        lines.append("  const $ = (...args) => app.$(...args);")
        lines.append("")
        lines.append("  app.earlyErrors = [];")
        lines.append("  const earlyErrors = app.earlyErrors;")
        lines.append("")

        # Re-emit context chunks with conversion
        # Strip the original `const $ = ...` and earlyErrors and re-do listeners
        text = raw_ctx
        # Remove first const $ and earlyErrors declarations (we recreate)
        text = re.sub(
            r"const\s+\$\s*=\s*\(id\)\s*=>\s*document\.getElementById\(id\);\s*",
            "",
            text,
            count=1,
        )
        text = re.sub(
            r"const\s+earlyErrors\s*=\s*\[\];\s*",
            "",
            text,
            count=1,
        )

        # Convert remaining top-level const/let/var NAME to app.NAME =, and alias
        # Use a simpler approach: rewrite declarations
        out_parts = []
        # Use find_top_level_spans on text
        # Ensure text is well-formed as a body
        try:
            sub_items = find_top_level_spans(text)
        except SystemExit:
            # fallback: dump as-is with light rewrite
            sub_items = [{"kind": "stmt", "text": text, "name": None}]

        aliases = []
        for sit in sub_items:
            if sit["kind"] == "var" and sit["name"]:
                name = sit["name"]
                if name in ("$", "earlyErrors"):
                    continue
                converted = convert_var_to_app_assign(sit["text"], name)
                # rewrite $() calls inside initializers to use local $
                converted = converted.replace("$(", "$(")  # local $ works
                out_parts.append("  " + converted.replace("\n", "\n  "))
                aliases.append(name)
            else:
                stmt = sit["text"].strip()
                if not stmt:
                    continue
                # Rewrite DOM/state refs used in early top-level stmts (e.g. search popover move).
                stmt_symbols = set(aliases) | {"earlyErrors", "state", "$"}
                # aliases not yet complete — also pull names from already emitted app.X =
                for a in re.findall(r"app\.([A-Za-z_$][\w$]*)\s*=", "\n".join(out_parts)):
                    stmt_symbols.add(a)
                stmt = rewrite_app_refs(stmt, stmt_symbols)
                # local $ helper still in scope for $(...)
                stmt = stmt.replace("app.$(", "$(")
                out_parts.append("  " + stmt.replace("\n", "\n  "))

        lines.append("\n".join(out_parts))
        lines.append("")
        # Local aliases for convenience inside createApp (none needed beyond $)
        # Expose boot placeholder
        lines.append("  app.boot = function boot() {")
        lines.append('    throw new Error("boot not registered");')
        lines.append("  };")
        lines.append("")
        lines.append("  return app;")
        lines.append("}")
        lines.append("")
        return "\n".join(lines)

    context_js = build_context_js(ctx_body_raw)
    (OUT_DIR / "context.js").write_text(context_js, encoding="utf-8")
    print("Wrote context.js")

    # --- Write each register module ---
    for mod in MODULE_ORDER:
        parts = module_parts[mod]
        reg = REGISTER_NAMES[mod]
        chunks_out = [f"/* global L */", f"export function {reg}(app) {{", ""]

        # For bind-ui, append boot
        for part in parts:
            if part["kind"] == "function":
                name = part["name"]
                fn_src = convert_function_to_app_assign(part["text"], name, part.get("async", False))
                fn_src = rewrite_app_refs(fn_src, app_symbols)
                # indent
                indented = "\n".join(
                    ("  " + line if line.strip() else line) for line in fn_src.splitlines()
                )
                chunks_out.append(indented)
                chunks_out.append("")
            elif part["kind"] == "var" and part["name"]:
                vsrc = convert_var_to_app_assign(part["text"], part["name"])
                vsrc = rewrite_app_refs(vsrc, app_symbols)
                indented = "\n".join(
                    ("  " + line if line.strip() else line) for line in vsrc.splitlines()
                )
                chunks_out.append(indented)
                chunks_out.append("")
            else:
                stmt = rewrite_app_refs(part["text"], app_symbols)
                indented = "\n".join(
                    ("  " + line if line.strip() else line) for line in stmt.splitlines()
                )
                chunks_out.append(indented)
                chunks_out.append("")

        if mod == "bind-ui":
            # Always emit a clean boot — trailing IIFE stmts are fragile when split.
            boot_body = (
                "app.setThemePreference(app.loadThemePreference());\n"
                "app.bindUi();\n"
                "app.initMap();\n"
                "try {\n"
                "  app.renderLayerLegend();\n"
                "} catch {\n"
                "  // ignore\n"
                "}\n"
            )
            chunks_out.append("  app.boot = function boot() {")
            for line in boot_body.splitlines():
                chunks_out.append("    " + line if line.strip() else line)
            chunks_out.append("  };")
            chunks_out.append("")

        chunks_out.append("}")
        chunks_out.append("")
        path = OUT_DIR / f"{mod}.js"
        path.write_text("\n".join(chunks_out), encoding="utf-8")
        print(f"Wrote {mod}.js ({len(parts)} parts)")

    # --- main.js ---
    main_lines = [
        "/* global L */",
        "import { createApp } from './context.js';",
    ]
    for mod in MODULE_ORDER:
        reg = REGISTER_NAMES[mod]
        # convert ui-mobile → registerUiMobile already in map
        camel = "".join(p.title() if i else p for i, p in enumerate(mod.replace("-", "_").split("_")))
        # use REGISTER_NAMES
        main_lines.append(f"import {{ {reg} }} from './{mod}.js';")
    main_lines += [
        "",
        "const app = createApp();",
        "",
    ]
    for mod in MODULE_ORDER:
        main_lines.append(f"{REGISTER_NAMES[mod]}(app);")
    main_lines += [
        "",
        "app.boot();",
        "",
    ]
    (OUT_DIR / "main.js").write_text("\n".join(main_lines), encoding="utf-8")
    print("Wrote main.js")

    # Backup original app.js
    if not BAK_JS.exists():
        shutil.copy2(APP_JS, BAK_JS)
        print(f"Backed up to {BAK_JS.name}")
    else:
        print(f"Backup already exists: {BAK_JS.name}")

    # Replace app.js with redirect comment
    APP_JS.write_text(
        "/* Moved to ES modules: static/js/main.js (see static/app.js.bak for the previous IIFE). */\n",
        encoding="utf-8",
    )
    print("Replaced app.js with redirect stub")

    # Classification report
    report = []
    for fn in functions:
        report.append(f"{module_of[fn['name']]}\t{fn['name']}")
    (ROOT / "tools" / "_split_report.txt").write_text("\n".join(report), encoding="utf-8")
    print("Wrote tools/_split_report.txt")
    print("Done.")


if __name__ == "__main__":
    main()
