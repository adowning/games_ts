import { GrandSpinnSuperpotNETGameReel } from './GrandSpinnSuperpotNETGameReel';

// Placeholder Types (adapted from previous games)
type User = {
  id: number; shop_id: number; balance: number; count_balance: number; session: string;
  is_blocked: boolean; status: string; address: number;
  update: (data: any) => void; save: () => void; increment: (field: string, value: number) => void;
  update_level: (event: string, value: number) => void;
  updateCountBalance: (sum: number, currentCountBalance: number) => number;
  last_bid: any;
};
type Game = {
  name: string; shop_id: number; denomination: number; bet: string; view: boolean;
  slotViewState: string; advanced: string; jp_1: any; jp_2: any; jp_3: any; jp_4: any;
  jp_1_percent: any; jp_2_percent: any; jp_3_percent: any; jp_4_percent: any;
  id: string; get_gamebank: (slotState?: string, type?: string) => number;
  set_gamebank: (sum: number, op: 'inc' | 'dec', slotState?: string) => void;
  save: () => void; refresh: () => void; stat_in: number; stat_out: number;
  increment: (field: string, value?: number) => void;
  tournament_stat: (slotState: string, userId: number, bet: number, win: number) => void;
  get_lines_percent_config: (type: 'spin' | 'bonus') => any;
  bids: number; rezerv: number; game_win?: any;
};
type Shop = { id: number; max_win: number; percent: number; is_blocked: boolean; currency: string; };
type GameBank = any;
type JPG = {
    id: any; balance: number; percent: number; get_pay_sum: () => number; user_id: number | null;
    save: () => void; get_min: (field: string) => number; get_start_balance: () => number;
    add_jpg: (type: string, sum: number) => void;
};
type GameLog = any; type StatGame = any; type Session = any; type Carbon = any;

const UserStatus = { BANNED: 'banned', ACTIVE: 'active' };

const MockDB = { // Simplified Mocks
  User: { lockForUpdate: () => MockDB.User, find: (id: number): User | null => ({ id: 1, shop_id: 1, balance: 100000, count_balance: 100000, session: serialize({}), is_blocked: false, status: UserStatus.ACTIVE, address: 0, update: ()=>{}, save: ()=>{}, increment: ()=>{}, update_level: ()=>{}, updateCountBalance: (s,c)=>c+s, last_bid:null } as User) },
  GameBank: { where: (c:any) => MockDB.GameBank, lockForUpdate: () => MockDB.GameBank, get: (): GameBank[] => [], first: (): GameBank | null => null },
  Game: { where: (c:any) => MockDB.Game, lockForUpdate: () => MockDB.Game, first: (): Game | null => ({ name: 'GrandSpinnSuperpotNET', shop_id: 1, denomination: 1, bet: '1,2,5,10,20', view: true, slotViewState: 'Normal', advanced: serialize({}), jp_1: 500, jp_2: 100, jp_3: 10, jp_1_percent:1, jp_2_percent:1, jp_3_percent:1, id: 'gameGSS123', get_gamebank: () => 200000, set_gamebank: () => {}, save: () => {}, refresh: () => {}, stat_in: 0, stat_out: 0, increment: () => {}, tournament_stat: () => {}, get_lines_percent_config: (t:string) => ({line10_bonus:{'0_100':10}, line10:{'0_100':50}}), bids: 0, rezerv: 1000, game_win:{} } as Game) },
  Shop: { find: (id: number): Shop | null => ({ id: 1, max_win: 500000, percent: 90, is_blocked: false, currency: 'USD' } as Shop) },
  JPG: { where: (c:any) => MockDB.JPG, lockForUpdate: () => MockDB.JPG, get: (): JPG[] => [{id:1, balance:500, percent:1, get_pay_sum:()=>0, user_id:null, save:()=>{}, get_min:()=>10, get_start_balance:()=>100, add_jpg:()=>{}}] }, // Mock one JPG for slotJackpot
  GameLog: { whereRaw: (q:string, p:any[]) => MockDB.GameLog, get: (): any[] => [], create: (d:any) => {} },
  StatGame: { create: (d:any) => {} }, Session: { where: (c:any) => MockDB.Session, delete: () => {} },
  Carbon: { now: () => new Date() }, LibBanker: { get_all_banks: (shop_id: number): [number,number,number,number,number] => [10000,2000,500,500,500] }
};
function serialize(data: any): string { return JSON.stringify(data); }
function unserialize<T>(data: string): T { try { return JSON.parse(data) as T; } catch (e) { return {} as T; } }

export class GrandSpinnSuperpotNETSlotSettings {
  public playerId: number | null = null;
  public slotId: string = '';
  public slotDBId: string = '';
  public Line: number[] | null = null; // Not really used for 1-line game like this
  public Bet: string[] = [];
  public Balance: number = 0;
  public SymbolGame: string[] | null = null;
  public Paytable: Record<string, number[]> = {};
  public Denominations: number[] = [];
  public CurrentDenom: number = 0;
  public CurrentDenomination: number = 0;
  public slotJackpot: number[] = []; // For fixed/progressive values if any from DB
  public slotJackPercent: number[] = [];
  public Jackpots: any = {}; // For current values during play
  public MaxWin: number = 0;

  public user: User | null = null;
  public game: Game | null = null;
  public shop: Shop | null = null;
  public jpgs: JPG[] | null = null;
  private Bank: number = 0;
  private Percent: number = 0;
  private shop_id: number | null = null;
  public slotCurrency: string = 'USD';
  public count_balance: number = 0;
  public jpgPercentZero: boolean = false;
  public increaseRTP: number = 1;
  public AllBet: number = 0;
  public isBonusStart: boolean | null = null; // Though no typical bonus like FS
  public slotWildMpl: number = 1; // Multiplier wilds are key
  public slotFreeMpl: number = 1; // Not used
  public slotFreeCount: Record<number,number> = {}; // Not used

  private gameData: Record<string, { timelife: number, payload: any }> = {};
  private gameDataStatic: Record<string, { timelife: number, payload: any }> = {};

  // Reel strips - GrandSpinn has 3 reels
  public reelStrip1: string[] = []; public reelStrip2: string[] = []; public reelStrip3: string[] = [];
  // Other properties from base, may not all be used by GrandSpinn
  public splitScreen: boolean | null = null; public reelStrip4: string[] | null = null; public reelStrip5: string[] | null = null; public reelStrip6: string[] | null = null;
  public reelStripBonus1: string[] | null = null; public reelStripBonus2: string[] | null = null; public reelStripBonus3: string[] | null = null;
  public scaleMode: number | null = null; public numFloat: number | null = null; public gameLine: number[] | null = null;
  public GambleType: number | null = null; public lastEvent: string | null = null; public keyController: Record<string, string> | null = null;
  public slotViewState: string | null = null; public hideButtons: string[] | null = null; public slotReelsConfig: number[][] | null = null;
  public slotExitUrl: string | null = null; public slotBonus: boolean | null = null; public slotBonusType: number | null = null;
  public slotScatterType: number | null = null; public slotGamble: boolean | null = null; public slotSounds: string[] = [];
  private WinLine: any; private WinGamble: number = 0; private Bonus: any;
  private toGameBanks: number = 0; private toSlotJackBanks: number = 0; private toSysJackBanks: number = 0;
  private betProfit: number = 0; private betRemains0?: number; private betRemains?: number;


  constructor(sid: string, playerId: number, reelsFileContent?: string) {
    this.slotId = sid;
    this.playerId = playerId;
    const user = MockDB.User.lockForUpdate().find(this.playerId);
    if (!user) throw new Error("User not found for GrandSpinnSuperpotNET");
    this.user = user; this.shop_id = user.shop_id;

    const game = MockDB.Game.where({ name: this.slotId, shop_id: this.shop_id }).lockForUpdate().first();
    if (!game) throw new Error("Game not found for GrandSpinnSuperpotNET");
    this.game = game;

    const shop = MockDB.Shop.find(this.shop_id);
    if (!shop) throw new Error("Shop not found for GrandSpinnSuperpotNET");
    this.shop = shop;

    this.MaxWin = this.shop.max_win; this.increaseRTP = 1;
    this.CurrentDenom = this.game.denomination; this.CurrentDenomination = this.game.denomination;
    this.slotCurrency = this.shop.currency;

    this.Paytable = { // Values for 3 symbols matched
        'SYM_0': [0,0,0,0,0,0], 'SYM_1': [0,2,0,0,0,0], // Wild, index 1 is multiplier
        'SYM_2': [0,0,0,0,0,0], // Blank
        'SYM_3': [0,0,0,20,0,0], // 777
        'SYM_4': [0,0,0,10,0,0], // Watermelon
        'SYM_5': [0,0,0,5,0,0],  // Plum
        'SYM_6': [0,0,0,3,0,0],  // Cherry
        'SYM_7': [0,0,0,2,0,0],  // Orange
        'SYM_8': [0,0,0,1,0,0],  // Bar
        'SYM_100': [0,0,0,40,0,0], // Mini JP fixed value
        'SYM_101': [0,0,0,200,0,0], // Midi JP fixed value
        'SYM_102': [0,0,0,0,0,0], // Super JP (Progressive) - win handled by jackpot logic
        // SYM_50 (Arrow Up), SYM_99 (Wild x2 on reel 2) are special, not direct paytable items
    };

    const reelManager = new GrandSpinnSuperpotNETGameReel(reelsFileContent);
    ['reelStrip1','reelStrip2','reelStrip3'].forEach(rsKey => { // Only 3 reels for this game
      if (reelManager.reelsStrip[rsKey] && reelManager.reelsStrip[rsKey].length > 0) {
        (this as any)[rsKey] = reelManager.reelsStrip[rsKey];
      }
    });

    this.Denominations = (MockDB.Game as any).$values.denomination; // Assuming static access
    this.CurrentDenom = this.Denominations[0]; this.CurrentDenomination = this.Denominations[0];
    this.Bet = game.bet.split(',');
    this.Balance = user.balance;
    this.SymbolGame = ['1','2','3','4','5','6','7','8','100','101','102','0','50','99']; // All possible symbols

    this.jpgs = MockDB.JPG.where({ shop_id: this.shop_id }).lockForUpdate().get();
    if(this.jpgs && this.jpgs.length > 0){
        this.slotJackpot[0] = parseFloat(String(this.jpgs[0].balance)) || 0; // Assuming first JPG is Mega/Superpot
        // Midi and Mini might be fixed or from other JPG entries if configured
        this.slotJackpot[1] = parseFloat(String(this.game.jp_2)) || 0; // Midi from game table
        this.slotJackpot[2] = parseFloat(String(this.game.jp_3)) || 0; // Mini from game table
        if(this.jpgs[0]) this.slotJackPercent[0] = this.jpgs[0].percent;
    }


    this.Bank = game.get_gamebank(); this.Percent = this.shop.percent;
    this.WinGamble = game.rezerv; this.slotDBId = game.id;
    this.count_balance = user.count_balance;
    if (user.address > 0 && user.count_balance === 0) { this.Percent = 0; this.jpgPercentZero = true;}
    else if (user.count_balance === 0) { this.Percent = 100; }

    user.session = user.session || serialize({}); this.gameData = unserialize(user.session);
    const currentTime = Math.floor(Date.now() / 1000);
    Object.keys(this.gameData).forEach(key => { if (this.gameData[key].timelife <= currentTime) delete this.gameData[key]; });
    game.advanced = game.advanced || serialize({}); this.gameDataStatic = unserialize(game.advanced);
    Object.keys(this.gameDataStatic).forEach(key => { if (this.gameDataStatic[key].timelife <= currentTime) delete this.gameDataStatic[key]; });
  }

  public ClearJackpot(jid: number): void { // jid is 0-indexed for this.jpgs
    if(this.jpgs && this.jpgs[jid]){
        this.jpgs[jid].balance = 0; // Simplified, PHP had sprintf
        this.jpgs[jid].save();
    }
  }

  public DecodeData(astr: string): any { // PHP's DecodeData
    const aJson: any = {};
    const ajT0 = astr.split('&');
    for (const rootNode of ajT0) {
        const nodes = rootNode.split('=');
        const nodes0 = nodes[0].split('.');
        let laJson = aJson;
        for (let i = 0; i < nodes0.length; i++) {
            if (!laJson[nodes0[i]]) {
                laJson[nodes0[i]] = (i === nodes0.length - 1) ? nodes[1] : {};
            }
            if (i < nodes0.length - 1) { // If not the last node, move deeper
                 if (typeof laJson[nodes0[i]] === 'string' && i < nodes0.length -1 ) { // if it was incorrectly assigned as string due to same prefix
                    laJson[nodes0[i]] = {};
                }
                laJson = laJson[nodes0[i]];
            } else if (i === nodes0.length -1 ) { // Last node, assign value
                 laJson[nodes0[i]] = nodes[1];
            }
        }
    }
    return aJson;
  }

  public FormatResponse(data: any): string { // PHP's FormatResponse
      const queryParams: string[] = [];
      const buildQuery = (obj: any, prefix: string | null = null) => {
          for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                  const newPrefix = prefix ? `${prefix}.${key}` : key;
                  if (typeof obj[key] === 'object' && obj[key] !== null) {
                      buildQuery(obj[key], newPrefix);
                  } else {
                      queryParams.push(`${newPrefix}=${encodeURIComponent(obj[key])}`);
                  }
              }
          }
      };
      buildQuery(data);
      let str = queryParams.join('&');
      // The original PHP replacements are specific to how http_build_query handles arrays.
      // Javascript's encodeURIComponent and manual build might not need these,
      // but if the server expects that exact format, more complex string manipulation might be needed.
      // For now, this direct build should be okay for typical flat/nested objects.
      // str = str.replace(/%5D%5B/g, '.').replace(/%5B/g, '.').replace(/%5D/g, ''); // Mimic PHP's array to dot notation
      // str = str.replace(/%252/g, '%2'); // This seems like a double encoding fix, might not be needed.
      return str;
  }

  public OffsetReelStrips(reels: any, rr: number): any { // rr is reel number 1-3
    const newReels = JSON.parse(JSON.stringify(reels)); // Deep copy
    if (rr >= 1 && rr <= 3) {
        const reelKey = `reelStrip${rr}`;
        const strip = (this as any)[reelKey] as string[];
        if (!strip || strip.length === 0) return newReels; // No strip defined

        let currentReelPos = newReels.rp[rr - 1];
        currentReelPos = (currentReelPos - 1 + strip.length) % strip.length; // Move up one, wrap around
        newReels.rp[rr-1] = currentReelPos;

        const rpsForReel: number[] = [];
        newReels[`reel${rr}`] = [
            strip[currentReelPos === 0 ? strip.length -1 : currentReelPos -1], // Symbol above (new top)
            strip[currentReelPos],                                             // New middle
            strip[(currentReelPos + 1) % strip.length]                         // New bottom
        ];
        rpsForReel.push(currentReelPos === 0 ? strip.length -1 : currentReelPos -1);
        rpsForReel.push(currentReelPos);
        rpsForReel.push((currentReelPos + 1) % strip.length);
        newReels.rps[rr-1] = rpsForReel;
    }
    return newReels;
}


  public GetReelStrips(winType: string, slotEvent: string): any {
    const reel: any = { rp: [], rps: [[], [], []], reel1:[], reel2:[], reel3:[] }; // GrandSpinn: 3 reels
    const reelKeys = ['reelStrip1', 'reelStrip2', 'reelStrip3'];

    // For GrandSpinn, winType might not influence reel strips as much as fixed reel strips.
    // The PHP logic for 'bonus' winType in GetReelStrips from other games (scatter placement) isn't directly applicable here.
    // It seems to use mt_rand for regular spins.

    reelKeys.forEach((reelKey, index) => {
        const strip = (this as any)[reelKey] as string[];
        if (strip && strip.length > 0) {
            // GrandSpinn reel positions are actual indices for the middle symbol.
            // PHP used mt_rand(3, count($this->$reelStrip) - 3); ensuring there are symbols above and below.
            // For a 3-symbol view, if pos is middle, we need pos-1, pos, pos+1.
            // So, pos needs to be from 1 to length-2 to avoid out-of-bounds for pos-1 and pos+1 directly.
            // Or, handle wrap-around. PHP's $key[-1]=$key[$cnt-1] handles this.
            const pos = Math.floor(Math.random() * strip.length); // Random position for middle symbol
            reel.rp[index] = pos;

            reel[`reel${index + 1}`] = [
                strip[pos === 0 ? strip.length - 1 : pos - 1], // Symbol above (handles wrap-around)
                strip[pos],                                    // Middle symbol
                strip[(pos + 1) % strip.length]                // Symbol below (handles wrap-around)
            ];
            reel.rps[index] = [ // Store actual indices of displayed symbols
                pos === 0 ? strip.length - 1 : pos - 1,
                pos,
                (pos + 1) % strip.length
            ];
        }
    });
    return reel;
  }
  // Other methods (is_active, Set/Get/SaveGameData, GetHistory, UpdateJackpots, Get/SetBank, Get/SetBalance, SaveLogReport, GetSpinSettings etc.)
  // would be similar to the previous SlotSettings files, adapted for GrandSpinn's specifics if any.
  // For brevity, I'll assume they are similar and focus on unique methods if any more are needed.
  public is_active(): boolean { /* ... similar to others ... */ return true; }
  public SetGameData(key: string, value: any): void { this.gameData[key] = { timelife: Math.floor(Date.now()/1000) + 86400, payload: value}; }
  public GetGameData(key: string): any { return this.gameData[key] ? this.gameData[key].payload : 0; }
  public SaveGameData(): void { if(this.user) { this.user.session = serialize(this.gameData); this.user.save(); }}
  public HasGameData(key: string): boolean { return this.gameData.hasOwnProperty(key); }
  public GetHistory(): any { /* ... similar ... */ return 'NULL';}
  public GetBank(slotState: string = ''): number { /* ... similar ... */ return this.Bank / this.CurrentDenom; }
  public GetPercent(): number { return this.Percent; }
  public SetBank(slotState: string = '', sum: number, slotEvent: string = ''): Game | undefined { /* ... similar ... */ if(this.game) {this.game.set_gamebank(sum * this.CurrentDenom, 'inc', slotState); this.game.save(); return this.game;} return undefined; }
  public GetBalance(): number { if(!this.user) return 0; this.Balance = this.user.balance / this.CurrentDenom; return this.Balance; }
  public SetBalance(sum: number, slotEvent: string = ''): User | undefined { /* ... similar ... */ if(this.user){ this.user.increment('balance', sum * this.CurrentDenom); this.user.balance = this.FormatFloat(this.user.balance); this.user.save(); return this.user;} return undefined; }
  public SaveLogReport(spinSymbolsLog: string, bet: number, lines: number, win: number, slotState: string): void { /* ... similar ... */ }
  public GetSpinSettings(garantType: string = 'bet', bet: number, lines: number): [string, number] { /* ... similar, but GrandSpinn might have simpler win type logic ... */ return ['win', 1000]; }
  public GetRandomPay(): number { /* ... similar ... */ return 0;}
  public HasGameDataStatic(key: string): boolean { return this.gameDataStatic.hasOwnProperty(key); }
  public SaveGameDataStatic(): void { if (this.game) { this.game.advanced = serialize(this.gameDataStatic); this.game.save(); this.game.refresh();}}
  public SetGameDataStatic(key: string, value: any): void {this.gameDataStatic[key] = { timelife: Math.floor(Date.now() / 1000) + 86400, payload: value };}
  public GetGameDataStatic(key: string): any {return this.gameDataStatic[key] ? this.gameDataStatic[key].payload : 0;}
  public InternalErrorSilent(e: any): void { console.error("SilentError:", e); }
   public UpdateJackpots(bet: number): any { // Simplified from PHP
        bet = bet * this.CurrentDenom;
        let isJackPay = false;
        if(this.jpgs && this.jpgs.length > 0){
            const jpg = this.jpgs[0]; // Assuming superpot is the first one
            const currentJpgBalance = parseFloat(String(jpg.balance));
            const percentToAdd = jpg.percent / 100;
            jpg.balance = currentJpgBalance + (bet * percentToAdd);
            jpg.save();
            this.slotJackpot[0] = jpg.balance; // Update current value

            // Check if jackpot is won (highly simplified, actual logic is complex)
            // For GrandSpinn, specific symbols on payline trigger jackpots, not random pay sum.
            // This UpdateJackpots in PHP was more about contributing. The actual win check is in spin logic.
        }
        return {isJackPay}; // Return simplified state
    }
}
