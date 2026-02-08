const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// database sementara
let db = {};

// daftar role & harga
const SHOP = {
  vip: { role: 'VIP', price: 100 },
  elite: { role: 'ELITE', price: 300 },
  legend: { role: 'LEGEND', price: 700 },
  mythic: { role: 'MYTHIC', price: 1500 }
};

client.once('ready', () => {
  console.log('Bot absen ONLINE 🚀');
});

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  const userId = msg.author.id;
  const today = new Date().toISOString().slice(0, 10);
  const cmd = msg.content.toLowerCase();

  if (!db[userId]) db[userId] = { point: 0, lastAbsen: null };

  // ABSEN
  if (cmd === '!absen') {
    if (db[userId].lastAbsen === today)
      return msg.reply('❌ Kamu sudah absen hari ini.');

    db[userId].lastAbsen = today;
    db[userId].point += 5;
    return msg.reply('✅ Absen sukses! +5 point');
  }

  // CEK POINT
  if (cmd === '!point') {
    return msg.reply(`💰 Point kamu: **${db[userId].point}**`);
  }

  // BUY ROLE
  if (cmd.startsWith('!buy')) {
    const args = cmd.split(' ');
    const choice = args[1];

    if (!choice || !SHOP[choice]) {
      return msg.reply(
        '❌ Pilih role yang benar:\n💎 VIP\n🔷 ELITE\n🟣 LEGEND\n👑 MYTHIC'
      );
    }

    const item = SHOP[choice];

    if (db[userId].point < item.price) {
      return msg.reply(`❌ Point kamu kurang. Butuh ${item.price} point.`);
    }

    const role = msg.guild.roles.cache.find(r => r.name === item.role);
    if (!role) {
      return msg.reply('❌ Role tidak ditemukan di server.');
    }

    if (msg.member.roles.cache.has(role.id)) {
      return msg.reply('⚠️ Kamu sudah punya role ini.');
    }

    // potong point & kasih role
    db[userId].point -= item.price;
    await msg.member.roles.add(role);

    return msg.reply(`🎉 Berhasil membeli role **${item.role}**!`);
  }
});

client.login(process.env.TOKEN);
