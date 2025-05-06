# Telegram Chat Reader

A TypeScript script that reads message history from Telegram chats and saves the data to a JSON file.

## Prerequisites

- Node.js (v12 or higher)
- Telegram API credentials (API ID and API Hash)

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following contents:
   ```
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash
   TELEGRAM_SESSION_KEY=
   TELEGRAM_PHONE_NUMBER=+1234567890
   ```
   
   - Get your API ID and API Hash from [https://my.telegram.org/apps](https://my.telegram.org/apps)
   - Leave the SESSION_KEY empty for the first run
   - Enter your phone number with country code

## Usage

1. Ensure the list of chats to read is in `src/chats.txt` (one chat username per line)
2. Run the script:
   ```
   npx ts-node src/index.ts
   ```
3. On first run, you'll be prompted to enter the verification code sent to your Telegram account
4. After successful authentication, the script will:
   - Display your session key (save this to your .env file for future runs)
   - Read messages from each chat with a random delay of 3-10 seconds between chats
   - Save the messages to `src/messages.json`

## Data Format

The script saves message data in the following format:

```json
{
  "username": "user_id",
  "message": "message content",
  "timestamp": 1234567890,
  "source_chat": "chat_username",
  "category": ""
}
```

## Notes

- The script includes a random delay of 3-10 seconds between reading each chat to avoid rate limiting
- The message history is limited to 100 messages per chat by default (adjust in the code if needed)