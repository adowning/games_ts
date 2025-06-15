import { GoldenGrimoireNETGameReel } from '../GoldenGrimoireNETGameReel'; // Adjust path as necessary

describe('GoldenGrimoireNETGameReel', () => {
  const mockReelsTxtContent = `
reelStrip1=1,2,0,13,4,5,0
reelStrip2=6,7,8,13,9,10,0
reelStrip3=11,12,13,0,14,15,1
reelStrip4=16,17,18,13,19,20,0
reelStrip5=1,0,5,13,7,9,0
reelStripBonus1=10,0,3,13,4,5,0
reelStripBonus2=16,17,8,13,19,10,0
  `; // Example content, GoldenGrimoire has 4 rows per reel in game logic, reels.txt might reflect this or internal symbol list.

  it('should correctly load reel strips from reels.txt content', () => {
    const gameReel = new GoldenGrimoireNETGameReel(mockReelsTxtContent);

    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '0', '13', '4', '5', '0']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['6', '7', '8', '13', '9', '10', '0']);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual(['1', '0', '5', '13', '7', '9', '0']);

    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['10', '0', '3', '13', '4', '5', '0']);
    expect(gameReel.reelsStripBonus['reelStripBonus2']).toEqual(['16', '17', '8', '13', '19', '10', '0']);
  });

  it('should handle empty or malformed lines in reels.txt content', () => {
    const malformedContent = `
reelStrip1=1,2,,0
reelStrip2= ,13,5
=6,7
reelStrip3
reelStrip4=8
`;
    const gameReel = new GoldenGrimoireNETGameReel(malformedContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '0']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['13', '5']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip4']).toEqual(['8']);
  });

  it('should initialize all reel strips to empty arrays if not in content', () => {
    const minimalContent = 'reelStrip1=1,0,13';
    const gameReel = new GoldenGrimoireNETGameReel(minimalContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '0', '13']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip4']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip6']).toEqual([]); // PHP class defines 6 strips
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual([]);
  });
});
