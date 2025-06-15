// Placeholder types
type User = { id: number | null };
type Request = any;
type Game = any;
type SlotSettingsType = any;

// Placeholder for Auth and DB
const Auth = { id: (): number | null => 1 };
const DB = { transaction: (callback: () => void) => callback() };

// Placeholder for SlotSettings class (specific to ReelRush2NET)
class SlotSettings {
  constructor(game: Game, userId: number) {}
  is_active(): boolean { return true; }
  GetBalance(): number { return 0; }
  CurrentDenom: number = 0.01; CurrentDenomination: number = 0.01;
  slotId: string = 'ReelRush2NET';
  SetGameData(key: string, value: any): void {}
  HasGameData(key: string): boolean {return false;}
  GetGameData(key: string): any {
      if(key.endsWith('Stars')) return 0; // Default stars
      if(key.endsWith('RespinId')) return 0; // Default respin level
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
  slotFreeCount: Record<number, number> = {}; // Not used directly for triggering FS in RR2, more for feature spins
  Jackpots: any = {}; SaveLogReport(r:string,a:number,l:number,w:number,e:string): void {}
  SaveGameData(): void {} SaveGameDataStatic(): void {} InternalErrorSilent(e: any): void {console.error(e);}
  GetReelStrips(winType: string, slotEvent: string): any {
      // Reel Rush 2 has a dynamic reel area. This needs to be handled based on current respin level / game state.
      // For now, a placeholder for the initial 1-3-5-3-1 or 1-3-5-3-1 type structure
      return {
          reel1: ['1'], reel2: ['1','2','3'], reel3: ['1','2','3','4','5'],
          reel4: ['1','2','3'], reel5: ['1'], rp:[0,0,0,0,0]
      };
  }
  // Feature-specific methods that would be in SlotSettings
  SymbolUpgrade(reels: any, featureCount: number): string { return `&features.i${featureCount}.type=SymbolUpgrade`; }
  RandomWilds(reels: any, featureCount: number): string { return `&features.i${featureCount}.type=RandomWilds`; }

}

export class ReelRush2NETServer {
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
          postData['freeMode'] = '';    // Default for ReelRush2 specific modes

          if (postData['action'] === 'freespin') {
            postData['slotEvent'] = 'freespin'; postData['action'] = 'spin';
          } else if (postData['action'] === 'superfreespin') {
            postData['slotEvent'] = 'freespin'; postData['action'] = 'spin'; postData['freeMode'] = 'superfreespin';
          } else if (postData['action'] === 'respin') {
            postData['slotEvent'] = 'respin'; postData['action'] = 'spin';
          } else if (postData['action'] === 'init' || postData['action'] === 'reloadbalance') {
            postData['action'] = 'init'; postData['slotEvent'] = 'init';
          } else if (postData['action'] === 'paytable') {
            postData['slotEvent'] = 'paytable';
          } else if (postData['action'] === 'purchasestars') { // Buy Super Tokens
            postData['slotEvent'] = 'purchasestars';
          } else if (postData['action'] === 'gamble') { // Gamble Super Tokens for Super FS
            postData['slotEvent'] = 'gamble';
          } else if (postData['action'] === 'initfreespin') { // Called before starting FS choice
            postData['slotEvent'] = 'initfreespin';
          } else if (postData['action'] === 'startfreespins') { // After choosing FS type (regular/super)
            postData['slotEvent'] = 'startfreespins';
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
            // Reel Rush 2 bet cost is for 20 "lines" or coins, though ways to win change
            const lines = 20;
            const betline = postData['bet_betlevel']; // This is the coin value essentially
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
              slotSettings.SetGameData(slotSettings.slotId + 'BonusWin', 0);
              slotSettings.SetGameData(slotSettings.slotId + 'FreeGames', 0);
              slotSettings.SetGameData(slotSettings.slotId + 'CurrentFreeGame', 0);
              slotSettings.SetGameData(slotSettings.slotId + 'TotalWin', 0);
              slotSettings.SetGameData(slotSettings.slotId + 'FreeBalance', 0);
              slotSettings.SetGameData(slotSettings.slotId + 'Stars', 0); // Reel Rush 2 Super Tokens

              let curReelsInit = ''; let freeStateInit = '';
              // Logic to reconstruct state from lastEvent (reels, free spins, stars, respin level)
              // This is highly complex for Reel Rush 2 due to dynamic reel area.
              // For now, a simplified version:
              if (lastEvent !== 'NULL' && lastEvent.serverResponse && lastEvent.serverResponse.reelsSymbols) {
                const reels = lastEvent.serverResponse.reelsSymbols;
                // Example for initial 1-3-5-3-1 state (actual symbols would vary)
                curReelsInit = `&rs.i0.r.i0.syms=SYM${reels.reel1[0]}`;
                curReelsInit += `&rs.i0.r.i1.syms=SYM${reels.reel2[0]}%2CSYM${reels.reel2[1]}%2CSYM${reels.reel2[2]}`;
                // ... and so on for all 5 reels with their current symbol counts
                // Also add rs.i1... for freespin reels and pos= for positions if applicable
                freeStateInit = lastEvent.serverResponse.freeState || '';
              } else {
                // Default initial reels for 1-3-5-3-1 structure
                const r = (n:number) => Math.floor(Math.random()*n)+1; // Random symbol
                curReelsInit = `&rs.i0.r.i0.syms=SYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i1.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i2.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i3.syms=SYM${r(7)}%2CSYM${r(7)}%2CSYM${r(7)}`;
                curReelsInit += `&rs.i0.r.i4.syms=SYM${r(7)}`;
                for(let i=0; i<5; i++) curReelsInit += `&rs.i0.r.i${i}.pos=${r(5)}`; // Placeholder positions
              }

              slotSettings.Denominations.forEach((d:number, i:number) => slotSettings.Denominations[i] = d * 100);

              // The init string for ReelRush2 is very long and depends on many game state variables
              // (stars, respin level, available features, etc.)
              // Using a simplified version of the PHP init string:
              let initResponse = `casinoconfiguration.FEATURE_SUPER_TOKENS_BUY_ENABLED=TRUE&casinoconfiguration.FEATURE_SUPER_TOKENS_GAMBLE_ENABLED=true&stars.total=${slotSettings.GetGameData(slotSettings.slotId + 'Stars')}&denomination.all=${slotSettings.Denominations.join('%2C')}&gameServerVersion=1.21.0&g4mode=false&playercurrency=%26%23x20AC%3B&historybutton=false&gameEventSetters.enabled=false&rs.i0.r.i1.syms=SYM13%2CSYM1%2CSYM12%2CSYM10%2CSYM10&game.win.cents=0&staticsharedurl=https%3A%2F%2Fstatic-shared.casinomodule.com%2Fgameclient_html%2Fdevicedetection%2Fcurrent&rs.i0.id=basic&bl.i0.reelset=ALL&totalwin.coins=0&credit=${balanceInCents}&gamestate.current=basic&denomination.standard=${slotSettings.CurrentDenomination * 100}&jackpotcurrency=%26%23x20AC%3B&multiplier=1&rs.i0.r.i0.syms=SYM4%2CSYM4%2CSYM5%2CSYM5%2CSYM9&autoplay=10%2C25%2C50%2C75%2C100%2C250%2C500%2C750%2C1000&isJackpotWin=false&rs.i0.r.i0.pos=0&gamesoundurl=https%3A%2F%2Fstatic.casinomodule.com%2F&nearwinallowed=true&rs.i0.r.i1.pos=0&game.win.coins=0&playercurrencyiso=${slotSettings.slotCurrency}&rs.i0.r.i1.hold=false&playforfun=false&jackpotcurrencyiso=${slotSettings.slotCurrency}&clientaction=init&rs.i0.r.i2.hold=false&rs.i0.r.i2.pos=0&casinoID=netent&betlevel.standard=1&totalwin.cents=0&gameover=true&bl.i0.coins=20&rs.i0.r.i0.hold=false&restore=false&bl.i0.id=0&bl.standard=0&bl.i0.line=0%2F1%2F2%2F3%2F4%2C0%2F1%2F2%2F3%2F4%2C0%2F1%2F2%2F3%2F4%2C0%2F1%2F2%2F3%2F4%2C0%2F1%2F2%2F3%2F4&nextaction=spin&wavecount=1&rs.i0.r.i2.syms=SYM3%2CSYM9%2CSYM9%2CSYM12%2CSYM12&game.win.amount=0&betlevel.all=${slotSettings.Bet.join('%2C')}${curReelsInit}${freeStateInit}`;
              // Add openedpositions based on respin level
              const respinLevel = slotSettings.GetGameData(slotSettings.slotId + 'RespinId') || 0;
              const openedPositions = [0,2,4,6,8,10,12]; // Corresponds to respin levels 0-6
              initResponse += `&openedpositions.total=${openedPositions[respinLevel]}`;

              result_tmp.push(initResponse);
              break;
            case 'paytable':
              result_tmp.push( /* Static paytable string from PHP (very long) - simplified here */
                `pt.i0.id=basic&pt.i0.comp.i0.symbol=SYM3&pt.i0.comp.i0.multi=1000&pt.i0.comp.i0.n=5` + // Strawberry (SYM3)
                `&playercurrencyiso=${slotSettings.slotCurrency}&jackpotcurrencyiso=${slotSettings.slotCurrency}&clientaction=paytable`
                // ... many more paytable components
              );
              break;
            // Main spin/respin/freespin logic
            case 'spin': // Handles 'spin', 'freespin', 'superfreespin', 'respin' (after action mapping)

              // Lines are not fixed in Reel Rush 2, they expand. Ways to win change.
              // The 'lines=20' in PHP was for bet cost calculation.
              const baseBetLines = 20;
              let currentBetline: number;
              let currentAllbet: number; // Total bet cost
              let bonusMpl = 1;
              let currentRespinLevel = slotSettings.GetGameData(slotSettings.slotId + 'RespinId') || 0;
              let currentStars = slotSettings.GetGameData(slotSettings.slotId + 'Stars') || 0;
              let currentReelConfigId = `reelsconfig${currentRespinLevel}`; // To determine ways/reel shape

              if (postData['slotEvent'] !== 'freespin' && postData['slotEvent'] !== 'respin') { // Initial bet
                currentBetline = postData['bet_betlevel'];
                currentAllbet = currentBetline * baseBetLines;
                slotSettings.SetBalance(-1 * currentAllbet, 'bet');
                const bankSum = currentAllbet / 100 * slotSettings.GetPercent();
                slotSettings.SetBank('bet', bankSum, 'bet');

                slotSettings.SetGameData(slotSettings.slotId + 'AllBet', currentAllbet);
                slotSettings.SetGameData(slotSettings.slotId + 'BonusWin', 0);
                // FreeGames & CurrentFreeGame are for the main FS modes, not respins
                if (postData['slotEvent'] !== 'startfreespins' && postData['freeMode'] !== 'superfreespin') { // Don't reset if starting FS
                    slotSettings.SetGameData(slotSettings.slotId + 'FreeGames', 0);
                    slotSettings.SetGameData(slotSettings.slotId + 'CurrentFreeGame', 0);
                }
                slotSettings.SetGameData(slotSettings.slotId + 'RespinId', 0); currentRespinLevel = 0;
                slotSettings.SetGameData(slotSettings.slotId + 'TotalWin', 0); // Total win for the whole sequence (spin + respins)
                slotSettings.SetGameData(slotSettings.slotId + 'Bet', currentBetline);
                slotSettings.SetGameData(slotSettings.slotId + 'Denom', postData['bet_denomination']);
              } else { // Freespin, SuperFreespin, or Respin
                postData['bet_denomination'] = slotSettings.GetGameData(slotSettings.slotId + 'Denom');
                slotSettings.CurrentDenom = postData['bet_denomination'];
                slotSettings.CurrentDenomination = postData['bet_denomination'];
                currentBetline = slotSettings.GetGameData(slotSettings.slotId + 'Bet');
                currentAllbet = slotSettings.GetGameData(slotSettings.slotId + 'AllBet'); // Use original bet for FS/Respins

                if (postData['slotEvent'] === 'freespin') {
                    slotSettings.SetGameData(slotSettings.slotId + 'CurrentFreeGame', slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame') + 1);
                    // Super Freespin has progressive multiplier
                    if(postData['freeMode'] === 'superfreespin'){
                        const currentSuperMpl = slotSettings.GetGameData(slotSettings.slotId + 'SuperMpl') || 1;
                        bonusMpl = currentSuperMpl; // Apply super multiplier
                        slotSettings.SetGameData(slotSettings.slotId + 'SuperMpl', currentSuperMpl + 1); // Increment for next super FS
                    }
                } else if (postData['slotEvent'] === 'respin') {
                    // Respin level already incremented if win occurred, or managed by win condition
                }
              }

              const winTypeTmp = slotSettings.GetSpinSettings(postData['slotEvent'], currentAllbet, baseBetLines);
              let winType = winTypeTmp[0];
              let spinWinLimit = winTypeTmp[1];
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);
              if (winType === 'bonus' && (postData['slotEvent'] === 'freespin' || postData['slotEvent'] === 'respin')) {
                winType = 'win';
              }

              let iterationTotalWin = 0; // Win for this specific spin/respin
              let lineWins: string[] = [];
              const wild = 'WILD'; // Assuming 'WILD' is the symbol name for wild
              const scatter = 'SCATTER'; // Not used for wins

              let reels: any;
              let activeFeatures: string[] = []; // To store names of triggered random features
              let featureStringParts: string[] = []; // For response string

              // Main spin loop (usually iterates once unless forcing specific outcome)
              for (let i = 0; i <= 1; i++) { // Simplified loop for one attempt mostly
                iterationTotalWin = 0; lineWins = [];
                let cWins: number[] = new Array(3125).fill(0); // Max ways to win

                reels = slotSettings.GetReelStrips(winType, postData['slotEvent'], currentRespinLevel); // Pass respinLevel

                // Apply Random Features (if not in respin/freespin, or if specific FS allows)
                if(postData['slotEvent'] === 'bet' && i===0) { // Only on initial paid spin for this simplified logic
                    const featureRoll = Math.random() * 100;
                    // Simplified: one feature at a time. PHP logic was more complex.
                    if (featureRoll < 5) { // Symbol Upgrade
                        featureStringParts.push(slotSettings.SymbolUpgrade(reels, activeFeatures.length)); activeFeatures.push('SymbolUpgrade');
                    } else if (featureRoll < 10) { // Random Wilds
                        featureStringParts.push(slotSettings.RandomWilds(reels, activeFeatures.length)); activeFeatures.push('RandomWilds');
                    }
                    // ... other features like Symbol Multiplier, ManyBonusStars, BreakOpen, SecondChance
                }

                // Calculate wins based on current reel configuration (ways to win)
                // This is highly complex for Reel Rush 2 due to dynamic ways.
                // For now, conceptual win calculation:
                // 1. Determine active symbols on each reel based on currentRespinLevel.
                // 2. Iterate through all possible ways.
                // 3. Check for matches from left to right.
                // Placeholder for win calculation:
                if(reels.reel1[0] === reels.reel2[0] && reels.reel2[0] === reels.reel3[0]){ // Example simple win
                    const winningSymbol = reels.reel1[0];
                    if(slotSettings.Paytable['SYM_' + winningSymbol]){
                        const pay = slotSettings.Paytable['SYM_' + winningSymbol][3] * currentBetline * bonusMpl;
                        if(pay > 0){
                             cWins[0] = pay; // Store win on a conceptual "line 0"
                             lineWins.push(`&ws.i0.reelset=basic&ws.i0.types.i0.coins=${pay}&ws.i0.pos.i0=0%2C0&ws.i0.pos.i1=1%2C0&ws.i0.pos.i2=2%2C0&ws.i0.types.i0.wintype=coins&ws.i0.betline=0&ws.i0.sym=SYM${winningSymbol}&ws.i0.direction=left_to_right&ws.i0.types.i0.cents=${pay * slotSettings.CurrentDenomination * 100}`);
                             iterationTotalWin += pay;
                        }
                    }
                }
                // End Placeholder win calculation

                if (slotSettings.MaxWin < (iterationTotalWin * slotSettings.CurrentDenom)) { /* continue loop if too high */ }
                else {
                    // Break conditions from PHP (simplified)
                    if (iterationTotalWin > 0 && iterationTotalWin <= spinWinLimit && winType === 'win') break;
                    if (iterationTotalWin === 0 && winType === 'none') break;
                    if (winType === 'bonus' && iterationTotalWin <= spinWinLimit) break; // Forcing bonus
                }
              } // End spin attempt loop

              if (iterationTotalWin > 0) {
                slotSettings.SetBalance(iterationTotalWin); // Add win to balance
                slotSettings.SetGameData(slotSettings.slotId + 'TotalWin', slotSettings.GetGameData(slotSettings.slotId + 'TotalWin') + iterationTotalWin);
                if(postData['slotEvent'] === 'freespin' || postData['slotEvent'] === 'superfreespin'){
                     slotSettings.SetGameData(slotSettings.slotId + 'BonusWin', slotSettings.GetGameData(slotSettings.slotId + 'BonusWin') + iterationTotalWin);
                }
              }

              const reportWin = iterationTotalWin;
              const totalWinOverall = slotSettings.GetGameData(slotSettings.slotId + 'TotalWin');
              balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

              let nextAction = 'spin'; let currentGameState = 'basic'; let stack = 'basic';
              let openedPositionsStr = ''; let starsStr = ''; let freeSpinsStr = ''; let respinStr = '';

              if (iterationTotalWin > 0 && postData['slotEvent'] !== 'freespin' && postData['slotEvent'] !== 'superfreespin') { // Win on base or respin
                if (currentRespinLevel < 5) {
                  currentRespinLevel++;
                  slotSettings.SetGameData(slotSettings.slotId + 'RespinId', currentRespinLevel);
                  nextAction = 'respin'; currentGameState = 'respin'; // PHP uses 'basic' but 'nextaction=respin'
                  respinStr = `&respin.count=${currentRespinLevel}`;
                } else { // Max respins reached, check for Free Spins trigger
                  slotSettings.SetGameData(slotSettings.slotId + 'RespinId', 0); // Reset for next base spin
                  // Trigger Free Spins selection screen
                  nextAction = 'startfreespins'; currentGameState = 'start_freespins';
                  freeSpinsStr = '&legalactions=startfreespins%2Cgamble%2Cpurchasestars'; // Options for player
                }
              } else if (postData['slotEvent'] === 'freespin' || postData['slotEvent'] === 'superfreespin') {
                const currentFSGame = slotSettings.GetGameData(slotSettings.slotId + 'CurrentFreeGame');
                const totalFSGames = slotSettings.GetGameData(slotSettings.slotId + 'FreeGames');
                if (currentFSGame >= totalFSGames) { // Free spins end
                  nextAction = 'spin'; currentGameState = 'basic';
                  slotSettings.SetGameData(slotSettings.slotId + 'RespinId', 0); // Reset respin level after FS
                } else { // Continue Free Spins
                  nextAction = postData['freeMode'] === 'superfreespin' ? 'superfreespin' : 'freespin';
                  currentGameState = postData['freeMode'] === 'superfreespin' ? 'super_freespin' : 'freespin';
                  stack = 'basic%2Cfreespin'; // Or basic%2Csuper_freespin
                }
                const fsTotalWin = slotSettings.GetGameData(slotSettings.slotId + 'BonusWin');
                freeSpinsStr = `&freespins.left=${totalFSGames - currentFSGame}&freespins.total=${totalFSGames}&freespins.totalwin.coins=${fsTotalWin}&freespins.win.coins=${iterationTotalWin}`;
                if(postData['freeMode'] === 'superfreespin'){
                    freeSpinsStr += `&superfreespins.multiplier.active=${bonusMpl}&superfreespins.multiplier.increase=${(iterationTotalWin > 0 ? 1:0)}`;
                }
              } else { // No win on base spin or respin (and not in FS)
                slotSettings.SetGameData(slotSettings.slotId + 'RespinId', 0); // Reset respin level
                nextAction = 'spin'; currentGameState = 'basic';
              }

              openedPositionsStr = `&openedpositions.total=${openedPositions[currentRespinLevel]}`;
              starsStr = `&stars.total=${currentStars}&stars.unscaled=${currentStars * 20}`; // Example scaling

              // Construct response string (highly simplified for Reel Rush 2)
              let responseParams = `clientaction=${aid}&nextaction=${nextAction}&gamestate.current=${currentGameState}&credit=${balanceInCents}&totalwin.coins=${totalWinOverall}&game.win.coins=${iterationTotalWin}`;
              responseParams += openedPositionsStr + starsStr + freeSpinsStr + respinStr;
              // Add reel symbols (rs.i0.r.iX.syms=...) based on current reel configuration
              // Add feature strings (features.iX...)
              responseParams += featureStringParts.join('');
              responseParams += lineWins.join('');

              result_tmp.push(responseParams);
              slotSettings.SaveLogReport(JSON.stringify({ /* Log relevant data */ }), currentAllbet, baseBetLines, reportWin, postData['slotEvent']);
              break;
            // Cases for purchasestars, gamble, initfreespin, startfreespins would be here
            default:
              response = `{"responseEvent":"error","responseType":"","serverResponse":"Unknown or Unhandled action in ReelRush2: ${aid}"}`; return;
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
          else console.error(`ReelRush2NETServer Error (no slotSettings): ${e.message}, Request: ${JSON.stringify(request.query)}`);
          response = `{"responseEvent":"error","responseType":"","serverResponse":"InternalError: ${e.message}"}`;
        }
      });
    };
    get_(request, game);
    return response;
  }
}
