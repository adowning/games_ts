import { ReelRush2NETSlotSettings } from '../ReelRush2NETSlotSettings'; // Adjust path
import { ReelRush2NETGameReel } from '../ReelRush2NETGameReel';

jest.mock('../ReelRush2NETGameReel');

const mockUserRR2 = {
  id: 1, shop_id: 1, balance: 50000, count_balance: 50000, session: JSON.stringify({}),
  is_blocked: false, status: 'active', address: 0, update: jest.fn(), save: jest.fn(),
  increment: jest.fn((field, value) => { (mockUserRR2 as any)[field] = ((mockUserRR2 as any)[field] || 0) + value; }),
  update_level: jest.fn(), updateCountBalance: jest.fn((sum, cb) => cb + sum), last_bid: new Date(),
};

const mockGameRR2 = {
  name: 'ReelRush2NET', shop_id: 1, denomination: 0.01, bet: '1,2,5,10,20', view: true, // Bet levels (coins per spin, effectively)
  slotViewState: 'Normal', advanced: JSON.stringify({}), jp_1: 0, jp_2: 0, jp_3: 0, jp_4: 0,
  jp_1_percent: 0, jp_2_percent: 0, jp_3_percent: 0, jp_4_percent: 0, id: 'gameRR2Net123',
  get_gamebank: jest.fn(() => 300000 * 100), set_gamebank: jest.fn(), save: jest.fn(), refresh: jest.fn(),
  stat_in: 0, stat_out: 0, increment: jest.fn(), tournament_stat: jest.fn(),
  get_lines_percent_config: jest.fn((type: 'spin' | 'bonus') => {
    // Reel Rush 2 uses "ways to win" which change, not fixed lines for win calc.
    // The 'lines' param in GetSpinSettings (PHP) refers to bet cost units (20).
    const curField = 20;
    const pref = type === 'bonus' ? '_bonus' : '';
    return { [`line${curField}${pref}`]: { '0_100': 2 } };
  }),
  bids: 0, rezerv: 0, game_win: {},
};

const mockShopRR2 = {
  id: 1, max_win: 100000, percent: 96, is_blocked: false, currency: 'USD',
};

const MockDBOriginalRR2 = (global as any).MockDB;
(global as any).MockDB = {
  User: { lockForUpdate: () => MockDB.User, find: jest.fn(() => mockUserRR2) },
  Game: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.Game, first: jest.fn(() => mockGameRR2) },
  Shop: { find: jest.fn(() => mockShopRR2) },
  JPG: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.JPG, get: jest.fn(() => []) },
  GameBank: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.GameBank, get: jest.fn(() => []) },
  GameLog: { whereRaw: jest.fn().mockReturnThis(), get: jest.fn(() => []), create: jest.fn() },
  StatGame: { create: jest.fn() }, Session: { where: jest.fn().mockReturnThis(), delete: jest.fn()},
  Carbon: { now: jest.fn(() => new Date())}, LibBanker: { get_all_banks: jest.fn(() => [1000,200,100,50,20])}
};
(MockDB.Game as any).$values = { denomination: [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00] };


describe('ReelRush2NETSlotSettings', () => {
  let slotSettings: ReelRush2NETSlotSettings;
  const mockReelsTxtRR2 = `
reelStrip1=1,2,3,4,5,WILD,SCATTER
reelStrip2=6,7,8,9,10,WILD,SCATTER
reelStrip3=11,12,13,14,15,WILD,SCATTER
reelStrip4=1,2,3,8,9,WILD,SCATTER
reelStrip5=5,6,7,10,11,WILD,SCATTER
  `;

  beforeEach(() => {
    jest.clearAllMocks();
    (ReelRush2NETGameReel as jest.Mock).mockImplementation(() => {
      const reelInstance = {
        reelsStrip: {
            reelStrip1: ['1','2','3','4','5','WILD','SCATTER'],
            reelStrip2: ['6','7','8','9','10','WILD','SCATTER'],
            reelStrip3: ['11','12','13','14','15','WILD','SCATTER'],
            reelStrip4: ['1','2','3','8','9','WILD','SCATTER'],
            reelStrip5: ['5','6','7','10','11','WILD','SCATTER'],
            reelStrip6:[]
        },
        reelsStripBonus: { /* Define if specific bonus strips are used by SlotSettings directly */ }
      };
      return reelInstance;
    });

    slotSettings = new ReelRush2NETSlotSettings('ReelRush2NET', 1, mockReelsTxtRR2);
    slotSettings.user = JSON.parse(JSON.stringify(mockUserRR2));
    slotSettings.game = JSON.parse(JSON.stringify(mockGameRR2));
    slotSettings.shop = JSON.parse(JSON.stringify(mockShopRR2));
  });

  afterAll(() => { if(MockDBOriginalRR2) (global as any).MockDB = MockDBOriginalRR2; else delete (global as any).MockDB; });

  it('should initialize with correct ReelRush2NET paytable', () => {
    expect(slotSettings.Paytable['SYM_3']).toEqual([0,0,0,10,50,200]);  // Strawberry
    expect(slotSettings.Paytable['SYM_13']).toEqual([0,0,0,1,5,10]); // Purple Sweet
    expect(slotSettings.Paytable['SYM_1']).toEqual([0,0,0,0,0,0]); // Wild
  });

  it('should load 5 reel strips', () => {
    expect(slotSettings.reelStrip1?.length).toBeGreaterThan(0);
    expect(slotSettings.reelStrip5?.length).toBeGreaterThan(0);
    expect(slotSettings.reelStrip6).toBeNull();
  });

  describe('GetReelStrips', () => {
    it('should return a 5x5 reel symbol structure for each of the 5 reels', () => {
      // The respinId argument influences how the Server interprets/masks these reels,
      // but SlotSettings.GetReelStrips in PHP always provides the full 5 symbols per reel.
      const reels = slotSettings.GetReelStrips('win', 'bet', 0); // respinId 0 (initial)
      expect(reels.reel1.length).toBe(5 + 1); // 5 symbols + 1 empty string from PHP logic
      expect(reels.reel2.length).toBe(5 + 1);
      expect(reels.reel3.length).toBe(5 + 1);
      expect(reels.reel4.length).toBe(5 + 1);
      expect(reels.reel5.length).toBe(5 + 1);
      expect(reels.rp.length).toBe(5);
    });
  });

  it('should define correct free spin counts (for features, not direct scatter trigger)', () => {
    // In ReelRush2, scatters don't directly award X free spins. They unlock blocks / lead to FS choice.
    // slotFreeCount is [0,0,0,8,8,8] in PHP - this might be for a specific feature's FS count if won.
    expect(slotSettings.slotFreeCount[3]).toBe(8);
  });

  describe('Random Feature Stubs', () => {
    it('SymbolUpgrade should return a feature string part', () => {
        const reelsMock = {}; // Not actually modified by this stub
        const featureStr = slotSettings.SymbolUpgrade(reelsMock, 0);
        expect(featureStr).toContain('&features.i0.type=SymbolUpgrade');
        expect(featureStr).toMatch(/&features.i0.data.from=SYM\d+/);
        expect(featureStr).toMatch(/&features.i0.data.to=SYM\d+/);
    });
    it('RandomWilds should return a feature string part', () => {
        const reelsMock = {};
        const featureStr = slotSettings.RandomWilds(reelsMock, 1);
        expect(featureStr).toContain('&features.i1.type=RandomWilds');
        expect(featureStr).toContain('&features.i1.data.positions=');
    });
  });

});

if(MockDBOriginalRR2) (global as any).MockDB = MockDBOriginalRR2;
else delete (global as any).MockDB;
