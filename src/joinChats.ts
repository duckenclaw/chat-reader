import * as dotenv from 'dotenv';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load env variables
dotenv.config();

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH!;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION_KEY || '');
const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER!;

const chatsFilePath = join(__dirname, 'chats.txt');

const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  console.log(`Waiting ${delay / 1000}s before next join...`);
  return new Promise(resolve => setTimeout(resolve, delay));
};

const sleep = (seconds: number) => new Promise(res => setTimeout(res, seconds * 1000));

async function main() {
  console.log('Starting Telegram client...');

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => phoneNumber,
    phoneCode: async () => {
      console.log('Please enter the code you received:');
      return await new Promise<string>((resolve) => {
        process.stdin.once('data', (data) => resolve(data.toString().trim()));
      });
    },
    onError: (err) => console.error('Error during authentication:', err),
  });

  console.log('Client authenticated.');
  console.log('Session string:', client.session.save());

  // Read chat usernames/links from file
  const chatLines = readFileSync(chatsFilePath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  for (const chat of chatLines) {
    try {
      await randomDelay(1, 10);

      const chatIdentifier = chat.startsWith('https://t.me/')
        ? chat.replace('https://t.me/', '')
        : chat;

      console.log(`Attempting to join: ${chatIdentifier}`);

      const result = await client.invoke(
        new Api.channels.JoinChannel({
          channel: chatIdentifier,
        })
      );

      console.log(`Successfully joined: ${chatIdentifier}`);
    } catch (error: any) {
        const errorMessage = error.message || '';
        const match = errorMessage.match(/A wait of (\d+) seconds is required/);
  
        if (match) {
          const waitSeconds = parseInt(match[1], 10);
          console.warn(`⏳ Rate-limited. Waiting for ${waitSeconds} seconds...`);
          await sleep(waitSeconds);
          console.log('Resuming...');
          continue;
        }
  
        console.error(`❌ Failed to join ${chat}:`, errorMessage);
      }
  }

  console.log('Finished processing all chats.');
  await client.disconnect();
}

main();
