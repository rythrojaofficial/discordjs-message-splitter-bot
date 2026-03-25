require('dotenv').config(); // Load the .env file
const fs = require('fs'); // Import the File System module
const { Client, Events, GatewayIntentBits } = require('discord.js');

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

const safeCharacterLimit = 1850;


async function runChunking(text){
    const chunks =  splitMarkdown(text)
    return chunks;
}

function splitMarkdown(text, chunkSize = safeCharacterLimit) {
    text = text.replace(/\uFFFC/g, '');
    const lines = text.split("\n");
    const chunks = [];
    let currentChunk = "";
    let currentBlock = "";
    let insideCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // More precise fence detection: exactly ``` (with optional language) at start of line
        const trimmedLine = line.trim();
        const isFence = trimmedLine.startsWith("```") && 
                        (trimmedLine === "```" || trimmedLine.match(/^```[a-zA-Z0-9-]*$/));
        
        // Add the line to current block first
        currentBlock += line + "\n";
        
        // Then toggle the code block state if it's a fence
        if (isFence) {
            insideCodeBlock = !insideCodeBlock;
        }

        const nextLine = lines[i + 1] || "";
        const isNextBlockBoundary = !insideCodeBlock && 
                                   (nextLine.trim() === "" || i === lines.length - 1);

        if (isNextBlockBoundary || i === lines.length - 1) {
            const blockWithSpacing = currentBlock + (i === lines.length - 1 ? "" : "\n");
            
            if (blockWithSpacing.length > chunkSize) {
                const subChunks = splitLongBlock(blockWithSpacing, chunkSize);
                for (const subChunk of subChunks) {
                    if (currentChunk.length + subChunk.length <= chunkSize) {
                        currentChunk += subChunk;
                    } else {
                        if (currentChunk) chunks.push(currentChunk.trim());
                        currentChunk = subChunk;
                    }
                }
            } else if (currentChunk.length + blockWithSpacing.length <= chunkSize) {
                currentChunk += blockWithSpacing;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = blockWithSpacing;
            }
            currentBlock = "";
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    const total = chunks.length;
    return chunks.map((chunk, i) => `\n\n${chunk}`);
}

function splitLongBlock(text, maxLength) {
    const result = [];
    let remaining = text;

    while (remaining.length > maxLength) {
        let splitPoint = remaining.lastIndexOf("\n", maxLength);
        if (splitPoint === -1 || splitPoint < maxLength * 0.5) {
            splitPoint = maxLength;
        }
        result.push(remaining.slice(0, splitPoint).trim() + "\n");
        remaining = remaining.slice(splitPoint).trimStart();
    }

    if (remaining) result.push(remaining);
    return result;
}