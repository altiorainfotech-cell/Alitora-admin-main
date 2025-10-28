#!/usr/bin/env node

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://altiora:Altiora%40123@altiora.2vbkmol.mongodb.net/?retryWrites=true&w=majority&appName=Altiora';

// Contact Message Schema (matching the model)
const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },
  countryCode: { type: String, required: false, trim: true, maxlength: 10 },
  phoneNumber: { type: String, required: false, trim: true, maxlength: 20 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, required: true, enum: ['unread', 'read', 'replied'], default: 'unread' }
}, {
  timestamps: true,
  collection: 'contactmessages'
});

async function debugContactStorage() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const ContactMessage = mongoose.model('ContactMessage', ContactMessageSchema);

    // Get the most recent messages
    console.log('📋 Fetching recent contact messages...');
    const messages = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    console.log(`Found ${messages.length} recent messages:\n`);

    messages.forEach((msg, index) => {
      console.log(`${index + 1}. Message ID: ${msg._id}`);
      console.log(`   Name: ${msg.name}`);
      console.log(`   Email: ${msg.email}`);
      console.log(`   Country Code: ${msg.countryCode || 'NOT SET'}`);
      console.log(`   Phone Number: ${msg.phoneNumber || 'NOT SET'}`);
      console.log(`   Message: ${msg.message.substring(0, 50)}...`);
      console.log(`   Status: ${msg.status}`);
      console.log(`   Created: ${msg.createdAt}`);
      console.log('---\n');
    });

    // Test creating a new message with phone data
    console.log('🧪 Testing direct database insertion with phone data...');
    const testMessage = new ContactMessage({
      name: 'Direct DB Test',
      email: 'dbtest@example.com',
      countryCode: '+91',
      phoneNumber: '9876543210',
      message: 'This is a direct database test with phone number',
      status: 'unread'
    });

    const savedMessage = await testMessage.save();
    console.log('✅ Successfully saved message with phone data:');
    console.log('   ID:', savedMessage._id);
    console.log('   Country Code:', savedMessage.countryCode);
    console.log('   Phone Number:', savedMessage.phoneNumber);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugContactStorage();