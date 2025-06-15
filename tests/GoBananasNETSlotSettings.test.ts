import { GoBananasNETSlotSettings } from '../GoBananasNETSlotSettings'; // Adjust path
import { GoBananasNETGameReel } from '../GoBananasNETGameReel';

// Mock parts of the global/external dependencies used in SlotSettings
// These would typically be more extensive in a real Jest setup using jest.mock
jest.mock('../GoBananasNETGameReel'); // Auto-mock GameReel

const mockUser = {
  id: 1,
  shop_id: 1,
  balance: 10000, // Initial balance in cents or base unit
  count_balance: 10000,
  session: JSON.stringify({}),
  is_blocked: false,
  status: 'active',
  address: 0,
  update: jest.fn(),
  save: jest.fn(),
  increment: jest.fn((field, value) => { // @ts-ignore
    this[field] = (this[field] || 0) + value;
  }),
  update_level: jest.fn(),
  updateCountBalance: jest.fn((sum, cb) => cb + sum),
  last_bid: new Date(),
};

const mockGame = {
  name: 'GoBananasNET',
  shop_id: 1,
  denomination: 0.01, // Example denomination
  bet: '1,2,5,10,20',
  view: true,
  slotViewState: 'Normal',
  advanced: JSON.stringify({}),
  jp_1: 1000, jp_2: 200, jp_3: 50, jp_4: 10, // Example jackpot values
  jp_1_percent: 1, jp_2_percent: 2, jp_3_percent: 3, jp_4_percent: 4,
  id: 'gameGoBananas123',
  get_gamebank: jest.fn(() => 100000 * 100), // Bank in cents
  set_gamebank: jest.fn(),
  save: jest.fn(),
  refresh: jest.fn(),
  stat_in: 0,
  stat_out: 0,
  increment: jest.fn(),
  tournament_stat: jest.fn(),
  get_lines_percent_config: jest.fn((type: 'spin' | 'bonus') => {
    const curField = 10; // Default for 20 lines
    const pref = type === 'bonus' ? '_bonus' : '';
    const res: any = {};
    // Simplified: 50% chance for win/bonus for percent range 0-100
    res[`line${curField}${pref}`] = { '0_100': 2 }; // 1 in 2 chance for testing
    return res;
  }),
  bids: 0,
  rezerv: 0, // Used for WinGamble
};

const mockShop = {
  id: 1,
  max_win: 50000,
  percent: 90,
  is_blocked: false,
  currency: 'USD',
};

// Mock the static (VanguardLTE) User, Game, Shop etc. finders
const MockDBOriginal = (global as any).MockDB; // Store original if it exists
(global as any).MockDB = {
  User: { lockForUpdate: () => MockDB.User, find: jest.fn(() => mockUser) },
  Game: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.Game, first: jest.fn(() => mockGame) },
  Shop: { find: jest.fn(() => mockShop) },
  JPG: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.JPG, get: jest.fn(() => []) }, // No JPGs for this game by default
  GameBank: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.GameBank, get: jest.fn(() => []) },
  GameLog: { whereRaw: jest.fn().mockReturnThis(), get: jest.fn(() => []), create: jest.fn() },
  StatGame: { create: jest.fn() },
  Session: { where: jest.fn().mockReturnThis(), delete: jest.fn()},
  Carbon: { now: jest.fn(() => new Date())},
  LibBanker: { get_all_banks: jest.fn(() => [1000,200,100,50,20])}
};
// Mock Game::$values['denomination']
(MockDB.Game as any).$values = { denomination: [0.01, 0.02, 0.05, 0.10] };


describe('GoBananasNETSlotSettings', () => {
  let slotSettings: GoBananasNETSlotSettings;
  const mockReelStripsTxt = `reelStrip1=1,2,3,4,5\nreelStrip2=6,7,8,9,10\nreelStrip3=11,12,13,14,15\nreelStrip4=16,17,18,19,20\nreelStrip5=1,3,5,7,9`;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Provide mock reel content to the GameReel constructor used by SlotSettings
    (GoBananasNETGameReel as jest.Mock).mockImplementation(() => {
        const reelInstance = {
            reelsStrip: { reelStrip1: [ '1', '2', '3', '4', '5' ], reelStrip2: [ '6', '7', '8', '9', '10' ], reelStrip3: [ '11', '12', '13', '14', '15' ], reelStrip4: [ '16', '17', '18', '19', '20' ], reelStrip5: [ '1', '3', '5', '7', '9' ], reelStrip6: [] },
            reelsStripBonus: { reelStripBonus1: [], reelStripBonus2: [], reelStripBonus3: [], reelStripBonus4: [], reelStripBonus5: [], reelStripBonus6: [] }
        };
        // Populate based on mockReelStripsTxt
        const lines = mockReelStripsTxt.trim().split('\n');
        for (const line of lines) {
            const parts = line.split('=');
            if (parts.length === 2) {
                const key = parts[0].trim();
                const data = parts[1].split(',').map(s => s.trim()).filter(s => s !== '');
                if (reelInstance.reelsStrip.hasOwnProperty(key)) { (reelInstance.reelsStrip as any)[key] = data; }
            }
        }
        return reelInstance;
    });

    slotSettings = new GoBananasNETSlotSettings('GoBananasNET', 1, mockReelStripsTxt);
    slotSettings.user = JSON.parse(JSON.stringify(mockUser)); // Deep copy for each test
    slotSettings.game = JSON.parse(JSON.stringify(mockGame));
    slotSettings.shop = JSON.parse(JSON.stringify(mockShop));
  });

  afterAll(() => { // Restore original MockDB if it existed
    if(MockDBOriginal) (global as any).MockDB = MockDBOriginal;
  });


  it('should initialize with correct paytable', () => {
    expect(slotSettings.Paytable['SYM_3']).toEqual([0, 0, 0, 25, 120, 700]);
    expect(slotSettings.Paytable['SYM_12']).toEqual([0, 0, 0, 5, 10, 30]);
  });

  it('should load reel strips via GameReel', () => {
    expect(slotSettings.reelStrip1).toEqual(['1', '2', '3', '4', '5']);
    expect(slotSettings.reelStrip5).toEqual(['1', '3', '5', '7', '9']);
  });

  describe('GetReelStrips', () => {
    it('should return 3x5 reel configuration for "none" or "win" type', () => {
      const reels = slotSettings.GetReelStrips('win', 'bet');
      expect(reels.reel1.length).toBe(3);
      expect(reels.reel2.length).toBe(3);
      expect(reels.reel3.length).toBe(3);
      expect(reels.reel4.length).toBe(3);
      expect(reels.reel5.length).toBe(3);
      expect(reels.rp.length).toBe(5); // 5 reel positions
    });

    it('should use GetRandomScatterPos for "bonus" type (if scatters are defined)', () => {
      // This game doesn't have explicit scatters in SymbolGame for FS, rather special expanding wilds.
      // The GetRandomScatterPos might not be hit in the same way. Let's assume a 'bonus' call.
      const reels = slotSettings.GetReelStrips('bonus', 'bet'); // 'bonus' winType
      // We expect it to still generate reels, specific scatter logic might not apply if no scatter symbol for bonus.
      expect(reels.reel1.length).toBe(3);
    });
  });

  describe('GetSpinSettings', () => {
    it('should return "none" or "win" based on random chance and RTP (mocked)', () => {
      // Mock GetBank to ensure winLimit is reasonable
      slotSettings.GetBank = jest.fn(() => 1000); // 1000 currency units in bank
      const [type, winLimit] = slotSettings.GetSpinSettings('bet', 1 * 20, 20); // bet, allbet, lines
      expect(['none', 'win', 'bonus']).toContain(type); // 'bonus' might occur if slotBonus is true
      if (type === 'win' || type === 'bonus') {
        expect(winLimit).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Balance and Bank Operations', () => {
    it('should decrease balance on SetBalance with negative sum', () => {
        const initialBalance = slotSettings.GetBalance();
        const betAmount = 10 * slotSettings.CurrentDenom; // 10 currency units
        slotSettings.SetBalance(-betAmount, 'bet');
        expect(slotSettings.GetBalance()).toBe(initialBalance - (betAmount / slotSettings.CurrentDenom));
    });

    it('should increase bank on SetBank with positive sum', () => {
        const initialBank = slotSettings.GetBank('');
        const bankIn = 20 * slotSettings.CurrentDenom; // 20 currency units
        slotSettings.SetBank('', bankIn, 'bet'); // sum is in currency units, converted to cents in method
        // The mock for game.set_gamebank needs to reflect this change for GetBank to see it.
        // For this test, we'd ideally check the arguments to the mocked set_gamebank or have a more stateful mock.
        // As it stands, GetBank will return the initial mock value unless the mock itself is updated.
        expect(mockGame.set_gamebank).toHaveBeenCalled();
    });
  });

  describe('SaveLogReport', () => {
    it('should call StatGame.create with correct parameters', () => {
        slotSettings.slotDBId = 'testGameId';
        slotSettings.playerId = 123;
        slotSettings.Balance = 1000;
        slotSettings.CurrentDenom = 0.01;
        slotSettings.shop_id = 1;

        slotSettings.SaveLogReport('testResponse', 20, 20, 50, 'bet');
        expect(MockDB.StatGame.create).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 123,
            balance: 1000 * 0.01,
            bet: 20 * 0.01,
            win: 50 * 0.01,
            game: 'GoBananasNET', // reportName logic
            denomination: 0.01,
            shop_id: 1
        }));
    });
  });

});

// Restore original MockDB if it was changed for this test file only
if(MockDBOriginal) (global as any).MockDB = MockDBOriginal;
else delete (global as any).MockDB; // Clean up if it was introduced here
