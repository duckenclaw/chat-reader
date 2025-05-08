import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const chatsFilePath = join(__dirname, 'chats.txt');
const messagesFilePath = join(__dirname, 'messages.json');

function main() {
  try {
    const raw = readFileSync(messagesFilePath, 'utf-8');
    let messages: any[];

    try {
      messages = JSON.parse(raw);
      if (!Array.isArray(messages)) throw new Error("JSON is not an array");
    } catch (err) {
      console.error("❌ Failed to parse messages.json:", err.message);
      return;
    }

    const uniqueChats = new Set<string>();
    let skipped = 0;

    for (const [index, msg] of messages.entries()) {
      if (
        msg &&
        typeof msg === 'object' &&
        typeof msg.source_chat === 'string' &&
        msg.source_chat.trim() !== ''
      ) {
        let chat = msg.source_chat.trim();

        // // Normalize to @username if not a link or already @
        // if (!chat.startsWith('@') && !chat.startsWith('https://')) {
        //   chat = `@${chat}`;
        // }

        uniqueChats.add(chat);
      } else {
        console.warn(`⚠️ Skipped invalid entry at index ${index}:`, msg);
        skipped++;
      }
    }

    const sortedChats = Array.from(uniqueChats).sort();
    writeFileSync(chatsFilePath, sortedChats.join('\n'), 'utf-8');

    console.log(`✅ Wrote ${sortedChats.length} unique chats to chats.txt`);
    if (skipped > 0) {
      console.log(`⚠️ Skipped ${skipped} invalid entries`);
    }
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
  }
}

main();
