const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});


const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');

const OWNER_ID = '1068014227547238510';

// =========================
// BOT ONLINE
// =========================

client.once('clientReady', () => {
    console.log(`${client.user.tag} is online!`);

    client.user.setPresence({
        activities: [{
            name: 'emma stop touching my protein powder',
            type: ActivityType.Playing
        }],
        status: 'online'
    });
});

// =========================
// ch: PROXY SYSTEM
// =========================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Only YOU can use ch:
    if (message.author.id !== OWNER_ID) return;

    // Must start with ch:
    if (!message.content.startsWith('ch:')) return;

    // Remove "ch:"
    const text = message.content.slice(3).trim();

    // Grab uploaded files/images
    const attachments = message.attachments.map(att => att.url);

    // If replying to someone
    if (message.reference) {

        // Fetch original replied message
        const repliedMessage = await message.channel.messages.fetch(
            message.reference.messageId
        );

        // Bot replies with text + image
        await repliedMessage.reply({
            content: text || null,
            files: attachments
        });

    } else {

        // Bot sends normal message + image
        await message.channel.send({
            content: text || null,
            files: attachments
        });
    }

    // Delete your original command
    await message.delete();
});

// =========================
// AUTO RESPONSE
// =========================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    // SINGLE TRIGGER
    if (msg.includes('goodnight')) {

        // Random images
        const images = [
            './images/goodnight1.gif',
            './images/goodnight2.png',
            './images/goodnight3.gif',
            './images/goodnight4.png'
        ];

        // Pick random image
        const randomImage =
            images[Math.floor(Math.random() * images.length)];

        // Random replies (optional)
        const replies = [
            'sleep well 🌙',
            'goodnight 😴',
            'sweet dreams ✨',
            'night night'
        ];

        // Pick random reply
        const randomReply =
            replies[Math.floor(Math.random() * replies.length)];

        // Send
        await message.reply({
            content: randomReply,
            files: [randomImage]
        });
    }
});


// =========================
// BIRTHDAY
// =========================

const db = new sqlite3.Database('./birthdays.db');

db.run(`
CREATE TABLE IF NOT EXISTS birthdays (
    userId TEXT PRIMARY KEY,
    birthday TEXT
)
`);

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith('!birthday')) return;

    const args = message.content.split(' ');
    const subcommand = args[1];

    // !birthday view
    if (subcommand === 'view') {

        db.get(
            'SELECT birthday FROM birthdays WHERE userId = ?',
            [message.author.id],
            (err, row) => {

                if (!row) {
                    return message.reply(
                        'You have not set a birthday yet.'
                    );
                }

                message.reply(
                    `🎂 Your birthday is ${row.birthday}`
                );
            }
        );

        return;
    }

    // !birthday remove
    if (subcommand === 'remove') {

        db.run(
            'DELETE FROM birthdays WHERE userId = ?',
            [message.author.id]
        );

        message.reply(
            'Your birthday has been removed.'
        );

        return;
    }

    // !birthday MM-DD
    const birthday = args[1];

    if (!birthday) {
        return message.reply(
            'Usage: `!birthday MM-DD`'
        );
    }

    const validFormat =
        /^\d{2}-\d{2}$/.test(birthday);

    if (!validFormat) {
        return message.reply(
            'Use format: MM-DD (example: 05-30)'
        );
    }

    db.run(
        'INSERT OR REPLACE INTO birthdays (userId, birthday) VALUES (?, ?)',
        [message.author.id, birthday]
    );

    message.reply(
        `🎂 Birthday saved as ${birthday}`
    );
});

client.on('guildMemberRemove', member => {

    db.run(
        'DELETE FROM birthdays WHERE userId = ?',
        [member.id]
    );

});

const BIRTHDAY_CHANNEL_ID = '1507860338962464788';

const birthdayImages = [
    './images/birthday1.gif',
    './images/birthday2.png',
    './images/birthday3.gif',
    './images/birthday4.png'
];

cron.schedule('0 9 * * *', () => {

    const today = new Date();

    const month =
        String(today.getMonth() + 1).padStart(2, '0');

    const day =
        String(today.getDate()).padStart(2, '0');

    const todayString = `${month}-${day}`;

    db.all(
        'SELECT * FROM birthdays WHERE birthday = ?',
        [todayString],
        async (err, rows) => {

            if (err) {
                console.error(err);
                return;
            }

            const channel =
                client.channels.cache.get(
                    BIRTHDAY_CHANNEL_ID
                );

            if (!channel) return;

            for (const row of rows) {

                const image =
                    birthdayImages[
                        Math.floor(
                            Math.random() *
                            birthdayImages.length
                        )
                    ];

                await channel.send({
                    content:
                        `🎉 Happy Birthday <@${row.userId}>! 🎂`,
                    files: [image]
                });
            }
        }
    );

});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);
