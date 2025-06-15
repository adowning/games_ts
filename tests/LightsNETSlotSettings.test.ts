import { LightsNETSlotSettings } from '../LightsNETSlotSettings'; // Adjust path
import { LightsNETGameReel } from '../LightsNETGameReel';

jest.mock('../LightsNETGameReel');

const mockUserLGT = {
  id: 1, shop_id: 1, balance: 40000, count_balance: 40000, session: JSON.stringify({}),
  is_blocked: false, status: 'active', address: 0, update: jest.fn(), save: jest.fn(),
  increment: jest.fn((field, value) => { (mockUserLGT as any)[field] = ((mockUserLGT as any)[field] || 0) + value; }),
  update_level: jest.fn(), updateCountBalance: jest.fn((sum, cb) => cb + sum), last_bid: new Date(),
};

const mockGameLGT = {
  name: 'LightsNET', shop_id: 1, denomination: 0.01, bet: '1,2,3,4,5,6,7,8,9,10', view: true, // Bet levels 1-10 for 9 lines
  slotViewState: 'Normal', advanced: JSON.stringify({}), jp_1: 0, jp_2: 0, jp_3: 0, jp_4: 0,
  jp_1_percent: 0, jp_2_percent: 0, jp_3_percent: 0, jp_4_percent: 0, id: 'gameLightsNet123',
  get_gamebank: jest.fn(() => 180000 * 100), set_gamebank: jest.fn(), save: jest.fn(), refresh: jest.fn(),
  stat_in: 0, stat_out: 0, increment: jest.fn(), tournament_stat: jest.fn(),
  get_lines_percent_config: jest.fn((type: 'spin' | 'bonus') => {
    const curField = 9; // Lights has 9 lines
    const pref = type === 'bonus' ? '_bonus' : '';
    return { [`line${curField}${pref}`]: { '0_100': 2 } }; // 1 in 2 chance
  }),
  bids: 0, rezerv: 0, game_win: {},
};

const mockShopLGT = {
  id: 1, max_win: 80000, percent: 95, is_blocked: false, currency: 'USD',
};

const MockDBOriginalLGT = (global as any).MockDB;
(global as any).MockDB = {
  User: { lockForUpdate: () => MockDB.User, find: jest.fn(() => mockUserLGT) },
  Game: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.Game, first: jest.fn(() => mockGameLGT) },
  Shop: { find: jest.fn(() => mockShopLGT) },
  JPG: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.JPG, get: jest.fn(() => []) }, // Lights doesn't have JPGs
  GameBank: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.GameBank, get: jest.fn(() => []) },
  GameLog: { whereRaw: jest.fn().mockReturnThis(), get: jest.fn(() => []), create: jest.fn() },
  StatGame: { create: jest.fn() }, Session: { where: jest.fn().mockReturnThis(), delete: jest.fn()},
  Carbon: { now: jest.fn(() => new Date())}, LibBanker: { get_all_banks: jest.fn(() => [1000,200,100,50,20])}
};
(MockDB.Game as any).$values = { denomination: [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00] };


describe('LightsNETSlotSettings', () => {
  let slotSettings: LightsNETSlotSettings;
  const mockReelsTxtLGT = `
reelStrip1=2,3,4,5,6,7,8,9,10,0,1
reelStrip2=2,3,4,5,6,7,8,9,10,0,1
reelStrip3=2,3,4,5,6,7,8,9,10,0,1
reelStrip4=2,3,4,5,6,7,8,9,10,0,1
reelStrip5=2,3,4,5,6,7,8,9,10,0,1
  `; // Simplified, assumes all base strips are the same for testing purposes

  beforeEach(() => {
    jest.clearAllMocks();
    (LightsNETGameReel as jest.Mock).mockImplementation(() => {
      const reelInstance = {
        reelsStrip: {
            reelStrip1: ['2','3','4','5','6','7','8','9','10','0','1'],
            reelStrip2: ['2','3','4','5','6','7','8','9','10','0','1'],
            reelStrip3: ['2','3','4','5','6','7','8','9','10','0','1'],
            reelStrip4: ['2','3','4','5','6','7','8','9','10','0','1'],
            reelStrip5: ['2','3','4','5','6','7','8','9','10','0','1'],
            reelStrip6:[]
        },
        reelsStripBonus: { /* Bonus strips could be defined here if used by SlotSettings directly */ }
      };
      return reelInstance;
    });

    slotSettings = new LightsNETSlotSettings('LightsNET', 1, mockReelsTxtLGT);
    slotSettings.user = JSON.parse(JSON.stringify(mockUserLGT));
    slotSettings.game = JSON.parse(JSON.stringify(mockGameLGT));
    slotSettings.shop = JSON.parse(JSON.stringify(mockShopLGT));
  });

  afterAll(() => { if(MockDBOriginalLGT) (global as any).MockDB = MockDBOriginalLGT; else delete (global as any).MockDB; });

  it('should initialize with correct LightsNET paytable', () => {
    expect(slotSettings.Paytable['SYM_3']).toEqual([0,0,0,15,200,1000]); // Red Lantern (corrected from PHP comment)
    expect(slotSettings.Paytable['SYM_12']).toEqual([0,0,0,3,15,30]); // 10
    expect(slotSettings.Paytable['SYM_0']).toEqual([0,0,0,0,0,0]);     // Scatter
    expect(slotSettings.Paytable['SYM_1']).toEqual([0,0,0,0,0,0]);     // Wild
  });

  it('should load 5 reel strips', () => {
    expect(slotSettings.reelStrip1?.length).toBeGreaterThan(0);
    expect(slotSettings.reelStrip5?.length).toBeGreaterThan(0);
    expect(slotSettings.reelStrip6).toBeNull(); // Or empty array
  });

  describe('GetReelStrips', () => {
    it('should return a 5x3 reel configuration', () => {
      const reels = slotSettings.GetReelStrips('win', 'bet');
      expect(reels.reel1.length).toBe(3 + 1); // 3 symbols + 1 empty string from PHP logic
      expect(reels.reel2.length).toBe(3 + 1);
      expect(reels.reel3.length).toBe(3 + 1);
      expect(reels.reel4.length).toBe(3 + 1);
      expect(reels.reel5.length).toBe(3 + 1);
      expect(reels.rp.length).toBe(5);
    });
  });

  it('should define correct free spin counts for scatters', () => {
    expect(slotSettings.slotFreeCount[3]).toBe(10); // 3 scatters = 10 FS
    expect(slotSettings.slotFreeCount[4]).toBe(20); // 4 scatters = 20 FS
    expect(slotSettings.slotFreeCount[5]).toBe(30); // 5 scatters = 30 FS
  });

  describe('GetSpinSettings', () => {
    it('should use line configuration for 9 lines', () => {
      slotSettings.GetSpinSettings('bet', 1 * 9, 9); // betlevel * lines, lines
      // Check if get_lines_percent_config was called with a key related to 'line9'
      expect(mockGameLGT.get_lines_percent_config).toHaveBeenCalledWith('spin');
      // The internal logic of GetSpinSettings would then use 'line9' based on lines=9
    });
  });

});

if(MockDBOriginalLGT) (global as any).MockDB = MockDBOriginalLGT;
else delete (global as any).MockDB;
