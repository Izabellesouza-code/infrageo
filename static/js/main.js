/* global L */
import { createApp } from './context.js';
import { registerUtils } from './utils.js';
import { registerUiMobile } from './ui-mobile.js';
import { registerBrAm } from './br-am.js';
import { registerSearch } from './search.js';
import { registerLegend } from './legend.js';
import { registerBottomSheet } from './bottom-sheet.js';
import { registerFeaturePopup } from './feature-popup.js';
import { registerBasemap } from './basemap.js';
import { registerLimites } from './limites.js';
import { registerContracts } from './contracts.js';
import { registerLayers } from './layers.js';
import { registerBulkLayers } from './bulk-layers.js';
import { registerAttributesTable } from './attributes-table.js';
import { registerBindUi } from './bind-ui.js';

const app = createApp();

registerUtils(app);
registerUiMobile(app);
registerBrAm(app);
registerSearch(app);
registerLegend(app);
registerBottomSheet(app);
registerFeaturePopup(app);
registerBasemap(app);
registerLimites(app);
registerContracts(app);
registerLayers(app);
registerBulkLayers(app);
registerAttributesTable(app);
registerBindUi(app);

app.boot();
