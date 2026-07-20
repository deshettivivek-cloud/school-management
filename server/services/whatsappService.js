const fetch = require('node-fetch') || globalThis.fetch;

class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiUrl = `https://graph.facebook.com/v17.0`;
  }

  /**
   * Check if WhatsApp integration is configured
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.token && this.phoneNumberId);
  }

  /**
   * Format phone number to E.164 without the '+' sign for WhatsApp
   * @param {string} phone 
   * @returns {string|null}
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Assuming Indian numbers if 10 digits
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send a template message
   * @param {string} to - Recipient phone number
   * @param {string} templateName - Name of the approved template
   * @param {string} languageCode - Language code (e.g., 'en', 'en_US')
   * @param {Array} components - Template components (header, body parameters)
   * @returns {Promise<Object>}
   */
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    if (!this.isConfigured()) {
      console.warn('WhatsApp is not configured. Missing API token or Phone Number ID.');
      return { success: false, error: 'Not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(to);
    if (!formattedPhone) {
      console.warn('Invalid phone number provided to WhatsApp Service');
      return { success: false, error: 'Invalid phone number' };
    }

    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API Error:', JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || 'Failed to send WhatsApp message');
      }

      return { success: true, data };
    } catch (error) {
      console.error('WhatsApp Service Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a free-form text message (Only works if user messaged within 24 hours)
   * @param {string} to - Recipient phone number
   * @param {string} text - Message body
   * @returns {Promise<Object>}
   */
  async sendTextMessage(to, text) {
    if (!this.isConfigured()) {
      console.warn('WhatsApp is not configured. Missing API token or Phone Number ID.');
      return { success: false, error: 'Not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(to);
    if (!formattedPhone) {
      return { success: false, error: 'Invalid phone number' };
    }

    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API Error:', JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || 'Failed to send WhatsApp text message');
      }

      return { success: true, data };
    } catch (error) {
      console.error('WhatsApp Service Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
