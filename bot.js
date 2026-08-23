const { Client, GatewayIntentBits } = require('discord.js');
const {
    authenticateGoogle, 
    getOrCreateFolder, 
    copyFile
} = require('./googleAuth.js');

require("dotenv").config();
const express = require('express'); // Add Express for Railway
const { GoogleGenAI } = require('@google/genai');
const e = require('express');

const gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const template_ids = {
    offer_letter: '1ixG3yK7byV3ZaucJXfmU1dY8wD7A4HPo',
    nda: '18LIsgepr2FGgzfpV8abvuZa1bBHQmKsZ'
};

const document_names = {
    offer_letter: 'Offer Letter',
    nda: 'NDA'
};

const createDocumentDeclaration = {
    name: 'createDocument',
    description: 'Create a document from Google Docs template',
    parameters: {
        type: 'object',
        properties: {
            documentType: {
                type: 'string',
                enum: ['offer_letter', 'nda']
            },
            personName: {
                type: 'string'
            }
        },
        required: ['documentType', 'personName']
    }
};

/**
 * 
 * @param {string} documentType 
 * @param {string} personName 
 */
async function createDocument({documentType, personName}) {
    const fileId = template_ids[documentType];
    const displayName = document_names[documentType]
    const fileName = `${displayName} - ${personName}`
    
    const folderId = await getOrCreateFolder(personName);

    const result = await copyFile(fileId, fileName, folderId);
    
    return {
        documentLink: result.link, 
        alreadyExists: result.alreadyExists,
        personName, 
        displayName};
}


// When discord bot has started up
client.once('ready', async () => {
    console.log('Bot is ready!');
    await authenticateGoogle();
});


client.on('messageCreate', async message => {
    if (message.author.bot || !message.content || message.content === '') return;
    
    try {
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message.content,
            config: {
                tools: [{
                    functionDeclarations: [createDocumentDeclaration]
                }]
            }
        });
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            const functionCall = response.functionCalls[0];
            console.log(`Function to call: ${functionCall.name}`);
            console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
            const result = await createDocument(functionCall.args);

            if (result.alreadyExists) {
                await message.reply(`${result.displayName} for ${result.personName} already exists. \n Document: ${result.documentLink}`);
            } else {
                await message.reply(`Successfully created ${result.displayName} for ${result.personName}. \n Document: ${result.documentLink}`);
            }
        } else {
            const text = response.text.substring(0, 1999);
            await message.reply(text);
        }
        

    } catch (err) {
        console.error(err);

        if (err.status == '503') {
            await message.reply("Gemini is currently overloaded. Please try again in a few moment.");    
        } else {
            await message.reply(err)
        }
    }
});

// Set the PORT for Railway or default to 3000
const port = process.env.PORT || 3000;

// Create a basic server for Railway to keep the app running
const app = express();

app.get('/', (req, res) => {
    res.send('Bot is running!'); // Simple response for verification
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is listening on port ${port}`);
});

// Authenticate Discord
client.login(process.env.DISCORD_TOKEN);

