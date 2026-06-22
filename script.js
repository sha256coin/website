// S256 Website JavaScript
// Modern, smooth interactions with security hardening

document.addEventListener("DOMContentLoaded", function () {
  // Security: Sanitize numeric values from API
  function sanitizeNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  }

  // Security: Sanitize string for display (escape HTML)
  function sanitizeString(str) {
    if (typeof str !== "string") return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.textContent;
  }

  // Dropdown Menu Functionality - Handle all dropdowns
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    const dropdownToggle = dropdown.querySelector(".dropdown-toggle");
    const dropdownMenu = dropdown.querySelector(".dropdown-menu");

    if (dropdownToggle && dropdownMenu) {
      // Prevent default link behavior on the toggle
      dropdownToggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Close other dropdowns
        dropdowns.forEach((otherDropdown) => {
          if (otherDropdown !== dropdown) {
            otherDropdown.classList.remove("active");
          }
        });

        dropdown.classList.toggle("active");
      });

      // Close dropdown and mobile menu when clicking on a dropdown menu item
      dropdownMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", function () {
          dropdown.classList.remove("active");
          // Also close mobile menu if it's open
          const mobileMenuToggle = document.querySelector(
            ".mobile-menu-toggle",
          );
          const navLinks = document.querySelector(".nav-links");
          if (mobileMenuToggle && navLinks) {
            mobileMenuToggle.classList.remove("active");
            navLinks.classList.remove("active");
          }
        });
      });
    }
  });

  // Close all dropdowns when clicking outside
  document.addEventListener("click", function (e) {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  });

  // Theme Toggle Functionality
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const html = document.documentElement;

  // Check for saved theme preference or default to dark mode
  const currentTheme = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);

  themeToggle.addEventListener("click", function () {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);

    // Add rotation animation
    themeToggle.style.transform = "rotate(360deg)";
    setTimeout(() => {
      themeToggle.style.transform = "";
    }, 300);
  });

  function updateThemeIcon(theme) {
    if (theme === "dark") {
      themeIcon.textContent = "☀️";
    } else {
      themeIcon.textContent = "🌙";
    }
  }

  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Skip if href is just '#' or if it's a dropdown toggle
      if (href === "#" || this.classList.contains("dropdown-toggle")) {
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector(".navbar").offsetHeight;
        const targetPosition = target.offsetTop - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // Navbar scroll effect
  let lastScroll = 0;
  const navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    // Add shadow on scroll
    if (currentScroll > 100) {
      navbar.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
    } else {
      navbar.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
    }

    lastScroll = currentScroll;
  });

  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animation = "fadeInUp 0.8s ease forwards";
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements
  document
    .querySelectorAll(".feature-card, .philosophy-card, .download-card, .step")
    .forEach((el) => {
      el.style.opacity = "0";
      observer.observe(el);
    });

  // Stats counter animation
  function animateValue(element, start, end, duration, suffix = "") {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Observe hero stats for counter animation
  const statsObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const stats = entry.target.querySelectorAll(".stat-value");
          stats.forEach((stat) => {
            const text = stat.textContent;
            if (text.includes("M")) {
              animateValue(stat, 0, 84, 2000, "M");
            } else if (text.includes("min")) {
              animateValue(stat, 0, 20, 2000, " min");
            } else if (!isNaN(parseInt(text))) {
              animateValue(stat, 0, parseInt(text), 2000);
            }
          });
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  const heroStats = document.querySelector(".hero-stats");
  if (heroStats) {
    statsObserver.observe(heroStats);
  }

  // Parallax effect for hero gradient
  window.addEventListener("scroll", () => {
    const heroGradient = document.querySelector(".hero-gradient");
    if (heroGradient) {
      const scrolled = window.pageYOffset;
      heroGradient.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  });

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      mobileMenuToggle.classList.toggle("active");
      navLinks.classList.toggle("active");
    });

    // Close mobile menu when clicking on a regular nav link (not dropdown toggle)
    navLinks.querySelectorAll("a:not(.dropdown-toggle)").forEach((link) => {
      link.addEventListener("click", function () {
        mobileMenuToggle.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", function (e) {
      if (
        !navLinks.contains(e.target) &&
        !mobileMenuToggle.contains(e.target)
      ) {
        mobileMenuToggle.classList.remove("active");
        navLinks.classList.remove("active");
      }
    });
  }

  // Add hover effect to cards
  document
    .querySelectorAll(".feature-card, .philosophy-card, .download-card")
    .forEach((card) => {
      card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-10px) scale(1.02)";
      });

      card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0) scale(1)";
      });
    });

  // Copy functionality for addresses (using modern Clipboard API)
  async function copyToClipboard(text) {
    try {
      // Modern async Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showNotification("Copied to clipboard!");
        return;
      }

      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showNotification("Copied to clipboard!");
    } catch (err) {
      showNotification("Failed to copy");
      console.error("Copy failed:", err);
    }
  }

  // Notification system
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    // Use individual style properties instead of cssText for better security
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.background =
      "linear-gradient(135deg, #a300ff 0%, #00d4ff 100%)";
    notification.style.color = "white";
    notification.style.padding = "1rem 2rem";
    notification.style.borderRadius = "8px";
    notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
    notification.style.zIndex = "10000";
    notification.style.animation = "slideInRight 0.3s ease";

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Add animation keyframes dynamically
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
  document.head.appendChild(style);

  // Matrix Terminal Easter Egg Functions
  let terminalContentLoaded = false;

  async function openMatrixTerminal() {
    const terminal = document.getElementById("matrix-terminal");
    if (terminal) {
      terminal.classList.add("active");

      if (!terminalContentLoaded) {
        await loadCoinSupply();
        terminalContentLoaded = true;
      }
    }
  }

  function closeMatrixTerminal() {
    const terminal = document.getElementById("matrix-terminal");
    if (terminal) {
      terminal.classList.remove("active");
    }
  }

  // Helper to safely create terminal lines
  function createTerminalLine(text) {
    const div = document.createElement("div");
    div.className = "terminal-line";
    div.textContent = text;
    return div;
  }

  async function loadCoinSupply() {
    const content = document.getElementById("terminal-content");
    if (!content) return;

    try {
      // Clear content and add loading lines safely
      content.textContent = "";
      content.appendChild(
        createTerminalLine("Initializing secure connection..."),
      );
      content.appendChild(
        createTerminalLine("Decrypting blockchain parameters..."),
      );
      content.appendChild(createTerminalLine("Accessing S256_SUPPLY.dat..."));
      content.appendChild(createTerminalLine("Loading..."));

      const response = await fetch("/static/COIN_SUPPLY.txt");
      const text = await response.text();

      setTimeout(() => {
        displayTerminalContent(text);
      }, 1000);
    } catch (error) {
      content.textContent = "";
      content.appendChild(
        createTerminalLine("ERROR: Unable to access COIN_SUPPLY.txt"),
      );
      content.appendChild(createTerminalLine("Connection failed"));
      const cursorLine = createTerminalLine("");
      const cursor = document.createElement("span");
      cursor.className = "terminal-cursor";
      cursorLine.appendChild(cursor);
      content.appendChild(cursorLine);
    }
  }

  function displayTerminalContent(text) {
    const content = document.getElementById("terminal-content");
    if (!content) return;

    const lines = text.split("\n");

    // Clear and add header lines safely
    content.textContent = "";
    content.appendChild(createTerminalLine("Connection established..."));
    content.appendChild(createTerminalLine("Decryption complete."));
    content.appendChild(createTerminalLine("Displaying: COIN_SUPPLY.txt"));
    content.appendChild(
      createTerminalLine(
        "═══════════════════════════════════════════════════════════════════",
      ),
    );
    content.appendChild(document.createElement("br"));

    lines.forEach((line, index) => {
      setTimeout(() => {
        const lineDiv = createTerminalLine(line);
        lineDiv.style.animationDelay = "0s";
        content.appendChild(lineDiv);
        content.scrollTop = content.scrollHeight;
      }, index * 20);
    });

    setTimeout(
      () => {
        const cursorDiv = document.createElement("div");
        cursorDiv.className = "terminal-line";
        cursorDiv.appendChild(document.createElement("br"));
        const cursor = document.createElement("span");
        cursor.className = "terminal-cursor";
        cursorDiv.appendChild(cursor);
        content.appendChild(cursorDiv);
        content.scrollTop = content.scrollHeight;
      },
      lines.length * 20 + 100,
    );
  }

  // Matrix Terminal Event Listeners
  const piSymbol = document.getElementById("pi-easter-egg");
  const terminalClose = document.getElementById("terminal-close");
  const matrixTerminal = document.getElementById("matrix-terminal");

  if (piSymbol) {
    piSymbol.addEventListener("click", openMatrixTerminal);
  }

  if (terminalClose) {
    terminalClose.addEventListener("click", closeMatrixTerminal);
  }

  if (matrixTerminal) {
    matrixTerminal.addEventListener("click", (e) => {
      if (e.target === matrixTerminal) {
        closeMatrixTerminal();
      }
    });
  }

  // Set current year in footer
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  console.log(
    "%c S256 - Digital Platinum ",
    "background: linear-gradient(135deg, #a300ff 0%, #00d4ff 100%); color: white; font-size: 20px; padding: 10px;",
  );
  console.log(
    "%c Double the Work, Double the Value ",
    "color: #a300ff; font-size: 14px;",
  );
});

// Helper to format large numbers with K/M/G/T suffixes
function formatHashrate(value) {
  if (value >= 1000000000000)
    return (value / 1000000000000).toFixed(2) + " TH/s";
  if (value >= 1000000000) return (value / 1000000000).toFixed(2) + " GH/s";
  if (value >= 1000000) return (value / 1000000).toFixed(2) + " MH/s";
  return value.toFixed(2) + " H/s";
}

function formatDifficulty(value) {
  if (value >= 1000000000) return (value / 1000000000).toFixed(2) + " G";
  if (value >= 1000000) return (value / 1000000).toFixed(2) + " M";
  if (value >= 1000) return (value / 1000).toFixed(2) + " K";
  return value.toFixed(2);
}

// Network Stats Functionality
async function fetchNetworkStats() {
  try {
    const blockchainResponse = await fetch(
      "https://explorer.sha256coin.eu/api/blockchain-info",
    );
    const data = await blockchainResponse.json();

    if (data) {
      const heightEl = document.getElementById("network-height");
      const hashrateEl = document.getElementById("network-hashrate");
      const diffEl = document.getElementById("network-difficulty");
      const volEl = document.getElementById("network-volume");

      const blocks = (data.blocks || data.blockcount || 0).toLocaleString();
      const hashrateRaw = data.networkhashps || 0;
      const hashrateText = formatHashrate(hashrateRaw);
      const diffText = formatDifficulty(data.difficulty || 0);
      const volText = "N/A";

      if (heightEl) heightEl.textContent = blocks;
      if (hashrateEl) hashrateEl.textContent = hashrateText;
      if (diffEl) diffEl.textContent = diffText;
      if (volEl) volEl.textContent = volText;

      // Update clone if it exists
      const marqueeGroup = document.querySelector(".network-stats-group");
      if (marqueeGroup && marqueeGroup.children.length > 1) {
        const clone = marqueeGroup.children[1];
        const stats = clone.querySelectorAll(".network-bar-value");
        if (stats.length >= 4) {
          stats[0].textContent = blocks;
          stats[1].textContent = hashrateText;
          stats[2].textContent = diffText;
          stats[3].textContent = volText;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching network stats:", error);
  }
}
// Initialize Network Stats and Marquee
fetchNetworkStats();
setInterval(fetchNetworkStats, 60000); // Refresh every minute

// JavaScript Marquee Implementation
function initMarquee() {
  const marqueeBar = document.querySelector(".network-bar");
  const marqueeGroup = document.querySelector(".network-stats-group");
  if (!marqueeBar || !marqueeGroup) return;

  // Start position: right edge of the bar
  let position = marqueeBar.offsetWidth;
  const speed = 0.98; // Pixels per frame
  let isPaused = false;

  marqueeGroup.addEventListener("mouseenter", () => (isPaused = true));
  marqueeGroup.addEventListener("mouseleave", () => (isPaused = false));

  function step() {
    if (!isPaused) {
      const firstSet = marqueeGroup.querySelector(".marquee-set");
      const setWidth = firstSet.offsetWidth;

      position -= speed;

      // Reset when the first set has scrolled completely off the left edge
      if (position <= -setWidth) {
        position = marqueeBar.offsetWidth;
      }

      marqueeGroup.style.transform = `translateX(${position}px)`;
    }
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// Start Marquee when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMarquee);
} else {
  initMarquee();
}
