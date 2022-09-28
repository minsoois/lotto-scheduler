import * as dotenv from "dotenv";
dotenv.config();

const DEFAULT_PURCHASE_QUANTITY = 5;

const config = {
  userId: process.env.USER_ID,
  userPassword: process.env.USER_PASSWORD,
  purchaseQuantity: process.env.PURCHASE_QUANTITY
    ? parseInt(process.env.PURCHASE_QUANTITY) > DEFAULT_PURCHASE_QUANTITY
      ? DEFAULT_PURCHASE_QUANTITY
      : parseInt(process.env.PURCHASE_QUANTITY)
    : DEFAULT_PURCHASE_QUANTITY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
};

export default config;
