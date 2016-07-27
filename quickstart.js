var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = 'D:/NodeJS/GmailNodeJStest/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
var ATTCH_DIR = 'D:/NodeJS/GmailNodeJStest/attachments/';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  storedSecret = JSON.parse(content); // credentials saved to var.
  authorize(storedSecret, listMessages); //reqesting the list of messages to store an array with message ID's
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // console.log(TOKEN_PATH);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

// Here my code begins 

var messages; //var. to store an array of message id's got from gmail.
var storedSecret; //var. to store client_secret data to avoid further fs.readfile function calls

/**
 * Lists and stores an array of message id's to var."messages" in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listMessages(auth) {
  var gmail = google.gmail('v1');
  gmail.users.messages.list({
    auth: auth,
    userId: 'me',
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    messages = response.messages;
    if (messages.length === 0) {
      console.log('No messages found.');
    } else {
      console.log('Messages ID\'s:');
      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        console.log('- %s', message.id);
      }
        console.log('');
    }
    authorize(storedSecret, getMessagesInfo);
  });
}

function getMessagesInfo(auth) {
  var gmail = google.gmail('v1');
  for (var i = 0; i < messages.length; i++) {
      gmail.users.messages.get({
      auth: auth,
      userId: 'me',
      id: messages[i].id
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    if (response.payload.parts) {
      console.log(response.id + " : " + response.labelIds + '\n' + response.snippet);
      for (var i = 0; i < response.payload.parts.length; i++) {
          if (response.payload.parts[i].filename && response.payload.parts[i].filename.length > 0 && response.payload.parts[i].body.size > 0) {
              // console.log(response.payload.parts[i]);
              console.log('Attachment filename: ' + response.payload.parts[i].filename);
              console.log('Attachment ID: ' + response.payload.parts[i].body.attachmentId + '\n');
              getAttachments(auth, response);
              // storeAttachment(response.payload.parts[i]);
          }
      }
    }
   });
  }
}

function storeAttachment(file) {
  try {
    fs.mkdirSync(ATTCH_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  // console.log('Name of file to store: ' + file.filename);
  // fs.writeFile(ATTCH_DIR + file.filename, file.data);
  fs.writeFile(ATTCH_DIR + 'file.txt', file);
  
  console.log('Attachment stored to ' + ATTCH_DIR);
}

function getAttachments(auth, message) {
  var gmail = google.gmail('v1');
  var parts = message.payload.parts;
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (part.filename && part.filename.length > 0) {
        var attachId = part.body.attachmentId;
        gmail.users.messages.attachments.get({
        auth: auth,
        'id': attachId,
        'messageId': message.id,
        'userId': 'me'
      }, function(err, response) {
          // fs.writeFile(ATTCH_DIR + message.id, response);
          // storeAttachment();
          console.log(part.filename);
          console.log(part.mimeType);
          console.log(part.body);
          
      });
    }
  }
}

// alexpyrielnodejs@gmail.com - email used for testing purposes

// function getAttachments(userId, message, callback) {
//   var parts = message.payload.parts;
//   for (var i = 0; i < parts.length; i++) {
//     var part = parts[i];
//     if (part.filename && part.filename.length > 0) {
//       var attachId = part.body.attachmentId;
//       var request = gapi.client.gmail.users.messages.attachments.get({
//         'id': attachId,
//         'messageId': message.id,
//         'userId': userId
//       });
//       request.execute(function(attachment) {
//         callback(part.filename, part.mimeType, attachment);
//       });
//     }
//   }
// }