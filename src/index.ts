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

// Path to the files
const chatsFilePath = join(__dirname, 'chats.txt');
const messagesFilePath = join(__dirname, 'messages.json');

// Function to generate random delay between min and max seconds
const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  console.log(`Waiting for ${delay / 1000} seconds...`);
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Function to read chats from file
const readChatsFromFile = (): string[] => {
  try {
    const content = readFileSync(chatsFilePath, 'utf-8');
    return content.split('\n').filter(chat => chat.trim() !== '');
  } catch (error) {
    console.error('Error reading chats file:', error);
    return [];
  }
};

// Function to read/write messages JSON file
const readMessagesJson = (): any[] => {
  try {
    if (existsSync(messagesFilePath)) {
      const content = readFileSync(messagesFilePath, 'utf-8');
      return content ? JSON.parse(content) : [];
    }
    return [];
  } catch (error) {
    console.error('Error reading messages file:', error);
    return [];
  }
};

const writeMessagesJson = (messages: any[]): void => {
  try {
    writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Error writing messages file:', error);
  }
};

// Main function
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
  
  // Read chats from file
  const chats = readChatsFromFile();
  console.log(`Found ${chats.length} chats to process`);
  
  // Read existing messages
  let messages = readMessagesJson();
  
  // Process each chat
  for (const chat of chats) {
    console.log(`Processing chat: @${chat}`);
    
    try {
      // Random delay between processing chats (3-10 seconds)
      await randomDelay(3, 10);
      
      // Get chat entity
      const entity = await client.getEntity(chat);
      
      // Get chat history
      const result = await client.getMessages(entity, {
        limit: 100 // Adjust as needed
      });
      
      if (result && result.length > 0) {
        console.log(`Retrieved ${result.length} messages from @${chat}`);

        console.log(result)
        
        // Process messages
        for (const msg of result) {
          if (msg.message && msg.message.trim() !== '') {
            const messageData = {
              username: msg.senderId ? msg.senderId.toString() : 'unknown',
              message: msg.message,
              timestamp: msg.date,
              source_chat: chat,
              category: '' // Empty for now as specified
            };
            
            messages.push(messageData);
          }
        }
        
        // Save messages to file after each chat
        writeMessagesJson(messages);
        console.log(`Saved ${result.length} messages from @${chat} to messages.json`);
      }
    } catch (error) {
      console.error(`Error processing chat @${chat}:`, error);
    }
  }
  
  console.log('All chats processed successfully!');
  await client.disconnect();
  console.log('Client disconnected.');
}

// Run the main function
main().catch(console.error); 