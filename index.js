const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 KONEK KE FIREBASE PAKAI SERVICE ACCOUNT
// Nanti lo ganti pake Environment Variable di Render
const serviceAccount = {
  project_id: "qris-pay-notif",
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 📨 ENDPOINT KIRIM NOTIFIKASI
app.post('/send-notification', async (req, res) => {
  const { merchantToken, amount, merchantName } = req.body;

  if (!merchantToken || !amount) {
    return res.status(400).json({ error: 'merchantToken dan amount wajib' });
  }

  const message = {
    token: merchantToken,
    notification: {
      title: '💵 Pembayaran Masuk!',
      body: `Rp${new Intl.NumberFormat('id-ID').format(amount)} dari ${merchantName || 'QRIS Payment'}`,
    },
    data: {
      amount: amount.toString(),
      type: 'payment_received',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'merchant_payment_channel',
        priority: 'high',
        sound: 'default',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('❌ FCM Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🏠 HOME PAGE buat cek server hidup
app.get('/', (req, res) => {
  res.json({ status: '🚀 Server QRIS Payment berjalan!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server jalan di port ${PORT}`));