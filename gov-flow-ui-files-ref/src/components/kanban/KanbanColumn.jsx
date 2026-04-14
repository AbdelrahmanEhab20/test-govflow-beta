import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KanbanTaskCard from './KanbanTaskCard';

export default function KanbanColumn({ stage, tasks, users = [], provided, snapshot, getUserName, canDragTask, currentUser }) {
  const getStageColor = (color) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card
      className={`min-h-96 rounded-lg border-2 ${getStageColor(stage.color)} flex flex-col`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-current border-opacity-20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {stage.name}
          </h2>
          <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700">
            {tasks.length}
          </Badge>
        </div>
        {stage.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {stage.description}
          </p>
        )}
      </div>

      {/* Droppable Area */}
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`flex-1 p-3 overflow-y-auto transition-colors ${
          snapshot.isDraggingOver
            ? 'bg-slate-200 dark:bg-slate-800'
            : ''
        }`}
      >
        <div className="space-y-3">
          {tasks.length > 0 ? (
           tasks.map((task, index) => {
             const isDraggable = canDragTask && canDragTask(task);
             return (
               <Draggable
                 key={task.id}
                 draggableId={task.id}
                 index={index}
                 isDragDisabled={!isDraggable}
               >
                 {(provided, snapshot) => (
                   <div
                     ref={provided.innerRef}
                     {...provided.draggableProps}
                     {...provided.dragHandleProps}
                     className={!isDraggable ? 'opacity-60 cursor-not-allowed' : ''}
                   >
                     <KanbanTaskCard
                       task={task}
                       users={users}
                       getUserName={getUserName}
                       isDragging={snapshot.isDragging}
                       isDraggable={isDraggable}
                       currentUser={currentUser}
                     />
                   </div>
                 )}
               </Draggable>
             );
           })
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              No tasks
            </div>
          )}
        </div>
        {provided.placeholder}
      </div>
    </Card>
  );
}