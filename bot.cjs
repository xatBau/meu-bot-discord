// bot.cjs
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN não encontrado no .env");
  process.exit(1);
}

const ANNOUNCE_FILE = path.join(__dirname, "bot-announce.json");
const HISTORY_FILE = path.join(__dirname, "bot-history.json");
const CHANNELS_FILE = path.join(__dirname, "bot-channels.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once("ready", () => {
  console.log("🤖 Bot conectado como:", client.user.tag);
  // inicia loop de checagem
  setInterval(checkAndSendAnnouncements, 3000);
});

client.login(BOT_TOKEN).catch(err => {
  console.error("Erro ao logar bot:", err);
});

// Função para enviar anúncios não enviados
async function checkAndSendAnnouncements() {
  try {
    if (!fs.existsSync(ANNOUNCE_FILE)) return;

    const raw = fs.readFileSync(ANNOUNCE_FILE, "utf8");
    let anuncios = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(anuncios) || anuncios.length === 0) return;

    // carrega canais conhecidos
    let channelsMap = [];
    if (fs.existsSync(CHANNELS_FILE)) {
      try {
        const rawCh = fs.readFileSync(CHANNELS_FILE, "utf8");
        channelsMap = rawCh ? JSON.parse(rawCh) : [];
      } catch (e) { channelsMap = []; }
    }

    let changed = false;

    for (let a of anuncios) {
      if (a.sent) continue;
      // se delay existe, espera antes de enviar
      const delay = Number(a.delay || 0);
      const created = new Date(a.createdAt).getTime() || 0;
      if (delay > 0 && Date.now() < created + delay * 1000) {
        continue; // ainda aguardando
      }

      const channelId = a.channelId + ""; // string
      // valida se temos o channelId na lista (opcional)
      const hasChannel = channelsMap.find(c => (c.id + "") === (channelId));
      // tenta pegar canal do client
      const channel = client.channels.cache.get(channelId) || (hasChannel ? client.channels.cache.get(hasChannel.id) : null);

      if (!channel) {
        console.warn("Canal não encontrado para anúncio:", channelId);
        // não marcar como enviado — talvez o bot ainda não esteja cacheando; tentar depois
        continue;
      }

      try {
        const text = a.title ? `**${a.title}**\n${a.content}` : a.content;
        await channel.send({ content: text });
        console.log("📣 Anúncio enviado para canal:", channelId);

        // marca como enviado
        a.sent = true;
        a.sentAt = new Date().toISOString();

        // salva histórico
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
          const hraw = fs.readFileSync(HISTORY_FILE, "utf8");
          history = hraw ? JSON.parse(hraw) : [];
        }
        history.push({ ...a, sentAt: a.sentAt });
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");

        changed = true;
      } catch (err) {
        console.error("Erro enviando anúncio para canal", channelId, err);
      }
    }

    if (changed) {
      fs.writeFileSync(ANNOUNCE_FILE, JSON.stringify(anuncios, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Erro em checkAndSendAnnouncements:", err);
  }
}