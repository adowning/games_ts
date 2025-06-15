import { GoBananasNETGameReel } from '../GoBananasNETGameReel'; // Adjust path as necessary

describe('GoBananasNETGameReel', () => {
  const mockReelsTxtContent = `
reelStrip1=1,2,3,21,4,5,22
reelStrip2=6,7,8,23,9,10,24
reelStrip3=11,12,13,25,14,15,21
reelStrip4=16,17,18,22,19,20,23
reelStrip5=1,3,5,24,7,9,25
reelStrip6=2,4,6,21,8,10,22 // Example extra reel strip
reelStripBonus1=10,20,3,25,4,5,22
reelStripBonus2=16,17,8,21,19,10,23
  `;

  it('should correctly load reel strips from reels.txt content', () => {
    const gameReel = new GoBananasNETGameReel(mockReelsTxtContent);

    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '3', '21', '4', '5', '22']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['6', '7', '8', '23', '9', '10', '24']);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual(['1', '3', '5', '24', '7', '9', '25']);
    expect(gameReel.reelsStrip['reelStrip6']).toEqual(['2', '4', '6', '21', '8', '10', '22']);

    // Check if unspecified reels are empty
    // expect(gameReel.reelsStrip['reelStripUnspecified']).toBeUndefined(); // or .toEqual([]) depending on constructor init

    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['10', '20', '3', '25', '4', '5', '22']);
    expect(gameReel.reelsStripBonus['reelStripBonus2']).toEqual(['16', '17', '8', '21', '19', '10', '23']);
  });

  it('should handle empty or malformed lines in reels.txt content', () => {
    const malformedContent = `
reelStrip1=1,2,,3
reelStrip2= ,4,5
=6,7
reelStrip3
reelStrip4=8
`;
    const gameReel = new GoBananasNETGameReel(malformedContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '3']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual(['4', '5']);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip4']).toEqual(['8']);
  });

  it('should initialize all reel strips to empty arrays if not in content', () => {
    const minimalContent = 'reelStrip1=1,2,3';
    const gameReel = new GoBananasNETGameReel(minimalContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', '2', '3']);
    expect(gameReel.reelsStrip['reelStrip2']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip3']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip4']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip5']).toEqual([]);
    expect(gameReel.reelsStrip['reelStrip6']).toEqual([]);
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual([]);
  });

   it('should handle reelsTxtContent with various data types and filter them', () => {
    const mixedContent = `
reelStrip1=1,SYM2,3, 21, 4,5 ,22
reelStripBonus1=SYM10,20, SYMBOL_3 ,25,4,5,22
    `;
    const gameReel = new GoBananasNETGameReel(mixedContent);
    expect(gameReel.reelsStrip['reelStrip1']).toEqual(['1', 'SYM2', '3', '21', '4', '5', '22']);
    expect(gameReel.reelsStripBonus['reelStripBonus1']).toEqual(['SYM10', '20', 'SYMBOL_3', '25', '4', '5', '22']);
  });

});
