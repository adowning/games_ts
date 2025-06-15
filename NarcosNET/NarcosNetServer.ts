// } catch (e: any) {
//     console.error("Error in NarcosNET Server:", e);
//     // Use optional chaining and provide a default value
//     const slotEvent = postData?.slotEvent || "unknown_event";
//     return JSON.stringify({ 
//         responseEvent: "error", 
//         responseType: slotEvent, 
//         serverResponse: `Internal Server Error: ${e.message}` 
//     });
// }
import { PrismaClient, User, Game, Shop } from '@prisma/client';
import { SlotSettings } from './NarcosSlotSettings'; // Adjust path as needed

const prisma = new PrismaClient(); // Shared Prisma client

interface NarcosServerResponse {
    freeState?: string;
    slotLines?: number;
    slotBet?: number;
    totalFreeGames?: number;
    currentFreeGames?: number;
    Balance?: number;
    afterBalance?: number;
    bonusWin?: number;
    totalWin?: number;
    winLines?: any[]; // Define more specific type if possible
    Jackpots?: any; // Define more specific type if possible
    reelsSymbols?: any; // Define more specific type if possible
    ReelsType?: string;
    [key: string]: any; // For other dynamic properties
}

interface NarcosSpinResponse {
    responseEvent: string;
    responseType: string;
    serverResponse: NarcosServerResponse;
}


export class Server {

    private async getAuthenticatedUser(userId: string | null): Promise<User | null> {
        if (!userId) return null;
        return prisma.user.findUnique({ where: { id: userId } });
    }

    private async getGameSettings(gameName: string, shopId: string): Promise<Game | null> {
        return prisma.game.findFirst({ where: { name: gameName, shop_id: shopId } });
    }

    private async getShopSettings(shopId: string): Promise<Shop | null> {
        return prisma.shop.findUnique({ where: { id: shopId } });
    }


    // Mimicking the PHP global $_GET, in a real app this would come from Express.Request.query or similar
    private parseQueryString(queryString: string): Record<string, any> {
        const params: Record<string, any> = {};
        if (queryString) {
            const pairs = queryString.split('&');
            for (const pair of pairs) {
                const parts = pair.split('=');
                params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
            }
        }
        return params;
    }

    private handleFreeSpin(slotSettings: SlotSettings, postData: any): { response: string, win: number } {
        // Initialize free spin state if not already set
        let currentFreeGame = slotSettings.GetGameData(`${slotSettings.slotId}CurrentFreeGame`) || 0;
        const totalFreeGames = slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`) || 0;
        let bonusWin = slotSettings.GetGameData(`${slotSettings.slotId}BonusWin`) || 0;

        // Increment free spin counter
        currentFreeGame++;
        slotSettings.SetGameData(`${slotSettings.slotId}CurrentFreeGame`, currentFreeGame);

        // Check if this is the last free spin
        const isLastFreeSpin = currentFreeGame >= totalFreeGames;

        // Generate reels with potential enhanced features
        const reels = this.generateFreeSpinReels(slotSettings);

        // Calculate wins with free spin multiplier
        const baseWin = this.calculateWin(reels, slotSettings);
        const totalWin = baseWin * slotSettings.slotFreeMpl;

        // Update bonus win
        if (totalWin > 0) {
            bonusWin += totalWin;
            slotSettings.SetGameData(`${slotSettings.slotId}BonusWin`, bonusWin);
            slotSettings.SetBalance(totalWin, 'freespin_win');
        }

        // Check for retrigger (e.g., 3+ scatter symbols)
        const scatterCount = this.countScatters(reels);
        let retriggeredSpins = 0;

        if (scatterCount >= 3) {
            retriggeredSpins = scatterCount * 5; // Example: 5 spins per scatter
            const newTotal = totalFreeGames + retriggeredSpins;
            slotSettings.SetGameData(`${slotSettings.slotId}FreeGames`, newTotal);
        }

        // Prepare response
        const response = this.buildFreeSpinResponse({
            reels,
            currentFreeGame,
            totalFreeGames,
            totalWin,
            bonusWin,
            isLastFreeSpin,
            retriggeredSpins
        }, slotSettings, postData);

        return {
            response,
            win: totalWin
        };
    }

    // Helper methods
    private generateFreeSpinReels(slotSettings: SlotSettings): number[][] {
        // Enhanced reel generation for free spins
        const reels: number[][] = [];
        for (let i = 0; i < 5; i++) {
            reels[i] = [];
            for (let j = 0; j < 3; j++) {
                // Higher chance for wilds and high-paying symbols
                if (Math.random() < 0.1) {
                    reels[i][j] = 1; // Wild
                } else {
                    reels[i][j] = Math.floor(Math.random() * 8) + 2; // Higher-paying symbols
                }
            }
        }
        return reels;
    }

    private calculateWin(reels: number[][], slotSettings: SlotSettings): number {
        // Enhanced win calculation for free spins
        let totalWin = 0;

        // Check paylines (simplified)
        // Middle line
        const middleLine = [reels[0][1], reels[1][1], reels[2][1], reels[3][1], reels[4][1]];
        totalWin += this.checkPayline(middleLine, slotSettings);

        // Top and bottom lines
        const topLine = [reels[0][0], reels[1][0], reels[2][0], reels[3][0], reels[4][0]];
        const bottomLine = [reels[0][2], reels[1][2], reels[2][2], reels[3][2], reels[4][2]];
        totalWin += this.checkPayline(topLine, slotSettings) + this.checkPayline(bottomLine, slotSettings);

        return totalWin;
    }

    private checkPayline(symbols: number[], slotSettings: SlotSettings): number {
        // Check for winning combinations on a payline
        // This is a simplified version - actual implementation would use paytables
        const symbol = symbols[0];
        let count = 1;

        for (let i = 1; i < symbols.length; i++) {
            if (symbols[i] === symbol || symbols[i] === 1) { // 1 is wild
                count++;
            } else {
                break;
            }
        }

        // Payout based on symbol and count
        if (count >= 3) {
            const payouts = [0, 0, 0, 5, 10, 25]; // Example payouts
            return payouts[count] || 0;
        }
        return 0;
    }

    private countScatters(reels: number[][]): number {
        // Count scatter symbols (assuming 0 is scatter)
        let count = 0;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                if (reels[i][j] === 0) count++;
            }
        }
        return count;
    }

    private buildFreeSpinResponse(params: {
        reels: number[][],
        currentFreeGame: number,
        totalFreeGames: number,
        totalWin: number,
        bonusWin: number,
        isLastFreeSpin: boolean,
        retriggeredSpins: number
    }, slotSettings: SlotSettings, postData: any): string {
        const { reels, currentFreeGame, totalFreeGames, totalWin, bonusWin, isLastFreeSpin, retriggeredSpins } = params;

        // Build reels string
        let reelsStr = '';
        for (let i = 0; i < 5; i++) {
            reelsStr += `&rs.i0.r.i${i}.syms=SYM${reels[i][0]}%2CSYM${reels[i][1]}%2CSYM${reels[i][2]}`;
            reelsStr += `&rs.i0.r.i${i}.pos=0`;
        }

        // Build response
        const balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);
        const totalWinCents = totalWin * slotSettings.CurrentDenom * 100;

        let response =
            `clientaction=freespin` +
            `&gamestate.current=freespin` +
            `&freespins.left=${totalFreeGames - currentFreeGame}` +
            `&freespins.total=${totalFreeGames}` +
            `&freespins.current=${currentFreeGame}` +
            `&freespins.win.coins=${totalWin}` +
            `&freespins.win.cents=${totalWinCents}` +
            `&freespins.totalwin.coins=${bonusWin}` +
            `&freespins.totalwin.cents=${bonusWin * slotSettings.CurrentDenom * 100}` +
            `&credit=${balanceInCents}` +
            `&nextaction=${isLastFreeSpin ? 'endfreespin' : 'freespin'}`;

        if (retriggeredSpins > 0) {
            response += `&freespins.retriggered=${retriggeredSpins}`;
        }

        return response + reelsStr;
    }
    public async get(request: { userId: string | null, gameName: string, queryString: string }, gameEntity: any): Promise<string> {
        // In a real Express app, 'request' would be Express.Request, 'gameEntity' might not be needed if fetched via gameName
        // For now, adapting to the PHP structure.

        return prisma.$transaction(async (tx) => {
            // Use 'tx' for all Prisma operations within this transaction
            // For now, BaseSlotSettings handles its own DB writes, which might need refactoring for true atomicity

            try {
                const user = await this.getAuthenticatedUser(request.userId);
                if (!user) {
                    return JSON.stringify({ responseEvent: "error", responseType: "", serverResponse: "invalid login" });
                }

                const game = await this.getGameSettings(request.gameName, user.shop_id);
                if (!game) {
                    return JSON.stringify({ responseEvent: "error", responseType: "", serverResponse: "game not found" });
                }

                const shop = await this.getShopSettings(user.shop_id);
                if (!shop) {
                    return JSON.stringify({ responseEvent: "error", responseType: "", serverResponse: "shop not found" });
                }

                const slotSettings = new SlotSettings(request.gameName, user.id);
                await slotSettings.init(user, game, shop); // Initialize with fetched entities

                if (!slotSettings.is_active()) {
                    return JSON.stringify({ responseEvent: "error", responseType: "", serverResponse: "Game is disabled" });
                }

                const postData = this.parseQueryString(request.queryString);
                let balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

                let resultTmp: string[] = []; // Will store the string response
                postData.slotEvent = postData.slotEvent || 'bet'; // Default if not set

                if (postData.action === 'freespin') {
                    postData.slotEvent = 'freespin';
                    postData.action = 'spin'; // Narcos specific: freespin action is still a 'spin'
                }
                if (postData.action === 'respin') { // Walking Wild Respin
                    postData.slotEvent = 'respin';
                    // action remains 'respin' or might be treated as 'spin' internally by spin logic
                }
                if (postData.action === 'init' || postData.action === 'reloadbalance') {
                    postData.action = 'init';
                    postData.slotEvent = 'init';
                }
                if (postData.action === 'paytable') {
                    postData.slotEvent = 'paytable';
                }
                if (postData.action === 'initfreespin') { // Triggered after Locked Up feature
                    postData.slotEvent = 'initfreespin';
                }
                if (postData.action === 'initbonus') { // Triggered for Locked Up selection
                    postData.slotEvent = 'initbonus';
                }
                if (postData.action === 'bonusaction') { // Player picks in Locked Up
                    postData.slotEvent = 'bonusaction';
                }
                if (postData.action === 'endbonus') { // End of Locked Up feature
                    postData.slotEvent = 'endbonus';
                }


                if (postData.bet_denomination !== undefined && parseFloat(postData.bet_denomination) >= 1) {
                    const denom = parseFloat(postData.bet_denomination) / 100;
                    slotSettings.CurrentDenom = denom;
                    slotSettings.CurrentDenomination = denom;
                    slotSettings.SetGameData(`${slotSettings.slotId}GameDenom`, denom);
                } else if (slotSettings.GetGameData(`${slotSettings.slotId}GameDenom`)) {
                    const denom = slotSettings.GetGameData(`${slotSettings.slotId}GameDenom`);
                    slotSettings.CurrentDenom = denom;
                    slotSettings.CurrentDenomination = denom;
                }
                balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);

                if (postData.slotEvent === 'bet') {
                    if (postData.bet_betlevel === undefined) {
                        return JSON.stringify({ responseEvent: "error", responseType: "bet", serverResponse: "invalid bet request" });
                    }
                    const lines = 20; // Narcos has 243 ways, but bet might be per 20 "lines" for cost
                    const betLevel = parseInt(postData.bet_betlevel, 10);
                    if (lines <= 0 || betLevel <= 0) {
                        return JSON.stringify({ responseEvent: "error", responseType: postData.slotEvent, serverResponse: "invalid bet state" });
                    }
                    if (slotSettings.GetBalance() < (lines * betLevel)) { // Cost is betLevel * 20 coins
                        return JSON.stringify({ responseEvent: "error", responseType: postData.slotEvent, serverResponse: "invalid balance" });
                    }
                }

                if (slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`) > 0 &&
                    slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`) <= slotSettings.GetGameData(`${slotSettings.slotId}CurrentFreeGame`) &&
                    postData.slotEvent === 'freespin') {
                    return JSON.stringify({ responseEvent: "error", responseType: postData.slotEvent, serverResponse: "invalid bonus state - no free games left" });
                }

                const action: string = postData.action as string;

                switch (action) {
                    case 'init':
                        // ... (translation of init case from PHP)
                        // This involves GetHistory, setting initial game data, and constructing the init response string.
                        // For brevity, I'll provide a simplified structure.
                        // The PHP code has very long hardcoded strings for init.
                        // These would ideally be generated dynamically or loaded from templates.

                        slotSettings.SetGameData(`${slotSettings.slotId}BonusWin`, 0);
                        slotSettings.SetGameData(`${slotSettings.slotId}FreeGames`, 0);
                        slotSettings.SetGameData(`${slotSettings.slotId}CurrentFreeGame`, 0);
                        slotSettings.SetGameData(`${slotSettings.slotId}TotalWin`, 0);
                        slotSettings.SetGameData(`${slotSettings.slotId}FreeBalance`, 0);
                        slotSettings.SetGameData(`${slotSettings.slotId}WalkingWild`, []);
                        slotSettings.SetGameData(`${slotSettings.slotId}LockedUpActive`, false);
                        slotSettings.SetGameData(`${slotSettings.slotId}LockedUpSpinCount`, 0);
                        slotSettings.SetGameData(`${slotSettings.slotId}LockedUpStickyWilds`, []);
                        slotSettings.SetGameData(`${slotSettings.slotId}LockedUpWins`, []);

                        let lastEvent = await slotSettings.GetHistory();
                        let curReelsStr = '';
                        // Logic to construct curReelsStr based on lastEvent or random if no history
                        // This is highly game-specific and involves parsing lastEvent.
                        // For now, a placeholder:
                        curReelsStr = `&rs.i0.r.i0.syms=SYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}`;
                        curReelsStr += `&rs.i0.r.i1.syms=SYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}`;
                        curReelsStr += `&rs.i0.r.i2.syms=SYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}`;
                        curReelsStr += `&rs.i0.r.i3.syms=SYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}`;
                        curReelsStr += `&rs.i0.r.i4.syms=SYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}%2CSYM${Math.floor(Math.random() * 8) + 3}`;
                        // ... and positions

                        const denominationsStr = slotSettings.Denominations.map(d => d * 100).join('%2C');
                        const betLevelsStr = slotSettings.Bet.join('%2C');

                        // Simplified init string, the original is extremely long and game-specific
                        resultTmp.push(
                            `game.win.cents=0&clientaction=init&gamestate.current=basic&rs.i0.id=basic&betlevel.all=${betLevelsStr}&denomination.all=${denominationsStr}&denomination.standard=${slotSettings.CurrentDenomination * 100}&bet.betlevel=1&credit=${balanceInCents}&game.win.amount=0&totalwin.cents=0&totalwin.coins=0&wavecount=1&multiplier=1&historybutton=false&nextaction=spin&staticsharedurl=https%3A%2F%2Fstatic-shared.casinomodule.com%2Fgameclient_html%2Fdevicedetection%2Fcurrent&gamesoundurl=https%3A%2F%2Fstatic.casinomodule.com%2F&casinoID=netent&playforfun=false&playercurrencyiso=${slotSettings.shop!.currency}&jackpotcurrencyiso=${slotSettings.shop!.currency}${curReelsStr}`
                        );
                        break;

                    case 'spin':

                        if (postData.slotEvent === 'freespin') {
                            const freeSpinResult = this.handleFreeSpin(slotSettings, postData);
                            resultTmp.push(freeSpinResult.response);
                        } else {
                            // Initialize variables
                            const spinLines = 20; // Renamed to avoid conflict
                            slotSettings.CurrentDenom = parseFloat(postData.bet_denomination);
                            slotSettings.CurrentDenomination = parseFloat(postData.bet_denomination);

                            let betline: number;
                            let allbet: number;
                            let bonusMpl = 1;
                            let isFreeSpin = postData.slotEvent === 'freespin';

                            if (!isFreeSpin) {
                                // Regular spin
                                betline = parseInt(postData.bet_betlevel, 10);
                                allbet = betline * spinLines;

                                // Update balance and bank
                                slotSettings.SetBalance(-1 * allbet, postData.slotEvent);
                                const bankSum = allbet / 100 * (slotSettings.shop?.percent || 0);  // Using optional chaining and providing a default value

                                // const bankSum = allbet / 100 * slotSettings.GetPercent();
                                slotSettings.SetBank(postData.slotEvent || 'bet', bankSum, postData.slotEvent);

                                // Update game state
                                slotSettings.SetGameData(`${slotSettings.slotId}BonusWin`, 0);
                                slotSettings.SetGameData(`${slotSettings.slotId}FreeGames`, 0);
                                slotSettings.SetGameData(`${slotSettings.slotId}CurrentFreeGame`, 0);
                                slotSettings.SetGameData(`${slotSettings.slotId}TotalWin`, 0);
                                slotSettings.SetGameData(`${slotSettings.slotId}Bet`, betline);
                                slotSettings.SetGameData(`${slotSettings.slotId}Denom`, postData.bet_denomination);
                                slotSettings.SetGameData(`${slotSettings.slotId}FreeBalance`,
                                    parseFloat(slotSettings.GetBalance().toFixed(2)) * 100);
                            } else {
                                // Free spin
                                postData.bet_denomination = slotSettings.GetGameData(`${slotSettings.slotId}Denom`);
                                slotSettings.CurrentDenom = parseFloat(postData.bet_denomination);
                                slotSettings.CurrentDenomination = parseFloat(postData.bet_denomination);
                                betline = slotSettings.GetGameData(`${slotSettings.slotId}Bet`);
                                allbet = betline * spinLines;
                                slotSettings.SetGameData(`${slotSettings.slotId}CurrentFreeGame`,
                                    slotSettings.GetGameData(`${slotSettings.slotId}CurrentFreeGame`) + 1);
                                bonusMpl = slotSettings.slotFreeMpl;
                            }

                            // Generate random reels (simplified - actual implementation would use proper RNG)
                            const spinReels: number[][] = [];
                            for (let i = 0; i < 5; i++) {
                                spinReels[i] = [];
                                for (let j = 0; j < 3; j++) {
                                    spinReels[i][j] = Math.floor(Math.random() * 11) + 1; // Symbols 1-11
                                }
                            }

                            // Calculate wins (simplified - actual implementation would use paytable)
                            let spinTotalWin = 0;
                            const spinWinLines: any[] = [];

                            // Check for wins on each payline (simplified)
                            // In a real implementation, this would check against actual paylines and paytable
                            // For now, we'll just set a small random win for demonstration
                            spinTotalWin = Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : 0;

                            // Update balance if there's a win
                            if (spinTotalWin > 0) {
                                const winAmount = spinTotalWin * bonusMpl;
                                slotSettings.SetBalance(winAmount, 'win');
                                if (isFreeSpin) {
                                    const currentBonusWin = slotSettings.GetGameData(`${slotSettings.slotId}BonusWin`) || 0;
                                    slotSettings.SetGameData(`${slotSettings.slotId}BonusWin`, currentBonusWin + winAmount);
                                }

                                // Add win line info (simplified)
                                spinWinLines.push({
                                    line: 1,
                                    symbol: spinReels[0][1], // Middle row
                                    count: 3,
                                    win: spinTotalWin
                                });
                            }

                            // Check for free spins (simplified - 10% chance)
                            let freeSpinsAwarded = 0;
                            if (Math.random() > 0.9) {
                                freeSpinsAwarded = 10; // Award 10 free spins

                                // Update free spins count
                                const currentFreeGames = slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`) || 0;
                                slotSettings.SetGameData(`${slotSettings.slotId}FreeGames`, currentFreeGames + freeSpinsAwarded);
                            }

                            // Build response
                            balanceInCents = Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100);
                            const totalWinCents = spinTotalWin * slotSettings.CurrentDenom * 100;

                            // Construct reels string for response
                            let reelsStr = '';
                            for (let i = 0; i < 5; i++) {
                                reelsStr += `&rs.i0.r.i${i}.syms=SYM${spinReels[i][0]}%2CSYM${spinReels[i][1]}%2CSYM${spinReels[i][2]}`;
                                reelsStr += `&rs.i0.r.i${i}.pos=0`; // Default position
                            }

                            // Construct response
                            resultTmp.push(
                                `game.win.cents=${totalWinCents}` +
                                `&clientaction=spin` +
                                `&gamestate.current=basic` +
                                `&bet.betlevel=${betline}` +
                                `&credit=${balanceInCents}` +
                                `&game.win.amount=${(spinTotalWin * slotSettings.CurrentDenom).toFixed(2)}` +
                                `&totalwin.cents=${totalWinCents}` +
                                `&totalwin.coins=${spinTotalWin}` +
                                `&wavecount=1` +
                                `&multiplier=${bonusMpl}` +
                                `&historybutton=false` +
                                `&nextaction=spin` +
                                `&staticsharedurl=https%3A%2F%2Fstatic-shared.casinomodule.com%2Fgameclient_html%2Fdevicedetection%2Fcurrent` +
                                `&gamesoundurl=https%3A%2F%2Fstatic.casinomodule.com%2F` +
                                `&casinoID=netent` +
                                `&playforfun=false` +
                                `&playercurrencyiso=${slotSettings.shop!.currency}` +
                                `&jackpotcurrencyiso=${slotSettings.shop!.currency}` +
                                reelsStr
                            );

                            // Save game state
                            const response: NarcosSpinResponse = {
                                responseEvent: "spin",
                                responseType: "spin",
                                serverResponse: {
                                    Balance: balanceInCents / 100,
                                    afterBalance: balanceInCents / 100,
                                    totalWin: spinTotalWin,
                                    bonusWin: isFreeSpin ? slotSettings.GetGameData(`${slotSettings.slotId}BonusWin`) : 0,
                                    freeState: isFreeSpin ? 'active' : '',
                                    totalFreeGames: slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`),
                                    currentFreeGames: slotSettings.GetGameData(`${slotSettings.slotId}CurrentFreeGame`),
                                    winLines: spinWinLines,
                                    reelsSymbols: spinReels,
                                    slotLines: spinLines,
                                    slotBet: betline
                                }
                            };

                            // Save the response for potential history/logging
                            slotSettings.SetGameData(`${slotSettings.slotId}LastResponse`, JSON.stringify(response));
                        }
                        break;

                    case 'paytable':
                        // Construct paytable response string (very long in PHP, simplified here)
                        resultTmp.push(`clientaction=paytable&pt.i0.id=basic&pt.i0.name=Paytable&pt.i0.betlines=243&pt.i0.wildsym=SYM1&pt.i0.scattersym=SYM0&pt.i0.bonussym=SYM2&pt.i0.paytable=${JSON.stringify(slotSettings.Paytable)}`); // Simplified
                        break;

                    case 'initfreespin': // After Locked Up feature triggers freespins
                        // This case needs to set up the state for actual freespins (Walking Wilds)
                        // The PHP code has a very long hardcoded string.
                        // It should reflect the number of freespins won from Locked Up.
                        const fsWon = slotSettings.GetGameData(`${slotSettings.slotId}FreeGamesFromBonus`) || 10; // Default if not set
                        slotSettings.SetGameData(`${slotSettings.slotId}FreeGames`, fsWon);
                        slotSettings.SetGameData(`${slotSettings.slotId}CurrentFreeGame`, 0);
                        slotSettings.SetGameData(`${slotSettings.slotId}BonusWin`, 0); // Reset bonus win for FS
                        slotSettings.SetGameData(`${slotSettings.slotId}WalkingWild`, []); // Clear walking wilds

                        resultTmp.push(
                            `clientaction=initfreespin&gamestate.current=freespin&gamestate.stack=basic%2Cfreespin&freespins.initial=${fsWon}&freespins.total=${fsWon}&freespins.left=${fsWon}&freespins.betlevel=${slotSettings.GetGameData(`${slotSettings.slotId}Bet`)}&freespins.denomination=${slotSettings.CurrentDenomination * 100}&freespins.wavecount=1&freespins.multiplier=1&freespins.win.coins=0&freespins.win.cents=0&freespins.totalwin.coins=0&freespins.totalwin.cents=0&nextaction=freespin&credit=${balanceInCents}&rs.i0.id=freespin&rs.i1.id=basic&previous.rs.i0=basic&game.win.cents=0&game.win.coins=0&totalwin.cents=0&totalwin.coins=0&game.win.amount=0`
                            // Add initial reel display for freespins if needed
                        );
                        break;

                    case 'initbonus': // Start of Locked Up feature (selection phase)
                        // This is where the player picks from Pablo symbols
                        // The PHP code has a very long hardcoded string.
                        // It should show the grid of Pablo symbols for picking.
                        // For now, a simplified response.
                        const lockedUpReels = slotSettings.GetGameData(`${slotSettings.slotId}LockedUpReels`);
                        let pabloPositionsStr = '';
                        let pabloCount = 0;
                        if (lockedUpReels) {
                            for (let r = 0; r < 5; r++) {
                                for (let c = 0; c < 3; c++) { // Assuming 3 rows for simplicity
                                    if (lockedUpReels[`reel${r + 1}`] && lockedUpReels[`reel${r + 1}`][c] === '2') {
                                        pabloPositionsStr += `&bonus.sym.i${pabloCount}.pos=${r}%2C${c}`;
                                        pabloCount++;
                                    }
                                }
                            }
                        }
                        resultTmp.push(
                            `clientaction=initbonus&gamestate.current=bonus&gamestate.stack=basic%2Cbonus&gamestate.bonusid=lockedup&bonus.rollsleft=3&bonus.multiplier=1&bonus.win.coins=0&bonus.win.cents=0&totalbonuswin.coins=0&totalbonuswin.cents=0&nextaction=bonusaction&nextactiontype=spin&credit=${balanceInCents}${pabloPositionsStr}`
                            // Add reel display for bonus if needed
                        );
                        break;

                    case 'bonusaction': // Player action in Locked Up (spin)
                        // This handles a spin within the Locked Up feature.
                        // The PHP code has complex logic for this.
                        // For now, a simplified response.
                        // This needs to simulate the Locked Up spins, symbol collection, and potential upgrades.
                        // This is highly game-specific and would require careful porting of the PHP logic.
                        // For now, let's assume it leads to an endbonus or another bonusaction.
                        let lockedUpSpinCount = slotSettings.GetGameData(`${slotSettings.slotId}LockedUpSpinCount`) || 0;
                        lockedUpSpinCount++;
                        slotSettings.SetGameData(`${slotSettings.slotId}LockedUpSpinCount`, lockedUpSpinCount);
                        let lockedUpTotalWin = slotSettings.GetGameData(`${slotSettings.slotId}LockedUpTotalWin`) || 0;
                        let currentSpinLockedUpWin = Math.floor(Math.random() * 5 + 1) * (slotSettings.GetGameData(`${slotSettings.slotId}Bet`) || 1); // Random win for this spin
                        lockedUpTotalWin += currentSpinLockedUpWin;
                        slotSettings.SetGameData(`${slotSettings.slotId}LockedUpTotalWin`, lockedUpTotalWin);

                        let bonusGameOver = false;
                        if (lockedUpSpinCount >= (slotSettings.GetGameData(`${slotSettings.slotId}LockedUpInitialSpins`) || 3)) { // Assuming 3 initial spins
                            bonusGameOver = true;
                        }

                        // Simplified response, needs actual reel generation and win calculation for Locked Up
                        resultTmp.push(
                            `clientaction=bonusaction&gamestate.current=bonus&gamestate.stack=basic%2Cbonus&gamestate.bonusid=lockedup&bonus.rollsleft=${(slotSettings.GetGameData(`${slotSettings.slotId}LockedUpInitialSpins`) || 3) - lockedUpSpinCount}&bonus.multiplier=1&bonus.win.coins=${currentSpinLockedUpWin}&bonus.win.cents=${currentSpinLockedUpWin * slotSettings.CurrentDenom * 100}&totalbonuswin.coins=${lockedUpTotalWin}&totalbonuswin.cents=${lockedUpTotalWin * slotSettings.CurrentDenom * 100}&nextaction=${bonusGameOver ? 'endbonus' : 'bonusaction'}&nextactiontype=${bonusGameOver ? 'endbonus' : 'spin'}&credit=${balanceInCents}&game.win.cents=${lockedUpTotalWin * slotSettings.CurrentDenom * 100}&game.win.coins=${lockedUpTotalWin}&totalwin.cents=${lockedUpTotalWin * slotSettings.CurrentDenom * 100}&totalwin.coins=${lockedUpTotalWin}&game.win.amount=${lockedUpTotalWin * slotSettings.CurrentDenom}`
                            // Add reel display for bonus spin
                        );
                        if (bonusGameOver) {
                            slotSettings.SetGameData(`${slotSettings.slotId}FreeGamesFromBonus`, 10); // Example: 10 free spins after Locked Up
                            slotSettings.SetGameData(`${slotSettings.slotId}BonusWin`, lockedUpTotalWin); // Store final bonus win
                            await slotSettings.SetBalance(lockedUpTotalWin, 'bonus');
                        }
                        break;

                    case 'endbonus': // End of Locked Up feature
                        let finalLockedUpWin = slotSettings.GetGameData(`${slotSettings.slotId}LockedUpTotalWin`) || 0;
                        slotSettings.SetGameData(`${slotSettings.slotId}TotalWin`, finalLockedUpWin); // Set total win from bonus
                        slotSettings.SetGameData(`${slotSettings.slotId}LockedUpActive`, false);

                        resultTmp.push(
                            `clientaction=endbonus&gamestate.current=basic&gamestate.stack=basic&nextaction=initfreespin&nextactiontype=initfreespin&credit=${balanceInCents}&game.win.cents=${finalLockedUpWin * slotSettings.CurrentDenom * 100}&game.win.coins=${finalLockedUpWin}&totalwin.cents=${finalLockedUpWin * slotSettings.CurrentDenom * 100}&totalwin.coins=${finalLockedUpWin}&game.win.amount=${finalLockedUpWin * slotSettings.CurrentDenom}`
                        );
                        break;

                    case 'spin':
                    case 'respin': // Handles both regular spins and walking wild respins
                        // ... (Full translation of the complex 'spin' case from PHP)
                        // This includes:
                        // 1. Bet handling (done above)
                        // 2. Win type determination (done above)
                        // 3. Reel generation (GetReelStrips)
                        // 4. Walking Wild logic
                        // 5. Drive-By feature logic
                        // 6. Locked Up feature trigger logic
                        // 7. Win calculation (243 ways)
                        // 8. Scatter handling for Free Spins trigger
                        // 9. Constructing the response string

                        const lines = 20; // Used for bet calculation, actual wins are 243 ways
                        let betLevel = parseInt(postData.bet_betlevel || slotSettings.GetGameData(`${slotSettings.slotId}Bet`) || '1', 10);
                        let currentTotalBet = betLevel * lines;
                        let bonusMultiplier = 1;
                        let isRespinEvent = postData.slotEvent === 'respin';
                        let isFreeSpinEvent = postData.slotEvent === 'freespin';

                        if (isFreeSpinEvent) {
                            slotSettings.SetGameData(`${slotSettings.slotId}CurrentFreeGame`, slotSettings.GetGameData(`${slotSettings.slotId}CurrentFreeGame`) + 1);
                        } else if (!isRespinEvent) { // Regular bet
                            await slotSettings.SetBalance(-currentTotalBet, 'bet');
                            const bankSum = currentTotalBet / 100 * slotSettings.shop!.percent;
                            await slotSettings.SetBank(postData.slotEvent, bankSum, 'bet');
                            await slotSettings.UpdateJackpots(currentTotalBet);
                            slotSettings.SetGameData(`${slotSettings.slotId}WalkingWild`, []); // Clear walking wilds on a new bet
                            slotSettings.SetGameData(`${slotSettings.slotId}LockedUpActive`, false);
                        }

                        // Determine win type and spin limit
                        const [winType, spinWinLimit] = await slotSettings.GetSpinSettings(postData.slotEvent, currentTotalBet, lines);

                        let iteration = 0;
                        let totalWin = 0;
                        let winLines: any[] = [];
                        let reels: any;
                        let reelsBeforeFeatures: any;
                        let walkingWildsData = slotSettings.GetGameData(`${slotSettings.slotId}WalkingWild`) || [];
                        let walkingWildsStr = '';
                        let nextAction = 'spin';
                        let gameStateCurrent = 'basic';
                        let gameStateStack = 'basic';
                        let featureDriveByActive = false;
                        let featureDriveByStr = '';
                        let featureLockedUpActive = false;
                        let featureLockedUpStr = '';
                        let scattersCount = 0;
                        let scatterWinResponse = '';

                        for (iteration = 0; iteration <= 500; iteration++) { // Iteration limit
                            totalWin = 0;
                            winLines = [];
                            let currentReels = slotSettings.GetReelStrips(winType, postData.slotEvent);
                            reelsBeforeFeatures = JSON.parse(JSON.stringify(currentReels)); // Deep copy

                            // Apply Walking Wilds BEFORE other features for the current spin
                            if (walkingWildsData.length > 0) {
                                const wwResult = slotSettings.ProcessWalkingWilds(currentReels, walkingWildsData);
                                currentReels = wwResult.reels;
                                walkingWildsData = wwResult.newWalkingWilds; // These will be saved for the NEXT respin
                                walkingWildsStr = wwResult.walkingWildsStr;
                                if (walkingWildsData.length > 0) isRespinEvent = true; // Force respin if wilds are still walking
                            }

                            // Apply Drive-By Feature (randomly, not on respins/freespins unless specified)
                            if (!isRespinEvent && !isFreeSpinEvent && Math.random() < 0.05) { // Example 5% chance
                                const driveByResult = slotSettings.ApplyDriveByFeature(currentReels);
                                currentReels = driveByResult.reels;
                                featureDriveByStr = driveByResult.featureString;
                                featureDriveByActive = true;
                            }

                            // Calculate wins based on potentially modified reels
                            // Narcos uses 243 ways
                            // const winCalcResult = slotSettings.calculateWins(currentReels, betLevel, lines, bonusMultiplier, slotSettings.Paytable, slotSettings.SymbolGame, ['1'], '0'); // Wilds, Scatter
                            // Convert number[] to string[] for the rp property
                            const winCalcResult = slotSettings.calculateWins(
                                {
                                    ...reels,
                                    rp: reels.rp.map(String)
                                },
                                betLevel,
                                ['1'],  // wildSymbols (default is ['1', '14'])
                                '0'     // scatterSymbol (default is '0')
                            );

                            totalWin = winCalcResult.totalWin;
                            winLines = winCalcResult.winLines;

                            // Check for Locked Up Scatter (Pablo)
                            let lockedUpScatterCount = 0;
                            let lockedUpPositions: string[] = [];
                            for (let r = 1; r <= 5; r++) {
                                for (let p = 0; p < 3; p++) { // Assuming 3 rows for simplicity
                                    if (currentReels[`reel${r}`][p] === '2') { // SYM_2 is Pablo
                                        lockedUpScatterCount++;
                                        lockedUpPositions.push(`${r - 1}%2C${p}`);
                                    }
                                }
                            }

                            if (lockedUpScatterCount >= 3 && !isFreeSpinEvent && !isRespinEvent) { // Trigger Locked Up
                                featureLockedUpActive = true;
                                slotSettings.SetGameData(`${slotSettings.slotId}LockedUpActive`, true);
                                slotSettings.SetGameData(`${slotSettings.slotId}LockedUpInitialSpins`, 3); // Example
                                slotSettings.SetGameData(`${slotSettings.slotId}LockedUpSpinCount`, 0);
                                slotSettings.SetGameData(`${slotSettings.slotId}LockedUpTotalWin`, 0);
                                slotSettings.SetGameData(`${slotSettings.slotId}LockedUpReels`, currentReels); // Save reels that triggered it
                                slotSettings.SetGameData(`${slotSettings.slotId}LockedUpStickyWilds`, []);
                                slotSettings.SetGameData(`${slotSettings.slotId}LockedUpWins`, []);
                                featureLockedUpStr = `&gamestate.bonusid=lockedup&nextaction=initbonus&nextactiontype=initbonus&ws.i${winLines.length}.sym=SYM2&ws.i${winLines.length}.direction=none&ws.i${winLines.length}.types.i0.wintype=bonusgame&ws.i${winLines.length}.types.i0.bonusid=lockedup&ws.i${winLines.length}.pos=${lockedUpPositions.join('%7C')}`;
                                totalWin = 0; // Wins from base game might be voided or handled differently when bonus triggers
                                winLines = []; // Clear base game wins
                                break; // Exit win loop, go to bonus
                            }

                            // Check for regular Free Spins Scatter (Car)
                            scattersCount = 0;
                            let scatterPositions: string[] = [];
                            for (let r = 1; r <= 3; r++) { // Scatters only on reels 1, 3, 5
                                for (let p = 0; p < 3; p++) { // Assuming 3 rows
                                    if (currentReels[`reel${r}`][p] === '0') { // SYM_0 is Car
                                        scattersCount++;
                                        scatterPositions.push(`${r - 1}%2C${p}`);
                                    }
                                }
                            }
                            if (scattersCount >= 3 && !isFreeSpinEvent && !isRespinEvent && !featureLockedUpActive) {
                                slotSettings.SetGameData(`${slotSettings.slotId}FreeGames`, 10); // Narcos gives 10 FS
                                slotSettings.SetGameData(`${slotSettings.slotId}CurrentFreeGame`, 0);
                                slotSettings.SetGameData(`${slotSettings.slotId}BonusWin`, totalWin); // Accumulate current win into bonus win
                                scatterWinResponse = `&ws.i${winLines.length}.sym=SYM0&ws.i${winLines.length}.direction=none&ws.i${winLines.length}.types.i0.wintype=freespins&ws.i${winLines.length}.types.i0.freespins=10&ws.i${winLines.length}.pos=${scatterPositions.join('%7C')}`;
                                break; // Go to freespins
                            }


                            // Check win conditions
                            if (totalWin <= spinWinLimit || iteration > 500) { // iteration limit to prevent infinite loops
                                break;
                            }
                        }
                        reels = reelsBeforeFeatures; // Use reels before random features for display unless feature changes them

                        if (totalWin > 0) {
                            await slotSettings.SetBalance(totalWin, postData.slotEvent);
                            await slotSettings.SetBank(postData.slotEvent, -totalWin, postData.slotEvent);
                        }

                        slotSettings.SetGameData(`${slotSettings.slotId}TotalWin`, slotSettings.GetGameData(`${slotSettings.slotId}TotalWin`) + totalWin);
                        slotSettings.SetGameData(`${slotSettings.slotId}WalkingWild`, walkingWildsData);
                        // const currentReelsStr = slotSettings.reelsToNetEntString(reels);
                        // Get the reel positions - assuming they are stored in the slotSettings or can be derived
                        const reelPositions = slotSettings.GetGameData(`${slotSettings.slotId}ReelPositions`) || [0, 0, 0, 0, 0]; // Default to all 0s if not set
                        const currentReelsStr = slotSettings.reelsToNetEntString(reels, reelPositions);
                        // const currentReelsStr = slotSettings.reelsToNetEntString(reels);
                        const responseServer: NarcosServerResponse = {
                            // ... common fields ...
                            Balance: Math.round(slotSettings.GetBalance() * slotSettings.CurrentDenom * 100),
                            totalWin: slotSettings.GetGameData(`${slotSettings.slotId}TotalWin`),
                            reelsSymbols: reels, // Or a specific format if needed by client
                            // ... Narcos specific fields ...
                        };

                        let responseStr = `clientaction=${postData.action}&gamestate.current=${gameStateCurrent}&gamestate.stack=${gameStateStack}&nextaction=${nextAction}&rs.i0.id=basic${currentReelsStr}${winLines.join('')}${walkingWildsStr}${featureDriveByStr}${featureLockedUpStr}${scatterWinResponse}`;
                        responseStr += `&game.win.cents=${responseServer.totalWin! * slotSettings.CurrentDenom * 100}&game.win.coins=${responseServer.totalWin}&totalwin.cents=${responseServer.totalWin! * slotSettings.CurrentDenom * 100}&totalwin.coins=${responseServer.totalWin}&credit=${responseServer.Balance}&wavecount=1&multiplier=1`;

                        if (isFreeSpinEvent || isRespinEvent || featureLockedUpActive || scattersCount >= 3 || walkingWildsData.length > 0) {
                            responseStr += `&freespins.left=${slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`) - slotSettings.GetGameData(`${slotSettings.slotId}CurrentFreeGame`)}`;
                            responseStr += `&freespins.total=${slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`)}`;
                            responseStr += `&freespins.initial=${slotSettings.GetGameData(`${slotSettings.slotId}FreeGames`)}`;
                            // Add other FS related params
                        }

                        resultTmp.push(responseStr);

                        const responseForLog: NarcosSpinResponse = {
                            responseEvent: "spin",
                            responseType: postData.slotEvent,
                            serverResponse: responseServer
                        };
                        await slotSettings.SaveLogReport(JSON.stringify(responseForLog), currentTotalBet, lines, totalWin, postData.slotEvent);

                        break;

                    default:
                        return JSON.stringify({ responseEvent: "error", responseType: "unknown_action", serverResponse: `Unknown action: ${action}` });
                }

                await slotSettings.SaveGameData(); // Save session data to Redis
                return resultTmp[0];

            } catch (e: any) {
                console.error("Error in NarcosNET Server:", e);
                // Log the error to a file or monitoring system
                // fs.appendFileSync(path.join(getBasePath(), 'logs', 'GameInternal.log'), `NarcosNET Error: ${e.stack}\n`);
                return JSON.stringify({ responseEvent: "error", responseType: e.slotEvent || "", serverResponse: `Internal Server Error: ${e.message}` });
            }
        });
    }
}

/*

**Important Notes for `NarcosNET/Server.ts`:**

*   **`linesId` for 243 Ways:** The PHP code for NarcosNET does not use a `linesId` array in the `spin` case for win calculation. It directly checks symbol occurrences across adjacent reels for 243 ways. My TypeScript conversion for `calculateWins` (if I were to write it fully here) would need to reflect this "ways-to-win" logic rather than fixed paylines. The provided `linesId` in other games is for payline-based slots. Narcos is 243 ways.
*   **Response String Construction:** The PHP code builds very long and specific query strings for responses. I've started converting this to build a `NarcosServerResponse` object which would then be stringified (ideally as JSON, but the PHP example sometimes uses query strings). The example `result_tmp[] = ...` in the PHP `spin` case is a massive string. This needs careful translation to an object structure first, then serialization.
*   **Features (Walking Wilds, Locked Up, Drive-By):** These are core to Narcos.
*   **Walking Wilds:** The logic for moving wilds and triggering respins needs to be ported. `WildsWalk` game data is key.
*   **Locked Up:** This is a multi-spin feature. It's triggered by 3+ Pablo (SYM_2) symbols. It involves collecting symbols and has its own spin mechanics. The `initbonus`, `bonusaction`, and `endbonus` cases handle this.
*   **Drive-By:** This is a random feature that turns symbols into wilds.
*   **Free Spins:** Triggered by 3+ Scatter (SYM_0, Car) symbols. During free spins, Walking Wilds and Drive-By can still occur.
*   **`calculateWins` Method:** The `NarcosNET/SlotSettings.php` does not have a `calculateWins` method; this logic is embedded directly in the `Server.php`'s `spin` case. I'll need to translate that logic directly into the `Server.ts` spin case.
*   **Reel Layout (3-4-5-4-3):** The `GetReelStrips` method in `NarcosNET/SlotSettings.ts` needs to correctly return arrays of symbols matching this layout (e.g., `reel1` has 3 symbols, `reel2` has 4, etc.). The current `GameReel.ts` and `SlotSettings.GetReelStrips` might need adjustment if they assume a uniform 5x3 or 5x4 layout. The `NarcosNET/SlotSettings.php::GetReelStrips` correctly handles this by varying the number of symbols taken from the strip.
*   **`reelsToNetEntString`:** This helper would be needed to format the `reels` object into the `rs.i0.r.iX.syms=...&rs.i0.r.iX.pos=...` format if the client expects that.
*   **Error Handling:** The PHP `exit($response)` should be replaced with proper error object returns or by throwing exceptions that are caught at a higher level.

This conversion is substantial. The `Server.ts` especially requires meticulous attention to detail to replicate all game features and state transitions correctly. The provided `BaseSlotSettings.ts` helps with DB and session, but the core game logic is unique to Narcos.

I've provided the `GameReel.ts` and a skeleton for `SlotSettings.ts` and `Server.ts` with key considerations. A full, line-by-line, and tested conversion of `Server.php` would be a very large undertaking for a single response.

**Recommendation:**

1.  **Start with `GameReel.ts` and `SlotSettings.ts`:** Get these classes fully fleshed out with all properties and simpler methods correctly translated.
2.  **Tackle `Server.ts` action by action:**
   *   Begin with `init` and `paytable` as they are simpler.
   *   Then move to the main `spin` logic, focusing on:
       *   Betting and balance updates.
       *   Basic win calculation (243 ways).
       *   Scatter detection for Free Spins.
       *   Walking Wild detection and respin triggering.
       *   Locked Up symbol detection and bonus game triggering.
       *   Drive-By feature (random trigger).
   *   Implement the `freespin` logic (which is a variation of `spin` with Walking Wilds potentially active).
   *   Implement the `respin` logic for Walking Wilds.
   *   Implement the `initbonus`, `bonusaction`, and `endbonus` for the Locked Up feature.
3.  **Response Formatting:** Decide on a consistent response format (JSON is recommended) and ensure all actions adhere to it. The PHP code is a bit mixed here.

This is a significant piece of work. The provided snippets above are starting points. If you'd like me to focus on converting a specific part of `NarcosNET/Server.php` or `NarcosNET/SlotSettings.php` next, please let me know!
*/