# 로또 자동 구매

한국시간으로 매주 화요일 오후 10시에 숫자 자동으로된 로또를 구매합니다.  
(단, 한 주에 최대 5,000원까지 구매할 수 있습니다.)
<br><br>

## 사용방법

1. lotto-scheduler 레포지터리를 Fork 합니다.
2. [환경변수](###환경변수-종류)를 추가합니다.
3. 매주 화요일 오후 10시에 자동으로 실행됩니다.
   <br><br>

**수동으로 실행**  
Actions 탭에서 'every week' Workflow를 선택한 뒤 Run workflow 버튼을 눌려 실행  
<img src="./images/Workflow 수동 실행.png"  width="500" height="213" >
<br><br>

## 환경변수​

<img src="./images/Github Secrets 환경변수.png"  width="500" height="211" >  
<br><br>

### 환경변수 추가

Github -> Settings -> Secrets -> Actions 의 New repository secret 을 클릭해서 환경변수 추가
<br><br>

### 환경변수 종류

USER_ID = 동행복권 아이디(필수)  
USER_PASSWORD = 동행복원 비밀번호(필수)  
PURCHASE_QUANTITY = 로또 구매수량 1~5 사이의 정수(옵션. 기본값: 5)  
TELEGRAM_BOT_TOKEN = 텔레그램봇 Token(옵션)  
TELEGRAM_CHAT_ID = 텔레그램봇 Chat ID(옵션)
​<br><br>

## 주의사항

- 화요일 오후 10시에 실행예정이지만 Github Actions의 상황에 따라 실행시간이 늦어지거나 취소될 수 있습니다.

  > Note: The schedule event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.  
  > [GitHub Docs - schedule](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

- 환경변수를 입력하지 않아도 매주 Workflow는 실행됩니다.<br>
  완전히 실행을 중단하려면 Actions 탭에서 Disable workflow 버튼을 눌려야합니다.<br>
  (단, 환경변수를 체크해서 아이디, 비밀번호가 없으면 실행 중단)  
   <img src="./images/Workflow 비활성화.png"  width="500" height="153" >
  ​<br><br>

## License

[MIT License](./LICENSE)
