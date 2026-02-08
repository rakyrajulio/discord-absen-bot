const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();


const client = new Client({
  intents: [GatewayIntentBits.Guilds]
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

const commands = [
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Menampilkan daftar command'),

  new SlashCommandBuilder()
    .setName('absen')
    .setDescription('Absen harian (+5 point)'),

  new SlashCommandBuilder()
    .setName('point')
    .setDescription('Cek point kamu'),

  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Lihat profil lengkap'),

  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Beli / upgrade role')
    .addStringOption(opt =>
      opt.setName('role')
        .setDescription('Pilih role')
        .setRequired(true)
        .addChoices(
          { name: 'VIP', value: 'vip' },
          { name: 'ELITE', value: 'elite' },
          { name: 'LEGEND', value: 'legend' },
          { name: 'MYTHIC', value: 'mythic' }
        )
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔁 Register slash command...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash command terdaftar');
  } catch (err) {
    console.error(err);
  }
})();

client.once('ready', () => {
  console.log('🤖 Bot ONLINE (Slash Command)');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  const today = new Date().toISOString().slice(0, 10);

  if (!db[userId]) {
    db[userId] = { point: 0, lastAbsen: null };
    saveDB();
  }

  if (interaction.commandName === 'help') {
    return interaction.reply(
`📖 **DAFTAR COMMAND**

🗓 /absen → Absen harian (+5)
💰 /point → Cek point
👤 /profile → Profil lengkap
🛒 /buy → Beli / upgrade role

🏆 **Achievement Otomatis**
ACTIVE MEMBER → 50+
CONSISTENT → 200+
VETERAN → 500+
TOP → 1000+`
    );
  }

  
  if (interaction.commandName === 'absen') {
    if (db[userId].lastAbsen === today)
      return interaction.reply({
        content: '❌ Kamu sudah absen hari ini.',
        ephemeral: true
      });

    db[userId].lastAbsen = today;
    db[userId].point += 5;
    saveDB();

    await checkAchievements(interaction.member);

    return interaction.reply('✅ Absen sukses! +5 point');
  }

  
  if (interaction.commandName === 'point') {
    return interaction.reply(`💰 Point kamu: **${db[userId].point}**`);
  }

  
  if (interaction.commandName === 'profile') {
    const member = interaction.member;

    const shopRoles = Object.values(SHOP)
      .filter(r => member.roles.cache.some(role => role.name === r.role))
      .map(r => r.role)
      .join(', ') || 'Tidak ada';

    const achievementRoles = ACHIEVEMENTS
      .filter(a => member.roles.cache.some(r => r.name === a.name))
      .map(a => a.name)
      .join(', ') || 'Belum ada';

    return interaction.reply(
`👤 **Profil ${interaction.user.username}**
💰 Point: **${db[userId].point}**
🎖 Shop Role: **${shopRoles}**
🏆 Achievement: **${achievementRoles}**`
    );
  }


  if (interaction.commandName === 'buy') {
    const choice = interaction.options.getString('role');
    const item = SHOP[choice];
    const member = interaction.member;

    const ownedRoles = Object.values(SHOP)
      .filter(r => member.roles.cache.some(role => role.name === r.role));

    let ownedPrice = 0;
    if (ownedRoles.length > 0)
      ownedPrice = Math.max(...ownedRoles.map(r => r.price));

    const priceToPay = item.price - ownedPrice;

    if (priceToPay <= 0)
      return interaction.reply({
        content: '⚠️ Kamu sudah punya role setara atau lebih tinggi.',
        ephemeral: true
      });

    if (db[userId].point < priceToPay)
      return interaction.reply({
        content: `❌ Point kurang. Butuh ${priceToPay} point.`,
        ephemeral: true
      });

    const newRole = interaction.guild.roles.cache.find(
      r => r.name === item.role
    );
    if (!newRole)
      return interaction.reply('❌ Role tidak ditemukan.');

    for (const r of ownedRoles) {
      const oldRole = interaction.guild.roles.cache.find(
        role => role.name === r.role
      );
      if (oldRole) await member.roles.remove(oldRole);
    }

    db[userId].point -= priceToPay;
    await member.roles.add(newRole);
    saveDB();

    await checkAchievements(member);

    return interaction.reply(
      `🎉 Berhasil upgrade ke **${item.role}**!\n💸 Dipotong ${priceToPay} point`
    );
  }
});

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
