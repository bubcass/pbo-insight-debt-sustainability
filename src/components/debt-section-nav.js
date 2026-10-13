const tabs = [
  { id: "debt-ratio", label: "Debt ratio", href: "./" },
  { id: "interest-spending", label: "Interest spending", href: "./interest-spending" },
  { id: "primary-balance", label: "Primary balance", href: "./primary-balance" },
  { id: "government-balance", label: "Government balance", href: "./government-balance" },
  { id: "government-debt", label: "Government debt", href: "./government-debt" },
  { id: "debt-dynamics", label: "Debt dynamics", href: "./debt-dynamics" },
];

// Longer section sets need a different sticky treatment: the complete map is
// useful at the top of the page, while the compact picker leaves room for
// the content once the navigation is docked.
const useCompactStickyNavigation = tabs.length >= 5;

let tabsInstance = 0;

export function debtSectionNav(activeId = "debt-ratio") {
  if (typeof document !== "undefined") {
    for (const existing of document.querySelectorAll(".pbo-section-nav")) {
      existing.__disposePboSectionNav?.();
      existing.remove();
    }
  }

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const listId = `pbo-sections-${++tabsInstance}`;
  const shell = document.createElement("div");
  shell.className = "insights-tabs-shell";

  const nav = document.createElement("nav");
  nav.className = "insights-tabs pbo-section-nav";
  nav.setAttribute("aria-label", "Debt sustainability analysis pages");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "insights-tabs__toggle";
  toggle.setAttribute("aria-controls", listId);
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", `Current section: ${active.label}. Open section navigation`);
  toggle.innerHTML = `
    <span>${active.label}</span>
    <i aria-hidden="true"></i>
  `;

  const list = document.createElement("div");
  list.className = "insights-tabs__list";
  list.id = listId;

  for (const tab of tabs) {
    const link = document.createElement("a");
    link.className = "insights-tabs__link";
    link.href = tab.href;
    link.textContent = tab.label;

    if (tab.id === active.id) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }

    list.appendChild(link);
  }

  nav.append(toggle, list);
  shell.appendChild(nav);

  if (typeof window !== "undefined") {
    let frame = null;
    let menuOpen = false;
    let desktopCompactMode = false;
    let destroyed = false;
    const listenerController = new AbortController();
    const {signal} = listenerController;
    const mobileQuery = window.matchMedia("(max-width: 720px)");
    const mastheadQuery = window.matchMedia("(min-width: 901px)");

    const cleanup = () => {
      if (destroyed) return;
      destroyed = true;
      listenerController.abort();
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      nav.remove();
      shell.style.height = "";
      if (!document.querySelector(".pbo-section-nav.insights-tabs--floating")) {
        document.documentElement.classList.remove("has-floating-insights-tabs");
      }
    };

    nav.__disposePboSectionNav = cleanup;

    const usesPicker = () => mobileQuery.matches || desktopCompactMode;

    const setMenuOpen = (open, {focusToggle = false} = {}) => {
      if (destroyed) return;
      menuOpen = usesPicker() && open;
      nav.classList.toggle("is-open", menuOpen);
      toggle.setAttribute("aria-expanded", String(menuOpen));
      list.hidden = usesPicker() && !menuOpen;
      if (focusToggle) toggle.focus();
    };

    const syncNavigationMode = () => {
      if (destroyed) return;
      toggle.hidden = !usesPicker();
      setMenuOpen(false);
    };

    const syncFloating = () => {
      frame = null;
      if (destroyed || !shell.isConnected) {
        cleanup();
        return;
      }
      const masthead = document.querySelector(".oireachtas-masthead");
      const mastheadInner = masthead?.querySelector(".oireachtas-masthead__inner");
      const mastheadActions = mastheadInner?.querySelector(".oireachtas-masthead__actions");
      const mobileTools = document.querySelector(".mobile-reading-tools");
      const mobileMore = mobileTools?.querySelector(".mobile-reading-tools__more-wrap");
      const mastheadHeight = masthead?.offsetHeight || 0;
      const navHeight = nav.offsetHeight;
      const dockingLine = mobileQuery.matches ? 12 : mastheadHeight;
      const shouldFloat = shell.getBoundingClientRect().top <= dockingLine;
      const nextDesktopCompactMode = useCompactStickyNavigation && shouldFloat && !mobileQuery.matches;
      const modeChanged = desktopCompactMode !== nextDesktopCompactMode;
      desktopCompactMode = nextDesktopCompactMode;
      const shouldDockInMasthead = shouldFloat && mastheadQuery.matches && mastheadInner && !desktopCompactMode;
      const shouldDockInMobileTools = shouldFloat && mobileQuery.matches && mobileTools;

      shell.style.height = shouldFloat ? `${navHeight}px` : "";
      shell.classList.toggle("insights-tabs-shell--floating", shouldFloat);
      nav.classList.toggle("insights-tabs--floating", shouldFloat);
      nav.classList.toggle("insights-tabs--masthead", Boolean(shouldDockInMasthead));
      nav.classList.toggle("insights-tabs--mobile-tools", Boolean(shouldDockInMobileTools));
      nav.classList.toggle("insights-tabs--compact-floating", desktopCompactMode);
      // Compact desktop navigation sits beneath the masthead, so it does not
      // need to make room by hiding the masthead's resource label.
      document.documentElement.classList.toggle("has-floating-insights-tabs", shouldFloat && !desktopCompactMode);

      toggle.hidden = !usesPicker();
      if (modeChanged) {
        setMenuOpen(false);
      } else if (usesPicker()) {
        list.hidden = !menuOpen;
      }

      if (shouldDockInMobileTools && nav.parentNode !== mobileTools) {
        mobileTools.insertBefore(nav, mobileMore || null);
      } else if (shouldDockInMasthead && nav.parentNode !== mastheadInner) {
        mastheadInner.insertBefore(nav, mastheadActions || null);
      } else if (!shouldDockInMobileTools && !shouldDockInMasthead && nav.parentNode !== shell) {
        shell.appendChild(nav);
      }
    };

    const scheduleSync = () => {
      if (destroyed || !shell.isConnected) {
        cleanup();
        return;
      }
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncFloating);
    };

    toggle.addEventListener("click", () => setMenuOpen(!menuOpen), {signal});
    document.addEventListener("pointerdown", (event) => {
      if (menuOpen && !nav.contains(event.target)) setMenuOpen(false);
    }, {signal});
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) setMenuOpen(false, {focusToggle: true});
    }, {signal});
    list.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link) {
        setMenuOpen(false);
      }
    }, {signal});
    mobileQuery.addEventListener("change", syncNavigationMode, {signal});
    mastheadQuery.addEventListener("change", scheduleSync, {signal});

    window.addEventListener("scroll", scheduleSync, {passive: true, signal});
    window.addEventListener("resize", scheduleSync, {signal});
    syncNavigationMode();
    frame = window.requestAnimationFrame(syncFloating);

  }

  return shell;
}
