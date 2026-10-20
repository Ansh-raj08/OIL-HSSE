import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Chatbot & Intelligent HSSE Assistant',
  description:
    'Interactive conversational AI safety assistant for real-time querying of IOGP 459 standards, statutory rules, and upstream incident historical records.',
};

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
