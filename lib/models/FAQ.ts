import mongoose, { Schema, Document } from 'mongoose';

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  product?: string;
  tags: string[];
  priority: number;
  isActive: boolean;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>({
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

// Index for better search performance
FAQSchema.index({ question: 'text', answer: 'text', tags: 'text' });
FAQSchema.index({ category: 1, product: 1, isActive: 1 });
FAQSchema.index({ order: 1, priority: -1 });

export default mongoose.models.FAQ || mongoose.model<IFAQ>('FAQ', FAQSchema);