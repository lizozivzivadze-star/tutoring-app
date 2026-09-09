"use client";

import { useEffect, useState, useCallback } from "react";
import { GroupRecord, StudentRecord } from "./types";
import GroupCard from "./group-card";
import AddGroupModal from "./add-group-modal";
import StudentFormModal from "./student-form-modal";
import ConfirmDialog from "@/components/confirm-dialog";

export default function GroupsTab() {
  const [groups, setGroups] = useState<GroupRecord[] | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dragGroupId, setDragGroupId] = useState<string | null>(null);

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

  const load = useCallback(async () => {
    const res = await fetch("/api/groups");
    const data = await res.json();
    setGroups(data.groups ?? []);
  }, []);

  useEffect(() => {
    load();
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
    const res = await fetch(`/api/groups/${groupId}`, {
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
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
  }

  function handleGroupDrop(targetId: string) {
    if (!groups || !dragGroupId || dragGroupId === targetId) return;
    const ids = groups.map((g) => g.id);
    const fromIndex = ids.indexOf(dragGroupId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragGroupId);

    // Optimistic reorder in the UI, per our AppContext pattern.
    const reordered = ids
      .map((id) => groups.find((g) => g.id === id)!)
      .filter(Boolean);
    setGroups(reordered);
    setDragGroupId(null);

    fetch("/api/groups/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
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

    await fetch("/api/students/reorder", {
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
    await fetch(`/api/students/${student.id}`, { method: "DELETE" });
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

      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          expanded={expandedIds.has(group.id)}
          onToggleExpand={() => toggleExpand(group.id)}
          draggable
          onDragStart={() => setDragGroupId(group.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleGroupDrop(group.id)}
          onRename={(name) => renameGroup(group.id, name)}
          onDelete={() => deleteGroup(group.id)}
          onAddStudent={() => setAddStudentGroupId(group.id)}
          onEditStudent={(student) => setEditingStudent(student)}
          onDeleteStudent={(student) => setDeletingStudent(student)}
          onReorderStudents={(ids) => reorderStudents(group.id, ids)}
        />
      ))}

      <button
        onClick={() => setAddGroupOpen(true)}
        className="mt-2 text-sm text-marker font-medium text-left hover:text-marker-dark"
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
              `/api/groups/${addStudentGroupId}/students`,
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
            const res = await fetch(`/api/students/${editingStudent.id}`, {
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
          message="დარწმუნებული ხარ, რომ გინდა ამ მოსწავლის წაშლა?"
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
