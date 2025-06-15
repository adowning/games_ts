// Assuming the content of reels.txt for Jumanji is available as a string.
// This would be loaded from 'NET/JumanjiNET/reels.txt' in a real scenario.
const reelsTxtContent = `
reelStrip1=0,1,3,4,5,6,7,8,9,10,11,12,13
reelStrip2=0,1,3,4,5,6,7,8,9,10,11,12,13
reelStrip3=0,1,3,4,5,6,7,8,9,10,11,12,13
reelStrip4=0,1,3,4,5,6,7,8,9,10,11,12,13
reelStrip5=0,1,3,4,5,6,7,8,9,10,11,12,13
# Jumanji might not use reelStrip6 or bonus strips in the same way,
# but the class structure supports them.
reelStripBonus1=1,3,5,7,9
`; // Placeholder content. Actual Jumanji reels.txt would be specific.

export class JumanjiNETGameReel {
  public reelsStrip: Record<string, string[]> = {
    reelStrip1: [], reelStrip2: [], reelStrip3: [],
    reelStrip4: [], reelStrip5: [], reelStrip6: [],
  };
  public reelsStripBonus: Record<string, string[]> = {
    reelStripBonus1: [], reelStripBonus2: [], reelStripBonus3: [],
    reelStripBonus4: [], reelStripBonus5: [], reelStripBonus6: [],
  };

  constructor(reelsFileContent: string = reelsTxtContent) {
    for (let i = 1; i <= 6; i++) { // Initialize all, though Jumanji uses 5.
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
