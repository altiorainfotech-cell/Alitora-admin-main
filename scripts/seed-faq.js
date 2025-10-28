const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// FAQ Schema
const FAQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['services', 'process', 'technical', 'pricing', 'support', 'general'],
    default: 'general'
  },
  product: {
    type: String,
    enum: ['web2', 'web3', 'ai-ml', 'depin', 'rwa', 'gamify', 'all'],
    default: 'all'
  },
  tags: [{ type: String }],
  priority: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  icon: { type: String },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

const FAQ = mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);

const seedFAQs = [
  {
    question: "What services does Altiora provide?",
    answer: "We offer comprehensive technology solutions including AI/ML development, Web2 application development, Web3 blockchain services, DevOps consulting, UI/UX design, and custom software development across various industries.",
    category: "services",
    product: "all",
    tags: ["services", "development", "consulting", "AI/ML", "Web2", "Web3", "DevOps", "UI/UX"],
    priority: 10,
    isActive: true,
    icon: "Code",
    order: 1
  },
  {
    question: "What technologies do you specialize in?",
    answer: "Our expertise spans modern web technologies (React, Next.js, Node.js), AI frameworks (TensorFlow, PyTorch), blockchain platforms (Ethereum, Solana), cloud services (AWS, GCP), and databases (MongoDB, PostgreSQL).",
    category: "services",
    product: "all",
    tags: ["technology", "React", "Next.js", "Node.js", "TensorFlow", "PyTorch", "Ethereum", "Solana", "AWS", "GCP", "MongoDB", "PostgreSQL"],
    priority: 9,
    isActive: true,
    icon: "Zap",
    order: 2
  },
  {
    question: "How do you ensure project security and quality?",
    answer: "We implement rigorous security practices, conduct thorough testing (unit, integration, and security audits), follow industry best practices, and maintain high code quality standards with automated CI/CD pipelines.",
    category: "process",
    product: "all",
    tags: ["security", "quality", "testing", "unit testing", "integration", "security audits", "CI/CD", "best practices"],
    priority: 8,
    isActive: true,
    icon: "Shield",
    order: 3
  },
  {
    question: "How do you collaborate with clients?",
    answer: "We follow an agile methodology, working closely with clients through regular communication, sprint reviews, and iterative development. Our team ensures transparency and alignment with your vision throughout the project lifecycle.",
    category: "process",
    product: "all",
    tags: ["collaboration", "agile", "communication", "sprint reviews", "iterative development", "transparency", "project lifecycle"],
    priority: 7,
    isActive: true,
    icon: "Users",
    order: 4
  },
  {
    question: "What is the typical timeline for a project?",
    answer: "Project timelines vary based on complexity and scope. We provide detailed estimates during consultation, with most projects ranging from 4-12 weeks. Clear milestones and regular progress updates keep you informed.",
    category: "process",
    product: "all",
    tags: ["timeline", "project", "planning", "estimates", "consultation", "milestones", "progress updates"],
    priority: 6,
    isActive: true,
    icon: "Clock",
    order: 5
  },
  {
    question: "Do you offer post-launch support?",
    answer: "Yes, we provide comprehensive post-launch support including maintenance, performance monitoring, bug fixes, feature updates, and technical assistance to ensure your solution continues to perform optimally.",
    category: "support",
    product: "all",
    tags: ["support", "maintenance", "monitoring", "bug fixes", "feature updates", "technical assistance", "post-launch"],
    priority: 5,
    isActive: true,
    icon: "Headphones",
    order: 6
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log('Cleared existing FAQs');

    // Insert seed data
    await FAQ.insertMany(seedFAQs);
    console.log(`Seeded ${seedFAQs.length} FAQs successfully`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();