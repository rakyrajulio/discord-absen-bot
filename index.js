const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const PREFIX = '>>';
const WORK_COOLDOWN = 60 * 60 * 1000; // 1 jam

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

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const koin = (n) => `${n.toLocaleString('id-ID')} 🪙`;
const todayStr = () => new Date().toISOString().slice(0, 10);

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
  console.log('🤖 Bot ONLINE (>> ekonomi)');
});

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const userId = msg.author.id;
  const today = todayStr();

  if (!db[userId]) {
    db[userId] = {
      point: 0,
      lastAbsen: null,
      streak: 0,
      lastWork: 0
    };
    saveDB();
  }

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    return msg.reply(
`📖 **COMMAND BOT**

🗓 >>absen → Absen harian (random + streak)
🛠 >>kerja → Kerja cari koin (1 jam cooldown)
🏆 >>top → Leaderboard koin
🪙 >>koin → Cek koin
👤 >>profile → Profil
🛒 >>buy vip|elite|legend|mythic

🪙 Koin hanya virtual server`
    );
  }

  if (command === 'absen') {
    if (db[userId].lastAbsen === today)
      return msg.reply('❌ Kamu sudah absen hari ini.');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (db[userId].lastAbsen === yStr) {
      db[userId].streak += 1;
    } else {
      db[userId].streak = 1;
    }

    const rewards = [3, 5, 7, 10, 15];
    let reward = rewards[Math.floor(Math.random() * rewards.length)];

    let bonus = 0;
    if (db[userId].streak === 7) bonus = 20;
    if (db[userId].streak === 14) bonus = 50;
    if (db[userId].streak === 30) bonus = 200;

    db[userId].lastAbsen = today;
    db[userId].point += reward + bonus;
    saveDB();

    await checkAchievements(msg.member);

    return msg.reply(
`✅ Absen sukses!
🎲 +${koin(reward)}
🔥 Streak: ${db[userId].streak} hari
🎁 Bonus: ${koin(bonus)}`
    );
  }

  if (command === 'kerja') {
    const now = Date.now();
    const diff = now - db[userId].lastWork;

    if (diff < WORK_COOLDOWN) {
      const mins = Math.ceil((WORK_COOLDOWN - diff) / 60000);
      return msg.reply(`⏳ Kamu capek. Kerja lagi ${mins} menit lagi.`);
    }

    const jobs = [
      'Programmer 💻',
      'Barista ☕',
      'Driver 🚗',
      'Designer 🎨',
      'Gamer 🎮'
    ];

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const salary = Math.floor(Math.random() * 16) + 15; // 15–30

    db[userId].lastWork = now;
    db[userId].point += salary;
    saveDB();

    await checkAchievements(msg.member);

    return msg.reply(
`🛠 Kamu kerja sebagai **${job}**
💰 Gaji: +${koin(salary)}
⏳ Cooldown: 1 jam`
    );
  }

  if (command === 'top') {
    const topUsers = Object.entries(db)
      .sort((a, b) => b[1].point - a[1].point)
      .slice(0, 5);

    let text = '🏆 **TOP 5 KOIN SERVER**\n\n';
    for (let i = 0; i < topUsers.length; i++) {
      const user = await client.users.fetch(topUsers[i][0]);
      text += `${i + 1}. **${user.username}** — ${koin(topUsers[i][1].point)}\n`;
    }

    return msg.reply(text);
  }

  if (command === 'koin') {
    return msg.reply(`🪙 Koin kamu: **${koin(db[userId].point)}**`);
  }

  if (command === 'profile') {
    return msg.reply(
`👤 **${msg.author.username}**
🪙 Koin: ${koin(db[userId].point)}
🔥 Streak: ${db[userId].streak} hari`
    );
  }

  if (command === 'buy') {
    const choice = args[0];
    if (!choice || !SHOP[choice])
      return msg.reply('❌ Contoh: >>buy vip');

    const item = SHOP[choice];
    const member = msg.member;

    if (db[userId].point < item.price)
      return msg.reply(`❌ Koin kurang. Butuh ${koin(item.price)}`);

    const role = msg.guild.roles.cache.find(r => r.name === item.role);
    if (!role) return msg.reply('❌ Role tidak ada.');

    db[userId].point -= item.price;
    await member.roles.add(role);
    saveDB();

    return msg.reply(`🎉 Berhasil beli **${item.role}**`);
  }
});

const checkAchievements = async member => {
  const userData = db[member.id];
  if (!userData) return;

  for (const ach of ACHIEVEMENTS) {
    const role = member.guild.roles.cache.find(r => r.name === ach.name);
    if (!role) continue;

    if (userData.point >= ach.point && !member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => {});
    }
  }
};

client.login(process.env.TOKEN);

