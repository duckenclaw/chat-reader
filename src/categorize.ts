import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Engine, Rule } from 'json-rules-engine';

// Path to messages.json file and rules configuration file
const messagesFilePath = join(__dirname, 'messages.json');
const rulesFilePath = join(__dirname, 'rules-config.json');

// Configuration options
const config = {
  // Set to true to delete records that only have location categories
  deleteLocationOnlyRecords: false
};

// Interface for message objects
interface Message {
  username: string;
  message: string;
  timestamp: number;
  source_chat: string;
  category: string;
}

// Interface for rule configuration
interface RuleConfig {
  name: string;
  category: string;
  keywords: string[];
}

// Interface for rules JSON file structure
interface RulesData {
  locationCategories: string[];
  chatRules: RuleConfig[];
  messageRules: RuleConfig[];
}

// Load rules configuration from file
function loadRulesConfig(): RulesData {
  try {
    const rulesData = readFileSync(rulesFilePath, 'utf-8');
    return JSON.parse(rulesData);
  } catch (error) {
    console.error('Error loading rules configuration:', error);
    process.exit(1);
  }
}

// Rules data
const rulesData = loadRulesConfig();
const locationCategories = rulesData.locationCategories;

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

// Create rules engine with custom operator
function createRulesEngine() {
  const engine = new Engine();
  
  // Custom substring matcher for better text matching
  engine.addOperator('includesText', (factValue: string, keyword: string) => {
    return typeof factValue === 'string' && factValue.toLowerCase().includes(keyword.toLowerCase());
  });
  
  // Add chat rules
  rulesData.chatRules.forEach(rule => {
    const conditions = {
      any: rule.keywords.map(keyword => ({
        fact: 'source_chat',
        operator: 'includesText',
        value: keyword
      }))
    };
    
    engine.addRule(new Rule({
      name: rule.name,
      conditions,
      event: { type: 'category', params: { category: rule.category } }
    }));
  });
  
  // Add message rules
  rulesData.messageRules.forEach(rule => {
    const conditions = {
      any: rule.keywords.map(keyword => ({
        fact: 'message',
        operator: 'includesText',
        value: keyword
      }))
    };
    
    engine.addRule(new Rule({
      name: rule.name,
      conditions,
      event: { type: 'category', params: { category: rule.category } }
    }));
  });

  return engine;
}

// Main categorization function
async function categorizeMessages() {
  try {
    // Process command line arguments
    processArgs();
    
    // Read messages.json
    console.log(`Reading messages from ${messagesFilePath}...`);
    const messagesData = readFileSync(messagesFilePath, 'utf-8');
    const messages: Message[] = JSON.parse(messagesData);
    console.log(`Loaded ${messages.length} messages.`);
    
    // Create rules engine with custom operator
    console.log(`Loading rules from ${rulesFilePath}...`);
    const engine = createRulesEngine();
    console.log(`Loaded ${rulesData.chatRules.length} chat rules and ${rulesData.messageRules.length} message content rules.`);
    
    let categorizedCount = 0;
    let deletedCount = 0;
    const filteredMessages: Message[] = [];
    
    // Process each message
    console.log('Processing messages...');
    for (const message of messages) {
      // Prepare facts for rules engine - lowercase everything for consistent matching
      const facts = {
        source_chat: (message.source_chat || '').toLowerCase(),
        message: (message.message || '').toLowerCase()
      };
      
      // Run rules engine
      const results = await engine.run(facts);
      
      // Extract categories from results
      const categories: string[] = [];
      results.events.forEach(event => {
        if (event.type === 'category') {
          categories.push(event.params?.category);
        }
      });
      
      // Remove duplicates from categories
      const uniqueCategories = [...new Set(categories)];
      
      // Update message with categories (comma-separated)
      if (uniqueCategories.length > 0) {
        message.category = uniqueCategories.join(', ');
        categorizedCount++;
        
        // Check if we should delete this record based on categories
        if (config.deleteLocationOnlyRecords && hasOnlyLocationCategories(uniqueCategories)) {
          deletedCount++;
          // Skip adding to filteredMessages to effectively delete it
        } else {
          filteredMessages.push(message);
        }
      } else {
        // No categories found, keep the message as is
        message.category = '';
        filteredMessages.push(message);
      }
    }
    
    // Write back to messages.json
    const messagesToWrite = config.deleteLocationOnlyRecords ? filteredMessages : messages;
    writeFileSync(messagesFilePath, JSON.stringify(messagesToWrite, null, 2));
    
    console.log(`Categorization complete. Added categories to ${categorizedCount} messages.`);
    if (config.deleteLocationOnlyRecords) {
      console.log(`Deleted ${deletedCount} messages that only had location categories.`);
    }
    console.log(`${messagesToWrite.length} messages remaining in the file.`);
    
  } catch (error) {
    console.error('Error categorizing messages:', error);
  }
}

// Run the categorization
categorizeMessages();