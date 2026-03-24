const { Client, GatewayIntentBits } = require('discord.js');

// Create a new client instance
const client = new Client({ 
    intents: [GatewayIntentBits.MessageContent] 
});

// When the bot is ready, log it to the console
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Listen for messages
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore other bots

    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

// Replace 'YOUR_TOKEN' with your actual bot token
client.login('https://discord.com/oauth2/authorize?client_id=1486121101544128542&permissions=8&integration_type=0&scope=bot');