import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye, Users, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { moveDepartmentInHierarchy } from "@/api/departmentsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

function compareDepartmentIds(deptMap, aId, bId) {
  const a = deptMap.get(aId);
  const b = deptMap.get(bId);
  const orderA = a?.sort_order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b?.sort_order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return String(a?.name || '').localeCompare(String(b?.name || ''));
}

export default function DepartmentHierarchyView({
  departments,
  teamMembers = [],
  onDepartmentSelect,
}) {
  const [expandedDepts, setExpandedDepts] = useState(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const moveMutation = useMutation({
    mutationFn: ({ departmentId, parentDepartmentId, sortIndex }) =>
      moveDepartmentInHierarchy(departmentId, parentDepartmentId, sortIndex),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      if (variables.parentDepartmentId) {
        setExpandedDepts((prev) => new Set([...prev, variables.parentDepartmentId]));
      }
      toast({
        title: 'Hierarchy updated',
        description: 'Department order and structure were saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not update hierarchy',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const { deptMap, rootDepts } = useMemo(() => {
    const map = new Map(departments.map((dept) => [dept.id, { ...dept, children: [] }]));
    const roots = [];

    departments.forEach((dept) => {
      if (dept.parent_department_id && map.has(dept.parent_department_id)) {
        map.get(dept.parent_department_id).children.push(dept.id);
      } else {
        roots.push(dept.id);
      }
    });

    map.forEach((dept) => {
      dept.children.sort((aId, bId) => compareDepartmentIds(map, aId, bId));
    });
    roots.sort((aId, bId) => compareDepartmentIds(map, aId, bId));

    return { deptMap: map, rootDepts: roots };
  }, [departments]);

  const toggleExpand = (deptId) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const getDeptMembers = (dept) =>
    teamMembers.filter(
      (member) =>
        (dept.id && member.department_id === dept.id) ||
        (dept.name && member.department_name === dept.name),
    ).length;

  const resolveParentId = (droppableId) => {
    if (droppableId === 'root') return null;
    if (droppableId.startsWith('nest-')) {
      return droppableId.replace('nest-', '');
    }
    return null;
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    moveMutation.mutate({
      departmentId: draggableId,
      parentDepartmentId: resolveParentId(destination.droppableId),
      sortIndex: destination.index,
    });
  };

  const renderDepartmentCard = (dept, dragHandleProps) => {
    const isExpanded = expandedDepts.has(dept.id);
    const hasChildren = dept.children.length > 0;
    const memberCount = getDeptMembers(dept);

    return (
      <Card className="p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-700">
        <div className="flex items-center gap-2">
          <div
            {...dragHandleProps}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={() => toggleExpand(dept.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="w-4" />
            )}
          </Button>

          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{dept.name}</h4>
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
    );
  };

  const renderChildrenList = (parentId, level) => {
    const parent = deptMap.get(parentId);
    if (!parent || !expandedDepts.has(parentId)) return null;

    return parent.children.map((childId, idx) => renderDepartmentNode(childId, level + 1, idx));
  };

  const renderDepartmentNode = (deptId, level = 0, index = 0) => {
    const dept = deptMap.get(deptId);
    if (!dept) return null;

    return (
      <Draggable key={deptId} draggableId={deptId} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`space-y-1 ${snapshot.isDragging ? 'opacity-90' : ''}`}
            style={{ marginLeft: `${level * 20}px`, ...provided.draggableProps.style }}
          >
            {renderDepartmentCard(dept, provided.dragHandleProps)}
            <Droppable droppableId={`nest-${deptId}`} type="DEPARTMENT">
              {(dropProvided, dropSnapshot) => (
                <div
                  ref={dropProvided.innerRef}
                  {...dropProvided.droppableProps}
                  className={`mt-2 min-h-[8px] rounded transition-colors ${
                    dropSnapshot.isDraggingOver
                      ? 'bg-green-50 dark:bg-green-900/10 border border-dashed border-green-500'
                      : ''
                  }`}
                  style={{ marginLeft: `${20}px` }}
                >
                  {renderChildrenList(deptId, level + 1)}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>
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
