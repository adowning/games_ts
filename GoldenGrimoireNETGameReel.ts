// Assuming the content of reels.txt is available as a string.
// This would be loaded from 'NET/GoldenGrimoireNET/reels.txt' in a real scenario.
const reelsTxtContent = `
reelStrip1=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStrip2=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStrip3=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStrip4=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStrip5=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStrip6=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStripBonus1=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStripBonus2=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStripBonus3=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStripBonus4=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStripBonus5=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
reelStripBonus6=0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13,0,1,6,7,8,9,10,13
`; // Note: This is a placeholder, actual content might differ.

export class GoldenGrimoireNETGameReel {
  public reelsStrip: Record<string, string[]> = {
    reelStrip1: [],
    reelStrip2: [],
    reelStrip3: [],
    reelStrip4: [],
    reelStrip5: [],
    reelStrip6: [],
  };
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
