import { LightsNETGameReel } from '../LightsNETGameReel'; // Adjust path

describe('LightsNETGameReel', () => {
  const mockReelsTxtContent = `
reelStrip1=2,3,4,5,6,7,8,9,10,0,1
reelStrip2=2,3,4,5,6,7,8,9,10,0,1,1,1 # Example of a slightly different strip
reelStrip3=2,3,4,5,6,7,8,9,10,0,1
reelStrip4=2,3,4,5,6,7,8,9,10,0,1
reelStrip5=2,3,4,5,6,7,8,9,10,0,1
reelStripBonus1=1,1,1,2,3,4,5,6,7,8,9,10,0 # Bonus strips might be richer in wilds or high symbols
reelStripBonus2=1,1,2,3,4,5,6,7,8,9,10,0
  `;

  it('should correctly load reel strips from reels.txt content', () => {
    const gameReel = new LightsNETGameReel(mockReelsTxtContent);

    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10', '0', '1']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10', '0', '1', '1', '1']);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10', '0', '1']);

    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['1', '1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '0']);
    expect(gameReel.reelsStripBonus['reelStripBonus2']).toEqual(['1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '0']);
  });

  it('should handle empty or malformed lines in reels.txt content', () => {
    const malformedContent = `
reelStrip1=1,2,,0
reelStrip2= ,1,5
=6,7
reelStrip3
reelStripBonus1=SYM_WILD, SYM_SCATTER
`;
    const gameReel = new LightsNETGameReel(malformedContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '0']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['1', '5']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['SYM_WILD', 'SYM_SCATTER']);
  });

  it('should initialize all defined reel strips to empty arrays if not in content', () => {
    const minimalContent = 'reelStrip1=1,0,10';
    const gameReel = new LightsNETGameReel(minimalContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '0', '10']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip4']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip6']).toEqual([]); // PHP class defines 6 strips
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual([]);
  });
});
