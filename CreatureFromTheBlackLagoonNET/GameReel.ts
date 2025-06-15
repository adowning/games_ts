import { reelStripsData } from './reels.data';

export class GameReel {
  public reelsStrip: { [key: string]: string[] } = {
    reelStrip1: [],
    reelStrip2: [],
    reelStrip3: [],
    reelStrip4: [],
    reelStrip5: [],
    reelStrip6: [], // Typically empty for 5-reel games but defined in PHP
  };
  public reelsStripBonus: { [key: string]: string[] } = {
    reelStripBonus1: [],
    reelStripBonus2: [],
    reelStripBonus3: [],
    reelStripBonus4: [],
    reelStripBonus5: [],
    reelStripBonus6: [], // Typically empty
  };

  constructor() {
    for (const key in reelStripsData) {
      if (reelStripsData.hasOwnProperty(key)) {
        if (key.startsWith('reelStripBonus')) {
          // Check if the key exists in reelsStripBonus before assigning
          if (this.reelsStripBonus.hasOwnProperty(key)) {
            this.reelsStripBonus[key] = reelStripsData[key];
          }
        } else if (key.startsWith('reelStrip')) {
          // Check if the key exists in reelsStrip before assigning
          if (this.reelsStrip.hasOwnProperty(key)) {
            this.reelsStrip[key] = reelStripsData[key];
          }
        }
      }
    }
  }
}
