// server.cjs
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve arquivos estáticos (dashboard, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// caminhos dos JSONs
const CHANNELS_FILE = path.join(__dirname, 'bot-channels.json');
const ANNOUNCE_FILE = path.join(__dirname, 'bot-announce.json');

// rota para listar canais (lê bot-channels.json)
app.get('/api/channels', (req, res) => {
  try {
    if (!fs.existsSync(CHANNELS_FILE)) return res.json([]);
    const raw = fs.readFileSync(CHANNELS_FILE, 'utf8');
    const data = raw ? JSON.parse(raw) : [];
    return res.json(data);
  } catch (err) {
    console.error('Erro lendo canais:', err);
    return res.status(500).json({ error: 'failed_read_channels' });
  }
});

// rota para salvar anúncio (recebe JSON { title, message|content, channelId, delay })
app.post('/api/announce/save', (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title || '';
    const content = body.message || body.content || '';
    const channelId = (body.channelId || body.channel || '').toString();
    const delay = Number(body.delay || 0);

    if (!channelId || !content) {
      return res.status(400).json({ success: false, message: 'invalid body' });
    }

    // lê arquivo atual
    let anuncios = [];
    if (fs.existsSync(ANNOUNCE_FILE)) {
      const raw = fs.readFileSync(ANNOUNCE_FILE, 'utf8');
      anuncios = raw ? JSON.parse(raw) : [];
    }

    const novo = {
      id: Date.now().toString(),
      title,
      content,
      channelId,
      delay,
      createdAt: new Date().toISOString(),
      sent: false
    };

    anuncios.push(novo);
    fs.writeFileSync(ANNOUNCE_FILE, JSON.stringify(anuncios, null, 2), 'utf8');

    console.log('📣 Recebido anúncio:', { title, channelId });
    return res.json({ success: true, announcement: novo });
  } catch (err) {
    console.error('Erro ao salvar anúncio:', err);
    return res.status(500).json({ success: false });
  }
});

// rota para recarregar canais manualmente (apenas feedback - o bot deve atualizar bot-channels.json)
app.post('/api/control/reload-channels', (req, res) => {
  // aqui apenas indicamos sucesso — o bot Discord precisa atualizar o bot-channels.json
  return res.json({ success: true });
});

// healthcheck simples
app.get('/api/health', (req, res) => res.json({ ok: true }));

// fallback GET / para servir dashboard.html diretamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// lista rota fallback (opcional)
app.listen(PORT, () => {
  console.log(`🟦 Painel rodando em http://localhost:${PORT}`);
});