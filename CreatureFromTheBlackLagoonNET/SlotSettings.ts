import { GameReel } from './GameReel';

// Placeholder for database/ORM types. Replace with actual types when available.
type User = any;
type Game = any;
type Shop = any;
type JPG = any;
// type GameBank = any; // Already part of Game for get_gamebank()
// type GameLog = any;
// type StatGame = any;

// Placeholder for VanguardLTE specific types
namespace VanguardLTE {
  export enum UserStatus {
    BANNED = 'banned',
    ACTIVE = 'active', // Assuming other statuses
  }
  export class Support { // Simplified
    static Enum = { UserStatus };
  }
  export class Session { static where(...args: any[]): any { return { delete: () => {} }; } } // Simplified
  export class Game { // Simplified Game class from VanguardLTE if needed for static values like ::$values['denomination']
        static values: {[key: string]: any} = {
            denomination: [1,2,5,10,20,50,100] // Example default denominations
        };
  }
}


export class SlotSettings {
  public playerId: string | null = null;
  public splitScreen: boolean | null = null;
  public reelStrip1: string[] | null = null;
  public reelStrip2: string[] | null = null;
  public reelStrip3: string[] | null = null;
  public reelStrip4: string[] | null = null;
  public reelStrip5: string[] | null = null;
  public reelStrip6: string[] | null = null;
  public reelStripBonus1: string[] | null = null;
  public reelStripBonus2: string[] | null = null;
  public reelStripBonus3: string[] | null = null;
  public reelStripBonus4: string[] | null = null;
  public reelStripBonus5: string[] | null = null;
  public reelStripBonus6: string[] | null = null;
  public slotId: string = '';
  public slotDBId: string = '';
  public Line: number[] | null = null;
  public scaleMode: number | null = null;
  public numFloat: number | null = null;
  public gameLine: number[] | null = null;
  public Bet: string[] | null = null;
  public isBonusStart: boolean | null = null;
  public Balance: number | null = null;
  public SymbolGame: string[] | null = null;
  public GambleType: number | null = null;
  public lastEvent: string | null = null;
  public Jackpots: any[] = [];
  public keyController: { [key: string]: string } | null = null;
  public slotViewState: string | null = null;
  public hideButtons: string[] | null = null;
  public slotReelsConfig: number[][] | null = null;
  public slotFreeCount: number[] | null = null; // Changed to number[]
  public slotFreeMpl: number | null = null;
  public slotWildMpl: number | null = null;
  public slotExitUrl: string | null = null;
  public slotBonus: boolean | null = null;
  public slotBonusType: number | null = null;
  public slotScatterType: number | null = null;
  public slotGamble: boolean | null = null;
  public Paytable: { [key: string]: number[] } = {};
  public slotSounds: string[] = [];

  public jpgs: JPG[] | null = null; // Made public to match PHP, though might be better as private
  private Bank: number | null = null;
  private Percent: number | null = null;
  private WinLine: any | null = null;
  private WinGamble: number | null = null;
  private Bonus: any | null = null;
  private shop_id: string | number | null = null;

  public currency: string | null = null;
  public user: User | null = null;
  public game: Game | null = null;
  public shop: Shop | null = null;

  public jpgPercentZero: boolean = false;
  public count_balance: number | null = null;
  public MaxWin: number | undefined;
  public increaseRTP: number = 1;
  public CurrentDenom: number = 1;
  public Denominations: number[] = []; // Added this from PHP
  public CurrentDenomination: number = 1; // Added this, seems redundant with CurrentDenom but in PHP
  public slotFastStop: number | null = null;
  public slotCurrency: string | null = null;
  public slotJackPercent: number[] = []; // Added
  public slotJackpot: number[] = []; // Added


  // Game data properties
  private gameData: { [key: string]: {timelife: number, payload: any} } = {};
  private gameDataStatic: { [key: string]: {timelife: number, payload: any} } = {};
  public AllBet: number = 0;

  // Properties for bank logic from AfricanKing (might need adjustment if Creature has different logic)
  public toGameBanks: number = 0;
  public toSlotJackBanks: number = 0;
  public toSysJackBanks: number = 0;
  public betProfit: number = 0;
  public betRemains: number = 0; // For complex balance adjustment logic
  public betRemains0: number = 0; // For complex balance adjustment logic


  constructor(sid: string, playerId: string) {
    this.slotId = sid;
    this.playerId = playerId;

    // STUBBED: Database interactions and user/game/shop loading
    // This part needs to be implemented with actual TypeScript database access and user session management
    // For now, initialize with defaults or placeholders
    // this.user = UserModel.find(playerId);
    // this.shop_id = this.user?.shop_id;
    // this.game = GameModel.findByName(sid, this.shop_id);
    // this.shop = ShopModel.find(this.shop_id);
    // this.Balance = this.user?.balance;
    // this.CurrentDenom = this.game?.denomination || 1;
    // this.Denominations = VanguardLTE.Game.values['denomination'] || [1,2,5,10,20,50,100];
    // this.CurrentDenomination = this.Denominations[0];
    // this.MaxWin = this.shop?.max_win;
    // this.Percent = this.shop?.percent;
    // this.WinGamble = this.game?.rezerv;
    // this.slotDBId = this.game?.id;
    // this.slotCurrency = this.shop?.currency;
    // this.count_balance = this.user?.count_balance;
    // this.jpgs = JPGModel.where({shop_id: this.shop_id}).get();
    // this.Bank = this.game?.get_gamebank();
    // if (this.user && (!this.user.session || this.user.session.length <= 0)) {
    //     this.user.session = JSON.stringify({});
    // }
    // this.gameData = this.user ? JSON.parse(this.user.session) : {};
    // if (this.game && (!this.game.advanced || this.game.advanced.length <= 0)) {
    //     this.game.advanced = JSON.stringify({});
    // }
    // this.gameDataStatic = this.game ? JSON.parse(this.game.advanced) : {};
    // this.slotViewState = this.game?.slotViewState === '' ? 'Normal' : this.game?.slotViewState || 'Normal';
    // this.Bet = this.game?.bet?.split(',') || ["1","2","5","10","20","50"];
    // for( let jp = 1; jp <= 4; jp++ ) {
    //     this.slotJackpot.push(this.game?.[`jp_${jp}`] || 0);
    //     this.slotJackPercent.push(this.game?.[`jp_${jp}_percent`] || 0);
    // }
    console.log(`SlotSettings for ${sid} and player ${playerId} initialized (stubbed data).`);
    // Fallback initializations if DB load fails or is stubbed
    this.Denominations = VanguardLTE.Game.values['denomination'] || [1,2,5,10,20,50,100];
    this.CurrentDenom = this.Denominations[0];
    this.CurrentDenomination = this.Denominations[0];
    this.Bet = ["1","2","5","10","15","20"]; // Example bets
    this.Balance = 1000; // Example balance
    this.slotCurrency = "USD";
    this.MaxWin = 10000;
    this.Percent = 95;
    this.WinGamble = 2; // typical for NetEnt gamble
    this.slotDBId = "stubbed_game_id";
    this.slotViewState = "Normal";


    // Initialize Paytable for CreatureFromTheBlackLagoonNET
    this.Paytable['SYM_0'] = [0,0,0,0,0,0]; // Wild - Creature (usually no direct payout, but substitutes)
    this.Paytable['SYM_1'] = [0,0,0,0,0,0]; // Wild - Spreading Wild 1 (same as SYM_0)
    this.Paytable['SYM_2'] = [0,0,0,0,0,0]; // Wild - Spreading Wild 2 (same as SYM_0)
    this.Paytable['SYM_3'] = [0,0,0,25,250,750]; // Kay
    this.Paytable['SYM_4'] = [0,0,0,20,200,600]; // David
    this.Paytable['SYM_5'] = [0,0,0,15,150,500]; // Carl
    this.Paytable['SYM_6'] = [0,0,0,10,100,400]; // Lucas
    this.Paytable['SYM_7'] = [0,0,0,5,40,125];  // Camera
    this.Paytable['SYM_8'] = [0,0,0,5,40,125];  // Oxygen Tank
    this.Paytable['SYM_9'] = [0,0,0,4,30,100];  // Knife
    this.Paytable['SYM_10'] = [0,0,0,4,30,100]; // Binoculars (Note: PHP has this as SYM_10, game often has fewer symbols)
    // SYM_11, SYM_12, SYM_13 from PHP are Free Spins symbols, not direct paytable items for line wins.
    // Their effect is triggering free spins, which is handled by scatter logic.

    // Initialize SymbolGame
    this.SymbolGame = ['3','4','5','6','7','8','9','10']; // Symbols that form line wins
    // Wilds (0,1,2) and Scatters (11,12,13) are handled separately.

    // Initialize GameReel and reel strips
    const reel = new GameReel();
    this.reelStrip1 = reel.reelsStrip.reelStrip1;
    this.reelStrip2 = reel.reelsStrip.reelStrip2;
    this.reelStrip3 = reel.reelsStrip.reelStrip3;
    this.reelStrip4 = reel.reelsStrip.reelStrip4;
    this.reelStrip5 = reel.reelsStrip.reelStrip5;
    // reelStrip6 is usually empty for 5-reel slots

    this.reelStripBonus1 = reel.reelsStripBonus.reelStripBonus1;
    this.reelStripBonus2 = reel.reelsStripBonus.reelStripBonus2;
    this.reelStripBonus3 = reel.reelsStripBonus.reelStripBonus3;
    this.reelStripBonus4 = reel.reelsStripBonus.reelStripBonus4;
    this.reelStripBonus5 = reel.reelsStripBonus.reelStripBonus5;
    // reelStripBonus6 is usually empty

    // Initialize other settings
    this.scaleMode = 0;
    this.numFloat = 0;

    // Creature specific: slotFreeCount is an array [0,0,0,10,15,20] meaning 3 scatters = 10 FS, 4 = 15 FS, 5 = 20 FS
    this.slotFreeCount = [0,0,0,10,15,20];
    this.slotFreeMpl = 1; // Free spins in Creature typically don't have an extra multiplier beyond Spreading Wilds
    this.slotWildMpl = 1; // Wilds substitute, don't multiply unless specified by a feature
    this.slotBonus = true; // Game has a free spins bonus
    this.slotBonusType = 1; // Typically 1 for free spins triggered by scatters
    this.slotScatterType = 0; // Scatters trigger bonus (symbols 11, 12, 13 are scatters)
    this.slotGamble = false; // NetEnt games like Creature usually don't have a gamble feature
    this.GambleType = 0;
    this.slotFastStop = 1;
    this.slotExitUrl = '/';

    this.hideButtons = [];

    this.keyController = {
        '13': 'uiButtonSpin,uiButtonSkip',
        '49': 'uiButtonInfo',
        // No collect, gamble, red/black for Creature typically
        '51': 'uiButtonExit2',
        '54': 'uiButtonBetMinus',
        '55': 'uiButtonBetPlus',
        '189': 'uiButtonAuto',
        // '187': 'uiButtonSpin' // 13 (Enter) is often spin too
    };

    this.slotReelsConfig = [ // Standard 5x3 reel display coordinates
        [425, 142, 3],
        [669, 142, 3],
        [913, 142, 3],
        [1157, 142, 3],
        [1401, 142, 3]
    ];
    this.Line = Array.from({length: 20}, (_, i) => i + 1); // Creature has 20 fixed paylines
    this.gameLine = Array.from({length: 20}, (_, i) => i + 1);
  }

  // Implement methods from SlotSettings.php, adapting as needed
  // (Many will be similar to AfricanKingNG's SlotSettings.ts)

  public is_active(): boolean {
    // Simplified version
    if (this.game && this.shop && this.user) {
      if (!this.game.view || this.shop.is_blocked || this.user.is_blocked || this.user.status === VanguardLTE.Support.Enum.UserStatus.BANNED) {
        if (this.user && this.user.id) {
            VanguardLTE.Session.where('user_id', this.user.id).delete();
            console.log(`Simulating session clear for user ${this.user.id}`);
        }
        return false;
      }
    }
    if (this.game && !this.game.view) return false;
    if (this.shop && this.shop.is_blocked) return false;
    if (this.user && this.user.is_blocked) return false;
    if (this.user && this.user.status === VanguardLTE.Support.Enum.UserStatus.BANNED) return false;
    return true;
  }

  public SetGameData(key: string, value: any): void {
    const timeLife = 86400; // 24 hours
    this.gameData[key] = {
      timelife: Math.floor(Date.now() / 1000) + timeLife,
      payload: value,
    };
  }

  public GetGameData(key: string): any | 0 {
    if (this.gameData.hasOwnProperty(key) && this.gameData[key].timelife > Math.floor(Date.now() / 1000)) {
      return this.gameData[key].payload;
    }
    // Clean up expired data
    if (this.gameData.hasOwnProperty(key) && this.gameData[key].timelife <= Math.floor(Date.now() / 1000)) {
        delete this.gameData[key];
    }
    return 0;
  }

  public HasGameData(key: string): boolean {
    return this.gameData.hasOwnProperty(key) && this.gameData[key].timelife > Math.floor(Date.now() / 1000);
  }

  public SaveGameData(): void {
    // Stubbed: Persist this.gameData (e.g., to user session in DB)
    if (this.user) {
        // this.user.session = JSON.stringify(this.gameData);
        // UserModel.update(this.user);
        console.log('Simulating saving game data for user:', this.user.id);
    }
     for (const key in this.gameData) { // Cleanup
        if (this.gameData[key].timelife <= Math.floor(Date.now() / 1000)) {
            delete this.gameData[key];
        }
    }
  }

  public SetGameDataStatic(key: string, value: any): void {
    const timeLife = 86400; // 24 hours
    this.gameDataStatic[key] = {
      timelife: Math.floor(Date.now() / 1000) + timeLife,
      payload: value,
    };
  }

  public GetGameDataStatic(key: string): any | 0 {
    if (this.gameDataStatic.hasOwnProperty(key) && this.gameDataStatic[key].timelife > Math.floor(Date.now() / 1000)) {
      return this.gameDataStatic[key].payload;
    }
    if (this.gameDataStatic.hasOwnProperty(key) && this.gameDataStatic[key].timelife <= Math.floor(Date.now() / 1000)) {
        delete this.gameDataStatic[key];
    }
    return 0;
  }

  public HasGameDataStatic(key: string): boolean {
     return this.gameDataStatic.hasOwnProperty(key) && this.gameDataStatic[key].timelife > Math.floor(Date.now() / 1000);
  }

  public SaveGameDataStatic(): void {
    // Stubbed: Persist this.gameDataStatic (e.g., to game settings in DB)
    if (this.game) {
        // this.game.advanced = JSON.stringify(this.gameDataStatic);
        // GameModel.update(this.game);
        console.log('Simulating saving static game data for game:', this.game.id);
    }
    for (const key in this.gameDataStatic) { // Cleanup
        if (this.gameDataStatic[key].timelife <= Math.floor(Date.now() / 1000)) {
            delete this.gameDataStatic[key];
        }
    }
  }

  public FormatFloat(num: number): number {
    const strNum = String(num);
    const str0 = strNum.split('.');
    if (str0.length > 1) {
      if (str0[1].length > 4) return Math.round(num * 100) / 100;
      if (str0[1].length > 2) return Math.floor(num * 100) / 100;
    }
    return num;
  }

  public GetBalance(): number {
    if (this.user && typeof this.user.balance !== 'undefined' && this.CurrentDenom > 0) {
        this.Balance = this.user.balance / this.CurrentDenom;
    } else if (this.Balance === null) { // if user is not loaded, use internal
        this.Balance = 0;
    }
    return this.Balance!;
  }

  public SetBalance(sum: number, slotEvent: string = ''): /* User | null */ any {
    if (this.Balance === null) this.Balance = 0;
    if (this.CurrentDenom === null || this.CurrentDenom === 0) this.CurrentDenom = 1;

    if (this.Balance + sum < 0 && slotEvent !== 'bet') { // Allow bet to make balance negative temporarily before charge
      this.InternalError(`Balance_   ${sum}. Current Balance: ${this.Balance}. Event: ${slotEvent}`);
      return this.user;
    }

    const sumInCurrency = sum * this.CurrentDenom;

    if (this.user) {
      this.user.balance = (this.user.balance || 0) + sumInCurrency;
      this.user.balance = this.FormatFloat(this.user.balance);
      this.Balance = this.user.balance / this.CurrentDenom;
      // console.log(`Simulating setting balance for user ${this.user.id}. New balance: ${this.user.balance}`);
    } else {
      this.Balance += sum;
      this.Balance = this.FormatFloat(this.Balance);
    }
    return this.user;
  }

  public GetBank(slotState: string = ''): number {
    // Stubbed
    let currentBank = 100000; // Default high value
    if (this.game && typeof this.game.get_gamebank === 'function') {
        currentBank = this.game.get_gamebank(slotState);
    } else if (this.Bank !== null) {
        currentBank = this.Bank;
    }
    return currentBank / (this.CurrentDenom || 1);
  }

  public SetBank(slotState: string = '', sum: number, slotEvent: string = ''): /* Game | null */ any {
    // Stubbed
    let actualSum = sum * (this.CurrentDenom || 1);
     if (this.isBonusStart || slotState === 'bonus' || slotState === 'freespin' || slotState === 'respin' ) {
      slotState = 'bonus';
    } else {
      slotState = '';
    }
    // Complex bank logic from PHP (toGameBanks, betProfit etc.) would go here if fully implemented
    if (this.game && typeof this.game.set_gamebank === 'function') {
        this.game.set_gamebank(actualSum, 'inc', slotState);
        // console.log(`Simulating setting bank for game ${this.game.id}.`);
    } else {
        if (this.Bank === null) this.Bank = 0;
        this.Bank += actualSum;
    }
    return this.game;
  }

  public GetPercent(): number {
    return this.Percent !== null ? this.Percent : 95; // Default to 95% if not set
  }

  public GetHistory(): any | 'NULL' {
    this.lastEvent = 'NULL';
    console.warn("GetHistory() is stubbed. Needs database implementation.");
    return 'NULL';
  }

  public UpdateJackpots(bet: number): void {
    // Stubbed for CreatureFromTheBlackLagoonNET as it doesn't have progressive jackpots in the same way by default.
    // If JPGs are used, this logic would be similar to AfricanKingNG.
    console.warn("UpdateJackpots() is stubbed for Creature.");
    if (this.jpgs && this.jpgs.length > 0) {
        // Jackpot logic as in AfricanKingNG if applicable
    }
  }

  public SaveLogReport(spinSymbols: any, bet: number, lines: number, win: number, slotState: string): void {
    console.warn("SaveLogReport() is stubbed. Needs DB implementation.");
  }

  public GetSpinSettings(garantType: 'bet' | 'bonus' = 'bet', bet: number, lines: number): [string, number] {
    this.AllBet = bet * lines;
    // Simplified win chance logic for Creature
    // These values would typically come from game configuration or be calculated based on RTP.
    const currentSpinWinChance = 10; // Example: 1 in 10 spins could be a win
    const currentBonusWinChance = 150; // Example: 1 in 150 spins could trigger bonus (FS)

    // RTP control logic from PHP is complex and stateful (SpinWinLimit, RtpControlCount)
    // This requires GetGameDataStatic/SetGameDataStatic. Simplified for now.
    // if (this.GetGameDataStatic('SpinWinLimit') > 0 && garantType === 'bet') {
    //     console.log("SpinWinLimit active, affecting win chances.");
    // }

    const bonusWinRoll = Math.floor(Math.random() * currentBonusWinChance) + 1;
    const spinWinRoll = Math.floor(Math.random() * currentSpinWinChance) + 1;

    let returnType: string = 'none';
    let winLimit: number = 0;

    if (bonusWinRoll === 1 && this.slotBonus) {
      this.isBonusStart = true; // Flag that a bonus round is initiated
      const currentGarantType = 'bonus';
      winLimit = this.GetBank(currentGarantType); // Get available bank for bonus

      // Check if bank can cover a potential average bonus win
      const estimatedBonusWin = this.CheckBonusWin() * bet; // CheckBonusWin might need to be adapted for Creature
      if (winLimit >= estimatedBonusWin) {
        returnType = 'bonus';
      } else {
        this.isBonusStart = false; // Not enough in bank for bonus, revert
        // Fallback to 'win' or 'none'
        if (spinWinRoll === 1) {
            winLimit = this.GetBank(garantType);
            returnType = 'win';
        } else {
            returnType = 'none';
        }
      }
    } else if (spinWinRoll === 1) {
      winLimit = this.GetBank(garantType);
      returnType = 'win';
    }

    // Low balance check (from AfricanKing, might apply)
    // if (garantType === 'bet' && this.GetBalance() * (this.CurrentDenom || 1) <= 2) {
    //     if (Math.random() < 0.1) {
    //         winLimit = this.GetBank('');
    //         returnType = 'win';
    //         console.log("Low balance, potential forced win.");
    //     }
    // }
    // console.log(`SpinSettings: Type=${returnType}, Limit=${winLimit}, AllBet=${this.AllBet}`);
    return [returnType, winLimit];
  }

  // CheckBonusWin: Calculates an average payout for bonus to check against bank.
  // This might need significant adjustment for Creature's specific bonus features (Spreading Wilds etc.)
  // For now, a generic version based on paytable.
  public CheckBonusWin(): number {
    let allRateCnt = 0;
    let allRate = 0;
    for (const symbolKey in this.Paytable) {
      // Only consider actual paying symbols, not wilds or special symbols if they don't have direct payouts
      if (symbolKey.startsWith("SYM_") && !['SYM_0', 'SYM_1', 'SYM_2'].includes(symbolKey)) { // Exclude wilds
        const pays = this.Paytable[symbolKey];
        // Consider mid-tier payouts for average estimation
        if (pays[3] > 0) { // Payout for 3 symbols
            allRateCnt++;
            allRate += pays[3];
        } else if (pays[4] > 0) { // or 4 symbols
             allRateCnt++;
             allRate += pays[4];
        }
      }
    }
    return allRateCnt > 0 ? allRate / allRateCnt : 50; // Default average if paytable is sparse for this calc
  }

  public GetReelStrips(winType: string, slotEvent: string): { rp: number[], [key: string]: string[] } {
    const isFreespin = slotEvent === 'freespin' || slotEvent === 'respin'; // Creature has respins too

    let reelSet = {
        reelStrip1: isFreespin && this.reelStripBonus1?.length ? this.reelStripBonus1 : this.reelStrip1,
        reelStrip2: isFreespin && this.reelStripBonus2?.length ? this.reelStripBonus2 : this.reelStrip2,
        reelStrip3: isFreespin && this.reelStripBonus3?.length ? this.reelStripBonus3 : this.reelStrip3,
        reelStrip4: isFreespin && this.reelStripBonus4?.length ? this.reelStripBonus4 : this.reelStrip4,
        reelStrip5: isFreespin && this.reelStripBonus5?.length ? this.reelStripBonus5 : this.reelStrip5,
    };

    const reelsConfigCount = 5; // 5 reels
    const reelPositions: number[] = [];
    const resultReels: { rp: number[], [key: string]: string[] } = { rp: [] };

    // Scatter symbols for Creature: '11', '12', '13' (Free Spin symbols)
    // Wild symbols: '0', '1', '2' (Creature, Spreading Wild 1, Spreading Wild 2)
    // GetRandomScatterPos was for a generic scatter '0' or '9'. Creature needs specific handling if forcing bonus.

    if (winType === 'bonus') {
        // Forcing a bonus trigger (e.g., 3+ Free Spin symbols)
        // This logic needs to be specific to how Creature triggers its Free Spins.
        // It usually requires 3, 4, or 5 scatter symbols ('11', '12', '13') to land.
        // The PHP GetRandomScatterPos is not directly applicable.
        // Simplified: place 3 scatters randomly for bonus trigger simulation.
        const scatterSymbolToPlace = '11'; // Use one of the scatter types
        let placedScatters = 0;
        const scatterPositionsOnReels: number[] = [-1,-1,-1,-1,-1];

        // Try to place 3 scatters on different reels
        const reelsToPlaceScatter = [0,1,2,3,4].sort(() => 0.5 - Math.random()).slice(0,3);

        for (let i = 0; i < reelsConfigCount; i++) {
            const currentReelKey = `reelStrip${i + 1}` as keyof typeof reelSet;
            const currentReelStrip = reelSet[currentReelKey];
            if (currentReelStrip && currentReelStrip.length > 0) {
                if (reelsToPlaceScatter.includes(i)) {
                    let scatterPos = -1;
                    for(let j=0; j < currentReelStrip.length -2; j++){ // find first occurrence of scatter
                        if(currentReelStrip[j] === scatterSymbolToPlace){
                            scatterPos = j;
                            break;
                        }
                    }
                    if(scatterPos === -1) scatterPos = Math.floor(Math.random() * (currentReelStrip.length - 2)); // fallback
                    reelPositions[i] = scatterPos;
                    scatterPositionsOnReels[i] = scatterPos; // mark position of scatter
                } else {
                    reelPositions[i] = Math.floor(Math.random() * (currentReelStrip.length - 2));
                }
            } else {
                reelPositions[i] = 0;
            }
        }
    } else { // Regular spin or non-bonus win
        for (let i = 1; i <= reelsConfigCount; i++) {
            const currentReelKey = `reelStrip${i}` as keyof typeof reelSet;
            const currentReelStrip = reelSet[currentReelKey];
            if (currentReelStrip && currentReelStrip.length > 2) {
                reelPositions.push(Math.floor(Math.random() * (currentReelStrip.length - 2)));
            } else {
                reelPositions.push(0);
            }
        }
    }

    resultReels.rp = [...reelPositions];

    for (let i = 1; i <= reelsConfigCount; i++) {
        const currentReelKey = `reelStrip${i}` as keyof typeof reelSet;
        const strip = reelSet[currentReelKey];
        const pos = reelPositions[i-1];

        if (strip && strip.length > 2) {
            const symbol1 = strip[(pos - 1 + strip.length) % strip.length];
            const symbol2 = strip[pos % strip.length];
            const symbol3 = strip[(pos + 1) % strip.length];
            resultReels[`reel${i}`] = [symbol1, symbol2, symbol3, ''];
        } else {
            resultReels[`reel${i}`] = ['3', '4', '5', '']; // Fallback with some common symbols
        }
    }
    return resultReels;
  }

  public InternalErrorSilent(errcode: string | Error): void {
    const errorMessage = errcode instanceof Error ? errcode.message : errcode;
    const errorData = {
      responseEvent: "error",
      responseType: errorMessage,
      serverResponse: "InternalError",
    };
    console.error(`InternalErrorSilent: ${errorMessage}`, errorData);
  }

  public InternalError(errcode: string | Error): void {
    this.InternalErrorSilent(errcode);
    // In PHP, this exits. Behavior might differ in TS (e.g., throw error).
    console.error(`InternalError: ${errcode instanceof Error ? errcode.message : errcode} - Execution would typically stop here in PHP.`);
    // throw new Error(errcode instanceof Error ? errcode.message : errcode); // Option to throw
  }

  // GetRandomPay, GetGambleSettings are not typically used in NetEnt games like Creature.
  // If they were, their logic would be similar to AfricanKingNG.
  // For now, they can be omitted or return default values if called.
  public GetRandomPay(): number {
      // Creature doesn't use this typically.
      // Fallback or specific logic if needed.
      let allRate: number[] = [];
      this.Paytable['SYM_3']?.forEach(p => {if(p>0) allRate.push(p)}); // Example using Kay symbol
      if(allRate.length === 0) return 0;
      return allRate[Math.floor(Math.random()*allRate.length)];
  }

  public GetGambleSettings(): number {
      // Creature has no gamble feature.
      return 0; // Indicates no gamble or win always if logic depends on it.
  }
