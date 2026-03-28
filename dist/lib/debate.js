import { debateRound } from "./ai.js";
const MAX_ROUNDS = 3;
export async function runDebate(feature, indexes, projectName, callbacks) {
    const rounds = [];
    const allConflicts = [];
    const allMessages = [];
    for (let roundNum = 1; roundNum <= MAX_ROUNDS; roundNum++) {
        callbacks.onRoundStart(roundNum);
        const roundMessages = [];
        let foundNewConflicts = false;
        for (const index of indexes) {
            const result = await debateRound(index.repo, index, feature, allMessages, roundNum);
            const conflicts = result.conflicts.map((c) => ({
                type: c.type,
                myRef: c.my_ref,
                theirRef: c.their_ref,
                description: c.description,
                severity: classifySeverity(c.type),
            }));
            // Filter out conflicts that are similar to already found ones
            const newConflicts = conflicts.filter((c) => !isSimilarToExisting(c, allConflicts));
            if (newConflicts.length > 0)
                foundNewConflicts = true;
            roundMessages.push({
                repo: index.repo,
                statement: result.statement,
                conflicts: newConflicts,
            });
            allMessages.push({
                repo: index.repo,
                statement: result.statement,
                conflicts: result.conflicts,
            });
            allConflicts.push(...newConflicts);
            callbacks.onMessage(index.repo, result.statement, newConflicts);
        }
        rounds.push({ roundNumber: roundNum, messages: roundMessages });
        callbacks.onRoundEnd(roundNum);
        // Stop early if no new conflicts found
        if (roundNum > 1 && !foundNewConflicts)
            break;
    }
    // Final dedup pass
    const uniqueConflicts = deduplicateConflicts(allConflicts);
    const result = {
        id: Date.now().toString(),
        project: projectName,
        feature,
        timestamp: new Date().toISOString(),
        rounds,
        conflicts: uniqueConflicts,
    };
    callbacks.onComplete(result);
    return result;
}
function classifySeverity(type) {
    const highSeverity = ["endpoint_mismatch", "auth_contract", "schema_mismatch"];
    const mediumSeverity = ["response_shape", "event_mismatch", "version_conflict"];
    if (highSeverity.includes(type))
        return "high";
    if (mediumSeverity.includes(type))
        return "medium";
    return "low";
}
function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}
function isSimilarToExisting(conflict, existing) {
    const normDesc = normalize(conflict.description);
    const normRefs = normalize(`${conflict.myRef} ${conflict.theirRef}`);
    for (const e of existing) {
        // Same type + same refs (in either direction)
        if (conflict.type === e.type) {
            const sameDirection = normalize(e.myRef) === normalize(conflict.myRef) &&
                normalize(e.theirRef) === normalize(conflict.theirRef);
            const reverseDirection = normalize(e.myRef) === normalize(conflict.theirRef) &&
                normalize(e.theirRef) === normalize(conflict.myRef);
            if (sameDirection || reverseDirection)
                return true;
        }
        // Same type + very similar description (>60% word overlap)
        if (conflict.type === e.type) {
            const existingWords = new Set(normalize(e.description).split(" "));
            const newWords = normDesc.split(" ");
            const overlap = newWords.filter((w) => existingWords.has(w)).length;
            if (newWords.length > 0 && overlap / newWords.length > 0.6)
                return true;
        }
    }
    return false;
}
function deduplicateConflicts(conflicts) {
    const unique = [];
    for (const c of conflicts) {
        if (!isSimilarToExisting(c, unique)) {
            unique.push(c);
        }
    }
    return unique;
}
//# sourceMappingURL=debate.js.map