const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DB_FILE = './users.json';

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

client.once('ready', () => {
  console.log('Bot absen ONLINE 🚀');
});

client.on('messageCreate', msg => {
  if (msg.author.bot) return;

  const userId = msg.author.id;
  const today = new Date().toISOString().slice(0, 10);
  const cmd = msg.content.toLowerCase();

  let db = loadDB();
  if (!db[userId]) db[userId] = { point: 0, lastAbsen: null };

  if (cmd === '!absen') {
    if (db[userId].lastAbsen === today)
      return msg.reply('❌ Kamu sudah absen hari ini.');

    db[userId].lastAbsen = today;
    db[userId].point += 5;
    saveDB(db);
    return msg.reply('✅ Absen sukses! +5 point');
  }

  if (cmd === '!point') {
    return msg.reply(`💰 Point kamu: **${db[userId].point}**`);
  }
});

client.login(process.env.TOKEN);
