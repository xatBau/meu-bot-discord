// @ts-nocheck
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const OpenAI = require("openai");

// === Configurações do Discord ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// === Player de música ===
const player = new Player(client);

// === Configuração da OpenAI (já existente) ===
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});

// === Sistema de comandos ===
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // === Comando !ajuda ===
  if (command === "ajuda") {
    const ajudaMsg = `
🎵 **Comandos do Radio Bau**
\`!play <nome ou link>\` → Tocar música
\`!pause\` → Pausar
\`!resume\` → Retomar
\`!skip\` → Pular
\`!stop\` → Parar
 \`!ask <mensagem>\` → Falar com a IA
 \`!ajuda\` → Mostrar esta lista
    `;
    await message.reply(ajudaMsg);
    return;
  }

  // === Comando !play ===
  if (command === "play") {
    const query = args.join(" ");
    if (!query) return message.reply("❗ Diga o nome ou link da música, ex: `!play Imagine Dragons`");

    const channel = message.member?.voice.channel;
    if (!channel) return message.reply("🎧 Entre em um canal de voz primeiro!");

    try {
      const result = await player.play(channel, query, {
        nodeOptions: { metadata: message },
      });
      message.reply(` Tocando agora: **${result.track.title}**`);
    } catch (e) {
      console.error(e);
      message.reply("❌ Não consegui tocar essa música.");
    }
    return;
  }

  // === Comando !pause ===
  if (command === "pause") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || !queue.node.isPlaying()) return message.reply("⏸️ Nenhuma música tocando.");
    queue.node.pause();
    return message.reply("⏸️ Música pausada.");
  }

  // === Comando !resume ===
  if (command === "resume") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue || queue.node.isPlaying()) return message.reply("▶️ Nenhuma música pausada.");
    queue.node.resume();
    return message.reply("▶️ Música retomada!");
  }

  // === Comando !skip ===
  if (command === "skip") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply("⏭️ Nenhuma música na fila.");
    queue.node.skip();
    return message.reply("⏭️ Música pulada!");
  }

  // === Comando !stop ===
  if (command === "stop") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply("🛑 Nenhuma música tocando.");
    queue.delete();
    return message.reply("🛑 Reprodução parada e fila limpa!");
  }

  // === Comando !ask (IA) ===
  if (command === "ask") {
    const pergunta = args.join(" ");
    if (!pergunta) return message.reply("❗ Escreva algo depois de `!ask`, ex: `!ask Olá!`");

    try {
      const resposta = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: pergunta }],
      });

      const respostaTexto = resposta.choices[0].message.content;
      await message.reply(respostaTexto);
    } catch (error) {
      console.error("Erro ao gerar resposta:", error.message);
      await message.reply(" Ocorreu um erro ao tentar responder.");
    }
  }
});

// === Login do bot ===
client.login(process.env.TOKEN);