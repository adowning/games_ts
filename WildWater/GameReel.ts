// The content of reels.txt is now a constant inside the file,
// matching the source data exactly.
//
const reelData = `
reelStrip1=6,6,6,7,7,7,3,3,3,5,5,5,4,4,4,7,7,7,3,3,3,2,4,4,4,0,6,6,6,1,3,3,3,7,7,7,5,5,5,6,6,6
reelStrip2=3,3,3,2,6,6,6,2,4,4,4,2,5,5,5,7,7,7,1,3,3,3,2,5,5,5,0,4,4,4,2,5,5,5,7,7,7,1,6,6,6,3,3,3,2,5,5,5,4,4,4,2,7,7,7,1,3,3,3,5,5,5,1,7,7,7,4,4,4,6,6,6,1
reelStrip3=5,5,5,2,4,4,4,6,6,6,0,3,3,3,6,6,6,0,5,5,5,0,7,7,7,5,5,5,7,7,7,2,4,4,4,7,7,7,2,4,4,4,7,7,7,1,6,6,6,6,6,6,4,4,4
reelStrip4=6,6,6,3,3,3,7,7,7,4,4,4,2,5,5,5,4,4,4,0,6,6,6,3,3,3,3,3,3,6,6,6,4,4,4,2,6,6,6,4,4,4,2,5,5,5,4,4,4,4,4,4,2,7,7,7,1,4,4,4,2
reelStrip5=2,3,3,3,2,4,4,4,2,5,5,5,0,7,7,7,5,5,5,2,3,3,3,0,7,7,7,6,6,6,1,7,7,7,2,6,6,6
`;

/**
 * GameReel class parses and holds the reel strip definitions for the game.
 * It now contains the accurate reel data, removing the need for file I/O.
 */
export class GameReel {
  public reelsStrip: { [key: string]: string[] } = {
    reelStrip1: [], reelStrip2: [], reelStrip3: [],
    reelStrip4: [], reelStrip5: [], reelStrip6: [],
  };
  public reelsStripBonus: { [key: string]: string[] } = {
    reelStripBonus1: [], reelStripBonus2: [], reelStripBonus3: [],
    reelStripBonus4: [], reelStripBonus5: [], reelStripBonus6: [],
  };

  constructor() {
    this.parseReels(reelData, this.reelsStrip);
    // For WildWater, the bonus reels are the same as the main reels.
    this.reelsStripBonus = { ...this.reelsStrip };
  }

  private parseReels(data: string, target: { [key: string]: string[] }): void {
    const lines = data.trim().split('\n');
    for (const line of lines) {
      const [key, values] = line.split('=');
      if (key && values && target.hasOwnProperty(key)) {
        target[key] = values.split(',').map(s => s.trim()).filter(s => s !== '');
      }
    }
  }
}