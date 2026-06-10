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
// LOGIN
// =========================

client.login(process.env.TOKEN);
