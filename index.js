
import express from 'express';
import 'dotenv/config'; // load .env
import { Client, Events, GatewayIntentBits } from "discord.js"
import { runChunking } from './splitMarkdown.js';

// initial "require" just in case
// require('dotenv').config(); // Load the .env file
// const { Client, Events, GatewayIntentBits } = require('discord.js');

// load express app
const app = express();

// Create a new client instance
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent] 
});

// When the bot is ready, log it to the console
client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Listen for messages
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore other bots

    if (message.content === '!split') {
    // 1. Check if there are any attachments
        const attachment = message.attachments.first();
        if (attachment && attachment.name === 'message.txt') {
            try {
                // 2. Fetch the file content from Discord's CDN
                const response = await fetch(attachment.url);
                
                if (!response.ok) throw new Error('Failed to fetch file');

                const text = await response.text();

                // 3. Respond with the file content (respecting 2000 char limit)
                let chunks = await runChunking(text);
                for (let i = 0; i < chunks.length; i++){
                    let messageNumber = i+1;
                    let numberMessage = `*message ${messageNumber} of ${chunks.length}*`;
                    await message.reply(numberMessage + '\n' + chunks[i])
                }


            } catch (error) {
                console.error(error);
                await message.reply('There was an error reading your attached file.');
            }
        } else {
            // Standard ping response if no file is found
            await message.reply('oops! (No message.txt file was attached)');
        }
    }
});

client.login(process.env.dct)

app.get("/", (req, res) => {
  res.send("Bot running");
});

app.listen(process.env.PORT || 8080);



