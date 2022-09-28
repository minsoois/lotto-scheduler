import { Telegraf } from "telegraf";
import { InputFile } from "telegraf/typings/core/types/typegram";
import config from "./config.js";

export const enum NotificationType {
  Message = "message",
  Image = "image",
}

type SendMessageNotification = {
  chatId?: string;
  type: NotificationType.Message;
  payload: string;
};

type SendImageNotification = {
  chatId?: string;
  type: NotificationType.Image;
  payload: string | InputFile;
};

type SendNotification = SendMessageNotification | SendImageNotification;

export const bot = config.telegramBotToken
  ? new Telegraf(config.telegramBotToken)
  : null;

export const hasTelegramBot = bot ? true : false;

if (bot) {
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

export const sendNotification = async ({
  type,
  chatId,
  payload,
}: SendNotification) => {
  if (!bot || !chatId) return;

  switch (type) {
    case NotificationType.Message:
      await bot?.telegram.sendMessage(chatId, payload);
      break;

    case NotificationType.Image:
      await bot?.telegram.sendPhoto(chatId, payload);
      break;

    default:
      break;
  }
};
