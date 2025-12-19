'use client';

import { useState, useOptimistic } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Workflow, WorkflowVersion } from '@/lib/types/workflow.types';

interface WorkflowWithRelations extends Workflow {
  versions: WorkflowVersion[];
}

interface WorkflowsListProps {
  workflows: WorkflowWithRelations[];
}

export function WorkflowsList({ workflows }: WorkflowsListProps) {
  const [optimisticWorkflows, addOptimisticWorkflow] = useOptimistic(workflows);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);

    addOptimisticWorkflow((state) => state.filter((w) => w.id !== id));

    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      addOptimisticWorkflow((state) => [...state, workflows.find((w) => w.id === id)!]);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {optimisticWorkflows.map((workflow) => {
          const isActive = workflow.versions.some((v) => v.isActive);

          return (
            <Card key={workflow.id} className="overflow-hidden">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <Link href={`/workflows/${workflow.id}`}>
                    <h3 className="font-semibold text-slate-900 hover:underline">
                      {workflow.name}
                    </h3>
                  </Link>
                  {workflow.description && (
                    <p className="mt-1 text-sm text-slate-600">{workflow.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {isActive ? 'Active' : 'Draft'}
                    </span>
                    <span className="text-xs text-slate-600">
                      {workflow.versions.length} version{workflow.versions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-slate-600">
                      Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link href={`/workflows/${workflow.id}`}>Edit</Link>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Workflow</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete &quot;{workflow.name}&quot;? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="secondary"
                          onClick={() => setDeletingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleDelete(workflow.id)}
                          disabled={deletingId === workflow.id}
                        >
                          {deletingId === workflow.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}
