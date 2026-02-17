const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const PREFIX = '>>';
const WORK_COOLDOWN = 30 * 60 * 1000;
const XP_COOLDOWN = 60 * 1000;
const DUEL_COOLDOWN = 60 * 1000; 
const TAX_RATE = 0.05; 
const pendingDuels = {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DB_FILE = './database.json';
let db = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

const saveDB = () =>
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const koin = n => `${n.toLocaleString('id-ID')} 🪙`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const xpNeed = lvl => lvl * lvl * 100;

function progressBar(current, max, size = 15) {
  const percent = current / max;
  const filled = Math.round(size * percent);
  const empty = size - filled;
  return '▰'.repeat(filled) + '▱'.repeat(empty);
}

function generateQuest() {
  const quests = [
    { type: "chat", target: 5, reward: 150, text: "Kirim 5 pesan" },
    { type: "work", target: 3, reward: 200, text: "Kerja 3 kali" },
    { type: "xp", target: 300, reward: 250, text: "Dapatkan 300 XP" }
  ];
  return quests[Math.floor(Math.random() * quests.length)];
}

client.once('clientReady', () => {
  console.log('🤖 Economy RPG Bot ONLINE');
});

client.on('messageCreate', async msg => {
  if (msg.author.bot) return;

  const uid = msg.author.id;
  const now = Date.now();

  if (!db[uid]) {
    db[uid] = {
      coin: 0,
      xp: 0,
      level: 1,
      lastXp: 0,
      lastWork: 0,
      lastAbsen: null,
      streak: 0,
      lastDuel: 0,
      dailyQuest: null
    };
    saveDB();
  }


  const today = todayStr();
  if (!db[uid].dailyQuest || db[uid].dailyQuest.date !== today) {
    const q = generateQuest();
    db[uid].dailyQuest = {
      ...q,
      progress: 0,
      claimed: false,
      date: today
    };
  }


  if (now - db[uid].lastXp > XP_COOLDOWN) {
    const gain = Math.floor(Math.random() * 10) + 5;
    db[uid].xp += gain;
    db[uid].lastXp = now;

    if (db[uid].dailyQuest?.type === "xp")
      db[uid].dailyQuest.progress += gain;

    if (db[uid].dailyQuest?.type === "chat")
      db[uid].dailyQuest.progress++;

    while (db[uid].xp >= xpNeed(db[uid].level)) {
      db[uid].xp -= xpNeed(db[uid].level);
      db[uid].level++;

      const bonus = db[uid].level * 15;
      db[uid].coin += bonus;

      const ch = msg.guild.channels.cache.get(process.env.LEVEL_CHANNEL_ID);
      if (ch) {
        ch.send(
          `🎉 **${msg.author.username} LEVEL UP!**\n⭐ Level ${db[uid].level}\n🪙 Bonus: ${koin(bonus)}`
        );
      }
    }

    saveDB();
  }

  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();


  if (cmd === 'help') {
    return msg.reply(
`📖 COMMAND
🗓 >>absen
🛠 >>kerja
🎯 >>quest
⚔ >>duel @user jumlah
✅ >>accept
🔁 >>transfer
👤 >>profile
🏆 >>top
📊 >>toplevel
`
    );
  }

  if (cmd === 'absen') {
    if (db[uid].lastAbsen === today)
      return msg.reply('❌ Sudah absen hari ini');

    const reward = Math.floor(Math.random() * 10) + 5;
    db[uid].coin += reward;
    db[uid].streak++;
    db[uid].lastAbsen = today;
    saveDB();

    return msg.reply(`✅ Absen sukses\n🎁 ${koin(reward)}\n🔥 Streak: ${db[uid].streak}`);
  }

  if (cmd === 'kerja') {

    if (now - db[uid].lastWork < WORK_COOLDOWN) {
      const sisa = WORK_COOLDOWN - (now - db[uid].lastWork);
      const m = Math.floor(sisa / 60000);
      const s = Math.floor((sisa % 60000) / 1000);
      return msg.reply(`⏳ Tunggu ${m}m ${s}s lagi`);
    }

   const jobs = [

  { name: "🧹 Tukang Bersih", min: 15, max: 25 },
  { name: "🍜 Penjual Mie", min: 20, max: 35 },
  { name: "🚚 Kurir Paket", min: 25, max: 45 },
  { name: "🧋 Barista Cafe", min: 20, max: 35 },
  { name: "🍔 Kasir Fast Food", min: 18, max: 30 },
  { name: "📦 Admin Gudang", min: 20, max: 35 },
  { name: "🚕 Driver Online", min: 25, max: 45 },
  { name: "🛵 Ojek Online", min: 20, max: 40 },
  { name: "🧑‍🌾 Petani", min: 15, max: 30 },
  { name: "🎣 Nelayan", min: 20, max: 35 },

  { name: "💻 Programmer Freelance", min: 40, max: 70 },
  { name: "🎮 Joki Game", min: 30, max: 55 },
  { name: "🎨 Desainer Grafis", min: 35, max: 60 },
  { name: "📷 Fotografer Event", min: 30, max: 55 },
  { name: "🎤 MC Event", min: 30, max: 65 },
  { name: "🔧 Teknisi Laptop", min: 35, max: 60 },
  { name: "🧑‍🍳 Koki Restoran", min: 30, max: 55 },
  { name: "🏗 Mandor Proyek", min: 35, max: 65 },
  { name: "📊 Trader Crypto", min: 40, max: 75 },
  { name: "🏦 Pegawai Bank", min: 30, max: 55 },
  { name: "📰 Content Creator", min: 35, max: 65 },
  { name: "🎬 Editor Video", min: 35, max: 60 },
  { name: "🎧 Sound Engineer", min: 30, max: 55 },
  { name: "📱 Developer App", min: 40, max: 75 },

  { name: "🚀 Startup Founder", min: 60, max: 110 },
  { name: "🏆 Atlet Profesional", min: 55, max: 95 },
  { name: "🎼 Produser Musik", min: 50, max: 90 },
  { name: "🧠 Data Scientist", min: 60, max: 100 },
  { name: "🛡 Cyber Security", min: 65, max: 110 },
  { name: "🏢 CEO Perusahaan", min: 70, max: 120 },
  { name: "💎 Investor Saham", min: 60, max: 105 },
  { name: "🎮 Pro Player Esports", min: 55, max: 95 },
  { name: "📈 Konsultan Bisnis", min: 50, max: 85 },
  { name: "🛰 Engineer AI", min: 65, max: 120 }

];


    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const base = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
    const bonus = db[uid].level * 3;
    const total = base + bonus;

    db[uid].coin += total;
    db[uid].lastWork = now;

    if (db[uid].dailyQuest?.type === "work")
      db[uid].dailyQuest.progress++;

    saveDB();

    return msg.reply(
`🛠 ${job.name}
💵 Gaji: ${koin(base)}
⭐ Bonus Lv ${db[uid].level}: ${koin(bonus)}
💰 Total: ${koin(total)}`
    );
  }

  if (cmd === 'quest') {
    const q = db[uid].dailyQuest;

    if (q.progress >= q.target && !q.claimed) {
      db[uid].coin += q.reward;
      q.claimed = true;
      saveDB();
      return msg.reply(`🎉 Quest selesai!\n💰 Reward: ${koin(q.reward)}`);
    }

    return msg.reply(
`🎯 QUEST
📌 ${q.text}
📊 ${q.progress}/${q.target}
🎁 Reward: ${koin(q.reward)}`
    );
  }

if (cmd === 'duel') {

  const target = msg.mentions.users.first();
  const amount = parseInt(args[1]);
  const now = Date.now();

  if (!target || isNaN(amount) || amount <= 0)
    return msg.reply('Format: >>duel @user 500');

  if (target.bot)
    return msg.reply('❌ Tidak bisa duel dengan bot.');

  if (target.id === uid)
    return msg.reply('❌ Tidak bisa duel dengan diri sendiri.');

  if (!db[target.id])
    return msg.reply('❌ Target belum pernah main.');

  if (db[uid].coin < amount)
    return msg.reply('❌ Koin kamu tidak cukup.');

  if (db[target.id].coin < amount)
    return msg.reply('❌ Koin target tidak cukup.');

  if (now - db[uid].lastDuel < DUEL_COOLDOWN) {
    const sisa = Math.ceil((DUEL_COOLDOWN - (now - db[uid].lastDuel)) / 1000);
    return msg.reply(`⏳ Cooldown duel ${sisa} detik lagi.`);
  }

  if (pendingDuels[target.id])
    return msg.reply('❌ Target sudah punya duel pending.');

  pendingDuels[target.id] = {
    challenger: uid,
    amount: amount,
    createdAt: now
  };

  return msg.reply(
`⚔ ${target.username}, kamu ditantang duel!

💰 Taruhan: ${koin(amount)}
Ketik >>accept untuk menerima duel!`
  );
}

if (cmd === 'accept') {

  const duel = pendingDuels[uid];
  const now = Date.now();

  if (!duel)
    return msg.reply('❌ Tidak ada duel untuk kamu.');

  const challenger = duel.challenger;
  const amount = duel.amount;

  if (!db[challenger] || !db[uid])
    return msg.reply('❌ Data tidak ditemukan.');

  if (db[uid].coin < amount)
    return msg.reply('❌ Koin kamu tidak cukup.');

  if (db[challenger].coin < amount)
    return msg.reply('❌ Koin penantang tidak cukup.');

  delete pendingDuels[uid];

  const pot = amount * 2;
  const tax = Math.floor(pot * TAX_RATE);
  const reward = pot - tax;

  const chance = 50 + (db[challenger].level - db[uid].level) * 2;
  const finalChance = Math.max(30, Math.min(70, chance));
  const roll = Math.random() * 100;

  let winner = roll < finalChance ? challenger : uid;
  let loser = winner === challenger ? uid : challenger;

  db[winner].coin += reward;
  db[loser].coin -= amount;

  
  db[winner].lastDuel = now;            
  db[loser].lastDuel = now - 30000;     

  saveDB();

  const winUser = await client.users.fetch(winner);

  return msg.reply(
`⚔ DUEL RESULT ⚔

🏆 ${winUser.username} MENANG!
💰 Hadiah: ${koin(reward)}
💸 Pajak: ${koin(tax)}

🔥 Bisa duel lagi dalam 1 menit!`
  );
}
  
  if (cmd === 'transfer') {
    const target = msg.mentions.users.first();
    const amt = parseInt(args[1]);
    if (!target || isNaN(amt))
      return msg.reply('>>transfer @user 500');

    if (db[uid].coin < amt)
      return msg.reply('❌ Koin tidak cukup');

    if (!db[target.id])
      db[target.id] = { coin: 0, xp: 0, level: 1 };

    const tax = Math.floor(amt * TAX_RATE);
    const receive = amt - tax;

    db[uid].coin -= amt;
    db[target.id].coin += receive;
    saveDB();

    return msg.reply(`🔁 Transfer sukses\n📥 ${koin(receive)} diterima`);
  }

  if (cmd === 'profile') {
    const needed = xpNeed(db[uid].level);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: `${msg.author.username} Profile`,
        iconURL: msg.author.displayAvatarURL()
      })
      .addFields(
        { name: '⭐ Level', value: `${db[uid].level}`, inline: true },
        { name: '🪙 Koin', value: koin(db[uid].coin), inline: true },
        {
          name: '📊 XP',
          value: `${progressBar(db[uid].xp, needed)}\n${db[uid].xp}/${needed}`
        },
        { name: '🔥 Streak', value: `${db[uid].streak}` }
      );

    return msg.reply({ embeds: [embed] });
  }

  if (cmd === 'top') {
    const list = Object.entries(db).sort((a, b) => b[1].coin - a[1].coin);

    let text = '🏆 TOP KOIN\n\n';
    for (let i = 0; i < list.length; i++) {
      const u = await client.users.fetch(list[i][0]);
      text += `${i + 1}. ${u.username} — ${koin(list[i][1].coin)}\n`;
    }
    return msg.reply(text);
  }

  if (cmd === 'toplevel') {
    const list = Object.entries(db).sort((a, b) => b[1].level - a[1].level);

    let text = '🏆 TOP LEVEL\n\n';
    for (let i = 0; i < list.length; i++) {
      const u = await client.users.fetch(list[i][0]);
      text += `${i + 1}. ${u.username} — Lv ${list[i][1].level}\n`;
    }
    return msg.reply(text);
  }

  if (cmd === 'addkoin') {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply('❌ Admin only');

    const target = msg.mentions.users.first();
    const amt = parseInt(args[1]);
    if (!target || isNaN(amt))
      return msg.reply('>>addkoin @user 100');

    if (!db[target.id])
      db[target.id] = { coin: 0, xp: 0, level: 1, streak: 0 };

    db[target.id].coin += amt;
    saveDB();

    return msg.reply(`💰 ${koin(amt)} ditambahkan ke ${target.username}`);
  }

  if (cmd === 'addstreak') {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply('❌ Admin only');

    const target = msg.mentions.users.first();
    const amt = parseInt(args[1]);
    if (!target || isNaN(amt))
      return msg.reply('>>addstreak @user 5');

    db[target.id].streak += amt;
    saveDB();

    return msg.reply(`🔥 Streak ${target.username} +${amt}`);
  }

});

client.login(process.env.TOKEN);



