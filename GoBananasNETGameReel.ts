// Assuming the content of reels.txt is available as a string.
// In a real scenario, this would be loaded from the file.
const reelsTxtContent = `
reelStrip1=1,2,3,4,5,21,6,7,8,9,10,22,11,12,13,14,15,23,16,17,18,19,20,24,1,2,3,25
reelStrip2=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25
reelStrip3=5,4,3,2,1,10,9,8,7,6,15,14,13,12,11,20,19,18,17,16,25,24,23,22,21
reelStrip4=1,3,5,2,4,6,8,10,7,9,11,13,15,12,14,16,18,20,17,19,21,23,25,22,24
reelStrip5=2,1,4,3,6,5,8,7,10,9,12,11,14,13,16,15,18,17,20,19,22,21,24,23,25
reelStrip6=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25 // Example, may not exist in actual file
reelStripBonus1=1,2,3,4,5,21,6,7,8,9,10,22,11,12,13,14,15,23,16,17,18,19,20,24,1,2,3,25
reelStripBonus2=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25
reelStripBonus3=5,4,3,2,1,10,9,8,7,6,15,14,13,12,11,20,19,18,17,16,25,24,23,22,21
reelStripBonus4=1,3,5,2,4,6,8,10,7,9,11,13,15,12,14,16,18,20,17,19,21,23,25,22,24
reelStripBonus5=2,1,4,3,6,5,8,7,10,9,12,11,14,13,16,15,18,17,20,19,22,21,24,23,25
reelStripBonus6=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25 // Example
`;

export class GoBananasNETGameReel {
  public reelsStrip: Record<string, string[]> = {
    reelStrip1: [],
    reelStrip2: [],
    reelStrip3: [],
    reelStrip4: [],
    reelStrip5: [],
    reelStrip6: [], // Assuming up to 6 reel strips as in PHP
  };
  public reelsStripBonus: Record<string, string[]> = {
    reelStripBonus1: [],
    reelStripBonus2: [],
    reelStripBonus3: [],
    reelStripBonus4: [],
    reelStripBonus5: [],
    reelStripBonus6: [], // Assuming up to 6 bonus reel strips
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

// Example usage (for testing purposes):
// const gameReel = new GoBananasNETGameReel();
// console.log(gameReel.reelsStrip);
// console.log(gameReel.reelsStripBonus);
