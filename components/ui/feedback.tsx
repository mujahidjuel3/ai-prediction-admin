export function Feedback({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      {message}
    </p>
  );
}
