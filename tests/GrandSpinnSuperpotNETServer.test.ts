import { GrandSpinnSuperpotNETServer } from '../GrandSpinnSuperpotNETServer'; // Adjust path

let mockSlotSettingsInstanceGSS: any;
const mockResponseTemplateGSS = { // Stored directly in Server.ts, but mock here for clarity
  "spin":"rs.i0.r.i0.overlay.i0.pos=32&rs.i0.r.i2.overlay.i2.pos=39&gameServerVersion=1.10.0&g4mode=false&playercurrency=%26%23x20AC%3B&historybutton=false&rs.i0.r.i2.overlay.i1.pos=38&next.rs=basic&gamestate.history=basic&rs.i0.r.i0.overlay.i1.with=SYM7&rs.i0.r.i0.overlay.i1.row=1&rs.i0.r.i1.syms=SYM11%2CSYM25%2CSYM16&game.win.cents=0&rs.i0.r.i2.overlay.i0.pos=37&rs.i0.id=ultraShort3&totalwin.coins=0&credit=499900&gamestate.current=basic&rs.i0.r.i0.overlay.i2.row=2&jackpot.tt_mega.EUR.amount-30s=500000&rs.i0.r.i0.overlay.i0.with=SYM100&rs.i0.r.i2.overlay.i0.row=0&jackpotcurrency=%26%23x20AC%3B&rs.i0.r.i0.overlay.i2.pos=34&rs.i0.r.i1.overlay.i1.with=SYM99&multiplier=1&rs.i0.r.i2.overlay.i2.with=SYM5&last.rs=ultraShort3&rs.i0.r.i0.syms=SYM28%2CSYM16%2CSYM16&rs.i0.r.i0.overlay.i1.pos=33&rs.i0.r.i1.overlay.i0.row=0&rs.i0.r.i1.overlay.i2.pos=22&rs.i0.r.i2.overlay.i0.with=SYM50&rs.i0.r.i2.overlay.i1.row=1&isJackpotWin=false&gamestate.stack=basic&rs.i0.r.i0.pos=32&gamesoundurl=https%3A%2F%2Fstatic.casinomodule.com%2F&rs.i0.r.i0.overlay.i0.row=0&rs.i0.r.i1.overlay.i1.row=1&rs.i0.r.i2.overlay.i2.row=2&rs.i0.r.i1.pos=20&rs.i0.r.i1.overlay.i1.pos=21&game.win.coins=0&playercurrencyiso=EUR&rs.i0.r.i1.hold=false&rs.i0.r.i1.overlay.i0.pos=20&rs.i0.r.i1.overlay.i2.row=2&playforfun=true&jackpotcurrencyiso=EUR&clientaction=spin&jackpot.tt_mega.EUR.lastpayedout=0&rs.i0.r.i1.overlay.i2.with=SYM7&rs.i0.r.i2.hold=false&rs.i0.r.i2.pos=37&jackpot.tt_mega.EUR.amount=500000&totalwin.cents=0&gameover=true&rs.i0.r.i0.hold=false&nextaction=spin&wavecount=1&rs.i0.r.i1.overlay.i0.with=SYM8&rs.i0.r.i0.overlay.i2.with=SYM7&rs.i0.r.i2.syms=SYM29%2CSYM15%2CSYM15&rs.i0.r.i2.overlay.i1.with=SYM5&game.win.amount=0"
};

jest.mock('../GrandSpinnSuperpotNETSlotSettings', () => {
  return jest.fn().mockImplementation((game: any, userId: number) => {
    mockSlotSettingsInstanceGSS = {
      is_active: jest.fn(() => true), GetBalance: jest.fn(() => 500), CurrentDenom: 0.02, CurrentDenomination: 0.02,
      slotId: 'GrandSpinnSuperpotNET', SetGameData: jest.fn(), HasGameData: jest.fn(),
      GetGameData: jest.fn((key: string) => { // Basic GetGameData mock
        if (key === 'GrandSpinnSuperpotNETDenom') return mockSlotSettingsInstanceGSS.CurrentDenom;
        if (key === 'GrandSpinnSuperpotNETBet') return mockSlotSettingsInstanceGSS._currentBet || 2;
        if (key === 'GrandSpinnSuperpotNETNudge') return mockSlotSettingsInstanceGSS._nudgeCount || 0;
        if (key === 'GrandSpinnSuperpotNETTotalWin') return mockSlotSettingsInstanceGSS._totalWin || 0;
        if (key === 'GrandSpinnSuperpotNETReels') return mockSlotSettingsInstanceGSS._lastReels;
        return 0;
      }),
      Bet: ['2','4','10'], Denominations: [0.01, 0.02, 0.05], slotCurrency: 'EUR',
      slotJackpot: [5000, 100, 20], // Mega, Midi, Mini in currency units
      UpdateJackpots: jest.fn(() => ({isJackPay: false})), SetBalance: jest.fn(), GetPercent: jest.fn(() => 96),
      SetBank: jest.fn(), slotFreeMpl: 1, GetSpinSettings: jest.fn(() => ['win', 100]), MaxWin: 100000,
      GetRandomPay: jest.fn(() => 5), increaseRTP: false, GetBank: jest.fn(() => 3000),
      SymbolGame: ['1','2','3','4','5','6','7','8','100','101','102','0'], // '0' is nudge arrow
      Paytable: { 'SYM_8': [0,0,0,1,0,0], 'SYM_1': [0,2,0,0,0,0] }, // Bar=1, Wild mult=2
      slotWildMpl: 1, Jackpots: {}, SaveLogReport: jest.fn(), SaveGameData: jest.fn(), SaveGameDataStatic: jest.fn(),
      InternalErrorSilent: jest.fn(), ClearJackpot: jest.fn(),
      GetReelStrips: jest.fn(() => ({
          reel1: ['8','1','2'], reel2: ['8','1','2'], reel3: ['8','1','2'], // Default: 3 BARs (win 1*bet)
          rp: [0,0,0], rps: [[2,0,1],[2,0,1],[2,0,1]] // Mocked positions
      })),
      OffsetReelStrips: jest.fn((reels, offset) => { // Simple nudge mock: just return same reels
          const nudgedReels = JSON.parse(JSON.stringify(reels));
          // Simulate one reel nudging to a different symbol for test variety
          if(nudgedReels.reel1 && nudgedReels.reel1.length > 0) nudgedReels.reel1[0] = '0'; // Arrow on top
          return nudgedReels;
      }),
      DecodeData: jest.fn(str => { // Simplified: parse string to object for template
        const obj:any = {}; str.split('&').forEach(p => { const kv = p.split('='); obj[kv[0]] = kv[1];}); return obj;
      }),
      FormatResponse: jest.fn(obj => { // Simplified: object to string
        return Object.entries(obj).map(([k,v]) => `${k}=${v}`).join('&');
      }),
      GetHistory: jest.fn(() => 'NULL'),
      // Internal mock state helpers
      _currentBet: 2, _nudgeCount: 0, _totalWin: 0, _lastReels: null,
    };
    return mockSlotSettingsInstanceGSS;
  });
});

const mockAuthIdGSS_Server = jest.fn(() => 1);
(global as any).Auth = { id: mockAuthIdGSS_Server };
(global as any).DB = { transaction: jest.fn((callback: () => void) => callback()) };
// Store original response template if it's part of the global scope in actual server file.
// For this test, it's defined locally in the server file, so no global mock needed for it.

describe('GrandSpinnSuperpotNETServer', () => {
  let server: GrandSpinnSuperpotNETServer;
  let mockRequestGSS_Srv: any;
  const mockGameInstanceGSS_Srv = { name: 'GrandSpinnSuperpotNET' };

  beforeEach(() => {
    jest.clearAllMocks();
    server = new GrandSpinnSuperpotNETServer();
    mockRequestGSS_Srv = { query: {} };
    if (mockSlotSettingsInstanceGSS) { // Reset internal states
        mockSlotSettingsInstanceGSS._currentBet = 2; mockSlotSettingsInstanceGSS._nudgeCount = 0;
        mockSlotSettingsInstanceGSS._totalWin = 0; mockSlotSettingsInstanceGSS._lastReels = null;
        mockSlotSettingsInstanceGSS.GetBalance.mockReturnValue(500); // 500 currency units
        mockSlotSettingsInstanceGSS.GetReelStrips.mockReturnValue({
            reel1: ['8','1','2'], reel2: ['8','1','2'], reel3: ['8','1','2'],
            rp: [0,0,0], rps: [[2,0,1],[2,0,1],[2,0,1]]
        });
    }
  });

  describe('action=init', () => {
    it('should return init string with jackpot amounts and correct denomination', () => {
      mockRequestGSS_Srv.query = { action: 'init', bet_denomination: '2', bet_betlevel: '2' }; // Denom in cents
      const response = server.get(mockRequestGSS_Srv, mockGameInstanceGSS_Srv);
      expect(response).toContain('clientaction=init');
      expect(response).toContain(`credit=${500 * 100 * 0.02}`); // balance * 100 * denom
      expect(response).toContain(`jackpot.tt_mega.EUR.amount=${Math.round(mockSlotSettingsInstanceGSS.slotJackpot[0] * 100)}`);
      // expect(response).toContain(`jackpot.tt_midi.EUR.amount=${Math.round(mockSlotSettingsInstanceGSS.slotJackpot[1] * 100)}`); // If midi/mini were in template
      // expect(response).toContain(`jackpot.tt_mini.EUR.amount=${Math.round(mockSlotSettingsInstanceGSS.slotJackpot[2] * 100)}`);
      expect(response).toContain('denomination.standard=2'); // Denom * 100
    });
  });

  describe('action=jackpot', () => {
    it('should return current jackpot amounts', () => {
        mockRequestGSS_Srv.query = { action: 'jackpot', operation: 'read', denominations:'2', betlevel:'2'};
        const response = server.get(mockRequestGSS_Srv, mockGameInstanceGSS_Srv);
        expect(response).toContain(`jackpot.tt_mega.EUR.amount=${Math.round(mockSlotSettingsInstanceGSS.slotJackpot[0] * 100)}`);
    });
  });

  describe('action=spin', () => {
    it('should handle a simple win (3 BARs)', () => {
      mockRequestGSS_Srv.query = { action: 'spin', bet_denomination: '2', bet_betlevel: '2' }; // betlevel 2
      // GetReelStrips default mock returns 3 BARs (SYM_8)
      const response = server.get(mockRequestGSS_Srv, mockGameInstanceGSS_Srv);
      expect(response).toContain('clientaction=spin');
      // totalWin = Paytable.SYM_8[3] * betlevel = 1 * 2 = 2 coins
      expect(response).toContain('game.win.coins=2');
      expect(response).toContain('totalwin.coins=2');
      // Check for nudge trigger possibility (if a reel had '0' on top)
      // If GetReelStrips returns ['0', '8', '1'] for reel1, nextaction should be nudge
      // For now, default GetReelStrips has no '0' on top, so nextaction=spin
      expect(response).toContain('nextaction=spin');
      expect(mockSlotSettingsInstanceGSS.SaveLogReport).toHaveBeenCalled();
    });

    it('should handle a win with multiplier wilds', () => {
        mockRequestGSS_Srv.query = { action: 'spin', bet_denomination: '2', bet_betlevel: '2' };
        // Reel: Wild (SYM_1, mult x2), Wild (SYM_1, mult x2), BAR (SYM_8)
        mockSlotSettingsInstanceGSS.GetReelStrips.mockReturnValue({
            reel1: ['2','1','3'], reel2: ['2','1','3'], reel3: ['2','8','3'],
            rp: [1,1,1], rps: [[0,1,2],[0,1,2],[0,1,2]]
        });
        const response = server.get(mockRequestGSS_Srv, mockGameInstanceGSS_Srv);
        // Win = Paytable.SYM_8[3] * betlevel * WildMult1 * WildMult2 = 1 * 2 * 2 * 2 = 8 coins
        expect(response).toContain('game.win.coins=8');
        expect(response).toContain('totalwin.coins=8');
    });

    it('should trigger nudge if arrow symbol appears on top row', () => {
        mockRequestGSS_Srv.query = { action: 'spin', bet_denomination: '2', bet_betlevel: '2' };
        mockSlotSettingsInstanceGSS.GetReelStrips.mockReturnValue({
            reel1: ['0','8','1'], reel2: ['8','1','2'], reel3: ['8','1','2'], // Arrow '0' on top of reel 1
            rp: [0,0,0], rps: [[2,0,1],[2,0,1],[2,0,1]]
        });
        // Assume this spin is a winning one to trigger nudge check
        mockSlotSettingsInstanceGSS.Paytable['SYM_8'] = [0,0,0,1,0,0]; // Ensure BAR pays

        const response = server.get(mockRequestGSS_Srv, mockGameInstanceGSS_Srv);
        expect(response).toContain('clientaction=spin'); // Initial action
        expect(response).toContain('nextaction=nudge'); // Nudge should be triggered
        expect(response).toContain('gameover=false');
        expect(mockSlotSettingsInstanceGSS.SetGameData).toHaveBeenCalledWith('GrandSpinnSuperpotNETNudge', 1);
        expect(mockSlotSettingsInstanceGSS.SetGameData).toHaveBeenCalledWith('GrandSpinnSuperpotNETReels', expect.anything());
    });
  });

  describe('action=nudge', () => {
    it('should process a nudge spin, potentially win, and check for further nudges', () => {
        // Setup initial state as if a nudge was triggered
        mockSlotSettingsInstanceGSS.GetGameData = jest.fn((key: string) => {
            if (key === 'GrandSpinnSuperpotNETDenom') return 0.02;
            if (key === 'GrandSpinnSuperpotNETBet') return 2;
            if (key === 'GrandSpinnSuperpotNETNudge') return 1; // Currently in nudge sequence (1st nudge done)
            if (key === 'GrandSpinnSuperpotNETTotalWin') return 10; // Some win from previous spin/nudge
            if (key === 'GrandSpinnSuperpotNETReels') return { reel1: ['0','8','1'], reel2: ['8','1','2'], reel3: ['8','1','2'], rp:[0,0,0], rps:[[2,0,1],[2,0,1],[2,0,1]]};
            return 0;
        });
        // Mock OffsetReelStrips to return a winning combo and another nudge arrow
        mockSlotSettingsInstanceGSS.OffsetReelStrips.mockReturnValue({
            reel1: ['0','8','1'], reel2: ['8','8','2'], reel3: ['8','8','2'], // 3 BARs, arrow on reel1
            rp: [0,0,0], rps: [[2,0,1],[2,0,1],[2,0,1]]
        });

        mockRequestGSS_Srv.query = { action: 'nudge', bet_denomination: '2', bet_betlevel: '2' };
        const response = server.get(mockRequestGSS_Srv, mockGameInstanceGSS_Srv);

        expect(response).toContain('clientaction=nudge'); // PHP has clientaction=spin in response for nudge
        expect(response).toContain('nextaction=nudge'); // Should be another nudge
        expect(response).toContain('gameover=false');
        expect(mockSlotSettingsInstanceGSS.SetGameData).toHaveBeenCalledWith('GrandSpinnSuperpotNETNudge', 2);
        // Win from this nudge (3 BARs = 1 * betlevel 2 = 2). Total win = 10 (previous) + 2 = 12
        expect(response).toContain('totalwin.coins=12');
    });

    it('should end nudge sequence if no win and no more arrows, or max nudges reached', () => {
        mockSlotSettingsInstanceGSS.GetGameData = jest.fn((key: string) => {
            if (key === 'GrandSpinnSuperpotNETNudge') return 4; // On 4th nudge (max ~5)
            if (key === 'GrandSpinnSuperpotNETReels') return { reel1: ['1','2','3'], reel2: ['4','5','6'], reel3: ['7','8','1'], rp:[0,0,0], rps:[[0,1,2],[0,1,2],[0,1,2]]};
            return 0;
        });
        // Nudge results in no win and no new arrows
        mockSlotSettingsInstanceGSS.OffsetReelStrips.mockReturnValue({
            reel1: ['1','2','3'], reel2: ['4','5','6'], reel3: ['7','8','1'],
            rp: [0,0,0], rps: [[0,1,2],[0,1,2],[0,1,2]]
        });
         mockSlotSettingsInstanceGSS.Paytable = {}; // Ensure no win from these symbols

        mockRequestGSS_Srv.query = { action: 'nudge' };
        const response = server.get(mockRequestGSS_Srv, mockGameInstanceGSS_Srv);
        expect(response).toContain('nextaction=spin'); // Nudge sequence ends
        expect(response).toContain('gameover=true');
        expect(mockSlotSettingsInstanceGSS.SetGameData).toHaveBeenCalledWith('GrandSpinnSuperpotNETNudge', 0); // Reset nudge count
    });
  });

});
