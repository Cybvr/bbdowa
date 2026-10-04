"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { openingsCollection } from "@/lib/firebase/job-collections";
import { EditSheet, SelectField, TextField, TextareaField } from "@/components/detail-editor";
import type { Opening } from "@/lib/openings";

// Multi-line fields are stored as string[]; edit them one item per line.
const toLines = (items?: string[]) => (items ?? []).join("\n");
const fromLines = (value: string) =>
  value.split("\n").map((line) => line.trim()).filter(Boolean);

export function OpeningActions({ opening }: { opening: Opening }) {
  const router = useRouter();

  const [title, setTitle] = React.useState(opening.title ?? "");
  const [department, setDepartment] = React.useState(opening.department ?? "");
  const [location, setLocation] = React.useState(opening.location ?? "");
  const [workMode, setWorkMode] = React.useState<Opening["workMode"]>(opening.workMode ?? "Hybrid");
  const [status, setStatus] = React.useState<Opening["status"]>(opening.status ?? "open");
  const [schedule, setSchedule] = React.useState(opening.schedule ?? "");
  const [salary, setSalary] = React.useState(opening.salary ?? "");
  const [summary, setSummary] = React.useState(opening.summary ?? "");
  const [description, setDescription] = React.useState(opening.description ?? "");
  const [qualifications, setQualifications] = React.useState(toLines(opening.qualifications));
  const [responsibilities, setResponsibilities] = React.useState(toLines(opening.responsibilities));
  const [about, setAbout] = React.useState(toLines(opening.about));

  const save = async () => {
    await updateDoc(doc(firebaseDb, await openingsCollection(), opening.slug), {
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      workMode,
      status,
      schedule: schedule.trim() || null,
      salary: salary.trim() || null,
      summary: summary.trim() || null,
      description: description.trim() || null,
      qualifications: fromLines(qualifications),
      responsibilities: fromLines(responsibilities),
      about: fromLines(about),
      updatedAt: serverTimestamp(),
    });
    router.refresh();
  };

  const remove = async () => {
    await deleteDoc(doc(firebaseDb, await openingsCollection(), opening.slug));
    router.push("/dashboard/help?tab=careers");
  };

  return (
    <EditSheet
      title="Edit role"
      description={opening.title}
      onSave={save}
      onDelete={remove}
      deleteConfirm="Delete this role? This can’t be undone."
    >
      <TextField label="Title" value={title} onChange={setTitle} />
      <TextField label="Department" value={department} onChange={setDepartment} />
      <TextField label="Location" value={location} onChange={setLocation} />
      <SelectField
        label="Work mode"
        value={workMode}
        onChange={(value) => setWorkMode(value as Opening["workMode"])}
        options={[
          { value: "Hybrid", label: "Hybrid" },
          { value: "On-site", label: "On-site" },
          { value: "Remote", label: "Remote" },
        ]}
      />
      <SelectField
        label="Status"
        value={status}
        onChange={(value) => setStatus(value as Opening["status"])}
        options={[
          { value: "open", label: "Open" },
          { value: "closed", label: "Closed" },
        ]}
      />
      <TextField label="Schedule" value={schedule} onChange={setSchedule} />
      <TextField label="Salary" value={salary} onChange={setSalary} />
      <TextareaField label="Summary" value={summary} onChange={setSummary} />
      <TextareaField label="Description" value={description} onChange={setDescription} />
      <TextareaField label="Qualifications (one per line)" value={qualifications} onChange={setQualifications} rows={5} />
      <TextareaField label="Responsibilities (one per line)" value={responsibilities} onChange={setResponsibilities} rows={5} />
      <TextareaField label="About (one per line)" value={about} onChange={setAbout} rows={4} />
    </EditSheet>
  );
}
