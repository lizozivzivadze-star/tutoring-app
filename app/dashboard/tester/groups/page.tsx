"use client";

import { useEffect, useState, useCallback } from "react";
import { GroupRecord, StudentRecord } from "./types";
import GroupCard from "./group-card";
import AddGroupModal from "./add-group-modal";
import StudentFormModal from "./student-form-modal";
import ConfirmDialog from "@/components/confirm-dialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

export default function GroupsTab() {
  const [groups, setGroups] = useState<GroupRecord[] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addStudentGroupId, setAddStudentGroupId] = useState<string | null>(
    null
  );
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(
    null
  );
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(
    null
  );
  const [groupDeleteConfirmTemplate, setGroupDeleteConfirmTemplate] =
    useState<string | undefined>(undefined);
  const [studentDeleteConfirmText, setStudentDeleteConfirmText] = useState(
    "დარწმუნებული ხარ, რომ გინდა ამ მოსწავლის წაშლა?"
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/tester/groups");
    const data = await res.json();
    setGroups(data.groups ?? []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/settings/texts")
      .then((r) => r.json())
      .then((data) => {
        setGroupDeleteConfirmTemplate(data.groupDeleteConfirmText);
        if (data.studentDeleteConfirmText) {
          setStudentDeleteConfirmText(data.studentDeleteConfirmText);
        }
      })
      .catch(() => {});
  }, [load]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function renameGroup(groupId: string, name: string) {
    const res = await fetch(`/api/tester/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return data?.error ?? "ვერ განახლდა";
    }
    await load();
  }

  async function deleteGroup(groupId: string) {
    setGroups((prev) => prev?.filter((g) => g.id !== groupId) ?? prev);
    await fetch(`/api/tester/groups/${groupId}`, { method: "DELETE" });
  }

  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!groups || !over || active.id === over.id) return;

    const ids = groups.map((g) => g.id);
    const fromIndex = ids.indexOf(active.id as string);
    const toIndex = ids.indexOf(over.id as string);
    const newIds = arrayMove(ids, fromIndex, toIndex);

    const reordered = newIds
      .map((id) => groups.find((g) => g.id === id)!)
      .filter(Boolean);
    setGroups(reordered);

    fetch("/api/tester/groups/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: newIds }),
    });
  }

  async function reorderStudents(groupId: string, orderedIds: string[]) {
    setGroups(
      (prev) =>
        prev?.map((g) =>
          g.id !== groupId
            ? g
            : {
                ...g,
                students: orderedIds
                  .map((id) => g.students.find((s) => s.id === id)!)
                  .filter(Boolean),
              }
        ) ?? prev
    );

    await fetch("/api/tester/students/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, orderedIds }),
    });
  }

  async function deleteStudent(student: StudentRecord) {
    setGroups(
      (prev) =>
        prev?.map((g) =>
          g.id !== student.groupId
            ? g
            : { ...g, students: g.students.filter((s) => s.id !== student.id) }
        ) ?? prev
    );
    await fetch(`/api/tester/students/${student.id}`, { method: "DELETE" });
  }

  if (!groups) {
    return <p className="text-ink-soft text-sm text-center py-12">იტვირთება...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.length === 0 && (
        <p className="text-ink-soft text-sm text-center py-8">
          ჯერ არცერთი ჯგუფი არ გაქვთ დამატებული.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleGroupDragEnd}
      >
        <SortableContext
          items={groups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              expanded={expandedIds.has(group.id)}
              onToggleExpand={() => toggleExpand(group.id)}
              onRename={(name) => renameGroup(group.id, name)}
              onDelete={() => deleteGroup(group.id)}
              onAddStudent={() => setAddStudentGroupId(group.id)}
              onEditStudent={(student) => setEditingStudent(student)}
              onDeleteStudent={(student) => setDeletingStudent(student)}
              onReorderStudents={(ids) => reorderStudents(group.id, ids)}
              deleteConfirmTemplate={groupDeleteConfirmTemplate}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={() => setAddGroupOpen(true)}
        className="mt-2 text-[15px] text-marker font-medium text-left hover:text-marker-dark"
      >
        + ჯგუფის დამატება
      </button>

      {addGroupOpen && (
        <AddGroupModal
          onClose={() => setAddGroupOpen(false)}
          onCreated={() => {
            setAddGroupOpen(false);
            load();
          }}
        />
      )}

      {addStudentGroupId && (
        <StudentFormModal
          title="მოსწავლის დამატება"
          onClose={() => setAddStudentGroupId(null)}
          onSubmit={async (values) => {
            const res = await fetch(
              `/api/tester/groups/${addStudentGroupId}/students`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              }
            );
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              return data?.error ?? "ვერ დაემატა";
            }
            setAddStudentGroupId(null);
            setExpandedIds((prev) => new Set(prev).add(addStudentGroupId));
            load();
          }}
        />
      )}

      {editingStudent && (
        <StudentFormModal
          title="მოსწავლის რედაქტირება"
          initial={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSubmit={async (values) => {
            const res = await fetch(`/api/tester/students/${editingStudent.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              return data?.error ?? "ვერ განახლდა";
            }
            setEditingStudent(null);
            load();
          }}
        />
      )}

      {deletingStudent && (
        <ConfirmDialog
          message={studentDeleteConfirmText}
          onConfirm={() => {
            deleteStudent(deletingStudent);
            setDeletingStudent(null);
          }}
          onCancel={() => setDeletingStudent(null)}
        />
      )}
    </div>
  );
}