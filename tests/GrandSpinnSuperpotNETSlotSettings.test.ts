import { GrandSpinnSuperpotNETSlotSettings } from '../GrandSpinnSuperpotNETSlotSettings'; // Adjust path
import { GrandSpinnSuperpotNETGameReel } from '../GrandSpinnSuperpotNETGameReel';

jest.mock('../GrandSpinnSuperpotNETGameReel');

const mockUserGSS = {
  id: 1, shop_id: 1, balance: 50000, count_balance: 50000, session: JSON.stringify({}),
  is_blocked: false, status: 'active', address: 0, update: jest.fn(), save: jest.fn(),
  increment: jest.fn((field, value) => { (mockUserGSS as any)[field] = ((mockUserGSS as any)[field] || 0) + value; }),
  update_level: jest.fn(), updateCountBalance: jest.fn((sum, cb) => cb + sum), last_bid: new Date(),
};

const mockGameGSS = {
  name: 'GrandSpinnSuperpotNET', shop_id: 1, denomination: 0.02, bet: '2,4,10,20,40,100,200', view: true,
  slotViewState: 'Normal', advanced: JSON.stringify({}),
  // GrandSpinn Superpot has 1 progressive (Mega/Superpot from JPG) and 2 fixed (Midi, Mini from game table)
  jp_1: 0, // This would be the progressive from JPG, so game table might not store its value directly
  jp_2: 100 * 100, // Midi Jackpot in cents (e.g., 100 currency units)
  jp_3: 20 * 100,  // Mini Jackpot in cents (e.g., 20 currency units)
  jp_1_percent: 1.5, jp_2_percent: 0, jp_3_percent: 0, // Percent for progressive, fixed don't contribute via percent from bet
  id: 'gameGSS123', get_gamebank: jest.fn(() => 250000 * 100), set_gamebank: jest.fn(),
  save: jest.fn(), refresh: jest.fn(), stat_in: 0, stat_out: 0, increment: jest.fn(),
  tournament_stat: jest.fn(), get_lines_percent_config: jest.fn(() => ({ line1: { '0_100': 2 } })), // 1 line game
  bids: 0, rezerv: 0, game_win: {},
};

const mockShopGSS = {
  id: 1, max_win: 100000, percent: 96, is_blocked: false, currency: 'EUR',
};

// Mock JPG for Superpot
const mockJpgGSS = [{
    id:1, balance: 5000 * 100, percent: 1.5, get_pay_sum: jest.fn(() => 0), // No pending payout initially
    user_id:null, save: jest.fn(), get_min: jest.fn(()=> 100*100), get_start_balance: jest.fn(()=>1000*100), add_jpg: jest.fn()
}];


const MockDBOriginalGSS = (global as any).MockDB;
(global as any).MockDB = {
  User: { lockForUpdate: () => MockDB.User, find: jest.fn(() => mockUserGSS) },
  Game: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.Game, first: jest.fn(() => mockGameGSS) },
  Shop: { find: jest.fn(() => mockShopGSS) },
  JPG: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.JPG, get: jest.fn(() => mockJpgGSS) },
  GameBank: { where: jest.fn().mockReturnThis(), lockForUpdate: () => MockDB.GameBank, get: jest.fn(() => []) },
  GameLog: { whereRaw: jest.fn().mockReturnThis(), get: jest.fn(() => []), create: jest.fn() },
  StatGame: { create: jest.fn() }, Session: { where: jest.fn().mockReturnThis(), delete: jest.fn()},
  Carbon: { now: jest.fn(() => new Date())}, LibBanker: { get_all_banks: jest.fn(() => [1000,200,100,50,20])}
};
(MockDB.Game as any).$values = { denomination: [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00] };


describe('GrandSpinnSuperpotNETSlotSettings', () => {
  let slotSettings: GrandSpinnSuperpotNETSlotSettings;
  const mockReelsTxtGSS = `reelStrip1=1,2,3,100,101,102,0\nreelStrip2=4,5,6,100,101,102,0\nreelStrip3=7,8,1,100,101,102,0`;

  beforeEach(() => {
    jest.clearAllMocks();
    (GrandSpinnSuperpotNETGameReel as jest.Mock).mockImplementation(() => {
      const reelInstance = {
        reelsStrip: { reelStrip1: ['1','2','3','100','101','102','0'], reelStrip2: ['4','5','6','100','101','102','0'], reelStrip3: ['7','8','1','100','101','102','0'] },
        reelsStripBonus: {}
      };
      return reelInstance;
    });

    slotSettings = new GrandSpinnSuperpotNETSlotSettings('GrandSpinnSuperpotNET', 1, mockReelsTxtGSS);
    slotSettings.user = JSON.parse(JSON.stringify(mockUserGSS));
    slotSettings.game = JSON.parse(JSON.stringify(mockGameGSS));
    slotSettings.shop = JSON.parse(JSON.stringify(mockShopGSS));
    slotSettings.jpgs = JSON.parse(JSON.stringify(mockJpgGSS)); // Ensure jpgs are also reset/mocked
    slotSettings.slotJackpot[0] = (slotSettings.jpgs && slotSettings.jpgs[0]) ? slotSettings.jpgs[0].balance / 100 : 0;
    slotSettings.slotJackpot[1] = (slotSettings.game?.jp_2 || 0) / 100;
    slotSettings.slotJackpot[2] = (slotSettings.game?.jp_3 || 0) / 100;

  });

  afterAll(() => { if(MockDBOriginalGSS) (global as any).MockDB = MockDBOriginalGSS; else delete (global as any).MockDB; });

  it('should initialize with correct paytable for GrandSpinn', () => {
    expect(slotSettings.Paytable['SYM_3']).toEqual([0,0,0,20,0,0]); // 777
    expect(slotSettings.Paytable['SYM_8']).toEqual([0,0,0,1,0,0]);  // Bar
    expect(slotSettings.Paytable['SYM_1'][1]).toBe(2); // Wild Multiplier x2
    expect(slotSettings.Paytable['SYM_100']).toEqual([0,0,0,40,0,0]); // Mini JP symbol
  });

  it('should load 3 reel strips', () => {
    expect(slotSettings.reelStrip1).toEqual(expect.arrayContaining(['102']));
    expect(slotSettings.reelStrip3).toEqual(expect.arrayContaining(['1']));
    expect(slotSettings.reelStrip4).toBeNull();
  });

  describe('GetReelStrips', () => {
    it('should return 3x3 reel configuration and rps', () => {
      const reels = slotSettings.GetReelStrips('win', 'bet');
      expect(reels.reel1.length).toBe(3); // 3 symbols per reel column
      expect(reels.reel2.length).toBe(3);
      expect(reels.reel3.length).toBe(3);
      expect(reels.rp.length).toBe(3); // 3 reel positions (middle symbol index for each reel)
      expect(reels.rps.length).toBe(3); // rps array for each reel
      expect(reels.rps[0].length).toBe(3); // each rps entry has 3 symbol indices
    });
  });

  describe('OffsetReelStrips (Nudge)', () => {
    it('should correctly offset a specified reel upwards', () => {
        slotSettings.reelStrip1 = ['1', '2', '3', '4', '5']; // Simple strip for testing
        const initialReels = {
            reel1: ['2','3','4'], reel2: ['5','1','2'], reel3: ['3','4','5'],
            rp: [2, 0, 3], // Middle symbol is '3' (index 2) on reel 1
            rps: [[1,2,3], [4,0,1], [2,3,4]]
        };
        const nudgedReels = slotSettings.OffsetReelStrips(initialReels, 1); // Nudge reel 1
        // Expect reel 1 middle symbol to be '2' (index 1) now
        expect(nudgedReels.reel1[1]).toBe('2');
        expect(nudgedReels.rp[0]).toBe(1); // rp updated
        expect(nudgedReels.rps[0]).toEqual([0,1,2]); // rps updated
        // Other reels should remain unchanged
        expect(nudgedReels.reel2[1]).toBe('1');
    });
  });

  describe('DecodeData and FormatResponse', () => {
    const exampleString = "credit=12300&game.win.cents=0&game.win.coins=0&rs.i0.r.i0.syms=SYM1%2CSYM2%2CSYM3";
    const exampleObject = {
        credit: "12300",
        game: { win: { cents: "0", coins: "0" } },
        rs: { i0: { r: { i0: { syms: "SYM1%2CSYM2%2CSYM3" } } } }
    };
    it('should decode a query string into an object', () => {
        const decoded = slotSettings.DecodeData(exampleString);
        expect(decoded.credit).toBe("12300");
        expect(decoded.game.win.cents).toBe("0");
        expect(decoded.rs.i0.r.i0.syms).toBe("SYM1%2CSYM2%2CSYM3");
    });
    it('should format an object into a query string', () => {
        const formatted = slotSettings.FormatResponse(exampleObject);
        // Order might vary, so check for parts
        expect(formatted).toContain("credit=12300");
        expect(formatted).toContain("game.win.cents=0");
        expect(formatted).toContain("rs.i0.r.i0.syms=SYM1%252CSYM2%252CSYM3"); // % is double encoded by default
    });
  });

  describe('UpdateJackpots', () => {
      it('should contribute to JPG balance', () => {
          const betAmount = 100; // currency units
          slotSettings.CurrentDenom = 0.01;
          const initialJpgBalance = slotSettings.jpgs![0].balance;
          const expectedContribution = betAmount * slotSettings.CurrentDenom * (slotSettings.jpgs![0].percent / 100);

          slotSettings.UpdateJackpots(betAmount); // betAmount is in currency units, matching PHP usage

          expect(slotSettings.jpgs![0].balance).toBeCloseTo(initialJpgBalance + expectedContribution);
          expect(slotSettings.slotJackpot[0]).toBeCloseTo((initialJpgBalance + expectedContribution) / 100); // slotJackpot is in currency
          expect(mockJpgGSS[0].save).toHaveBeenCalled();
      });
  });

   describe('ClearJackpot', () => {
      it('should set specified JPG balance to 0', () => {
          slotSettings.ClearJackpot(0);
          expect(slotSettings.jpgs![0].balance).toBe(0);
          expect(mockJpgGSS[0].save).toHaveBeenCalled();
      });
  });

});

if(MockDBOriginalGSS) (global as any).MockDB = MockDBOriginalGSS;
else delete (global as any).MockDB;
