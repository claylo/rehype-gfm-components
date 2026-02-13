// Tab switching custom element for rehype-gfm-components.
// Compatible with Starlight's <starlight-tabs> structure.
// Guarded against double-registration if Starlight's own Tabs component is also used.

if (!customElements.get("starlight-tabs")) {
  class StarlightTabs extends HTMLElement {
    static #syncedTabs = new Map();

    constructor() {
      super();
      const tablist = this.querySelector('[role="tablist"]');
      if (!tablist) return;

      this.tabs = [...tablist.querySelectorAll('[role="tab"]')];
      this.panels = [...this.querySelectorAll(':scope > [role="tabpanel"]')];
      this._syncKey = this.dataset.syncKey;

      if (this._syncKey) {
        const synced = StarlightTabs.#syncedTabs.get(this._syncKey) || [];
        synced.push(this);
        StarlightTabs.#syncedTabs.set(this._syncKey, synced);
      }

      this.tabs.forEach((tab, i) => {
        tab.addEventListener("click", (e) => {
          e.preventDefault();
          const current = tablist.querySelector('[aria-selected="true"]');
          if (e.currentTarget !== current) this.switchTab(e.currentTarget, i);
        });

        tab.addEventListener("keydown", (e) => {
          const idx = this.tabs.indexOf(e.currentTarget);
          let next;
          if (e.key === "ArrowLeft") next = idx - 1;
          else if (e.key === "ArrowRight") next = idx + 1;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = this.tabs.length - 1;
          else return;
          if (!this.tabs[next]) return;
          e.preventDefault();
          this.switchTab(this.tabs[next], next);
        });
      });
    }

    switchTab(newTab, index, shouldSync = true) {
      if (!newTab) return;
      const offset = shouldSync ? this.getBoundingClientRect().top : 0;

      this.tabs.forEach((t) => {
        t.setAttribute("aria-selected", "false");
        t.setAttribute("tabindex", "-1");
      });
      this.panels.forEach((p) => {
        p.hidden = true;
      });

      const panel = this.panels[index];
      if (panel) panel.hidden = false;
      newTab.removeAttribute("tabindex");
      newTab.setAttribute("aria-selected", "true");

      if (shouldSync) {
        newTab.focus();
        StarlightTabs.#syncTabs(this, newTab);
        window.scrollTo({
          top: window.scrollY + (this.getBoundingClientRect().top - offset),
          behavior: "instant",
        });
      }
    }

    static #syncTabs(emitter, newTab) {
      const key = emitter._syncKey;
      const label = newTab.textContent?.trim();
      if (!key || !label) return;

      const synced = StarlightTabs.#syncedTabs.get(key);
      if (synced) {
        for (const receiver of synced) {
          if (receiver === emitter) continue;
          const idx = receiver.tabs.findIndex(
            (t) => t.textContent?.trim() === label
          );
          if (idx >= 0) receiver.switchTab(receiver.tabs[idx], idx, false);
        }
      }

      try {
        localStorage.setItem("starlight-synced-tabs__" + key, label);
      } catch {
        // localStorage may be unavailable
      }
    }
  }

  customElements.define("starlight-tabs", StarlightTabs);
}

if (!customElements.get("starlight-tabs-restore")) {
  class StarlightTabsRestore extends HTMLElement {
    connectedCallback() {
      const parent = this.closest("starlight-tabs");
      if (!parent || typeof localStorage === "undefined") return;
      const key = parent.dataset.syncKey;
      if (!key) return;

      let label;
      try {
        label = localStorage.getItem("starlight-synced-tabs__" + key);
      } catch {
        return;
      }
      if (!label) return;

      const tabs = [...parent.querySelectorAll('[role="tab"]')];
      const idx = tabs.findIndex((t) => t.textContent?.trim() === label);
      const panels = parent.querySelectorAll(':scope > [role="tabpanel"]');
      const newTab = tabs[idx];
      const newPanel = panels[idx];

      if (idx < 1 || !newTab || !newPanel) return;
      tabs[0]?.setAttribute("aria-selected", "false");
      tabs[0]?.setAttribute("tabindex", "-1");
      panels[0]?.setAttribute("hidden", "true");
      newTab.removeAttribute("tabindex");
      newTab.setAttribute("aria-selected", "true");
      newPanel.removeAttribute("hidden");
    }
  }

  customElements.define("starlight-tabs-restore", StarlightTabsRestore);
}
