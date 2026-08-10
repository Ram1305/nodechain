const mongoose = require('mongoose');
const { nextId } = require('../utils/ids');

const faqSchema = new mongoose.Schema(
  {
    id: { type: Number },
    faqs_type_id: { type: Number },
    question: { type: String, default: '' },
    answer: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const faqCategorySchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true, index: true },
    title: { type: String, default: '' },
    is_deleted: { type: Number, default: 0 },
    faqs: [faqSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

faqCategorySchema.pre('save', async function () {
  if (this.isNew && !this.id) {
    this.id = await nextId('faqCategory');
  }
  this.updated_at = new Date();
});

module.exports = mongoose.model('FaqCategory', faqCategorySchema);
