document.addEventListener('DOMContentLoaded', () => {
  const piSymbol = document.getElementById('pi-easter-egg');
  if (!piSymbol) return;

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
      content.textContent = '';
      content.appendChild(createTerminalLine('> INITIALIZING S256 PROTOCOL...'));
      content.appendChild(createTerminalLine('> DECRYPTING BLOCKCHAIN PARAMETERS...'));
      content.appendChild(createTerminalLine('> ACCESSING S256_SUPPLY.dat...'));
      content.appendChild(createTerminalLine('> LOADING...'));

      const response = await fetch('/static/COIN_SUPPLY.txt');
      const text = await response.text();

      setTimeout(() => {
        displayTerminalContent(text);
      }, 1000);

    } catch (error) {
      content.textContent = '';
      content.appendChild(createTerminalLine('> ERROR: Unable to access COIN_SUPPLY.txt'));
      content.appendChild(createTerminalLine('> Connection failed.'));
    }
  }

  function displayTerminalContent(text) {
    const content = document.getElementById('terminal-content');
    if (!content) return;

    const lines = text.split('\n');
    content.textContent = '';
    content.appendChild(createTerminalLine('> Connection established...'));
    content.appendChild(createTerminalLine('> Decryption complete.'));
    content.appendChild(createTerminalLine('> Displaying: COIN_SUPPLY.txt'));
    content.appendChild(createTerminalLine('═══════════════════════════════════════════════════════════════════'));

    lines.forEach((line, index) => {
      setTimeout(() => {
        const lineDiv = createTerminalLine(line);
        content.appendChild(lineDiv);
        content.scrollTop = content.scrollHeight;
      }, index * 20); // Fast line-by-line display as in original script.js
    });

    const finishDelay = lines.length * 20 + 200;
    setTimeout(() => {
      const finalDiv = createTerminalLine('> ACCESS GRANTED.');
      finalDiv.style.marginTop = '20px';
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      finalDiv.appendChild(cursor);
      content.appendChild(finalDiv);

      // Add Green Logo
      const logoContainer = document.createElement('div');
      logoContainer.style.textAlign = 'center';
      logoContainer.style.marginTop = '40px';
      logoContainer.style.opacity = '0';
      logoContainer.style.transition = 'opacity 2.5s ease';

      const logo = document.createElement('img');
      logo.src = 'img/sha256coin_logo.png';
      logo.style.maxWidth = '250px';
      logo.style.filter = 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%) drop-shadow(0 0 15px #00ff00)';

      logoContainer.appendChild(logo);
      content.appendChild(logoContainer);

      setTimeout(() => {
        logoContainer.style.opacity = '0.7';
        content.scrollTop = content.scrollHeight;
      }, 500);
    }, finishDelay);
  }

  piSymbol.addEventListener('click', () => {
    let terminal = document.getElementById('matrix-terminal');
    if (!terminal) {
      terminal = document.createElement('div');
      terminal.id = 'matrix-terminal';
      terminal.className = 'matrix-terminal';
      terminal.innerHTML = `
        <div class="terminal-container">
          <div class="terminal-header">
            <div class="terminal-title">S256_SECURE_TERMINAL v1.337 [ENCRYPTED]</div>
            <button class="terminal-close" id="terminal-close">[X] CLOSE</button>
          </div>
          <div class="terminal-content" id="terminal-content"></div>
        </div>
      `;
      document.body.appendChild(terminal);

      document.getElementById('terminal-close').addEventListener('click', () => {
        terminal.classList.remove('active');
      });

      terminal.addEventListener('click', (e) => {
        if (e.target === terminal) {
          terminal.classList.remove('active');
        }
      });
    }

    terminal.classList.add('active');
    loadCoinSupply();
  });
});