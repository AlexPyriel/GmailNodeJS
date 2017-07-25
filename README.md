# GmailNodeJS

This is simple NodeJS script, that connects to Gmail inbox, fetches the inbox emails (based on query parameter) and downloads attachments to hard drive.
Directory for downloaded files as well as  the query parameters are set up in config file.

Step 1: Turn on the Gmail API

Use this wizard (https://console.developers.google.com/flows/enableapi?apiid=gmail) to create or select a project in the Google Developers Console and automatically turn on the API. Click Continue, then Go to credentials.
At the top of the page, select the OAuth consent screen tab. Select an Email address, enter a Product name if not already set, and click the Save button.
Select the Credentials tab, click the Create credentials button and select OAuth client ID.
Select the application type Other, enter the name "Gmail API Quickstart", and click the Create button.
Click OK to dismiss the resulting dialog.
Click the file_download (Download JSON) button to the right of the client ID.
Move this file to your working directory and rename it client_secret.json.

Step 2: Install the dependencies

Run the following commands to install the libraries using npm:
npm install

Step 3: Execute 'node app.js'
