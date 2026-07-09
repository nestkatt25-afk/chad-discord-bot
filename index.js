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
            .setTitle('⌘ Commands')
            .setDescription(
                [
                    '',
                    '`!birthday MM-DD` — Will not work if not formatted this way',
                    '',
                    '`!timezone IANA timezones` — timezone format ',
                    '',
                    '`!birthdayview` — view your info',
                    '',
                    '`!birthdayremove` — this will remove ***BOTH*** your birthdate and timezone',
                    '',
                    '`!timezonehelp` — if you need further help on how to work timezone',
                    '',
                    '───── ⋆.✶.⋆ ─────',
                    '',
                    'ⓘ Please set ***BOTH*** your birthday and timezone so the birthday system can work correctly.'
                ].join('\n')
            )
            .setColor(0x7C0A02);

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
// PING TRIGGER RESPONSE
// =========================

const CHARACTER_CHANNEL_ID = '1507787637803716709';

const MAE_ROLE_ID = '1507688168474935376';
const MAE2_ROLE_ID = '1507688227102789752';
const BUNNIE_ROLE_ID = '1507687973615829063';
const BUNNIE2_ROLE_ID = '1507687926719447241';
const USAGI_ROLE_ID = '1507687788588302437';
const USAGI2_ROLE_ID = '1507687849183412274';
const USAGI3_ROLE_ID = '1507687849183412274';
const QUINNIE_ROLE_ID = '1507688523824762940';
const QUINNIE2_ROLE_ID = '1507688569660112976';
const IVY_ROLE_ID = '1507688388658991145';
const IVY2_ROLE_ID = '1507688436340097084';
const HONEY_ROLE_ID = '1507688048941596703';
const HONEY2_ROLE_ID = '1507688110828556359';
const LOLO_ROLE_ID = '1507779699043078237';
const LOLO2_ROLE_ID = '1507779817335160963';
const LOLO3_ROLE_ID = '1508406810376278017';


client.on('messageCreate', async message => {

    if (message.author.bot) return;
    if (message.channel.id !== CHARACTER_CHANNEL_ID) return;

    // Mae role
    if (message.mentions.roles.has(MAE_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝐴𝑛𝑜𝑡ℎ𝑒𝑟 𝑑𝑜𝑙𝑙 𝑓𝑜𝑟 𝑦𝑜𝑢 𝑡𝑜 𝑐ℎ𝑒𝑟𝑖𝑠ℎ.'
            )
            .setImage('attachment://mae.jpg')
            .setColor(0xd6aae3);

        return message.reply({
            embeds: [embed],
            files: ['./images/mae.jpg']
        });
    }

    if (message.mentions.roles.has(MAE2_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝐴𝑛𝑛𝑜𝑢𝑛𝑐𝑒𝑚𝑒𝑛𝑡 𝑓𝑟𝑜𝑚 𝑡ℎ𝑒 𝐷𝑜𝑙𝑙ℎ𝑜𝑢𝑠𝑒.'
            )
            .setImage('attachment://mae.jpg')
            .setColor(0xd6aae3);

        return message.reply({
            embeds: [embed],
            files: ['./images/mae.jpg']
        });
    }

    // Bunnie role
    if (message.mentions.roles.has(BUNNIE_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                'I\'m too tired to come up with smth rn.'
            )
            .setImage('attachment://bunniebanner.png')
            .setColor(0xf8f8ff);

        return message.reply({
            embeds: [embed],
            files: ['./images/bunniebanner.png']
        });
    }

     if (message.mentions.roles.has(BUNNIE2_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                'I\'m too tired to come up with smth rn.'
            )
            .setImage('attachment://bunniebanner.png')
            .setColor(0xf8f8ff);

        return message.reply({
            embeds: [embed],
            files: ['./images/bunniebanner.png']
        });
    }

    // USAGI ROLE
     if (message.mentions.roles.has(USAGI_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝕌𝕤𝕒𝕘𝕚 𝕡𝕠𝕤𝕥𝕖𝕕 𝕒𝕟 𝕒𝕖𝕤𝕥𝕙𝕖𝕥𝕚𝕔 𝕡𝕙𝕠𝕥𝕠 𝕠𝕗 𝕤𝕒𝕜𝕦𝕣𝕒 𝕗𝕝𝕠𝕨𝕖𝕣𝕤.'
            )
            .setImage('attachment://usagibanner.png')
            .setColor(0xf4a2d1);

        return message.reply({
            embeds: [embed],
            files: ['./images/usagibanner.png']
        });
    }

     if (message.mentions.roles.has(USAGI2_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝕌𝕤𝕒𝕘𝕚 𝕡𝕠𝕤𝕥𝕖𝕕 𝕒𝕟 𝕒𝕖𝕤𝕥𝕙𝕖𝕥𝕚𝕔 𝕡𝕙𝕠𝕥𝕠 𝕠𝕗 𝕤𝕒𝕜𝕦𝕣𝕒 𝕗𝕝𝕠𝕨𝕖𝕣𝕤.'
            )
            .setImage('attachment://usagibanner.png')
            .setColor(0xf4a2d1);

        return message.reply({
            embeds: [embed],
            files: ['./images/usagibanner.png']
        });
    }

     if (message.mentions.roles.has(USAGI3_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝕌𝕤𝕒𝕘𝕚 𝕡𝕠𝕤𝕥𝕖𝕕 𝕒𝕟 𝕒𝕖𝕤𝕥𝕙𝕖𝕥𝕚𝕔 𝕡𝕙𝕠𝕥𝕠 𝕠𝕗 𝕤𝕒𝕜𝕦𝕣𝕒 𝕗𝕝𝕠𝕨𝕖𝕣𝕤.'
            )
            .setImage('attachment://usagibanner.png')
            .setColor(0xf4a2d1);

        return message.reply({
            embeds: [embed],
            files: ['./images/usagibanner.png']
        });
    }

    // QUINNIE ROLE
    if (message.mentions.roles.has(QUINNIE_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                'ᴀ ɴᴇᴡ ʜᴇʀʙᴀʟ ʀᴇᴍᴇᴅʏ ᴛᴏ ꜱᴏᴏᴛʜᴇ ᴛʜᴇ ꜱᴏᴜʟ.'
            )
            .setImage('attachment://quinniebanner.png')
            .setColor(0x80afcc);

        return message.reply({
            embeds: [embed],
            files: ['./images/quinniebanner.png']
        });
    }

    if (message.mentions.roles.has(QUINNIE2_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                'ᴀ ɴᴇᴡ ʜᴇʀʙᴀʟ ʀᴇᴍᴇᴅʏ ᴛᴏ ꜱᴏᴏᴛʜᴇ ᴛʜᴇ ꜱᴏᴜʟ.'
            )
            .setImage('attachment://quinniebanner.png')
            .setColor(0x80afcc);

        return message.reply({
            embeds: [embed],
            files: ['./images/quinniebanner.png']
        });
    }

    // HONEY ROLE
     if (message.mentions.roles.has(HONEY_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                'PLACEHOLDER.'
            )
            .setImage('attachment://honeybanner.png')
            .setColor(0x0c0c0c);

        return message.reply({
            embeds: [embed],
            files: ['./images/honeybanner.png']
        });
    }

     if (message.mentions.roles.has(HONEY2_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                'PLACEHOLDER.'
            )
            .setImage('attachment://honeybanner.png')
            .setColor(0x0c0c0c);

        return message.reply({
            embeds: [embed],
            files: ['./images/honeybanner.png']
        });
    }

    // IVY ROLE
    if (message.mentions.roles.has(IVY_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝐈 𝐦𝐚𝐝𝐞 𝐚𝐧𝐨𝐭𝐡𝐞𝐫 𝐠𝐮𝐲 𝐰𝐢𝐭𝐡 𝐢𝐬𝐬𝐮𝐞𝐬.'
            )
            .setImage('attachment://nicolebanner.png')
            .setColor(0xba1515);

        return message.reply({
            embeds: [embed],
            files: ['./images/nicolebanner.png']
        });
    }

    if (message.mentions.roles.has(IVY2_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝐈 𝐦𝐚𝐝𝐞 𝐚𝐧𝐨𝐭𝐡𝐞𝐫 𝐠𝐮𝐲 𝐰𝐢𝐭𝐡 𝐢𝐬𝐬𝐮𝐞𝐬.'
            )
            .setImage('attachment://nicolebanner.png')
            .setColor(0xba1515);

        return message.reply({
            embeds: [embed],
            files: ['./images/nicolebanner.png']
        });
    }

    // LOLO ROLE
    
    if (message.mentions.roles.has(LOLO_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝙇𝙤𝙡𝙤 𝙙𝙞𝙨𝙘𝙤𝙪𝙧𝙨𝙚 𝙞𝙨 𝙨𝙩𝙖𝙧𝙩𝙞𝙣𝙜 𝙤𝙣 𝙏𝙬𝙞𝙩𝙩𝙚𝙧 𝙖𝙜𝙖𝙞𝙣…'
            )
            .setImage('attachment://lolobanner.png')
            .setColor(0xe4d7ff);

        return message.reply({
            embeds: [embed],
            files: ['./images/lolobanner.png']
        });
    }

    
    if (message.mentions.roles.has(LOLO2_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝙇𝙤𝙡𝙤 𝙙𝙞𝙨𝙘𝙤𝙪𝙧𝙨𝙚 𝙞𝙨 𝙨𝙩𝙖𝙧𝙩𝙞𝙣𝙜 𝙤𝙣 𝙏𝙬𝙞𝙩𝙩𝙚𝙧 𝙖𝙜𝙖𝙞𝙣…'
            )
            .setImage('attachment://lolobanner.png')
            .setColor(0xe4d7ff);

        return message.reply({
            embeds: [embed],
            files: ['./images/lolobanner.png']
        });
    }


    
    if (message.mentions.roles.has(LOLO3_ROLE_ID)) {

        const embed = new EmbedBuilder()
            .setDescription(
                '𝙇𝙤𝙡𝙤 𝙙𝙞𝙨𝙘𝙤𝙪𝙧𝙨𝙚 𝙞𝙨 𝙨𝙩𝙖𝙧𝙩𝙞𝙣𝙜 𝙤𝙣 𝙏𝙬𝙞𝙩𝙩𝙚𝙧 𝙖𝙜𝙖𝙞𝙣…'
            )
            .setImage('attachment://lolobanner.png')
            .setColor(0xe4d7ff);

        return message.reply({
            embeds: [embed],
            files: ['./images/lolobanner.png']
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
            return message.reply('Baby, the format is: !birthday MM-DD');
        }

        if (!/^\d{2}-\d{2}$/.test(birthday)) {
            return message.reply('Remember baby, the format must be MM-DD, not M-DD or MM-D');
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

        return message.reply(`Your birthday is on ${birthday}? I'll be sure to remember that, babe`);
    }

    // -------------------------
    // SET TIMEZONE
    // -------------------------
    if (args[0] === '!timezone') {
        const timezone = args.slice(1).join(' ');

        if (!timezone) {
            return message.reply('Need an example? !timezone America/New_York');
        }

      try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone });
} catch {
    return message.reply(
        'Uh, babe? Did you mistype it? Not letting me put your timezone in the system. Where is Emma when you need her...'
    );
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

        return message.reply(`Oh, so you're in ${timezone}? Visited there for a vlog, you should go watch it`);
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
            return message.reply('Baby, you did not write your birthday down yet.');
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

        return message.reply('Birthday and timezone removed. Not a big celebrater?');
    }

    // -------------------------
    // TIMEZONE HELP
    // -------------------------
    if (args[0] === '!timezonehelp') {

    const embed = new EmbedBuilder()
        .setTitle('⩇⩇:⩇⩇ Timezone Help')
        .setDescription(
            [
                '⤷ Any valid IANA timezone works.',
                '',
                '**Examples**',
                '• EST',
                '• Europe/Moscow',
                '• America/Los_Angeles',
                '• Europe/London',
                '• Asia/Tokyo',
                '• CST',
                '• Australia/Sydney',
                '',
                '**Full Timezone List**',
                'https://en.wikipedia.org/wiki/List_of_tz_database_time_zones',
                '',
                '**⤷ Example**',
                '`!timezone Asia/Manila`'
            ].join('\n')
        )
        .setColor(0x5865F2);

    return message.reply({
        embeds: [embed]
    });
}
    }); 

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

const birthdayImages = [
    './images/birthday.jpeg',
    './images/birthday2.jpeg',
    './images/birthday3.jpeg',
    './images/birthday4.jpeg',
    './images/birthday5.jpeg',
    './images/birthday6.jpeg'
];

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
                content: `Where's the <@&1508711814698111137> at?
        
Happy birthday, <@${data.user_id}>! Here's your gift 😏`,
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
