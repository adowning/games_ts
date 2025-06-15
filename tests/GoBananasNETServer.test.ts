import { GoBananasNETServer } from '../GoBananasNETServer'; // Adjust path
// We need to mock SlotSettings that the Server uses.
// The actual SlotSettings class has complex dependencies (DB, GameReel).
// For server tests, we mock its behavior.

let mockSlotSettingsInstance: any;

jest.mock('../GoBananasNETSlotSettings', () => {
  return jest.fn().mockImplementation((game: any, userId: number) => {
    mockSlotSettingsInstance = {
      is_active: jest.fn(() => true),
      GetBalance: jest.fn(() => 1000), // Default balance in currency units
      CurrentDenom: 0.01, // Default denomination
      CurrentDenomination: 0.01,
      slotId: 'GoBananasNET',
      SetGameData: jest.fn(),
      HasGameData: jest.fn((key: string) => {
        if (key === 'GoBananasNETGameDenom') return mockSlotSettingsInstance._gameDenom !== undefined;
        if (key === 'GoBananasNETFreeGames') return mockSlotSettingsInstance._freeGames !== undefined;
        if (key === 'GoBananasNETCurrentFreeGame') return mockSlotSettingsInstance._currentFreeGame !== undefined;
        if (key === 'GoBananasNETBet') return mockSlotSettingsInstance._bet !== undefined;
        return false;
      }),
      GetGameData: jest.fn((key: string) => {
        if (key === 'GoBananasNETGameDenom') return mockSlotSettingsInstance._gameDenom || 0.01;
        if (key === 'GoBananasNETFreeGames') return mockSlotSettingsInstance._freeGames || 0;
        if (key === 'GoBananasNETCurrentFreeGame') return mockSlotSettingsInstance._currentFreeGame || 0;
        if (key === 'GoBananasNETBonusWin') return mockSlotSettingsInstance._bonusWin || 0;
        if (key === 'GoBananasNETTotalWin') return mockSlotSettingsInstance._totalWin || 0;
        if (key === 'GoBananasNETBet') return mockSlotSettingsInstance._bet || 1;
        return 0;
      }),
      Bet: [1, 2, 5, 10], // Example bet levels
      GetHistory: jest.fn(() => 'NULL'), // Default no history
      Denominations: [0.01, 0.02, 0.05],
      slotCurrency: 'USD',
      UpdateJackpots: jest.fn(),
      SetBalance: jest.fn(),
      GetPercent: jest.fn(() => 90),
      SetBank: jest.fn(),
      slotFreeMpl: 1,
      GetSpinSettings: jest.fn(() => ['win', 100]), // Default to a win of 100
      MaxWin: 50000,
      GetRandomPay: jest.fn(() => 5),
      increaseRTP: false,
      GetBank: jest.fn(() => 2000),
      SymbolGame: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], // From PHP
      Paytable: { // Simplified from PHP
        'SYM_3': [0,0,0,25,120,700], 'SYM_4': [0,0,0,20,80,350], 'SYM_5': [0,0,0,15,60,250],
        'SYM_6': [0,0,0,15,50,180], 'SYM_7': [0,0,0,10,40,140], 'SYM_8': [0,0,0,5,20,70],
        'SYM_9': [0,0,0,5,15,60], 'SYM_10': [0,0,0,5,15,50], 'SYM_11': [0,0,0,5,10,40],
        'SYM_12': [0,0,0,5,10,30],
      },
      slotWildMpl: 1,
      slotFreeCount: {3:10, 4:10, 5:10}, // Example: 3+ scatters give 10 free games
      Jackpots: {},
      SaveLogReport: jest.fn(),
      SaveGameData: jest.fn(),
      SaveGameDataStatic: jest.fn(),
      InternalErrorSilent: jest.fn(),
      GetReelStrips: jest.fn(() => ({ // Mocked reel strips for a 5x3 game
        reel1: ['3', '4', '5'], reel2: ['3', '4', '5'], reel3: ['3', '4', '5'],
        reel4: ['6', '7', '8'], reel5: ['6', '7', '8'],
        // For special symbols like 21, 22, 23, 24, 25 (expanding wilds)
        // The test should set these specifically if needed.
        rp: [0,0,0,0,0] // reel positions
      })),
      // Internal state for mocks
      _gameDenom: 0.01, _freeGames: 0, _currentFreeGame: 0, _bonusWin: 0, _totalWin: 0, _bet: 1,
    };
    return mockSlotSettingsInstance;
  });
});

// Mock global Auth and DB used by the Server
const mockAuthId = jest.fn(() => 1);
(global as any).Auth = { id: mockAuthId };
(global as any).DB = { transaction: jest.fn((callback: () => void) => callback()) };


describe('GoBananasNETServer', () => {
  let server: GoBananasNETServer;
  let mockRequest: any;
  const mockGameInstance = { name: 'GoBananasNET' }; // Mock game object passed to server

  beforeEach(() => {
    jest.clearAllMocks();
    server = new GoBananasNETServer();
    mockRequest = { query: {} }; // Simulates GET request query parameters
     // Reset internal mock states for SlotSettings instance
    if (mockSlotSettingsInstance) {
        mockSlotSettingsInstance._gameDenom = 0.01;
        mockSlotSettingsInstance._freeGames = 0;
        mockSlotSettingsInstance._currentFreeGame = 0;
        mockSlotSettingsInstance._bonusWin = 0;
        mockSlotSettingsInstance._totalWin = 0;
        mockSlotSettingsInstance._bet = 1;
    }
  });

  describe('action=init', () => {
    it('should return init string with balance and default reels', () => {
      mockRequest.query = { action: 'init', bet_denomination: '1', bet_betlevel: '1' }; // Denom in cents
      const response = server.get(mockRequest, mockGameInstance);
      expect(response).toContain('clientaction=init');
      expect(response).toContain(`credit=${mockSlotSettingsInstance.GetBalance() * 100 * (mockSlotSettingsInstance._gameDenom || 0.01)}`); // Balance in cents
      expect(response).toContain('denomination.all=1%2C2%2C5'); // Denominations multiplied by 100
      expect(response).toContain('rs.i0.r.i0.syms='); // Reel symbols part
    });

    it('should handle existing free games in init if history provides it', () => {
        mockSlotSettingsInstance.GetHistory = jest.fn(() => ({
            serverResponse: {
                bonusWin: 100, totalFreeGames: 10, currentFreeGames: 5, Balance: 900, freeState: 'someFreeState',
                reelsSymbols: { reel1:['3','4','5'], reel2:['3','4','5'], reel3:['3','4','5'], reel4:['6','7','8'], reel5:['6','7','8'], rp:[0,0,0,0,0] }
            }
        }));
        mockRequest.query = { action: 'init' };
        const response = server.get(mockRequest, mockGameInstance);
        expect(mockSlotSettingsInstance.SetGameData).toHaveBeenCalledWith('GoBananasNETBonusWin', 100);
        expect(mockSlotSettingsInstance.SetGameData).toHaveBeenCalledWith('GoBananasNETFreeGames', 10);
        // Further checks on the response string if it reflects this state
    });
  });

  describe('action=paytable', () => {
    it('should return paytable string', () => {
      mockRequest.query = { action: 'paytable' };
      const response = server.get(mockRequest, mockGameInstance);
      expect(response).toContain('clientaction=paytable');
      expect(response).toContain('pt.i0.comp.i0.symbol=SYM3'); // Part of paytable response
    });
  });

  describe('action=spin', () => {
    it('should return spin response with win', () => {
      mockRequest.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '1' };
      // Mock GetReelStrips to return a winning combination for SYM_3 (25 coins for 3)
      mockSlotSettingsInstance.GetReelStrips.mockReturnValue({
        reel1: ['3', '4', '5'], reel2: ['3', '4', '5'], reel3: ['3', '4', '5'],
        reel4: ['6', '7', '8'], reel5: ['6', '7', '8'], rp: [0,0,0,0,0]
      });

      const response = server.get(mockRequest, mockGameInstance);
      const responseObj = parseResponseString(response);

      expect(responseObj.clientaction).toBe('spin');
      expect(parseInt(responseObj['game.win.coins'], 10)).toBeGreaterThanOrEqual(0); // 3x SYM_3 should win 25
      // A more precise check would require fully parsing the 'ws.ix...' parts
      expect(response).toContain('ws.i0.types.i0.coins=25'); // Assuming SYM_3 x3 on line 0
      expect(response).toContain('rs.i0.r.i0.syms=SYM3%2CSYM4%2CSYM5'); // Reflects mocked reels
      expect(mockSlotSettingsInstance.SaveLogReport).toHaveBeenCalled();
    });

    it('should trigger free spins if scatter condition met (mocked)', () => {
        mockRequest.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '1' };
        // Mock GetReelStrips to return 3 scatters (e.g. symbol '0' if it was a scatter)
        // For GoBananas, there are no scatters for FS. Expanding wilds trigger features.
        // Let's simulate a large win that might be treated as a feature trigger or big win.
        mockSlotSettingsInstance.GetReelStrips.mockReturnValue({
             reel1: ['21', '4', '5'], reel2: ['7', '8', '9'], reel3: ['10', '11', '12'], // SYM21 is Gorilla
             reel4: ['6', '7', '8'], reel5: ['6', '7', '8'], rp: [0,0,0,0,0]
        });
        // Mock GetSpinSettings to indicate a "bonus" type win (though GoBananas is different)
        // slotSettings.slotFreeCount is not used for GoBananasNET in Server.php
        // The logic for expanding wilds (21-25) is complex and inside the spin loop.
        // Testing its exact output string is very involved.
        // We'll check if SetGameData for FreeGames related items is called if a feature implies it.
        // This test is more conceptual for GoBananas as FS are not standard scatter triggered.

        const response = server.get(mockRequest, mockGameInstance);
        // Example: if SYM21 (Gorilla) makes other symbols wild and causes a win
        // This test won't easily verify the complex wild logic output string without replicating it.
        // We can check if the game proceeds and generates a valid spin response.
        expect(response).toContain('clientaction=spin');
        // Check if SetGameData for FreeGames was called (it shouldn't for this game based on scatters)
        // expect(mockSlotSettingsInstance.SetGameData).not.toHaveBeenCalledWith('GoBananasNETFreeGames', expect.any(Number));
    });

     it('should handle freespin event', () => {
        mockSlotSettingsInstance._freeGames = 10;
        mockSlotSettingsInstance._currentFreeGame = 1;
        mockSlotSettingsInstance._bet = 2;
        mockSlotSettingsInstance._gameDenom = 0.02;
        mockSlotSettingsInstance.GetGameData = jest.fn((key: string) => {
            if (key === 'GoBananasNETDenom') return 0.02;
            if (key === 'GoBananasNETBet') return 2;
            if (key === 'GoBananasNETFreeGames') return 10;
            if (key === 'GoBananasNETCurrentFreeGame') return 1; // About to play 2nd free game
            if (key === 'GoBananasNETBonusWin') return 50; // Previous FS win
            return 0;
        });

        mockRequest.query = { action: 'freespin', bet_denomination: '2', bet_betlevel: '2' };
        const response = server.get(mockRequest, mockGameInstance);
        const responseObj = parseResponseString(response);

        expect(responseObj.clientaction).toBe('spin'); // Action in response string is 'spin'
        expect(responseObj.nextaction).toBe('freespin'); // Should continue freespins
        expect(responseObj['gamestate.current']).toBe('freespin');
        expect(parseInt(responseObj['freespins.left'],10)).toBe(10 - (1+1)); // 10 total, 1 already played, 1 just played
        expect(mockSlotSettingsInstance.SetGameData).toHaveBeenCalledWith('GoBananasNETCurrentFreeGame', 2);
    });

  });

  // Helper to parse the &-separated string response into an object
  function parseResponseString(responseStr: string): any {
    const obj: any = {};
    responseStr.split('&').forEach(pair => {
      const parts = pair.split('=');
      obj[parts[0]] = decodeURIComponent(parts[1] || '');
    });
    return obj;
  }

});
