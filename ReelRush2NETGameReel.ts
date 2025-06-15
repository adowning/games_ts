// Assuming the content of reels.txt for ReelRush2 is available as a string.
// This would be loaded from 'NET/ReelRush2NET/reels.txt' in a real scenario.
const reelsTxtContent = `
reelStrip1=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,WILD,SCATTER
reelStrip2=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,WILD,SCATTER
reelStrip3=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,WILD,SCATTER
reelStrip4=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,WILD,SCATTER
reelStrip5=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,WILD,SCATTER
# ReelRush2 might have distinct bonus/feature reel strips.
reelStripBonus1=WILD,WILD,3,4,5,6,7,8,9,10,11,12,13,14,15,SCATTER
# ... potentially more bonus strips for different features or free spin levels
`; // Placeholder content. Actual ReelRush2 reels.txt would be specific.

export class ReelRush2NETGameReel {
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
