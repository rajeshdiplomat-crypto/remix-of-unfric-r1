{
  /* Conviction Level */
}
<div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
  <div className="flex justify-between items-center">
    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">How much do you believe this?</Label>
    <span className="text-3xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
      {draft.conviction}/10
    </span>
  </div>
  <Slider
    value={[draft.conviction]}
    onValueChange={(v) => saveDraft({ conviction: v[0] })}
    min={1}
    max={10}
    step={1}
    className="py-2"
  />
  <div className="flex justify-between text-xs text-slate-500">
    <span>1 — Warming up</span>
    <span>10 — Already living it</span>
  </div>
</div>;
