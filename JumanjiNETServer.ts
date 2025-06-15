// Placeholder types (replace with actual Prisma models or interfaces)
type User = { id: number | null };
type Request = any; // Replace with actual request type
type Game = any; // Replace with actual game type
type SlotSettingsType = any; // Replace with actual SlotSettings type

// Placeholder for Auth and DB
const Auth = { id: (): number | null => 1 };
const DB = { transaction: (callback: () => void) => callback() };

// Placeholder for SlotSettings class (specific to JumanjiNET)
class SlotSettings {
  constructor(game: Game, userId: number) {}
  is_active(): boolean { return true; }
  GetBalance(): number { return 0; }
  CurrentDenom: number = 0.01; CurrentDenomination: number = 0.01;
  slotId: string = 'JumanjiNET';
  SetGameData(key: string, value: any): void {}
  HasGameData(key: string): boolean {return false;}
  GetGameData(key: string): any {
    if(key.endsWith('ShuffleActive')) return 0; // Default to not active
    return 0;
  }
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
  slotFreeCount: Record<number, number> = {3:5, 4:6, 5:7}; // Example values
  Jackpots: any = {}; SaveLogReport(r:string,a:number,l:number,w:number,e:string): void {}
  SaveGameData(): void {} SaveGameDataStatic(): void {} InternalErrorSilent(e: any): void {console.error(e);}
  GetReelStrips(winType: string, slotEvent: string): any {
      return {
          reel1: ['1','2','3'], reel2: ['1','2','3','4'], reel3: ['1','2','3','4','5'],
          reel4: ['1','2','3','4'], reel5: ['1','2','3'], rp:[0,0,0,0,0]
      };
  }
}

export class JumanjiNETServer {
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
            postData['slotEvent'] = 'freespin'; // action remains 'freespin'
          } else if (postData['action'] === 'respin') {
            postData['slotEvent'] = 'respin'; postData['action'] = 'spin';
          } else if (postData['action'] === 'shuffle') {
            postData['slotEvent'] = 'shuffle'; postData['action'] = 'spin';
            if (slotSettings.GetGameData(slotSettings.slotId + 'ShuffleActive') != 1) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid bonus state"}`;
              return;
            }
          } else if (postData['action'] === 'init' || postData['action'] === 'reloadbalance') {
            postData['action'] = 'init'; postData['slotEvent'] = 'init';
          } else if (postData['action'] === 'paytable') {
            postData['slotEvent'] = 'paytable';
          } else if (postData['action'] === 'initfreespin') {
            postData['slotEvent'] = 'initfreespin';
          } else if (postData['action'] === 'initbonus') { // Jumanji board game
            postData['slotEvent'] = 'initbonus';
          } else if (postData['action'] === 'bonusaction') { // Jumanji board game dice roll
            postData['slotEvent'] = 'bonusaction';
          } else if (postData['action'] === 'endbonus') { // Jumanji board game end
            postData['slotEvent'] = 'endbonus';
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
            const lines = 20; // Jumanji has 36 bet lines, but PHP uses $lines=20 for this check.
            const betline = postData['bet_betlevel'];
            if (lines <= 0 || betline <= 0.0001) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid bet state"}`; return;
            }
            if (slotSettings.GetBalance() < (lines * betline)) { // This check might need adjustment for 36 lines
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
              slotSettings.SetGameData(slotSettings.slotId + 'BonusWin', 0);
              slotSettings.SetGameData(slotSettings.slotId + 'FreeGames', 0);
              // ... other SetGameData calls for init state
              let curReelsInit = '';
              let freeStateInit = '';
              if (lastEvent !== 'NULL' && lastEvent.serverResponse) {
                // Logic to reconstruct state from lastEvent.serverResponse
                // This includes reels, free spin count, bonus wins etc.
                // Jumanji reel string construction:
                const reels = lastEvent.serverResponse.reelsSymbols;
                if (reels) {
                    curReelsInit = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}%2CSYM${reels.reel1[1]}%2CSYM${reels.reel1[2]}`;
                    curReelsInit += `&rs.i0.r.i1.syms=SYM${reels.reel2[0]}%2CSYM${reels.reel2[1]}%2CSYM${reels.reel2[2]}%2CSYM${reels.reel2[3]}`;
                    // ... and so on for all 5 reels with their specific symbol counts (3-4-5-4-3)
                    // Also add rs.i1... for freespin reels and pos= for positions
                }
                freeStateInit = lastEvent.serverResponse.freeState || '';
              } else {
                // Default initial reels (random or fixed)
                const r = (n:number) => Math.floor(Math.random()*n)+1;
                curReelsInit = `&rs.i0.r.i0.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i1.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i2.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i3.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i4.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                // Add positions
                for(let i=0; i<5; i++) curReelsInit += `&rs.i0.r.i${i}.pos=${r(10)}`;
              }
              slotSettings.Denominations.forEach((d, i) => slotSettings.Denominations[i] = d * 100);

              let initResponse = '';
              if (slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame') < slotSettings.GetGameData(slotSettings.slotId + 'FreeGames') && slotSettings.GetGameData(slotSettings.slotId + 'FreeGames') > 0) {
                // Very long specific string from PHP for active free spins during init
                initResponse = `previous.rs.i0=freespinlevel0&rs.i1.r.i0.syms=SYM6%2CSYM3%2CSYM5&bl.i6.coins=1&rs.i8.r.i3.hold=false&bl.i17.reelset=ALL&bl.i15.id=15&rs.i0.r.i4.hold=false&rs.i9.r.i1.hold=false&gamestate.history=basic%2Cfreespin&rs.i1.r.i2.hold=false&rs.i8.r.i1.syms=SYM3%2CSYM9%2CSYM9&game.win.cents=685&rs.i7.r.i3.syms=SYM4%2CSYM8%2CSYM10&staticsharedurl=&bl.i10.line=1%2C2%2C1%2C2%2C1&bl.i0.reelset=ALL&bl.i18.coins=1&bl.i10.id=10&freespins.initial=10&bl.i3.reelset=ALL&bl.i4.line=2%2C1%2C0%2C1%2C2&bl.i13.coins=1&rs.i2.r.i0.hold=false&rs.i0.r.i0.syms=SYM7%2CSYM4%2CSYM7&rs.i9.r.i3.hold=false&bl.i2.id=2&rs.i1.r.i1.pos=1&rs.i7.r.i1.syms=SYM0%2CSYM5%2CSYM10&rs.i3.r.i4.pos=0&rs.i6.r.i3.syms=SYM5%2CSYM4%2CSYM8&rs.i0.r.i0.pos=0&bl.i14.reelset=ALL&rs.i2.r.i3.pos=62&rs.i5.r.i1.overlay.i0.with=SYM1&rs.i5.r.i0.pos=5&rs.i7.id=basic&rs.i7.r.i3.pos=99&rs.i2.r.i4.hold=false&rs.i3.r.i1.pos=0&rs.i2.id=freespinlevel0respin&rs.i6.r.i1.pos=0&game.win.coins=137&rs.i1.r.i0.hold=false&bl.i3.id=3&ws.i1.reelset=freespinlevel0&bl.i12.coins=1&bl.i8.reelset=ALL&clientaction=init&rs.i4.r.i0.hold=false&rs.i0.r.i2.hold=false&rs.i4.r.i3.syms=SYM5%2CSYM4%2CSYM8&bl.i16.id=16&casinoID=netent&rs.i2.r.i3.overlay.i0.with=SYM1&bl.i5.coins=1&rs.i3.r.i2.hold=false&bl.i8.id=8&rs.i5.r.i1.syms=SYM6%2CSYM10%2CSYM1&rs.i7.r.i0.pos=42&rs.i7.r.i3.hold=false&rs.i0.r.i3.pos=0&rs.i4.r.i0.syms=SYM7%2CSYM4%2CSYM7&rs.i8.r.i1.pos=0&rs.i5.r.i3.pos=87&bl.i6.line=2%2C2%2C1%2C2%2C2&bl.i12.line=2%2C1%2C2%2C1%2C2&bl.i0.line=1%2C1%2C1%2C1%2C1&wild.w0.expand.position.row=2&rs.i4.r.i2.pos=0&rs.i0.r.i2.syms=SYM8%2CSYM8%2CSYM4&rs.i8.r.i1.hold=false&rs.i9.r.i2.pos=0&game.win.amount=6.85&betlevel.all=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&rs.i5.r.i2.hold=false&denomination.all=${slotSettings.Denominations.join('%2C')}&rs.i2.r.i0.pos=20&current.rs.i0=freespinlevel0respin&ws.i0.reelset=freespinlevel0&rs.i7.r.i2.pos=91&bl.i1.id=1&rs.i3.r.i2.syms=SYM10%2CSYM10%2CSYM5&rs.i1.r.i4.pos=10&rs.i8.id=freespinlevel3&denomination.standard=${slotSettings.CurrentDenomination * 100}&rs.i3.id=freespinlevel1&multiplier=1&bl.i14.id=14&wild.w0.expand.position.reel=1&bl.i19.line=0%2C2%2C2%2C2%2C0&freespins.denomination=5.000&bl.i12.reelset=ALL&bl.i2.coins=1&bl.i6.id=6&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&freespins.totalwin.coins=137&ws.i0.direction=left_to_right&freespins.total=10&gamestate.stack=basic%2Cfreespin&rs.i6.r.i2.pos=0&rs.i1.r.i4.syms=SYM9%2CSYM9%2CSYM5&gamesoundurl=&rs.i5.r.i2.syms=SYM10%2CSYM7%2CSYM4&rs.i5.r.i3.hold=false&bet.betlevel=1&rs.i2.r.i3.overlay.i0.pos=63&rs.i4.r.i2.hold=false&bl.i5.reelset=ALL&rs.i4.r.i1.syms=SYM7%2CSYM7%2CSYM3&bl.i19.coins=1&bl.i7.id=7&bl.i18.reelset=ALL&rs.i2.r.i4.pos=2&rs.i3.r.i0.syms=SYM7%2CSYM4%2CSYM7&rs.i8.r.i4.pos=0&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=1&rs.i2.r.i3.overlay.i0.row=1&rs.i4.r.i1.hold=false&rs.i3.r.i2.pos=0&bl.i14.line=1%2C1%2C2%2C1%2C1&freespins.multiplier=1&playforfun=false&rs.i8.r.i0.hold=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&rs.i0.r.i4.syms=SYM6%2CSYM10%2CSYM9&rs.i0.r.i2.pos=0&bl.i13.line=1%2C1%2C0%2C1%2C1&rs.i6.r.i3.pos=0&ws.i1.betline=13&rs.i1.r.i0.pos=10&rs.i6.r.i3.hold=false&bl.i0.coins=1&rs.i2.r.i0.syms=SYM7%2CSYM7%2CSYM8&bl.i2.reelset=ALL&rs.i3.r.i1.syms=SYM3%2CSYM9%2CSYM9&rs.i1.r.i4.hold=false&freespins.left=6&rs.i9.r.i3.pos=0&rs.i4.r.i1.pos=0&rs.i4.r.i2.syms=SYM8%2CSYM8%2CSYM4&bl.standard=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19&rs.i5.r.i3.syms=SYM3%2CSYM9%2CSYM9&rs.i3.r.i0.hold=false&rs.i9.r.i1.syms=SYM3%2CSYM9%2CSYM9&rs.i6.r.i4.syms=SYM6%2CSYM10%2CSYM4&rs.i8.r.i0.syms=SYM7%2CSYM4%2CSYM7&rs.i8.r.i0.pos=0&bl.i15.reelset=ALL&rs.i0.r.i3.hold=false&bet.denomination=5&rs.i5.r.i4.pos=4&rs.i9.id=freespinlevel2&rs.i4.id=freespinlevel3respin&rs.i7.r.i2.syms=SYM9%2CSYM4%2CSYM10&rs.i2.r.i1.hold=false&gameServerVersion=1.5.0&g4mode=false&bl.i11.line=0%2C1%2C0%2C1%2C0&freespins.win.coins=8&historybutton=false&bl.i5.id=5&gameEventSetters.enabled=false&next.rs=freespinlevel0respin&rs.i1.r.i3.pos=2&rs.i0.r.i1.syms=SYM7%2CSYM7%2CSYM3&bl.i3.coins=1&ws.i1.types.i0.coins=4&bl.i10.coins=1&bl.i18.id=18&rs.i2.r.i1.pos=12&rs.i7.r.i4.hold=false&rs.i4.r.i4.pos=0&rs.i8.r.i2.hold=false&ws.i0.betline=4&rs.i1.r.i3.hold=false&rs.i7.r.i1.pos=123&totalwin.coins=137&rs.i5.r.i4.syms=SYM6%2CSYM6%2CSYM9&rs.i9.r.i4.pos=0&bl.i5.line=0%2C0%2C1%2C0%2C0&gamestate.current=freespin&rs.i4.r.i0.pos=0&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=1%2C2%2C2%2C2%2C1&rs.i8.r.i2.syms=SYM10%2CSYM10%2CSYM5&rs.i9.r.i0.hold=false&bet.betlines=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19&rs.i3.r.i1.hold=false&rs.i9.r.i0.syms=SYM7%2CSYM4%2CSYM7&rs.i7.r.i4.syms=SYM0%2CSYM9%2CSYM7&rs.i0.r.i3.syms=SYM5%2CSYM4%2CSYM8&rs.i1.r.i1.syms=SYM7%2CSYM7%2CSYM6&bl.i16.coins=1&rs.i5.r.i1.overlay.i0.pos=22&freespins.win.cents=40&bl.i9.coins=1&bl.i7.reelset=ALL&isJackpotWin=false&rs.i6.r.i4.hold=false&rs.i2.r.i3.hold=false&wild.w0.expand.type=NONE&freespins.betlines=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19&rs.i0.r.i1.pos=0&rs.i4.r.i4.syms=SYM6%2CSYM10%2CSYM9&rs.i1.r.i3.syms=SYM7%2CSYM6%2CSYM8&bl.i13.id=13&rs.i0.r.i1.hold=false&rs.i2.r.i1.syms=SYM10%2CSYM4%2CSYM10&ws.i1.types.i0.wintype=coins&rs.i9.r.i2.syms=SYM10%2CSYM10%2CSYM5&bl.i9.line=1%2C0%2C1%2C0%2C1&rs.i8.r.i4.syms=SYM6%2CSYM9%2CSYM9&rs.i9.r.i0.pos=0&rs.i8.r.i3.pos=0&ws.i1.sym=SYM10&betlevel.standard=1&bl.i10.reelset=ALL&ws.i1.types.i0.cents=20&rs.i6.r.i2.syms=SYM8%2CSYM6%2CSYM4&rs.i7.r.i0.syms=SYM5%2CSYM7%2CSYM0&gameover=false&rs.i3.r.i3.pos=0&rs.i5.id=freespinlevel0&rs.i7.r.i0.hold=false&rs.i6.r.i4.pos=0&bl.i11.coins=1&rs.i5.r.i1.hold=false&ws.i1.direction=left_to_right&rs.i5.r.i4.hold=false&rs.i6.r.i2.hold=false&bl.i13.reelset=ALL&bl.i0.id=0&rs.i9.r.i2.hold=false&nextaction=respin&bl.i15.line=0%2C1%2C1%2C1%2C0&bl.i3.line=0%2C1%2C2%2C1%2C0&bl.i19.id=19&bl.i4.reelset=ALL&rs.i7.r.i1.attention.i0=0&bl.i4.coins=1&bl.i18.line=2%2C0%2C2%2C0%2C2&rs.i8.r.i4.hold=false&freespins.totalwin.cents=685&bl.i9.id=9&bl.i17.line=0%2C2%2C0%2C2%2C0&bl.i11.id=11&freespins.betlevel=1&ws.i0.pos.i2=2%2C0&rs.i4.r.i3.pos=0&playercurrency=%26%23x20AC%3B&bl.i9.reelset=ALL&rs.i4.r.i4.hold=false&bl.i17.coins=1&ws.i1.pos.i0=1%2C1&ws.i1.pos.i1=0%2C1&ws.i1.pos.i2=2%2C0&ws.i0.pos.i1=0%2C2&rs.i5.r.i0.syms=SYM9%2CSYM10%2CSYM10&bl.i19.reelset=ALL&ws.i0.pos.i0=1%2C1&rs.i2.r.i4.syms=SYM4%2CSYM8%2CSYM8&rs.i7.r.i4.pos=41&rs.i4.r.i3.hold=false&rs.i6.r.i0.hold=false&bl.i11.reelset=ALL&bl.i16.line=2%2C1%2C1%2C1%2C2&rs.i0.id=freespinlevel2respin&credit=${balanceInCents}&ws.i0.types.i0.coins=4&rs.i9.r.i3.syms=SYM6%2CSYM7%2CSYM7&bl.i1.reelset=ALL&rs.i2.r.i2.pos=19&last.rs=freespinlevel0&rs.i5.r.i1.overlay.i0.row=2&rs.i5.r.i1.pos=20&bl.i1.line=0%2C0%2C0%2C0%2C0&ws.i0.sym=SYM10&rs.i6.r.i0.syms=SYM7%2CSYM4%2CSYM7&rs.i6.r.i1.hold=false&bl.i17.id=17&rs.i2.r.i2.syms=SYM4%2CSYM6%2CSYM7&rs.i1.r.i2.pos=19&bl.i16.reelset=ALL&rs.i3.r.i3.syms=SYM6%2CSYM7%2CSYM7&ws.i0.types.i0.wintype=coins&rs.i3.r.i4.hold=false&rs.i5.r.i0.hold=false&nearwinallowed=true&collectablesWon=2&rs.i9.r.i1.pos=0&bl.i8.line=1%2C0%2C0%2C0%2C1&rs.i7.r.i2.hold=false&rs.i6.r.i1.syms=SYM5%2CSYM9%2CSYM9&freespins.wavecount=1&rs.i3.r.i3.hold=false&rs.i6.r.i0.pos=0&bl.i8.coins=1&bl.i15.coins=1&bl.i2.line=2%2C2%2C2%2C2%2C2&rs.i1.r.i2.syms=SYM8%2CSYM4%2CSYM3&rs.i7.nearwin=4%2C2%2C3&rs.i9.r.i4.hold=false&rs.i6.id=freespinlevel1respin&totalwin.cents=685&rs.i7.r.i1.hold=false&rs.i5.r.i2.pos=98&rs.i0.r.i0.hold=false&rs.i2.r.i3.syms=SYM9%2CSYM9%2CSYM5&rs.i8.r.i2.pos=0&restore=true&rs.i1.id=basicrespin&rs.i3.r.i4.syms=SYM6%2CSYM9%2CSYM9&bl.i12.id=12&bl.i4.id=4&rs.i0.r.i4.pos=0&bl.i7.coins=1&ws.i0.types.i0.cents=20&bl.i6.reelset=ALL&rs.i3.r.i0.pos=0&rs.i2.r.i2.hold=false&rs.i7.r.i0.attention.i0=2&wavecount=1&rs.i9.r.i4.syms=SYM6%2CSYM9%2CSYM9&bl.i14.coins=1&rs.i8.r.i3.syms=SYM6%2CSYM7%2CSYM7&rs.i1.r.i1.hold=false&rs.i7.r.i4.attention.i0=0${freeStateInit}`;
              } else {
                initResponse = `bl.i32.reelset=ALL&rs.i1.r.i0.syms=SYM7&bl.i6.coins=0&bl.i17.reelset=ALL&bl.i15.id=15&rs.i0.r.i4.hold=false&rs.i1.r.i15.pos=0&rs.i1.r.i2.hold=false&bl.i21.id=21&game.win.cents=0&staticsharedurl=&bl.i23.reelset=ALL&bl.i33.coins=0&rs.i1.r.i11.syms=SYM11&bl.i10.line=0%2C1%2C2%2C2%2C2&bl.i0.reelset=ALL&bl.i20.coins=0&bl.i18.coins=0&bl.i10.id=10&bl.i3.reelset=ALL&bl.i4.line=0%2C1%2C1%2C0%2C0&bl.i13.coins=0&bl.i26.reelset=ALL&bl.i24.line=1%2C2%2C3%2C3%2C2&bl.i27.id=27&rs.i2.r.i0.hold=false&rs.i0.r.i0.syms=SYM6%2CSYM6%2CSYM7&bl.i2.id=2&rs.i1.r.i1.pos=0&feature.sticky.active=false&rs.i1.r.i13.hold=false&rs.i0.r.i0.pos=0&bl.i14.reelset=ALL&rs.i2.r.i3.pos=2&feature.wildreels.active=false&rs.i2.r.i4.hold=false&rs.i1.r.i9.syms=SYM11&rs.i2.id=basic&game.win.coins=0&bl.i28.line=2%2C2%2C2%2C2%2C2&rs.i1.r.i0.hold=false&bl.i3.id=3&bl.i22.line=1%2C2%2C3%2C2%2C1&rs.i1.r.i13.syms=SYM7&bl.i12.coins=0&bl.i8.reelset=ALL&clientaction=init&rs.i0.r.i2.hold=false&bl.i16.id=16&rs.i1.r.i15.hold=false&casinoID=netent&rs.i1.r.i8.pos=0&bl.i5.coins=0&rs.i1.r.i6.hold=false&bl.i8.id=8&rs.i0.r.i3.pos=0&bl.i33.id=33&bl.i6.line=0%2C1%2C1%2C1%2C1&bl.i22.id=22&bl.i12.line=1%2C1%2C1%2C1%2C0&bl.i0.line=0%2C0%2C0%2C0%2C0&bl.i29.reelset=ALL&bl.i34.line=2%2C3%2C3%2C3%2C2&bl.i31.line=2%2C2%2C3%2C3%2C2&rs.i0.r.i2.syms=SYM7%2CSYM7%2CSYM6%2CSYM6%2CSYM5&bl.i34.coins=0&game.win.amount=0&betlevel.all=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10&rs.i1.r.i6.syms=SYM11&denomination.all=${slotSettings.Denominations.join('%2C')}&bl.i27.coins=0&bl.i34.reelset=ALL&rs.i2.r.i0.pos=0&bl.i30.reelset=ALL&bl.i1.id=1&bl.i33.line=2%2C3%2C3%2C2%2C2&bl.i25.id=25&rs.i1.r.i9.hold=false&rs.i1.r.i5.syms=SYM7&rs.i1.r.i4.pos=0&denomination.standard=${slotSettings.CurrentDenomination * 100}&bl.i31.id=31&bl.i32.line=2%2C3%2C3%2C2%2C1&multiplier=1&bl.i14.id=14&bl.i19.line=1%2C2%2C2%2C1%2C1&bl.i12.reelset=ALL&bl.i2.coins=0&bl.i6.id=6&bl.i21.reelset=ALL&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&rs.i1.r.i15.syms=SYM11&bl.i20.id=20&rs.i1.r.i12.pos=0&rs.i1.r.i4.syms=SYM7&feature.shuffle.active=false&gamesoundurl=&bl.i33.reelset=ALL&bl.i5.reelset=ALL&bl.i24.coins=0&rs.i1.r.i11.pos=0&bl.i19.coins=0&bl.i32.coins=0&bl.i7.id=7&bl.i18.reelset=ALL&rs.i2.r.i4.pos=0&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=0&bl.i32.id=32&bl.i14.line=1%2C1%2C2%2C1%2C0&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&rs.i0.r.i4.syms=SYM8%2CSYM8%2CSYM7&rs.i1.r.i9.pos=0&bl.i25.coins=0&rs.i0.r.i2.pos=0&bl.i13.line=1%2C1%2C1%2C1%2C1&bl.i24.reelset=ALL&rs.i1.r.i0.pos=0&rs.i1.r.i14.syms=SYM7&bl.i0.coins=10&rs.i2.r.i0.syms=SYM9%2CSYM9%2CSYM10&bl.i2.reelset=ALL&rs.i1.r.i5.pos=0&bl.i31.coins=0&rs.i1.r.i4.hold=false&bl.i26.coins=0&bl.i27.reelset=ALL&rs.i1.r.i14.hold=false&bl.standard=0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19%2C20%2C21%2C22%2C23%2C24%2C25%2C26%2C27%2C28%2C29%2C30%2C31%2C32%2C33%2C34%2C35&bl.i29.line=2%2C2%2C3%2C2%2C1&bl.i23.line=1%2C2%2C3%2C2%2C2&bl.i26.id=26&bl.i15.reelset=ALL&rs.i0.r.i3.hold=false&rs.i1.r.i16.pos=0&rs.i2.r.i1.hold=false&gameServerVersion=2.0.1&g4mode=false&bl.i11.line=1%2C1%2C1%2C0%2C0&bl.i30.id=30&feature.randomwilds.active=false&historybutton=false&bl.i25.line=2%2C2%2C2%2C1%2C0&bl.i5.id=5&gameEventSetters.enabled=false&rs.i1.r.i10.syms=SYM7&rs.i1.r.i3.pos=0&rs.i0.r.i1.syms=SYM4%2CSYM4%2CSYM7%2CSYM7&rs.i1.r.i17.pos=0&bl.i3.coins=0&bl.i10.coins=0&bl.i18.id=18&rs.i2.r.i1.pos=1&rs.i1.r.i12.hold=false&bl.i30.coins=0&nextclientrs=basic&rs.i1.r.i3.hold=false&totalwin.coins=0&bl.i5.line=0%2C1%2C1%2C1%2C0&gamestate.current=basic&bl.i28.coins=0&bl.i27.line=2%2C2%2C2%2C2%2C1&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=0%2C1%2C2%2C1%2C0&bl.i35.id=35&rs.i1.r.i13.pos=0&rs.i0.r.i3.syms=SYM4%2CSYM4%2CSYM8%2CSYM8&rs.i1.r.i1.syms=SYM7&bl.i16.coins=0&bl.i9.coins=0&bl.i30.line=2%2C2%2C3%2C2%2C2&bl.i7.reelset=ALL&isJackpotWin=false&rs.i1.r.i5.hold=false&rs.i2.r.i3.hold=false&rs.i1.r.i12.syms=SYM11&bl.i24.id=24&rs.i1.r.i10.hold=false&rs.i0.r.i1.pos=0&bl.i22.coins=0&rs.i1.r.i3.syms=SYM11&bl.i29.coins=0&bl.i31.reelset=ALL&bl.i13.id=13&rs.i0.r.i1.hold=false&rs.i2.r.i1.syms=SYM8%2CSYM8%2CSYM0%2CSYM7&bl.i9.line=0%2C1%2C2%2C2%2C1&rs.i1.r.i10.pos=0&bl.i35.coins=0&betlevel.standard=1&bl.i10.reelset=ALL&gameover=true&bl.i25.reelset=ALL&bl.i23.coins=0&bl.i11.coins=0&bl.i22.reelset=ALL&bl.i13.reelset=ALL&bl.i0.id=0&nextaction=spin&bl.i15.line=1%2C1%2C2%2C1%2C1&bl.i3.line=0%2C0%2C1%2C1%2C1&bl.i19.id=19&bl.i4.reelset=ALL&bl.i4.coins=0&rs.i1.r.i6.pos=0&bl.i18.line=1%2C2%2C2%2C1%2C0&bl.i9.id=9&bl.i34.id=34&bl.i17.line=1%2C1%2C2%2C2%2C2&bl.i11.id=11&playercurrency=%26%23x20AC%3B&rs.i1.r.i16.syms=SYM11&bl.i9.reelset=ALL&bl.i17.coins=0&bl.i28.id=28&bl.i19.reelset=ALL&rs.i2.r.i4.syms=SYM4%2CSYM4%2CSYM9&bl.i11.reelset=ALL&bl.i16.line=1%2C1%2C2%2C2%2C1&rs.i1.r.i18.hold=false&rs.i0.id=freespin&rs.i1.r.i14.pos=0&rs.i1.r.i17.syms=SYM7&credit=${balanceInCents}&rs.i1.r.i18.pos=0&bl.i21.line=1%2C2%2C2%2C2%2C2&bl.i35.line=2%2C3%2C4%2C3%2C2&bl.i1.reelset=ALL&rs.i2.r.i2.pos=5&bl.i21.coins=0&bl.i28.reelset=ALL&bl.i1.line=0%2C0%2C1%2C0%2C0&rs.i1.r.i8.hold=false&rs.i1.r.i16.hold=false&bl.i17.id=17&rs.i2.r.i2.syms=SYM6%2CSYM6%2CSYM7%2CSYM7%2CSYM9&rs.i1.r.i2.pos=0&bl.i16.reelset=ALL&rs.i1.r.i7.syms=SYM11&nearwinallowed=true&bl.i8.line=0%2C1%2C2%2C1%2C1&bl.i35.reelset=ALL&rs.i1.r.i7.pos=0&rs.i1.r.i18.syms=SYM11&rs.i1.r.i8.syms=SYM7&bl.i8.coins=0&bl.i23.id=23&bl.i15.coins=0&bl.i2.line=0%2C0%2C1%2C1%2C0&rs.i1.r.i2.syms=SYM7&totalwin.cents=0&rs.i1.r.i11.hold=false&rs.i0.r.i0.hold=false&rs.i1.r.i7.hold=false&rs.i2.r.i3.syms=SYM8%2CSYM8%2CSYM10%2CSYM10&restore=false&rs.i1.id=respin&bl.i12.id=12&bl.i29.id=29&rs.i1.r.i17.hold=false&bl.i4.id=4&rs.i0.r.i4.pos=0&bl.i7.coins=0&bl.i6.reelset=ALL&bl.i20.line=1%2C2%2C2%2C2%2C1&rs.i2.r.i2.hold=false&bl.i20.reelset=ALL&wavecount=1&bl.i14.coins=0&rs.i1.r.i1.hold=false&bl.i26.line=2%2C2%2C2%2C1%2C1${curReelsInit}`;
              }
              result_tmp.push(initResponse);
              break;
            case 'paytable':
              result_tmp.push(
                `bl.i32.reelset=ALL&pt.i0.comp.i19.symbol=SYM9&bl.i6.coins=0&bl.i17.reelset=ALL&pt.i0.comp.i15.type=betline&pt.i0.comp.i23.freespins=0&bl.i15.id=15&pt.i0.comp.i4.multi=15&pt.i0.comp.i15.symbol=SYM8&pt.i0.comp.i17.symbol=SYM8&pt.i0.comp.i5.freespins=0&pt.i0.comp.i22.multi=3&pt.i0.comp.i23.n=5&bl.i21.id=21&pt.i0.comp.i11.symbol=SYM6&pt.i0.comp.i13.symbol=SYM7&bl.i23.reelset=ALL&bl.i33.coins=0&pt.i0.comp.i15.multi=2&bl.i10.line=0%2C1%2C2%2C2%2C2&bl.i0.reelset=ALL&bl.i20.coins=0&pt.i0.comp.i16.freespins=0&bl.i18.coins=0&bl.i10.id=10&pt.i0.comp.i11.n=5&pt.i0.comp.i4.freespins=0&bl.i3.reelset=ALL&bl.i4.line=0%2C1%2C1%2C0%2C0&bl.i13.coins=0&bl.i26.reelset=ALL&bl.i24.line=1%2C2%2C3%2C3%2C2&bl.i27.id=27&pt.i0.comp.i19.n=4&pt.i0.id=basic&pt.i0.comp.i1.type=betline&bl.i2.id=2&pt.i0.comp.i2.symbol=SYM3&pt.i0.comp.i4.symbol=SYM4&pt.i0.comp.i20.type=betline&bl.i14.reelset=ALL&pt.i0.comp.i17.freespins=0&pt.i0.comp.i6.symbol=SYM5&pt.i0.comp.i8.symbol=SYM5&pt.i0.comp.i0.symbol=SYM3&pt.i0.comp.i5.n=5&pt.i0.comp.i3.type=betline&pt.i0.comp.i3.freespins=0&pt.i0.comp.i10.multi=8&bl.i28.line=2%2C2%2C2%2C2%2C2&bl.i3.id=3&bl.i22.line=1%2C2%2C3%2C2%2C1&pt.i0.comp.i9.multi=3&bl.i12.coins=0&pt.i0.comp.i22.symbol=SYM10&pt.i0.comp.i26.symbol=SYM0&pt.i0.comp.i24.n=3&bl.i8.reelset=ALL&pt.i0.comp.i14.freespins=0&pt.i0.comp.i21.freespins=0&clientaction=paytable&bl.i16.id=16&bl.i5.coins=0&pt.i0.comp.i22.type=betline&pt.i0.comp.i24.freespins=0&bl.i8.id=8&pt.i0.comp.i16.multi=4&pt.i0.comp.i21.multi=2&bl.i33.id=33&pt.i0.comp.i12.n=3&bl.i6.line=0%2C1%2C1%2C1%2C1&bl.i22.id=22&pt.i0.comp.i13.type=betline&bl.i12.line=1%2C1%2C1%2C1%2C0&bl.i0.line=0%2C0%2C0%2C0%2C0&bl.i29.reelset=ALL&pt.i0.comp.i19.type=betline&pt.i0.comp.i6.freespins=0&bl.i34.line=2%2C3%2C3%2C3%2C2&bl.i31.line=2%2C2%2C3%2C3%2C2&pt.i0.comp.i3.multi=5&bl.i34.coins=0&pt.i0.comp.i6.n=3&pt.i0.comp.i21.n=3&bl.i27.coins=0&bl.i34.reelset=ALL&bl.i30.reelset=ALL&bl.i1.id=1&bl.i33.line=2%2C3%2C3%2C2%2C2&pt.i0.comp.i10.type=betline&bl.i25.id=25&pt.i0.comp.i2.freespins=0&pt.i0.comp.i5.multi=50&pt.i0.comp.i7.n=4&bl.i31.id=31&bl.i32.line=2%2C3%2C3%2C2%2C1&pt.i0.comp.i11.multi=25&bl.i14.id=14&pt.i0.comp.i7.type=betline&bl.i19.line=1%2C2%2C2%2C1%2C1&bl.i12.reelset=ALL&pt.i0.comp.i17.n=5&bl.i2.coins=0&bl.i6.id=6&bl.i21.reelset=ALL&pt.i0.comp.i8.freespins=0&bl.i20.id=20&pt.i0.comp.i8.multi=30&gamesoundurl=&pt.i0.comp.i1.freespins=0&pt.i0.comp.i12.type=betline&pt.i0.comp.i14.multi=10&bl.i33.reelset=ALL&bl.i5.reelset=ALL&bl.i24.coins=0&pt.i0.comp.i22.n=4&bl.i19.coins=0&bl.i32.coins=0&bl.i7.id=7&bl.i18.reelset=ALL&pt.i0.comp.i6.multi=4&playercurrencyiso=${slotSettings.slotCurrency}&bl.i1.coins=0&bl.i32.id=32&bl.i14.line=1%2C1%2C2%2C1%2C0&pt.i0.comp.i18.type=betline&pt.i0.comp.i23.symbol=SYM10&pt.i0.comp.i21.type=betline&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&pt.i0.comp.i8.type=betline&pt.i0.comp.i7.freespins=0&pt.i0.comp.i2.type=betline&pt.i0.comp.i13.multi=4&bl.i25.coins=0&pt.i0.comp.i17.type=betline&bl.i13.line=1%2C1%2C1%2C1%2C1&bl.i24.reelset=ALL&bl.i0.coins=10&bl.i2.reelset=ALL&pt.i0.comp.i8.n=5&pt.i0.comp.i10.n=4&bl.i31.coins=0&pt.i0.comp.i11.type=betline&pt.i0.comp.i18.n=3&pt.i0.comp.i22.freespins=0&bl.i26.coins=0&bl.i27.reelset=ALL&pt.i0.comp.i20.symbol=SYM9&bl.i29.line=2%2C2%2C3%2C2%2C1&pt.i0.comp.i15.freespins=0&bl.i23.line=1%2C2%2C3%2C2%2C2&bl.i26.id=26&pt.i0.comp.i0.n=3&pt.i0.comp.i7.symbol=SYM5&bl.i15.reelset=ALL&pt.i0.comp.i0.type=betline&gameServerVersion=2.0.1&g4mode=false&bl.i11.line=1%2C1%2C1%2C0%2C0&bl.i30.id=30&pt.i0.comp.i25.multi=0&historybutton=false&bl.i25.line=2%2C2%2C2%2C1%2C0&pt.i0.comp.i16.symbol=SYM8&bl.i5.id=5&pt.i0.comp.i1.multi=20&pt.i0.comp.i18.symbol=SYM9&pt.i0.comp.i12.multi=2&bl.i3.coins=0&bl.i10.coins=0&pt.i0.comp.i12.symbol=SYM7&pt.i0.comp.i14.symbol=SYM7&bl.i18.id=18&pt.i0.comp.i14.type=betline&bl.i30.coins=0&pt.i0.comp.i18.multi=2&bl.i5.line=0%2C1%2C1%2C1%2C0&pt.i0.comp.i7.multi=10&bl.i28.coins=0&pt.i0.comp.i9.n=3&bl.i27.line=2%2C2%2C2%2C2%2C1&jackpotcurrency=%26%23x20AC%3B&bl.i7.line=0%2C1%2C2%2C1%2C0&bl.i35.id=35&pt.i0.comp.i10.symbol=SYM6&pt.i0.comp.i15.n=3&bl.i16.coins=0&bl.i9.coins=0&bl.i30.line=2%2C2%2C3%2C2%2C2&pt.i0.comp.i21.symbol=SYM10&bl.i7.reelset=ALL&isJackpotWin=false&bl.i24.id=24&pt.i0.comp.i1.n=4&bl.i22.coins=0&pt.i0.comp.i10.freespins=0&pt.i0.comp.i20.multi=8&pt.i0.comp.i20.n=5&pt.i0.comp.i17.multi=9&bl.i29.coins=0&bl.i31.reelset=ALL&bl.i13.id=13&pt.i0.comp.i25.symbol=SYM0&pt.i0.comp.i26.type=bonus&pt.i0.comp.i9.type=betline&bl.i9.line=0%2C1%2C2%2C2%2C1&pt.i0.comp.i2.multi=140&pt.i0.comp.i0.freespins=0&bl.i35.coins=0&bl.i10.reelset=ALL&bl.i25.reelset=ALL&pt.i0.comp.i9.symbol=SYM6&bl.i23.coins=0&bl.i11.coins=0&pt.i0.comp.i16.n=4&bl.i22.reelset=ALL&bl.i13.reelset=ALL&bl.i0.id=0&pt.i0.comp.i16.type=betline&pt.i0.comp.i5.symbol=SYM4&bl.i15.line=1%2C1%2C2%2C1%2C1&bl.i3.line=0%2C0%2C1%2C1%2C1&bl.i19.id=19&bl.i4.reelset=ALL&bl.i4.coins=0&pt.i0.comp.i2.n=5&pt.i0.comp.i1.symbol=SYM3&bl.i18.line=1%2C2%2C2%2C1%2C0&bl.i9.id=9&bl.i34.id=34&pt.i0.comp.i19.freespins=0&bl.i17.line=1%2C1%2C2%2C2%2C2&bl.i11.id=11&pt.i0.comp.i6.type=betline&playercurrency=%26%23x20AC%3B&bl.i9.reelset=ALL&bl.i17.coins=0&bl.i28.id=28&bl.i19.reelset=ALL&pt.i0.comp.i25.n=4&pt.i0.comp.i9.freespins=0&bl.i11.reelset=ALL&bl.i16.line=1%2C1%2C2%2C2%2C1&credit=${balanceInCents}&pt.i0.comp.i5.type=betline&pt.i0.comp.i11.freespins=0&pt.i0.comp.i26.multi=0&bl.i21.line=1%2C2%2C2%2C2%2C2&pt.i0.comp.i25.type=bonus&bl.i35.line=2%2C3%2C4%2C3%2C2&bl.i1.reelset=ALL&pt.i0.comp.i4.type=betline&bl.i21.coins=0&bl.i28.reelset=ALL&pt.i0.comp.i13.freespins=0&pt.i0.comp.i26.freespins=0&bl.i1.line=0%2C0%2C1%2C0%2C0&pt.i0.comp.i13.n=4&pt.i0.comp.i20.freespins=0&pt.i0.comp.i23.type=betline&bl.i17.id=17&bl.i16.reelset=ALL&pt.i0.comp.i3.n=3&pt.i0.comp.i25.freespins=0&bl.i8.line=0%2C1%2C2%2C1%2C1&pt.i0.comp.i24.symbol=SYM0&bl.i35.reelset=ALL&pt.i0.comp.i26.n=5&bl.i8.coins=0&bl.i23.id=23&bl.i15.coins=0&pt.i0.comp.i23.multi=7&bl.i2.line=0%2C0%2C1%2C1%2C0&pt.i0.comp.i18.freespins=0&bl.i12.id=12&bl.i29.id=29&bl.i4.id=4&bl.i7.coins=0&pt.i0.comp.i14.n=5&pt.i0.comp.i0.multi=6&bl.i6.reelset=ALL&pt.i0.comp.i19.multi=3&pt.i0.comp.i3.symbol=SYM4&bl.i20.line=1%2C2%2C2%2C2%2C1&pt.i0.comp.i24.type=bonus&bl.i20.reelset=ALL&bl.i14.coins=0&pt.i0.comp.i12.freespins=0&pt.i0.comp.i4.n=4&bl.i26.line=2%2C2%2C2%2C1%2C1&pt.i0.comp.i24.multi=0`
              );
              break;
            // spin, freespin, respin, shuffle, initbonus, bonusaction, endbonus
            case 'spin':
            case 'freespin':
            case 'respin': // 'respin' and 'shuffle' have action 'spin' in postData after pre-processing
            // case 'shuffle': // Covered by spin after pre-processing

              const linesId: number[][] = [ /* Jumanji has 36 lines, complex definitions */
                [1,1,1,1,1],[1,1,2,1,1],[1,1,2,2,1],[1,1,2,2,2],[1,2,2,1,1],[1,2,2,2,1],[1,2,2,2,2],[1,2,3,2,1],[1,2,3,2,2],[1,2,3,3,2],
                [1,2,3,3,3],[2,2,1,1,1],[2,2,2,2,1],[2,2,2,2,2],[2,2,3,2,1],[2,2,3,2,2],[2,2,3,3,2],[2,2,3,3,3],[2,3,3,2,1],[2,3,3,2,2],
                [2,3,3,3,2],[2,3,3,3,3],[2,3,4,3,2],[2,3,4,3,3],[2,3,4,4,3],[3,3,3,2,1],[3,3,3,2,2],[3,3,3,3,2],[3,3,3,3,3],[3,3,4,3,2],
                [3,3,4,3,3],[3,3,4,4,3],[3,4,4,3,2],[3,4,4,3,3],[3,4,4,4,3],[3,4,5,4,3]
              ];
              const lines = 10; // Default bet is 10 coins for 36 lines.
              let currentBetline: number;
              let currentAllbet: number;
              let bonusMpl = 1;

              if (postData['slotEvent'] !== 'freespin' && postData['slotEvent'] !== 'respin' && postData['slotEvent'] !== 'shuffle') {
                currentBetline = postData['bet_betlevel'];
                currentAllbet = currentBetline * lines; // Base bet for cost
                slotSettings.UpdateJackpots(currentAllbet); // Jumanji doesn't have typical jackpots this way
                slotSettings.SetBalance(-1 * currentAllbet, postData['slotEvent']);
                const bankSum = currentAllbet / 100 * slotSettings.GetPercent();
                slotSettings.SetBank(postData['slotEvent'] || '', bankSum, postData['slotEvent']);
                // slotSettings.UpdateJackpots(currentAllbet); // Called again in others, not here.
                slotSettings.SetGameData(slotSettings.slotId + 'AllBet', currentAllbet);
                slotSettings.SetGameData(slotSettings.slotId + 'BonusWin', 0);
                slotSettings.SetGameData(slotSettings.slotId + 'FreeGames', 0); // Reset unless it's a feature entry
                slotSettings.SetGameData(slotSettings.slotId + 'CurrentFreeGame', 0);
                slotSettings.SetGameData(slotSettings.slotId + 'TotalWin', 0);
                slotSettings.SetGameData(slotSettings.slotId + 'Bet', currentBetline);
                slotSettings.SetGameData(slotSettings.slotId + 'Denom', postData['bet_denomination']);
                // slotSettings.SetGameData(slotSettings.slotId + 'FreeBalance', parseFloat(slotSettings.GetBalance().toFixed(2)) * 100);
                slotSettings.SetGameData(slotSettings.slotId + 'BonusType', '');
              } else { // freespin, respin, shuffle events
                postData['bet_denomination'] = slotSettings.GetGameData(slotSettings.slotId + 'Denom');
                slotSettings.CurrentDenom = postData['bet_denomination'];
                slotSettings.CurrentDenomination = postData['bet_denomination'];
                currentBetline = slotSettings.GetGameData(slotSettings.slotId + 'Bet');
                currentAllbet = currentBetline * lines;
                if(postData['slotEvent'] === 'freespin') {
                    slotSettings.SetGameData(slotSettings.slotId + 'CurrentFreeGame', slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame') + 1);
                }
                bonusMpl = slotSettings.slotFreeMpl; // Typically 1 unless a feature changes it
              }

              const winTypeTmp = slotSettings.GetSpinSettings(postData['slotEvent'], currentAllbet, lines);
              let winType = winTypeTmp[0];
              let spinWinLimit = winTypeTmp[1];
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

              if (winType === 'bonus' && (postData['slotEvent'] === 'freespin' || postData['slotEvent'] === 'respin')) {
                winType = 'win'; // Force win if already in a bonus round and 'bonus' is rolled
              }

              let totalWin = 0;
              let lineWins: string[] = [];
              const wild = ['1']; // SYM_1 is Wild
              const scatter = '0'; // SYM_0 is Scatter (Board Game trigger)
              let reels: any;
              let reelsTmp: any; // Store reels before feature modifications

              // Random feature flags (simulating PHP's rand(1,100)==1 logic)
              let stickyactive = false, shuffleactive = false, wildreelsactive = false, randomwildsactive = false;
              const randFeatureTrigger = Math.random() * 100;
              if (randFeatureTrigger < 1) wildreelsactive = true;
              else if (randFeatureTrigger < 2) shuffleactive = true;
              else if (randFeatureTrigger < 3) stickyactive = true;
              else if (randFeatureTrigger < 4) randomwildsactive = true;

              // Override with FS type if in Free Spins
              if(postData['slotEvent'] === 'freespin') {
                  const bonusType = slotSettings.GetGameData(slotSettings.slotId + 'BonusType');
                  if (bonusType === 'shuffle') shuffleactive = true;
                  if (bonusType === 'wildreels') wildreelsactive = true;
                  if (bonusType === 'randomwilds') randomwildsactive = true;
                  // Sticky wins are a respin feature, not a general FS type in Jumanji
              }

              // Prevent random features during shuffle/respin main events or if already a bonus win type
              if (postData['slotEvent'] === 'shuffle' || postData['slotEvent'] === 'respin' || winType === 'bonus') {
                  stickyactive = wildreelsactive = shuffleactive = randomwildsactive = false;
              }

              let featureStr = ''; // To append to response for active features

              for (let i = 0; i <= 2000; i++) { // Spin loop
                totalWin = 0; lineWins = []; let cWins: number[] = new Array(36).fill(0);
                reels = slotSettings.GetReelStrips(winType, postData['slotEvent']);

                // Mystery Symbol transformation (SYM_11, SYM_12, SYM_13)
                // This needs to happen before feature modifications that might turn these into wilds etc.
                const rs11m = String(Math.floor(Math.random() * (10-8+1))+8); // rand(8,10)
                const rs12m = String(Math.floor(Math.random() * (7-5+1))+5);   // rand(5,7)
                const rs13m = String(Math.floor(Math.random() * (4-3+1))+3);   // rand(3,4)
                for(let r=1; r<=5; r++){
                    for(let p=0; p<reels['reel'+r].length; p++){
                        if(reels['reel'+r][p] == '13') reels['reel'+r][p] = rs13m;
                        if(reels['reel'+r][p] == '12') reels['reel'+r][p] = rs12m;
                        if(reels['reel'+r][p] == '11') reels['reel'+r][p] = rs11m;
                    }
                }
                reelsTmp = JSON.parse(JSON.stringify(reels)); // Save state before random features modify for win calc

                if (postData['slotEvent'] === 'shuffle') {
                    // Shuffle logic (complex, involves rearranging existing symbols from slotSettings.GetGameData(slotId + 'Reels'))
                    // For now, we'll assume GetReelStrips for 'shuffle' event provides the shuffled reels.
                    // And set the feature string.
                    const prevReelsForShuffle = slotSettings.GetGameData(slotSettings.slotId + 'Reels'); // PHP has this
                    // ... actual shuffle logic would go here using prevReelsForShuffle ...
                    // For test purposes, GetReelStrips on 'shuffle' event can return pre-shuffled reels.
                    reels = slotSettings.GetReelStrips('win', 'shuffle'); // Simulate shuffled reels

                    let freeStateShuffle = '';
                     if (slotSettings.GetGameData(slotSettings.slotId + 'BonusType') === 'shuffle') { // If shuffle is part of a FS mode
                        const fsTotal = slotSettings.GetGameData(slotSettings.slotId + 'FreeGames');
                        const fsLeft = fsTotal - slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame');
                        freeStateShuffle = `&freespins.left=${fsLeft}&freespins.total=${fsTotal}&gamestate.current=freespin&nextaction=freespin`;
                     }
                    featureStr = `&feature.shuffle.active=true&clientaction=shuffle&nextaction=${postData['slotEvent'] === 'freespin' ? 'freespin' : 'spin'}${freeStateShuffle}`;
                    slotSettings.SetGameData(slotSettings.slotId + 'ShuffleActive', 0);
                }

                if (randomwildsactive) { /* ... random wilds logic & featureStr ... */ }
                if (wildreelsactive) { /* ... wild reels logic & featureStr ... */ }
                // Sticky wins (respin) are handled as a separate action usually after a win.
                // If stickyactive is true here, it implies a feature that makes current wins sticky and respins.

                // Calculate wins
                let winLineCount = 0;
                for (let k = 0; k < 36; k++) { // 36 lines for Jumanji
                  let tmpStringWin = '';
                  // ... (win calculation logic for 5 reels with 3-4-5-4-3 structure)
                  // This part is very similar to other games but uses Jumanji's linesId and reel structure
                  const s: string[] = [];
                  const lineMap = linesId[k]; // e.g. [1,1,1,1,1]
                  for(let reelIdx = 0; reelIdx < 5; reelIdx++){
                      s[reelIdx] = reels[`reel${reelIdx + 1}`][lineMap[reelIdx] -1];
                  }

                  for (let j = 0; j < slotSettings.SymbolGame.length; j++) {
                    const csym = String(slotSettings.SymbolGame[j]);
                    if (csym === scatter || !slotSettings.Paytable['SYM_' + csym]) continue;

                    // Check 3, 4, 5 symbol wins
                    let pay = 0; let len = 0;
                    if((s[0] === csym || wild.includes(s[0])) && (s[1] === csym || wild.includes(s[1])) && (s[2] === csym || wild.includes(s[2]))){
                        pay = slotSettings.Paytable['SYM_' + csym][3]; len = 3;
                        if((s[3] === csym || wild.includes(s[3]))){
                            pay = slotSettings.Paytable['SYM_' + csym][4]; len = 4;
                            if((s[4] === csym || wild.includes(s[4]))){
                                pay = slotSettings.Paytable['SYM_' + csym][5]; len = 5;
                            }
                        }
                    }
                    if(pay > 0){
                        const tmpWin = pay * currentBetline * bonusMpl;
                        if(cWins[k] < tmpWin){
                            cWins[k] = tmpWin;
                            tmpStringWin = `&ws.i${winLineCount}.reelset=basic&ws.i${winLineCount}.types.i0.coins=${tmpWin}`;
                            for(let l=0; l<len; l++) tmpStringWin += `&ws.i${winLineCount}.pos.i${l}=${l}%2C${lineMap[l]-1}`;
                            tmpStringWin += `&ws.i${winLineCount}.types.i0.wintype=coins&ws.i${winLineCount}.betline=${k}&ws.i${winLineCount}.sym=SYM${csym}&ws.i${winLineCount}.direction=left_to_right&ws.i${winLineCount}.types.i0.cents=${tmpWin * slotSettings.CurrentDenomination * 100}`;
                        }
                    }
                  }
                  if (cWins[k] > 0 && tmpStringWin !== '') { lineWins.push(tmpStringWin); totalWin += cWins[k]; winLineCount++; }
                }

                let scattersCount = 0; const scPos: string[] = [];
                for(let r=1; r<=5; r++) for(let p=0; p<reels['reel'+r].length; p++) if(reels['reel'+r][p]===scatter){scattersCount++;scPos.push(`&ws.i0.pos.i${r-1}=${r-1}%2C${p}`);}

                let scattersStr = '';
                if (scattersCount >= 3) { // Board game bonus trigger
                    scattersStr = `&ws.i0.types.i0.freespins=${slotSettings.slotFreeCount[scattersCount]}&ws.i3.types.i0.bonusid=alan-bonus&gamestate.bonusid=alan-bonus&nextaction=bonusaction&bonus.rollsleft=6&ws.i0.reelset=basic&ws.i0.betline=null&ws.i0.types.i0.wintype=bonusgame&ws.i0.direction=none&nextactiontype=selecttoken${scPos.join('')}`;
                }

                // Respin for sticky wins (Jumanji feature)
                let wildsRespinCount = 0; // Not directly used in Jumanji like some other games for respins
                // Instead, sticky wins are a specific feature. If stickyactive is true:
                if(stickyactive && totalWin > 0 && postData['slotEvent'] !== 'respin'){
                    slotSettings.SetGameData(slotSettings.slotId + 'RespinMode', 1); // Activate respin mode
                    slotSettings.SetGameData(slotSettings.slotId + 'StickyWinLines', lineWins); // Save winning symbols/lines
                    slotSettings.SetGameData(slotSettings.slotId + 'StickyWinTotal', totalWin);
                    // The reels for respin would be current reels with winning symbols held.
                    // This needs more complex state saving of symbol positions.
                    featureStr += '&feature.sticky.active=true&nextaction=respin';
                    // No immediate break, loop continues to check if this spin is valid against bank/limits
                }


                if (i > 1000) winType = 'none';
                if (postData['slotEvent'] === 'shuffle' && totalWin <= spinWinLimit) break; // Shuffle result taken
                if (i > 1500) { response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"Bad Reel Strip"}`; return; }
                if (slotSettings.MaxWin < (totalWin * slotSettings.CurrentDenom)) { /* continue */ }
                else {
                  const minWin = slotSettings.GetRandomPay();
                  if (i > 700 && postData['slotEvent'] !== 'shuffle') { /* minWin = 0; */ } // PHP commented out
                  if (slotSettings.increaseRTP && winType === 'win' && totalWin < (minWin * currentAllbet) && postData['slotEvent'] !== 'shuffle') { /* continue */ }
                  else if (scattersCount >= 3 && winType !== 'bonus') { /* continue to ensure bonus triggers */ }
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
              reels = reelsTmp; // Use reels before feature modification for main display, features add overlays.

              let curReelsResponse = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}%2CSYM${reels.reel1[1]}%2CSYM${reels.reel1[2]}`;
              curReelsResponse += `&rs.i0.r.i1.syms=SYM${reels.reel2[0]}%2CSYM${reels.reel2[1]}%2CSYM${reels.reel2[2]}%2CSYM${reels.reel2[3]}`;
              curReelsResponse += `&rs.i0.r.i2.syms=SYM${reels.reel3[0]}%2CSYM${reels.reel3[1]}%2CSYM${reels.reel3[2]}%2CSYM${reels.reel3[3]}%2CSYM${reels.reel3[4]}`;
              curReelsResponse += `&rs.i0.r.i3.syms=SYM${reels.reel4[0]}%2CSYM${reels.reel4[1]}%2CSYM${reels.reel4[2]}%2CSYM${reels.reel4[3]}`;
              curReelsResponse += `&rs.i0.r.i4.syms=SYM${reels.reel5[0]}%2CSYM${reels.reel5[1]}%2CSYM${reels.reel5[2]}`;

              if (postData['slotEvent'] === 'freespin' || postData['slotEvent'] === 'respin') {
                slotSettings.SetGameData(slotSettings.slotId + 'BonusWin', slotSettings.GetGameData(slotSettings.slotId + 'BonusWin') + totalWin);
                slotSettings.SetGameData(slotSettings.slotId + 'TotalWin', slotSettings.GetGameData(slotSettings.slotId + 'TotalWin') + totalWin);
              } else {
                slotSettings.SetGameData(slotSettings.slotId + 'TotalWin', totalWin);
              }

              let fsCount = 0; // Free Spins triggered this spin for board game.
              if (scattersCount >= 3) {
                  // These are set for board game trigger, not direct FS like other games
                  slotSettings.SetGameData(slotSettings.slotId + 'FreeStartWin', totalWin);
                  // slotSettings.SetGameData(slotSettings.slotId + 'FreeGames', slotSettings.slotFreeCount[scattersCount]); // This is for board game rolls
                  // fsCount = slotSettings.GetGameData(slotSettings.slotId + 'FreeGames');
              }

              const winStringResp = lineWins.join('');
              const jsSpin = JSON.stringify(reels); // Not used in final Jumanji response string
              const jsJack = JSON.stringify(slotSettings.Jackpots); // Not used

              let finalNextAction = featureStr.includes('nextaction=respin') ? 'respin' : (featureStr.includes('nextaction=shuffle') ? 'shuffle' : (scattersCount >=3 ? 'bonusaction' : 'spin'));
              let finalGameOver = (finalNextAction === 'spin' && postData['slotEvent'] !== 'freespin').toString();
              let finalClientAction = aid; // original action for log
              let finalStack = 'basic';
              let finalGamestate = 'basic';

              if (postData['slotEvent'] === 'freespin') {
                const currentTotalFSWin = slotSettings.GetGameData(slotSettings.slotId + 'BonusWin');
                const totalFSLiteral = slotSettings.GetGameData(slotSettings.slotId + 'FreeGames');
                const currentFSLiteral = slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame');
                const fsLeft = totalFSLiteral - currentFSLiteral;

                if (fsLeft <= 0) { // Last free spin
                    finalNextAction = slotSettings.GetGameData(slotSettings.slotId + 'BonusType') === 'shuffle' ? 'bonusaction' : 'spin'; // End FS or go to board game if shuffle was the FS type
                    finalGamestate = 'basic';
                    finalStack = 'basic';
                    if(slotSettings.GetGameData(slotSettings.slotId + 'BonusType') === 'shuffle') finalNextAction = 'endbonus'; // End bonus game flow
                } else { // Continue freespins
                    finalNextAction = 'freespin';
                    finalGamestate = 'freespin';
                    finalStack = 'basic%2Cfreespin';
                }
                gameOverNext = (finalNextAction === 'spin' || finalNextAction === 'endbonus').toString();

                freeStateSpin = `&freespins.left=${fsLeft}&freespins.total=${totalFSLiteral}&freespins.totalwin.coins=${currentTotalFSWin}&freespins.win.coins=${totalWin}&gamestate.current=${finalGamestate}&nextaction=${finalNextAction}`;
                // ... plus other freespin related params from PHP if needed
                curReelsResponse += freeStateSpin;
              } else if (postData['slotEvent'] === 'respin') {
                  // Handle respin state persistence and next action
                  // ...
              }

              const serverResponse = { // This structure is NOT what Jumanji uses. It's a string.
                  freeState: freeStateSpin, slotLines: lines, slotBet: currentBetline,
                  totalFreeGames: slotSettings.GetGameData(slotSettings.slotId + 'FreeGames'),
                  currentFreeGames: slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame'),
                  Balance: balanceInCents, afterBalance: balanceInCents,
                  bonusWin: slotSettings.GetGameData(slotSettings.slotId + 'BonusWin'),
                  totalWin: slotSettings.GetGameData(slotSettings.slotId + 'TotalWin'),
                  winLines: [], Jackpots: jsJack, reelsSymbols: reels // reels before feature modification for server log
              };
              slotSettings.SaveLogReport(JSON.stringify(serverResponse), currentAllbet, lines, reportWin, postData['slotEvent'] === 'respin' ? 'freespin' : (postData['slotEvent'] === 'shuffle' ? 'bet' : postData['slotEvent']));

              // Construct the actual response string for Jumanji
              let finalResponseString = `gameServerVersion=2.0.1&g4mode=false&playercurrency=%26%23x20AC%3B&historybutton=false&current.rs.i0=basic&next.rs=basic&gamestate.history=basic&game.win.cents=${totalWin * slotSettings.CurrentDenomination * 100}&totalwin.coins=${totalWin}&credit=${balanceInCents}&gamestate.current=${finalGamestate}&multiplier=1&isJackpotWin=false&gamestate.stack=${finalStack}&playercurrencyiso=${slotSettings.slotCurrency}&clientaction=${finalClientAction}&totalwin.cents=${totalWin * slotSettings.CurrentDenomination * 100}&gameover=${finalGameOver}&nextaction=${finalNextAction}&wavecount=1&game.win.amount=${totalWin / slotSettings.CurrentDenomination}`;
              finalResponseString += curReelsResponse + winStringResp + featureStr + scattersStr; // scattersStr includes bonus trigger
              // Add nearwin string if applicable (attStr from PHP)
              // ...
              result_tmp.push(finalResponseString);
              break;
            // Cases for initbonus, bonusaction, endbonus need to be implemented
            case 'initbonus':
                const totalWinInitBonus = slotSettings.GetGameData(slotSettings.slotId + 'TotalWin');
                result_tmp.push(`bonus.field.i3.type=coin&bonus.field.i29.type=coin&gameServerVersion=2.0.1&g4mode=false&feature.randomwilds.active=false&historybutton=false&sub.sym12.r4=sym7&sub.sym12.r3=sym7&sub.sym12.r2=sym7&gamestate.history=basic&sub.sym12.r1=sym7&sub.sym12.r0=sym7&bonus.field.i2.value=1&bonus.field.i14.type=coin&game.win.cents=${totalWinInitBonus * slotSettings.CurrentDenomination * 100}&bonus.field.i28.type=feature&bonus.field.i2.type=reroll&nextclientrs=basic&totalwin.coins=${totalWinInitBonus}&gamestate.current=bonus&jackpotcurrency=%26%23x20AC%3B&bonus.rollsleft=6&bonus.field.i28.value=randomwilds&bonus.field.i1.type=coin&feature.sticky.active=false&bonus.field.i17.value=1&isJackpotWin=false&bonuswin.cents=${totalWinInitBonus * slotSettings.CurrentDenomination * 100}&totalbonuswin.cents=${totalWinInitBonus * slotSettings.CurrentDenomination * 100}&bonus.field.i4.type=feature&bonus.field.i22.value=1&bonus.field.i20.type=feature&feature.wildreels.active=false&bonus.field.i31.type=coin&bonus.field.i15.type=coin&bonus.field.i25.value=3&bonus.field.i6.type=reroll&bonus.field.i0.type=mystery&game.win.coins=${totalWinInitBonus}&bonus.field.i18.type=reroll&bonus.field.i14.value=1&clientaction=initbonus&sub.sym13.r0=sym3&bonus.field.i21.type=feature&bonus.field.i21.value=shuffle&sub.sym13.r1=sym3&sub.sym13.r2=sym3&sub.sym13.r3=sym3&sub.sym13.r4=sym3&bonus.field.i1.value=1&bonus.field.i7.value=1&bonus.field.i17.type=coin&bonus.field.i31.value=1&gameover=false&bonus.field.i30.type=coin&totalbonuswin.coins=${totalWinInitBonus}&bonus.board.position=0&sub.sym11.r4=sym6&sub.sym11.r3=sym6&sub.sym11.r2=sym6&sub.sym11.r1=sym6&sub.sym11.r0=sym6&bonus.field.i11.type=feature&gamestate.bonusid=alan-bonus&bonus.field.i27.value=randomwilds&bonus.field.i8.value=unrevealed&bonus.field.i27.type=feature&nextaction=bonusaction&bonus.field.i20.value=shuffle&bonus.field.i15.value=2&game.win.amount=${totalWinInitBonus / slotSettings.CurrentDenomination}&bonus.field.i9.type=reroll&playercurrency=%26%23x20AC%3B&bonus.field.i6.value=1&bonus.field.i24.type=mystery&bonus.field.i8.type=mystery&bonus.field.i10.type=coin&bonus.field.i26.value=1&bonus.field.i16.value=unrevealed&bonus.field.i9.value=1&bonus.field.i19.value=1&bonus.field.i29.value=1&credit=${balanceInCents}&multiplier=1&bonus.field.i13.value=1&bonus.field.i30.value=1&gamestate.stack=basic%2Cbonus&feature.shuffle.active=false&gamesoundurl=&bonus.field.i0.value=unrevealed&bonus.field.i3.value=5&bonus.field.i7.type=coin&bonus.field.i10.value=1&bonus.field.i23.type=coin&bonus.field.i12.type=feature&bonus.field.i26.type=coin&playercurrencyiso=${slotSettings.slotCurrency}&bonus.field.i24.value=unrevealed&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&bonus.field.i11.value=wildreels&bonus.field.i13.type=coin&bonus.field.i25.type=coin&bonus.field.i5.type=feature&totalwin.cents=${totalWinInitBonus * slotSettings.CurrentDenomination * 100}&bonus.field.i4.value=stickywin&bonus.field.i22.type=coin&bonus.field.i5.value=stickywin&bonus.field.i16.type=mystery&bonus.field.i19.type=coin&bonusgame.coinvalue=${slotSettings.CurrentDenomination}&bonus.field.i23.value=1&bonus.field.i18.value=1&bonus.field.i12.value=wildreels&wavecount=1&nextactiontype=selecttoken&bonuswin.coins=${totalWinInitBonus}`);
                break;
            case 'bonusaction':
                // ... logic for dice roll, moving on board, triggering features ...
                // This is highly stateful and complex.
                result_tmp.push(`{"responseEvent":"spin","responseType":"${postData['slotEvent']}","serverResponse":{"totalWin":0,"currentBonusStep":0,"dice":[1,1]}}`); // Placeholder
                break;
            case 'endbonus':
                const totalWinEndBonus = slotSettings.GetGameData(slotSettings.slotId + 'TotalWin');
                result_tmp.push(`previous.rs.i0=freespin&freespins.betlevel=1&gameServerVersion=2.0.1&g4mode=false&freespins.win.coins=${totalWinEndBonus}&playercurrency=%26%23x20AC%3B&feature.randomwilds.active=false&historybutton=false&current.rs.i0=basic&sub.sym12.r4=sym10&sub.sym12.r3=sym10&next.rs=basic&sub.sym12.r2=sym10&gamestate.history=basic%2Cbonus%2Cfreespin%2Cbonus&sub.sym12.r1=sym10&sub.sym12.r0=sym10&game.win.cents=${totalWinEndBonus * slotSettings.CurrentDenomination * 100}&feature.randomwilds.positions=0%3A0%2C1%3A2%2C1%3A3%2C2%3A0%2C2%3A4%2C3%3A0%2C3%3A1%2C3%3A2&nextclientrs=basic&totalwin.coins=${totalWinEndBonus}&credit=${balanceInCents}&gamestate.current=basic&freespins.initial=5&jackpotcurrency=%26%23x20AC%3B&multiplier=1&last.rs=freespin&bonus.rollsleft=0&freespins.denomination=${slotSettings.CurrentDenomination}&feature.sticky.active=false&freespins.win.cents=${totalWinEndBonus * slotSettings.CurrentDenomination * 100}&freespins.totalwin.coins=${totalWinEndBonus}&freespins.total=5&isJackpotWin=false&gamestate.stack=basic&feature.shuffle.active=false&gamesoundurl=&playercurrencyiso=${slotSettings.slotCurrency}&freespins.wavecount=1&freespins.multiplier=1&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&clientaction=endbonus&sub.sym13.r0=sym5&sub.sym13.r1=sym5&sub.sym13.r2=sym5&sub.sym13.r3=sym5&sub.sym13.r4=sym5&bonus.token=crocodile&totalwin.cents=${totalWinEndBonus * slotSettings.CurrentDenomination * 100}&gameover=true&bonus.feature.disabled=randomwilds&bonus.board.position=25&freespins.left=0&sub.sym11.r4=sym10&sub.sym11.r3=sym10&sub.sym11.r2=sym10&sub.sym11.r1=sym10&sub.sym11.r0=sym10&nextaction=spin&wavecount=1&game.win.amount=${totalWinEndBonus / slotSettings.CurrentDenomination}&freespins.totalwin.cents=${totalWinEndBonus * slotSettings.CurrentDenomination * 100}`);
                break;
            default:
              response = `{"responseEvent":"error","responseType":"","serverResponse":"Unknown action: ${aid}"}`; return;
          }

          if (result_tmp.length === 0 && !response) { // If no response pushed and no error set
            response = '{"responseEvent":"error","responseType":"","serverResponse":"Invalid request state for action: ' + aid + '"}';
            return;
          }
          response = result_tmp[0];
          slotSettings.SaveGameData();
          slotSettings.SaveGameDataStatic();

        } catch (e: any) {
          if (typeof slotSettings !== 'undefined') slotSettings.InternalErrorSilent(e);
          else console.error(`JumanjiNETServer Error (no slotSettings): ${e.message}, Request: ${JSON.stringify(request.query)}`);
          response = `{"responseEvent":"error","responseType":"","serverResponse":"InternalError: ${e.message}"}`;
        }
      });
    };
    get_(request, game);
    return response;
  }
}
