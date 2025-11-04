require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// === Corrige erro do dirname (caso Node 22+ esteja rodando como módulo) ===
if (typeof dirname === 'undefined') {
  global.dirname = path.resolve();
}
// ==========================================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

//  Inicializar os comandos
client.commands = new Map();

// Carrega comandos
const commandsPath = path.join(dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Carrega eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Interações (Slash Commands)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: ' Erro ao executar o comando!', ephemeral: true });
  }
});

// Responder mensagens comuns
client.on('messageCreate', (message) => {
    // Ignorar mensagens do próprio bot
    if (message.author.bot) return;

    // Respostas automáticas simples
    if (message.content.toLowerCase() === 'oi') {
        message.reply('Olá!  Tudo bem com você?');
    }

    if (message.content.toLowerCase().includes('como vai')) {
        message.reply('Eu tô ótimo!  E você?');
    }

    if (message.content.toLowerCase().includes('bot')) {
        message.reply('Oi! Eu sou seu bot fiel ');
    }
});

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

// Quando alguém enviar uma mensagem
client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Ignora bots

  const pergunta = message.content;

  // Só responder se for mencionado ou começar com o nome do bot
  if (message.mentions.has(client.user) || pergunta.toLowerCase().startsWith("bot")) {
    await message.channel.sendTyping();

    try {
      const resposta = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: pergunta }]
      });

      const texto = resposta.choices[0].message.content;
      message.reply(texto);
    } catch (err) {
      console.error(err);
      message.reply(" Ocorreu um erro ao tentar responder.");
    }
  }
});


// Carregar respostas do arquivo JSON
let respostas = JSON.parse(fs.readFileSync('./respostas.json', 'utf8'));

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const msg = message.content.toLowerCase();

  // Verifica se alguma chave do JSON está contida na mensagem
  for (const chave in respostas) {
    if (msg.includes(chave.toLowerCase())) {
      message.reply(respostas[chave]);
      break; // evita mandar várias respostas de uma vez
    }
  }
});


client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  // ID do canal onde a mensagem será enviada
  const channelId = '773692140530171914'; // substitui pelo ID do canal

  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send(' Bot reiniciado e está online novamente!');
  } else {
    console.log(' Canal não encontrado. Verifique o ID.');
  }
});

client.login(process.env.TOKEN);