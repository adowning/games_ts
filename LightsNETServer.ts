// Placeholder types
type User = { id: number | null };
type Request = any;
type Game = any;
type SlotSettingsType = any;

// Placeholder for Auth and DB
const Auth = { id: (): number | null => 1 };
const DB = { transaction: (callback: () => void) => callback() };

// Placeholder for SlotSettings class (specific to LightsNET)
class SlotSettings {
  constructor(game: Game, userId: number) {}
  is_active(): boolean { return true; }
  GetBalance(): number { return 0; }
  CurrentDenom: number = 0.01; CurrentDenomination: number = 0.01;
  slotId: string = 'LightsNET';
  SetGameData(key: string, value: any): void {}
  HasGameData(key: string): boolean {return false;}
  GetGameData(key: string): any { return 0; }
  Bet: any[] = []; GetHistory(): any {return 'NULL';}
  Denominations: number[] = [0.01, 0.02, 0.05];
  slotCurrency: string = 'USD'; UpdateJackpots(allbet: number): void {}
  SetBalance(amount: number, event?: string): void {}
  GetPercent(): number {return 90;} SetBank(event: string, amount: number, event2?: string): void {}
  slotFreeMpl: number = 1;
  GetSpinSettings(event: string, allbet: number, lines: number): [string, number] {return ['win', 100];}
  MaxWin: number = 100000; GetRandomPay(): number {return 10;}
  increaseRTP: boolean = false; GetBank(event: string): number {return 20000;}
  SymbolGame: string[] = []; Paytable: any = {}; slotWildMpl: number = 1;
  slotFreeCount: Record<number, number> = {3:10, 4:20, 5:30}; // Scatters to Free Spins
  Jackpots: any = {}; SaveLogReport(r:string,a:number,l:number,w:number,e:string): void {}
  SaveGameData(): void {} SaveGameDataStatic(): void {} InternalErrorSilent(e: any): void {console.error(e);}
  GetReelStrips(winType: string, slotEvent: string): any {
      return {
          reel1: ['2','3','4'], reel2: ['2','3','4'], reel3: ['2','3','4'],
          reel4: ['2','3','4'], reel5: ['2','3','4'], rp:[0,0,0,0,0]
      };
  }
}

export class LightsNETServer {
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

          let postData: any = request.query;
          let balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);
          let result_tmp: string[] = [];

          postData['slotEvent'] = 'bet'; // Default
          if (postData['action'] === 'freespin') {
            postData['slotEvent'] = 'freespin'; postData['action'] = 'spin'; // Server PHP maps action 'freespin' to 'spin' internally for spin logic
          } else if (postData['action'] === 'init' || postData['action'] === 'reloadbalance') {
            postData['action'] = 'init'; postData['slotEvent'] = 'init';
          } else if (postData['action'] === 'paytable') {
            postData['slotEvent'] = 'paytable';
          } else if (postData['action'] === 'initfreespin') { // Usually called when FS are already awarded and client needs init values for FS mode
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
            const lines = 9; // Lights has 9 fixed paylines
            const betline = postData['bet_betlevel'];
            if (lines <= 0 || betline <= 0.0001) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid bet state"}`; return;
            }
            if (slotSettings.GetBalance() < (lines * betline)) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid balance"}`; return;
            }
          }

          if (slotSettings.GetGameData(slotSettings.slotId + 'FreeGames') < slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame') && postData['slotEvent'] === 'freespin') {
            response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid bonus state"}`; return;
          }

          const aid = String(postData['action']);
          switch (aid) {
            case 'init':
              const lastEvent = slotSettings.GetHistory();
              slotSettings.SetGameData('LightsNETBonusWin', 0);
              slotSettings.SetGameData('LightsNETFreeGames', 0);
              slotSettings.SetGameData('LightsNETCurrentFreeGame', 0);
              // ... other init SetGameData calls

              let curReelsInit = ''; let freeStateInit = '';
              if (lastEvent !== 'NULL' && lastEvent.serverResponse) {
                // Logic to reconstruct state from lastEvent for reels and free spins
                const reels = lastEvent.serverResponse.reelsSymbols;
                if(reels){
                    curReelsInit = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}%2CSYM${reels.reel1[1]}%2CSYM${reels.reel1[2]}`;
                    curReelsInit += `&rs.i0.r.i1.syms=SYM${reels.reel2[0]}%2CSYM${reels.reel2[1]}%2CSYM${reels.reel2[2]}`;
                    curReelsInit += `&rs.i0.r.i2.syms=SYM${reels.reel3[0]}%2CSYM${reels.reel3[1]}%2CSYM${reels.reel3[2]}`;
                    curReelsInit += `&rs.i0.r.i3.syms=SYM${reels.reel4[0]}%2CSYM${reels.reel4[1]}%2CSYM${reels.reel4[2]}`;
                    curReelsInit += `&rs.i0.r.i4.syms=SYM${reels.reel5[0]}%2CSYM${reels.reel5[1]}%2CSYM${reels.reel5[2]}`;
                    // ... and rs.i1 for freespin reels, and pos for positions
                    if(reels.rp && reels.rp.length > 0) {
                        for(let rpi=0; rpi<5; rpi++) curReelsInit += `&rs.i0.r.i${rpi}.pos=${reels.rp[rpi] || 0}`;
                    }
                }
                freeStateInit = lastEvent.serverResponse.freeState || '';
              } else {
                // Default reels
                const r = (n:number) => Math.floor(Math.random()*n)+1;
                curReelsInit = `&rs.i0.r.i0.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i1.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                // ... for 5 reels
                for(let i=0; i<5; i++) curReelsInit += `&rs.i0.r.i${i}.pos=${r(10)}`;
              }

              slotSettings.Denominations.forEach((d:number, i:number) => slotSettings.Denominations[i] = d * 100);

              let initResponse = '';
              if (slotSettings.GetGameData('LightsNETCurrentFreeGame') < slotSettings.GetGameData('LightsNETFreeGames') && slotSettings.GetGameData('LightsNETFreeGames') > 0) {
                initResponse = `previous.rs.i0=freespin&rs.i1.r.i0.syms=SYM9%2CSYM9%2CSYM11&bl.i6.coins=1&g4mode=false&freespins.win.coins=75&rs.i0.nearwin=4&historybutton=false&rs.i0.r.i4.hold=false&bl.i5.id=5&gameEventSetters.enabled=false&next.rs=freespin&gamestate.history=basic%2Cfreespin&rs.i1.r.i2.hold=false&rs.i1.r.i3.pos=114&rs.i0.r.i1.syms=SYM9%2CSYM9%2CSYM9&bl.i3.coins=1&game.win.cents=375&staticsharedurl=&ws.i0.betline=3&bl.i0.reelset=ALL&rs.i1.r.i2.overlay.i2.row=2&rs.i1.r.i3.hold=false&totalwin.coins=75&bl.i5.line=0%2C0%2C1%2C0%2C0&gamestate.current=freespin&freespins.initial=10&bl.i3.reelset=ALL&rs.i0.r.i2.overlay.i0.row=2&bl.i4.line=2%2C1%2C0%2C1%2C2&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=1%2C2%2C2%2C2%2C1&rs.i1.r.i0.overlay.i0.pos=291&bet.betlines=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8&rs.i0.r.i0.syms=SYM0%2CSYM12%2CSYM12&rs.i1.r.i2.overlay.i0.with=SYM1&rs.i0.r.i3.syms=SYM7%2CSYM7%2CSYM0&rs.i1.r.i1.syms=SYM0%2CSYM6%2CSYM6&bl.i2.id=2&rs.i1.r.i1.pos=49&freespins.win.cents=375&rs.i0.r.i2.overlay.i0.with=SYM1&bl.i7.reelset=ALL&isJackpotWin=false&rs.i0.r.i0.pos=277&rs.i1.r.i2.overlay.i1.pos=82&freespins.betlines=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8&rs.i1.r.i2.overlay.i0.row=0&rs.i0.r.i1.pos=28&rs.i1.r.i3.syms=SYM4%2CSYM4%2CSYM8&rs.i1.r.i2.overlay.i2.with=SYM1&game.win.coins=75&rs.i1.r.i0.hold=false&rs.i0.r.i1.hold=false&bl.i3.id=3&bl.i8.reelset=ALL&clientaction=init&rs.i0.r.i2.hold=false&rs.i0.r.i3.overlay.i0.with=SYM1&casinoID=netent&betlevel.standard=1&bl.i5.coins=1&gameover=false&bl.i8.id=8&rs.i0.r.i3.pos=49&rs.i0.r.i3.overlay.i0.row=0&bl.i0.id=0&bl.i6.line=2%2C2%2C1%2C2%2C2&rs.i1.r.i2.attention.i0=0&bl.i0.line=1%2C1%2C1%2C1%2C1&nextaction=freespin&bl.i3.line=0%2C1%2C2%2C1%2C0&bl.i4.reelset=ALL&bl.i4.coins=1&rs.i0.r.i2.syms=SYM10%2CSYM10%2CSYM10&game.win.amount=3.75&betlevel.all=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&rs.i1.r.i0.overlay.i0.with=SYM1&rs.i1.r.i3.overlay.i0.with=SYM1&freespins.totalwin.cents=375&denomination.all=${slotSettings.Denominations.join('%2C')}&ws.i0.pos.i3=3%2C1&freespins.betlevel=1&ws.i0.pos.i2=2%2C2&playercurrency=%26%23x20AC%3B&rs.i1.r.i2.overlay.i0.pos=81&rs.i1.r.i2.overlay.i1.row=1&current.rs.i0=freespin&ws.i0.reelset=freespin&bl.i1.id=1&ws.i0.pos.i1=1%2C1&ws.i0.pos.i0=0%2C0&rs.i0.r.i3.attention.i0=2&rs.i0.r.i2.overlay.i0.pos=130&rs.i0.id=basic&rs.i1.r.i0.overlay.i0.row=0&credit=${balanceInCents}&rs.i1.r.i4.pos=162&denomination.standard=${slotSettings.CurrentDenomination * 100}&ws.i0.types.i0.coins=75&bl.i1.reelset=ALL&rs.i1.r.i2.overlay.i2.pos=83&multiplier=1&last.rs=freespin&freespins.denomination=5.000&bl.i2.coins=1&bl.i6.id=6&bl.i1.line=0%2C0%2C0%2C0%2C0&rs.i1.r.i3.overlay.i0.row=1&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&ws.i0.sym=SYM6&freespins.totalwin.coins=75&ws.i0.direction=left_to_right&freespins.total=10&gamestate.stack=basic%2Cfreespin&rs.i1.r.i4.syms=SYM11%2CSYM11%2CSYM11&gamesoundurl=&rs.i1.r.i2.pos=81&bet.betlevel=1&rs.i1.nearwin=4%2C3&ws.i0.types.i0.wintype=coins&nearwinallowed=true&bl.i5.reelset=ALL&bl.i7.id=7&bl.i8.line=1%2C0%2C0%2C0%2C1&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=1&freespins.wavecount=1&rs.i0.r.i4.attention.i0=1&freespins.multiplier=1&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&rs.i0.r.i4.syms=SYM12%2CSYM0%2CSYM11&rs.i1.r.i2.overlay.i1.with=SYM1&rs.i1.r.i3.overlay.i0.pos=115&bl.i8.coins=1&rs.i0.r.i2.pos=128&bl.i2.line=2%2C2%2C2%2C2%2C2&rs.i0.r.i0.attention.i0=0&rs.i1.r.i2.syms=SYM0%2CSYM9%2CSYM9&rs.i1.r.i0.pos=291&totalwin.cents=375&bl.i0.coins=1&bl.i2.reelset=ALL&rs.i0.r.i0.hold=false&restore=true&rs.i1.id=freespin&rs.i1.r.i4.hold=false&freespins.left=9&bl.i4.id=4&rs.i0.r.i4.pos=260&bl.i7.coins=1&rs.i0.r.i3.overlay.i0.pos=49&ws.i0.types.i0.cents=375&bl.standard=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8&rs.i1.r.i1.attention.i0=0&bl.i6.reelset=ALL&wavecount=1&rs.i1.r.i1.hold=false&rs.i0.r.i3.hold=false&bet.denomination=${slotSettings.CurrentDenomination * 100}${freeStateInit}`;
              } else {
                initResponse = `rs.i1.r.i0.syms=SYM12%2CSYM0%2CSYM11&bl.i6.coins=1&g4mode=false&historybutton=false&rs.i0.r.i4.hold=false&bl.i5.id=5&gameEventSetters.enabled=false&rs.i1.r.i2.hold=false&rs.i1.r.i3.pos=71&rs.i0.r.i1.syms=SYM9%2CSYM9%2CSYM9&bl.i3.coins=1&game.win.cents=0&staticsharedurl=&bl.i0.reelset=ALL&rs.i1.r.i3.hold=false&totalwin.coins=0&bl.i5.line=0%2C0%2C1%2C0%2C0&gamestate.current=basic&bl.i3.reelset=ALL&bl.i4.line=2%2C1%2C0%2C1%2C2&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=1%2C2%2C2%2C2%2C1&rs.i0.r.i0.syms=SYM12%2CSYM12%2CSYM12&rs.i0.r.i3.syms=SYM3%2CSYM3%2CSYM3&rs.i1.r.i1.syms=SYM10%2CSYM10%2CSYM3&bl.i2.id=2&rs.i1.r.i1.pos=14&bl.i7.reelset=ALL&isJackpotWin=false&rs.i0.r.i0.pos=0&rs.i0.r.i1.pos=0&rs.i1.r.i3.syms=SYM6%2CSYM6%2CSYM8&game.win.coins=0&rs.i1.r.i0.hold=false&rs.i0.r.i1.hold=false&bl.i3.id=3&bl.i8.reelset=ALL&clientaction=init&rs.i0.r.i2.hold=false&casinoID=netent&betlevel.standard=1&bl.i5.coins=1&gameover=true&bl.i8.id=8&rs.i0.r.i3.pos=0&bl.i0.id=0&bl.i6.line=2%2C2%2C1%2C2%2C2&bl.i0.line=1%2C1%2C1%2C1%2C1&nextaction=spin&bl.i3.line=0%2C1%2C2%2C1%2C0&bl.i4.reelset=ALL&bl.i4.coins=1&rs.i0.r.i2.syms=SYM3%2CSYM3%2CSYM3&game.win.amount=0&betlevel.all=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&denomination.all=${slotSettings.Denominations.join('%2C')}&playercurrency=%26%23x20AC%3B&bl.i1.id=1&rs.i0.id=freespin&credit=${balanceInCents}&rs.i1.r.i4.pos=16&denomination.standard=${slotSettings.CurrentDenomination * 100}&bl.i1.reelset=ALL&multiplier=1&bl.i2.coins=1&bl.i6.id=6&bl.i1.line=0%2C0%2C0%2C0%2C0&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&rs.i1.r.i4.syms=SYM9%2CSYM9%2CSYM5&gamesoundurl=&rs.i1.r.i2.pos=29&nearwinallowed=true&bl.i5.reelset=ALL&bl.i7.id=7&bl.i8.line=1%2C0%2C0%2C0%2C1&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=1&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&rs.i0.r.i4.syms=SYM11%2CSYM11%2CSYM11&bl.i8.coins=1&rs.i0.r.i2.pos=0&bl.i2.line=2%2C2%2C2%2C2%2C2&rs.i1.r.i2.syms=SYM7%2CSYM4%2CSYM4&rs.i1.r.i0.pos=163&totalwin.cents=0&bl.i0.coins=1&bl.i2.reelset=ALL&rs.i0.r.i0.hold=false&restore=false&rs.i1.id=basic&rs.i1.r.i4.hold=false&bl.i4.id=4&rs.i0.r.i4.pos=0&bl.i7.coins=1&bl.standard=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8&bl.i6.reelset=ALL&wavecount=1&rs.i1.r.i1.hold=false&rs.i0.r.i3.hold=false${curReelsInit}${freeStateInit}`;
              }
              result_tmp.push(initResponse);
              break;
            case 'paytable':
              result_tmp.push( /* Static paytable string from PHP */
                `pt.i0.comp.i19.symbol=SYM8&bl.i6.coins=1&pt.i0.comp.i15.type=betline&pt.i0.comp.i23.freespins=0&pt.i0.comp.i32.type=betline&pt.i0.comp.i29.type=betline&pt.i0.comp.i4.multi=200&pt.i0.comp.i15.symbol=SYM7&pt.i0.comp.i17.symbol=SYM7&pt.i0.comp.i5.freespins=0&pt.i1.comp.i14.multi=400&pt.i0.comp.i22.multi=15&pt.i0.comp.i23.n=5&pt.i1.comp.i19.type=betline&pt.i0.comp.i11.symbol=SYM5&pt.i0.comp.i13.symbol=SYM6&pt.i1.comp.i8.type=betline&pt.i1.comp.i4.n=4&pt.i1.comp.i27.multi=3&pt.i0.comp.i15.multi=9&pt.i1.comp.i27.symbol=SYM11&bl.i0.reelset=ALL&pt.i0.comp.i16.freespins=0&pt.i0.comp.i28.multi=15&pt.i1.comp.i6.freespins=0&pt.i1.comp.i29.symbol=SYM11&pt.i1.comp.i29.freespins=0&pt.i1.comp.i22.n=4&pt.i1.comp.i30.symbol=SYM12&pt.i1.comp.i3.multi=15&pt.i0.comp.i11.n=5&pt.i0.comp.i4.freespins=0&pt.i1.comp.i23.symbol=SYM9&pt.i1.comp.i25.symbol=SYM10&bl.i3.reelset=ALL&bl.i4.line=2%2C1%2C0%2C1%2C2&pt.i0.comp.i30.freespins=0&pt.i1.comp.i24.type=betline&pt.i0.comp.i19.n=4&pt.i0.id=basic&pt.i0.comp.i1.type=scatter&bl.i2.id=2&pt.i1.comp.i10.type=betline&pt.i0.comp.i2.symbol=SYM0&pt.i0.comp.i4.symbol=SYM3&pt.i1.comp.i5.freespins=0&pt.i0.comp.i20.type=betline&pt.i1.comp.i8.symbol=SYM4&pt.i1.comp.i19.n=4&pt.i0.comp.i17.freespins=0&pt.i0.comp.i6.symbol=SYM4&pt.i0.comp.i8.symbol=SYM4&pt.i0.comp.i0.symbol=SYM0&pt.i1.comp.i11.n=5&pt.i0.comp.i5.n=5&pt.i1.comp.i2.symbol=SYM0&pt.i0.comp.i3.type=betline&pt.i0.comp.i3.freespins=0&pt.i0.comp.i10.multi=100&pt.i1.id=freespin&pt.i1.comp.i19.multi=15&bl.i3.id=3&pt.i1.comp.i6.symbol=SYM4&pt.i0.comp.i27.multi=3&pt.i0.comp.i9.multi=9&pt.i0.comp.i22.symbol=SYM9&pt.i0.comp.i26.symbol=SYM10&pt.i1.comp.i19.freespins=0&pt.i0.comp.i24.n=3&bl.i8.reelset=ALL&pt.i0.comp.i14.freespins=0&pt.i0.comp.i21.freespins=0&clientaction=paytable&pt.i1.comp.i27.freespins=0&pt.i1.comp.i4.freespins=0&pt.i1.comp.i12.type=betline&pt.i1.comp.i5.n=5&bl.i5.coins=1&pt.i1.comp.i8.multi=750&pt.i1.comp.i21.symbol=SYM9&pt.i1.comp.i23.n=5&pt.i0.comp.i22.type=betline&pt.i0.comp.i24.freespins=0&pt.i1.comp.i32.symbol=SYM12&bl.i8.id=8&pt.i0.comp.i16.multi=50&pt.i0.comp.i21.multi=3&pt.i1.comp.i13.multi=75&pt.i0.comp.i12.n=3&bl.i6.line=2%2C2%2C1%2C2%2C2&pt.i0.comp.i13.type=betline&pt.i1.comp.i9.multi=9&bl.i0.line=1%2C1%2C1%2C1%2C1&pt.i0.comp.i19.type=betline&pt.i0.comp.i6.freespins=0&pt.i1.comp.i2.multi=0&pt.i1.comp.i7.freespins=0&pt.i0.comp.i31.freespins=0&pt.i0.comp.i3.multi=15&pt.i0.comp.i6.n=3&pt.i1.comp.i22.type=betline&pt.i1.comp.i12.n=3&pt.i1.comp.i3.type=betline&pt.i0.comp.i21.n=3&pt.i1.comp.i10.freespins=0&pt.i1.comp.i28.type=betline&pt.i1.comp.i6.n=3&pt.i0.comp.i29.n=5&pt.i1.comp.i31.type=betline&bl.i1.id=1&pt.i1.comp.i20.multi=100&pt.i0.comp.i27.freespins=0&pt.i1.comp.i24.n=3&pt.i0.comp.i10.type=betline&pt.i1.comp.i11.symbol=SYM5&pt.i1.comp.i27.type=betline&pt.i1.comp.i2.type=scatter&pt.i0.comp.i2.freespins=30&pt.i0.comp.i5.multi=1000&pt.i0.comp.i7.n=4&pt.i0.comp.i32.n=5&pt.i1.comp.i1.freespins=20&pt.i0.comp.i11.multi=500&pt.i1.comp.i14.symbol=SYM6&pt.i1.comp.i16.symbol=SYM7&pt.i1.comp.i23.multi=75&pt.i0.comp.i7.type=betline&pt.i1.comp.i4.type=betline&pt.i0.comp.i17.n=5&pt.i1.comp.i18.multi=3&bl.i2.coins=1&bl.i6.id=6&pt.i0.comp.i29.multi=40&pt.i1.comp.i13.n=4&pt.i0.comp.i8.freespins=0&pt.i1.comp.i26.type=betline&pt.i1.comp.i4.multi=200&pt.i0.comp.i8.multi=750&gamesoundurl=&pt.i0.comp.i1.freespins=20&pt.i0.comp.i12.type=betline&pt.i0.comp.i14.multi=400&pt.i1.comp.i7.multi=150&bl.i5.reelset=ALL&pt.i0.comp.i22.n=4&pt.i0.comp.i28.symbol=SYM11&pt.i1.comp.i17.type=betline&bl.i7.id=7&pt.i1.comp.i11.type=betline&pt.i0.comp.i6.multi=15&pt.i1.comp.i0.symbol=SYM0&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=1&pt.i1.comp.i7.n=4&pt.i1.comp.i5.multi=1000&pt.i1.comp.i5.symbol=SYM3&pt.i0.comp.i18.type=betline&pt.i0.comp.i23.symbol=SYM9&pt.i0.comp.i21.type=betline&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&pt.i1.comp.i25.n=4&pt.i0.comp.i8.type=betline&pt.i0.comp.i7.freespins=0&pt.i1.comp.i15.multi=9&pt.i0.comp.i2.type=scatter&pt.i0.comp.i13.multi=75&pt.i1.comp.i20.type=betline&pt.i0.comp.i17.type=betline&pt.i0.comp.i30.type=betline&pt.i1.comp.i22.symbol=SYM9&pt.i1.comp.i30.freespins=0&pt.i1.comp.i22.multi=15&bl.i0.coins=1&bl.i2.reelset=ALL&pt.i0.comp.i8.n=5&pt.i0.comp.i10.n=4&pt.i1.comp.i6.multi=15&pt.i1.comp.i22.freespins=0&pt.i0.comp.i11.type=betline&pt.i1.comp.i19.symbol=SYM8&pt.i0.comp.i18.n=3&pt.i0.comp.i22.freespins=0&pt.i0.comp.i20.symbol=SYM8&pt.i0.comp.i15.freespins=0&pt.i1.comp.i14.n=5&pt.i1.comp.i16.multi=50&pt.i0.comp.i31.symbol=SYM12&pt.i1.comp.i15.freespins=0&pt.i0.comp.i27.type=betline&pt.i1.comp.i28.freespins=0&pt.i0.comp.i28.freespins=0&pt.i0.comp.i0.n=3&pt.i0.comp.i7.symbol=SYM4&pt.i1.comp.i21.multi=3&pt.i1.comp.i30.type=betline&pt.i1.comp.i0.freespins=10&pt.i0.comp.i0.type=scatter&pt.i1.comp.i0.multi=0&g4mode=false&pt.i1.comp.i8.n=5&pt.i0.comp.i25.multi=15&historybutton=false&pt.i0.comp.i16.symbol=SYM7&pt.i1.comp.i21.freespins=0&bl.i5.id=5&pt.i0.comp.i1.multi=0&pt.i0.comp.i27.n=3&pt.i0.comp.i18.symbol=SYM8&pt.i1.comp.i9.type=betline&pt.i0.comp.i12.multi=9&pt.i0.comp.i32.multi=30&pt.i1.comp.i24.multi=3&pt.i1.comp.i14.freespins=0&pt.i1.comp.i23.type=betline&bl.i3.coins=1&pt.i1.comp.i26.n=5&pt.i0.comp.i12.symbol=SYM6&pt.i0.comp.i14.symbol=SYM6&pt.i1.comp.i13.freespins=0&pt.i1.comp.i28.symbol=SYM11&pt.i0.comp.i14.type=betline&pt.i1.comp.i17.multi=300&pt.i0.comp.i18.multi=3&pt.i1.comp.i0.n=3&pt.i1.comp.i26.symbol=SYM10&pt.i1.comp.i31.symbol=SYM12&bl.i5.line=0%2C0%2C1%2C0%2C0&pt.i0.comp.i7.multi=150&pt.i0.comp.i9.n=3&pt.i0.comp.i30.n=3&pt.i1.comp.i21.type=betline&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=1%2C2%2C2%2C2%2C1&pt.i0.comp.i28.type=betline&pt.i1.comp.i31.multi=15&pt.i1.comp.i18.type=betline&pt.i0.comp.i10.symbol=SYM5&pt.i0.comp.i15.n=3&pt.i0.comp.i21.symbol=SYM9&bl.i7.reelset=ALL&pt.i0.comp.i31.type=betline&pt.i1.comp.i15.n=3&isJackpotWin=false&pt.i1.comp.i20.freespins=0&pt.i1.comp.i7.type=betline&pt.i1.comp.i11.multi=500&pt.i1.comp.i30.n=3&pt.i0.comp.i1.n=4&pt.i0.comp.i10.freespins=0&pt.i0.comp.i20.multi=100&pt.i0.comp.i20.n=5&pt.i0.comp.i29.symbol=SYM11&pt.i1.comp.i3.symbol=SYM3&pt.i0.comp.i17.multi=300&pt.i1.comp.i23.freespins=0&pt.i1.comp.i25.type=betline&pt.i1.comp.i9.n=3&pt.i0.comp.i25.symbol=SYM10&pt.i0.comp.i26.type=betline&pt.i0.comp.i28.n=4&pt.i0.comp.i9.type=betline&pt.i0.comp.i2.multi=0&pt.i1.comp.i27.n=3&pt.i0.comp.i0.freespins=10&pt.i1.comp.i16.type=betline&pt.i1.comp.i25.multi=15&pt.i1.comp.i16.freespins=0&pt.i1.comp.i20.symbol=SYM8&pt.i1.comp.i12.multi=9&pt.i0.comp.i29.freespins=0&pt.i1.comp.i1.n=4&pt.i1.comp.i5.type=betline&pt.i1.comp.i11.freespins=0&pt.i1.comp.i24.symbol=SYM10&pt.i0.comp.i31.n=4&pt.i0.comp.i9.symbol=SYM5&pt.i1.comp.i13.symbol=SYM6&pt.i1.comp.i17.symbol=SYM7&pt.i0.comp.i16.n=4&bl.i0.id=0&pt.i0.comp.i16.type=betline&pt.i1.comp.i16.n=4&pt.i0.comp.i5.symbol=SYM3&pt.i1.comp.i7.symbol=SYM4&bl.i3.line=0%2C1%2C2%2C1%2C0&bl.i4.reelset=ALL&bl.i4.coins=1&pt.i0.comp.i2.n=5&pt.i0.comp.i1.symbol=SYM0&pt.i1.comp.i31.n=4&pt.i1.comp.i31.freespins=0&pt.i0.comp.i19.freespins=0&pt.i1.comp.i14.type=betline&pt.i0.comp.i6.type=betline&pt.i1.comp.i9.freespins=0&pt.i1.comp.i2.freespins=30&playercurrency=%26%23x20AC%3B&pt.i1.comp.i25.freespins=0&pt.i1.comp.i30.multi=3&pt.i0.comp.i25.n=4&pt.i1.comp.i10.multi=100&pt.i1.comp.i10.symbol=SYM5&pt.i1.comp.i28.n=4&pt.i1.comp.i32.freespins=0&pt.i0.comp.i9.freespins=0&pt.i1.comp.i2.n=5&pt.i1.comp.i20.n=5&credit=500000&pt.i0.comp.i5.type=betline&pt.i1.comp.i24.freespins=0&pt.i0.comp.i11.freespins=0&pt.i0.comp.i26.multi=50&pt.i0.comp.i25.type=betline&pt.i1.comp.i32.type=betline&bl.i1.reelset=ALL&pt.i1.comp.i18.symbol=SYM8&pt.i0.comp.i31.multi=15&pt.i1.comp.i12.symbol=SYM6&pt.i0.comp.i4.type=betline&pt.i0.comp.i13.freespins=0&pt.i1.comp.i15.type=betline&pt.i1.comp.i26.freespins=0&pt.i0.comp.i26.freespins=0&pt.i1.comp.i13.type=betline&pt.i1.comp.i1.multi=0&pt.i1.comp.i1.type=scatter&pt.i1.comp.i8.freespins=0&bl.i1.line=0%2C0%2C0%2C0%2C0&pt.i0.comp.i13.n=4&pt.i0.comp.i20.freespins=0&pt.i1.comp.i17.n=5&pt.i0.comp.i23.type=betline&pt.i1.comp.i29.type=betline&pt.i0.comp.i30.symbol=SYM12&pt.i0.comp.i32.symbol=SYM12&pt.i1.comp.i32.n=5&pt.i0.comp.i3.n=3&pt.i1.comp.i17.freespins=0&pt.i1.comp.i26.multi=50&pt.i1.comp.i32.multi=30&pt.i1.comp.i6.type=betline&pt.i1.comp.i0.type=scatter&pt.i1.comp.i1.symbol=SYM0&pt.i1.comp.i29.multi=40&pt.i0.comp.i25.freespins=0&pt.i1.comp.i4.symbol=SYM3&bl.i8.line=1%2C0%2C0%2C0%2C1&pt.i0.comp.i24.symbol=SYM10&pt.i0.comp.i26.n=5&pt.i0.comp.i27.symbol=SYM11&bl.i8.coins=1&pt.i0.comp.i32.freespins=0&pt.i1.comp.i29.n=5&pt.i0.comp.i23.multi=75&bl.i2.line=2%2C2%2C2%2C2%2C2&pt.i1.comp.i3.n=3&pt.i0.comp.i30.multi=3&pt.i1.comp.i21.n=3&pt.i1.comp.i28.multi=15&pt.i0.comp.i18.freespins=0&pt.i1.comp.i15.symbol=SYM7&pt.i1.comp.i18.freespins=0&pt.i1.comp.i3.freespins=0&bl.i4.id=4&bl.i7.coins=1&pt.i0.comp.i14.n=5&pt.i0.comp.i0.multi=0&pt.i1.comp.i9.symbol=SYM5&bl.i6.reelset=ALL&pt.i0.comp.i19.multi=15&pt.i0.comp.i3.symbol=SYM3&pt.i0.comp.i24.type=betline&pt.i1.comp.i18.n=3&pt.i1.comp.i12.freespins=0&pt.i0.comp.i12.freespins=0&pt.i0.comp.i4.n=4&pt.i1.comp.i10.n=4&pt.i0.comp.i24.multi=3`
              );
              break;
            // Cases for spin, freespin
            case 'spin': // This will also handle 'freespin' action after pre-processing
              const linesId: number[][] = [ // 9 lines for Lights
                [2,2,2,2,2],[1,1,1,1,1],[3,3,3,3,3],[1,2,3,2,1],[3,2,1,2,3],
                [1,1,2,1,1],[3,3,2,3,3],[2,3,3,3,2],[2,1,1,1,2]
              ];
              const lines = 9;
              let currentBetline: number;
              let currentAllbet: number;
              let bonusMpl = 1;
              let rset = 'basic'; // Reelset, 'basic' or 'freespin'

              if (postData['slotEvent'] !== 'freespin') {
                currentBetline = postData['bet_betlevel'];
                currentAllbet = currentBetline * lines;
                slotSettings.UpdateJackpots(currentAllbet); // Though Lights doesn't have progressives
                slotSettings.SetBalance(-1 * currentAllbet, 'bet');
                const bankSum = currentAllbet / 100 * slotSettings.GetPercent();
                slotSettings.SetBank('bet', bankSum, 'bet');
                // slotSettings.UpdateJackpots(currentAllbet); // Called again in others

                slotSettings.SetGameData('LightsNETBonusWin', 0);
                slotSettings.SetGameData('LightsNETFreeGames', 0);
                slotSettings.SetGameData('LightsNETCurrentFreeGame', 0);
                slotSettings.SetGameData('LightsNETTotalWin', 0);
                slotSettings.SetGameData('LightsNETBet', currentBetline);
                slotSettings.SetGameData('LightsNETDenom', postData['bet_denomination']);
                // slotSettings.SetGameData('LightsNETFreeBalance', parseFloat(slotSettings.GetBalance().toFixed(2)) * 100);
              } else { // Freespin event
                postData['bet_denomination'] = slotSettings.GetGameData('LightsNETDenom');
                slotSettings.CurrentDenom = postData['bet_denomination'];
                slotSettings.CurrentDenomination = postData['bet_denomination'];
                currentBetline = slotSettings.GetGameData('LightsNETBet');
                currentAllbet = currentBetline * lines;
                slotSettings.SetGameData('LightsNETCurrentFreeGame', slotSettings.GetGameData('LightsNETCurrentFreeGame') + 1);
                bonusMpl = slotSettings.slotFreeMpl; // Usually 1
                rset = 'freespin';
              }

              const winTypeTmp = slotSettings.GetSpinSettings(postData['slotEvent'], currentAllbet, lines);
              let winType = winTypeTmp[0];
              let spinWinLimit = winTypeTmp[1];
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

              if (winType === 'bonus' && postData['slotEvent'] === 'freespin') {
                winType = 'win';
              }

              let totalWin = 0;
              let lineWins: string[] = [];
              const wild = ['1']; // SYM_1 is Wild
              const scatter = '0'; // SYM_0 is Scatter

              let reels: any;
              let reelsTmp: any;
              let wildStrArr: string[] = []; // For floating wilds string

              for (let i = 0; i <= 2000; i++) { // Spin loop
                totalWin = 0; lineWins = []; wildStrArr = [];
                let cWins: number[] = new Array(lines).fill(0);

                reels = slotSettings.GetReelStrips(winType, postData['slotEvent']);
                reelsTmp = JSON.parse(JSON.stringify(reels)); // Save original reels before floating wilds

                // Floating Wilds Logic
                let wildsCount = (postData['slotEvent'] === 'freespin') ? Math.floor(Math.random() * (6 - 3 + 1)) + 3 : Math.floor(Math.random() * (4 - 2 + 1)) + 2; // 3-6 in FS, 2-4 in base
                let wc = 0; // Wilds placed count
                let attempts = 0; // To prevent infinite loop if all positions are already wild/scatter

                // Create a list of available positions
                let availablePositions: {r:number, p:number}[] = [];
                for(let r_idx=1; r_idx<=5; r_idx++) {
                    for(let p_idx=0; p_idx<=2; p_idx++) {
                        if(reels[`reel${r_idx}`][p_idx] !== '1' && reels[`reel${r_idx}`][p_idx] !== '0') { // Not already Wild or Scatter
                            availablePositions.push({r: r_idx, p: p_idx});
                        }
                    }
                }
                availablePositions.sort(() => 0.5 - Math.random()); // Shuffle available positions

                for(let k=0; k < Math.min(wildsCount, availablePositions.length); k++){
                    const pos = availablePositions[k];
                    reels[`reel${pos.r}`][pos.p] = '1'; // Place Wild
                    wc++;
                }

                // Construct wildStrArr for response based on placed wilds
                let wildOverlayIndex = 0;
                for(let r_idx=1; r_idx<=5; r_idx++) {
                    let reelOverlayCount = 0;
                    for(let p_idx=0; p_idx<=2; p_idx++) {
                        if(reels[`reel${r_idx}`][p_idx] === '1' && reelsTmp[`reel${r_idx}`][p_idx] !== '1') { // If it's a newly placed floating wild
                             wildStrArr.push(`&rs.i0.r.i${r_idx-1}.overlay.i${reelOverlayCount}.pos=321&rs.i0.r.i${r_idx-1}.overlay.i${reelOverlayCount}.with=SYM1&rs.i0.r.i${r_idx-1}.overlay.i${reelOverlayCount}.row=${p_idx}`);
                             reelOverlayCount++;
                        }
                    }
                }

                // Calculate wins with floating wilds applied
                let winLineCount = 0;
                for (let k = 0; k < lines; k++) {
                  let tmpStringWin = '';
                  for (let j = 0; j < slotSettings.SymbolGame.length; j++) {
                    const csym = String(slotSettings.SymbolGame[j]);
                    if (csym === scatter || !slotSettings.Paytable['SYM_' + csym]) continue;

                    const s: string[] = [];
                    for(let reelIdx = 0; reelIdx < 5; reelIdx++) s[reelIdx] = reels[`reel${reelIdx+1}`][linesId[k][reelIdx]-1];

                    let pay = 0; let len = 0;
                    if((s[0]===csym || wild.includes(s[0])) && (s[1]===csym || wild.includes(s[1])) && (s[2]===csym || wild.includes(s[2]))){
                        pay=slotSettings.Paytable['SYM_'+csym][3]; len=3;
                        if((s[3]===csym || wild.includes(s[3]))){
                            pay=slotSettings.Paytable['SYM_'+csym][4]; len=4;
                            if((s[4]===csym || wild.includes(s[4]))){ pay=slotSettings.Paytable['SYM_'+csym][5]; len=5; }
                        }
                    }
                    if(pay > 0){
                        const tmpWin = pay * currentBetline * bonusMpl;
                        if(cWins[k] < tmpWin){
                            cWins[k] = tmpWin;
                            tmpStringWin = `&ws.i${winLineCount}.reelset=${rset}&ws.i${winLineCount}.types.i0.coins=${tmpWin}`;
                            for(let l=0; l<len; l++) tmpStringWin += `&ws.i${winLineCount}.pos.i${l}=${l}%2C${linesId[k][l]-1}`;
                            tmpStringWin += `&ws.i${winLineCount}.types.i0.wintype=coins&ws.i${winLineCount}.betline=${k}&ws.i${winLineCount}.sym=SYM${csym}&ws.i${winLineCount}.direction=left_to_right&ws.i${winLineCount}.types.i0.cents=${tmpWin * slotSettings.CurrentDenomination * 100}`;
                        }
                    }
                  }
                  if (cWins[k] > 0 && tmpStringWin !== '') { lineWins.push(tmpStringWin); totalWin += cWins[k]; winLineCount++; }
                }

                reels = reelsTmp; // Restore original reels for scatter check if needed, though PHP does it after this loop with tmpReels
                let scattersCount = 0; const scPos: string[] = [];
                for(let r=1; r<=5; r++) for(let p=0; p<=2; p++) if(reels[`reel${r}`][p]===scatter){scattersCount++;scPos.push(`&ws.i0.pos.i${r-1}=${r-1}%2C${p}`);}

                let scattersStr = '';
                if (scattersCount >= 3) {
                  scattersStr = `&ws.i0.types.i0.freespins=${slotSettings.slotFreeCount[scattersCount]}&ws.i0.reelset=basic&ws.i0.betline=null&ws.i0.types.i0.wintype=freespins&ws.i0.direction=none${scPos.join('')}`;
                }
                // Total win includes line wins. Scatter wins are not additive in this game's paytable for direct coin value.

                if (i > 1000) winType = 'none';
                if (i > 1500) { response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"Bad Reel Strip"}`; return; }
                if (slotSettings.MaxWin < (totalWin * slotSettings.CurrentDenom)) { /* continue loop */ }
                else {
                  const minWin = slotSettings.GetRandomPay();
                  if (i > 700) { /* minWin = 0; */ }
                  if (slotSettings.increaseRTP && winType === 'win' && totalWin < (minWin * currentAllbet)) { /* continue loop */ }
                  else if (scattersCount >= 3 && winType !== 'bonus') { /* continue to ensure FS trigger */ }
                  else if (totalWin <= spinWinLimit && winType === 'bonus') { const cB = slotSettings.GetBank(postData['slotEvent']||''); if(cB < spinWinLimit) spinWinLimit = cB; else break; }
                  else if (totalWin > 0 && totalWin <= spinWinLimit && winType === 'win') { const cB = slotSettings.GetBank(postData['slotEvent']||''); if(cB < spinWinLimit) spinWinLimit = cB; else break; }
                  else if (totalWin === 0 && winType === 'none') break;
                }
              } // End spin loop

              let freeStateSpin = '';
              if (totalWin > 0) {
                slotSettings.SetBank(postData['slotEvent'] || '', -1 * totalWin);
                slotSettings.SetBalance(totalWin);
              }
              const reportWin = totalWin;
              const wildStrResp = wildStrArr.join('');

              let curReelsResponse = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}%2CSYM${reels.reel1[1]}%2CSYM${reels.reel1[2]}`;
              for(let r=1; r<5; r++) curReelsResponse += `&rs.i0.r.i${r}.syms=SYM${reels[`reel${r+1}`][0]}%2CSYM${reels[`reel${r+1}`][1]}%2CSYM${reels[`reel${r+1}`][2]}`;

              if (postData['slotEvent'] === 'freespin') {
                slotSettings.SetGameData('LightsNETBonusWin', slotSettings.GetGameData('LightsNETBonusWin') + totalWin);
                slotSettings.SetGameData('LightsNETTotalWin', slotSettings.GetGameData('LightsNETTotalWin') + totalWin);
              } else {
                slotSettings.SetGameData('LightsNETTotalWin', totalWin);
              }

              let fsAwarded = 0;
              if (scattersCount >= 3) {
                slotSettings.SetGameData('LightsNETFreeStartWin', totalWin);
                // slotSettings.SetGameData('LightsNETBonusWin', totalWin); // BonusWin is cumulative in FS
                fsAwarded = slotSettings.slotFreeCount[scattersCount];
                slotSettings.SetGameData('LightsNETFreeGames', slotSettings.GetGameData('LightsNETFreeGames') + fsAwarded); // Add to existing FS if retriggered
              }

              const winStringResp = lineWins.join('');
              const jsSpin = JSON.stringify(reels); // PHP has this, but not directly in response string
              const jsJack = JSON.stringify(slotSettings.Jackpots); // Not used

              let finalNextAction = 'spin';
              let finalGamestate = 'basic';
              let finalStack = 'basic';

              if (postData['slotEvent'] === 'freespin' || fsAwarded > 0) {
                const currentTotalFSWin = slotSettings.GetGameData('LightsNETBonusWin');
                const totalFSLiteral = slotSettings.GetGameData('LightsNETFreeGames');
                const currentFSLiteral = slotSettings.GetGameData('LightsNETCurrentFreeGame');
                const fsLeft = totalFSLiteral - currentFSLiteral;

                if (fsLeft <= 0 && postData['slotEvent'] === 'freespin') { // Last actual played free spin
                    finalNextAction = 'spin'; finalGamestate = 'basic'; finalStack = 'basic';
                } else { // Still in freespins or just triggered them
                    finalNextAction = 'freespin'; finalGamestate = 'freespin'; finalStack = 'basic%2Cfreespin';
                }
                freeStateSpin = `&freespins.left=${fsLeft}&freespins.total=${totalFSLiteral}&freespins.totalwin.coins=${currentTotalFSWin}&freespins.win.coins=${totalWin}&gamestate.current=${finalGamestate}&nextaction=${finalNextAction}`;
                // ... other FS params
                curReelsResponse += freeStateSpin;
              }

              const serverResponseObj = {
                  freeState: freeStateSpin, slotLines: lines, slotBet: currentBetline,
                  totalFreeGames: slotSettings.GetGameData('LightsNETFreeGames'),
                  currentFreeGames: slotSettings.GetGameData('LightsNETCurrentFreeGame'),
                  Balance: balanceInCents, afterBalance: balanceInCents, // afterBalance might need re-fetch from slotSettings
                  bonusWin: slotSettings.GetGameData('LightsNETBonusWin'),
                  totalWin: (postData['slotEvent'] === 'freespin' ? slotSettings.GetGameData('LightsNETBonusWin') : totalWin),
                  winLines: [], Jackpots: jsJack, reelsSymbols: reels // For log
              };
              const serverResponseStr = JSON.stringify(serverResponseObj);
              slotSettings.SaveLogReport(serverResponseStr, currentAllbet, lines, reportWin, postData['slotEvent']);
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100); // Update after save if balance changed

              let finalResponseString = `rs.i0.r.i1.pos=18&g4mode=false&game.win.coins=${totalWin}&playercurrency=%26%23x20AC%3B&playercurrencyiso=${slotSettings.slotCurrency}&historybutton=false&rs.i0.r.i1.hold=false&rs.i0.r.i4.hold=false&gamestate.history=basic&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&clientaction=spin&rs.i0.r.i2.hold=false&game.win.cents=${totalWin * slotSettings.CurrentDenomination * 100}&rs.i0.r.i2.pos=47&rs.i0.id=${rset}&totalwin.coins=${totalWin}&credit=${balanceInCents}&totalwin.cents=${totalWin * slotSettings.CurrentDenomination * 100}&gamestate.current=${finalGamestate}&gameover=true&rs.i0.r.i0.hold=false&jackpotcurrency=%26%23x20AC%3B&multiplier=1&rs.i0.r.i3.pos=4&rs.i0.r.i4.pos=5&isJackpotWin=false&gamestate.stack=${finalStack}&nextaction=${finalNextAction}&rs.i0.r.i0.pos=7&wavecount=1&gamesoundurl=&rs.i0.r.i3.hold=false&game.win.amount=${totalWin / slotSettings.CurrentDenomination}`;
              finalResponseString += curReelsResponse + winStringResp + wildStrResp + scattersStr;
              result_tmp.push(finalResponseString);
              break;
            default:
              response = `{"responseEvent":"error","responseType":"","serverResponse":"Unknown action: ${aid}"}`; return;
          }

          if (result_tmp.length === 0 && !response) {
            response = '{"responseEvent":"error","responseType":"","serverResponse":"Invalid request state for action: ' + aid + '"}';
            return;
          }
          response = result_tmp[0] || "";
          slotSettings.SaveGameData();
          slotSettings.SaveGameDataStatic();

        } catch (e: any) {
          if (typeof slotSettings !== 'undefined') slotSettings.InternalErrorSilent(e);
          else console.error(`LightsNETServer Error (no slotSettings): ${e.message}, Request: ${JSON.stringify(request.query)}`);
          response = `{"responseEvent":"error","responseType":"","serverResponse":"InternalError: ${e.message}"}`;
        }
      });
    };
    get_(request, game);
    return response;
  }
}
