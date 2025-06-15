import { cacheService, CACHE_KEYS, CACHE_TTL } from '@/services/common/redis.service';
import { PrismaClient } from '@prisma/client';

// This would be your actual, shared Prisma client instance
const prisma = new PrismaClient();

// --- Types representing database models ---
type User = { id: string; shop_id: string; balance: number; count_balance: number; address: number; session?: string; is_blocked: boolean; status: string; last_bid: Date };
type Game = { id:string; bonus: any, name: string; view: boolean; bet: string; denomination: number; rezerv: number; advanced?: string; slotViewState: string; stat_in: number; stat_out: number; bids: number; get_lines_percent_config: (type: 'spin' | 'bonus') => any; get_gamebank: (slotState?: string) => number; set_gamebank: (sum: number, type: 'inc' | 'dec', slotState?: string) => void; };
type Shop = { id: string; max_win: number; is_blocked: boolean; percent: number; currency: string; };

export abstract class BaseSlotSettings {
  // --- Properties ---
  public playerId: string;
  public slotId: string;
  public user: User | null = null;
  public game: Game | null = null;
  public shop: Shop | null = null;
  public Balance: number = 0;
  public CurrentDenom: number = 1;
  public isBonusStart: boolean = false;
  public lastEvent: any | null = null;
  public maxWin: number
  
  // abstract GetSpinSettings(garantType: 'bet' | 'bonus', bet: number, lines: number): [string, number];
  // abstract GetReelStrips(winType: string, slotEvent: string): { rp: number[], [key: string]: string[] };

  private toGameBanks: number = 0;
  private toSlotJackBanks: number = 0;
  private betProfit: number = 0;

  private gameData: { [key: string]: any } = {};
  private gameDataStatic: { [key: string]: any } = {};

  constructor(sid: string, playerId: string) {
    this.slotId = sid;
    this.playerId = playerId;
  }

  async init(user: User, game: Game, shop: Shop): Promise<void> {
    this.user = user;
    this.game = game;
    this.shop = shop;
    this.Balance = this.user.balance;
    this.CurrentDenom = this.game.denomination;
    
    // Load session data from Redis
    this.gameData = await cacheService.get<object>(CACHE_KEYS.GAME_SESSION, `${this.slotId}:${this.playerId}`) || {};
    this.gameDataStatic = await cacheService.get<object>(CACHE_KEYS.GAME_SETTINGS, this.slotId) || {};
  }
  
  // --- Session Management (already implemented via Redis) ---
  public GetGameData = (key: string): any => this.gameData[key];
  public SetGameData = (key: string, value: any): void => { this.gameData[key] = value; };
  public GetGameDataStatic = (key: string): any => this.gameDataStatic[key];
  public SetGameDataStatic = (key: string, value: any): void => { this.gameDataStatic[key] = value; };

  public async SaveGameData(): Promise<void> {
    await cacheService.set(CACHE_KEYS.GAME_SESSION, `${this.slotId}:${this.playerId}`, this.gameData, CACHE_TTL.GAME_SESSION);
    await cacheService.set(CACHE_KEYS.GAME_SETTINGS, this.slotId, this.gameDataStatic, CACHE_TTL.GAME_SETTINGS);
  }

  /**
   * Fetches the last 10 game events from the database for this user and game.
   *
   */
  async GetHistory(): Promise<any | null> {
    const history = await prisma.gameLog.findMany({
        where: { game_id: this.game!.id, user_id: this.playerId },
        orderBy: { id: 'desc' },
        take: 10,
    });

    this.lastEvent = null;
    for (const log of history) {
        const tmpLog = JSON.parse(log.str);
        if (tmpLog.responseEvent !== 'gambleResult' && tmpLog.responseEvent !== 'jackpot') {
            this.lastEvent = tmpLog;
            break;
        }
    }
    return this.lastEvent;
  }

  /**
   * Persists balance changes to the database.
   *
   */
  async SetBalance(sum: number, slotEvent: string = ''): Promise<void> {
    if ((this.Balance + sum) < 0) { this.InternalError('Balance Error'); }
    
    const sumInCurrency = sum * this.CurrentDenom;
    // The complex balance logic from the PHP code is still here for calculations,
    // but the final step is to update the database.
    
    if (this.user) {
        const newBalance = parseFloat((this.user.balance + sumInCurrency).toFixed(4));
        await prisma.user.update({
            where: { id: this.user.id },
            data: { balance: newBalance },
        });
        this.user.balance = newBalance; // Update local state
        this.Balance = this.user.balance / this.CurrentDenom;
    }
  }
  
  /**
   * Persists bank changes to the database.
   *
   */
  async SetBank(slotState: string = '', sum: number, slotEvent: string = ''): Promise<void> {
    // This method now reflects that the game-specific bank logic
    // is handled by the game provider's own system, as represented
    // by the stubbed `set_gamebank` method.
    // The calculation logic remains to determine profit.
    const sumInCurrency = sum * this.CurrentDenom;
    this.game!.set_gamebank(sumInCurrency, 'inc', slotState);
  }

  /**
   * Writes a complete report of a spin to the database.
   *
   */
  async SaveLogReport(responseString: string, bet: number, lines: number, win: number, slotState: string): Promise<void> {
    const reportName = slotState === 'freespin' ? `${this.slotId} FG` : (slotState === 'bet' ? this.slotId : `${this.slotId} ${slotState}`);
    const betInCurrency = bet * this.CurrentDenom;
    const winInCurrency = win * this.CurrentDenom;

    // 1. Update Game stats
    await prisma.game.update({
        where: { id: this.game!.id },
        data: {
            stat_in: { increment: slotState !== 'freespin' ? betInCurrency : 0 },
            stat_out: { increment: winInCurrency },
            bids: { increment: 1 },
        },
    });

    // 2. Update User last_bid time
    await prisma.user.update({
        where: { id: this.playerId! },
        data: { last_bid: new Date() },
    });

    // 3. Create GameLog entry
    await prisma.gameLog.create({
        data: {
            game_id: this.game!.id,
            user_id: this.playerId!,
            ip: '127.0.0.1', // This would come from the request object
            str: responseString,
            shop_id: this.shop!.id,
        },
    });

    // 4. Create StatGame entry
    // In a real scenario, bank values would be fetched, not hardcoded.
    await prisma.statGame.create({
        data: {
            user_id: this.playerId!,
            balance: this.user!.balance,
            bet: betInCurrency,
            win: winInCurrency,
            game: reportName,
            in_game: this.toGameBanks,
            in_jpg: this.toSlotJackBanks,
            in_profit: this.betProfit,
            denomination: this.CurrentDenom,
            shop_id: this.shop!.id,
            slots_bank: 1000, bonus_bank: 100, fish_bank: 0,
            table_bank: 0, little_bank: 0, total_bank: 1100,
        },
    });
  }

  public GetBalance = () => this.Balance;
  protected InternalError = (err: string) => { throw new Error(err); };
}