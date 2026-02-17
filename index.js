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

  // 💬 CHAT QUEST
  { type: "chat", target: 10, reward: 80, text: "Kirim 10 pesan" },
  { type: "chat", target: 20, reward: 120, text: "Kirim 20 pesan" },

  // 🛠 WORK QUEST
  { type: "work", target: 2, reward: 90, text: "Kerja 2 kali" },
  { type: "work", target: 5, reward: 150, text: "Kerja 5 kali" },

  // ⭐ XP QUEST
  { type: "xp", target: 150, reward: 100, text: "Dapatkan 150 XP" },
  { type: "xp", target: 300, reward: 180, text: "Dapatkan 300 XP" },

  // 🎣 FISH QUEST
  { type: "fish", target: 5, reward: 100, text: "Tangkap 5 ikan" },
  { type: "rareFish", target: 1, reward: 200, text: "Dapatkan 1 Rare Fish" },

  // 🔥 STREAK QUEST
  { type: "streak", target: 3, reward: 120, text: "Login 3 hari berturut" },

  // 👑 LEVEL QUEST
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
      xp: 0,
      level: 1,
      lastXp: 0,
      lastWork: 0,
      lastAbsen: null,
      streak: 0,
      fish: 0,
      rareFish: 0,
      legendFish: 0,
      lastFish: 0,
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
        value: "` .profile ` — Lihat profile\n` .top ` — Ranking koin\n` .toplevel ` — Ranking level",
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

  if (!q)
    return msg.reply("❌ Quest belum tersedia.");

  const percent = Math.min(q.progress / q.target, 1);
  const barSize = 15;
  const filled = Math.round(barSize * percent);
  const empty = barSize - filled;
  const bar = '▰'.repeat(filled) + '▱'.repeat(empty);

  // 🎉 Claim reward otomatis kalau selesai
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
    return msg.reply(`⏳ Tunggu ${sisa} detik lagi.`);
  }

  db[uid].lastFish = now;

  
  const fishes = [

  { name: "🐟 Ikan Lele", chance: 15, min: 20, max: 40, xp: 15 },
  { name: "🐠 Ikan Nila", chance: 15, min: 25, max: 45, xp: 18 },
  { name: "🐡 Ikan Buntal", chance: 12, min: 30, max: 50, xp: 20 },
  { name: "🦐 Udang Sungai", chance: 10, min: 15, max: 35, xp: 12 },
  { name: "🦀 Kepiting", chance: 8, min: 20, max: 40, xp: 18 },

 
  { name: "🐬 Lumba-Lumba Kecil", chance: 6, min: 60, max: 100, xp: 40 },
  { name: "🦈 Hiu Karang", chance: 5, min: 70, max: 120, xp: 55 },
  { name: "🐙 Gurita Laut", chance: 6, min: 50, max: 90, xp: 35 },
  { name: "🐢 Penyu Laut", chance: 5, min: 60, max: 110, xp: 45 },

  { name: "💎 Golden Fish", chance: 3, min: 120, max: 180, xp: 80, rare: true },
  { name: "🔥 Lava Fish", chance: 2, min: 130, max: 190, xp: 90, rare: true },
  { name: "❄ Ice Fish", chance: 2, min: 120, max: 170, xp: 85, rare: true },
  { name: "⚡ Thunder Fish", chance: 1, min: 150, max: 220, xp: 100, rare: true },

  { name: "🌊 Kraken Muda", chance: 1.5, min: 200, max: 300, xp: 130, rare: true },
  { name: "🌟 Celestial Carp", chance: 1, min: 220, max: 320, xp: 150, rare: true },
  { name: "🌈 Rainbow Dragonfish", chance: 0.5, min: 250, max: 350, xp: 180, legend: true },

  { name: "🐉 Ancient Dragon Fish", chance: 0.5, min: 300, max: 450, xp: 250, legend: true },
  { name: "👑 King of The Ocean", chance: 0.5, min: 350, max: 500, xp: 300, legend: true }

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

  const size = Math.floor(Math.random() * (selected.max - selected.min + 1)) + selected.min;
  const reward = Math.floor(size / 2);
  const xpGain = selected.xp;

  db[uid].coin += reward;
  db[uid].xp += xpGain;
  db[uid].fish += 1;

  if (selected.rare) db[uid].rareFish += 1;
  if (selected.legend) db[uid].legendFish += 1;

  
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

  return msg.reply(
`🎣 HASIL MANCING 🎣

${selected.name}
📏 Ukuran: ${size}cm
💰 Koin: ${koin(reward)}
⭐ XP: +${xpGain}

📦 Total Ikan: ${db[uid].fish}
${selected.rare ? "💎 RARE FISH!" : ""}
${selected.legend ? "🐉 LEGENDARY FISH!!!" : ""}`
  );
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

  if (db[uid].coin < amt)
    return msg.reply('❌ Koin kamu tidak cukup.');

  // ✅ Buat data target kalau belum ada
  if (!db[target.id]) {
    db[target.id] = {
      coin: 0,
      xp: 0,
      level: 1,
      lastXp: 0,
      lastWork: 0,
      lastAbsen: null,
      streak: 0,
      lastDuel: 0,
      dailyQuest: null,
      fish: 0,
      rareFish: 0,
      legendFish: 0,
      lastFish: 0
    };
  }

  const tax = Math.floor(amt * TAX_RATE);
  const receive = amt - tax;

  db[uid].coin -= amt;
  db[target.id].coin += receive;

  saveDB();

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("🔁 TRANSFER BERHASIL")
    .addFields(
      { name: "👤 Pengirim", value: msg.author.username, inline: true },
      { name: "📥 Penerima", value: target.username, inline: true },
      { name: "💰 Dikirim", value: koin(amt), inline: true },
      { name: "💸 Pajak (5%)", value: koin(tax), inline: true },
      { name: "✅ Diterima", value: koin(receive), inline: true }
    )
    .setFooter({ text: "💎 Sistem ekonomi aktif • Pajak menjaga keseimbangan" });

  return msg.reply({ embeds: [embed] });
}

  if (cmd === 'topfish') {

  const list = Object.entries(db)
    .sort((a, b) => (b[1].fish || 0) - (a[1].fish || 0));

  let text = '🏆 RANKING PEMANCING 🏆\n\n';

  for (let i = 0; i < list.length; i++) {
    const user = await client.users.fetch(list[i][0]);
    text += `${i + 1}. ${user.username}
🎣 ${list[i][1].fish || 0} ikan
💎 ${list[i][1].rareFish || 0}
🐉 ${list[i][1].legendFish || 0}

`;
  }

  return msg.reply(text);
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




