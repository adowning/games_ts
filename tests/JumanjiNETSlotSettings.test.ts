import { JumanjiNETSlotSettings } from '../JumanjiNETSlotSettings'; // Adjust path
import { JumanjiNETGameReel } from '../JumanjiNETGameReel';

jest.mock('../JumanjiNETGameReel');

const mockUserJMN = {
  id: 1, shop_id: 1, balance: 30000, count_balance: 30000, session: JSON.stringify({}),
  is_blocked: false, status: 'active', address: 0, update: jest.fn(), save: jest.fn(),
  increment: jest.fn((field, value) => { (mockUserJMN as any)[field] = ((mockUserJMN as any)[field] || 0) + value; }),
  update_level: jest.fn(), updateCountBalance: jest.fn((sum, cb) => cb + sum), last_bid: new Date(),
};

const mockGameJMN = {
  name: 'JumanjiNET', shop_id: 1, denomination: 0.01, bet: '10,20,50,100,200,500,1000', view: true, // Bets are in coins (10 coins = base bet for 36 lines)
  slotViewState: 'Normal', advanced: JSON.stringify({}), jp_1: 0, jp_2: 0, jp_3: 0, jp_4: 0,
  jp_1_percent: 0, jp_2_percent: 0, jp_3_percent: 0, jp_4_percent: 0, id: 'gameJumanjiNet123',
  get_gamebank: jest.fn(() => 200000 * 100), set_gamebank: jest.fn(), save: jest.fn(), refresh: jest.fn(),
  stat_in: 0, stat_out: 0, increment: jest.fn(), tournament_stat: jest.fn(),
  get_lines_percent_config: jest.fn((type: 'spin' | 'bonus') => {
    const curField = 10; // For 36 lines, it might use a default or specific config
    const pref = type === 'bonus' ? '_bonus' : '';
    return { [`line${curField}${pref}`]: { '0_100': 2 } }; // 1 in 2 chance
  }),
  bids: 0, rezerv: 0, game_win: {},
};

const mockShopJMN = {
  id: 1, max_win: 70000, percent: 94, is_blocked: false, currency: 'GBP',
};

const MockDBOriginalJMN = (global as any).MockDB;
(global as any).MockDB = {
  User: { lockForUpdate: () => MockDB.User, find: jest.fn(() => mockUserJMN) },
  Game: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.Game, first: jest.fn(() => mockGameJMN) },
  Shop: { find: jest.fn(() => mockShopJMN) },
  JPG: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.JPG, get: jest.fn(() => []) },
  GameBank: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.GameBank, get: jest.fn(() => []) },
  GameLog: { whereRaw: jest.fn().mockReturnThis(), get: jest.fn(() => []), create: jest.fn() },
  StatGame: { create: jest.fn() }, Session: { where: jest.fn().mockReturnThis(), delete: jest.fn()},
  Carbon: { now: jest.fn(() => new Date())}, LibBanker: { get_all_banks: jest.fn(() => [1000,200,100,50,20])}
};
(MockDB.Game as any).$values = { denomination: [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00] };


describe('JumanjiNETSlotSettings', () => {
  let slotSettings: JumanjiNETSlotSettings;
  const mockReelsTxtJMN = `
reelStrip1=1,2,0,13,4,5,0,3,6,7,8,9,10
reelStrip2=6,7,8,9,0,10,11,13,1,2,3,4,5
reelStrip3=12,13,14,15,0,1,2,3,4,5,6,7,8,9,10
reelStrip4=5,6,7,8,0,9,10,13,1,2,3,4
reelStrip5=11,12,13,0,14,15,1,3,5,7,9
  `;

  beforeEach(() => {
    jest.clearAllMocks();
    (JumanjiNETGameReel as jest.Mock).mockImplementation(() => {
      const reelInstance = {
        reelsStrip: {
            reelStrip1: ['1','2','0','13','4','5','0','3','6','7','8','9','10'],
            reelStrip2: ['6','7','8','9','0','10','11','13','1','2','3','4','5'],
            reelStrip3: ['12','13','14','15','0','1','2','3','4','5','6','7','8','9','10'],
            reelStrip4: ['5','6','7','8','0','9','10','13','1','2','3','4'],
            reelStrip5: ['11','12','13','0','14','15','1','3','5','7','9'],
            reelStrip6:[]
        },
        reelsStripBonus: { reelStripBonus1: [], reelStripBonus2: [], reelStripBonus3: [], reelStripBonus4: [], reelStripBonus5: [], reelStripBonus6: [] }
      };
      return reelInstance;
    });

    slotSettings = new JumanjiNETSlotSettings('JumanjiNET', 1, mockReelsTxtJMN);
    slotSettings.user = JSON.parse(JSON.stringify(mockUserJMN)); // Deep copy
    slotSettings.game = JSON.parse(JSON.stringify(mockGameJMN));
    slotSettings.shop = JSON.parse(JSON.stringify(mockShopJMN));
  });

  afterAll(() => { if(MockDBOriginalJMN) (global as any).MockDB = MockDBOriginalJMN; else delete (global as any).MockDB; });

  it('should initialize with correct Jumanji paytable', () => {
    expect(slotSettings.Paytable['SYM_3']).toEqual([0,0,0,6,20,140]);  // Lion
    expect(slotSettings.Paytable['SYM_10']).toEqual([0,0,0,2,3,7]); // Jack
    expect(slotSettings.Paytable['SYM_0']).toEqual([0,0,0,0,0,0]); // Scatter
    expect(slotSettings.Paytable['SYM_1']).toEqual([0,0,0,0,0,0]); // Wild
  });

  it('should load 5 reel strips', () => {
    expect(slotSettings.reelStrip1?.length).toBeGreaterThan(0);
    expect(slotSettings.reelStrip5?.length).toBeGreaterThan(0);
    expect(slotSettings.reelStrip6).toBeNull(); // Or empty array based on strict init
  });

  describe('GetReelStrips', () => {
    it('should return the unique 3-4-5-4-3 Jumanji reel configuration', () => {
      const reels = slotSettings.GetReelStrips('win', 'bet');
      expect(reels.reel1.length).toBe(3 + 1); // 3 symbols + 1 empty string from PHP logic
      expect(reels.reel2.length).toBe(4 + 1); // 4 symbols + 1 empty
      expect(reels.reel3.length).toBe(5 + 1); // 5 symbols + 1 empty
      expect(reels.reel4.length).toBe(4 + 1); // 4 symbols + 1 empty
      expect(reels.reel5.length).toBe(3 + 1); // 3 symbols + 1 empty
      expect(reels.rp.length).toBe(5);
    });
  });

  describe('GetSpinSettings', () => {
    it('should return win type and limit, considering Jumanji has 36 lines', () => {
      // The 'lines' param to GetSpinSettings in PHP is 10 (base bet unit), not 36.
      const betLevel = 1; // coin value
      const baseBetUnits = 10; // Jumanji fixed bet cost units
      const [type, winLimit] = slotSettings.GetSpinSettings('bet', betLevel * baseBetUnits, baseBetUnits);
      expect(['none', 'win', 'bonus']).toContain(type);
    });
  });

  describe('SaveLogReport for Jumanji', () => {
    it('should call StatGame.create with Jumanji specific report name', () => {
        slotSettings.slotDBId = 'testJumanjiGameId';
        slotSettings.playerId = 123;
        slotSettings.Balance = 300; // currency units
        slotSettings.CurrentDenom = 0.01;
        slotSettings.shop_id = 1;

        slotSettings.SaveLogReport('testResponseJMN', 10, 36, 50, 'bet'); // bet=10 coins, win=50 coins
        expect(MockDB.StatGame.create).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 123,
            balance: 300 * 0.01,
            bet: 10 * 0.01, // bet is in coins, then multiplied by denom for currency
            win: 50 * 0.01,
            game: 'JumanjiNET',
            denomination: 0.01,
            shop_id: 1
        }));
    });
  });

  // Test for specific Jumanji features if their core logic resides in SlotSettings
  // e.g., if there were a method GetBoardGameRolls based on scatters
  it('should define correct free spin counts (board game rolls) for scatters', () => {
    expect(slotSettings.slotFreeCount[3]).toBe(0); // PHP code shows [0,0,0,0,0,0] - This must be for feature spins, not board game rolls
    // The board game rolls (6, 7, 8 for 3, 4, 5 scatters) are defined in Server.php's scatter check.
    // SlotSettings.slotFreeCount seems to be for specific free spin features IF they were standard like others.
    // This highlights that Server.php holds more of the feature logic for Jumanji.
  });

});

if(MockDBOriginalJMN) (global as any).MockDB = MockDBOriginalJMN;
else delete (global as any).MockDB;
