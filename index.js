const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const PREFIX = '>>';
const WORK_COOLDOWN = 60 * 60 * 1000;
const XP_COOLDOWN = 60 * 1000;
const TAX_RATE = 0.05;

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

const SHOP = {
  vip: { role: 'VIP', price: 400 },
  elite: { role: 'ELITE', price: 800 },
  legend: { role: 'LEGEND', price: 1500 },
  mythic: { role: 'MYTHIC', price: 3000 }
};

client.once('ready', () => {
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
      streak: 0
    };
    saveDB();
  }

  if (now - db[uid].lastXp > XP_COOLDOWN) {
    const gain = Math.floor(Math.random() * 10) + 5;
    db[uid].xp += gain;
    db[uid].lastXp = now;

    while (db[uid].xp >= xpNeed(db[uid].level)) {
      db[uid].xp -= xpNeed(db[uid].level);
      db[uid].level++;

      const bonus = db[uid].level * 10;
      db[uid].coin += bonus;

      const ch = msg.guild.channels.cache.get(process.env.LEVEL_CHANNEL_ID);
      if (ch) {
        ch.send(
          `🎉 **${msg.author.username} LEVEL UP!**\n` +
          `⭐ Level ${db[uid].level}\n` +
          `🪙 Bonus: ${koin(bonus)}`
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
`📖 **COMMAND BOT**
🗓 >>absen
🛠 >>kerja
🪙 >>koin
👤 >>profile
🏆 >>top
📊 >>toplevel
🛒 >>buy
🔁 >>transfer`
    );
  }

  if (cmd === 'absen') {
    const today = todayStr();
    if (db[uid].lastAbsen === today)
      return msg.reply('❌ Sudah absen hari ini');

    const reward = [5, 8, 10, 12][Math.floor(Math.random() * 4)];
    db[uid].coin += reward;
    db[uid].streak++;
    db[uid].lastAbsen = today;
    saveDB();

    return msg.reply(
`✅ Absen sukses
🎲 ${koin(reward)}
🔥 Streak: ${db[uid].streak} hari`
    );
  }

  if (cmd === 'kerja') {
    if (now - db[uid].lastWork < WORK_COOLDOWN) {
      const m = Math.ceil((WORK_COOLDOWN - (now - db[uid].lastWork)) / 60000);
      return msg.reply(`⏳ Tunggu ${m} menit`);
    }

    const base = Math.floor(Math.random() * 20) + 20;
    const bonus = Math.min(db[uid].level * 2, 100);
    const total = base + bonus;

    db[uid].coin += total;
    db[uid].lastWork = now;
    saveDB();

    return msg.reply(
`🛠 Kamu bekerja
💵 Gaji: ${koin(base)}
⭐ Bonus level: ${koin(bonus)}
💰 Total: **${koin(total)}**`
    );
  }

  if (cmd === 'buy') {
    const pick = args[0]?.toLowerCase();
    if (!pick || !SHOP[pick])
      return msg.reply('Contoh: >>buy vip');

    const item = SHOP[pick];
    const member = msg.member;

    const owned = Object.values(SHOP)
      .filter(s => member.roles.cache.some(r => r.name === s.role));

    const ownedPrice = owned.length
      ? Math.max(...owned.map(o => o.price))
      : 0;

    const pay = item.price - ownedPrice;
    if (pay <= 0)
      return msg.reply('⚠️ Role kamu sudah setara atau lebih tinggi');

    if (db[uid].coin < pay)
      return msg.reply(`❌ Koin kurang (${koin(pay)})`);

    for (const r of owned) {
      const old = msg.guild.roles.cache.find(x => x.name === r.role);
      if (old) await member.roles.remove(old);
    }

    const role = msg.guild.roles.cache.find(r => r.name === item.role);
    if (!role) return msg.reply('❌ Role tidak ditemukan');

    await member.roles.add(role);
    db[uid].coin -= pay;
    saveDB();

    return msg.reply(
      `🎉 Upgrade ke **${item.role}**\n💸 Bayar ${koin(pay)}`
    );
  }

  if (cmd === 'transfer') {
    const target = msg.mentions.users.first();
    const amt = parseInt(args[1]);

    if (!target || isNaN(amt))
      return msg.reply('Contoh: >>transfer @user 500');

    if (target.id === uid)
      return msg.reply('❌ Tidak bisa transfer ke diri sendiri');

    if (amt <= 0)
      return msg.reply('❌ Jumlah tidak valid');

    if (db[uid].coin < amt)
      return msg.reply('❌ Koin tidak cukup');

    if (!db[target.id]) {
      db[target.id] = {
        coin: 0, xp: 0, level: 1, lastXp: 0, lastWork: 0
      };
    }

    const tax = Math.floor(amt * TAX_RATE);
    const receive = amt - tax;

    db[uid].coin -= amt;
    db[target.id].coin += receive;
    saveDB();

    return msg.reply(
`🔁 Transfer sukses
👤 Ke: ${target.username}
💸 Pajak: ${koin(tax)}
📥 Diterima: **${koin(receive)}**`
    );
  }

  if (cmd === 'profile') {
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setAuthor({
        name: msg.author.username,
        iconURL: msg.author.displayAvatarURL()
      })
      .addFields(
        { name: '⭐ Level', value: `${db[uid].level}`, inline: true },
        { name: '📊 XP', value: `${db[uid].xp}/${xpNeed(db[uid].level)}`, inline: true },
        { name: '🪙 Koin', value: koin(db[uid].coin), inline: true }
      );

    return msg.reply({ embeds: [embed] });
  }

  if (cmd === 'top') {
    const list = Object.entries(db)
      .sort((a, b) => b[1].coin - a[1].coin)
      .slice(0, 5);

    let t = '🏆 **TOP KOIN**\n\n';
    for (let i = 0; i < list.length; i++) {
      const u = await client.users.fetch(list[i][0]);
      t += `${i + 1}. ${u.username} — ${koin(list[i][1].coin)}\n`;
    }
    return msg.reply(t);
  }
  
  if (cmd === 'toplevel') {
    const list = Object.entries(db)
      .sort((a, b) => b[1].level - a[1].level)
      .slice(0, 5);

    let t = '🏆 **TOP LEVEL**\n\n';
    for (let i = 0; i < list.length; i++) {
      const u = await client.users.fetch(list[i][0]);
      t += `${i + 1}. ${u.username} — Lv ${list[i][1].level}\n`;
    }
    return msg.reply(t);
  }

  if (cmd === 'addkoin') {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return msg.reply('❌ Admin only');

    const target = msg.mentions.users.first();
    const amt = parseInt(args[1]);
    if (!target || isNaN(amt))
      return msg.reply('>>addkoin @user 100');

    if (!db[target.id]) db[target.id] = { coin: 0, xp: 0, level: 1 };
    db[target.id].coin += amt;
    saveDB();

    return msg.reply(`✅ ${koin(amt)} ditambahkan ke ${target.username}`);
  }
});

client.login(process.env.TOKEN);
