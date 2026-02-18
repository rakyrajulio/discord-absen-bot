const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const PREFIX = '.';
const WORK_COOLDOWN = 2 * 60 * 1000;
const XP_COOLDOWN = 60 * 1000;
const FISH_COOLDOWN = 30 * 1000;
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

const shopItems = [
  
  { name: "Basic Rod", type: "rod", price: 0, bonus: 0 },
  { name: "Novice Rod", type: "rod", price: 200, bonus: 5 },
  { name: "Advanced Rod", type: "rod", price: 500, bonus: 10 },
  { name: "Pro Rod", type: "rod", price: 1500, bonus: 25 },
  { name: "Elite Rod", type: "rod", price: 3500, bonus: 50 },
  { name: "Master Rod", type: "rod", price: 7000, bonus: 100 },
  { name: "Legend Rod", type: "rod", price: 15000, bonus: 200 },
  { name: "Mythic Rod", type: "rod", price: 30000, bonus: 400 },
  { name: "Ancient Rod", type: "rod", price: 60000, bonus: 800 },
  { name: "Divine Rod", type: "rod", price: 120000, bonus: 1600 },
  { name: "Celestial Rod", type: "rod", price: 250000, bonus: 3200 },
  { name: "Titan Rod", type: "rod", price: 500000, bonus: 6400 },
  { name: "Omega Rod", type: "rod", price: 1000000, bonus: 12800 },
  { name: "Eternal Rod", type: "rod", price: 2000000, bonus: 25600 },
  { name: "Godly Rod", type: "rod", price: 5000000, bonus: 51200 },
  { name: "Supreme Rod", type: "rod", price: 10000000, bonus: 102400 },
  { name: "Infinity Rod", type: "rod", price: 25000000, bonus: 204800 },
  { name: "Omega+ Rod", type: "rod", price: 50000000, bonus: 409600 },
  { name: "Legendary Omega Rod", type: "rod", price: 100000000, bonus: 819200 },
  { name: "Ultimate Rod", type: "rod", price: 250000000, bonus: 1638400 },

  { name: "Normal Bait", type: "bait", price: 50, chanceBonus: 0 },
  { name: "Premium Bait", type: "bait", price: 200, chanceBonus: 5 },
  { name: "Epic Bait", type: "bait", price: 500, chanceBonus: 15 },
  { name: "Legendary Bait", type: "bait", price: 1200, chanceBonus: 35 },
  { name: "Mythic Bait", type: "bait", price: 3000, chanceBonus: 70 },
  { name: "Ancient Bait", type: "bait", price: 7000, chanceBonus: 150 },
  { name: "Divine Bait", type: "bait", price: 15000, chanceBonus: 300 },
  { name: "Celestial Bait", type: "bait", price: 35000, chanceBonus: 700 },
  { name: "Titan Bait", type: "bait", price: 80000, chanceBonus: 1500 },
  { name: "Omega Bait", type: "bait", price: 200000, chanceBonus: 3500 },
  { name: "Eternal Bait", type: "bait", price: 500000, chanceBonus: 7000 },
  { name: "Godly Bait", type: "bait", price: 1000000, chanceBonus: 14000 },
  { name: "Supreme Bait", type: "bait", price: 2500000, chanceBonus: 28000 },
  { name: "Infinity Bait", type: "bait", price: 5000000, chanceBonus: 56000 },
  { name: "Omega+ Bait", type: "bait", price: 10000000, chanceBonus: 112000 },
  { name: "Legendary Omega Bait", type: "bait", price: 25000000, chanceBonus: 224000 },
  { name: "Ultimate Bait", type: "bait", price: 50000000, chanceBonus: 448000 },
  { name: "Mythic+ Bait", type: "bait", price: 100000000, chanceBonus: 896000 },
  { name: "Godly+ Bait", type: "bait", price: 250000000, chanceBonus: 1792000 },
  { name: "Supreme+ Bait", type: "bait", price: 500000000, chanceBonus: 3584000 },
];

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
  { type: "level", target: 1, reward: 150, text: "Naik 1 level" },

  { type: "epicFish", target: 1, reward: 300, text: "Dapatkan 1 Epic Fish" },
  { type: "mythicFish", target: 1, reward: 500, text: "Dapatkan 1 Mythic Fish" },
  { type: "legendFish", target: 1, reward: 800, text: "Dapatkan 1 Legend Fish" }
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

  function ensureUser(id) {
  if (!db[id]) {
    db[id] = {
      coin: 0,
      bank: 0,
      xp: 0,
      level: 1,
      lastXp: 0,
      lastWork: 0,
      lastFish: 0,
      lastTransfer: 0,
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
      rod: "Basic Rod",   
      bait: "Normal Bait" 
    };
    saveDB();
  }
}

  ensureUser(uid);

  const today = todayStr();

  if (!db[uid].dailyQuest || db[uid].dailyQuest.date !== today) {
    const q = generateQuest();
    db[uid].dailyQuest = {
      ...q,
      progress: 0,
      claimed: false,
      date: today
    };
    saveDB();
  }
  
ensureUser(uid);

if (!db[uid].lastXp)
  db[uid].lastXp = 0;

if (now - db[uid].lastXp > XP_COOLDOWN) {

  const gain = Math.floor(Math.random() * 10) + 5;

  db[uid].xp += gain;
  db[uid].lastXp = now;

  
  const q = db[uid].dailyQuest;

  if (q && !q.claimed) {

    if (q.type === "xp")
      q.progress = (q.progress || 0) + gain;

    if (q.type === "chat")
      q.progress = (q.progress || 0) + 1;

    if (q.progress > q.target)
      q.progress = q.target;
  }

  
  let leveledUp = false;

  while (true) {
    const need = xpNeed(db[uid].level);
    if (db[uid].xp < need) break;

    db[uid].xp -= need;
    db[uid].level++;
    leveledUp = true;

    const bonus = db[uid].level * 15;
    db[uid].coin += bonus;

    const chId = process.env.LEVEL_CHANNEL_ID;
    const ch = msg.guild?.channels?.cache?.get(chId);

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
    .setColor(0x00bfff)
    .setAuthor({
      name: `${msg.guild.name} • Economy BCM`,
      iconURL: msg.guild.iconURL({ dynamic: true })
    })
    .setTitle("🎮 Daftar Command • Prefix: `.`")
    .setDescription("Gunakan prefix `.` sebelum command.\nBerikut beberapa command yang tersedia:")
    .addFields(
      {
        name: "🗓 Daily & Quest",
        value: "• `absen` — Klaim reward harian\n• `quest` — Cek quest harian",
        inline: false
      },
      {
        name: "💰 Economy",
        value: "• `kerja` — Cari koin\n• `transfer @user <jumlah>` — Kirim koin ke user lain",
        inline: false
      },
      {
        name: "🎣 Fishing",
        value: "• `fish` — Mancing ikan\n• `topfish` — Ranking pemancing\n• `shop` — Beli Rod & Bait\n• `buy <item>` — Membeli item\n• `inv` — Lihat inventory\n• `sellall [tier]` — Menjual semua ikan yang bisa dijual (opsional pilih tier: common/rare/epic/legendary/mythic/all)",
        inline: false
      },
      {
        name: "👤 Profile & Rank",
        value: "• `profile` — Lihat profile lengkap\n• `top` — Ranking koin server",
        inline: false
      },
      {
        name: "⚙ Admin",
        value: "• `addkoin @user <jumlah>` — Tambah koin user\n• `addstreak @user <jumlah>` — Tambah streak user",
        inline: false
      }
    )
    .setFooter({ text: "⭐ Level Up • 🎣 Rare Fish • 🐉 Legendary Hunt • Gunakan `.sellall` untuk jual ikan!" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}
  
  if (cmd === 'absen') {

  if (db[uid].lastAbsen === today)
    return msg.reply('❌ Kamu sudah absen hari ini.');

  
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

  ensureUser(uid);

  const q = db[uid].dailyQuest;

  if (!q)
    return msg.reply("❌ Quest belum tersedia.");


  q.progress = q.progress || 0;
  q.target = q.target || 1;

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
          .setDescription("Kamu berhasil menyelesaikan quest hari ini!")
          .addFields(
            { name: "📌 Quest", value: q.text, inline: false },
            { name: "🎁 Reward", value: koin(q.reward), inline: true },
            { name: "💎 Saldo Sekarang", value: koin(db[uid].coin), inline: true }
          )
          .setFooter({ text: "🔥 Kerja bagus! Besok ada quest baru!" })
          .setTimestamp()
      ]
    });
  }

  let statusText = "⏳ Belum selesai";
  if (q.claimed) statusText = "✅ Sudah diklaim";
  else if (q.progress >= q.target) statusText = "🎁 Siap diklaim";

  return msg.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("🎯 DAILY QUEST")
        .addFields(
          { name: "📌 Misi", value: q.text, inline: false },
          { name: "📊 Progress", value: `${bar}\n${q.progress}/${q.target}`, inline: false },
          { name: "🎁 Reward", value: koin(q.reward), inline: true },
          { name: "📅 Status", value: statusText, inline: true }
        )
        .setFooter({ text: "Selesaikan sebelum reset harian!" })
        .setTimestamp()
    ]
  });
}

if (cmd === 'fish') {
  if (!msg.guild) return msg.reply('❌ Command ini hanya bisa digunakan di server.');

  ensureUser(uid);

  if (!db[uid].lastFish) db[uid].lastFish = 0;

  if (now - db[uid].lastFish < FISH_COOLDOWN) {
    const sisa = Math.ceil((FISH_COOLDOWN - (now - db[uid].lastFish)) / 1000);
    return msg.reply(`⏳ Kail masih basah... tunggu ${sisa} detik.`);
  }

  db[uid].lastFish = now;

 
  const fishes = [
  
  { name: "🐟 Ikan Lele", chance: 15, min: 20, max: 40, xp: 15, tier: "Common" },
  { name: "🐠 Ikan Nila", chance: 14, min: 25, max: 45, xp: 18, tier: "Common" },
  { name: "🐡 Ikan Buntal", chance: 13, min: 30, max: 50, xp: 20, tier: "Common" },
  { name: "🦐 Udang Sungai", chance: 12, min: 15, max: 35, xp: 12, tier: "Common" },
  { name: "🦀 Kepiting", chance: 10, min: 20, max: 40, xp: 18, tier: "Common" },
  { name: "🐚 Kerang Laut", chance: 8, min: 15, max: 30, xp: 10, tier: "Common" },
  { name: "🦑 Cumi-Cumi", chance: 7, min: 25, max: 45, xp: 18, tier: "Common" },
  { name: "🐟 Ikan Mas", chance: 12, min: 20, max: 40, xp: 16, tier: "Common" },
  { name: "🐡 Ikan Kakap", chance: 11, min: 25, max: 50, xp: 20, tier: "Common" },
  { name: "🦐 Udang Galah", chance: 10, min: 18, max: 38, xp: 14, tier: "Common" },
  { name: "🦀 Kepiting Hias", chance: 9, min: 20, max: 35, xp: 17, tier: "Common" },
  { name: "🐟 Ikan Gabus", chance: 12, min: 22, max: 42, xp: 18, tier: "Common" },
  { name: "🐠 Ikan Gurami", chance: 10, min: 25, max: 45, xp: 19, tier: "Common" },
  { name: "🐡 Ikan Patin", chance: 9, min: 30, max: 50, xp: 22, tier: "Common" },
  { name: "🐟 Ikan Mujair", chance: 11, min: 25, max: 40, xp: 18, tier: "Common" },
  { name: "🦐 Udang Pasir", chance: 8, min: 20, max: 38, xp: 16, tier: "Common" },
  { name: "🦀 Kepiting Batu", chance: 7, min: 22, max: 40, xp: 18, tier: "Common" },
  { name: "🐟 Ikan Tongkol", chance: 6, min: 25, max: 42, xp: 18, tier: "Common" },
  { name: "🐡 Ikan Layur", chance: 7, min: 20, max: 40, xp: 17, tier: "Common" },
  { name: "🐠 Ikan Kembung", chance: 7, min: 18, max: 38, xp: 16, tier: "Common" },
  { name: "🦐 Udang Vannamei", chance: 6, min: 22, max: 36, xp: 15, tier: "Common" },
  { name: "🦀 Kepiting Laut", chance: 5, min: 20, max: 35, xp: 17, tier: "Common" },
  { name: "🐟 Ikan Teri", chance: 6, min: 15, max: 30, xp: 12, tier: "Common" },
  { name: "🐡 Ikan Selar", chance: 6, min: 20, max: 35, xp: 15, tier: "Common" },
  { name: "🐠 Ikan Baramundi", chance: 5, min: 22, max: 38, xp: 16, tier: "Common" },
  { name: "🦑 Cumi Raksasa", chance: 4, min: 25, max: 45, xp: 18, tier: "Common" },
  { name: "🐟 Ikan Hias Kecil", chance: 6, min: 18, max: 35, xp: 15, tier: "Common" },
  { name: "🐡 Ikan Koi", chance: 5, min: 20, max: 40, xp: 18, tier: "Common" },
  { name: "🐠 Ikan Kakap Putih", chance: 4, min: 22, max: 42, xp: 19, tier: "Common" },
  { name: "🦐 Udang Karang", chance: 3, min: 20, max: 38, xp: 16, tier: "Common" },

  { name: "🐬 Lumba-Lumba Kecil", chance: 6, min: 60, max: 100, xp: 40, tier: "Rare" },
  { name: "🦈 Hiu Karang", chance: 5, min: 70, max: 120, xp: 55, tier: "Rare" },
  { name: "🐙 Gurita Laut", chance: 6, min: 50, max: 90, xp: 35, tier: "Rare" },
  { name: "🐢 Penyu Laut", chance: 5, min: 60, max: 110, xp: 45, tier: "Rare" },
  { name: "💎 Golden Fish", chance: 3, min: 120, max: 180, xp: 80, tier: "Rare" },
  { name: "🔥 Lava Fish", chance: 2, min: 130, max: 190, xp: 90, tier: "Rare" },
  { name: "❄ Ice Fish", chance: 2, min: 120, max: 170, xp: 85, tier: "Rare" },
  { name: "⚡ Thunder Fish", chance: 1, min: 150, max: 220, xp: 100, tier: "Rare" },
  { name: "🌊 Manta Ray", chance: 3, min: 100, max: 160, xp: 60, tier: "Rare" },
  { name: "🦑 Giant Squid", chance: 2, min: 140, max: 200, xp: 95, tier: "Rare" },
  { name: "🐠 Napoleon Fish", chance: 2, min: 130, max: 190, xp: 90, tier: "Rare" },
  { name: "🦐 Lobster Laut", chance: 2, min: 120, max: 180, xp: 80, tier: "Rare" },
  { name: "🐡 Pufferfish Raksasa", chance: 1.5, min: 140, max: 200, xp: 95, tier: "Rare" },
  { name: "🐟 Ikan Tongkol Raksasa", chance: 1.5, min: 150, max: 210, xp: 100, tier: "Rare" },
  { name: "🦈 Hiu Putih Kecil", chance: 1.5, min: 160, max: 220, xp: 105, tier: "Rare" },

  { name: "🌪 Tempest Tuna", chance: 1.5, min: 200, max: 280, xp: 120, tier: "Epic" },
  { name: "🔥 Phoenix Fish", chance: 1.2, min: 210, max: 300, xp: 130, tier: "Epic" },
  { name: "❄ Frostfin Leviathan", chance: 1, min: 220, max: 320, xp: 140, tier: "Epic" },
  { name: "⚡ Stormray", chance: 0.8, min: 230, max: 350, xp: 150, tier: "Epic" },
  { name: "💎 Diamondback Angler", chance: 1, min: 240, max: 360, xp: 155, tier: "Epic" },
  { name: "🌊 Abyssal Serpent", chance: 0.9, min: 250, max: 370, xp: 160, tier: "Epic" },
  { name: "🦈 Shadow Shark", chance: 1, min: 240, max: 350, xp: 150, tier: "Epic" },
  { name: "🐉 Infernal Dragonfish", chance: 0.8, min: 260, max: 380, xp: 165, tier: "Epic" },
  { name: "🌟 Celestial Stingray", chance: 0.9, min: 270, max: 390, xp: 170, tier: "Epic" },
  { name: "💨 Gale Barracuda", chance: 1, min: 250, max: 360, xp: 160, tier: "Epic" },
  { name: "🐬 Lightning Dolphin", chance: 0.7, min: 260, max: 380, xp: 165, tier: "Epic" },
  { name: "🐠 Tempest Koi", chance: 0.6, min: 250, max: 370, xp: 160, tier: "Epic" },
  { name: "🦑 Phantom Squid", chance: 0.5, min: 270, max: 390, xp: 175, tier: "Epic" },
  { name: "🐡 Magma Blowfish", chance: 0.5, min: 280, max: 400, xp: 180, tier: "Epic" },
  { name: "🐢 Glacier Turtle", chance: 0.4, min: 290, max: 420, xp: 185, tier: "Epic" },

  { name: "🌊 Kraken Muda", chance: 1.5, min: 200, max: 300, xp: 130, tier: "Legendary" },
  { name: "🌟 Celestial Carp", chance: 1, min: 220, max: 320, xp: 150, tier: "Legendary" },
  { name: "🌈 Rainbow Dragonfish", chance: 0.5, min: 250, max: 350, xp: 180, tier: "Legendary" },
  { name: "🐉 Ancient Dragon Fish", chance: 0.5, min: 300, max: 450, xp: 250, tier: "Legendary" },
  { name: "👑 King of The Ocean", chance: 0.5, min: 350, max: 500, xp: 300, tier: "Legendary" },
  { name: "🌌 Cosmic Leviathan", chance: 0.3, min: 400, max: 550, xp: 350, tier: "Legendary" },
  { name: "🌠 Starfin Dragon", chance: 0.4, min: 370, max: 520, xp: 320, tier: "Legendary" },
  { name: "🪐 Neptune’s Wrath", chance: 0.2, min: 450, max: 600, xp: 400, tier: "Legendary" },
  { name: "🌌 Void Serpent", chance: 0.1, min: 500, max: 650, xp: 450, tier: "Legendary" },
  { name: "🔥 Inferno Leviathan", chance: 0.15, min: 480, max: 650, xp: 420, tier: "Legendary" },
  { name: "💫 Eternal Leviathan", chance: 0.1, min: 520, max: 700, xp: 480, tier: "Legendary" },
  { name: "🌠 Galactic Dragon", chance: 0.05, min: 550, max: 750, xp: 500, tier: "Legendary" },
  { name: "🪐 Titan Kraken", chance: 0.05, min: 600, max: 800, xp: 550, tier: "Legendary" },
  { name: "🌌 Omega Leviathan", chance: 0.04, min: 620, max: 820, xp: 560, tier: "Legendary" },
  { name: "🌟 Starfire Serpent", chance: 0.03, min: 640, max: 840, xp: 570, tier: "Legendary" },
  { name: "🪐 Infinity Dragon", chance: 0.03, min: 660, max: 860, xp: 580, tier: "Legendary" },
  { name: "🔥 Pyro Leviathan", chance: 0.02, min: 680, max: 880, xp: 590, tier: "Legendary" },
  { name: "❄ Glacial Dragon", chance: 0.02, min: 700, max: 900, xp: 600, tier: "Legendary" },
  { name: "⚡ Tempest Titan", chance: 0.015, min: 720, max: 920, xp: 610, tier: "Legendary" },
  { name: "💎 Prism Kraken", chance: 0.015, min: 740, max: 940, xp: 620, tier: "Legendary" },

  { name: "🌌 Void Leviathan", chance: 0.2, min: 500, max: 700, xp: 500, tier: "Mythic" },
  { name: "🌠 Astral Dragon", chance: 0.15, min: 520, max: 720, xp: 520, tier: "Mythic" },
  { name: "🪐 Titan Kraken", chance: 0.12, min: 550, max: 750, xp: 550, tier: "Mythic" },
  { name: "💫 Eternal Leviathan", chance: 0.1, min: 560, max: 780, xp: 580, tier: "Mythic" },
  { name: "🌌 Cosmic Serpent", chance: 0.08, min: 600, max: 800, xp: 600, tier: "Mythic" },
  { name: "🌟 Starforge Dragon", chance: 0.07, min: 620, max: 820, xp: 620, tier: "Mythic" },
  { name: "🔥 Inferno Titan", chance: 0.06, min: 640, max: 850, xp: 640, tier: "Mythic" },
  { name: "❄ Frostfire Leviathan", chance: 0.05, min: 660, max: 870, xp: 660, tier: "Mythic" },
  { name: "⚡ Thunderwyrm", chance: 0.05, min: 680, max: 890, xp: 680, tier: "Mythic" },
  { name: "💎 Diamond Kraken", chance: 0.04, min: 700, max: 900, xp: 700, tier: "Mythic" },
  { name: "🌌 Void Titan", chance: 0.04, min: 720, max: 920, xp: 720, tier: "Mythic" },
  { name: "🌠 Celestial Serpent", chance: 0.03, min: 740, max: 940, xp: 740, tier: "Mythic" },
  { name: "🪐 Galactic Leviathan", chance: 0.03, min: 760, max: 960, xp: 760, tier: "Mythic" },
  { name: "🔥 Solar Dragon", chance: 0.02, min: 780, max: 980, xp: 780, tier: "Mythic" },
  { name: "❄ Icebound Titan", chance: 0.02, min: 800, max: 1000, xp: 800, tier: "Mythic" },
  { name: "⚡ Storm Dragon", chance: 0.015, min: 820, max: 1020, xp: 820, tier: "Mythic" },
  { name: "💫 Astral Leviathan", chance: 0.015, min: 840, max: 1040, xp: 840, tier: "Mythic" },
  { name: "🌌 Phantom Kraken", chance: 0.01, min: 860, max: 1060, xp: 860, tier: "Mythic" },
  { name: "🌟 Starfire Serpent", chance: 0.01, min: 880, max: 1080, xp: 880, tier: "Mythic" },
  { name: "🪐 Infinity Dragon", chance: 0.01, min: 900, max: 1100, xp: 900, tier: "Mythic" },
  { name: "🔥 Pyro Leviathan", chance: 0.008, min: 920, max: 1120, xp: 920, tier: "Mythic" },
  { name: "❄ Glacial Dragon", chance: 0.008, min: 940, max: 1140, xp: 940, tier: "Mythic" },
  { name: "⚡ Tempest Titan", chance: 0.005, min: 960, max: 1160, xp: 960, tier: "Mythic" },
  { name: "💎 Prism Kraken", chance: 0.005, min: 980, max: 1180, xp: 980, tier: "Mythic" },
  { name: "🌌 Eternal Dragon", chance: 0.004, min: 1000, max: 1200, xp: 1000, tier: "Mythic" },
  { name: "🌠 Cosmic Phoenix", chance: 0.004, min: 1020, max: 1220, xp: 1020, tier: "Mythic" },
];

  const whitelistTiers = ["Common", "Rare"];
  const whitelistFishes = fishes.filter(f => whitelistTiers.includes(f.tier));

 
  const totalChance = whitelistFishes.reduce((sum, f) => sum + f.chance, 0);
  let roll = Math.random() * totalChance;
  let cumulative = 0;
  let selected = whitelistFishes[0];

  for (let fish of whitelistFishes) {
    cumulative += fish.chance;
    if (roll <= cumulative) {
      selected = fish;
      break;
    }
  }

  const size = Math.floor(Math.random() * (selected.max - selected.min + 1)) + selected.min;
  const reward = Math.floor(size / 2);
  const xpGain = selected.xp;

  if (!db[uid].inventory) db[uid].inventory = [];
  db[uid].inventory.push({
    name: selected.name,
    tier: selected.tier,
    size: size,
    min: selected.min,
    max: selected.max,
    xp: xpGain
  });


  db[uid].coin = (db[uid].coin || 0) + reward;
  db[uid].xp = (db[uid].xp || 0) + xpGain;
  db[uid].fish = (db[uid].fish || 0) + 1;

  if (selected.tier === "Rare") db[uid].rareFish = (db[uid].rareFish || 0) + 1;
  if (selected.tier === "Legendary") db[uid].legendFish = (db[uid].legendFish || 0) + 1;

  if (db[uid].dailyQuest) {
    const q = db[uid].dailyQuest;
    if (q.type === "fish") q.progress++;
    if (q.type === "rareFish" && selected.tier === "Rare") q.progress++;
    if (q.progress > q.target) q.progress = q.target;
  }

  let newRecord = false;
  if (!db[uid].biggestFish || size > db[uid].biggestFish) {
    db[uid].biggestFish = size;
    newRecord = true;
  }

  while (db[uid].xp >= xpNeed(db[uid].level)) {
    const need = xpNeed(db[uid].level);
    db[uid].xp -= need;
    db[uid].level++;
    const bonus = db[uid].level * 15;
    db[uid].coin += bonus;
    msg.channel.send(`🎉 ${msg.author.username} naik ke Level ${db[uid].level}!\n🪙 Bonus: ${koin(bonus)}`);
  }

  saveDB();

  let color = 0x2ecc71; 
  if (selected.tier === "Rare") color = 0x3498db;
  if (selected.tier === "Legendary") color = 0xf1c40f;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("🎣 STRIKE!!!")
    .setDescription(`Kamu menangkap **${selected.name}**!`)
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
    })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

if (cmd === 'sellall') {
  ensureUser(uid);

  const userFish = db[uid].inventory || [];
  const MIN_FISH = 1;

  if (userFish.length < MIN_FISH) 
    return msg.reply(`❌ Kamu harus punya minimal ${MIN_FISH} ikan untuk menggunakan \`.sellall\``);

  const tierArg = args[0]?.toLowerCase();

  
  let tiersToSell = ["Common","Rare","Epic","Legendary","Mythic"];

  if (tierArg) {
    if (tierArg === "all") tiersToSell = ["Common","Rare","Epic","Legendary","Mythic"];
    else if (["common","rare","epic","legendary","mythic"].includes(tierArg)) 
      tiersToSell = [tierArg[0].toUpperCase() + tierArg.slice(1)];
    else return msg.reply("❌ Tier tidak valid! Pilih: common, rare, epic, legendary, mythic, all");
  }

  let totalCoin = 0;
  const soldFishList = [];
  const remainingFish = [];

  for (const fish of userFish) {
    if (tiersToSell.includes(fish.tier)) {
      
      const price = Math.floor(fish.size / 2);
      totalCoin += price;
      soldFishList.push(`- ${fish.name} (${fish.tier}) → ${koin(price)}`);
    } else {
      remainingFish.push(fish);
    }
  }

  if (!soldFishList.length) return msg.reply("❌ Tidak ada ikan yang bisa dijual!");

  db[uid].inventory = remainingFish;
  db[uid].coins = (db[uid].coins || 0) + totalCoin;
  saveDB();

  const fishSoldText = soldFishList.join("\n");
  return msg.reply(`✅ Semua ikan berhasil dijual!\n\n${fishSoldText}\n\n🏆 Total coin: ${koin(totalCoin)}`);
}

  if (cmd === 'transfer') {

  if (!msg.guild)
    return msg.reply('❌ Command ini hanya bisa digunakan di server.');

  const target = msg.mentions.users.first();
  const amt = Number(args[1]);

  if (!target || !Number.isInteger(amt))
    return msg.reply('Format: `.transfer @user 500`');

  if (amt <= 0)
    return msg.reply('❌ Jumlah harus lebih dari 0.');

  if (target.bot)
    return msg.reply('❌ Tidak bisa transfer ke bot.');

  if (target.id === uid)
    return msg.reply('❌ Tidak bisa transfer ke diri sendiri.');

  
  ensureUser(uid);
  ensureUser(target.id);

  if (!db[uid].lastTransfer)
    db[uid].lastTransfer = 0;

  if (now - db[uid].lastTransfer < TRANSFER_COOLDOWN) {
    const sisa = Math.ceil((TRANSFER_COOLDOWN - (now - db[uid].lastTransfer)) / 1000);
    return msg.reply(`⏳ Tunggu ${sisa} detik sebelum transfer lagi.`);
  }

  if (db[uid].coin < amt)
    return msg.reply('❌ Koin kamu tidak cukup.');

  const taxRate = typeof TAX_RATE === "number" ? TAX_RATE : 0.05;
  const tax = Math.floor(amt * taxRate);
  const receive = amt - tax;

  db[uid].coin -= amt;
  db[target.id].coin += receive;
  db[uid].lastTransfer = now;

  saveDB();

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("💸 TRANSAKSI BERHASIL")
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "👤 Dari", value: `<@${uid}>`, inline: true },
      { name: "📥 Ke", value: `<@${target.id}>`, inline: true },
      { name: "💰 Jumlah", value: koin(amt), inline: true },
      { name: "💸 Pajak", value: koin(tax), inline: true },
      { name: "✅ Diterima", value: koin(receive), inline: true },
      { name: "💎 Sisa Saldo", value: koin(db[uid].coin), inline: false }
    )
    .setFooter({ text: `Pajak ${(taxRate * 100).toFixed(0)}% • Sistem Ekonomi RPG` })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}


 if (cmd === 'topfish') {
  const page = parseInt(args[0]) || 1;
  const perPage = 10;

 
  const sorted = Object.entries(db)
    .filter(u => u[1].fish && u[1].fish > 0)
    .sort((a, b) => b[1].fish - a[1].fish);

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

    const fishCount = current[i][1].fish || 0;
    const rareCount = current[i][1].rareFish || 0;
    const epicCount = current[i][1].epicFish || 0;      
    const legendCount = current[i][1].legendFish || 0;
    const mythicCount = current[i][1].mythicFish || 0;  

    let fishInfo = `🎣 ${fishCount} ikan`;
    if (rareCount > 0) fishInfo += ` | 💎 ${rareCount} Rare`;
    if (epicCount > 0) fishInfo += ` | 🔥 ${epicCount} Epic`;
    if (legendCount > 0) fishInfo += ` | 👑 ${legendCount} Legendary`;
    if (mythicCount > 0) fishInfo += ` | 🌌 ${mythicCount} Mythic`;

    desc += `${medal} **${rank}. ${username}** — ${fishInfo}\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x1abc9c)
    .setTitle("🎣 TOP FISHERMAN SERVER")
    .setDescription(desc || "Belum ada fisherman.")
    .setFooter({ text: `Halaman ${page} dari ${totalPages}` })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}


  if (cmd === 'profile') {
  ensureUser(uid);

  const needed = xpNeed(db[uid].level);

  const rod = db[uid].rod || "Basic Rod";
  const bait = db[uid].bait || "Normal Bait";

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({
      name: `${msg.author.username} • Profile`,
      iconURL: msg.author.displayAvatarURL()
    })
    .setThumbnail(msg.author.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '⭐ Level', value: `${db[uid].level}`, inline: true },
      { name: '🪙 Koin', value: koin(db[uid].coin), inline: true },
      { 
        name: '📊 XP', 
        value: `${progressBar(db[uid].xp, needed)}\n${db[uid].xp}/${needed}`, 
        inline: false 
      },
      { name: '🔥 Streak', value: `${db[uid].streak || 0} hari`, inline: true },
      { name: '🎣 Rod', value: rod, inline: true },
      { name: '🪱 Bait', value: bait, inline: true },
      { name: '🐟 Total Fish', value: `${db[uid].fish || 0}`, inline: true },
      { name: '💎 Rare Fish', value: `${db[uid].rareFish || 0}`, inline: true },
      { name: '🔥 Epic Fish', value: `${db[uid].epicFish || 0}`, inline: true },
      { name: '👑 Legendary Fish', value: `${db[uid].legendFish || 0}`, inline: true },
      { name: '🌌 Mythic Fish', value: `${db[uid].mythicFish || 0}`, inline: true }
    )
    .setFooter({ text: "🌊 Selamat memancing!" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}



 if (cmd === 'top') {
  const page = parseInt(args[0]) || 1;
  const perPage = 10;

  const sorted = Object.entries(db).sort((a, b) => b[1].coin - a[1].coin);

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

    const coin = current[i][1].coin || 0;

    desc += `${medal} **${rank}. ${username}** — 💰 ${koin(coin)}\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏆 TOP KOIN SERVER")
    .setDescription(desc || "Belum ada data.")
    .setFooter({ text: `Halaman ${page} dari ${totalPages}` })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

if (cmd === 'shop') {
  let desc = shopItems.map((i, idx) => {
    if (i.type === "rod") return `🎣 **${i.name}** — ${koin(i.price)} | Bonus Rod: +${i.bonus}`;
    if (i.type === "bait") return `🪱 **${i.name}** — ${koin(i.price)} | Chance Bonus: +${i.chanceBonus}%`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("🛒 FISH SHOP")
    .setDescription(desc)
    .setFooter({ text: "Gunakan `.buy <nama item>` untuk membeli" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

if (cmd === 'buy') {
  const itemName = args.join(' ');
  const item = shopItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());

  if (!item) return msg.reply('❌ Item tidak ditemukan di shop.');
  ensureUser(uid);

  if (db[uid].coin < item.price)
    return msg.reply(`❌ Koin kamu tidak cukup! Dibutuhkan: ${koin(item.price)}, Saldo: ${koin(db[uid].coin)}`);

  db[uid].coin -= item.price;

  if (item.type === "rod") {
    db[uid].rod = item.name;
  } else if (item.type === "bait") {
    db[uid].bait = item.name;
  }

  saveDB();

  return msg.reply(`✅ Berhasil membeli **${item.name}**!\n💰 Sisa koin: ${koin(db[uid].coin)}`);
}

if (cmd === 'inv') {
  ensureUser(uid);

  const rod = db[uid].rod || "Basic Rod";
  const bait = db[uid].bait || "Normal Bait";
  const coins = db[uid].coins || 0;
  const userFish = db[uid].inventory || [];

  // hitung jumlah ikan per tier
  const counts = { Common: 0, Rare: 0, Epic: 0, Legendary: 0, Mythic: 0 };
  for (const fish of userFish) {
    if (fish.tier && counts[fish.tier] !== undefined) {
      counts[fish.tier]++;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x00ff88)
    .setTitle(`${msg.author.username} • Inventory`)
    .addFields(
      { name: "🎣 Rod", value: rod, inline: true },
      { name: "🪱 Bait", value: bait, inline: true },
      { name: "💰 Coins", value: `${coins}`, inline: true },
      { name: "🐟 Common Fish", value: `${counts.Common}`, inline: true },
      { name: "💎 Rare Fish", value: `${counts.Rare}`, inline: true },
      { name: "✨ Epic Fish", value: `${counts.Epic}`, inline: true },
      { name: "🐉 Legendary Fish", value: `${counts.Legendary}`, inline: true },
      { name: "🔱 Mythic Fish", value: `${counts.Mythic}`, inline: true }
    )
    .setFooter({ text: "Tingkatkan rod & bait untuk hasil mancing lebih besar!" })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
};

if (cmd === 'addkoin') {

  if (!msg.guild)
    return msg.reply('❌ Command ini hanya bisa digunakan di server.');

  if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return msg.reply('❌ Hanya Admin yang bisa menggunakan command ini.');

  const target = msg.mentions.users.first();
  const amt = parseInt(args[1]);

  if (!target || !Number.isInteger(amt) || amt <= 0)
    return msg.reply('Format: `.addkoin @user 100`');

  ensureUser(target.id);

  
  db[target.id].coins = (db[target.id].coins || 0) + amt;
  saveDB();

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("🛠 ADMIN ADD KOIN")
    .addFields(
      { name: "👤 Target", value: `<@${target.id}>`, inline: true },
      { name: "💰 Ditambahkan", value: koin(amt), inline: true },
      { name: "💎 Saldo Sekarang", value: koin(db[target.id].coins), inline: false }
    )
    .setFooter({ text: `Admin: ${msg.author.username}` })
    .setTimestamp();

  return msg.reply({ embeds: [embed] });
}

if (cmd === 'addstreak') {

  if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return msg.reply('❌ Admin only');

  const target = msg.mentions.users.first();
  const amt = parseInt(args[1]);

  if (!target || isNaN(amt))
    return msg.reply('Format: `.addstreak @user 5`');

  ensureUser(target.id);

  db[target.id].streak += amt;
  saveDB();

  return msg.reply(`🔥 Streak <@${target.id}> +${amt}`);
}

}); 


client.login(process.env.TOKEN);












