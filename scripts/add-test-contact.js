const mongoose = require('mongoose');

// Contact Message Schema (matching the model)
const ContactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  firstName: { type: String, required: false, trim: true, maxlength: 50 },
  lastName: { type: String, required: false, trim: true, maxlength: 50 },
  email: { type: String, required: true, trim: true, lowercase: true },
  country: { type: String, required: false, trim: true, maxlength: 100 },
  countryCode: { type: String, required: false, trim: true, maxlength: 10 },
  phoneCode: { type: String, required: false, trim: true, maxlength: 10 },
  phoneNumber: { type: String, required: false, trim: true, maxlength: 20 },
  purpose: { type: String, required: false, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, required: true, enum: ['unread', 'read', 'replied'], default: 'unread' }
}, {
  timestamps: true,
  collection: 'contactmessages'
});

const ContactMessage = mongoose.model('ContactMessage', ContactMessageSchema);

async function addTestContact() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Test data matching your requirements
    const testContact = {
      name: 'Collection Test',
      firstName: 'Collection',
      lastName: 'Test',
      email: 'collection@test.com',
      country: 'United States',
      phoneCode: '+1',
      phoneNumber: '5555555555',
      purpose: 'general',
      message: 'Testing contactmessages collection',
      status: 'unread'
    };

    // Also create a test contact with missing fields to test null handling
    const testContactWithMissingFields = {
      name: 'Minimal Test',
      email: 'minimal@test.com',
      message: 'Testing with minimal fields - no firstName, lastName, country, etc.',
      // status will default to 'unread'
    };

    // Create the contact messages
    const contact = new ContactMessage(testContact);
    await contact.save();

    const minimalContact = new ContactMessage(testContactWithMissingFields);
    await minimalContact.save();

    console.log('✅ Test contact messages created successfully:');
    console.log('Full contact:', {
      id: contact._id,
      name: contact.name,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      country: contact.country,
      phoneCode: contact.phoneCode,
      phoneNumber: contact.phoneNumber,
      purpose: contact.purpose,
      message: contact.message
    });
    
    console.log('Minimal contact:', {
      id: minimalContact._id,
      name: minimalContact.name,
      email: minimalContact.email,
      message: minimalContact.message,
      status: minimalContact.status
    });

  } catch (error) {
    console.error('❌ Error creating test contact:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addTestContact();