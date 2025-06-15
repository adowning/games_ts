// Placeholder types (replace with actual Prisma models or interfaces)
type User = { id: number | null };
type Request = any; // Replace with actual request type
type Game = any; // Replace with actual game type
type SlotSettingsType = any; // Replace with actual SlotSettings type
type DBTransaction = (callback: () => void) => void; // Placeholder for DB transaction

// Placeholder for Auth
const Auth = {
  id: (): number | null => {
    // Replace with actual authentication logic
    return 1; // Example user ID
  },
};

// Placeholder for DB
const DB = {
  transaction: (callback: () => void) => {
    // Replace with actual database transaction logic
    callback();
  },
};

// Placeholder for SlotSettings class
class SlotSettings {
  constructor(game: Game, userId: number) {
    // Replace with actual SlotSettings constructor
  }
  is_active(): boolean {
    // Replace with actual SlotSettings logic
    return true;
  }
  GetBalance(): number {
    // Replace with actual SlotSettings logic
    return 0;
  }
  CurrentDenom: number = 0;
  CurrentDenomination: number = 0;
  slotId: string = '';
  SetGameData(key: string, value: any): void {}
  HasGameData(key: string): boolean {return false;}
  GetGameData(key: string): any {}
  Bet: any[] = [];
  GetHistory(): any {return 'NULL';}
  Denominations: number[] = [];
  slotCurrency: string = '';
  UpdateJackpots(allbet: number): void {}
  SetBalance(amount: number, event?: string): void {}
  GetPercent(): number {return 0;}
  SetBank(event: string, amount: number, event2?: string): void {}
  slotFreeMpl: number = 1;
  GetSpinSettings(event: string, allbet: number, lines: number): [string, number] {return ['', 0];}
  MaxWin: number = 0;
  GetRandomPay(): number {return 0;}
  increaseRTP: boolean = false;
  GetBank(event: string): number {return 0;}
  SymbolGame: any[] = [];
  Paytable: any = {};
  slotWildMpl: number = 1;
  slotFreeCount: any = {};
  Jackpots: any = {};
  SaveLogReport(response: string, allbet: number, lines: number, reportWin: number, event: string): void {}
  SaveGameData(): void {}
  SaveGameDataStatic(): void {}
  InternalErrorSilent(e: any): void {}
  GetReelStrips(winType: string, event: string): any {}
}

export class GoBananasNETServer {
  public get(request: Request, game: Game): string {
    let response = '';

    const get_ = (request: Request, game: Game): void => {
      DB.transaction(() => {
        try {
          const userId = Auth.id();
          if (userId === null) {
            response = '{"responseEvent":"error","responseType":"","serverResponse":"invalid login"}';
            return;
          }

          const slotSettings: SlotSettingsType = new SlotSettings(game, userId);
          if (!slotSettings.is_active()) {
            response = '{"responseEvent":"error","responseType":"","serverResponse":"Game is disabled"}';
            return;
          }

          let postData: any = request.query; // Assuming GET request, similar to $_GET

          let balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);
          let result_tmp: string[] = [];
          let aid = '';

          postData['slotEvent'] = 'bet';
          if (postData['action'] === 'freespin') {
            postData['slotEvent'] = 'freespin';
            postData['action'] = 'spin';
          }
          if (postData['action'] === 'init' || postData['action'] === 'reloadbalance') {
            postData['action'] = 'init';
            postData['slotEvent'] = 'init';
          }
          if (postData['action'] === 'paytable') {
            postData['slotEvent'] = 'paytable';
          }
          if (postData['action'] === 'initfreespin') {
            postData['slotEvent'] = 'initfreespin';
          }

          if (postData['bet_denomination'] && postData['bet_denomination'] >= 1) {
            postData['bet_denomination'] = postData['bet_denomination'] / 100;
            slotSettings.CurrentDenom = postData['bet_denomination'];
            slotSettings.CurrentDenomination = postData['bet_denomination'];
            slotSettings.SetGameData(slotSettings.slotId + 'GameDenom', postData['bet_denomination']);
          } else if (slotSettings.HasGameData(slotSettings.slotId + 'GameDenom')) {
            postData['bet_denomination'] = slotSettings.GetGameData(slotSettings.slotId + 'GameDenom');
            slotSettings.CurrentDenom = postData['bet_denomination'];
            slotSettings.CurrentDenomination = postData['bet_denomination'];
          }

          balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

          if (postData['slotEvent'] === 'bet') {
            const lines = 20;
            const betline = postData['bet_betlevel'];
            if (lines <= 0 || betline <= 0.0001) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid bet state"}`;
              return;
            }
            if (slotSettings.GetBalance() < (lines * betline)) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid balance"}`;
              return;
            }
          }

          if (slotSettings.GetGameData(slotSettings.slotId + 'FreeGames') < slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame') && postData['slotEvent'] === 'freespin') {
            response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid bonus state"}`;
            return;
          }

          aid = String(postData['action']);
          switch (aid) {
            case 'init':
              const gameBets = slotSettings.Bet;
              const lastEvent = slotSettings.GetHistory();
              slotSettings.SetGameData('GoBananasNETBonusWin', 0);
              slotSettings.SetGameData('GoBananasNETFreeGames', 0);
              slotSettings.SetGameData('GoBananasNETCurrentFreeGame', 0);
              slotSettings.SetGameData('GoBananasNETTotalWin', 0);
              slotSettings.SetGameData('GoBananasNETFreeBalance', 0);
              let freeState = '';
              let curReels = '';
              if (lastEvent !== 'NULL' && lastEvent.serverResponse) {
                slotSettings.SetGameData(slotSettings.slotId + 'BonusWin', lastEvent.serverResponse.bonusWin);
                slotSettings.SetGameData(slotSettings.slotId + 'FreeGames', lastEvent.serverResponse.totalFreeGames);
                slotSettings.SetGameData(slotSettings.slotId + 'CurrentFreeGame', lastEvent.serverResponse.currentFreeGames);
                slotSettings.SetGameData(slotSettings.slotId + 'TotalWin', lastEvent.serverResponse.bonusWin);
                slotSettings.SetGameData(slotSettings.slotId + 'FreeBalance', lastEvent.serverResponse.Balance);
                freeState = lastEvent.serverResponse.freeState;
                const reels = lastEvent.serverResponse.reelsSymbols;
                curReels = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}%2CSYM${reels.reel1[1]}%2CSYM${reels.reel1[2]}`;
                curReels += `&rs.i0.r.i1.syms=SYM${reels.reel2[0]}%2CSYM${reels.reel2[1]}%2CSYM${reels.reel2[2]}`;
                curReels += `&rs.i0.r.i2.syms=SYM${reels.reel3[0]}%2CSYM${reels.reel3[1]}%2CSYM${reels.reel3[2]}`;
                curReels += `&rs.i0.r.i3.syms=SYM${reels.reel4[0]}%2CSYM${reels.reel4[1]}%2CSYM${reels.reel4[2]}`;
                curReels += `&rs.i0.r.i4.syms=SYM${reels.reel5[0]}%2CSYM${reels.reel5[1]}%2CSYM${reels.reel5[2]}`;
              } else {
                curReels = '';
              }

              for (let d = 0; d < slotSettings.Denominations.length; d++) {
                slotSettings.Denominations[d] = slotSettings.Denominations[d] * 100;
              }

              result_tmp.push(
                `bl.i6.coins=1&g4mode=false&bl.i11.line=0%2C1%2C0%2C1%2C0&bl.i17.reelset=ALL&historybutton=false&bl.i15.id=15&rs.i0.r.i4.hold=false&bl.i5.id=5&gameEventSetters.enabled=false&rs.i0.r.i1.syms=SYM11%2CSYM3%2CSYM6&bl.i3.coins=1&bl.i10.coins=1&bl.i18.id=18&game.win.cents=0&staticsharedurl=https%3A%2F%2Fstatic-shared.casinomodule.com%2Fgameclient_html%2Fdevicedetection%2Fcurrent&bl.i10.line=1%2C2%2C1%2C2%2C1&bl.i0.reelset=ALL&totalwin.coins=0&bl.i18.coins=1&bl.i5.line=0%2C0%2C1%2C0%2C0&gamestate.current=basic&bl.i10.id=10&bl.i3.reelset=ALL&bl.i4.line=2%2C1%2C0%2C1%2C2&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=1%2C2%2C2%2C2%2C1&bl.i13.coins=1&rs.i0.r.i0.syms=SYM9%2CSYM7%2CSYM4&rs.i0.r.i3.syms=SYM4%2CSYM9%2CSYM8&bl.i2.id=2&bl.i16.coins=1&bl.i9.coins=1&bl.i7.reelset=ALL&isJackpotWin=false&rs.i0.r.i0.pos=0&bl.i14.reelset=ALL&rs.i0.r.i1.pos=0&game.win.coins=0&bl.i13.id=13&rs.i0.r.i1.hold=false&bl.i3.id=3&bl.i12.coins=1&bl.i8.reelset=ALL&clientaction=init&bl.i9.line=1%2C0%2C1%2C0%2C1&rs.i0.r.i2.hold=false&bl.i16.id=16&casinoID=netent&betlevel.standard=1&bl.i5.coins=1&bl.i10.reelset=ALL&gameover=true&bl.i8.id=8&rs.i0.r.i3.pos=0&bl.i11.coins=1&bl.i13.reelset=ALL&bl.i0.id=0&bl.i6.line=2%2C2%2C1%2C2%2C2&bl.i12.line=2%2C1%2C2%2C1%2C2&bl.i0.line=1%2C1%2C1%2C1%2C1&nextaction=spin&bl.i15.line=0%2C1%2C1%2C1%2C0&bl.i3.line=0%2C1%2C2%2C1%2C0&bl.i19.id=19&bl.i4.reelset=ALL&bl.i4.coins=1&rs.i0.r.i2.syms=SYM12%2CSYM5%2CSYM11&bl.i18.line=2%2C0%2C2%2C0%2C2&game.win.amount=0&betlevel.all=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&bl.i9.id=9&bl.i17.line=0%2C2%2C0%2C2%2C0&denomination.all=${slotSettings.Denominations.join('%2C')}&bl.i11.id=11&playercurrency=%26%23x20AC%3B&bl.i9.reelset=ALL&bl.i17.coins=1&bl.i1.id=1&bl.i19.reelset=ALL&bl.i11.reelset=ALL&bl.i16.line=2%2C1%2C1%2C1%2C2&rs.i0.id=basic&credit=${balanceInCents}&denomination.standard=${slotSettings.CurrentDenomination * 100}&bl.i1.reelset=ALL&multiplier=1&bl.i14.id=14&bl.i19.line=0%2C2%2C2%2C2%2C0&bl.i12.reelset=ALL&bl.i2.coins=1&bl.i6.id=6&bl.i1.line=0%2C0%2C0%2C0%2C0&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&bl.i17.id=17&gamesoundurl=&bl.i16.reelset=ALL&nearwinallowed=true&bl.i5.reelset=ALL&bl.i19.coins=1&bl.i7.id=7&bl.i18.reelset=ALL&bl.i8.line=1%2C0%2C0%2C0%2C1&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=1&bl.i14.line=1%2C1%2C2%2C1%2C1&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&rs.i0.r.i4.syms=SYM8%2CSYM5%2CSYM12&bl.i8.coins=1&bl.i15.coins=1&rs.i0.r.i2.pos=0&bl.i2.line=2%2C2%2C2%2C2%2C2&bl.i13.line=1%2C1%2C0%2C1%2C1&totalwin.cents=0&bl.i0.coins=1&bl.i2.reelset=ALL&rs.i0.r.i0.hold=false&restore=false&bl.i12.id=12&bl.i4.id=4&rs.i0.r.i4.pos=0&bl.i7.coins=1&bl.standard=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19&bl.i6.reelset=ALL&wavecount=1&bl.i14.coins=1&bl.i15.reelset=ALL&rs.i0.r.i3.hold=false${curReels}`
              );
              break;
            case 'paytable':
              result_tmp.push(
                `pt.i0.comp.i19.symbol=SYM9&bl.i6.coins=1&bl.i17.reelset=ALL&pt.i0.comp.i15.type=betline&pt.i0.comp.i23.freespins=0&bl.i15.id=15&pt.i0.comp.i29.type=betline&pt.i0.comp.i4.multi=80&pt.i0.comp.i15.symbol=SYM8&pt.i0.comp.i17.symbol=SYM8&pt.i0.comp.i5.freespins=0&pt.i0.comp.i22.multi=15&pt.i0.comp.i23.n=5&pt.i0.comp.i11.symbol=SYM6&pt.i0.comp.i13.symbol=SYM7&pt.i0.comp.i15.multi=5&bl.i10.line=1%2C2%2C1%2C2%2C1&bl.i0.reelset=ALL&pt.i0.comp.i16.freespins=0&pt.i0.comp.i28.multi=10&bl.i18.coins=1&bl.i10.id=10&pt.i0.comp.i11.n=5&pt.i0.comp.i4.freespins=0&bl.i3.reelset=ALL&bl.i4.line=2%2C1%2C0%2C1%2C2&bl.i13.coins=1&pt.i0.comp.i19.n=4&pt.i0.id=basic&pt.i0.comp.i1.type=betline&bl.i2.id=2&pt.i0.comp.i2.symbol=SYM3&pt.i0.comp.i4.symbol=SYM4&pt.i0.comp.i20.type=betline&bl.i14.reelset=ALL&pt.i0.comp.i17.freespins=0&pt.i0.comp.i6.symbol=SYM5&pt.i0.comp.i8.symbol=SYM5&pt.i0.comp.i0.symbol=SYM3&pt.i0.comp.i5.n=5&pt.i0.comp.i3.type=betline&pt.i0.comp.i3.freespins=0&pt.i0.comp.i10.multi=50&bl.i3.id=3&pt.i0.comp.i27.multi=5&pt.i0.comp.i9.multi=15&bl.i12.coins=1&pt.i0.comp.i22.symbol=SYM10&pt.i0.comp.i26.symbol=SYM11&pt.i0.comp.i24.n=3&bl.i8.reelset=ALL&pt.i0.comp.i14.freespins=0&pt.i0.comp.i21.freespins=0&clientaction=paytable&bl.i16.id=16&bl.i5.coins=1&pt.i0.comp.i22.type=betline&pt.i0.comp.i24.freespins=0&bl.i8.id=8&pt.i0.comp.i16.multi=20&pt.i0.comp.i21.multi=5&pt.i0.comp.i12.n=3&bl.i6.line=2%2C2%2C1%2C2%2C2&pt.i0.comp.i13.type=betline&bl.i12.line=2%2C1%2C2%2C1%2C2&bl.i0.line=1%2C1%2C1%2C1%2C1&pt.i0.comp.i19.type=betline&pt.i0.comp.i6.freespins=0&pt.i0.comp.i3.multi=20&pt.i0.comp.i6.n=3&pt.i0.comp.i21.n=3&pt.i0.comp.i29.n=5&bl.i1.id=1&pt.i0.comp.i27.freespins=0&pt.i0.comp.i10.type=betline&pt.i0.comp.i2.freespins=0&pt.i0.comp.i5.multi=350&pt.i0.comp.i7.n=4&pt.i0.comp.i11.multi=180&bl.i14.id=14&pt.i0.comp.i7.type=betline&bl.i19.line=0%2C2%2C2%2C2%2C0&bl.i12.reelset=ALL&pt.i0.comp.i17.n=5&bl.i2.coins=1&bl.i6.id=6&pt.i0.comp.i29.multi=30&pt.i0.comp.i8.freespins=0&pt.i0.comp.i8.multi=250&gamesoundurl=&pt.i0.comp.i1.freespins=0&pt.i0.comp.i12.type=betline&pt.i0.comp.i14.multi=140&bl.i5.reelset=ALL&pt.i0.comp.i22.n=4&pt.i0.comp.i28.symbol=SYM12&bl.i19.coins=1&bl.i7.id=7&bl.i18.reelset=ALL&pt.i0.comp.i6.multi=15&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=1&bl.i14.line=1%2C1%2C2%2C1%2C1&pt.i0.comp.i18.type=betline&pt.i0.comp.i23.symbol=SYM10&pt.i0.comp.i21.type=betline&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&pt.i0.comp.i8.type=betline&pt.i0.comp.i7.freespins=0&pt.i0.comp.i2.type=betline&pt.i0.comp.i13.multi=40&pt.i0.comp.i17.type=betline&bl.i13.line=1%2C1%2C0%2C1%2C1&bl.i0.coins=1&bl.i2.reelset=ALL&pt.i0.comp.i8.n=5&pt.i0.comp.i10.n=4&pt.i0.comp.i11.type=betline&pt.i0.comp.i18.n=3&pt.i0.comp.i22.freespins=0&pt.i0.comp.i20.symbol=SYM9&pt.i0.comp.i15.freespins=0&pt.i0.comp.i27.type=betline&pt.i0.comp.i28.freespins=0&pt.i0.comp.i0.n=3&pt.i0.comp.i7.symbol=SYM5&bl.i15.reelset=ALL&pt.i0.comp.i0.type=betline&g4mode=false&bl.i11.line=0%2C1%2C0%2C1%2C0&pt.i0.comp.i25.multi=10&historybutton=false&pt.i0.comp.i16.symbol=SYM8&bl.i5.id=5&pt.i0.comp.i1.multi=120&pt.i0.comp.i27.n=3&pt.i0.comp.i18.symbol=SYM9&pt.i0.comp.i12.multi=10&bl.i3.coins=1&bl.i10.coins=1&pt.i0.comp.i12.symbol=SYM7&pt.i0.comp.i14.symbol=SYM7&bl.i18.id=18&pt.i0.comp.i14.type=betline&pt.i0.comp.i18.multi=5&bl.i5.line=0%2C0%2C1%2C0%2C0&pt.i0.comp.i7.multi=60&pt.i0.comp.i9.n=3&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=1%2C2%2C2%2C2%2C1&pt.i0.comp.i28.type=betline&pt.i0.comp.i10.symbol=SYM6&pt.i0.comp.i15.n=3&bl.i16.coins=1&bl.i9.coins=1&pt.i0.comp.i21.symbol=SYM10&bl.i7.reelset=ALL&isJackpotWin=false&pt.i0.comp.i1.n=4&pt.i0.comp.i10.freespins=0&pt.i0.comp.i20.multi=60&pt.i0.comp.i20.n=5&pt.i0.comp.i29.symbol=SYM12&pt.i0.comp.i17.multi=70&bl.i13.id=13&pt.i0.comp.i25.symbol=SYM11&pt.i0.comp.i26.type=betline&pt.i0.comp.i28.n=4&pt.i0.comp.i9.type=betline&bl.i9.line=1%2C0%2C1%2C0%2C1&pt.i0.comp.i2.multi=700&pt.i0.comp.i0.freespins=0&bl.i10.reelset=ALL&pt.i0.comp.i29.freespins=0&pt.i0.comp.i9.symbol=SYM6&bl.i11.coins=1&pt.i0.comp.i16.n=4&bl.i13.reelset=ALL&bl.i0.id=0&pt.i0.comp.i16.type=betline&pt.i0.comp.i5.symbol=SYM4&bl.i15.line=0%2C1%2C1%2C1%2C0&bl.i3.line=0%2C1%2C2%2C1%2C0&bl.i19.id=19&bl.i4.reelset=ALL&bl.i4.coins=1&pt.i0.comp.i2.n=5&pt.i0.comp.i1.symbol=SYM3&bl.i18.line=2%2C0%2C2%2C0%2C2&bl.i9.id=9&pt.i0.comp.i19.freespins=0&bl.i17.line=0%2C2%2C0%2C2%2C0&bl.i11.id=11&pt.i0.comp.i6.type=betline&playercurrency=%26%23x20AC%3B&bl.i9.reelset=ALL&bl.i17.coins=1&bl.i19.reelset=ALL&pt.i0.comp.i25.n=4&pt.i0.comp.i9.freespins=0&bl.i11.reelset=ALL&bl.i16.line=2%2C1%2C1%2C1%2C2&credit=500000&pt.i0.comp.i5.type=betline&pt.i0.comp.i11.freespins=0&pt.i0.comp.i26.multi=40&pt.i0.comp.i25.type=betline&bl.i1.reelset=ALL&pt.i0.comp.i4.type=betline&pt.i0.comp.i13.freespins=0&pt.i0.comp.i26.freespins=0&bl.i1.line=0%2C0%2C0%2C0%2C0&pt.i0.comp.i13.n=4&pt.i0.comp.i20.freespins=0&pt.i0.comp.i23.type=betline&bl.i17.id=17&bl.i16.reelset=ALL&pt.i0.comp.i3.n=3&pt.i0.comp.i25.freespins=0&bl.i8.line=1%2C0%2C0%2C0%2C1&pt.i0.comp.i24.symbol=SYM11&pt.i0.comp.i26.n=5&pt.i0.comp.i27.symbol=SYM12&bl.i8.coins=1&bl.i15.coins=1&pt.i0.comp.i23.multi=50&bl.i2.line=2%2C2%2C2%2C2%2C2&pt.i0.comp.i18.freespins=0&bl.i12.id=12&bl.i4.id=4&bl.i7.coins=1&pt.i0.comp.i14.n=5&pt.i0.comp.i0.multi=25&bl.i6.reelset=ALL&pt.i0.comp.i19.multi=15&pt.i0.comp.i3.symbol=SYM4&pt.i0.comp.i24.type=betline&bl.i14.coins=1&pt.i0.comp.i12.freespins=0&pt.i0.comp.i4.n=4&pt.i0.comp.i24.multi=5`
              );
              break;
            case 'spin':
              // This is a very large block of code, will be implemented in the next steps
              const linesId: number[][] = [
                [2, 2, 2, 2, 2], [1, 1, 1, 1, 1], [3, 3, 3, 3, 3], [1, 2, 3, 2, 1], [3, 2, 1, 2, 3],
                [1, 1, 2, 1, 1], [3, 3, 2, 3, 3], [2, 3, 3, 3, 2], [2, 1, 1, 1, 2], [2, 1, 2, 1, 2],
                [2, 3, 2, 3, 2], [1, 2, 1, 2, 1], [3, 2, 3, 2, 3], [2, 2, 1, 2, 2], [2, 2, 3, 2, 2],
                [1, 2, 2, 2, 1], [3, 2, 2, 2, 3], [1, 3, 1, 3, 1], [3, 1, 3, 1, 3], [1, 3, 3, 3, 1]
              ];
              const lines = 20;
              slotSettings.CurrentDenom = postData['bet_denomination'];
              slotSettings.CurrentDenomination = postData['bet_denomination'];
              let betline: number;
              let allbet: number;
              let bonusMpl = 1;

              if (postData['slotEvent'] !== 'freespin') {
                betline = postData['bet_betlevel'];
                allbet = betline * lines;
                slotSettings.UpdateJackpots(allbet);
                if (!postData['slotEvent']) {
                  postData['slotEvent'] = 'bet';
                }
                slotSettings.SetBalance(-1 * allbet, postData['slotEvent']);
                const bankSum = allbet / 100 * slotSettings.GetPercent();
                slotSettings.SetBank(postData['slotEvent'] || '', bankSum, postData['slotEvent']);
                slotSettings.UpdateJackpots(allbet);
                slotSettings.SetGameData('GoBananasNETBonusWin', 0);
                slotSettings.SetGameData('GoBananasNETFreeGames', 0);
                slotSettings.SetGameData('GoBananasNETCurrentFreeGame', 0);
                slotSettings.SetGameData('GoBananasNETTotalWin', 0);
                slotSettings.SetGameData('GoBananasNETBet', betline);
                slotSettings.SetGameData('GoBananasNETDenom', postData['bet_denomination']);
                slotSettings.SetGameData('GoBananasNETFreeBalance', parseFloat(slotSettings.GetBalance().toFixed(2)) * 100);
              } else {
                postData['bet_denomination'] = slotSettings.GetGameData('GoBananasNETDenom');
                slotSettings.CurrentDenom = postData['bet_denomination'];
                slotSettings.CurrentDenomination = postData['bet_denomination'];
                betline = slotSettings.GetGameData('GoBananasNETBet');
                allbet = betline * lines;
                slotSettings.SetGameData('GoBananasNETCurrentFreeGame', slotSettings.GetGameData('GoBananasNETCurrentFreeGame') + 1);
                bonusMpl = slotSettings.slotFreeMpl;
              }

              let winTypeTmp = slotSettings.GetSpinSettings(postData['slotEvent'], allbet, lines);
              let winType = winTypeTmp[0];
              let spinWinLimit = winTypeTmp[1];
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

              if (winType === 'bonus' && postData['slotEvent'] === 'freespin') {
                winType = 'win';
              }
              let jackRandom = Math.floor(Math.random() * 500) + 1;
              let mainSymAnim = '';
              let totalWin = 0;
              let lineWins: string[] = [];
              let cWins: number[] = new Array(lines).fill(0);
              const wild = ['2']; // Assuming '2' is the wild symbol ID
              const scatter = '0'; // Assuming '0' is the scatter symbol ID
              let reels: any;
              let tmpReels: any;
              let wildStr = '';
              let wcnt = 0;
              let p00A = [0, 0, 0, 0, 0, 0, 0]; // Length 7, like in PHP

              for (let i = 0; i <= 2000; i++) {
                totalWin = 0;
                lineWins = [];
                cWins.fill(0);
                reels = slotSettings.GetReelStrips(winType, postData['slotEvent']);
                tmpReels = JSON.parse(JSON.stringify(reels)); // Deep copy

                wildStr = '';
                wcnt = 0;
                p00A = [0, 0, 0, 0, 0, 0, 0];


                for (let r = 1; r <= 5; r++) {
                  for (let p = 0; p <= 2; p++) {
                    if (reels['reel' + r][p] === '23') {
                      const rw = r - 1;
                      let hit = ['false', 'false', 'false'];
                      hit[p] = 'true';
                      const wildSym = 'SYM23';
                      reels['reel' + r][0] = '2';
                      reels['reel' + r][1] = '2';
                      reels['reel' + r][2] = '2';
                      for (let p0 = 0; p0 <= 2; p0++) {
                        let p00 = p00A[rw];
                        wildStr += `&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${rw}.overlay.i${p00}.with=SYM2&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.hit=${hit[p0]}&rs.i0.r.i${rw}.overlay.i${p00}.row=${p0}&rs.i0.r.i${rw}.overlay.i${p00}.pos=2`;
                        p00A[rw]++;
                      }
                      wcnt++;
                      break;
                    }
                    if (reels['reel' + r][p] === '25') {
                      const rw = r - 1;
                      let hit = ['false', 'false', 'false'];
                      hit[p] = 'true';
                      const wildSym = 'SYM25';
                      if (r !== 5) {
                        let p0 = p;
                        let p00 = p00A[rw];
                        wildStr += `&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${rw}.overlay.i${p00}.with=SYM2&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.hit=${hit[p0]}&rs.i0.r.i${rw}.overlay.i${p00}.row=${p0}&rs.i0.r.i${rw}.overlay.i${p00}.pos=2`;
                        p00A[rw]++; // Increment for the current reel before moving to next
                        let rw_next = r; // current r is next reel index (r is 1-based)
                        p00 = p00A[rw_next];
                        wildStr += `&rs.i0.r.i${rw_next}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${rw_next}.overlay.i${p00}.with=SYM2&rs.i0.r.i${rw_next}.overlay.i${p00}.pattern.i0.hit=false&rs.i0.r.i${rw_next}.overlay.i${p00}.row=${p0}&rs.i0.r.i${rw_next}.overlay.i${p00}.pos=2`;
                        p00A[rw_next]++;
                        reels['reel' + r][p0] = '2';
                        reels['reel' + (r + 1)][p0] = '2';
                      } else {
                        let p0 = p;
                        let p00 = p00A[rw];
                        wildStr += `&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${rw}.overlay.i${p00}.with=SYM2&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.hit=${hit[p0]}&rs.i0.r.i${rw}.overlay.i${p00}.row=${p0}&rs.i0.r.i${rw}.overlay.i${p00}.pos=2`;
                        p00A[rw]++;
                        let p0_alt = (p >= 1) ? p - 1 : p + 1;
                        reels['reel' + r][p] = '2';
                        reels['reel' + r][p0_alt] = '2';
                        p00 = p00A[rw];
                        wildStr += `&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${rw}.overlay.i${p00}.with=SYM2&rs.i0.r.i${rw}.overlay.i${p00}.pattern.i0.hit=false&rs.i0.r.i${rw}.overlay.i${p00}.row=${p0_alt}&rs.i0.r.i${rw}.overlay.i${p00}.pos=2`;
                        p00A[rw]++;
                      }
                      wcnt++;
                      break;
                    }
                    if (reels['reel' + r][p] === '24') {
                      const rw = r - 1;
                      const wildSym = 'SYM24';
                      let p0_orig = p;
                      let warr: any[];
                      if (r <= 3) {
                        warr = [
                          [r - 1, p0_orig, 'true'],
                          [r, p0_orig, 'false'],
                          [r + 1, p0_orig, 'false']
                        ];
                      } else {
                        warr = [
                          [r - 1, p0_orig, 'true'],
                          [r - 2, p0_orig, 'false'],
                          [r - 3, p0_orig, 'false']
                        ];
                      }
                      for (let ww = 0; ww < warr.length; ww++) {
                        const cw = warr[ww];
                        const r_idx = cw[0];
                        const p_idx = cw[1];
                        const hit_val = cw[2];
                        let p00 = p00A[r_idx];
                        wildStr += `&rs.i0.r.i${r_idx}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${r_idx}.overlay.i${p00}.with=SYM2&rs.i0.r.i${r_idx}.overlay.i${p00}.pattern.i0.hit=${hit_val}&rs.i0.r.i${r_idx}.overlay.i${p00}.row=${p_idx}&rs.i0.r.i${r_idx}.overlay.i${p00}.pos=2`;
                        reels['reel' + (r_idx + 1)][p_idx] = '2';
                        p00A[r_idx]++;
                      }
                      wcnt++;
                      break;
                    }
                    if (reels['reel' + r][p] === '22') {
                        const rw = r - 1;
                        const wildSym = 'SYM22';
                        let p0_orig = p;
                        let warr: any[];
                        if (p0_orig < 2) {
                            warr = [
                                [r - 1, p0_orig, 'true'], [r - 1, p0_orig + 1, 'false'],
                                [r, p0_orig, 'false'], [r, p0_orig + 1, 'false']
                            ];
                        } else {
                            warr = [
                                [r - 1, p0_orig, 'true'], [r - 1, p0_orig - 1, 'false'],
                                [r, p0_orig, 'false'], [r, p0_orig - 1, 'false']
                            ];
                        }
                        for (let ww = 0; ww < warr.length; ww++) {
                            const cw = warr[ww];
                            const r_idx = cw[0];
                            const p_idx = cw[1];
                            const hit_val = cw[2];
                            let p00 = p00A[r_idx];
                            wildStr += `&rs.i0.r.i${r_idx}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${r_idx}.overlay.i${p00}.with=SYM2&rs.i0.r.i${r_idx}.overlay.i${p00}.pattern.i0.hit=${hit_val}&rs.i0.r.i${r_idx}.overlay.i${p00}.row=${p_idx}&rs.i0.r.i${r_idx}.overlay.i${p00}.pos=2`;
                            reels['reel' + (r_idx + 1)][p_idx] = '2';
                             p00A[r_idx]++;
                        }
                        wcnt++;
                        break;
                    }
                    if (reels['reel' + r][p] === '21') {
                        const wildSym = 'SYM21';
                        let p0_orig = p;
                        let r_orig = r; // PHP r is 1-based
                        let warr: any[];

                        if (r_orig <= 3) {
                            if (p0_orig === 1) {
                                warr = [
                                    [r_orig - 1, p0_orig, 'true'], [r_orig - 2, p0_orig + 1, 'false'], [r_orig - 2, p0_orig - 1, 'false'],
                                    [r_orig, p0_orig + 1, 'false'], [r_orig, p0_orig - 1, 'false']
                                ];
                            } else if (p0_orig === 0) {
                                warr = [
                                    [r_orig - 1, p0_orig, 'true'], [r_orig - 1, p0_orig + 2, 'false'], [r_orig, p0_orig + 1, 'false'],
                                    [r_orig + 1, p0_orig + 2, 'false'], [r_orig + 1, p0_orig, 'false']
                                ];
                            } else { // p0_orig === 2
                                warr = [
                                    [r_orig - 1, p0_orig, 'true'], [r_orig - 1, p0_orig - 2, 'false'], [r_orig, p0_orig - 1, 'false'],
                                    [r_orig + 1, p0_orig - 2, 'false'], [r_orig + 1, p0_orig, 'false']
                                ];
                            }
                        } else { // r_orig > 3
                            if (p0_orig === 1) {
                                warr = [
                                    [r_orig - 1, p0_orig, 'true'], [r_orig - 2, p0_orig + 1, 'false'], [r_orig - 2, p0_orig - 1, 'false'],
                                    [r_orig, p0_orig + 1, 'false'], [r_orig, p0_orig - 1, 'false']
                                ];
                            } else if (p0_orig === 0) {
                                warr = [
                                    [r_orig - 1, p0_orig, 'true'], [r_orig - 1, p0_orig + 2, 'false'], [r_orig - 2, p0_orig + 1, 'false'],
                                    [r_orig - 3, p0_orig + 2, 'false'], [r_orig - 3, p0_orig, 'false']
                                ];
                            } else { // p0_orig === 2
                                warr = [
                                    [r_orig - 1, p0_orig, 'true'], [r_orig - 1, p0_orig - 2, 'false'], [r_orig - 2, p0_orig - 1, 'false'],
                                    [r_orig - 3, p0_orig - 2, 'false'], [r_orig - 3, p0_orig, 'false']
                                ];
                            }
                        }

                        for (let ww = 0; ww < warr.length; ww++) {
                            const cw = warr[ww];
                            const r_idx = cw[0]; // This is 0-based index for reel array
                            const p_idx = cw[1];
                            const hit_val = cw[2];
                            let p00 = p00A[r_idx];
                            wildStr += `&rs.i0.r.i${r_idx}.overlay.i${p00}.pattern.i0.sym=${wildSym}&rs.i0.r.i${r_idx}.overlay.i${p00}.with=SYM2&rs.i0.r.i${r_idx}.overlay.i${p00}.pattern.i0.hit=${hit_val}&rs.i0.r.i${r_idx}.overlay.i${p00}.row=${p_idx}&rs.i0.r.i${r_idx}.overlay.i${p00}.pos=2`;
                            reels['reel' + (r_idx + 1)][p_idx] = '2'; // reels object uses 1-based index for reel number
                            p00A[r_idx]++;
                        }
                        wcnt++;
                        break;
                    }
                  }
                }


                let winLineCount = 0;
                for (let k = 0; k < lines; k++) {
                  let tmpStringWin = '';
                  for (let j = 0; j < slotSettings.SymbolGame.length; j++) {
                    const csym = String(slotSettings.SymbolGame[j]);
                    if (csym === scatter || !slotSettings.Paytable['SYM_' + csym]) {
                      // Skip scatter or undefined symbols in paytable
                    } else {
                      const s: string[] = [];
                      s[0] = reels['reel1'][linesId[k][0] - 1];
                      s[1] = reels['reel2'][linesId[k][1] - 1];
                      s[2] = reels['reel3'][linesId[k][2] - 1];
                      s[3] = reels['reel4'][linesId[k][3] - 1];
                      s[4] = reels['reel5'][linesId[k][4] - 1];

                      let mpl = 1;
                      // Check for 3 symbols
                      if ((s[0] === csym || wild.includes(s[0])) &&
                          (s[1] === csym || wild.includes(s[1])) &&
                          (s[2] === csym || wild.includes(s[2]))) {
                        if (wild.includes(s[0]) && wild.includes(s[1]) && wild.includes(s[2])) {
                          mpl = 1;
                        } else if (wild.includes(s[0]) || wild.includes(s[1]) || wild.includes(s[2])) {
                          mpl = slotSettings.slotWildMpl;
                        }
                        const tmpWin = slotSettings.Paytable['SYM_' + csym][3] * betline * mpl * bonusMpl;
                        if (cWins[k] < tmpWin) {
                          cWins[k] = tmpWin;
                          tmpStringWin = `&ws.i${winLineCount}.reelset=basic&ws.i${winLineCount}.types.i0.coins=${tmpWin}&ws.i${winLineCount}.pos.i0=0%2C${linesId[k][0] - 1}&ws.i${winLineCount}.pos.i1=1%2C${linesId[k][1] - 1}&ws.i${winLineCount}.pos.i2=2%2C${linesId[k][2] - 1}&ws.i${winLineCount}.types.i0.wintype=coins&ws.i${winLineCount}.betline=${k}&ws.i${winLineCount}.sym=SYM${csym}&ws.i${winLineCount}.direction=left_to_right&ws.i${winLineCount}.types.i0.cents=${tmpWin * slotSettings.CurrentDenomination * 100}`;
                          mainSymAnim = csym;
                        }
                      }
                      // Check for 4 symbols
                      if ((s[0] === csym || wild.includes(s[0])) &&
                          (s[1] === csym || wild.includes(s[1])) &&
                          (s[2] === csym || wild.includes(s[2])) &&
                          (s[3] === csym || wild.includes(s[3]))) {
                        if (wild.includes(s[0]) && wild.includes(s[1]) && wild.includes(s[2]) && wild.includes(s[3])) {
                          mpl = 1;
                        } else if (wild.includes(s[0]) || wild.includes(s[1]) || wild.includes(s[2]) || wild.includes(s[3])) {
                          mpl = slotSettings.slotWildMpl;
                        }
                        const tmpWin = slotSettings.Paytable['SYM_' + csym][4] * betline * mpl * bonusMpl;
                        if (cWins[k] < tmpWin) {
                          cWins[k] = tmpWin;
                          tmpStringWin = `&ws.i${winLineCount}.reelset=basic&ws.i${winLineCount}.types.i0.coins=${tmpWin}&ws.i${winLineCount}.pos.i0=0%2C${linesId[k][0] - 1}&ws.i${winLineCount}.pos.i1=1%2C${linesId[k][1] - 1}&ws.i${winLineCount}.pos.i2=2%2C${linesId[k][2] - 1}&ws.i${winLineCount}.pos.i3=3%2C${linesId[k][3] - 1}&ws.i${winLineCount}.types.i0.wintype=coins&ws.i${winLineCount}.betline=${k}&ws.i${winLineCount}.sym=SYM${csym}&ws.i${winLineCount}.direction=left_to_right&ws.i${winLineCount}.types.i0.cents=${tmpWin * slotSettings.CurrentDenomination * 100}`;
                          mainSymAnim = csym;
                        }
                      }
                      // Check for 5 symbols
                      if ((s[0] === csym || wild.includes(s[0])) &&
                          (s[1] === csym || wild.includes(s[1])) &&
                          (s[2] === csym || wild.includes(s[2])) &&
                          (s[3] === csym || wild.includes(s[3])) &&
                          (s[4] === csym || wild.includes(s[4]))) {
                        if (wild.includes(s[0]) && wild.includes(s[1]) && wild.includes(s[2]) && wild.includes(s[3]) && wild.includes(s[4])) {
                          mpl = 1;
                        } else if (wild.includes(s[0]) || wild.includes(s[1]) || wild.includes(s[2]) || wild.includes(s[3]) || wild.includes(s[4])) {
                          mpl = slotSettings.slotWildMpl;
                        }
                        const tmpWin = slotSettings.Paytable['SYM_' + csym][5] * betline * mpl * bonusMpl;
                        if (cWins[k] < tmpWin) {
                          cWins[k] = tmpWin;
                          tmpStringWin = `&ws.i${winLineCount}.reelset=basic&ws.i${winLineCount}.types.i0.coins=${tmpWin}&ws.i${winLineCount}.pos.i0=0%2C${linesId[k][0] - 1}&ws.i${winLineCount}.pos.i1=1%2C${linesId[k][1] - 1}&ws.i${winLineCount}.pos.i2=2%2C${linesId[k][2] - 1}&ws.i${winLineCount}.pos.i3=3%2C${linesId[k][3] - 1}&ws.i${winLineCount}.pos.i4=4%2C${linesId[k][4] - 1}&ws.i${winLineCount}.types.i0.wintype=coins&ws.i${winLineCount}.betline=${k}&ws.i${winLineCount}.sym=SYM${csym}&ws.i${winLineCount}.direction=left_to_right&ws.i${winLineCount}.types.i0.cents=${tmpWin * slotSettings.CurrentDenomination * 100}`;
                          mainSymAnim = csym;
                        }
                      }
                    }
                  }
                  if (cWins[k] > 0 && tmpStringWin !== '') {
                    lineWins.push(tmpStringWin);
                    totalWin += cWins[k];
                    winLineCount++;
                  }
                }

                let scattersWin = 0;
                let scattersStr = '';
                let scattersCount = 0;
                const scPos: string[] = [];
                for (let r = 1; r <= 5; r++) {
                  for (let p = 0; p <= 2; p++) {
                    if (reels['reel' + r][p] === scatter) {
                      scattersCount++;
                      scPos.push(`&ws.i0.pos.i${r - 1}=${r - 1}%2C${p}`);
                    }
                  }
                }

                if (scattersCount >= 3 && slotSettings.slotFreeCount[scattersCount]) {
                  scattersStr = `&ws.i0.types.i0.freespins=${slotSettings.slotFreeCount[scattersCount]}&ws.i0.reelset=basic&ws.i0.betline=null&ws.i0.types.i0.wintype=freespins&ws.i0.direction=none${scPos.join('')}`;
                }
                totalWin += scattersWin; // scattersWin is always 0 in PHP, so this does nothing

                if (i > 1000) winType = 'none';
                if (i > 1500) {
                  response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"Bad Reel Strip"}`;
                  return; // Exit
                }

                if (slotSettings.MaxWin < (totalWin * slotSettings.CurrentDenom)) {
                  // Condition to continue loop (win too high)
                } else {
                  const minWin = slotSettings.GetRandomPay();
                  if (i > 700) {
                     // minWin = 0; // In PHP, this assignment was commented out. Kept for consistency.
                  }
                  if (slotSettings.increaseRTP && winType === 'win' && totalWin < (minWin * allbet)) {
                    // Condition to continue loop
                  } else if (scattersCount >= 3 && winType !== 'bonus') {
                    // Condition to continue loop (force scatter win if not bonus mode already)
                  } else if (totalWin <= spinWinLimit && winType === 'bonus') {
                    const cBank = slotSettings.GetBank(postData['slotEvent'] || '');
                    if (cBank < spinWinLimit) {
                      spinWinLimit = cBank;
                    } else {
                      break; // Exit loop
                    }
                  } else if (totalWin > 0 && totalWin <= spinWinLimit && winType === 'win') {
                    const cBank = slotSettings.GetBank(postData['slotEvent'] || '');
                    if (cBank < spinWinLimit) {
                      spinWinLimit = cBank;
                    } else {
                      break; // Exit loop
                    }
                  } else if (totalWin === 0 && winType === 'none') {
                    break; // Exit loop
                  }
                }
              } // End of spin loop

              let freeStateSpin = '';
              if (totalWin > 0) {
                slotSettings.SetBank(postData['slotEvent'] || '', -1 * totalWin);
                slotSettings.SetBalance(totalWin);
              }
              const reportWin = totalWin;
              reels = tmpReels; // Restore original reels before wilds were applied for response generation

              let curReelsSpin = `&rs.i0.r.i0.syms=SYM${reels['reel1'][0]}%2CSYM${reels['reel1'][1]}%2CSYM${reels['reel1'][2]}`;
              curReelsSpin += `&rs.i0.r.i1.syms=SYM${reels['reel2'][0]}%2CSYM${reels['reel2'][1]}%2CSYM${reels['reel2'][2]}`;
              curReelsSpin += `&rs.i0.r.i2.syms=SYM${reels['reel3'][0]}%2CSYM${reels['reel3'][1]}%2CSYM${reels['reel3'][2]}`;
              curReelsSpin += `&rs.i0.r.i3.syms=SYM${reels['reel4'][0]}%2CSYM${reels['reel4'][1]}%2CSYM${reels['reel4'][2]}`;
              curReelsSpin += `&rs.i0.r.i4.syms=SYM${reels['reel5'][0]}%2CSYM${reels['reel5'][1]}%2CSYM${reels['reel5'][2]}`;

              if (postData['slotEvent'] === 'freespin') {
                slotSettings.SetGameData('GoBananasNETBonusWin', slotSettings.GetGameData('GoBananasNETBonusWin') + totalWin);
                slotSettings.SetGameData('GoBananasNETTotalWin', slotSettings.GetGameData('GoBananasNETTotalWin') + totalWin);
              } else {
                slotSettings.SetGameData('GoBananasNETTotalWin', totalWin);
              }

              let fs = 0;
              if (scattersCount >= 3 && slotSettings.slotFreeCount[scattersCount]) {
                slotSettings.SetGameData('GoBananasNETFreeStartWin', totalWin);
                slotSettings.SetGameData('GoBananasNETBonusWin', totalWin);
                slotSettings.SetGameData('GoBananasNETFreeGames', slotSettings.slotFreeCount[scattersCount]);
                fs = slotSettings.GetGameData('GoBananasNETFreeGames');
                freeStateSpin = `&freespins.betlines=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19&freespins.totalwin.cents=0&nextaction=freespin&freespins.left=${fs}&freespins.wavecount=1&freespins.multiplier=1&gamestate.stack=basic%2Cfreespin&freespins.totalwin.coins=0&freespins.total=${fs}&freespins.win.cents=0&gamestate.current=freespin&freespins.initial=${fs}&freespins.win.coins=0&freespins.betlevel=${slotSettings.GetGameData('GoBananasNETBet')}&totalwin.coins=${totalWin}&credit=${balanceInCents}&totalwin.cents=${totalWin * slotSettings.CurrentDenomination * 100}&game.win.amount=${totalWin / slotSettings.CurrentDenomination}`;
                curReelsSpin += freeStateSpin;
              }

              const winString = lineWins.join('');
              const jsSpin = JSON.stringify(reels);
              const jsJack = JSON.stringify(slotSettings.Jackpots);

              slotSettings.SetGameData('GoBananasNETGambleStep', 5);
              // const hist = slotSettings.GetGameData('GoBananasNETCards'); // This variable is not used in PHP
              const isJack = 'false'; // Hardcoded in PHP

              let nextActionSpin = 'spin';
              let gameStateSpin = 'basic';
              let stackSpin = 'basic';

              if (postData['slotEvent'] === 'freespin') {
                totalWin = slotSettings.GetGameData('GoBananasNETBonusWin'); // get total for freespin series
                const currentFreeGame = slotSettings.GetGameData('GoBananasNETCurrentFreeGame');
                const totalFreeGames = slotSettings.GetGameData('GoBananasNETFreeGames');

                if (totalFreeGames <= currentFreeGame && slotSettings.GetGameData('GoBananasNETBonusWin') > 0) {
                  nextActionSpin = 'spin';
                  stackSpin = 'basic';
                  gameStateSpin = 'basic';
                } else {
                  gameStateSpin = 'freespin';
                  nextActionSpin = 'freespin';
                  stackSpin = 'basic%2Cfreespin';
                }
                fs = totalFreeGames;
                const fsl = totalFreeGames - currentFreeGame;
                freeStateSpin = `&freespins.betlines=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19&freespins.totalwin.cents=0&nextaction=${nextActionSpin}&freespins.left=${fsl}&freespins.wavecount=1&freespins.multiplier=1&gamestate.stack=${stackSpin}&freespins.totalwin.coins=${totalWin}&freespins.total=${fs}&freespins.win.cents=${totalWin * slotSettings.CurrentDenomination * 100}&gamestate.current=${gameStateSpin}&freespins.initial=${fs}&freespins.win.coins=${totalWin}&freespins.betlevel=${slotSettings.GetGameData('GoBananasNETBet')}&totalwin.coins=${totalWin}&credit=${balanceInCents}&totalwin.cents=${totalWin * slotSettings.CurrentDenomination * 100}&game.win.amount=${totalWin / slotSettings.CurrentDenomination}`;
                curReelsSpin += freeStateSpin;
              }
               const serverResponsePart = {
                freeState: freeStateSpin, // This was not clearly defined in PHP for normal spin, ensure it's correct
                slotLines: lines,
                slotBet: betline,
                totalFreeGames: slotSettings.GetGameData('GoBananasNETFreeGames'),
                currentFreeGames: slotSettings.GetGameData('GoBananasNETCurrentFreeGame'),
                Balance: balanceInCents, // This seems to be pre-spin balance from PHP logic
                afterBalance: balanceInCents, // PHP code doesn't update this before sending response
                bonusWin: slotSettings.GetGameData('GoBananasNETBonusWin'),
                totalWin: totalWin, // This is current spin's win or total freespin win
                winLines: [], // PHP code has this as empty array
                Jackpots: slotSettings.Jackpots, // from jsJack
                reelsSymbols: reels // from jsSpin
              };

              response = `{"responseEvent":"spin","responseType":"${postData['slotEvent']}","serverResponse":${JSON.stringify(serverResponsePart)}}`;
              slotSettings.SaveLogReport(response, allbet, lines, reportWin, postData['slotEvent']);
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100); // Re-fetch balance after potential win

              result_tmp.push(
                `rs.i0.r.i1.pos=28&g4mode=false&game.win.coins=${totalWin}&playercurrency=%26%23x20AC%3B&playercurrencyiso=${slotSettings.slotCurrency}&historybutton=false&rs.i0.r.i1.hold=false&rs.i0.r.i4.hold=false&gamestate.history=basic&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&clientaction=spin&rs.i0.r.i2.hold=false&game.win.cents=${totalWin * slotSettings.CurrentDenomination * 100}&rs.i0.r.i2.pos=47&rs.i0.id=basic&totalwin.coins=${totalWin}&credit=${balanceInCents}&totalwin.cents=${totalWin * slotSettings.CurrentDenomination * 100}&gamestate.current=${gameStateSpin}&gameover=true&rs.i0.r.i0.hold=false&jackpotcurrency=%26%23x20AC%3B&multiplier=1&rs.i0.r.i3.pos=4&rs.i0.r.i4.pos=5&isJackpotWin=${isJack}&gamestate.stack=${stackSpin}&nextaction=${nextActionSpin}&rs.i0.r.i0.pos=7&wavecount=1&gamesoundurl=&rs.i0.r.i3.hold=false&game.win.amount=${totalWin / slotSettings.CurrentDenomination}${curReelsSpin}${winString}${wildStr}`
              );
              break;
          }

          if (!result_tmp[0]) {
            response = '{"responseEvent":"error","responseType":"","serverResponse":"Invalid request state"}';
            return;
          }
          response = result_tmp[0];
          slotSettings.SaveGameData();
          slotSettings.SaveGameDataStatic();

        } catch (e: any) {
          if (typeof slotSettings !== 'undefined') {
            slotSettings.InternalErrorSilent(e);
          } else {
            let strLog = '';
            strLog += "\n";
            strLog += `{"responseEvent":"error","responseType":"${e}","serverResponse":"InternalError","request":${JSON.stringify(request.query)},"requestRaw":""}`; // TODO: Find equivalent for file_get_contents('php://input')
            strLog += "\n";
            strLog += ' ############################################### ';
            strLog += "\n";
            // TODO: Implement logging to file
            console.error(strLog);
          }
          response = `{"responseEvent":"error","responseType":"","serverResponse":"InternalError: ${e.message}"}`;
        }
      });
    };

    get_(request, game);
    return response;
  }
}
