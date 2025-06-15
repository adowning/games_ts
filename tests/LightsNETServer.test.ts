import { LightsNETServer } from '../LightsNETServer'; // Adjust path

let mockSlotSettingsInstanceLGT_Srv: any;

jest.mock('../LightsNETSlotSettings', () => {
  return jest.fn().mockImplementation((game: any, userId: number) => {
    mockSlotSettingsInstanceLGT_Srv = {
      is_active: jest.fn(() => true), GetBalance: jest.fn(() => 400), CurrentDenom: 0.01, CurrentDenomination: 0.01,
      slotId: 'LightsNET', SetGameData: jest.fn(),
      HasGameData: jest.fn((key: string) => {
        if (key === 'LightsNETGameDenom') return mockSlotSettingsInstanceLGT_Srv._gameDenom !== undefined;
        if (key === 'LightsNETFreeGames') return mockSlotSettingsInstanceLGT_Srv._freeGames !== undefined;
        if (key === 'LightsNETCurrentFreeGame') return mockSlotSettingsInstanceLGT_Srv._currentFreeGame !== undefined;
        if (key === 'LightsNETBet') return mockSlotSettingsInstanceLGT_Srv._bet !== undefined;
        return false;
      }),
      GetGameData: jest.fn((key: string) => {
        if (key === 'LightsNETGameDenom') return mockSlotSettingsInstanceLGT_Srv._gameDenom || 0.01;
        if (key === 'LightsNETFreeGames') return mockSlotSettingsInstanceLGT_Srv._freeGames || 0;
        if (key === 'LightsNETCurrentFreeGame') return mockSlotSettingsInstanceLGT_Srv._currentFreeGame || 0;
        if (key === 'LightsNETBonusWin') return mockSlotSettingsInstanceLGT_Srv._bonusWin || 0;
        if (key === 'LightsNETTotalWin') return mockSlotSettingsInstanceLGT_Srv._totalWin || 0;
        if (key === 'LightsNETBet') return mockSlotSettingsInstanceLGT_Srv._bet || 1;
        return 0;
      }),
      Bet: [1,2,3,4,5,6,7,8,9,10], Denominations: [0.01,0.02,0.05], slotCurrency: 'EUR',
      UpdateJackpots: jest.fn(), SetBalance: jest.fn(), GetPercent: jest.fn(() => 95),
      SetBank: jest.fn(), slotFreeMpl: 1, GetSpinSettings: jest.fn(() => ['win', 200]), MaxWin: 80000,
      GetRandomPay: jest.fn(() => 10), increaseRTP: false, GetBank: jest.fn(() => 30000),
      SymbolGame: ['2','3','4','5','6','7','8','9','10','11','12'], // Excludes Wild '1' and Scatter '0' for pay calc
      Paytable: { 'SYM_12': [0,0,0,3,15,30], /* 10 ... other symbols */ }, // Lowest paying symbol
      slotWildMpl: 1, slotFreeCount: {3:10, 4:20, 5:30}, Jackpots: {}, SaveLogReport: jest.fn(),
      SaveGameData: jest.fn(), SaveGameDataStatic: jest.fn(), InternalErrorSilent: jest.fn(),
      GetReelStrips: jest.fn(() => ({
        reel1: ['10','11','12'], reel2: ['10','11','12'], reel3: ['10','11','12'],
        reel4: ['10','11','12'], reel5: ['10','11','12'], rp: [0,0,0,0,0] // Default non-winning
      })),
      // Internal mock state helpers
      _gameDenom: 0.01, _freeGames: 0, _currentFreeGame: 0, _bonusWin: 0, _totalWin: 0, _bet: 1,
    };
    return mockSlotSettingsInstanceLGT_Srv;
  });
});

const mockAuthIdLGT_Srv = jest.fn(() => 1);
(global as any).Auth = { id: mockAuthIdLGT_Srv };
(global as any).DB = { transaction: jest.fn((callback: () => void) => callback()) };

describe('LightsNETServer', () => {
  let server: LightsNETServer;
  let mockRequestLGT_Srv: any;
  const mockGameInstanceLGT_Srv = { name: 'LightsNET' };

  beforeEach(() => {
    jest.clearAllMocks();
    server = new LightsNETServer();
    mockRequestLGT_Srv = { query: {} };
    if (mockSlotSettingsInstanceLGT_Srv) { // Reset internal states
        mockSlotSettingsInstanceLGT_Srv._gameDenom = 0.01; mockSlotSettingsInstanceLGT_Srv._freeGames = 0;
        mockSlotSettingsInstanceLGT_Srv._currentFreeGame = 0; mockSlotSettingsInstanceLGT_Srv._bonusWin = 0;
        mockSlotSettingsInstanceLGT_Srv._totalWin = 0; mockSlotSettingsInstanceLGT_Srv._bet = 1;
        mockSlotSettingsInstanceLGT_Srv.GetBalance.mockReturnValue(400);
        mockSlotSettingsInstanceLGT_Srv.GetHistory.mockReturnValue('NULL');
        mockSlotSettingsInstanceLGT_Srv.GetReelStrips.mockReturnValue({
            reel1: ['10','11','12'], reel2: ['10','11','12'], reel3: ['10','11','12'],
            reel4: ['10','11','12'], reel5: ['10','11','12'], rp: [0,0,0,0,0]
        });
    }
  });

  function parseQueryString(str: string): Record<string, string> {
    const result: Record<string, string> = {};
    str.split('&').forEach(part => { const item = part.split('='); result[item[0]] = decodeURIComponent(item[1] || ''); });
    return result;
  }

  describe('action=init', () => {
    it('should return init string for LightsNET', () => {
      mockRequestLGT_Srv.query = { action: 'init', bet_denomination: '1', bet_betlevel: '1' };
      const response = server.get(mockRequestLGT_Srv, mockGameInstanceLGT_Srv);
      expect(response).toContain('clientaction=init');
      expect(response).toContain(`credit=${400 * 100 * 0.01}`);
      expect(response).toContain('denomination.all=1%2C2%2C5'); // Denoms * 100
      expect(response).toContain('rs.i0.r.i0.syms=SYM'); // Reel symbols part
    });
  });

  describe('action=spin (base game)', () => {
    it('should place 2-4 floating wilds and include them in response', () => {
      mockRequestLGT_Srv.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '1' };
      const response = server.get(mockRequestLGT_Srv, mockGameInstanceLGT_Srv);
      const responseObj = parseQueryString(response);

      expect(responseObj.clientaction).toBe('spin');
      // Check for overlay string parts indicating floating wilds
      // Example: &rs.i0.r.i0.overlay.i0.with=SYM1 (wild symbol for overlay)
      const wildOverlayMatches = response.match(/rs\.i0\.r\.i\d\.overlay\.i\d\.with=SYM1/g);
      expect(wildOverlayMatches).not.toBeNull();
      expect(wildOverlayMatches!.length).toBeGreaterThanOrEqual(2);
      expect(wildOverlayMatches!.length).toBeLessThanOrEqual(4);
    });

    it('should trigger 10 Free Spins with 3 scatter symbols', () => {
      mockRequestLGT_Srv.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '1' };
      // Mock GetReelStrips to return 3 scatters (SYM_0)
      mockSlotSettingsInstanceLGT_Srv.GetReelStrips.mockReturnValue({
        reel1: ['0','10','11'], reel2: ['0','10','11'], reel3: ['0','10','11'],
        reel4: ['2','3','4'], reel5: ['5','6','7'], rp: [0,0,0,0,0]
      });
      const response = server.get(mockRequestLGT_Srv, mockGameInstanceLGT_Srv);
      const responseObj = parseQueryString(response);

      expect(responseObj.clientaction).toBe('spin');
      expect(response).toContain('ws.i0.types.i0.freespins=10'); // 10 FS for 3 scatters
      expect(responseObj.nextaction).toBe('freespin');
      expect(responseObj['gamestate.current']).toBe('freespin');
      expect(mockSlotSettingsInstanceLGT_Srv.SetGameData).toHaveBeenCalledWith('LightsNETFreeGames', 10);
    });
  });

  describe('action=freespin', () => {
    beforeEach(() => { // Setup for freespin tests
        mockSlotSettingsInstanceLGT_Srv._freeGames = 10;
        mockSlotSettingsInstanceLGT_Srv._currentFreeGame = 0; // About to play 1st free spin
        mockSlotSettingsInstanceLGT_Srv._bet = 1;
        mockSlotSettingsInstanceLGT_Srv._gameDenom = 0.01;
        mockSlotSettingsInstanceLGT_Srv._bonusWin = 0; // Total win in FS sequence

        mockSlotSettingsInstanceLGT_Srv.GetGameData = jest.fn((key: string) => {
            if (key === 'LightsNETDenom') return 0.01;
            if (key === 'LightsNETBet') return 1;
            if (key === 'LightsNETFreeGames') return 10;
            if (key === 'LightsNETCurrentFreeGame') return mockSlotSettingsInstanceLGT_Srv._currentFreeGame;
            if (key === 'LightsNETBonusWin') return mockSlotSettingsInstanceLGT_Srv._bonusWin;
            return 0;
        });
    });

    it('should place 3-6 floating wilds during a freespin', () => {
      mockRequestLGT_Srv.query = { action: 'freespin', bet_denomination: '1', bet_betlevel: '1' };
      // Server.php maps action 'freespin' to 'spin' for postData['action'], but 'slotEvent' remains 'freespin'
      postData['slotEvent'] = 'freespin';

      const response = server.get(mockRequestLGT_Srv, mockGameInstanceLGT_Srv);
      const responseObj = parseQueryString(response);

      expect(responseObj.clientaction).toBe('spin'); // PHP maps 'freespin' action to 'spin' internally
      expect(responseObj['gamestate.current']).toBe('freespin');
      const wildOverlayMatches = response.match(/rs\.i0\.r\.i\d\.overlay\.i\d\.with=SYM1/g);
      expect(wildOverlayMatches).not.toBeNull();
      expect(wildOverlayMatches!.length).toBeGreaterThanOrEqual(3);
      expect(wildOverlayMatches!.length).toBeLessThanOrEqual(6);
      expect(mockSlotSettingsInstanceLGT_Srv.SetGameData).toHaveBeenCalledWith('LightsNETCurrentFreeGame', 1);
    });

    it('should end freespins when CurrentFreeGame equals FreeGames', () => {
        mockSlotSettingsInstanceLGT_Srv._currentFreeGame = 9; // Playing the 10th (last) free spin
        mockRequestLGT_Srv.query = { action: 'freespin', bet_denomination: '1', bet_betlevel: '1' };
        postData['slotEvent'] = 'freespin';

        const response = server.get(mockRequestLGT_Srv, mockGameInstanceLGT_Srv);
        const responseObj = parseQueryString(response);

        expect(mockSlotSettingsInstanceLGT_Srv.SetGameData).toHaveBeenCalledWith('LightsNETCurrentFreeGame', 10);
        expect(responseObj.nextaction).toBe('spin'); // Should revert to base game spin
        expect(responseObj['gamestate.current']).toBe('basic');
        expect(responseObj['freespins.left']).toBe('0');
    });
  });

});
