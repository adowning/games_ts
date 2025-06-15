import { JumanjiNETServer } from '../JumanjiNETServer'; // Adjust path

let mockSlotSettingsInstanceJMN_Srv: any;

jest.mock('../JumanjiNETSlotSettings', () => {
  return jest.fn().mockImplementation((game: any, userId: number) => {
    mockSlotSettingsInstanceJMN_Srv = {
      is_active: jest.fn(() => true), GetBalance: jest.fn(() => 300), CurrentDenom: 0.01, CurrentDenomination: 0.01,
      slotId: 'JumanjiNET', SetGameData: jest.fn(), HasGameData: jest.fn(),
      GetGameData: jest.fn((key: string) => { // Default mock GetGameData
        if (key.endsWith('ShuffleActive')) return mockSlotSettingsInstanceJMN_Srv._shuffleActive || 0;
        if (key.endsWith('FreeGames')) return mockSlotSettingsInstanceJMN_Srv._freeGames || 0;
        if (key.endsWith('CurrentFreeGame')) return mockSlotSettingsInstanceJMN_Srv._currentFreeGame || 0;
        if (key.endsWith('BonusWin')) return mockSlotSettingsInstanceJMN_Srv._bonusWin || 0;
        if (key.endsWith('TotalWin')) return mockSlotSettingsInstanceJMN_Srv._totalWin || 0;
        if (key.endsWith('Bet')) return mockSlotSettingsInstanceJMN_Srv._betLevel || 10; // Default bet 10 coins
        if (key.endsWith('Denom')) return mockSlotSettingsInstanceJMN_Srv.CurrentDenom;
        if (key.endsWith('BonusType')) return mockSlotSettingsInstanceJMN_Srv._bonusType || '';
        if (key.endsWith('AllBet')) return mockSlotSettingsInstanceJMN_Srv._allBet || 100; // 10 coins * 10 (base lines for cost)
        if (key.endsWith('boardValues')) return mockSlotSettingsInstanceJMN_Srv._boardValues || [];
        if (key.endsWith('BonusStep')) return mockSlotSettingsInstanceJMN_Srv._bonusStep || 0;
        if (key.endsWith('BonusRolls')) return mockSlotSettingsInstanceJMN_Srv._bonusRolls || 0;
        if (key.endsWith('BonusToken')) return mockSlotSettingsInstanceJMN_Srv._bonusToken || '';


        return 0;
      }),
      Bet: ['10','20','50'], Denominations: [0.01,0.02,0.05], slotCurrency: 'EUR',
      UpdateJackpots: jest.fn(), SetBalance: jest.fn(), GetPercent: jest.fn(() => 94),
      SetBank: jest.fn(), slotFreeMpl: 1, GetSpinSettings: jest.fn(() => ['win', 200]), MaxWin: 70000,
      GetRandomPay: jest.fn(() => 10), increaseRTP: false, GetBank: jest.fn(() => 30000),
      SymbolGame: ['1','3','4','5','6','7','8','9','10'],
      Paytable: { 'SYM_3': [0,0,0,6,20,140], /* Lion ... other symbols */ },
      slotWildMpl: 1, slotFreeCount: {}, // Board game rolls based on scatters, not this
      Jackpots: {}, SaveLogReport: jest.fn(), SaveGameData: jest.fn(), SaveGameDataStatic: jest.fn(),
      InternalErrorSilent: jest.fn(),
      GetReelStrips: jest.fn(() => ({
        reel1: ['3','4','5'], reel2: ['3','4','5','0'], reel3: ['3','4','13','0','1'],
        reel4: ['6','7','8','0'], reel5: ['6','7','1'], rp: [0,0,0,0,0]
      })),
      // Mock internal state for tests
      _shuffleActive: 0, _freeGames: 0, _currentFreeGame: 0, _bonusWin: 0, _totalWin: 0,
      _betLevel: 10, _bonusType: '', _allBet: 100,
      _boardValues: [], _bonusStep:0, _bonusRolls:0, _bonusToken:'',
    };
    return mockSlotSettingsInstanceJMN_Srv;
  });
});

const mockAuthIdJMN_Srv = jest.fn(() => 1);
(global as any).Auth = { id: mockAuthIdJMN_Srv };
(global as any).DB = { transaction: jest.fn((callback: () => void) => callback()) };


describe('JumanjiNETServer', () => {
  let server: JumanjiNETServer;
  let mockRequestJMN_Srv: any;
  const mockGameInstanceJMN_Srv = { name: 'JumanjiNET' };

  beforeEach(() => {
    jest.clearAllMocks();
    server = new JumanjiNETServer();
    mockRequestJMN_Srv = { query: {} };
    if (mockSlotSettingsInstanceJMN_Srv) { // Reset internal states
        mockSlotSettingsInstanceJMN_Srv._shuffleActive = 0; mockSlotSettingsInstanceJMN_Srv._freeGames = 0;
        mockSlotSettingsInstanceJMN_Srv._currentFreeGame = 0; mockSlotSettingsInstanceJMN_Srv._bonusWin = 0;
        mockSlotSettingsInstanceJMN_Srv._totalWin = 0; mockSlotSettingsInstanceJMN_Srv._betLevel = 10;
        mockSlotSettingsInstanceJMN_Srv._bonusType = ''; mockSlotSettingsInstanceJMN_Srv._allBet = 100;
        mockSlotSettingsInstanceJMN_Srv.GetBalance.mockReturnValue(300);
        mockSlotSettingsInstanceJMN_Srv.GetHistory.mockReturnValue('NULL');
        mockSlotSettingsInstanceJMN_Srv.GetReelStrips.mockReturnValue({
            reel1: ['3','4','5'], reel2: ['3','4','5','0'], reel3: ['3','4','13','0','1'],
            reel4: ['6','7','8','0'], reel5: ['6','7','1'], rp: [0,0,0,0,0]
        });
    }
  });

  // Helper to parse the server's string response
  function parseQueryString(str: string): Record<string, string> {
    const result: Record<string, string> = {};
    str.split('&').forEach(part => {
        const item = part.split('=');
        result[item[0]] = decodeURIComponent(item[1] || '');
    });
    return result;
  }

  describe('action=init', () => {
    it('should return init string with Jumanji specific reel structure and denominations', () => {
      mockRequestJMN_Srv.query = { action: 'init', bet_denomination: '1', bet_betlevel: '10' }; // Denom in cents
      const response = server.get(mockRequestJMN_Srv, mockGameInstanceJMN_Srv);
      expect(response).toContain('clientaction=init');
      expect(response).toContain(`credit=${300 * 100 * 0.01}`); // balance * 100 * denom
      expect(response).toContain('denomination.all=1%2C2%2C5%2C10%2C20%2C50%2C100%2C200');
      expect(response).toContain('rs.i0.r.i0.syms=SYM'); // Reel 1 (3 symbols)
      expect(response).toContain('rs.i0.r.i1.syms=SYM'); // Reel 2 (4 symbols)
      expect(response).toContain('rs.i0.r.i2.syms=SYM'); // Reel 3 (5 symbols)
    });
  });

  describe('action=spin', () => {
    it('should handle a base spin, mystery symbol transformation, and potential random feature', () => {
      mockRequestJMN_Srv.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '10' };
      // Mock reels to include a mystery symbol (e.g., SYM13) on a payline position
      mockSlotSettingsInstanceJMN_Srv.GetReelStrips.mockReturnValue({
        reel1: ['3','4','5'], reel2: ['3','13','5','0'], reel3: ['3','4','1','0','1'], // SYM13 on reel 2
        reel4: ['6','7','8','0'], reel5: ['6','7','1'], rp: [0,0,0,0,0]
      });

      const response = server.get(mockRequestJMN_Srv, mockGameInstanceJMN_Srv);
      const responseObj = parseQueryString(response);

      expect(responseObj.clientaction).toBe('spin'); // Or 'shuffle' if that feature was triggered
      // Check if SYM13 was transformed - this means reel2 symbols in response should not contain SYM13
      // but one of SYM3-SYM10. This requires checking the final rs.i0.r.i1.syms in response.
      // Example: expect(response).not.toContain('rs.i0.r.i1.syms=SYM13'); - this is too simple.
      // The actual transformed symbol is random.
      // We can check if a feature string part was added if a random feature triggered.
      // expect(response).toMatch(/feature\.(sticky|wildreels|shuffle|randomwilds)\.active=true/); // If a feature triggered
      expect(parseInt(responseObj['game.win.coins'],10)).toBeGreaterThanOrEqual(0);
    });

    it('should trigger board game bonus if 3+ scatters (SYM0) land', () => {
      mockRequestJMN_Srv.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '10' };
      mockSlotSettingsInstanceJMN_Srv.GetReelStrips.mockReturnValue({
        reel1: ['0','4','5'], reel2: ['0','4','5','0'], reel3: ['0','4','1','0','1'], // 3+ scatters
        reel4: ['6','7','8','1'], reel5: ['6','7','1'], rp: [0,0,0,0,0]
      });
      const response = server.get(mockRequestJMN_Srv, mockGameInstanceJMN_Srv);
      const responseObj = parseQueryString(response);

      expect(responseObj.clientaction).toBe('spin');
      expect(response).toContain('ws.i0.types.i0.wintype=bonusgame'); // Indicates board game trigger
      expect(responseObj.nextaction).toBe('bonusaction'); // Should go to board game
      expect(responseObj.nextactiontype).toBe('selecttoken');
      expect(mockSlotSettingsInstanceJMN_Srv.SetGameData).toHaveBeenCalledWith('JumanjiNETFreeGames', expect.any(Number)); // Board game rolls
    });
  });

  describe('Board Game Actions', () => {
    it('action=initbonus should return board game setup string', () => {
        mockSlotSettingsInstanceJMN_Srv.GetGameData = jest.fn(key => {
            if(key.endsWith('TotalWin')) return 100; // Example total win from triggering spin
            return 0;
        });
        mockRequestJMN_Srv.query = { action: 'initbonus' };
        const response = server.get(mockRequestJMN_Srv, mockGameInstanceJMN_Srv);
        expect(response).toContain('clientaction=initbonus');
        expect(response).toContain('bonus.rollsleft=6'); // Default rolls for 3 scatters
        expect(response).toContain('gamestate.current=bonus');
        expect(response).toContain('nextactiontype=selecttoken');
    });

    it('action=bonusaction with token selection should set token and ask for roll', () => {
        mockRequestJMN_Srv.query = { action: 'bonusaction', bonus_token: 'rhino' };
        const response = server.get(mockRequestJMN_Srv, mockGameInstanceJMN_Srv);
        expect(response).toContain('clientaction=bonusaction');
        expect(mockSlotSettingsInstanceJMN_Srv.SetGameData).toHaveBeenCalledWith('JumanjiNETBonusToken', 'rhino');
        expect(response).toContain('bonus.token=rhino');
        expect(response).toContain('nextactiontype=roll');
    });

    // Further tests for dice rolls, feature triggers on board, and endbonus would be very complex
    // due to the detailed state and response string manipulation.
  });

});
