import * as dotenv from 'dotenv';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

// Required Telegram credentials from .env
const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH!;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION_KEY || '');
const phoneNumber = process.env.TELEGRAM_PHONE_NUMBER!;

const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  console.log(`Waiting for ${delay / 1000} seconds...`);
  return new Promise(resolve => setTimeout(resolve, delay));
};

async function main() {
    console.log('Starting Telegram client...');
    
    // Initialize the client
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });
  
     // Start client session
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
  
    console.log('Client started successfully!');
    
    // Save the session for future use
    console.log('Session string:', client.session.save());

  const dialogs = await client.getDialogs({});

  for (const dialog of dialogs) {
    const entity = dialog.entity;
    if (
      entity instanceof Api.Chat ||
      entity instanceof Api.Channel ||
      entity instanceof Api.ChatForbidden ||
      entity instanceof Api.ChannelForbidden
    ) {
      try {
        await randomDelay(3, 10);
      
        // Get chat entity
        const entity = dialog.entity;
        
        const result = await client.invoke(
          new Api.channels.LeaveChannel({
            channel: entity,
          })
        );
        console.log(result); // prints the result
      } catch (error) {
        console.error(`Error processing chat @${dialog}:`, error);
      }
    } 
  }

  console.log("Finished leaving all chats/channels.");
  await client.disconnect();
}

main();