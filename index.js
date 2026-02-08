const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DB_FILE = './database.json';
let db = {};

if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}

const saveDB = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

const SHOP = {
  vip: { role: 'VIP', price: 100 },
  elite: { role: 'ELITE', price: 300 },
  legend: { role: 'LEGEND', price: 700 },
  mythic: { role: 'MYTHIC', price: 1500 }
};

const ACHIEVEMENTS = [
  { name: 'ACTIVE MEMBER', point: 50 },
  { name: 'CONSISTENT', point: 200 },
  { name: 'VETERAN', point: 500 },
  { name: 'TOP', point: 1000 }
];

client.once('ready', () => {
  console.log('🤖 Bot ONLINE!');
});

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  const userId = msg.author.id;
  const today = new Date().toISOString().slice(0, 10);
  const cmd = msg.content.toLowerCase();

  if (!db[userId]) {
    db[userId] = {
      point: 0,
      lastAbsen: null
    };
    saveDB();
  }

  if (cmd === '!help') {
    return sendHelp(msg);
  }

  if (cmd === '!absen') {
    if (db[userId].lastAbsen === today)
      return msg.reply('❌ Kamu sudah absen hari ini.');

    db[userId].lastAbsen = today;
    db[userId].point += 5;
    saveDB();

    await checkAchievements(msg.member);

    return msg.reply('✅ Absen sukses! +5 point');
  }

  if (cmd === '!point') {
    return msg.reply(`💰 Point kamu: **${db[userId].point}**`);
  }

  if (cmd.startsWith('!buy')) {
    const args = cmd.split(' ');
    const choice = args[1];

    if (!choice || !SHOP[choice]) {
      return msg.reply(
        '❌ Pilih role:\n`vip` | `elite` | `legend` | `mythic`'
      );
    }

    const item = SHOP[choice];
    const member = msg.member;

    const ownedRoles = Object.values(SHOP)
      .filter(r => member.roles.cache.some(role => role.name === r.role));

    let ownedPrice = 0;
    if (ownedRoles.length > 0) {
      ownedPrice = Math.max(...ownedRoles.map(r => r.price));
    }

    const priceToPay = item.price - ownedPrice;

    if (priceToPay <= 0)
      return msg.reply('⚠️ Kamu sudah punya role setara atau lebih tinggi.');

    if (db[userId].point < priceToPay)
      return msg.reply(`❌ Point kurang. Butuh **${priceToPay}** point.`);

    const newRole = msg.guild.roles.cache.find(r => r.name === item.role);
    if (!newRole) return msg.reply('❌ Role tidak ditemukan.');

    for (const r of ownedRoles) {
      const oldRole = msg.guild.roles.cache.find(role => role.name === r.role);
      if (oldRole) await member.roles.remove(oldRole);
    }

    db[userId].point -= priceToPay;
    await member.roles.add(newRole);
    saveDB();

    await checkAchievements(member);

    return msg.reply(
      `🎉 Berhasil upgrade ke **${item.role}**!\n💸 Dipotong ${priceToPay} point`
    );
  }

  if (cmd === '!profile') {
    const member = msg.member;
    const userData = db[userId];

    const shopRoles = Object.values(SHOP)
      .filter(r => member.roles.cache.some(role => role.name === r.role))
      .map(r => r.role)
      .join(', ') || 'Tidak ada';

    const achievementRoles = ACHIEVEMENTS
      .filter(a => member.roles.cache.some(r => r.name === a.name))
      .map(a => a.name)
      .join(', ') || 'Belum ada';

    return msg.reply(
`👤 **Profil ${msg.author.username}**
💰 Point: **${userData.point}**
🎖 Shop Role: **${shopRoles}**
🏆 Achievement: **${achievementRoles}**`
    );
  }
});

const sendHelp = (msg) => {
  msg.reply(
`📖 **DAFTAR COMMAND BOT**

🗓 **Daily**
• \`!absen\` → Absen harian (+5 point)
• \`!point\` → Cek point

🛒 **Shop Role**
• \`!buy vip\` → 100
• \`!buy elite\` → 300
• \`!buy legend\` → 700
• \`!buy mythic\` → 1500
(Upgrade otomatis, bayar selisih)

👤 **Profile**
• \`!profile\` → Profil lengkap
• \`!help\` → Bantuan

🏆 **Achievement (Auto)**
• ACTIVE MEMBER → 50+
• CONSISTENT → 200+
• VETERAN → 500+
• TOP → 1000+`
  );
};

const checkAchievements = async member => {
  const userData = db[member.id];
  if (!userData) return;

  for (const ach of ACHIEVEMENTS) {
    const role = member.guild.roles.cache.find(r => r.name === ach.name);
    if (!role) continue;

    if (userData.point >= ach.point && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      member.send(
        `🏆 Selamat! Kamu mendapatkan role **${ach.name}** (${ach.point}+ point)`
      ).catch(() => {});
    }
  }
};

client.login(process.env.TOKEN);
