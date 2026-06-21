const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();
const cron = require('node-cron');
const { Pool } = require('pg');

// =========================
// POSTGRES SETUP
// =========================

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// =========================
// DISCORD CLIENT
// =========================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const OWNER_ID = '1068014227547238510';

// =========================
// CONSTANTS
// =========================

const BIRTHDAY_SETUP_CHANNEL = '1507860338962464788';
const BIRTHDAY_ANNOUNCE_CHANNEL = '1507860498178117642';

const birthdayImages = [
    './images/birthday.jpeg',
    './images/birthday2.jpeg',
    './images/birthday3.jpeg',
    './images/birthday4.jpeg',
    './images/birthday5.jpeg',
    './images/birthday6.jpeg'
];

// =========================
// READY EVENT
// =========================

client.once('clientReady', async () => {
    console.log(`${client.user.tag} is online!`);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS birthdays (
            user_id TEXT PRIMARY KEY,
            birthday TEXT,
            timezone TEXT,
            last_announced TEXT
        )
    `);

    console.log('Birthday table ready');

    client.user.setPresence({
        activities: [{
            name: 'emma stop touching my protein powder',
            type: ActivityType.Playing
        }],
        status: 'online'
    });
});

// =========================
// OWNER PROXY (ch:)
// =========================

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.author.id !== OWNER_ID) return;
    if (!message.content.startsWith('ch:')) return;

    const text = message.content.slice(3).trim();
    const attachments = message.attachments.map(a => a.url);

    if (message.reference) {
        const replied = await message.channel.messages.fetch(message.reference.messageId);

        await replied.reply({
            content: text || null,
            files: attachments
        });
    } else {
        await message.channel.send({
            content: text || null,
            files: attachments
        });
    }

    await message.delete();
});

// =========================
// AUTO RESPONSE
// =========================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    if (msg.includes('bicep')) {
        await message.reply({
            content: 'You asked?',
            files: ['./images/bicep.jpeg']
        });
    }
});

// =========================
// BIRTHDAY SYSTEM
// =========================

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.id !== BIRTHDAY_SETUP_CHANNEL) return;

    const args = message.content.split(' ');

    // -------------------------
    // SET BIRTHDAY
    // -------------------------
    if (args[0] === '!birthday') {
        const birthday = args[1];

        if (!birthday) {
            return message.reply('Format: !birthday MM-DD');
        }

        if (!/^\d{2}-\d{2}$/.test(birthday)) {
            return message.reply('Format must be MM-DD');
        }

        await pool.query(
            `
            INSERT INTO birthdays (user_id, birthday)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET birthday = $2
            `,
            [message.author.id, birthday]
        );

        return message.reply(`Saved birthday: ${birthday}`);
    }

    // -------------------------
    // SET TIMEZONE
    // -------------------------
    if (args[0] === '!timezone') {
        const timezone = args.slice(1).join(' ');

        if (!timezone) {
            return message.reply('Example: !timezone America/New_York');
        }

        try {
            Intl.DateTimeFormat('en-US', { timeZone: timezone });
        } catch {
            return message.reply('Invalid timezone.');
        }

        await pool.query(
            `
            INSERT INTO birthdays (user_id, timezone)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET timezone = $2
            `,
            [message.author.id, timezone]
        );

        return message.reply(`Timezone saved: ${timezone}`);
    }

    // -------------------------
    // VIEW
    // -------------------------
    if (args[0] === '!birthdayview') {
        const result = await pool.query(
            'SELECT * FROM birthdays WHERE user_id = $1',
            [message.author.id]
        );

        if (result.rows.length === 0) {
            return message.reply('No birthday found.');
        }

        const data = result.rows[0];

        return message.reply(
            `Birthday: ${data.birthday || 'Not set'}\nTimezone: ${data.timezone || 'Not set'}`
        );
    }

    // -------------------------
    // REMOVE
    // -------------------------
    if (args[0] === '!birthdayremove') {
        await pool.query(
            'DELETE FROM birthdays WHERE user_id = $1',
            [message.author.id]
        );

        return message.reply('Birthday removed.');
    }

    // -------------------------
    // TIMEZONE HELP
    // -------------------------
    if (args[0] === '!timezonehelp') {
        return message.reply(`
Common Timezones:
America/New_York
America/Toronto
America/Chicago
America/Denver
America/Los_Angeles
Europe/London
Europe/Paris
Asia/Tokyo
Australia/Sydney
        `);
    }
});

// =========================
// BIRTHDAY CRON (EVERY MINUTE)
// =========================

cron.schedule('* * * * *', async () => {
    const channel = client.channels.cache.get(BIRTHDAY_ANNOUNCE_CHANNEL);
    if (!channel) return;

    const result = await pool.query('SELECT * FROM birthdays');

    for (const data of result.rows) {
        if (!data.birthday || !data.timezone) continue;

        const localDate = new Date().toLocaleString('en-US', {
            timeZone: data.timezone
        });

        const now = new Date(localDate);

        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const today = `${month}-${day}`;
        const todayKey = `${now.getFullYear()}-${month}-${day}`;

        if (data.last_announced === todayKey) continue;

        if (today === data.birthday) {
            const image =
                birthdayImages[Math.floor(Math.random() * birthdayImages.length)];

            await channel.send({
                content: `Happy birthday <@${data.user_id}> 🎉 Where are all the <@&1508711739645235281> crashers at?`,
                files: [image]
            });

            await pool.query(
                `
                UPDATE birthdays
                SET last_announced = $1
                WHERE user_id = $2
                `,
                [todayKey, data.user_id]
            );
        }
    }
});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);
