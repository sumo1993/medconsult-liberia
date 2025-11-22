'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, MessageSquare, Mail, Phone, BookOpen } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function ClientHelpPage() {
  const router = useRouter();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqs: FAQ[] = [
    {
      category: 'Getting Started',
      question: 'How do I submit my first assignment?',
      answer: 'To submit an assignment, go to your dashboard and click on "Request Assignment Help". Fill in the assignment details, upload any relevant files, and submit. A consultant will review and provide feedback.'
    },
    {
      category: 'Getting Started',
      question: 'How do I complete my profile?',
      answer: 'Click on your profile avatar in the top right corner, then select "Profile". Fill in all the required fields including your personal information, educational background, and contact details.'
    },
    {
      category: 'Assignments',
      question: 'How long does it take to get feedback?',
      answer: 'Typically, consultants review assignments within 24-48 hours. You will receive a notification when feedback is available. Complex assignments may take longer.'
    },
    {
      category: 'Assignments',
      question: 'Can I resubmit an assignment?',
      answer: 'Yes, if you need to make changes or provide additional information, you can send messages to the consultant through the assignment page. For major revisions, you may need to submit a new assignment request.'
    },
    {
      category: 'Assignments',
      question: 'What file formats are supported?',
      answer: 'We support PDF, DOC, DOCX, JPG, PNG, and other common document and image formats. Maximum file size is 10MB per file.'
    },
    {
      category: 'Payments',
      question: 'How do I make a payment?',
      answer: 'Once a consultant reviews your assignment and provides a quote, you will receive a notification. You can then upload your payment receipt through the assignment page. Accepted payment methods include Mobile Money, Bank Transfer, and other local payment options.'
    },
    {
      category: 'Payments',
      question: 'Is my payment information secure?',
      answer: 'Yes, we take security seriously. Payment receipts are encrypted and stored securely. We never store sensitive payment card information on our servers.'
    },
    {
      category: 'Payments',
      question: 'Can I get a refund?',
      answer: 'Refund policies depend on the specific circumstances. Please contact support with your payment details and reason for the refund request. We will review each case individually.'
    },
    {
      category: 'Communication',
      question: 'How do I contact my assigned consultant?',
      answer: 'You can communicate with your consultant through the messaging system on your assignment page. Click on the assignment to view details and send messages.'
    },
    {
      category: 'Communication',
      question: 'Will I receive notifications?',
      answer: 'Yes, you will receive notifications for new messages, feedback, and important updates. Make sure to enable notifications in your browser settings.'
    },
    {
      category: 'Account',
      question: 'How do I change my password?',
      answer: 'Go to your Profile page and scroll to the "Change Password" section. Enter your current password and your new password, then click "Change Password".'
    },
    {
      category: 'Account',
      question: 'How do I update my email address?',
      answer: 'Go to your Profile page and scroll to the "Change Email" section. Enter your new email address and your current password for verification, then click "Change Email".'
    },
    {
      category: 'Research',
      question: 'How can I access research materials?',
      answer: 'Visit the Research Library from your dashboard to browse available research posts, articles, and study materials shared by consultants and administrators.'
    },
    {
      category: 'Technical',
      question: 'What browsers are supported?',
      answer: 'We support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, please keep your browser updated.'
    },
    {
      category: 'Technical',
      question: 'I\'m having trouble uploading files. What should I do?',
      answer: 'Make sure your file is under 10MB and in a supported format. Try using a different browser or clearing your browser cache. If the problem persists, contact support.'
    }
  ];

  const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              <p className="text-sm text-gray-600">Find answers to common questions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600 mb-3">Chat with our support team</p>
            <button 
              onClick={() => router.push('/dashboard/client/inbox')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Start Chat
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 mb-3">Get help via email</p>
            <a href="mailto:support@medconsult.com" className="text-green-600 hover:text-green-700 text-sm font-medium">
              Send Email
            </a>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="text-purple-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
            <p className="text-sm text-gray-600 mb-3">Browse user guides</p>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View Docs
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="text-emerald-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <span className="text-xs text-emerald-600 font-semibold mb-1 block">
                      {faq.category}
                    </span>
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                  </div>
                  {openFAQ === index ? (
                    <ChevronUp className="text-gray-400 flex-shrink-0 ml-4" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-400 flex-shrink-0 ml-4" size={20} />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-600">No FAQs found in this category.</p>
            </div>
          )}
        </div>

        {/* Still Need Help */}
        <div className="mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
          <p className="mb-6 text-emerald-100">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/dashboard/client/inbox')}
              className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Contact Support
            </button>
            <button
              onClick={() => router.push('/dashboard/client')}
              className="bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
