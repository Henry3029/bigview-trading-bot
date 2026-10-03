import { promises as fs } from 'fs';


// Add these interfaces to the very top of logger.ts
interface MarketIndicators {
  fastEma: string;
  slowEma: string;
  rsi: string;
}

export interface ExecutionRecord {
  mode: string;
  asset: string;
  action: string;
  executionPrice: number;
  status: string;
}

export function logAIDecision(reason: string, messageOrRecord: string | ExecutionRecord, executionRecord: ExecutionRecord) {
    const timestamp = new Date().toLocaleTimeString();
    
     // Handle both 2-argument and 3-argument calls seamlessly
  const details = typeof messageOrRecord === 'string' ? messageOrRecord : '';
  const record = typeof messageOrRecord === 'string' ? executionRecord : messageOrRecord;
  
    
    // 1. Format the block beautifully
    const logEntry = `
==================================================
[AI DECISION LOG] - ${timestamp}
--------------------------------------------------
• DECISION REASON: ${reason}
• EXECUTION REC : ${JSON.stringify(executionRecord)}
==================================================
`;

    // 2. Stream to console (This is saved on Render's dashboard)
    console.log(logEntry);

    // 3. Write to the file (This is your local proof)
    async function writeLog(logEntry: string) {
    try {
        await fs.appendFile('ai_decisions.log', logEntry + '\n');
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}
}