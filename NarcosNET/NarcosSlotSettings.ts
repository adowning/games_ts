 import { PrismaClient, User, Game, Shop } from '@prisma/client';
import { GameReel } from './GameReel';
import { BaseSlotSettings } from '../BaseSlotSettings'; // Adjust path as needed

// This would be your actual, shared Prisma client instance
const prisma = new PrismaClient();


export class SlotSettings extends BaseSlotSettings {
    shopId: any;
    gameId: any;
    Jackpots: never[];
    is_active() {
        return true
    }
    public reelStrip1: string[] = [];
    public reelStrip2: string[] = [];
    public reelStrip3: string[] = [];
    public reelStrip4: string[] = [];
    public reelStrip5: string[] = [];
    public reelStrip6: string[] = []; // Usually empty for 5-reel games

    public reelStripBonus1: string[] = [];
    public reelStripBonus2: string[] = [];
    public reelStripBonus3: string[] = [];
    public reelStripBonus4: string[] = [];
    public reelStripBonus5: string[] = [];
    public reelStripBonus6: string[] = [];

    public CurrentDenomination: number = 0;
    public CurrentDenom: number = 0; // Added missing property
    public maxWin: number = 0; // Added missing property
    public game: Game | null = null; // Added missing property
    public shop: Shop | null = null; // Added missing property
    public Denominations: number[] = [];
    public SymbolGame: string[] = []; // Holds all symbols used in the game reels
    public Paytable: { [symbol: string]: number[] } = {}; // Keyed by symbol ID, values are payouts for N-of-a-kind
    public Bet: number[] = []; 
    public slotFreeCount: number[] = []; // e.g., [10, 10, 10] for 3, 4, 5 scatters
    public slotFreeMpl: number = 1;
    public slotWildMpl: number = 1;
    public slotBonus: boolean = true; // Indicates if bonus features are active/possible

    public AllBet: number = 0; // Helper for calculations, usually total bet in coins or currency


    constructor(sid: string, playerId: string) {
        super(sid, playerId); // Call BaseSlotSettings constructor

        // Symbols: '0': Scatter (Car), '1': Wild (DEA Badge), '2': LockedUp (Pablo)
        // Paytable: values are [pay_3_kind, pay_4_kind, pay_5_kind]
        // If a symbol pays for 2, 3, 4, 5 kinds, it would be [pay_2, pay_3, pay_4, pay_5]
        // Current Narcos paytable seems to imply [0,0,pay_3,pay_4,pay_5] or similar if using 6-element arrays.
        // For simplicity, let's assume paytable array index `i` means `i+3` of a kind.
        // e.g., Paytable['SYM_X'][0] is for 3 of a kind, Paytable['SYM_X'][1] is for 4, etc.
        this.Paytable = {
            '0':  [0, 0, 0],      // Scatter (Car) - No direct pay, triggers Free Spins
            '1':  [0, 20, 80],    // Wild (DEA Badge) - Assuming 3 wilds pay 0, 4 pay 20, 5 pay 80. Adjust if 3 wilds pay.
            '2':  [0, 0, 0],      // Locked Up Symbol (Pablo) - No direct pay, triggers Locked Up feature
            '3':  [0, 20, 80],    // Agent 1
            '4':  [0, 20, 80],    // Agent 2
            '5':  [0, 15, 60],    // Woman. Assuming 250 was for 6 of a kind, Narcos is 5 reels.
            '6':  [0, 15, 60],    // Flamingo
            '7':  [0, 10, 30],    // Plane
            '8':  [0, 10, 30],    // Grenade
            '9':  [5, 15, 60],    // A
            '10': [5, 15, 60],    // K
            '11': [5, 10, 40],    // Q
            '12': [5, 10, 40],    // J
            '13': [0, 0, 0],      // Golden Locked Up - Special symbol in Locked Up feature
            '14': [0, 0, 0]       // Walking Wild (DEA Badge during feature) - Acts as Wild '1'
        };
        
        const reel = new GameReel();
        // Assuming GameReel populates these with symbol IDs like '0', '1', '2', etc.
        this.reelStrip1 = reel.reelsStrip.reelStrip1;
        this.reelStrip2 = reel.reelsStrip.reelStrip2;
        this.reelStrip3 = reel.reelsStrip.reelStrip3;
        this.reelStrip4 = reel.reelsStrip.reelStrip4;
        this.reelStrip5 = reel.reelsStrip.reelStrip5;
        // NarcosNET/GameReel.php does not populate reelsStripBonus, so these will be empty
        this.reelStripBonus1 = reel.reelsStripBonus.reelStripBonus1;
        this.reelStripBonus2 = reel.reelsStripBonus.reelStripBonus2;
        this.reelStripBonus3 = reel.reelsStripBonus.reelStripBonus3;
        this.reelStripBonus4 = reel.reelsStripBonus.reelStripBonus4;
        this.reelStripBonus5 = reel.reelsStripBonus.reelStripBonus5;

        this.slotWildMpl = 1; // Wilds don't multiply wins by default, Walking Wilds are a feature
        this.slotFreeCount = [10, 10, 10]; // Free spins for 3, 4, 5 scatters respectively
        this.slotFreeMpl = 1; // Freespins don't have a general multiplier, features might apply

        // All symbols that appear on reels
        this.SymbolGame = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
    }
    
    async init(user: User, game: Game, shop: Shop): Promise<void> {
        await super.init(user, game, shop); // Call base init
        this.Denominations = (this.game!.denomination as unknown as string).split(',').map(Number); // Assuming denomination is comma-separated string in DB
        if (this.Denominations.length > 0) {
            this.CurrentDenom = this.Denominations[0];
            this.CurrentDenomination = this.Denominations[0];
        }
        this.Bet = this.game!.bet.split(',').map(Number);
        this.maxWin = this.shop!.max_win;
        this.slotBonus = this.game!.bonus > 0; // Assuming 'bonus' field (0 or 1) indicates if bonus features are enabled

        // Initialize AllBet (example: if bet is in coins and Narcos uses 20 coins per spin level)
        // This might be set/updated when bet level changes in the Server.ts
        if (this.Bet.length > 0) {
             // Assuming Bet[0] is the default bet level, and Narcos bet cost is 20 coins per level
            this.AllBet = this.Bet[0] * 20;
        }
    }

    /**
     * Finds all occurrences of a scatter symbol on a reel strip.
     * @param strip The reel strip array of symbols.
     * @param scatterSymbol The symbol ID of the scatter.
     * @returns An array of indices where the scatter symbol is found, or an empty array if not found.
     */
    private findScatterIndices(strip: string[], scatterSymbol: string): number[] {
        const indices: number[] = [];
        strip.forEach((symbol, index) => {
            if (symbol === scatterSymbol) {
                indices.push(index);
            }
        });
        return indices;
    }


    public GetReelStrips(winType: string, slotEvent: string): { rp: number[], reel1: string[], reel2: string[], reel3: string[], reel4: string[], reel5: string[] } {
        const reels: { rp: number[], reel1: string[], reel2: string[], reel3: string[], reel4: string[], reel5: string[] } = {
            rp: [],
            reel1: [],
            reel2: [],
            reel3: [],
            reel4: [],
            reel5: [],
        };

        let currentReelStrips = {
            reelStrip1: this.reelStrip1,
            reelStrip2: this.reelStrip2,
            reelStrip3: this.reelStrip3,
            reelStrip4: this.reelStrip4,
            reelStrip5: this.reelStrip5,
        };

        // The NarcosNET/GameReel.php doesn't populate reelsStripBonus.
        // Logic for specific features like Locked Up might modify reels after this initial generation.
        if (slotEvent === 'freespin_lockedup_feature') { 
            // This event implies Locked Up feature is active.
            // The reels might be pre-set with Locked Up symbols or specific bonus reels.
            // For now, we assume base reels are used and then modified by feature logic.
        }

        const prs: { [key: number]: number } = {}; // Stores the starting reel position for each reel

        const reelOrder = [1, 2, 3, 4, 5]; // Standard reel order
        // Narcos reel heights: Reel 1:3, Reel 2:4, Reel 3:5, Reel 4:4, Reel 5:3
        const reelHeights: { [reelId: number]: number } = { 1: 3, 2: 4, 3: 5, 4: 4, 5: 3 };

        if (winType === 'bonus') { // This usually means scatter trigger
            const scatterSymbol = '0'; // SYM_0 is the scatter
            const scattersToPlace = 3; // Minimum scatters for bonus

            // Shuffle reels to place scatters on
            const shuffledReelOrder = [...reelOrder].sort(() => 0.5 - Math.random());

            for (let i = 0; i < reelOrder.length; i++) {
                const reelId = reelOrder[i];
                const reelKey = `reelStrip${reelId}` as keyof typeof currentReelStrips;
                const strip = currentReelStrips[reelKey];
                const viewHeight = reelHeights[reelId];

                if (strip && strip.length > 0) {
                    if (shuffledReelOrder.indexOf(reelId) < scattersToPlace) { // Force scatter on 'scattersToPlace' random reels
                        const scatterIndices = this.findScatterIndices(strip, scatterSymbol);
                        if (scatterIndices.length > 0) {
                            const scatterIndexOnStrip = scatterIndices[Math.floor(Math.random() * scatterIndices.length)];
                            // Ensure 'pos' (start of visible window) makes scatterIndexOnStrip visible
                            const minPos = Math.max(0, scatterIndexOnStrip - viewHeight + 1);
                            const maxPos = Math.min(strip.length - viewHeight, scatterIndexOnStrip);
                             prs[reelId] = (minPos <= maxPos) ? 
                                (minPos + Math.floor(Math.random() * (maxPos - minPos + 1))) : 
                                Math.floor(Math.random() * (strip.length - viewHeight + 1));
                        } else {
                             // Scatter symbol not on this strip, place randomly (won't be a scatter)
                            prs[reelId] = Math.floor(Math.random() * (strip.length - viewHeight + 1));
                        }
                    } else {
                        // For other reels, avoid scatter if possible or place randomly
                        let pos = Math.floor(Math.random() * (strip.length - viewHeight + 1));
                        let attempts = 0;
                        // Try to avoid placing a scatter if not forced (simple check)
                        while (strip[pos] === scatterSymbol && attempts < 10) { // Avoid if first symbol is scatter
                            pos = Math.floor(Math.random() * (strip.length - viewHeight + 1));
                            attempts++;
                        }
                        prs[reelId] = pos;
                    }
                } else {
                     prs[reelId] = 0; // Fallback if strip is empty
                }
            }
        } else {
            reelOrder.forEach(reelId => {
                const reelKey = `reelStrip${reelId}` as keyof typeof currentReelStrips;
                const strip = currentReelStrips[reelKey];
                const viewHeight = reelHeights[reelId];
                if (strip && strip.length > 0) {
                    prs[reelId] = Math.floor(Math.random() * (strip.length - viewHeight + 1));
                } else {
                    prs[reelId] = 0; // Fallback
                }
            });
        }

        Object.keys(prs).forEach(indexStr => {
            const index = parseInt(indexStr, 10);
            const reelKey = `reelStrip${index}` as keyof typeof currentReelStrips;
            const strip = currentReelStrips[reelKey];
            const value = prs[index]; // This is the starting position on the strip
            const stripLength = strip.length;
            const viewHeight = reelHeights[index];

            const reelName = `reel${index}` as keyof typeof reels;
            const currentReelSymbols: string[] = [];

            if (strip && strip.length > 0) {
                for (let k = 0; k < viewHeight; k++) {
                    currentReelSymbols.push(strip[(value + k + stripLength) % stripLength]);
                }
            } else { // Fallback for empty strip
                for (let k = 0; k < viewHeight; k++) currentReelSymbols.push(''); // or a default symbol
            }
            reels[reelName] = currentReelSymbols;

            reels.rp.push(value);
        });

        return reels as { rp: number[], reel1: string[], reel2: string[], reel3: string[], reel4: string[], reel5: string[] };
    }

    public async GetSpinSettings(garantType: 'bet' | 'bonus' = 'bet', bet: number, lines: number): Promise<[string, number]> {
        // This involves checking RTP, bank, win limits etc.
        // The PHP code uses $this->game->get_lines_percent_config which is not fully defined here.
        // For a testable version, this might need to be more deterministic or use simpler logic.
        
        const gameBank: number = await this.GetBank(garantType === 'bonus' ? 'bonus' : ''); // Use GetBank from BaseSlotSettings
        const currentPercent = this.shop!.percent;

        // Simplified logic: 5% chance of bonus, 20% chance of win, else none.
        // This needs to be replaced with the complex logic from the PHP file if available.
        const rand = Math.random() * 100;
        let winType = 'none';
        let spinWinLimit = 0;

        if (garantType === 'bonus') { // Force bonus if called for bonus
            winType = 'bonus';
            spinWinLimit = gameBank / (this.CurrentDenom || 1); // Avoid division by zero
        } else if (rand < 5 && this.slotBonus) { // 5% chance for bonus
            winType = 'bonus';
            spinWinLimit = gameBank / (this.CurrentDenom || 1);
            // TODO: Add more sophisticated bank check logic from PHP if available
            if (spinWinLimit < bet * 5) { // Assuming average bonus is 5x bet
                winType = 'none';
            }
            // Ensure bank can actually pay this bonus type
        } else if (rand < 25) { // Next 20% chance for regular win (total 25%)
            winType = 'win';
            spinWinLimit = gameBank / (this.CurrentDenom || 1);
        } // else winType remains 'none'

        return [winType, spinWinLimit];
    }
    public async GetBank(type: string = ''): Promise<number> {
        try {
            if (!this.gameId || !this.shopId) {
                console.error('Game ID or Shop ID not set for GetBank');
                return 0;
            }
            
            // Implement actual bank retrieval logic here
            // This is a placeholder implementation
            return 1000000; // Default bank value
        } catch (error) {
            console.error('Error in GetBank:', error);
            return 0;
        }
    }

    public GetRandomPay(): number {
        const allRates: number[] = [];
        Object.values(this.Paytable).forEach(payline => {
            payline.forEach(rate => {
                if (rate > 0) {
                    allRates.push(rate);
                }
            });
        });
        if (allRates.length === 0) return 0;
        allRates.sort(() => 0.5 - Math.random()); // Shuffle

        // Simplified version of bank check
        if (this.game!.stat_in < (this.game!.stat_out + (allRates[0] * (this.AllBet || 1) ))) {
            return 0;
        }
        return allRates[0];
    }

    public CheckBonusWin(): number {
        let allRateCnt = 0;
        let allRate = 0;
        Object.values(this.Paytable).forEach(vl => {
            let hasRate = false;
            for (const vl2 of vl) {
                if (vl2 > 0) {
                    allRate += vl2;
                    hasRate = true;
                    break; 
                }
            }
            if(hasRate) allRateCnt++;
        });
        return allRateCnt > 0 ? allRate / allRateCnt : 0;
    }

    public FormatFloat(num: number): number {
        const numStr = String(num);
        const parts = numStr.split('.');
        if (parts.length > 1) {
            if (parts[1].length > 4) {
                return Math.round(num * 100) / 100;
            } else if (parts[1].length > 2) {
                return Math.floor(num * 100) / 100;
            }
        }
        return num;
    }

    public async UpdateJackpots(bet: number): Promise<{isJackPay?: boolean, jackPay?: number}> {
        // This is a complex method involving JPG table and logic.
        // The PHP code updates `this.jpgs` which are `\VanguardLTE\JPG` models.
        // It also updates `this.Jackpots` property (which is an array of jackpot values).
        // This requires Prisma interaction with a `JPG` table.
        
        if (!this.shopId || !this.gameId) {
            console.error("Shop ID or Game ID not set for UpdateJackpots");
            return {};
        }

        const jpgs = await prisma.jPG.findMany({ where: { shop_id: this.shopId } });
        let jackPay = 0;
        let isJackPay = false;

        // This is a highly simplified placeholder.
        // The actual logic for jackpot contribution, win conditions, and updates
        // from the PHP version needs to be translated here.
        for (const jpg of jpgs) {
            // Example: jpg.increment = bet * (jpg.percent / 100); jpg.balance += jpg.increment;
            // Check if jpg.balance >= jpg.pay_sum for a win, etc.
            // This logic is very specific to the original PHP implementation.
        }
        // if (isJackPay) {
        //    await prisma.jPG.updateMany(...); // If changes were made (e.g., balance reset)
        // }

        this.Jackpots = []; // Reset or update based on actual logic
        return { isJackPay, jackPay };
    }

    public GetGambleSettings(): number {
        // Assuming WinGamble is a property set from game->rezerv
        const winGamble = parseFloat(this.game?.rezerv || '1'); // Default to 1 if not set
        return Math.floor(Math.random() * winGamble) + 1;
    }

    // Specific to NarcosNET for Locked Up feature symbol placement
    public PlaceLockedUpSymbols(reels: any, lockedUpCount: number): any {
        const symbolToPlace = '2'; // Pablo / Locked Up symbol
        let placedCount = 0;
        const availablePositions: {r: number, p: number}[] = [];

        // Collect all available non-wild, non-scatter positions
        for (let r = 1; r <= 5; r++) {
            for (let p = 0; p < reels[`reel${r}`].length; p++) {
                if (reels[`reel${r}`][p] !== '' && reels[`reel${r}`][p] !== '0' && reels[`reel${r}`][p] !== '1') {
                     // Assuming SYM_0 is scatter, SYM_1 is wild
                    availablePositions.push({r, p});
                }
            }
        }

        availablePositions.sort(() => 0.5 - Math.random()); // Shuffle positions

        for (let i = 0; i < Math.min(lockedUpCount, availablePositions.length); i++) {
            const pos = availablePositions[i];
            reels[`reel${pos.r}`][pos.p] = symbolToPlace;
            placedCount++;
        }
        return reels;
    }

    // Specific to NarcosNET for Walking Wilds during Freespins / Respins
    public ProcessWalkingWilds(reels: any, walkingWilds: { reel: number, row: number, symbol: string }[]): {
        reels: any,
        newWalkingWilds: { reel: number, row: number, symbol: string }[],
        walkingWildsStr: string
    } {
        const newWalkingWilds: { reel: number, row: number, symbol: string }[] = [];
        let walkingWildsStr = '';
        let wwCnt = 0; // Counter for overlay index

        // Create a deep copy of reels to modify
        const newReels = JSON.parse(JSON.stringify(reels));

        walkingWilds.forEach(ww => {
            // Clear the old position of the walking wild if it was on the board
            if (ww.reel >= 1 && ww.reel <= 5 && newReels[`reel${ww.reel}`] && newReels[`reel${ww.reel}`][ww.row] === '1') {
                // This part is tricky: what was the original symbol under the wild?
                // For simplicity, we might not restore it, or need a more complex state.
                // The original PHP might re-fetch from reel strips or have a "base" reel state.
                // For now, let's assume it becomes a non-wild symbol or is handled by new wild placement.
                // A common approach is that walking wilds overlay, and the underlying symbol doesn't matter until the wild moves off.
            }

            if (ww.reel > 1) { // Move one step to the left (e.g., from reel 3 to reel 2)
                const newPos = { reel: ww.reel - 1, row: ww.row, symbol: ww.symbol }; // symbol is usually '1' or '14'
                newWalkingWilds.push(newPos);
                
                // Place the wild on the new position
                if (newReels[`reel${newPos.reel}`] && newReels[`reel${newPos.reel}`][newPos.row] !== undefined) {
                    newReels[`reel${newPos.reel}`][newPos.row] = '1'; // '1' is the generic wild symbol
                }
                
                // Construct overlay string part for NetEnt format
                // Reel index in NetEnt string is 0-based
                walkingWildsStr += `&rs.i0.r.i${newPos.reel - 1}.overlay.i${wwCnt}.wildtype=NORMAL`; 
                walkingWildsStr += `&rs.i0.r.i${newPos.reel - 1}.overlay.i${wwCnt}.row=${newPos.row}`;
                walkingWildsStr += `&rs.i0.r.i${newPos.reel - 1}.overlay.i${wwCnt}.with=SYM1`; // Generic wild symbol ID
                // walkingWildsStr += `&rs.i0.r.i${newPos.reel - 1}.overlay.i${wwCnt}.pos=0`; // 'pos' might refer to column if multiple overlays per cell
                wwCnt++;
            }
            // If ww.reel was 1, it walks off the screen and is not added to newWalkingWilds
        });

        return { reels: newReels, newWalkingWilds, walkingWildsStr };
    }

     // Specific to NarcosNET for Drive By feature
    public ApplyDriveByFeature(reels: any): { reels: any, featureString: string } {
        let featureString = '&feature.driveby.active=true';
        const positionsToChange: { r: number, p: number, originalSym: string }[] = [];
        
        // Create a deep copy of reels to modify
        const newReels = JSON.parse(JSON.stringify(reels));

        // Identify potential symbols to change to Wild.
        // Typically high-value symbols are targeted to become Wilds.
        // Or, any non-special symbol can be chosen.
        for (let r = 1; r <= 5; r++) { // Reels are 1-indexed in this context
            for (let p = 0; p < newReels[`reel${r}`].length; p++) { // p is 0-indexed row
                const currentSymbol = newReels[`reel${r}`][p];
                // Avoid changing existing wilds, scatters, or bonus symbols
                if (currentSymbol && !['0', '1', '2', '13', '14'].includes(currentSymbol)) {
                    // Optionally, prioritize certain symbols or avoid others
                     positionsToChange.push({ r, p, originalSym: currentSymbol });
                }
            }
        }

        positionsToChange.sort(() => 0.5 - Math.random()); // Shuffle

        const numToChange = Math.min(positionsToChange.length, Math.floor(Math.random() * 3) + 2); // Change 2 to 4 symbols
        const changedPositionsNetEnt: string[] = [];

        for (let i = 0; i < numToChange; i++) {
            const pos = positionsToChange[i];
            newReels[`reel${pos.r}`][pos.p] = '1'; // Change to Wild '1'
            changedPositionsNetEnt.push(`${pos.r-1}%2C${pos.p}`); // NetEnt format: reelIndex,rowIndex (0-based)
        }

        if (changedPositionsNetEnt.length > 0) {
            featureString += `&feature.driveby.wildpositions=${changedPositionsNetEnt.join('%7C')}`;
        } else {
            featureString = ''; // No feature activated if no symbols changed
        }

        return { reels: newReels, featureString };
    }


    // This method is specific to NarcosNET and how it handles Locked Up feature reels
    // It might be more about setting up the *initial* state for Locked Up,
    // where subsequent spins in Locked Up use special reel strips or logic.
    public GetLockedUpReelStrips(lockedUpSymCount: number): { rp: number[], reel1: string[], reel2: string[], reel3: string[], reel4: string[], reel5: string[] } {
        // For Locked Up, the reels are often cleared except for the triggering symbols,
        // and then special symbols (like coin values or blanks) spin.
        // This method might need to return such specialized reels.
        // The PHP logic for `slotEvent == 'freespin'` and `skey == 'LockedUp'` needs careful review.

        // For now, let's assume it returns a base set of reels that the server
        // will then modify to place the initial Locked Up symbols.
        // Or, it could return reels specifically designed for the Locked Up feature if `reelsStripBonus` were used.
        
        // The actual placement of '2' (Pablo) symbols that trigger the feature
        // would have happened on a regular spin. This method is for *during* the feature.
        // If Narcos uses distinct reel strips for the Locked Up bonus game, they should be loaded here.
        // Since `reelsStripBonus` is empty, we'll assume it uses modified base reels or a different mechanism.

        // Placeholder: returns standard reels. The server logic for 'bonusaction' in Server.ts
        // would then need to implement the actual Locked Up spinning mechanics.
        return this.GetReelStrips('win', 'freespin'); // 'win' to ensure some variety, 'freespin' as it's a bonus
    }

    /**
     * Calculates wins for a 243-ways game.
     * @param reels Reels object e.g., { reel1: ['1','2','3'], reel2: [...] ... }
     * @param betLevel Current bet level.
     * @param wildSymbol Symbol ID for Wild.
     * @param scatterSymbol Symbol ID for Scatter.
     * @returns Object containing totalWin and winLines array.
     */
    public calculateWins(
        reels: { [key: string]: string[] }, // e.g., { reel1: ['symA', 'symB', 'symC'], reel2: [...], ... }
        betLevel: number, // This is the multiplier for coin wins
        // lines: number, // Not directly used for 243-ways calculation itself, but for bet cost
        // bonusMultiplier: number, // If there's an overall win multiplier
        // Paytable: { [key: string]: number[] }, // Already a class member: this.Paytable
        // SymbolGame: string[], // Already a class member: this.SymbolGame
        wildSymbols: string[] = ['1', '14'], // Wild and Walking Wild
        scatterSymbol: string = '0'
    ): { totalWin: number, winLines: any[], winLinesNetEnt: string } {
        let totalWinCoins = 0;
        const winLinesDetails: any[] = []; 
        let winLinesNetEnt = '';
        const numReels = 5; // Narcos has 5 reels

        // Iterate over each symbol on the first reel as a potential start of a winning way
        // Only consider unique symbols on the first reel to avoid redundant checks for same symbol on different rows
        const firstReelSymbols = reels.reel1 ? [...new Set(reels.reel1.filter(s => s && s !== scatterSymbol))] : [];

        for (const startSymbol of firstReelSymbols) {
            if (!startSymbol) continue; // Skip empty spots

            let waysCount = 0;
            let consecutiveReels = 0;
            const winningPositions: string[][] = Array(numReels).fill(null).map(() => []); // Store actual symbol positions

            // Count occurrences on Reel 1
            let reel1Matches = 0;
            if (reels.reel1) {
                reels.reel1.forEach((s, idx) => {
                    if (s === startSymbol || wildSymbols.includes(s)) {
                        reel1Matches++;
                        winningPositions[0].push(`0,${idx}`); // reelIdx,rowIdx
                    }
                });
            }

            if (reel1Matches > 0) {
                waysCount = reel1Matches;
                consecutiveReels = 1;

                // Check subsequent reels
                for (let r = 1; r < numReels; r++) { // Check reels 2 (index 1) to 5 (index 4)
                    const reelKey = `reel${r + 1}`;
                    if (!reels[reelKey] || reels[reelKey].length === 0) break;

                    let symbolsOnCurrentReel = 0;
                    reels[reelKey].forEach((s, idx) => {
                        if (s === startSymbol || wildSymbols.includes(s)) {
                            symbolsOnCurrentReel++;
                            winningPositions[r].push(`${r},${idx}`);
                        }
                    });

                    if (symbolsOnCurrentReel > 0) {
                        waysCount *= symbolsOnCurrentReel;
                        consecutiveReels++;
                    } else {
                        break; // Sequence broken
                    }
                }
            }

            if (consecutiveReels >= 3) { // Minimum 3 of a kind for a win (standard for many slots)
                // Paytable index: 0 for 3-kind, 1 for 4-kind, 2 for 5-kind
                const pay = (this.Paytable[startSymbol]?.[consecutiveReels - 3] || 0);
                if (pay > 0) {
                    const winAmountCoins = pay * waysCount; // Pay is per way
                    totalWinCoins += winAmountCoins;

                    // Collect all combinations of winning positions for NetEnt string
                    let currentWinningPositionsNetEnt: string[] = [];
                    if (winningPositions[0].length > 0) {
                        currentWinningPositionsNetEnt = winningPositions[0];
                    }
                    for(let i=1; i < consecutiveReels; i++) {
                        const nextReelPositions = winningPositions[i];
                        const tempCombined = [];
                        for(const existing of currentWinningPositionsNetEnt) {
                            for(const next of nextReelPositions) {
                                tempCombined.push(existing + '|' + next);
                            }
                        }
                        currentWinningPositionsNetEnt = tempCombined;
                    }
                    
                                // For NetEnt, often one representative line is shown, or all ways are implied by symbol count
                    // The PHP code seems to build a string for each winning symbol type.
                    // ws.i0.sym=SYM_X&ws.i0.direction=LEFT_TO_RIGHT&ws.i0.types.i0.wintype=coins&ws.i0.types.i0.winamount=COINS&ws.i0.types.i0.multiplier=1&ws.i0.pos=0,0|1,1|2,0
                    // The 'pos' part needs to list one instance of the winning way.
                    // For 243 ways, the 'pos' might just list one symbol from each of the consecutive reels.
                    let representativePositions = '';
                    for(let k=0; k<consecutiveReels; k++){
                        if(winningPositions[k].length > 0) {
                             representativePositions += (k > 0 ? '%7C' : '') + winningPositions[k][0].replace(',', '%2C');
                        }
                    }

                    const winLineId = winLinesDetails.length;
                    winLinesNetEnt += `&ws.i${winLineId}.sym=${startSymbol.startsWith('SYM') ? startSymbol : 'SYM'+startSymbol}`; // Ensure SYM prefix
                    winLinesNetEnt += `&ws.i${winLineId}.direction=LEFT_TO_RIGHT`; // Narcos is LTR
                    winLinesNetEnt += `&ws.i${winLineId}.types.i0.wintype=coins`;
                    winLinesNetEnt += `&ws.i${winLineId}.types.i0.winamount=${winAmountCoins}`; // Win in coins
                    winLinesNetEnt += `&ws.i${winLineId}.types.i0.multiplier=${betLevel}`; // Bet level is the multiplier for coin wins
                    winLinesNetEnt += `&ws.i${winLineId}.pos=${representativePositions}`;
                    
                    winLinesDetails.push({ 
                        symbol: startSymbol, 
                        count: consecutiveReels, 
                        ways: waysCount, 
                        pay: pay, // coin payout per way
                        winCoins: winAmountCoins,
                        positions: winningPositions.slice(0, consecutiveReels) // Only include positions from winning reels
                    });
                }
            }
        }
        const totalWinCurrency = totalWinCoins * betLevel * this.CurrentDenomination; // This is the final win amount
        // The `totalWin` returned should probably be in coins, and Server.ts handles currency conversion for balance.
        return { totalWin: totalWinCoins, winLines: winLinesDetails, winLinesNetEnt };
    }

    /**
     * Converts reel data to NetEnt's string format for the response
     * @param reels The reels object with symbol data
     * @param rp Reel positions array
     * @returns Formatted string for NetEnt
     */
    public reelsToNetEntString(reels: { [key: string]: string[] }, rp: number[]): string {
        let str = '';
        const reelHeights: { [key: number]: number } = { 1: 3, 2: 4, 3: 5, 4: 4, 5: 3 };
        for (let i = 1; i <= 5; i++) {
            const reelKey = `reel${i}`;
            const reelIdxNetEnt = i - 1; // NetEnt reel index is 0-based
            if (reels[reelKey] && reels[reelKey].length > 0) {
                const symbols = reels[reelKey]
                    .slice(0, reelHeights[i]) // Ensure correct number of symbols for the reel
                    .map(s => s.startsWith('SYM') ? s : `SYM${s}`) // Ensure SYM prefix
                    .join('%2C');
                str += `&rs.i0.r.i${reelIdxNetEnt}.syms=${symbols}`;
                if (rp && rp[reelIdxNetEnt] !== undefined) {
                    str += `&rs.i0.r.i${reelIdxNetEnt}.pos=${rp[reelIdxNetEnt]}`;
                }
            }
        }
        return str;
    }
}

// Define interface for reels to improve type safety
interface Reels {
    [key: string]: string[];
    reel1: string[];
    reel2: string[];
    reel3: string[];
    reel4: string[];
    reel5: string[];
}
