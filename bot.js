
// const { Client, GatewayIntentBits } = require('discord.js');
// const { OpenAI } = require("openai");
// const fs = require('fs');
// const path = require('path');
// const { authenticateGoogle, uploadFileToDrive } = require('./googleAuth.js');
// require("dotenv").config();

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// });

// // Discord Client
// const client = new Client({
//   intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.MessageContent
//     ]
// });

// const sleep = (ms) => {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// // When discord bot has started up
// client.once('ready', async () => {
//     console.log('Bot is ready!');
//     await authenticateGoogle();
// });

// const threadMap = {};

// const getOpenAiThreadId = (discordThreadId) => {
//     return threadMap[discordThreadId];
// }

// const addThreadToMap = (discordThreadId, openAiThreadId) => {
//     threadMap[discordThreadId] = openAiThreadId;
// }

// // Check if the API is done with the current request
// const statusCheckLoop = async (openAiThreadId, runId) => {
//     const run = await openai.beta.threads.runs.retrieve(openAiThreadId, runId);
//     if (!["cancelled", "failed", "completed", "expired"].includes(run.status)) {
//         await sleep(1000);
//         return statusCheckLoop(openAiThreadId, runId);
//     }
//     return run.status;
// };

// const addMessage = (threadId, content) => {
//     return openai.beta.threads.messages.create(
//         threadId,
//         { role: "user", content }
//     );
// }

// // Function to download file content from Code Interpreter response
// const downloadFileFromOpenAI = async (fileId, localPath) => {
//     const response = await openai.files.content(fileId);
//     const fileData = await response.arrayBuffer();
//     const buffer = Buffer.from(fileData);
//     fs.writeFileSync(localPath, buffer); // Save file locally
// }

// // This event will run every time a message is received
// client.on('messageCreate', async message => {
//     if (message.author.bot || !message.content || message.content === '') return;

//     const discordThreadId = message.channel.id;
//     let openAiThreadId = getOpenAiThreadId(discordThreadId);

//     let messagesLoaded = false;
//     if (!openAiThreadId) {
//         const thread = await openai.beta.threads.create();
//         openAiThreadId = thread.id;
//         addThreadToMap(discordThreadId, openAiThreadId);

//         if (message.channel.isThread()) {
//             const starterMsg = await message.channel.fetchStarterMessage();
//             const otherMessagesRaw = await message.channel.messages.fetch();
//             const otherMessages = Array.from(otherMessagesRaw.values())
//                 .map(msg => msg.content)
//                 .reverse(); //oldest first

//             const messages = [starterMsg.content, ...otherMessages]
//                 .filter(msg => !!msg && msg !== '');

//             await Promise.all(messages.map(msg => addMessage(openAiThreadId, msg)));
//             messagesLoaded = true;
//         }
//     }

//     if (!messagesLoaded) {
//         await addMessage(openAiThreadId, message.content);
//     }

//     if (message.content.toLowerCase().includes('create')) {
//         const run = await openai.beta.threads.runs.create(
//             openAiThreadId,
//             {
//                 assistant_id: process.env.ASSISTANT_ID,
//                 max_completion_tokens: 4000,
//                 tools: [
//                     { type: 'code_interpreter' }, // Code execution tool
//                     { type: 'file_search' } // File search tool
//                 ],
//                 tool_resources: {
//                     file_search: {
//                         vector_store_ids: [process.env.VECTOR_STORE_ID] // Specify vector store IDs here
//                     }
//                 }
//             }
//         );

//         const status = await statusCheckLoop(openAiThreadId, run.id);
//         const messages = await openai.beta.threads.messages.list(openAiThreadId);
//         const assistantMessage = messages.data[0];

//         // Extract file_id from either attachments or annotations
//         let fileId;
//         if (assistantMessage.attachments && assistantMessage.attachments.length > 0) {
//             fileId = assistantMessage.attachments[0].file_id; // From attachments
//         } else if (assistantMessage.content[0].text.annotations && assistantMessage.content[0].text.annotations.length > 0) {
//             fileId = assistantMessage.content[0].text.annotations[0].file_path.file_id; // From annotations
//         }

//         if (!fileId) {
//             message.reply("No file found in the response.");
//             return;
//         }

//         const fileName = `output_${Date.now()}.docx`;
//         const filePath = path.join(__dirname, fileName);

//         // Download the file using fileId
//         await downloadFileFromOpenAI(fileId, filePath);

//         // Upload to Google Drive and generate shareable link
//         const downloadLink = await uploadFileToDrive(fileName, filePath);

//         // Send the Google Drive link in Discord
//         await message.reply(`Your document is ready! You can download it here: ${downloadLink}`);

//         // Optionally, delete the local file after uploading
//         fs.unlinkSync(filePath);
//     } else {
//         const run = await openai.beta.threads.runs.create(
//             openAiThreadId,
//             {
//                 assistant_id: process.env.ASSISTANT_ID,
//                 max_completion_tokens: 4000,
//                 tools: [{ type: 'file_search' }],
//                 tool_resources: {
//                   file_search: {
//                     vector_store_ids: [process.env.VECTOR_STORE_ID]
//                   }
//                 },
//                 tool_choice: { type: 'file_search' }
//             }
//         );

//         const status = await statusCheckLoop(openAiThreadId, run.id);
//         const messages = await openai.beta.threads.messages.list(openAiThreadId);
//         let response = messages.data[0].content[0].text.value;
//         response = response.substring(0, 1999); // Discord message length limit

//         message.reply(response);
//     }
// });

// // Authenticate Discord
// client.login(process.env.DISCORD_TOKEN);

const { Client, GatewayIntentBits } = require('discord.js');
// const { OpenAI } = require("openai");
// const fs = require('fs');
// const path = require('path');
const { authenticateGoogle, uploadFileToDrive } = require('./googleAuth.js');
require("dotenv").config();
const express = require('express'); // Add Express for Railway
const { GoogleGenAI } = require('@google/genai');

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

const createDocumentDeclaration = {
    name: 'create_document',
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
function createDocument(documentType, personName) {
    // handle Google Drive API logic here
}

// const sleep = (ms) => {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// When discord bot has started up
client.once('ready', async () => {
    console.log('Bot is ready!');
    //await authenticateGoogle();
});

// const threadMap = {};



// const getGeminiThreadId = (discordThreadId) => {
//     return threadMap[discordThreadId];
// }

// const addThreadToMap = (discordThreadId, geminiThreadId) => {
//     threadMap[discordThreadId] = geminiThreadId;
// }

// // Check if the API is done with the current request
// const statusCheckLoop = async (geminiThreadId, runId) => {
//     const run = await openai.beta.threads.runs.retrieve(geminiThreadId, runId);
//     if (!["cancelled", "failed", "completed", "expired"].includes(run.status)) {
//         await sleep(1000);
//         return statusCheckLoop(geminiThreadId, runId);
//     }
//     return run.status;
// };

// const addMessage = (threadId, content) => {
//     return openai.beta.threads.messages.create(
//         threadId,
//         { role: "user", content }
//     );
// }

// // Function to download file content from Code Interpreter response
// const downloadFileFromOpenAI = async (fileId, localPath) => {
//     const response = await openai.files.content(fileId);
//     const fileData = await response.arrayBuffer();
//     const buffer = Buffer.from(fileData);
//     fs.writeFileSync(localPath, buffer); // Save file locally
// }
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content || message.content === '' || !message.mentions.has(client.user)) return;
    
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
            const {documentType, personName} = functionCall.args;
            console.log(`Function to call: ${functionCall.name}`);
            console.log(`ID: ${functionCall.id}`);
            console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
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
// // This event will run every time a message is received
// client.on('messageCreate', async message => {
//     if (message.author.bot || !message.content || message.content === '') return;

//     const discordThreadId = message.channel.id;
//     let geminiThreadId = getGeminiThreadId(discordThreadId);

//     let messagesLoaded = false;
//     if (!geminiThreadId) {
//         const thread = await openai.beta.threads.create();
//         geminiThreadId = thread.id;
//         addThreadToMap(discordThreadId, geminiThreadId);

//         if (message.channel.isThread()) {
//             const starterMsg = await message.channel.fetchStarterMessage();
//             const otherMessagesRaw = await message.channel.messages.fetch();
//             const otherMessages = Array.from(otherMessagesRaw.values())
//                 .map(msg => msg.content)
//                 .reverse(); //oldest first

//             const messages = [starterMsg.content, ...otherMessages]
//                 .filter(msg => !!msg && msg !== '');

//             await Promise.all(messages.map(msg => addMessage(geminiThreadId, msg)));
//             messagesLoaded = true;
//         }
//     }

//     if (!messagesLoaded) {
//         await addMessage(geminiThreadId, message.content);
//     }

//     if (message.content.toLowerCase().includes('create')) {
//         const run = await openai.beta.threads.runs.create(
//             geminiThreadId,
//             {
//                 assistant_id: process.env.ASSISTANT_ID,
//                 max_completion_tokens: 4000,
//                 tools: [
//                     { type: 'code_interpreter' }, // Code execution tool
//                     { type: 'file_search' } // File search tool
//                 ],
//                 tool_resources: {
//                     file_search: {
//                         vector_store_ids: [process.env.VECTOR_STORE_ID] // Specify vector store IDs here
//                     }
//                 }
//             }
//         );

//         const status = await statusCheckLoop(geminiThreadId, run.id);
//         const messages = await openai.beta.threads.messages.list(geminiThreadId);
//         const assistantMessage = messages.data[0];

//         // Extract file_id from either attachments or annotations
//         let fileId;
//         if (assistantMessage.attachments && assistantMessage.attachments.length > 0) {
//             fileId = assistantMessage.attachments[0].file_id; // From attachments
//         } else if (assistantMessage.content[0].text.annotations && assistantMessage.content[0].text.annotations.length > 0) {
//             fileId = assistantMessage.content[0].text.annotations[0].file_path.file_id; // From annotations
//         }

//         if (!fileId) {
//             message.reply("No file found in the response.");
//             return;
//         }

//         const fileName = `output_${Date.now()}.docx`;
//         const filePath = path.join(__dirname, fileName);

//         // Download the file using fileId
//         await downloadFileFromOpenAI(fileId, filePath);

//         // Upload to Google Drive and generate shareable link
//         const downloadLink = await uploadFileToDrive(fileName, filePath);

//         // Send the Google Drive link in Discord
//         await message.reply(`Your document is ready! You can download it here: ${downloadLink}`);

//         // Optionally, delete the local file after uploading
//         fs.unlinkSync(filePath);
//     } else {
//         const run = await openai.beta.threads.runs.create(
//             geminiThreadId,
//             {
//                 assistant_id: process.env.ASSISTANT_ID,
//                 max_completion_tokens: 4000,
//                 tools: [{ type: 'file_search' }],
//                 tool_resources: {
//                   file_search: {
//                     vector_store_ids: [process.env.VECTOR_STORE_ID]
//                   }
//                 },
//                 tool_choice: { type: 'file_search' }
//             }
//         );

//         const status = await statusCheckLoop(geminiThreadId, run.id);
//         const messages = await openai.beta.threads.messages.list(geminiThreadId);
//         let response = messages.data[0].content[0].text.value;
//         response = response.substring(0, 1999); // Discord message length limit

//         message.reply(response);
//     }
// });

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

