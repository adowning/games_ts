import { GoBananasNETGameReel } from './GoBananasNETGameReel';

// Placeholder Types (replace with actual Prisma models or interfaces)
type User = {
  id: number;
  shop_id: number;
  balance: number;
  count_balance: number;
  session: string; // Serialized data
  is_blocked: boolean;
  status: string; // Assuming UserStatus is a string type
  address: number; // Or string, depends on actual usage
  update: (data: any) => void; // Mock update method
  save: () => void; // Mock save method
  increment: (field: string, value: number) => void; // Mock increment method
  update_level: (event: string, value: number) => void; // Mock method
  updateCountBalance: (sum: number, currentCountBalance: number) => number; // Mock method
  last_bid: any;
};
type Game = {
  name: string;
  shop_id: number;
  denomination: number;
  bet: string; // Comma-separated string
  view: boolean;
  slotViewState: string;
  advanced: string; // Serialized data
  jp_1: any; jp_2: any; jp_3: any; jp_4: any; // Jackpot values
  jp_1_percent: any; jp_2_percent: any; jp_3_percent: any; jp_4_percent: any; // Jackpot percentages
  id: string; // slotDBId
  get_gamebank: (slotState?: string, type?: string) => number; // Mock method
  set_gamebank: (sum: number, op: 'inc' | 'dec', slotState?: string) => void; // Mock method
  save: () => void; // Mock save method
  refresh: () => void; // Mock refresh method
  stat_in: number;
  stat_out: number;
  increment: (field: string, value?: number) => void;
  tournament_stat: (slotState: string, userId: number, bet: number, win: number) => void;
  get_lines_percent_config: (type: 'spin' | 'bonus') => any; // Mock
  bids: number;

};
type Shop = {
  id: number;
  max_win: number;
  percent: number;
  is_blocked: boolean;
  currency: string;
};
type GameBank = any; // Placeholder
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
}; // Placeholder
type GameLog = any; // Placeholder
type StatGame = any; // Placeholder
type Session = any; // Placeholder for \VanguardLTE\Session
type Carbon = any; // Placeholder for \Carbon\Carbon

// Mock UserStatus Enum
const UserStatus = {
  BANNED: 'banned',
  ACTIVE: 'active',
  // ... other statuses
};

// Mock DB entities / ORM calls (very simplified)
const MockDB = {
  User: {
    lockForUpdate: () => MockDB.User, // Chainable
    find: (id: number): User | null => {
      // Replace with actual DB lookup if possible, or return mock
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
    get: (): GameBank[] => [] // Returns an array of GameBank
  },
  Game: {
    where: (condition: any) => MockDB.Game,
    lockForUpdate: () => MockDB.Game,
    first: (): Game | null => {
        // Mock game data
        return {
            name: 'GoBananasNET', shop_id: 1, denomination: 1, bet: '1,2,3,4,5', view: true, slotViewState: 'Normal', advanced: serialize({}),
            jp_1: null, jp_2: null, jp_3: null, jp_4: null,
            jp_1_percent: 0, jp_2_percent: 0, jp_3_percent: 0, jp_4_percent: 0,
            id: 'game123',
            get_gamebank: () => 100000,
            set_gamebank: () => {},
            save: () => {},
            refresh: () => {},
            stat_in: 0, stat_out: 0,
            increment: () => {},
            tournament_stat: () => {},
            get_lines_percent_config: (type: 'spin' | 'bonus') => {
                 // Simplified mock from PHP structure
                const curField = 10; // example
                const pref = type === 'bonus' ? '_bonus' : '';
                const res:any = {};
                res['line' + curField + pref] = {'0_100': 50}; // Example: 50% chance for 0-100 shop percent
                return res;
            },
            bids: 0,

        } as Game;
    }
  },
  Shop: {
    find: (id: number): Shop | null => ({ id: 1, max_win: 100000, percent: 90, is_blocked: false, currency: 'USD' } as Shop)
  },
  JPG: {
    where: (condition: any) => MockDB.JPG,
    lockForUpdate: () => MockDB.JPG,
    get: (): JPG[] => [] // Returns an array of JPG
  },
  GameLog: {
      whereRaw: (query: string, params: any[]) => MockDB.GameLog,
      get: (): any[] => [], // Mock,
      create: (data: any) => {} // Mock
  },
  StatGame: {
      create: (data: any) => {} // Mock
  },
  Session: {
      where: (condition: any) => MockDB.Session,
      delete: () => {} // Mock
  },
  Carbon: { // Mock Carbon
      now: () => new Date()
  },
   LibBanker: { // Mock for \VanguardLTE\Lib\Banker
    get_all_banks: (shop_id: number): [number, number, number, number, number] => {
        return [10000, 2000, 500, 500, 500]; // Example bank values
    }
  }
};

// Helper for serialize/unserialize (very basic JSON stringify/parse)
function serialize(data: any): string {
  return JSON.stringify(data);
}
function unserialize<T>(data: string): T {
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return {} as T; // Return empty object on error, similar to PHP behavior with invalid strings
  }
}
// Mock for file_get_contents('php://input') - not directly possible
function getPhpInput(): string {
    return ""; // Placeholder
}
// Mock for $_SERVER['REMOTE_ADDR']
const REMOTE_ADDR = '127.0.0.1';


export class GoBananasNETSlotSettings {
  public playerId: number | null = null;
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
  public Bet: string[] = [];
  public isBonusStart: boolean | null = null;
  public Balance: number = 0;
  public SymbolGame: string[] | null = null;
  public GambleType: number | null = null;
  public lastEvent: string | null = null;
  public Jackpots: any = {}; // Was array in PHP, but used as object in Server.php
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
  public slotSounds: string[] = []; // Not initialized in PHP, but good practice
  public jpgs: JPG[] | null = null;
  private Bank: number = 0;
  private Percent: number = 0;
  private WinLine: any; // Not initialized
  private WinGamble: number = 0;
  private Bonus: any; // Not initialized
  private shop_id: number | null = null;
  public currency: string | null = null; // slotCurrency in Server.php
  public slotCurrency: string | null = null; // Added for consistency with Server.php
  public user: User | null = null;
  public game: Game | null = null;
  public shop: Shop | null = null;
  public jpgPercentZero: boolean = false;
  public count_balance: number = 0;
  public CurrentDenom: number = 0;
  public CurrentDenomination: number = 0; // Added for consistency
  public MaxWin: number = 0;
  public increaseRTP: number = 1; // boolean in server?
  public slotJackPercent: number[] = [];
  public slotJackpot: any[] = [];
  public Denominations: number[] = [];
  private gameData: Record<string, { timelife: number, payload: any }> = {};
  private gameDataStatic: Record<string, { timelife: number, payload: any }> = {};
  public AllBet: number = 0; // Used in GetSpinSettings
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
    if (!user) throw new Error("User not found");
    this.user = user;
    this.shop_id = user.shop_id;

    // const gamebank = MockDB.GameBank.where({ shop_id: this.shop_id }).lockForUpdate().get(); // Not directly used
    const game = MockDB.Game.where({ name: this.slotId, shop_id: this.shop_id }).lockForUpdate().first();
    if (!game) throw new Error("Game not found");
    this.game = game;

    const shop = MockDB.Shop.find(this.shop_id);
    if (!shop) throw new Error("Shop not found");
    this.shop = shop;

    this.MaxWin = this.shop.max_win;
    this.increaseRTP = 1;
    this.CurrentDenom = this.game.denomination;
    this.CurrentDenomination = this.game.denomination; // Ensure this is set
    this.scaleMode = 0;
    this.numFloat = 0;

    this.Paytable = {
      'SYM_0': [0, 0, 0, 0, 0, 0], 'SYM_1': [0, 0, 0, 0, 0, 0], 'SYM_2': [0, 0, 0, 0, 0, 0],
      'SYM_3': [0, 0, 0, 25, 120, 700], 'SYM_4': [0, 0, 0, 20, 80, 350],
      'SYM_5': [0, 0, 0, 15, 60, 250], 'SYM_6': [0, 0, 0, 15, 50, 180],
      'SYM_7': [0, 0, 0, 10, 40, 140], 'SYM_8': [0, 0, 0, 5, 20, 70],
      'SYM_9': [0, 0, 0, 5, 15, 60], 'SYM_10': [0, 0, 0, 5, 15, 50],
      'SYM_11': [0, 0, 0, 5, 10, 40], 'SYM_12': [0, 0, 0, 5, 10, 30],
    };

    const reelManager = new GoBananasNETGameReel(reelsContent); // Pass content if available
    const reelStrips = ['reelStrip1', 'reelStrip2', 'reelStrip3', 'reelStrip4', 'reelStrip5', 'reelStrip6'];
    reelStrips.forEach(rsKey => {
      if (reelManager.reelsStrip[rsKey] && reelManager.reelsStrip[rsKey].length > 0) {
        (this as any)[rsKey] = reelManager.reelsStrip[rsKey];
      }
    });
     // reelStripBonus is not directly assigned in PHP constructor, but loaded by GameReel

    this.keyController = {
      '13': 'uiButtonSpin,uiButtonSkip', '49': 'uiButtonInfo', '50': 'uiButtonCollect',
      '51': 'uiButtonExit2', '52': 'uiButtonLinesMinus', '53': 'uiButtonLinesPlus',
      '54': 'uiButtonBetMinus', '55': 'uiButtonBetPlus', '56': 'uiButtonGamble',
      '57': 'uiButtonRed', '48': 'uiButtonBlack', '189': 'uiButtonAuto', '187': 'uiButtonSpin',
    };
    this.slotReelsConfig = [[425, 142, 3], [669, 142, 3], [913, 142, 3], [1157, 142, 3], [1401, 142, 3]];
    this.slotBonusType = 1;
    this.slotScatterType = 0;
    this.splitScreen = false;
    this.slotBonus = false;
    this.slotGamble = true;
    this.slotFastStop = 1;
    this.slotExitUrl = '/';
    this.slotWildMpl = 1;
    this.GambleType = 1;
    // Assuming GameStatic.values.denomination exists and is populated
    this.Denominations = this.game.denomination ? [this.game.denomination] : [1,2,5,10,20,50,100]; // Fallback if not on game
    this.CurrentDenom = this.Denominations[0];
    this.CurrentDenomination = this.Denominations[0];
    this.slotFreeCount = { 0:0, 1:0, 2:0, 3:15, 4:30, 5:60 }; // scatter count to free games
    this.slotFreeMpl = 1;
    this.slotViewState = (game.slotViewState === '' ? 'Normal' : game.slotViewState);
    this.hideButtons = [];
    this.jpgs = MockDB.JPG.where({ shop_id: this.shop_id }).lockForUpdate().get();
    this.slotJackPercent = [];
    this.slotJackpot = [];
    for (let jp = 1; jp <= 4; jp++) {
      this.slotJackpot.push((game as any)['jp_' + jp]);
      this.slotJackPercent.push((game as any)['jp_' + jp + '_percent']);
    }

    this.Line = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    this.gameLine = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    this.Bet = game.bet.split(',');
    this.Balance = user.balance;
    this.SymbolGame = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    this.Bank = game.get_gamebank();
    this.Percent = this.shop.percent;
    this.WinGamble = game.get_gamebank('rezerv'); // PHP used game->rezerv, mapped to a type of gamebank
    this.slotDBId = game.id;
    this.slotCurrency = user.shop_id ? MockDB.Shop.find(user.shop_id)?.currency || 'USD' : 'USD';
    this.currency = this.slotCurrency;
    this.count_balance = user.count_balance;

    if (user.address > 0 && user.count_balance === 0) {
      this.Percent = 0;
      this.jpgPercentZero = true;
    } else if (user.count_balance === 0) {
      this.Percent = 100;
    }

    if (!user.session || user.session.length <= 0) {
      user.session = serialize({});
    }
    this.gameData = unserialize(user.session);
    if (Object.keys(this.gameData).length > 0) {
      const currentTime = Math.floor(Date.now() / 1000);
      for (const key in this.gameData) {
        if (this.gameData[key].timelife <= currentTime) {
          delete this.gameData[key];
        }
      }
    }

    if (!game.advanced || game.advanced.length <= 0) {
      game.advanced = serialize({});
    }
    this.gameDataStatic = unserialize(game.advanced);
    if (Object.keys(this.gameDataStatic).length > 0) {
      const currentTime = Math.floor(Date.now() / 1000);
      for (const key in this.gameDataStatic) {
        if (this.gameDataStatic[key].timelife <= currentTime) {
          delete this.gameDataStatic[key];
        }
      }
    }
  }

  public is_active(): boolean {
    if (this.game && this.shop && this.user &&
        (!this.game.view || this.shop.is_blocked || this.user.is_blocked || this.user.status === UserStatus.BANNED)) {
      MockDB.Session.where({ user_id: this.user.id }).delete();
      this.user.update({ remember_token: null }); // Assuming 'update' method exists on User model
      return false;
    }
    if (!this.game?.view) return false;
    if (this.shop?.is_blocked) return false;
    if (this.user?.is_blocked) return false;
    if (this.user?.status === UserStatus.BANNED) return false;
    return true;
  }

  public SetGameData(key: string, value: any): void {
    const timeLife = 86400; // 24 hours in seconds
    this.gameData[key] = {
      timelife: Math.floor(Date.now() / 1000) + timeLife,
      payload: value,
    };
  }

  public GetGameData(key: string): any {
    if (this.gameData[key]) {
      return this.gameData[key].payload;
    }
    return 0; // Default value if key not found, as in PHP
  }

  public FormatFloat(num: number): number {
    const str0 = String(num).split('.');
    if (str0.length > 1) {
        if (str0[1].length > 4) {
            return Math.round(num * 100) / 100;
        } else if (str0[1].length > 2) {
            return Math.floor(num * 100) / 100;
        }
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
      let allRateCnt = 0;
      let allRate = 0;
      for(const symbol in this.Paytable){
          const payline = this.Paytable[symbol];
          for(const win of payline){
              if(win > 0){
                  allRateCnt++;
                  allRate += win;
                  break;
              }
          }
      }
      return allRateCnt > 0 ? allRate / allRateCnt : 0;
  }

  public GetRandomPay(): number {
      const allRate: number[] = [];
       for(const symbol in this.Paytable){
          const payline = this.Paytable[symbol];
          for(const win of payline){
              if(win > 0){
                  allRate.push(win);
              }
          }
      }
      if(allRate.length === 0) return 0;

      allRate.sort(() => Math.random() - 0.5); // Shuffle

      // Mocking game stat_in and stat_out as they are not fully implemented here
      const game_stat_in = this.game?.stat_in || 0;
      const game_stat_out = this.game?.stat_out || 0;

      if( game_stat_in < (game_stat_out + (allRate[0] * this.AllBet)) ) {
          allRate[0] = 0;
      }
      return allRate[0];
  }


  public HasGameDataStatic(key: string): boolean {
    return this.gameDataStatic.hasOwnProperty(key);
  }

  public SaveGameDataStatic(): void {
    if (this.game) {
      this.game.advanced = serialize(this.gameDataStatic);
      this.game.save();
      this.game.refresh();
    }
  }

  public SetGameDataStatic(key: string, value: any): void {
    const timeLife = 86400;
    this.gameDataStatic[key] = {
      timelife: Math.floor(Date.now() / 1000) + timeLife,
      payload: value,
    };
  }

  public GetGameDataStatic(key: string): any {
    if (this.gameDataStatic[key]) {
      return this.gameDataStatic[key].payload;
    }
    return 0;
  }


  public HasGameData(key: string): boolean {
    return this.gameData.hasOwnProperty(key);
  }

  public GetHistory(): any { // Returns parsed JSON object or 'NULL' string
    const history = MockDB.GameLog.whereRaw('game_id=? and user_id=? ORDER BY id DESC LIMIT 10', [this.slotDBId, this.playerId])
                               .get();
    this.lastEvent = 'NULL';
    let tmpLog: any = null;

    for (const log of history) {
      // Assuming log.str contains the JSON string
      const parsedLog = typeof log.str === 'string' ? JSON.parse(log.str) : log.str;
      if (parsedLog.responseEvent !== 'gambleResult' && parsedLog.responseEvent !== 'jackpot') {
        this.lastEvent = typeof log.str === 'string' ? log.str : JSON.stringify(log.str);
        tmpLog = parsedLog;
        break;
      }
    }
    return tmpLog || 'NULL';
  }

  public UpdateJackpots(bet: number): void {
    if (!this.jpgs) return;
    bet = bet * this.CurrentDenom;
    const count_balance = this.count_balance;
    let payJack = 0;

    for (let i = 0; i < this.jpgs.length; i++) {
      let currentJpg = this.jpgs[i];
      let jsum_i: number;

      if (count_balance === 0 || this.jpgPercentZero) {
        jsum_i = currentJpg.balance;
      } else if (count_balance < bet) {
        jsum_i = (count_balance / 100 * currentJpg.percent) + currentJpg.balance;
      } else {
        jsum_i = (bet / 100 * currentJpg.percent) + currentJpg.balance;
      }

      const paySum = currentJpg.get_pay_sum();
      if (paySum < jsum_i && paySum > 0) {
        if (currentJpg.user_id && this.user && currentJpg.user_id !== this.user.id) {
          // Skip if jackpot is won by another user
        } else {
          payJack = paySum / this.CurrentDenom;
          jsum_i = jsum_i - paySum;
          this.SetBalance(paySum / this.CurrentDenom); // Using the class method

          if (paySum > 0) {
            MockDB.StatGame.create({
              user_id: this.playerId,
              balance: this.Balance * this.CurrentDenom,
              bet: 0,
              win: paySum,
              game: `${this.game?.name} JPG ${currentJpg.id}`,
              in_game: 0, in_jpg: 0, in_profit: 0,
              shop_id: this.shop_id,
              date_time: MockDB.Carbon.now(),
            });
          }
        }
      }
      currentJpg.balance = jsum_i;
      currentJpg.save();

      if (currentJpg.balance < currentJpg.get_min('start_balance')) {
        const summ = currentJpg.get_start_balance();
        if (summ > 0) {
          currentJpg.add_jpg('add', summ);
        }
      }
    }
    if (payJack > 0) {
      this.Jackpots['jackPay'] = payJack.toFixed(2);
    }
  }


  public GetBank(slotState: string = ''): number {
    if (this.isBonusStart || slotState === 'bonus' || slotState === 'freespin' || slotState === 'respin') {
      slotState = 'bonus';
    } else {
      slotState = '';
    }
    if (!this.game) return 0;
    this.Bank = this.game.get_gamebank(slotState);
    return this.Bank / this.CurrentDenom;
  }

  public GetPercent(): number {
    return this.Percent;
  }

  public GetCountBalanceUser(): number {
      return this.user?.count_balance || 0;
  }

  public InternalError(errcode: any): void {
    const strLog = `\n{"responseEvent":"error","responseType":"${errcode}","serverResponse":"InternalError","request":${JSON.stringify({})},"requestRaw":"${getPhpInput()}"}\n ############################################### \n`;
    // In a real TS environment, you'd use a proper logging library or fs.appendFile
    console.error("InternalError:", strLog); // Or save to a log file
    process.exit(1); // Or throw an error
  }

  public InternalErrorSilent(errcode: any): void {
     const strLog = `\n{"responseEvent":"error","responseType":"${errcode}","serverResponse":"InternalError","request":${JSON.stringify({})},"requestRaw":"${getPhpInput()}"}\n ############################################### \n`;
    console.error("InternalErrorSilent:", strLog); // Or save to a log file
  }


  public SetBank(slotState: string = '', sum: number, slotEvent: string = ''): Game | undefined {
    if (this.isBonusStart || slotState === 'bonus' || slotState === 'freespin' || slotState === 'respin') {
      slotState = 'bonus';
    } else {
      slotState = '';
    }

    if (this.GetBank(slotState) + sum < 0) {
      this.InternalError(`Bank_ ${sum} CurrentBank_ ${this.GetBank(slotState)} CurrentState_ ${slotState} Trigger_ ${this.GetBank(slotState) + sum}`);
      return; // Should not be reached if InternalError exits/throws
    }

    sum = sum * this.CurrentDenom;
    if (!this.game) return;

    let bankBonusSum = 0;
    if (sum > 0 && slotEvent === 'bet') {
      this.toGameBanks = 0;
      this.toSlotJackBanks = 0;
      this.toSysJackBanks = 0;
      this.betProfit = 0;

      const prc = this.GetPercent();
      let prc_b = 10;
      if (prc <= prc_b) prc_b = 0;

      const count_balance = this.count_balance;
      const gameBet = sum / (this.GetPercent() / 100); // Adjusted for correct percentage calculation

      if (count_balance < gameBet && count_balance > 0) {
        const firstBid = count_balance;
        let secondBid = gameBet - firstBid;
        if (this.betRemains0 !== undefined) { // Check if betRemains0 was set
             secondBid = this.betRemains0;
        }
        const bankSum = firstBid / 100 * this.GetPercent();
        sum = bankSum + secondBid; // sum is updated here
        bankBonusSum = firstBid / 100 * prc_b;
      } else if (count_balance > 0) {
        bankBonusSum = gameBet / 100 * prc_b;
      }

      if (this.jpgs) {
          for (let i = 0; i < this.jpgs.length; i++) {
            if (!this.jpgPercentZero) {
              if (count_balance < gameBet && count_balance > 0) {
                this.toSlotJackBanks += (count_balance / 100 * this.jpgs[i].percent);
              } else if (count_balance > 0) {
                this.toSlotJackBanks += (gameBet / 100 * this.jpgs[i].percent);
              }
            }
          }
      }
      this.toGameBanks = sum; // sum was updated above
      this.betProfit = gameBet - this.toGameBanks - this.toSlotJackBanks - this.toSysJackBanks;
    }

    if (sum > 0 && slotEvent !== 'bet') { // If not a bet, all sum goes to game banks (as per original logic)
        this.toGameBanks = sum;
    }


    if (bankBonusSum > 0) {
      sum -= bankBonusSum;
      this.game.set_gamebank(bankBonusSum, 'inc', 'bonus');
    }

    if (sum === 0 && slotEvent === 'bet' && this.betRemains !== undefined) {
      sum = this.betRemains;
    }

    this.game.set_gamebank(sum, 'inc', slotState);
    this.game.save();
    return this.game;
  }

  public SetBalance(sum: number, slotEvent: string = ''): User | undefined {
    if (!this.user) return;
    if (this.GetBalance() + sum < 0) {
      this.InternalError(`Balance_ ${sum}`);
      return; // Should not be reached
    }
    sum = sum * this.CurrentDenom; // Convert to cents or base unit

    if (sum < 0 && slotEvent === 'bet') {
        const user = this.user;
        const absSum = Math.abs(sum);

        if (user.count_balance === 0) {
            this.betRemains = 0;
            if (user.address < absSum && user.address > 0) {
                this.betRemains = absSum - user.address;
            }
        } else if (user.count_balance > 0 && user.count_balance < absSum) {
            const tmpSum = absSum - user.count_balance;
            this.betRemains0 = tmpSum;
            if (user.address > 0) {
                this.betRemains0 = 0;
                if (user.address < tmpSum && user.address > 0) {
                    this.betRemains0 = tmpSum - user.address;
                }
            }
        }

        // Update user.address based on sum and count_balance
        if (user.count_balance === 0) {
            if (user.address < absSum && user.address > 0) {
                user.address = 0;
            } else if (user.address >= absSum) { // Ensure address doesn't go negative
                user.address -= absSum;
            }
        } else if (user.count_balance > 0 && user.count_balance < absSum) {
            const diff = absSum - user.count_balance;
            if (user.address < diff && user.address > 0) {
                user.address = 0;
            } else if (user.address >= diff) { // Ensure address doesn't go negative
                user.address -= diff;
            }
        }
        user.count_balance = user.updateCountBalance(sum, user.count_balance); // sum is negative here
        user.count_balance = this.FormatFloat(user.count_balance);
    }

    this.user.increment('balance', sum);
    this.user.balance = this.FormatFloat(this.user.balance);
    this.user.save();
    return this.user;
  }

  public GetBalance(): number {
    if (!this.user) return 0;
    // Ensure CurrentDenom is not zero to avoid division by zero
    this.Balance = this.CurrentDenom !== 0 ? this.user.balance / this.CurrentDenom : 0;
    return this.Balance;
  }

  public SaveLogReport(spinSymbolsLog: string, bet: number, lines: number, win: number, slotState: string): void {
    let reportName = `${this.slotId} ${slotState}`;
    if (slotState === 'freespin') reportName = `${this.slotId} FG`;
    else if (slotState === 'bet') reportName = this.slotId;
    else if (slotState === 'slotGamble') reportName = `${this.slotId} DG`;

    if (!this.game || !this.user) return;

    if (slotState === 'bet') {
      this.user.update_level('bet', bet * this.CurrentDenom);
    }
    if (slotState !== 'freespin') {
      this.game.increment('stat_in', bet * this.CurrentDenom);
    }
    this.game.increment('stat_out', win * this.CurrentDenom);
    this.game.tournament_stat(slotState, this.user.id, bet * this.CurrentDenom, win * this.CurrentDenom);
    this.user.update({ last_bid: MockDB.Carbon.now() });

    this.betProfit = this.betProfit || 0;
    this.toGameBanks = this.toGameBanks || 0;
    this.toSlotJackBanks = this.toSlotJackBanks || 0;
    this.toSysJackBanks = this.toSysJackBanks || 0;


    this.game.increment('bids');
    this.game.refresh();

    let slotsBank=0, bonusBank=0, fishBank=0, tableBank=0, littleBank=0;
    const gamebank = MockDB.GameBank.where({ shop_id: this.game.shop_id }).first(); // Assuming first() is available
    if (gamebank) {
        [slotsBank, bonusBank, fishBank, tableBank, littleBank] = MockDB.LibBanker.get_all_banks(this.game.shop_id);
    } else {
        slotsBank = this.game.get_gamebank('', 'slots');
        bonusBank = this.game.get_gamebank('bonus', 'bonus');
        fishBank = this.game.get_gamebank('', 'fish');
        tableBank = this.game.get_gamebank('', 'table_bank');
        littleBank = this.game.get_gamebank('', 'little');
    }
    const totalBank = slotsBank + bonusBank + fishBank + tableBank + littleBank;

    MockDB.GameLog.create({
      game_id: this.slotDBId,
      user_id: this.playerId,
      ip: REMOTE_ADDR, // Assuming REMOTE_ADDR is available
      str: spinSymbolsLog,
      shop_id: this.shop_id,
    });

    MockDB.StatGame.create({
      user_id: this.playerId,
      balance: this.Balance * this.CurrentDenom,
      bet: bet * this.CurrentDenom,
      win: win * this.CurrentDenom,
      game: reportName,
      in_game: this.toGameBanks,
      in_jpg: this.toSlotJackBanks,
      in_profit: this.betProfit,
      denomination: this.CurrentDenom,
      shop_id: this.shop_id,
      slots_bank: Number(slotsBank),
      bonus_bank: Number(bonusBank),
      fish_bank: Number(fishBank),
      table_bank: Number(tableBank),
      little_bank: Number(littleBank),
      total_bank: Number(totalBank),
      date_time: MockDB.Carbon.now(),
    });
  }

  public GetSpinSettings(garantType: string = 'bet', bet: number, lines: number): [string, number] {
    let curField = 10;
    // Determine curField based on lines (simplified)
    if (lines <= 1) curField = 1;
    else if (lines <= 3) curField = 3;
    else if (lines <= 5) curField = 5;
    else if (lines <= 7) curField = 7;
    else if (lines <= 9) curField = 9;

    const pref = garantType !== 'bet' ? '_bonus' : '';
    this.AllBet = bet * lines; // Assuming CurrentDenom is already factored in bet/lines or applied later

    if(!this.game || !this.shop) return ['none', 0];

    const linesPercentConfigSpin = this.game.get_lines_percent_config('spin');
    const linesPercentConfigBonus = this.game.get_lines_percent_config('bonus');
    const currentPercent = this.shop.percent;
    let percentLevel = '';

    // Find percentLevel (simplified, assumes direct match or first entry)
    if (linesPercentConfigSpin && linesPercentConfigSpin['line' + curField + pref]) {
        for (const k in linesPercentConfigSpin['line' + curField + pref]) {
            const l = k.split('_');
            const l0 = parseInt(l[0], 10);
            const l1 = parseInt(l[1], 10);
            if (l0 <= currentPercent && currentPercent <= l1) {
                percentLevel = k;
                break;
            }
        }
    }
     if (!percentLevel && linesPercentConfigSpin && linesPercentConfigSpin['line' + curField + pref]) { // Fallback
        percentLevel = Object.keys(linesPercentConfigSpin['line' + curField + pref])[0];
    }


    const currentSpinWinChance = percentLevel ? linesPercentConfigSpin['line' + curField + pref][percentLevel] : 100; // Default to high chance if no config
    const currentBonusWinChance = percentLevel ? linesPercentConfigBonus['line' + curField + pref][percentLevel] : 500;


    const RtpControlCount = 200;
    if (!this.HasGameDataStatic('SpinWinLimit')) this.SetGameDataStatic('SpinWinLimit', 0);
    if (!this.HasGameDataStatic('RtpControlCount')) this.SetGameDataStatic('RtpControlCount', RtpControlCount);

    const rtpRange = this.game.stat_in > 0 ? (this.game.stat_out / this.game.stat_in * 100) : 0;

    if (this.GetGameDataStatic('RtpControlCount') === 0) {
        if (currentPercent + Math.random() * 2 < rtpRange && this.GetGameDataStatic('SpinWinLimit') <= 0) {
            this.SetGameDataStatic('SpinWinLimit', Math.floor(Math.random() * 26) + 25); // rand(25,50)
        }
        if (pref === '' && this.GetGameDataStatic('SpinWinLimit') > 0) {
            // Modify chances and MaxWin as in PHP
            // currentBonusWinChance = 5000; // This was PHP logic, might need adjustment
            // currentSpinWinChance = 20;
            this.MaxWin = Math.floor(Math.random() * 5) + 1;
            if (rtpRange < (currentPercent - 1)) {
                this.SetGameDataStatic('SpinWinLimit', 0);
                this.SetGameDataStatic('RtpControlCount', this.GetGameDataStatic('RtpControlCount') -1);
            }
        }
    } else if (this.GetGameDataStatic('RtpControlCount') < 0) {
        // Similar logic as above for RtpControlCount < 0
        if (currentPercent + Math.random() * 2 < rtpRange && this.GetGameDataStatic('SpinWinLimit') <= 0) {
            this.SetGameDataStatic('SpinWinLimit', Math.floor(Math.random() * 26) + 25);
        }
        this.SetGameDataStatic('RtpControlCount', this.GetGameDataStatic('RtpControlCount') - 1);
        if (pref === '' && this.GetGameDataStatic('SpinWinLimit') > 0) {
            // currentBonusWinChance = 5000;
            // currentSpinWinChance = 20;
            this.MaxWin = Math.floor(Math.random() * 5) + 1;
            if (rtpRange < (currentPercent - 1)) {
                this.SetGameDataStatic('SpinWinLimit', 0);
            }
        }
        if (this.GetGameDataStatic('RtpControlCount') < (-1 * RtpControlCount) && (currentPercent -1) <= rtpRange && rtpRange <= (currentPercent + 2)) {
            this.SetGameDataStatic('RtpControlCount', RtpControlCount);
        }
    } else {
        this.SetGameDataStatic('RtpControlCount', this.GetGameDataStatic('RtpControlCount') - 1);
    }


    const bonusWinRoll = Math.floor(Math.random() * currentBonusWinChance) + 1;
    const spinWinRoll = Math.floor(Math.random() * currentSpinWinChance) + 1;
    let result: [string, number] = ['none', 0];

    if (bonusWinRoll === 1 && this.slotBonus) {
      this.isBonusStart = true; // Make sure this is reset appropriately after bonus
      const currentGarantType = 'bonus';
      const winLimit = this.GetBank(currentGarantType);
      result = ['bonus', winLimit];
      const checkBonus = this.CheckBonusWin();
      if (this.game.stat_in < (checkBonus * bet + this.game.stat_out) || winLimit < (checkBonus * bet)) {
        result = ['none', 0];
      }
    } else if (spinWinRoll === 1) {
      const winLimit = this.GetBank(garantType);
      result = ['win', winLimit];
    }

    // Low balance kicker
    if (garantType === 'bet' && this.GetBalance() <= (2 / this.CurrentDenom)) {
        if (Math.random() < 0.1) { // 1 in 10 chance
             const winLimit = this.GetBank('');
             result = ['win', winLimit];
        }
    }
    return result;
  }

  public GetRandomScatterPos(rp: string[]): number {
    const rpResult: number[] = [];
    for (let i = 0; i < rp.length; i++) {
        if (rp[i] === '0') { // Assuming '0' is the scatter symbol
            if (i > 0 && i < rp.length -1) rpResult.push(i); // simplified from PHP
        }
    }
    if(rpResult.length === 0) return Math.floor(Math.random() * (rp.length - 2)) + 1; // ensure not first/last
    return rpResult[Math.floor(Math.random() * rpResult.length)];
  }


  public GetReelStrips(winType: string, slotEvent: string): any {
    // slotEvent is not used in PHP, kept for signature consistency
    const reelSet: any = { rp: [] };
    const reelStripsAvailable: string[] = [];
    for(let i=1; i<=6; i++){
        if((this as any)[`reelStrip${i}`] && (this as any)[`reelStrip${i}`].length > 0){
            reelStripsAvailable.push(`reelStrip${i}`);
        }
    }

    const prs: Record<number, number> = {};

    if (winType !== 'bonus') {
      reelStripsAvailable.forEach((reelStripName, index) => {
        const strip = (this as any)[reelStripName] as string[];
        prs[index + 1] = Math.floor(Math.random() * (strip.length - 2)); // Ensure space for 3 symbols
      });
    } else {
      // Bonus logic: try to place scatters
      const reelIndexes = reelStripsAvailable.map((_,i) => i + 1);
      reelIndexes.sort(() => Math.random() - 0.5); // Shuffle

      const scattersCnt = Math.floor(Math.random() * (reelIndexes.length - 2)) + 3; // rand(3, count(reelIndexes))

      for(let i=0; i < reelIndexes.length; i++){
          const currentReelIdx = reelIndexes[i];
          const strip = (this as any)[`reelStrip${currentReelIdx}`] as string[];
          if(i < scattersCnt){
              prs[currentReelIdx] = this.GetRandomScatterPos(strip);
          } else {
              prs[currentReelIdx] = Math.floor(Math.random() * (strip.length - 2));
          }
      }
    }

    for (const indexStr in prs) {
      const index = parseInt(indexStr, 10);
      const stripName = `reelStrip${index}`;
      const currentStrip = (this as any)[stripName] as string[];
      const pos = prs[index];

      reelSet['reel' + index] = [
        currentStrip[pos > 0 ? pos -1 : currentStrip.length -1], // Handle wrap around for previous symbol
        currentStrip[pos],
        currentStrip[pos < currentStrip.length -1 ? pos + 1 : 0], // Handle wrap around for next symbol
        '' // Placeholder for the 4th element if any (not in original PHP logic for visible part)
      ];
      reelSet.rp.push(pos);
    }
    return reelSet;
  }
}
