// src/services/whatsapp.js

/**
 * WhatsApp Notification Service
 * Uses WhatsApp Cloud API (Meta)
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */

const axios = require("axios");

async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    // ⚠️ Requires these in .env:
    // WHATSAPP_PHONE_NUMBER_ID=
    // WHATSAPP_TOKEN=

    const url = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      text: {
        body: message,
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });

    console.log("✅ WhatsApp message sent:", response.data);
    return true;
  } catch (err) {
    console.error("❌ WhatsApp messaging failed:", err.response?.data || err);
    return false;
  }
}

module.exports = { sendWhatsAppMessage };