const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const cron = require('node-cron');

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
// BOT ONLINE
// =========================

client.once('clientReady', () => {
console.log('VERSION 2 - BOT STARTED');
console.log(`${client.user.tag} is online!`);

    client.user.setPresence({
        activities: [{
            name: 'emma stop touching my protein powder',
            type: ActivityType.Playing
        }],
        status: 'online'
    });
});

client.on('messageCreate', message => {
    console.log('MESSAGE:', message.content);
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
    if (msg.includes('bicep')) {

        // Random images
        const images = [
            './images/bicep.jpeg',

        ];

        // Pick random image
        const randomImage =
            images[Math.floor(Math.random() * images.length)];

        // Random replies (optional)
        const replies = [
            'You asked?',
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
// BIRTHDAY SYSTEM
// =========================

const BIRTHDAY_CHANNEL_ID = '1507860338962464788';

let birthdays = {};

if (fs.existsSync('./birthdays.json')) {
    birthdays = JSON.parse(
        fs.readFileSync('./birthdays.json', 'utf8')
    );
}

function saveBirthdays() {
    fs.writeFileSync(
        './birthdays.json',
        JSON.stringify(birthdays, null, 2)
    );
}

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    const args = message.content.split(' ');

    // =====================
    // !birthday
    // =====================

    if (args[0] === '!birthday') {

        if (args[1] === 'view') {

            const data = birthdays[message.author.id];

            if (!data?.birthday) {
                return message.reply(
                    'You have not set a birthday.'
                );
            }

            return message.reply(
                `🎂 Your birthday is ${data.birthday}`
            );
        }

        if (args[1] === 'remove') {

            if (birthdays[message.author.id]) {

                delete birthdays[message.author.id].birthday;

                saveBirthdays();

                return message.reply(
                    'Birthday removed.'
                );
            }

            return message.reply(
                'No birthday found.'
            );
        }

        const birthday = args[1];

        if (!birthday) {
            return message.reply(
                'Usage: !birthday MM-DD'
            );
        }

        if (!/^\d{2}-\d{2}$/.test(birthday)) {
            return message.reply(
                'Use format MM-DD (example: 06-10)'
            );
        }

        if (!birthdays[message.author.id]) {
            birthdays[message.author.id] = {};
        }

        birthdays[message.author.id].birthday =
            birthday;

        saveBirthdays();

        return message.reply(
            `🎂 Birthday saved as ${birthday}`
        );
    }

    // =====================
    // !timezone
    // =====================

    if (args[0] === '!timezone') {

        if (args[1] === 'view') {

            const data = birthdays[message.author.id];

            if (!data?.timezone) {
                return message.reply(
                    'No timezone set.'
                );
            }

            return message.reply(
                `🌎 Your timezone is ${data.timezone}`
            );
        }

        if (args[1] === 'remove') {

            if (birthdays[message.author.id]) {

                delete birthdays[message.author.id].timezone;

                saveBirthdays();

                return message.reply(
                    'Timezone removed.'
                );
            }

            return message.reply(
                'No timezone found.'
            );
        }

        const timezone = args[1];

        if (!timezone) {
            return message.reply(
                'Usage: !timezone America/Toronto'
            );
        }

        try {

            Intl.DateTimeFormat(
                'en-US',
                {
                    timeZone: timezone
                }
            );

        } catch {

            return message.reply(
                'Invalid timezone.'
            );
        }

        if (!birthdays[message.author.id]) {
            birthdays[message.author.id] = {};
        }

        birthdays[message.author.id].timezone =
            timezone;

        saveBirthdays();

        return message.reply(
            `🌎 Timezone saved as ${timezone}`
        );
    }

});

client.on('guildMemberRemove', member => {

    delete birthdays[member.id];

    saveBirthdays();

});

const birthdayImages = [
    './images/birthday.jpeg'
];

cron.schedule('0 * * * *', async () => {

    const channel =
        client.channels.cache.get(
            BIRTHDAY_CHANNEL_ID
        );

    if (!channel) return;

    for (const [userId, data] of Object.entries(birthdays)) {

        if (!data.birthday) continue;
        if (!data.timezone) continue;

        const now = new Date();

        const localDate =
            new Intl.DateTimeFormat(
                'en-US',
                {
                    timeZone: data.timezone,
                    month: '2-digit',
                    day: '2-digit'
                }
            ).format(now);

        const [month, day] =
            localDate.split('/');

        const today =
            `${month}-${day}`;

        if (today !== data.birthday) {
            continue;
        }

        const todayStamp =
            new Intl.DateTimeFormat(
                'en-CA',
                {
                    timeZone: data.timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }
            ).format(now);

        if (
            data.lastCelebrated ===
            todayStamp
        ) {
            continue;
        }

        const image =
            birthdayImages[
                Math.floor(
                    Math.random() *
                    birthdayImages.length
                )
            ];

        await channel.send({
            content:
                `🎉 Happy Birthday <@${userId}>! 🎂`,
            files: [image]
        });

        data.lastCelebrated =
            todayStamp;

        saveBirthdays();
    }

});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);
