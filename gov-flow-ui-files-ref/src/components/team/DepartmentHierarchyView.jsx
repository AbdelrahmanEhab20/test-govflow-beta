import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye, Users, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { updateDepartment } from "@/api/departmentsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function DepartmentHierarchyView({ 
  departments, 
  teamMembers = [], 
  onDepartmentSelect 
}) {
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const [draggedDept, setDraggedDept] = useState(null);
  const queryClient = useQueryClient();

  const updateParentMutation = useMutation({
    mutationFn: ({ deptId, newParentId }) =>
      updateDepartment(deptId, {
        parent_department_id: newParentId || null,
        parent_department_name: newParentId ?
          departments.find(d => d.id === newParentId)?.name : ''
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databaseDepartments'] });
      setDraggedDept(null);
    },
  });

  // Build hierarchy map
  const deptMap = new Map(departments.map(d => [d.id, { ...d, children: [] }]));
  const rootDepts = [];

  departments.forEach(dept => {
    if (dept.parent_department_id && deptMap.has(dept.parent_department_id)) {
      deptMap.get(dept.parent_department_id).children.push(dept.id);
    } else {
      rootDepts.push(dept.id);
    }
  });

  const toggleExpand = (deptId) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const getDeptMembers = (deptName) => {
    return teamMembers.filter(m => m.department_name === deptName).length;
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      setDraggedDept(null);
      return;
    }

    const draggedDeptId = draggableId;
    const draggedDeptObj = departments.find(d => d.id === draggedDeptId);
    
    if (!draggedDeptObj) {
      setDraggedDept(null);
      return;
    }

    // Check if dropping on same location
    if (source.droppableId === destination.droppableId) {
      setDraggedDept(null);
      return;
    }

    const newParentId = destination.droppableId === 'root' ? null : destination.droppableId;
    const newParentDept = newParentId ? departments.find(d => d.id === newParentId) : null;

    // Prevent circular hierarchy (dragging a parent into its own child)
    if (newParentId && isDescendant(draggedDeptId, newParentId)) {
      setDraggedDept(null);
      return;
    }

    updateParentMutation.mutate({ deptId: draggedDeptId, newParentId });
  };

  const isDescendant = (parentId, childId) => {
    const childDept = deptMap.get(childId);
    if (!childDept) return false;
    return childDept.children.some(cId => cId === parentId || isDescendant(parentId, cId));
  };

  const renderDepartmentNode = (deptId, level = 0, index = 0) => {
    const dept = deptMap.get(deptId);
    if (!dept) return null;

    const isExpanded = expandedDepts.has(deptId);
    const hasChildren = dept.children.length > 0;
    const memberCount = getDeptMembers(dept.name);
    const isDragging = draggedDept?.id === deptId;

    return (
      <Draggable key={deptId} draggableId={deptId} index={index}>
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="space-y-2"
          >
            <Card 
              className={`p-3 transition-all ${
                snapshot.isDragging 
                  ? 'bg-blue-50 dark:bg-blue-900/30 shadow-lg border-blue-300 dark:border-blue-700' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              style={{ marginLeft: `${level * 20}px`, ...provided.draggableProps.style }}
            >
              <div className="flex items-center gap-2">
                <div {...provided.dragHandleProps} className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <GripVertical className="w-4 h-4" />
                </div>

                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6"
                    onClick={() => toggleExpand(deptId)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}
                {!hasChildren && <div className="w-6" />}

                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {dept.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{dept.sector}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {memberCount}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDepartmentSelect?.(dept)}
                    className="p-0 h-6 w-6"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {isExpanded && hasChildren && (
              <Droppable droppableId={deptId} type="DEPARTMENT">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 py-1 px-2 rounded transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-green-50 dark:bg-green-900/10 border-l-2 border-green-500' 
                        : ''
                    }`}
                  >
                    {dept.children.map((childId, idx) => renderDepartmentNode(childId, level + 1, idx))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="root" type="DEPARTMENT">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 p-2 rounded transition-colors ${
              snapshot.isDraggingOver 
                ? 'bg-green-50 dark:bg-green-900/10 border-2 border-dashed border-green-500' 
                : ''
            }`}
          >
            {rootDepts.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No departments found</p>
            ) : (
              rootDepts.map((deptId, idx) => renderDepartmentNode(deptId, 0, idx))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}