// Assuming the content of reels.txt is available as a string.
// This would be loaded from 'NET/GrandSpinnSuperpotNET/reels.txt' in a real scenario.
const reelsTxtContent = `
reelStrip1=1,2,3,4,5,6,7,8,100,101,102
reelStrip2=1,2,3,4,5,6,7,8,100,101,102
reelStrip3=1,2,3,4,5,6,7,8,100,101,102
reelStrip4=1,2,3,4,5,6,7,8,100,101,102
reelStrip5=1,2,3,4,5,6,7,8,100,101,102
reelStrip6=1,2,3,4,5,6,7,8,100,101,102
reelStripBonus1=1,2,3,4,5,6,7,8
reelStripBonus2=1,2,3,4,5,6,7,8
reelStripBonus3=1,2,3,4,5,6,7,8
`; // Note: This is a placeholder, actual content might differ. GrandSpinn has 3 reels.

export class GrandSpinnSuperpotNETGameReel {
  public reelsStrip: Record<string, string[]> = {
    reelStrip1: [],
    reelStrip2: [],
    reelStrip3: [],
    // GrandSpinn only has 3 reels, but the PHP class defines up to 6.
    // Keep structure for consistency or potential use, though game logic might only use 1-3.
    reelStrip4: [],
    reelStrip5: [],
    reelStrip6: [],
  };
  // Bonus strips might not be used by GrandSpinn if it doesn't have a separate bonus reel set.
  public reelsStripBonus: Record<string, string[]> = {
    reelStripBonus1: [],
    reelStripBonus2: [],
    reelStripBonus3: [],
    reelStripBonus4: [],
    reelStripBonus5: [],
    reelStripBonus6: [],
  };

  constructor(reelsFileContent: string = reelsTxtContent) {
    // Initialize all reel strips to empty arrays first
    for (let i = 1; i <= 6; i++) {
        this.reelsStrip[`reelStrip${i}`] = [];
        this.reelsStripBonus[`reelStripBonus${i}`] = [];
    }

    const lines = reelsFileContent.trim().split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const data = parts[1].split(',');

        if (this.reelsStrip.hasOwnProperty(key)) {
          this.reelsStrip[key] = data.map(elem => elem.trim()).filter(elem => elem !== '');
        }
        if (this.reelsStripBonus.hasOwnProperty(key)) {
          this.reelsStripBonus[key] = data.map(elem => elem.trim()).filter(elem => elem !== '');
        }
      }
    }
  }
}
