import * as fs from 'fs';
import * as path from 'path';

// This helper function needs to be defined or imported from a shared utility module.
// It should return the base path of your application.
function getBasePath(): string {
    // Example: using process.cwd() and assuming a specific project structure.
    // Adjust this path to correctly locate your 'app/Games' directory.
    return path.join(process.cwd()); 
}

export class GameReel {
    public reelsStrip: { [key: string]: string[] } = {
        reelStrip1: [],
        reelStrip2: [],
        reelStrip3: [],
        reelStrip4: [],
        reelStrip5: [],
        reelStrip6: [], // Included for consistency, though Narcos is likely 5-reel
    };

    // reelsStripBonus will remain empty as per the provided NarcosNET/GameReel.php logic
    public reelsStripBonus: { [key: string]: string[] } = {
        reelStripBonus1: [],
        reelStripBonus2: [],
        reelStripBonus3: [],
        reelStripBonus4: [],
        reelStripBonus5: [],
        reelStripBonus6: [],
    };

    constructor() {
        const reelFilePath = path.join(getBasePath(), 'app', 'Games', 'NarcosNET', 'reels.txt');
        try {
            const fileContent = fs.readFileSync(reelFilePath, 'utf-8');
            const lines = fileContent.split('\n');

            lines.forEach(line => {
                if (!line.trim()) return;
                const [key, valueStr] = line.split('=');
                const reelKey = key.trim();

                if (this.reelsStrip.hasOwnProperty(reelKey) && valueStr) {
                    this.reelsStrip[reelKey] = valueStr.split(',').map(s => s.trim()).filter(s => s !== '');
                }
                // The provided NarcosNET/GameReel.php does not parse reelsStripBonus.
            });
        } catch (error) {
            console.error(`Error reading or parsing reel file for NarcosNET: ${reelFilePath}`, error);
            // Consider throwing an error or using default/empty strips
        }
    }
}