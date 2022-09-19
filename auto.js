import * as puppeteer from "puppeteer";
import { Telegraf } from "telegraf";
import * as dotenv from "dotenv";
dotenv.config();

const hasTelegramData =
  process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID;
const hasUserData = process.env.USER_ID && process.env.USER_PASSWORD;

const purchaseQuantity = process.env.PURCHASE_QUANTITY > "5" ? "5" : "1";

const bot = hasTelegramData
  ? new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
  : null;

if (bot) {
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

const buyLotto = async (browser) => {
  try {
    browser.on("targetcreated", async (target) => {
      if (target.type() === "page") {
        const newPage = await target.page();
        const url = newPage.url();
        if (url.includes("popup")) {
          await newPage.close();
        }
      }
    });

    const mainPage = await browser.newPage();

    await mainPage.goto(
      "https://dhlottery.co.kr/user.do?method=login&returnUrl=",
      {
        waitUntil: "domcontentloaded",
      }
    );

    // 로또 로그인
    await mainPage.type("#userId", process.env.USER_ID);
    await mainPage.type("input[type=password]", process.env.USER_PASSWORD);
    await mainPage.click(".btn_common.lrg.blu");
    await mainPage.waitForNavigation();

    // 로또 구매 페이지를 켬
    const buyPage = await browser.newPage();
    await buyPage.goto("https://ol.dhlottery.co.kr/olotto/game/game645.do", {
      waitUntil: "domcontentloaded",
    });
    await buyPage.bringToFront();

    try {
      await buyPage.click("#num2");
    } catch (error) {
      const notiText = await buyPage.$eval(
        "#popupLayerAlert > div > div.noti > span",
        (element) => {
          return element.innerHTML;
        }
      );
      await bot?.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, notiText);
      throw error;
    }

    const amoundApplySelector = "#amoundApply";

    // 구매 개수 변경
    await buyPage.select(amoundApplySelector, purchaseQuantity);
    await buyPage.click("#btnSelectNum");

    // 구매버튼 클릭
    await buyPage.click("#btnBuy");

    const buyConfirmButtonSelector =
      "#popupLayerConfirm > div > div.btns > input:nth-child(1)";

    await buyPage.waitForSelector(buyConfirmButtonSelector);

    await buyPage.click(buyConfirmButtonSelector);
    await buyPage.waitForSelector("#popReceipt");

    try {
      const resultPopup = await buyPage.$("#popReceipt");

      if (bot) {
        const lottoReceipt = await resultPopup.screenshot({
          encoding: "base64",
        });
        await bot.telegram.sendPhoto(process.env.TELEGRAM_CHAT_ID, {
          source: Buffer.from(lottoReceipt, "base64"),
        });
      }
    } catch (error) {
      const errorTitle = await buyPage.$eval(
        "div.box > div.head > h2",
        (el) => el.innerText
      );
      if (errorTitle === "구매한도 알림") {
        await bot?.telegram.sendMessage(
          process.env.TELEGRAM_CHAT_ID,
          "주당 5000원의 구매한도가 초과되었습니다."
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const getUserData = async (browser) => {
  if (!browser) return;
  let accountInfo;
  const buyPage = await browser.newPage();
  await buyPage.goto("https://dhlottery.co.kr/userSsl.do?method=myPage", {
    waitUntil: "domcontentloaded",
  });
  await buyPage.bringToFront();

  const totalMoney = await buyPage.$eval(
    "#article > div:nth-child(2) > div > div.box_information > div.box.money > p.total_new > strong",
    (el) => el.innerText
  );

  try {
    accountInfo = await buyPage.$eval(
      "#article > div:nth-child(2) > div > div.box_information > div.box.money > div.total_account_number > table > tbody > tr:nth-child(1) > td",
      (el) => el.innerText
    );
  } catch (error) {}

  await bot?.telegram.sendMessage(
    process.env.TELEGRAM_CHAT_ID,
    `총 예치금 : ${totalMoney}원\n${
      Number.parseInt(totalMoney.replaceAll(",", ""), 10) < 5000 && accountInfo
        ? `예치 계좌번호 : ${accountInfo}`
        : ""
    }`
  );
};

const run = async () => {
  if (!hasUserData) return;
  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--ignore-certificate-errors",
      "--disable-setuid-sandbox",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
    headless: true,
    devtools: false,
  });

  try {
    await buyLotto(browser);
    await getUserData(browser);
  } catch (error) {
    console.error(error);
  }

  await browser.close();
};

run();
