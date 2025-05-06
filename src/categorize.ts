import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Path to messages.json file
const messagesFilePath = join(__dirname, 'messages.json');

// Configuration options
const config = {
  // Set to true to delete records that only have location categories
  deleteLocationOnlyRecords: false
};

// Category rules
interface CategoryRule {
  category: string;
  keywords: string[];
}

// Chat name category rules
const chatRules: CategoryRule[] = [
  { category: 'Thailand, Phangan', keywords: ['phangan', 'phng', 'pangan'] },
  { category: 'Thailand, Phuket', keywords: ['phuket'] },
  { category: 'Thailand, Pattaya', keywords: ['pattaya'] },
  { category: 'Thailand, Bangkok', keywords: ['bkk', 'bangkok'] },
  { category: 'Thailand, Chiangmai', keywords: ['cnx', 'chiangmai'] },
  { category: 'Thailand, Samui', keywords: ['samui'] }
];

// Message content category rules
const messageRules: CategoryRule[] = [
  { category: 'Transport, Cars', keywords: ['машина', 'машину', 'автомобиль'] },
  { category: 'Transport, Bikes', keywords: ['байк', 'мотоцикл', 'мотик', 'мопед'] },
  { category: 'Transport', keywords: ['машина', 'машину', 'автомобиль', 'байк', 'мотоцикл', 'мотик', 'мопед'] },
  { category: 'Education, English', keywords: ['английского', 'английский', 'англ'] },
  { category: 'Education', keywords: ['обучение', 'обучаем', 'расскажем', 'покажем'] },
  { category: 'Event', keywords: ['туса', 'мероприятие', 'конференция', 'тусовка', 'вечеринка', 'DJ', 'концерт', 'клуб'] },
  { category: 'Sell', keywords: ['продам', 'продаю'] },
  { category: 'Cosmetology', keywords: ['красоты', 'красота', 'косметология', 'косметолог', 'косметолога', 'массаж', 'уход', 'маникюр', 'педикюр', 'маник', 'ноготочки'] },
  { category: 'Housing', keywords: ['отель', 'отеле', 'вилла', 'виллу', 'хостел', 'хостеле', 'дом', 'апартаменты', 'квартира', 'жилье'] },
  { category: 'Smoking', keywords: ['cannabis', 'каннабис', 'кальян', 'табак', 'табакам', 'трава', 'стрейны', 'стрейнов', 'стрейна', 'снюс', 'жевательный'] },
  { category: 'Rent', keywords: ['сдам', 'аренда', 'арендную', 'арендую'] },
  { category: 'Job', keywords: ['работу', 'работу', 'заработок', 'зарабатывать', 'прайс', 'плата'] }
];

// Location categories for filtering
const locationCategories = [
  'Thailand',
  'Thailand, Phangan',
  'Thailand, Phuket',
  'Thailand, Pattaya',
  'Thailand, Bangkok',
  'Thailand, Chiangmai',
  'Thailand, Samui'
];

// Helper function to check if a string contains any of the keywords
function containsKeyword(text: string, keywords: string[]): boolean {
  const lowerCaseText = text.toLowerCase();
  return keywords.some(keyword => lowerCaseText.includes(keyword.toLowerCase()));
}

// Helper function to check if a category array only contains location categories
function hasOnlyLocationCategories(categoryArray: string[]): boolean {
  return categoryArray.every(category => 
    locationCategories.includes(category) || category.startsWith('Thailand')
  );
}

// Process command line arguments
function processArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--delete-location-only')) {
    config.deleteLocationOnlyRecords = true;
    console.log('Option enabled: Records with only location categories will be deleted');
  }
}

// Main categorization function
function categorizeMessages() {
  try {
    // Process command line arguments
    processArgs();
    
    // Read messages.json
    const messagesData = readFileSync(messagesFilePath, 'utf-8');
    const messages = JSON.parse(messagesData);
    
    let categorizedCount = 0;
    let deletedCount = 0;
    const filteredMessages = [];

    // Process each message
    for (const message of messages) {
      const categories: string[] = [];
      
      // Check chat name against chat rules
      chatRules.forEach(rule => {
        if (containsKeyword(message.source_chat, rule.keywords)) {
          categories.push(rule.category);
        }
      });
      
      // Check message content against message rules
      if (message.message) {
        messageRules.forEach(rule => {
          if (containsKeyword(message.message, rule.keywords)) {
            categories.push(rule.category);
          }
        });
      }
      
      // Update message with categories (comma-separated)
      if (categories.length > 0) {
        message.category = categories.join(', ');
        categorizedCount++;
        
        // Check if we should delete this record based on categories
        if (config.deleteLocationOnlyRecords && hasOnlyLocationCategories(categories)) {
          deletedCount++;
          // Skip adding to filteredMessages to effectively delete it
        } else {
          filteredMessages.push(message);
        }
      } else {
        // No categories found, keep the message as is
        filteredMessages.push(message);
      }
    }
    
    // Write back to messages.json
    const messagesToWrite = config.deleteLocationOnlyRecords ? filteredMessages : messages;
    writeFileSync(messagesFilePath, JSON.stringify(messagesToWrite, null, 2));
    
    console.log(`Categorization complete. Added categories to ${categorizedCount} messages.`);
    if (config.deleteLocationOnlyRecords) {
      console.log(`Deleted ${deletedCount} messages that only had location categories.`);
      console.log(`${messagesToWrite.length} messages remaining in the file.`);
    }
    
  } catch (error) {
    console.error('Error categorizing messages:', error);
  }
}

// Run the categorization
categorizeMessages(); 