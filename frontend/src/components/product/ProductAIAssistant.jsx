import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from '@/utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProductAIAssistant = ({ product }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error(t('product.aiAssistant.enterQuestion'));
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/ai/product-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          productId: product?._id,
          productName: product?.name,
          productDescription: product?.description || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('product.aiAssistant.failedResponse'));
      }

      // Add to conversation
      setConversation(prev => [
        ...prev,
        { type: 'user', text: question },
        { type: 'ai', text: data.data?.answer || data.answer || t('product.aiAssistant.noResponse') }
      ]);

      setQuestion('');
      toast.success(t('product.aiAssistant.answerReceived'));
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error(error.message || t('product.aiAssistant.failedRetry'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      background: 'var(--wp-card-bg, #fff)',
      border: '1px solid var(--wp-border, #e5eae6)',
      borderRadius: 8,
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--wp-text, #1a1a1a)',
        marginBottom: 12,
      }}>
        {t('product.aiAssistant.title')}
      </div>
      
      <p style={{
        fontSize: 12,
        color: 'var(--wp-muted, #76889a)',
        marginBottom: 16,
        lineHeight: 1.4,
      }}>
        {t('product.aiAssistant.subtitle')}
      </p>

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div style={{
          marginBottom: 16,
          maxHeight: 200,
          overflowY: 'auto',
          padding: '8px 0',
          borderTop: '1px solid var(--wp-border, #e5eae6)',
          borderBottom: '1px solid var(--wp-border, #e5eae6)',
        }}>
          {conversation.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: msg.type === 'user' 
                  ? 'var(--wp-primary, #1b5e35)' 
                  : 'var(--wp-bg, #f6f7f8)',
                color: msg.type === 'user' ? '#fff' : 'var(--wp-text, #1a1a1a)',
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                marginBottom: 4,
                opacity: 0.8,
                textTransform: 'uppercase',
              }}>
                {msg.type === 'user' ? t('product.aiAssistant.you') : t('product.aiAssistant.pesaAi')}
              </div>
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Question Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('product.aiAssistant.placeholder')}
            style={{
              width: '100%',
              minHeight: 80,
              padding: 12,
              border: '1px solid var(--wp-border, #e5eae6)',
              borderRadius: 6,
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical',
              background: 'var(--wp-bg, #f6f7f8)',
              color: 'var(--wp-text, #1a1a1a)',
            }}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            ...(question.trim() ? {
              background: 'var(--wp-primary, #1b5e35)',
              color: 'var(--wp-accent, #a8ffca)',
              border: 'none',
              textShadow: '0 0 12px rgba(168,255,202,0.8)',
            } : {
              background: '#fff',
              color: 'var(--wp-primary, #1b5e35)',
              border: '2px solid var(--wp-primary, #1b5e35)',
              textShadow: 'none',
            }),
          }}
          onMouseOver={(e) => {
            if (!isLoading && question.trim()) {
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(168,255,202,0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ 
                display: 'inline-block',
                width: 12,
                height: 12,
                border: '2px solid #fff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></span>
              Thinking...
            </span>
          ) : (
            t('product.aiAssistant.button')
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProductAIAssistant;
