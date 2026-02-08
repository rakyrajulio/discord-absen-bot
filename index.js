const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let db = {};

client.once('ready', () => {
  console.log('Bot absen ONLINE 🚀');
});

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const userId = msg.author.id;
  const today = new Date().toISOString().slice(0, 10);
  const cmd = msg.content.toLowerCase();

  if (!db[userId]) db[userId] = { point: 0, lastAbsen: null };

  if (cmd === '!absen') {
    if (db[userId].lastAbsen === today)
      return msg.reply('❌ Kamu sudah absen hari ini.');

    db[userId].lastAbsen = today;
    db[userId].point += 5;
    return msg.reply('✅ Absen sukses! +5 point');
  }

  if (cmd === '!point') {
    return msg.reply(`💰 Point kamu: **${db[userId].point}**`);
  }
});

client.login(process.env.TOKEN);
