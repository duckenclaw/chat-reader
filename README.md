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

### Reading Messages

1. Ensure the list of chats to read is in `src/chats.txt` (one chat username per line)
2. Run the script:
   ```
   npm start
   ```
   Or:
   ```
   npx ts-node src/index.ts
   ```
3. On first run, you'll be prompted to enter the verification code sent to your Telegram account
4. After successful authentication, the script will:
   - Display your session key (save this to your .env file for future runs)
   - Read messages from each chat with a random delay of 3-10 seconds between chats
   - Save the messages to `src/messages.json`

### Categorizing Messages

After collecting messages, you can categorize them based on predefined rules:

1. Run the categorization script:
   ```
   npm run categorize
   ```
   Or:
   ```
   npx ts-node src/categorize.ts
   ```

2. The script will scan all messages in `src/messages.json` and add categories based on:
   - Location categories based on chat names (Thailand, Phangan/Phuket/Pattaya/etc.)
   - Content categories based on message text (Transport, Education, Housing, etc.)

3. Options:
   - To delete messages that only have location categories (no content categories):
     ```
     npm run categorize -- --delete-location-only
     ```
     Or:
     ```
     npx ts-node src/categorize.ts --delete-location-only
     ```
     This will remove records that only have categories like "Thailand" or "Thailand, Phuket" without any content categories.

## Data Format

The script saves message data in the following format:

```json
{
  "username": "user_id",
  "message": "message content",
  "timestamp": 1234567890,
  "source_chat": "chat_username",
  "category": "Thailand, Phangan, Transport, Bikes"
}
```

## Categorization Rules

Messages are categorized based on the following rules:

### Location Categories (based on chat name)
- "Thailand, Phangan": phangan, phng, pangan
- "Thailand, Phuket": phuket
- "Thailand, Pattaya": pattaya
- "Thailand, Bangkok": bkk, bangkok
- "Thailand, Chiangmai": cnx, chiangmai
- "Thailand, Samui": samui

### Content Categories (based on message text)
- "Transport, Cars": машина, машину, автомобиль
- "Transport, Bikes": байк, мотоцикл, мотик, мопед
- "Transport": машина, машину, автомобиль, байк, мотоцикл, мотик, мопед
- "Education, English": английского, английский, англ
- "Education": обучение, обучаем, расскажем, покажем
- "Event": туса, мероприятие, конференция, тусовка, вечеринка, DJ, концерт, клуб
- "Sell": продам, продаю
- "Cosmetology": красоты, красота, косметология, косметолог, косметолога, массаж, уход, маникюр, педикюр, маник, ноготочки
- "Housing": отель, отеле, вилла, виллу, хостел, хостеле, дом, апартаменты, квартира, жилье
- "Smoking": cannabis, каннабис, кальян, табак, табакам, трава, стрейны, стрейнов, стрейна, снюс, жевательный
- "Rent": сдам, аренда, арендную, арендую
- "Job": работу, работу, заработок, зарабатывать, прайс, плата

## Notes

- The script includes a random delay of 3-10 seconds between reading each chat to avoid rate limiting
- The message history is limited to 100 messages per chat by default (adjust in the code if needed)