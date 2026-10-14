// =====================================================
//  PlayWorld — Telegram Bot
// =====================================================

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// ===== Firebase Init =====
const serviceAccount = require('./serviceAccountKey.json');
const app = initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

// ===== Bot Init =====
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN مش موجود في .env');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Bot started...');

// ===== /start =====
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Save user in Firestore
  const userRef = db.collection('users').doc(String(userId));
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    await userRef.set({
      userId: userId,
      username: msg.from.username || '',
      firstName: msg.from.first_name || '',
      balance: 1000,
      createdAt: FieldValue.serverTimestamp()
    });
    console.log('✅ New user:', userId);
  }

  // Get user balance
  const userData = (await userRef.get()).data();
  const balance = userData.balance || 0;

  bot.sendMessage(chatId, `أهلاً ${msg.from.first_name}! 👋\n\nرصيدك: ${balance} PW 🪙`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 العب الآن', web_app: { url: 'https://elhawaryibrahim85466.github.io/Play_World/' } }]
      ]
    }
  });
});

// ===== /balance =====
bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const userRef = db.collection('users').doc(String(userId));
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    bot.sendMessage(chatId, '❌ مش مسجل. ابعت /start');
    return;
  }

  const balance = userDoc.data().balance || 0;
  bot.sendMessage(chatId, `💰 رصيدك: ${balance} PW`);
});

// ===== Error Handling =====
bot.on('polling_error', (error) => {
  console.log('⚠️ Polling error:', error.message);
});

process.on('uncaughtException', (err) => {
  console.log('⚠️ Uncaught:', err.message);
});

// ===== Handle web_app_data from Mini App =====
bot.on('message', async (msg) => {
  if (!msg.web_app_data) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;

  let data;
  try {
    data = JSON.parse(msg.web_app_data.data);
  } catch (e) {
    console.log('Invalid web_app_data:', msg.web_app_data.data);
    return;
  }

  if (data.action === 'buy') {
    const PACKAGES_INLINE = {
      small:   { stars: 50,   coins: 100,   name: 'باقة صغيرة' },
      medium:  { stars: 250,  coins: 500,   name: 'باقة متوسطة' },
      large:   { stars: 500,  coins: 1000,  name: 'باقة كبيرة' },
      large2:  { stars: 1250, coins: 2500,  name: 'باقة كبيرة+' },
      vip:     { stars: 2500, coins: 5000,  name: 'باقة VIP' },
      vip2:    { stars: 5000, coins: 10000, name: 'باقة VIP+' }
    };

    const pkg = PACKAGES_INLINE[data.key];
    if (!pkg) return;

    try {
      await bot.sendInvoice(
        chatId,
        pkg.name,
        `احصل على ${pkg.coins} PW`,
        JSON.stringify({ userId: userId, coins: pkg.coins, key: data.key }),
        '',
        'XTR',
        [{ label: pkg.name, amount: pkg.stars }]
      );
    } catch (err) {
      console.log('❌ Invoice error:', err.message);
      bot.sendMessage(chatId, '❌ خطأ في إنشاء الفاتورة: ' + err.message);
    }
  }
});
