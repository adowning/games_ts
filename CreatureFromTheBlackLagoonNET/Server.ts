import { SlotSettings } from './SlotSettings';

// Define an interface for the expected GET request parameters
interface CreatureRequestParams {
    action: string;
    bet_denomination?: string; // Typically in cents or smallest currency unit
    bet_betlevel?: string;     // Number of coins per line
    gameaction?: string;       // For some specific actions if not covered by 'action'
    // Other params may be added as needed
    [key: string]: string | undefined;
}

// Placeholder for DB transaction logic if ever implemented
async function transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
        return await callback();
    } catch (error) {
        console.error("Mock transaction failed:", error);
        throw error;
    }
}

export class Server {
    private slotSettings: SlotSettings | null = null;
    private gameId: string; // e.g., "CreatureFromTheBlackLagoonNET"

    // Simulate Auth::id()
    private currentUserId: string | null = '1'; // Example User ID

    constructor(gameId: string) {
        this.gameId = gameId;
    }

    private initializeSlotSettings(userId: string): void {
        this.slotSettings = new SlotSettings(this.gameId, userId);
    }

    // Helper to build URL-encoded string responses
    private buildResponse(data: { [key: string]: any }): string {
        const params = new URLSearchParams();
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                // NetEnt responses often have complex nested structures represented with dot notation
                // For simplicity here, we'll handle flat structures first.
                // Real encoding might need a recursive helper for nested objects/arrays if required by client.
                params.append(key, String(data[key]));
            }
        }
        return params.toString();
    }

    // Main request handler for CreatureFromTheBlackLagoonNET
    public async handleRequest(requestParams: CreatureRequestParams): Promise<string> {
        return transaction(async () => {
            try {
                const userId = this.currentUserId;
                if (!userId) {
                    // This error format might need to match NetEnt's specific error response
                    return this.buildResponse({ responseEvent: "error", responseType: "", serverResponse: "invalid login" });
                }

                this.initializeSlotSettings(userId);
                if (!this.slotSettings) throw new Error("SlotSettings not initialized");

                if (!this.slotSettings.is_active()) {
                    return this.buildResponse({ responseEvent: "error", responseType: "", serverResponse: "Game is disabled" });
                }

                let action = requestParams.action;
                let slotEvent = 'bet'; // Default

                if (action === 'freespin') {
                    slotEvent = 'freespin';
                    action = 'spin'; // Internally, freespin is a type of spin
                } else if (action === 'respin') {
                    slotEvent = 'respin';
                    action = 'spin'; // Respin is also a type of spin
                } else if (action === 'init' || action === 'reloadbalance') {
                    action = 'init';
                    slotEvent = 'init';
                } else if (action === 'paytable') {
                    slotEvent = 'paytable';
                } else if (action === 'initfreespin') { // Specific NetEnt action to start FS sequence
                    slotEvent = 'initfreespin';
                }
                // Store original action for reference if needed
                requestParams.originalAction = requestParams.action;
                requestParams.action = action; // Normalized action
                (requestParams as any).slotEvent = slotEvent; // Attach slotEvent to params for handlers


                // Handle denomination if provided
                if (requestParams.bet_denomination) {
                    const denomValue = parseInt(requestParams.bet_denomination, 10) / 100; // Convert cents to float
                    if (denomValue >= 0.01) { // Basic validation
                        this.slotSettings.CurrentDenom = denomValue;
                        this.slotSettings.CurrentDenomination = denomValue; // PHP had both
                        this.slotSettings.SetGameData(this.slotSettings.slotId + 'GameDenom', denomValue);
                    }
                } else if (this.slotSettings.HasGameData(this.slotSettings.slotId + 'GameDenom')) {
                    const storedDenom = this.slotSettings.GetGameData(this.slotSettings.slotId + 'GameDenom');
                    this.slotSettings.CurrentDenom = storedDenom;
                    this.slotSettings.CurrentDenomination = storedDenom;
                }

                // Pre-request validation (example for bet)
                if (slotEvent === 'bet') {
                    const lines = 20; // Creature has fixed 20 lines
                    const betLevel = parseInt(requestParams.bet_betlevel || "1", 10);
                    if (lines <= 0 || betLevel <= 0) {
                        return this.buildResponse({ responseEvent: "error", responseType: slotEvent, serverResponse: "invalid bet state" });
                    }
                    if (this.slotSettings.GetBalance() < (lines * betLevel * this.slotSettings.CurrentDenom)) {
                         return this.buildResponse({ responseEvent: "error", responseType: slotEvent, serverResponse: "invalid balance" });
                    }
                }

                // Check for invalid free spin state
                if (slotEvent === 'freespin' &&
                    (this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeGames') || 0) <= (this.slotSettings.GetGameData(this.slotSettings.slotId + 'CurrentFreeGame') || 0) ) {
                     return this.buildResponse({ responseEvent: "error", responseType: slotEvent, serverResponse: "invalid bonus state (no free spins left)" });
                }


                let responseData: { [key: string]: any } = {};

                switch (action) {
                    case 'init':
                        responseData = this.handleInitAction(requestParams);
                        break;
                    case 'paytable':
                        responseData = this.handlePaytableAction(requestParams);
                        break;
                    case 'initfreespin': // Sent by client when free spins are triggered
                        responseData = this.handleInitFreeSpinAction(requestParams);
                        break;
                    case 'spin': // Handles bet, freespin, respin events
                        responseData = this.handleSpinAction(requestParams, slotEvent);
                        break;
                    // Add other actions like 'selectgame' if needed
                    default:
                        console.warn(`Unhandled action: ${action}`);
                        responseData = { error: `Unknown action ${action}` };
                        break;
                }

                this.slotSettings.SaveGameData();
                this.slotSettings.SaveGameDataStatic();

                return this.buildResponse(responseData);

            } catch (e: any) {
                console.error("Error in handleRequest:", e);
                if (this.slotSettings) {
                    this.slotSettings.InternalErrorSilent(e.message || String(e));
                }
                return this.buildResponse({ responseEvent: "error", responseType: "Exception", serverResponse: "InternalError" });
            }
        });
    }

    private handleInitAction(params: CreatureRequestParams): { [key: string]: any } {
        if (!this.slotSettings) throw new Error("SlotSettings not initialized");

        const lastEvent = this.slotSettings.GetHistory(); // Stubbed in SlotSettings

        // Reset or restore game state variables
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'BonusWin', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeGames', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'CurrentFreeGame', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'TotalWin', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeBalance', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'MonsterHealth', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeLevel', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'RespinMode', 0); // 0 = no respin, 1 = respin active
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'overlayWildsArr', []);


        let initialReelsStr = '';
        let restoreData: { [key: string]: any } = {};

        if (lastEvent && lastEvent !== 'NULL' && lastEvent.serverResponse) {
            // Simplified restoration logic
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeGames', lastEvent.serverResponse.totalFreeGames || 0);
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'CurrentFreeGame', lastEvent.serverResponse.currentFreeGames || 0);
            // ... more restoration from lastEvent if needed, similar to PHP
            // The PHP code for curReels is very specific to NetEnt's string format.
            // For now, generate a default view.
            restoreData = {
                // This part is complex to replicate exactly without knowing client needs for restore.
                // It involves setting up 'rs.i0.r.iX.syms' and 'pos' for multiple reel sets if in FS/Respin.
                // For simplicity, a basic reel setup:
                // "current.rs.i0": "basic", // or "freespinlevelX" if in free spins
                // "next.rs": "basic",
                // "gamestate.current": "basic", // or "freespin"
            };

        } else {
             const randomReels = this.slotSettings.GetReelStrips('none', 'bet');
             initialReelsStr = this.formatReelsForNetEnt(randomReels, "basic");
        }

        const balanceInCents = Math.round(this.slotSettings.GetBalance() * this.slotSettings.CurrentDenom * 100);

        // Construct the long init string. Many values are game defaults or from SlotSettings.
        // This is a simplified example; the actual PHP string is extremely long and detailed.
        const response: { [key: string]: any } = {
            'clientaction': 'init',
            'gsivalid': 'true',
            'autoplay': '10,25,50,75,100,250,500,750,1000', // Available autoplay counts
            'betlevel.standard': '1', // Default bet level
            'betlevel.all': (this.slotSettings.Bet || ["1","2","3","4","5","6","7","8","9","10"]).join(','),
            'denomination.standard': String(this.slotSettings.CurrentDenom * 100), // Denom in cents
            'denomination.all': (this.slotSettings.Denominations || [0.01, 0.02, 0.05]).map(d => d * 100).join(','),
            'bet.betlines': '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19', // Fixed 20 lines
            'credit': String(balanceInCents),
            'historybutton': 'false',
            'jackpotcurrency': this.slotSettings.slotCurrency || 'USD', // Should be currency symbol like € or $
            'jackpotcurrencyiso': this.slotSettings.slotCurrency || 'USD',
            'playercurrency': this.slotSettings.slotCurrency || 'USD',
            'playercurrencyiso': this.slotSettings.slotCurrency || 'USD',
            'gameover': 'true', // Assuming game is not in an active spin state on init
            'multiplier': '1',
            'nextaction': 'spin',
            'playforfun': 'false', // Assuming real money play
            'staticsharedurl': 'https://static-shared.casinomodule.com/gameclient_html/devicedetection/current', // Example URL
            'gamesoundurl': 'https://static.casinomodule.com/', // Example URL
            'gameServerVersion': '1.5.0', // Example version
            'g4mode': 'false',
            'gamestate.current': 'basic', // Initial state
            'gamestate.history': 'basic',
            'gamestate.stack': 'basic',
            'nearwinallowed': 'true', // NetEnt feature
             // Add initial reel display (rs structure) - simplified
            'rs.i0.id': 'basic', // Initial reelset ID
            // ... many more parameters from PHP init string ...
            ...restoreData // Merge restore data if any
        };
        // Append initialReelsStr if generated (needs proper merging with response object for buildResponse)
        // For now, this is a placeholder for how the reel string would be added.
        // The actual NetEnt string is not just key=value but a nested structure.
        // response['__rawReelString'] = initialReelsStr; // Temporary way to pass it

        // If in active free spins, restore state:
        const fsCurrent = this.slotSettings.GetGameData(this.slotSettings.slotId + 'CurrentFreeGame') || 0;
        const fsTotal = this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeGames') || 0;
        if (fsCurrent < fsTotal && fsTotal > 0) {
            response['gamestate.current'] = 'freespin';
            response['gamestate.stack'] = 'basic,freespin';
            response['freespins.left'] = String(fsTotal - fsCurrent);
            response['freespins.total'] = String(fsTotal);
            response['freespins.initial'] = String(fsTotal); // Or the amount that initially triggered
            response['freespins.totalwin.coins'] = String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'BonusWin') || 0);
            response['freespins.totalwin.cents'] = String(Math.round((this.slotSettings.GetGameData(this.slotSettings.slotId + 'BonusWin') || 0) * this.slotSettings.CurrentDenom * 100));
            response['freespins.betlevel'] = String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'Bet') || 1);
            response['freespins.denomination'] = String(this.slotSettings.CurrentDenom * 100);
            response['collectablesWon'] = String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'MonsterHealth') || 0);
            response['wavecount'] = String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeLevel') || 0); // Or monster health level
            const freeLevel = this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeLevel') || 0;
            const reelSetId = `freespinlevel${freeLevel}`;
            response['current.rs.i0'] = reelSetId;
            response['next.rs'] = reelSetId;
            response['rs.i0.id'] = reelSetId; // Overwrite basic reelset id
            response['previous.rs.i0'] = reelSetId; // Or the one before this level
            response['last.rs'] = reelSetId;
            response['nextaction'] = 'freespin';
             // Add restore=true if restoring a game
            response['restore'] = 'true';
        }


        return response;
    }

    private handlePaytableAction(params: CreatureRequestParams): { [key: string]: any } {
        if (!this.slotSettings) throw new Error("SlotSettings not initialized");
        // Construct paytable response string based on this.slotSettings.Paytable
        // This is also a very long string in PHP, detailing each symbol's payout for X matches.
        // Example for one symbol (Kay - SYM_3):
        // pt.i0.comp.i0.symbol=SYM3&pt.i0.comp.i0.n=3&pt.i0.comp.i0.multi=25&pt.i0.comp.i0.freespins=0&pt.i0.comp.i0.type=betline
        // pt.i0.comp.i1.symbol=SYM3&pt.i0.comp.i1.n=4&pt.i0.comp.i1.multi=250&pt.i0.comp.i1.freespins=0&pt.i0.comp.i1.type=betline
        // pt.i0.comp.i2.symbol=SYM3&pt.i0.comp.i2.n=5&pt.i0.comp.i2.multi=750&pt.i0.comp.i2.freespins=0&pt.i0.comp.i2.type=betline
        let paytableData: {[key:string]: string} = {'clientaction': 'paytable', 'pt.i0.id': 'basic'}; // pt.i1.id for freespins if different
        let componentIndex = 0;
        for(const symKey in this.slotSettings.Paytable){
            if(symKey === 'SYM_0' || symKey === 'SYM_1' || symKey === 'SYM_2') continue; // Wilds usually don't show in main paytable like this
            const symbolCode = symKey.split('_')[1];
            const payouts = this.slotSettings.Paytable[symKey];
            for(let count = 3; count <=5; count++){ // payouts for 3, 4, 5 symbols
                if(payouts[count] > 0){
                    paytableData[`pt.i0.comp.i${componentIndex}.symbol`] = `SYM${symbolCode}`;
                    paytableData[`pt.i0.comp.i${componentIndex}.n`] = String(count);
                    paytableData[`pt.i0.comp.i${componentIndex}.multi`] = String(payouts[count]);
                    paytableData[`pt.i0.comp.i${componentIndex}.freespins`] = "0";
                    paytableData[`pt.i0.comp.i${componentIndex}.type`] = "betline";
                    componentIndex++;
                }
            }
        }
        // Add info about Free Spins trigger (e.g., 3+ Scatters)
        // Add info about Spreading Wilds feature
        return paytableData;
    }

    private handleInitFreeSpinAction(params: CreatureRequestParams): { [key: string]: any } {
        if (!this.slotSettings) throw new Error("SlotSettings not initialized for InitFreeSpin");
        // This action is called when FS are triggered. Server should set up the FS state.
        // The actual number of free spins might have been determined by the triggering spin response.
        const fsAwarded = this.slotSettings.GetGameData(this.slotSettings.slotId + 'TriggeredFreeSpins') || 10; // Get from triggering spin if stored
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeGames', fsAwarded);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'CurrentFreeGame', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'BonusWin', 0); // Reset bonus win for this FS session
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'MonsterHealth', 0);
        this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeLevel', 0);

        const freeLevel = 0;
        const reelSetId = `freespinlevel${freeLevel}`;

        return {
            'clientaction': 'initfreespin',
            'gamestate.current': 'freespin',
            'gamestate.stack': 'basic,freespin',
            'nextaction': 'freespin',
            'freespins.left': String(fsAwarded),
            'freespins.total': String(fsAwarded),
            'freespins.initial': String(fsAwarded),
            'freespins.totalwin.coins': '0',
            'freespins.totalwin.cents': '0',
            'freespins.betlevel': String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'Bet') || 1),
            'freespins.denomination': String(this.slotSettings.CurrentDenom * 100),
            'collectablesWon': '0', // Monster health
            'wavecount': String(freeLevel),   // Free spin level / monster health stage
            'current.rs.i0': reelSetId,
            'next.rs': reelSetId,
            'rs.i0.id': reelSetId,
            'previous.rs.i0': 'basic', // Reelset before freespins
            'last.rs': 'basic', // Reelset of the triggering spin
            'credit': String(Math.round(this.slotSettings.GetBalance() * this.slotSettings.CurrentDenom * 100)),
            'gameover': 'false', // Free spins starting
            'multiplier': '1',
        };
    }


    private handleSpinAction(params: CreatureRequestParams, slotEvent: string): { [key: string]: any } {
        if (!this.slotSettings) throw new Error("SlotSettings not initialized");

        const lines = 20; // Fixed lines
        const betLevel = parseInt(params.bet_betlevel ||
            String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'Bet') || "1"), 10);

        const currentDenom = this.slotSettings.CurrentDenom;
        const betPerLine = betLevel; // Coins per line
        const totalBetCoins = betPerLine * lines;
        const totalBetValue = totalBetCoins * currentDenom;

        if (slotEvent === 'bet') {
            this.slotSettings.SetBalance(-totalBetValue, 'bet');
            const bankContribution = totalBetValue * (this.slotSettings.GetPercent() / 100);
            this.slotSettings.SetBank('bet', bankContribution, 'bet');
            // this.slotSettings.UpdateJackpots(totalBetValue); // If jackpots are used

            // Reset for new spin sequence
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'BonusWin', 0);
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'TotalWin', 0);
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeGames', 0); // Reset unless restoring active FS
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'CurrentFreeGame', 0);
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'RespinMode', 0);
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'overlayWildsArr', []);
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'Bet', betLevel);
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'Denom', currentDenom);
        } else if (slotEvent === 'freespin') {
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'CurrentFreeGame',
                (this.slotSettings.GetGameData(this.slotSettings.slotId + 'CurrentFreeGame') || 0) + 1);
        }
        // Respin doesn't decrement balance or FS count. Wilds from prev spin are sticky.

        const [winType, spinWinLimit] = this.slotSettings.GetSpinSettings(slotEvent as ('bet'|'bonus'), betPerLine, lines);

        let iteration = 0;
        let totalWinCoins = 0;
        let lineWinStrings: string[] = []; // For NetEnt string format
        let reelsObj: any;
        let scattersCount = 0;
        let calculatedWinsResult: any;

        for (iteration = 0; iteration < 500; iteration++) { // Max iterations to find a suitable spin
            reelsObj = this.slotSettings.GetReelStrips(winType, slotEvent);

            // Apply sticky wilds for RESPIN
            if(slotEvent === 'respin') {
                const stickyWilds = this.slotSettings.GetGameData(this.slotSettings.slotId + 'overlayWildsArr') || [];
                stickyWilds.forEach((wildPos: {reel: number, row: number, symbol: string}) => {
                    if(reelsObj[`reel${wildPos.reel}`]) {
                        reelsObj[`reel${wildPos.reel}`][wildPos.row] = wildPos.symbol; // Ensure sticky wild is '0', '1' or '2'
                    }
                });
            }
            // Apply spreading wilds during FREE SPIN based on monster health / free level
            const currentFreeLevel = this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeLevel') || 0;
            if(slotEvent === 'freespin' && currentFreeLevel > 0) {
                // Level 1: Wild on reel 2,3 or 4 becomes sticky and spreads 1 left.
                // Level 2: Wild on reel 2,3 or 4 becomes sticky and spreads 1 right.
                // Level 3: Wild on reel 2,3 or 4 becomes sticky and spreads 1 left & 1 right (full reel wild).
                // Simplified: assume some wilds become spreading wilds based on level
                // This needs more detailed logic on how spreading wilds are chosen and applied.
            }


            calculatedWinsResult = this.calculateWins(reelsObj, betPerLine, lines, this.slotSettings!, slotEvent);
            totalWinCoins = calculatedWinsResult.totalWin;
            scattersCount = calculatedWinsResult.scattersCount;
            // lineWinStrings = this.formatLineWinsForNetEnt(calculatedWinsResult.lineWins); // Helper needed

            // TODO: Add break conditions from PHP spin loop (bank checks, max win, win type consistency)
            if (totalWinCoins <= spinWinLimit) break; // Basic break condition
            if (winType === 'none' && totalWinCoins === 0) break;
        }

        const totalWinValue = totalWinCoins * currentDenom;
        if (totalWinValue > 0) {
            this.slotSettings.SetBalance(totalWinValue);
            this.slotSettings.SetBank(slotEvent, -totalWinValue);
        }

        if (slotEvent === 'freespin') {
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'BonusWin',
                (this.slotSettings.GetGameData(this.slotSettings.slotId + 'BonusWin') || 0) + totalWinCoins);
        } else if (slotEvent !== 'respin'){ // regular bet
            this.slotSettings.SetGameData(this.slotSettings.slotId + 'TotalWin', totalWinCoins);
        }

        // Handle Creature-specific features
        let nextAction = "spin";
        let currentGameState = "basic";
        let overlayWildsStr = "";
        let stickyWildsForResponse: any[] = [];

        // Check for new sticky wilds from this spin (if not already a respin)
        if (slotEvent !== 'respin') {
            const newStickyWilds = this.findNewWildsOnScreen(reelsObj, this.slotSettings.GetGameData(this.slotSettings.slotId + 'overlayWildsArr'));
            if (newStickyWilds.length > 0) {
                this.slotSettings.SetGameData(this.slotSettings.slotId + 'RespinMode', 1);
                this.slotSettings.SetGameData(this.slotSettings.slotId + 'overlayWildsArr', newStickyWilds);
                nextAction = "respin";
                currentGameState = "respin"; // Or specific ID like "basicrespin"
                stickyWildsForResponse = newStickyWilds;
            } else {
                this.slotSettings.SetGameData(this.slotSettings.slotId + 'RespinMode', 0);
                this.slotSettings.SetGameData(this.slotSettings.slotId + 'overlayWildsArr', []);
            }
        } else { // Was a respin
             this.slotSettings.SetGameData(this.slotSettings.slotId + 'RespinMode', 0); // End respin mode after this respin
             this.slotSettings.SetGameData(this.slotSettings.slotId + 'overlayWildsArr', []); // Clear sticky wilds
             currentGameState = "basic"; // return to basic
             nextAction = "spin";
        }

        // Free Spin Trigger
        if (slotEvent !== 'freespin' && slotEvent !== 'respin' && scattersCount >= 3) {
            const fsAwarded = this.slotSettings.slotFreeCount?.[scattersCount] || 0;
            if (fsAwarded > 0) {
                this.slotSettings.SetGameData(this.slotSettings.slotId + 'TriggeredFreeSpins', fsAwarded); // Store for initfreespin
                // The actual start of FS is handled by 'initfreespin' client call
                nextAction = "initfreespin";
                // The response needs to indicate FS trigger
            }
        }

        // Free Spin progression (Monster health, levels)
        if (slotEvent === 'freespin') {
            currentGameState = "freespin";
            const monsterTargetSymbol = '2'; // Symbol '2' is the target on reel 5
            if (reelsObj.reel5 && reelsObj.reel5.includes(monsterTargetSymbol)) {
                let currentHealth = this.slotSettings.GetGameData(this.slotSettings.slotId + 'MonsterHealth') || 0;
                currentHealth++;
                this.slotSettings.SetGameData(this.slotSettings.slotId + 'MonsterHealth', currentHealth);
                // Check for level up based on health (e.g. every 3 health points)
                // const newLevel = Math.floor(currentHealth / 3); // Example
                // if (newLevel > (this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeLevel') || 0)) {
                //    this.slotSettings.SetGameData(this.slotSettings.slotId + 'FreeLevel', newLevel);
                //    // Award more spins or activate more spreading wilds based on newLevel
                // }
            }
            const fsCurrent = this.slotSettings.GetGameData(this.slotSettings.slotId + 'CurrentFreeGame') || 0;
            const fsTotal = this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeGames') || 0;
            if (fsCurrent >= fsTotal) {
                nextAction = "spin"; // End of FS, back to normal spin
                currentGameState = "basic";
            } else {
                nextAction = "freespin";
            }
        }

        const balanceInCents = Math.round(this.slotSettings.GetBalance() * currentDenom * 100);
        let response = {
            'clientaction': params.originalAction, // Use original action for client
            'nextaction': nextAction,
            'gamestate.current': currentGameState,
            'rs.i0.id': currentGameState, // Reelset ID, e.g. basic, basicrespin, freespinlevelX
            // ... Reel symbols (formatted for NetEnt) ...
            'game.win.coins': String(totalWinCoins),
            'game.win.cents': String(Math.round(totalWinValue * 100)),
            'game.win.amount': String(totalWinValue),
            'totalwin.coins': String(totalWinCoins),
            'totalwin.cents': String(Math.round(totalWinValue * 100)),
            'credit': String(balanceInCents),
            'multiplier': '1',
            'gameover': (nextAction === 'spin' && currentGameState === 'basic') ? 'true' : 'false',
            'isJackpotWin': 'false', // Assuming no jackpot for now
            // ... line win details (ws structure) ...
            // ... free spin details if in FS ...
            // ... respin details (sticky wilds) ...
        };

        response = {...response, ...this.formatReelsAndWinsForNetEnt(reelsObj, calculatedWinsResult, stickyWildsForResponse)};

        if (slotEvent === 'freespin' || currentGameState === 'freespin') {
             const fsCurrent = this.slotSettings.GetGameData(this.slotSettings.slotId + 'CurrentFreeGame') || 0;
             const fsTotal = this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeGames') || 0;
             response['freespins.left'] = String(fsTotal - fsCurrent);
             response['freespins.total'] = String(fsTotal);
             response['freespins.totalwin.coins'] = String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'BonusWin') || 0);
             response['collectablesWon'] = String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'MonsterHealth') || 0);
             response['wavecount'] = String(this.slotSettings.GetGameData(this.slotSettings.slotId + 'FreeLevel') || 0);
        }

        this.slotSettings.SaveLogReport(this.buildResponse(response), totalBetValue, lines, totalWinValue, slotEvent);
        return response;
    }

    // Helper to find new wilds on screen that were not previously sticky
    private findNewWildsOnScreen(reelsObj: any, existingStickyWilds: any[] = []): any[] {
        const newWilds: any[] = [];
        const wildSymbols = ['0','1','2']; // Creature wilds
        for (let r = 1; r <= 5; r++) {
            for (let c = 0; c < 3; c++) {
                const symbol = this.getSymbol(reelsObj, r, c);
                if (wildSymbols.includes(symbol!)) {
                    const isExisting = existingStickyWilds.some(sw => sw.reel === r && sw.row === c);
                    if (!isExisting) {
                        newWilds.push({reel: r, row: c, symbol: symbol});
                    }
                }
            }
        }
        return newWilds;
    }

    // Helper to format reels and wins into NetEnt's string structure (simplified)
    private formatReelsForNetEnt(reels: any, reelSetId: string): string {
        // rs.i0.r.i0.syms=SYM6%2CSYM8%2CSYM3&rs.i0.r.i0.pos=62
        let str = `rs.i0.id=${reelSetId}`;
        for (let i = 0; i < 5; i++) {
            const reelKey = `reel${i + 1}`;
            const symbols = reels[reelKey].slice(0,3).map((s:string) => `SYM${s}`).join('%2C');
            str += `&rs.i0.r.i${i}.syms=${symbols}`;
            str += `&rs.i0.r.i${i}.pos=${reels.rp[i]}`; // Reel position
        }
        return str;
    }

    private formatReelsAndWinsForNetEnt(reels: any, winResult: any, stickyWilds: any[]): {[key:string]: string} {
        const response: {[key:string]:string} = {};
        // Format reels
        for (let r = 0; r < 5; r++) {
            const reelKey = `reel${r + 1}`;
            const symbols = (reels[reelKey] || ['0','0','0']).slice(0,3).map((s:string) => `SYM${s}`).join('%2C');
            response[`rs.i0.r.i${r}.syms`] = symbols;
            response[`rs.i0.r.i${r}.pos`] = String(reels.rp[r] || 0);

            // Add overlay for sticky wilds
            stickyWilds.forEach((sw, idx) => {
                if (sw.reel === (r + 1)) {
                    response[`rs.i0.r.i${r}.overlay.i${idx}.row`] = String(sw.row);
                    response[`rs.i0.r.i${r}.overlay.i${idx}.with`] = `SYM${sw.symbol}`; // e.g. SYM1
                    // response[`rs.i0.r.i${r}.overlay.i${idx}.pos`] = String(reels.rp[r] + sw.row); // Position might be complex
                }
            });
        }

        // Format wins
        winResult.lineWins.forEach((win: any, idx: number) => {
            response[`ws.i${idx}.reelset`] = "basic"; // Or specific freespinlevel if in FS
            response[`ws.i${idx}.types.i0.coins`] = win.amount;
            response[`ws.i${idx}.types.i0.cents`] = String(parseFloat(win.amount) * this.slotSettings!.CurrentDenom * 100);
            response[`ws.i${idx}.types.i0.wintype`] = "coins";
            response[`ws.i${idx}.betline`] = win.selectedLine; // 0-indexed
            response[`ws.i${idx}.sym`] = win.wonSymbols.length > 0 ? `SYM${this.getSymbol(reels, parseInt(win.wonSymbols[0][0])+1, parseInt(win.wonSymbols[0][1]))}` : ""; // Symbol that formed win
            response[`ws.i${idx}.direction`] = "left_to_right";
            win.wonSymbols.forEach((coord: string[], posIdx: number) => {
                response[`ws.i${idx}.pos.i${posIdx}`] = `${coord[0]}%2C${coord[1]}`; // reel,row
            });
        });
        return response;
    }


    private calculateWins(reels: any, betLine: number, lines: number, settings: SlotSettings, slotEvent: string):
        { totalWin: number, lineWins: any[], scattersCount: number } {
        // (Using the implementation from previous step, ensure Server.AfricanKingPaylines is Server.CreaturePaylines or similar)
        // For now, assuming a generic payline structure is defined in this class or imported.
        // Using a simplified version here, actual paylines for Creature are needed.
        const CreaturePaylines: number[][] = [
            [1,1,1,1,1], [0,0,0,0,0], [2,2,2,2,2], [0,1,2,1,0], [2,1,0,1,2],
            [1,0,1,2,1], [1,2,1,0,1], [0,0,1,2,2], [2,2,1,0,0], [0,1,0,1,0],
            [2,1,2,1,2], [1,0,0,0,1], [0,2,2,2,0], [0,1,1,1,0], [2,1,1,1,2],
            [1,1,0,1,1], [1,1,2,1,1], [0,2,0,2,0], [2,0,2,0,2], [2,0,1,0,2]
        ];

        let totalWinCoins = 0;
        const lineWinsOutput: any[] = [];
        let currentScatters = 0;
        const wildSymbols = ['0', '1', '2']; // Creature, Spreading Wild 1, Spreading Wild 2
        const scatterSymbols = ['11', '12', '13']; // Free Spin symbols

        const activePaylines = CreaturePaylines.slice(0, lines);

        for (let lineIdx = 0; lineIdx < activePaylines.length; lineIdx++) {
            const currentPayLineDefinition = activePaylines[lineIdx];
            let bestLineWinForThisPayline = 0;
            let bestWonSymbolCoordinates: string[][] = [];

            for (const symId in settings.Paytable) {
                if (scatterSymbols.map(s => `SYM_${s}`).includes(symId)) continue;
                if (wildSymbols.map(s => `SYM_${s}`).includes(symId) && symId !== 'SYM_0') continue; // Only use SYM_0 (main wild) for initiating line check for wilds.

                const paytableSymbolCode = symId.split('_')[1];
                let currentMatchCount = 0;
                const currentWinCoordinates: string[][] = [];

                for (let reelIdx = 0; reelIdx < currentPayLineDefinition.length; reelIdx++) {
                    const rowIdx = currentPayLineDefinition[reelIdx];
                    const symbolOnScreen = this.getSymbol(reels, reelIdx + 1, rowIdx);

                    if (symbolOnScreen === paytableSymbolCode || (wildSymbols.includes(symbolOnScreen!) && !scatterSymbols.includes(paytableSymbolCode)) ) {
                        currentMatchCount++;
                        currentWinCoordinates.push([String(reelIdx), String(rowIdx)]);
                    } else {
                        break;
                    }
                }

                if (currentMatchCount > 0) {
                    const paytableEntry = settings.Paytable[symId];
                    let payoutMultiplier = 0;
                    if (paytableEntry && paytableEntry[currentMatchCount] !== undefined && paytableEntry[currentMatchCount] > 0) {
                         payoutMultiplier = paytableEntry[currentMatchCount];
                    }

                    const currentSymbolLineWinCoins = payoutMultiplier * betLine;

                    if (currentSymbolLineWinCoins > bestLineWinForThisPayline) {
                        bestLineWinForThisPayline = currentSymbolLineWinCoins;
                        bestWonSymbolCoordinates = currentWinCoordinates;
                    }
                }
            }

            if (bestLineWinForThisPayline > 0) {
                totalWinCoins += bestLineWinForThisPayline;
                lineWinsOutput.push({
                    selectedLine: String(lineIdx),
                    amount: String(bestLineWinForThisPayline), // Amount in coins
                    wonSymbols: bestWonSymbolCoordinates
                });
            }
        }

        // Scatter (Free Spin symbol) count
        const scatterPositions: string[][] = [];
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 3; c++) {
                const sym = this.getSymbol(reels, r + 1, c);
                if (scatterSymbols.includes(sym!)) {
                    currentScatters++;
                    // scatterPositions.push([String(r), String(c)]); // Not directly used for win amount, but for trigger
                }
            }
        }
        // Scatter symbols in Creature don't award direct coin wins, they trigger Free Spins.
        // The trigger logic is handled in handleSpinAction.

        return { totalWin: settings.FormatFloat(totalWinCoins), lineWins: lineWinsOutput, scattersCount: currentScatters };
    }
     private getSymbol(reels: any, reelNum: number, rowNum: number): string | undefined {
        const reelKey = `reel${reelNum}`;
        if (reels && reels[reelKey] && typeof reels[reelKey][rowNum] !== 'undefined') {
            return String(reels[reelKey][rowNum]);
        }
        return undefined;
    }
}
