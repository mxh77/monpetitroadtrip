let currentRoadtripId = null;
let currentStepId = null;
let currentStepType = null;
let currentStageId = null;
let currentStopId = null;

export function setCurrentRoadtripId(id) {
    currentRoadtripId = id;
}

export function getCurrentRoadtripId() {
    return currentRoadtripId;
}

export function setCurrentStepId(id) {
    currentStepId = id;
}

export function getCurrentStepId() {
    return currentStepId;
}

export function setCurrentStepType(type) {
    currentStepType = type;
}

export function getCurrentStepType() {
    return currentStepType;
}

export function setCurrentStageId(id) {
    currentStageId = id;
}

export function getCurrentStageId() {
    return currentStageId;
}

export function setCurrentStopId(id) {
    currentStopId = id;
}

export function getCurrentStopId() {
    return currentStopId;
}