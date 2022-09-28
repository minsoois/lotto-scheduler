import config from "./utils/config.js";
import { createBrowser } from "./utils/browser.js";
import {
  hasTelegramBot,
  NotificationType,
  sendNotification,
} from "./utils/notification.js";
import { Browser } from "puppeteer";

const hasUserData = config.userId && config.userPassword;

const buyLotto = async (browser: Browser) => {
  if (!config.userId || !config.userPassword) return;

  browser.on("targetcreated", async (target: any) => {
    try {
      if (target.type() === "page") {
        const newPage = await target.page();
        const url = newPage.url();
        if (url.includes("popup")) {
          console.log("url", url);
          setTimeout(async () => {
            await newPage.close();
          }, 2000);
        }
      }
    } catch (error) {}
  });

  const mainPage = await browser.newPage();

  await mainPage.goto(
    "https://dhlottery.co.kr/user.do?method=login&returnUrl=",
    {
      waitUntil: "domcontentloaded",
    }
  );
  mainPage.isClosed();

  // 로또 로그인
  await mainPage.type("#userId", config.userId);
  await mainPage.type("input[type=password]", config.userPassword);
  await mainPage.click(".btn_common.lrg.blu");
  await mainPage.waitForNavigation();

  console.log("로그인 완료");

  // 로또 구매 페이지를 켬
  const buyPage = await browser.newPage();

  await buyPage.goto("https://ol.dhlottery.co.kr/olotto/game/game645.do", {
    waitUntil: "domcontentloaded",
  });
  await buyPage.bringToFront();

  try {
    await buyPage.click("#num2");
  } catch (error) {
    const noticeText = await buyPage.$eval(
      "#popupLayerAlert > div > div.noti > span",
      (el) => (<HTMLElement>el).innerText
    );
    await sendNotification({
      type: NotificationType.Message,
      payload: noticeText,
      chatId: config.telegramChatId,
    });
    throw error;
  }

  console.log("구매페이지 열림");

  const isAlertVisible = await buyPage.$eval(
    "#popupLayerAlert",
    (el) => (<HTMLElement>el).style.display !== "none"
  );
  console.log("isAlertVisible", isAlertVisible);

  if (isAlertVisible) {
    const fullPage = (await buyPage.screenshot({
      fullPage: true,
      type: "jpeg",
    })) as Buffer;

    console.log("alert 캡처 완료");

    if (!fullPage) throw new Error("");
    await sendNotification({
      chatId: config.telegramChatId,
      type: NotificationType.Image,
      payload: {
        source: fullPage,
      },
    });

    await buyPage.$eval("#popupLayerAlert > div > div.btns > input", (el) =>
      (<HTMLElement>el).click()
    );
  }

  const amoundApplySelector = "#amoundApply";

  // 구매 개수 변경
  await buyPage.select(amoundApplySelector, config.purchaseQuantity + "");
  await buyPage.click("#btnSelectNum");

  console.log(`${config.purchaseQuantity}개로 구매개수 변경`);

  // 구매버튼 클릭
  await buyPage.click("#btnBuy");

  console.log("구매버튼 클릭");

  const buyConfirmButtonSelector =
    "#popupLayerConfirm > div > div.btns > input:nth-child(1)";

  await buyPage.waitForSelector(buyConfirmButtonSelector, {
    visible: true,
    timeout: 2000,
  });

  await buyPage.$eval(buyConfirmButtonSelector, (el) =>
    (<HTMLElement>el).click()
  );

  console.log("구매확인 버튼 클릭");

  try {
    await buyPage.waitForSelector("#popReceipt", {
      visible: true,
      timeout: 5000,
    });

    if (hasTelegramBot) {
      const resultPopup = await buyPage.$("#popReceipt");
      if (!resultPopup) throw new Error("구매 후 결과를 캡처할 수 없습니다.");

      console.log("구매 완료");

      const lottoReceipt = (await resultPopup.screenshot({
        type: "jpeg",
      })) as Buffer;

      console.log("캡처 완료");

      if (!lottoReceipt) throw new Error("");
      await sendNotification({
        chatId: config.telegramChatId,
        type: NotificationType.Image,
        payload: {
          source: lottoReceipt,
        },
      });
    }
  } catch (error) {
    console.error(error);
    const isLimit = await buyPage.$eval(
      "#recommend720Plus",
      (el) => (<HTMLElement>el).style.display !== "none"
    );
    console.log("isLimit", isLimit);
    if (isLimit) {
      console.log("주간 구매 한도 초과");
      sendNotification({
        type: NotificationType.Message,
        chatId: config.telegramChatId,
        payload: "구매 한도가 초가되었습니다.",
      });
    }
  }
};

const getUserData = async (browser: Browser) => {
  if (!browser) return;

  console.log("유저정보 가져오기 시작");

  let accountInfo: string | null = null;
  const myPage = await browser.newPage();

  await myPage.goto("https://dhlottery.co.kr/userSsl.do?method=myPage", {
    waitUntil: "domcontentloaded",
  });
  await myPage.bringToFront();

  const totalMoney: string = await myPage.$eval(
    "#article > div:nth-child(2) > div > div.box_information > div.box.money > p.total_new > strong",
    (el) => (<HTMLElement>el).innerText
  );

  console.log(`총 예치금 ${totalMoney}원`);

  if (!totalMoney) return;

  try {
    accountInfo = await myPage.$eval(
      "#article > div:nth-child(2) > div > div.box_information > div.box.money > div.total_account_number > table > tbody > tr:nth-child(1) > td",
      (el) => (<HTMLElement>el).innerText
    );
  } catch (error) {}

  console.log(`계좌번호 ${accountInfo}`);

  await sendNotification({
    type: NotificationType.Message,
    chatId: config.telegramChatId,
    payload: `총 예치금 : ${totalMoney}원\n${
      Number.parseInt(totalMoney.replaceAll(",", ""), 10) < 5000 && accountInfo
        ? `예치 계좌번호 : ${accountInfo}`
        : ""
    }`,
  });
};

const run = async () => {
  if (!hasUserData) return;
  const browser = await createBrowser();

  try {
    await buyLotto(browser);
    await getUserData(browser);
  } catch (error) {
    console.error(error);
  }

  await browser.close();
};

run();
