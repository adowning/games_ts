import { GrandSpinnSuperpotNETGameReel } from '../GrandSpinnSuperpotNETGameReel'; // Adjust path

describe('GrandSpinnSuperpotNETGameReel', () => {
  // GrandSpinnSuperpotNET is a 3-reel game.
  const mockReelsTxtContent = `
reelStrip1=1,2,3,4,5,6,7,8,0,50,99,100,101,102
reelStrip2=8,7,6,5,4,3,2,1,0,50,99,102,101,100
reelStrip3=1,3,5,7,0,2,4,6,8,50,99,100,101,102
reelStripBonus1=1,1,1 # Not typically used in GrandSpinn, but test parsing
  `;

  it('should correctly load reel strips for a 3-reel game', () => {
    const gameReel = new GrandSpinnSuperpotNETGameReel(mockReelsTxtContent);

    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '0', '50', '99', '100', '101', '102']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['8', '7', '6', '5', '4', '3', '2', '1', '0', '50', '99', '102', '101', '100']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual(['1', '3', '5', '7', '0', '2', '4', '6', '8', '50', '99', '100', '101', '102']);

    // Ensure other strips (4-6) are initialized but empty if not in reels.txt (or per constructor logic)
    expect(gameReel.reelsStrip['reelStrip4']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip6']).toEqual([]);

    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['1','1','1']);
  });

  it('should handle empty or malformed lines', () => {
    const malformedContent = `
reelStrip1=1,2,,3
reelStrip2= ,4,5,0
=6,7
reelStrip3
`;
    const gameReel = new GrandSpinnSuperpotNETGameReel(malformedContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '3']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['4', '5', '0']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
  });

  it('should initialize all defined reel strips to empty arrays if not in content', () => {
    const minimalContent = 'reelStrip1=100,101,102';
    const gameReel = new GrandSpinnSuperpotNETGameReel(minimalContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['100', '101', '102']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
  });
});
