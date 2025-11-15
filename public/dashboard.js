// public/dashboard.js
(async function () {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));

  // tabs
  qsa('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      qsa('.panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(tab);
      if (panel) panel.classList.add('active');
    });
  });

  const channelSelect = qs('#channelSelect');
  const channelsList = qs('#channelsList');
  const historyList = qs('#historyList');
  const preview = qs('#preview');
  const titleInput = qs('#title');
  const messageInput = qs('#message');
  const delayInput = qs('#delay');

  // atualiza preview
  function updatePreview() {
    const t = titleInput.value || '(sem título)';
    const c = messageInput.value || '(sem conteúdo)';
    preview.innerHTML = `${t}<br>${c}`;
  }
  titleInput && titleInput.addEventListener('input', updatePreview);
  messageInput && messageInput.addEventListener('input', updatePreview);

  // fetch canais
  async function loadChannels() {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      channelSelect.innerHTML = '<option value="">(selecione)</option>';
      channelsList.innerHTML = '';
      if (Array.isArray(data)) {
        data.forEach(ch => {
          const opt = document.createElement('option');
          opt.value = ch.id || ch._id || ch.idString || '';
          opt.textContent = (ch.name || ch.channelName || ch.displayName || ch.name) + (ch.guildName ? ` — ${ch.guildName}` : '');
          channelSelect.appendChild(opt);

          const el = document.createElement('div');
          el.className = 'channelItem';
          el.textContent = `${opt.textContent} (${opt.value})`;
          channelsList.appendChild(el);
        });
      } else {
        channelsList.textContent = 'Sem canais';
      }
    } catch (e) {
      channelsList.textContent = 'Erro ao carregar canais';
      console.error(e);
    }
  }

  // load histórico (le o bot-announce.json pelo servidor? não há rota - carregamos /bot-announce.json se existir)
  async function loadHistory() {
    try {
      const res = await fetch('/bot-announce.json');
      if (!res.ok) {
        historyList.textContent = 'Sem histórico.';
        return;
      }
      const data = await res.json();
      historyList.innerHTML = '';
      if (Array.isArray(data) && data.length) {
        data.slice().reverse().forEach(a => {
          const d = document.createElement('div');
          d.className = 'historyItem';
          d.textContent = `${a.createdAt || ''} — ${a.title || '(sem título)'} → ${a.channelId} — ${a.sent ? 'enviado' : 'pendente'}`;
          historyList.appendChild(d);
        });
      } else {
        historyList.textContent = 'Nenhum anúncio salvo.';
      }
    } catch (e) {
      historyList.textContent = 'Erro ao carregar histórico';
    }
  }

  // salvar anúncio
  async function saveAnnouncement(sendNow = false) {
    const payload = {
      title: titleInput.value,
      message: messageInput.value,
      channelId: channelSelect.value,
      delay: Number(delayInput.value || 0)
    };
    if (!payload.channelId || !payload.message) {
      alert('Escolha um canal e escreva a mensagem.');
      return;
    }
    try {
      const res = await fetch('/api/announce/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Anúncio salvo!');
        loadHistory();
        if (sendNow) {
          // tenta enviar chamando o bot (se tiver rota de envio direto, poderia usar; aqui apenas avisa)
          alert('Pedido de envio enviado ao servidor (o bot precisa processar o arquivo).');
        }
      } else {
        alert('Falha ao salvar.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar anúncio.');
    }
  }

  // recarregar canais (chama rota do server, bot deve atualizar o JSON)
  async function reloadChannels() {
    qs('#controlResult').textContent = 'recarregando...';
    try {
      const res = await fetch('/api/control/reload-channels', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTimeout(async () => {
          await loadChannels();
          qs('#controlResult').textContent = 'Canais recarregados.';
        }, 800);
      } else {
        qs('#controlResult').textContent = 'Falha ao recarregar.';
      }
    } catch (e) {
      qs('#controlResult').textContent = 'Erro no servidor.';
    }
  }

  // event listeners
  // Botão "Salvar" — apenas salva
qs("#saveBtn")?.addEventListener("click", () => {
    saveAnnouncement(false);
});

// Botão "Enviar Agora" — salva e depois envia
qs("#sendNowBtn")?.addEventListener("click", async () => {
    await saveAnnouncement(true); // só envia UMA vez
});
  qs('#reloadChannels') && qs('#reloadChannels').addEventListener('click', reloadChannels);
  qs('#refreshStatus') && qs('#refreshStatus').addEventListener('click', () => {
    qs('#botstatus').textContent = 'Bot online — (verifique no console)';
  });

  // inicial
  await loadChannels();
  await loadHistory();
  updatePreview();
})();