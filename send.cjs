require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

console.log("🔍 TOKEN LIDO:", process.env.BOT_TOKEN);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// COLOQUE AQUI O ID DO CANAL PARA TESTE
const CHANNEL_ID = "783473387770216498";

client.once("ready", async () => {
  console.log("✅ Bot está online! Tentando enviar mensagem...");

  try {
    const canal = await client.channels.fetch(CHANNEL_ID);
    await canal.send("🔔 Teste simples: o bot CONSEGUIU enviar!");
    console.log("🎉 Mensagem enviada com sucesso!");
  } catch (err) {
    console.error("❌ ERRO AO ENVIAR:", err);
  }

  process.exit();
});

client.login(process.env.BOT_TOKEN);