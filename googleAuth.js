const { google } = require('googleapis');
const fs = require('fs');
const open = require('open');
const volunteerhub_folder_id = '1kwjA1pTdC21ldTYU3nr6yI4NUw_313o9';

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


async function getOrCreateFolder(folderName) {
    const drive = google.drive({version: 'v3', auth: oauth2Client});

    const response = await drive.files.list({
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        q: `'${volunteerhub_folder_id}' in parents
            and name='${folderName}'
            and mimeType='application/vnd.google-apps.folder'
            and trashed=false`,
        fields: "files(id, name)"
    });
    console.log("Searching for folder:", folderName);
    console.log("Search results:", response.data.files);

    if (response.data.files.length > 0) {
        return response.data.files[0].id;
    }

    const requestBody = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [volunteerhub_folder_id]
    };

    const folder = await drive.files.create({
        supportsAllDrives: true,
        requestBody: requestBody,
        fields: 'id'
    });

    const folderId = folder.data.id;
    return folderId;
}
async function copyFile(fileId, fileName, folderId) {
    const drive = google.drive({version: 'v3', auth: oauth2Client});

    const requestBody = {
        name: fileName,
        parents:[folderId]
    };
    
    try {
        const existingFile = await drive.files.list({
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            q: `'${folderId}' in parents
            and name='${fileName}'
            and trashed=false`,
            fields: 'files(id, name, webViewLink)'
        });

        if (existingFile.data.files.length > 0) {
            const file = existingFile.data.files[0];

            console.log(`${fileName} already exists.`);

            const link = file.webViewLink;

            return {
                link: link,
                alreadyExists: true
            };
        }

        const response = await drive.files.copy({
            fileId: fileId,
            supportsAllDrives: true,
            requestBody: requestBody,
            fields: 'id, name, webViewLink'
        });
    
        const link = response.data.webViewLink;
        return {
            link: link,
            alreadyExists: false
        };
        
    } catch (error) {
        console.error('Error copying document:', error.message);
    }
    
};
module.exports = {
    authenticateGoogle, 
    getOrCreateFolder,
    copyFile
};