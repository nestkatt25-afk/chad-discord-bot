const {
    Client,
    GatewayIntentBits,
    ActivityType,
    EmbedBuilder
} = require('discord.js');
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
const STICKY_CHANNEL_ID = BIRTHDAY_SETUP_CHANNEL;

const STICKY_EVERY_MESSAGES = 4;

let stickyCounter = 0;

const birthdayImages = [
    './images/birthday.jpeg',
    './images/birthday2.jpeg',
    './images/birthday3.jpeg',
    './images/birthday4.jpeg',
    './images/birthday5.jpeg',
    './images/birthday6.jpeg'
];


// =========================
// STICKY NOTE
// =========================

async function sendSticky(channel) {

    try {

        const oldStickyResult =
            await pool.query(
                `
                SELECT message_id
                FROM sticky_messages
                WHERE channel_id = $1
                `,
                [channel.id]
            );

        if (oldStickyResult.rows.length > 0) {

            const oldMessageId =
                oldStickyResult.rows[0].message_id;

            const oldMessage =
                await channel.messages
                    .fetch(oldMessageId)
                    .catch(() => null);

            if (oldMessage) {
                await oldMessage.delete().catch(() => {});
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .setDescription(
                [
                    '',
                    '`!birthday MM-DD` — Will not work if not formatted this way',
                    '',
                    '`!timezone IANA timezones` — timezone format ',
                    '',
                    '`!birthdayview` — view your info',
                    '',
                    '`!birthdayremove` — this will remove *both* your birthdate and timezone',
                    '',
                    '`!timezonehelp` — if you need further help on how to work timezone',
                    '',
                    '───────────────────────────────────────────────────────',
                    '',
                    'Please set BOTH your birthday and timezone so the birthday system can work correctly.'
                ].join('\n')
            )
            .setColor(0xEA7D70);

        const sticky =
            await channel.send({
                embeds: [embed]
            });

        await pool.query(
            `
            INSERT INTO sticky_messages
            (channel_id, message_id)
            VALUES ($1, $2)
            ON CONFLICT (channel_id)
            DO UPDATE SET message_id = $2
            `,
            [
                channel.id,
                sticky.id
            ]
        );

    } catch (error) {

        console.error(
            'Sticky error:',
            error
        );

    }
}

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

    await pool.query(`
    CREATE TABLE IF NOT EXISTS sticky_messages (
        channel_id TEXT PRIMARY KEY,
        message_id TEXT
    )
`);

console.log('Sticky table ready');

    const stickyChannel =
    client.channels.cache.get(
        STICKY_CHANNEL_ID
    );

if (stickyChannel) {
    await sendSticky(
        stickyChannel
    );
}

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

    const embed = new EmbedBuilder()
        .setTitle('🌎 Timezone Help')
        .setDescription(
            [
                'Any valid IANA timezone works.',
                '',
                '**Examples**',
                '• America/New_York',
                '• America/Chicago',
                '• America/Los_Angeles',
                '• Europe/London',
                '• Asia/Tokyo',
                '• Asia/Manila',
                '• Australia/Sydney',
                '',
                '**Full Timezone List**',
                'https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
                '',
                '**Example Command**',
                '`!timezone Asia/Manila`'
            ].join('\n')
        )
        .setColor(0x5865F2);

    return message.reply({
        embeds: [embed]
    );
}

// =========================
// STICKY MESSAGE SYSTEM EVERY MINUTE
// =========================

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    if (
        message.channel.id !==
        STICKY_CHANNEL_ID
    ) return;

    stickyCounter++;

    if (
        stickyCounter >=
        STICKY_EVERY_MESSAGES
    ) {

        stickyCounter = 0;

        await sendSticky(
            message.channel
        );
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
