// Assuming the content of reels.txt for Lights is available as a string.
// This would be loaded from 'NET/LightsNET/reels.txt' in a real scenario.
const reelsTxtContent = `
reelStrip1=2,3,4,5,6,7,8,9,10,0,1
reelStrip2=2,3,4,5,6,7,8,9,10,0,1
reelStrip3=2,3,4,5,6,7,8,9,10,0,1
reelStrip4=2,3,4,5,6,7,8,9,10,0,1
reelStrip5=2,3,4,5,6,7,8,9,10,0,1
# Lights might use different strips for Free Spins (bonus strips)
reelStripBonus1=2,3,4,5,6,7,8,9,10,0,1,1,1 # Higher chance of wilds or specific symbols
reelStripBonus2=2,3,4,5,6,7,8,9,10,0,1,1
reelStripBonus3=2,3,4,5,6,7,8,9,10,0,1
reelStripBonus4=2,3,4,5,6,7,8,9,10,0,1
reelStripBonus5=2,3,4,5,6,7,8,9,10,0,1
`; // Example content.

export class LightsNETGameReel {
  public reelsStrip: Record<string, string[]> = {
    reelStrip1: [], reelStrip2: [], reelStrip3: [],
    reelStrip4: [], reelStrip5: [], reelStrip6: [], // PHP class defines 6
  };
  public reelsStripBonus: Record<string, string[]> = {
    reelStripBonus1: [], reelStripBonus2: [], reelStripBonus3: [],
    reelStripBonus4: [], reelStripBonus5: [], reelStripBonus6: [],
  };

  constructor(reelsFileContent: string = reelsTxtContent) {
    for (let i = 1; i <= 6; i++) {
        this.reelsStrip[`reelStrip${i}`] = [];
        this.reelsStripBonus[`reelStripBonus${i}`] = [];
    }

    const lines = reelsFileContent.trim().split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const data = parts[1].split(',').map(elem => elem.trim()).filter(elem => elem !== '');

        if (this.reelsStrip.hasOwnProperty(key)) {
          this.reelsStrip[key] = data;
        }
        if (this.reelsStripBonus.hasOwnProperty(key)) {
          this.reelsStripBonus[key] = data;
        }
      }
    }
  }
}
