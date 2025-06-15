import { ReelRush2NETGameReel } from '../ReelRush2NETGameReel'; // Adjust path

describe('ReelRush2NETGameReel', () => {
  const mockReelsTxtContent = `
reelStrip1=1,2,3,4,5,6,7,8,9,10,11,12,13,WILD,SCATTER
reelStrip2=1,2,3,4,5,6,7,8,9,10,11,12,13,WILD,SCATTER
reelStrip3=1,2,3,4,5,6,7,8,9,10,11,12,13,WILD,SCATTER
reelStrip4=1,2,3,4,5,6,7,8,9,10,11,12,13,WILD,SCATTER
reelStrip5=1,2,3,4,5,6,7,8,9,10,11,12,13,WILD,SCATTER
# ReelRush2 might have distinct bonus/feature reel strips.
reelStripBonus1=WILD,WILD,3,4,5,6,7,8,9,10,11,12,13,SCATTER
  `;

  it('should correctly load reel strips from reels.txt content', () => {
    const gameReel = new ReelRush2NETGameReel(mockReelsTxtContent);

    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1','2','3','4','5','6','7','8','9','10','11','12','13','WILD','SCATTER']);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual(['1','2','3','4','5','6','7','8','9','10','11','12','13','WILD','SCATTER']);
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['WILD','WILD','3','4','5','6','7','8','9','10','11','12','13','SCATTER']);
  });

  it('should handle empty or malformed lines in reels.txt content', () => {
    const malformedContent = `
reelStrip1=1,2,,WILD
reelStrip2= ,SCATTER,5
=6,7
reelStrip3
`;
    const gameReel = new ReelRush2NETGameReel(malformedContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', 'WILD']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['SCATTER', '5']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
  });

  it('should initialize all defined reel strips to empty arrays if not in content', () => {
    const minimalContent = 'reelStrip1=1,2,3';
    const gameReel = new ReelRush2NETGameReel(minimalContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '3']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual([]);
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual([]);
  });
});
