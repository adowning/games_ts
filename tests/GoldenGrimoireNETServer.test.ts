import { GoldenGrimoireNETServer } from '../GoldenGrimoireNETServer'; // Adjust path

let mockSlotSettingsInstanceGG: any;

jest.mock('../GoldenGrimoireNETSlotSettings', () => {
  return jest.fn().mockImplementation((game: any, userId: number) => {
    mockSlotSettingsInstanceGG = {
      is_active: jest.fn(() => true),
      GetBalance: jest.fn(() => 2000),
      CurrentDenom: 0.02, CurrentDenomination: 0.02, slotId: 'GoldenGrimoireNET',
      SetGameData: jest.fn(), HasGameData: jest.fn(), GetGameData: jest.fn(),
      Bet: [1, 2, 3, 4, 5], GetHistory: jest.fn(() => 'NULL'), Denominations: [0.01, 0.02, 0.05],
      slotCurrency: 'EUR', UpdateJackpots: jest.fn(), SetBalance: jest.fn(), GetPercent: jest.fn(() => 90),
      SetBank: jest.fn(), slotFreeMpl: 1, GetSpinSettings: jest.fn(() => ['win', 200]), MaxWin: 60000,
      GetRandomPay: jest.fn(() => 10), increaseRTP: false, GetBank: jest.fn(() => 3000),
      SymbolGame: ['0','1','3','4','5','6','7','8','9','10','13'], // Include scatter '0' and mystery '13'
      Paytable: { // Simplified
        'SYM_3': [0,0,0,10,30,100], 'SYM_4': [0,0,0,8,25,75], 'SYM_5': [0,0,0,5,20,40],
        'SYM_6': [0,0,0,5,15,30], 'SYM_7': [0,0,0,4,10,20], 'SYM_8': [0,0,0,4,10,20],
        'SYM_9': [0,0,0,3,8,15], 'SYM_10': [0,0,0,3,8,15],
      },
      slotWildMpl: 1, slotFreeCount: {3:8, 4:8, 5:8}, Jackpots: {}, SaveLogReport: jest.fn(),
      SaveGameData: jest.fn(), SaveGameDataStatic: jest.fn(), InternalErrorSilent: jest.fn(),
      GetReelStrips: jest.fn(() => ({ // Mocked 5x4 reels
        reel1: ['3','4','5','0'], reel2: ['3','4','5','1'], reel3: ['3','4','13','0'],
        reel4: ['6','7','8','0'], reel5: ['6','7','8','1'], rp: [0,0,0,0,0]
      })),
      // Internal state for mocks
      _gameDenom: 0.02, _freeGames: 0, _currentFreeGame: 0, _bonusWin: 0, _totalWin: 0, _bet: 1,
    };
    // Default GetGameData behavior
    mockSlotSettingsInstanceGG.GetGameData = jest.fn((key: string) => {
        if (key === 'GoldenGrimoireNETGameDenom') return mockSlotSettingsInstanceGG._gameDenom;
        if (key === 'GoldenGrimoireNETFreeGames') return mockSlotSettingsInstanceGG._freeGames;
        if (key === 'GoldenGrimoireNETCurrentFreeGame') return mockSlotSettingsInstanceGG._currentFreeGame;
        if (key === 'GoldenGrimoireNETBonusWin') return mockSlotSettingsInstanceGG._bonusWin;
        if (key === 'GoldenGrimoireNETTotalWin') return mockSlotSettingsInstanceGG._totalWin;
        if (key === 'GoldenGrimoireNETBet') return mockSlotSettingsInstanceGG._bet;
        return 0;
    });
    return mockSlotSettingsInstanceGG;
  });
});

const mockAuthIdGG = jest.fn(() => 1);
(global as any).Auth = { id: mockAuthIdGG };
(global as any).DB = { transaction: jest.fn((callback: () => void) => callback()) };

describe('GoldenGrimoireNETServer', () => {
  let server: GoldenGrimoireNETServer;
  let mockRequestGG: any;
  const mockGameInstanceGG = { name: 'GoldenGrimoireNET' };

  beforeEach(() => {
    jest.clearAllMocks();
    server = new GoldenGrimoireNETServer();
    mockRequestGG = { query: {} };
    if (mockSlotSettingsInstanceGG) { // Reset internal states of the mock
        mockSlotSettingsInstanceGG._gameDenom = 0.02; mockSlotSettingsInstanceGG._freeGames = 0;
        mockSlotSettingsInstanceGG._currentFreeGame = 0; mockSlotSettingsInstanceGG._bonusWin = 0;
        mockSlotSettingsInstanceGG._totalWin = 0; mockSlotSettingsInstanceGG._bet = 1;
        mockSlotSettingsInstanceGG.GetBalance.mockReturnValue(2000); // Reset balance
        mockSlotSettingsInstanceGG.GetHistory.mockReturnValue('NULL'); // Reset history
        mockSlotSettingsInstanceGG.GetReelStrips.mockReturnValue({
            reel1: ['3','4','5','0'], reel2: ['3','4','5','1'], reel3: ['3','4','13','0'],
            reel4: ['6','7','8','0'], reel5: ['6','7','8','1'], rp: [0,0,0,0,0]
        });
    }
  });

  describe('action=init', () => {
    it('should return init string with balance and default reels', () => {
      mockRequestGG.query = { action: 'init', bet_denomination: '2', bet_betlevel: '1' }; // Denom in cents
      const response = server.get(mockRequestGG, mockGameInstanceGG);
      expect(response).toContain('clientaction=init');
      expect(response).toContain(`credit=${mockSlotSettingsInstanceGG.GetBalance() * 100 * (mockSlotSettingsInstanceGG._gameDenom || 0.02)}`);
      expect(response).toContain('denomination.all=1%2C2%2C5%2C10%2C20%2C50%2C100%2C200'); // Denominations multiplied by 100
      expect(response).toContain('rs.i0.r.i0.syms=SYM3%2CSYM3%2CSYM6%2CSYM6'); // Default init reels from PHP
    });
  });

  describe('action=paytable', () => {
    it('should return paytable string', () => {
      mockRequestGG.query = { action: 'paytable' };
      const response = server.get(mockRequestGG, mockGameInstanceGG);
      expect(response).toContain('clientaction=paytable');
      expect(response).toContain('pt.i0.comp.i0.symbol=SYM1'); // Wild symbol in paytable
      expect(response).toContain('pt.i0.comp.i3.symbol=SYM3'); // Red Gem
    });
  });

  describe('action=spin', () => {
    it('should handle a standard win', () => {
      mockRequestGG.query = { action: 'spin', bet_denomination: '2', bet_betlevel: '1' };
      // Mock reels for a win (e.g., three SYM_3 on line 0)
      // lineId[0] = [2,2,2,2,2] (middle row for 4-row display, index 1 in 0-based array)
      mockSlotSettingsInstanceGG.GetReelStrips.mockReturnValue({
        reel1: ['1','3','0','13'], reel2: ['1','3','0','13'], reel3: ['1','3','0','13'],
        reel4: ['6','7','8','0'], reel5: ['6','7','8','1'], rp: [0,0,0,0,0]
      });
      const response = server.get(mockRequestGG, mockGameInstanceGG);
      const responseObj = parseResponseStringGG(response);
      expect(responseObj.clientaction).toBe('spin');
      expect(parseInt(responseObj['game.win.coins'], 10)).toBe(10); // 3x SYM_3 = 10 coins * betlevel 1
      expect(response).toContain('ws.i0.types.i0.coins=10');
      expect(mockSlotSettingsInstanceGG.SaveLogReport).toHaveBeenCalled();
    });

    it('should handle mystery symbol transformation (SYM13)', () => {
        mockRequestGG.query = { action: 'spin', bet_denomination: '2', bet_betlevel: '1' };
        // Reel 3 has SYM13 at index 2 (3rd symbol on reel)
        // linesId[k][2]-1 will be the index used from reel3. For line 0, it's linesId[0][2]-1 = 2-1 = 1.
        // Let's ensure SYM13 is on the payline to see it transform.
         mockSlotSettingsInstanceGG.GetReelStrips.mockReturnValue({
            reel1: ['3','4','5','0'], reel2: ['3','4','5','1'], reel3: ['3','13','5','0'], // SYM13 on payline
            reel4: ['6','7','8','0'], reel5: ['6','7','8','1'], rp: [0,0,0,0,0]
        });
        const response = server.get(mockRequestGG, mockGameInstanceGG);
        expect(response).toContain('clientaction=spin');
        // Check if an overlay string part exists, indicating SYM13 transformed.
        // The transformed symbol is random from overlayRandomSymArr.
        expect(response).toMatch(/rs\.i0\.r\.i2\.overlay\.i\d+\.with=SYM\d+/);
        // Further check if reel3 symbols in response reflect transformation
        // Example: if SYM13 became SYM6 (an overlayRandomSymArr possibility)
        // expect(response).toContain('rs.i0.r.i2.syms=SYM3%2CSYM6%2CSYM5%2CSYM0'); // If SYM13 at index 1 transformed
    });

    it('should trigger free spins with 3 scatter symbols (SYM0)', () => {
        mockRequestGG.query = { action: 'spin', bet_denomination: '2', bet_betlevel: '1' };
        // reels from beforeEach already have 3 scatters on reels 1,3,4 at various positions
        // Line 0 (middle row, index 1) will have SYM_0 on reel1, SYM_13 on reel3, SYM_0 on reel4
        // Let's adjust to ensure scatters are clearly on the visible part of the grid
         mockSlotSettingsInstanceGG.GetReelStrips.mockReturnValue({
            reel1: ['0','4','5','0'], reel2: ['3','0','5','1'], reel3: ['3','4','0','0'], // 3 scatters
            reel4: ['6','7','8','1'], reel5: ['6','7','8','1'], rp: [0,0,0,0,0]
        });

        const response = server.get(mockRequestGG, mockGameInstanceGG);
        const responseObj = parseResponseStringGG(response);

        expect(responseObj.clientaction).toBe('spin');
        expect(mockSlotSettingsInstanceGG.SetGameData).toHaveBeenCalledWith('GoldenGrimoireNETFreeGames', 8); // 3 scatters = 8 FS
        expect(response).toContain('ws.i0.types.i0.freespins=8'); // In win string
        expect(response).toContain('nextaction=freespin'); // Response string part
    });
  });

  function parseResponseStringGG(responseStr: string): any {
    const obj: any = {};
    if(!responseStr) return obj;
    responseStr.split('&').forEach(pair => {
      const parts = pair.split('=');
      obj[parts[0]] = decodeURIComponent(parts[1] || '');
    });
    return obj;
  }

});
