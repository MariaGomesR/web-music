// Elementos principais
const serverUrlInput = document.getElementById('serverUrl');
const connectBtn = document.getElementById('connectBtn');
const statusEl = document.getElementById('status');
const songListEl = document.getElementById('songList');
const songListContainer = document.getElementById('songListContainer');
const audioEl = document.getElementById('audio');
const nowPlayingEl = document.getElementById('nowPlaying');

// Elementos do player
const playPauseBtn = document.getElementById('playPause');
const progressBar = document.getElementById('progress');
const timeDisplay = document.getElementById('timeDisplay');
const volumeControl = document.getElementById('volume');

// Histórico e mais tocadas
const historyListEl = document.getElementById('historyList');
let history = [];

const topList = document.getElementById('topList');
let contagemTocadas = {};

// Carrega URL salva
const savedUrl = localStorage.getItem('serverUrl');
if (savedUrl) {
  serverUrlInput.value = savedUrl;
}

// Função para conectar ao servidor
async function connectToServer() {
  const baseUrl = serverUrlInput.value.trim();
  
  if (!baseUrl) {
    statusEl.textContent = 'Por favor, digite a URL do servidor';
    return;
  }

  // Salva a URL
  localStorage.setItem('serverUrl', baseUrl);
  statusEl.textContent = 'Conectando...';

  try {
    // Testa a conexão com a rota de saúde
    const healthResponse = await fetch(`${baseUrl}/api/saude`);
    if (!healthResponse.ok) throw new Error('Servidor não respondeu');

    const healthData = await healthResponse.json();
    statusEl.textContent = `Conectado! ${healthData.count} músicas disponíveis.`;

    // Busca a lista de músicas
    const musicResponse = await fetch(`${baseUrl}/api/musicas`);
    const musicas = await musicResponse.json();

    // Exibe as músicas
    displayMusicas(baseUrl, musicas);

  } catch (error) {
    statusEl.textContent = 'Erro ao conectar. Verifique a URL e tente novamente.';
    console.error('Erro:', error);
  }
}

// Função para exibir as músicas
function displayMusicas(baseUrl, musicas) {
  songListEl.innerHTML = '';
  
  if (!musicas || musicas.length === 0) {
    songListEl.innerHTML = '<li class="music-item">Nenhuma música encontrada</li>';
    songListContainer.style.display = 'block';
    return;
  }

  musicas.forEach(musica => {
    const li = document.createElement('li');
    li.className = 'music-item';

    li.innerHTML = `
      <div class="meta">
        <div class="title">${musica.title || 'Sem título'}</div>
        <div class="artist">${musica.artist || 'Artista desconhecido'}</div>
      </div>
      <button class="play-btn" data-url="${baseUrl}${musica.url}">▶</button>
    `;

    songListEl.appendChild(li);
  });

  // Adiciona eventos aos botões de play
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const audioUrl = this.getAttribute('data-url');
      playMusic(audioUrl, this.closest('.music-item'));
    });
  });

  // Mostra o container da lista
  songListContainer.style.display = 'block';
}

// Função para tocar música (corrigida + histórico/mais tocadas)
function playMusic(url, musicItem) {
  audioEl.src = url;
  audioEl.play().catch(error => {
    console.error('Erro ao reproduzir:', error);
    nowPlayingEl.textContent = 'Erro ao reproduzir a música';
  });

  // Atualiza a informação da música atual
  const title = musicItem.querySelector('.title').textContent;
  const artist = musicItem.querySelector('.artist').textContent;
  nowPlayingEl.textContent = `Tocando: ${title} - ${artist}`;

  playPauseBtn.textContent = '⏸';

  // --- Histórico ---
  const musica = { title, artist, url };
  history.push(musica);
  renderizarHistorico();

  // --- Mais tocadas ---
  const key = musica.title || musica.url;
  contagemTocadas[key] = (contagemTocadas[key] || 0) + 1;
  renderizarTopMusicas();
}

// Renderiza histórico
function renderizarHistorico() {
  historyListEl.innerHTML = '';
  history.slice().reverse().forEach(musica => {
    const li = document.createElement('li');
    li.textContent = `${musica.title} — ${musica.artist}`;
    historyListEl.appendChild(li);
  });
}

// Renderiza mais tocadas
function renderizarTopMusicas() {
  topList.innerHTML = '';
  const entradas = Object.entries(contagemTocadas);
  if (!entradas.length) {
    topList.innerHTML = '<li>Nenhuma música tocada ainda.</li>';
    return;
  }
  entradas.sort((a, b) => b[1] - a[1]);
  entradas.forEach(([titulo, vezes]) => {
    const li = document.createElement('li');
    li.textContent = `${titulo} — ${vezes}x`;
    topList.appendChild(li);
  });
}

// Event Listeners
connectBtn.addEventListener('click', connectToServer);

// Enter no input também conecta
serverUrlInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    connectToServer();
  }
});

// Controles do player
playPauseBtn.addEventListener('click', () => {
  if (audioEl.paused) {
    audioEl.play();
    playPauseBtn.textContent = '⏸';
  } else {
    audioEl.pause();
    playPauseBtn.textContent = '▶';
  }
});

audioEl.addEventListener('timeupdate', () => {
  if (audioEl.duration) {
    progressBar.max = audioEl.duration;
    progressBar.value = audioEl.currentTime;
    
    const minutes = Math.floor(audioEl.currentTime / 60);
    const seconds = Math.floor(audioEl.currentTime % 60);
    timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
});

progressBar.addEventListener('input', () => {
  audioEl.currentTime = progressBar.value;
});

volumeControl.addEventListener('input', () => {
  audioEl.volume = volumeControl.value;
});

// Menu hamburger
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

// Tenta conectar automaticamente se já houver URL salva
window.addEventListener('DOMContentLoaded', () => {
  if (savedUrl) {
    setTimeout(() => {
      connectBtn.click();
    }, 1000);
  }
});

// --- LINKS DO MENU ---
const historyLink = document.getElementById('historyLink');
const historyPanel = document.getElementById('historyPanel');
const topLink = document.getElementById('topLink');
const topPanel = document.getElementById('topPanel');

historyLink.addEventListener('click', (e) => {
  e.preventDefault();
  const ativo = historyPanel.classList.contains('active');
  historyPanel.classList.remove('active');
  topPanel.classList.remove('active');
  if (!ativo) {
    historyPanel.classList.add('active');
    renderizarHistorico();
  }
});

topLink.addEventListener('click', (e) => {
  e.preventDefault();
  const ativo = topPanel.classList.contains('active');
  historyPanel.classList.remove('active');
  topPanel.classList.remove('active');
  if (!ativo) {
    topPanel.classList.add('active');
    renderizarTopMusicas();
  }
});

