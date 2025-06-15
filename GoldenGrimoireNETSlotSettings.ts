import { GoldenGrimoireNETGameReel } from './GoldenGrimoireNETGameReel';

// Placeholder Types (copied and adapted from GoBananasNETSlotSettings)
type User = {
  id: number;
  shop_id: number;
  balance: number;
  count_balance: number;
  session: string; // Serialized data
  is_blocked: boolean;
  status: string;
  address: number;
  update: (data: any) => void;
  save: () => void;
  increment: (field: string, value: number) => void;
  update_level: (event: string, value: number) => void;
  updateCountBalance: (sum: number, currentCountBalance: number) => number;
  last_bid: any;
};
type Game = {
  name: string;
  shop_id: number;
  denomination: number;
  bet: string;
  view: boolean;
  slotViewState: string;
  advanced: string;
  jp_1: any; jp_2: any; jp_3: any; jp_4: any;
  jp_1_percent: any; jp_2_percent: any; jp_3_percent: any; jp_4_percent: any;
  id: string;
  get_gamebank: (slotState?: string, type?: string) => number;
  set_gamebank: (sum: number, op: 'inc' | 'dec', slotState?: string) => void;
  save: () => void;
  refresh: () => void;
  stat_in: number;
  stat_out: number;
  increment: (field: string, value?: number) => void;
  tournament_stat: (slotState: string, userId: number, bet: number, win: number) => void;
  get_lines_percent_config: (type: 'spin' | 'bonus') => any;
  bids: number;
  rezerv: number; // Added based on WinGamble = $game->rezerv
  game_win?: any; // For getNewSpin
};
type Shop = {
  id: number;
  max_win: number;
  percent: number;
  is_blocked: boolean;
  currency: string;
};
type GameBank = any;
type JPG = {
    id: any;
    balance: number;
    percent: number;
    get_pay_sum: () => number;
    user_id: number | null;
    save: () => void;
    get_min: (field: string) => number;
    get_start_balance: () => number;
    add_jpg: (type: string, sum: number) => void;
};
type GameLog = any;
type StatGame = any;
type Session = any;
type Carbon = any;

const UserStatus = { BANNED: 'banned', ACTIVE: 'active' };

// Mock DB entities / ORM calls (very simplified)
const MockDB = {
  User: {
    lockForUpdate: () => MockDB.User,
    find: (id: number): User | null => {
      if (id === 1) {
        return {
          id: 1, shop_id: 1, balance: 10000, count_balance: 10000, session: serialize({}), is_blocked: false, status: UserStatus.ACTIVE, address: 0,
          update: () => {}, save: () => {}, increment: () => {}, update_level: () => {},
          updateCountBalance: (sum, cb) => { return cb + sum; }, last_bid: null
        } as User;
      }
      return null;
    }
  },
  GameBank: {
    where: (condition: any) => MockDB.GameBank,
    lockForUpdate: () => MockDB.GameBank,
    get: (): GameBank[] => [],
    first: (): GameBank | null => null, // Added for SaveLogReport
  },
  Game: {
    where: (condition: any) => MockDB.Game,
    lockForUpdate: () => MockDB.Game,
    first: (): Game | null => {
        return {
            name: 'GoldenGrimoireNET', shop_id: 1, denomination: 1, bet: '1,2,3,4,5', view: true, slotViewState: 'Normal', advanced: serialize({}),
            jp_1: null, jp_2: null, jp_3: null, jp_4: null,
            jp_1_percent: 0, jp_2_percent: 0, jp_3_percent: 0, jp_4_percent: 0,
            id: 'gameGG123',
            get_gamebank: () => 100000,
            set_gamebank: () => {},
            save: () => {},
            refresh: () => {},
            stat_in: 0, stat_out: 0,
            increment: () => {},
            tournament_stat: () => {},
            get_lines_percent_config: (type: 'spin' | 'bonus') => {
                const curField = 10;
                const pref = type === 'bonus' ? '_bonus' : '';
                const res:any = {};
                res['line' + curField + pref] = {'0_100': 50};
                return res;
            },
            bids: 0,
            rezerv: 1000, // Example for WinGamble
            game_win: {}, // For getNewSpin
        } as Game;
    }
  },
  Shop: {
    find: (id: number): Shop | null => ({ id: 1, max_win: 100000, percent: 90, is_blocked: false, currency: 'USD' } as Shop)
  },
  JPG: {
    where: (condition: any) => MockDB.JPG,
    lockForUpdate: () => MockDB.JPG,
    get: (): JPG[] => []
  },
  GameLog: {
      whereRaw: (query: string, params: any[]) => MockDB.GameLog,
      get: (): any[] => [],
      create: (data: any) => {}
  },
  StatGame: { create: (data: any) => {} },
  Session: { where: (condition: any) => MockDB.Session, delete: () => {} },
  Carbon: { now: () => new Date() },
  LibBanker: { get_all_banks: (shop_id: number): [number, number, number, number, number] => [10000, 2000, 500, 500, 500] }
};

function serialize(data: any): string { return JSON.stringify(data); }
function unserialize<T>(data: string): T { try { return JSON.parse(data) as T; } catch (e) { return {} as T; } }
function getPhpInput(): string { return ""; }
const REMOTE_ADDR = '127.0.0.1';


export class GoldenGrimoireNETSlotSettings {
  public playerId: number | null = null;
  public splitScreen: boolean | null = null;
  public reelStrip1: string[] | null = null;
  public reelStrip2: string[] | null = null;
  public reelStrip3: string[] | null = null;
  public reelStrip4: string[] | null = null;
  public reelStrip5: string[] | null = null;
  public reelStrip6: string[] | null = null;
  public reelStripBonus1: string[] | null = null;
  // ... (reelStripBonus 2-6 would also be here)
  public slotId: string = '';
  public slotDBId: string = '';
  public Line: number[] | null = null;
  public scaleMode: number | null = null;
  public numFloat: number | null = null;
  public gameLine: number[] | null = null;
  public Bet: string[] = [];
  public isBonusStart: boolean | null = null;
  public Balance: number = 0;
  public SymbolGame: string[] | null = null;
  public GambleType: number | null = null;
  public lastEvent: string | null = null;
  public Jackpots: any = {};
  public keyController: Record<string, string> | null = null;
  public slotViewState: string | null = null;
  public hideButtons: string[] | null = null;
  public slotReelsConfig: number[][] | null = null;
  public slotFreeCount: Record<number, number> = {};
  public slotFreeMpl: number | null = null;
  public slotWildMpl: number | null = null;
  public slotExitUrl: string | null = null;
  public slotBonus: boolean | null = null;
  public slotBonusType: number | null = null;
  public slotScatterType: number | null = null;
  public slotGamble: boolean | null = null;
  public Paytable: Record<string, number[]> = {};
  public slotSounds: string[] = [];
  public jpgs: JPG[] | null = null;
  private Bank: number = 0;
  private Percent: number = 0;
  private WinLine: any;
  private WinGamble: number = 0;
  private Bonus: any;
  private shop_id: number | null = null;
  public currency: string | null = null;
  public slotCurrency: string | null = null;
  public user: User | null = null;
  public game: Game | null = null;
  public shop: Shop | null = null;
  public jpgPercentZero: boolean = false;
  public count_balance: number = 0;
  public CurrentDenom: number = 0;
  public CurrentDenomination: number = 0;
  public MaxWin: number = 0;
  public increaseRTP: number = 1;
  public slotJackPercent: number[] = [];
  public slotJackpot: any[] = [];
  public Denominations: number[] = [];
  private gameData: Record<string, { timelife: number, payload: any }> = {};
  private gameDataStatic: Record<string, { timelife: number, payload: any }> = {};
  public AllBet: number = 0;
  private toGameBanks: number = 0;
  private toSlotJackBanks: number = 0;
  private toSysJackBanks: number = 0;
  private betProfit: number = 0;
  private betRemains0?: number;
  private betRemains?: number;
  public slotFastStop?: number;

  constructor(sid: string, playerId: number, reelsContent?: string) {
    this.slotId = sid;
    this.playerId = playerId;

    const user = MockDB.User.lockForUpdate().find(this.playerId);
    if (!user) throw new Error("User not found for GoldenGrimoireNET");
    this.user = user;
    this.shop_id = user.shop_id;

    const game = MockDB.Game.where({ name: this.slotId, shop_id: this.shop_id }).lockForUpdate().first();
    if (!game) throw new Error("Game not found for GoldenGrimoireNET");
    this.game = game;

    const shop = MockDB.Shop.find(this.shop_id);
    if (!shop) throw new Error("Shop not found for GoldenGrimoireNET");
    this.shop = shop;

    this.MaxWin = this.shop.max_win;
    this.increaseRTP = 1;
    this.CurrentDenom = this.game.denomination;
    this.CurrentDenomination = this.game.denomination;
    this.scaleMode = 0;
    this.numFloat = 0;

    this.Paytable = {
        'SYM_3': [0,0,0,10,30,100], 'SYM_4': [0,0,0,8,25,75], 'SYM_5': [0,0,0,5,20,40],
        'SYM_6': [0,0,0,5,15,30], 'SYM_7': [0,0,0,4,10,20], 'SYM_8': [0,0,0,4,10,20],
        'SYM_9': [0,0,0,3,8,15], 'SYM_10': [0,0,0,3,8,15],
        // SYM_0, SYM_1, SYM_2, SYM_13 (mystery) are not in paytable but used in logic
    };

    const reelManager = new GoldenGrimoireNETGameReel(reelsContent);
    const reelStrips = ['reelStrip1', 'reelStrip2', 'reelStrip3', 'reelStrip4', 'reelStrip5', 'reelStrip6'];
    reelStrips.forEach(rsKey => {
      if (reelManager.reelsStrip[rsKey] && reelManager.reelsStrip[rsKey].length > 0) {
        (this as any)[rsKey] = reelManager.reelsStrip[rsKey];
      }
       // Bonus strips are loaded by GameReel but not directly assigned here in PHP, assumed to be handled by GetReelStrips
    });

    this.keyController = {
      '13': 'uiButtonSpin,uiButtonSkip', '49': 'uiButtonInfo', /* ... other keys */
    };
    this.slotReelsConfig = [[425,142,3],[669,142,3],[913,142,3],[1157,142,3],[1401,142,3]];
    this.slotBonusType = 1;
    this.slotScatterType = 0; // Scatter symbol is '0'
    this.splitScreen = false;
    this.slotBonus = true; // Golden Grimoire has bonus features
    this.slotGamble = true; // Assuming gamble is available
    this.slotFastStop = 1;
    this.slotExitUrl = '/';
    this.slotWildMpl = 1; // Wild symbol is '1'
    this.GambleType = 1;
    this.Denominations = this.game.denomination ? [this.game.denomination] : [1,2,5,10,20,50,100];
    this.CurrentDenom = this.Denominations[0];
    this.CurrentDenomination = this.Denominations[0];
    this.slotFreeCount = {0:0,1:0,2:0,3:8,4:8,5:8}; // 3+ scatters give 8 FS
    this.slotFreeMpl = 1;
    this.slotViewState = (game.slotViewState === '' ? 'Normal' : game.slotViewState);
    this.hideButtons = [];
    this.jpgs = MockDB.JPG.where({ shop_id: this.shop_id }).lockForUpdate().get();
    this.slotJackPercent = []; this.slotJackpot = [];
    for (let jp = 1; jp <= 4; jp++) {
      this.slotJackpot.push((game as any)['jp_' + jp]);
      this.slotJackPercent.push((game as any)['jp_' + jp + '_percent']);
    }

    this.Line = Array.from({length: 40}, (_, i) => i + 1); // Golden Grimoire has 40 lines
    this.gameLine = Array.from({length: 40}, (_, i) => i + 1);
    this.Bet = game.bet.split(',');
    this.Balance = user.balance;
    this.SymbolGame = ['0','1','3','4','5','6','7','8','9','10','13']; // '13' is mystery symbol
    this.Bank = game.get_gamebank();
    this.Percent = this.shop.percent;
    this.WinGamble = game.rezerv;
    this.slotDBId = game.id;
    this.slotCurrency = user.shop_id ? MockDB.Shop.find(user.shop_id)?.currency || 'USD' : 'USD';
    this.currency = this.slotCurrency;
    this.count_balance = user.count_balance;

    if (user.address > 0 && user.count_balance === 0) {
      this.Percent = 0; this.jpgPercentZero = true;
    } else if (user.count_balance === 0) {
      this.Percent = 100;
    }

    user.session = user.session || serialize({});
    this.gameData = unserialize(user.session);
    const currentTime = Math.floor(Date.now() / 1000);
    Object.keys(this.gameData).forEach(key => {
      if (this.gameData[key].timelife <= currentTime) delete this.gameData[key];
    });

    game.advanced = game.advanced || serialize({});
    this.gameDataStatic = unserialize(game.advanced);
     Object.keys(this.gameDataStatic).forEach(key => {
      if (this.gameDataStatic[key].timelife <= currentTime) delete this.gameDataStatic[key];
    });
  }

  public is_active(): boolean {
    if (this.game && this.shop && this.user &&
        (!this.game.view || this.shop.is_blocked || this.user.is_blocked || this.user.status === UserStatus.BANNED)) {
      MockDB.Session.where({ user_id: this.user.id }).delete();
      this.user.update({ remember_token: null });
      return false;
    }
    if (!this.game?.view) return false;
    if (this.shop?.is_blocked) return false;
    if (this.user?.is_blocked) return false;
    if (this.user?.status === UserStatus.BANNED) return false;
    return true;
  }

  public SetGameData(key: string, value: any): void {
    const timeLife = 86400;
    this.gameData[key] = { timelife: Math.floor(Date.now() / 1000) + timeLife, payload: value };
  }

  public GetGameData(key: string): any {
    return this.gameData[key] ? this.gameData[key].payload : 0;
  }

  public FormatFloat(num: number): number {
    const str0 = String(num).split('.');
    if (str0.length > 1) {
        if (str0[1].length > 4) return Math.round(num * 100) / 100;
        if (str0[1].length > 2) return Math.floor(num * 100) / 100;
    }
    return num;
  }

  public SaveGameData(): void {
    if (this.user) {
      this.user.session = serialize(this.gameData);
      this.user.save();
    }
  }

  public CheckBonusWin(): number {
      let allRateCnt = 0; let allRate = 0;
      Object.values(this.Paytable).forEach(vl => vl.forEach(vl2 => { if (vl2 > 0) { allRateCnt++; allRate += vl2; return; }}));
      return allRateCnt > 0 ? allRate / allRateCnt : 0;
  }

  public GetRandomPay(): number {
      const allRate: number[] = [];
      Object.values(this.Paytable).forEach(vl => vl.forEach(vl2 => { if (vl2 > 0) allRate.push(vl2);}));
      if(allRate.length === 0) return 0;
      allRate.sort(() => Math.random() - 0.5);
      const game_stat_in = this.game?.stat_in || 0;
      const game_stat_out = this.game?.stat_out || 0;
      if (game_stat_in < (game_stat_out + (allRate[0] * this.AllBet))) allRate[0] = 0;
      return allRate[0];
  }

  public HasGameDataStatic(key: string): boolean { return this.gameDataStatic.hasOwnProperty(key); }

  public SaveGameDataStatic(): void {
    if (this.game) {
      this.game.advanced = serialize(this.gameDataStatic);
      this.game.save(); this.game.refresh();
    }
  }

  public SetGameDataStatic(key: string, value: any): void {
    this.gameDataStatic[key] = { timelife: Math.floor(Date.now() / 1000) + 86400, payload: value };
  }

  public GetGameDataStatic(key: string): any {
    return this.gameDataStatic[key] ? this.gameDataStatic[key].payload : 0;
  }

  public HasGameData(key: string): boolean { return this.gameData.hasOwnProperty(key); }

  public GetHistory(): any {
    const history = MockDB.GameLog.whereRaw('game_id=? and user_id=? ORDER BY id DESC LIMIT 10', [this.slotDBId, this.playerId]).get();
    this.lastEvent = 'NULL'; let tmpLog: any = null;
    for (const log of history) {
      const parsedLog = typeof log.str === 'string' ? JSON.parse(log.str) : log.str;
      if (parsedLog.responseEvent !== 'gambleResult' && parsedLog.responseEvent !== 'jackpot') {
        this.lastEvent = typeof log.str === 'string' ? log.str : JSON.stringify(log.str);
        tmpLog = parsedLog; break;
      }
    }
    return tmpLog || 'NULL';
  }

  public UpdateJackpots(bet: number): void {
    if (!this.jpgs) return;
    bet = bet * this.CurrentDenom;
    const count_balance = this.count_balance; let payJack = 0;
    this.jpgs.forEach(currentJpg => {
      let jsum_i: number;
      if (count_balance === 0 || this.jpgPercentZero) jsum_i = currentJpg.balance;
      else if (count_balance < bet) jsum_i = (count_balance / 100 * currentJpg.percent) + currentJpg.balance;
      else jsum_i = (bet / 100 * currentJpg.percent) + currentJpg.balance;

      const paySum = currentJpg.get_pay_sum();
      if (paySum < jsum_i && paySum > 0) {
        if (!currentJpg.user_id || (this.user && currentJpg.user_id === this.user.id)) {
          payJack = paySum / this.CurrentDenom; jsum_i -= paySum;
          this.SetBalance(paySum / this.CurrentDenom);
          if (paySum > 0) MockDB.StatGame.create({ /* ...details... */ });
        }
      }
      currentJpg.balance = jsum_i; currentJpg.save();
      if (currentJpg.balance < currentJpg.get_min('start_balance')) {
        const summ = currentJpg.get_start_balance();
        if (summ > 0) currentJpg.add_jpg('add', summ);
      }
    });
    if (payJack > 0) this.Jackpots['jackPay'] = payJack.toFixed(2);
  }

  public GetBank(slotState: string = ''): number {
    if (this.isBonusStart || ['bonus', 'freespin', 'respin'].includes(slotState)) slotState = 'bonus'; else slotState = '';
    if (!this.game) return 0;
    this.Bank = this.game.get_gamebank(slotState);
    return this.Bank / this.CurrentDenom;
  }

  public GetPercent(): number { return this.Percent; }
  public GetCountBalanceUser(): number { return this.user?.count_balance || 0; }
  public InternalError(errcode: any): void { console.error("InternalError:", errcode); process.exit(1); }
  public InternalErrorSilent(errcode: any): void { console.error("InternalErrorSilent:", errcode); }

  public SetBank(slotState: string = '', sum: number, slotEvent: string = ''): Game | undefined {
    if (this.isBonusStart || ['bonus', 'freespin', 'respin'].includes(slotState)) slotState = 'bonus'; else slotState = '';
    if (this.GetBank(slotState) + sum < 0) { this.InternalError("Bank underflow"); return; }
    sum = sum * this.CurrentDenom;
    if (!this.game) return;

    let bankBonusSum = 0;
    if (sum > 0 && slotEvent === 'bet') {
      this.toGameBanks = 0; this.toSlotJackBanks = 0; this.toSysJackBanks = 0; this.betProfit = 0;
      const prc = this.GetPercent(); let prc_b = 10; if (prc <= prc_b) prc_b = 0;
      const count_balance = this.count_balance;
      const gameBet = sum / (this.GetPercent() / 100);

      if (count_balance < gameBet && count_balance > 0) {
        const firstBid = count_balance;
        let secondBid = gameBet - firstBid;
        if (this.betRemains0 !== undefined) secondBid = this.betRemains0;
        const bankSumVal = firstBid / 100 * this.GetPercent();
        sum = bankSumVal + secondBid;
        bankBonusSum = firstBid / 100 * prc_b;
      } else if (count_balance > 0) {
        bankBonusSum = gameBet / 100 * prc_b;
      }
      if(this.jpgs) this.jpgs.forEach(jpg => { /* ... jackpot contribution ... */ });
      this.toGameBanks = sum;
      this.betProfit = gameBet - this.toGameBanks - this.toSlotJackBanks - this.toSysJackBanks;
    }
    if (sum > 0 && slotEvent !== 'bet') this.toGameBanks = sum;
    if (bankBonusSum > 0) { sum -= bankBonusSum; this.game.set_gamebank(bankBonusSum, 'inc', 'bonus');}
    if (sum === 0 && slotEvent === 'bet' && this.betRemains !== undefined) sum = this.betRemains;
    this.game.set_gamebank(sum, 'inc', slotState); this.game.save(); return this.game;
  }

  public SetBalance(sum: number, slotEvent: string = ''): User | undefined {
    if (!this.user) return;
    if (this.GetBalance() + sum < 0) { this.InternalError("Balance underflow"); return; }
    sum = sum * this.CurrentDenom;
    if (sum < 0 && slotEvent === 'bet') { /* ... complex betRemains logic ... */ }
    this.user.increment('balance', sum);
    this.user.balance = this.FormatFloat(this.user.balance);
    this.user.save(); return this.user;
  }

  public GetBalance(): number {
    if (!this.user) return 0;
    this.Balance = this.CurrentDenom !== 0 ? this.user.balance / this.CurrentDenom : 0;
    return this.Balance;
  }

  public SaveLogReport(spinSymbolsLog: string, bet: number, lines: number, win: number, slotState: string): void {
    let reportName = `${this.slotId} ${slotState}`;
    if (slotState === 'freespin') reportName = `${this.slotId} FG`;
    else if (slotState === 'bet') reportName = this.slotId;
    // else if (slotState === 'slotGamble') reportName = `${this.slotId} DG`; // Gamble not in this game per Server.php structure

    if (!this.game || !this.user) return;
    if (slotState === 'bet') this.user.update_level('bet', bet * this.CurrentDenom);
    if (slotState !== 'freespin') this.game.increment('stat_in', bet * this.CurrentDenom);
    this.game.increment('stat_out', win * this.CurrentDenom);
    this.game.tournament_stat(slotState, this.user.id, bet * this.CurrentDenom, win * this.CurrentDenom);
    this.user.update({ last_bid: MockDB.Carbon.now() });
    this.betProfit = this.betProfit || 0; this.toGameBanks = this.toGameBanks || 0; /* ... */
    this.game.increment('bids'); this.game.refresh();
    // ... (bank logging part) ...
    MockDB.GameLog.create({ /* ... */ }); MockDB.StatGame.create({ /* ... */ });
  }

  public GetSpinSettings(garantType: string = 'bet', bet: number, lines: number): [string, number] {
    let curField = 10; // Default, adjust based on lines
    if (lines <= 1) curField = 1; else if (lines <= 3) curField = 3; /* ... more cases ... */
    const pref = garantType !== 'bet' ? '_bonus' : '';
    this.AllBet = bet * lines;
    if(!this.game || !this.shop) return ['none', 0];
    const linesPercentConfigSpin = this.game.get_lines_percent_config('spin');
    const linesPercentConfigBonus = this.game.get_lines_percent_config('bonus');
    const currentPercent = this.shop.percent; let percentLevel = '';
    // ... (percentLevel determination logic) ...
    if (!percentLevel && linesPercentConfigSpin && linesPercentConfigSpin['line' + curField + pref]) {
        percentLevel = Object.keys(linesPercentConfigSpin['line' + curField + pref])[0];
    }
    const currentSpinWinChance = percentLevel ? linesPercentConfigSpin['line' + curField + pref][percentLevel] : 100;
    const currentBonusWinChance = percentLevel ? linesPercentConfigBonus['line' + curField + pref][percentLevel] : 500;
    // ... (RTP control logic) ...
    const bonusWinRoll = Math.floor(Math.random() * currentBonusWinChance) + 1;
    const spinWinRoll = Math.floor(Math.random() * currentSpinWinChance) + 1;
    let result: [string, number] = ['none', 0];
    if (bonusWinRoll === 1 && this.slotBonus) { /* ... bonus logic ... */ }
    else if (spinWinRoll === 1) { result = ['win', this.GetBank(garantType)]; }
    // ... (low balance kicker) ...
    return result;
  }

  public getNewSpin(game: Game, spinWin = 0, bonusWin = 0, lines: number, garantType = 'bet'): string {
      // This method's direct PHP equivalent was complex and tied to game_win object structure
      // For now, returning a placeholder based on win type
      if(bonusWin) return '1'; // Indicates some win for bonus
      if(spinWin) return '1'; // Indicates some win for regular spin
      return '0'; // No win
  }

  public GetRandomScatterPos(rp: string[]): number {
    const rpResult: number[] = [];
    for (let i = 0; i < rp.length; i++) {
        if (rp[i] === '0') { // Scatter symbol
            if (i > 0 && i < rp.length -1 ) rpResult.push(i);
            // PHP logic had more checks, simplified here
        }
    }
    if(rpResult.length === 0) return Math.floor(Math.random() * (rp.length - 3)) + 1; // Ensure not first/last two for 4 rows
    return rpResult[Math.floor(Math.random() * rpResult.length)];
  }

  // GetGambleSettings is not present in GoldenGrimoireNET's Server.php usage

  public GetReelStrips(winType: string, slotEvent: string): any {
    const reelSet: any = { rp: [] };
    const reelKeys: string[] = ['reelStrip1','reelStrip2','reelStrip3','reelStrip4','reelStrip5','reelStrip6'];
    const prs: Record<number,number> = {};

    if (winType !== 'bonus') {
        reelKeys.forEach((reelKey, index) => {
            const strip = (this as any)[reelKey] as string[];
            if (strip && strip.length > 0) {
                prs[index + 1] = Math.floor(Math.random() * (strip.length - 3)); // -3 for 4 symbols
            }
        });
    } else {
        // Simplified bonus reel generation: place scatters
        // PHP logic: $scattersCnt = 5; $reelsId = [1,2,3,4,5];
        const reelsIdToUse = [1,2,3,4,5]; // Assuming 5 reels for scatter placement
        reelsIdToUse.forEach(reelNum => {
            const strip = (this as any)[`reelStrip${reelNum}`] as string[];
            if(strip && strip.length >0) {
                 prs[reelNum] = this.GetRandomScatterPos(strip);
            }
        });
    }

    for (const indexStr in prs) {
      const index = parseInt(indexStr, 10);
      const currentStrip = (this as any)[`reelStrip${index}`] as string[];
      const pos = prs[index];

      reelSet['reel' + index] = [
        currentStrip[pos > 0 ? pos -1 : currentStrip.length -1],
        currentStrip[pos],
        currentStrip[pos < currentStrip.length -1 ? pos + 1 : 0],
        currentStrip[pos < currentStrip.length -2 ? pos + 2 : (pos < currentStrip.length -1 ? 0 : 1) ], // Logic for 4th symbol
        '' // Placeholder for 5th if any
      ];
      reelSet.rp.push(pos);
    }
    return reelSet;
  }
}
