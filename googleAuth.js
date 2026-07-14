// const { google } = require('googleapis');
// const fs = require('fs');
// const path = require('path');

// let open;

// async function loadOpenModule() {
//     open = await import('open').then(module => module.default);
// }

// const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
// const TOKEN_PATH = 'token.json';
// let oauth2Client;

// // Load your credentials from environment variables
// async function authenticateGoogle() {
//     await loadOpenModule(); // Ensure 'open' is available before using it

//     const clientId = process.env.GOOGLE_CLIENT_ID;
//     const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
//     const redirectUri = process.env.GOOGLE_REDIRECT_URI;
//     const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

//     oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

//     // Use the refresh token if it's available in the environment variables
//     if (refreshToken) {
//         oauth2Client.setCredentials({ refresh_token: refreshToken });
//         console.log('Using refresh token from environment variables.');
//     } else if (fs.existsSync(TOKEN_PATH)) {
//         // Otherwise, check if a token is stored locally
//         const token = fs.readFileSync(TOKEN_PATH, 'utf8');
//         oauth2Client.setCredentials(JSON.parse(token));
//         console.log('Using stored token.');
//     } else {
//         // If no tokens exist, prompt user for authorization
//         const authUrl = oauth2Client.generateAuthUrl({
//             access_type: 'offline',
//             scope: SCOPES,
//         });
//         console.log('Authorize this app by visiting this url:', authUrl);

//         // Automatically open the URL in the default browser
//         await open(authUrl);
//     }
// }

// // Upload file to Google Drive
// async function uploadFileToDrive(fileName, filePath) {
//     const drive = google.drive({ version: 'v3', auth: oauth2Client });
//     const fileMetadata = {
//         name: fileName,
//     };
//     const media = {
//         mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         body: fs.createReadStream(filePath),
//     };

//     const response = await drive.files.create({
//         resource: fileMetadata,
//         media: media,
//         fields: 'id',
//     });

//     const fileId = response.data.id;
//     const link = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
//     return link;
// }

// module.exports = { authenticateGoogle, uploadFileToDrive };

const { google } = require('googleapis');
const fs = require('fs');
const open = require('open');


async function loadOpenModule() {
    open = (await import('open')).default;
}

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
let oauth2Client;

async function authenticateGoogle() {
    // Load the 'open' module early so it's ready when we need it
    if (!open) {
        await loadOpenModule();
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Use the refresh token if it's available in the environment variables
    if (refreshToken) {
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        console.log('Using refresh token from environment variables.');
    // } else if (fs.existsSync(TOKEN_PATH)) {
    //     // Otherwise, check if a token is stored locally
    //     const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    //     oauth2Client.setCredentials(JSON.parse(token));
    //     console.log('Using stored token.');
    } else {
        // If no tokens exist, prompt user for authorization
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);

        // Automatically open the URL in the default browser
        await open(authUrl);
    }
}


// // Upload file to Google Drive
// async function uploadFileToDrive(fileName, filePath) {
//     const drive = google.drive({ version: 'v3', auth: oauth2Client });
//     const fileMetadata = {
//         name: fileName,
//     };
//     const media = {
//         mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         body: fs.createReadStream(filePath),
//     };

//     const response = await drive.files.create({
//         resource: fileMetadata,
//         media: media,
//         fields: 'id',
//     });

//     const fileId = response.data.id;
//     const link = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
//     return link;
// }

async function copyFile(fileId, fileName) {
    const drive = google.drive({version: 'v3', auth: oauth2Client});
    // const res = await drive.files.list({
    //     pageSize: 10,
    //     fields: "files(id, name)"
    // });
    // console.log(res.data.files);

    const requestBody = {
        name: fileName
    };
    
    try {
        const response = await drive.files.copy({
        fileId: fileId,
        supportsAllDrives: true,
        requestBody: requestBody
        });
    
        const new_fileId = response.data.id;
        const link = `https://docs.google.com/document/d/${new_fileId}/edit`;
        return link;
    } catch (error) {
        console.error('Error copying document:', error.message);
    }
    
};
module.exports = { authenticateGoogle, copyFile };
