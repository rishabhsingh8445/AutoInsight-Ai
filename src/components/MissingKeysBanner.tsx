interface Props {
  missing: string[];
}

export function MissingKeysBanner({ missing }: Props) {
  if (missing.length === 0) return null;
  return (
    <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
      Missing API keys: {missing.join(", ")}. Add them in Settings.
    </div>
  );
}