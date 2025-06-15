// Placeholder types (replace with actual Prisma models or interfaces)
type User = { id: number | null };
type Request = any; // Replace with actual request type
type Game = any; // Replace with actual game type
type SlotSettingsType = any; // Replace with actual SlotSettings type
type DBTransaction = (callback: () => void) => void; // Placeholder for DB transaction

// Placeholder for Auth
const Auth = {
  id: (): number | null => {
    return 1; // Example user ID
  },
};

// Placeholder for DB
const DB = {
  transaction: (callback: () => void) => {
    callback();
  },
};

// Placeholder for SlotSettings class (specific to GrandSpinnSuperpotNET)
class SlotSettings {
  constructor(game: Game, userId: number) {}
  is_active(): boolean { return true; }
  GetBalance(): number { return 0; }
  CurrentDenom: number = 0;
  CurrentDenomination: number = 0;
  slotId: string = '';
  SetGameData(key: string, value: any): void {}
  HasGameData(key: string): boolean {return false;}
  GetGameData(key: string): any {return 0;}
  Bet: any[] = [];
  GetHistory(): any {return 'NULL';}
  Denominations: number[] = [];
  slotCurrency: string = 'USD';
  slotJackpot: number[] = [0,0,0]; // For tt_mega, tt_midi, tt_mini
  UpdateJackpots(allbet: number): any { return {isJackPay: false}; } // Returns jackState
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
  Jackpots: any = {}; // For general jackpot display if any, distinct from slotJackpot array
  SaveLogReport(response: string, allbet: number, lines: number, reportWin: number, event: string): void {}
  SaveGameData(): void {}
  SaveGameDataStatic(): void {}
  InternalErrorSilent(e: any): void { console.error(e); }
  GetReelStrips(winType: string, event: string): any {
    return { reel1: ['1', '2', '3'], reel2: ['1', '2', '3'], reel3: ['1', '2', '3'], rp: [0,0,0], rps: [[0,1,2],[0,1,2],[0,1,2]] };
  }
  OffsetReelStrips(reels: any, offset: number): any { return reels; } // Mock
  DecodeData(data: string): any { return {}; } // Mock
  FormatResponse(data: any): string { return ""; } // Mock
  ClearJackpot(index: number) {} // Mock
}

// Content from response_template.json
const responseTemplateJson = {
  "spin":"rs.i0.r.i0.overlay.i0.pos=32&rs.i0.r.i2.overlay.i2.pos=39&gameServerVersion=1.10.0&g4mode=false&playercurrency=%26%23x20AC%3B&historybutton=false&rs.i0.r.i2.overlay.i1.pos=38&next.rs=basic&gamestate.history=basic&rs.i0.r.i0.overlay.i1.with=SYM7&rs.i0.r.i0.overlay.i1.row=1&rs.i0.r.i1.syms=SYM11%2CSYM25%2CSYM16&game.win.cents=0&rs.i0.r.i2.overlay.i0.pos=37&rs.i0.id=ultraShort3&totalwin.coins=0&credit=499900&gamestate.current=basic&rs.i0.r.i0.overlay.i2.row=2&jackpot.tt_mega.EUR.amount-30s=500000&rs.i0.r.i0.overlay.i0.with=SYM100&rs.i0.r.i2.overlay.i0.row=0&jackpotcurrency=%26%23x20AC%3B&rs.i0.r.i0.overlay.i2.pos=34&rs.i0.r.i1.overlay.i1.with=SYM99&multiplier=1&rs.i0.r.i2.overlay.i2.with=SYM5&last.rs=ultraShort3&rs.i0.r.i0.syms=SYM28%2CSYM16%2CSYM16&rs.i0.r.i0.overlay.i1.pos=33&rs.i0.r.i1.overlay.i0.row=0&rs.i0.r.i1.overlay.i2.pos=22&rs.i0.r.i2.overlay.i0.with=SYM50&rs.i0.r.i2.overlay.i1.row=1&isJackpotWin=false&gamestate.stack=basic&rs.i0.r.i0.pos=32&gamesoundurl=https%3A%2F%2Fstatic.casinomodule.com%2F&rs.i0.r.i0.overlay.i0.row=0&rs.i0.r.i1.overlay.i1.row=1&rs.i0.r.i2.overlay.i2.row=2&rs.i0.r.i1.pos=20&rs.i0.r.i1.overlay.i1.pos=21&game.win.coins=0&playercurrencyiso=EUR&rs.i0.r.i1.hold=false&rs.i0.r.i1.overlay.i0.pos=20&rs.i0.r.i1.overlay.i2.row=2&playforfun=true&jackpotcurrencyiso=EUR&clientaction=spin&jackpot.tt_mega.EUR.lastpayedout=0&rs.i0.r.i1.overlay.i2.with=SYM7&rs.i0.r.i2.hold=false&rs.i0.r.i2.pos=37&jackpot.tt_mega.EUR.amount=500000&totalwin.cents=0&gameover=true&rs.i0.r.i0.hold=false&nextaction=spin&wavecount=1&rs.i0.r.i1.overlay.i0.with=SYM8&rs.i0.r.i0.overlay.i2.with=SYM7&rs.i0.r.i2.syms=SYM29%2CSYM15%2CSYM15&rs.i0.r.i2.overlay.i1.with=SYM5&game.win.amount=0"
};

export class GrandSpinnSuperpotNETServer {
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
          if (postData['operation']) { // Jackpot operation takes precedence
            postData['slotEvent'] = 'jackpot';
            postData['action'] = 'jackpot';
          } else if (postData['action'] === 'nudge') {
            postData['slotEvent'] = 'nudge';
            // action is already nudge
          } else if (postData['action'] === 'init' || postData['action'] === 'reloadbalance') {
            postData['action'] = 'init';
            postData['slotEvent'] = 'init';
          } else if (postData['action'] === 'paytable') {
            postData['slotEvent'] = 'paytable';
          }
          // initfreespin is not explicitly handled in PHP's switch for this game but good to keep pattern

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
            const lines = 20; // This seems to be a default, Grand Spinn is 1 line but bets are per 20?
            const betline = postData['bet_betlevel'];
            if (lines <= 0 || betline <= 0.0001) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid bet state"}`;
              return;
            }
            // Grand Spinn has 1 line, but bet is x2 in PHP. So allbet = betline * 1 * 2.
            // The condition uses ($lines * $betline) which would be betline * 20. This might be an error in original PHP or specific logic.
            // Assuming the PHP's ($lines * $betline) is intentional for balance check.
            if (slotSettings.GetBalance() < (lines * betline)) {
              response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"invalid balance"}`;
              return;
            }
          }
          // No FreeGames check as GrandSpinn doesn't seem to have traditional free spins mode like others.

          const aid = String(postData['action']);
          switch (aid) {
            case 'init':
              // Similar init logic as other games, but response string is different
              const lastEvent = slotSettings.GetHistory();
              let curReelsInit = '';
              if (lastEvent !== 'NULL' && lastEvent.serverResponse && lastEvent.serverResponse.reelsSymbols) {
                 const reels = lastEvent.serverResponse.reelsSymbols;
                 curReelsInit = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}%2CSYM${reels.reel1[1]}%2CSYM${reels.reel1[2]}`;
                 curReelsInit += `&rs.i0.r.i1.syms=SYM${reels.reel2[0]}%2CSYM${reels.reel2[1]}%2CSYM${reels.reel2[2]}`;
                 curReelsInit += `&rs.i0.r.i2.syms=SYM${reels.reel3[0]}%2CSYM${reels.reel3[1]}%2CSYM${reels.reel3[2]}`;
                 if(reels.rp && reels.rp.length === 3){
                     curReelsInit += `&rs.i0.r.i0.pos=${reels.rp[0]}&rs.i0.r.i1.pos=${reels.rp[1]}&rs.i0.r.i2.pos=${reels.rp[2]}`;
                 }
              } else {
                // Default reels if no history
                const rand = (min:number, max:number) => Math.floor(Math.random() * (max - min + 1)) + min;
                curReelsInit = `&rs.i0.r.i0.syms=SYM${rand(1,7)}%2CSYM${rand(1,7)}%2CSYM${rand(1,7)}`;
                curReelsInit += `&rs.i0.r.i1.syms=SYM${rand(1,7)}%2CSYM${rand(1,7)}%2CSYM${rand(1,7)}`;
                curReelsInit += `&rs.i0.r.i2.syms=SYM${rand(1,7)}%2CSYM${rand(1,7)}%2CSYM${rand(1,7)}`;
                curReelsInit += `&rs.i0.r.i0.pos=${rand(1,10)}&rs.i0.r.i1.pos=${rand(1,10)}&rs.i0.r.i2.pos=${rand(1,10)}`;
              }

              slotSettings.Denominations.forEach((d, i) => slotSettings.Denominations[i] = d * 100);

              // The init string for GrandSpinn is quite specific and includes jackpot info.
              // It doesn't seem to have a separate freeState string part like other games.
              result_tmp.push(
                `denomination.all=${slotSettings.Denominations.join('%2C')}&gameServerVersion=1.10.0&g4mode=false&playercurrency=%26%23x20AC%3B&historybutton=false&gameEventSetters.enabled=false&rs.i0.r.i1.syms=SYM5%2CSYM5%2CSYM5&game.win.cents=0&staticsharedurl=https%3A%2F%2Fstatic-shared.casinomodule.com%2Fgameclient_html%2Fdevicedetection%2Fcurrent&rs.i0.id=basic&bl.i0.reelset=ALL&totalwin.coins=0&credit=${balanceInCents}&gamestate.current=basic&denomination.standard=${slotSettings.CurrentDenomination * 100}&jackpot.tt_mega.${slotSettings.slotCurrency}.amount-30s=${Math.round(slotSettings.slotJackpot[0] * 100)}&jackpotcurrency=%26%23x20AC%3B&multiplier=1&rs.i0.r.i0.syms=SYM7%2CSYM7%2CSYM7&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&isJackpotWin=false&rs.i0.r.i0.pos=0&gamesoundurl=https%3A%2F%2Fstatic.casinomodule.com%2F&nearwinallowed=true&rs.i0.r.i1.pos=0&game.win.coins=0&playercurrencyiso=${slotSettings.slotCurrency}&rs.i0.r.i1.hold=false&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&clientaction=init&jackpot.tt_mega.${slotSettings.slotCurrency}.lastpayedout=0&rs.i0.r.i2.hold=false&rs.i0.r.i2.pos=0&casinoID=netent&jackpot.tt_mega.${slotSettings.slotCurrency}.amount=${Math.round(slotSettings.slotJackpot[0] * 100)}&betlevel.standard=1&totalwin.cents=0&gameover=true&bl.i0.coins=2&rs.i0.r.i0.hold=false&restore=false&bl.i0.id=0&bl.standard=0&bl.i0.line=1%2C1%2C1&nextaction=spin&wavecount=1&rs.i0.r.i2.syms=SYM8%2CSYM8%2CSYM8&game.win.amount=0&betlevel.all=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9%2C10${curReelsInit}`
              );
              break;
            case 'paytable':
              result_tmp.push(
                `pt.i0.comp.i0.type=betline&pt.i0.comp.i6.type=betline&gameServerVersion=1.10.0&g4mode=false&playercurrency=%26%23x20AC%3B&historybutton=false&pt.i0.comp.i1.multi=20&pt.i0.comp.i4.multi=3&pt.i0.comp.i5.freespins=0&bl.i0.reelset=ALL&credit=${balanceInCents}&pt.i0.comp.i5.type=betline&pt.i0.comp.i2.freespins=0&jackpot.tt_mega.${slotSettings.slotCurrency}.amount-30s=${Math.round(slotSettings.slotJackpot[0] * 100)}&pt.i0.comp.i5.multi=2&pt.i0.comp.i4.freespins=0&jackpotcurrency=%26%23x20AC%3B&pt.i0.comp.i4.type=betline&pt.i0.id=basic&pt.i0.comp.i1.type=betline&isJackpotWin=false&pt.i0.comp.i2.symbol=SYM4&pt.i0.comp.i4.symbol=SYM6&gamesoundurl=https%3A%2F%2Fstatic.casinomodule.com%2F&pt.i0.comp.i1.freespins=0&pt.i0.comp.i6.symbol=SYM8&pt.i0.comp.i0.symbol=SYM1&pt.i0.comp.i1.n=3&pt.i0.comp.i3.n=3&pt.i0.comp.i5.n=3&pt.i0.comp.i3.type=betline&pt.i0.comp.i3.freespins=0&pt.i0.comp.i6.multi=1&playercurrencyiso=${slotSettings.slotCurrency}&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&clientaction=paytable&jackpot.tt_mega.${slotSettings.slotCurrency}.lastpayedout=0&pt.i0.comp.i2.multi=10&pt.i0.comp.i0.freespins=0&pt.i0.comp.i2.type=betline&jackpot.tt_mega.${slotSettings.slotCurrency}.amount=${Math.round(slotSettings.slotJackpot[0] * 100)}&bl.i0.coins=2&pt.i0.comp.i0.multi=20&bl.i0.id=0&bl.i0.line=1%2C1%2C1&pt.i0.comp.i3.symbol=SYM5&pt.i0.comp.i5.symbol=SYM7&pt.i0.comp.i6.freespins=0&pt.i0.comp.i0.n=3&pt.i0.comp.i2.n=3&pt.i0.comp.i1.symbol=SYM3&pt.i0.comp.i3.multi=5&pt.i0.comp.i4.n=3&pt.i0.comp.i6.n=3`
              );
              break;
            case 'jackpot': // Specific to GrandSpinn
                 result_tmp.push(
                    `jackpot.tt_mega.${slotSettings.slotCurrency}.amount-30s=${Math.round(slotSettings.slotJackpot[0] * 100)}&jackpot.tt_mega.${slotSettings.slotCurrency}.lastpayedout=0&jackpot.tt_mega.${slotSettings.slotCurrency}.nplayers=0&jackpot.tt_mega.${slotSettings.slotCurrency}.amount=${Math.round(slotSettings.slotJackpot[0] * 100)}`
                 );
                 break;
            // initfreespin is not in PHP switch, if needed it would be similar to other games
            case 'spin':
            case 'nudge':
              let responseData = JSON.parse(JSON.stringify(responseTemplateJson)); // Deep copy
              responseData.spin = slotSettings.DecodeData(responseData.spin); // Mocked, will return an object

              const linesId: number[][] = [[2, 2, 2, 2, 2]]; // GrandSpinn has 1 line, symbols are on the middle row (index 1, so 2 in 1-based system)
              const lines = 1; // Effective paylines

              let currentBetline: number;
              let currentAllbet: number; // Total bet in currency units
              let jackState: any = { isJackPay: false }; // Default

              if (postData['slotEvent'] !== 'nudge') {
                currentBetline = postData['bet_betlevel'];
                // In PHP, $allbet = $betline * $lines * 2; $lines is 1 for GrandSpinn. So $allbet = $betline * 2
                currentAllbet = currentBetline * 2;
                slotSettings.UpdateJackpots(currentAllbet); // This is $betline * 2
                slotSettings.SetBalance(-1 * currentAllbet, postData['slotEvent']);
                const bankSum = currentAllbet / 100 * slotSettings.GetPercent();
                slotSettings.SetBank(postData['slotEvent'] || '', bankSum, postData['slotEvent']);
                jackState = slotSettings.UpdateJackpots(currentAllbet); // Called again

                slotSettings.SetGameData('GrandSpinnSuperpotNETBonusWin', 0); // No traditional bonus win
                slotSettings.SetGameData('GrandSpinnSuperpotNETFreeGames', 0); // No FS
                slotSettings.SetGameData('GrandSpinnSuperpotNETCurrentFreeGame', 0);
                slotSettings.SetGameData('GrandSpinnSuperpotNETTotalWin', 0);
                slotSettings.SetGameData('GrandSpinnSuperpotNETBet', currentBetline);
                slotSettings.SetGameData('GrandSpinnSuperpotNETDenom', postData['bet_denomination']);
                // slotSettings.SetGameData('GrandSpinnSuperpotNETFreeBalance', parseFloat(slotSettings.GetBalance().toFixed(2)) * 100); // No FS
              } else { // Nudge event
                postData['bet_denomination'] = slotSettings.GetGameData('GrandSpinnSuperpotNETDenom');
                slotSettings.CurrentDenom = postData['bet_denomination'];
                slotSettings.CurrentDenomination = postData['bet_denomination'];
                currentBetline = slotSettings.GetGameData('GrandSpinnSuperpotNETBet');
                currentAllbet = currentBetline * 2; // Nudge doesn't re-deduct bet, uses original
                // Nudge doesn't re-trigger SetGameData for bet/denom/etc.
              }

              const winTypeTmp = slotSettings.GetSpinSettings(postData['slotEvent'], currentAllbet, lines);
              let winType = winTypeTmp[0];
              let spinWinLimit = winTypeTmp[1];
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);
              // No FS specific winType change

              let totalWin = 0;
              let lineWins: string[] = [];
              const wild = ['1']; // Wild symbol
              // Scatter '0' is not used for wins in GrandSpinn, only for nudge trigger?

              let reels: any;
              let reelsTmp: any; // To store original reels before nudge modifications for win calc if needed

              for (let i = 0; i <= 2000; i++) { // Spin loop
                totalWin = 0;
                lineWins = [];
                let cWins: number[] = new Array(lines).fill(0);

                if (postData['slotEvent'] === 'nudge') {
                  reels = slotSettings.OffsetReelStrips(slotSettings.GetGameData('GrandSpinnSuperpotNETReels'), 1); // Assuming offset of 1 for nudge
                } else {
                  reels = slotSettings.GetReelStrips(winType, postData['slotEvent']);
                }
                reelsTmp = JSON.parse(JSON.stringify(reels)); // Store for potential multi-nudge win calcs

                if (jackState && jackState.isJackPay) { // If jackpot was hit from initial bet
                  reels.reel1[1] = '102'; // Jackpot symbol on middle row
                  reels.reel2[1] = '102';
                  reels.reel3[1] = '102';
                }
                // else if (reels.reel1[1] === '102' && reels.reel2[1] === '102' && reels.reel3[1] === '102') {
                  // This condition in PHP seems redundant if jackState.isJackPay already handled it.
                // }

                let winLineCount = 0;
                for (let k = 0; k < lines; k++) { // Only 1 line in GrandSpinn
                  let tmpStringWin = '';
                  for (let j = 0; j < slotSettings.SymbolGame.length; j++) {
                    const csym = String(slotSettings.SymbolGame[j]);
                    if (csym === '0' || !slotSettings.Paytable['SYM_' + csym]) { // Scatter '0' doesn't pay
                      continue;
                    }
                    const s: string[] = []; // Symbols on the payline (middle row)
                    s[0] = reels.reel1[linesId[k][0] - 1]; // e.g., linesId[0][0] is 2 for middle row
                    s[1] = reels.reel2[linesId[k][1] - 1];
                    s[2] = reels.reel3[linesId[k][2] - 1];
                    // GrandSpinn only has 3 reels, so s[3], s[4] are not applicable.

                    if ((s[0] === csym || wild.includes(s[0])) &&
                        (s[1] === csym || wild.includes(s[1])) &&
                        (s[2] === csym || wild.includes(s[2]))) {
                      let currentMpl = 1; // Base multiplier
                      // Check for wild multipliers on the line
                      if (wild.includes(s[0])) currentMpl *= slotSettings.Paytable['SYM_1'][1] || 1; // SYM_1 is wild, index 1 for its multiplier value
                      if (wild.includes(s[1])) currentMpl *= slotSettings.Paytable['SYM_1'][1] || 1;
                      if (wild.includes(s[2])) currentMpl *= slotSettings.Paytable['SYM_1'][1] || 1;

                      const tmpWin = slotSettings.Paytable['SYM_' + csym][3] * currentBetline * currentMpl; // Paytable index 3 for 3 symbols
                      if (cWins[k] < tmpWin) {
                        cWins[k] = tmpWin;
                        // Construct win string, simplified for 3 reels
                        tmpStringWin = `&ws.i${winLineCount}.reelset=basic&ws.i${winLineCount}.types.i0.coins=${tmpWin}&ws.i${winLineCount}.pos.i0=0%2C${linesId[k][0] - 1}&ws.i${winLineCount}.pos.i1=1%2C${linesId[k][1] - 1}&ws.i${winLineCount}.pos.i2=2%2C${linesId[k][2] - 1}&ws.i${winLineCount}.types.i0.wintype=coins&ws.i${winLineCount}.betline=${k}&ws.i${winLineCount}.sym=SYM${csym}&ws.i${winLineCount}.direction=left_to_right&ws.i${winLineCount}.types.i0.cents=${tmpWin * slotSettings.CurrentDenomination * 100}`;
                      }
                    }
                  }
                  if (cWins[k] > 0 && tmpStringWin !== '') {
                    lineWins.push(tmpStringWin);
                    totalWin += cWins[k];
                    winLineCount++;
                  }
                }
                // No scattersStr for free spins in GrandSpinn

                if (i > 1000) winType = 'none'; // Safety break
                if (i > 1500) { response = `{"responseEvent":"error","responseType":"${postData['slotEvent']}","serverResponse":"Bad Reel Strip"}`; return; }

                const maxWinCheck = slotSettings.MaxWin < (totalWin * slotSettings.CurrentDenom);
                if(maxWinCheck){ /* continue loop */ }
                else {
                    const minWin = slotSettings.GetRandomPay();
                    if (i > 700) { /* minWin = 0; */ } // PHP commented this out
                    if (slotSettings.increaseRTP && winType === 'win' && totalWin < (minWin * currentAllbet)) { /* continue loop */ }
                    else {
                        if (postData['slotEvent'] === 'nudge') break; // Nudge wins are taken as is for this iteration
                        // No scatter check for bonus trigger here as it's different logic
                        if (totalWin <= spinWinLimit && winType === 'bonus') { // 'bonus' winType here might mean jackpot eligibility
                            const cBank = slotSettings.GetBank(postData['slotEvent'] || '');
                            if (cBank < spinWinLimit) spinWinLimit = cBank; else break;
                        } else if (totalWin > 0 && totalWin <= spinWinLimit && winType === 'win') {
                            const cBank = slotSettings.GetBank(postData['slotEvent'] || '');
                            if (cBank < spinWinLimit) spinWinLimit = cBank; else break;
                        } else if (totalWin === 0 && winType === 'none') {
                            break;
                        }
                    }
                }
              } // End of spin loop

              if (totalWin > 0) {
                slotSettings.SetBank(postData['slotEvent'] || '', -1 * totalWin);
                slotSettings.SetBalance(totalWin);
              }
              const reportWin = totalWin;

              // Constructing curReels string for responseData
              let curReelsStr = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}%2CSYM${reels.reel1[1]}%2CSYM${reels.reel1[2]}`;
              curReelsStr += `&rs.i0.r.i1.syms=SYM${reels.reel2[0]}%2CSYM${reels.reel2[1]}%2CSYM${reels.reel2[2]}`;
              curReelsStr += `&rs.i0.r.i2.syms=SYM${reels.reel3[0]}%2CSYM${reels.reel3[1]}%2CSYM${reels.reel3[2]}`;
              // Overlay data for GrandSpinn
              for(let r=0; r<3; r++){ // 3 reels
                for(let p=0; p<3; p++){ // 3 symbols visible
                    curReelsStr += `&rs.i0.r.i${r}.overlay.i${p}.with=SYM${reels['reel'+(r+1)][p]}`;
                    curReelsStr += `&rs.i0.r.i${r}.overlay.i${p}.pos=${reels.rps[r][p]}`; // rps from GetReelStrips
                }
              }

              if (postData['slotEvent'] === 'nudge') {
                slotSettings.SetGameData('GrandSpinnSuperpotNETBonusWin', slotSettings.GetGameData('GrandSpinnSuperpotNETBonusWin') + totalWin);
                slotSettings.SetGameData('GrandSpinnSuperpotNETTotalWin', slotSettings.GetGameData('GrandSpinnSuperpotNETTotalWin') + totalWin);
              } else {
                slotSettings.SetGameData('GrandSpinnSuperpotNETTotalWin', totalWin);
              }
              // No traditional Free Spins state string (freeState)

              const winString = lineWins.join('');
              // const jsSpin = JSON.stringify(reels); // Not directly used in response string like other games
              // const jsJack = JSON.stringify(slotSettings.Jackpots); // Jackpot info is directly embedded

              let clientActionNext = 'spin';
              let gameOverNext = 'true';
              let currentNudgeCount = 0;

              if (totalWin > 0 && postData['slotEvent'] !== 'nudge') { // Initial win, check for nudge
                clientActionNext = 'spin'; // Will be overridden by nudge if nudge occurs
                gameOverNext = 'true'; // Will be false if nudge is possible
                // Check for nudge possibility (arrow symbol '0' on top row of any reel)
                let canNudge = false;
                for(let r=1; r<=3; r++){
                    if(reels['reel'+r][0] === '0'){ // Symbol '0' is the arrow for nudge
                        canNudge = true;
                        break;
                    }
                }
                if(canNudge){
                    slotSettings.SetGameData('GrandSpinnSuperpotNETNudge', 1); // Start nudge sequence
                    clientActionNext = 'nudge'; // PHP sets this to 'spin' but then response has nextaction=nudge
                    gameOverNext = 'false';
                }
              } else if (postData['slotEvent'] === 'nudge') {
                 currentNudgeCount = slotSettings.GetGameData('GrandSpinnSuperpotNETNudge') || 0;
                 slotSettings.SetGameData('GrandSpinnSuperpotNETNudge', currentNudgeCount + 1);
                 let canNudgeAgain = false;
                 if(totalWin > 0){ // If nudge resulted in a win, check for more nudges
                    for(let r=1; r<=3; r++){
                        if(reels['reel'+r][0] === '0'){
                            canNudgeAgain = true;
                            break;
                        }
                    }
                 }
                 if(canNudgeAgain && (currentNudgeCount + 1) < 5){ // Max 5 nudges approx based on PHP logic
                    clientActionNext = 'nudge';
                    gameOverNext = 'false';
                 } else {
                    clientActionNext = 'spin'; // End of nudges
                    gameOverNext = 'true';
                    slotSettings.SetGameData('GrandSpinnSuperpotNETNudge', 0); // Reset nudge count
                 }
              }

              const finalTotalWin = slotSettings.GetGameData('GrandSpinnSuperpotNETTotalWin');
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

              // Populate responseData from template and current game state
              responseData.spin.playercurrency = slotSettings.slotCurrency;
              responseData.spin.jackpotcurrency = slotSettings.slotCurrency;
              responseData.spin.playercurrencyiso = slotSettings.slotCurrency;
              responseData.spin.jackpotcurrencyiso = slotSettings.slotCurrency;
              // Jackpot amounts need to be dynamically filled based on slotSettings.slotJackpot
              // Assuming slotJackpot[0] is mega, [1] is midi, [2] is mini
              responseData.spin[`jackpot.tt_mega.${slotSettings.slotCurrency}.amount`] = Math.round((slotSettings.slotJackpot[0] || 0) * 100);
              responseData.spin[`jackpot.tt_mega.${slotSettings.slotCurrency}.amount-30s`] = Math.round((slotSettings.slotJackpot[0] || 0) * 100);
              // Add midi and mini if they exist in template/logic
              // responseData.spin[`jackpot.tt_midi.${slotSettings.slotCurrency}.amount`] = Math.round((slotSettings.slotJackpot[1] || 0) * 100);
              // responseData.spin[`jackpot.tt_mini.${slotSettings.slotCurrency}.amount`] = Math.round((slotSettings.slotJackpot[2] || 0) * 100);
              responseData.spin.credit = balanceInCents;
              responseData.spin.game.win.amount = finalTotalWin / slotSettings.CurrentDenomination;
              responseData.spin.game.win.coins = finalTotalWin;
              responseData.spin.game.win.cents = finalTotalWin * slotSettings.CurrentDenomination * 100;
              responseData.spin.totalwin.cents = finalTotalWin * slotSettings.CurrentDenomination * 100;
              responseData.spin.totalwin.coins = finalTotalWin;
              responseData.spin.nextaction = clientActionNext;
              responseData.spin.gameover = gameOverNext;
              responseData.spin.clientaction = aid; // 'spin' or 'nudge'

              // Update reel symbols and positions in responseData.spin string
              // This part is tricky as it involves replacing parts of a long string.
              // For simplicity, we'll just append the crucial parts.
              // A more robust solution would parse the template string and update values.
              let tempSpinStr = responseData.spin_template_string_placeholder; // Assume template string is stored
              tempSpinStr = tempSpinStr.replace(/SYM\d+%\d+CSYM\d+%\d+CSYM\d+/g, ''); // Clear old syms
              tempSpinStr += curReelsStr;
              tempSpinStr = tempSpinStr.replace(/credit=\d+/, `credit=${balanceInCents}`);
              // ... more replacements for win amounts, nextaction, gameover etc.

              slotSettings.SaveLogReport(JSON.stringify(responseData), currentAllbet, lines, reportWin, postData['slotEvent']);
              if (jackState && jackState.isJackPay) {
                slotSettings.SetBalance(slotSettings.slotJackpot[0] / slotSettings.CurrentDenom); // Assuming mega jackpot
                slotSettings.ClearJackpot(0); // Clear mega jackpot
              }
              slotSettings.SetGameData('GrandSpinnSuperpotNETReels', reels); // Save current reels for potential nudge

              // The PHP code uses FormatResponse on an array derived from DecodeData.
              // Here, we'll just append the win string to a base response string for now.
              // The full response construction is complex due to the template.
              const baseResponse = `rs.i0.r.i0.overlay.i0.pos=${reels.rps[0][0]}&rs.i0.r.i2.overlay.i2.pos=${reels.rps[2][2]}&gameServerVersion=1.10.0&g4mode=false&playercurrency=%26%23x20AC%3B&historybutton=false&next.rs=basic&gamestate.history=basic&game.win.cents=${finalTotalWin * slotSettings.CurrentDenomination * 100}&rs.i0.id=ultraShort5&totalwin.coins=${finalTotalWin}&credit=${balanceInCents}&gamestate.current=basic&jackpot.tt_mega.${slotSettings.slotCurrency}.amount=${Math.round((slotSettings.slotJackpot[0] || 0) * 100)}&jackpotcurrency=%26%23x20AC%3B&multiplier=1&isJackpotWin=${(jackState.isJackPay ? 'true' : 'false')}&playercurrencyiso=${slotSettings.slotCurrency}&clientaction=${aid}&totalwin.cents=${finalTotalWin * slotSettings.CurrentDenomination * 100}&gameover=${gameOverNext}&nextaction=${clientActionNext}&wavecount=1&game.win.amount=${finalTotalWin / slotSettings.CurrentDenomination}`;
              result_tmp.push(baseResponse + curReelsStr + winString);
              break;
          }

          if (!result_tmp[0] && aid !== 'nudge' && aid !== 'spin') {
            response = '{"responseEvent":"error","responseType":"","serverResponse":"Invalid request state"}';
            return;
          }
          response = result_tmp[0] || ""; // Ensure response is a string
          slotSettings.SaveGameData();
          slotSettings.SaveGameDataStatic();

        } catch (e: any) {
          if (typeof slotSettings !== 'undefined') {
            slotSettings.InternalErrorSilent(e);
          } else {
            console.error(`InternalError (no slotSettings): ${e.message}, Request: ${JSON.stringify(request.query)}`);
          }
          response = `{"responseEvent":"error","responseType":"","serverResponse":"InternalError: ${e.message}"}`;
        }
      });
    };

    get_(request, game);
    return response;
  }
}
