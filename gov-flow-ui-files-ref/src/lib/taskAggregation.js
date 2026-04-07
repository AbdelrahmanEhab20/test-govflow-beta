export const STAGE_TO_STATUS = {
  Planning: "not_started",
  Pipeline: "not_started",
  "In Progress": "in_progress",
  "In Review": "in_progress",
  Review: "in_progress",
  Completed: "completed",
  Approved: "completed",
  "On Hold": "on_hold",
};

function toStageMap(workflowStagesOrMap) {
  if (workflowStagesOrMap instanceof Map) return workflowStagesOrMap;
  return new Map((workflowStagesOrMap || []).map((stage) => [stage.id, stage]));
}

export function getNormalizedTaskStatus(task, workflowStagesOrMap) {
  const stageMap = toStageMap(workflowStagesOrMap);
  const stage = stageMap.get(task?.workflow_stage_id);
  if (stage?.name && STAGE_TO_STATUS[stage.name]) {
    return STAGE_TO_STATUS[stage.name];
  }
  return task?.status || "not_started";
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

