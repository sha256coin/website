// S256 Website JavaScript
// Modern, smooth interactions with security hardening

document.addEventListener('DOMContentLoaded', function() {

    // Security: Sanitize numeric values from API
    function sanitizeNumber(value, defaultValue = 0) {
        const num = parseFloat(value);
        return isNaN(num) || !isFinite(num) ? defaultValue : num;
    }

    // Security: Sanitize string for display (escape HTML)
    function sanitizeString(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.textContent;
    }

    // Dropdown Menu Functionality - Handle all dropdowns
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');

        if (dropdownToggle && dropdownMenu) {
            // Prevent default link behavior on the toggle
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Close other dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });

                dropdown.classList.toggle('active');
            });

            // Close dropdown and mobile menu when clicking on a dropdown menu item
            dropdownMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function() {
                    dropdown.classList.remove('active');
                    // Also close mobile menu if it's open
                    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
                    const navLinks = document.querySelector('.nav-links');
                    if (mobileMenuToggle && navLinks) {
                        mobileMenuToggle.classList.remove('active');
                        navLinks.classList.remove('active');
                    }
                });
            });
        }
    });

    // Close all dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });

    // Theme Toggle Functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    const html = document.documentElement;

    // Check for saved theme preference or default to dark mode
    const currentTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);

        // Add rotation animation
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 300);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Skip if href is just '#' or if it's a dropdown toggle
            if (href === '#' || this.classList.contains('dropdown-toggle')) {
                return;
            }

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add shadow on scroll
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }

        lastScroll = currentScroll;
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.8s ease forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.feature-card, .philosophy-card, .download-card, .step').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Stats counter animation
    function animateValue(element, start, end, duration, suffix = '') {
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
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stats = entry.target.querySelectorAll('.stat-value');
                stats.forEach(stat => {
                    const text = stat.textContent;
                    if (text.includes('M')) {
                        animateValue(stat, 0, 84, 2000, 'M');
                    } else if (text.includes('min')) {
                        animateValue(stat, 0, 20, 2000, ' min');
                    } else if (!isNaN(parseInt(text))) {
                        animateValue(stat, 0, parseInt(text), 2000);
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    // Parallax effect for hero gradient
    window.addEventListener('scroll', () => {
        const heroGradient = document.querySelector('.hero-gradient');
        if (heroGradient) {
            const scrolled = window.pageYOffset;
            heroGradient.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking on a regular nav link (not dropdown toggle)
        navLinks.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // Add hover effect to cards
    document.querySelectorAll('.feature-card, .philosophy-card, .download-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Copy functionality for addresses (using modern Clipboard API)
    async function copyToClipboard(text) {
        try {
            // Modern async Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                showNotification('Copied to clipboard!');
                return;
            }

            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification('Copied to clipboard!');
        } catch (err) {
            showNotification('Failed to copy');
            console.error('Copy failed:', err);
        }
    }

    // Notification system
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        // Use individual style properties instead of cssText for better security
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.background = 'linear-gradient(135deg, #a300ff 0%, #00d4ff 100%)';
        notification.style.color = 'white';
        notification.style.padding = '1rem 2rem';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '10000';
        notification.style.animation = 'slideInRight 0.3s ease';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animation keyframes dynamically
    const style = document.createElement('style');
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
        const terminal = document.getElementById('matrix-terminal');
        if (terminal) {
            terminal.classList.add('active');

            if (!terminalContentLoaded) {
                await loadCoinSupply();
                terminalContentLoaded = true;
            }
        }
    }

    function closeMatrixTerminal() {
        const terminal = document.getElementById('matrix-terminal');
        if (terminal) {
            terminal.classList.remove('active');
        }
    }

    // Helper to safely create terminal lines
    function createTerminalLine(text) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.textContent = text;
        return div;
    }

    async function loadCoinSupply() {
        const content = document.getElementById('terminal-content');
        if (!content) return;

        try {
            // Clear content and add loading lines safely
            content.textContent = '';
            content.appendChild(createTerminalLine('Initializing secure connection...'));
            content.appendChild(createTerminalLine('Decrypting blockchain parameters...'));
            content.appendChild(createTerminalLine('Accessing S256_SUPPLY.dat...'));
            content.appendChild(createTerminalLine('Loading...'));

            const response = await fetch('/static/COIN_SUPPLY.txt');
            const text = await response.text();

            setTimeout(() => {
                displayTerminalContent(text);
            }, 1000);

        } catch (error) {
            content.textContent = '';
            content.appendChild(createTerminalLine('ERROR: Unable to access COIN_SUPPLY.txt'));
            content.appendChild(createTerminalLine('Connection failed'));
            const cursorLine = createTerminalLine('');
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            cursorLine.appendChild(cursor);
            content.appendChild(cursorLine);
        }
    }

    function displayTerminalContent(text) {
        const content = document.getElementById('terminal-content');
        if (!content) return;

        const lines = text.split('\n');

        // Clear and add header lines safely
        content.textContent = '';
        content.appendChild(createTerminalLine('Connection established...'));
        content.appendChild(createTerminalLine('Decryption complete.'));
        content.appendChild(createTerminalLine('Displaying: COIN_SUPPLY.txt'));
        content.appendChild(createTerminalLine('═══════════════════════════════════════════════════════════════════'));
        content.appendChild(document.createElement('br'));

        lines.forEach((line, index) => {
            setTimeout(() => {
                const lineDiv = createTerminalLine(line);
                lineDiv.style.animationDelay = '0s';
                content.appendChild(lineDiv);
                content.scrollTop = content.scrollHeight;
            }, index * 20);
        });

        setTimeout(() => {
            const cursorDiv = document.createElement('div');
            cursorDiv.className = 'terminal-line';
            cursorDiv.appendChild(document.createElement('br'));
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            cursorDiv.appendChild(cursor);
            content.appendChild(cursorDiv);
            content.scrollTop = content.scrollHeight;
        }, lines.length * 20 + 100);
    }

    // Matrix Terminal Event Listeners
    const piSymbol = document.getElementById('pi-easter-egg');
    const terminalClose = document.getElementById('terminal-close');
    const matrixTerminal = document.getElementById('matrix-terminal');

    if (piSymbol) {
        piSymbol.addEventListener('click', openMatrixTerminal);
    }

    if (terminalClose) {
        terminalClose.addEventListener('click', closeMatrixTerminal);
    }

    if (matrixTerminal) {
        matrixTerminal.addEventListener('click', (e) => {
            if (e.target === matrixTerminal) {
                closeMatrixTerminal();
            }
        });
    }

    // ============================================
    // Live Price Ticker Functionality
    // ============================================
    const priceTicker = document.getElementById('price-ticker');
    const priceTickerToggle = document.getElementById('price-ticker-toggle');
    let currentExchange = 'klingex';
    let priceData = {
        klingex: null,
        rabidrabbit: null
    };

    // Toggle ticker open/close
    if (priceTickerToggle) {
        priceTickerToggle.addEventListener('click', function() {
            priceTicker.classList.toggle('open');

            // Save state to localStorage
            const isOpen = priceTicker.classList.contains('open');
            localStorage.setItem('priceTickerOpen', isOpen);
        });
    }

    // Restore ticker state from localStorage
    const savedTickerState = localStorage.getItem('priceTickerOpen');
    if (savedTickerState === 'true') {
        priceTicker.classList.add('open');
    }

    // Exchange tab switching
    const exchangeTabs = document.querySelectorAll('.exchange-tab');
    exchangeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const exchange = this.getAttribute('data-exchange');
            switchExchange(exchange);
        });
    });

    function switchExchange(exchange) {
        // Update current exchange
        currentExchange = exchange;

        // Update tab active state
        exchangeTabs.forEach(tab => {
            if (tab.getAttribute('data-exchange') === exchange) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Show/hide exchange data
        document.getElementById('klingex-data').style.display =
            exchange === 'klingex' ? 'block' : 'none';
        document.getElementById('rabidrabbit-data').style.display =
            exchange === 'rabidrabbit' ? 'block' : 'none';

        // Save preference
        localStorage.setItem('preferredExchange', exchange);
    }

    // Restore preferred exchange
    const savedExchange = localStorage.getItem('preferredExchange');
    if (savedExchange) {
        switchExchange(savedExchange);
    }

    // Fetch price data from KlingEx API (via proxy)
    async function fetchKlingExData() {
        try {
            const response = await fetch('/api/price-klingex');
            const s256Ticker = await response.json();

            if (s256Ticker && !s256Ticker.error) {
                priceData.klingex = s256Ticker;
                updateKlingExUI(s256Ticker);
            } else {
                console.warn('S256_USDT ticker not found in KlingEx API');
            }
        } catch (error) {
            console.error('Error fetching KlingEx data:', error);
        }
    }

    // Fetch price data from Rabid Rabbit API (via proxy)
    async function fetchRabidRabbitData() {
        try {
            const response = await fetch('/api/price-rabidrabbit');
            const s256Data = await response.json();

            if (s256Data && !s256Data.error) {
                priceData.rabidrabbit = s256Data;
                updateRabidRabbitUI(s256Data);
            } else {
                console.warn('S256_USDT not found in Rabid Rabbit API');
            }
        } catch (error) {
            console.error('Error fetching Rabid Rabbit data:', error);
        }
    }

    // Update KlingEx UI
    function updateKlingExUI(ticker) {
        if (!ticker || typeof ticker !== 'object') return;

        const price = sanitizeNumber(ticker.last_price);
        const high = sanitizeNumber(ticker.high);
        const low = sanitizeNumber(ticker.low);

        // Update price (using textContent is safe)
        const priceEl = document.getElementById('klingex-price');
        if (priceEl) priceEl.textContent = `$${price.toFixed(6)}`;

        // Calculate 24h change
        const changeElement = document.getElementById('klingex-change');
        if (changeElement && high > 0 && low > 0) {
            const change = ((price - low) / low * 100);
            const changeValueEl = changeElement.querySelector('.change-value');

            if (changeValueEl) {
                if (change > 0) {
                    changeValueEl.textContent = `+${change.toFixed(2)}%`;
                    changeElement.className = 'price-ticker-change positive';
                } else if (change < 0) {
                    changeValueEl.textContent = `${change.toFixed(2)}%`;
                    changeElement.className = 'price-ticker-change negative';
                } else {
                    changeValueEl.textContent = `${change.toFixed(2)}%`;
                    changeElement.className = 'price-ticker-change neutral';
                }
            }
        }

        // Update 24h high/low
        const highEl = document.getElementById('klingex-high');
        const lowEl = document.getElementById('klingex-low');
        if (highEl) highEl.textContent = high > 0 ? `$${high.toFixed(6)}` : '$0.00';
        if (lowEl) lowEl.textContent = low > 0 ? `$${low.toFixed(6)}` : '$0.00';

        // Update S256 volume
        const volume = sanitizeNumber(ticker.base_volume);
        const volumeEl = document.getElementById('klingex-volume');
        if (volumeEl) volumeEl.textContent = formatVolume(volume);

        // Update USDT volume
        const volumeUsdt = sanitizeNumber(ticker.target_volume);
        const volumeUsdtEl = document.getElementById('klingex-volume-usdt');
        if (volumeUsdtEl) volumeUsdtEl.textContent = formatVolumeUsdt(volumeUsdt);

        // Update last update time
        updateLastUpdateTime('klingex');
    }

    // Update Rabid Rabbit UI
    function updateRabidRabbitUI(data) {
        if (!data || typeof data !== 'object') return;

        const price = sanitizeNumber(data.last_price);
        const volume = sanitizeNumber(data.base_volume);
        const volumeUsdt = sanitizeNumber(data.quote_volume);

        // Update price
        const priceEl = document.getElementById('rabidrabbit-price');
        if (priceEl) priceEl.textContent = `$${price.toFixed(6)}`;

        // Update change (Rabid Rabbit doesn't provide high/low, so we show neutral)
        const changeElement = document.getElementById('rabidrabbit-change');
        if (changeElement) {
            changeElement.className = 'price-ticker-change neutral';
            const changeValueEl = changeElement.querySelector('.change-value');
            if (changeValueEl) changeValueEl.textContent = '--';
        }

        // High/Low not available for Rabid Rabbit
        const highEl = document.getElementById('rabidrabbit-high');
        const lowEl = document.getElementById('rabidrabbit-low');
        if (highEl) highEl.textContent = 'N/A';
        if (lowEl) lowEl.textContent = 'N/A';

        // Update S256 volume
        const volumeEl = document.getElementById('rabidrabbit-volume');
        if (volumeEl) volumeEl.textContent = formatVolume(volume);

        // Update USDT volume
        const volumeUsdtEl = document.getElementById('rabidrabbit-volume-usdt');
        if (volumeUsdtEl) volumeUsdtEl.textContent = formatVolumeUsdt(volumeUsdt);

        // Update last update time
        updateLastUpdateTime('rabidrabbit');
    }

    // Format S256 volume helper
    function formatVolume(volume) {
        if (volume >= 1000000) {
            return `${(volume / 1000000).toFixed(2)}M`;
        } else if (volume >= 1000) {
            return `${(volume / 1000).toFixed(2)}K`;
        } else {
            return `${volume.toFixed(2)}`;
        }
    }

    // Format USDT volume helper
    function formatVolumeUsdt(volume) {
        if (volume >= 1000000) {
            return `$${(volume / 1000000).toFixed(2)}M`;
        } else if (volume >= 1000) {
            return `$${(volume / 1000).toFixed(2)}K`;
        } else {
            return `$${volume.toFixed(2)}`;
        }
    }

    // Update last update time
    function updateLastUpdateTime(exchange) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        document.getElementById(`${exchange}-last-update`).textContent = `Updated: ${timeString}`;
    }

    // Fetch all price data
    function fetchAllPriceData() {
        fetchKlingExData();
        fetchRabidRabbitData();
    }

    // Initial fetch
    fetchAllPriceData();

    // Update every 30 seconds
    setInterval(fetchAllPriceData, 30000);

    // Set current year in footer
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    console.log('%c S256 - Digital Platinum ', 'background: linear-gradient(135deg, #a300ff 0%, #00d4ff 100%); color: white; font-size: 20px; padding: 10px;');
    console.log('%c Double the Work, Double the Value ', 'color: #a300ff; font-size: 14px;');
});
