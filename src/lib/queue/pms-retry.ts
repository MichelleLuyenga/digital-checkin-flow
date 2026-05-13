type RetryJob = {
    id: string;
    reservationId: string;
    action: string; // e.g., 'identity-verified', 'preferences-updated'
    payload?: any;
    attempts: number;
    maxAttempts: number;
};

const jobs: Map<string, RetryJob> = new Map();
let isProcessing = false;

export function enqueuePMSRetry(reservationId: string, action: string, payload?: any) {
    const id = `${reservationId}:${action}:${Date.now()}`;
    jobs.set(id, { id, reservationId, action, payload, attempts: 0, maxAttempts: 3 });
    processQueue();
}

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;
    while (jobs.size > 0) {
        const entry = jobs.entries().next();
        if (entry.done) break;
        const [id, job] = entry.value;  // non-null assertion
        jobs.delete(id);
        try {
            // We'll call the appropriate adapter method based on action.
            // For this demo, we'll just log. In a real app, import the adapter and call.
            console.log(`[Queue] Processing retry for ${job.reservationId}: ${job.action}`);
            // Simulate success after some retries
            if (job.attempts < job.maxAttempts) {
                // Normally would call pmsAdapter.something()
            }
        } catch (error) {
            job.attempts++;
            if (job.attempts < job.maxAttempts) {
                // Re-queue for later
                setTimeout(() => {
                    jobs.set(id, job);
                    processQueue();
                }, 5000);
            } else {
                console.error(`[Queue] Job ${id} failed after ${job.maxAttempts} attempts`);
            }
        }
        // Small delay between jobs to avoid overwhelming PMS
        await new Promise((r) => setTimeout(r, 1000));
    }
    isProcessing = false;
}