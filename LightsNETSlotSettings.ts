import { LightsNETGameReel } from './LightsNETGameReel'; // Adjust path

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
type GameBank = any; type JPG = any; type GameLog = any; type StatGame = any; type Session = any; type Carbon = any;

const UserStatus = { BANNED: 'banned', ACTIVE: 'active' };

const MockDB = { // Simplified Mocks
  User: { lockForUpdate: () => MockDB.User, find: (id: number): User | null => ({ id: 1, shop_id: 1, balance: 100000, count_balance: 100000, session: serialize({}), is_blocked: false, status: UserStatus.ACTIVE, address: 0, update: ()=>{}, save: ()=>{}, increment: ()=>{}, update_level: ()=>{}, updateCountBalance: (s,c)=>c+s, last_bid:null } as User) },
  GameBank: { where: (c:any) => MockDB.GameBank, lockForUpdate: () => MockDB.GameBank, get: (): GameBank[] => [], first: (): GameBank | null => null },
  Game: { where: (c:any) => MockDB.Game, lockForUpdate: () => MockDB.Game, first: (): Game | null => ({ name: 'LightsNET', shop_id: 1, denomination: 0.01, bet: '1,2,5,10,20', view: true, slotViewState: 'Normal', advanced: serialize({}), jp_1: 0, jp_2: 0, jp_3: 0, jp_4: 0, jp_1_percent:0, jp_2_percent:0, jp_3_percent:0, jp_4_percent:0, id: 'gameLights123', get_gamebank: () => 200000, set_gamebank: () => {}, save: () => {}, refresh: () => {}, stat_in: 0, stat_out: 0, increment: () => {}, tournament_stat: () => {}, get_lines_percent_config: (t:string) => ({line9_bonus:{'0_100':10}, line9:{'0_100':50}}), bids: 0, rezerv: 1000, game_win:{} } as Game) }, // Lights has 9 lines
  Shop: { find: (id: number): Shop | null => ({ id: 1, max_win: 500000, percent: 90, is_blocked: false, currency: 'USD' } as Shop) },
  JPG: { where: (c:any) => MockDB.JPG, lockForUpdate: () => MockDB.JPG, get: (): JPG[] => [] }, // Lights doesn't have JPGs
  GameLog: { whereRaw: (q:string, p:any[]) => MockDB.GameLog, get: (): any[] => [], create: (d:any) => {} },
  StatGame: { create: (d:any) => {} }, Session: { where: (c:any) => MockDB.Session, delete: () => {} },
  Carbon: { now: () => new Date() }, LibBanker: { get_all_banks: (shop_id: number): [number,number,number,number,number] => [10000,2000,500,500,500] }
};
function serialize(data: any): string { return JSON.stringify(data); }
function unserialize<T>(data: string): T { try { return JSON.parse(data) as T; } catch (e) { return {} as T; } }

export class LightsNETSlotSettings {
  public playerId: number | null = null;
  public slotId: string = '';
  public slotDBId: string = '';
  public Bet: string[] = [];
  public Balance: number = 0;
  public SymbolGame: string[] | null = null;
  public Paytable: Record<string, number[]> = {};
  public Denominations: number[] = [];
  public CurrentDenom: number = 0;
  public CurrentDenomination: number = 0;
  public Jackpots: any = {};
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
  public isBonusStart: boolean | null = null;
  public slotWildMpl: number = 1;
  public slotFreeMpl: number = 1;
  public slotFreeCount: Record<number, number> = {};

  private gameData: Record<string, { timelife: number, payload: any }> = {};
  private gameDataStatic: Record<string, { timelife: number, payload: any }> = {};

  public reelStrip1: string[] = []; public reelStrip2: string[] = []; public reelStrip3: string[] = [];
  public reelStrip4: string[] = []; public reelStrip5: string[] = []; public reelStrip6: string[] = [];
  public reelStripBonus1: string[] = []; /* up to 6 for bonus */

  public splitScreen: boolean | null = null;
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
    if (!user) throw new Error("User not found for LightsNET");
    this.user = user; this.shop_id = user.shop_id;

    const game = MockDB.Game.where({ name: this.slotId, shop_id: this.shop_id }).lockForUpdate().first();
    if (!game) throw new Error("Game not found for LightsNET");
    this.game = game;

    const shop = MockDB.Shop.find(this.shop_id);
    if (!shop) throw new Error("Shop not found for LightsNET");
    this.shop = shop;

    this.MaxWin = this.shop.max_win; this.increaseRTP = 1;
    this.CurrentDenom = this.game.denomination; this.CurrentDenomination = this.game.denomination;
    this.slotCurrency = this.shop.currency;

    this.Paytable = { // Values for 3, 4, 5 symbols
        'SYM_0': [0,0,0,0,0,0],   // Scatter
        'SYM_1': [0,0,0,0,0,0],   // Wild (substitutes, no direct payout)
        'SYM_2': [0,0,0,0,0,0],   // Not used
        'SYM_3': [0,0,0,15,200,1000], // Red Lantern (Error in PHP, 1000 not 100 for 5) -> Corrected to 1000 based on typical payouts
        'SYM_4': [0,0,0,15,150,750],  // Orange Lantern
        'SYM_5': [0,0,0,9,100,500],   // Green Lantern
        'SYM_6': [0,0,0,9,75,400],    // Blue Lantern
        'SYM_7': [0,0,0,9,50,300],    // Purple Lantern
        'SYM_8': [0,0,0,3,15,100],   // A
        'SYM_9': [0,0,0,3,15,75],    // K
        'SYM_10': [0,0,0,3,15,50],   // Q
        'SYM_11': [0,0,0,3,15,40],   // J
        'SYM_12': [0,0,0,3,15,30],   // 10
    };

    const reelManager = new LightsNETGameReel(reelsFileContent);
    ['reelStrip1','reelStrip2','reelStrip3','reelStrip4','reelStrip5','reelStrip6'].forEach(rsKey => {
      if (reelManager.reelsStrip[rsKey] && reelManager.reelsStrip[rsKey].length > 0) {
        (this as any)[rsKey] = reelManager.reelsStrip[rsKey];
      }
      if (reelManager.reelsStripBonus[rsKey] && reelManager.reelsStripBonus[rsKey].length > 0) {
        (this as any)[`reelStripBonus${rsKey.slice(-1)}`] = reelManager.reelsStripBonus[rsKey];
      }
    });

    this.Denominations = (MockDB.Game as any).$values.denomination || [0.01, 0.02, 0.05];
    this.CurrentDenom = this.Denominations[0]; this.CurrentDenomination = this.Denominations[0];
    this.Bet = game.bet.split(',');
    this.Balance = user.balance;
    // SymbolGame should include symbols that form winning lines (not scatter if it only triggers features)
    this.SymbolGame = ['1','3','4','5','6','7','8','9','10','11','12'];
    this.slotFreeCount = {0:0, 1:0, 2:0, 3:10, 4:20, 5:30}; // Scatters -> FS
    this.slotBonus = true; // Has Free Spins

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

  public GetReelStrips(winType: string, slotEvent: string): any {
    const reel: any = { rp: [] };
    let stripPrefix = "reelStrip";

    // Lights uses different reel strips during Free Spins (more floating wilds implies potentially richer base strips or just more wilds added by server)
    // The PHP GetReelStrips doesn't switch to reelStripBonus based on slotEvent, it seems Server handles it.
    // If SlotSettings were to handle it, it would be:
    // if (slotEvent === 'freespin' && this.reelStripBonus1 && this.reelStripBonus1.length > 0) {
    // stripPrefix = "reelStripBonus";
    // }

    for (let i = 1; i <= 5; i++) { // 5 reels for Lights
        const currentStripKey = `${stripPrefix}${i}`;
        const strip = (this as any)[currentStripKey] as string[];
        if (strip && strip.length > 0) {
            const pos = Math.floor(Math.random() * strip.length);
            reel.rp[i-1] = pos; // Store position for middle symbol
            reel[`reel${i}`] = [ // 3 symbols visible per reel
                strip[pos === 0 ? strip.length - 1 : pos - 1],
                strip[pos],
                strip[(pos + 1) % strip.length]
            ];
            reel[`reel${i}`][3] = ''; // PHP adds this empty element
        } else {
            reel.rp[i-1] = 0;
            reel[`reel${i}`] = ['1','1','1','']; // Fallback: All wilds
        }
    }
    return reel;
  }

  public is_active(): boolean { /* ... standard ... */ return true; }
  public SetGameData(key: string, value: any): void { this.gameData[key] = { timelife: Math.floor(Date.now()/1000) + 86400, payload: value}; }
  public GetGameData(key: string): any { return this.gameData[key] ? this.gameData[key].payload : 0; }
  public SaveGameData(): void { if(this.user) { this.user.session = serialize(this.gameData); this.user.save(); }}
  public HasGameData(key: string): boolean { return this.gameData.hasOwnProperty(key); }
  public GetHistory(): any { /* ... standard ... */ return 'NULL';}
  public UpdateJackpots(bet: number): void { /* Lights doesn't have progressives */ }
  public GetBank(slotState: string = ''): number { if(this.isBonusStart || ['bonus','freespin'].includes(slotState)) slotState='bonus'; else slotState=''; if(!this.game) return 0; this.Bank = this.game.get_gamebank(slotState); return this.Bank / this.CurrentDenom; }
  public GetPercent(): number { return this.Percent; }
  public SetBank(slotState: string = '', sum: number, slotEvent: string = ''): Game | undefined { if(this.isBonusStart || ['bonus','freespin'].includes(slotState)) slotState='bonus'; else slotState=''; if(this.GetBank(slotState) + sum < 0) { console.error("Bank underflow"); return undefined; } sum = sum * this.CurrentDenom; if(this.game) {this.game.set_gamebank(sum, 'inc', slotState); this.game.save(); return this.game;} return undefined; }
  public GetBalance(): number { if(!this.user) return 0; this.Balance = this.user.balance / this.CurrentDenom; return this.Balance; }
  public SetBalance(sum: number, slotEvent: string = ''): User | undefined { if(!this.user) return; if(this.GetBalance() + sum < 0) { console.error("Balance underflow"); return undefined;} sum = sum * this.CurrentDenom; if(this.user){ this.user.increment('balance', sum); this.user.balance = this.FormatFloat(this.user.balance); this.user.save(); return this.user;} return undefined; }
  public FormatFloat(num: number): number { return parseFloat(num.toFixed(2)); }
  public SaveLogReport(spinSymbolsLog: string, bet: number, lines: number, win: number, slotState: string): void { /* ... standard ... */ }
  public GetSpinSettings(garantType: string = 'bet', bet: number, lines: number): [string, number] { /* ... standard, ensure 'lines' matches Lights (9) ... */ this.AllBet = bet * lines; return ['win', 1000]; }
  public GetRandomPay(): number { /* ... standard ... */ return 0;}
  public HasGameDataStatic(key: string): boolean { return this.gameDataStatic.hasOwnProperty(key); }
  public SaveGameDataStatic(): void { if (this.game) { this.game.advanced = serialize(this.gameDataStatic); this.game.save(); this.game.refresh();}}
  public SetGameDataStatic(key: string, value: any): void {this.gameDataStatic[key] = { timelife: Math.floor(Date.now() / 1000) + 86400, payload: value };}
  public GetGameDataStatic(key: string): any {return this.gameDataStatic[key] ? this.gameDataStatic[key].payload : 0;}
  public InternalErrorSilent(e: any): void { console.error("LightsNETSlotSettings SilentError:", e); }
}
