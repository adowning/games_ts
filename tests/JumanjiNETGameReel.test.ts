import { JumanjiNETGameReel } from '../JumanjiNETGameReel'; // Adjust path as necessary

describe('JumanjiNETGameReel', () => {
  const mockReelsTxtContent = `
reelStrip1=1,2,3,0,4,5,0,13 # 3 symbols needed for reel 1 (3-4-5-4-3)
reelStrip2=6,7,8,9,0,10,11,13 # 4 symbols for reel 2
reelStrip3=12,13,14,15,0,1,2,3,4 # 5 symbols for reel 3
reelStrip4=5,6,7,8,0,9,10,13 # 4 symbols for reel 4
reelStrip5=11,12,13,0,14,15,1 # 3 symbols for reel 5
reelStripBonus1=1,0,13,5,7,9 # Example bonus strip
  `;

  it('should correctly load reel strips from reels.txt content', () => {
    const gameReel = new JumanjiNETGameReel(mockReelsTxtContent);

    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '3', '0', '4', '5', '0', '13']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual(['12', '13', '14', '15', '0', '1', '2', '3', '4']);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual(['11', '12', '13', '0', '14', '15', '1']);

    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['1', '0', '13', '5', '7', '9']);
  });

  it('should handle empty or malformed lines in reels.txt content', () => {
    const malformedContent = `
reelStrip1=1,2,,0
reelStrip2= ,13,5
=6,7
reelStrip3
reelStrip4=8,9,10,11
`;
    const gameReel = new JumanjiNETGameReel(malformedContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '0']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['13', '5']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip4']).toEqual(['8', '9', '10', '11']);
  });

  it('should initialize all defined reel strips to empty arrays if not in content', () => {
    const minimalContent = 'reelStrip1=1,0,13';
    const gameReel = new JumanjiNETGameReel(minimalContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '0', '13']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual([]);
    // ... and so on for other strips defined in the class (reelStrip3-6, reelStripBonus1-6)
    expect(gameReel.reelsStrip['reelStrip5']).toEqual([]);
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual([]);
  });
});
