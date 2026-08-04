/* global L */
export function registerUiMobile(app) {

  app.isMobileLayoutActive = function isMobileLayoutActive() {
      try {
        return window.matchMedia && window.matchMedia("(max-width: 980px)").matches;
      } catch {
        return window.innerWidth <= 980;
      }
    }

  app.syncMobileSidebarChrome = function syncMobileSidebarChrome(collapsed) {
      const isCollapsed = Boolean(collapsed);
      const open = app.isMobileLayoutActive() && !isCollapsed;
      document.body.classList.toggle("mobile-sidebar-open", open);
      try {
        if (app.mobileSidebarBackdrop) {
          app.mobileSidebarBackdrop.hidden = !open;
          app.mobileSidebarBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
          app.mobileSidebarBackdrop.tabIndex = open ? 0 : -1;
        }
        if (app.mobileSidebarToggleBtn) {
          app.mobileSidebarToggleBtn.setAttribute("aria-pressed", isCollapsed ? "false" : "true");
          app.mobileSidebarToggleBtn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
          const label = isCollapsed ? "Abrir menu e camadas" : "Fechar menu e camadas";
          app.mobileSidebarToggleBtn.setAttribute("aria-label", label);
          app.mobileSidebarToggleBtn.title = label;
          const text = app.mobileSidebarToggleBtn.querySelector(".mobile-sidebar-toggle__label");
          if (text) text.textContent = isCollapsed ? "Menu" : "Fechar";
        }
      } catch {
        // ignore
      }
    }

  app.setMobileSidebarCollapsed = function setMobileSidebarCollapsed(collapsed) {
      document.body.classList.toggle("mobile-sidebar-collapsed", Boolean(collapsed));
      app.syncMobileSidebarChrome(collapsed);
      try {
        if (app.state.map?.invalidateSize) {
          requestAnimationFrame(() => app.state.map.invalidateSize({ animate: false }));
        }
      } catch {
        // ignore
      }
    }

  app.closeMobileSidebarIfNeeded = function closeMobileSidebarIfNeeded() {
      if (app.isMobileLayoutActive() && !document.body.classList.contains("mobile-sidebar-collapsed")) {
        app.setMobileSidebarCollapsed(true);
      }
    }

}
