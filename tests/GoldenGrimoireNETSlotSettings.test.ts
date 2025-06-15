import { GoldenGrimoireNETSlotSettings } from '../GoldenGrimoireNETSlotSettings'; // Adjust path
import { GoldenGrimoireNETGameReel } from '../GoldenGrimoireNETGameReel';

jest.mock('../GoldenGrimoireNETGameReel');

const mockUser = {
  id: 1, shop_id: 1, balance: 20000, count_balance: 20000, session: JSON.stringify({}),
  is_blocked: false, status: 'active', address: 0, update: jest.fn(), save: jest.fn(),
  increment: jest.fn((field, value) => { (mockUser as any)[field] = ((mockUser as any)[field] || 0) + value; }),
  update_level: jest.fn(), updateCountBalance: jest.fn((sum, cb) => cb + sum), last_bid: new Date(),
};

const mockGame = {
  name: 'GoldenGrimoireNET', shop_id: 1, denomination: 0.02, bet: '1,2,3,4,5', view: true,
  slotViewState: 'Normal', advanced: JSON.stringify({}), jp_1: 0, jp_2: 0, jp_3: 0, jp_4: 0,
  jp_1_percent: 0, jp_2_percent: 0, jp_3_percent: 0, jp_4_percent: 0, id: 'gameGGNet123',
  get_gamebank: jest.fn(() => 150000 * 100), set_gamebank: jest.fn(), save: jest.fn(), refresh: jest.fn(),
  stat_in: 0, stat_out: 0, increment: jest.fn(), tournament_stat: jest.fn(),
  get_lines_percent_config: jest.fn((type: 'spin' | 'bonus') => {
    const curField = 10; // Default for 20/40 lines
    const pref = type === 'bonus' ? '_bonus' : '';
    return { [`line${curField}${pref}`]: { '0_100': 2 } }; // 1 in 2 chance
  }),
  bids: 0, rezerv: 0, game_win: {},
};

const mockShop = {
  id: 1, max_win: 60000, percent: 92, is_blocked: false, currency: 'EUR',
};

const MockDBOriginal = (global as any).MockDB;
(global as any).MockDB = {
  User: { lockForUpdate: () => MockDB.User, find: jest.fn(() => mockUser) },
  Game: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.Game, first: jest.fn(() => mockGame) },
  Shop: { find: jest.fn(() => mockShop) },
  JPG: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.JPG, get: jest.fn(() => []) },
  GameBank: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.GameBank, get: jest.fn(() => []) },
  GameLog: { whereRaw: jest.fn().mockReturnThis(), get: jest.fn(() => []), create: jest.fn() },
  StatGame: { create: jest.fn() }, Session: { where: jest.fn().mockReturnThis(), delete: jest.fn()},
  Carbon: { now: jest.fn(() => new Date())}, LibBanker: { get_all_banks: jest.fn(() => [1000,200,100,50,20])}
};
(MockDB.Game as any).$values = { denomination: [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00] };


describe('GoldenGrimoireNETSlotSettings', () => {
  let slotSettings: GoldenGrimoireNETSlotSettings;
  const mockReelsTxt = `reelStrip1=1,2,0,13,4,5,0\nreelStrip2=6,7,8,13,9,10,0\nreelStrip3=11,12,13,0,14,15,1\nreelStrip4=16,17,18,13,19,20,0\nreelStrip5=1,0,5,13,7,9,0`;

  beforeEach(() => {
    jest.clearAllMocks();
    (GoldenGrimoireNETGameReel as jest.Mock).mockImplementation(() => {
      const reelInstance = {
        reelsStrip: { reelStrip1: ['1','2','0','13','4','5','0'], reelStrip2: ['6','7','8','13','9','10','0'], reelStrip3: ['11','12','13','0','14','15','1'], reelStrip4:['16','17','18','13','19','20','0'], reelStrip5:['1','0','5','13','7','9','0'], reelStrip6:[] },
        reelsStripBonus: { reelStripBonus1: [], reelStripBonus2: [], reelStripBonus3: [], reelStripBonus4: [], reelStripBonus5: [], reelStripBonus6: [] }
      };
      return reelInstance;
    });

    slotSettings = new GoldenGrimoireNETSlotSettings('GoldenGrimoireNET', 1, mockReelsTxt);
    slotSettings.user = JSON.parse(JSON.stringify(mockUser));
    slotSettings.game = JSON.parse(JSON.stringify(mockGame));
    slotSettings.shop = JSON.parse(JSON.stringify(mockShop));
  });

  afterAll(() => { if(MockDBOriginal) (global as any).MockDB = MockDBOriginal; else delete (global as any).MockDB; });

  it('should initialize with correct paytable for GoldenGrimoireNET', () => {
    expect(slotSettings.Paytable['SYM_3']).toEqual([0,0,0,10,30,100]); // Red Gem
    expect(slotSettings.Paytable['SYM_10']).toEqual([0,0,0,3,8,15]); // Blue Spade
    expect(slotSettings.Paytable['SYM_1']).toBeUndefined(); // Wild has no direct payout
    expect(slotSettings.Paytable['SYM_0']).toBeUndefined(); // Scatter has no direct payout
    expect(slotSettings.Paytable['SYM_13']).toBeUndefined(); // Mystery has no direct payout
  });

  it('should load 5 reel strips from GameReel', () => {
    expect(slotSettings.reelStrip1).toEqual(['1','2','0','13','4','5','0']);
    expect(slotSettings.reelStrip5).toEqual(['1','0','5','13','7','9','0']);
    expect(slotSettings.reelStrip6).toBeNull(); // Or empty array depending on init
  });

  describe('GetReelStrips', () => {
    it('should return 4x5 reel configuration for "win" type', () => {
      const reels = slotSettings.GetReelStrips('win', 'bet');
      expect(reels.reel1.length).toBe(4); // 4 symbols per reel
      expect(reels.reel2.length).toBe(4);
      expect(reels.reel3.length).toBe(4);
      expect(reels.reel4.length).toBe(4);
      expect(reels.reel5.length).toBe(4);
      expect(reels.rp.length).toBe(5); // 5 reel positions
      expect(reels.reel1[3]).toBe(''); // 4th element for display, 5th is empty string
    });

    it('should use GetRandomScatterPos for "bonus" type to place scatters', () => {
      // Mock GetRandomScatterPos to control its output for testing
      const originalGetRandomScatterPos = slotSettings.GetRandomScatterPos;
      slotSettings.GetRandomScatterPos = jest.fn((strip) => Math.floor(strip.length / 2)); // Predictable pos

      const reels = slotSettings.GetReelStrips('bonus', 'bet');
      // Expect that GetRandomScatterPos was called for reels that have strips
      // The number of calls depends on how many strips are defined and the scatter placement logic
      // In GoldenGrimoire, it tries to place 5 scatters.
      expect(slotSettings.GetRandomScatterPos).toHaveBeenCalledTimes(5);

      // Verify that some reels have the scatter symbol ('0') at the expected middle position of the 4 visible symbols
      // This depends on the mocked GetRandomScatterPos and the actual strip content
      // For example, if GetRandomScatterPos returns index 2 for a strip, and strip[2] is '0'
      // then one of the reel's symbols should be '0'.
      // This test is a bit conceptual without knowing exact strip contents used by the mocked GetRandomScatterPos.

      slotSettings.GetRandomScatterPos = originalGetRandomScatterPos; // Restore
    });
  });

  describe('SaveLogReport', () => {
    it('should call StatGame.create with correct parameters for GoldenGrimoireNET', () => {
        slotSettings.slotDBId = 'testGGGameId';
        slotSettings.playerId = 123;
        slotSettings.Balance = 2000; // currency units
        slotSettings.CurrentDenom = 0.02;
        slotSettings.shop_id = 1;

        slotSettings.SaveLogReport('testResponseGG', 40, 20, 100, 'bet'); // bet = 40 coins, win = 100 coins
        expect(MockDB.StatGame.create).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 123,
            balance: 2000 * 0.02, // Balance in currency
            bet: 40 * 0.02, // Bet in currency
            win: 100 * 0.02, // Win in currency
            game: 'GoldenGrimoireNET',
            denomination: 0.02,
            shop_id: 1
        }));
    });
  });
});

if(MockDBOriginal) (global as any).MockDB = MockDBOriginal;
else delete (global as any).MockDB;
