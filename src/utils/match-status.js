import {Match_status} from '../validation/matches.js';

export const getMatchStatus = (startTime, endTime) => {
    const start = new Date(startTime).getTime() - 19800000; // -330 mins in ms
    const end = new Date(endTime).getTime() - 19800000;
    const now = Date.now();

    if (isNaN(start) || isNaN(end)) return null;

    return now < start ? Match_status.SCHEDULED 
         : now <= end  ? Match_status.LIVE 
         : Match_status.FINISHED;
};

export async function updateMatchStatus(match, updateStatus) {
    const nextStatus = getMatchStatus(match.startTime, match.endTime);
    if(nextStatus && nextStatus !== match.status) {
        await updateStatus(match.id, nextStatus);
        match.status = nextStatus;
    }
    return match.status;
}