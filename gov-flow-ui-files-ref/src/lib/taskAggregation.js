export const STAGE_TO_STATUS = {
  Planning: "not_started",
  Pipeline: "not_started",
  "In Progress": "in_progress",
  "In Review": "in_progress",
  Review: "in_progress",
  Completed: "completed",
  Approved: "completed",
  Done: "completed",
  "On Hold": "on_hold",
};

/** Preferred stage names when resolving a status → column. */
const STATUS_TO_STAGE_NAMES = {
  not_started: ["Pipeline", "Planning"],
  in_progress: ["In Progress"],
  completed: ["Completed", "Approved", "Done"],
  on_hold: ["On Hold"],
};

function toStageMap(workflowStagesOrMap) {
  if (workflowStagesOrMap instanceof Map) return workflowStagesOrMap;
  return new Map((workflowStagesOrMap || []).map((stage) => [stage.id, stage]));
}

function toStageList(workflowStagesOrMap) {
  if (workflowStagesOrMap instanceof Map) {
    return [...workflowStagesOrMap.values()];
  }
  return workflowStagesOrMap || [];
}

function findStageByNames(workflowStages, names = []) {
  const stages = toStageList(workflowStages);
  for (const name of names) {
    const match = stages.find((stage) => stage?.name === name);
    if (match) return match;
  }
  return null;
}

export function getNormalizedTaskStatus(task, workflowStagesOrMap) {
  const stageMap = toStageMap(workflowStagesOrMap);
  const stage = stageMap.get(task?.workflow_stage_id);
  if (stage?.name && STAGE_TO_STATUS[stage.name]) {
    return STAGE_TO_STATUS[stage.name];
  }
  return task?.status || "not_started";
}

/**
 * Resolve the workflow stage id that best matches a task status.
 * Returns null when no matching stage exists (caller should leave stage unchanged).
 */
export function getStageIdForStatus(status, workflowStagesOrMap) {
  const names = STATUS_TO_STAGE_NAMES[status];
  if (!names?.length) return null;
  const stage = findStageByNames(workflowStagesOrMap, names);
  return stage?.id || null;
}

/**
 * Build a patch that keeps `status` and `workflow_stage_id` in sync.
 * Accepts a partial update (status and/or stage and/or completion_percent).
 */
export function buildTaskStatusPatch(partial = {}, task = {}, workflowStagesOrMap) {
  const stages = toStageList(workflowStagesOrMap);
  const stageMap = toStageMap(stages);
  const patch = { ...partial };

  const hasStatus = Object.prototype.hasOwnProperty.call(partial, "status");
  const hasStage = Object.prototype.hasOwnProperty.call(partial, "workflow_stage_id");
  const hasPercent = Object.prototype.hasOwnProperty.call(partial, "completion_percent");

  // Percent-driven status: 100% → completed; leaving completed → in_progress
  if (hasPercent && !hasStatus) {
    const percent = Number(partial.completion_percent) || 0;
    if (percent === 100) {
      patch.status = "completed";
    } else if ((task?.status || patch.status) === "completed") {
      patch.status = "in_progress";
    }
  }

  // Stage-driven status
  if (hasStage && !hasStatus && !Object.prototype.hasOwnProperty.call(patch, "status")) {
    const nextStatus = getNormalizedTaskStatus(
      { ...task, workflow_stage_id: partial.workflow_stage_id },
      stageMap
    );
    if (nextStatus && nextStatus !== task?.status) {
      patch.status = nextStatus;
    }
  }

  // Status-driven stage (when stage not explicitly set)
  if (
    Object.prototype.hasOwnProperty.call(patch, "status") &&
    !hasStage &&
    stages.length > 0
  ) {
    const stageId = getStageIdForStatus(patch.status, stages);
    if (stageId) {
      patch.workflow_stage_id = stageId;
    }
  }

  // Completing always bumps percent to 100
  if (patch.status === "completed") {
    const currentPercent = hasPercent
      ? Number(partial.completion_percent) || 0
      : Number(task?.completion_percent) || 0;
    if (currentPercent < 100) {
      patch.completion_percent = 100;
    }
  }

  return patch;
}

export function getDashboardTaskSummary(tasks = [], workflowStagesOrMap) {
  const counts = {
    in_progress: 0,
    completed: 0,
    not_started: 0,
    overdue: 0,
  };
  const stageMap = toStageMap(workflowStagesOrMap);
  const now = new Date();

  for (const task of tasks) {
    const normalizedStatus = getNormalizedTaskStatus(task, stageMap);
    if (normalizedStatus === "in_progress") counts.in_progress += 1;
    if (normalizedStatus === "completed") counts.completed += 1;
    if (normalizedStatus === "not_started") counts.not_started += 1;

    // Overdue is a cross-cutting metric and may overlap with status buckets.
    if (task?.due_date && normalizedStatus !== "completed" && new Date(task.due_date) < now) {
      counts.overdue += 1;
    }
  }

  return counts;
}

export function getKanbanStageCounts(tasks = [], workflowStages = []) {
  const countsByStageId = {};
  for (const stage of workflowStages) {
    countsByStageId[stage.id] = 0;
  }

  let backlog = 0;
  for (const task of tasks) {
    if (task?.workflow_stage_id && countsByStageId[task.workflow_stage_id] !== undefined) {
      countsByStageId[task.workflow_stage_id] += 1;
    } else {
      backlog += 1;
    }
  }

  return { countsByStageId, backlog };
}
