"use client";

import { useCallback, useEffect, useState } from "react";
import { PITCH_STAGES } from "@/lib/pitch-stages";

const STORAGE_KEY = "bbdo-pitch-workflow-v1";

type Checked = Record<string, 1>;

function stageFromHash(): number {
  const match = /^#s(\d+)$/.exec(window.location.hash);
  const index = match ? Number(match[1]) - 1 : 0;
  return index >= 0 && index < PITCH_STAGES.length ? index : 0;
}

export function PitchChecklist() {
  const [checked, setChecked] = useState<Checked>({});
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setChecked(JSON.parse(stored) as Checked);
    } catch {
      /* ignore unreadable storage */
    }
    setCurrent(stageFromHash());

    const onHashChange = () => setCurrent(stageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const persist = useCallback((next: Checked) => {
    setChecked(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore unwritable storage */
    }
  }, []);

  const show = useCallback((index: number, focusTab: boolean) => {
    setCurrent(index);
    window.history.replaceState(null, "", `#s${index + 1}`);
    if (focusTab) document.getElementById(`tab-${index}`)?.focus({ preventScroll: true });
  }, []);

  const doneIn = (stageIndex: number) =>
    PITCH_STAGES[stageIndex].tasks.reduce(
      (count, _task, taskIndex) => count + (checked[`${stageIndex}:${taskIndex}`] ? 1 : 0),
      0,
    );

  const total = PITCH_STAGES.reduce((sum, stage) => sum + stage.tasks.length, 0);
  const complete = PITCH_STAGES.reduce((sum, _stage, index) => sum + doneIn(index), 0);
  const pct = total ? Math.round((complete / total) * 100) : 0;

  const stage = PITCH_STAGES[current];

  return (
    <>
      <div className="mt-6 flex items-center gap-4 border-y border-border py-4 max-[860px]:flex-wrap max-[860px]:gap-3">
        <div className="flex-1" />
        <div className="h-1.5 w-[clamp(90px,20vw,220px)] overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-[250ms] ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[13px] font-semibold [font-variant-numeric:tabular-nums]">{pct}%</span>
        <button
          type="button"
          onClick={() => persist({})}
          className="cursor-pointer rounded-md border border-border bg-transparent px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:outline-none"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
        <div
          role="tablist"
          aria-label="Pitch stages"
          className="flex flex-col gap-1 max-[860px]:sticky max-[860px]:top-[68px] max-[860px]:z-[5] max-[860px]:flex-row max-[860px]:gap-2 max-[860px]:overflow-x-auto max-[860px]:bg-background max-[860px]:py-2"
        >
          {PITCH_STAGES.map((item, index) => {
            const done = doneIn(index);
            const selected = index === current;
            const allDone = done === item.tasks.length;
            return (
              <button
                key={item.title}
                type="button"
                role="tab"
                id={`tab-${index}`}
                aria-controls="panel-view"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => show(index, true)}
                onKeyDown={(event) => {
                  let next: number | null = null;
                  if (event.key === "ArrowDown" || event.key === "ArrowRight")
                    next = (index + 1) % PITCH_STAGES.length;
                  if (event.key === "ArrowUp" || event.key === "ArrowLeft")
                    next = (index - 1 + PITCH_STAGES.length) % PITCH_STAGES.length;
                  if (event.key === "Home") next = 0;
                  if (event.key === "End") next = PITCH_STAGES.length - 1;
                  if (next !== null) {
                    event.preventDefault();
                    show(next, true);
                  }
                }}
                className={`grid w-full cursor-pointer grid-cols-[24px_1fr_auto] items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium leading-[1.15] focus-visible:outline-none max-[860px]:w-auto max-[860px]:flex-none max-[860px]:whitespace-nowrap ${
                  selected ? "bg-foreground text-background" : "bg-transparent text-foreground hover:bg-muted"
                }`}
              >
                <span className={`text-[12px] [font-variant-numeric:tabular-nums] ${selected ? "text-background/70" : "text-muted-foreground"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item.title}</span>
                <span className={`text-[12px] [font-variant-numeric:tabular-nums] ${selected ? "text-background" : allDone ? "text-primary" : "text-muted-foreground"}`}>
                  {done}/{item.tasks.length}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <div id="panel-view" role="tabpanel" aria-labelledby={`tab-${current}`}>
            <p className="mb-1.5 mt-0 text-[13px] font-medium text-muted-foreground">
              Stage {current + 1} of {PITCH_STAGES.length}
            </p>
            <h2 className="mb-5 mt-0 text-[24px] font-bold leading-tight tracking-tight">{stage.title}</h2>
            <ul className="m-0 max-w-[900px] list-none border-t border-border p-0">
              {stage.tasks.map((task, taskIndex) => {
                const key = `${current}:${taskIndex}`;
                const isChecked = Boolean(checked[key]);
                return (
                  <li key={task} className="border-b border-border">
                    <label className="grid cursor-pointer grid-cols-[20px_1fr] items-start gap-3 py-3 text-[15px] leading-[1.35] hover:bg-muted/40">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => {
                          const next = { ...checked };
                          if (event.target.checked) next[key] = 1;
                          else delete next[key];
                          persist(next);
                        }}
                        className="peer absolute h-0 w-0 opacity-0"
                      />
                      <span className="mt-[3px] grid h-5 w-5 place-items-center rounded-md border-2 border-primary transition-colors duration-150 after:h-1.5 after:w-[10px] after:-rotate-45 after:scale-0 after:border-b-2 after:border-l-2 after:border-white after:transition-transform after:duration-150 after:content-[''] peer-checked:bg-primary peer-checked:after:scale-100 peer-focus-visible:outline-none motion-reduce:transition-none motion-reduce:after:transition-none" />
                      <span className="peer-checked:text-muted-foreground peer-checked:line-through peer-checked:decoration-primary">
                        {task}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex gap-2.5">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => show(current - 1, false)}
                className="cursor-pointer rounded-lg border border-border bg-transparent px-4 py-2.5 text-[13px] font-medium text-foreground enabled:hover:border-foreground disabled:cursor-default disabled:opacity-35"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={current === PITCH_STAGES.length - 1}
                onClick={() => show(current + 1, false)}
                className="cursor-pointer rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-medium text-background enabled:hover:bg-primary disabled:cursor-default disabled:opacity-35"
              >
                Next stage
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
