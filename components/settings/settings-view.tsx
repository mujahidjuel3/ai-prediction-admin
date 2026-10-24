"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Feedback } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import {
  updateNotificationPreferences,
  updateProfile,
  updateSystemPreferences,
  updateThresholds,
  useAdminState,
} from "@/lib/store";
import type { FieldErrors } from "@/types/common";
import type {
  AcademicThresholds,
  AdminProfile,
  NotificationPreferences,
  SystemPreferences,
} from "@/types/settings";
import { validateProfile, validateSystem, validateThresholds } from "@/lib/validation";
import { useState, type FormEvent } from "react";

const SAVED = "Saved in this browser session. Nothing was stored on a server.";

export function SettingsView() {
  const state = useAdminState();
  const [profileMessage, setProfileMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [thresholdMessage, setThresholdMessage] = useState("");
  const [systemMessage, setSystemMessage] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Demonstration preferences for the signed-in administrator profile. They reset when the page is refreshed."
      />
      <ProfileForm initial={state.settings.profile} message={profileMessage} onMessage={setProfileMessage} />
      <NotificationForm initial={state.settings.notifications} message={noticeMessage} onMessage={setNoticeMessage} />
      <ThresholdForm initial={state.settings.thresholds} message={thresholdMessage} onMessage={setThresholdMessage} />
      <SystemForm initial={state.settings.system} message={systemMessage} onMessage={setSystemMessage} />
    </div>
  );
}

function ProfileForm({
  initial,
  message,
  onMessage,
}: {
  initial: AdminProfile;
  message: string;
  onMessage: (message: string) => void;
}) {
  const state = useAdminState();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateProfile(values, state);
    setErrors(result.errors);
    if (!result.value) return;
    updateProfile(result.value);
    onMessage(SAVED);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrator profile</CardTitle>
        <CardDescription>Shown in the header and sidebar for this session.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Feedback message={message} />
          <div className="sm:col-span-2" />
          <Input id="profile-name" label="Name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
          <Input id="profile-email" label="Email" type="email" value={values.email} error={errors.email} onChange={(event) => setValues({ ...values, email: event.target.value })} />
          <Input id="profile-title" label="Title" value={values.title} error={errors.title} onChange={(event) => setValues({ ...values, title: event.target.value })} />
          <Input id="profile-office" label="Office" value={values.office} error={errors.office} onChange={(event) => setValues({ ...values, office: event.target.value })} />
          <div className="sm:col-span-2"><Button type="submit">Save profile</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationForm({
  initial,
  message,
  onMessage,
}: {
  initial: NotificationPreferences;
  message: string;
  onMessage: (message: string) => void;
}) {
  const [values, setValues] = useState(initial);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateNotificationPreferences(values);
    onMessage("Preferences saved in this session. They do not send email or push notifications.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>These toggles are stored only for the demonstration session.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <Feedback message={message} />
          <Checkbox id="pref-high" label="Include high-severity items in the notification list" checked={values.highRiskAlerts} onChange={(event) => setValues({ ...values, highRiskAlerts: event.target.checked })} />
          <Checkbox id="pref-attendance" label="Include attendance alerts in the notification list" checked={values.attendanceAlerts} onChange={(event) => setValues({ ...values, attendanceAlerts: event.target.checked })} />
          <Checkbox id="pref-weekly" label="Keep a weekly summary preference for a future backend" checked={values.weeklySummary} onChange={(event) => setValues({ ...values, weeklySummary: event.target.checked })} />
          <Button type="submit">Save preferences</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ThresholdForm({
  initial,
  message,
  onMessage,
}: {
  initial: AcademicThresholds;
  message: string;
  onMessage: (message: string) => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  function setNumber(key: keyof AcademicThresholds, raw: string) {
    setValues((current) => ({ ...current, [key]: Number(raw) }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateThresholds(values);
    setErrors(result.errors);
    if (!result.value) return;
    updateThresholds(result.value);
    onMessage("Thresholds saved in this session. Student risk labels were recalculated from these demonstration values. No model was called.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic thresholds</CardTitle>
        <CardDescription>Demo configuration. Risk labels in this session use these cut-offs until the page is refreshed.</CardDescription>
      </CardHeader>
      <CardContent>
        <DemoNotice>These values are not institution policy and are not saved to a server.</DemoNotice>
        <form onSubmit={onSubmit} noValidate className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Feedback message={message} /></div>
          <Input id="high-gpa" label="High-risk GPA below" inputMode="decimal" value={String(values.highRiskGpa)} error={errors.highRiskGpa} onChange={(event) => setNumber("highRiskGpa", event.target.value)} />
          <Input id="medium-gpa" label="Medium-risk GPA below" inputMode="decimal" value={String(values.mediumRiskGpa)} error={errors.mediumRiskGpa} onChange={(event) => setNumber("mediumRiskGpa", event.target.value)} />
          <Input id="high-attendance" label="High-risk attendance below (%)" inputMode="decimal" value={String(values.highRiskAttendance)} error={errors.highRiskAttendance} onChange={(event) => setNumber("highRiskAttendance", event.target.value)} />
          <Input id="medium-attendance" label="Medium-risk attendance below (%)" inputMode="decimal" value={String(values.mediumRiskAttendance)} error={errors.mediumRiskAttendance} onChange={(event) => setNumber("mediumRiskAttendance", event.target.value)} />
          <Input id="minimum-gpa" label="Report minimum GPA" inputMode="decimal" hint="Used as a reference value. Risk labels use the cut-offs above." value={String(values.minimumGpa)} error={errors.minimumGpa} onChange={(event) => setNumber("minimumGpa", event.target.value)} />
          <Input id="minimum-attendance" label="Report minimum attendance (%)" inputMode="decimal" hint="The attendance report compares students with this value." value={String(values.minimumAttendance)} error={errors.minimumAttendance} onChange={(event) => setNumber("minimumAttendance", event.target.value)} />
          <div className="sm:col-span-2"><Button type="submit">Save thresholds</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

function SystemForm({
  initial,
  message,
  onMessage,
}: {
  initial: SystemPreferences;
  message: string;
  onMessage: (message: string) => void;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateSystem(values);
    setErrors(result.errors);
    if (!result.value) return;
    updateSystemPreferences(result.value);
    onMessage(SAVED);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System preferences</CardTitle>
        <CardDescription>Institution label, academic period, and the number of rows shown in lists.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Feedback message={message} /></div>
          <Input id="institution" label="Institution name" value={values.institutionName} error={errors.institutionName} onChange={(event) => setValues({ ...values, institutionName: event.target.value })} />
          <Input id="academic-year" label="Academic year" hint="Example: 2025-2026" value={values.academicYear} error={errors.academicYear} onChange={(event) => setValues({ ...values, academicYear: event.target.value })} />
          <Input id="current-semester" label="Current semester label" value={values.currentSemester} error={errors.currentSemester} onChange={(event) => setValues({ ...values, currentSemester: event.target.value })} />
          <Select id="page-size" label="Rows per page" value={String(values.pageSize)} error={errors.pageSize} onChange={(event) => setValues({ ...values, pageSize: Number(event.target.value) })} options={PAGE_SIZE_OPTIONS.map((size) => ({ label: String(size), value: String(size) }))} />
          <div className="sm:col-span-2"><Button type="submit">Save system preferences</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
