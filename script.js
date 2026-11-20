
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // NEXORA — CORE
  // =========================================

  const $ = (id) => document.getElementById(id);

  const on = (element, event, callback) => {
    if (element) element.addEventListener(event, callback);
  };

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const cards = document.querySelectorAll(".tool-card");
  const panels = document.querySelectorAll(".tool-panel");

  // Год в подвале
  if ($("year")) {
    $("year").textContent = new Date().getFullYear();
  }

  // =========================================
  // TOOLS NAVIGATION
  // =========================================

  function animatePanel(panel) {
    if (!panel || reduceMotion) return;

    const parts = panel.querySelectorAll(
      ".panel-title, .panel-description, .form-grid, " +
      ".action-button, .primary-button, .secondary-button, " +
      ".result-box, .button-row, .checklist, .check-progress, " +
      ".shortcut-list, .temperature-grid, .small-note"
    );

    parts.forEach((part, index) => {
      part.animate(
        [
          {
            opacity: 0,
            transform: "translate3d(0, 12px, 0)"
          },
          {
            opacity: 1,
            transform: "translate3d(0, 0, 0)"
          }
        ],
        {
          duration: 460,
          delay: Math.min(index * 38, 190),
          easing: "cubic-bezier(.2, .8, .2, 1)",
          fill: "both"
        }
      );
    });
  }

  function openTool(id) {
    const target = $(id);

    if (!target || !target.classList.contains("tool-panel")) {
      return;
    }

    panels.forEach((panel) => {
      panel.classList.remove("active");
    });

    target.classList.add("active");

    cards.forEach((card) => {
      card.setAttribute(
        "aria-pressed",
        String(card.dataset.target === id)
      );
    });

    animatePanel(target);

    $("workspace")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  cards.forEach((card) => {
    card.setAttribute("aria-pressed", "false");

    on(card, "click", () => {
      openTool(card.dataset.target);
    });
  });

  // =========================================
  // TOOL SEARCH
  // =========================================

  on($("toolSearch"), "input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const searchableText = (
        card.textContent + " " + (card.dataset.search || "")
      ).toLowerCase();

      const matches = searchableText.includes(query);

      card.classList.toggle("hidden", !matches);

      if (matches) visibleCount++;
    });

    $("emptyState")?.classList.toggle(
      "hidden",
      visibleCount !== 0
    );
  });

  // =========================================
  // HELPERS
  // =========================================

  function readNumber(id, options = {}) {
    const input = $(id);

    if (!input) return null;

    const value = input.value.trim();

    if (value === "") return null;

    const number = Number(value);

    if (!Number.isFinite(number)) return null;

    if (
      options.min !== undefined &&
      number < options.min
    ) return null;

    if (
      options.max !== undefined &&
      number > options.max
    ) return null;

    return number;
  }

  function showError(id, message) {
    const element = $(id);

    if (element) {
      element.textContent = message;
    }
  }

  function showResult(id, message) {
    const element = $(id);

    if (!element) return;

    element.textContent = message;

    if (!reduceMotion) {
      element.classList.remove("nx-result-pop");

      void element.offsetWidth;

      element.classList.add("nx-result-pop");
    }
  }

  function formatNumber(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits
    }).format(value);
  }

  // =========================================
  // PSU CALCULATOR
  // =========================================

  on($("calculatePsu"), "click", () => {
    const cpu = readNumber("cpuW", {
      min: 1,
      max: 2000
    });

    const gpu = readNumber("gpuW", {
      min: 1,
      max: 2000
    });

    const other = readNumber("otherW", {
      min: 0,
      max: 1000
    });

    const headroom = readNumber("headroom", {
      min: 0,
      max: 100
    });

    if (
      cpu === null ||
      gpu === null ||
      other === null ||
      headroom === null
    ) {
      showError(
        "psuResult",
        "Проверь значения. CPU и GPU должны быть больше 0, запас — от 0 до 100%."
      );
      return;
    }

    const basePower = cpu + gpu + other;

    const recommended =
      basePower * (1 + headroom / 100);

    const standardOptions = [
      450, 500, 550, 600, 650, 700,
      750, 850, 1000, 1200, 1500, 1600
    ];

    const suggested = standardOptions.find(
      (power) => power >= recommended
    );

    const suggestionText = suggested
      ? `Ближайший ориентир: ${suggested} Вт.`
      : "Расчёт выше 1600 Вт. Проверь требования компонентов отдельно.";

    showResult(
      "psuResult",
      `Расчётная нагрузка: ${formatNumber(basePower)} Вт. ` +
      `С запасом ${headroom}%: около ${formatNumber(recommended)} Вт. ` +
      suggestionText
    );
  });

  // =========================================
  // eDPI CALCULATOR
  // =========================================

  on($("calculateDpi"), "click", () => {
    const dpi = readNumber("dpiValue", {
      min: 1,
      max: 100000
    });

    const sensitivity = readNumber("sensValue", {
      min: 0.001,
      max: 100000
    });

    if (dpi === null || sensitivity === null) {
      showError(
        "dpiResult",
        "Введи корректные значения DPI и чувствительности."
      );
      return;
    }

    showResult(
      "dpiResult",
      `Твой eDPI: ${formatNumber(dpi * sensitivity)} (DPI × чувствительность).`
    );
  });

  // =========================================
  // SENSITIVITY CONVERTER
  // =========================================

  on($("convertSens"), "click", () => {
    const oldSens = readNumber("oldSens", {
      min: 0.001,
      max: 100000
    });

    const oldDpi = readNumber("oldDpi", {
      min: 1,
      max: 100000
    });

    const newDpi = readNumber("newDpi", {
      min: 1,
      max: 100000
    });

    if (
      oldSens === null ||
      oldDpi === null ||
      newDpi === null
    ) {
      showError(
        "sensResult",
        "Заполни все поля корректными положительными числами."
      );
      return;
    }

    const result = (oldSens * oldDpi) / newDpi;

    showResult(
      "sensResult",
      `Новая чувствительность: ${formatNumber(result, 4)}`
    );
  });

  // =========================================
  // UNIT CONVERTER
  // =========================================

  on($("convertUnits"), "click", () => {
    const value = readNumber("convertValue", {
      min: 0,
      max: 1e15
    });

    if (value === null) {
      showError(
        "unitResult",
        "Введи корректное число от 0 и выше."
      );
      return;
    }

    const type = $("convertType")?.value;

    if (type === "storage") {
      showResult(
        "unitResult",
        `${formatNumber(value)} GiB = ${formatNumber(value * 1024)} MiB`
      );
    } else if (type === "frequency") {
      showResult(
        "unitResult",
        `${formatNumber(value)} GHz = ${formatNumber(value * 1000)} MHz`
      );
    } else {
      showError(
        "unitResult",
        "Неизвестный тип конвертации."
      );
    }
  });

  // =========================================
  // NICKNAME GENERATOR
  // =========================================

  const prefixes = [
    "Shadow", "Neon", "Cyber", "Frost", "Nova",
    "Silent", "Dark", "Pixel", "Storm", "Ghost",
    "Hyper", "Crystal", "Rapid", "Zero", "Night"
  ];

  const suffixes = [
    "Wolf", "Rider", "Fox", "Strike", "Pulse",
    "Hunter", "Blade", "Core", "Phantom", "Spark",
    "Ninja", "Byte", "Storm", "Viper", "Quest"
  ];

  on($("generateNick"), "click", () => {
    const prefix =
      prefixes[Math.floor(Math.random() * prefixes.length)];

    const suffix =
      suffixes[Math.floor(Math.random() * suffixes.length)];

    const number = Math.random() < 0.5
      ? Math.floor(Math.random() * 99) + 1
      : "";

    const output = $("nicknameOutput");

    if (output) {
      output.textContent = `${prefix}_${suffix}${number}`;
    }

    showError("copyStatus", "Новый ник создан!");
  });

  // =========================================
  // CLIPBOARD
  // =========================================

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const temporary = document.createElement("textarea");

    temporary.value = value;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";

    document.body.appendChild(temporary);

    temporary.select();

    const copied = document.execCommand("copy");

    temporary.remove();

    if (!copied) {
      throw new Error("Copy unavailable");
    }

    return true;
  }

  on($("copyNick"), "click", async () => {
    const nickname =
      $("nicknameOutput")?.textContent || "";

    if (!nickname.trim()) {
      showError("copyStatus", "Сначала создай ник.");
      return;
    }

    try {
      await copyText(nickname);

      showError("copyStatus", "Ник скопирован!");
    } catch {
      showError(
        "copyStatus",
        "Автокопирование недоступно. Скопируй ник вручную."
      );
    }
  });

  // =========================================
  // BUILD CHECKLIST
  // =========================================

  const checklistItems = document.querySelectorAll(
    "#buildChecklist input[type='checkbox']"
  );

  function updateProgress() {
    const checked = [...checklistItems].filter(
      (item) => item.checked
    ).length;

    const total = checklistItems.length;

    const percentage = total === 0
      ? 0
      : (checked / total) * 100;

    if ($("checkProgress")) {
      $("checkProgress").textContent =
        `Проверено: ${checked} из ${total}`;
    }

    if ($("progressFill")) {
      $("progressFill").style.width =
        `${percentage}%`;
    }
  }

  checklistItems.forEach((item) => {
    on(item, "change", updateProgress);
  });

  updateProgress();

  // =========================================
  // FPS ESTIMATOR
  // =========================================

  on($("estimateFps"), "click", () => {
    const game = {
      competitive: 180,
      popular: 85,
      heavy: 48
    }[$("fpsGame")?.value];

    const gpu = {
      low: 0.55,
      mid: 1,
      high: 1.55,
      enthusiast: 2.1
    }[$("fpsGpu")?.value];

    const cpu = {
      low: 0.72,
      mid: 1,
      high: 1.18
    }[$("fpsCpu")?.value];

    const resolution = Number(
      $("fpsResolution")?.value
    );

    if (
      ![game, gpu, cpu, resolution].every(Number.isFinite)
    ) {
      showError(
        "fpsResult",
        "Проверь выбранные параметры."
      );
      return;
    }

    const estimate =
      game * gpu * cpu * resolution;

    const min = Math.max(
      5,
      Math.round(estimate * 0.72)
    );

    const max = Math.max(
      min + 1,
      Math.round(estimate * 1.28)
    );

    showResult(
      "fpsResult",
      `Очень грубый ориентир: ${min}–${max} FPS. ` +
      "Это условная оценка по классам, не измерение конкретного ПК."
    );
  });

  // =========================================
  // MONITOR PPI CALCULATOR
  // =========================================

  on($("calculateMonitor"), "click", () => {
    const size = readNumber("monitorSize", {
      min: 1,
      max: 100
    });

    const resolutionInput = $("monitorResolution");

    if (!resolutionInput || size === null) {
      showError(
        "monitorResult",
        "Введи диагональ монитора от 1 до 100 дюймов."
      );
      return;
    }

    const [width, height] =
      resolutionInput.value.split(",").map(Number);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      showError(
        "monitorResult",
        "Выбери корректное разрешение монитора."
      );
      return;
    }

    const ppi =
      Math.sqrt(width * width + height * height) / size;

    const ratio = width / height;

    const pixelSize = 25.4 / ppi;

    showResult(
      "monitorResult",
      `Плотность: ${formatNumber(ppi, 1)} PPI. ` +
      `Соотношение сторон: ${ratio.toFixed(2)}:1. ` +
      `Размер пикселя: около ${formatNumber(pixelSize, 3)} мм.`
    );
  });

  // =========================================
  // WINDOWS SHORTCUTS
  // =========================================

  document.querySelectorAll(".copy-shortcut").forEach((button) => {
    on(button, "click", async () => {
      const shortcut = button.dataset.copy || "";

      try {
        await copyText(shortcut);

        showError(
          "shortcutStatus",
          `Скопировано: ${shortcut}`
        );
      } catch {
        showError(
          "shortcutStatus",
          "Копирование недоступно. Выдели комбинацию вручную."
        );
      }
    });
  });

  // =========================================
  // NEXORA LAB — PLAYTIME
  // =========================================

  on($("calculatePlaytime"), "click", () => {
    const minutes = readNumber("labMinutes", {
      min: 0,
      max: 1440
    });

    const days = readNumber("labDays", {
      min: 0,
      max: 7
    });

    if (minutes === null || days === null) {
      showError(
        "labResult",
        "Введи минуты от 0 до 1440 и дни от 0 до 7."
      );
      return;
    }

    const weekly = (minutes * days) / 60;

    showResult(
      "labResult",
      `За неделю: ${formatNumber(weekly, 1)} ч. ` +
      `За год: примерно ${formatNumber(weekly * 52, 1)} ч.`
    );
  });

  // =========================================
  // NEXORA — MOTION SYSTEM
  // =========================================

  // ВАЖНО:
  // Hero намеренно исключён из reveal-анимаций.
  // Поэтому главный экран сразу виден при загрузке.

  const revealTargets = document.querySelectorAll(
    ".topbar, " +
    ".tools-section .section-heading, " +
    ".tool-card, " +
    ".workspace-heading, " +
    ".about-section, " +
    ".footer, " +
    ".subtool, " +
    ".temperature-grid article, " +
    ".shortcut-list > div"
  );

  if (
    !reduceMotion &&
    "IntersectionObserver" in window
  ) {
    document.documentElement.classList.add(
      "nx-motion-ready"
    );

    revealTargets.forEach((element, index) => {
      element.classList.add("nx-reveal");

      if (element.classList.contains("tool-card")) {
        element.style.setProperty(
          "--nx-delay",
          `${(index % 3) * 75}ms`
        );
      }

      if (element.matches(".shortcut-list > div")) {
        element.style.setProperty(
          "--nx-delay",
          `${(index % 5) * 45}ms`
        );
      }
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("nx-visible");

          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -35px 0px"
      }
    );

    revealTargets.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealTargets.forEach((element) => {
      element.classList.add("nx-visible");
    });
  }

  // =========================================
  // RESULT ANIMATIONS
  // =========================================

  if (!reduceMotion) {
    document.querySelectorAll(".result-box").forEach((box) => {
      const resultObserver = new MutationObserver(() => {
        box.classList.remove("nx-result-pop");

        void box.offsetWidth;

        box.classList.add("nx-result-pop");
      });

      resultObserver.observe(box, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
  }

  // =========================================
  // PROGRESS BAR ANIMATION
  // =========================================

  const progress = $("progressFill");

  if (progress && !reduceMotion) {
    progress.style.transition =
      "width 650ms cubic-bezier(.2, .8, .2, 1)";
  }

  // =========================================
  // INITIAL STATE
  // =========================================

  // Главный экран не скрывается анимациями.
  document.querySelectorAll(".hero").forEach((hero) => {
    hero.classList.remove("nx-reveal", "nexora-reveal");
  });

  console.info(
    "NEXORA: Core, tools and motion system loaded successfully."
  );
});
