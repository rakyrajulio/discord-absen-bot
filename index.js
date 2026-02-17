const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const PREFIX = '.';
const WORK_COOLDOWN = 30 * 60 * 1000;
const XP_COOLDOWN = 60 * 1000;
const FISH_COOLDOWN = 60 * 1000;
const TAX_RATE = 0.05;
const TRANSFER_COOLDOWN = 10 * 1000; 

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

  
  { type: "chat", target: 10, reward: 80, text: "Kirim 10 pesan" },
  { type: "chat", target: 20, reward: 120, text: "Kirim 20 pesan" },

 
  { type: "work", target: 2, reward: 90, text: "Kerja 2 kali" },
  { type: "work", target: 5, reward: 150, text: "Kerja 5 kali" },

 
  { type: "xp", target: 150, reward: 100, text: "Dapatkan 150 XP" },
  { type: "xp", target: 300, reward: 180, text: "Dapatkan 300 XP" },

  
  { type: "fish", target: 5, reward: 100, text: "Tangkap 5 ikan" },
  { type: "rareFish", target: 1, reward: 200, text: "Dapatkan 1 Rare Fish" },


  { type: "streak", target: 3, reward: 120, text: "Login 3 hari berturut" },

  
  { type: "level", target: 1, reward: 150, text: "Naik 1 level" }

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
    bank: 0,

   
    xp: 0,
    level: 1,
    lastXp: 0,

   
    lastWork: 0,
    lastFish: 0,

    lastAbsen: null,
    streak: 0,
    dailyQuest: null,

   
    fish: 0,
    rareFish: 0,
    legendFish: 0,
    biggestFish: 0,

    
    totalWork: 0,
    totalChat: 0,
    totalTransfer: 0,
    totalEarned: 0,


    inventory: [],
    rod: "Basic Rod"
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

   if (db[uid].dailyQuest && !db[uid].dailyQuest.claimed) {

  if (db[uid].dailyQuest.type === "xp")
    db[uid].dailyQuest.progress += gain;

  if (db[uid].dailyQuest.type === "chat")
    db[uid].dailyQuest.progress++;

  if (db[uid].dailyQuest.progress > db[uid].dailyQuest.target)
    db[uid].dailyQuest.progress = db[uid].dailyQuest.target;
}

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

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({
      name: `${msg.guild.name} • Economy RPG`,
      iconURL: msg.guild.iconURL()
    })
    .setDescription("🎮 Gunakan command berikut untuk bermain:\nPrefix: `.`\n")
    .addFields(
      {
        name: "🗓 Daily",
        value: "` .absen ` — Klaim reward harian\n` .quest ` — Cek quest harian",
        inline: false
      },
      {
        name: "💰 Economy",
        value: "` .kerja ` — Cari koin\n` .transfer @user jumlah ` — Kirim koin",
        inline: false
      },
      {
        name: "🎣 Fishing",
        value: "` .fish ` — Mancing ikan\n` .topfish ` — Ranking pemancing",
        inline: false
      },
      {
        name: "👤 Profile & Rank",
        value: "` .profile ` — Lihat profile\n` .top ` — Ranking koin",
        inline: false
      }
    )
    .setFooter({
      text: "⭐ Level Up • 🎣 Rare Fish • 🐉 Legendary Hunt"
    });

  return msg.reply({ embeds: [embed] });
}

  if (cmd === 'absen') {

  if (db[uid].lastAbsen === today)
    return msg.reply('❌ Kamu sudah absen hari ini.');

  // 🔥 Streak reset kalau bolong
  if (db[uid].lastAbsen) {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    if (db[uid].lastAbsen !== yesterday) {
      db[uid].streak = 0;
    }
  }

  db[uid].streak++;

  const base = 20;
  const streakBonus = db[uid].streak * 5;
  const total = base + streakBonus;

  db[uid].coin += total;
  db[uid].totalEarned += total;
  db[uid].lastAbsen = today;

  if (db[uid].dailyQuest?.type === "streak")
    db[uid].dailyQuest.progress++;

  saveDB();

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle("🗓 DAILY ABSEN")
    .addFields(
      { name: "💰 Reward", value: koin(base), inline: true },
      { name: "🔥 Streak Bonus", value: koin(streakBonus), inline: true },
      { name: "💎 Total", value: koin(total), inline: true },
      { name: "🔥 Streak Sekarang", value: `${db[uid].streak} hari`, inline: false }
    )
    .setFooter({ text: "Login tiap hari untuk bonus lebih besar!" });

  return msg.reply({ embeds: [embed] });
}

  if (cmd === 'kerja') {

  if (now - db[uid].lastWork < WORK_COOLDOWN) {
    const sisa = WORK_COOLDOWN - (now - db[uid].lastWork);
    const m = Math.floor(sisa / 60000);
    const s = Math.floor((sisa % 60000) / 1000);
    return msg.reply(`⏳ Kamu lelah... tunggu ${m}m ${s}s lagi.`);
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
  const levelBonus = db[uid].level * 3;
  const streakBonus = db[uid].streak * 2;

  const total = base + levelBonus + streakBonus;

  const xpGain = Math.floor(total / 5);

  db[uid].coin += total;
  db[uid].xp += xpGain;
  db[uid].totalWork++;
  db[uid].totalEarned += total;
  db[uid].lastWork = now;

  if (db[uid].dailyQuest?.type === "work")
    db[uid].dailyQuest.progress++;

  while (db[uid].xp >= xpNeed(db[uid].level)) {
    db[uid].xp -= xpNeed(db[uid].level);
    db[uid].level++;
    const bonus = db[uid].level * 15;
    db[uid].coin += bonus;

    msg.channel.send(
      `🎉 ${msg.author.username} naik ke Level ${db[uid].level}!\n🪙 Bonus: ${koin(bonus)}`
    );
  }

  saveDB();

  const embed = new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle("🛠 HASIL KERJA")
    .addFields(
      { name: "💼 Pekerjaan", value: job.name, inline: false },
      { name: "💵 Gaji Dasar", value: koin(base), inline: true },
      { name: "⭐ Bonus Level", value: koin(levelBonus), inline: true },
      { name: "🔥 Bonus Streak", value: koin(streakBonus), inline: true },
      { name: "💎 Total", value: koin(total), inline: true },
      { name: "⭐ XP Dapat", value: `+${xpGain}`, inline: true }
    )
    .setFooter({ text: "Kerja keras meningkatkan level!" });

  return msg.reply({ embeds: [embed] });
}

  if (cmd === 'quest') {

  const q = db[uid].dailyQuest;

  if (!q)
    return msg.reply("❌ Quest belum tersedia.");

  const percent = Math.min(q.progress / q.target, 1);
  const barSize = 15;
  const filled = Math.round(barSize * percent);
  const empty = barSize - filled;
  const bar = '▰'.repeat(filled) + '▱'.repeat(empty);

  
  if (q.progress >= q.target && !q.claimed) {
    db[uid].coin += q.reward;
    q.claimed = true;
    saveDB();

    return msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle("🎉 QUEST SELESAI!")
          .setDescription(`Kamu berhasil menyelesaikan quest hari ini!`)
          .addFields(
            { name: "🎁 Reward", value: koin(q.reward), inline: true },
            { name: "📌 Quest", value: q.text, inline: false }
          )
          .setFooter({ text: "🔥 Kerja bagus! Besok ada quest baru!" })
      ]
    });
  }

  return msg.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("🎯 DAILY QUEST")
        .addFields(
          { name: "📌 Misi", value: q.text, inline: false },
          { name: "📊 Progress", value: `${bar}\n${q.progress}/${q.target}`, inline: false },
          { name: "🎁 Reward", value: koin(q.reward), inline: true },
          { name: "📅 Status", value: q.claimed ? "✅ Sudah diklaim" : "⏳ Belum selesai", inline: true }
        )
        .setFooter({ text: "Selesaikan sebelum reset harian!" })
    ]
  });
}

if (cmd === 'fish') {

  if (now - db[uid].lastFish < FISH_COOLDOWN) {
    const sisa = Math.ceil((FISH_COOLDOWN - (now - db[uid].lastFish)) / 1000);
    return msg.reply(`⏳ Kail masih basah... tunggu ${sisa} detik.`);
  }

  db[uid].lastFish = now;
  
  const fishes = [


  { name: "🐟 Ikan Lele", chance: 15, min: 20, max: 40, xp: 15, tier: "Common" },
  { name: "🐠 Ikan Nila", chance: 15, min: 25, max: 45, xp: 18, tier: "Common" },
  { name: "🐡 Ikan Buntal", chance: 12, min: 30, max: 50, xp: 20, tier: "Common" },
  { name: "🦐 Udang Sungai", chance: 10, min: 15, max: 35, xp: 12, tier: "Common" },
  { name: "🦀 Kepiting", chance: 8, min: 20, max: 40, xp: 18, tier: "Common" },

  { name: "🐬 Lumba-Lumba Kecil", chance: 6, min: 60, max: 100, xp: 40, tier: "Rare" },
  { name: "🦈 Hiu Karang", chance: 5, min: 70, max: 120, xp: 55, tier: "Rare" },
  { name: "🐙 Gurita Laut", chance: 6, min: 50, max: 90, xp: 35, tier: "Rare" },
  { name: "🐢 Penyu Laut", chance: 5, min: 60, max: 110, xp: 45, tier: "Rare" },

  { name: "💎 Golden Fish", chance: 3, min: 120, max: 180, xp: 80, tier: "Rare" },
  { name: "🔥 Lava Fish", chance: 2, min: 130, max: 190, xp: 90, tier: "Rare" },
  { name: "❄ Ice Fish", chance: 2, min: 120, max: 170, xp: 85, tier: "Rare" },
  { name: "⚡ Thunder Fish", chance: 1, min: 150, max: 220, xp: 100, tier: "Rare" },
    
  { name: "🌊 Kraken Muda", chance: 1.5, min: 200, max: 300, xp: 130, tier: "Legendary" },
  { name: "🌟 Celestial Carp", chance: 1, min: 220, max: 320, xp: 150, tier: "Legendary" },
  { name: "🌈 Rainbow Dragonfish", chance: 0.5, min: 250, max: 350, xp: 180, tier: "Legendary" },
  { name: "🐉 Ancient Dragon Fish", chance: 0.5, min: 300, max: 450, xp: 250, tier: "Legendary" },
  { name: "👑 King of The Ocean", chance: 0.5, min: 350, max: 500, xp: 300, tier: "Legendary" }

];

 let roll = Math.random() * 100;
  let cumulative = 0;
  let selected;

  for (let fish of fishes) {
    cumulative += fish.chance;
    if (roll <= cumulative) {
      selected = fish;
      break;
    }
  }

  if (!selected) selected = fishes[0];

  const size = Math.floor(Math.random() * (selected.max - selected.min + 1)) + selected.min;
  const reward = Math.floor(size / 2);
  const xpGain = selected.xp;

  db[uid].coin += reward;
  db[uid].xp += xpGain;
  db[uid].fish++;

  if (selected.tier === "Rare") db[uid].rareFish++;
if (selected.tier === "Legendary") db[uid].legendFish++;

  let newRecord = false;
  if (!db[uid].biggestFish || size > db[uid].biggestFish) {
    db[uid].biggestFish = size;
    newRecord = true;
  }

  while (db[uid].xp >= xpNeed(db[uid].level)) {
    db[uid].xp -= xpNeed(db[uid].level);
    db[uid].level++;
    const bonus = db[uid].level * 15;
    db[uid].coin += bonus;

    msg.channel.send(
      `🎉 ${msg.author.username} naik ke Level ${db[uid].level}!\n🪙 Bonus: ${koin(bonus)}`
    );
  }

  saveDB();

  let color = 0x2ecc71;
  if (selected.tier === "Rare") color = 0x3498db;
  if (selected.tier === "Legendary") color = 0xf1c40f;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("🎣 STRIKE!!!")
    .setDescription(`${selected.name}`)
    .addFields(
      { name: "📏 Ukuran", value: `${size} cm`, inline: true },
      { name: "🏷 Tier", value: selected.tier, inline: true },
      { name: "💰 Koin", value: koin(reward), inline: true },
      { name: "⭐ XP", value: `+${xpGain}`, inline: true },
      { name: "📦 Total Ikan", value: `${db[uid].fish}`, inline: true }
    )
    .setFooter({
      text: newRecord
        ? "🏆 REKOR BARU! Ikan terbesar kamu!"
        : "Lempar kail lagi untuk hasil lebih besar!"
    });

  return msg.reply({ embeds: [embed] });
}
  
  if (cmd === 'transfer') {

  const target = msg.mentions.users.first();
  const amt = parseInt(args[1]);

  if (!target || isNaN(amt))
    return msg.reply('Format: `.transfer @user 500`');

  if (amt <= 0)
    return msg.reply('❌ Jumlah harus lebih dari 0.');

  if (target.bot)
    return msg.reply('❌ Tidak bisa transfer ke bot.');

  if (target.id === uid)
    return msg.reply('❌ Tidak bisa transfer ke diri sendiri.');

  if (!db[uid].lastTransfer) db[uid].lastTransfer = 0;

  if (now - db[uid].lastTransfer < TRANSFER_COOLDOWN) {
    const sisa = Math.ceil((TRANSFER_COOLDOWN - (now - db[uid].lastTransfer)) / 1000);
    return msg.reply(`⏳ Tunggu ${sisa} detik sebelum transfer lagi.`);
  }

  if (db[uid].coin < amt)
    return msg.reply('❌ Koin kamu tidak cukup.');

  const taxRate = TAX_RATE || 0.05;
  const tax = Math.floor(amt * taxRate);
  const receive = amt - tax;

  db[uid].coin -= amt;
  db[target.id].coin += receive;
  db[uid].lastTransfer = now;

  saveDB();

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("💸 TRANSAKSI BERHASIL")
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: "👤 Dari", value: `${msg.author.username}`, inline: true },
      { name: "📥 Ke", value: `${target.username}`, inline: true },
      { name: "━━━━━━━━━━━━━━", value: " ", inline: false },
      { name: "💰 Jumlah", value: koin(amt), inline: true },
      { name: "💸 Pajak (5%)", value: koin(tax), inline: true },
      { name: "✅ Diterima", value: koin(receive), inline: true },
      { name: "━━━━━━━━━━━━━━", value: " ", inline: false },
      { name: "💎 Sisa Saldo", value: koin(db[uid].coin), inline: false }
    )
    .setFooter({ text: "Sistem Ekonomi RPG • Pajak menjaga stabilitas pasar" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

 if (cmd === 'topfish') {

  const page = parseInt(args[0]) || 1;
  const perPage = 10;

  const sorted = Object.entries(db)
    .filter(u => u[1].fishxp && u[1].fishxp > 0)
    .sort((a, b) => b[1].fishxp - a[1].fishxp);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));

  if (page < 1 || page > totalPages)
    return msg.reply(`❌ Halaman tidak valid. Total halaman: ${totalPages}`);

  const start = (page - 1) * perPage;
  const end = start + perPage;

  const current = sorted.slice(start, end);

  let desc = "";

  for (let i = 0; i < current.length; i++) {
    const rank = start + i + 1;
    let medal = "";

    if (rank === 1) medal = "🥇";
    else if (rank === 2) medal = "🥈";
    else if (rank === 3) medal = "🥉";

    let username = "Unknown User";

    try {
      const user = await client.users.fetch(current[i][0]);
      username = user.username;
    } catch (e) {}

    desc += `${medal} **${rank}. ${username}** — 🎣 ${current[i][1].fishxp} XP\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🎣 TOP FISHERMAN SERVER")
    .setDescription(desc || "Belum ada fisherman.")
    .setFooter({ text: `Halaman ${page} dari ${totalPages}` });

  return msg.reply({ embeds: [embed] });
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

  const page = parseInt(args[0]) || 1;
  const perPage = 10;

  const sorted = Object.entries(db)
    .sort((a, b) => b[1].coin - a[1].coin);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));

  if (page < 1 || page > totalPages)
    return msg.reply(`❌ Halaman tidak valid. Total halaman: ${totalPages}`);

  const start = (page - 1) * perPage;
  const end = start + perPage;

  const current = sorted.slice(start, end);

  let desc = "";

  for (let i = 0; i < current.length; i++) {
    const rank = start + i + 1;
    const user = await client.users.fetch(current[i][0]);
    desc += `**${rank}. ${user.username}** — ${koin(current[i][1].coin)}\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏆 TOP KOIN SERVER")
    .setDescription(desc || "Belum ada data.")
    .setFooter({ text: `Halaman ${page} dari ${totalPages}` });

  return msg.reply({ embeds: [embed] });
}

  if (cmd === 'addkoin') {

  if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return msg.reply('❌ Command ini khusus Admin.');

  const target = msg.mentions.users.first();
  const amt = parseInt(args[1]);

  if (!target)
    return msg.reply('❌ Tag user yang ingin ditambahkan koin.\nFormat: `.addkoin @user 100`');

  if (!amt || isNaN(amt))
    return msg.reply('❌ Masukkan jumlah koin yang valid.\nFormat: `.addkoin @user 100`');

  if (amt <= 0)
    return msg.reply('❌ Jumlah harus lebih dari 0.');

  if (target.bot)
    return msg.reply('❌ Tidak bisa menambahkan koin ke bot.');
  }

  db[target.id].coin += amt;
  saveDB();

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle("🛠 ADMIN ACTION • ADD KOIN")
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "👤 Target", value: `<@${target.id}>`, inline: true },
      { name: "💰 Ditambahkan", value: koin(amt), inline: true },
      { name: "📊 Saldo Sekarang", value: koin(db[target.id].coin), inline: true },
      { name: "🛡 Admin", value: `<@${msg.author.id}>`, inline: false }
    )
    .setFooter({ text: "Sistem Ekonomi RPG • Admin Control" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}


  if (cmd === 'addstreak') {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply('❌ Admin only');
    if (!db[target.id]) return msg.reply("User belum punya data.");


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










