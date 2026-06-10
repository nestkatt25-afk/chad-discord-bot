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

let birthdays = {};

if (fs.existsSync('./birthdays.json')) {
    birthdays = JSON.parse(
        fs.readFileSync('./birthdays.json')
    );
}

function saveBirthdays() {
    fs.writeFileSync(
        './birthdays.json',
        JSON.stringify(birthdays, null, 2)
    );
}

client.once('clientReady', () => {
    console.log(`${client.user.tag} is online!`);
    console.log('Birthday system loaded');

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

const BIRTHDAY_SETUP_CHANNEL = '1507860338962464788';
const BIRTHDAY_ANNOUNCE_CHANNEL = '1507860498178117642';

client.on('messageCreate', async message => {

    if (message.author.bot) return;

    if (message.channel.id !== BIRTHDAY_SETUP_CHANNEL) return;

    const args = message.content.split(' ');

    // SET BIRTHDAY
    if (args[0] === '!birthday') {

        const birthday = args[1];

        if (!birthday) {
            return message.reply(
                'Use: !birthday MM-DD'
            );
        }

        if (!/^\d{2}-\d{2}$/.test(birthday)) {
            return message.reply(
                'Format must be MM-DD'
            );
        }

        if (!birthdays[message.author.id]) {
            birthdays[message.author.id] = {};
        }

        birthdays[message.author.id].birthday =
            birthday;

        saveBirthdays();

        return message.reply(
            `🎂 Birthday saved: ${birthday}`
        );
    }

    // SET TIMEZONE
    if (args[0] === '!timezone') {

        const timezone = args.slice(1).join(' ');

        if (!timezone) {
            return message.reply(
                'Example: !timezone America/New_York'
            );
        }

        if (!birthdays[message.author.id]) {
            birthdays[message.author.id] = {};
        }

        birthdays[message.author.id].timezone =
            timezone;

        saveBirthdays();

        return message.reply(
            `🌎 Timezone saved: ${timezone}`
        );
    }

    // VIEW
    if (args[0] === '!birthdayview') {

        const data =
            birthdays[message.author.id];

        if (!data) {
            return message.reply(
                'No birthday set.'
            );
        }

        return message.reply(
            `🎂 Birthday: ${data.birthday}\n🌎 Timezone: ${data.timezone || 'Not set'}`
        );
    }

    // REMOVE
    if (args[0] === '!birthdayremove') {

        delete birthdays[message.author.id];

        saveBirthdays();

        return message.reply(
            'Birthday removed.'
        );
    }
});

client.on('guildMemberRemove', member => {

    if (birthdays[member.id]) {

        delete birthdays[member.id];

        saveBirthdays();

        console.log(
            `Removed birthday for ${member.user.tag}`
        );
    }
});

// ========================
// birthday announcement
// ========================

const birthdayImages = [
    './images/birthday.jpeg',
    './images/birthday2.jpeg',
    './images/birthday3.jpeg',
    './images/birthday4.jpeg',
    './images/birthday5.jpeg',
    './images/birthday6.jpeg'
];

cron.schedule('* * * * *', async () => {

    const channel =
        client.channels.cache.get(
            BIRTHDAY_ANNOUNCE_CHANNEL
        );

    if (!channel) return;

    const now = new Date();

    for (const userId in birthdays) {

        const data = birthdays[userId];

        if (
            !data.birthday ||
            !data.timezone
        ) continue;

        const localDate =
            new Date().toLocaleString(
                'en-US',
                {
                    timeZone: data.timezone
                }
            );

        const userNow =
            new Date(localDate);

        const month =
            String(
                userNow.getMonth() + 1
            ).padStart(2, '0');

        const day =
            String(
                userNow.getDate()
            ).padStart(2, '0');

        const today =
            `${month}-${day}`;

        const hour =
            userNow.getHours();

        const minute =
            userNow.getMinutes();

        if (
            today === data.birthday &&
            hour === 0 &&
            minute === 0
        ) {

            const randomImage =
    birthdayImages[
        Math.floor(
            Math.random() * birthdayImages.length
        )
    ];

await channel.send({
    content: `It's your birthday? Here's your gift, <@${userId}> 😏`,
    files: [randomImage]
});
        }
    }
});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);
