import { ReelRush2NETServer } from '../ReelRush2NETServer'; // Adjust path

let mockSlotSettingsInstanceRR2_Srv: any;

jest.mock('../ReelRush2NETSlotSettings', () => {
  return jest.fn().mockImplementation((game: any, userId: number) => {
    mockSlotSettingsInstanceRR2_Srv = {
      is_active: jest.fn(() => true), GetBalance: jest.fn(() => 500), CurrentDenom: 0.01, CurrentDenomination: 0.01,
      slotId: 'ReelRush2NET', SetGameData: jest.fn(),
      HasGameData: jest.fn((key: string) => {
        const dataKey = key.replace(mockSlotSettingsInstanceRR2_Srv.slotId, ''); // Remove gameId prefix
        return mockSlotSettingsInstanceRR2_Srv[`_${dataKey}`] !== undefined;
      }),
      GetGameData: jest.fn((key: string) => {
        const dataKey = key.replace(mockSlotSettingsInstanceRR2_Srv.slotId, '');
        if (dataKey === 'GameDenom') return mockSlotSettingsInstanceRR2_Srv.CurrentDenom;
        if (dataKey === 'Bet') return mockSlotSettingsInstanceRR2_Srv._betLevel || 1;
        if (dataKey === 'AllBet') return mockSlotSettingsInstanceRR2_Srv._allBet || 20; // Default 1 * 20 lines
        if (dataKey === 'Stars') return mockSlotSettingsInstanceRR2_Srv._stars || 0;
        if (dataKey === 'RespinId') return mockSlotSettingsInstanceRR2_Srv._respinId || 0;
        if (dataKey === 'FreeGames') return mockSlotSettingsInstanceRR2_Srv._freeGames || 0;
        if (dataKey === 'CurrentFreeGame') return mockSlotSettingsInstanceRR2_Srv._currentFreeGame || 0;
        if (dataKey === 'BonusWin') return mockSlotSettingsInstanceRR2_Srv._bonusWin || 0;
        if (dataKey === 'TotalWin') return mockSlotSettingsInstanceRR2_Srv._totalWin || 0;
        if (dataKey === 'SuperMpl') return mockSlotSettingsInstanceRR2_Srv._superMpl || 1;

        return mockSlotSettingsInstanceRR2_Srv[`_${dataKey}`] || 0;
      }),
      Bet: ['1','2','5','10'], Denominations: [0.01,0.02,0.05], slotCurrency: 'EUR',
      UpdateJackpots: jest.fn(), SetBalance: jest.fn(), GetPercent: jest.fn(() => 96),
      SetBank: jest.fn(), slotFreeMpl: 1,
      GetSpinSettings: jest.fn(() => ['win', 200]), // Default to a win to trigger respins
      MaxWin: 100000, GetRandomPay: jest.fn(() => 10), increaseRTP: false, GetBank: jest.fn(() => 30000),
      SymbolGame: ['3','4','5','6','7','8','9','10','11','12','13', 'WILD'],
      Paytable: { 'SYM_3': [0,0,0,10,50,200], /* Strawberry ... other symbols */ },
      slotWildMpl: 1, slotFreeCount: {3:8}, Jackpots: {}, SaveLogReport: jest.fn(),
      SaveGameData: jest.fn(), SaveGameDataStatic: jest.fn(), InternalErrorSilent: jest.fn(),
      GetReelStrips: jest.fn((winType, slotEvent, respinId = 0) => {
        // Return a full 5x5 grid, server logic will determine visible parts
        const r = () => ['3','4','5','6','7'][Math.floor(Math.random()*5)]; // Random paying symbol
        return {
            reel1: [r(),r(),r(),r(),r()], reel2: [r(),r(),r(),r(),r()], reel3: [r(),r(),r(),r(),r()],
            reel4: [r(),r(),r(),r(),r()], reel5: [r(),r(),r(),r(),r()], rp:[0,0,0,0,0]
        };
      }),
      SymbolUpgrade: jest.fn((r,fc) => `&features.i${fc}.type=SymbolUpgrade&features.i${fc}.data.from=SYM13&features.i${fc}.data.to=SYM3`),
      RandomWilds: jest.fn((r,fc) => `&features.i${fc}.type=RandomWilds&features.i${fc}.data.positions=0%2C0`),
      // Internal mock state helpers
      _betLevel: 1, _allBet: 20, _stars: 0, _respinId: 0, _freeGames: 0,
      _currentFreeGame: 0, _bonusWin: 0, _totalWin: 0, _superMpl: 1,
    };
    return mockSlotSettingsInstanceRR2_Srv;
  });
});

const mockAuthIdRR2_Srv = jest.fn(() => 1);
(global as any).Auth = { id: mockAuthIdRR2_Srv };
(global as any).DB = { transaction: jest.fn((callback: () => void) => callback()) };

describe('ReelRush2NETServer', () => {
  let server: ReelRush2NETServer;
  let mockRequestRR2_Srv: any;
  const mockGameInstanceRR2_Srv = { name: 'ReelRush2NET' };

  beforeEach(() => {
    jest.clearAllMocks();
    server = new ReelRush2NETServer();
    mockRequestRR2_Srv = { query: {} };
    if (mockSlotSettingsInstanceRR2_Srv) { // Reset internal states
        mockSlotSettingsInstanceRR2_Srv._betLevel = 1; mockSlotSettingsInstanceRR2_Srv._allBet = 20;
        mockSlotSettingsInstanceRR2_Srv._stars = 0; mockSlotSettingsInstanceRR2_Srv._respinId = 0;
        mockSlotSettingsInstanceRR2_Srv._freeGames = 0; mockSlotSettingsInstanceRR2_Srv._currentFreeGame = 0;
        mockSlotSettingsInstanceRR2_Srv._bonusWin = 0; mockSlotSettingsInstanceRR2_Srv._totalWin = 0;
        mockSlotSettingsInstanceRR2_Srv._superMpl = 1;
        mockSlotSettingsInstanceRR2_Srv.GetBalance.mockReturnValue(500);
        mockSlotSettingsInstanceRR2_Srv.GetHistory.mockReturnValue('NULL');
    }
  });

  function parseQueryString(str: string): Record<string, string> {
    const result: Record<string, string> = {};
    if(!str) return result;
    str.split('&').forEach(part => { const item = part.split('='); result[item[0]] = decodeURIComponent(item[1] || ''); });
    return result;
  }

  describe('action=init', () => {
    it('should return init string with default 0 stars and initial reel config', () => {
      mockRequestRR2_Srv.query = { action: 'init', bet_denomination: '1', bet_betlevel: '1' };
      const response = server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
      const resObj = parseQueryString(response);
      expect(resObj.clientaction).toBe('init');
      expect(resObj.credit).toBeDefined();
      expect(resObj['stars.total']).toBe('0');
      expect(resObj['openedpositions.total']).toBe('0'); // Initial state, 0 respins
      expect(response).toContain('rs.i0.r.i0.syms='); // Reel symbols part
    });
  });

  describe('action=spin (and re-spins)', () => {
    it('should trigger a re-spin and expand reel area on a win', () => {
      mockRequestRR2_Srv.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '1' };
      // Ensure GetSpinSettings returns a win
      mockSlotSettingsInstanceRR2_Srv.GetSpinSettings.mockReturnValue(['win', 100]);
      // Mock a winning combination for initial spin (actual win calc is complex and abstracted here)
      mockSlotSettingsInstanceRR2_Srv.GetReelStrips.mockImplementation(() => ({
          reel1: ['3','4','5'], reel2: ['3','4','5'], reel3: ['3','4','5'], // Example to ensure win
          reel4: ['6','7','8'], reel5: ['6','7','1'], rp:[0,0,0,0,0]
      }));

      const response = server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
      const resObj = parseQueryString(response);

      expect(resObj.clientaction).toBe('spin');
      expect(resObj.nextaction).toBe('respin');
      expect(resObj['gamestate.current']).toBe('respin'); // Or 'basic' with nextaction=respin in some NET games
      expect(resObj['openedpositions.total']).toBe('2'); // 2 blocks opened after 1st win/respin
      expect(mockSlotSettingsInstanceRR2_Srv.SetGameData).toHaveBeenCalledWith('ReelRush2NETRespinId', 1);
    });

    it('should progress through re-spin levels up to 5, then trigger free spins selection', () => {
      mockRequestRR2_Srv.query = { action: 'spin', bet_denomination: '1', bet_betlevel: '1' };
      mockSlotSettingsInstanceRR2_Srv.GetSpinSettings.mockReturnValue(['win', 100]); // Ensure wins for respins

      let response;
      let resObj;

      for(let respLevel = 0; respLevel < 5; respLevel++){
        mockSlotSettingsInstanceRR2_Srv._respinId = respLevel; // Simulate current respin level
        // Simulate a win that would trigger next respin
        mockSlotSettingsInstanceRR2_Srv.GetReelStrips.mockImplementation(() => ({
            reel1: [`${3+respLevel}`,'4','5'], reel2: [`${3+respLevel}`,'4','5'], reel3: [`${3+respLevel}`,'4','5'],
            reel4: ['6','7','8'], reel5: ['6','7','1'], rp:[0,0,0,0,0]
        }));

        response = server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
        resObj = parseQueryString(response);

        expect(resObj.nextaction).toBe('respin');
        expect(resObj['openedpositions.total']).toBe(String((respLevel + 1) * 2));
        mockRequestRR2_Srv.query.action = 'respin'; // Next action is a respin
      }

      // After 5th respin win
      mockSlotSettingsInstanceRR2_Srv._respinId = 5;
       mockSlotSettingsInstanceRR2_Srv.GetReelStrips.mockImplementation(() => ({
            reel1: ['8','4','5'], reel2: ['8','4','5'], reel3: ['8','4','5'],
            reel4: ['6','7','8'], reel5: ['6','7','1'], rp:[0,0,0,0,0]
        }));
      response = server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
      resObj = parseQueryString(response);

      expect(resObj.nextaction).toBe('startfreespins');
      expect(resObj['gamestate.current']).toBe('start_freespins');
      expect(resObj['openedpositions.total']).toBe('12'); // Max blocks opened before FS
    });
  });

  describe('Free Spins and Super Free Spins Actions', () => {
    it('action=startfreespins should provide options', () => {
        mockSlotSettingsInstanceRR2_Srv._stars = 500; // Give some stars
        mockRequestRR2_Srv.query = { action: 'startfreespins' };
        const response = server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
        expect(response).toContain('clientaction=startfreespins');
        expect(response).toContain('legalactions=startfreespins%2Cgamble%2Cpurchasestars');
        expect(response).toContain(`stars.total=${mockSlotSettingsInstanceRR2_Srv._stars}`);
    });

    it('action=freespin should run a free spin', () => {
        mockSlotSettingsInstanceRR2_Srv._freeGames = 8;
        mockSlotSettingsInstanceRR2_Srv._currentFreeGame = 0;
        mockSlotSettingsInstanceRR2_Srv.GetGameData = jest.fn(key => {
            if(key.endsWith('FreeGames')) return 8;
            if(key.endsWith('CurrentFreeGame')) return 0;
            if(key.endsWith('Bet')) return 1;
            if(key.endsWith('Denom')) return 0.01;
            return 0;
        });
        mockRequestRR2_Srv.query = { action: 'freespin' }; // Server maps this to action=spin, slotEvent=freespin
        const response = server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
        const resObj = parseQueryString(response);
        expect(resObj.nextaction).toBe('freespin');
        expect(resObj['gamestate.current']).toBe('freespin');
        expect(resObj['freespins.left']).toBe('7'); // 8 total, 1 played
    });

    // Super Free Spins would be similar but with freeMode=superfreespin and multiplier logic
  });

  describe('Token (Stars) Actions', () => {
    it('action=purchasestars should deduct balance and add stars', () => {
        mockSlotSettingsInstanceRR2_Srv._allBet = 20; // 1 coin value * 20 lines cost
        mockSlotSettingsInstanceRR2_Srv.GetBalance.mockReturnValue(1000); // 1000 currency (100000 cents)
        mockRequestRR2_Srv.query = { action: 'purchasestars', starbuy_amount: '0' }; // Buy 400 stars for 6x bet

        server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
        const expectedCost = 6 * mockSlotSettingsInstanceRR2_Srv._allBet; // Cost in coins
        expect(mockSlotSettingsInstanceRR2_Srv.SetBalance).toHaveBeenCalledWith(-expectedCost, 'bet');
        expect(mockSlotSettingsInstanceRR2_Srv.SetGameData).toHaveBeenCalledWith('ReelRush2NETStars', 400);
    });

    it('action=gamble should use stars and determine if Super FS is won', () => {
        mockSlotSettingsInstanceRR2_Srv._stars = 1000; // Have 1000 stars (50% chance)
        mockRequestRR2_Srv.query = { action: 'gamble' };
        const response = server.get(mockRequestRR2_Srv, mockGameInstanceRR2_Srv);
        expect(response).toContain('clientaction=gamble');
        expect(response).toMatch(/gamble\.win=(true|false)/);
        expect(mockSlotSettingsInstanceRR2_Srv.SetGameData).toHaveBeenCalledWith('ReelRush2NETStars', 0); // Stars are used
    });
  });

});
