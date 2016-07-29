var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var config = require('./config');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = 'D:/NodeJS/GmailNodeJStest/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
var ATTCH_DIR = config.get('attch_dir');

// var TOKEN_DIR = '/Users/AlexPyriel/Applications/GmailNodeJStest/.credentials/';
// var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
// var ATTCH_DIR = '/Users/AlexPyriel/Applications/GmailNodeJStest/attachments/';

// Load client secrets from a local file.
function execute() { 
  fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Gmail API.
    authorize(JSON.parse(content), listMessages);
  });
}

execute(); //точка вхождения 

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
  fs.readFile(TOKEN_PATH, function (err, token) {
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
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
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

var messageCounter = 0;
var attachCounter = 0;

/**
 * Lists and stores an array of message id's to var."messages" in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listMessages(auth) { //gets an array [ { id: '', threadId: ''}, {...} ]
  var gmail = google.gmail('v1');
  gmail.users.messages.list({ // returns messages [{id:'',threadId:''},{...}] + resultSizeEstimate
    auth: auth,
    userId: 'me',
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var messages = response.messages; // array [{id:'',threadId:''},{...}] 
    if (messages.length === 0) {
      console.log('No messages found.');
    } else {
      console.log('Messages:');
      console.log(messages);
      console.log('');
      for (var i = 0; i < messages.length; i++) {
        getMessage(auth, messages[i].id); // тут был вызов через authorize
      }
    }
  });
}

function getMessage(auth, messageID) {
  var gmail = google.gmail('v1');
  gmail.users.messages.get({
    auth: auth,
    userId: 'me',
    id: messageID
  }, listAttachments.bind(this, auth));
}

function listAttachments(auth, err, message) {
  if (err) {
    console.log('The API returned an error: ' + err);
    return;
  }
  // console.log(message.id + ': ' + message.labelIds);
  if (message.payload.parts) {
    var parts = message.payload.parts;
    // console.log(parts);
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (part.filename && part.filename.length > 0 && part.body.size > 0) {
        getAttachment(auth, part, message.id);
      }
    }
  }
}

function getAttachment(auth, part, messageID) {
  var gmail = google.gmail('v1');
  var attachID = part.body.attachmentId;
  gmail.users.messages.attachments.get({
    auth: auth,
    'id': attachID,
    'messageId': messageID,
    'userId': 'me'
  }, function (err, response) {
    console.log('айди сообщения ' + messageID);
    // console.log('имя файла ' + part.filename);
    // console.log('маймтайп ' + part.mimeType);
    // console.log('айди аттача ' + attachID);
    // console.log('размер аттача ' + response.size);
    // var dataToEncode = response.data;
    // // var attachment = new Buffer(dataToEncode, 'base64').toString("ascii"); 
    var attachment = new Buffer(response.data, 'base64');
    // // var attachment = Buffer.from(dataToEncode, 'base64'); // Node.js v6.0.0

    fs.writeFile(ATTCH_DIR + part.filename, attachment);
    attachCounter++;
    console.log('Аттачей обработано: ' + attachCounter);
    console.log('');
  });

}

function storeAttachment(file) {
  try {
    fs.mkdirSync(ATTCH_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  // var dataToEncode = response.data;
  // // var attachment = new Buffer(dataToEncode, 'base64').toString("ascii"); 
  var attachment = new Buffer(response.data, 'base64');
  // // var attachment = Buffer.from(dataToEncode, 'base64'); // Node.js v6.0.0

  fs.writeFile(ATTCH_DIR + part.filename, attachment);

  // console.log('Name of file to store: ' + file.filename);
  // fs.writeFile(ATTCH_DIR + file.filename, file.data);
  fs.writeFile(ATTCH_DIR + 'file.txt', file);

  console.log('Attachment stored to ' + ATTCH_DIR);
}




// alexpyrielnodejs@gmail.com - email used for testing purposes